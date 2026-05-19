-- ============================================================
-- 国际医疗项目 数据库初始化脚本
-- 数据库: international_medical
-- 字符集: utf8mb4
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
  code      VARCHAR(20)      NOT NULL COMMENT 'user | admin',
  name_zh   VARCHAR(50)      NOT NULL,
  name_en   VARCHAR(50)      NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色表';

-- ============================================================
-- 用户表（C端 + 管理员共用，通过 role_id 区分）
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id              BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  role_id         TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '1=user 2=admin',
  first_name      VARCHAR(100)     DEFAULT NULL COMMENT '名',
  last_name       VARCHAR(100)     DEFAULT NULL COMMENT '姓',
  gender          VARCHAR(10)      DEFAULT NULL COMMENT 'male | female | other',
  email           VARCHAR(200)     NOT NULL,
  phone           VARCHAR(50)      DEFAULT NULL COMMENT '联系方式',
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
  sort_order       INT             NOT NULL DEFAULT 0,
  is_active        TINYINT(1)      NOT NULL DEFAULT 1,
  created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='医院表';

-- ============================================================
-- 医院轮播图表（Banner / 宣传图）
-- ============================================================
CREATE TABLE IF NOT EXISTS hospital_banners (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  hospital_id  BIGINT UNSIGNED NOT NULL,
  image_url    VARCHAR(500)    NOT NULL,
  sort_order   INT             NOT NULL DEFAULT 0,
  is_active    TINYINT(1)      NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  KEY idx_hospital (hospital_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='医院轮播图';

-- ============================================================
-- 医疗设备表
-- ============================================================
CREATE TABLE IF NOT EXISTS equipments (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  hospital_id  BIGINT UNSIGNED NOT NULL,
  name_zh      VARCHAR(200)    NOT NULL,
  name_en      VARCHAR(200)    NOT NULL,
  desc_zh      TEXT            DEFAULT NULL,
  desc_en      TEXT            DEFAULT NULL,
  image_url    VARCHAR(500)    DEFAULT NULL,
  sort_order   INT             NOT NULL DEFAULT 0,
  is_active    TINYINT(1)      NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  KEY idx_hospital (hospital_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='医疗设备表';

-- ============================================================
-- 医院诊疗环境表
-- ============================================================
CREATE TABLE IF NOT EXISTS hospital_environments (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  hospital_id  BIGINT UNSIGNED NOT NULL,
  name_zh      VARCHAR(200)    NOT NULL,
  name_en      VARCHAR(200)    NOT NULL,
  desc_zh      TEXT            DEFAULT NULL,
  desc_en      TEXT            DEFAULT NULL,
  image_url    VARCHAR(500)    DEFAULT NULL,
  sort_order   INT             NOT NULL DEFAULT 0,
  is_active    TINYINT(1)      NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  KEY idx_hospital (hospital_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='医院诊疗环境表';

-- ============================================================
-- 医生表
-- ============================================================
CREATE TABLE IF NOT EXISTS doctors (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  hospital_id     BIGINT UNSIGNED NOT NULL,
  name_zh         VARCHAR(100)    NOT NULL,
  name_en         VARCHAR(100)    NOT NULL,
  specialty_zh    VARCHAR(200)    NOT NULL COMMENT '专业/科室',
  specialty_en    VARCHAR(200)    NOT NULL,
  bio_zh          TEXT            DEFAULT NULL,
  bio_en          TEXT            DEFAULT NULL,
  photo_url       VARCHAR(500)    DEFAULT NULL,
  price_per_visit DECIMAL(10,2)   DEFAULT NULL COMMENT '元/次',
  title_zh        VARCHAR(100)    DEFAULT NULL COMMENT '职称',
  title_en        VARCHAR(100)    DEFAULT NULL,
  sort_order      INT             NOT NULL DEFAULT 0,
  is_active       TINYINT(1)      NOT NULL DEFAULT 1,
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_hospital (hospital_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='医生表';

-- ============================================================
-- 成功案例表
-- ============================================================
CREATE TABLE IF NOT EXISTS cases (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  hospital_id     BIGINT UNSIGNED DEFAULT NULL COMMENT '关联医院（可为空）',
  title_zh        VARCHAR(300)    NOT NULL,
  title_en        VARCHAR(300)    NOT NULL,
  summary_zh      TEXT            DEFAULT NULL,
  summary_en      TEXT            DEFAULT NULL,
  cover_image_url VARCHAR(500)    DEFAULT NULL,
  sort_order      INT             NOT NULL DEFAULT 0,
  is_active       TINYINT(1)      NOT NULL DEFAULT 1,
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_hospital (hospital_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='成功案例表';

-- ============================================================
-- 特需产品表
-- ============================================================
CREATE TABLE IF NOT EXISTS special_products (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  hospital_id     BIGINT UNSIGNED DEFAULT NULL COMMENT '归属医院',
  name_zh         VARCHAR(200)    NOT NULL,
  name_en         VARCHAR(200)    NOT NULL,
  summary_zh      TEXT            DEFAULT NULL COMMENT '列表页摘要',
  summary_en      TEXT            DEFAULT NULL,
  detail_zh       LONGTEXT        DEFAULT NULL COMMENT '详情富文本',
  detail_en       LONGTEXT        DEFAULT NULL,
  cover_image_url VARCHAR(500)    DEFAULT NULL,
  price_min       DECIMAL(10,2)   DEFAULT NULL,
  price_max       DECIMAL(10,2)   DEFAULT NULL,
  contact_person  VARCHAR(100)    DEFAULT NULL,
  contact_info    VARCHAR(200)    DEFAULT NULL,
  sort_order      INT             NOT NULL DEFAULT 0,
  is_active       TINYINT(1)      NOT NULL DEFAULT 1,
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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
-- 浏览/预约记录表
-- ============================================================
CREATE TABLE IF NOT EXISTS browse_history (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id         BIGINT UNSIGNED NOT NULL,
  target_type     ENUM('hospital','product') NOT NULL,
  target_id       BIGINT UNSIGNED NOT NULL,
  target_name_zh  VARCHAR(300)    NOT NULL COMMENT '快照：中文名',
  target_name_en  VARCHAR(300)    NOT NULL COMMENT '快照：英文名',
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_user (user_id),
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
-- 实体媒体资源表（医院/医生/产品 的图片和视频）
-- ============================================================
CREATE TABLE IF NOT EXISTS entity_media (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  entity_type  VARCHAR(20)     NOT NULL COMMENT 'hospital | doctor | product',
  entity_id    BIGINT UNSIGNED NOT NULL,
  media_type   VARCHAR(10)     NOT NULL COMMENT 'image | video',
  url          VARCHAR(500)    NOT NULL,
  is_cover     TINYINT(1)      NOT NULL DEFAULT 0 COMMENT '1=主图，用于列表展示',
  sort_order   INT             NOT NULL DEFAULT 0,
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_entity (entity_type, entity_id),
  KEY idx_cover  (entity_type, entity_id, is_cover)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='实体媒体资源表';

-- ============================================================
-- 邮箱验证码表
-- ============================================================
CREATE TABLE IF NOT EXISTS email_verify_codes (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email       VARCHAR(200)    NOT NULL,
  code        VARCHAR(10)     NOT NULL,
  is_used     TINYINT(1)      NOT NULL DEFAULT 0,
  expired_at  DATETIME        NOT NULL,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='邮箱验证码';
