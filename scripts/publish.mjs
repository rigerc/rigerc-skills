import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {stagePublication,verifyDistribution} from '../contracts/lib/publication.js';
import {argumentsFor,contract,main} from './lib/common.mjs';
await main(async()=>{
  const o=argumentsFor(),inventory=await contract();
  if(o.verify){await verifyDistribution(o.site??join(o.root,'dist/site'),inventory);return;}
  if(!o.revision||!o.repository)throw Error('--revision and --repository are required');
  const bytes=await readFile(join(o.out??join(o.root,'dist'),'manifest.json'));
  await stagePublication(o.site??join(o.root,'dist/site'),bytes,inventory,{revision:o.revision,repository:o.repository,
    isAncestor:async(a,b)=>{try{execFileSync('git',['merge-base','--is-ancestor',a,b],{cwd:o.root,stdio:'ignore'});return true;}catch{return false;}}});
});
