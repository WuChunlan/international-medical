-- ============================================================
-- 国际医疗项目 数据迁移脚本 v3
-- 用法：在执行 schema_v3.sql 之后运行此脚本
--   mysql -u root -p < db/schema_v3.sql
--   mysql -u root -p < db/migrate_to_v3.sql
-- 效果：将现有业务数据（医院、医生、设备、产品等）迁移至新 schema
-- ============================================================

USE international_medical;

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 清空 schema_v3 预置的默认账号，以完整 id 重新插入所有用户
-- ============================================================
TRUNCATE TABLE users;

-- ============================================================
-- 用户表（4条）
-- id=1 超级管理员 (密码: 12345)
-- id=2 医院管理员 绑定 hospital_id=2
-- id=3 医院管理员 绑定 hospital_id=4（历史数据，医院已不存在，保留原值）
-- id=4 信息审核员 (密码: reviewer123)
-- ============================================================
INSERT INTO users (id, role_id, hospital_id, first_name, last_name, gender, email, phone, password_hash,
                   id_card_number, passport_number, id_card_country, is_active, created_at, updated_at) VALUES
(1, 2, NULL, NULL, NULL, NULL, 'admin@international-medical.com',   NULL, '$2b$12$xgnu7nWrPpzCBUjI.6Tlk.Ee5KRApTjXm3ALfdnsoD7aTg5BHamEu', NULL, NULL, NULL, 1, '2026-05-19 15:02:16', '2026-06-23 17:28:20'),
(2, 3,    2, NULL, NULL, NULL, '1483658995@qq.com',                 NULL, '$2b$12$3vCyGQ36Kq/86TZ1FxNEo.HAgv8idBhCMYTWmW5hCyv6B4AwdhWVe', NULL, NULL, NULL, 1, '2026-06-23 17:45:11', '2026-06-23 17:45:33'),
(3, 3,    4, 'a', 'a',  NULL, '534103682@qq.com',                  NULL, '$2a$12$WKAhjXpZOPbzM3MIMoNFdOzGkj7rFtYtswp7Op6M/mV0Xh4WcAVbK', NULL, NULL, NULL, 1, '2026-06-23 20:42:52', '2026-06-23 20:43:57'),
(4, 4, NULL, NULL, NULL, NULL, 'reviewer@international-medical.com', NULL, '$2b$12$Xj0E3MAl7xoKxVUPz2tVlu7iid0KLNVQaVpcSTx77ANDxRhsp3KbC', NULL, NULL, NULL, 1, '2026-06-25 15:27:05', '2026-06-25 15:27:05');

ALTER TABLE users AUTO_INCREMENT = 5;

-- ============================================================
-- 医院表（3条）：泰康同济、泰康仙林鼓楼、测试医院
-- video_url 为新增字段，现有数据均为 NULL
-- ============================================================
INSERT INTO hospitals (id, name_zh, name_en, intro_zh, intro_en, cover_image_url, video_url,
                       address_zh, address_en, phone, contact_person, contact_info,
                       audit_status, rejection_reason, sort_order, is_active, created_at, updated_at) VALUES
(2,
 '泰康同济（武汉）医院',
 'Taikang Tongji (Wuhan) Hospital',
 '泰康同济（武汉）医院是世界500强企业泰康保险集团全资投资、与华中科技大学同济医学院附属同济医院合作管理的高品质、非营利性综合医院。医院于2020年2月开业，2025年6月成为武汉大学泰康临床学院，2026年4月获评国家三级甲等综合医院。医院位于武汉市汉阳区四新生态新城，建筑面积约27.6万平方米，规划床位1200余张，投资总额近40亿人民币。医院定位为泰康华中区域医、教、研一体化的大型综合医疗机构，采用"强专科+大综合"、"普惠医疗+特需医疗"的方式运营，以健康管理、慢病管理、老年医学为特色，着力打造长寿医院。医院荣获"全国抗击新冠肺炎疫情先进集体"至高荣誉，系湖北省基本医疗保险异地就医、武汉市基本医疗保险及湖北省商业保险定点医院。',
 'Taikang Tongji (Wuhan) Hospital is a high-quality, non-profit general hospital wholly invested by Taikang Insurance Group (Fortune Global 500) and co-managed with Tongji Hospital affiliated to Tongji Medical College of Huazhong University of Science and Technology. Opened in February 2020, it became the Taikang Clinical College of Wuhan University in June 2025 and was designated a Class-III Grade-A hospital in April 2026. Located in the Sixin Eco-City of Hanyang District, Wuhan, the hospital covers a building area of approximately 276,000 m² with a planned capacity of 1,200+ beds and a total investment of nearly RMB 4 billion. Positioned as Taikang\'s integrated medical, education and research center in Central China, it operates under a model of "specialized + comprehensive" and "universal + premium" care, with distinctive strengths in health management, chronic disease management, and geriatric medicine. The hospital was awarded the national honor of "Advanced Collective in Fighting COVID-19" and is a designated hospital for Hubei provincial medical insurance, Wuhan municipal medical insurance, and Hubei commercial insurance.',
 'http://localhost:8080/media/hospitals/images/358d8f2c-5ad6-4442-8976-5a0c6417db8f.png',
 NULL,
 '武汉市汉阳区四新北路322号', 'No. 322, Sixin North Road, Hanyang District, Wuhan',
 '4000195522', '国际医疗部', '4000195522',
 'approved', NULL, 0, 1, '2026-05-19 23:45:55', '2026-06-23 21:08:28'),

(3,
 '泰康仙林鼓楼医院',
 'Taikang Xianlin Drum Tower Hospital',
 '泰康仙林鼓楼医院是泰康保险集团旗下首家医、教、研一体化三级甲等综合医院，是南京大学医学院附属医院、南京鼓楼医院集团成员、武汉大学临床学院、南京中医药大学教学医院。医院前身为南京市仙林鼓楼医院，2013年11月正式开诊，2017年6月更名为"泰康仙林鼓楼医院"。医院位于南京市栖霞区仙林大学城灵山北侧，总建筑面积33.4万平方米，规划床位近1400张。拥有PET-CT、达芬奇手术机器人、日本奥林巴斯X1超清放大内镜系统等高端医疗设备。国际医疗中心依托院内平台，与南京鼓楼医院建立深度战略合作，提供多语种服务，支持超20家商业保险直付理赔，累计服务超60个国家的患者，是南京市医疗国际化的重要窗口。医院与毗邻的泰康之家·苏园共同组成泰康仙林国际医养园区，打造"医教研养康"五位一体综合园区。',
 'Taikang Xianlin Drum Tower Hospital is the first integrated medical, education and research Class-III Grade-A general hospital under Taikang Insurance Group. It is an affiliated hospital of Nanjing University School of Medicine, a member of Nanjing Drum Tower Hospital Group, a clinical college of Wuhan University, and a teaching hospital of Nanjing University of Chinese Medicine. Originally known as Nanjing Xianlin Drum Tower Hospital (opened November 2013), it was renamed in June 2017. Located in Xianlin University Town, Qixia District, Nanjing, the hospital covers 334,000 m² with a planned capacity of nearly 1,400 beds. It is equipped with PET-CT, Da Vinci Surgical Robot, and Olympus X1 ultra-high-definition magnifying endoscope system. The International Medical Center has established deep strategic cooperation with Nanjing Drum Tower Hospital, offers multilingual services, supports direct billing with 20+ commercial insurers, and has served patients from over 60 countries.',
 NULL, NULL,
 '南京市栖霞区灵山北路188号', 'No. 188, Lingshan North Road, Qixia District, Nanjing',
 '025-83169988', '国际医疗中心', '025-83169988',
 'approved', NULL, 1, 1, '2026-05-20 00:02:18', '2026-05-20 00:02:18'),

