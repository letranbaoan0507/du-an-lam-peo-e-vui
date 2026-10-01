import {getPool,adapter} from './db.mjs';
import {protection,sha} from './protection.mjs';
import {randomBytes,randomUUID} from 'node:crypto';
const reply=(res,status,body)=>{res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('Referrer-Policy','no-referrer');res.end(JSON.stringify(body))};
function validItems(items){
 if(!Array.isArray(items)||items.length>5000)throw Object.assign(Error('Danh sách không hợp lệ hoặc vượt 5000 mục.'),{status:400});
 const ids=new Set();return items.map(item=>{
  if(!item||typeof item!=='object'||Array.isArray(item))throw Object.assign(Error('Mục website không hợp lệ.'),{status:400});
  let url;try{url=new URL(item.url)}catch{throw Object.assign(Error('Link website không hợp lệ.'),{status:400})}
  if(!['http:','https:'].includes(url.protocol)||url.username||url.password||typeof item.title!=='string'||item.title.length>200||!item.title.trim())throw Object.assign(Error('Tên hoặc link website không hợp lệ.'),{status:400});
  const id=item.id||randomUUID();if(typeof id!=='string'||id.length>128||ids.has(id)||JSON.stringify(item).length>16384)throw Object.assign(Error('ID trùng hoặc metadata không hợp lệ.'),{status:400});ids.add(id);
  // Giữ URL và metadata nguyên văn; không tự đổi link chatgpt.site.
  return {...item,id};
 });
}
async function readBody(req){let size=0;const chunks=[];for await(const c of req){size+=c.length;if(size>2*1024*1024)throw Object.assign(Error('Dữ liệu vượt 2 MiB.'),{status:413});chunks.push(c)}return Buffer.concat(chunks)}
function originFor(){
 if(process.env.APP_URL)return new URL(process.env.APP_URL).origin;
 if(process.env.VERCEL_URL)return 'https://'+process.env.VERCEL_URL;
 return 'http://localhost:3000';
}
// Injection chỉ dùng trong test; runtime Next/Vercel gọi handler với 2 tham số.
export async function handler(req,res,testPool){try{
 const origin=originFor(),path=new URL(req.url,origin).pathname,method=req.method||'GET';
 if(!['GET','HEAD'].includes(method)&&((req.headers.origin&&req.headers.origin!==origin)||req.headers['sec-fetch-site']==='cross-site'))return reply(res,403,{message:'Yêu cầu không cùng website.'});
 const pool=testPool||getPool(),bytes=await readBody(req);
 if(path.startsWith('/api/locks')){
  const headers=new Headers();for(const [k,v] of Object.entries(req.headers))if(typeof v==='string')headers.set(k,v);
  // Trên Vercel không tin cf-connecting-ip do client gửi.
  const address=process.env.VERCEL?String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0]:req.socket?.remoteAddress||'local';
  headers.set('cf-connecting-ip',address);
  const response=await protection(new Request(origin+path,{method,headers,...(!['GET','HEAD'].includes(method)?{body:bytes}:{})}),{DB:adapter(pool),RESEND_API_KEY:process.env.RESEND_API_KEY,EMAIL_FROM:process.env.EMAIL_FROM});
  res.statusCode=response.status;for(const [k,v] of response.headers)res.setHeader(k,v);res.end(await response.text());return;
 }
 if(!['/api/library','/api/library/init'].includes(path))return reply(res,404,{message:'Không tìm thấy API.'});
 if(!['GET','POST','PUT'].includes(method))return reply(res,405,{message:'Thao tác không hỗ trợ.'});
 const key=req.headers.cookie?.match(/(?:^|;\s*)lovely_library=([a-f0-9]{64})(?:;|$)/)?.[1];
 const library=key?(await pool.query('SELECT id,items,version FROM lovely_libraries WHERE owner_hash=$1',[await sha(key)])).rows[0]:null;
 if(method==='GET')return reply(res,200,library?{items:library.items,version:library.version}:{needsInit:true,items:[]});
 const rateId=await sha('library:'+String(req.socket?.remoteAddress||'unknown')+':'+Math.floor(Date.now()/60000));
 const count=(await pool.query('INSERT INTO lovely_rates(id,count,expires) VALUES($1,1,$2) ON CONFLICT(id) DO UPDATE SET count=lovely_rates.count+1 RETURNING count',[rateId,Date.now()+120000])).rows[0].count;
 if(count>60)return reply(res,429,{message:'Bạn thao tác quá nhanh. Hãy thử lại sau một phút.'});
 await pool.query('DELETE FROM lovely_rates WHERE expires<$1',[Date.now()]);
 let data;try{data=JSON.parse(bytes.toString())}catch{return reply(res,400,{message:'Dữ liệu không hợp lệ.'})}
 if(path.endsWith('/init')&&method==='POST'){
  if(library)return reply(res,200,{items:library.items,version:library.version});
  const items=validItems(data.items||[]),secret=randomBytes(32).toString('hex');
  await pool.query('INSERT INTO lovely_libraries(id,owner_hash,items) VALUES($1,$2,$3::jsonb)',[randomUUID(),await sha(secret),JSON.stringify(items)]);
  res.setHeader('Set-Cookie','lovely_library='+secret+'; HttpOnly; Path=/; SameSite=Lax; Max-Age=31536000'+(origin.startsWith('https:')?'; Secure':''));
  return reply(res,201,{items,version:1});
 }
 if(!library)return reply(res,401,{message:'Phiên quản lý danh sách đã mất. Tải lại trang và nhập bản sao lưu nếu có.'});
 if(method!=='PUT'||path!=='/api/library')return reply(res,405,{message:'Thao tác không hỗ trợ.'});
 if(!Number.isInteger(data.version))return reply(res,400,{message:'Thiếu phiên bản dữ liệu.'});
 const items=validItems(data.items),updated=(await pool.query('UPDATE lovely_libraries SET items=$1::jsonb,version=version+1,updated_at=now() WHERE id=$2 AND version=$3 RETURNING version',[JSON.stringify(items),library.id,data.version])).rows[0];
 if(!updated)return reply(res,409,{message:'Danh sách đã đổi ở tab khác. Sao lưu thay đổi hiện tại trước khi tải lại trang.'});
 reply(res,200,{version:updated.version});
 }catch(error){if(!error.status)console.error('Lovely API unavailable');reply(res,error.status||503,{message:error.status?error.message:'Không kết nối được database. Kiểm tra DATABASE_URL và chạy migration.'})}}
