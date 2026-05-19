---
name: taikang-tongji-seed-design
description: 解析泰康同济资料PDF，生成符合数据库表结构的种子数据SQL文件
metadata:
  type: project
---

# 泰康同济数据入库设计文档

## 目标

解析 `资料/泰康同济资料/` 下的三个 PDF，将医院、医生、设备、特需产品数据按现有数据库表结构生成 SQL，写入新文件 `db/taikang-tongji-seed.sql`。

## 数据来源

- `20260404泰康同济官方简介.pdf` — 医院基本信息、学科建设、人才数据
- `泰康同济 简介.pdf` — 医院规模、战略、合作专家名单
- `泰康同济高端特色项目.pdf` — 医生团队详情、设备、特需产品及价格

## 设计决策

- **ID 策略**：不指定 ID，全部自增；用 `SET @hospital_id = LAST_INSERT_ID()` 串联子表
- **英文字段**：直接在 SQL 中写好翻译内容（机器翻译）
- **图片字段**：全部填 `NULL`（cover_image_url、photo_url 等）
- **文件**：单文件 `db/taikang-tongji-seed.sql`，按表依赖顺序执行

## 表写入顺序

```
hospitals → @hospital_id = LAST_INSERT_ID()
  ↓
doctors (hospital_id = @hospital_id)
equipments (hospital_id = @hospital_id)
special_products (hospital_id = @hospital_id) → @product_id_N = LAST_INSERT_ID()
  ↓
product_variants (product_id = @product_id_N)
```

## 数据清单

### hospitals（1条）

| 字段 | 值 |
|------|----|
| name_zh | 泰康同济（武汉）医院 |
| name_en | Taikang Tongji (Wuhan) Hospital |
| intro_zh | 世界500强企业泰康保险集团全资投资，与华中科技大学同济医学院附属同济医院合作管理的高品质、非营利性综合医院。2020年2月开业，2026年4月获评国家三级甲等综合医院。建筑面积约27.6万平方米，规划床位1200余张。 |
| intro_en | A high-quality, non-profit general hospital wholly invested by Taikang Insurance Group (Fortune Global 500) and co-managed with Tongji Hospital affiliated to Tongji Medical College of HUST. Opened in February 2020, designated as a Class-III Grade-A hospital in April 2026. Building area approx. 276,000 m², planned capacity 1,200+ beds. |
| address_zh | 武汉市汉阳区四新北路322号 |
| address_en | No. 322, Sixin North Road, Hanyang District, Wuhan |
| phone | 4000195522 |
| contact_person | 国际医疗部 |
| contact_info | 4000195522 |
| sort_order | 0 |
| is_active | 1 |

### doctors（约30条）

**泰康同济自有医生（眼科团队）**

| name_zh | title_zh | specialty_zh | bio_zh摘要 |
|---------|----------|--------------|-----------|
| 陈中山 | 副教授/主任医师 | 眼科 | 眼科科主任，神经眼科博士后，硕士生导师，擅长眼底病、神经眼科、黄斑疾病等 |
| 金小琴 | 主任医师 | 小儿眼科 | 从事斜视与小儿眼科二十余年，擅长各类斜视、弱视、儿童屈光不正 |
| 吴岚 | 主任医师 | 眼科 | 眼科副主任，白内障、青光眼和屈光矫正手术专家 |
| 成琼 | 副主任医师 | 眼科屈光中心 | 擅长准分子激光、全飞秒角膜激光、ICL晶体植入术 |

**同济合作专家（约26位）**

| name_zh | specialty_zh | 备注 |
|---------|--------------|------|
| 夏丽敏 | 消化内科 | 学术主任 |
| 曾和松 | 心血管内科 | 学术主任 |
| 赵建平 | 呼吸与危重症医学科 | 学术主任 |
| 秦仁义 | 肝胆胰外科 | 学术主任 |
| 袁响林 | 肿瘤科 | 学术主任 |
| 涂胜豪 | 中医科 | 学术主任 |
| 张木勋 | 内分泌内科 | 合作专家 |
| 赵波 | 内分泌内科 | 合作专家 |
| 潘友民 | 胸心外科 | 合作专家 |
| 陈志强 | 胸心外科 | 合作专家 |
| 宋晓东 | 胸心外科 | 合作专家 |
| 李锋 | 泌尿外科 | 合作专家 |
| 方煌 | 泌尿外科 | 合作专家 |
| 杨勇 | 泌尿外科 | 合作专家 |
| 易继林 | 甲状腺乳腺外科 | 合作专家 |
| 刘谨文 | 甲状腺乳腺外科 | 合作专家 |
| 曹志新 | 胃肠外科 | 合作专家 |
| 李登举 | 血液内科 | 合作专家 |
| 崔永华 | 耳鼻咽喉科 | 合作专家 |
| 王恒 | 耳鼻咽喉科 | 合作专家 |
| 王常玉 | 妇科 | 合作专家 |
| 曾万江 | 产科 | 合作专家 |
| 李新宇 | 眼科 | 合作专家 |
| 管汉雄 | 放射影像科 | 合作专家 |
| 邓又斌 | 超声影像科 | 合作专家 |
| 田学愎 | 疼痛科 | 合作专家 |

### equipments（3条）

| name_zh | desc_zh摘要 |
|---------|------------|
| 联影320排 uCT 960+ | 0.25秒完成一圈扫描，识别0.5mm微小病变，辐射剂量更低 |
| 联影3.0T uMR 790 | 3.0T超高场强，软组织分辨率卓越，无电离辐射 |
| 第四代达芬奇手术机器人 | 2025年7月启用，10-15倍放大视野，毫米级精准操控 |

### special_products（4条）+ product_variants（12条）

| 产品 | 套餐 | 价格(元) |
|------|------|---------|
| 肠菌移植项目 | 肠道菌群宏基因组检测（1G数据版） | 1530 |
| | 肠道菌群宏基因组检测（6G数据版） | 2520 |
| | 肠菌胶囊基础版（特需门诊） | 25000 |
| | 肠菌胶囊进阶版（特需门诊） | 34000 |
| | 肠菌胶囊尊享版（特需部住院7天/6晚） | 48000 |
| | 肠菌活菌液臻至版（特需部住院7天/6晚） | 56000 |
| NAD+综合抗衰 | 5次/1疗程 | 33000 |
| 血脂净化 | 套餐1（主任医师问诊+特需病房） | 24000 |
| | 套餐2（多学科专家会诊+国疗病房） | 39800 |
| 多模态创新睡眠管理 | 泰·睿能（精英睡眠效率提升方案） | NULL |
| | 泰·舒压（急性压力失眠阻断方案） | NULL |
| | 泰·安悦（女性全周期睡眠调养方案） | NULL |
| | 泰·守护（老年慢病睡眠管理方案） | NULL |
| | 泰·归元（重度失眠神经调控康复方案） | NULL |

## 输出文件

`db/taikang-tongji-seed.sql`
