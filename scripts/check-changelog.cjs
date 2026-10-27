const {execFileSync}=require('node:child_process');
const base=process.argv[2]||'HEAD^',head=process.argv[3]||'HEAD';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:64*1024*1024}).trim();
const files=git('diff','--name-only',base,head).split(/\r?\n/).filter(Boolean);
const sources=new Set(['index.html','shim.js','config.js','sw.js','dungeon-immersive.js','dungeon-immersive.css','collection-scenes.js','collection-scenes.css']);
if(!files.some(f=>sources.has(f))){console.log('No game source change.');process.exit(0)}
const at=(ref,file)=>git('show',`${ref}:${file}`);
const block=s=>{const a=s.indexOf('/*UPD_BEGIN*/'),b=s.indexOf('/*UPD_END*/');if(a<0||b<a)throw Error('Update log markers missing');return s.slice(a,b)};
const before=at(base,'index.html'),after=at(head,'index.html');
// A malformed journal can prevent every module in its script from loading.
const vm=require('node:vm');
for(const m of after.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
 if(/\bsrc\s*=|application\/ld\+json|application\/json/i.test(m[1])||!m[2].trim())continue;
 new vm.Script(m[2],{filename:'index.html:inline-script'});
}
const journal=block(after).replace('/*UPD_BEGIN*/','').replace(/;\s*$/,'');
const entries=vm.runInNewContext(journal+'; UPD');
if(!Array.isArray(entries)||entries.some(v=>!Array.isArray(v.e)||v.e.some(e=>!Array.isArray(e)||e.length<3)))throw Error('Malformed update-log entry.');
if(block(before)===block(after)&&!git('log','-1','--format=%s',head).includes('[private-code]'))throw Error('Game source changed without an update-log entry. Add a FR/EN UPD entry. Private gift codes are exempt; use [private-code] in the commit message for a private-code-only change.');
const oldBuild=/window\.PID_BUILD\s*=\s*["']([^"']+)/.exec(before)?.[1],newBuild=/window\.PID_BUILD\s*=\s*["']([^"']+)/.exec(after)?.[1];
if(!oldBuild||!newBuild||oldBuild===newBuild)throw Error('PID_BUILD must change with game source.');
if(!after.includes(`shim.js?v=${newBuild}`))throw Error('shim.js version does not match PID_BUILD.');
const version=JSON.parse(at(head,'version.json')).v;
if(version!==newBuild)throw Error('version.json does not match PID_BUILD.');
console.log('Game update log and build version verified.');
