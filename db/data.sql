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
INSERT INTO users (role_id, username, email, password_hash, is_active) VALUES
(2, 'admin', 'admin@international-medical.com',
 '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8i', 1);

-- ============================================================
-- 网站全局配置
-- ============================================================
INSERT INTO site_configs (config_key, value_zh, value_en, description) VALUES
('site_intro',
 '国际医疗项目致力于为全球患者提供高品质的中国医疗服务，汇聚国内顶尖医院与专家资源，为您的健康保驾护航。',
 'The International Medical Program is dedicated to providing high-quality Chinese medical services to patients worldwide, bringing together top hospitals and expert resources in China.',
 '首页项目简介'),
('contact_default_person', '国际医疗中心', 'International Medical Center', '默认预约联系人'),
('contact_default_info',   '025-83169988', '025-83169988', '默认联系方式'),

-- ============================================================
-- 系统基础设施配置（通过后台可修改，无需改代码）
-- ============================================================
-- 文件上传配置
('upload_base_path',
 '/Users/wuchunlan/Desktop/医疗平台媒体资源',
 '/Users/wuchunlan/Desktop/医疗平台媒体资源',
 '文件上传根目录（本地路径，部署后改为服务器路径或OSS路径）'),
('upload_base_url',
 'http://localhost:8080/media',
 'http://localhost:8080/media',
 '文件访问URL前缀（本地开发用，部署后改为CDN/OSS域名）'),
('upload_max_size_mb',
 '50',
 '50',
 '单文件最大上传大小（MB）'),
('upload_allowed_image_types',
 'jpg,jpeg,png,webp,gif',
 'jpg,jpeg,png,webp,gif',
 '允许上传的图片格式'),
('upload_allowed_video_types',
 'mp4,mov,avi,webm',
 'mp4,mov,avi,webm',
 '允许上传的视频格式'),

-- 数据库配置（只读展示，实际连接由 application.yml 控制）
('db_host',        'localhost',             'localhost',             '数据库主机'),
('db_port',        '3306',                  '3306',                  '数据库端口'),
('db_name',        'international_medical', 'international_medical', '数据库名称'),
('db_username',    'root',                  'root',                  '数据库用户名'),

-- Redis 配置（只读展示）
('redis_host',     'localhost',             'localhost',             'Redis 主机'),
('redis_port',     '6379',                  '6379',                  'Redis 端口'),
('redis_database', '0',                     '0',                     'Redis 数据库编号'),

-- 邮件配置
('mail_host',      'smtp.example.com',      'smtp.example.com',      'SMTP 服务器地址'),
('mail_port',      '587',                   '587',                   'SMTP 端口'),
('mail_username',  'noreply@example.com',   'noreply@example.com',   '发件人邮箱'),

-- JWT 配置
('jwt_expiration_hours',       '24',  '24',  'C端 JWT 有效期（小时）'),
('jwt_admin_expiration_hours', '8',   '8',   '管理端 JWT 有效期（小时）');

-- ============================================================
-- 医院数据
-- ============================================================
INSERT INTO hospitals (id, name_zh, name_en, intro_zh, intro_en, address_zh, address_en, phone, contact_person, contact_info, sort_order) VALUES
(1,
 '泰康仙林鼓楼医院',
 'Taikang Xianlin Drum Tower Hospital',
 '泰康仙林鼓楼医院是泰康保险集团旗下首家医、教、研一体化三级甲等综合医院，是南京大学医学院附属医院、南京鼓楼医院集团成员、武汉大学临床学院、南京中医药大学教学医院。医院位于南京市栖霞区仙林大学城灵山北侧，总建筑面积33.4万平方米，规划床位近1400张，以建设长寿医院、打造"健康管理中心、国际医疗中心"为特色，重点规划建设消化医学、神经医学、泌尿医学、肿瘤医学、老年医学、全科医学及健康管理6大医学中心。拥有PET-CT、直线加速器、双源DSA、全飞秒等高端医疗设备，累计为超过60个国家的患者提供医疗服务。',
 'Taikang Xianlin Drum Tower Hospital is the first integrated medical, teaching and research Grade-A tertiary general hospital under Taikang Insurance Group. It is affiliated with Nanjing University School of Medicine, a member of Nanjing Drum Tower Hospital Group, a clinical college of Wuhan University, and a teaching hospital of Nanjing University of Chinese Medicine. Located in Xianlin University Town, Qixia District, Nanjing, the hospital covers a total construction area of 334,000 square meters with nearly 1,400 planned beds. It has provided medical services to patients from more than 60 countries.',
 '南京市栖霞区灵山北路188号',
 '188 Lingshan North Road, Qixia District, Nanjing',
 '025-83169988',
 '国际医疗中心',
 '025-83169988（国际医疗中心）',
 1),
