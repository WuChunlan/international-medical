USE international_medical;

-- ============================================================
-- 泰康同济（武汉）医院 种子数据
-- 来源：资料/泰康同济资料/ 下三份 PDF
-- ============================================================

-- ============================================================
-- 1. 医院
-- ============================================================
INSERT INTO hospitals (
  name_zh, name_en,
  intro_zh, intro_en,
  cover_image_url, video_url,
  address_zh, address_en,
  phone, contact_person, contact_info,
  sort_order, is_active
) VALUES (
  '泰康同济（武汉）医院',
  'Taikang Tongji (Wuhan) Hospital',
  '泰康同济（武汉）医院是世界500强企业泰康保险集团全资投资、与华中科技大学同济医学院附属同济医院合作管理的高品质、非营利性综合医院。医院于2020年2月开业，2025年6月成为武汉大学泰康临床学院，2026年4月获评国家三级甲等综合医院。医院位于武汉市汉阳区四新生态新城，建筑面积约27.6万平方米，规划床位1200余张，投资总额近40亿人民币。医院定位为泰康华中区域医、教、研一体化的大型综合医疗机构，采用"强专科+大综合"、"普惠医疗+特需医疗"的方式运营，以健康管理、慢病管理、老年医学为特色，着力打造长寿医院。医院荣获"全国抗击新冠肺炎疫情先进集体"至高荣誉，系湖北省基本医疗保险异地就医、武汉市基本医疗保险及湖北省商业保险定点医院。',
  'Taikang Tongji (Wuhan) Hospital is a high-quality, non-profit general hospital wholly invested by Taikang Insurance Group (Fortune Global 500) and co-managed with Tongji Hospital affiliated to Tongji Medical College of Huazhong University of Science and Technology. Opened in February 2020, it became the Taikang Clinical College of Wuhan University in June 2025 and was designated a Class-III Grade-A hospital in April 2026. Located in the Sixin Eco-City of Hanyang District, Wuhan, the hospital covers a building area of approximately 276,000 m² with a planned capacity of 1,200+ beds and a total investment of nearly RMB 4 billion. Positioned as Taikang''s integrated medical, education and research center in Central China, it operates under a model of "specialized + comprehensive" and "universal + premium" care, with distinctive strengths in health management, chronic disease management, and geriatric medicine. The hospital was awarded the national honor of "Advanced Collective in Fighting COVID-19" and is a designated hospital for Hubei provincial medical insurance, Wuhan municipal medical insurance, and Hubei commercial insurance.',
  NULL, NULL,
  '武汉市汉阳区四新北路322号',
  'No. 322, Sixin North Road, Hanyang District, Wuhan',
  '4000195522',
  '国际医疗部',
  '4000195522',
  0, 1
);

SET @hospital_id = LAST_INSERT_ID();

-- ============================================================
-- 2. 医生
-- ============================================================
INSERT INTO doctors (
  hospital_id, name_zh, name_en,
  specialty_zh, specialty_en,
  title_zh, title_en,
  bio_zh, bio_en,
  photo_url, price_per_visit, sort_order, is_active
) VALUES

