# frontend-site-a 手机端响应式适配设计规格

**日期：** 2026-07-07
**范围：** `frontend-site-a` 首页及全局组件的手机端/平板端适配
**方法：** 集中式响应式层（方案 A）— 新建 `src/responsive.less` 承载全部媒体查询覆盖，配合对 `useCarousel` 的单点增强
**目标：** 手机上浏览观感良好，沿用当前配色与内容板块，数据与 PC 端完全一致

---

## 0. 硬性约束

- **PC 端渲染结果零变化**：所有手机端样式必须包裹在 `@media (max-width: …)` 内；`useCarousel` 的桌面分支逻辑不得改变。
- 不引入任何新的 npm 依赖（不使用手势库、CSS 框架）。
- 沿用现有 scotemp.org 配色 token（`@sco-navy`、`@sco-primary`、`@sco-cyan` 等），不新增颜色。
- 触摸目标尺寸 ≥ 44×44px。
- 正文最小字号 ≥ 14px（0.875rem）；眉标/badge ≥ 0.78rem。
- 保留现有无障碍成果（focus-visible、role/tabIndex、aria-label）。

---

## 1. 断点体系

在 `src/index.less` 顶部 token 区新增统一断点变量，供 `responsive.less` 引用：

```less
@bp-laptop: 1024px;   // 小笔记本 / 大平板
@bp-tablet: 768px;    // 平板 / 大屏手机（与现有 Header 汉堡断点一致）
@bp-mobile: 480px;    // 手机
```

**收敛现有零散断点**：现有代码散落 480/560/640/700/900/1024 等断点。本次不删除它们（避免回归），但在 `responsive.less` 中以统一的 `@bp-tablet`/`@bp-mobile` 覆盖规则收敛关键板块（尤其 `ServiceTeamsSection` 的 900/560），保证 ≤768px 表现一致。

---

## 2. 集中式响应式层（新建 `src/responsive.less`）

- 新建 `src/responsive.less`，在 `src/index.less` **文件末尾** `@import './responsive.less';`。
- 因 import 在末尾，同优先级选择器可覆盖前面的 PC 规则；无需 `!important`（个别与 antd/内联样式冲突处例外）。
- 文件内部按板块分区注释组织：Header / Banner+Stats / TabSection / 内容区轮播 / 卡片内部 / Footer / 通用工具。

---

## 3. 各板块手机端设计

### 3.1 Header（`components/Header.less`，覆盖写在 responsive.less）

现状：≤768px 已隐藏 topbar 与桌面 nav、显示汉堡菜单。

手机端（≤768px）调整：
- `.site-a-header__inner` 高度 130px → **64px**；内边距 `0 80px` → `0 16px`。
- `.site-a-header__logo-img` 高度 80px → **44px**。
- `.site-a-header__logo-text` 字号 24px → **18px**（`__logo-text` 第二行/副标题相应缩小）。
- `.site-a-header__mobile-btn` 补足 **44×44px** 点击区（`padding: 10px`，`min-width/min-height: 44px`）。
- `.site-a-header__mobile-menu` 增加 `max-height: calc(100vh - 64px)` + `overflow-y: auto`，防导航项过多溢出。
- 汉堡图标 SVG 描边色保持白色（现状即白）。

### 3.2 首页顶部间距修复（`pages/HomePage/index.less`）

现状：`.home-page { padding-top: 189px; }`（topbar 80 + nav 109），锚点 section `scroll-margin-top: 189px`。手机端 topbar 隐藏且 nav 变矮，会留大片空白且锚点跳转错位。

手机端（≤768px）：
- `.home-page` `padding-top` → **64px**。
- 全部锚点 section 的 `scroll-margin-top` → **64px**（`.hospitals-section, .equipment-section, .doctors-section, .service-features-section, .cases-section, .products-section`）。

### 3.3 Banner + 统计条（`ScoSection/index.less`）

