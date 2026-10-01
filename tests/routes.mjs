import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const base='http://127.0.0.1:3210';
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3210'],{env:{...process.env,APP_URL:base},stdio:['ignore','pipe','pipe']});
let output='';child.stdout.on('data',c=>output+=c);child.stderr.on('data',c=>output+=c);
try{
 for(let i=0;i<100&&!output.includes('Ready');i++){if(child.exitCode!==null)throw Error(output);await new Promise(r=>setTimeout(r,100))}
 assert.ok(output.includes('Ready'),output);
 const id='959a3243-499d-4db8-b5af-758da39a8a2e';
 for(const path of ['/','/p/'+id,'/reset/'+id,'/app.js','/style.css','/migration.css','/assets/fonts/baloo.css','/assets/fonts/baloo2-0.ttf','/assets/fonts/baloo2-1.ttf','/assets/fonts/baloo2-2.ttf','/assets/fonts/baloo2-3.ttf']){
  const response=await fetch(base+path);assert.equal(response.status,200,path);await response.arrayBuffer();
 }
 const response=await fetch(base+'/api/library');assert.equal(response.status,503);assert.match((await response.json()).message,/database/);
 // Ngoài dòng import font tự host, các màu, layout, responsive và hiệu ứng CSS không đổi.
 const original=readFileSync(new URL('../source-original/static/style.css',import.meta.url),'utf8').split('\n').slice(1).join('\n');
 const current=readFileSync(new URL('../public/style.css',import.meta.url),'utf8').split('\n').slice(1).join('\n');assert.equal(current,original);
 console.log('PASS: production Next server, homepage/direct routes/assets and missing-DB error; original CSS preserved.');
}finally{child.kill('SIGTERM')}