-- 泰康同济自有医生：眼科团队
(
  @hospital_id, '陈中山', 'Chen Zhongshan',
  '眼科', 'Ophthalmology',
  '副教授/主任医师', 'Associate Professor / Chief Physician',
  '眼科科主任，眼科博士，神经眼科博士后，硕士生导师。对眼科复杂疑难疾病有丰富诊治经验，尤其在眼底病、神经眼科疾病、黄斑疾病、葡萄膜炎、视网膜变性和视神经疾病等领域有深厚造诣。现为国际视觉和眼科协会（ARVO）会员，国际临床视觉电生理协会（ISCEV）委员，中华医学会眼科学会委员，全国激光医学委员等。',
  'Director of Ophthalmology, PhD in Ophthalmology, Postdoctoral Fellow in Neuro-ophthalmology, Master''s Supervisor. Extensive experience in complex and difficult ophthalmic diseases, with deep expertise in fundus diseases, neuro-ophthalmology, macular diseases, uveitis, retinal degeneration, and optic nerve diseases. Member of ARVO, ISCEV, Chinese Ophthalmological Society, and National Laser Medicine Committee.',
  NULL, NULL, 1, 1
),
(
  @hospital_id, '金小琴', 'Jin Xiaoqin',
  '小儿眼科', 'Pediatric Ophthalmology',
  '主任医师', 'Chief Physician',
  '从事斜视与小儿眼科二十余年，擅长各种类型的斜视、弱视，儿童青少年屈光不正（近视、远视、散光），先天性上睑下垂，先天性眼球震颤，儿童进行性高度近视，病理性近视，以及小儿先天性、遗传性眼病的诊断和治疗。尤其擅长各种复杂斜视的诊断和微创显微斜视手术，病理性近视的显微后巩膜加固术，儿童上睑下垂个性化矫正术，眼球震颤微创矫正术以及儿童青少年近视的精准科学个性化综合防控。',
  'Over 20 years of experience in strabismus and pediatric ophthalmology. Specializes in all types of strabismus and amblyopia, pediatric refractive errors (myopia, hyperopia, astigmatism), congenital ptosis, congenital nystagmus, progressive high myopia, pathological myopia, and congenital/hereditary eye diseases. Particularly skilled in complex strabismus microsurgery, posterior scleral reinforcement for pathological myopia, individualized ptosis correction, and comprehensive myopia prevention in children and adolescents.',
  NULL, NULL, 2, 1
),
(
  @hospital_id, '吴岚', 'Wu Lan',
  '眼科', 'Ophthalmology',
  '主任医师', 'Chief Physician',
  '眼科副主任，白内障、青光眼和屈光矫正手术专家。擅长微小切口白内障手术和屈光性白内障手术、散光矫正型人工晶体及老视矫正型人工晶体的植入、ICL晶体植入，擅长白内障联合青光眼房角分离手术及疑难白内障青光眼诊治。',
  'Deputy Director of Ophthalmology, specialist in cataract, glaucoma, and refractive surgery. Skilled in micro-incision cataract surgery, refractive cataract surgery, toric and multifocal IOL implantation, ICL implantation, combined cataract-glaucoma angle separation surgery, and management of complex cataract-glaucoma cases.',
  NULL, NULL, 3, 1
),
(
  @hospital_id, '成琼', 'Cheng Qiong',
  '眼科屈光中心', 'Refractive Ophthalmology Center',
  '副主任医师', 'Associate Chief Physician',
  '擅长准分子激光、全飞秒角膜激光、个性化飞秒角膜激光手术；复杂角膜屈光手术；圆锥角膜治疗；ICL有晶体眼人工晶体植入术；各类眼整形手术、眼整形修复术。',
  'Specializes in excimer laser, SMILE, personalized femtosecond laser surgery; complex corneal refractive surgery; keratoconus treatment; ICL phakic IOL implantation; and various oculoplastic and reconstructive surgeries.',
  NULL, NULL, 4, 1
),

-- 同济合作专家：学术主任
(
  @hospital_id, '夏丽敏', 'Xia Limin',
  '消化内科', 'Gastroenterology',
  '教授/主任医师', 'Professor / Chief Physician',
  '华中科技大学同济医学院附属同济医院消化内科学术主任，泰康同济学术科主任级教授。',
  'Academic Director of Gastroenterology, Tongji Hospital, HUST; Academic Chief Professor at Taikang Tongji.',
  NULL, NULL, 5, 1
),
(
  @hospital_id, '曾和松', 'Zeng Hesong',
  '心血管内科', 'Cardiovascular Medicine',
  '教授/主任医师', 'Professor / Chief Physician',
  '华中科技大学同济医学院附属同济医院心血管内科学术主任，泰康同济学术科主任级教授。',
  'Academic Director of Cardiovascular Medicine, Tongji Hospital, HUST; Academic Chief Professor at Taikang Tongji.',
  NULL, NULL, 6, 1
),
(
  @hospital_id, '赵建平', 'Zhao Jianping',
  '呼吸与危重症医学科', 'Respiratory and Critical Care Medicine',
  '教授/主任医师', 'Professor / Chief Physician',
  '华中科技大学同济医学院附属同济医院呼吸与危重症医学科学术主任，泰康同济学术科主任级教授，每周三上午出诊。',
  'Academic Director of Respiratory and Critical Care Medicine, Tongji Hospital, HUST; Academic Chief Professor at Taikang Tongji. Outpatient clinic: Wednesday morning.',
  NULL, NULL, 7, 1
),
(
  @hospital_id, '秦仁义', 'Qin Renyi',
  '肝胆胰外科', 'Hepatobiliary and Pancreatic Surgery',
  '教授/主任医师', 'Professor / Chief Physician',
  '华中科技大学同济医学院附属同济医院肝胆胰外科学术主任，泰康同济学术科主任级教授，每周一下午出诊。',
  'Academic Director of Hepatobiliary and Pancreatic Surgery, Tongji Hospital, HUST; Academic Chief Professor at Taikang Tongji. Outpatient clinic: Monday afternoon.',
  NULL, NULL, 8, 1
),
(
  @hospital_id, '袁响林', 'Yuan Xianglin',
  '肿瘤科', 'Oncology',
  '教授/主任医师', 'Professor / Chief Physician',
  '华中科技大学同济医学院附属同济医院肿瘤科学术主任，泰康同济学术科主任级教授，每周四下午出诊。',
  'Academic Director of Oncology, Tongji Hospital, HUST; Academic Chief Professor at Taikang Tongji. Outpatient clinic: Thursday afternoon.',
  NULL, NULL, 9, 1
),
(
  @hospital_id, '涂胜豪', 'Tu Shenghao',
  '中医科', 'Traditional Chinese Medicine',
  '教授/主任医师', 'Professor / Chief Physician',
  '华中科技大学同济医学院附属同济医院中医科学术主任，泰康同济学术科主任级教授。',
  'Academic Director of Traditional Chinese Medicine, Tongji Hospital, HUST; Academic Chief Professor at Taikang Tongji.',
  NULL, NULL, 10, 1
),

