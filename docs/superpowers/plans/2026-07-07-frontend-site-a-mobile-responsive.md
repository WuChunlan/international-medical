# frontend-site-a 手机端响应式适配 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 frontend-site-a 首页及全局组件写一套手机端/平板端响应式样式，观感良好、配色与板块沿用现状、数据与 PC 端一致，且 PC 端渲染零变化。

**Architecture:** 集中式响应式层——新建 `src/responsive.less` 承载全部 `@media` 覆盖规则，在 `index.less` 末尾 import。轮播的「每屏 1 张大卡横滑」通过增强 `useCarousel`（手机端 perPage=全部条数，连锁关闭箭头/圆点/自动播放）+ CSS flex scroll-snap 达成，不改任何 section 的 TSX。

**Tech Stack:** React 19 + TypeScript + Vite + LESS。无测试框架（无 test 脚本），验证方式为 `npm run build`（tsc + vite）+ 各断点目视检查。

## Global Constraints

- PC 端（≥1024px）渲染结果必须与改动前逐板块一致；所有手机端样式包裹在 `@media (max-width: …)` 内。
- 不引入任何新 npm 依赖。
- 沿用现有配色 token（`@sco-navy` #013489 / `@sco-primary` #0067ED / `@sco-cyan` #25F1FF 等），不新增颜色。
- 触摸目标 ≥ 44×44px；正文字号 ≥ 0.875rem（14px）；眉标/badge ≥ 0.78rem。
- 断点：`@bp-laptop: 1024px` / `@bp-tablet: 768px` / `@bp-mobile: 480px`。
- 保留现有无障碍属性（focus-visible / role / tabIndex / aria-label）。
- 工作目录：`frontend-site-a/`；构建命令 `npm run build`。

---

## File Structure

**新增：**
- `frontend-site-a/src/responsive.less` — 集中式手机端响应式层，按板块分区。

**修改：**
- `frontend-site-a/src/index.less` — 顶部加断点变量；末尾 `@import './responsive.less'`。
- `frontend-site-a/src/hooks/useCarousel.ts` — 加 matchMedia 手机端检测，手机端 perPage=total。
- `frontend-site-a/src/pages/HomePage/index.less` — 手机端顶部间距/锚点偏移修复（就近放本文件 @media）。

**不改动任何 section 的 `.tsx`**，也不改 `Header.tsx`（已含汉堡菜单）。

---

## Task 1: 断点变量 + 响应式层骨架接入

**Files:**
- Modify: `frontend-site-a/src/index.less`（顶部 token 区 + 文件末尾）
- Create: `frontend-site-a/src/responsive.less`

**Interfaces:**
- Produces: LESS 变量 `@bp-laptop`/`@bp-tablet`/`@bp-mobile`（供 responsive.less 引用）；文件 `responsive.less` 被 index.less 编译进最终 CSS。

- [ ] **Step 1: 在 index.less 新增断点变量**

在 `frontend-site-a/src/index.less` 的 Inclusive Design tokens 区块（第 32-36 行 `@focus-ring` 之后）追加：

```less
// ── Responsive breakpoints ────────────────────────────────────
@bp-laptop: 1024px;   // 小笔记本 / 大平板
@bp-tablet: 768px;    // 平板 / 大屏手机（与 Header 汉堡断点一致）
@bp-mobile: 480px;    // 手机
```

- [ ] **Step 2: 创建 responsive.less 骨架**

创建 `frontend-site-a/src/responsive.less`，内容为分区注释骨架（后续任务逐块填充）：

```less
// ============================================================
// Site-A Mobile Responsive Layer
// 所有手机端/平板端覆盖集中于此，import 于 index.less 末尾。
// 断点变量来自 index.less：@bp-tablet(768) / @bp-mobile(480)。
// ============================================================

// ── 1. Banner + Stats (ScoSection) ──────────────────────────

// ── 2. TabSection ───────────────────────────────────────────

// ── 3. 内容区轮播 → 每屏 1 张大卡横滑 ────────────────────────

// ── 4. 卡片内部收缩 ─────────────────────────────────────────

// ── 5. Footer ───────────────────────────────────────────────

// ── 6. 通用工具 ─────────────────────────────────────────────
```

