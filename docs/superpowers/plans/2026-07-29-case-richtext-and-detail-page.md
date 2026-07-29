# Case Rich Text Editor & Detail Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add rich text editing (wangEditor) to the case forms in frontend-admin, expose a `GET /api/cases/{id}` backend endpoint, and build a `CaseDetail` page in frontend-site-a that renders all case fields including HTML rich text with images.

**Architecture:** A shared `RichTextEditor` component wraps wangEditor and is dropped into both `CaseForm` (super admin) and `HACasesPage` (hospital admin). The backend gains a single new mapper query + service method + controller endpoint. The site-a detail page follows the existing `ProductDetail` pattern and is wired up via a new `/case/:id` route.

**Tech Stack:** React 19, TypeScript, Antd 6, wangEditor (`@wangeditor/editor` + `@wangeditor/editor-for-react`), Spring Boot + MyBatis-Plus (backend), Less (styles)

## Global Constraints

- wangEditor versions: `@wangeditor/editor@^5`, `@wangeditor/editor-for-react@^1` — install in `frontend-admin` only
- Image upload endpoint in admin: `/api/admin/upload` (super admin); `/api/hospital-admin/upload` (hospital admin) — both accept `multipart/form-data` with field `file` and return a plain string URL
- Backend `Result<T>` wrapper: `{ code, message, data }` — use `Result.ok(data)` / `Result.fail(String)`
- All `CaseVO` fields already include `detailZh`, `detailEn` via inheritance from `Case` entity
- site-a uses existing global classes: `page-wrapper`, `page-main`, `page-loading`, `section-block`, `section-block--alt`, `section-inner`, `section-title`, `product-detail-html` (reused for rich text rendering)
- Language detection: `i18n.language.startsWith('zh')` → Chinese; else English

---

### Task 1: Install wangEditor in frontend-admin

**Files:**
- Modify: `frontend-admin/package.json`

**Interfaces:**
- Produces: `@wangeditor/editor` and `@wangeditor/editor-for-react` available as imports in `frontend-admin/src`

- [ ] **Step 1: Install dependencies**

```bash
cd /Users/wuchunlan/Desktop/project/international-medical/frontend-admin
npm install @wangeditor/editor@^5 @wangeditor/editor-for-react@^1
```

- [ ] **Step 2: Verify install**

```bash
grep -E "wangeditor" package.json
```
Expected: two lines with `@wangeditor/editor` and `@wangeditor/editor-for-react`.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(admin): install wangeditor for rich text editing"
```

---

### Task 2: Create `RichTextEditor` shared component

**Files:**
- Create: `frontend-admin/src/components/RichTextEditor.tsx`

**Interfaces:**
- Consumes: `@wangeditor/editor-for-react` (Editor, Toolbar), `@wangeditor/editor` (IEditorConfig, IDomEditor)
- Produces: `RichTextEditor` — default export, props: `value?: string`, `onChange?: (html: string) => void`, `uploadUrl?: string` (default `/api/admin/upload`), `placeholder?: string`, `height?: number` (default 400)

- [ ] **Step 1: Create the component file**

Create `frontend-admin/src/components/RichTextEditor.tsx`:

```tsx
import '@wangeditor/editor/dist/css/style.css'
import React, { useState, useEffect, useRef } from 'react'
import { Editor, Toolbar } from '@wangeditor/editor-for-react'
import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor'

