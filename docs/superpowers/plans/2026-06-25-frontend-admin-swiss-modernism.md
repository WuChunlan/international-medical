# Frontend Admin — 瑞士现代主义 2.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign frontend-admin with Swiss Modernism 2.0 style — white Sider, 48px Header, Ant Design token overrides, Modal→Drawer migration across all CRUD forms.

**Architecture:** Inject a global `ConfigProvider` in `main.tsx` with a custom `theme.ts`, create `src/styles/` for LESS tokens/global/layout/components, rewrite `AdminLayout.tsx`, then migrate each form from `<Modal>` to `<Drawer width={520}>`.

**Tech Stack:** React 19, TypeScript, Vite 8, Ant Design 6.4.2, LESS 4.6.4

## Global Constraints

- Keep all existing routing, API calls, hooks, Zustand store, and i18n — do NOT change them
- `colorPrimary: '#0A2540'`, `borderRadius: 4`, `headerHeight: 48`
- All form Drawers: `width={520}`, footer with 取消+保存 buttons
- No box-shadow on stat cards, no icons on stat cards
- `onClose(refresh?: boolean)` callback pattern preserved on all forms
- Sider active item: `3px solid #0A2540` left bar via CSS `::before`

---

### Task 1: Theme Foundation

**Files:**
- Create: `src/theme.ts`
- Create: `src/styles/tokens.less`
- Create: `src/styles/global.less`
- Create: `src/styles/components.less`
- Create: `src/styles/layout.less`
- Modify: `src/index.less` (replace content with @import chain)
- Modify: `src/main.tsx` (inject ConfigProvider)

- [ ] **Step 1: Create `src/theme.ts`**

```ts
import type { ThemeConfig } from 'antd'

export const adminTheme: ThemeConfig = {
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
    colorFillAlter:       '#F5F6F8',
    colorBgElevated:      '#FFFFFF',
    fontFamily:           "'Inter', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
    fontSize:             14,
    fontSizeLG:           16,
    borderRadius:         4,
    borderRadiusLG:       6,
    borderRadiusSM:       2,
    boxShadow:            'none',
    boxShadowSecondary:   'none',
  },
  components: {
    Layout: {
      siderBg:      '#FFFFFF',
      headerBg:     '#FFFFFF',
      headerHeight: 48,
      triggerBg:    '#F5F6F8',
      triggerColor: '#374151',
    },
    Menu: {
      itemBg:            '#FFFFFF',
      itemHoverBg:       '#F9FAFB',
      itemSelectedBg:    '#F0F4FF',
      itemColor:         '#374151',
      itemHoverColor:    '#0A2540',
      itemSelectedColor: '#0A2540',
      iconSize:          16,
    },
    Table: {
      headerBg:          '#F5F6F8',
      headerColor:       '#374151',
      rowHoverBg:        '#F9FAFB',
      borderColor:       '#E5E7EB',
      cellPaddingBlock:  12,
      cellPaddingInline: 16,
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

- [ ] **Step 2: Create `src/styles/tokens.less`**

```less
@color-primary:        #0A2540;
@color-primary-hover:  #0D3361;
@color-bg-layout:      #F5F6F8;
@color-border:         #E5E7EB;
@color-text:           #0A0A0A;
@color-text-secondary: #6B7280;
@color-success:        #059669;
@color-warning:        #D97706;
@color-error:          #DC2626;

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

- [ ] **Step 3: Create `src/styles/global.less`**

```less
@import './tokens.less';

*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif;
  background: @color-bg-layout;
  color: @color-text;
  -webkit-font-smoothing: antialiased;
}

.page-card {
  background: #fff;
  border-radius: 6px;
  padding: 24px;
}

.page-header {
  margin-bottom: 20px;

  .page-title {
    font-size: 20px;
    font-weight: 600;
    color: @color-text;
    margin: 0;
  }

  .page-description {
    font-size: 14px;
    color: @color-text-secondary;
    margin: 4px 0 0;
  }
}

.page-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}
```

