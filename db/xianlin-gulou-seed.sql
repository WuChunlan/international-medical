USE international_medical;

-- ============================================================
-- 泰康仙林鼓楼医院 种子数据
-- 来源：资料/仙林鼓楼资料/ 下所有 PDF
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
  '泰康仙林鼓楼医院',
  'Taikang Xianlin Drum Tower Hospital',
  '泰康仙林鼓楼医院是泰康保险集团旗下首家医、教、研一体化三级甲等综合医院，是南京大学医学院附属医院、南京鼓楼医院集团成员、武汉大学临床学院、南京中医药大学教学医院。医院前身为南京市仙林鼓楼医院，2013年11月正式开诊，2017年6月更名为"泰康仙林鼓楼医院"。医院位于南京市栖霞区仙林大学城灵山北侧，总建筑面积33.4万平方米，规划床位近1400张。拥有PET-CT、达芬奇手术机器人、日本奥林巴斯X1超清放大内镜系统等高端医疗设备。国际医疗中心依托院内平台，与南京鼓楼医院建立深度战略合作，提供多语种服务，支持超20家商业保险直付理赔，累计服务超60个国家的患者，是南京市医疗国际化的重要窗口。医院与毗邻的泰康之家·苏园共同组成泰康仙林国际医养园区，打造"医教研养康"五位一体综合园区。',
  'Taikang Xianlin Drum Tower Hospital is the first integrated medical, education and research Class-III Grade-A general hospital under Taikang Insurance Group. It is an affiliated hospital of Nanjing University School of Medicine, a member of Nanjing Drum Tower Hospital Group, a clinical college of Wuhan University, and a teaching hospital of Nanjing University of Chinese Medicine. Originally known as Nanjing Xianlin Drum Tower Hospital (opened November 2013), it was renamed in June 2017. Located in Xianlin University Town, Qixia District, Nanjing, the hospital covers 334,000 m² with a planned capacity of nearly 1,400 beds. It is equipped with PET-CT, Da Vinci Surgical Robot, and Olympus X1 ultra-high-definition magnifying endoscope system. The International Medical Center has established deep strategic cooperation with Nanjing Drum Tower Hospital, offers multilingual services, supports direct billing with 20+ commercial insurers, and has served patients from over 60 countries.',
  NULL, NULL,
  '南京市栖霞区灵山北路188号',
  'No. 188, Lingshan North Road, Qixia District, Nanjing',
  '025-83169988',
  '国际医疗中心',
  '025-83169988',
  1, 1
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
(
  @hospital_id, '邹晓平', 'Zou Xiaoping',
  '消化内科', 'Gastroenterology',
  '院长/主任医师', 'President / Chief Physician',
  '泰康仙林鼓楼医院院长，消化内镜著名专家，技术精湛，探查精准。擅长消化道早癌筛查与内镜下精查治疗，在消化内镜领域具有深厚造诣。',
  'President of Taikang Xianlin Drum Tower Hospital, renowned expert in digestive endoscopy with superb technique and precise diagnostic capability. Specializes in early gastrointestinal cancer screening and endoscopic precision diagnosis and treatment.',
  NULL, NULL, 1, 1
),
(
  @hospital_id, '施瑞华', 'Shi Ruihua',
  '消化内科', 'Gastroenterology',
  '首席专家/主任医师', 'Chief Expert / Chief Physician',
  '东南大学附属中大医院首席专家，消化内镜著名专家。在消化道肿瘤早期诊断与内镜治疗领域具有丰富经验，技术精湛，探查精准。',
  'Chief Expert of Zhongda Hospital affiliated to Southeast University, renowned expert in digestive endoscopy. Extensive experience in early diagnosis of gastrointestinal tumors and endoscopic treatment.',
  NULL, NULL, 2, 1
),
(
  @hospital_id, '张以洋', 'Zhang Yiyang',
  '消化内科', 'Gastroenterology',
  '主任医师', 'Chief Physician',
  '南京鼓楼医院消化内科主任医师，消化内镜著名专家。擅长消化道早癌筛查与内镜精查治疗，在消化内镜领域具有深厚造诣。',
  'Chief Physician of Gastroenterology, Nanjing Drum Tower Hospital, renowned expert in digestive endoscopy. Specializes in early gastrointestinal cancer screening and endoscopic precision diagnosis and treatment.',
  NULL, NULL, 3, 1
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
  'PET-CT',
  'PET-CT Scanner',
  '一次性完成全身扫描，同时看清病灶的形态和代谢，是肿瘤诊断的利器。能在肿瘤早期发现微小病灶，为临床提供精准的诊断依据，广泛应用于肿瘤筛查、分期、疗效评估及复发监测。',
  'Completes whole-body scanning in a single session, simultaneously revealing lesion morphology and metabolic activity — a powerful tool for tumor diagnosis. Detects minute lesions at early tumor stages, providing precise diagnostic evidence for clinical decision-making. Widely used in tumor screening, staging, treatment response evaluation, and recurrence monitoring.',
  NULL, 1, 1
),
(
  @hospital_id,
  '达芬奇手术机器人',
  'Da Vinci Surgical Robot',
  '目前全球最先进的外科手术系统之一，让医生能更精准、灵活地完成微创手术。系统由视频成像系统、床旁机械臂系统和主刀医师操控台三部分组成，可提供高清放大视野，仿真手腕灵活性远超人手，能滤除生理性震颤，实现毫米级精准操控，显著减少术中出血和术后疼痛，加速患者康复。',
  'One of the world''s most advanced surgical systems, enabling surgeons to perform minimally invasive procedures with greater precision and flexibility. Comprising a vision system, patient-side robotic arm system, and surgeon console, it provides high-definition magnified vision, wrist articulation far exceeding human capability, physiological tremor filtration, and millimeter-level precision — significantly reducing intraoperative bleeding, postoperative pain, and recovery time.',
  NULL, 2, 1
),
(
  @hospital_id,
  '日本奥林巴斯X1超清放大内镜系统',
  'Olympus X1 Ultra-HD Magnifying Endoscope System',
  '提供超高清的显微级图像，能实时观察到细胞层面的微血管和黏膜结构，早癌识别精度提升40%。结合AI智能双重阅片，综合早癌识别率超过90%。是高端胃肠镜检查的核心设备，可实现精查治疗一次完成，发现复杂病变立即启动MDT多学科会诊。',
  'Delivers ultra-high-definition microscopic-level images for real-time visualization of microvascular and mucosal structures at the cellular level, improving early cancer detection accuracy by 40%. Combined with AI-assisted dual reading, the overall early cancer detection rate exceeds 90%. The core equipment for premium gastrointestinal endoscopy, enabling precision diagnosis and treatment in a single session with immediate MDT consultation for complex lesions.',
  NULL, 3, 1
);

