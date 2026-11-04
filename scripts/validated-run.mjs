import {execFileSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
const {GH_REPO,VALIDATION_RUN,DEFAULT_BRANCH}=process.env;
if(!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(GH_REPO??'')||!/^\d+$/.test(VALIDATION_RUN??'')||!DEFAULT_BRANCH)throw Error('Missing bound validation run/repository/default branch');
const api=path=>JSON.parse(execFileSync('gh',['api',path],{encoding:'utf8'}));
const run=api('repos/'+GH_REPO+'/actions/runs/'+VALIDATION_RUN);
const branch=api('repos/'+GH_REPO+'/branches/'+encodeURIComponent(DEFAULT_BRANCH));
if(run.repository.full_name!==GH_REPO||run.head_repository.full_name!==GH_REPO||run.status!=='completed'||run.conclusion!=='success'||
   !['push','workflow_dispatch'].includes(run.event)||run.head_branch!==DEFAULT_BRANCH||run.head_sha!==branch.commit.sha||
   run.path!=='.github/workflows/validate.yml'||!/^[a-f0-9]{40}$/.test(run.head_sha))throw Error('Publication requires a successful validation of the current default-branch revision');
writeFileSync(process.env.GITHUB_OUTPUT??'/dev/stdout','sha='+run.head_sha+'\n');
