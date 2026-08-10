# HA 特需产品套餐管理 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 医院管理员可以在新建/编辑特需产品时同时管理套餐，套餐变更和产品信息一起提交审核，审核通过后生效。

**Architecture:** 新建产品时先 INSERT shell 记录拿到真实 ID，将 `{ product字段, variants: [...] }` 整体写入 `pending_changes`；编辑时同理。审核通过时 `applyProduct` 已支持 variants 重建，只需补 `isActive=1`。前端在抽屉内用本地 state 管理套餐，保存时一次性提交。

**Tech Stack:** Spring Boot 3.2 / MyBatis-Plus / Lombok / React 18 / Ant Design / TypeScript

## Global Constraints

- 后端包名前缀：`com.intlmedical`
- DTO 位置：`com.intlmedical.dto.request`
- 使用 Lombok `@Data` 注解替代手写 getter/setter
- 前端 API 调用统一通过 `api`（`frontend-admin/src/api/index.ts`）
- 后端编译命令：`mvn compile -f backend/pom.xml`（在项目根目录执行）
- 前端类型检查：`cd frontend-admin && npx tsc --noEmit`
- 无自动化测试框架，验证方式为手动启动服务 + 浏览器操作

---

### Task 1: 后端 DTO — HAProductRequest + ProductVariantDTO

**Files:**
- Create: `backend/src/main/java/com/intlmedical/dto/request/HAProductRequest.java`
- Create: `backend/src/main/java/com/intlmedical/dto/request/ProductVariantDTO.java`

**Interfaces:**
- Produces: `HAProductRequest`（含 `List<ProductVariantDTO> variants`），供 Task 2 中 `HAProductController` 使用

- [ ] **Step 1: 创建 ProductVariantDTO**

```java
// backend/src/main/java/com/intlmedical/dto/request/ProductVariantDTO.java
package com.intlmedical.dto.request;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ProductVariantDTO {
    private String nameZh;
    private String nameEn;
    private String descZh;
    private String descEn;
    private BigDecimal price;
    private Integer sortOrder;
}
```

- [ ] **Step 2: 创建 HAProductRequest**

```java
// backend/src/main/java/com/intlmedical/dto/request/HAProductRequest.java
package com.intlmedical.dto.request;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class HAProductRequest {
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
    private List<ProductVariantDTO> variants;
}
```

- [ ] **Step 3: 编译验证**

```bash
mvn compile -f backend/pom.xml -q
```

预期：BUILD SUCCESS，无编译错误。

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/java/com/intlmedical/dto/request/HAProductRequest.java \
        backend/src/main/java/com/intlmedical/dto/request/ProductVariantDTO.java