(2,
 '泰康同济（武汉）医院',
 'Taikang Tongji (Wuhan) Hospital',
 '泰康同济（武汉）医院是世界500强企业泰康保险集团全资投资、与华中科技大学同济医学院附属同济医院合作管理的高品质、非营利性综合医院。2020年2月开业，2026年4月获评国家三级甲等综合医院。医院位于武汉市汉阳区四新生态新城，建筑面积约27.6万平方米，远期规划床位1200余张。荣获"全国抗击新冠肺炎疫情先进集体"至高荣誉。重点打造消化医学、神经医学、泌尿医学、肿瘤医学、老年医学、全科医学及健康管理六大战略重点学科，持续深化与武汉同济医院的战略合作，引进30多位知名专家担任学术科主任、首席专家。',
 'Taikang Tongji (Wuhan) Hospital is a high-quality, non-profit general hospital wholly invested by Taikang Insurance Group (Fortune Global 500) and co-managed with Tongji Hospital affiliated to Tongji Medical College of Huazhong University of Science and Technology. Opened in February 2020 and awarded Grade-A tertiary hospital in April 2026. Located in Xincheng Ecological New City, Hanyang District, Wuhan, with a construction area of approximately 276,000 square meters and a planned capacity of over 1,200 beds. Honored with the national award "Advanced Collective in Fighting COVID-19".',
 '武汉市汉阳区四新北路322号',
 '322 Sixin North Road, Hanyang District, Wuhan',
 NULL,
 '国际医疗部',
 '请联系国际医疗部获取预约信息',
 2);

-- ============================================================
-- 医疗设备数据
-- ============================================================
INSERT INTO equipments (hospital_id, name_zh, name_en, desc_zh, desc_en, sort_order) VALUES
-- 仙林鼓楼医院设备
(1, 'PET-CT', 'PET-CT',
 '一次性完成全身扫描，同时看清病灶的形态和代谢，是肿瘤诊断的利器。',
 'Completes whole-body scanning in one session, simultaneously visualizing lesion morphology and metabolism — a powerful tool for tumor diagnosis.',
 1),
(1, '达芬奇手术机器人', 'Da Vinci Surgical Robot',
 '目前全球最先进的外科手术系统之一，让医生能更精准、灵活地完成微创手术。',
 'One of the most advanced surgical systems in the world, enabling surgeons to perform minimally invasive procedures with greater precision and flexibility.',
 2),
(1, '日本奥林巴斯X1超清放大内镜系统', 'Olympus X1 Ultra-HD Magnifying Endoscope',
 '提供超高清的显微级图像，能实时观察到细胞层面的微血管和黏膜结构，早癌识别精度提升40%。',
 'Provides ultra-high-definition microscopic images for real-time observation of microvascular and mucosal structures at the cellular level, improving early cancer detection accuracy by 40%.',
 3),
(1, '直线加速器', 'Linear Accelerator',
 '用于肿瘤放射治疗，精准定位肿瘤靶区，最大限度保护正常组织。',
 'Used for tumor radiotherapy with precise targeting of tumor areas while maximally protecting normal tissue.',
 4),
(1, '双源DSA', 'Dual-Source DSA',
 '数字减影血管造影系统，用于血管疾病的精准诊断与介入治疗。',
 'Digital subtraction angiography system for precise diagnosis and interventional treatment of vascular diseases.',
 5),
(1, '全飞秒激光系统', 'SMILE Laser System',
 '全飞秒激光近视矫正手术系统，微创、精准、恢复快。',
 'SMILE laser vision correction system — minimally invasive, precise, and fast recovery.',
 6),
-- 泰康同济医院设备
(2, 'PET-CT', 'PET-CT',
 '一次性完成全身扫描，同时看清病灶的形态和代谢，是肿瘤诊断的利器。',
 'Completes whole-body scanning in one session, simultaneously visualizing lesion morphology and metabolism.',
 1),