- [ ] **Step 4: Create `src/styles/components.less`**

```less
@import './tokens.less';

// Stat cards (Dashboard)
.stat-card {
  background: #fff;
  border: 1px solid @color-border;
  border-radius: 4px;
  padding: 20px 24px;
  box-shadow: none;

  &.accent-primary { border-left: 3px solid @color-primary; }
  &.accent-blue    { border-left: 3px solid #2563EB; }
  &.accent-green   { border-left: 3px solid @color-success; }
  &.accent-amber   { border-left: 3px solid @color-warning; }

  .stat-value {
    font-size: 32px;
    font-weight: 700;
    color: @color-text;
    line-height: 1.2;
  }

  .stat-label {
    font-size: 13px;
    color: @color-text-secondary;
    margin-top: 4px;
  }
}

// Ant Design table action dividers
.ant-table .ant-divider-vertical {
  margin: 0 2px;
}
```

- [ ] **Step 5: Create `src/styles/layout.less`**

```less
@import './tokens.less';

// Sider
.admin-sider {
  border-right: 1px solid @color-border;

  .sider-logo {
    height: 64px;
    display: flex;
    align-items: center;
    padding: 0 20px;
    border-bottom: 1px solid @color-border;
    font-size: 16px;
    font-weight: 700;
    color: @color-primary;
    white-space: nowrap;
    overflow: hidden;
  }
}

// Menu active item left bar
.ant-menu-item-selected {
  position: relative;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: @color-primary;
    border-radius: 0 2px 2px 0;
  }
}

// Header
.admin-header {
  height: 48px;
  line-height: 48px;
  padding: 0 16px 0 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid @color-border;
  position: sticky;
  top: 0;
  z-index: 100;

  .header-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: @color-text-secondary;

    .header-divider {
      color: @color-border;
    }

    .header-username {
      color: @color-text;
    }
  }
}

// Content area
.admin-content {
  padding: 24px;
  min-height: calc(100vh - 48px);
}
```

- [ ] **Step 6: Rewrite `src/index.less`**

```less
@import './styles/tokens.less';
@import './styles/global.less';
@import './styles/layout.less';
@import './styles/components.less';
```

- [ ] **Step 7: Modify `src/main.tsx`**

```tsx
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { adminTheme } from './theme'
import './index.less'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <ConfigProvider theme={adminTheme} locale={zhCN}>
      <App />
    </ConfigProvider>
  </BrowserRouter>
)
```

- [ ] **Step 8: Verify build compiles**

Run: `cd /Users/wuchunlan/Desktop/project/international-medical/frontend-admin && npm run build 2>&1 | tail -20`
Expected: No TypeScript errors, build succeeds.

---

### Task 2: AdminLayout Redesign

**Files:**
- Modify: `src/components/AdminLayout.tsx` (full rewrite)
- Delete content of `src/components/AdminLayout.less` (styles moved to layout.less)

- [ ] **Step 1: Read current AdminLayout.tsx**

Read `src/components/AdminLayout.tsx` to confirm current structure before rewriting.

- [ ] **Step 2: Rewrite `src/components/AdminLayout.tsx`**

Replace the full file with white Sider, 48px Header with breadcrumbs, role Tag in header. See design spec section II for exact layout.

Key changes:
- `<Sider theme="light">` with `className="admin-sider"`
- Logo zone `<div className="sider-logo">`
- `<Menu theme="light">` — active item gets left bar via CSS `::before`
- `<Header className="admin-header">` with left: collapse button + Breadcrumb; right: role Tag + username + logout
- `<Content className="admin-content">`
- Remove dark theme entirely

- [ ] **Step 3: Clear `AdminLayout.less`**

Set `AdminLayout.less` to empty (styles are now in `src/styles/layout.less` which is imported by `index.less`).

- [ ] **Step 4: Verify build**