git commit -m "feat(backend): add HAProductRequest and ProductVariantDTO"
```

---

### Task 2: 后端 — 修改 HAProductController

**Files:**
- Modify: `backend/src/main/java/com/intlmedical/controller/hospitaladmin/HAProductController.java`

**Interfaces:**
- Consumes: `HAProductRequest`（含 `List<ProductVariantDTO> variants`）——来自 Task 1
- Produces:
  - `POST /api/hospital-admin/products` 接受 `HAProductRequest`，先 INSERT shell 记录，再调 `submitNewDraftWithEntityId`
  - `PUT /api/hospital-admin/products/{id}` 接受 `HAProductRequest`，调 `submitEdit`
  - `GET /api/hospital-admin/products/{id}/variants` 返回 `List<ProductVariant>`

- [ ] **Step 1: 替换 create 方法**

打开 `HAProductController.java`，将 `create` 方法从：

```java
@PostMapping
public Result<Void> create(@RequestBody SpecialProduct product) {
    Long hospitalId = SecurityUtil.getCurrentHospitalId();
    if (hospitalId == null) return Result.fail(403, "未绑定医院");
    Long userId = SecurityUtil.getCurrentUserId();
    product.setHospitalId(hospitalId);
    try {
        pendingChangeService.submitNewDraft("products", product, userId);
    } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
        return Result.fail("提交失败，请重试");
    }
    return Result.ok();
}
```

替换为：

```java
@PostMapping
public Result<Void> create(@RequestBody HAProductRequest req) {
    Long hospitalId = SecurityUtil.getCurrentHospitalId();
    if (hospitalId == null) return Result.fail(403, "未绑定医院");
    Long userId = SecurityUtil.getCurrentUserId();
    // 先插 shell 记录以拿到真实 ID（参照 HAHospitalController 做法）
    SpecialProduct product = new SpecialProduct();
    product.setHospitalId(hospitalId);
    product.setNameZh(req.getNameZh() != null ? req.getNameZh() : "");
    product.setNameEn(req.getNameEn() != null ? req.getNameEn() : "");
    product.setSummaryZh(req.getSummaryZh());
    product.setSummaryEn(req.getSummaryEn());
    product.setDetailZh(req.getDetailZh());
    product.setDetailEn(req.getDetailEn());
    product.setCoverImageUrl(req.getCoverImageUrl());
    product.setPriceMin(req.getPriceMin());
    product.setPriceMax(req.getPriceMax());
    product.setContactPerson(req.getContactPerson());
    product.setContactInfo(req.getContactInfo());
    product.setSortOrder(req.getSortOrder() != null ? req.getSortOrder() : 0);
    product.setIsActive(0);
    product.setAuditStatus("pending");
    specialProductMapper.insert(product);
    try {
        pendingChangeService.submitNewDraftWithEntityId("products", req, product.getId(), userId);
    } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
        return Result.fail("提交失败，请重试");
    }
    return Result.ok();
}
```

- [ ] **Step 2: 替换 update 方法**

将 `update` 方法从：

```java
@PutMapping("/{id}")
public Result<Void> update(@PathVariable Long id, @RequestBody SpecialProduct product) {
    Long hospitalId = SecurityUtil.getCurrentHospitalId();
    if (hospitalId == null) return Result.fail(403, "未绑定医院");
    SpecialProduct existing = specialProductMapper.selectById(id);
    if (existing == null || !hospitalId.equals(existing.getHospitalId())) {
        return Result.fail(403, "无权操作");
    }
    Long userId = SecurityUtil.getCurrentUserId();
    try {
        pendingChangeService.submitEdit("products", id, product, userId);
    } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
        return Result.fail("提交失败，请重试");
    }
    return Result.ok();
}
```

替换为：

```java
@PutMapping("/{id}")
public Result<Void> update(@PathVariable Long id, @RequestBody HAProductRequest req) {
    Long hospitalId = SecurityUtil.getCurrentHospitalId();
    if (hospitalId == null) return Result.fail(403, "未绑定医院");
    SpecialProduct existing = specialProductMapper.selectById(id);
    if (existing == null || !hospitalId.equals(existing.getHospitalId())) {
        return Result.fail(403, "无权操作");
    }
    Long userId = SecurityUtil.getCurrentUserId();
    try {
        pendingChangeService.submitEdit("products", id, req, userId);
    } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
        return Result.fail("提交失败，请重试");
    }
    return Result.ok();
}
```

- [ ] **Step 3: 新增 variants 查询接口**

在 `HAProductController` 类中，注入 `ProductVariantMapper`，并新增方法：

在类顶部 imports 中补充：
```java
import com.intlmedical.dto.request.HAProductRequest;
import com.intlmedical.mapper.ProductVariantMapper;
import com.intlmedical.entity.ProductVariant;
import java.util.List;
```

在类字段中补充（`@RequiredArgsConstructor` 会自动注入）：
```java
private final ProductVariantMapper productVariantMapper;
```

新增方法：
```java
@GetMapping("/{id}/variants")
public Result<List<ProductVariant>> listVariants(@PathVariable Long id) {
    Long hospitalId = SecurityUtil.getCurrentHospitalId();
    if (hospitalId == null) return Result.fail(403, "未绑定医院");
    SpecialProduct existing = specialProductMapper.selectById(id);
    if (existing == null || !hospitalId.equals(existing.getHospitalId())) {
        return Result.fail(403, "无权操作");
    }
    List<ProductVariant> variants = productVariantMapper.selectList(
        new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<ProductVariant>()
            .eq(ProductVariant::getProductId, id)
            .eq(ProductVariant::getIsActive, 1)
            .orderByAsc(ProductVariant::getSortOrder));
    return Result.ok(variants);
}
```

- [ ] **Step 4: 编译验证**

```bash
mvn compile -f backend/pom.xml -q
```

预期：BUILD SUCCESS。

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/com/intlmedical/controller/hospitaladmin/HAProductController.java
git commit -m "feat(backend): HAProductController accepts variants in create/update; add GET variants endpoint"
```

