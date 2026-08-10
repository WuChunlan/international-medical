# frontend-site-a 包容性设计优化 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 frontend-site-a 首页各板块（HospitalsSection 及以下）应用包容性设计，提升无障碍可访问性，统一视觉节奏，不改动 header/banner/导航布局。

**Architecture:** 纯 CSS/LESS token 修改 + 最小化 TSX 属性补充。新增 4 个 LESS 设计 token（`@card-radius`/`@section-padding-y`/`@bg-alt`/`@focus-ring`），在全局 `index.less` 追加通用无障碍样式，再逐一修改各 section 的 LESS 文件，最后对 2 个 TSX 文件做最小改动。

**Tech Stack:** LESS 4.6.4, React 19, TypeScript, Vite 8

## Global Constraints

- header、banner、导航（TabSection 整体布局）一律不改
- 不引入新 npm 依赖
- `@card-radius: 10px`，`@section-padding-y: 80px`，`@bg-alt: #F4F8FF`，`@focus-ring: 0 0 0 3px rgba(0,103,237,0.45)`
- WCAG AA：正文对比度 ≥ 4.5:1，大文本 ≥ 3:1
- 触摸目标 ≥ 44×44px，最小眉标字号 0.78rem

---

### Task 1：追加全局 LESS token 与无障碍基础样式

**Files:**
- Modify: `frontend-site-a/src/index.less`

**Interfaces:**
- Produces: `@card-radius`、`@section-padding-y`、`@bg-alt`、`@focus-ring` 供后续 task 引用

- [ ] **Step 1: 在 index.less 顶部变量区末尾（第 31 行 `@cream-dark` 之后）追加 4 个 token**

```less
// ── Inclusive Design tokens ───────────────────────────────────
@card-radius:       10px;
@section-padding-y: 80px;
@bg-alt:            #F4F8FF;
@focus-ring:        0 0 0 3px rgba(0, 103, 237, 0.45);
```

- [ ] **Step 2: 在 `:root { ... }` 块结束后（约第 63 行）追加 focus-visible 全局样式**

```less
// ── Focus ring (keyboard only) ────────────────────────────────
:focus-visible {
  outline: none;
  box-shadow: @focus-ring;
}
```

- [ ] **Step 3: 修改 `.section-header__label` 字号（约第 279 行）**

将：
```less
  font-size: 0.7rem;
```
改为：
```less
  font-size: 0.78rem;
```

- [ ] **Step 4: 修改 `.carousel-side-btn`（约第 483-501 行）**

将：
```less
.carousel-side-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.22s ease;

  &--prev { left: -50px; }
  &--next { right: -50px; }

  @media (max-width: 768px) {
    opacity: 1;
    pointer-events: auto;
    &--prev { left: 4px; }
    &--next { right: 4px; }
  }
}

// Show buttons when the parent section is hovered
section:hover .carousel-side-btn {
  opacity: 1;
  pointer-events: auto;
}
```
改为：
```less
.carousel-side-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  opacity: 0.45;
  pointer-events: auto;
  transition: opacity 0.22s ease;

  &--prev { left: -50px; }
  &--next { right: -50px; }

  &:hover,
  &:focus-visible {
    opacity: 1;
  }

  @media (max-width: 768px) {
    opacity: 1;
    &--prev { left: 4px; }
    &--next { right: 4px; }
  }
}

section:hover .carousel-side-btn {
  opacity: 1;
}
```

- [ ] **Step 5: 修改 `.carousel-nav__btn` 尺寸（约第 515-517 行）**

将：
```less
    width: 40px;
    height: 40px;
```
改为：
```less
    width: 44px;
    height: 44px;
```

- [ ] **Step 6: 启动开发服务器验证，确认首页无样式错误**

```bash
cd frontend-site-a && npm run dev
```

浏览器打开首页，Tab 键导航可看到蓝色 focus 环，轮播按钮半透明可见。

---

### Task 2：HospitalsSection 样式修复

**Files:**
- Modify: `frontend-site-a/src/pages/HomePage/HospitalsSection/index.less`
- Modify: `frontend-site-a/src/pages/HomePage/HospitalsSection/index.tsx`

**Interfaces:**
- Consumes: `@card-radius`（Task 1 引入）
- Produces: hospital-card 具备 keyboard 可访问性（role/tabIndex/onKeyDown）

- [ ] **Step 1: 修改 index.less — border-radius 和 overlay 文字**

将 `.hospital-card` 的 `border-radius: 12px` 改为 `border-radius: @card-radius`：
```less
.hospital-card {
  position: relative;
  border-radius: @card-radius;
```

