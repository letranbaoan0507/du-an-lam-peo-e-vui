import {mkdir,writeFile} from 'node:fs/promises';
import {dirname} from 'node:path';
import {getPool} from '../server/db.mjs';
const pool=getPool(),client=await pool.connect();
try{
 await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
 const tables={};for(const name of ['lovely_locks','lovely_libraries','lovely_rates'])tables[name]=(await client.query('SELECT * FROM '+name+' ORDER BY id')).rows;
 await client.query('COMMIT');
 const file=process.argv[2]||'backups/lovely-'+new Date().toISOString().replace(/[:.]/g,'-')+'.json';
 await mkdir(dirname(file),{recursive:true});await writeFile(file,JSON.stringify({format:'lovely-postgres-backup-v1',createdAt:new Date().toISOString(),tables},null,2),{mode:0o600});console.log('Saved backup: '+file);
}catch(error){await client.query('ROLLBACK');throw error}finally{client.release();await pool.end()}
