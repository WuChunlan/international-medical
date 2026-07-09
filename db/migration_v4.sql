-- v4: 客户代表邀请与归属
USE international_medical;

ALTER TABLE users
  ADD COLUMN invite_code  VARCHAR(16) DEFAULT NULL COMMENT '邀请码，仅客户代表(role_id=5)有值' AFTER hospital_id,
  ADD COLUMN can_invite   TINYINT(1)  NOT NULL DEFAULT 1 COMMENT '客户代表邀请开关：1=生效 0=失效' AFTER invite_code,
  ADD COLUMN referred_by  BIGINT UNSIGNED DEFAULT NULL COMMENT '归属客户代表 user_id，仅普通客户有值' AFTER can_invite,
  ADD UNIQUE KEY uk_invite_code (invite_code),
  ADD KEY idx_referred_by (referred_by);

INSERT IGNORE INTO roles (id, code, name_zh, name_en) VALUES
  (5, 'customer_rep', '客户代表', 'Customer Rep');

INSERT IGNORE INTO site_configs (config_key, value_zh, value_en, description) VALUES
  ('site_a_base_url', 'http://localhost:3000', 'http://localhost:3000', '客户代表邀请二维码指向的注册站点基地址');
