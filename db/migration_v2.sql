-- db/migration_v2.sql
USE international_medical;

-- 新增角色
INSERT IGNORE INTO roles (id, code, name_zh, name_en) VALUES
(3, 'hospital_admin', '医院管理员', 'Hospital Admin'),
(4, 'reviewer',       '信息审核员', 'Reviewer');

-- users 表新增 hospital_id (医院管理员绑定的医院)
ALTER TABLE users
  ADD COLUMN hospital_id BIGINT UNSIGNED DEFAULT NULL COMMENT '绑定医院ID（hospital_admin专用）' AFTER role_id;

-- 六张业务表新增审核字段
ALTER TABLE hospitals
  ADD COLUMN audit_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'approved' COMMENT '审核状态' AFTER is_active,
  ADD COLUMN rejection_reason TEXT DEFAULT NULL COMMENT '审核拒绝原因' AFTER audit_status;

ALTER TABLE doctors
  ADD COLUMN audit_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'approved' COMMENT '审核状态' AFTER is_active,
  ADD COLUMN rejection_reason TEXT DEFAULT NULL AFTER audit_status;

ALTER TABLE equipments
  ADD COLUMN audit_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'approved' COMMENT '审核状态' AFTER is_active,
  ADD COLUMN rejection_reason TEXT DEFAULT NULL AFTER audit_status;

ALTER TABLE hospital_environments
  ADD COLUMN audit_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'approved' COMMENT '审核状态' AFTER is_active,
  ADD COLUMN rejection_reason TEXT DEFAULT NULL AFTER audit_status;

ALTER TABLE cases
  ADD COLUMN audit_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'approved' COMMENT '审核状态' AFTER is_active,
  ADD COLUMN rejection_reason TEXT DEFAULT NULL AFTER audit_status;

ALTER TABLE special_products
  ADD COLUMN audit_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'approved' COMMENT '审核状态' AFTER is_active,
  ADD COLUMN rejection_reason TEXT DEFAULT NULL AFTER audit_status;