(2, '直线加速器', 'Linear Accelerator',
 '用于肿瘤放射治疗，精准定位肿瘤靶区。',
 'Used for tumor radiotherapy with precise targeting.',
 2);

-- ============================================================
-- 医生数据（仙林鼓楼医院 — 来自高端胃肠镜资料）
-- ============================================================
INSERT INTO doctors (hospital_id, name_zh, name_en, specialty_zh, specialty_en, bio_zh, bio_en, title_zh, title_en, price_per_visit, sort_order) VALUES
(1, '邹晓平', 'Zou Xiaoping',
 '消化内科',
 'Gastroenterology',
 '泰康仙林鼓楼医院院长，消化内镜著名专家，在消化道早癌筛查与内镜治疗领域具有丰富经验。',
 'President of Taikang Xianlin Drum Tower Hospital, renowned expert in digestive endoscopy with extensive experience in early gastrointestinal cancer screening and endoscopic treatment.',
 '院长 / 主任医师', 'President / Chief Physician',
 2000.00, 1),
(1, '施瑞华', 'Shi Ruihua',
 '消化内科',
 'Gastroenterology',
 '东南大学附属中大医院首席专家，消化内镜领域权威，擅长复杂消化道疾病的内镜诊断与治疗。',
 'Chief Expert of Zhongda Hospital affiliated to Southeast University, authority in digestive endoscopy, specializing in endoscopic diagnosis and treatment of complex gastrointestinal diseases.',
 '首席专家 / 主任医师', 'Chief Expert / Chief Physician',
 1500.00, 2),
(1, '张以洋', 'Zhang Yiyang',
 '消化内科',
 'Gastroenterology',
 '南京鼓楼医院消化内科主任医师，擅长胃肠道肿瘤的早期诊断与内镜下微创治疗。',
 'Chief Physician of Gastroenterology at Nanjing Drum Tower Hospital, specializing in early diagnosis of gastrointestinal tumors and minimally invasive endoscopic treatment.',
 '主任医师', 'Chief Physician',
 1200.00, 3);

-- ============================================================
-- 特需产品数据（泰康仙林鼓楼医院）
-- ============================================================
INSERT INTO special_products (id, hospital_id, name_zh, name_en, summary_zh, summary_en, detail_zh, detail_en, price_min, price_max, contact_person, contact_info, sort_order) VALUES
(1, 1,
 '菌群检测',
 'Flora Detection',
 '全菌群检测，16S-PLUS多重靶向测序，精准评估肠道菌群结构，为个性化健康管理提供科学依据。',
 'Comprehensive flora detection using 16S-PLUS multi-target sequencing to precisely assess intestinal flora structure and provide a scientific basis for personalised health management.',
 '全菌群检测采用16S-PLUS多重靶向测序技术，可全面评估肠道菌群的种类、丰度及多样性，识别有益菌与有害菌的比例失衡，为后续菌群移植或调理方案提供精准数据支撑。\n\n检测优势：\n• 16S-PLUS多重靶向测序，覆盖率更广\n• 专业报告解读，中英双语\n• 结果可直接指导后续治疗方案',
 'Comprehensive flora detection using 16S-PLUS multi-target sequencing technology to fully assess the types, abundance and diversity of intestinal flora, identify imbalances between beneficial and harmful bacteria, and provide precise data support for subsequent FMT or conditioning plans.\n\nAdvantages:\n• 16S-PLUS multi-target sequencing with broader coverage\n• Professional bilingual (Chinese/English) report interpretation\n• Results directly guide subsequent treatment plans',
 2000.00, 2000.00,
 '国际医疗中心', '025-83169988（国际医疗中心）',
 1),