- [ ] **Step 3: 在 index.less 末尾 import**

在 `frontend-site-a/src/index.less` 最后一行（`.send-code-btn { … }` 块之后）追加：

```less
// ============================================================
// Mobile Responsive Layer (must be last so its @media overrides win)
// ============================================================
@import './responsive.less';
```

- [ ] **Step 4: 构建验证**

Run: `cd frontend-site-a && npm run build`
Expected: 构建成功，无 LESS 编译错误（空 @media 区块合法）。

- [ ] **Step 5: Commit**

```bash
git add frontend-site-a/src/index.less frontend-site-a/src/responsive.less
git commit -m "feat(site-a): add breakpoint tokens + responsive layer scaffold

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: useCarousel 手机端增强（横滑基础）

**Files:**
- Modify: `frontend-site-a/src/hooks/useCarousel.ts`

**Interfaces:**
- Consumes: 无（基础 hook）。
- Produces: `useCarousel` 手机端（≤768px）返回 `hasMultiple=false`、`pages=1`、`visible=全部索引`；桌面端行为不变。各 section 已依赖的返回字段（`visible`/`prev`/`next`/`hasMultiple`/`index`/`pages`）签名不变。

- [ ] **Step 1: 在 useCarousel 内加手机端检测**

替换 `frontend-site-a/src/hooks/useCarousel.ts` 全部内容为：

```ts
import { useState, useEffect, useRef, useCallback } from 'react';

const MOBILE_QUERY = '(max-width: 768px)';

export function useCarousel(total: number, perPage = 3, interval = 4000) {
  // 手机端：一次性展示全部卡片（横滑），关闭分页/自动轮播
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia(MOBILE_QUERY);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  const effectivePerPage = isMobile ? Math.max(total, 1) : perPage;
  const totalPages = total <= effectivePerPage ? 1 : Math.ceil(total / effectivePerPage);
  const [page, setPage] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const start = useCallback(() => {
    stop();
    if (totalPages <= 1) return;
    timerRef.current = setInterval(() => {
      setPage(p => (p + 1) % totalPages);
    }, interval);
  }, [totalPages, interval, stop]);

  useEffect(() => {
    start();
    return stop;
  }, [start, stop]);

  // Reset to page 0 when total changes (e.g. data loads) or viewport crosses breakpoint
  useEffect(() => { setPage(0); }, [total, isMobile]);

  const prev = useCallback(() => {
    setPage(p => (p - 1 + totalPages) % totalPages);
    start();
  }, [totalPages, start]);

  const next = useCallback(() => {
    setPage(p => (p + 1) % totalPages);
    start();
  }, [totalPages, start]);

  const startIdx = page * effectivePerPage;
  const visible = total === 0
    ? []
    : Array.from({ length: Math.min(effectivePerPage, total - startIdx) }, (_, k) => startIdx + k);

  return {
    index: page,
    visible,
    prev,
    next,
    hasMultiple: totalPages > 1,
    pages: totalPages,
  };
}
```

- [ ] **Step 2: 构建验证**

Run: `cd frontend-site-a && npm run build`
Expected: 构建成功，无 TS 类型错误。

- [ ] **Step 3: 桌面端行为目视验证**

Run: `cd frontend-site-a && npm run dev`（浏览器 ≥1024px 宽度打开首页）
Expected: 各轮播板块仍每页 3 张卡 + 圆点 + 两侧箭头 + 自动轮播，与改动前一致。

- [ ] **Step 4: Commit**

```bash
git add frontend-site-a/src/hooks/useCarousel.ts
git commit -m "feat(site-a): useCarousel shows all cards on mobile (<=768px)