将 `&__intro` 的 font-size 和 color：
```less
  &__intro {
    font-size: 0.88rem;
    color: rgba(255, 255, 255, 0.92);
```

将 `&__link` 的 font-size：
```less
  &__link {
    ...
    font-size: 0.88rem;
```

- [ ] **Step 2: 修改 HospitalsSection/index.tsx — HospitalCard 键盘可访问性**

将 `HospitalCard` 函数中的 `<div className="hospital-card" ...>` 改为：

```tsx
<div
  className="hospital-card"
  role="button"
  tabIndex={0}
  style={{ animationDelay: `${delay}ms` }}
  onClick={() => navigate(`/hospital/${hospital.id}`)}
  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/hospital/${hospital.id}`); }}
>
```

- [ ] **Step 3: 验证**

浏览器中 Tab 键导航到医院卡片，可看到 focus 环；按 Enter 可跳转详情页。

---

### Task 3：EquipmentSection 样式

**Files:**
- Modify: `frontend-site-a/src/pages/HomePage/EquipmentSection/index.less`

**Interfaces:**
- Consumes: `@card-radius`、`@section-padding-y`、`@bg-alt`

- [ ] **Step 1: 修改 `.equipment-section` 背景和 padding**

将：
```less
.equipment-section {
  background: #EFF6FF;
  padding: 100px 0;
```
改为：
```less
.equipment-section {
  background: @bg-alt;
  padding: @section-padding-y 0;
```

- [ ] **Step 2: 修改 `.equip-card` border-radius 并追加 hover 增强**

将 `border-radius: 0` 改为 `border-radius: @card-radius`：
```less
.equip-card {
  background: #ffffff;
  border: 1px solid #DAEDfd;
  border-radius: @card-radius;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
```

现有 `&:hover` 保留，但将 `transition: all 0.35s ease` 替换为上方新 transition（已在上一行做了）。

---

### Task 4：DoctorsSection 样式

**Files:**
- Modify: `frontend-site-a/src/pages/HomePage/DoctorsSection/index.less`

**Interfaces:**
- Consumes: `@card-radius`、`@section-padding-y`

- [ ] **Step 1: 修改 `.doctors-section` 背景和 padding**

将：
```less
.doctors-section {
  background: #EFF6FF;
  padding: 100px 0;
```
改为：
```less
.doctors-section {
  background: #ffffff;
  padding: @section-padding-y 0;
```

- [ ] **Step 2: 修改 `.dc-card` border-radius 和 book-btn min-height**

将 `border-radius: 0` 改为 `border-radius: @card-radius`：
```less
.dc-card {
  background: #fff;
  border-radius: @card-radius;
```

在 `.dc-card__book-btn` 中追加：
```less
  &__book-btn {
    margin-top: auto;
    width: 100%;
    min-height: 44px;
    padding: 10px 0;
```

---

### Task 5：ServiceFeaturesSection 样式

**Files:**
- Modify: `frontend-site-a/src/pages/HomePage/ServiceFeaturesSection/index.less`

**Interfaces:**
- Consumes: `@card-radius`、`@section-padding-y`、`@bg-alt`

- [ ] **Step 1: 修改 `.service-features-section` 背景和 padding**

将：
```less
.service-features-section {
  background: #EFF6FF;
  padding: 100px 0;
```
改为：
```less
.service-features-section {
  background: @bg-alt;
  padding: @section-padding-y 0;
```

- [ ] **Step 2: 修改 `.sf-card` border-radius**

将 `border-radius: 0` 改为 `border-radius: @card-radius`：
```less
.sf-card {
  background: #ffffff;
  border: 1px solid #DAEDfd;
  border-radius: @card-radius;
```

---

### Task 6：CasesSection 样式 + TSX 修复

**Files:**
- Modify: `frontend-site-a/src/pages/HomePage/CasesSection/index.less`
- Modify: `frontend-site-a/src/pages/HomePage/CasesSection/index.tsx`

**Interfaces:**
- Consumes: `@card-radius`、`@section-padding-y`

- [ ] **Step 1: 修改 `.cases-section` 背景和 padding**

将：
```less
.cases-section {
  background: #EFF6FF;
  padding: 100px 0;
```
改为：
```less
.cases-section {
  background: #ffffff;
  padding: @section-padding-y 0;
```

- [ ] **Step 2: 修改 `.case-card` border-radius 和 link-btn min-height**

将 `border-radius: 0` 改为 `border-radius: @card-radius`。

在 `&__link-btn` 中追加：
```less
  &__link-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    min-width: 44px;
```

- [ ] **Step 3: 修改 CasesSection/index.tsx — 轮播按钮改用 --dark 变体**

将第 62 行：
```tsx
<button className="carousel-nav__btn carousel-nav__btn--light carousel-side-btn carousel-side-btn--prev" ...>
```
改为：
```tsx
<button className="carousel-nav__btn carousel-nav__btn--dark carousel-side-btn carousel-side-btn--prev" ...>
```

将第 72 行：
```tsx
<button className="carousel-nav__btn carousel-nav__btn--light carousel-side-btn carousel-side-btn--next" ...>
```
改为：
```tsx
<button className="carousel-nav__btn carousel-nav__btn--dark carousel-side-btn carousel-side-btn--next" ...>
```

同样将第 81 行 dot 的 `--light` 改为 `--dark`：
```tsx
className={`carousel-nav__dot carousel-nav__dot--dark${i === index ? ' carousel-nav__dot--active' : ''}`}
```

---

### Task 7：ServiceTeamsSection 样式

**Files:**
- Modify: `frontend-site-a/src/pages/HomePage/ServiceTeamsSection/index.less`

**Interfaces:**
- Consumes: `@card-radius`、`@section-padding-y`、`@bg-alt`

- [ ] **Step 1: 修改 `.service-teams-section` 背景和 padding**

将：
```less
.service-teams-section {
  background: #ffffff;
  padding: 100px 0;
```
改为：
```less
.service-teams-section {
  background: @bg-alt;
  padding: @section-padding-y 0;
```

- [ ] **Step 2: 修改 `.team-card` border-radius**

将 `border-radius: 0` 改为 `border-radius: @card-radius`：
```less
.team-card {
  background: #ffffff;
  border: 1px solid #DAEDfd;
  border-radius: @card-radius;
```

---

### Task 8：ProductsSection 样式

**Files:**
- Modify: `frontend-site-a/src/pages/HomePage/ProductsSection/index.less`

**Interfaces:**
- Consumes: `@card-radius`、`@section-padding-y`

- [ ] **Step 1: 修改 `.products-section` padding**

将：
```less
.products-section {
  background: #ffffff;
  padding: 100px 0;
```
改为：
```less
.products-section {
  background: #ffffff;
  padding: @section-padding-y 0;
```

- [ ] **Step 2: 修改 `.product-card` border-radius**

将 `border-radius: 0` 改为 `border-radius: @card-radius`：
```less
.product-card {
  background: #ffffff;
  border: 1px solid #DAEDfd;
  border-radius: @card-radius;
```

---

### Task 9：TabSection 眉标字号

**Files:**
- Modify: `frontend-site-a/src/pages/HomePage/TabSection/index.less`

- [ ] **Step 1: 修改 `.tab-tag` 字号（第 78 行）**

将：
```less
  font-size: 0.68rem;
```
改为：
```less
  font-size: 0.78rem;
```

---

### Task 10：构建验证

**Files:**
- 无新增/修改文件

- [ ] **Step 1: TypeScript 类型检查**

```bash
cd frontend-site-a && npx tsc --noEmit
```
期望：0 错误。

- [ ] **Step 2: 生产构建**

```bash
npm run build
```
期望：构建成功，无 LESS 编译错误。

- [ ] **Step 3: 浏览器目视检查清单**

启动 `npm run dev`，依次检查：
- [ ] HospitalsSection：Tab 到卡片有 focus 环，Enter 可跳转
- [ ] 各 section 交替背景（白/F4F8FF/白/F4F8FF/白/F4F8FF/白）正确
- [ ] 所有卡片有 10px 圆角
- [ ] 轮播侧边按钮半透明可见（不需要 hover 才出现）
- [ ] 轮播导航按钮 44×44px，点击区域足够
- [ ] DoctorsSection 预约按钮高度 ≥ 44px
- [ ] CasesSection 轮播按钮颜色正确（深色，非白色）
- [ ] TabSection 眉标字号可读

- [ ] **Step 4: git commit**

```bash
git add frontend-site-a/src/index.less \
  frontend-site-a/src/pages/HomePage/HospitalsSection/ \
  frontend-site-a/src/pages/HomePage/EquipmentSection/index.less \
  frontend-site-a/src/pages/HomePage/DoctorsSection/index.less \
  frontend-site-a/src/pages/HomePage/ServiceFeaturesSection/index.less \
  frontend-site-a/src/pages/HomePage/CasesSection/ \
  frontend-site-a/src/pages/HomePage/ServiceTeamsSection/index.less \
  frontend-site-a/src/pages/HomePage/ProductsSection/index.less \
  frontend-site-a/src/pages/HomePage/TabSection/index.less
git commit -m "feat(site-a): apply inclusive design — card radius, section rhythm, a11y fixes"
```