interface RichTextEditorProps {
  value?: string
  onChange?: (html: string) => void
  uploadUrl?: string
  placeholder?: string
  height?: number
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  uploadUrl = '/api/admin/upload',
  placeholder = '请输入内容...',
  height = 400,
}) => {
  const [editor, setEditor] = useState<IDomEditor | null>(null)
  const latestValue = useRef(value)

  useEffect(() => { latestValue.current = value }, [value])

  // Sync external value changes (e.g. form reset / setFieldsValue)
  useEffect(() => {
    if (!editor) return
    const current = editor.getHtml()
    const next = value ?? ''
    if (current !== next) {
      editor.setHtml(next)
    }
  }, [value, editor])

  useEffect(() => {
    return () => { editor?.destroy() }
  }, [editor])

  const toolbarConfig: Partial<IToolbarConfig> = {}

  const editorConfig: Partial<IEditorConfig> = {
    placeholder,
    MENU_CONF: {
      uploadImage: {
        server: uploadUrl,
        fieldName: 'file',
        maxFileSize: 50 * 1024 * 1024,
        allowedFileTypes: ['image/*'],
        customInsert(res: { data: string }, insertFn: (url: string) => void) {
          insertFn(res.data)
        },
      },
    },
  }

  return (
    <div style={{ border: '1px solid #d9d9d9', borderRadius: 6, overflow: 'hidden' }}>
      <Toolbar
        editor={editor}
        defaultConfig={toolbarConfig}
        mode="default"
        style={{ borderBottom: '1px solid #d9d9d9' }}
      />
      <Editor
        defaultConfig={editorConfig}
        value={value ?? ''}
        onCreated={setEditor}
        onChange={e => onChange?.(e.getHtml())}
        mode="default"
        style={{ height, overflowY: 'hidden' }}
      />
    </div>
  )
}

export default RichTextEditor
```

- [ ] **Step 2: Build to verify no type errors**

```bash
cd /Users/wuchunlan/Desktop/project/international-medical/frontend-admin
npm run build 2>&1 | tail -20
```
Expected: build succeeds (exit 0), no TypeScript errors related to RichTextEditor.

- [ ] **Step 3: Commit**

```bash
git add src/components/RichTextEditor.tsx
git commit -m "feat(admin): add RichTextEditor shared component (wangEditor)"
```

---

### Task 3: Add `detail_zh` / `detail_en` to `CaseForm` (super admin)

**Files:**
- Modify: `frontend-admin/src/pages/CaseManage/CaseForm.tsx`

**Interfaces:**
- Consumes: `RichTextEditor` from `../../components/RichTextEditor`
- Produces: `CaseForm` now submits `detailZh` and `detailEn` HTML strings alongside existing fields

- [ ] **Step 1: Update CaseForm.tsx**

Open `frontend-admin/src/pages/CaseManage/CaseForm.tsx`.

Add import after existing imports:
```tsx
import RichTextEditor from '../../components/RichTextEditor'
```

After the `summaryEn` Form.Item (line ~115) and before the `coverImageUrl` Form.Item, insert:
```tsx
<Form.Item name="detailZh" label="中文详情">
  <RichTextEditor uploadUrl="/api/admin/upload" placeholder="请输入中文详情内容..." />
</Form.Item>
<Form.Item name="detailEn" label="英文详情">
  <RichTextEditor uploadUrl="/api/admin/upload" placeholder="Enter English detail content..." />
</Form.Item>
```

- [ ] **Step 2: Build to verify**

```bash
cd /Users/wuchunlan/Desktop/project/international-medical/frontend-admin
npm run build 2>&1 | tail -20
```
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/pages/CaseManage/CaseForm.tsx
git commit -m "feat(admin): add detail zh/en rich text fields to CaseForm"
```

---

### Task 4: Add `detail_zh` / `detail_en` to `HACasesPage` (hospital admin)

**Files:**
- Modify: `frontend-admin/src/pages/HospitalAdmin/HACasesPage.tsx`

**Interfaces:**
- Consumes: `RichTextEditor` from `../../components/RichTextEditor`
- Produces: HA case form submits `detailZh` and `detailEn` to `/api/hospital-admin/cases`

- [ ] **Step 1: Update HACasesPage.tsx**

Open `frontend-admin/src/pages/HospitalAdmin/HACasesPage.tsx`.

Add import after existing imports:
```tsx
import RichTextEditor from '../../components/RichTextEditor'
```

