# Frontend Admin — 瑞士现代主义 2.0 UI/UX 重设计规格

**日期：** 2026-06-25
**范围：** frontend-admin 全站视觉与交互升级
**风格基调：** 纯净功能派——纯白底、单一品牌主色、严格网格秩序、有意义的留白
**技术路线：** 保留 Ant Design 6，深度覆盖 Design Token + LESS 重写，无组件库替换

---

## 一、Design Tokens

### 颜色系统

通过 `ConfigProvider` 的 `theme.token` 覆盖 antd 全局 Token。

```ts
// src/theme.ts
export const theme = {
  token: {
    colorPrimary:         '#0A2540',
    colorPrimaryHover:    '#0D3361',
    colorBgContainer:     '#FFFFFF',
    colorBgLayout:        '#F5F6F8',
    colorText:            '#0A0A0A',
    colorTextSecondary:   '#6B7280',
    colorBorder:          '#E5E7EB',
    colorBorderSecondary: '#F3F4F6',
    colorSuccess:         '#059669',
    colorWarning:         '#D97706',
    colorError:           '#DC2626',
    colorInfo:            '#2563EB',
    colorFillAlter:       '#F5F6F8',  // 表头背景
    colorBgElevated:      '#FFFFFF',
    fontFamily:           "'Inter', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
    fontSize:             14,
    fontSizeLG:           16,
    fontSizeHeading3:     20,
    borderRadius:         4,
    borderRadiusLG:       6,
    borderRadiusSM:       2,
    boxShadow:            'none',
    boxShadowSecondary:   'none',
  },
  components: {
    Layout: {
      siderBg:          '#FFFFFF',
      headerBg:         '#FFFFFF',
      headerHeight:     48,
      triggerBg:        '#F5F6F8',
      triggerColor:     '#374151',
    },
    Menu: {
      itemBg:             '#FFFFFF',
      itemHoverBg:        '#F9FAFB',
      itemSelectedBg:     '#F0F4FF',
      itemColor:          '#374151',
      itemHoverColor:     '#0A2540',
      itemSelectedColor:  '#0A2540',
      iconSize:           16,
    },
    Table: {
      headerBg:           '#F5F6F8',
      headerColor:        '#374151',
      rowHoverBg:         '#F9FAFB',
      borderColor:        '#E5E7EB',
      cellPaddingBlock:   12,
      cellPaddingInline:  16,
    },
    Button: {
      primaryColor:       '#FFFFFF',
      defaultBorderColor: '#E5E7EB',
    },
    Drawer: {
      footerPaddingBlock:  16,
      footerPaddingInline: 24,
    },
    Card: {
      paddingLG: 20,
    },
  },
}
```

### 语义色（LESS 变量，供全局使用）

```less
// src/styles/tokens.less
@color-primary:       #0A2540;
@color-primary-hover: #0D3361;
@color-bg-layout:     #F5F6F8;
@color-border:        #E5E7EB;
@color-text:          #0A0A0A;
@color-text-secondary:#6B7280;
@color-success:       #059669;
@color-warning:       #D97706;
@color-error:         #DC2626;

// 审核状态色
@status-approved-bg:     #F0FDF4;
@status-approved-text:   #059669;
@status-approved-border: #A7F3D0;
@status-pending-bg:      #FFFBEB;
@status-pending-text:    #D97706;
@status-pending-border:  #FDE68A;
@status-rejected-bg:     #FEF2F2;
@status-rejected-text:   #DC2626;
@status-rejected-border: #FECACA;
```

---

## 二、Layout 架构

### 整体结构