(5,
 '测试医院', 'Test',
 '测试医院测试医院测试医院测试医院', 'TestTestTestTestTestTest',
 'http://localhost:8080/media/hospitals/images/12536525-ee5e-4534-83fd-5bcf74b62d26.jpeg',
 NULL,
 '测试地址测试地址测试地址测试地址测试地址', 'TestAdd',
 '18999999998', 'aa', '14324522221',
 'approved', NULL, 0, 1, '2026-06-25 15:21:26', '2026-06-25 15:21:26');

ALTER TABLE hospitals AUTO_INCREMENT = 6;

-- ============================================================
-- 医生表（33条，id=2..34）
-- ============================================================
INSERT INTO doctors (id, hospital_id, name_zh, name_en, specialty_zh, specialty_en, bio_zh, bio_en,
                     photo_url, price_per_visit, title_zh, title_en, audit_status, rejection_reason,
                     sort_order, is_active, created_at, updated_at) VALUES
(2,  2, '陈中山', 'Chen Zhongshan', '眼科', 'Ophthalmology',
 '眼科科主任，眼科博士，神经眼科博士后，硕士生导师。对眼科复杂疑难疾病有丰富诊治经验，尤其在眼底病、神经眼科疾病、黄斑疾病、葡萄膜炎、视网膜变性和视神经疾病等领域有深厚造诣。现为国际视觉和眼科协会（ARVO）会员，国际临床视觉电生理协会（ISCEV）委员，中华医学会眼科学会委员，全国激光医学委员等。',
 'Director of Ophthalmology, PhD in Ophthalmology, Postdoctoral Fellow in Neuro-ophthalmology, Master\'s Supervisor. Extensive experience in complex and difficult ophthalmic diseases, with deep expertise in fundus diseases, neuro-ophthalmology, macular diseases, uveitis, retinal degeneration, and optic nerve diseases. Member of ARVO, ISCEV, Chinese Ophthalmological Society, and National Laser Medicine Committee.',
 'http://localhost:8080/media/doctors/images/e5933c8c-78ad-413b-8916-798c28f6d1d8.png',
 NULL, '副教授/主任医师', 'Associate Professor / Chief Physician', 'approved', NULL, 1, 1, '2026-05-19 23:45:55', '2026-05-19 23:45:55'),

(3,  2, '金小琴', 'Jin Xiaoqin', '小儿眼科', 'Pediatric Ophthalmology',
 '从事斜视与小儿眼科二十余年，擅长各种类型的斜视、弱视，儿童青少年屈光不正（近视、远视、散光），先天性上睑下垂，先天性眼球震颤，儿童进行性高度近视，病理性近视，以及小儿先天性、遗传性眼病的诊断和治疗。尤其擅长各种复杂斜视的诊断和微创显微斜视手术，病理性近视的显微后巩膜加固术，儿童上睑下垂个性化矫正术，眼球震颤微创矫正术以及儿童青少年近视的精准科学个性化综合防控。',
 'Over 20 years of experience in strabismus and pediatric ophthalmology. Specializes in all types of strabismus and amblyopia, pediatric refractive errors (myopia, hyperopia, astigmatism), congenital ptosis, congenital nystagmus, progressive high myopia, pathological myopia, and congenital/hereditary eye diseases. Particularly skilled in complex strabismus microsurgery, posterior scleral reinforcement for pathological myopia, individualized ptosis correction, and comprehensive myopia prevention in children and adolescents.',
 NULL, NULL, '主任医师', 'Chief Physician', 'approved', NULL, 2, 1, '2026-05-19 23:45:55', '2026-05-19 23:45:55'),

(4,  2, '吴岚', 'Wu Lan', '眼科', 'Ophthalmology',
 '眼科副主任，白内障、青光眼和屈光矫正手术专家。擅长微小切口白内障手术和屈光性白内障手术、散光矫正型人工晶体及老视矫正型人工晶体的植入、ICL晶体植入，擅长白内障联合青光眼房角分离手术及疑难白内障青光眼诊治。',
 'Deputy Director of Ophthalmology, specialist in cataract, glaucoma, and refractive surgery. Skilled in micro-incision cataract surgery, refractive cataract surgery, toric and multifocal IOL implantation, ICL implantation, combined cataract-glaucoma angle separation surgery, and management of complex cataract-glaucoma cases.',
 NULL, NULL, '主任医师', 'Chief Physician', 'approved', NULL, 3, 1, '2026-05-19 23:45:55', '2026-05-19 23:45:55'),

(5,  2, '成琼', 'Cheng Qiong', '眼科屈光中心', 'Refractive Ophthalmology Center',
 '擅长准分子激光、全飞秒角膜激光、个性化飞秒角膜激光手术；复杂角膜屈光手术；圆锥角膜治疗；ICL有晶体眼人工晶体植入术；各类眼整形手术、眼整形修复术。',
 'Specializes in excimer laser, SMILE, personalized femtosecond laser surgery; complex corneal refractive surgery; keratoconus treatment; ICL phakic IOL implantation; and various oculoplastic and reconstructive surgeries.',
 NULL, NULL, '副主任医师', 'Associate Chief Physician', 'approved', NULL, 4, 1, '2026-05-19 23:45:55', '2026-05-19 23:45:55'),

(6,  2, '夏丽敏', 'Xia Limin', '消化内科', 'Gastroenterology',
 '华中科技大学同济医学院附属同济医院消化内科学术主任，泰康同济学术科主任级教授。',
 'Academic Director of Gastroenterology, Tongji Hospital, HUST; Academic Chief Professor at Taikang Tongji.',
 NULL, NULL, '教授/主任医师', 'Professor / Chief Physician', 'approved', NULL, 5, 1, '2026-05-19 23:45:55', '2026-05-19 23:45:55'),

(7,  2, '曾和松', 'Zeng Hesong', '心血管内科', 'Cardiovascular Medicine',
 '华中科技大学同济医学院附属同济医院心血管内科学术主任，泰康同济学术科主任级教授。',
 'Academic Director of Cardiovascular Medicine, Tongji Hospital, HUST; Academic Chief Professor at Taikang Tongji.',
 NULL, NULL, '教授/主任医师', 'Professor / Chief Physician', 'approved', NULL, 6, 1, '2026-05-19 23:45:55', '2026-05-19 23:45:55'),

(8,  2, '赵建平', 'Zhao Jianping', '呼吸与危重症医学科', 'Respiratory and Critical Care Medicine',
 '华中科技大学同济医学院附属同济医院呼吸与危重症医学科学术主任，泰康同济学术科主任级教授，每周三上午出诊。',
 'Academic Director of Respiratory and Critical Care Medicine, Tongji Hospital, HUST; Academic Chief Professor at Taikang Tongji. Outpatient clinic: Wednesday morning.',
 NULL, NULL, '教授/主任医师', 'Professor / Chief Physician', 'approved', NULL, 7, 1, '2026-05-19 23:45:55', '2026-05-19 23:45:55'),

(9,  2, '秦仁义', 'Qin Renyi', '肝胆胰外科', 'Hepatobiliary and Pancreatic Surgery',
 '华中科技大学同济医学院附属同济医院肝胆胰外科学术主任，泰康同济学术科主任级教授，每周一下午出诊。',
 'Academic Director of Hepatobiliary and Pancreatic Surgery, Tongji Hospital, HUST; Academic Chief Professor at Taikang Tongji. Outpatient clinic: Monday afternoon.',
 NULL, NULL, '教授/主任医师', 'Professor / Chief Physician', 'approved', NULL, 8, 1, '2026-05-19 23:45:55', '2026-05-19 23:45:55'),