In the inline Drawer Form, after the `summaryEn` Form.Item (line ~127) and before the `sortOrder` Form.Item, insert:
```tsx
<Form.Item name="detailZh" label="中文详情">
  <RichTextEditor uploadUrl="/api/hospital-admin/upload" placeholder="请输入中文详情内容..." />
</Form.Item>
<Form.Item name="detailEn" label="英文详情">
  <RichTextEditor uploadUrl="/api/hospital-admin/upload" placeholder="Enter English detail content..." />
</Form.Item>
```

- [ ] **Step 2: Build to verify**

```bash
cd /Users/wuchunlan/Desktop/project/international-medical/frontend-admin
npm run build 2>&1 | tail -20
```
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/pages/HospitalAdmin/HACasesPage.tsx
git commit -m "feat(admin): add detail zh/en rich text fields to HACasesPage"
```

---

### Task 5: Backend — add `GET /api/cases/{id}` endpoint

**Files:**
- Modify: `backend/src/main/java/com/intlmedical/mapper/CaseMapper.java`
- Modify: `backend/src/main/java/com/intlmedical/service/CaseService.java`
- Modify: `backend/src/main/java/com/intlmedical/controller/CaseController.java`

**Interfaces:**
- Produces: `GET /api/cases/{id}` returns `Result<CaseVO>` where `CaseVO` includes all `Case` fields plus `hospitalNameZh` / `hospitalNameEn`. Returns `Result.fail(404, "案例不存在")` if not found.

- [ ] **Step 1: Add `selectActiveById` to CaseMapper**

Open `backend/src/main/java/com/intlmedical/mapper/CaseMapper.java`.

Add after the existing `selectActiveWithHospital` method:
```java
@Select("SELECT c.*, h.name_zh AS hospital_name_zh, h.name_en AS hospital_name_en " +
        "FROM cases c LEFT JOIN hospitals h ON c.hospital_id = h.id " +
        "WHERE c.id = #{id} AND c.is_active = 1 AND c.audit_status = 'approved'")
CaseVO selectActiveById(@Param("id") Long id);
```

Also add import at top if missing: `import org.apache.ibatis.annotations.Param;`

- [ ] **Step 2: Add `getActiveById` to CaseService**

Open `backend/src/main/java/com/intlmedical/service/CaseService.java`.

Add method:
```java
public CaseVO getActiveById(Long id) {
    return caseMapper.selectActiveById(id);
}
```

- [ ] **Step 3: Add endpoint to CaseController**

Open `backend/src/main/java/com/intlmedical/controller/CaseController.java`.

Add endpoint:
```java
@GetMapping("/{id}")
public Result<CaseVO> detail(@PathVariable Long id) {
    CaseVO vo = caseService.getActiveById(id);
    if (vo == null) {
        return Result.fail(404, "案例不存在");
    }
    return Result.ok(vo);
}
```

Add import if missing: `import org.springframework.web.bind.annotation.PathVariable;`

- [ ] **Step 4: Build backend to verify**

```bash
cd /Users/wuchunlan/Desktop/project/international-medical/backend
./mvnw compile 2>&1 | tail -20
```
Expected: `BUILD SUCCESS`

- [ ] **Step 5: Commit**

```bash
git add src/main/java/com/intlmedical/mapper/CaseMapper.java \
        src/main/java/com/intlmedical/service/CaseService.java \
        src/main/java/com/intlmedical/controller/CaseController.java
