import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer} from 'node:http';
import {PGlite} from '@electric-sql/pglite';
import {JSDOM} from 'jsdom';
import {handler} from '../server/app.mjs';
import {adapter} from '../server/db.mjs';
import {protection,sha} from '../server/protection.mjs';
import {importLocks} from '../scripts/import-sites.mjs';
test('PostgreSQL engine: permissions, persistence, locks, migration and reset',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'lovely-pg-'));let db=new PGlite(dir);
 await db.exec(readFileSync(new URL('../migrations/001_initial.sql',import.meta.url),'utf8'));
 const pool={query:async(sql,args)=>(db.query(sql,args))};
 // Bản export thực tế chỉ đọc; không gửi email, không chạm site cũ.
 const exported=JSON.parse(readFileSync(new URL('../database/exports/sites-locks.json',import.meta.url),'utf8'));
 assert.equal(await importLocks(pool,exported),exported.rows.length);
 for(const row of exported.rows){const actual=(await pool.query('SELECT * FROM lovely_locks WHERE id=$1',[row.id])).rows[0];assert.equal(actual.url,row.url);assert.equal(actual.owner_hash,row.owner_hash)}
 const server=createServer((req,res)=>handler(req,res,pool));await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;process.env.APP_URL=base;
 let cookie='';async function request(path,method='GET',body,owner,useCookie=true,origin=base){
  const r=await fetch(base+'/api/'+path,{method,headers:{Origin:origin,...(body?{'Content-Type':'application/json'}:{}),...(useCookie&&cookie?{Cookie:cookie}:{}),...(owner?{Authorization:'Bearer '+owner}:{})},...(body?{body:JSON.stringify(body)}:{})});
  return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};
 }
 try{
  assert.equal((await request('library')).data.needsInit,true);
  const original=[{id:'keep-original-id',title:'A',url:'https://old.chatgpt.site/a',description:'Giữ nguyên',metadata:{custom:1}}];
  const init=await request('library/init','POST',{items:original});assert.equal(init.status,201);cookie=init.cookie;
  assert.deepEqual((await request('library')).data.items,original);
  assert.equal((await request('library','PUT',{items:[],version:1},null,false)).status,401);
  assert.equal((await request('library','PUT',{items:[],version:1},null,true,'https://evil.example')).status,403);
  assert.equal((await request('library','PUT',{items:original,version:1})).status,200);
  assert.equal((await request('library','PUT',{items:[],version:1})).status,409);
  const created=await request('locks','POST',{title:'Secret',url:'https://example.com/',password:'password123',email:'test@example.com'});assert.equal(created.status,201);
  const {id,ownerToken}=created.data,row=(await pool.query('SELECT * FROM lovely_locks WHERE id=$1',[id])).rows[0];assert.notEqual(row.password_hash,'password123');assert.notEqual(row.owner_hash,ownerToken);
  const meta=(await request('locks/'+id)).data;assert.equal(meta.url,undefined);assert.equal(meta.locked,true);
  assert.equal((await request('locks/'+id+'/unlock','POST',{password:'wrong'})).status,401);
  assert.equal((await request('locks/'+id+'/unlock','POST',{password:'password123'})).status,200);
  assert.equal((await request('locks/'+id,'PATCH',{enabled:false},'invalid')).status,403);
  assert.equal((await request('locks/'+id+'/forgot','POST',{email:'test@example.com'})).status,503);
  // Mô phỏng mail provider; không coi đây là kiểm tra gửi mail thực tế.
  const realFetch=globalThis.fetch;let mail;globalThis.fetch=async(url,options)=>{mail=JSON.parse(options.body);return new Response('{}',{status:200})};
  const call=(action,data)=>protection(new Request(base+'/api/locks/'+id+'/'+action,{method:'POST',headers:{Origin:base,'cf-connecting-ip':'test-'+action},body:JSON.stringify(data)}),{DB:adapter(pool),RESEND_API_KEY:'test',EMAIL_FROM:'test@example.com'});
  let resetToken;
  try{assert.equal((await call('forgot',{email:'test@example.com'})).status,200);resetToken=mail.text.match(/#([a-f0-9]{64})/)[1]}finally{globalThis.fetch=realFetch}
  const reset=await request('locks/'+id+'/reset','POST',{token:resetToken,password:'new-password'});assert.equal(reset.status,200);
  assert.equal((await request('locks/'+id+'/reset','POST',{token:resetToken,password:'new-password'})).status,400);
  assert.equal((await request('locks/'+id,'PATCH',{enabled:false},ownerToken)).status,403);
  const expired='f'.repeat(64);await pool.query('UPDATE lovely_locks SET reset_hash=$1,reset_expires=$2 WHERE id=$3',[await sha(expired),Date.now()-1000,id]);
  assert.equal((await request('locks/'+id+'/reset','POST',{token:expired,password:'new-password'})).status,400);
  assert.equal((await request('locks/'+id,'PATCH',{enabled:false},reset.data.ownerToken)).status,200);
  assert.equal((await request('locks/'+id+'/unlock','POST',{})).status,200);
  await db.close();db=new PGlite(dir);
  assert.deepEqual((await request('library')).data.items,original);
  assert.equal((await request('locks/'+id)).data.locked,false);
  assert.equal((await request('locks/'+id,'DELETE',undefined,reset.data.ownerToken)).status,200);
  assert.equal((await request('locks/'+id)).status,404);
 }finally{await new Promise(r=>server.close(r));await db.close()}
});
test('Original UI: add/delete, filters, password dialog, cloud save and URL preservation',async()=>{
 const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8'),code=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
 const dom=new JSDOM(html,{url:'https://lovely.example/',runScripts:'outside-only'}),w=dom.window;
 let list=[{id:'original',title:'Website cũ',url:'https://old.chatgpt.site/unchanged',type:'web'}],version=1;
 w.structuredClone=structuredClone;w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false};
 w.fetch=async(url,opt={})=>{if(url==='/api/library'){if(opt.method==='PUT'){list=JSON.parse(opt.body).items;version++;return {ok:true,json:async()=>({version})}}return {ok:true,json:async()=>({items:list,version})}}throw Error('Unexpected API '+url)};
 w.eval(code);await new Promise(r=>setTimeout(r,30));assert.equal(w.document.querySelector('.open').href,'https://old.chatgpt.site/unchanged');
 w.document.querySelector('.lock-btn').click();await new Promise(r=>setTimeout(r,10));assert.ok(w.document.querySelector('#passwordForm'));w.document.querySelector('#securityClose').click();
 w.document.querySelector('#appTab').click();w.document.querySelector('#addBtn').click();const form=w.document.querySelector('#addForm');form.elements.title.value='Game';form.elements.url.value='https://example.com/game';form.dispatchEvent(new w.Event('submit',{cancelable:true}));await new Promise(r=>setTimeout(r,30));assert.equal(list.length,2);assert.equal(w.document.querySelector('.card h3').textContent,'Game');
 w.document.querySelector('.delete-btn').click();w.document.querySelector('#confirmDelete').click();await new Promise(r=>setTimeout(r,30));assert.equal(list.length,1);w.document.querySelector('#webTab').click();assert.equal(w.document.querySelector('.open').href,'https://old.chatgpt.site/unchanged');
 w.document.querySelector('#search').value='Không có';w.document.querySelector('#search').dispatchEvent(new w.Event('input'));assert.equal(w.document.querySelectorAll('.card').length,0);dom.window.close();
});