---

### Task 3: 后端 — 修复 applyProduct 中的 isActive

**Files:**
- Modify: `backend/src/main/java/com/intlmedical/service/PendingChangeService.java:377-410`

**Interfaces:**
- `applyProduct(Long id, JsonNode d)` 审核通过时需将 `isActive` 设为 1，确保新建产品激活

- [ ] **Step 1: 在 applyProduct 中补 isActive=1**

找到 `applyProduct` 方法（约第 377 行），在 `productMapper.updateById(p)` 之前补一行：

```java
// 原来：
p.setContactInfo(textOrNull(d, "contactInfo"));
p.setSortOrder(d.path("sortOrder").asInt(0));
productMapper.updateById(p);

// 改为：
p.setContactInfo(textOrNull(d, "contactInfo"));
p.setSortOrder(d.path("sortOrder").asInt(0));
p.setIsActive(1);   // 新建产品审核通过时激活
productMapper.updateById(p);
```

- [ ] **Step 2: 编译验证**

```bash
mvn compile -f backend/pom.xml -q
```

预期：BUILD SUCCESS。

- [ ] **Step 3: Commit**

```bash
git add backend/src/main/java/com/intlmedical/service/PendingChangeService.java
git commit -m "fix(backend): set isActive=1 in applyProduct so new products activate on approval"
```

---

### Task 4: 前端 — HAProductsPage 增加套餐管理

**Files:**
- Modify: `frontend-admin/src/pages/HospitalAdmin/HAProductsPage.tsx`

**Interfaces:**
- Consumes:
  - `GET /api/hospital-admin/products/{id}/variants` → `ProductVariant[]`（Task 2 新增）
  - `POST /api/hospital-admin/products` body: `{ ...product字段, variants: LocalVariant[] }`
  - `PUT /api/hospital-admin/products/{id}` body: `{ ...product字段, variants: LocalVariant[] }`
- `LocalVariant` 类型在组件顶部定义（见 Step 1）

- [ ] **Step 1: 用完整替换 HAProductsPage.tsx**

将文件内容完整替换为以下代码：