(2, 1,
 '肠道菌群移植',
 'Fecal Microbiota Transplantation (FMT)',
 '【定制版·套餐一】一对一专家评估与个案管理，活菌冻干胶囊90粒（每粒5000亿菌群），赠送2盒益生元（2个月）+核心菌检测1次。',
 '[Custom Edition · Package 1] One-on-one expert assessment and case management. 90 live lyophilised capsules (500 billion bacteria per capsule). Complimentary: 2 boxes of prebiotics (2 months) + 1 core flora test.',
 '肠道菌群移植（FMT）通过将健康供体的肠道菌群移植到患者肠道内，重塑肠道微生态平衡。泰康仙林鼓楼医院肠道微生态中心已建成使用，打通基础研究到临床转化的全链条。\n\n【定制版·套餐一】包含：\n• 一对一专家评估与个案管理\n• 活菌冻干胶囊90粒，每粒5000亿菌群\n• 赠送：2盒益生元（2个月）+核心菌检测1次\n\n适应症：复发性艰难梭菌感染、炎症性肠病、肠易激综合征、代谢综合征相关肠道问题等。',
 'Fecal Microbiota Transplantation (FMT) reshapes the intestinal microecological balance by transplanting the intestinal flora of healthy donors into the patient''s intestine.\n\n[Custom Edition · Package 1] Includes:\n• One-on-one expert assessment and case management\n• 90 live lyophilised capsules, 500 billion bacteria per capsule\n• Complimentary: 2 boxes of prebiotics (2 months) + 1 core flora test\n\nIndications: recurrent C. difficile infection, inflammatory bowel disease, irritable bowel syndrome, metabolic syndrome-related intestinal problems.',
 32000.00, 32000.00,
 '国际医疗中心', '025-83169988（国际医疗中心）',
 2),
(3, 1,
 '肝脏修复',
 'Liver Restoration Therapy',
 '专家一对一评估与个案管理，血液检测+心电图，保肝及抗衰相关药物组，多套餐可选，含住宿及高客餐服务。',
 'One-on-one expert assessment and case management, blood tests + ECG, hepatoprotective and anti-ageing medication regimen. Multiple packages available, including accommodation and premium dining.',
 '肝脏修复项目由泰康仙林鼓楼医院国际医疗中心提供，针对肝功能受损、慢性肝病及亚健康人群，提供系统性保肝抗衰综合方案。\n\n【肝修*套餐一】\n• 一对一专家评估与个案管理\n• 血液检测（肝功能+心肌酶等）+心电图\n• 保肝及抗衰相关药物组\n• 2天1晚高端住宿\n• 高客餐\n\n【肝修*套餐二】-无住宿-单次\n• 一对一专家评估与个案管理\n• 血液检测（肝功能+心肌酶等）+心电图\n• 保肝及抗衰相关药物组\n• 高客餐/点心\n\n【肝修*套餐二】-无住宿-三次\n• 一对一专家评估与个案管理\n• 2次对比-血液检测（肝功能+心肌酶等）+心电图+B超\n• 保肝及抗衰相关药物组\n• 高客餐/点心',
 'The Liver Restoration Programme is provided by the International Medical Centre of Taikang Xianlin Drum Tower Hospital, offering a systematic hepatoprotective and anti-ageing solution for patients with impaired liver function, chronic liver disease, or sub-health conditions.\n\n[Package 1]\n• One-on-one expert assessment and case management\n• Blood tests (liver function + cardiac enzymes, etc.) + ECG\n• Hepatoprotective and anti-ageing medication regimen\n• 2-day 1-night premium accommodation\n• Premium dining\n\n[Package 2] - No accommodation - Single session\n• One-on-one expert assessment and case management\n• Blood tests (liver function + cardiac enzymes, etc.) + ECG\n• Hepatoprotective and anti-ageing medication regimen\n• Premium dining / refreshments\n\n[Package 2] - No accommodation - Three sessions\n• One-on-one expert assessment and case management\n• 2 comparative blood tests (liver function + cardiac enzymes, etc.) + ECG + ultrasound\n• Hepatoprotective and anti-ageing medication regimen\n• Premium dining / refreshments',
 4300.00, 9500.00,
 '国际医疗中心', '025-83169988（国际医疗中心）',
 3),