Run: `cd /Users/wuchunlan/Desktop/project/international-medical/frontend-admin && npm run build 2>&1 | tail -20`

---

### Task 3: StatusTag Component

**Files:**
- Create: `src/components/StatusTag.tsx`

- [ ] **Step 1: Create `src/components/StatusTag.tsx`**

```tsx
import { Tag } from 'antd'

type AuditStatus = 'approved' | 'pending' | 'rejected'

const config: Record<AuditStatus, { color: string; bg: string; border: string; label: string }> = {
  approved: { color: '#059669', bg: '#F0FDF4', border: '#A7F3D0', label: '已通过' },
  pending:  { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', label: '待审核' },
  rejected: { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', label: '已拒绝' },
}

export const StatusTag = ({ status }: { status: AuditStatus }) => {
  const c = config[status] ?? config.pending
  return (
    <Tag
      style={{
        color: c.color,
        background: c.bg,
        borderColor: c.border,
        borderRadius: 2,
        fontSize: 12,
        fontWeight: 500,
      }}
    >
      {c.label}
    </Tag>
  )
}
```

---

### Task 4: Dashboard Redesign

**Files:**
- Modify: `src/pages/Dashboard/index.tsx`

- [ ] **Step 1: Read current Dashboard**

Read `src/pages/Dashboard/index.tsx` to understand current stat card structure.

- [ ] **Step 2: Rewrite stat card section**

Replace colored icon circles + `<Statistic>` pattern with `.stat-card` divs:

```tsx
<Row gutter={[16, 16]}>
  <Col span={6}>
    <div className="stat-card accent-primary">
      <div className="stat-value">{stats.hospitals}</div>
      <div className="stat-label">医院总数</div>
    </div>
  </Col>
  <Col span={6}>
    <div className="stat-card accent-blue">
      <div className="stat-value">{stats.doctors}</div>
      <div className="stat-label">医生总数</div>
    </div>
  </Col>
  <Col span={6}>
    <div className="stat-card accent-green">
      <div className="stat-value">{stats.products}</div>
      <div className="stat-label">产品总数</div>
    </div>
  </Col>
  <Col span={6}>
    <div className="stat-card accent-amber">
      <div className="stat-value">{stats.pending}</div>
      <div className="stat-label">待审核</div>
    </div>
  </Col>
</Row>
```

Wrap entire page content in `<div className="page-card">`.

- [ ] **Step 3: Verify build**

Run: `cd /Users/wuchunlan/Desktop/project/international-medical/frontend-admin && npm run build 2>&1 | tail -20`

---

### Task 5: HospitalManage Modal → Drawer

**Files:**
- Modify: `src/pages/HospitalManage/HospitalForm.tsx`

- [ ] **Step 1: Read current HospitalForm.tsx**

Read the file to identify all Modal props, form fields, and submit logic.

- [ ] **Step 2: Replace Modal with Drawer**

Change:
```tsx
// Before
<Modal title={...} open={open} onOk={handleOk} onCancel={() => onClose()} width={720}>
  <Form>...</Form>
</Modal>
```

To:
```tsx
// After
<Drawer
  title={isEdit ? '编辑医院' : '新增医院'}
  width={520}
  open={open}
  onClose={() => onClose()}
  footer={
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
      <Button onClick={() => onClose()}>取消</Button>
      <Button type="primary" onClick={handleOk} loading={loading}>保存</Button>
    </div>
  }
>
  <Form form={form} layout="vertical">...</Form>
</Drawer>
```

Update imports: replace `Modal` with `Drawer` from `antd`.

- [ ] **Step 3: Apply page-card template to HospitalManage/index.tsx**

Wrap content in `<div className="page-card">`, add `.page-header` with title/description, use `.page-toolbar` for search+button row.

- [ ] **Step 4: Verify build**

Run: `cd /Users/wuchunlan/Desktop/project/international-medical/frontend-admin && npm run build 2>&1 | tail -20`

---

### Task 6: DoctorManage Modal → Drawer