-- ============================================================
-- 4. 特需产品
-- ============================================================

-- 4-1 高端胃肠镜
INSERT INTO special_products (
  hospital_id, name_zh, name_en,
  summary_zh, summary_en,
  detail_zh, detail_en,
  cover_image_url, price_min, price_max,
  contact_person, contact_info, sort_order, is_active
) VALUES (
  @hospital_id,
  '高端胃肠镜',
  'Premium Gastrointestinal Endoscopy',
  '采用日本奥林巴斯X1超清放大内镜系统，结合AI智能双重阅片，早癌识别率超90%。由消化内镜著名专家主诊，精查治疗一次完成，入住国际部私密单人间，健康管理师一对一全程服务。',
  'Using the Olympus X1 ultra-HD magnifying endoscope system combined with AI dual reading, achieving early cancer detection rate over 90%. Performed by renowned digestive endoscopy experts, with diagnosis and treatment completed in one session. Patients stay in a private single room in the International Medical Department with one-on-one health manager service.',
  '中国是全球胃癌高发国家，占全球胃癌病例45%；结直肠癌近年已上升为发病率排名第二位的恶性肿瘤。胃癌和结直肠癌早期症状隐匿，一旦症状出现再就诊，往往已是晚期。早期消化道肿瘤患者如得到及时对症治疗，5年存活率可超过90%。泰康仙林鼓楼医院国际医疗中心高端胃肠镜项目具备以下优势：①消化内镜著名专家主诊，技术精湛，探查精准；②精查治疗一次完成，解决后顾之忧；③日本奥林巴斯X1超清放大内镜系统，早癌识别精度提升40%；④AI智能双重阅片，综合早癌识别率超过90%；⑤发现复杂病变立即启动MDT多学科会诊；⑥入住国际部私密单人间，健康管理师一对一服务，全程舒适无忧。适用人群：频繁反酸/胃胀/排便异常却查不出原因者；长期饮食不规律、应酬饮酒、工作高压者；40岁以上未做过胃肠镜深度筛查者；家族有消化道肿瘤病史者。',
  'China accounts for 45% of global gastric cancer cases, and colorectal cancer has risen to the second most common malignancy in recent years. Early-stage gastrointestinal cancers are often asymptomatic — by the time symptoms appear, the disease is frequently advanced. However, early-stage gastrointestinal tumor patients who receive timely treatment have a 5-year survival rate exceeding 90%. The Premium Gastrointestinal Endoscopy program at Taikang Xianlin Drum Tower Hospital International Medical Center offers: ① Renowned digestive endoscopy experts with superb technique; ② Precision diagnosis and treatment completed in one session; ③ Olympus X1 ultra-HD magnifying endoscope — 40% improvement in early cancer detection accuracy; ④ AI-assisted dual reading — overall early cancer detection rate over 90%; ⑤ Immediate MDT consultation for complex lesions; ⑥ Private single room in the International Medical Department with one-on-one health manager service. Recommended for: those with frequent acid reflux/bloating/bowel irregularities; those with irregular diet, frequent alcohol consumption, or high work stress; those over 40 who have never had a comprehensive endoscopy; those with a family history of gastrointestinal tumors.',
  NULL, NULL, NULL,
  '国际医疗中心', '025-83169988', 1, 1
);

