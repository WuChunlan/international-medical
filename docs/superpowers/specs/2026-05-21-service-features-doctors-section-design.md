# 服务功能模块 + 专业医护人员板块设计文档

**日期：** 2026-05-21  
**状态：** 已批准

---

## 背景

现有首页"服务团队"板块展示的是服务团队本身（`service_teams` 表），缺乏对具体服务内容的描述。本次改造目标：

1. 新增"服务功能"实体，描述平台能提供的具体服务项目，并与服务团队建立多对多关联。
2. 首页"服务团队"板块替换为"省心品质服务"，展示服务功能数据。
3. 首页新增"专业医护人员"板块，展示跨医院的医生数据。
4. 调整首页板块顺序。

---

## 一、数据库变更

### 新增表：`service_features`（服务功能表）

```sql
CREATE TABLE IF NOT EXISTS service_features (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name_zh      VARCHAR(200)    NOT NULL COMMENT '服务名称（中文）',
  name_en      VARCHAR(200)    NOT NULL COMMENT '服务名称（英文）',
  intro_zh     TEXT            DEFAULT NULL COMMENT '服务简介（中文）',
  intro_en     TEXT            DEFAULT NULL COMMENT '服务简介（英文）',
  image_url    VARCHAR(500)    DEFAULT NULL COMMENT '简介图片',
  sort_order   INT             NOT NULL DEFAULT 0,
  is_active    TINYINT(1)      NOT NULL DEFAULT 1,
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='服务功能表';
```

### 新增表：`service_team_features`（服务团队↔服务功能关联表）

```sql
CREATE TABLE IF NOT EXISTS service_team_features (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  service_team_id    BIGINT UNSIGNED NOT NULL COMMENT '关联 service_teams.id',
  service_feature_id BIGINT UNSIGNED NOT NULL COMMENT '关联 service_features.id',
  PRIMARY KEY (id),
  UNIQUE KEY uk_team_feature (service_team_id, service_feature_id),
  KEY idx_team    (service_team_id),
  KEY idx_feature (service_feature_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='服务团队与服务功能关联表';
```

---

## 二、后端变更

### 新增实体与 Mapper

- `ServiceFeature.java` — 对应 `service_features` 表
- `ServiceTeamFeature.java` — 对应 `service_team_features` 表
- `ServiceFeatureMapper.java`
- `ServiceTeamFeatureMapper.java`

### 新增公开接口

**`GET /api/service-features`**  
查询所有启用的服务功能，按 `sort_order` 升序，支持分页（`page`、`size` 参数）。  
响应：`Result<IPage<ServiceFeature>>`

**`GET /api/doctors`**（新增）  
跨医院查询所有启用医生，按 `sort_order` 升序，支持分页（`page`、`size` 参数）。  
响应：`Result<IPage<Doctor>>`

### 新增管理接口

路径前缀：`/api/admin/service-features`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/service-features` | 分页查询（含关联的 teamIds） |
| POST | `/api/admin/service-features` | 新增（含 teamIds 写入关联表） |
| PUT | `/api/admin/service-features/{id}` | 编辑（先删旧关联，再写新关联） |
| DELETE | `/api/admin/service-features/{id}` | 删除（级联删除关联表记录） |

请求体（新增/编辑）：

```json
{
  "nameZh": "专属翻译陪诊",
  "nameEn": "Dedicated Translation Service",
  "introZh": "提供全程专业医疗翻译...",
  "introEn": "Professional medical translation...",
  "imageUrl": "https://...",
  "sortOrder": 0,
  "isActive": 1,
  "teamIds": [1, 3]
}
```

---

## 三、Admin 端变更

### 新增页面：`ServiceFeatureManage`

路由：`/service-features`  
侧边栏位置：在"服务团队"菜单项下方新增"服务功能"菜单项，使用 `AppstoreOutlined` 图标。

**表单字段：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| nameZh | Input | 是 | 服务名称（中文），失焦自动翻译 |
| nameEn | Input | 是 | 服务名称（英文） |
| introZh | TextArea | 否 | 服务简介（中文），失焦自动翻译 |
| introEn | TextArea | 否 | 服务简介（英文） |
| imageUrl | ImageUpload | 否 | 简介图片，category: `service-features/images` |
| teamIds | Select (multiple) | 否 | 提供服务的团队，从 `/api/admin/service-teams` 加载选项 |
| sortOrder | InputNumber | 否 | 排序，默认 0 |
| isActive | Switch | 否 | 启用，默认 true |

支持一键中→英翻译（`useAutoTranslate` hook，与现有页面一致）。

**列表列：** ID、图片、服务名称（中）、服务名称（英）、简介（中，截断40字）、关联团队数、排序、状态、操作（编辑/删除）。

---

## 四、frontend-site-a 变更

### 4.1 首页板块顺序

```
ScoSection（英雄区）
TabSection（标签切换）
  professional 标签下：
    1. HospitalsSection     — 中国顶尖医院（不变）
    2. EquipmentSection     — 先进医疗设备（不变）
    3. DoctorsSection       — 专业医护人员（新增）
    4. ServiceFeaturesSection — 省心品质服务（替换原 ServiceTeamsSection）
    5. CasesSection         — 过往成功案例（不变）