git commit -m "feat(backend): add GET /api/cases/{id} endpoint"
```

---

### Task 6: frontend-site-a — add `CaseDetail` page

**Files:**
- Create: `frontend-site-a/src/pages/CaseDetail/index.tsx`
- Create: `frontend-site-a/src/pages/CaseDetail/index.less`

**Interfaces:**
- Consumes: `GET /api/cases/{id}` → `MedicalCase` (already typed in `frontend-site-a/src/types/index.ts`, includes `detailZh`, `detailEn`, `summaryZh`, `summaryEn`, `coverImageUrl`, `titleZh`, `titleEn`, `hospitalNameZh`, `hospitalNameEn`, `createdAt`)
- Produces: `CaseDetailPage` default export, rendered at route `/case/:id`

- [ ] **Step 1: Verify `MedicalCase` type has all needed fields**

Check `frontend-site-a/src/types/index.ts`. The `MedicalCase` interface already has `detailZh`, `detailEn`, `summaryZh`, `summaryEn`, `coverImageUrl`, `titleZh`, `titleEn`, `hospitalNameZh?`, `hospitalNameEn?`, `createdAt?`. No changes needed.

- [ ] **Step 2: Create index.less**

Create `frontend-site-a/src/pages/CaseDetail/index.less`:

```less
@import (reference) '../../index.less';

.case-hero {
  position: relative;
  background: @sco-navy;
  color: #fff;
  overflow: hidden;

  &__img {
    width: 100%;
    max-height: 420px;
    object-fit: cover;
    display: block;
    opacity: 0.7;
  }

  &__overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(1,28,71,0.85) 0%, rgba(1,28,71,0.3) 100%);
    display: flex;
    align-items: flex-end;
    padding: 48px;

    @media (max-width: 768px) { padding: 24px 20px; }
  }

  &__no-img {
    padding: 80px 48px 48px;
    background: linear-gradient(135deg, @sco-navy 0%, @sco-dark 100%);

    @media (max-width: 768px) { padding: 60px 20px 32px; }
  }

  &__title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 2rem;
    font-weight: 700;
    color: #fff;
    margin: 0 0 12px;
    line-height: 1.3;

    @media (max-width: 768px) { font-size: 1.4rem; }
  }

  &__summary {
    font-size: 1rem;
    color: rgba(255,255,255,0.82);
    margin: 0;
    max-width: 680px;
    line-height: 1.6;
  }
}

