import {readFile,lstat,mkdir,writeFile,rename,unlink} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash,randomUUID} from 'node:crypto';
const base=fileURLToPath(new URL('../../',import.meta.url));
export const encode=value=>JSON.stringify(value,null,2)+'\n';
export function argumentsFor(args=process.argv.slice(2)){
  const options={root:base};
  for(let i=0;i<args.length;i++){
    const key=args[i];
    if(['--check','--manifest','--verify'].includes(key))options[key.slice(2)]=true;
    else if(['--root','--revision','--out','--site','--repository'].includes(key)){
      const value=args[++i];if(!value||value.startsWith('--'))throw Error(key+' requires a value');
      options[key.slice(2)]=key==='--root'||key==='--out'||key==='--site'?resolve(value):value;
    }else throw Error('Unknown argument '+key);
  }return options;
}
export async function contract(){
  const lock=JSON.parse(await readFile(join(base,'contracts.lock.json'),'utf8'));
  const sorted=Object.fromEntries(Object.entries(lock.files).sort(([a],[b])=>a<b?-1:1));
  const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
  if(lock.bundle_version!==1||sha(JSON.stringify(sorted))!==lock.content_sha256)throw Error('Invalid contracts lock');
  for(const [file,digest] of Object.entries(sorted)){
    if(file.includes('..')||file.startsWith('/')||file.includes('\\'))throw Error('Invalid contract bundle path');
    const bytes=await readFile(join(base,'contracts',file));if(sha(bytes)!==digest)throw Error('Contract bundle integrity failure: '+file);
  }
  return JSON.parse(await readFile(join(base,'contracts/inventory.json'),'utf8'));
}
export async function atomic(path,text){
  try{if((await lstat(path)).isSymbolicLink())throw Error('Refusing symlinked output '+path);if(await readFile(path,'utf8')===text)return false;}
  catch(error){if(error.code!=='ENOENT')throw error;}
  await mkdir(dirname(path),{recursive:true});const temp=path+'.'+randomUUID()+'.tmp';
  try{await writeFile(temp,text,{flag:'wx'});await rename(temp,path);}finally{await unlink(temp).catch(()=>{});}return true;
}
export async function main(run){try{await run();}catch(error){process.stderr.write(error.message+'\n');process.exitCode=1;}}
