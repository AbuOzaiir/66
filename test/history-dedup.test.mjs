import test from 'node:test';
import assert from 'node:assert/strict';
import {uniqueRevisions} from '../api/index.js';
test('same content and modification time appear once, preserving the editor',()=>{
 const common={sourceId:'file',content:'text'};
 const rows=[{...common,id:'drive',author:'Drive',time:'2026-09-14T12:00:00.000Z'},{...common,id:'user',author:'user@example.com',time:'2026-09-14T12:00:00Z'}];
 for(const input of [rows,[...rows].reverse()]){const result=uniqueRevisions(input);assert.equal(result.length,1);assert.equal(result[0].author,'user@example.com');assert.equal(result[0].id,'user');}
 assert.equal(rows[0].author,'Drive');
});
test('restoration at a later time and distinct contents are not collapsed',()=>{
 const base={sourceId:'file',author:'Drive',content:'a',time:'2026-09-14T12:00:00Z'};
 assert.equal(uniqueRevisions([base,{...base,content:'b'},{...base,time:'2026-09-14T12:01:00Z'},{...base,sourceId:'other'}]).length,4);
});
