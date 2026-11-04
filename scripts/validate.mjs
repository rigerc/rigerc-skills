import {validateLocal} from '../contracts/lib/compiler.js';
import {argumentsFor,contract,main} from './lib/common.mjs';
await main(async()=>{const options=argumentsFor();await validateLocal(options.root,await contract());console.log('Registry sources and generated index are current.');});
