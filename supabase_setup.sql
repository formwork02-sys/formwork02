-- 1. settings 테이블 생성
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- 2. 기본 비밀번호 삽입 (entry: "1234", admin: "1111")
--    값은 각 비밀번호의 SHA-256 해시
INSERT INTO settings (key, value) VALUES
  ('entry_password_hash', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4'),
  ('admin_password_hash',  '0ffe1abd1a08215353c233d6e009613e95eec4253832a761af28ff37ac5a150c')
ON CONFLICT (key) DO NOTHING;

-- 3. RLS 활성화
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- 4. 읽기 허용 (anon 포함 — 해시값만 노출, 평문 아님)
CREATE POLICY "allow_read" ON settings
  FOR SELECT USING (true);

-- 5. 수정 허용 (anon 포함 — 현재 비밀번호 검증은 앱 레이어에서 처리)
CREATE POLICY "allow_update" ON settings
  FOR UPDATE USING (true);
