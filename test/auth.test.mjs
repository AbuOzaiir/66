import test from 'node:test';
import assert from 'node:assert/strict';
import login from '../api/login.js';
import callback from '../api/callback.js';
import state from '../api/state.js';
function response(){return {headers:{},setHeader(k,v){this.headers[k]=v;},end(v){this.body=v;}};}
test('explicit API routes start OAuth even if platform rewrites req.url',async()=>{
 const keys=['GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET','ALLOWED_EMAIL','APP_ORIGIN','SESSION_SECRET','DRIVE_FOLDER_ID'];const old=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
 Object.assign(process.env,{DRIVE_FOLDER_ID:'test-root',GOOGLE_CLIENT_ID:'test-client',GOOGLE_CLIENT_SECRET:'test-secret',ALLOWED_EMAIL:'test@example.com',APP_ORIGIN:'https://sixtysix-ten.vercel.app',SESSION_SECRET:'ab'.repeat(32)});
 try{
  const res=response();await login({url:'/api/index',method:'GET',headers:{}},res);assert.equal(res.statusCode,302);
  const target=new URL(res.headers.Location);assert.equal(target.origin,'https://accounts.google.com');assert.equal(target.searchParams.get('redirect_uri'),'https://sixtysix-ten.vercel.app/api/callback');assert.ok(target.searchParams.get('state'));assert.match(res.headers['Set-Cookie'],/HttpOnly; Secure; SameSite=Lax/);
  const noSession=response();await state({url:'/api/index',method:'GET',headers:{}},noSession);assert.equal(noSession.statusCode,401);
  const forged=response();await callback({url:'/api/callback?code=fake&state=fake',method:'GET',headers:{}},forged);assert.equal(forged.statusCode,401);
  delete process.env.GOOGLE_CLIENT_SECRET;const missing=response();await login({url:'/api/login',method:'GET',headers:{}},missing);assert.equal(missing.statusCode,503);
 }finally{for(const k of keys){if(old[k]===undefined)delete process.env[k];else process.env[k]=old[k];}}
});
