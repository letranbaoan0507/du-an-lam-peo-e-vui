const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const encoder=new TextEncoder();
export const sha=async v=>hex(await crypto.subtle.digest('SHA-256',encoder.encode(v)));
const hex=v=>Array.from(new Uint8Array(v)).map(x=>x.toString(16).padStart(2,'0')).join('');
const random=()=>hex(crypto.getRandomValues(new Uint8Array(32)));
export async function passwordHash(password,salt){const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);return hex(await crypto.subtle.deriveBits({name:'PBKDF2',salt:encoder.encode(salt),iterations:100000,hash:'SHA-256'},key,256))}
function equal(a,b){if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0}
function fail(status,message){throw Object.assign(Error(message),{status})}
const validPassword=p=>typeof p==='string'&&p.length>=8&&p.length<=128;
function destination(value){let url;try{url=new URL(value)}catch{fail(400,'Link website không hợp lệ.')}if(!['https:','http:'].includes(url.protocol)||url.username||url.password)fail(400,'Link website không hợp lệ.');return url.href}
async function body(request){const reader=request.body?.getReader();if(!reader)fail(400,'Thiếu dữ liệu.');let bytes=0,out='';const decoder=new TextDecoder();while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>8192){await reader.cancel();fail(413,'Dữ liệu quá lớn.')}out+=decoder.decode(value,{stream:true})}out+=decoder.decode();try{return JSON.parse(out)}catch{fail(400,'Dữ liệu không hợp lệ.')}}
export async function protection(request,env){try{
 if(!env.DB)fail(503,'Phần mật khẩu đang được khởi tạo. Hãy thử lại sau.');
 const url=new URL(request.url),parts=url.pathname.replace(/^\/api\/locks\/?/,'').split('/').filter(Boolean),id=parts[0],action=parts[1],method=request.method,db=env.DB;
 if(!['GET','HEAD'].includes(method)&&((request.headers.get('origin')&&request.headers.get('origin')!==url.origin)||request.headers.get('sec-fetch-site')==='cross-site'))fail(403,'Yêu cầu không cùng website.');
 const q=(sql,...args)=>db.prepare(sql).bind(...args);
 if(method!=='GET'){
  const rateId=await sha((request.headers.get('cf-connecting-ip')||'unknown')+':'+(action||'manage')+':'+(id||'create')+':'+Math.floor(Date.now()/60000));
  const rate=await q('INSERT INTO lovely_rates(id,count,expires) VALUES(?,1,?) ON CONFLICT(id) DO UPDATE SET count=count+1 RETURNING count',rateId,Date.now()+120000).first();if(rate.count>(action==='forgot'?3:10))fail(429,'Bạn thao tác quá nhiều. Hãy thử lại sau một phút.');
  await q('DELETE FROM lovely_rates WHERE expires<?',Date.now()).run();
 }
 if(!id&&method==='POST'){
  const b=await body(request);if(!validPassword(b.password))fail(400,'Mật khẩu cần từ 8 đến 128 ký tự.');if(typeof b.email!=='string'||!/^\S+@\S+\.\S+$/.test(b.email)||b.email.length>254)fail(400,'Nhập email khôi phục hợp lệ.');
  const title=String(b.title||'Website').trim().slice(0,100),target=destination(b.url),id=crypto.randomUUID(),ownerToken=random(),salt=random();
  await q('INSERT INTO lovely_locks(id,title,url,owner_hash,password_hash,salt,email,created_at) VALUES(?,?,?,?,?,?,?,?)',id,title,target,await sha(ownerToken),await passwordHash(b.password,salt),salt,b.email.trim().toLowerCase(),Date.now()).run();return json({id,ownerToken,locked:true,shareUrl:url.origin+'/p/'+id},201);
 }
 if(!/^[a-f0-9-]{36}$/.test(id||''))fail(404,'Không tìm thấy website.');
 const item=await q('SELECT * FROM lovely_locks WHERE id=?',id).first();if(!item)fail(404,'Không tìm thấy website.');
 const owner=async()=>{const value=request.headers.get('authorization')?.replace(/^Bearer /,'')||'';if(!equal(await sha(value),item.owner_hash))fail(403,'Bạn không có quyền quản lý link này trên trình duyệt này. Dùng quên mật khẩu để lấy lại quyền.');};
 if(method==='GET'){return json({id,title:item.title,locked:!!item.password_hash,shareUrl:url.origin+'/p/'+id,emailHint:item.email.replace(/^(.).+(@.*)$/, '$1***$2'),emailReady:!!(env.RESEND_API_KEY&&env.EMAIL_FROM)})}
 if(method==='PATCH'){
  await owner();const b=await body(request);if(b.enabled===false){await q('UPDATE lovely_locks SET password_hash=NULL,salt=NULL,reset_hash=NULL,reset_expires=NULL WHERE id=?',id).run();return json({locked:false})}
  if(!validPassword(b.password))fail(400,'Mật khẩu cần từ 8 đến 128 ký tự.');const salt=random();if(b.email!==undefined&&(typeof b.email!=='string'||!/^\S+@\S+\.\S+$/.test(b.email)||b.email.length>254))fail(400,'Email không hợp lệ.');
  await q('UPDATE lovely_locks SET password_hash=?,salt=?,email=?,reset_hash=NULL,reset_expires=NULL WHERE id=?',await passwordHash(b.password,salt),salt,b.email?.trim().toLowerCase()||item.email,id).run();return json({locked:true})
 }
 if(method==='DELETE'){await owner();await q('DELETE FROM lovely_locks WHERE id=?',id).run();return json({deleted:true})}
 if(method==='POST'&&action==='unlock'){
  const b=await body(request);if(item.password_hash&&(typeof b.password!=='string'||!equal(await passwordHash(b.password.slice(0,129),item.salt),item.password_hash)))fail(401,'Mật khẩu chưa đúng.');return json({url:item.url})
 }
 if(method==='POST'&&action==='forgot'){
  if(!env.RESEND_API_KEY||!env.EMAIL_FROM)fail(503,'Chưa cấu hình gửi email. Chủ website cần kết nối dịch vụ email trước.');
  const b=await body(request);if(typeof b.email!=='string'||b.email.trim().toLowerCase()!==item.email)return json({message:'Nếu email khớp, bạn sẽ nhận được link đặt lại mật khẩu.'});
  const token=random(),hash=await sha(token);await q('UPDATE lovely_locks SET reset_hash=?,reset_expires=? WHERE id=?',hash,Date.now()+15*60000,id).run();
  const resetUrl=url.origin+'/reset/'+id+'#'+token;
  let response;try{response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({from:env.EMAIL_FROM,to:[item.email],subject:'Lovely · Đặt lại mật khẩu',text:'Bạn đã yêu cầu đặt lại mật khẩu cho link Lovely. Link có hiệu lực 15 phút, dùng một lần:\n'+resetUrl+'\nNếu không yêu cầu, hãy bỏ qua email này.'}),signal:AbortSignal.timeout(10000)})}catch{}
  if(!response?.ok){await q('UPDATE lovely_locks SET reset_hash=NULL,reset_expires=NULL WHERE id=? AND reset_hash=?',id,hash).run();fail(503,'Chưa gửi được email. Hãy thử lại sau.');}return json({message:'Đã gửi link đặt lại mật khẩu. Kiểm tra cả thư rác.'})
 }
 if(method==='POST'&&action==='reset'){
  const b=await body(request);if(!validPassword(b.password)||typeof b.token!=='string'||!/^[a-f0-9]{64}$/.test(b.token))fail(400,'Mật khẩu hoặc link đặt lại không hợp lệ.');
  const salt=random(),ownerToken=random(),result=await q('UPDATE lovely_locks SET password_hash=?,salt=?,owner_hash=?,reset_hash=NULL,reset_expires=NULL WHERE id=? AND reset_hash=? AND reset_expires>? RETURNING id',await passwordHash(b.password,salt),salt,await sha(ownerToken),id,await sha(b.token),Date.now()).first();if(!result)fail(400,'Link đã hết hạn hoặc đã được sử dụng.');return json({ownerToken,locked:true,shareUrl:url.origin+'/p/'+id})
 }
 fail(405,'Thao tác không được hỗ trợ.');
 }catch(e){if(!e.status)console.error('Lovely protection unavailable');return json({message:e.status?e.message:'Chưa xử lý được yêu cầu. Hãy thử lại sau.'},e.status||503)}}