(10, 2, '袁响林', 'Yuan Xianglin', '肿瘤科', 'Oncology',
 '华中科技大学同济医学院附属同济医院肿瘤科学术主任，泰康同济学术科主任级教授，每周四下午出诊。',
 'Academic Director of Oncology, Tongji Hospital, HUST; Academic Chief Professor at Taikang Tongji. Outpatient clinic: Thursday afternoon.',
 NULL, NULL, '教授/主任医师', 'Professor / Chief Physician', 'approved', NULL, 9, 1, '2026-05-19 23:45:55', '2026-05-19 23:45:55'),

(11, 2, '涂胜豪', 'Tu Shenghao', '中医科', 'Traditional Chinese Medicine',
 '华中科技大学同济医学院附属同济医院中医科学术主任，泰康同济学术科主任级教授。',
 'Academic Director of Traditional Chinese Medicine, Tongji Hospital, HUST; Academic Chief Professor at Taikang Tongji.',
 NULL, NULL, '教授/主任医师', 'Professor / Chief Physician', 'approved', NULL, 10, 1, '2026-05-19 23:45:55', '2026-05-19 23:45:55'),

(12, 2, '张木勋', 'Zhang Muxun', '内分泌内科', 'Endocrinology',
 '华中科技大学同济医学院附属同济医院内分泌内科专家，每周二上午在泰康同济出诊。',
 'Endocrinology specialist from Tongji Hospital, HUST. Outpatient clinic at Taikang Tongji: Tuesday morning.',
 NULL, NULL, '主任医师', 'Chief Physician', 'approved', NULL, 11, 1, '2026-05-19 23:45:55', '2026-05-19 23:45:55'),

(13, 2, '赵波', 'Zhao Bo', '内分泌内科', 'Endocrinology',
 '华中科技大学同济医学院附属同济医院内分泌内科专家，每周一下午在泰康同济出诊。',
 'Endocrinology specialist from Tongji Hospital, HUST. Outpatient clinic at Taikang Tongji: Monday afternoon.',
 NULL, NULL, '主任医师', 'Chief Physician', 'approved', NULL, 12, 1, '2026-05-19 23:45:55', '2026-05-19 23:45:55'),

(14, 2, '潘友民', 'Pan Youmin', '胸心外科', 'Cardiothoracic Surgery',
 '华中科技大学同济医学院附属同济医院胸心外科专家，每周五上午在泰康同济出诊。',
 'Cardiothoracic Surgery specialist from Tongji Hospital, HUST. Outpatient clinic at Taikang Tongji: Friday morning.',
 NULL, NULL, '主任医师', 'Chief Physician', 'approved', NULL, 13, 1, '2026-05-19 23:45:55', '2026-05-19 23:45:55'),

(15, 2, '陈志强', 'Chen Zhiqiang', '胸心外科', 'Cardiothoracic Surgery',
 '华中科技大学同济医学院附属同济医院胸心外科专家，每周四下午在泰康同济出诊。',
 'Cardiothoracic Surgery specialist from Tongji Hospital, HUST. Outpatient clinic at Taikang Tongji: Thursday afternoon.',
 NULL, NULL, '主任医师', 'Chief Physician', 'approved', NULL, 14, 1, '2026-05-19 23:45:55', '2026-05-19 23:45:55'),

(16, 2, '宋晓东', 'Song Xiaodong', '胸心外科', 'Cardiothoracic Surgery',
 '华中科技大学同济医学院附属同济医院胸心外科专家，每周一上午在泰康同济出诊。',
 'Cardiothoracic Surgery specialist from Tongji Hospital, HUST. Outpatient clinic at Taikang Tongji: Monday morning.',
 NULL, NULL, '主任医师', 'Chief Physician', 'approved', NULL, 15, 1, '2026-05-19 23:45:55', '2026-05-19 23:45:55'),

(17, 2, '李锋', 'Li Feng', '泌尿外科', 'Urology',
 '华中科技大学同济医学院附属同济医院泌尿外科专家，每周四下午在泰康同济出诊。',
 'Urology specialist from Tongji Hospital, HUST. Outpatient clinic at Taikang Tongji: Thursday afternoon.',
 NULL, NULL, '主任医师', 'Chief Physician', 'approved', NULL, 16, 1, '2026-05-19 23:45:55', '2026-05-19 23:45:55'),

(18, 2, '方煌', 'Fang Huang', '泌尿外科', 'Urology',
 '华中科技大学同济医学院附属同济医院泌尿外科专家，每周三下午在泰康同济出诊。',
 'Urology specialist from Tongji Hospital, HUST. Outpatient clinic at Taikang Tongji: Wednesday afternoon.',
 NULL, NULL, '主任医师', 'Chief Physician', 'approved', NULL, 17, 1, '2026-05-19 23:45:55', '2026-05-19 23:45:55'),

(19, 2, '杨勇', 'Yang Yong', '泌尿外科', 'Urology',
 '华中科技大学同济医学院附属同济医院泌尿外科专家，每周二上午在泰康同济出诊。',
 'Urology specialist from Tongji Hospital, HUST. Outpatient clinic at Taikang Tongji: Tuesday morning.',
 NULL, NULL, '主任医师', 'Chief Physician', 'approved', NULL, 18, 1, '2026-05-19 23:45:55', '2026-05-19 23:45:55'),

(20, 2, '易继林', 'Yi Jilin', '甲状腺乳腺外科', 'Thyroid and Breast Surgery',
 '华中科技大学同济医学院附属同济医院甲状腺乳腺外科专家，每周三上午在泰康同济出诊。',
 'Thyroid and Breast Surgery specialist from Tongji Hospital, HUST. Outpatient clinic at Taikang Tongji: Wednesday morning.',
 NULL, NULL, '主任医师', 'Chief Physician', 'approved', NULL, 19, 1, '2026-05-19 23:45:55', '2026-05-19 23:45:55'),

(21, 2, '刘谨文', 'Liu Jinwen', '甲状腺乳腺外科', 'Thyroid and Breast Surgery',
 '华中科技大学同济医学院附属同济医院甲状腺乳腺外科专家，每周五下午在泰康同济出诊。',
 'Thyroid and Breast Surgery specialist from Tongji Hospital, HUST. Outpatient clinic at Taikang Tongji: Friday afternoon.',
 NULL, NULL, '主任医师', 'Chief Physician', 'approved', NULL, 20, 1, '2026-05-19 23:45:55', '2026-05-19 23:45:55'),

(22, 2, '曹志新', 'Cao Zhixin', '胃肠外科', 'Gastrointestinal Surgery',
 '华中科技大学同济医学院附属同济医院胃肠外科专家，每周二上午在泰康同济出诊。',
 'Gastrointestinal Surgery specialist from Tongji Hospital, HUST. Outpatient clinic at Taikang Tongji: Tuesday morning.',
 NULL, NULL, '主任医师', 'Chief Physician', 'approved', NULL, 21, 1, '2026-05-19 23:45:55', '2026-05-19 23:45:55'),

(23, 2, '李登举', 'Li Dengju', '血液内科', 'Hematology',
 '华中科技大学同济医学院附属同济医院血液内科专家，每周二下午在泰康同济出诊。',
 'Hematology specialist from Tongji Hospital, HUST. Outpatient clinic at Taikang Tongji: Tuesday afternoon.',
 NULL, NULL, '主任医师', 'Chief Physician', 'approved', NULL, 22, 1, '2026-05-19 23:45:55', '2026-05-19 23:45:55'),

(24, 2, '崔永华', 'Cui Yonghua', '耳鼻咽喉科', 'Otolaryngology',
 '华中科技大学同济医学院附属同济医院耳鼻咽喉科专家，每周三上午在泰康同济出诊。',
 'Otolaryngology specialist from Tongji Hospital, HUST. Outpatient clinic at Taikang Tongji: Wednesday morning.',
 NULL, NULL, '主任医师', 'Chief Physician', 'approved', NULL, 23, 1, '2026-05-19 23:45:55', '2026-05-19 23:45:55'),