现状：宽高比 banner（`padding-bottom: 37.37%`，`min-height: 320px`）；统计条 `.sco-stats__inner` flex 一行 N 项，竖分割线。

手机端（≤768px）：
- `.sco-banner__ratio` `min-height` 320px → **200px**（≤480px 可进一步到 180px）。
- `.sco-banner__arrow` 60×60px → **44×44px**；`--prev/--next` 贴边距离 20px → **8px**；字号 28px → 20px。
- `.sco-stats__inner` 由 flex 一行改为 **2×2 网格**：`display: grid; grid-template-columns: repeat(2, 1fr);`。
- `.sco-stat-item` 去掉右侧竖分割线（`border-right: none`），改用网格单元底/右细边框区隔（`border-bottom` + 奇数项 `border-right`，颜色沿用 `rgba(255,255,255,0.12)`）；内边距 `24px 20px` → `16px 12px`。
- 统计数值字号沿用现有 `clamp(1.6rem, 2.8vw, 2.2rem)`，无需改。

### 3.4 TabSection 双卡（`TabSection/index.less`）

现状：两张 tab 卡片 flex 并排，中间竖分割线（`.tab-card-divider`）。

手机端（≤768px）：
- `.tab-section__inner` `flex-direction: column`（上下堆叠）。
- `.tab-card-divider` 由竖线改横线：`width: 100%; height: 1px;`。
- `.tab-card-inner` 内边距 `20px 24px` → **16px**；`gap` 24px → 14px。
- `.tab-icon-wrap` 56×56px → **48×48px**。
- 数据与切换逻辑（`activeTab`）不动。

### 3.5 内容区轮播 → 手机端「每屏 1 张大卡 + 横滑」

涉及板块：HospitalsSection、EquipmentSection、DoctorsSection、CasesSection、ProductsSection、ServiceTeamsSection（凡使用 `useCarousel` + `.cards-grid` 者）。

现状：`useCarousel(total, perPage=3)` 每页 3 张卡 + 圆点分页 + 自动轮播 + 两侧箭头；`.cards-grid` 为 grid（1024→2列、640→1列）。

**实现（改 `hooks/useCarousel.ts` 一处 + CSS）：**

`useCarousel` 内部通过 `window.matchMedia('(max-width: 768px)')` 检测手机端（含 `resize`/`change` 监听并在卸载时清理）。手机端时将有效 `perPage` 覆盖为「全部条数」，产生连锁效果：
- `totalPages = 1` → `hasMultiple = false` → 各 section 中包在 `{hasMultiple && …}` 的**箭头与圆点自动不渲染**。
- 自动轮播：`start()` 在 `totalPages <= 1` 时直接 return，**自动停止**。
- `visible` 返回全部索引 → 全部卡片一次性渲染，数据与 PC 端一致。

桌面端 `matchMedia` 为 false，`perPage` 仍为 3，原有分页/箭头/圆点/自动轮播逻辑**完全不变**。

**CSS（≤768px，写在 responsive.less）：**
- `.cards-grid`（含所有 `--hospitals/--products/--cases/--equipment/--teams/--doctors` 变体）：
  ```
  display: flex;
  flex-direction: row;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  gap: 14px;
  padding-bottom: 8px;          // 容纳滚动惯性
  scroll-padding: 0 16px;
  ```
  隐藏滚动条：`&::-webkit-scrollbar { display: none; }` + `scrollbar-width: none;`
- 每张卡（各 section 的卡片根，如 `.hospital-card`、`.data-card`、`.sf-card` 等）：
  ```
  flex: 0 0 85%;
  scroll-snap-align: center;
  ```
  → 每屏 1 张大卡（占屏宽 ~85%），露出下一张边缘暗示可横滑。
- `.carousel-side-btn` 手机端 `display: none`（兜底，即使渲染也不显示）。

**取舍：** 手机端不显示圆点进度指示，以「露出下一张边缘」提示可滑（移动端主流做法）。如需圆点需额外监听横向滚动位置，本次不做。

### 3.6 卡片内部收缩（≤768px）

