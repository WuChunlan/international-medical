# 设计文档：医院管理员特需产品套餐管理

**日期：** 2026-07-31  
**状态：** 待实现  
**涉及表：** `special_products`、`product_variants`、`pending_changes`

---

## 背景与目标

一个医院下可以配置多个特需门诊产品（`special_products`），每个产品有多个套餐（`product_variants`）。医院管理员（HA）需要能在新建/编辑产品时同时管理套餐，且套餐变更和产品信息一起走审核流程，审核通过后才正式生效。

---

## 现状分析

| 层面 | 现状 | 问题 |
|------|------|------|
| `PendingChangeService.applyProduct` | 审核通过时从 pending JSON 的 `variants` 数组重建套餐 | 无缺口，已支持 |
| `HAProductController.create` | 只序列化 `SpecialProduct` 字段进 pending，不含 variants | 需修改 |
| `HAProductController.update` | 同上 | 需修改 |
| `applyProduct` 中 `isActive` 处理 | 不设 `isActive`，新建产品审核通过后仍为 0 | 需补 `isActive=1` |
| HA 前端 `HAProductsPage.tsx` | 抽屉无套餐管理区块 | 需新增 |
| 读取套餐接口（HA 侧） | 无 | 需新增 |

---

## 方案：嵌入式本地套餐 + 预生成产品 ID

### 核心思路

复用 `HAHospitalController` 的做法：新建产品时先 INSERT 一条 `auditStatus=pending, isActive=0` 的 shell 记录以拿到真实 ID，再调 `submitNewDraftWithEntityId` 将完整数据（含 variants 数组）写入 `pending_changes`。审核通过时 `applyProduct` 更新字段、重建 variants、设 `isActive=1`。

---

## 数据流

### 新建产品

```
HA 填写产品 + 套餐
       ↓
HAProductController.create
  1. INSERT special_products (auditStatus=pending, isActive=0) → 得到 product.id
  2. submitNewDraftWithEntityId("products", {product + variants}, product.id, userId)
       ↓
pending_changes: { entity_type=products, entity_id=product.id, data={...product, variants:[...]} }
       ↓
ReviewerController 审核通过
  applyProduct(id, data)
    - 更新 special_products 字段
    - 设 isActive=1
    - 删旧 variants，重建新 variants
  setLiveAuditStatus("approved")
```

### 编辑产品

```
HA 修改产品 + 套餐
       ↓
HAProductController.update
  submitEdit("products", id, {product + variants}, userId)
       ↓
pending_changes: { entity_id=product.id, data={...product, variants:[...]} }
       ↓
ReviewerController 审核通过
  applyProduct(id, data)   ← 已有逻辑，完全支持
```

---

## 后端变更

### 1. 新增接口：`GET /api/hospital-admin/products/{id}/variants`

位置：`HAProductController`

- 校验 `hospital_id` 归属
- 返回该产品的全部 variants（`isActive=1`，按 `sort_order` 排序）
- 用于编辑时前端回填套餐列表

### 2. 新增 DTO：`HAProductRequest`

```java
// 位置：com.intlmedical.dto.request
public class HAProductRequest {
    // 产品字段（同 SpecialProduct 的可编辑字段）
    private String nameZh;
    private String nameEn;
    private String summaryZh;
    private String summaryEn;
    private String detailZh;
    private String detailEn;
    private String coverImageUrl;
    private BigDecimal priceMin;
    private BigDecimal priceMax;
    private String contactPerson;
    private String contactInfo;
    private Integer sortOrder;
    // 套餐列表
    private List<ProductVariantDTO> variants;
}

public class ProductVariantDTO {
    private String nameZh;
    private String nameEn;
    private String descZh;
    private String descEn;
    private BigDecimal price;
    private Integer sortOrder;
}
```

### 3. 修改 `HAProductController.create`

```java
@PostMapping
public Result<Void> create(@RequestBody HAProductRequest req) {
    Long hospitalId = SecurityUtil.getCurrentHospitalId();
    if (hospitalId == null) return Result.fail(403, "未绑定医院");
    Long userId = SecurityUtil.getCurrentUserId();

    // 先插 shell 记录，拿到真实 ID
    SpecialProduct product = new SpecialProduct();
    // 映射 req 字段...
    product.setHospitalId(hospitalId);
    product.setAuditStatus("pending");
    product.setIsActive(0);
    specialProductMapper.insert(product);

    try {
        pendingChangeService.submitNewDraftWithEntityId("products", req, product.getId(), userId);
    } catch (JsonProcessingException e) {
        return Result.fail("提交失败，请重试");
    }
    return Result.ok();
}
```

### 4. 修改 `HAProductController.update`

```java
@PutMapping("/{id}")
public Result<Void> update(@PathVariable Long id, @RequestBody HAProductRequest req) {
    // 归属校验不变
    try {
        pendingChangeService.submitEdit("products", id, req, userId);
    } catch (JsonProcessingException e) {
        return Result.fail("提交失败，请重试");
    }
    return Result.ok();
}
```

### 5. 修改 `PendingChangeService.applyProduct`

在更新产品字段后，补设 `isActive=1`（新建产品审核通过需激活）：

```java
p.setIsActive(1);  // 补在 productMapper.updateById(p) 之前
```

`setLiveAuditStatus` 已由 `applyApproval` 统一调用，无需在 `applyProduct` 内重复。

---

## 前端变更（HA 侧）

### `HAProductsPage.tsx` 抽屉扩展

**状态新增：**
```ts
const [localVariants, setLocalVariants] = useState<LocalVariant[]>([])
const [variantModal, setVariantModal] = useState<{ open: boolean; row: LocalVariant | null }>()
```

`LocalVariant` 在组件内定义，与 `ProductVariant` 基本相同，`id` 字段用 `Date.now()` 作临时标识（新建）或真实 id（已有）。

**打开编辑时：**
```ts
const res = await api.get(`/api/hospital-admin/products/${id}/variants`)
setLocalVariants(res.data.data ?? [])
```

**套餐操作（仅修改本地 state，不调接口）：**
- 新增：push 到 `localVariants`
- 编辑：按 id 替换
- 删除：按 id 过滤

**提交时：**
```ts
await api.put(`/api/hospital-admin/products/${id}`, {
  ...productFormValues,
  variants: localVariants.map(({ id: _tempId, ...v }) => v)
})
```

新建时同理，`id` 字段全部忽略。

**UI 结构（抽屉底部新增）：**
```
── 套餐配置 ─────────────────────────── [+ 添加套餐]
 套餐名称  │ 描述 │ 价格  │ 排序 │ 操作
 基础套餐  │ ...  │ ¥500 │  0  │ [编辑][删除]
```

套餐弹窗字段：中/英名称、中/英描述、价格、排序。

---

## 不变的部分

- `PendingChangeService.applyProduct` 的 variants 重建逻辑（已支持）
- `ReviewerController` 的审核通过/驳回流程
- 平台管理员的产品管理（`AdminProductController` + `AdminProductVariantController`）
- `SpecialProduct` 实体和 `ProductVariant` 实体字段

---

## 改动文件清单

| 文件 | 类型 |
|------|------|
| `HAProductController.java` | 修改（create、update 方法 + 新增 variants 查询） |
| `HAProductRequest.java` | 新增 DTO |
| `ProductVariantDTO.java` | 新增 DTO |
| `PendingChangeService.java` | 修改（`applyProduct` 补 `isActive=1`） |
| `HAProductsPage.tsx` | 修改（增加本地套餐管理 + 套餐弹窗） |