```
┌──────────────────────────────────────────────────────┐
│  Sider (白底, 220px / 折叠 64px)  │  右侧区域         │
│  ┌──────────────────────────────┐ │  ┌──────────────┐│
│  │  Logo 区 (64px)              │ │  │  Header 48px ││
│  │  border-bottom: 1px #E5E7EB  │ │  │  固定，白底   ││
│  ├──────────────────────────────┤ │  ├──────────────┤│
│  │  Nav Menu                    │ │  │              ││
│  │  (激活项: 左3px色条 + 浅蓝底) │ │  │  Content     ││
│  │                              │ │  │  bg:#F5F6F8  ││
│  └──────────────────────────────┘ │  │  padding:24px││
│  border-right: 1px solid #E5E7EB  │  └──────────────┘│
└──────────────────────────────────────────────────────┘
```

### Sider 规格

| 属性 | 值 |
|---|---|
| 背景色 | `#FFFFFF` |
| 宽度（展开） | `220px` |
| 宽度（折叠） | `64px` |
| 右边框 | `1px solid #E5E7EB` |
| Logo 区高度 | `64px`，底边 `1px solid #E5E7EB` |
| 激活菜单项背景 | `#F0F4FF` |
| 激活菜单项左侧竖条 | `3px solid #0A2540`（通过 `::before` 伪元素实现） |
| 未激活文字色 | `#374151` |
| 激活文字色 | `#0A2540` |

### Header 规格

| 属性 | 值 |
|---|---|
| 高度 | `48px` |
| 背景 | `#FFFFFF` |
| 底边 | `1px solid #E5E7EB` |
| position | `sticky top: 0, z-index: 100` |
| 左侧 | 折叠按钮（18px 图标） + 面包屑（`fontSize: 13`） |
| 右侧 | 角色 Tag → `|` 分隔符 → 用户名 → 退出（`type="text"`） |

### Content 区

- 背景：`#F5F6F8`
- Padding：`24px`
- 所有页面内容包裹在 `.page-card`（白色，`borderRadius: 6`，`padding: 24px`）中
- min-height：`calc(100vh - 48px)`

---

## 三、组件模式

### 3.1 CRUD 页面标准模板

每个管理页面统一结构：

```
.page-card
  ├── .page-header
  │     ├── h3.page-title       (20px, fontWeight 600, #0A0A0A)
  │     └── p.page-description  (14px, #6B7280, margin-top: 4px)
  ├── .page-toolbar              (margin-top: 20px)
  │     ├── 左侧：搜索框 + 筛选 Select 组件
  │     └── 右侧：「+ 新建」主色按钮
  └── Table                      (margin-top: 16px)
```

### 3.2 表格规范

```ts
<Table
  size="middle"
  rowHoverBg="#F9FAFB"
  pagination={{ position: ['bottomRight'], size: 'small', showTotal: true }}
  // 无斑马纹，无外边框
/>
```

- 操作列：`<Button type="text" size="small">查看</Button> | <Button type="text" size="small">编辑</Button> | <Button type="text" danger size="small">删除</Button>`
- 竖线分隔符：`<Divider type="vertical" style={{ margin: '0 2px' }} />`

### 3.3 表单 Drawer（替换所有 Modal）

```tsx
<Drawer
  title="新建医院"
  width={520}
  open={open}
  onClose={onClose}
  footer={
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
      <Button onClick={onClose}>取消</Button>
      <Button type="primary" onClick={onSubmit}>保存</Button>
    </div>
  }
>
  <Form layout="vertical" form={form}>
    {/* 字段纵向排列，labelCol: { span: 24 } */}
  </Form>
</Drawer>
```

- Drawer 头部底边：`1px solid #E5E7EB`（antd 默认）
- Drawer 底部背景：`#FFFFFF`，顶边：`1px solid #E5E7EB`
- 图片上传区：`140px × 140px`，虚线边框（`border: 1.5px dashed #E5E7EB`），hover 背景 `#F9FAFB`

### 3.4 统计卡片（Dashboard）