-- 同济合作专家：出诊专家
(
  @hospital_id, '张木勋', 'Zhang Muxun',
  '内分泌内科', 'Endocrinology',
  '主任医师', 'Chief Physician',
  '华中科技大学同济医学院附属同济医院内分泌内科专家，每周二上午在泰康同济出诊。',
  'Endocrinology specialist from Tongji Hospital, HUST. Outpatient clinic at Taikang Tongji: Tuesday morning.',
  NULL, NULL, 11, 1
),
(
  @hospital_id, '赵波', 'Zhao Bo',
  '内分泌内科', 'Endocrinology',
  '主任医师', 'Chief Physician',
  '华中科技大学同济医学院附属同济医院内分泌内科专家，每周一下午在泰康同济出诊。',
  'Endocrinology specialist from Tongji Hospital, HUST. Outpatient clinic at Taikang Tongji: Monday afternoon.',
  NULL, NULL, 12, 1
),
(
  @hospital_id, '潘友民', 'Pan Youmin',
  '胸心外科', 'Cardiothoracic Surgery',
  '主任医师', 'Chief Physician',
  '华中科技大学同济医学院附属同济医院胸心外科专家，每周五上午在泰康同济出诊。',
  'Cardiothoracic Surgery specialist from Tongji Hospital, HUST. Outpatient clinic at Taikang Tongji: Friday morning.',
  NULL, NULL, 13, 1
),
(
  @hospital_id, '陈志强', 'Chen Zhiqiang',
  '胸心外科', 'Cardiothoracic Surgery',
  '主任医师', 'Chief Physician',
  '华中科技大学同济医学院附属同济医院胸心外科专家，每周四下午在泰康同济出诊。',
  'Cardiothoracic Surgery specialist from Tongji Hospital, HUST. Outpatient clinic at Taikang Tongji: Thursday afternoon.',
  NULL, NULL, 14, 1
),
(
  @hospital_id, '宋晓东', 'Song Xiaodong',
  '胸心外科', 'Cardiothoracic Surgery',
  '主任医师', 'Chief Physician',
  '华中科技大学同济医学院附属同济医院胸心外科专家，每周一上午在泰康同济出诊。',
  'Cardiothoracic Surgery specialist from Tongji Hospital, HUST. Outpatient clinic at Taikang Tongji: Monday morning.',
  NULL, NULL, 15, 1
),
(
  @hospital_id, '李锋', 'Li Feng',
  '泌尿外科', 'Urology',
  '主任医师', 'Chief Physician',
  '华中科技大学同济医学院附属同济医院泌尿外科专家，每周四下午在泰康同济出诊。',
  'Urology specialist from Tongji Hospital, HUST. Outpatient clinic at Taikang Tongji: Thursday afternoon.',
  NULL, NULL, 16, 1
),
(
  @hospital_id, '方煌', 'Fang Huang',
  '泌尿外科', 'Urology',
  '主任医师', 'Chief Physician',
  '华中科技大学同济医学院附属同济医院泌尿外科专家，每周三下午在泰康同济出诊。',
  'Urology specialist from Tongji Hospital, HUST. Outpatient clinic at Taikang Tongji: Wednesday afternoon.',
  NULL, NULL, 17, 1
),
(
  @hospital_id, '杨勇', 'Yang Yong',
  '泌尿外科', 'Urology',
  '主任医师', 'Chief Physician',
  '华中科技大学同济医学院附属同济医院泌尿外科专家，每周二上午在泰康同济出诊。',
  'Urology specialist from Tongji Hospital, HUST. Outpatient clinic at Taikang Tongji: Tuesday morning.',
  NULL, NULL, 18, 1
),
(
  @hospital_id, '易继林', 'Yi Jilin',
  '甲状腺乳腺外科', 'Thyroid and Breast Surgery',
  '主任医师', 'Chief Physician',
  '华中科技大学同济医学院附属同济医院甲状腺乳腺外科专家，每周三上午在泰康同济出诊。',
  'Thyroid and Breast Surgery specialist from Tongji Hospital, HUST. Outpatient clinic at Taikang Tongji: Wednesday morning.',
  NULL, NULL, 19, 1
),
(
  @hospital_id, '刘谨文', 'Liu Jinwen',
  '甲状腺乳腺外科', 'Thyroid and Breast Surgery',
  '主任医师', 'Chief Physician',
  '华中科技大学同济医学院附属同济医院甲状腺乳腺外科专家，每周五下午在泰康同济出诊。',
  'Thyroid and Breast Surgery specialist from Tongji Hospital, HUST. Outpatient clinic at Taikang Tongji: Friday afternoon.',
  NULL, NULL, 20, 1
),
(
  @hospital_id, '曹志新', 'Cao Zhixin',
  '胃肠外科', 'Gastrointestinal Surgery',
  '主任医师', 'Chief Physician',
  '华中科技大学同济医学院附属同济医院胃肠外科专家，每周二上午在泰康同济出诊。',
  'Gastrointestinal Surgery specialist from Tongji Hospital, HUST. Outpatient clinic at Taikang Tongji: Tuesday morning.',
  NULL, NULL, 21, 1
),
(
  @hospital_id, '李登举', 'Li Dengju',
  '血液内科', 'Hematology',
  '主任医师', 'Chief Physician',
  '华中科技大学同济医学院附属同济医院血液内科专家，每周二下午在泰康同济出诊。',
  'Hematology specialist from Tongji Hospital, HUST. Outpatient clinic at Taikang Tongji: Tuesday afternoon.',
  NULL, NULL, 22, 1
),
(
  @hospital_id, '崔永华', 'Cui Yonghua',
  '耳鼻咽喉科', 'Otolaryngology',
  '主任医师', 'Chief Physician',
  '华中科技大学同济医学院附属同济医院耳鼻咽喉科专家，每周三上午在泰康同济出诊。',
  'Otolaryngology specialist from Tongji Hospital, HUST. Outpatient clinic at Taikang Tongji: Wednesday morning.',
  NULL, NULL, 23, 1
),
(
  @hospital_id, '王恒', 'Wang Heng',
  '耳鼻咽喉科', 'Otolaryngology',
  '主任医师', 'Chief Physician',
  '华中科技大学同济医学院附属同济医院耳鼻咽喉科专家，每周四上午在泰康同济出诊。',
  'Otolaryngology specialist from Tongji Hospital, HUST. Outpatient clinic at Taikang Tongji: Thursday morning.',
  NULL, NULL, 24, 1
),
(
  @hospital_id, '王常玉', 'Wang Changyu',
  '妇科', 'Gynecology',
  '主任医师', 'Chief Physician',
  '华中科技大学同济医学院附属同济医院妇科专家，每周六下午在泰康同济出诊。',
  'Gynecology specialist from Tongji Hospital, HUST. Outpatient clinic at Taikang Tongji: Saturday afternoon.',
  NULL, NULL, 25, 1
),
(
  @hospital_id, '曾万江', 'Zeng Wanjiang',
  '产科', 'Obstetrics',
  '主任医师', 'Chief Physician',
  '华中科技大学同济医学院附属同济医院产科专家，每周五下午在泰康同济出诊。',
  'Obstetrics specialist from Tongji Hospital, HUST. Outpatient clinic at Taikang Tongji: Friday afternoon.',
  NULL, NULL, 26, 1
),
(
  @hospital_id, '李新宇', 'Li Xinyu',
  '眼科', 'Ophthalmology',
  '主任医师', 'Chief Physician',
  '华中科技大学同济医学院附属同济医院眼科专家，每周日上午在泰康同济出诊。',
  'Ophthalmology specialist from Tongji Hospital, HUST. Outpatient clinic at Taikang Tongji: Sunday morning.',
  NULL, NULL, 27, 1
),
(
  @hospital_id, '管汉雄', 'Guan Hanxiong',
  '放射影像科', 'Radiology',
  '主任医师', 'Chief Physician',
  '华中科技大学同济医学院附属同济医院放射影像科专家，每周四下午在泰康同济出诊。',
  'Radiology specialist from Tongji Hospital, HUST. Outpatient clinic at Taikang Tongji: Thursday afternoon.',
  NULL, NULL, 28, 1
),
(
  @hospital_id, '邓又斌', 'Deng Youbin',
  '超声影像科', 'Ultrasound Imaging',
  '主任医师', 'Chief Physician',
  '华中科技大学同济医学院附属同济医院超声影像科专家，每周四上午在泰康同济出诊。',
  'Ultrasound Imaging specialist from Tongji Hospital, HUST. Outpatient clinic at Taikang Tongji: Thursday morning.',
  NULL, NULL, 29, 1
),
(
  @hospital_id, '田学愎', 'Tian Xuefu',
  '疼痛科', 'Pain Management',
  '主任医师', 'Chief Physician',
  '华中科技大学同济医学院附属同济医院疼痛科专家，每周六上午在泰康同济出诊。',
  'Pain Management specialist from Tongji Hospital, HUST. Outpatient clinic at Taikang Tongji: Saturday morning.',
  NULL, NULL, 30, 1
);

