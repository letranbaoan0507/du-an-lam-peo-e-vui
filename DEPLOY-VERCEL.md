# GitHub → Vercel

## 1. Tạo PostgreSQL

1. Tạo tài khoản/project tại https://supabase.com/dashboard. Giữ password database riêng tư.
2. Chọn region phù hợp, ví dụ Singapore nếu có.
3. Bấm Connect → Transaction pooler → copy PostgreSQL connection string, thay password thật. URL-encode phần password nếu có ký tự đặc biệt.
4. Dán vào DATABASE_URL trong .env.local.
5. Nếu lỗi CA/TLS, lấy SSL CA certificate từ Database Settings rồi dán PEM vào DATABASE_SSL_CA. Mã xác minh TLS; không tắt xác minh chứng chỉ.
6. APP_URL local: http://localhost:3000.
7. Chạy:

~~~bash
npm install
npm run db:migrate
npm run db:import
npm run dev
~~~

Migration tạo lovely_locks, lovely_rates, lovely_libraries. RLS bật, không có policy công khai. Backend dùng kết nối database có quyền đọc/ghi, thông thường role postgres do Supabase cung cấp. Không đưa connection string ra frontend.

Import D1 chỉ một lần trên database trống. Script từ chối ghi đè ID. Danh sách browser nhập theo MIGRATION-NOTES.md.

Không cần Supabase Storage/Auth vì Lovely này không upload và không có login app.

## 2. GitHub

Tạo repository Private tại https://github.com/new. Trong thư mục dự án:

~~~bash
git init
git add .
git status
git commit -m "Migrate existing Lovely to independent Next.js and PostgreSQL"
git branch -M main
git remote add origin https://github.com/YOUR-USER/YOUR-REPO.git
git push -u origin main
~~~

Thay YOUR-USER/YOUR-REPO đúng repo. GitHub có thể yêu cầu đăng nhập.

.gitignore loại .env.local, node_modules, .next, database/exports, backups khỏi Git. Không force-add. Nếu upload bằng giao diện web GitHub, .gitignore không tự ngăn bạn chọn file: không chọn env thật, exports, backups. Export có email/hash quản lý nên giữ riêng tư.

## 3. Vercel

1. Mở https://vercel.com/new → kết nối GitHub → chọn repo.
2. Framework: Next.js. Root Directory: thư mục có package.json; nếu upload cả thư mục vào repo, chọn Lovely-INDEPENDENT.
3. Node 24.x hoặc 22.13+ nếu còn được nền tảng hỗ trợ.
4. Build: npm run build. Install: npm ci. Output Directory để mặc định, không nhập dist/public.
5. Thêm DATABASE_URL, DATABASE_SSL_CA nếu cần vào Environment Variables Production.
6. Đặt APP_URL theo domain chính, ví dụ https://your-project.vercel.app. Lần đầu chưa biết domain: có thể bỏ APP_URL để dùng VERCEL_URL deployment, sau đó đặt APP_URL chuẩn và redeploy.
7. Deploy. Build không tự migrate/import: phải chạy các bước database trước.
8. Mở domain nhận được, nhập browser backup vào bản mới.

vercel.json cấu hình Next.js; rewrites giữ /, /p/:id, /reset/:id. API dưới /api/. Không dùng filesystem Vercel làm database.

APP_URL phải trùng domain khi gọi API ghi dữ liệu. Preview khác domain cần APP_URL tương ứng và nên dùng database test riêng; APP_URL production trên preview khác origin sẽ bị từ chối để chống CSRF.

## 4. Email reset

1. Tạo tài khoản https://resend.com.
2. Xác minh domain gửi do bạn quản lý, tạo API key.
3. Thêm RESEND_API_KEY và EMAIL_FROM vào Vercel, redeploy.
4. Tạo link thử bằng email của bạn, Quên mật khẩu, nhận email, đặt lại; link dùng lần hai phải bị từ chối.

Chưa có domain gửi? Website vẫn chạy được khi chưa bật email. Sender thử Resend chỉ dùng theo giới hạn tài khoản dịch vụ, không coi là production.

## 5. Kiểm tra cloud trước khi bỏ Sites

- Trang chủ/mobile/font, thêm/xóa, tìm kiếm, Web/App.
- Refresh và redeploy vẫn giữ list bằng cookie và cùng DATABASE_URL.
- Mở trực tiếp /p/:id; đặt/đổi/tắt mật khẩu, từ chối người không có khóa quản lý.
- Email thật, TTL, single-use.
- Không có API bắt buộc của ChatGPT.

Các bước cloud chưa chạy vì chưa có tài khoản/secret của bạn. Không xóa Sites trước khi xác minh.
