import {readFile} from 'node:fs/promises';
import {getPool} from '../server/db.mjs';
export async function importLocks(client,exported){
 if(exported.model_projection?.truncated||exported.has_more)throw new Error('Export không đầy đủ; không nhập dữ liệu bị cắt.');
 let count=0;
 for(const row of exported.rows||[]){
  const columns=['id','title','url','owner_hash','password_hash','salt','email','reset_hash','reset_expires','created_at'];
  const existing=(await client.query('SELECT id FROM lovely_locks WHERE id=$1',[row.id])).rows[0];
  if(existing)throw new Error('ID đã tồn tại: '+row.id+'. Không ghi đè. Dùng database trống để import.');
  await client.query('INSERT INTO lovely_locks('+columns.join(',')+') VALUES('+columns.map((_,i)=>'$'+(i+1)).join(',')+')',columns.map(c=>row[c]??null));count++;
 }
 return count;
}
if(process.argv[1]?.endsWith('import-sites.mjs')){
 const file=process.argv[2]||'database/exports/sites-locks.json',pool=getPool(),client=await pool.connect();
 try{const exported=JSON.parse(await readFile(file,'utf8'));await client.query('BEGIN');try{
  const count=await importLocks(client,exported);await client.query('COMMIT');console.log('Imported '+count+' lock records, unchanged IDs/URLs/hashes.');
 }catch(error){await client.query('ROLLBACK');throw error}}
 finally{client.release();await pool.end()}
}