```less
.stat-card {
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-left: 3px solid var(--stat-accent);  // 左侧色条
  border-radius: 4px;
  padding: 20px 24px;
  box-shadow: none;

  .stat-value {
    font-size: 32px;
    font-weight: 700;
    color: #0A0A0A;
    line-height: 1.2;
  }

  .stat-label {
    font-size: 13px;
    color: #6B7280;
    margin-top: 4px;
  }

  .stat-change {
    font-size: 12px;
    margin-top: 8px;
    // 正值绿色，负值红色
  }
}
```

色条变体：
- 医院/主要：`--stat-accent: #0A2540`
- 医生：`--stat-accent: #2563EB`
- 产品：`--stat-accent: #059669`
- 审核：`--stat-accent: #D97706`

### 3.5 审核状态 Tag

```tsx
const StatusTag = ({ status }: { status: 'approved' | 'pending' | 'rejected' }) => {
  const config = {
    approved: { color: '#059669', bg: '#F0FDF4', border: '#A7F3D0', label: '已通过' },
    pending:  { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', label: '待审核' },
    rejected: { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', label: '已拒绝' },
  }
  const c = config[status]
  return (
    <Tag style={{
      color: c.color,
      background: c.bg,
      borderColor: c.border,
      borderRadius: 2,
      fontSize: 12,
      fontWeight: 500,
    }}>
      {c.label}
    </Tag>
  )
}
```

### 3.6 按钮层级

| 场景 | type | 说明 |
|---|---|---|
| 新建/保存 | `primary` | `#0A2540` 背景，白色文字 |
| 取消/重置 | `default` | 白底，`#E5E7EB` 边框 |
| 次要操作 | `default` | 同上 |
| 表格查看/编辑 | `text` | 无背景，`#374151` 文字 |
| 删除 | `text` + `danger` | 无背景，红色文字 |

---

## 四、全局 LESS 结构

```
src/styles/
  ├── tokens.less          新增：所有自定义 LESS 变量
  ├── global.less          重写：原 index.less
  ├── layout.less          新增：AdminLayout 专属样式
  └── components.less      新增：通用组件覆盖（stat-card, status-tag, page-header 等）
```

`index.less` 改为入口文件，仅 `@import` 上述四个文件。

---

## 五、实施范围

### 必须改动的文件

| 文件/目录 | 改动内容 |
|---|---|
| `src/main.tsx` 或 `App.tsx` | 注入 `ConfigProvider` + `theme` |
| `src/theme.ts` | 新建，存放所有 Token 定义 |
| `src/styles/tokens.less` | 新建，LESS 变量 |
| `src/styles/global.less` | 重写，替代 index.less |
| `src/styles/layout.less` | 新建，AdminLayout 样式 |
| `src/styles/components.less` | 新建，通用组件覆盖 |
| `src/components/AdminLayout.tsx` | 重写：白色 Sider、48px Header、面包屑 |
| `src/components/AdminLayout.less` | 删除，合并入 layout.less |
| 所有 CRUD 页面 `index.tsx` (18个) | Modal → Drawer，统一页面模板结构 |
| `src/pages/Dashboard/index.tsx` | 重写统计卡片，使用新 stat-card 样式 |

### 不需要改动

- 路由结构（`App.tsx` 路由定义部分）
- API 调用层（`api.ts`、所有 hooks）
- Zustand store
- i18n 配置
- 表单验证逻辑

---

## 六、验收标准

1. Sider 背景为白色，激活菜单项有 `3px` 左侧色条
2. Header 高度 48px，包含面包屑导航
3. 所有 Modal 弹窗已替换为 520px 右侧 Drawer
4. 表格无斑马纹，操作列为文字按钮 + 竖线分隔
5. Dashboard 统计卡片无图标，有左侧色条，`box-shadow: none`
6. 审核状态 Tag 使用语义色（绿/琥珀/红），`borderRadius: 2`
7. 全站圆角不超过 `6px`
8. 字体为 Inter，无系统默认字体退化影响视觉一致性
9. 所有页面在 1440px 宽度下无水平滚动条