```tsx
import React, { useEffect, useState, useCallback } from 'react'
import {
  Table, Button, Space, Popconfirm, message, Drawer, Form, Input, Tag,
  Modal, InputNumber, Divider,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import api from '../../api'
import type { SpecialProduct, ProductVariant } from '../../types'
import { StatusTag } from '../../components/StatusTag'
import FormRow from '../../components/FormRow'

interface LocalVariant extends Omit<ProductVariant, 'productId' | 'isActive'> {
  _tempId: number
}

const HAProductsPage: React.FC = () => {
  const [data, setData] = useState<SpecialProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [current, setCurrent] = useState(1)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editRecord, setEditRecord] = useState<SpecialProduct | null>(null)
  const [form] = Form.useForm()

  const [localVariants, setLocalVariants] = useState<LocalVariant[]>([])
  const [variantModal, setVariantModal] = useState<{ open: boolean; row: LocalVariant | null }>({ open: false, row: null })
  const [variantForm] = Form.useForm()

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const res = await api.get('/api/hospital-admin/products', { params: { page, size: 10 } })
      const d = res.data?.data ?? res.data
      setData(d?.records ?? d?.list ?? [])
      setTotal(d?.total ?? 0)
    } catch {
      message.error('获取产品列表失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData(current) }, [fetchData, current])

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/hospital-admin/products/${id}`)
      message.success('删除成功')
      fetchData(current)
    } catch {
      message.error('删除失败')
    }
  }

  const openDrawer = async (record?: SpecialProduct) => {
    setEditRecord(record ?? null)
    setLocalVariants([])
    if (record) {
      form.setFieldsValue(record)
      try {
        const res = await api.get(`/api/hospital-admin/products/${record.id}/variants`)
        const list: ProductVariant[] = res.data?.data ?? res.data ?? []
        setLocalVariants(list.map(v => ({ ...v, _tempId: v.id })))
      } catch {
        // 加载套餐失败不阻断打开抽屉
      }
    } else {
      form.resetFields()
    }
    setDrawerOpen(true)
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const values = await form.validateFields()
      const payload = {
        ...values,
        variants: localVariants.map(({ _tempId: _, id: __, ...v }) => v),
      }
      if (editRecord) {
        await api.put(`/api/hospital-admin/products/${editRecord.id}`, payload)
        message.success('更新成功，等待审核')
      } else {
        await api.post('/api/hospital-admin/products', payload)
        message.success('创建成功，等待审核')
      }
      setDrawerOpen(false)
      fetchData(current)
    } catch (err: unknown) {
      const error = err as { errorFields?: unknown[] }
      if (!error.errorFields) message.error('操作失败')
    } finally {
      setSaving(false)
    }
  }

  const openVariantModal = (row: LocalVariant | null) => {
    variantForm.resetFields()
    if (row) variantForm.setFieldsValue(row)
    setVariantModal({ open: true, row })
  }

  const handleVariantSave = async () => {
    try {
      const values = await variantForm.validateFields()
      if (variantModal.row) {
        setLocalVariants(prev =>
          prev.map(v => v._tempId === variantModal.row!._tempId ? { ...v, ...values } : v)
        )
      } else {
        setLocalVariants(prev => [...prev, { ...values, _tempId: Date.now(), id: 0 }])
      }
      setVariantModal({ open: false, row: null })
    } catch {
      // 表单校验失败，保持 modal 打开
    }
  }

  const handleVariantDelete = (row: LocalVariant) => {
    setLocalVariants(prev => prev.filter(v => v._tempId !== row._tempId))
  }

  const variantColumns: ColumnsType<LocalVariant> = [
    { title: '套餐名称', dataIndex: 'nameZh', ellipsis: true },
    { title: '描述', dataIndex: 'descZh', ellipsis: true },
    { title: '价格', dataIndex: 'price', width: 100, render: (v: number | null) => v != null ? `¥${v}` : '-' },
    { title: '排序', dataIndex: 'sortOrder', width: 70 },
    {
      title: '操作', width: 120,
      render: (_: unknown, row: LocalVariant) => (
        <Space size={0}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openVariantModal(row)}>编辑</Button>
          <Popconfirm title="确认删除此套餐？" onConfirm={() => handleVariantDelete(row)} okText="确认" cancelText="取消">
            <Button type="text" danger size="small" icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const columns: ColumnsType<SpecialProduct> = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    {
      title: '中文名称', dataIndex: 'nameZh', ellipsis: true,
      render: (text: string, record: SpecialProduct) => (
        <span>
          {text}
          {record.hasPendingEdit && (
            <Tag color="orange" style={{ marginLeft: 8 }}>编辑待审核</Tag>
          )}
        </span>
      ),
    },
    { title: '英文名称', dataIndex: 'nameEn', ellipsis: true },
    {
      title: '审核状态', dataIndex: 'auditStatus', width: 100,
      render: (v: string) => <StatusTag status={v as 'approved' | 'pending' | 'rejected'} />,
    },
    { title: '驳回原因', dataIndex: 'rejectionReason', ellipsis: true, render: (v: string | null) => v || '-' },
    {
      title: '操作', width: 120,
      render: (_, record: SpecialProduct) => (
        <Space size={0}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openDrawer(record)}>编辑</Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(record.id)} okText="确认" cancelText="取消">
            <Button type="text" danger size="small" icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="page-card">
      <div className="page-header">
        <h3 className="page-title">产品管理</h3>
        <p className="page-description">管理本院特需产品，提交后等待审核</p>
      </div>
      <div className="page-toolbar">
        <div className="toolbar-left" />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openDrawer()}>新增产品</Button>
      </div>
      <Table rowKey="id" size="middle" columns={columns} dataSource={data} loading={loading}
        pagination={{ current, pageSize: 10, total, showTotal: t => `共 ${t} 条`, position: ['bottomRight'], size: 'small', onChange: setCurrent }} />

      <Drawer
        title={editRecord ? '编辑产品' : '新增产品'}
        width={720}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setDrawerOpen(false)}>取消</Button>
            <Button type="primary" onClick={handleSubmit} loading={saving}>保存</Button>
          </div>
        }
      >
        <Form form={form} layout="vertical">
          <FormRow>
            <Form.Item name="nameZh" label="中文名称" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="nameEn" label="英文名称" rules={[{ required: true }]}><Input /></Form.Item>
          </FormRow>
          <Form.Item name="summaryZh" label="摘要(中文)" rules={[{ required: true }]}><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="summaryEn" label="摘要(英文)" rules={[{ required: true }]}><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="detailZh" label="详情(中文)"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="detailEn" label="详情(英文)"><Input.TextArea rows={3} /></Form.Item>
          <FormRow>
            <Form.Item name="priceMin" label="最低价格"><Input type="number" /></Form.Item>
            <Form.Item name="priceMax" label="最高价格"><Input type="number" /></Form.Item>
          </FormRow>
          <FormRow>
            <Form.Item name="contactPerson" label="联系人"><Input /></Form.Item>
            <Form.Item name="contactInfo" label="联系方式"><Input /></Form.Item>
          </FormRow>
          <Form.Item name="sortOrder" label="排序"><Input type="number" /></Form.Item>
        </Form>

        <Divider />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <strong style={{ fontSize: 14 }}>套餐配置</strong>
          <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={() => openVariantModal(null)}>添加套餐</Button>
        </div>
        <Table
          rowKey="_tempId"
          size="small"
          dataSource={localVariants}
          columns={variantColumns}
          pagination={false}
          locale={{ emptyText: '暂无套餐，点击"添加套餐"创建' }}
        />
      </Drawer>

      <Modal
        title={variantModal.row ? '编辑套餐' : '添加套餐'}
        open={variantModal.open}
        onOk={handleVariantSave}
        onCancel={() => setVariantModal({ open: false, row: null })}
        okText="保存"
        cancelText="取消"
        width={480}
        destroyOnClose
      >
        <Form form={variantForm} layout="vertical">
          <FormRow>
            <Form.Item name="nameZh" label="套餐中文名称" rules={[{ required: true, message: '请输入套餐名称' }]}>
              <Input placeholder="例：基础套餐" />
            </Form.Item>
            <Form.Item name="nameEn" label="套餐英文名称" rules={[{ required: true, message: '请输入英文名称' }]}>
              <Input placeholder="e.g. Basic Package" />
            </Form.Item>
          </FormRow>
          <Form.Item name="descZh" label="中文描述">
            <Input.TextArea rows={2} placeholder="套餐包含内容（中文）" />
          </Form.Item>
          <Form.Item name="descEn" label="英文描述">
            <Input.TextArea rows={2} placeholder="Package description (English)" />
          </Form.Item>
          <FormRow>
            <Form.Item name="price" label="价格">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="留空表示面议" />
            </Form.Item>
            <Form.Item name="sortOrder" label="排序">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="数字越小越靠前" />
            </Form.Item>
          </FormRow>
        </Form>
      </Modal>
    </div>
  )
}