.case-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 12px;

  &__item {
    font-size: 0.85rem;
    color: rgba(255,255,255,0.65);
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

.case-detail-html {
  font-size: 0.95rem;
  line-height: 1.85;
  color: #374151;

  img {
    max-width: 100%;
    border-radius: 8px;
    margin: 8px 0;
  }

  p { margin-bottom: 14px; }
  h1, h2, h3 { color: @sco-navy; margin-top: 24px; }
  a { color: @sco-primary; }
}

.case-back-btn {
  margin-bottom: 24px;
}
```

- [ ] **Step 3: Create index.tsx**

Create `frontend-site-a/src/pages/CaseDetail/index.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin, Typography, Divider } from 'antd';
import { ArrowLeftOutlined, BankOutlined, CalendarOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import api from '../../api';
import Header from '../../components/Header';
import type { MedicalCase } from '../../types';
import './index.less';

const { Title, Paragraph } = Typography;

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isZh = i18n.language.startsWith('zh');

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MedicalCase | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get<MedicalCase>(`/api/cases/${id}`)
      .then(res => setData(res.data))
      .catch(() => {
        setData(null);
        setTimeout(() => navigate('/', { replace: true }), 2000);
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="page-wrapper">
        <Header />
        <main className="page-main">
          <div className="page-loading"><Spin size="large" /></div>
        </main>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page-wrapper">
        <Header />
        <main className="page-main">
          <div className="page-loading">
            <Paragraph>{t('common.not_found') || '案例不存在，即将返回首页...'}</Paragraph>
          </div>
        </main>
      </div>
    );
  }

  const title = isZh ? data.titleZh : data.titleEn;
  const summary = isZh ? data.summaryZh : data.summaryEn;
  const detail = isZh ? data.detailZh : data.detailEn;
  const hospitalName = isZh ? data.hospitalNameZh : data.hospitalNameEn;
  const createdAt = data.createdAt ? data.createdAt.slice(0, 10) : null;

  return (
    <div className="page-wrapper">
      <Header />
      <main className="page-main">

        {/* Hero */}
        {data.coverImageUrl ? (
          <div className="case-hero">
            <img className="case-hero__img" src={data.coverImageUrl} alt={title ?? ''} />
            <div className="case-hero__overlay">
              <div>
                <h1 className="case-hero__title">{title}</h1>
                {summary && <p className="case-hero__summary">{summary}</p>}
                <div className="case-meta">
                  {hospitalName && (
                    <span className="case-meta__item">
                      <BankOutlined /> {hospitalName}
                    </span>
                  )}
                  {createdAt && (
                    <span className="case-meta__item">
                      <CalendarOutlined /> {createdAt}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="case-hero__no-img">
            <h1 className="case-hero__title">{title}</h1>
            {summary && <p className="case-hero__summary">{summary}</p>}
            <div className="case-meta">
              {hospitalName && (
                <span className="case-meta__item">
                  <BankOutlined /> {hospitalName}
                </span>
              )}
              {createdAt && (
                <span className="case-meta__item">
                  <CalendarOutlined /> {createdAt}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Detail content */}
        {detail && (
          <section className="section-block">
            <div className="section-inner">
              <button
                className="case-back-btn"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0067ED', padding: 0, fontSize: '0.9rem' }}
                onClick={() => navigate(-1)}
              >
                <ArrowLeftOutlined /> {isZh ? '返回' : 'Back'}
              </button>
              <Title level={2} className="section-title">
                {isZh ? '案例详情' : 'Case Detail'}
              </Title>
              <Divider />
              <div className="case-detail-html" dangerouslySetInnerHTML={{ __html: detail }} />
            </div>
          </section>
        )}

        {/* No detail fallback */}
        {!detail && (
          <section className="section-block">
            <div className="section-inner">
              <button
                className="case-back-btn"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0067ED', padding: 0, fontSize: '0.9rem' }}
                onClick={() => navigate(-1)}
              >
                <ArrowLeftOutlined /> {isZh ? '返回' : 'Back'}
              </button>
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
```

- [ ] **Step 4: Build to verify**

```bash
cd /Users/wuchunlan/Desktop/project/international-medical/frontend-site-a
npm run build 2>&1 | tail -20
```
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/pages/CaseDetail/
git commit -m "feat(site-a): add CaseDetail page"
```

---

### Task 7: Wire up routing and card navigation in frontend-site-a

**Files:**
- Modify: `frontend-site-a/src/App.tsx`
- Modify: `frontend-site-a/src/pages/HomePage/CasesSection/index.tsx`

**Interfaces:**
- Consumes: `CaseDetailPage` default export from `./pages/CaseDetail`
- Produces: `/case/:id` route active; CaseCard "view detail" button navigates to it

- [ ] **Step 1: Add route to App.tsx**

Open `frontend-site-a/src/App.tsx`.

Add import:
```tsx
import CaseDetailPage from './pages/CaseDetail';
```

Inside `<Routes>`, after the `/product/:id` route, add:
```tsx
<Route path="/case/:id" element={<CaseDetailPage />} />
```

- [ ] **Step 2: Wire up CaseCard navigation**

Open `frontend-site-a/src/pages/HomePage/CasesSection/index.tsx`.

Add import at top:
```tsx
import { useNavigate } from 'react-router-dom';
```

In the `CaseCard` component, add inside the function body:
```tsx
const navigate = useNavigate();
```

Replace the dead button:
```tsx
// Before:
<button className="case-card__link-btn">
  {t('cases.view_detail')}
  <svg ...>...</svg>
</button>

// After:
<button className="case-card__link-btn" onClick={() => navigate(`/case/${medCase.id}`)}>
  {t('cases.view_detail')}
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
  </svg>
</button>
```

- [ ] **Step 3: Build to verify**

```bash
cd /Users/wuchunlan/Desktop/project/international-medical/frontend-site-a
npm run build 2>&1 | tail -20
```
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/pages/HomePage/CasesSection/index.tsx
git commit -m "feat(site-a): wire /case/:id route and CaseCard navigate"
```
