-- Migration: Add service_features and service_team_features tables
-- Date: 2026-05-21

CREATE TABLE IF NOT EXISTS service_features (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name_zh      VARCHAR(200)    NOT NULL COMMENT '服务名称（中文）',
  name_en      VARCHAR(200)    NOT NULL COMMENT '服务名称（英文）',
  intro_zh     TEXT            DEFAULT NULL COMMENT '服务简介（中文）',
  intro_en     TEXT            DEFAULT NULL COMMENT '服务简介（英文）',
  image_url    VARCHAR(500)    DEFAULT NULL COMMENT '简介图片',
  sort_order   INT             NOT NULL DEFAULT 0,
  is_active    TINYINT(1)      NOT NULL DEFAULT 1,
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='服务功能表';

CREATE TABLE IF NOT EXISTS service_team_features (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  service_team_id    BIGINT UNSIGNED NOT NULL COMMENT '关联 service_teams.id',
  service_feature_id BIGINT UNSIGNED NOT NULL COMMENT '关联 service_features.id',
  PRIMARY KEY (id),
  UNIQUE KEY uk_team_feature (service_team_id, service_feature_id),
  KEY idx_team    (service_team_id),
  KEY idx_feature (service_feature_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='服务团队与服务功能关联表';

-- Footer contact config (INSERT IGNORE to avoid duplicate key errors on re-run)
INSERT IGNORE INTO site_configs (config_key, value_zh, value_en, description) VALUES
  ('footer_contact_person', '国际医疗中心', 'International Medical Center', 'Footer 合作联系人'),
  ('footer_contact_info',   '025-83169988', '025-83169988',                 'Footer 合作联系方式');
