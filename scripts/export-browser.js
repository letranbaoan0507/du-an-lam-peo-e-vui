// Chạy trong Console của trình duyệt đang giữ dữ liệu Lovely CŨ.
// Chỉ đọc localStorage; không thay đổi website cũ.
(()=>{
 const data={format:'lovely-browser-backup-v1',
  items:JSON.parse(localStorage.getItem('lovely-websites-v1')||'[]'),
  owners:JSON.parse(localStorage.getItem('lovely-lock-owners-v1')||'{}')};
 const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='lovely-browser-backup.json';a.click();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
})();