-- ============================================================
-- 3. 医疗设备
-- ============================================================
INSERT INTO equipments (
  hospital_id, name_zh, name_en,
  desc_zh, desc_en,
  image_url, sort_order, is_active
) VALUES
(
  @hospital_id,
  '联影320排 uCT 960+',
  'United Imaging 320-Row uCT 960+',
  '国际一流先进CT设备。转速更高，0.25秒即可完成一圈扫描，大幅缩短检查时间，尤其适合难以屏息或需紧急救治的患者。分辨率更优，能精准识别0.5mm的微小病变，血管内小血栓、早期肺结节等隐匿病灶均可被检出。辐射剂量更低，在保证成像质量的同时最大限度保障患者安全。擅长骨骼、肺部、急诊外伤检查。',
  'World-class advanced CT equipment. Higher rotation speed — completes one full scan in 0.25 seconds, significantly reducing examination time, especially suitable for patients who cannot hold their breath or require emergency treatment. Superior resolution — accurately identifies lesions as small as 0.5mm, including small intravascular thrombi and early pulmonary nodules. Lower radiation dose — maximizes patient safety while maintaining imaging quality. Best suited for skeletal, pulmonary, and emergency trauma examinations.',
  NULL, 1, 1
),
(
  @hospital_id,
  '联影3.0T uMR 790',
  'United Imaging 3.0T uMR 790',
  '国际一流先进MRI设备。3.0T超高场强，信号强度与信噪比更高，对软组织的分辨率尤为卓越。可融合多维信息，为病变性质的鉴别提供深层依据。无电离辐射，为需反复检查者、儿童及特殊人群提供更安全的影像评估选择。适用于脑部、神经、关节韧带、腹部盆腔器官及乳腺等软组织检查。',
  'World-class advanced MRI equipment. 3.0T ultra-high field strength with superior signal intensity, signal-to-noise ratio, and soft tissue resolution. Multi-dimensional information fusion provides deeper diagnostic insights. No ionizing radiation — a safer imaging option for patients requiring repeated examinations, children, and special populations. Ideal for brain, neurological, joint/ligament, abdominal/pelvic organ, and breast soft tissue examinations.',
  NULL, 2, 1
),
(
  @hospital_id,
  '第四代达芬奇手术机器人',
  'Da Vinci Xi Surgical Robot (4th Generation)',
  '2025年7月24日正式启用，由中国泌尿外科腹腔镜及机器人领域奠基人张旭院士等40余位国内知名专家共同见证。达芬奇手术机器人是一种高端智能化的机器人外科手术平台，由视频成像系统、床旁机械臂系统和主刀医师操控台三部分组成。可提供10-15倍放大视野，荧光显影技术可识别深层血管组织；仿真手腕灵活性和稳定性远超人手，能滤除生理性震颤，实现毫米级精准操控；显著减少术中出血、组织损伤及术后疼痛，加速患者康复。目前广泛应用于妇产科、普通外科、胸外科、泌尿外科、甲乳外科及心脏手术。',
  'Officially launched on July 24, 2025, witnessed by Academician Zhang Xu — a pioneer in laparoscopic and robotic urology in China — and over 40 leading domestic experts. The Da Vinci Surgical Robot is an advanced intelligent robotic surgical platform consisting of a vision system, patient-side robotic arm system, and surgeon console. It provides 10–15× magnified 3D vision with fluorescence imaging to identify deep vascular structures; its wristed instruments offer dexterity and stability far exceeding the human hand, filtering physiological tremors for millimeter-level precision. It significantly reduces intraoperative bleeding, tissue damage, and postoperative pain, accelerating patient recovery. Currently used in gynecology, general surgery, thoracic surgery, urology, thyroid/breast surgery, and cardiac surgery.',
  NULL, 3, 1
);