SET @product_id_endo = LAST_INSERT_ID();

-- 4-2 肠道菌群移植
INSERT INTO special_products (
  hospital_id, name_zh, name_en,
  summary_zh, summary_en,
  detail_zh, detail_en,
  cover_image_url, price_min, price_max,
  contact_person, contact_info, sort_order, is_active
) VALUES (
  @hospital_id,
  '肠道菌群移植',
  'Fecal Microbiota Transplantation (FMT)',
  '重塑肠道微生态，通过移植健康供体的肠道菌群，从源头干预慢性病进程，改善肠道健康。',
  'Reshape the gut microbiome by transplanting healthy donor flora to intervene in chronic disease progression at the source and improve gut health.',
  '肠道菌群移植（FMT）是通过将健康供体的肠道菌群移植到患者体内，重塑肠道微生态平衡，从而改善或治疗多种疾病的创新医疗手段。泰康仙林鼓楼医院国际医疗中心提供专业的肠道菌群移植服务，适用于溃疡性结肠炎、克罗恩病、功能性便秘、肠易激综合征等消化系统疾病，以及代谢综合征、糖尿病、肥胖症等代谢性疾病。具体方案及费用请联系国际医疗中心咨询。',
  'Fecal Microbiota Transplantation (FMT) is an innovative medical approach that restores gut microbiome balance by transplanting healthy donor flora into patients, thereby improving or treating various diseases. The International Medical Center at Taikang Xianlin Drum Tower Hospital provides professional FMT services, indicated for digestive disorders including ulcerative colitis, Crohn''s disease, functional constipation, and IBS, as well as metabolic conditions such as metabolic syndrome, diabetes, and obesity. Please contact the International Medical Center for specific treatment plans and pricing.',
  NULL, NULL, NULL,
  '国际医疗中心', '025-83169988', 2, 1
);

-- 4-3 中医特色诊疗
INSERT INTO special_products (
  hospital_id, name_zh, name_en,
  summary_zh, summary_en,
  detail_zh, detail_en,
  cover_image_url, price_min, price_max,
  contact_person, contact_info, sort_order, is_active
) VALUES (
  @hospital_id,
  '中医特色诊疗',
  'Traditional Chinese Medicine (TCM) Specialty Care',
  '融合传统中医与现代医学，提供中医针灸、中药调理、射灸舱等特色诊疗服务，改善亚健康状态，调理慢性疾病。',
  'Integrating traditional Chinese medicine with modern medicine, offering acupuncture, herbal medicine, moxibustion therapy, and other specialty TCM services to improve sub-health conditions and manage chronic diseases.',
  '泰康仙林鼓楼医院国际医疗中心中医特色诊疗项目，依托医院中医科专业团队，提供个性化中医诊疗方案。服务包括中医针灸美容、中药调理、射灸舱等特色项目，适用于亚健康调理、慢性病管理、美容养颜、疼痛管理等需求。具体方案及费用请联系国际医疗中心咨询。',
  'The TCM Specialty Care program at Taikang Xianlin Drum Tower Hospital International Medical Center is supported by the hospital''s professional TCM department, offering personalized TCM treatment plans. Services include TCM acupuncture and cosmetic treatment, herbal medicine, moxibustion therapy, and other specialty programs, suitable for sub-health management, chronic disease management, cosmetic wellness, and pain management. Please contact the International Medical Center for specific plans and pricing.',
  NULL, NULL, NULL,
  '国际医疗中心', '025-83169988', 3, 1
);

