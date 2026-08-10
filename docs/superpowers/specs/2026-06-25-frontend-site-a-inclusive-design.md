# frontend-site-a 包容性设计优化规格

**日期：** 2026-06-25  
**范围：** `frontend-site-a` — HospitalsSection 及以下各板块；header / banner / 导航布局不变  
**方法：** CSS/LESS token 修改 + 最小化 TSX 无障碍属性  
**目标受众：** 混合人群（患者 + 医疗机构）

---

## 0. 硬性约束

- header、banner、导航（`.site-header`、`.banner-section`、`TabSection` 的整体布局）**一律不改**
- 不引入新的 npm 依赖
- 所有颜色对比度满足 WCAG AA（正文 ≥ 4.5:1，大文本 ≥ 3:1）
- 触摸目标尺寸 ≥ 44×44px
- 最小正文字号 14px（约 0.875rem）；眉标/badge 字号 ≥ 0.78rem

---

## 1. 设计 Token（src/index.less）

在文件顶部现有变量区追加以下 token，供各 section 引用：

```less
@card-radius:       10px;
@section-padding-y: 80px;
@bg-alt:            #F4F8FF;
@focus-ring:        0 0 0 3px rgba(0, 103, 237, 0.45);
```

### 1.1 全局 focus-visible 样式

在现有全局样式之后追加（只对键盘导航生效，鼠标点击不触发）：

```less
:focus-visible {
  outline: none;
  box-shadow: @focus-ring;
}
```

### 1.2 轮播侧边按钮（.carousel-side-btn）

当前值 `opacity: 0; pointer-events: none` 对键盘/辅助技术完全不可见。

修改为：

```less
.carousel-side-btn {
  opacity: 0.45;
  pointer-events: auto;
  transition: opacity 0.2s;
  &:hover,
  &:focus-visible {
    opacity: 1;
  }
}
```

### 1.3 轮播导航按钮尺寸（.carousel-nav__btn）

`width/height: 40px` → `44px`（满足触摸目标下限）。

---

## 2. 各板块交替背景配色

| 板块 | 背景色 | 备注 |
|------|--------|------|
| HospitalsSection | `#ffffff` | 不变 |
| EquipmentSection | `@bg-alt`（#F4F8FF） | 原 #EFF6FF |
| DoctorsSection | `#ffffff` | 原 #EFF6FF |
| ServiceFeaturesSection | `@bg-alt` | 原 #EFF6FF |
| CasesSection | `#ffffff` | 原 #EFF6FF |
| ServiceTeamsSection | `@bg-alt` | 原 #ffffff（改变） |
| ProductsSection | `#ffffff` | 不变 |

---

## 3. 卡片样式（各 section index.less）

### 3.1 通用变更（适用全部 6 个非 hospitals section）

```less
// border-radius: 0 → @card-radius
border-radius: @card-radius;

// padding: 100px 0 → @section-padding-y 0
padding: @section-padding-y 0;

// hover 卡片浮起效果
transition: transform 0.2s ease, box-shadow 0.2s ease;
&:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(1, 52, 137, 0.12);
}
```

### 3.2 HospitalsSection/index.less

`.hospital-card`：`border-radius: 12px` → `@card-radius`（统一）

overlay 文字对比度修复（深色渐变叠加后已满足，但增强可读性）：

```less
.hospital-card__intro {
  font-size: 0.88rem;             // 原 0.86rem
  color: rgba(255, 255, 255, 0.92); // 原 0.8
}

.hospital-card__link {
  font-size: 0.88rem;  // 原 0.8rem
}
```

### 3.3 DoctorsSection/index.less

`.dc-card__book-btn` 加触摸目标下限：

```less
min-height: 44px;
```

### 3.4 CasesSection/index.less

`.case-card__link-btn` 加触摸目标下限：

```less
min-height: 44px;
min-width: 44px;
```

---

## 4. 眉标字号（.section-header__label / .tab-tag）

两处字号低于 0.78rem 的眉标统一修复：

| 文件 | 选择器 | 当前值 → 新值 |
|------|--------|--------------|
| `src/index.less` | `.section-header__label` | `0.7rem` → `0.78rem` |
| `TabSection/index.less` | `.tab-tag` | `0.68rem` → `0.78rem` |

---

## 5. TSX 无障碍属性变更

### 5.1 HospitalsSection/index.tsx — HospitalCard

`<div>` 绑 `onClick` 需补充键盘访问角色：

```tsx
<div
  className="hospital-card"
  role="button"
  tabIndex={0}
  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/hospital/${hospital.id}`); }}
  style={{ animationDelay: `${delay}ms` }}
  onClick={() => navigate(`/hospital/${hospital.id}`)}
>
```

### 5.2 CasesSection/index.tsx — 轮播按钮变体

将 `carousel-nav__btn--light` 改为 `carousel-nav__btn--dark`（白底白字 → 白底深色，对比度从 1:1 提升至 ≥ 4.5:1）。

涉及两处按钮（prev / next），各改一个 className 字符串。

---

## 6. 文件变更清单

| 文件 | 变更类型 | 主要内容 |
|------|----------|---------|
| `src/index.less` | LESS | 追加 token、focus-visible、carousel-side-btn、carousel-nav__btn 尺寸、section-header__label 字号 |
| `HospitalsSection/index.less` | LESS | card-radius 统一、overlay 文字对比度 |
| `HospitalsSection/index.tsx` | TSX | role/tabIndex/onKeyDown |
| `EquipmentSection/index.less` | LESS | border-radius、padding、background、hover |
| `DoctorsSection/index.less` | LESS | border-radius、padding、background、book-btn min-height、hover |
| `ServiceFeaturesSection/index.less` | LESS | border-radius、padding、background、hover |
| `CasesSection/index.less` | LESS | border-radius、padding、background、link-btn min-height、hover |
| `CasesSection/index.tsx` | TSX | btn--light → btn--dark |
| `ServiceTeamsSection/index.less` | LESS | border-radius、padding、background（#fff→@bg-alt）、hover |
| `ProductsSection/index.less` | LESS | border-radius、padding、hover |
| `TabSection/index.less` | LESS | .tab-tag 字号 0.68rem → 0.78rem |

共 **11 个文件**，其中 9 个纯 LESS，2 个 TSX 小改。

---

## 7. 不在本次范围内

- 移动端响应式布局（cards-grid 断点）
- 深色模式
- 动画/过渡性能 prefers-reduced-motion
- 详情页（HospitalDetail / ProductDetail）
- header、banner、TabSection 布局
