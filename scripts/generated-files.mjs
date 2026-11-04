import {execFileSync} from 'node:child_process';
const files=execFileSync('git',['diff','--name-only','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
if(files.some(f=>!['registry.json','README.md'].includes(f)))throw Error('Generation modified authored or tooling files: '+files.join(', '));
