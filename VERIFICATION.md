# Kiểm tra thực tế

## Đã chạy

- npm install: cài dependencies và tạo package-lock.json.
- npm run build: Next production build thành công.
- npm test: 2 nhóm integration, không thất bại.
- node tests/routes.mjs: Next production server chạy, HTTP /, /p/:id, /reset/:id, app.js, style.css, font CSS/TTF trả 200.
- API qua Node HTTP handler với PostgreSQL engine PGlite: init list, đọc, ghi, cookie owner; browser khác không được sửa; cross-origin bị chặn; version conflict trả 409.
- Import bản D1 thực tế vào PostgreSQL engine: giữ ID, URL và owner hash.
- Giữ list và trạng thái lock sau khi đóng/mở lại PostgreSQL engine bằng cùng dữ liệu trên đĩa test.
- Tạo lock, hash khác plaintext; unlock đúng/sai; owner sai bị chặn; tắt mật khẩu; xóa lock; 404 sau xóa.
- Reset dùng một lần, expired bị từ chối; token quản lý cũ bị thu hồi sau reset.
- Email thiếu cấu hình trả lỗi; flow tạo email được mô phỏng, không gửi mail thật.
- Frontend DOM bằng jsdom: thêm/xóa app, Web/App filter, search, dialog mật khẩu, cloud-save async, giữ URL chatgpt.site nguyên văn.
- CSS gốc ngoài import font được so sánh nguyên văn: giữ layout, màu, responsive rules và hover effects.

## Chưa chạy và không tuyên bố hoàn tất

- Deploy Vercel/GitHub thật và kiểm tra domain public độc lập.
- Kết nối/TLS/migrate vào Supabase thật.
- Refresh/redeploy browser thật dùng cloud database; mới kiểm tra reload database engine và HTTP đọc lại.
- Gửi/nhận email thật qua Resend.
- Render/animation/responsive visual QA trên browser mobile/desktop thật của bản độc lập.
- Nhập browser backup của người dùng: chưa có localStorage của browser đó.
- Chạy backup/restore scripts với tài khoản Supabase thật.

Lovely không có account app hoặc upload nên login/upload không áp dụng. Capability owner được kiểm tra; không coi đó là đăng nhập Supabase Auth.

## Tự chạy lại

~~~bash
npm ci
npm run build
npm test
node tests/routes.mjs
~~~

tests/routes.mjs kiểm tra nhánh thiếu database nên chạy trong môi trường không có DATABASE_URL. Integration dùng PostgreSQL engine test tách biệt, không chạm database cloud/site cũ.

Trước khi bỏ site cũ, hoàn tất checklist cloud ở DEPLOY-VERCEL.md.