(4, 1,
 '自体脂肪膝关节治疗',
 'Autologous Fat Knee Joint Therapy',
 '自体脂肪移植治疗膝关节，一对一专家评估，血液检测+心电图+血管超声，3天2晚高端住宿，高客餐，单膝两套方案可选。',
 'Autologous fat transplantation for knee joint treatment. One-on-one expert assessment, blood tests + ECG + vascular ultrasound, 3-day 2-night premium accommodation, premium dining. Two single-knee packages available.',
 '自体脂肪膝关节治疗是泰康仙林鼓楼医院国际医疗中心提供的再生医学项目，通过自体脂肪移植技术修复膝关节软骨损伤，改善关节功能，减轻疼痛。\n\n【自体脂肪移植治疗膝关节*单膝】套餐一\n• 一对一专家评估与个案管理\n• 血液检测（血脂+凝血+传染病等）+心电图+血栓弹力图实验+血管超声\n• 自体脂肪移植术\n• 3天2晚高端住宿\n• 高客餐\n\n【自体脂肪移植治疗膝关节*单膝】套餐二\n• 一对一专家评估与个案管理\n• 血液检测（血脂+凝血+传染病等）+超声+磁共振等\n• 自体脂肪移植术\n• 3天2晚高端住宿\n• 高客餐',
 'Autologous fat knee joint therapy is a regenerative medicine programme provided by the International Medical Centre of Taikang Xianlin Drum Tower Hospital. It uses autologous fat transplantation technology to repair knee cartilage damage, improve joint function, and relieve pain.\n\n[Single Knee Package 1]\n• One-on-one expert assessment and case management\n• Blood tests (lipids + coagulation + infectious diseases, etc.) + ECG + thromboelastography + vascular ultrasound\n• Autologous fat transplantation surgery\n• 3-day 2-night premium accommodation\n• Premium dining\n\n[Single Knee Package 2]\n• One-on-one expert assessment and case management\n• Blood tests (lipids + coagulation + infectious diseases, etc.) + ultrasound + MRI, etc.\n• Autologous fat transplantation surgery\n• 3-day 2-night premium accommodation\n• Premium dining',
 38800.00, 48800.00,
 '国际医疗中心', '025-83169988（国际医疗中心）',
 4),
(5, 1,
 '高端胃肠镜',
 'Premium Gastroscopy & Colonoscopy',
 '心电图+VIP高端住宿+高端清肠药物+营养餐+个案管理，消化内镜著名专家主诊，两套方案可选。',
 'ECG + VIP premium accommodation + premium bowel preparation medication + nutritional meal + case management. Performed by renowned endoscopy experts. Two packages available.',
 '泰康仙林鼓楼医院国际医疗中心高端胃肠镜服务，采用日本奥林巴斯X1超清放大内镜系统，早癌识别精度提升40%；AI智能双重阅片，综合早癌识别率超过90%；发现复杂病变立即启动MDT多学科会诊。\n\n套餐一：心电图+VIP 2天1晚高端住宿+高端清肠药物+营养餐+个案管理\n\n套餐二：心电图+血液检查+VIP 3天2晚高端住宿+高端清肠药物+营养餐+个案管理\n\n适合人群：频繁反酸/胃胀/排便异常；长期饮食不规律、应酬饮酒；40岁以上未做过胃肠镜深度筛查；家族有消化道肿瘤病史。',
 'Taikang Xianlin Drum Tower Hospital International Medical Centre premium gastroscopy & colonoscopy service. Features Olympus X1 ultra-HD magnifying endoscope with 40% improved early cancer detection; AI dual-reading with over 90% early cancer detection rate; immediate MDT consultation for complex lesions.\n\nPackage 1: ECG + VIP 2-day 1-night premium accommodation + premium bowel preparation medication + nutritional meal + case management\n\nPackage 2: ECG + blood tests + VIP 3-day 2-night premium accommodation + premium bowel preparation medication + nutritional meal + case management\n\nSuitable for: frequent acid reflux/bloating/abnormal bowel habits; long-term irregular diet, social drinking; adults over 40 without prior deep gastrointestinal screening; family history of gastrointestinal tumours.',
 12800.00, 16800.00,
 '国际医疗中心', '025-83169988（国际医疗中心）',
 5),
