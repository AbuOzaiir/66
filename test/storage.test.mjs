import test from 'node:test';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';import {mkdtemp,cp,rm,writeFile} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';
test('create, edit, conflict and restoration preserve all iterations',async()=>{
 const temp=await mkdtemp(join(tmpdir(),'ss-test-'));for(const name of ['server.mjs','api'])await cp(new URL('../'+name,import.meta.url),join(temp,name),{recursive:true});await cp(new URL('../package.json',import.meta.url),join(temp,'package.json'));
 await writeFile(join(temp,'seed.json'),JSON.stringify({files:[],folders:[{id:'test-root',name:'Test',path:'',parent:null}],layout:{}}));
 const server=spawn(process.execPath,['server.mjs'],{cwd:temp,env:{...process.env,PORT:'4329'}});
 try{
 await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',c=>reject(new Error('Server exit '+c)));});
 const get=async p=>(await fetch('http://127.0.0.1:4329/api/'+p)).json();const post=async(p,body)=>{const r=await fetch('http://127.0.0.1:4329/api/'+p,{method:'POST',headers:{'Content-Type':'application/json','X-SixtySix':'1'},body:JSON.stringify(body)});return {status:r.status,data:await r.json()};};
 const s=await get('state'),c=await post('create',{name:'TEST.md',parent:s.folders[0].id,content:'# Initial'});assert.equal(c.status,201);const id=c.data.id;
 assert.equal((await post('save',{id,content:'# Changed',expected:'# Initial'})).status,200);
 assert.equal((await post('save',{id,content:'# Stale',expected:'# Initial'})).status,409);
 assert.equal((await post('save',{id,content:'# Initial',expected:'# Changed'})).status,200);
 assert.equal((await get('history?id='+id)).revisions.length,3);assert.equal((await get('state')).files.find(f=>f.id===id).content,'# Initial');
 }finally{server.kill();await rm(temp,{recursive:true,force:true});}
});