(25, 2, '王恒', 'Wang Heng', '耳鼻咽喉科', 'Otolaryngology',
 '华中科技大学同济医学院附属同济医院耳鼻咽喉科专家，每周四上午在泰康同济出诊。',
 'Otolaryngology specialist from Tongji Hospital, HUST. Outpatient clinic at Taikang Tongji: Thursday morning.',
 NULL, NULL, '主任医师', 'Chief Physician', 'approved', NULL, 24, 1, '2026-05-19 23:45:55', '2026-05-19 23:45:55'),

(26, 2, '王常玉', 'Wang Changyu', '妇科', 'Gynecology',
 '华中科技大学同济医学院附属同济医院妇科专家，每周六下午在泰康同济出诊。',
 'Gynecology specialist from Tongji Hospital, HUST. Outpatient clinic at Taikang Tongji: Saturday afternoon.',
 NULL, NULL, '主任医师', 'Chief Physician', 'approved', NULL, 25, 1, '2026-05-19 23:45:55', '2026-05-19 23:45:55'),

(27, 2, '曾万江', 'Zeng Wanjiang', '产科', 'Obstetrics',
 '华中科技大学同济医学院附属同济医院产科专家，每周五下午在泰康同济出诊。',
 'Obstetrics specialist from Tongji Hospital, HUST. Outpatient clinic at Taikang Tongji: Friday afternoon.',
 NULL, NULL, '主任医师', 'Chief Physician', 'approved', NULL, 26, 1, '2026-05-19 23:45:55', '2026-05-19 23:45:55'),

(28, 2, '李新宇', 'Li Xinyu', '眼科', 'Ophthalmology',
 '华中科技大学同济医学院附属同济医院眼科专家，每周日上午在泰康同济出诊。',
 'Ophthalmology specialist from Tongji Hospital, HUST. Outpatient clinic at Taikang Tongji: Sunday morning.',
 NULL, NULL, '主任医师', 'Chief Physician', 'approved', NULL, 27, 1, '2026-05-19 23:45:55', '2026-05-19 23:45:55'),

(29, 2, '管汉雄', 'Guan Hanxiong', '放射影像科', 'Radiology',
 '华中科技大学同济医学院附属同济医院放射影像科专家，每周四下午在泰康同济出诊。',
 'Radiology specialist from Tongji Hospital, HUST. Outpatient clinic at Taikang Tongji: Thursday afternoon.',
 NULL, NULL, '主任医师', 'Chief Physician', 'approved', NULL, 28, 1, '2026-05-19 23:45:55', '2026-05-19 23:45:55'),

(30, 2, '邓又斌', 'Deng Youbin', '超声影像科', 'Ultrasound Imaging',
 '华中科技大学同济医学院附属同济医院超声影像科专家，每周四上午在泰康同济出诊。',
 'Ultrasound Imaging specialist from Tongji Hospital, HUST. Outpatient clinic at Taikang Tongji: Thursday morning.',
 NULL, NULL, '主任医师', 'Chief Physician', 'approved', NULL, 29, 1, '2026-05-19 23:45:55', '2026-05-19 23:45:55'),

(31, 2, '田学愎', 'Tian Xuefu', '疼痛科', 'Pain Management',
 '华中科技大学同济医学院附属同济医院疼痛科专家，每周六上午在泰康同济出诊。',
 'Pain Management specialist from Tongji Hospital, HUST. Outpatient clinic at Taikang Tongji: Saturday morning.',
 NULL, NULL, '主任医师', 'Chief Physician', 'approved', NULL, 30, 1, '2026-05-19 23:45:55', '2026-05-19 23:45:55'),

(32, 3, '邹晓平', 'Zou Xiaoping', '消化内科', 'Gastroenterology',
 '泰康仙林鼓楼医院院长，消化内镜著名专家，技术精湛，探查精准。擅长消化道早癌筛查与内镜下精查治疗，在消化内镜领域具有深厚造诣。',
 'President of Taikang Xianlin Drum Tower Hospital, renowned expert in digestive endoscopy with superb technique and precise diagnostic capability. Specializes in early gastrointestinal cancer screening and endoscopic precision diagnosis and treatment.',
 NULL, NULL, '院长/主任医师', 'President / Chief Physician', 'approved', NULL, 1, 1, '2026-05-20 00:02:18', '2026-05-20 00:02:18'),

(33, 3, '施瑞华', 'Shi Ruihua', '消化内科', 'Gastroenterology',
 '东南大学附属中大医院首席专家，消化内镜著名专家。在消化道肿瘤早期诊断与内镜治疗领域具有丰富经验，技术精湛，探查精准。',
 'Chief Expert of Zhongda Hospital affiliated to Southeast University, renowned expert in digestive endoscopy. Extensive experience in early diagnosis of gastrointestinal tumors and endoscopic treatment.',
 NULL, NULL, '首席专家/主任医师', 'Chief Expert / Chief Physician', 'approved', NULL, 2, 1, '2026-05-20 00:02:18', '2026-05-20 00:02:18'),

(34, 3, '张以洋', 'Zhang Yiyang', '消化内科', 'Gastroenterology',
 '南京鼓楼医院消化内科主任医师，消化内镜著名专家。擅长消化道早癌筛查与内镜精查治疗，在消化内镜领域具有深厚造诣。',
 'Chief Physician of Gastroenterology, Nanjing Drum Tower Hospital, renowned expert in digestive endoscopy. Specializes in early gastrointestinal cancer screening and endoscopic precision diagnosis and treatment.',
 NULL, NULL, '主任医师', 'Chief Physician', 'approved', NULL, 3, 1, '2026-05-20 00:02:18', '2026-05-20 00:02:18');

ALTER TABLE doctors AUTO_INCREMENT = 35;

-- ============================================================
-- 医疗设备表（6条，id=2..7）
-- ============================================================
INSERT INTO equipments (id, hospital_id, name_zh, name_en, desc_zh, desc_en, image_url,
                        audit_status, rejection_reason, sort_order, is_active) VALUES
(2, 2, '联影320排 uCT 960+', 'United Imaging 320-Row uCT 960+',
 '国际一流先进CT设备。转速更高，0.25秒即可完成一圈扫描，大幅缩短检查时间，尤其适合难以屏息或需紧急救治的患者。分辨率更优，能精准识别0.5mm的微小病变，血管内小血栓、早期肺结节等隐匿病灶均可被检出。辐射剂量更低，在保证成像质量的同时最大限度保障患者安全。擅长骨骼、肺部、急诊外伤检查。',
 'World-class advanced CT equipment. Higher rotation speed — completes one full scan in 0.25 seconds, significantly reducing examination time, especially suitable for patients who cannot hold their breath or require emergency treatment. Superior resolution — accurately identifies lesions as small as 0.5mm, including small intravascular thrombi and early pulmonary nodules. Lower radiation dose — maximizes patient safety while maintaining imaging quality. Best suited for skeletal, pulmonary, and emergency trauma examinations.',
 'http://localhost:8080/media/equipments/images/36172b6e-89c4-46ea-a1a2-137c73c8a139.png',
 'approved', NULL, 1, 1),

(3, 2, '联影3.0T uMR 790', 'United Imaging 3.0T uMR 790',
 '国际一流先进MRI设备。3.0T超高场强，信号强度与信噪比更高，对软组织的分辨率尤为卓越。可融合多维信息，为病变性质的鉴别提供深层依据。无电离辐射，为需反复检查者、儿童及特殊人群提供更安全的影像评估选择。适用于脑部、神经、关节韧带、腹部盆腔器官及乳腺等软组织检查。',
 'World-class advanced MRI equipment. 3.0T ultra-high field strength with superior signal intensity, signal-to-noise ratio, and soft tissue resolution. Multi-dimensional information fusion provides deeper diagnostic insights. No ionizing radiation — a safer imaging option for patients requiring repeated examinations, children, and special populations. Ideal for brain, neurological, joint/ligament, abdominal/pelvic organ, and breast soft tissue examinations.',
 NULL, 'approved', NULL, 2, 1),