Mobile viewport sets perPage=total, so totalPages=1: arrows/dots
(gated on hasMultiple) auto-hide and autoplay stops. Desktop unchanged.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: 内容区横滑 CSS（cards-grid + 卡片宽度）

**Files:**
- Modify: `frontend-site-a/src/responsive.less`（第 3 区块「内容区轮播」）

**Interfaces:**
- Consumes: Task 2 手机端 `visible=全部索引`（卡片全部渲染）；卡片根 class：`.hospital-card` / `.equip-card` / `.dc-card` / `.sf-card` / `.case-card` / `.product-card` / `.team-card`；grid class：`.cards-grid` 及 `.cards-grid--teams-1/2/3`。
- Produces: 手机端 `.cards-grid` 变横向 scroll-snap 容器，每卡占屏宽 ~85%。

- [ ] **Step 1: 填充横滑 CSS**

在 `frontend-site-a/src/responsive.less` 的「── 3. 内容区轮播」区块下填入：

```less
@media (max-width: @bp-tablet) {
  // 横向 scroll-snap 容器（覆盖 grid 及 teams 专用 grid）
  .cards-grid,
  .cards-grid--teams-1,
  .cards-grid--teams-2,
  .cards-grid--teams-3 {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    grid-template-columns: none;   // 抵消原 grid 列定义
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    gap: 14px;
    padding-bottom: 8px;
    scroll-padding: 0 16px;
    justify-content: flex-start;   // 覆盖 teams 的 center
    scrollbar-width: none;
    &::-webkit-scrollbar { display: none; }
  }

  // 每张卡：占屏宽 ~85%，露出下一张边缘
  .hospital-card,
  .equip-card,
  .dc-card,
  .sf-card,
  .case-card,
  .product-card,
  .team-card {
    flex: 0 0 85%;
    scroll-snap-align: center;
  }

  // 兜底：即便渲染也不显示侧边箭头
  .carousel-side-btn { display: none; }
}
```

- [ ] **Step 2: 构建验证**

Run: `cd frontend-site-a && npm run build`
Expected: 构建成功。

- [ ] **Step 3: 手机端目视验证**

Run: `npm run dev`；浏览器 DevTools 切 375px 宽，首页各轮播板块（医院/设备/医生/服务特色/案例/产品/服务团队）：
Expected: 每屏 1 张大卡（~85% 宽），右侧露出下一张边缘；可左右横滑并吸附；无圆点/箭头；无自动轮播跳动。

- [ ] **Step 4: Commit**

```bash
git add frontend-site-a/src/responsive.less
git commit -m "feat(site-a): mobile single-card horizontal scroll carousel

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: 卡片内部收缩 + section 间距 + 通用工具

**Files:**
- Modify: `frontend-site-a/src/responsive.less`（第 4、6 区块）

**Interfaces:**
- Consumes: 卡片封面 class `&__cover`（equip/case/product/team 为 220px；hospital 为 overlay 固定 400px；doctor 无封面）。
- Produces: 手机端卡片封面/内边距收缩、section 上下留白收紧、容器内边距收窄。

- [ ] **Step 1: 填充卡片内部收缩 CSS**

在 `frontend-site-a/src/responsive.less` 的「── 4. 卡片内部收缩」区块下填入：

```less
@media (max-width: @bp-tablet) {
  // 有封面的卡片：封面高度收缩 220 -> 180
  .equip-card__cover,
  .sf-card__cover,
  .case-card__cover,
  .product-card__cover,
  .team-card__cover,
  .cards-grid--teams-1 .team-card__cover,
  .cards-grid--teams-2 .team-card__cover {
    height: 180px;
  }

  // overlay 型医院卡：整卡高度 400 -> 300
  .hospital-card { height: 300px; }

  // 卡片内容内边距收紧 24px 28px -> 16px 18px
  .equip-card__content,
  .dc-card,
  .sf-card__content,
  .case-card__content,
  .product-card__content,
  .team-card__content,
  .cards-grid--teams-1 .team-card__content,
  .cards-grid--teams-2 .team-card__content {
    padding: 16px 18px 18px;
  }

  .hospital-card__overlay { padding: 0 18px 18px; }
}

