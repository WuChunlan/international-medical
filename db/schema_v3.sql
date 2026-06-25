-- ============================================================
-- 国际医疗项目 数据库脚本 v3
-- 基于 schema.sql + migration_v2 整合优化
-- 优化点：
--   1. cases 补充 detail_zh/en、updated_at
--   2. 删除 hospital_banners（合并入 entity_media，type='banner'）
--   3. entity_media.entity_type 改为 ENUM
--   4. browse_history.target_type 枚举扩展
--   5. users 直接含 hospital_id（无需 ALTER）
--   6. 六张业务表 audit_status 直接包含（无需 migration）
--   7. service_team_features 添加外键约束
--   8. email_verify_codes 添加 idx_expired 索引
-- ============================================================

CREATE DATABASE IF NOT EXISTS international_medical
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE international_medical;

-- ============================================================
-- 角色表
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
  id        TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code      VARCHAR(20)      NOT NULL COMMENT 'user | admin | hospital_admin | reviewer',
  name_zh   VARCHAR(50)      NOT NULL,
  name_en   VARCHAR(50)      NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色表';

-- ============================================================
-- 用户表（C端 + 管理端共用，role_id 区分）
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id              BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  role_id         TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '1=user 2=admin 3=hospital_admin 4=reviewer',
  hospital_id     BIGINT UNSIGNED  DEFAULT NULL COMMENT '绑定医院ID（hospital_admin/reviewer）',
  first_name      VARCHAR(100)     DEFAULT NULL COMMENT '名',
  last_name       VARCHAR(100)     DEFAULT NULL COMMENT '姓',
  gender          VARCHAR(10)      DEFAULT NULL COMMENT 'male | female | other',
  email           VARCHAR(200)     NOT NULL,
  phone           VARCHAR(50)      DEFAULT NULL,
  password_hash   VARCHAR(255)     NOT NULL COMMENT 'bcrypt',
  id_card_number  VARCHAR(200)     DEFAULT NULL COMMENT '身份证号',
  passport_number VARCHAR(200)     DEFAULT NULL COMMENT '护照号',
  id_card_country VARCHAR(100)     DEFAULT NULL COMMENT '证件签发国',
  is_active       TINYINT(1)       NOT NULL DEFAULT 1,
  created_at      DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ============================================================