(6, 1,
 '中医美容',
 'Traditional Chinese Medicine Aesthetics',
 '皮肤治疗/美白紧致淡斑祛痘，融合传统中医与现代美容技术，10次疗程，标本兼治。',
 'Skin treatment / whitening, firming, spot-fading and acne-clearing. Integrating traditional Chinese medicine with modern aesthetic technology. 10-session course for comprehensive treatment.',
 '中医美容项目融合传统中医理论与现代皮肤美容技术，针对色斑、痘痘、皮肤暗沉、松弛等问题，提供系统性调理方案。\n\n服务内容：\n• 皮肤治疗：针对各类皮肤问题的中医外治法\n• 美白紧致：改善肤色不均、提升皮肤弹性\n• 淡斑祛痘：中医内外兼治，标本兼顾\n\n疗程：10次系统治疗\n\n特色优势：\n• 名老中医坐诊，辨证施治\n• 中英双语服务\n• 天然中药成分，安全温和',
 'The TCM Aesthetics programme integrates traditional Chinese medicine theory with modern skin aesthetic technology to provide systematic conditioning solutions for pigmentation, acne, dull skin, and sagging.\n\nServices:\n• Skin treatment: TCM external therapies for various skin conditions\n• Whitening and firming: improving uneven skin tone and enhancing skin elasticity\n• Spot-fading and acne-clearing: combined internal and external TCM treatment\n\nCourse: 10 systematic treatment sessions\n\nAdvantages:\n• Renowned TCM physicians with syndrome differentiation\n• Bilingual (Chinese/English) service\n• Natural herbal ingredients, safe and gentle',
 3600.00, 3600.00,
 '国际医疗中心', '025-83169988（国际医疗中心）',
 6);

-- ============================================================
-- 产品细分套餐
-- ============================================================
INSERT INTO product_variants (product_id, name_zh, name_en, desc_zh, desc_en, price, sort_order) VALUES
-- 菌群检测
(1, '全菌群检测', 'Comprehensive Flora Detection',
 '全菌群检测，16S-PLUS多重靶向测序，精准评估肠道菌群结构。',
 'Comprehensive flora detection using 16S-PLUS multi-target sequencing to precisely assess intestinal flora structure.',
 2000.00, 1),
-- 肠道菌群移植
(2, '定制版·套餐一', 'Custom Edition · Package 1',
 '一对一专家评估与个案管理，活菌冻干胶囊90粒（每粒5000亿菌群），赠送2盒益生元（2个月）+核心菌检测1次。',
 'One-on-one expert assessment and case management. 90 live lyophilised capsules (500 billion bacteria per capsule). Complimentary: 2 boxes of prebiotics (2 months) + 1 core flora test.',
 32000.00, 1),
-- 肝脏修复
(3, '肝修·套餐一（含住宿）', 'Liver Restoration Package 1 (with accommodation)',
 '一对一专家评估与个案管理，血液检测（肝功能+心肌酶等）+心电图，保肝及抗衰相关药物组，2天1晚高端住宿，高客餐。',
 'One-on-one expert assessment and case management, blood tests (liver function + cardiac enzymes, etc.) + ECG, hepatoprotective and anti-ageing medication regimen, 2-day 1-night premium accommodation, premium dining.',
 8200.00, 1),
(3, '肝修·套餐二（无住宿·单次）', 'Liver Restoration Package 2 (no accommodation · single)',
 '一对一专家评估与个案管理，血液检测（肝功能+心肌酶等）+心电图，保肝及抗衰相关药物组，高客餐/点心。',
 'One-on-one expert assessment and case management, blood tests (liver function + cardiac enzymes, etc.) + ECG, hepatoprotective and anti-ageing medication regimen, premium dining / refreshments.',
 4300.00, 2),
(3, '肝修·套餐二（无住宿·三次）', 'Liver Restoration Package 2 (no accommodation · 3 sessions)',
 '一对一专家评估与个案管理，2次对比血液检测（肝功能+心肌酶等）+心电图+B超，保肝及抗衰相关药物组，高客餐/点心。',
 'One-on-one expert assessment and case management, 2 comparative blood tests (liver function + cardiac enzymes, etc.) + ECG + ultrasound, hepatoprotective and anti-ageing medication regimen, premium dining / refreshments.',
 9500.00, 3),
-- 自体脂肪膝关节治疗
(4, '单膝套餐一（含血栓弹力图+血管超声）', 'Single Knee Package 1 (with TEG + vascular ultrasound)',
 '一对一专家评估与个案管理，血液检测（血脂+凝血+传染病等）+心电图+血栓弹力图实验+血管超声，自体脂肪移植术，3天2晚高端住宿，高客餐。',
 'One-on-one expert assessment and case management, blood tests (lipids + coagulation + infectious diseases, etc.) + ECG + thromboelastography + vascular ultrasound, autologous fat transplantation surgery, 3-day 2-night premium accommodation, premium dining.',
 38800.00, 1),
