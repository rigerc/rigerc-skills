import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,writeFile,rm,mkdir} from 'node:fs/promises';
import {execFileSync,spawnSync} from 'node:child_process';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {parseDocument} from 'yaml';
const root=fileURLToPath(new URL('../',import.meta.url));
test('workflow YAML and shell blocks parse, generation preserves selected branch and allowlist',async()=>{
  for(const name of ['validate','generate','publish']){
    const doc=parseDocument(await readFile(join(root,'.github/workflows/'+name+'.yml'),'utf8'));assert.deepEqual(doc.errors,[]);
    const workflow=doc.toJS();assert.ok(workflow.on);
    for(const job of Object.values(workflow.jobs))for(const step of job.steps??[])if(step.run){
      const result=spawnSync('bash',['-n'],{input:step.run,encoding:'utf8'});assert.equal(result.status,0,result.stderr);
    }
    if(name==='generate'){
      assert.equal(workflow.jobs.generate.steps[0].with.ref,'${{ github.ref_name }}');
      const pr=workflow.jobs.generate.steps.find(s=>s.uses?.startsWith('peter-evans/'));
      assert.equal(pr.with.base,'${{ github.ref_name }}');assert.equal(pr.with['add-paths'],'registry.json\nREADME.md\n');
      assert.ok(workflow.jobs.generate.steps.some(s=>s.run==='npm run test:consumer'));
    }
    if(name==='publish'){
      assert.equal(workflow.concurrency['cancel-in-progress'],false);
      assert.ok(workflow.jobs.publish.steps.some(s=>s.run==='node scripts/verify-candidate.mjs'));
      assert.equal(JSON.stringify(workflow).includes('push --force'),false);
    }
  }
});
test('publication run gate accepts only successful current same-repository default-branch validation',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'registry-workflow-'));
  try{
    const bin=join(dir,'gh');
    await writeFile(bin,'#!/usr/bin/env node\nconst run=JSON.parse(process.env.FIXTURE_RUN);console.log(JSON.stringify(process.argv.at(-1).includes("/branches/")?{commit:{sha:process.env.FIXTURE_SHA}}:run));\n',{mode:0o755});
    const run={repository:{full_name:'acme/skills'},head_repository:{full_name:'acme/skills'},status:'completed',conclusion:'success',
      event:'push',head_branch:'trunk',head_sha:'a'.repeat(40),path:'.github/workflows/validate.yml'};
    const env={...process.env,PATH:dir+':'+process.env.PATH,GH_REPO:'acme/skills',VALIDATION_RUN:'123',DEFAULT_BRANCH:'trunk',FIXTURE_SHA:'a'.repeat(40),GITHUB_OUTPUT:join(dir,'output')};
    execFileSync(process.execPath,[join(root,'scripts/validated-run.mjs')],{env:{...env,FIXTURE_RUN:JSON.stringify(run)}});
    assert.equal(await readFile(env.GITHUB_OUTPUT,'utf8'),'sha='+run.head_sha+'\n');
    for(const change of [{conclusion:'failure'},{head_sha:'b'.repeat(40)},{event:'pull_request'},{head_branch:'feature'},
      {head_repository:{full_name:'other/skills'}},{path:'.github/workflows/other.yml'}]){
      assert.throws(()=>execFileSync(process.execPath,[join(root,'scripts/validated-run.mjs')],{env:{...env,FIXTURE_RUN:JSON.stringify({...run,...change})},stdio:'pipe'}));
    }
  }finally{await rm(dir,{recursive:true,force:true});}
});
test('generation allowlist rejects authored changes and accepts only generated files',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'registry-generation-'));
  try{
    const git=(...args)=>execFileSync('git',args,{cwd:dir,stdio:'pipe'});
    git('init','-q');await mkdir(join(dir,'data'));await writeFile(join(dir,'registry.json'),'old\n');await writeFile(join(dir,'data/mappings.json'),'old\n');
    git('add','.');git('-c','user.name=Fixture','-c','user.email=fixture@example.test','commit','-qm','fixture');
    await writeFile(join(dir,'registry.json'),'new\n');execFileSync(process.execPath,[join(root,'scripts/generated-files.mjs')],{cwd:dir});
    await writeFile(join(dir,'data/mappings.json'),'changed\n');
    assert.throws(()=>execFileSync(process.execPath,[join(root,'scripts/generated-files.mjs')],{cwd:dir,stdio:'pipe'}));
  }finally{await rm(dir,{recursive:true,force:true});}
});