(4, 2, '第四代达芬奇手术机器人', 'Da Vinci Xi Surgical Robot (4th Generation)',
 '2025年7月24日正式启用，由中国泌尿外科腹腔镜及机器人领域奠基人张旭院士等40余位国内知名专家共同见证。达芬奇手术机器人是一种高端智能化的机器人外科手术平台，由视频成像系统、床旁机械臂系统和主刀医师操控台三部分组成。可提供10-15倍放大视野，荧光显影技术可识别深层血管组织；仿真手腕灵活性和稳定性远超人手，能滤除生理性震颤，实现毫米级精准操控；显著减少术中出血、组织损伤及术后疼痛，加速患者康复。目前广泛应用于妇产科、普通外科、胸外科、泌尿外科、甲乳外科及心脏手术。',
 'Officially launched on July 24, 2025, witnessed by Academician Zhang Xu — a pioneer in laparoscopic and robotic urology in China — and over 40 leading domestic experts. The Da Vinci Surgical Robot is an advanced intelligent robotic surgical platform consisting of a vision system, patient-side robotic arm system, and surgeon console. It provides 10–15× magnified 3D vision with fluorescence imaging to identify deep vascular structures; its wristed instruments offer dexterity and stability far exceeding the human hand, filtering physiological tremors for millimeter-level precision. It significantly reduces intraoperative bleeding, tissue damage, and postoperative pain, accelerating patient recovery. Currently used in gynecology, general surgery, thoracic surgery, urology, thyroid/breast surgery, and cardiac surgery.',
 NULL, 'approved', NULL, 3, 1),

(5, 3, 'PET-CT', 'PET-CT Scanner',
 '一次性完成全身扫描，同时看清病灶的形态和代谢，是肿瘤诊断的利器。能在肿瘤早期发现微小病灶，为临床提供精准的诊断依据，广泛应用于肿瘤筛查、分期、疗效评估及复发监测。',
 'Completes whole-body scanning in a single session, simultaneously revealing lesion morphology and metabolic activity — a powerful tool for tumor diagnosis. Detects minute lesions at early tumor stages, providing precise diagnostic evidence for clinical decision-making. Widely used in tumor screening, staging, treatment response evaluation, and recurrence monitoring.',
 NULL, 'approved', NULL, 1, 1),

(6, 3, '达芬奇手术机器人', 'Da Vinci Surgical Robot',
 '目前全球最先进的外科手术系统之一，让医生能更精准、灵活地完成微创手术。系统由视频成像系统、床旁机械臂系统和主刀医师操控台三部分组成，可提供高清放大视野，仿真手腕灵活性远超人手，能滤除生理性震颤，实现毫米级精准操控，显著减少术中出血和术后疼痛，加速患者康复。',
 'One of the world\'s most advanced surgical systems, enabling surgeons to perform minimally invasive procedures with greater precision and flexibility. Comprising a vision system, patient-side robotic arm system, and surgeon console, it provides high-definition magnified vision, wrist articulation far exceeding human capability, physiological tremor filtration, and millimeter-level precision — significantly reducing intraoperative bleeding, postoperative pain, and recovery time.',
 NULL, 'approved', NULL, 2, 1),

(7, 3, '日本奥林巴斯X1超清放大内镜系统', 'Olympus X1 Ultra-HD Magnifying Endoscope System',
 '提供超高清的显微级图像，能实时观察到细胞层面的微血管和黏膜结构，早癌识别精度提升40%。结合AI智能双重阅片，综合早癌识别率超过90%。是高端胃肠镜检查的核心设备，可实现精查治疗一次完成，发现复杂病变立即启动MDT多学科会诊。',
 'Delivers ultra-high-definition microscopic-level images for real-time visualization of microvascular and mucosal structures at the cellular level, improving early cancer detection accuracy by 40%. Combined with AI-assisted dual reading, the overall early cancer detection rate exceeds 90%. The core equipment for premium gastrointestinal endoscopy, enabling precision diagnosis and treatment in a single session with immediate MDT consultation for complex lesions.',
 NULL, 'approved', NULL, 3, 1);

ALTER TABLE equipments AUTO_INCREMENT = 8;

-- ============================================================
-- 医院诊疗环境表（1条，id=3）
-- ============================================================
INSERT INTO hospital_environments (id, hospital_id, name_zh, name_en, desc_zh, desc_en, image_url,
                                   audit_status, rejection_reason, sort_order, is_active) VALUES
(3, 2, 'VIP病房', 'VIP',
 'VIP病房VIP病房VIP病房VIP病房', 'VIPVIPVIP',
 'http://localhost:8080/media/environments/e6abab00-144f-460d-8d83-384894631e6a.png',
 'approved', NULL, 0, 1);

ALTER TABLE hospital_environments AUTO_INCREMENT = 4;

-- ============================================================
-- 服务团队表（2条，id=1,2）
-- ============================================================
INSERT INTO service_teams (id, name_zh, name_en, intro_zh, intro_en, image_url, sort_order, is_active, created_at, updated_at) VALUES
(1, '重庆康辉', 'Kanghui ChongQing',
 '重庆康辉重庆康辉重庆康辉重庆康辉重庆康辉',
 'Kanghui ChongQingKanghui ChongQingKanghui ChongQingKanghui ChongQing',
 NULL, 0, 1, '2026-05-19 20:46:42', '2026-05-19 20:46:42'),
(2, '重庆细游国际旅行社有限公司', 'Chongqing Xiyou International Travel Agency Co., Ltd',
 '重庆细游国际旅行社有限公司重庆细游国际旅行社有限公司重庆细游国际旅行社有限公司',
 'Chongqing Xiyou International Travel Agency Co., LtdChongqing Xiyou International Travel Agency Co., LtdChongqing Xiyou International Travel Agency Co., Ltd',
 NULL, 0, 1, '2026-05-20 07:22:42', '2026-05-20 07:22:42');

ALTER TABLE service_teams AUTO_INCREMENT = 3;

-- ============================================================
-- 服务亮点表（1条，id=1）
-- ============================================================
INSERT INTO service_features (id, name_zh, name_en, intro_zh, intro_en, image_url, sort_order, is_active, created_at, updated_at) VALUES
(1, '代订机票', 'Fight booking',
 '代订机票代订机票代订机票', 'Fight bookingFight bookingFight booking',
 'http://localhost:8080/media/service-features/images/d2a3c2af-da6f-40b6-9262-445b63efcc17.png',
 0, 1, '2026-05-21 15:36:36', '2026-05-21 15:36:46');

ALTER TABLE service_features AUTO_INCREMENT = 2;

-- ============================================================
-- 服务团队-亮点关联表（1条，id=1）
-- ============================================================
INSERT INTO service_team_features (id, service_team_id, service_feature_id) VALUES
(1, 1, 1);

ALTER TABLE service_team_features AUTO_INCREMENT = 2;

-- ============================================================
-- 实体媒体资源表（1条，id=4）
-- ============================================================
INSERT INTO entity_media (id, entity_type, entity_id, media_type, url, is_cover, sort_order, created_at) VALUES
(4, 'hospital', 2, 'image', 'http://localhost:8080/media/hospitals/images/358d8f2c-5ad6-4442-8976-5a0c6417db8f.png', 1, 0, '2026-05-19 23:47:51');

