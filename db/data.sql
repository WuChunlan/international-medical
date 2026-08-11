-- international_medical.browse_history definition

CREATE TABLE `browse_history` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `target_type` enum('hospital','product') COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_id` bigint unsigned NOT NULL,
  `target_name_zh` varchar(300) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '快照：中文名',
  `target_name_en` varchar(300) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '快照：英文名',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='浏览预约记录';


-- international_medical.cases definition

CREATE TABLE `cases` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `hospital_id` bigint unsigned DEFAULT NULL COMMENT '关联医院（可为空）',
  `title_zh` varchar(300) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_en` varchar(300) COLLATE utf8mb4_unicode_ci NOT NULL,
  `summary_zh` text COLLATE utf8mb4_unicode_ci,
  `summary_en` text COLLATE utf8mb4_unicode_ci,
  `detail_zh` longtext COLLATE utf8mb4_unicode_ci,
  `detail_en` longtext COLLATE utf8mb4_unicode_ci,
  `cover_image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `audit_status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'approved' COMMENT '审核状态',
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_hospital` (`hospital_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='成功案例表';


-- international_medical.doctors definition

CREATE TABLE `doctors` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `hospital_id` bigint unsigned NOT NULL,
  `name_zh` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_en` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `specialty_zh` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '专业/科室',
  `specialty_en` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bio_zh` text COLLATE utf8mb4_unicode_ci,
  `bio_en` text COLLATE utf8mb4_unicode_ci,
  `photo_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price_per_visit` decimal(10,2) DEFAULT NULL COMMENT '元/次',
  `title_zh` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '职称',
  `title_en` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `audit_status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'approved' COMMENT '审核状态',
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_hospital` (`hospital_id`)
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='医生表';


-- international_medical.email_verify_codes definition

CREATE TABLE `email_verify_codes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_used` tinyint(1) NOT NULL DEFAULT '0',
  `expired_at` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='邮箱验证码';


-- international_medical.entity_media definition

