# Lovely

Trang được mở công khai; không yêu cầu đăng nhập tài khoản ChatGPT. Danh sách website vẫn lưu trong trình duyệt như phiên bản trước. Nút Xóa chỉ xóa mục trong danh sách, không xóa website đích.

## Mật khẩu cho link Lovely

Chọn Đặt mật khẩu trên một thẻ, nhập mật khẩu và email khôi phục. Chia sẻ link `/p/:id` được tạo. Khóa quản lý được giữ trong trình duyệt đã tạo, mật khẩu được băm PBKDF2 và lưu trong D1. Tắt mật khẩu vẫn giữ link hoạt động. Xóa một mục có khóa quản lý cũng thu hồi link Lovely của mục đó.

**Phạm vi bảo vệ:** chỉ kiểm soát mở qua link Lovely, không chặn truy cập trực tiếp URL gốc của website bên ngoài. Để bảo vệ website gốc, cần tích hợp xác thực ở chính website đó. Mật khẩu không được gửi qua email; chỉ gửi link đặt lại dùng một lần, hết hạn 15 phút.

## Email khôi phục

Cấu hình runtime environment của Sites: `RESEND_API_KEY`, `EMAIL_FROM` (địa chỉ gửi thuộc domain đã xác minh tại Resend). Không đưa khóa API vào mã nguồn hoặc frontend. Deploy lại sau khi cấu hình. Nếu thiếu cấu hình hoặc dịch vụ gửi thất bại, giao diện hiển thị lỗi rõ ràng và không báo gửi thành công.

## Phát triển

`npm install`, `npm test`, `npm run db:generate` khi đổi schema, `npm run build`.

Worker: `dist/server/index.js`, hosting manifest `dist/.openai/hosting.json`. Database D1 binding `DB`; migration Drizzle trong `drizzle/` được hệ thống triển khai áp dụng. Không sửa dữ liệu của website đích. Không lưu password plaintext. Cần sao lưu D1 và giữ khóa quản lý trình duyệt; email khôi phục cần cấu hình trước khi dựa vào nó.
