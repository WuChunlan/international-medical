# Case Rich Text Editor & Detail Page Design

**Date:** 2026-07-29  
**Scope:** frontend-admin (CaseForm + HACasesPage), backend (CaseController), frontend-site-a (CaseDetail page)

---

## Background

The `cases` table has `detail_zh` and `detail_en` (longtext) fields that are not yet exposed in any admin form. Hospital admins (HA role) upload cases that go through the audit flow; super admins create cases directly. The site-a homepage shows case cards with a non-functional "view detail" button.

This spec covers:
1. A reusable `RichTextEditor` component using wangEditor
2. Adding rich text detail fields to both admin case forms
3. A backend `GET /api/cases/{id}` endpoint
4. A new `CaseDetail` page on frontend-site-a

---

## 1. Shared Component: `RichTextEditor`

**File:** `frontend-admin/src/components/RichTextEditor.tsx`

- Wraps `@wangeditor/editor-for-react` and `@wangeditor/editor`
- Props: `value?: string`, `onChange?: (html: string) => void`, `uploadUrl?: string` (defaults to `/api/admin/upload`), `placeholder?: string`, `height?: number` (defaults to 400)
- Compatible with Antd `Form.Item` (controlled component pattern)
- Image upload: custom `uploadImgServer` config pointing to `uploadUrl` with `fieldName: 'file'` and `customInsert` to extract the URL from the response (response format is a plain string URL, same as `ImageUpload.tsx`)
- On unmount, calls `editor.destroy()` to prevent memory leaks
- Outputs HTML string stored directly into `detail_zh` / `detail_en`

---

## 2. frontend-admin: CaseForm Updates

**File:** `frontend-admin/src/pages/CaseManage/CaseForm.tsx`

Changes:
- Install `@wangeditor/editor` and `@wangeditor/editor-for-react` in frontend-admin
- Import `RichTextEditor`
- After the `summaryEn` field, add:
  - `Form.Item name="detailZh" label="中文详情"` → `<RichTextEditor uploadUrl="/api/admin/upload" />`
  - `Form.Item name="detailEn" label="英文详情"` → `<RichTextEditor uploadUrl="/api/admin/upload" />`
- Drawer width stays at 720; the editor's default toolbar fits within this width

---

## 3. frontend-admin: HACasesPage Updates

**File:** `frontend-admin/src/pages/HospitalAdmin/HACasesPage.tsx`

Changes:
- Import `RichTextEditor`
- In the inline Drawer Form, after `summaryEn`, add:
  - `Form.Item name="detailZh" label="中文详情"` → `<RichTextEditor uploadUrl="/api/hospital-admin/upload" />`
  - `Form.Item name="detailEn" label="英文详情"` → `<RichTextEditor uploadUrl="/api/hospital-admin/upload" />`
- The `openDrawer` handler already calls `form.setFieldsValue(record)`, which will correctly populate the rich text fields on edit

---

## 4. Backend: New Detail Endpoint

**File:** `backend/src/main/java/com/intlmedical/controller/CaseController.java`

Add:
```java
@GetMapping("/{id}")
public Result<CaseVO> detail(@PathVariable Long id) {
    return Result.ok(caseService.getActiveById(id));
}
```
Returns 404-style (null body with error message) if not found or not active/approved.

**File:** `backend/src/main/java/com/intlmedical/service/CaseService.java`

Add `getActiveById(Long id)` calling a new mapper method.

**File:** `backend/src/main/java/com/intlmedical/mapper/CaseMapper.java`

Add:
```java
@Select("SELECT c.*, h.name_zh AS hospital_name_zh, h.name_en AS hospital_name_en " +
        "FROM cases c LEFT JOIN hospitals h ON c.hospital_id = h.id " +
        "WHERE c.id = #{id} AND c.is_active = 1 AND c.audit_status = 'approved'")
CaseVO selectActiveById(@Param("id") Long id);
```

---

## 5. frontend-site-a: CaseDetail Page

**File:** `frontend-site-a/src/pages/CaseDetail/index.tsx`

Style: follows `ProductDetail` (light background, Antd Typography, `dangerouslySetInnerHTML` for rich text).

Layout:
1. `<Header />`
2. Hero section: cover image (full-width, max-height 420px, object-fit cover) with title overlay, or title + summary stacked if no cover image
3. Meta row: hospital name (if present), created date
4. Detail section: `<div dangerouslySetInnerHTML={{ __html: detail }} />` with a `.case-detail-html` class for scoped image styles (`max-width: 100%`, `border-radius: 8px`)
5. Language toggle: reads `i18n.language`, switches between `titleZh/En`, `summaryZh/En`, `detailZh/En`
6. Back button: `navigate(-1)` or navigate to `/#cases`
7. Loading state: `<Spin size="large" />` centered
8. Not found / inactive: message + redirect to home after 2s

**File:** `frontend-site-a/src/pages/CaseDetail/index.less`  
Scoped styles for `.case-detail-html img` (max-width, border-radius) and hero section.

---

## 6. frontend-site-a: Routing & Card Link

**File:** `frontend-site-a/src/App.tsx`

Add:
```tsx
import CaseDetailPage from './pages/CaseDetail';
// ...
<Route path="/case/:id" element={<CaseDetailPage />} />
```

**File:** `frontend-site-a/src/pages/HomePage/CasesSection/index.tsx`

In `CaseCard`, replace the dead `<button>` with:
```tsx
import { useNavigate } from 'react-router-dom';
// ...
<button className="case-card__link-btn" onClick={() => navigate(`/case/${medCase.id}`)}>
  {t('cases.view_detail')} <ArrowIcon />
</button>
```

---

## Files Changed Summary

| File | Change |
|------|--------|
| `frontend-admin/src/components/RichTextEditor.tsx` | New |
| `frontend-admin/src/pages/CaseManage/CaseForm.tsx` | Add detail_zh/en RichTextEditor fields |
| `frontend-admin/src/pages/HospitalAdmin/HACasesPage.tsx` | Add detail_zh/en RichTextEditor fields |
| `backend/.../controller/CaseController.java` | Add GET /{id} endpoint |
| `backend/.../service/CaseService.java` | Add getActiveById method |
| `backend/.../mapper/CaseMapper.java` | Add selectActiveById query |
| `frontend-site-a/src/pages/CaseDetail/index.tsx` | New |
| `frontend-site-a/src/pages/CaseDetail/index.less` | New |
| `frontend-site-a/src/App.tsx` | Add /case/:id route |
| `frontend-site-a/src/pages/HomePage/CasesSection/index.tsx` | Wire up navigate on card button |

---

## Dependencies to Install

- `frontend-admin`: `@wangeditor/editor@^5`, `@wangeditor/editor-for-react@^1`
- `frontend-site-a`: no new dependencies (rich text rendered via `dangerouslySetInnerHTML`)
