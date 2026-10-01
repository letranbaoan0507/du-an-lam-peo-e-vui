import {readFile} from 'node:fs/promises';
import {getPool} from '../server/db.mjs';
if(!process.argv[2])throw new Error('Dùng npm run db:restore -- backups/FILE.json. Database đích phải trống.');
const data=JSON.parse(await readFile(process.argv[2],'utf8'));
if(data.format!=='lovely-postgres-backup-v1')throw new Error('Sai định dạng backup.');
const allowed={lovely_locks:['id','title','url','owner_hash','password_hash','salt','email','reset_hash','reset_expires','created_at'],
 lovely_libraries:['id','owner_hash','items','version','created_at','updated_at'],lovely_rates:['id','count','expires']};
const pool=getPool(),client=await pool.connect();
try{await client.query('BEGIN');try{
 for(const [name,columns] of Object.entries(allowed)){
  if(Number((await client.query('SELECT count(*) AS count FROM '+name)).rows[0].count))throw new Error('Database không trống; restore dừng để bảo vệ dữ liệu.');
  for(const row of data.tables[name]||[])await client.query('INSERT INTO '+name+'('+columns.join(',')+') VALUES('+columns.map((_,i)=>'$'+(i+1)).join(',')+')',columns.map(c=>c==='items'?JSON.stringify(row[c]):row[c]??null));
 }
 await client.query('COMMIT');console.log('Restored backup. IDs, order, hashes and metadata retained.');
}catch(error){await client.query('ROLLBACK');throw error}}finally{client.release();await pool.end()}
