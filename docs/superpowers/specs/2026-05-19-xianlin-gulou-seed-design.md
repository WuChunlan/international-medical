---
name: xianlin-gulou-seed-design
description: 解析仙林鼓楼资料PDF，生成符合数据库表结构的种子数据SQL文件
metadata:
  type: project
---

# 泰康仙林鼓楼医院数据入库设计文档

## 目标

解析 `资料/仙林鼓楼资料/` 下的所有 PDF，将医院、医生、设备、特需产品数据按现有数据库表结构生成 SQL，写入新文件 `db/xianlin-gulou-seed.sql`。

## 数据来源

- `泰康仙林鼓楼医院资料/医院介绍.pdf` — 医院基本信息、设备、学科
- `泰康仙林鼓楼医院资料/国际部介绍.pdf` — 国际医疗中心介绍、特需产品列表
- `泰康仙林鼓楼医院资料/国际医疗中心客户就诊流程.pdf` — 就诊流程（不入库）
- `特需门诊项目/高端胃肠镜.pdf` — 产品详情 + 3位医生信息
- `特需门诊项目/肠道菌群.pdf` — 仅标题（图片PDF）
- `特需门诊项目/中医.pdf` — 纯图片PDF，无可提取文字
- `特需门诊项目/净血.pdf` — 纯图片PDF，无可提取文字
- `特需门诊项目/泌尿科.pdf` — 纯图片PDF，无可提取文字
- `特需门诊项目/肠道微生态检测.pdf` — 纯图片PDF，无可提取文字
- `特需门诊项目/自体脂肪.pdf` — 纯图片PDF，无可提取文字
- `images/` — 医生照片（zhouxiaoping.png、shiruihua.png、zhangyiyang.png）及设备图

## 设计决策

- **ID 策略**：不指定 ID，全部自增；用 `SET @hospital_id = LAST_INSERT_ID()` 串联子表
- **英文字段**：直接在 SQL 中写好翻译内容
- **图片字段**：全部填 `NULL`
- **纯图片PDF产品**：用名称占位，summary/detail 填写通用描述，价格留 NULL
- **文件**：单文件 `db/xianlin-gulou-seed.sql`，按表依赖顺序执行

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
| name_zh | 泰康仙林鼓楼医院 |
| name_en | Taikang Xianlin Drum Tower Hospital |
| intro_zh | 泰康保险集团旗下首家医教研一体化三级甲等综合医院，南京大学医学院附属医院、南京鼓楼医院集团成员、武汉大学临床学院、南京中医药大学教学医院。总建筑面积33.4万平方米，规划床位近1400张。国际医疗中心累计服务超60个国家患者，支持超20家商业保险直付理赔。 |
| address_zh | 南京市栖霞区灵山北路188号 |
| phone | 025-83169988 |
| contact_person | 国际医疗中心 |
| contact_info | 025-83169988 |

### doctors（3条）

| name_zh | title_zh | specialty_zh | 备注 |
|---------|----------|--------------|------|
| 邹晓平 | 院长/主任医师 | 消化内科 | 泰康仙林鼓楼医院院长 |
| 施瑞华 | 首席专家/主任医师 | 消化内科 | 东南大学附属中大医院首席专家 |
| 张以洋 | 主任医师 | 消化内科 | 南京鼓楼医院消化内科主任医师 |

### equipments（3条）

| name_zh | 描述来源 |
|---------|---------|
| PET-CT | 一次性完成全身扫描，同时看清病灶形态和代谢，肿瘤诊断利器 |
| 达芬奇手术机器人 | 全球最先进外科手术系统之一，精准灵活完成微创手术 |
| 日本奥林巴斯X1超清放大内镜系统 | 超高清显微级图像，实时观察细胞层面微血管和黏膜结构，早癌识别精度提升40% |

### special_products（7条）+ product_variants（1条）

| 产品 | 内容 | 价格 |
|------|------|------|
| 高端胃肠镜 | 详细描述（来自PDF），含套餐variant | NULL |
| 肠道菌群移植 | 占位描述 | NULL |
| 中医特色诊疗 | 占位描述 | NULL |
| 净血疗法 | 占位描述 | NULL |
| 泌尿科特需诊疗 | 占位描述 | NULL |
| 肠道微生态检测 | 占位描述 | NULL |
| 自体脂肪微颗粒技术 | 占位描述 | NULL |

高端胃肠镜 product_variants：
- 国际部私密单人间套餐（健康管理师一对一服务，价格NULL）

## 输出文件

`db/xianlin-gulou-seed.sql`