export default HAProductsPage
```

- [ ] **Step 2: TypeScript 类型检查**

```bash
cd frontend-admin && npx tsc --noEmit
```

预期：无类型错误。

- [ ] **Step 3: Commit**

```bash
git add frontend-admin/src/pages/HospitalAdmin/HAProductsPage.tsx
git commit -m "feat(frontend): HA product form with local variant management and submit together"
```

---

## 手动验证步骤

完成所有 Task 后，按以下步骤验证：

1. **新建产品含套餐**
   - 以医院管理员登录，进入「产品管理」
   - 点击「新增产品」，填写产品信息
   - 点击「添加套餐」，添加 2 条套餐后保存
   - 确认产品列表出现新条目，状态为「待审核」
   - 检查数据库：`special_products` 中 `is_active=0, audit_status='pending'`；`pending_changes` 中 data 含 `variants` 数组

2. **审核通过后套餐生效**
   - 以审核员登录，找到该 pending 记录，点击通过
   - 检查数据库：`special_products` 中 `is_active=1, audit_status='approved'`；`product_variants` 中有对应记录

3. **编辑产品套餐**
   - 再次进入该产品编辑，确认套餐列表已回填
   - 修改一条套餐后保存
   - 审核通过后确认 `product_variants` 中套餐已更新

4. **新建产品不含套餐**
   - 不添加任何套餐直接保存，确认流程正常通过
