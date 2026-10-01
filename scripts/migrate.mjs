import {readFile,readdir} from 'node:fs/promises';
import {getPool} from '../server/db.mjs';
const pool=getPool(),client=await pool.connect();
try{
 await client.query('CREATE TABLE IF NOT EXISTS lovely_schema_migrations(name text PRIMARY KEY,applied_at timestamptz NOT NULL DEFAULT now())');
 for(const name of (await readdir(new URL('../migrations/',import.meta.url))).filter(n=>n.endsWith('.sql')).sort()){
  await client.query('BEGIN');try{
   await client.query("SELECT pg_advisory_xact_lock(785631)");
   if(!(await client.query('SELECT name FROM lovely_schema_migrations WHERE name=$1',[name])).rowCount){
    await client.query(await readFile(new URL('../migrations/'+name,import.meta.url),'utf8'));
    await client.query('INSERT INTO lovely_schema_migrations(name) VALUES($1)',[name]);
   }
   await client.query('COMMIT');console.log('Migration ready: '+name);
  }catch(error){await client.query('ROLLBACK');throw error}
 }
}finally{client.release();await pool.end()}
