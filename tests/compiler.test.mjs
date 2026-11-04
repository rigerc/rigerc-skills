import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,cp,rm,readFile,writeFile,rename,symlink,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {compileRegistry,validateLocal} from '../contracts/lib/compiler.js';
import {configureRegistry} from '../contracts/lib/configure.js';
import {compileManifest,stagePublication,verifyDistribution} from '../contracts/lib/publication.js';
import {decodeCustom,validateRegistry} from '../contracts/lib/validate.js';
import {CUSTOM_RUNTIME_VERSION} from '../contracts/lib/contracts.js';
import {contract} from '../scripts/lib/common.mjs';
const base=fileURLToPath(new URL('./consumer/',import.meta.url));
async function fixture(fn){const root=await mkdtemp(join(tmpdir(),'registry-producer-'));try{
  for(const name of ['skills','data','registry.config.json','registry.json'])await cp(join(base,name),join(root,name),{recursive:true});
  return await fn(root,await contract());
}finally{await rm(root,{recursive:true,force:true});}}
test('deterministic index and manifest bytes have no assessments',()=>fixture(async(root,inventory)=>{
  const one=await compileRegistry(root,inventory),two=await compileRegistry(root,inventory);assert.equal(one.text,two.text);
  const a=compileManifest(one.registry,one.config,'a'.repeat(40)),b=compileManifest(two.registry,two.config,'a'.repeat(40));
  assert.deepEqual(a.bytes,b.bytes);assert.equal(/"(?:quality|evaluation|score)"/.test(a.bytes.toString()),false);
  await decodeCustom(a.bytes,inventory,CUSTOM_RUNTIME_VERSION);await assert.rejects(decodeCustom(a.bytes,inventory,'0.5.0'),/requires Nosey/);
}));
test('configuration is idempotent, remaps references and accepts empty registries',()=>fixture(async(root,inventory)=>{
  await configureRegistry(root,'acme/reviews',inventory);const a=await compileRegistry(root,inventory);
  assert.equal(a.registry.skills[0].id,'acme/reviews/skills/example-review');
  assert.equal((await configureRegistry(root,'acme/reviews',inventory)).changed,false);
  assert.equal((await compileRegistry(root,inventory)).text,a.text);
  await rm(join(root,'skills'),{recursive:true});await writeFile(join(root,'data/mappings.json'),' {"schema_version":1}');
  const empty=await compileRegistry(root,inventory);assert.equal(empty.registry.skills.length,0);assert.deepEqual(empty.registry.always_recommend,[]);
}));
test('asset changes and referenced removal cannot retain stale indexes',()=>fixture(async(root,inventory)=>{
  await validateLocal(root,inventory);await writeFile(join(root,'skills/example-review/references/checklist.md'),'changed');
  await assert.rejects(validateLocal(root,inventory),/stale/);
  await rm(join(root,'skills/example-review'),{recursive:true});await assert.rejects(compileRegistry(root,inventory),/unknown skill/);
}));
test('invalid YAML, empty bodies, symlinks, and dangling mappings fail with locations',()=>fixture(async(root,inventory)=>{
  const file=join(root,'skills/example-review/SKILL.md'),original=await readFile(file);
  for(const text of ['---\nname: bad\nname: duplicate\ndescription: x\n---\nbody','---\nname: yes\ndescription: x\n---\n','---\nname: [no]\ndescription: x\n---\nbody']){
    await writeFile(file,text);await assert.rejects(compileRegistry(root,inventory),/SKILL.md/);
  }
  await writeFile(file,original);await symlink(file,join(root,'skills/example-review/link.md'));
  await assert.rejects(compileRegistry(root,inventory),/symlink/);
}));
test('nested SKILL.md within a discovered skill is an asset',()=>fixture(async(root,inventory)=>{
  await mkdir(join(root,'skills/example-review/nested'));await writeFile(join(root,'skills/example-review/nested/SKILL.md'),'supporting text');
  const built=await compileRegistry(root,inventory);assert.equal(built.registry.skills.length,1);
  assert.ok(built.assets.get(built.registry.skills[0].id).some(f=>f.path==='nested/SKILL.md'));
}));
test('schema policy, protected IDs, invalid regex and references reject',()=>fixture(async(root,inventory)=>{
  const {registry}=await compileRegistry(root,inventory);
  for(const mutate of [r=>r.skills[0].quality={},r=>r.schema_version=2,r=>r.skills.push({...r.skills[0]}),
    r=>r.technologies[0].id='react',r=>r.technologies[0].signals=[{type:'content',path_glob:'*.js',regex:'['}],
    r=>r.skills[0].path='../escape',r=>r.combinations[0].requires=['react','react']]){
    const value=structuredClone(registry);mutate(value);await assert.rejects(validateRegistry(value,inventory));
  }
}));
test('immutable publication preserves history and rejects stale runs without pointer advancement',()=>fixture(async(root,inventory)=>{
  const built=await compileRegistry(root,inventory),site=join(root,'site'),rev='a'.repeat(40),next='b'.repeat(40);
  const one=compileManifest(built.registry,built.config,rev);await stagePublication(site,one.bytes,inventory,{revision:rev,repository:built.config.repository});
  const two=compileManifest(built.registry,built.config,next);await stagePublication(site,two.bytes,inventory,{revision:next,repository:built.config.repository,isAncestor:async()=>true});
  const before=await readFile(join(site,'latest.json'));
  await assert.rejects(stagePublication(site,one.bytes,inventory,{revision:rev,repository:built.config.repository,isAncestor:async()=>false}),/Stale/);
  assert.deepEqual(await readFile(join(site,'latest.json')),before);await verifyDistribution(site,inventory);
  assert.deepEqual(await readFile(join(site,one.pointer.artifact.path)),one.bytes);
  await assert.rejects(stagePublication(site,Buffer.from('{}'),inventory,{revision:next,repository:built.config.repository}));
  assert.deepEqual(await readFile(join(site,'latest.json')),before);
}));