-- ============================================================
-- 4. 特需产品
-- ============================================================

-- 4-1 肠菌移植项目
INSERT INTO special_products (
  hospital_id, name_zh, name_en,
  summary_zh, summary_en,
  detail_zh, detail_en,
  cover_image_url, price_min, price_max,
  contact_person, contact_info, sort_order, is_active
) VALUES (
  @hospital_id,
  '肠菌移植项目',
  'Fecal Microbiota Transplantation (FMT) Program',
  '通过移植健康供体的肠道菌群，修复肠道微生态，从源头干预慢性病进程。适用于溃疡性结肠炎、克罗恩病、功能性便秘、肠易激综合征、帕金森病、糖尿病、肥胖症等多种疾病。',
  'Restores gut microbiota by transplanting healthy donor flora to intervene in chronic disease progression at the source. Indicated for ulcerative colitis, Crohn''s disease, functional constipation, IBS, Parkinson''s disease, diabetes, obesity, and more.',
  '泰康同济肠菌移植项目依托华中科技大学同济医学院附属同济医院胃肠外科主任王桂华教授团队（国家杰青2024、国家优青2019），联合华中菌群库高标准供体资源，提供从菌群检测到移植治疗的全周期健康管理服务。供体严选18-25周岁985高校在校医学生，构建全链条质量管控。项目涵盖肠道菌群宏基因组检测、肠菌胶囊及活菌液移植等多种方案，1+N多学科团队提供全周期健康管理。',
  'The Taikang Tongji FMT Program is led by Professor Wang Guihua''s team (NSFC Outstanding Young Scientist 2024 & 2019) from the Department of Gastrointestinal Surgery, Tongji Hospital, HUST. Leveraging the Central China Microbiome Bank with rigorously selected donors (medical students aged 18–25 from top-tier universities), the program offers full-cycle health management from microbiome testing to transplantation. Services include metagenomics testing, FMT capsules, and live bacterial liquid transplantation, supported by a multidisciplinary team.',
  NULL, 1530.00, 56000.00,
  '国际医疗部', '4000195522', 1, 1
);