**Files:**
- Modify: `src/pages/DoctorManage/DoctorForm.tsx`
- Modify: `src/pages/DoctorManage/index.tsx`

- [ ] **Step 1: Read DoctorForm.tsx, apply Drawer pattern**

Same Modal → Drawer migration as Task 5. Width 520, footer with 取消+保存.

- [ ] **Step 2: Apply page-card template to index.tsx**

- [ ] **Step 3: Verify build**

---

### Task 7: EquipmentManage Modal → Drawer

**Files:**
- Modify: `src/pages/EquipmentManage/EquipmentForm.tsx`
- Modify: `src/pages/EquipmentManage/index.tsx`

- [ ] **Step 1: Read EquipmentForm.tsx, apply Drawer pattern**

- [ ] **Step 2: Apply page-card template to index.tsx**

- [ ] **Step 3: Verify build**

---

### Task 8: ProductManage Modal → Drawer

**Files:**
- Modify: `src/pages/ProductManage/ProductForm.tsx`
- Modify: `src/pages/ProductManage/index.tsx`

- [ ] **Step 1: Read ProductForm.tsx, apply Drawer pattern**

- [ ] **Step 2: Apply page-card template to index.tsx**

- [ ] **Step 3: Verify build**

---

### Task 9: CaseManage Modal → Drawer

**Files:**
- Modify: `src/pages/CaseManage/CaseForm.tsx`
- Modify: `src/pages/CaseManage/index.tsx`

- [ ] **Step 1: Read CaseForm.tsx, apply Drawer pattern**

- [ ] **Step 2: Apply page-card template to index.tsx**

- [ ] **Step 3: Verify build**

---

### Task 10: Remaining Manage Pages — page-card template

**Files:**
- Modify: `src/pages/EnvironmentManage/index.tsx`
- Modify: `src/pages/ServiceTeamManage/index.tsx`
- Modify: `src/pages/ServiceFeatureManage/index.tsx`
- Modify: `src/pages/UserManage/index.tsx`
- Modify: `src/pages/HospitalAdminManage/index.tsx`
- Modify: `src/pages/SiteConfig/index.tsx`

Each: wrap in page-card, add page-header, ensure toolbar pattern. Any inline Modal forms → Drawer.

- [ ] **Step 1: Read each file and apply template**

- [ ] **Step 2: Verify build after all 6 files**

---

### Task 11: HospitalAdmin HA* Pages

**Files:**
- Modify: `src/pages/HospitalAdmin/HAHospitalPage.tsx`
- Modify: `src/pages/HospitalAdmin/HADoctorsPage.tsx`
- Modify: `src/pages/HospitalAdmin/HAEquipmentsPage.tsx`
- Modify: `src/pages/HospitalAdmin/HAEnvironmentsPage.tsx`
- Modify: `src/pages/HospitalAdmin/HACasesPage.tsx`
- Modify: `src/pages/HospitalAdmin/HAProductsPage.tsx`

Apply page-card template; Modal → Drawer for any inline forms.

- [ ] **Step 1: Read and migrate each HA* page**

- [ ] **Step 2: Verify build**

---

### Task 12: Reviewer Page + Final Cleanup

**Files:**
- Modify: `src/pages/Reviewer/ReviewerPendingPage.tsx`
- Modify: `src/pages/Login/index.tsx` (minor: ensure no dark theme remnants)

- [ ] **Step 1: Read ReviewerPendingPage.tsx, apply page-card + StatusTag**

Replace any inline audit_status rendering with `<StatusTag status={...} />`.

- [ ] **Step 2: Final build verification**

Run: `cd /Users/wuchunlan/Desktop/project/international-medical/frontend-admin && npm run build`
Expected: Zero errors, build output in `dist/`.

- [ ] **Step 3: Commit**

```bash
git add frontend-admin/src/
git commit -m "feat(admin): Swiss Modernism 2.0 redesign — white layout, token system, Modal→Drawer migration"
```
