import test from 'node:test';
import assert from 'node:assert/strict';
import {driveClient} from '../api/index.js';
test('Drive save uses metadata ETag when media has none and rejects concurrent changes',async()=>{
 const original=globalThis.fetch;let calls=[],race=false,reads=0,conflict=false;
 globalThis.fetch=async(url,options={})=>{calls.push({url,...options});
 if(options.method==='PUT')return conflict?new Response('',{status:412}):Response.json({id:'f',version:'3',modifiedDate:'2026-09-14T00:00:00Z'});
 if(url.includes('alt=media'))return new Response('original');
 reads++;return Response.json({etag:race&&reads%2===0?'"changed"':'"v2"',version:'2'});};
 try{const d=await driveClient('test');const raw=await d.content('f',true);assert.equal(raw.content,'original');assert.equal(raw.etag,'"v2"');const saved=await d.update('f','new',raw.etag);assert.equal(saved.version,'3');assert.equal(saved.modifiedTime,'2026-09-14T00:00:00Z');const write=calls.find(c=>c.method==='PUT');assert.equal(write.headers['If-Match'],'"v2"');assert.match(write.url,/upload\/drive\/v2/);
 conflict=true;await assert.rejects(d.update('f','new',raw.etag),e=>e.status===409);
 race=true;reads=0;await assert.rejects(d.content('f',true),e=>e.status===409);
 const count=calls.length;await assert.rejects(d.update('f','new',null));assert.equal(calls.length,count);
 }finally{globalThis.fetch=original;}
});
