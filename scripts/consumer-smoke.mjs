import {mkdtemp,mkdir,readFile,writeFile,rm,cp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {compileRegistry} from '../contracts/lib/compiler.js';
import {contract} from './lib/common.mjs';
const base=fileURLToPath(new URL('../',import.meta.url));
const lock=JSON.parse(await readFile(join(base,'consumer.lock.json'),'utf8'));
const candidate=process.env.NOSEY_PACKAGE;
if(!candidate&&(lock.status!=='released'||!lock.integrity))throw Error('No released consumer pin. Set NOSEY_PACKAGE to an exact compatible Nosey tarball.');
const root=await mkdtemp(join(tmpdir(),'registry-consumer-'));
try{
  const env={...process.env,XDG_CONFIG_HOME:join(root,'config'),XDG_DATA_HOME:join(root,'data'),XDG_CACHE_HOME:join(root,'cache'),
    DISABLE_TELEMETRY:'1',DO_NOT_TRACK:'1',CI:'1'};
  const run=(bin,args,project=root)=>execFileSync(bin,args,{cwd:project,env,encoding:'utf8',stdio:['ignore','pipe','pipe']});
  let pkg;
  if(candidate){const bytes=await readFile(resolve(candidate));pkg=join(root,'candidate.tgz');await writeFile(pkg,bytes);console.log('Candidate SHA-256: '+createHash('sha256').update(bytes).digest('hex'));}
  else{
    const packed=JSON.parse(run('npm',['pack',lock.package+'@'+lock.version,'--json','--pack-destination',root]));
    if(packed[0].integrity!==lock.integrity)throw Error('Consumer package integrity differs from release pin');pkg=join(root,packed[0].filename);
  }
  await writeFile(join(root,'package.json'),'{"private":true}');run('npm',['install','--ignore-scripts','--no-package-lock',pkg]);
  const cli=join(root,'node_modules/.bin/nosey'),fixture=join(root,'registry');await mkdir(fixture);
  for(const name of ['registry.config.json','data','skills'])await cp(join(base,'tests/consumer',name),join(fixture,name),{recursive:true});
  await writeFile(join(fixture,'registry.json'),(await compileRegistry(fixture,await contract())).text);
  const project=join(root,'project');await mkdir(project);await writeFile(join(project,'widget.config.json'),'{}');
  run(cli,['registry','add',fixture,'--offline','--acknowledge-source','--json'],project);
  const scan=JSON.parse(run(cli,['scan',project,'--offline','--json']));
  // Scan JSON is versioned; accept only the production result envelope.
  const result=scan.result??scan.scan??scan;
  if(!result.recommendations.some(r=>r.skill_id==='example/team-skills/skills/example-review'&&r.eligible&&!r.assessment))throw Error('Consumer did not recommend the generated custom skill');
  const plan=JSON.parse(run(cli,['plan',project,'--offline','--agents','codex','--json']));
  if(!plan.plan.groups.some(g=>g.sourceRef?.kind==='bundled'))throw Error('Consumer did not plan exact bundled content');
  // Optional pinned installer probe exercises real execution into a disposable project.
  if(process.env.NOSEY_SKILLS_BIN){
    run(cli,['install',project,'--offline','--exec','--yes','--agents','codex','--json']);
    if(await readFile(join(project,'.agents/skills/example-review/references/checklist.md'),'utf8')!==await readFile(join(fixture,'skills/example-review/references/checklist.md'),'utf8'))throw Error('Installed supporting asset mismatch');
  }
  console.log('Packed consumer '+run(cli,['--version']).trim()+' passed; producer contract '+JSON.parse(await readFile(join(base,'contracts.lock.json'),'utf8')).content_sha256);
}finally{await rm(root,{recursive:true,force:true});}
