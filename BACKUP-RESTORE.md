# Backup và restore

Giữ ba phần: source GitHub/ZIP; PostgreSQL database; browser backup chứa danh sách/khóa quản lý. Browser backup phải riêng tư, không đưa lên GitHub.

Lovely không upload file/object storage; preview thẻ là CSS và font đã nằm trong source.

## Database backup

Điền .env.local rồi chạy:

~~~bash
npm run db:backup
~~~

File nằm trong backups/ trên máy chạy lệnh, không trên Vercel. Snapshot dùng transaction repeatable-read/read-only. File chứa email/hash quyền, nên mã hóa hoặc giữ riêng tư. Không chứa DATABASE_URL.

Tên file tùy chọn:

~~~bash
npm run db:backup -- backups/lovely-safe-copy.json
~~~

Đây là backup dữ liệu app. Backup toàn database/roles/extensions: dùng Supabase Database Backups hoặc pg_dump theo dịch vụ. Kiểm tra retention của gói bạn dùng; không mặc định gói miễn phí backup lâu dài.

## Restore

1. Tạo PostgreSQL mới, cập nhật DATABASE_URL/CA trên máy.
2. Chạy npm run db:migrate.
3. Database ứng dụng đích phải trống.
4. Chạy:

~~~bash
npm run db:restore -- backups/lovely-safe-copy.json
~~~

Script dừng và rollback khi bảng đã có dữ liệu. Không xóa hoặc ghi đè database hiện hữu. Với D1 lần đầu, dùng db:import thay vì restore.

5. Cập nhật env hosting sang database mới; giữ APP_URL/domain nếu có.
6. Kiểm tra đầy đủ trước khi đóng database cũ.

Đổi domain không tự chuyển cookie/localStorage. Ở domain cũ tải Sao lưu / Nhập → Tải bản sao lưu; ở domain mới Nhập bản sao lưu. Database chỉ lưu hash quản lý nên không thể lấy token gốc từ server. Với browser dữ liệu Sites, dùng export-browser.js theo MIGRATION-NOTES.md.

## Chuyển hosting

Project chạy Node.js + PostgreSQL, không dùng API Vercel độc quyền:

~~~bash
npm ci
npm run build
npm start
~~~

Trên mạng/container: npm start -- --hostname 0.0.0.0 --port 3000; reverse proxy HTTPS; APP_URL đúng domain; env database/email.

Giữ domain riêng thì /p/:id không đổi. Đổi domain thì giữ ID, chia sẻ host mới. Link chatgpt.site cũ không thể sống độc lập nếu Sites ngừng phục vụ domain đó. Không deploy source-original; đó là bản đối chiếu.
