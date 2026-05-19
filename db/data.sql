USE international_medical;

-- ============================================================
-- 角色初始数据
-- ============================================================
INSERT INTO roles (id, code, name_zh, name_en) VALUES
(1, 'user',  '普通用户', 'User'),
(2, 'admin', '管理员',   'Administrator');

-- ============================================================
-- 默认管理员账号 (密码: 12345, bcrypt hash)
-- ============================================================
INSERT INTO users (role_id, email, password_hash, is_active) VALUES
(2, 'admin@international-medical.com',
 '$2b$12$xgnu7nWrPpzCBUjI.6Tlk.Ee5KRApTjXm3ALfdnsoD7aTg5BHamEu', 1);

-- ============================================================
-- 网站全局配置
-- ============================================================
INSERT INTO site_configs (config_key, value_zh, value_en, description) VALUES
('site_name',
 '国际医疗',
 'International Medical',
 '网站名称'),
('site_subtitle',
 '为全球患者提供高品质中国医疗服务',
 'Providing World-Class Chinese Medical Services to Global Patients',
 '网站副标题'),
('site_logo_url',
 '',
 '',
 '网站Logo图片URL（留空则使用文字Logo）'),
('site_intro',
 '国际医疗项目致力于为全球患者提供高品质的中国医疗服务，汇聚国内顶尖医院与专家资源，为您的健康保驾护航。',
 'The International Medical Program is dedicated to providing high-quality Chinese medical services to patients worldwide, bringing together top hospitals and expert resources in China.',
 '首页项目简介'),
('contact_default_person', '国际医疗中心', 'International Medical Center', '默认预约联系人'),
('contact_default_info',   '025-83169988', '025-83169988', '默认联系方式'),
('translate_provider', 'mymemory', 'mymemory', '翻译服务商：mymemory 或 deepl'),
('translate_api_key', '', '', '翻译API Key（MyMemory可留空；DeepL填写Auth Key）'),

-- 文件上传配置
('upload_base_path',
 '/Users/wuchunlan/Desktop/医疗平台媒体资源',
 '/Users/wuchunlan/Desktop/医疗平台媒体资源',
 '文件上传根目录'),
('upload_base_url',
 'http://localhost:8080/media',
 'http://localhost:8080/media',
 '文件访问URL前缀'),
('upload_max_size_mb', '50', '50', '单文件最大上传大小（MB）'),
('upload_allowed_image_types', 'jpg,jpeg,png,webp,gif', 'jpg,jpeg,png,webp,gif', '允许上传的图片格式'),
('upload_allowed_video_types', 'mp4,mov,avi,webm', 'mp4,mov,avi,webm', '允许上传的视频格式'),

-- 数据库配置
('db_host', 'localhost', 'localhost', '数据库主机'),
('db_port', '3306', '3306', '数据库端口'),
('db_name', 'international_medical', 'international_medical', '数据库名称'),
('db_username', 'root', 'root', '数据库用户名'),

-- Redis 配置
('redis_host', 'localhost', 'localhost', 'Redis 主机'),
('redis_port', '6379', '6379', 'Redis 端口'),
('redis_database', '0', '0', 'Redis 数据库编号'),

-- 邮件配置
('mail_host', 'smtp.example.com', 'smtp.example.com', 'SMTP 服务器地址'),
('mail_port', '587', '587', 'SMTP 端口'),
('mail_username', 'noreply@example.com', 'noreply@example.com', '发件人邮箱'),

-- JWT 配置
('jwt_expiration_hours', '24', '24', 'C端 JWT 有效期（小时）'),
('jwt_admin_expiration_hours', '8', '8', '管理端 JWT 有效期（小时）');
