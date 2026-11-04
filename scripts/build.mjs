import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {compileRegistry} from '../contracts/lib/compiler.js';
import {compileManifest,stagePublication} from '../contracts/lib/publication.js';
import {decodeCustom} from '../contracts/lib/validate.js';
import {CUSTOM_RUNTIME_VERSION} from '../contracts/lib/contracts.js';
import {argumentsFor,contract,atomic,encode,main} from './lib/common.mjs';
await main(async()=>{
  const options=argumentsFor(),inventory=await contract();
  const compiled=await compileRegistry(options.root,inventory);
  if(options.manifest){
    const {bytes}=compileManifest(compiled.registry,compiled.config,options.revision);
    await decodeCustom(bytes,inventory,CUSTOM_RUNTIME_VERSION);
    const out=options.out??join(options.root,'dist');await mkdir(out,{recursive:true});
    await atomic(join(out,'manifest.json'),bytes.toString('utf8'));
    await stagePublication(join(out,'site'),bytes,inventory,{revision:options.revision,repository:compiled.config.repository??compiled.config.registry_id});
  }else if(options.check){
    if(await readFile(join(options.root,'registry.json'),'utf8')!==compiled.text)throw Error('registry.json is stale; run npm run build');
  }else await atomic(join(options.root,'registry.json'),compiled.text);
});