ALTER TABLE entity_media AUTO_INCREMENT = 5;

-- ============================================================
-- 特需产品表（11条，id=2..12）
-- ============================================================
INSERT INTO special_products (id, hospital_id, name_zh, name_en, summary_zh, summary_en,
                               detail_zh, detail_en, cover_image_url, price_min, price_max,
                               contact_person, contact_info, audit_status, rejection_reason,
                               sort_order, is_active, created_at, updated_at) VALUES
(2, 2, '肠菌移植项目', 'Fecal Microbiota Transplantation (FMT) Program',
 '通过移植健康供体的肠道菌群，修复肠道微生态，从源头干预慢性病进程。适用于溃疡性结肠炎、克罗恩病、功能性便秘、肠易激综合征、帕金森病、糖尿病、肥胖症等多种疾病。',
 'Restores gut microbiota by transplanting healthy donor flora to intervene in chronic disease progression at the source. Indicated for ulcerative colitis, Crohn\'s disease, functional constipation, IBS, Parkinson\'s disease, diabetes, obesity, and more.',
 '泰康同济肠菌移植项目依托华中科技大学同济医学院附属同济医院胃肠外科主任王桂华教授团队（国家杰青2024、国家优青2019），联合华中菌群库高标准供体资源，提供从菌群检测到移植治疗的全周期健康管理服务。供体严选18-25周岁985高校在校医学生，构建全链条质量管控。项目涵盖肠道菌群宏基因组检测、肠菌胶囊及活菌液移植等多种方案，1+N多学科团队提供全周期健康管理。',
 'The Taikang Tongji FMT Program is led by Professor Wang Guihua\'s team (NSFC Outstanding Young Scientist 2024 & 2019) from the Department of Gastrointestinal Surgery, Tongji Hospital, HUST. Leveraging the Central China Microbiome Bank with rigorously selected donors (medical students aged 18–25 from top-tier universities), the program offers full-cycle health management from microbiome testing to transplantation. Services include metagenomics testing, FMT capsules, and live bacterial liquid transplantation, supported by a multidisciplinary team.',
 NULL, 1530.00, 56000.00, '国际医疗部', '4000195522', 'approved', NULL, 1, 1, '2026-05-19 23:45:55', '2026-05-19 23:45:55'),

(3, 2, 'NAD+综合抗衰', 'NAD+ Comprehensive Anti-Aging Therapy',
 '通过补充NAD+辅酶，从分子层面优化细胞功能，延缓衰老进程。适用于中年亚健康、慢性疲劳、睡眠差、更年期、高压工作者等人群。',
 'Optimizes cellular function at the molecular level by replenishing NAD+ coenzyme to slow the aging process. Suitable for middle-aged sub-health, chronic fatigue, poor sleep, menopause, and high-stress individuals.',
 'NAD+是参与氧化还原反应的重要辅酶，体内NAD+水平随增龄而降低，导致线粒体功能障碍、细胞衰老加速。泰康同济NAD+综合抗衰项目采用国内唯一药准字号产品，在国际医疗部环境下提供医疗级服务，365天×（8am-8pm）全年无休。5次/1疗程，间隔3个月后可进行下一疗程。',
 'NAD+ is a vital coenzyme involved in redox reactions; its levels decline with age, leading to mitochondrial dysfunction and accelerated cellular aging. Taikang Tongji\'s NAD+ Anti-Aging Program uses the only NMPA-approved pharmaceutical-grade product in China, delivered in the International Medical Department with medical-grade service, 365 days × 8am–8pm. One course = 5 sessions; next course after 3-month interval.',
 NULL, 33000.00, 33000.00, '国际医疗部', '4000195522', 'approved', NULL, 2, 1, '2026-05-19 23:45:55', '2026-05-19 23:45:55'),

(4, 2, '血脂净化', 'Blood Lipid Purification Therapy',
 '最快速的降低血脂方案，通过血管大扫除养护血管健康。适用于高脂血症、高甘油三酯、高尿酸、糖尿病等代谢性疾病患者。',
 'The fastest blood lipid reduction solution for comprehensive vascular health management. Indicated for hyperlipidemia, hypertriglyceridemia, hyperuricemia, diabetes, and other metabolic disorders.',
 '泰康同济血脂净化项目提供两种套餐方案：套餐1包含主任医师问诊、专家会诊、特需病房、仪器检查、抽血检验、祛脂治疗、陪诊等服务；套餐2在套餐1基础上升级为多学科专家会诊、国疗病房、深度仪器检查、精准检验方案、血管衰老检查、专人陪诊、营养膳食等全方位服务。具体适用范围及总费用以医疗机构面诊意见为准。',
 'Taikang Tongji\'s Blood Lipid Purification Program offers two packages: Package 1 includes chief physician consultation, specialist consultation, premium ward, instrument examination, blood tests, lipid-clearing treatment, and escort service; Package 2 upgrades to multidisciplinary expert consultation, international medical ward, in-depth instrument examination, precision testing, vascular aging assessment, dedicated escort, and nutritional meal planning. Final scope and total cost subject to in-person medical assessment.',
 NULL, 24000.00, 39800.00, '国际医疗部', '4000195522', 'approved', NULL, 3, 1, '2026-05-19 23:45:55', '2026-05-19 23:45:55'),

(5, 2, '多模态创新睡眠管理方案', 'Multi-Modal Innovative Sleep Management Program',
 '华中地区唯一多模态睡眠疗愈中心，以麻醉诱导治疗为特色，联合肠菌移植、NAD+细胞能量激活，多学科融合的高级睡眠医学中心。',
 'The only multi-modal sleep healing center in Central China, featuring anesthesia-induced therapy combined with FMT and NAD+ cellular energy activation — an advanced multidisciplinary sleep medicine center.',
 '泰康同济多模态创新睡眠管理方案整合五大治疗模块：①睡眠相关评估；②基础睡眠治疗；③麻醉诱导及神经阻滞方案；④特色心理治疗（CBT-I）；⑤睡眠底层调节（肠道菌群移植调节肠-脑轴、NAD+调节生物钟）。提供五大个性化方案：泰·睿能、泰·舒压、泰·安悦、泰·守护、泰·归元。',
 'Taikang Tongji\'s Multi-Modal Sleep Management Program integrates five treatment modules: ① Sleep assessment; ② Basic sleep treatment; ③ Anesthesia induction & nerve block; ④ Specialized psychotherapy (CBT-I); ⑤ Deep sleep regulation (FMT for gut-brain axis, NAD+ for circadian rhythm). Five personalized programs available.',
 NULL, NULL, NULL, '国际医疗部', '4000195522', 'approved', NULL, 4, 1, '2026-05-19 23:45:55', '2026-05-19 23:45:55'),

(6, 3, '高端胃肠镜', 'Premium Gastrointestinal Endoscopy',
 '采用日本奥林巴斯X1超清放大内镜系统，结合AI智能双重阅片，早癌识别率超90%。由消化内镜著名专家主诊，精查治疗一次完成，入住国际部私密单人间，健康管理师一对一全程服务。',
 'Using the Olympus X1 ultra-HD magnifying endoscope system combined with AI dual reading, achieving early cancer detection rate over 90%. Performed by renowned digestive endoscopy experts, with diagnosis and treatment completed in one session.',
 '中国是全球胃癌高发国家，占全球胃癌病例45%；结直肠癌近年已上升为发病率排名第二位的恶性肿瘤。泰康仙林鼓楼医院国际医疗中心高端胃肠镜项目优势：①消化内镜著名专家主诊；②精查治疗一次完成；③日本奥林巴斯X1超清放大内镜系统；④AI智能双重阅片；⑤发现复杂病变立即启动MDT多学科会诊；⑥入住国际部私密单人间，健康管理师一对一服务。',
 'China accounts for 45% of global gastric cancer cases, and colorectal cancer has risen to the second most common malignancy. The Premium Gastrointestinal Endoscopy program at Taikang Xianlin Drum Tower Hospital offers: ① Renowned endoscopy experts; ② Diagnosis and treatment in one session; ③ Olympus X1 ultra-HD endoscope; ④ AI-assisted dual reading; ⑤ Immediate MDT consultation; ⑥ Private single room with one-on-one health manager service.',
 NULL, NULL, NULL, '国际医疗中心', '025-83169988', 'approved', NULL, 1, 1, '2026-05-20 00:02:18', '2026-05-20 00:02:18'),