对轮播卡片与网格卡片统一收缩：
- 封面高度：`.data-card__cover`、`.sf-card__cover`（220px）、`.equipment-img` 等 → **约 180px**（≤480px 可 160px）。
- 卡片内容内边距：`24px 28px 28px` / `24px 28px` → **16px 18px**。
- 标题字号轻度下调（保持 ≥ 1rem）；正文 `__desc/__intro` 保持 ≥ 0.875rem，`-webkit-line-clamp` 维持 3 行。

### 3.7 其余网格板块（ServiceFeaturesSection 等）

- ServiceFeaturesSection 若为纯网格（非轮播），≤768px 走 `.cards-grid` 单列或与横滑一致的规则；封面/内边距按 3.6 收缩。
- ServiceTeamsSection 现有 900/560 自有断点 → 在 responsive.less 用 `@bp-tablet` 统一覆盖为横滑（若用 useCarousel）或单列。

### 3.8 Footer（`components/Footer.less`）

现状：`__top` 已 `flex-wrap: wrap`；联系弹窗已 `max-width: calc(100vw - 40px)`。

手机端（≤768px）：
- `.site-footer` 内边距 `56px 0 36px` → `40px 0 28px`。
- `.site-footer__inner` 内边距 `0 40px` → `0 16px`。
- `.site-footer__top` 改为 `flex-direction: column; align-items: center; text-align: center;`（logo、tagline、CTA 竖向堆叠居中）。
- `.footer-contact-modal` 内边距 `48px 40px 40px` → `32px 20px 28px`（≤480px）。

### 3.9 通用工具（≤768px）

- `.section-container` / `.section-inner` 内边距 `0 20px` → `0 16px`。
- `@section-padding-y` 语义：各 section 上下留白 80px → 手机端约 **48px**（在 responsive.less 中对各 `*-section` 覆盖 `padding-top/bottom`，不改 token 本身以免影响 PC）。
- `.section-header` `margin-bottom: 64px` → **40px**。
- 图片统一 `object-fit: cover`（现状已具备）；全局 `img { max-width: 100% }` 已生效。

---

## 4. 涉及文件清单

**新增：**
- `frontend-site-a/src/responsive.less` — 集中式手机端响应式层。

**修改：**
- `frontend-site-a/src/index.less` — 顶部加断点变量；末尾 `@import './responsive.less'`。
- `frontend-site-a/src/hooks/useCarousel.ts` — 新增 matchMedia 手机端检测，手机端 `perPage = total`。
- `frontend-site-a/src/pages/HomePage/index.less` — 手机端 `padding-top` / `scroll-margin-top` → 64px（也可放入 responsive.less，二选一，建议就近放本文件的 @media）。

**不改动 TSX 结构**：所有 section 的 `.tsx` 无需改动（横滑通过 hook + CSS 达成）。Header.tsx 已含汉堡菜单，无需改。

---

## 5. 验收标准

- iPhone SE（375px）、iPhone 14（390px）、iPad（768px）、桌面（≥1024px）四档目视检查。
- PC 端（≥1024px）与改动前**逐板块视觉一致**（回归）。
- 手机端：Header 汉堡菜单可用、无顶部空白；Banner 不过矮、箭头不遮内容；统计条 2×2；Tab 双卡竖排；内容区每屏 1 张大卡可横滑并露出下一张边缘；Footer 居中堆叠。
- 无横向溢出滚动（`body { overflow-x: hidden }` 已具备，仍需逐屏确认）。
- 触摸目标 ≥ 44px；正文 ≥ 14px。
- 构建通过：`npm run build`（tsc + vite）。

---

## 6. 明确不做（YAGNI）

- 不加横滑圆点进度指示（靠露边缘提示）。
- 不重写任何 section 的 TSX 结构。
- 不改后端/数据接口。
- 不做深色模式、不做横竖屏特殊处理。
- 不清理/删除现有零散断点（仅在关键板块覆盖收敛）。