@media (max-width: @bp-mobile) {
  .equip-card__cover,
  .sf-card__cover,
  .case-card__cover,
  .product-card__cover,
  .team-card__cover {
    height: 160px;
  }
  .hospital-card { height: 280px; }
}
```

- [ ] **Step 2: 填充通用工具 CSS**

在「── 6. 通用工具」区块下填入：

```less
@media (max-width: @bp-tablet) {
  // 容器内边距 0 20px -> 0 16px
  .section-container,
  .section-inner { padding: 0 16px; }

  // section 上下留白收紧（各 section 用 @section-padding-y=80 或硬编码 100）
  .hospitals-section,
  .equipment-section,
  .doctors-section,
  .service-features-section,
  .cases-section,
  .products-section,
  .service-teams-section {
    padding-top: 48px;
    padding-bottom: 48px;
  }

  // section header 下间距 64 -> 40
  .section-header { margin-bottom: 40px; }
}
```

- [ ] **Step 3: 构建验证**

Run: `cd frontend-site-a && npm run build`
Expected: 构建成功。

- [ ] **Step 4: 手机端目视验证**

375px 宽下：Expected: 卡片封面变矮（约 180px）、内边距收紧、section 间距更紧凑、左右留白 16px；文字未被裁切成 <14px。

- [ ] **Step 5: Commit**

```bash
git add frontend-site-a/src/responsive.less
git commit -m "feat(site-a): mobile card shrink + section spacing + container padding

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Banner + 统计条（ScoSection）

**Files:**
- Modify: `frontend-site-a/src/responsive.less`（第 1 区块）

**Interfaces:**
- Consumes: class `.sco-banner__ratio` / `.sco-banner__arrow`(--prev/--next) / `.sco-stats__inner` / `.sco-stat-item`。
- Produces: 手机端 banner 变矮、箭头 44px、统计条 2×2 网格。

- [ ] **Step 1: 填充 Banner + Stats CSS**

在 `frontend-site-a/src/responsive.less` 的「── 1. Banner + Stats」区块下填入：

```less
@media (max-width: @bp-tablet) {
  .sco-banner__ratio { min-height: 200px; }

  .sco-banner__arrow {
    width: 44px;
    height: 44px;
    font-size: 20px;
    &--prev { left: 8px; }
    &--next { right: 8px; }
  }

  // 统计条：一行 flex -> 2x2 网格
  .sco-stats__inner {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    padding: 0 16px;
  }

  .sco-stat-item {
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    padding: 16px 12px;

    // 每行左侧单元加右分隔线（第 1、3 项）
    &:nth-child(odd) { border-right: 1px solid rgba(255, 255, 255, 0.12); }
    // 最后一行去掉底边
    &:nth-last-child(-n + 2) { border-bottom: none; }
  }
}

@media (max-width: @bp-mobile) {
  .sco-banner__ratio { min-height: 180px; }
}
```

- [ ] **Step 2: 构建验证**

Run: `cd frontend-site-a && npm run build`
Expected: 构建成功。

- [ ] **Step 3: 目视验证**

375px 宽下 banner 区：Expected: banner 不过矮（≥180px）、箭头 44px 贴边不遮内容；统计条呈 2×2、有细分隔线、数值清晰。

- [ ] **Step 4: Commit**