SET @product_id_fmt = LAST_INSERT_ID();

-- 4-2 NAD+综合抗衰
INSERT INTO special_products (
  hospital_id, name_zh, name_en,
  summary_zh, summary_en,
  detail_zh, detail_en,
  cover_image_url, price_min, price_max,
  contact_person, contact_info, sort_order, is_active
) VALUES (
  @hospital_id,
  'NAD+综合抗衰',
  'NAD+ Comprehensive Anti-Aging Therapy',
  '通过补充NAD+辅酶，从分子层面优化细胞功能，延缓衰老进程。适用于中年亚健康、慢性疲劳、睡眠差、更年期、高压工作者等人群。',
  'Optimizes cellular function at the molecular level by replenishing NAD+ coenzyme to slow the aging process. Suitable for middle-aged sub-health, chronic fatigue, poor sleep, menopause, and high-stress individuals.',
  'NAD+是参与氧化还原反应的重要辅酶，体内NAD+水平随增龄而降低，导致线粒体功能障碍、细胞衰老加速。泰康同济NAD+综合抗衰项目采用国内唯一药准字号产品，在国际医疗部环境下提供医疗级服务，365天×（8am-8pm）全年无休。5次/1疗程，间隔3个月后可进行下一疗程。适用人群包括：中年亚健康、熬夜者、减肥者、高压工作者、抑郁者、中老年人、饮酒者、吸烟者、健身运动员、更年期女性、艺人/抗衰保养、免疫力下降人群等。',
  'NAD+ is a vital coenzyme involved in redox reactions; its levels decline with age, leading to mitochondrial dysfunction and accelerated cellular aging. Taikang Tongji''s NAD+ Anti-Aging Program uses the only NMPA-approved pharmaceutical-grade product in China, delivered in the International Medical Department with medical-grade service, 365 days × 8am–8pm. One course = 5 sessions; next course after 3-month interval. Suitable for: middle-aged sub-health, night-shift workers, weight management, high-stress professionals, depression, elderly, alcohol/tobacco users, athletes, menopausal women, and those with declining immunity.',
  NULL, 33000.00, 33000.00,
  '国际医疗部', '4000195522', 2, 1
);

SET @product_id_nad = LAST_INSERT_ID();

-- 4-3 血脂净化
INSERT INTO special_products (
  hospital_id, name_zh, name_en,
  summary_zh, summary_en,
  detail_zh, detail_en,
  cover_image_url, price_min, price_max,
  contact_person, contact_info, sort_order, is_active
) VALUES (
  @hospital_id,
  '血脂净化',
  'Blood Lipid Purification Therapy',
  '最快速的降低血脂方案，通过血管大扫除养护血管健康。适用于高脂血症、高甘油三酯、高尿酸、糖尿病等代谢性疾病患者。',
  'The fastest blood lipid reduction solution for comprehensive vascular health management. Indicated for hyperlipidemia, hypertriglyceridemia, hyperuricemia, diabetes, and other metabolic disorders.',
  '泰康同济血脂净化项目提供两种套餐方案：套餐1包含主任医师问诊、专家会诊、特需病房、仪器检查、抽血检验、祛脂治疗、陪诊等服务；套餐2在套餐1基础上升级为多学科专家会诊、国疗病房、深度仪器检查、精准检验方案、血管衰老检查、专人陪诊、营养膳食等全方位服务。具体适用范围及总费用以医疗机构面诊意见为准。',
  'Taikang Tongji''s Blood Lipid Purification Program offers two packages: Package 1 includes chief physician consultation, specialist consultation, premium ward, instrument examination, blood tests, lipid-clearing treatment, and escort service; Package 2 upgrades to multidisciplinary expert consultation, international medical ward, in-depth instrument examination, precision testing, vascular aging assessment, dedicated escort, and nutritional meal planning. Final scope and total cost subject to in-person medical assessment.',
  NULL, 24000.00, 39800.00,
  '国际医疗部', '4000195522', 3, 1
);

