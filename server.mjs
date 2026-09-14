import http from 'node:http';import {readFile,writeFile} from 'node:fs/promises';import {randomUUID} from 'node:crypto';import {fileURLToPath} from 'node:url';import {validateFile} from './api/index.js';
const root=fileURLToPath(new URL('.',import.meta.url));let db;
try{db=JSON.parse(await readFile(root+'.local-state.json','utf8'));}catch{try{db=JSON.parse(await readFile(root+'seed.json','utf8'));}catch{db={files:[],folders:[{id:'local-root',name:'SixtySix',path:'',parent:null}],layout:{}};}db.revisions={};for(const f of db.files)db.revisions[f.id]=[{id:randomUUID(),content:f.content,time:f.modifiedTime||new Date().toISOString(),author:'Ausgangsstand'}];}
async function persist(){await writeFile(root+'.local-state.json',JSON.stringify(db,null,2));}
let queue=Promise.resolve();
const server=http.createServer((req,res)=>{queue=queue.then(()=>handle(req,res)).catch(e=>{res.statusCode=e.status||500;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({error:e.message}));});});
async function handle(req,res){const url=new URL(req.url,'http://127.0.0.1');res.setHeader('Cache-Control','no-store');if(url.pathname.startsWith('/api/')){
 let body={};if(req.method==='POST'){if(req.headers['x-sixtysix']!=='1')throw Object.assign(new Error('Anfrage nicht erlaubt.'),{status:403});let s='';for await(const b of req){s+=b;if(s.length>1100000)throw new Error('Datei zu groß.');}body=JSON.parse(s||'{}');}
 const action=url.pathname.slice(5),send=(d,status=200)=>{res.statusCode=status;res.setHeader('Content-Type','application/json');res.end(JSON.stringify(d));};
 if(action==='state')return send({...db,mode:'local',revisions:undefined});
 if(action==='history')return send({revisions:[...(db.revisions[url.searchParams.get('id')]||[])].reverse()});
 if(action==='layout'&&req.method==='POST'){db.layout=body.positions;db.collapsed=body.collapsed;await persist();return send({ok:true});}
 if(action==='create'&&req.method==='POST'){validateFile(body);const parent=db.folders.find(f=>f.id===body.parent);if(!parent)return send({error:'Ordner nicht gefunden.'},404);if(db.files.some(f=>f.parent===parent.id&&f.name===body.name))return send({error:'Diese Datei existiert bereits.'},409);const f={id:randomUUID(),name:body.name,path:(parent.path?parent.path+'/':'')+body.name,parent:parent.id,content:body.content};db.files.push(f);db.revisions[f.id]=[{id:randomUUID(),content:f.content,time:new Date().toISOString(),author:'Du · lokal'}];await persist();return send({id:f.id},201);}
 if(action==='save'&&req.method==='POST'){validateFile(body);const f=db.files.find(f=>f.id===body.id);if(!f)return send({error:'Datei nicht gefunden.'},404);if(f.content!==body.expected)return send({error:'Die Datei wurde inzwischen geändert. Dein Entwurf bleibt erhalten.'},409);f.content=body.content;db.revisions[f.id].push({id:randomUUID(),content:f.content,time:new Date().toISOString(),author:'Du · lokal'});await persist();return send({ok:true});}
 return send({error:'Nicht gefunden.'},404);
 }
 const paths={'/':'index.html','/style.css':'style.css','/app.js':'app.js','/graph.js':'graph.js'};const file=paths[url.pathname];if(!file){res.statusCode=404;return res.end();}res.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.css')?'text/css':'text/javascript');res.setHeader('X-Content-Type-Options','nosniff');res.end(await readFile(root+'public/'+file));
}
server.listen(Number(process.env.PORT||4317),'127.0.0.1',()=>console.log('Local preview: http://127.0.0.1:'+(process.env.PORT||4317)));