```bash
git add frontend-site-a/src/responsive.less
git commit -m "feat(site-a): mobile banner shrink + 2x2 stats grid

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: TabSection 双卡竖排

**Files:**
- Modify: `frontend-site-a/src/responsive.less`（第 2 区块）

**Interfaces:**
- Consumes: class `.tab-section__inner` / `.tab-card-divider` / `.tab-card-inner` / `.tab-icon-wrap`。
- Produces: 手机端两张 tab 卡上下堆叠、横分割线、内边距收紧。

- [ ] **Step 1: 填充 TabSection CSS**

在 `frontend-site-a/src/responsive.less` 的「── 2. TabSection」区块下填入：

```less
@media (max-width: @bp-tablet) {
  .tab-section__inner { flex-direction: column; }

  // 竖分割线 -> 横分割线
  .tab-card-divider {
    width: 100%;
    height: 1px;
  }

  .tab-card-inner {
    padding: 16px;
    gap: 14px;
  }

  .tab-icon-wrap {
    width: 48px;
    height: 48px;
  }
}
```

- [ ] **Step 2: 构建验证**

Run: `cd frontend-site-a && npm run build`
Expected: 构建成功。

- [ ] **Step 3: 目视验证**

375px 宽下 TabSection：Expected: 两张卡片上下堆叠、中间横线分隔；点击切换 tab 正常，专业/特需内容区随之切换（数据不变）。

- [ ] **Step 4: Commit**

```bash
git add frontend-site-a/src/responsive.less
git commit -m "feat(site-a): mobile stacked tab cards

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: Header 高度修复 + 首页顶部间距

**Files:**
- Modify: `frontend-site-a/src/responsive.less`（第 6 区块补充 Header）
- Modify: `frontend-site-a/src/pages/HomePage/index.less`

**Interfaces:**
- Consumes: class `.site-a-header__inner` / `__logo-img` / `__logo-text` / `__mobile-btn` / `__mobile-menu`；`.home-page`；锚点 section class。
- Produces: 手机端 header 高度 64px、`.home-page` padding-top 与 scroll-margin-top 同步为 64px（消除顶部空白、锚点跳转对齐）。

- [ ] **Step 1: 在 responsive.less 补充 Header 覆盖**

在 `frontend-site-a/src/responsive.less` 「── 6. 通用工具」区块末尾追加：

```less
// ── Header (mobile height fix) ──────────────────────────────
@media (max-width: @bp-tablet) {
  .site-a-header__inner {
    height: 64px;
    padding: 0 16px;
  }
  .site-a-header__logo-img { height: 44px; }
  .site-a-header__logo-text { font-size: 18px; }

  .site-a-header__mobile-btn {
    min-width: 44px;
    min-height: 44px;
    padding: 10px;
  }

  .site-a-header__mobile-menu {
    max-height: calc(100vh - 64px);
    overflow-y: auto;
  }
}
```

- [ ] **Step 2: 修复 HomePage 顶部间距与锚点偏移**

替换 `frontend-site-a/src/pages/HomePage/index.less` 全部内容为：

```less
.home-page {
  padding-top: 189px; // topbar 80px + nav row 109px = 189px
}

// Offset fixed header (189px) so scrollIntoView lands at the right position
.hospitals-section,
.equipment-section,
.doctors-section,
.service-features-section,
.cases-section,
.products-section {
  scroll-margin-top: 189px;
}

// ── Mobile: topbar hidden + nav row 64px ──────────────────────
@media (max-width: 768px) {
  .home-page {
    padding-top: 64px;
  }
  .hospitals-section,
  .equipment-section,
  .doctors-section,
  .service-features-section,
  .cases-section,
  .products-section {
    scroll-margin-top: 64px;
  }
}
```

- [ ] **Step 3: 构建验证**

Run: `cd frontend-site-a && npm run build`
Expected: 构建成功。

- [ ] **Step 4: 目视验证**

375px 宽下：Expected: header 约 64px 高、logo 缩小、汉堡按钮易点；首页顶部无大片空白；点汉堡菜单里的导航项，页面平滑滚动且目标板块顶部对齐（不被 header 遮挡）。

- [ ] **Step 5: Commit**

