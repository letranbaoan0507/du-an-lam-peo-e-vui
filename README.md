# Lovely Independent

Chuyển trực tiếp từ source Lovely phiên bản 4, commit 651edd2fa9c4985e52658dcccb6b3a710dbae752. Website gốc không bị chỉnh sửa, deploy lại hoặc xóa trong lần chuyển này.

**Trạng thái:** source độc lập build thành công; backend chạy thử với PostgreSQL engine PGlite. Chưa kết nối Supabase thật và chưa deploy Vercel. Danh sách riêng trong trình duyệt của bạn cần export/import thủ công. Đọc MIGRATION-NOTES.md trước khi chuyển.

## Cấu trúc

- public/: HTML, CSS, JavaScript từ giao diện gốc; assets/fonts/ chứa Baloo 2 và giấy phép.
- pages/api/[...route].js: Next API triển khai thành Vercel Functions.
- server/: backend danh sách, mật khẩu và PostgreSQL.
- database/schema.sql, migrations/: schema và SQL migration.
- database/exports/: dữ liệu D1 xuất thật, KHÔNG đưa lên GitHub.
- scripts/: migrate, import Sites, export browser, backup/restore.
- source-original/: toàn bộ source gốc để đối chiếu; không phải runtime mới.
- tests/: kiểm tra API, persistence, frontend DOM và HTTP routes.

## Chạy trên Windows

1. Cài Node.js LTS từ https://nodejs.org (22.13 trở lên; khuyến nghị Node 24 LTS).
2. Giải nén ZIP, mở thư mục Lovely-INDEPENDENT có package.json.
3. Bấm thanh địa chỉ thư mục, gõ cmd rồi Enter.
4. Chạy npm install.
5. Copy .env.example thành .env.local. Điền DATABASE_URL, DATABASE_SSL_CA nếu cần, APP_URL theo DEPLOY-VERCEL.md.
6. Tạo database rồi chạy npm run db:migrate.
7. Nhập D1 một lần vào database trống: npm run db:import.
8. Chạy npm run dev, mở http://localhost:3000. Giữ CMD mở; Ctrl+C để dừng.

Chạy production trên máy:

~~~bash
npm run build
npm start
~~~

Không cần Wrangler hoặc tài khoản ChatGPT. Thiếu DATABASE_URL: trang và assets vẫn mở; chức năng lưu/mật khẩu báo lỗi database thay vì giả vờ lưu thành công. Build không yêu cầu secret.

## Biến môi trường

| Biến | Công dụng |
| --- | --- |
| DATABASE_URL | Kết nối PostgreSQL phía server; Supabase dùng transaction pooler |
| DATABASE_SSL_CA | PEM CA từ Supabase nếu cần; có thể dùng ký tự \n |
| DATABASE_LOCAL_NO_TLS | true chỉ cho PostgreSQL localhost không TLS |
| APP_URL | Domain chính; local http://localhost:3000 |
| RESEND_API_KEY | Tùy chọn: khóa Resend gửi link đặt lại |
| EMAIL_FROM | Tùy chọn: địa chỉ gửi đã xác minh tại Resend |

Không dùng NEXT_PUBLIC_ cho database hoặc email secrets. Không đưa .env.local lên GitHub.

## Dữ liệu và quyền

Danh sách lưu ở PostgreSQL lovely_libraries.items dạng JSONB, giữ thứ tự/metadata; không phải file JSON trên Vercel. Mỗi browser có cookie quản lý riêng, HttpOnly; database lưu hash khóa. Không cấp quyền sửa danh sách của người khác.

Lovely gốc không có account/login hoặc upload. Không tự thêm đăng nhập, Supabase Auth hoặc Storage không cần thiết. Mọi người vẫn vào được trang. Quyền quản lý từng link mật khẩu tiếp tục dùng capability token như bản gốc; không cấp công khai. Token giữ trong browser và backup riêng tư, không lưu password.

Sao lưu / Nhập chuyển danh sách và khóa sang browser/domain mới. Mất cookie không xóa database nhưng cần backup để lấy lại danh sách ở phiên mới. Không có đồng bộ tài khoản qua thiết bị khi chưa có hệ thống account.

## Mật khẩu

Giữ đặt/đổi/tắt và quên mật khẩu. Băm PBKDF2-SHA256, salt, 100000 vòng; import giữ hash gốc. Reset link hết hạn 15 phút, dùng một lần. Email gửi link reset, không gửi mật khẩu cũ. Thiếu cấu hình email: báo lỗi rõ ràng.

Chia sẻ /p/:id trên domain mới sau khi import database. Chỉ bảo vệ mở qua Lovely; URL gốc vẫn mở được nếu website đích không tự kiểm soát truy cập.

URL chatgpt.site là dữ liệu liên kết, được giữ nguyên. Lovely độc lập không tự chuyển Galaxy, Media Hub hoặc các website đích sang hosting khác.

## Dịch vụ cần

Vercel hoặc hosting Node; Supabase/PostgreSQL của bạn; Resend chỉ khi cần email. Runtime mới không bắt buộc gọi API/database/storage/auth của ChatGPT. source-original chỉ để đối chiếu.

Đọc DEPLOY-VERCEL.md, BACKUP-RESTORE.md, MIGRATION-NOTES.md và VERIFICATION.md.