-- 医院表
-- ============================================================
CREATE TABLE IF NOT EXISTS hospitals (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name_zh          VARCHAR(200)    NOT NULL,
  name_en          VARCHAR(200)    NOT NULL,
  intro_zh         TEXT            NOT NULL COMMENT '中文简介',
  intro_en         TEXT            NOT NULL COMMENT '英文简介',
  cover_image_url  VARCHAR(500)    DEFAULT NULL COMMENT '封面图',
  video_url        VARCHAR(500)    DEFAULT NULL COMMENT '宣传视频',
  address_zh       VARCHAR(300)    DEFAULT NULL,
  address_en       VARCHAR(300)    DEFAULT NULL,
  phone            VARCHAR(100)    DEFAULT NULL,
  contact_person   VARCHAR(100)    DEFAULT NULL COMMENT '预约联系人',
  contact_info     VARCHAR(200)    DEFAULT NULL COMMENT '联系方式',
  audit_status     ENUM('pending','approved','rejected') NOT NULL DEFAULT 'approved' COMMENT '审核状态',
  rejection_reason TEXT            DEFAULT NULL COMMENT '审核拒绝原因',
  sort_order       INT             NOT NULL DEFAULT 0,
  is_active        TINYINT(1)      NOT NULL DEFAULT 1,
  created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='医院表';

-- ============================================================
-- 医疗设备表
-- ============================================================
CREATE TABLE IF NOT EXISTS equipments (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  hospital_id      BIGINT UNSIGNED NOT NULL,
  name_zh          VARCHAR(200)    NOT NULL,
  name_en          VARCHAR(200)    NOT NULL,
  desc_zh          TEXT            DEFAULT NULL,
  desc_en          TEXT            DEFAULT NULL,
  image_url        VARCHAR(500)    DEFAULT NULL,
  audit_status     ENUM('pending','approved','rejected') NOT NULL DEFAULT 'approved',
  rejection_reason TEXT            DEFAULT NULL,
  sort_order       INT             NOT NULL DEFAULT 0,
  is_active        TINYINT(1)      NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  KEY idx_hospital (hospital_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='医疗设备表';

-- ============================================================
-- 医院诊疗环境表
-- ============================================================
CREATE TABLE IF NOT EXISTS hospital_environments (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  hospital_id      BIGINT UNSIGNED NOT NULL,
  name_zh          VARCHAR(200)    NOT NULL,
  name_en          VARCHAR(200)    NOT NULL,
  desc_zh          TEXT            DEFAULT NULL,
  desc_en          TEXT            DEFAULT NULL,
  image_url        VARCHAR(500)    DEFAULT NULL,
  audit_status     ENUM('pending','approved','rejected') NOT NULL DEFAULT 'approved',
  rejection_reason TEXT            DEFAULT NULL,
  sort_order       INT             NOT NULL DEFAULT 0,
  is_active        TINYINT(1)      NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  KEY idx_hospital (hospital_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='医院诊疗环境表';

-- ============================================================
-- 医生表
-- ============================================================
CREATE TABLE IF NOT EXISTS doctors (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  hospital_id      BIGINT UNSIGNED NOT NULL,
  name_zh          VARCHAR(100)    NOT NULL,
  name_en          VARCHAR(100)    NOT NULL,
  specialty_zh     VARCHAR(200)    NOT NULL COMMENT '专业/科室',
  specialty_en     VARCHAR(200)    NOT NULL,
  bio_zh           TEXT            DEFAULT NULL,
  bio_en           TEXT            DEFAULT NULL,
  photo_url        VARCHAR(500)    DEFAULT NULL,
  price_per_visit  DECIMAL(10,2)   DEFAULT NULL COMMENT '元/次',
  title_zh         VARCHAR(100)    DEFAULT NULL COMMENT '职称',
  title_en         VARCHAR(100)    DEFAULT NULL,
  audit_status     ENUM('pending','approved','rejected') NOT NULL DEFAULT 'approved',
  rejection_reason TEXT            DEFAULT NULL,
  sort_order       INT             NOT NULL DEFAULT 0,
  is_active        TINYINT(1)      NOT NULL DEFAULT 1,
  created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_hospital (hospital_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='医生表';

-- ============================================================
-- 成功案例表（新增 detail_zh/en 和 updated_at）
-- ============================================================
CREATE TABLE IF NOT EXISTS cases (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  hospital_id      BIGINT UNSIGNED DEFAULT NULL COMMENT '关联医院（可为空）',
  title_zh         VARCHAR(300)    NOT NULL,
  title_en         VARCHAR(300)    NOT NULL,
  summary_zh       TEXT            DEFAULT NULL COMMENT '列表摘要',
  summary_en       TEXT            DEFAULT NULL,
  detail_zh        LONGTEXT        DEFAULT NULL COMMENT '详情富文本',
  detail_en        LONGTEXT        DEFAULT NULL,
  cover_image_url  VARCHAR(500)    DEFAULT NULL,
  audit_status     ENUM('pending','approved','rejected') NOT NULL DEFAULT 'approved',
  rejection_reason TEXT            DEFAULT NULL,
  sort_order       INT             NOT NULL DEFAULT 0,
  is_active        TINYINT(1)      NOT NULL DEFAULT 1,
  created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_hospital (hospital_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='成功案例表';

-- ============================================================
-- 特需产品表
-- ============================================================
CREATE TABLE IF NOT EXISTS special_products (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  hospital_id      BIGINT UNSIGNED DEFAULT NULL COMMENT '归属医院',
  name_zh          VARCHAR(200)    NOT NULL,
  name_en          VARCHAR(200)    NOT NULL,
  summary_zh       TEXT            DEFAULT NULL COMMENT '列表页摘要',
  summary_en       TEXT            DEFAULT NULL,
  detail_zh        LONGTEXT        DEFAULT NULL COMMENT '详情富文本',
  detail_en        LONGTEXT        DEFAULT NULL,
  cover_image_url  VARCHAR(500)    DEFAULT NULL,
  price_min        DECIMAL(10,2)   DEFAULT NULL,
  price_max        DECIMAL(10,2)   DEFAULT NULL,
  contact_person   VARCHAR(100)    DEFAULT NULL,
  contact_info     VARCHAR(200)    DEFAULT NULL,
  audit_status     ENUM('pending','approved','rejected') NOT NULL DEFAULT 'approved',
  rejection_reason TEXT            DEFAULT NULL,
  sort_order       INT             NOT NULL DEFAULT 0,
  is_active        TINYINT(1)      NOT NULL DEFAULT 1,
  created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_hospital (hospital_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='特需产品表';

-- ============================================================
-- 产品细分套餐表
-- ============================================================
CREATE TABLE IF NOT EXISTS product_variants (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id  BIGINT UNSIGNED NOT NULL,
  name_zh     VARCHAR(200)    NOT NULL,
  name_en     VARCHAR(200)    NOT NULL,
  desc_zh     TEXT            DEFAULT NULL,
  desc_en     TEXT            DEFAULT NULL,
  price       DECIMAL(10,2)   DEFAULT NULL,
  sort_order  INT             NOT NULL DEFAULT 0,
  is_active   TINYINT(1)      NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  KEY idx_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='产品细分套餐';

-- ============================================================
-- 服务团队表
-- ============================================================
CREATE TABLE IF NOT EXISTS service_teams (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name_zh      VARCHAR(200)    NOT NULL,
  name_en      VARCHAR(200)    NOT NULL,
  intro_zh     TEXT            DEFAULT NULL,
  intro_en     TEXT            DEFAULT NULL,
  image_url    VARCHAR(500)    DEFAULT NULL,
  sort_order   INT             NOT NULL DEFAULT 0,
  is_active    TINYINT(1)      NOT NULL DEFAULT 1,
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='服务团队表';

-- ============================================================
-- 服务亮点表（首页展示）
-- ============================================================
CREATE TABLE IF NOT EXISTS service_features (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name_zh     VARCHAR(200)    NOT NULL,
  name_en     VARCHAR(200)    NOT NULL,
  intro_zh    TEXT            DEFAULT NULL,
  intro_en    TEXT            DEFAULT NULL,
  image_url   VARCHAR(500)    DEFAULT NULL COMMENT '图标或图片URL',
  sort_order  INT             NOT NULL DEFAULT 0,
  is_active   TINYINT(1)      NOT NULL DEFAULT 1,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='服务亮点表';

-- ============================================================
-- 服务团队-亮点关联表（多对多）
-- ============================================================
CREATE TABLE IF NOT EXISTS service_team_features (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  service_team_id    BIGINT UNSIGNED NOT NULL,
  service_feature_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  KEY idx_team    (service_team_id),
  KEY idx_feature (service_feature_id),
  CONSTRAINT fk_stf_team    FOREIGN KEY (service_team_id)    REFERENCES service_teams    (id) ON DELETE CASCADE,
  CONSTRAINT fk_stf_feature FOREIGN KEY (service_feature_id) REFERENCES service_features (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='服务团队-亮点关联表';

-- ============================================================
-- 浏览/预约记录表（target_type 枚举扩展）
-- ============================================================
CREATE TABLE IF NOT EXISTS browse_history (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id         BIGINT UNSIGNED NOT NULL,
  target_type     ENUM('hospital','product','doctor','case') NOT NULL,
  target_id       BIGINT UNSIGNED NOT NULL,
  target_name_zh  VARCHAR(300)    NOT NULL COMMENT '快照：中文名',
  target_name_en  VARCHAR(300)    NOT NULL COMMENT '快照：英文名',
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_user    (user_id),
  KEY idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='浏览预约记录';

-- ============================================================
-- 网站全局配置表
-- ============================================================
CREATE TABLE IF NOT EXISTS site_configs (
  id          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  config_key  VARCHAR(100)    NOT NULL COMMENT '配置键',
  value_zh    VARCHAR(2000)   DEFAULT NULL,
  value_en    VARCHAR(2000)   DEFAULT NULL,
  description VARCHAR(200)    DEFAULT NULL,
  updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='网站配置表';

-- ============================================================
-- 实体媒体资源表（entity_type 改为 ENUM，banner 替代 hospital_banners）
-- ============================================================
CREATE TABLE IF NOT EXISTS entity_media (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  entity_type  ENUM('hospital','doctor','product','case','equipment','environment','team') NOT NULL,
  entity_id    BIGINT UNSIGNED NOT NULL,
  media_type   ENUM('image','video','banner') NOT NULL DEFAULT 'image',
  url          VARCHAR(500)    NOT NULL,
  is_cover     TINYINT(1)      NOT NULL DEFAULT 0 COMMENT '1=主图，用于列表展示',
  sort_order   INT             NOT NULL DEFAULT 0,
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_entity (entity_type, entity_id),
  KEY idx_cover  (entity_type, entity_id, is_cover)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='实体媒体资源表';

-- ============================================================
-- 邮箱验证码表（添加 idx_expired 索引）
-- ============================================================
CREATE TABLE IF NOT EXISTS email_verify_codes (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email       VARCHAR(200)    NOT NULL,
  code        VARCHAR(10)     NOT NULL,
  is_used     TINYINT(1)      NOT NULL DEFAULT 0,
  expired_at  DATETIME        NOT NULL,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_email   (email),
  KEY idx_expired (expired_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='邮箱验证码';

-- ============================================================
-- 角色初始数据
-- ============================================================
INSERT IGNORE INTO roles (id, code, name_zh, name_en) VALUES
(1, 'user',           '普通用户',   'User'),
(2, 'admin',          '管理员',     'Administrator'),
(3, 'hospital_admin', '医院管理员', 'Hospital Admin'),
(4, 'reviewer',       '信息审核员', 'Reviewer');

-- ============================================================
-- 默认账号（密码均为 bcrypt，admin=12345, reviewer=reviewer123）
-- ============================================================
INSERT IGNORE INTO users (role_id, email, password_hash, is_active) VALUES
(2, 'admin@international-medical.com',
 '$2b$12$xgnu7nWrPpzCBUjI.6Tlk.Ee5KRApTjXm3ALfdnsoD7aTg5BHamEu', 1),
(4, 'reviewer@international-medical.com',
 '$2b$12$Xj0E3MAl7xoKxVUPz2tVlu7iid0KLNVQaVpcSTx77ANDxRhsp3KbC', 1);

-- ============================================================
-- 网站全局配置初始数据
-- ============================================================
INSERT IGNORE INTO site_configs (config_key, value_zh, value_en, description) VALUES
('site_name', '国际医疗', 'International Medical', '网站名称'),
('site_subtitle', '为全球患者提供高品质中国医疗服务', 'Providing World-Class Chinese Medical Services to Global Patients', '网站副标题'),
('site_logo_url', '', '', '网站Logo图片URL（留空则使用文字Logo）'),
('site_intro', '国际医疗项目致力于为全球患者提供高品质的中国医疗服务，汇聚国内顶尖医院与专家资源，为您的健康保驾护航。', 'The International Medical Program is dedicated to providing high-quality Chinese medical services to patients worldwide, bringing together top hospitals and expert resources in China.', '首页项目简介'),
('contact_default_person', '国际医疗中心', 'International Medical Center', '默认预约联系人'),
('contact_default_info',   '025-83169988', '025-83169988', '默认联系方式'),
('translate_provider', 'mymemory', 'mymemory', '翻译服务商：mymemory 或 deepl'),
('translate_api_key', '', '', '翻译API Key（MyMemory可留空；DeepL填写Auth Key）'),
('upload_base_path', '/Users/wuchunlan/Desktop/医疗平台媒体资源', '/Users/wuchunlan/Desktop/医疗平台媒体资源', '文件上传根目录'),
('upload_base_url', 'http://localhost:8080/media', 'http://localhost:8080/media', '文件访问URL前缀'),
('upload_max_size_mb', '50', '50', '单文件最大上传大小（MB）'),
('upload_allowed_image_types', 'jpg,jpeg,png,webp,gif', 'jpg,jpeg,png,webp,gif', '允许上传的图片格式'),
('upload_allowed_video_types', 'mp4,mov,avi,webm', 'mp4,mov,avi,webm', '允许上传的视频格式'),
('db_host', 'localhost', 'localhost', '数据库主机'),
('db_port', '3306', '3306', '数据库端口'),
('db_name', 'international_medical', 'international_medical', '数据库名称'),
('db_username', 'root', 'root', '数据库用户名'),
('redis_host', 'localhost', 'localhost', 'Redis 主机'),
('redis_port', '6379', '6379', 'Redis 端口'),
('redis_database', '0', '0', 'Redis 数据库编号'),
('mail_host', 'smtp.example.com', 'smtp.example.com', 'SMTP 服务器地址'),
('mail_port', '587', '587', 'SMTP 端口'),
('mail_username', 'noreply@example.com', 'noreply@example.com', '发件人邮箱'),
('jwt_expiration_hours', '24', '24', 'C端 JWT 有效期（小时）'),
('jwt_admin_expiration_hours', '8', '8', '管理端 JWT 有效期（小时）');