(7, 3, '肠道菌群移植', 'Fecal Microbiota Transplantation (FMT)',
 '重塑肠道微生态，通过移植健康供体的肠道菌群，从源头干预慢性病进程，改善肠道健康。',
 'Reshape the gut microbiome by transplanting healthy donor flora to intervene in chronic disease progression at the source and improve gut health.',
 '肠道菌群移植（FMT）是通过将健康供体的肠道菌群移植到患者体内，重塑肠道微生态平衡，从而改善或治疗多种疾病的创新医疗手段。泰康仙林鼓楼医院国际医疗中心提供专业的肠道菌群移植服务，适用于溃疡性结肠炎、克罗恩病、功能性便秘、肠易激综合征等消化系统疾病，以及代谢综合征、糖尿病、肥胖症等代谢性疾病。',
 'Fecal Microbiota Transplantation (FMT) is an innovative medical approach that restores gut microbiome balance by transplanting healthy donor flora into patients. The International Medical Center at Taikang Xianlin Drum Tower Hospital provides professional FMT services, indicated for digestive disorders and metabolic conditions including ulcerative colitis, Crohn\'s disease, IBS, metabolic syndrome, diabetes, and obesity.',
 NULL, NULL, NULL, '国际医疗中心', '025-83169988', 'approved', NULL, 2, 1, '2026-05-20 00:02:18', '2026-05-20 00:02:18'),

(8, 3, '中医特色诊疗', 'Traditional Chinese Medicine (TCM) Specialty Care',
 '融合传统中医与现代医学，提供中医针灸、中药调理、射灸舱等特色诊疗服务，改善亚健康状态，调理慢性疾病。',
 'Integrating traditional Chinese medicine with modern medicine, offering acupuncture, herbal medicine, moxibustion therapy, and other specialty TCM services to improve sub-health conditions and manage chronic diseases.',
 '泰康仙林鼓楼医院国际医疗中心中医特色诊疗项目，依托医院中医科专业团队，提供个性化中医诊疗方案。服务包括中医针灸美容、中药调理、射灸舱等特色项目，适用于亚健康调理、慢性病管理、美容养颜、疼痛管理等需求。',
 'The TCM Specialty Care program at Taikang Xianlin Drum Tower Hospital International Medical Center is supported by the hospital\'s professional TCM department, offering personalized TCM treatment plans including acupuncture, herbal medicine, and moxibustion therapy, suitable for sub-health management, chronic disease management, cosmetic wellness, and pain management.',
 NULL, NULL, NULL, '国际医疗中心', '025-83169988', 'approved', NULL, 3, 1, '2026-05-20 00:02:18', '2026-05-20 00:02:18'),

(9, 3, '净血疗法', 'Blood Purification Therapy',
 '通过血液净化技术清除体内有害物质，改善血液质量，降低血脂、血糖等代谢指标，养护血管健康。',
 'Removes harmful substances from the body through blood purification technology, improving blood quality, reducing lipids, blood glucose, and other metabolic indicators, and protecting vascular health.',
 '泰康仙林鼓楼医院国际医疗中心净血疗法项目，采用先进的血液净化技术，通过清除血液中的有害物质、多余脂质及代谢废物，改善血液流变学指标，降低心脑血管疾病风险。适用于高脂血症、高尿酸血症、代谢综合征等人群。',
 'The Blood Purification Therapy program at Taikang Xianlin Drum Tower Hospital uses advanced blood purification technology to remove harmful substances, excess lipids, and metabolic waste from the blood, improving hemorheological indicators and reducing cardiovascular and cerebrovascular disease risk.',
 NULL, NULL, NULL, '国际医疗中心', '025-83169988', 'approved', NULL, 4, 1, '2026-05-20 00:02:18', '2026-05-20 00:02:18'),

(10, 3, '泌尿科特需诊疗', 'Urology Premium Care',
 '依托医院泌尿医学中心，提供泌尿系统疾病的高端特需诊疗服务，涵盖精准诊断、微创手术及个性化治疗方案。',
 'Leveraging the hospital\'s Urology Medical Center, providing premium urology care covering precision diagnosis, minimally invasive surgery, and personalized treatment plans.',
 '泰康仙林鼓楼医院国际医疗中心泌尿科特需诊疗项目，依托医院泌尿医学中心专业团队，服务涵盖泌尿系统肿瘤、前列腺疾病、肾脏疾病、尿路结石等常见及复杂泌尿系统疾病的精准诊断与治疗，可结合达芬奇手术机器人开展微创手术。',
 'The Urology Premium Care program at Taikang Xianlin Drum Tower Hospital is supported by the hospital\'s professional urology team, providing precision diagnosis and treatment of urological tumors, prostate diseases, kidney diseases, and urinary tract stones, with Da Vinci robotic minimally invasive surgery available.',
 NULL, NULL, NULL, '国际医疗中心', '025-83169988', 'approved', NULL, 5, 1, '2026-05-20 00:02:18', '2026-05-20 00:02:18'),

(11, 3, '肠道微生态检测', 'Gut Microbiome Testing',
 '通过宏基因组测序技术，全面评估肠道菌群构成与健康状态，为个性化健康管理和疾病干预提供科学依据。',
 'Using metagenomics sequencing technology to comprehensively assess gut microbiome composition and health status, providing scientific basis for personalized health management and disease intervention.',
 '泰康仙林鼓楼医院国际医疗中心肠道微生态检测项目，采用先进的宏基因组测序技术，对肠道菌群进行全面深度分析。检测结果可评估肠道健康状态、发现菌群失衡风险，为肠道菌群移植、慢病管理、营养干预等提供精准的个性化方案依据。',
 'The Gut Microbiome Testing program leverages advanced metagenomics sequencing technology for comprehensive in-depth gut microbiome analysis, providing guidance for FMT, chronic disease management, and nutritional intervention.',
 NULL, NULL, NULL, '国际医疗中心', '025-83169988', 'approved', NULL, 6, 1, '2026-05-20 00:02:18', '2026-05-20 00:02:18'),

(12, 3, '自体脂肪微颗粒技术', 'Autologous Micro-Fat Grafting Technology',
 '采用自体脂肪微颗粒移植技术，利用自身脂肪组织进行面部年轻化及形体塑造，安全无排异，效果自然持久。',
 'Using autologous micro-fat grafting technology to perform facial rejuvenation and body contouring with the patient\'s own adipose tissue — safe, no rejection risk, with natural and long-lasting results.',
 '泰康仙林鼓楼医院国际医疗中心自体脂肪微颗粒技术项目，采用先进的自体脂肪微颗粒移植技术，通过精细化提取、处理和注射自体脂肪，实现面部年轻化、轮廓塑造及局部填充。安全性高，效果自然持久。适用于面部凹陷填充、面部年轻化、形体塑造等美容医疗需求。',
 'The Autologous Micro-Fat Grafting Technology program uses advanced autologous micro-fat grafting techniques to achieve facial rejuvenation, contouring, and localized filling. Using autologous tissue eliminates rejection risk, ensuring high safety with natural and long-lasting results.',
 NULL, NULL, NULL, '国际医疗中心', '025-83169988', 'approved', NULL, 7, 1, '2026-05-20 00:02:18', '2026-05-20 00:02:18');