(4, '单膝套餐二（含超声+磁共振）', 'Single Knee Package 2 (with ultrasound + MRI)',
 '一对一专家评估与个案管理，血液检测（血脂+凝血+传染病等）+超声+磁共振等，自体脂肪移植术，3天2晚高端住宿，高客餐。',
 'One-on-one expert assessment and case management, blood tests (lipids + coagulation + infectious diseases, etc.) + ultrasound + MRI, etc., autologous fat transplantation surgery, 3-day 2-night premium accommodation, premium dining.',
 48800.00, 2),
-- 高端胃肠镜
(5, '胃肠镜套餐一（2天1晚）', 'Gastroscopy Package 1 (2-day 1-night)',
 '心电图+VIP 2天1晚高端住宿+高端清肠药物+营养餐+个案管理。',
 'ECG + VIP 2-day 1-night premium accommodation + premium bowel preparation medication + nutritional meal + case management.',
 12800.00, 1),
(5, '胃肠镜套餐二（3天2晚+血液检查）', 'Gastroscopy Package 2 (3-day 2-night + blood tests)',
 '心电图+血液检查+VIP 3天2晚高端住宿+高端清肠药物+营养餐+个案管理。',
 'ECG + blood tests + VIP 3-day 2-night premium accommodation + premium bowel preparation medication + nutritional meal + case management.',
 16800.00, 2),
-- 中医美容
(6, '皮肤治疗·美白紧致淡斑祛痘（10次）', 'Skin Treatment · Whitening, Firming, Spot-fading & Acne-clearing (10 sessions)',
 '皮肤治疗/美白紧致淡斑祛痘，10次系统疗程，中医内外兼治，标本兼顾。',
 'Skin treatment / whitening, firming, spot-fading and acne-clearing. 10-session systematic course with combined internal and external TCM treatment.',
 3600.00, 1);

-- ============================================================
-- 成功案例（示例数据）
-- ============================================================
INSERT INTO cases (hospital_id, title_zh, title_en, summary_zh, summary_en, sort_order) VALUES
(1,
 '早期胃癌精准筛查，高端胃肠镜助力患者康复',
 'Precise Early Gastric Cancer Screening: Premium Endoscopy Helps Patient Recovery',
 '一位来自俄罗斯的45岁男性患者，通过泰康仙林鼓楼医院国际医疗中心高端胃肠镜检查，成功发现早期胃癌病灶，经内镜下微创治疗后完全康复，避免了开腹手术。',
 'A 45-year-old male patient from Russia successfully had early gastric cancer detected through the premium endoscopy service at Taikang Xianlin Drum Tower Hospital International Medical Center. After minimally invasive endoscopic treatment, he fully recovered without the need for open surgery.',
 1),
(1,
 '菌群移植治疗复发性肠炎，患者重获健康生活',
 'FMT Treatment for Recurrent Enteritis: Patient Regains Healthy Life',
 '一位来自新加坡的患者长期受复发性艰难梭菌感染困扰，经过泰康仙林鼓楼医院肠道微生态中心的菌群移植治疗，症状显著改善，生活质量大幅提升。',
 'A patient from Singapore who had long suffered from recurrent Clostridioides difficile infection underwent FMT treatment at the Intestinal Microecology Center of Taikang Xianlin Drum Tower Hospital, with significant symptom improvement and greatly enhanced quality of life.',
 2),
(2,
 '泰康同济MDT多学科联合诊疗，攻克复杂肿瘤病例',
 'Taikang Tongji MDT Multidisciplinary Treatment Conquers Complex Tumor Case',
 '一位来自中亚的患者携带复杂消化道肿瘤病例来到泰康同济医院，经过消化内科、肿瘤科、外科等多学科专家联合会诊，制定精准治疗方案，成功完成手术并顺利康复。',
 'A patient from Central Asia with a complex gastrointestinal tumor case came to Taikang Tongji Hospital. Through multidisciplinary consultation involving gastroenterology, oncology, surgery and other departments, a precise treatment plan was formulated, and the surgery was successfully completed with smooth recovery.',
 3);