-- 4-4 净血疗法
INSERT INTO special_products (
  hospital_id, name_zh, name_en,
  summary_zh, summary_en,
  detail_zh, detail_en,
  cover_image_url, price_min, price_max,
  contact_person, contact_info, sort_order, is_active
) VALUES (
  @hospital_id,
  '净血疗法',
  'Blood Purification Therapy',
  '通过血液净化技术清除体内有害物质，改善血液质量，降低血脂、血糖等代谢指标，养护血管健康。',
  'Removes harmful substances from the body through blood purification technology, improving blood quality, reducing lipids, blood glucose, and other metabolic indicators, and protecting vascular health.',
  '泰康仙林鼓楼医院国际医疗中心净血疗法项目，采用先进的血液净化技术，通过清除血液中的有害物质、多余脂质及代谢废物，改善血液流变学指标，降低心脑血管疾病风险。适用于高脂血症、高尿酸血症、代谢综合征等人群，以及希望进行血管养护和抗衰老管理的健康人群。具体方案及费用请联系国际医疗中心咨询。',
  'The Blood Purification Therapy program at Taikang Xianlin Drum Tower Hospital International Medical Center uses advanced blood purification technology to remove harmful substances, excess lipids, and metabolic waste from the blood, improving hemorheological indicators and reducing cardiovascular and cerebrovascular disease risk. Suitable for patients with hyperlipidemia, hyperuricemia, metabolic syndrome, and healthy individuals seeking vascular maintenance and anti-aging management. Please contact the International Medical Center for specific plans and pricing.',
  NULL, NULL, NULL,
  '国际医疗中心', '025-83169988', 4, 1
);

-- 4-5 泌尿科特需诊疗
INSERT INTO special_products (
  hospital_id, name_zh, name_en,
  summary_zh, summary_en,
  detail_zh, detail_en,
  cover_image_url, price_min, price_max,
  contact_person, contact_info, sort_order, is_active
) VALUES (
  @hospital_id,
  '泌尿科特需诊疗',
  'Urology Premium Care',
  '依托医院泌尿医学中心，提供泌尿系统疾病的高端特需诊疗服务，涵盖精准诊断、微创手术及个性化治疗方案。',
  'Leveraging the hospital''s Urology Medical Center, providing premium urology care covering precision diagnosis, minimally invasive surgery, and personalized treatment plans.',
  '泰康仙林鼓楼医院国际医疗中心泌尿科特需诊疗项目，依托医院泌尿医学中心专业团队，为患者提供高品质的泌尿系统疾病诊疗服务。服务涵盖泌尿系统肿瘤、前列腺疾病、肾脏疾病、尿路结石等常见及复杂泌尿系统疾病的精准诊断与治疗，可结合达芬奇手术机器人开展微创手术。具体方案及费用请联系国际医疗中心咨询。',
  'The Urology Premium Care program at Taikang Xianlin Drum Tower Hospital International Medical Center is supported by the hospital''s professional urology team, providing high-quality urological diagnosis and treatment. Services cover precision diagnosis and treatment of common and complex urological conditions including urological tumors, prostate diseases, kidney diseases, and urinary tract stones, with Da Vinci robotic minimally invasive surgery available. Please contact the International Medical Center for specific plans and pricing.',
  NULL, NULL, NULL,
  '国际医疗中心', '025-83169988', 5, 1
);