ALTER TABLE special_products AUTO_INCREMENT = 13;

-- ============================================================
-- 产品套餐表（15条，id=3..17）
-- ============================================================
INSERT INTO product_variants (id, product_id, name_zh, name_en, desc_zh, desc_en, price, sort_order, is_active) VALUES
(3,  2, '肠道菌群宏基因组检测（1G数据版）', 'Gut Microbiome Metagenomics Test (1G Data)',
 '1G测序数据量，适合基础菌群健康评估。', '1G sequencing data for basic gut microbiome health assessment.', 1530.00, 1, 1),
(4,  2, '肠道菌群宏基因组检测（6G数据版）', 'Gut Microbiome Metagenomics Test (6G Data)',
 '6G测序数据量，提供更精准深度的菌群分析报告。', '6G sequencing data for more precise and in-depth microbiome analysis.', 2520.00, 2, 1),
(5,  2, '肠菌胶囊基础版（特需门诊）', 'FMT Capsule Basic Package (Premium Outpatient)',
 '特需门诊模式，口服肠菌胶囊移植，基础方案。', 'Premium outpatient mode, oral FMT capsule transplantation, basic plan.', 25000.00, 3, 1),
(6,  2, '肠菌胶囊进阶版（特需门诊）', 'FMT Capsule Advanced Package (Premium Outpatient)',
 '特需门诊模式，口服肠菌胶囊移植，进阶方案，含更全面的检测与随访。', 'Premium outpatient mode, oral FMT capsule transplantation, advanced plan with more comprehensive testing and follow-up.', 34000.00, 4, 1),
(7,  2, '肠菌胶囊尊享版（特需部住院7天/6晚）', 'FMT Capsule Premium Package (7-Day/6-Night Inpatient)',
 '特需部住院7天6晚，口服肠菌胶囊移植，尊享全程住院服务。', '7-day/6-night inpatient stay in premium ward, oral FMT capsule transplantation with full premium inpatient services.', 48000.00, 5, 1),
(8,  2, '肠菌活菌液臻至版（特需部住院7天/6晚）', 'FMT Live Bacterial Liquid Supreme Package (7-Day/6-Night Inpatient)',
 '特需部住院7天6晚，活菌液移植，最高规格方案，疗效更优。', '7-day/6-night inpatient stay in premium ward, live bacterial liquid transplantation — highest-tier plan with superior efficacy.', 56000.00, 6, 1),
(9,  3, 'NAD+综合抗衰（5次/1疗程）', 'NAD+ Anti-Aging Therapy (5 Sessions / 1 Course)',
 '1疗程共5次静脉注射，建议间隔3个月后进行下一疗程。在国际医疗部环境下提供医疗级服务，365天×（8am-8pm）。', '1 course of 5 intravenous infusion sessions; next course recommended after 3-month interval. Medical-grade service in the International Medical Department, 365 days × 8am–8pm.', 33000.00, 1, 1),
(10, 4, '血脂净化套餐1', 'Blood Lipid Purification Package 1',
 '包含：主任医师问诊、专家会诊、特需病房、仪器检查、抽血检验、祛脂治疗、陪诊。', 'Includes: chief physician consultation, specialist consultation, premium ward, instrument examination, blood tests, lipid-clearing treatment, escort service.', 24000.00, 1, 1),
(11, 4, '血脂净化套餐2', 'Blood Lipid Purification Package 2',
 '包含：多学科专家会诊、国疗病房、深度仪器检查、精准检验方案、血管衰老检查、祛脂治疗、专人陪诊、营养膳食。具体适用范围及总费用以医疗机构面诊意见为准。', 'Includes: multidisciplinary expert consultation, international medical ward, in-depth instrument examination, precision testing, vascular aging assessment, lipid-clearing treatment, dedicated escort, nutritional meal planning. Final scope and cost subject to in-person medical assessment.', 39800.00, 2, 1),
(12, 5, '泰·睿能（精英睡眠效率提升方案）', 'Tai·Ruineng (Elite Sleep Efficiency Enhancement)',
 '针对精英人群的睡眠效率提升方案，改善入睡质量、提升日间精力与专注力。', 'Sleep efficiency enhancement program for high-performance individuals, improving sleep onset quality and daytime energy and focus.', NULL, 1, 1),
(13, 5, '泰·舒压（急性压力失眠阻断方案）', 'Tai·Shuya (Acute Stress Insomnia Relief)',
 '针对急性压力导致的失眠，快速阻断压力-失眠恶性循环。', 'Targets acute stress-induced insomnia to rapidly break the stress-insomnia vicious cycle.', NULL, 2, 1),
(14, 5, '泰·安悦（女性全周期睡眠调养方案）', 'Tai·Anyue (Women\'s Full-Cycle Sleep Care)',
 '针对女性经期、孕期、更年期等全生命周期睡眠问题的综合调养方案。', 'Comprehensive sleep care program addressing women\'s sleep issues across all life stages including menstruation, pregnancy, and menopause.', NULL, 3, 1),
(15, 5, '泰·守护（老年慢病睡眠管理方案）', 'Tai·Shouhu (Elderly Chronic Disease Sleep Management)',
 '针对老年慢病患者的睡眠管理，兼顾基础疾病与睡眠障碍的综合干预。', 'Sleep management for elderly patients with chronic diseases, integrating intervention for both underlying conditions and sleep disorders.', NULL, 4, 1),
(16, 5, '泰·归元（重度失眠神经调控康复方案）', 'Tai·Guiyuan (Severe Insomnia Neuromodulation Rehabilitation)',
 '针对重度失眠患者，以麻醉诱导睡眠平衡术、星状神经节阻滞为核心的神经调控康复方案。', 'Neuromodulation rehabilitation program for severe insomnia, centered on anesthesia-induced sleep balancing and stellate ganglion block (SGB).', NULL, 5, 1),
(17, 6, '高端胃肠镜尊享套餐', 'Premium Gastrointestinal Endoscopy VIP Package',
 '入住国际部私密单人间，健康管理师一对一全程服务。包含：消化内镜著名专家主诊、日本奥林巴斯X1超清放大内镜检查、AI智能双重阅片、精查治疗一次完成、发现复杂病变立即启动MDT多学科会诊、全程舒适无忧服务。', 'Private single room in the International Medical Department with one-on-one health manager service throughout. Includes: renowned digestive endoscopy expert consultation, Olympus X1 ultra-HD magnifying endoscope examination, AI-assisted dual reading, precision diagnosis and treatment in one session, immediate MDT consultation for complex lesions, and full comfort service.', NULL, 1, 1);

ALTER TABLE product_variants AUTO_INCREMENT = 18;

-- ============================================================
SET FOREIGN_KEY_CHECKS = 1;
-- ============================================================
-- 验证行数（可手动执行）
-- SELECT 'hospitals',        COUNT(*) FROM hospitals;        -- 预期: 3
-- SELECT 'doctors',          COUNT(*) FROM doctors;          -- 预期: 33
-- SELECT 'equipments',       COUNT(*) FROM equipments;       -- 预期: 6
-- SELECT 'hospital_environments', COUNT(*) FROM hospital_environments; -- 预期: 1
-- SELECT 'special_products', COUNT(*) FROM special_products; -- 预期: 11
-- SELECT 'product_variants', COUNT(*) FROM product_variants; -- 预期: 15
-- SELECT 'service_teams',    COUNT(*) FROM service_teams;    -- 预期: 2
-- SELECT 'service_features', COUNT(*) FROM service_features; -- 预期: 1
-- SELECT 'users',            COUNT(*) FROM users;            -- 预期: 4
-- ============================================================