SET @product_id_lipid = LAST_INSERT_ID();

-- 4-4 多模态创新睡眠管理方案
INSERT INTO special_products (
  hospital_id, name_zh, name_en,
  summary_zh, summary_en,
  detail_zh, detail_en,
  cover_image_url, price_min, price_max,
  contact_person, contact_info, sort_order, is_active
) VALUES (
  @hospital_id,
  '多模态创新睡眠管理方案',
  'Multi-Modal Innovative Sleep Management Program',
  '华中地区唯一多模态睡眠疗愈中心，以麻醉诱导治疗为特色，联合肠菌移植、NAD+细胞能量激活，多学科融合的高级睡眠医学中心。',
  'The only multi-modal sleep healing center in Central China, featuring anesthesia-induced therapy combined with FMT and NAD+ cellular energy activation — an advanced multidisciplinary sleep medicine center.',
  '泰康同济多模态创新睡眠管理方案整合五大治疗模块：①睡眠相关评估（多导睡眠监测、无创居家睡眠监测、心理CT测量）；②基础睡眠治疗（药物治疗、经颅磁刺激、生物反馈、失眠治疗仪、中医治疗）；③麻醉诱导及神经阻滞方案（麻醉诱导睡眠平衡术、星状神经节阻滞SGB）；④特色心理治疗（长期认知行为治疗CBT-I）；⑤睡眠底层调节（肠道菌群移植调节肠-脑轴、NAD+调节生物钟与细胞能量代谢）。提供五大个性化方案：泰·睿能（精英睡眠效率提升）、泰·舒压（急性压力失眠阻断）、泰·安悦（女性全周期睡眠调养）、泰·守护（老年慢病睡眠管理）、泰·归元（重度失眠神经调控康复）。',
  'Taikang Tongji''s Multi-Modal Sleep Management Program integrates five treatment modules: ① Sleep assessment (polysomnography, non-invasive home sleep monitoring, psychological CT); ② Basic sleep treatment (pharmacotherapy, TMS, biofeedback, insomnia therapy device, TCM); ③ Anesthesia induction & nerve block (anesthesia-induced sleep balancing, stellate ganglion block SGB); ④ Specialized psychotherapy (long-term CBT-I); ⑤ Deep sleep regulation (FMT for gut-brain axis modulation, NAD+ for circadian rhythm and cellular energy metabolism). Five personalized programs: Tai·Ruineng (elite sleep efficiency), Tai·Shuya (acute stress insomnia relief), Tai·Anyue (women''s full-cycle sleep care), Tai·Shouhu (elderly chronic disease sleep management), Tai·Guiyuan (severe insomnia neuromodulation rehabilitation).',
  NULL, NULL, NULL,
  '国际医疗部', '4000195522', 4, 1
);

SET @product_id_sleep = LAST_INSERT_ID();

-- ============================================================
-- 5. 产品套餐
-- ============================================================

-- 肠菌移植套餐
INSERT INTO product_variants (
  product_id, name_zh, name_en,
  desc_zh, desc_en,
  price, sort_order, is_active
) VALUES
(
  @product_id_fmt,
  '肠道菌群宏基因组检测（1G数据版）',
  'Gut Microbiome Metagenomics Test (1G Data)',
  '1G测序数据量，适合基础菌群健康评估。',
  '1G sequencing data for basic gut microbiome health assessment.',
  1530.00, 1, 1
),
(
  @product_id_fmt,
  '肠道菌群宏基因组检测（6G数据版）',
  'Gut Microbiome Metagenomics Test (6G Data)',
  '6G测序数据量，提供更精准深度的菌群分析报告。',
  '6G sequencing data for more precise and in-depth microbiome analysis.',
  2520.00, 2, 1
),
(
  @product_id_fmt,
  '肠菌胶囊基础版（特需门诊）',
  'FMT Capsule Basic Package (Premium Outpatient)',
  '特需门诊模式，口服肠菌胶囊移植，基础方案。',
  'Premium outpatient mode, oral FMT capsule transplantation, basic plan.',
  25000.00, 3, 1
),
(
  @product_id_fmt,
  '肠菌胶囊进阶版（特需门诊）',
  'FMT Capsule Advanced Package (Premium Outpatient)',
  '特需门诊模式，口服肠菌胶囊移植，进阶方案，含更全面的检测与随访。',
  'Premium outpatient mode, oral FMT capsule transplantation, advanced plan with more comprehensive testing and follow-up.',
  34000.00, 4, 1
),
(
  @product_id_fmt,
  '肠菌胶囊尊享版（特需部住院7天/6晚）',
  'FMT Capsule Premium Package (7-Day/6-Night Inpatient)',
  '特需部住院7天6晚，口服肠菌胶囊移植，尊享全程住院服务。',
  '7-day/6-night inpatient stay in premium ward, oral FMT capsule transplantation with full premium inpatient services.',
  48000.00, 5, 1
),
(
  @product_id_fmt,
  '肠菌活菌液臻至版（特需部住院7天/6晚）',
  'FMT Live Bacterial Liquid Supreme Package (7-Day/6-Night Inpatient)',
  '特需部住院7天6晚，活菌液移植，最高规格方案，疗效更优。',
  '7-day/6-night inpatient stay in premium ward, live bacterial liquid transplantation — highest-tier plan with superior efficacy.',
  56000.00, 6, 1
),