```bash
git add frontend-site-a/src/responsive.less frontend-site-a/src/pages/HomePage/index.less
git commit -m "feat(site-a): mobile header height fix + homepage top offset

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 8: Footer 手机端堆叠

**Files:**
- Modify: `frontend-site-a/src/responsive.less`（第 5 区块）

**Interfaces:**
- Consumes: class `.site-footer` / `__inner` / `__top` / `.footer-contact-modal`。
- Produces: 手机端 footer 竖向居中堆叠、内边距收紧、弹窗内边距收紧。

- [ ] **Step 1: 填充 Footer CSS**

在 `frontend-site-a/src/responsive.less` 的「── 5. Footer」区块下填入：

```less
@media (max-width: @bp-tablet) {
  .site-footer { padding: 40px 0 28px; }
  .site-footer__inner { padding: 0 16px; }

  .site-footer__top {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
}

@media (max-width: @bp-mobile) {
  .footer-contact-modal { padding: 32px 20px 28px; }
}
```

- [ ] **Step 2: 构建验证**

Run: `cd frontend-site-a && npm run build`
Expected: 构建成功。

- [ ] **Step 3: 目视验证**

375px 宽下页脚：Expected: logo / tagline / 联系 CTA 竖向居中堆叠；点 CTA 弹出联系弹窗，弹窗不溢出屏幕、内边距合适。

- [ ] **Step 4: Commit**

```bash
git add frontend-site-a/src/responsive.less
git commit -m "feat(site-a): mobile footer stacked layout

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 9: 全断点回归验收

**Files:** 无代码改动（纯验收；如发现问题回到对应 Task 修复）。

- [ ] **Step 1: 构建**

Run: `cd frontend-site-a && npm run build`
Expected: 构建成功。

- [ ] **Step 2: PC 端回归（≥1024px）**

`npm run dev`，浏览器 1280px 宽逐屏对比：
Expected: Header 双行 / Banner / 统计条一行 / Tab 双卡并排 / 各轮播板块 3 卡+圆点+箭头+自动轮播 / Footer 横向布局——全部与改动前一致。

- [ ] **Step 3: 手机端逐档检查**

DevTools 依次 375px（iPhone SE/14）、390px、768px（iPad）：
Expected（每档）：
- 无横向溢出滚动条。
- Header 64px + 汉堡菜单可用、无顶部空白、锚点跳转对齐。
- Banner ≥180px 不过矮；统计条 2×2。
- Tab 双卡竖排、切换正常。
- 7 个轮播板块均每屏 1 张大卡、可横滑、露下一张边缘、无箭头/圆点。
- 卡片文字未裁切成 <14px。
- Footer 居中堆叠、联系弹窗不溢出。

- [ ] **Step 4: 触摸目标抽查**

Expected: 汉堡按钮、banner 箭头、卡片内链接/按钮点击区 ≥ 44px。

- [ ] **Step 5: 若全部通过，最终提交（如有微调）**

```bash
git add -A
git commit -m "chore(site-a): mobile responsive final regression tweaks

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

（若 Step 2-4 无需改动，跳过本步。）

---

## Self-Review 记录

**Spec 覆盖对照：**
- §3.1 Header → Task 7 ✓
- §3.2 首页顶部间距 → Task 7 ✓
- §3.3 Banner+统计条 → Task 5 ✓
- §3.4 TabSection → Task 6 ✓
- §3.5 内容区横滑 → Task 2（hook）+ Task 3（CSS）✓
- §3.6 卡片内部收缩 → Task 4 ✓
- §3.7 其余网格板块 → Task 3（teams grid 覆盖）+ Task 4 ✓
- §3.8 Footer → Task 8 ✓
- §3.9 通用工具 → Task 4 ✓
- §1 断点体系 → Task 1 ✓
- §2 集中式响应式层 → Task 1 ✓
- §5 验收标准 → Task 9 ✓

**类型/命名一致性：** `useCarousel` 返回字段签名未变（Task 2）；卡片 class 名经 grep 核实（hospital-card/equip-card/dc-card/sf-card/case-card/product-card/team-card）；teams grid 为 `cards-grid--teams-1/2/3`，Task 3/4 均已覆盖。

**无占位符：** 各代码步骤均含完整可粘贴内容。
