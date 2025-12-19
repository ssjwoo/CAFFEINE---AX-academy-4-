-- 관리자 설정 테이블 생성
-- admin_settings 테이블은 관리자 대시보드의 알림 및 시스템 설정을 저장합니다.

CREATE TABLE IF NOT EXISTS admin_settings (
    id BIGSERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성 (key로 빠른 조회)
CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON admin_settings(key);

-- 기본 설정 값 삽입
INSERT INTO admin_settings (key, value) VALUES
    ('notification.anomaly_detection', 'true'),
    ('notification.reports', 'true'),
    ('notification.threshold', '1000000'),
    ('notification.recipient_email', 'null')
ON CONFLICT (key) DO NOTHING;