```

### 4.2 新增：`DoctorsSection`（专业医护人员）

- 数据来源：`GET /api/doctors`（分页，每次加载 8 条）
- 布局：每行 4 个，使用 `useCarousel` hook，支持轮播
- 卡片样式：**完全复用 HospitalDetail 的 `DoctorCard` 组件样式**
  - 头像（Avatar，72px）+ 姓名 + 职称 Tag（blue）+ 科室 Tag（cyan）
  - 简介文字（3行截断）
  - "预约就诊"按钮（触发 BookingModal）
  - 白色卡片背景，`hd-card hd-card--doctor` 样式类
- 板块标题：`专业医护人员` / `Professional Medical Staff`
- 板块背景：深色（与 EquipmentSection 一致，`section-reveal` 动画）
- i18n key 前缀：`doctors`

### 4.3 替换：`ServiceFeaturesSection`（省心品质服务）

原 `ServiceTeamsSection` 整体替换，文件路径从 `ServiceTeamsSection/` 改为 `ServiceFeaturesSection/`。

- 数据来源：`GET /api/service-features`（分页，每次加载 6 条）
- 布局：每行 3 个，使用 `useCarousel` hook，支持轮播
- 卡片样式：**方案A** — 图片在上（固定高度）+ 深色文字区在下（名称 + 简介），与现有 `EquipmentSection` 卡片风格一致
- 板块标题：`省心品质服务` / `Quality Care Services`
- 板块背景：深色（与其他板块统一）
- i18n key 前缀：`service_features`

### 4.4 类型定义新增

`frontend-site-a/src/types/index.ts` 新增：

```typescript
export interface ServiceFeature {
  id: number;
  nameZh: string;
  nameEn: string;
  introZh: string | null;
  introEn: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: number;
}
```

`frontend-admin/src/types/index.ts` 新增：

```typescript
export interface ServiceFeature {
  id: number;
  nameZh: string;
  nameEn: string;
  introZh: string | null;
  introEn: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: number;
  teamIds?: number[];
}
```

---

## 五、i18n 变更

`frontend-site-a/src/i18n.ts` 新增以下 key（中英两套）：

```
doctors.section_title: 专业医护人员 / Professional Medical Staff
doctors.section_subtitle: Professional Medical Staff / Professional Medical Staff
doctors.no_data: 暂无医护人员信息 / No medical staff available
service_features.section_title: 省心品质服务 / Quality Care Services
service_features.section_subtitle: Quality Care Services / Quality Care Services
service_features.no_data: 暂无服务信息 / No services available
```

导航栏 `tabs` 中的 `service_teams` key 替换为 `service_features`（或保留原 key 更新值）。

---

## 六、不在本次范围内

- `service_teams` 表及其管理页面保留不变（仍可管理服务团队）
- 服务功能详情页（无需单独详情页）
- 医生详情页（点击预约直接弹 BookingModal，与 HospitalDetail 一致）