-- 4-6 肠道微生态检测
INSERT INTO special_products (
  hospital_id, name_zh, name_en,
  summary_zh, summary_en,
  detail_zh, detail_en,
  cover_image_url, price_min, price_max,
  contact_person, contact_info, sort_order, is_active
) VALUES (
  @hospital_id,
  '肠道微生态检测',
  'Gut Microbiome Testing',
  '通过宏基因组测序技术，全面评估肠道菌群构成与健康状态，为个性化健康管理和疾病干预提供科学依据。',
  'Using metagenomics sequencing technology to comprehensively assess gut microbiome composition and health status, providing scientific basis for personalized health management and disease intervention.',
  '泰康仙林鼓楼医院国际医疗中心肠道微生态检测项目，依托医院肠道微生态中心，采用先进的宏基因组测序技术，对肠道菌群进行全面深度分析。检测结果可评估肠道健康状态、发现菌群失衡风险，为肠道菌群移植、慢病管理、营养干预等提供精准的个性化方案依据。适用于慢性消化道疾病患者、代谢性疾病患者及关注肠道健康的人群。具体方案及费用请联系国际医疗中心咨询。',
  'The Gut Microbiome Testing program at Taikang Xianlin Drum Tower Hospital International Medical Center leverages the hospital''s Gut Microbiome Center and advanced metagenomics sequencing technology for comprehensive in-depth gut microbiome analysis. Results assess gut health status, identify dysbiosis risks, and provide precise personalized guidance for FMT, chronic disease management, and nutritional intervention. Suitable for patients with chronic digestive diseases, metabolic disorders, and individuals concerned about gut health. Please contact the International Medical Center for specific plans and pricing.',
  NULL, NULL, NULL,
  '国际医疗中心', '025-83169988', 6, 1
);

-- 4-7 自体脂肪微颗粒技术
INSERT INTO special_products (
  hospital_id, name_zh, name_en,
  summary_zh, summary_en,
  detail_zh, detail_en,
  cover_image_url, price_min, price_max,
  contact_person, contact_info, sort_order, is_active
) VALUES (
  @hospital_id,
  '自体脂肪微颗粒技术',
  'Autologous Micro-Fat Grafting Technology',
  '采用自体脂肪微颗粒移植技术，利用自身脂肪组织进行面部年轻化及形体塑造，安全无排异，效果自然持久。',
  'Using autologous micro-fat grafting technology to perform facial rejuvenation and body contouring with the patient''s own adipose tissue — safe, no rejection risk, with natural and long-lasting results.',
  '泰康仙林鼓楼医院国际医疗中心自体脂肪微颗粒技术项目，采用先进的自体脂肪微颗粒移植技术，通过精细化提取、处理和注射自体脂肪，实现面部年轻化、轮廓塑造及局部填充。由于使用自身组织，无排异反应风险，安全性高，效果自然持久。适用于面部凹陷填充、面部年轻化、形体塑造等美容医疗需求。具体方案及费用请联系国际医疗中心咨询。',
  'The Autologous Micro-Fat Grafting Technology program at Taikang Xianlin Drum Tower Hospital International Medical Center uses advanced autologous micro-fat grafting techniques to achieve facial rejuvenation, contouring, and localized filling through refined extraction, processing, and injection of the patient''s own adipose tissue. Using autologous tissue eliminates rejection risk, ensuring high safety with natural and long-lasting results. Suitable for facial volume restoration, facial rejuvenation, and body contouring. Please contact the International Medical Center for specific plans and pricing.',
  NULL, NULL, NULL,
  '国际医疗中心', '025-83169988', 7, 1
);

-- ============================================================
-- 5. 产品套餐（仅高端胃肠镜有套餐）
-- ============================================================
INSERT INTO product_variants (
  product_id, name_zh, name_en,
  desc_zh, desc_en,
  price, sort_order, is_active
) VALUES
(
  @product_id_endo,
  '高端胃肠镜尊享套餐',
  'Premium Gastrointestinal Endoscopy VIP Package',
  '入住国际部私密单人间，健康管理师一对一全程服务。包含：消化内镜著名专家主诊、日本奥林巴斯X1超清放大内镜检查、AI智能双重阅片、精查治疗一次完成、发现复杂病变立即启动MDT多学科会诊、全程舒适无忧服务。',
  'Private single room in the International Medical Department with one-on-one health manager service throughout. Includes: renowned digestive endoscopy expert consultation, Olympus X1 ultra-HD magnifying endoscope examination, AI-assisted dual reading, precision diagnosis and treatment in one session, immediate MDT consultation for complex lesions, and full comfort service.',
  NULL, 1, 1
);