-- NAD+套餐
(
  @product_id_nad,
  'NAD+综合抗衰（5次/1疗程）',
  'NAD+ Anti-Aging Therapy (5 Sessions / 1 Course)',
  '1疗程共5次静脉注射，建议间隔3个月后进行下一疗程。在国际医疗部环境下提供医疗级服务，365天×（8am-8pm）。',
  '1 course of 5 intravenous infusion sessions; next course recommended after 3-month interval. Medical-grade service in the International Medical Department, 365 days × 8am–8pm.',
  33000.00, 1, 1
),

-- 血脂净化套餐
(
  @product_id_lipid,
  '血脂净化套餐1',
  'Blood Lipid Purification Package 1',
  '包含：主任医师问诊、专家会诊、特需病房、仪器检查、抽血检验、祛脂治疗、陪诊。',
  'Includes: chief physician consultation, specialist consultation, premium ward, instrument examination, blood tests, lipid-clearing treatment, escort service.',
  24000.00, 1, 1
),
(
  @product_id_lipid,
  '血脂净化套餐2',
  'Blood Lipid Purification Package 2',
  '包含：多学科专家会诊、国疗病房、深度仪器检查、精准检验方案、血管衰老检查、祛脂治疗、专人陪诊、营养膳食。具体适用范围及总费用以医疗机构面诊意见为准。',
  'Includes: multidisciplinary expert consultation, international medical ward, in-depth instrument examination, precision testing, vascular aging assessment, lipid-clearing treatment, dedicated escort, nutritional meal planning. Final scope and cost subject to in-person medical assessment.',
  39800.00, 2, 1
),

-- 睡眠管理套餐
(
  @product_id_sleep,
  '泰·睿能（精英睡眠效率提升方案）',
  'Tai·Ruineng (Elite Sleep Efficiency Enhancement)',
  '针对精英人群的睡眠效率提升方案，改善入睡质量、提升日间精力与专注力。',
  'Sleep efficiency enhancement program for high-performance individuals, improving sleep onset quality and daytime energy and focus.',
  NULL, 1, 1
),
(
  @product_id_sleep,
  '泰·舒压（急性压力失眠阻断方案）',
  'Tai·Shuya (Acute Stress Insomnia Relief)',
  '针对急性压力导致的失眠，快速阻断压力-失眠恶性循环。',
  'Targets acute stress-induced insomnia to rapidly break the stress-insomnia vicious cycle.',
  NULL, 2, 1
),
(
  @product_id_sleep,
  '泰·安悦（女性全周期睡眠调养方案）',
  'Tai·Anyue (Women''s Full-Cycle Sleep Care)',
  '针对女性经期、孕期、更年期等全生命周期睡眠问题的综合调养方案。',
  'Comprehensive sleep care program addressing women''s sleep issues across all life stages including menstruation, pregnancy, and menopause.',
  NULL, 3, 1
),
(
  @product_id_sleep,
  '泰·守护（老年慢病睡眠管理方案）',
  'Tai·Shouhu (Elderly Chronic Disease Sleep Management)',
  '针对老年慢病患者的睡眠管理，兼顾基础疾病与睡眠障碍的综合干预。',
  'Sleep management for elderly patients with chronic diseases, integrating intervention for both underlying conditions and sleep disorders.',
  NULL, 4, 1
),
(
  @product_id_sleep,
  '泰·归元（重度失眠神经调控康复方案）',
  'Tai·Guiyuan (Severe Insomnia Neuromodulation Rehabilitation)',
  '针对重度失眠患者，以麻醉诱导睡眠平衡术、星状神经节阻滞为核心的神经调控康复方案。',
  'Neuromodulation rehabilitation program for severe insomnia, centered on anesthesia-induced sleep balancing and stellate ganglion block (SGB).',
  NULL, 5, 1
);

