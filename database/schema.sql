-- Giữ tên cột và thuật toán mật khẩu cũ để import không đổi ID hoặc mật khẩu.
CREATE TABLE IF NOT EXISTS lovely_locks (
 id text PRIMARY KEY, title text NOT NULL, url text NOT NULL,
 owner_hash text NOT NULL, password_hash text, salt text, email text NOT NULL,
 reset_hash text, reset_expires bigint, created_at bigint NOT NULL
);
CREATE TABLE IF NOT EXISTS lovely_rates (
 id text PRIMARY KEY, count integer NOT NULL, expires bigint NOT NULL
);
CREATE TABLE IF NOT EXISTS lovely_libraries (
 id uuid PRIMARY KEY, owner_hash text NOT NULL UNIQUE,
 items jsonb NOT NULL DEFAULT '[]'::jsonb CHECK(jsonb_typeof(items)='array'),
 version integer NOT NULL DEFAULT 1,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lovely_rates_expiry ON lovely_rates(expires);
-- Chỉ server truy cập qua DATABASE_URL; không mở dữ liệu ra Supabase anon API.
ALTER TABLE lovely_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE lovely_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE lovely_libraries ENABLE ROW LEVEL SECURITY;
