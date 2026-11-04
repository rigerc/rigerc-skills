import {configureRegistry} from '../contracts/lib/configure.js';
import {compileRegistry} from '../contracts/lib/compiler.js';
import {join} from 'node:path';
import {argumentsFor,contract,atomic,main} from './lib/common.mjs';
await main(async()=>{
  const [id,...args]=process.argv.slice(2);if(!id||id.startsWith('-'))throw Error('Usage: node scripts/configure.mjs owner/repo [--root path]');
  const options=argumentsFor(args),inventory=await contract();
  await configureRegistry(options.root,id,inventory);
  await atomic(join(options.root,'registry.json'),(await compileRegistry(options.root,inventory)).text);
});
