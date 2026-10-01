import pg from 'pg';
let pool;
export function getPool(){
 if(pool)return pool;
 if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL chưa được cấu hình.');
 const connection=new URL(process.env.DATABASE_URL);
 const local=['localhost','127.0.0.1','[::1]'].includes(connection.hostname);
 const plain=process.env.DATABASE_LOCAL_NO_TLS==='true'&&local;
 // Không để sslmode trên URL ghi đè cấu hình xác minh chứng chỉ của pg.
 for(const key of ['sslmode','sslcert','sslkey','sslrootcert'])connection.searchParams.delete(key);
 const ca=process.env.DATABASE_SSL_CA?.replace(/\\n/g,'\n');
 pool=new pg.Pool({connectionString:connection.href,max:3,idleTimeoutMillis:10000,
  connectionTimeoutMillis:10000,ssl:plain?false:{rejectUnauthorized:true,...(ca?{ca}:{})}});
 pool.on('error',()=>console.error('Database connection unavailable'));
 return pool;
}
export function adapter(pool){return {prepare(sql){let n=0;const text=sql.replace(/\?/g,()=>'$'+(++n));return {bind(...args){return {
 async first(){return (await pool.query(text,args)).rows[0]||null},
 async run(){return pool.query(text,args)}
 }}}}}}
