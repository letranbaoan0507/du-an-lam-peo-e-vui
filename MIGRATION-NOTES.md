# Biên bản chuyển Lovely

## Nguồn

Project appgprj_6ab6dc8462e88191b0f260712cbea02b; Lovely tại https://du-an-lam-pe-e-vui.bett-yrobinsonw870.chatgpt.site/.

Phiên bản 4, commit 651edd2fa9c4985e52658dcccb6b3a710dbae752. source-original giữ toàn source, Worker, schema/migrations Drizzle, package/config và tests.

Không xử lý source/database/upload của Galaxy, Media Hub hoặc Video sang MP3. Các tên đó chỉ có thể xuất hiện như URL dữ liệu liên kết. Không sửa/deploy/xóa Lovely online trong lần xuất này.

## Dữ liệu kiểm tra được

| Nơi cũ | Dữ liệu | Trạng thái |
| --- | --- | --- |
| Source | Seed Galaxy Tình Yêu, tên/category/description/URL; giao diện/backend | Sao lưu đầy đủ |
| Browser lovely-websites-v1 | Danh sách theo browser, ID, thứ tự, metadata, URL | Chưa truy cập browser của bạn; cần export thủ công |
| Browser lovely-lock-owners-v1 | Khóa quản lý link | Chưa export; D1 chỉ có hash |
| D1 DB.lovely_locks | 1 record link; mật khẩu hiện đang tắt | Export đầy đủ; giữ ID/URL/email/hash/timestamp |
| D1 DB.lovely_rates | 3 counters tạm tại thời điểm đọc | Backup; không import counters hết hạn |
| Storage/upload | Không có trong source Lovely | Không có upload phải migrate |
| Account/login | Site public, Lovely không có account app | Không có bảng account để migrate |
| Font Google | Baloo 2 bốn trọng lượng | Tải vào public/assets/fonts cùng OFL, tự host |

D1 exports: database/exports/sites-locks.json và sites-rates.json. Đây là backup file trên máy, không phải storage runtime. Không có password plaintext/API secret, nhưng có email/hash; gitignore loại khỏi repo.

## Thay đổi kỹ thuật

- Worker/D1 → Next API/Node/PostgreSQL; giữ /api/locks.
- SQLite placeholders → PostgreSQL adapter, conflict counter đúng PostgreSQL.
- Browser-only list → PostgreSQL JSONB, cookie HttpOnly, version chống ghi đè từ tab cũ.
- /p/:id, /reset/:id → Next rewrites về HTML gốc.
- Google Fonts → font tự host.
- Sao lưu / Nhập phục vụ chuyển domain. Giữ màu, thẻ, hiệu ứng và CSS gốc; chỉ thay chữ cần phản ánh lưu cloud.

Owner/editor/viewer không tồn tại trong Lovely gốc, không tự thêm. Hash capability owner từng link được giữ đúng. Quản lý khóa cần token gốc hoặc reset qua email đã cấu hình.

## Chuyển browser data

1. Mở Lovely cũ trên đúng browser đã lưu website.
2. F12 → Console.
3. Mở scripts/export-browser.js bằng Notepad, đọc rồi copy vào Console và Enter. Nếu browser chặn dán, đọc cảnh báo và chỉ chạy sau khi tự kiểm tra script. Script chỉ đọc hai khóa Lovely, tải JSON xuống, không sửa dữ liệu cũ.
4. Giữ lovely-browser-backup.json riêng tư vì có khóa quản lý.
5. Tạo Supabase, migrate và import D1 theo DEPLOY-VERCEL.md.
6. Lovely mới → Sao lưu / Nhập → Nhập bản sao lưu → chọn JSON.
7. Giữ ID có sẵn, tên/URL/thứ tự/metadata. Chỉ tạo ID nếu dữ liệu cũ chưa có ID.
8. Kiểm tra từng link; /p/:id dùng host mới, URL đích giữ nguyên.

Không thể tự export localStorage bằng source server/D1. Browser của trợ lý không phải browser chứa dữ liệu của bạn; không coi seed là toàn danh sách của bạn.

## Chưa hoàn thành

- Chưa nhập danh sách/owner tokens từ browser của bạn.
- D1 export được thử import vào PostgreSQL engine local, chưa nhập Supabase thật.
- Chưa deploy vào GitHub/Vercel của bạn; chưa có public domain độc lập đã xác minh.
- Chưa gửi email thật; cần Resend key/verified sender.
- Chưa test TLS Supabase thật và persistence sau redeploy Vercel.
- Chưa visual QA mobile trong browser thật cho bản độc lập; CSS responsive gốc và HTTP/DOM checks đã kiểm tra.

Link đích vẫn phụ thuộc hosting website đích. Lovely khóa link của mình, không khóa URL gốc. Không xóa Sites trước khi hoàn tất cloud và browser import.