CREATE TABLE `entity_media` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `entity_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'hospital | doctor | product',
  `entity_id` bigint unsigned NOT NULL,
  `media_type` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'image | video',
  `url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_cover` tinyint(1) NOT NULL DEFAULT '0' COMMENT '1=主图，用于列表展示',
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_entity` (`entity_type`,`entity_id`),
  KEY `idx_cover` (`entity_type`,`entity_id`,`is_cover`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='实体媒体资源表';


-- international_medical.equipments definition

CREATE TABLE `equipments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `hospital_id` bigint unsigned NOT NULL,
  `name_zh` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_en` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `desc_zh` text COLLATE utf8mb4_unicode_ci,
  `desc_en` text COLLATE utf8mb4_unicode_ci,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `audit_status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'approved' COMMENT '审核状态',
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_hospital` (`hospital_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='医疗设备表';


-- international_medical.hospital_environments definition

CREATE TABLE `hospital_environments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `hospital_id` bigint unsigned NOT NULL,
  `name_zh` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_en` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `desc_zh` text COLLATE utf8mb4_unicode_ci,
  `desc_en` text COLLATE utf8mb4_unicode_ci,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `audit_status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'approved' COMMENT '审核状态',
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_hospital` (`hospital_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='医院诊疗环境表';


-- international_medical.hospitals definition

CREATE TABLE `hospitals` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name_zh` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_en` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `intro_zh` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '中文简介',
  `intro_en` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '英文简介',
  `cover_image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '封面图',
  `address_zh` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_en` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_person` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '预约联系人',
  `contact_info` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '联系方式',
  `sort_order` int NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `audit_status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'approved' COMMENT '审核状态',
  `rejection_reason` text COLLATE utf8mb4_unicode_ci COMMENT '审核拒绝原因',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='医院表';


-- international_medical.pending_changes definition

CREATE TABLE `pending_changes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `entity_type` enum('hospitals','doctors','equipments','environments','cases','products') COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_id` bigint unsigned NOT NULL,
  `pending_data` json NOT NULL,
  `submitted_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `submitted_by` bigint unsigned NOT NULL,
  `audit_status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  `reviewed_at` datetime DEFAULT NULL,
  `reviewed_by` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_entity` (`entity_type`,`entity_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- international_medical.product_variants definition

CREATE TABLE `product_variants` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `product_id` bigint unsigned NOT NULL,
  `name_zh` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_en` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `desc_zh` text COLLATE utf8mb4_unicode_ci,
  `desc_en` text COLLATE utf8mb4_unicode_ci,
  `price` decimal(10,2) DEFAULT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `idx_product` (`product_id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='产品细分套餐';


-- international_medical.roles definition

CREATE TABLE `roles` (
  `id` tinyint unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'user | admin',
  `name_zh` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_en` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色表';


-- international_medical.service_features definition

CREATE TABLE `service_features` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name_zh` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '服务名称（中文）',
  `name_en` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '服务名称（英文）',
  `intro_zh` text COLLATE utf8mb4_unicode_ci COMMENT '服务简介（中文）',
  `intro_en` text COLLATE utf8mb4_unicode_ci COMMENT '服务简介（英文）',
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '简介图片',
  `sort_order` int NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='服务功能表';


-- international_medical.service_team_features definition

CREATE TABLE `service_team_features` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `service_team_id` bigint unsigned NOT NULL COMMENT '关联 service_teams.id',
  `service_feature_id` bigint unsigned NOT NULL COMMENT '关联 service_features.id',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_team_feature` (`service_team_id`,`service_feature_id`),
  KEY `idx_team` (`service_team_id`),
  KEY `idx_feature` (`service_feature_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='服务团队与服务功能关联表';


-- international_medical.service_teams definition

CREATE TABLE `service_teams` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name_zh` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_en` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `intro_zh` text COLLATE utf8mb4_unicode_ci,
  `intro_en` text COLLATE utf8mb4_unicode_ci,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='服务团队表';


-- international_medical.site_configs definition

CREATE TABLE `site_configs` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `config_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '配置键',
  `value_zh` varchar(2000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `value_en` varchar(2000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_key` (`config_key`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='网站配置表';


-- international_medical.special_products definition

CREATE TABLE `special_products` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `hospital_id` bigint unsigned DEFAULT NULL COMMENT '归属医院',
  `name_zh` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_en` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `summary_zh` text COLLATE utf8mb4_unicode_ci COMMENT '列表页摘要',
  `summary_en` text COLLATE utf8mb4_unicode_ci,
  `detail_zh` longtext COLLATE utf8mb4_unicode_ci COMMENT '详情富文本',
  `detail_en` longtext COLLATE utf8mb4_unicode_ci,
  `cover_image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price_min` decimal(10,2) DEFAULT NULL,
  `price_max` decimal(10,2) DEFAULT NULL,
  `contact_person` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_info` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `audit_status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'approved' COMMENT '审核状态',
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_hospital` (`hospital_id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='特需产品表';


-- international_medical.users definition

CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `role_id` tinyint unsigned NOT NULL DEFAULT '1' COMMENT '1=user 2=admin',
  `hospital_id` bigint unsigned DEFAULT NULL COMMENT '绑定医院ID（hospital_admin专用）',
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '名',
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '姓',
  `gender` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'male | female | other',
  `email` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '联系方式',
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'bcrypt',
  `id_card_number` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '身份证号',
  `passport_number` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '护照号',
  `id_card_country` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '证件签发国',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `invite_code` varchar(16) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '邀请码，仅客户代表(role_id=5)有值',
  `can_invite` tinyint(1) NOT NULL DEFAULT '1' COMMENT '客户代表邀请开关：1=邀请码生效 0=失效',
  `referred_by` bigint unsigned DEFAULT NULL COMMENT '归属的客户代表 user_id，仅普通客户有值',
  `must_change_password` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_email` (`email`),
  UNIQUE KEY `uk_invite_code` (`invite_code`),
  KEY `idx_referred_by` (`referred_by`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 多语言翻译表（扩展语种用，不改原表双列结构）
CREATE TABLE `content_translation` (
  `id`              bigint unsigned NOT NULL AUTO_INCREMENT,
  `entity_type`     varchar(50)  COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '实体类型: hospital/doctor/case/equipment/product/variant/service_team/service_feature/environment/site_config',
  `entity_id`       bigint unsigned NOT NULL COMMENT '对应实体的主键ID',
  `field_name`      varchar(50)  COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '字段名: name/intro/address/bio/title/specialty/summary/detail/desc/value',
  `lang`            varchar(10)  COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '语言代码: en/fr/es/de/...',
  `content`         text         COLLATE utf8mb4_unicode_ci NULL COMMENT '翻译内容，is_reviewed=1时对外展示',
  `error_msg`       varchar(500) COLLATE utf8mb4_unicode_ci NULL COMMENT '翻译失败原因',
  `is_reviewed`     tinyint      NOT NULL DEFAULT '0' COMMENT '0=待翻译 1=已翻译 2=翻译失败',
  `updated_at`      datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_trans` (`entity_type`, `entity_id`, `field_name`, `lang`),
  KEY `idx_entity` (`entity_type`, `entity_id`),
  KEY `idx_lang_status` (`lang`, `is_reviewed`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='多语言内容翻译表';

-- 翻译管理员扩展
ALTER TABLE `users`
  ADD COLUMN `managed_lang` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL
    COMMENT '翻译管理员负责的语言代码，仅 role_id=6 有值'
  AFTER `invite_code`;

CREATE TABLE `translation_job` (
  `id`         bigint unsigned NOT NULL AUTO_INCREMENT,
  `lang`       varchar(10)  COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '目标语言',
  `status`     varchar(20)  COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'running'
                 COMMENT 'running=翻译中 cancelled=已取消 done=完成',
  `total`      int NOT NULL DEFAULT '0' COMMENT '总字段条数',
  `done`       int NOT NULL DEFAULT '0' COMMENT '已完成条数',
  `failed`     int NOT NULL DEFAULT '0' COMMENT '失败条数',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_lang_status` (`lang`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='全量翻译任务';

CREATE TABLE `translation_job_item` (
  `id`           bigint unsigned NOT NULL AUTO_INCREMENT,
  `job_id`       bigint unsigned NOT NULL,
  `entity_type`  varchar(50)  COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_id`    bigint unsigned NOT NULL,
  `entity_label` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '实体展示名',
  `field_name`   varchar(50)  COLLATE utf8mb4_unicode_ci NOT NULL,
  `status`       varchar(20)  COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending'
                   COMMENT 'pending=待翻译 done=完成 failed=失败',
  `error_msg`    varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at`   datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_job` (`job_id`),
  KEY `idx_entity` (`entity_type`, `entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='翻译任务明细';
