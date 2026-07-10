# frontend-admin 表单两列布局 + 视频预览 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 frontend-admin 全部 18 个表单成对短字段每行两列展示更美观，并让上传的视频可在管理端点击弹窗播放、图片可点击放大确认渲染。

**Architecture:** 新增共享 `FormRow` 组件（Row+两 Col）统一两列布局；各表单容器宽度 520→720，成对短字段用 FormRow 包裹，长文本/上传/表格保持整行。`MediaUploadList` 视频项加播放按钮 + `<video controls>` 弹窗，图片项用 Antd `Image` 预览。`ImageUpload` 加上传前类型/大小校验。后端不改。

**Tech Stack:** React 19 + TypeScript + Vite + Antd 6；构建 `npm run build`（tsc -b && vite build）。

## Global Constraints

- 容器宽度统一 520 → 720（Drawer 的 `width={520}`；HAHospitalPage 是 Modal 同样 720）。
- 整行（不进 FormRow，保持默认 span=24）：所有 `Input.TextArea`/`TextArea`、`ImageUpload`、`MediaUploadList`、内嵌 `Table`、宽 `Select`（关联医院/团队）。
- 两列：成对且语义相关的短 `Input`/`InputNumber`（中/英名称、地址、价格上下限、联系人/联系方式、姓/名、邮箱/密码、排序/启用等）。
- 完全保留现有逻辑：校验 `rules`、`onBlur` 翻译钩子、`.input-number-full`、`valuePropName`、hidden 字段、一键翻译按钮、提交流程。只包结构层。
- 无测试基建：每个任务验证 = `cd frontend-admin && npm run build` 通过（tsc+vite，无新 TS 错误）+ 目视确认。
- 仓库卫生：每个任务只 `git add` 该任务涉及的文件，绝不 `git add -A`/`.`/`backend/target/`。
- 不改后端、数据库、上传接口、业务逻辑；不引第三方播放器。

---

## File Structure

- Create `frontend-admin/src/components/FormRow.tsx` — 两列布局包装组件（Task 1）。
- Modify `frontend-admin/src/components/MediaUploadList.tsx` + `MediaUploadList.less` — 视频弹窗播放 + 图片预览（Task 2）。
- Modify `frontend-admin/src/components/ImageUpload.tsx` — 上传前校验（Task 3）。
- Modify 表单文件（Task 4–8，按端/相近结构分组）：
  - Task 4: HospitalForm、ProductForm（主+套餐）
  - Task 5: DoctorForm、EquipmentForm、CaseForm
  - Task 6: EnvironmentManage、ServiceFeatureManage、ServiceTeamManage
  - Task 7: HospitalAdminManage、CustomerRepManage、CreateStaff
  - Task 8: HospitalAdmin/ 下 6 个 HA 页面

---

## Task 1: 共享 FormRow 组件

**Files:**
- Create: `frontend-admin/src/components/FormRow.tsx`

**Interfaces:**
- Produces: `FormRow` 默认导出，props `{ children: React.ReactNode; gutter?: number }`。渲染 `<Row gutter={gutter||16}>`，把每个子节点放入一个 `<Col span={12}>`。

- [ ] **Step 1: 创建组件**

创建 `frontend-admin/src/components/FormRow.tsx`：

```tsx
import React from 'react'
import { Row, Col } from 'antd'

interface FormRowProps {
  children: React.ReactNode
  gutter?: number
}

/** 将子 Form.Item 并排为一行两列（每个占 span=12）。整行字段请勿用此组件包裹。 */
const FormRow: React.FC<FormRowProps> = ({ children, gutter = 16 }) => {
  const items = React.Children.toArray(children)
  return (
    <Row gutter={gutter}>
      {items.map((child, i) => (
        <Col span={12} key={i}>{child}</Col>
      ))}
    </Row>
  )
}

export default FormRow
```

- [ ] **Step 2: 构建验证**

Run: `cd frontend-admin && npm run build`
Expected: 构建成功，无 TS 错误。

- [ ] **Step 3: Commit**

```bash
git add frontend-admin/src/components/FormRow.tsx
git commit -m "feat(admin): add FormRow two-column layout helper"
```

---

## Task 2: MediaUploadList 视频弹窗播放 + 图片预览

**Files:**
- Modify: `frontend-admin/src/components/MediaUploadList.tsx`
- Modify: `frontend-admin/src/components/MediaUploadList.less`

**Interfaces:**
- Consumes: 现有 `MediaItem`（`mediaType: 'image'|'video'`, `url`, `isCover`）。
- Produces: 组件行为变更（无导出签名变化）。

- [ ] **Step 1: 增加 imports 与播放 state**

在 `MediaUploadList.tsx` 顶部 antd import 加 `Modal, Image`，icon import 加 `PlayCircleOutlined`：

```tsx
import { Button, message, Spin, Tag, Tooltip, Modal, Image } from 'antd';
import {
  PictureOutlined,
  VideoCameraOutlined,
  StarOutlined,
  StarFilled,
  DeleteOutlined,
  UploadOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
```

在组件内 state 区（`const [uploading, ...]` 之后）加：

```tsx
  const [previewVideo, setPreviewVideo] = useState<string | null>(null);
```

- [ ] **Step 2: 缩略图区改为图片预览 + 视频播放按钮**

把渲染 `media-item__thumb` 的块（当前为 img 或 VideoCameraOutlined 图标）替换为：

```tsx
              <div className="media-item__thumb">
                {item.mediaType === 'image' ? (
                  <Image src={item.url} alt="preview" width={80} height={56}
                         style={{ objectFit: 'cover' }} />
                ) : (
                  <button
                    type="button"
                    className="media-item__video-btn"
                    aria-label="播放视频"
                    onClick={() => setPreviewVideo(item.url)}
                  >
                    <VideoCameraOutlined className="media-item__video-icon" />
                    <PlayCircleOutlined className="media-item__play-icon" />
                  </button>
                )}
              </div>
```

- [ ] **Step 3: 在组件 return 根节点内末尾加视频 Modal**

在最外层 `<div className="media-upload-list">` 的闭合 `</div>` 之前加：

```tsx
      <Modal
        title="视频预览"
        open={previewVideo !== null}
        onCancel={() => setPreviewVideo(null)}
        footer={null}
        destroyOnClose
        width={720}
      >
        {previewVideo && (
          <video src={previewVideo} controls autoPlay style={{ width: '100%' }} />
        )}
      </Modal>
```

- [ ] **Step 4: 样式**

在 `MediaUploadList.less` 的 `.media-item__video-icon` 规则后加：

```less
  &__video-btn {
    position: relative;
    width: 100%;
    height: 100%;
    border: none;
    padding: 0;
    background: #f0f0f0;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__play-icon {
    position: absolute;
    font-size: 22px;
    color: #fff;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
  }
```

- [ ] **Step 5: 构建验证**

Run: `cd frontend-admin && npm run build`
Expected: 构建成功，无 TS 错误。

- [ ] **Step 6: Commit**

```bash
git add frontend-admin/src/components/MediaUploadList.tsx frontend-admin/src/components/MediaUploadList.less
git commit -m "feat(admin): play uploaded video in modal + image preview in media list"
```

---

## Task 3: ImageUpload 上传前校验

**Files:**
- Modify: `frontend-admin/src/components/ImageUpload.tsx`

**Interfaces:**
- Consumes: 现有 props（`accept`, `category` 等）。
- Produces: `<Upload beforeUpload>` 校验，无 props 签名变化。

- [ ] **Step 1: 加 beforeUpload 校验**

在 `ImageUpload` 组件内、`customRequest` 定义之后加：

```tsx
  const beforeUpload = (file: File) => {
    const isAcceptedType = accept === 'image/*'
      ? file.type.startsWith('image/')
      : true;
    if (!isAcceptedType) {
      message.error('文件格式不支持');
      return Upload.LIST_IGNORE;
    }
    const maxMb = 50; // 与后端 upload_max_size_mb 默认值一致
    if (file.size > maxMb * 1024 * 1024) {
      message.error(`文件大小超过 ${maxMb}MB 限制`);
      return Upload.LIST_IGNORE;
    }
    return true;
  };
```

- [ ] **Step 2: 挂到 Upload**

在 `<Upload ...>` 上加 `beforeUpload={beforeUpload}`：

```tsx
      <Upload
        accept={accept}
        showUploadList={false}
        beforeUpload={beforeUpload}
        customRequest={customRequest as never}
        onChange={handleChange}
      >
```

- [ ] **Step 3: 构建验证**

Run: `cd frontend-admin && npm run build`
Expected: 构建成功，无 TS 错误。

- [ ] **Step 4: Commit**

```bash
git add frontend-admin/src/components/ImageUpload.tsx
git commit -m "feat(admin): validate file type/size before upload"
```

---

## 表单改造通用配方（Task 4–8 共用）

每个表单文件按以下步骤改：
1. 容器宽度：`width={520}` → `width={720}`（Modal 同理）。
2. `import FormRow from '../../components/FormRow'`（HospitalAdmin/ 下路径同为 `'../../components/FormRow'`）。
3. 把成对短字段用 `<FormRow>...</FormRow>` 包裹（见每任务配对表）。整行字段（TextArea/ImageUpload/MediaUploadList/Table/宽 Select）保持原样不动。
4. 保留每个 `Form.Item` 全部 props（name/label/rules/valuePropName 及子元素 onBlur、placeholder、className）。

**通用示例**（中/英名称）：

改前：
```tsx
        <Form.Item name="nameZh" label="中文名称" rules={[{ required: true, message: '请输入中文名称' }]}>
          <Input placeholder="请输入中文名称" onBlur={() => translateField('nameZh')} />
        </Form.Item>
        <Form.Item name="nameEn" label="英文名称" rules={[{ required: true, message: '请输入英文名称' }]}>
          <Input placeholder="输入中文名称后可自动翻译" />
        </Form.Item>
```

改后：
```tsx
        <FormRow>
          <Form.Item name="nameZh" label="中文名称" rules={[{ required: true, message: '请输入中文名称' }]}>
            <Input placeholder="请输入中文名称" onBlur={() => translateField('nameZh')} />
          </Form.Item>
          <Form.Item name="nameEn" label="英文名称" rules={[{ required: true, message: '请输入英文名称' }]}>
            <Input placeholder="输入中文名称后可自动翻译" />
          </Form.Item>
        </FormRow>
```

> 若某表单实际字段与配对表略有出入，以文件实际字段为准，遵循"短字段两列、长内容/上传/表格整行"原则。读文件确认实际字段名后再改。

---

## Task 4: HospitalForm + ProductForm

**Files:**
- Modify: `frontend-admin/src/pages/HospitalManage/HospitalForm.tsx`
- Modify: `frontend-admin/src/pages/ProductManage/ProductForm.tsx`

**Interfaces:** Consumes `FormRow`（Task 1）。

- [ ] **Step 1: HospitalForm** — 宽度 520→720；import FormRow。配对：`nameZh|nameEn`、`addressZh|addressEn`、`phone|contactPerson`、`contactInfo|sortOrder`。整行：`introZh`、`introEn`(TextArea)、`coverImageUrl`、`MediaUploadList`。

- [ ] **Step 2: ProductForm** — 宽度 520→720；import FormRow。主产品配对：`nameZh|nameEn`、`priceMin|priceMax`、`contactPerson|contactInfo`、`sortOrder`(单独，保持整行或左列半宽)。整行：`summaryZh/En`、`detailZh/En`(TextArea)、`coverImageUrl`、规格 `Table`、`MediaUploadList`。套餐子 Drawer 配对：`nameZh|nameEn`、`price|sortOrder`；整行 `descZh/En`；宽度若 520 也改 720。

- [ ] **Step 3: 构建验证**

Run: `cd frontend-admin && npm run build`
Expected: 构建成功，无 TS 错误。

- [ ] **Step 4: Commit**

```bash
git add frontend-admin/src/pages/HospitalManage/HospitalForm.tsx frontend-admin/src/pages/ProductManage/ProductForm.tsx
git commit -m "feat(admin): two-column layout for hospital and product forms"
```

---

## Task 5: DoctorForm + EquipmentForm + CaseForm

**Files:**
- Modify: `frontend-admin/src/pages/DoctorManage/DoctorForm.tsx`
- Modify: `frontend-admin/src/pages/EquipmentManage/EquipmentForm.tsx`
- Modify: `frontend-admin/src/pages/CaseManage/CaseForm.tsx`

**Interfaces:** Consumes `FormRow`（Task 1）。

- [ ] **Step 1: DoctorForm** — 520→720；import FormRow。配对：`nameZh|nameEn`、`titleZh|titleEn`、`specialtyZh|specialtyEn`、`pricePerVisit|sortOrder`。整行：`hospitalId`(Select)、`bioZh/En`(TextArea)、`photoUrl`、`MediaUploadList`。

- [ ] **Step 2: EquipmentForm** — 520→720；import FormRow。配对：`nameZh|nameEn`、`sortOrder`(单独)。整行：`hospitalId`、`descZh/En`(TextArea)、`imageUrl`、`MediaUploadList`。

- [ ] **Step 3: CaseForm** — 520→720；import FormRow。配对：`titleZh|titleEn`、`sortOrder`(单独)。整行：`hospitalId`、`summaryZh/En`(TextArea)、`coverImageUrl`。

- [ ] **Step 4: 构建验证**

Run: `cd frontend-admin && npm run build`
Expected: 构建成功，无 TS 错误。

- [ ] **Step 5: Commit**

```bash
git add frontend-admin/src/pages/DoctorManage/DoctorForm.tsx frontend-admin/src/pages/EquipmentManage/EquipmentForm.tsx frontend-admin/src/pages/CaseManage/CaseForm.tsx
git commit -m "feat(admin): two-column layout for doctor, equipment, case forms"
```

---

## Task 6: EnvironmentManage + ServiceFeatureManage + ServiceTeamManage

**Files:**
- Modify: `frontend-admin/src/pages/EnvironmentManage/index.tsx`
- Modify: `frontend-admin/src/pages/ServiceFeatureManage/index.tsx`
- Modify: `frontend-admin/src/pages/ServiceTeamManage/index.tsx`

**Interfaces:** Consumes `FormRow`（Task 1）。

- [ ] **Step 1: EnvironmentManage** — 520→720；import FormRow。配对：`nameZh|nameEn`、`sortOrder|isActive`（isActive 保留 `valuePropName="checked"`）。整行：`descZh/En`(TextArea)、`imageUrl`。`hospitalId` hidden 保持原位。

- [ ] **Step 2: ServiceFeatureManage** — 520→720；import FormRow。配对：`nameZh|nameEn`、`sortOrder|isActive`。整行：`introZh/En`(TextArea)、`imageUrl`、`teamIds`(Select 多选)。

- [ ] **Step 3: ServiceTeamManage** — 520→720；import FormRow。配对：`nameZh|nameEn`、`sortOrder|isActive`。整行：`introZh/En`(TextArea)、`imageUrl`。

- [ ] **Step 4: 构建验证**

Run: `cd frontend-admin && npm run build`
Expected: 构建成功，无 TS 错误。

- [ ] **Step 5: Commit**

```bash
git add frontend-admin/src/pages/EnvironmentManage/index.tsx frontend-admin/src/pages/ServiceFeatureManage/index.tsx frontend-admin/src/pages/ServiceTeamManage/index.tsx
git commit -m "feat(admin): two-column layout for environment, service-feature, service-team forms"
```

---

## Task 7: HospitalAdminManage + CustomerRepManage + CreateStaff

**Files:**
- Modify: `frontend-admin/src/pages/HospitalAdminManage/index.tsx`
- Modify: `frontend-admin/src/pages/CustomerRepManage/index.tsx`
- Modify: `frontend-admin/src/pages/CreateStaff/index.tsx`

**Interfaces:** Consumes `FormRow`（Task 1）。

- [ ] **Step 1: HospitalAdminManage** — 编辑/新增 Drawer 520→720；import FormRow。配对：`email|password`、`lastName|firstName`。整行：`hospitalId`(Select)。

- [ ] **Step 2: CustomerRepManage** — 编辑/新增 Drawer 520→720（客户列表 Drawer 保持 640）；import FormRow。配对：`email|password`、`lastName|firstName`。整行：编辑态邀请码只读展示。

- [ ] **Step 3: CreateStaff** — 若有显式宽度 520→720（无则不强加）；import FormRow。配对：`email|password`、`lastName|firstName`。`roleId` 与 `hospitalId`：若 hospitalId 是条件渲染（仅 roleId=3 时出现），则二者各自整行以免结构错乱；若同时恒存在则并排。

- [ ] **Step 4: 构建验证**

Run: `cd frontend-admin && npm run build`
Expected: 构建成功，无 TS 错误。

- [ ] **Step 5: Commit**

```bash
git add frontend-admin/src/pages/HospitalAdminManage/index.tsx frontend-admin/src/pages/CustomerRepManage/index.tsx frontend-admin/src/pages/CreateStaff/index.tsx
git commit -m "feat(admin): two-column layout for staff/rep management forms"
```

---

## Task 8: HospitalAdmin/ 下 6 个 HA 页面

**Files:**
- Modify: `frontend-admin/src/pages/HospitalAdmin/HAHospitalPage.tsx`
- Modify: `frontend-admin/src/pages/HospitalAdmin/HADoctorsPage.tsx`
- Modify: `frontend-admin/src/pages/HospitalAdmin/HAEquipmentsPage.tsx`
- Modify: `frontend-admin/src/pages/HospitalAdmin/HAEnvironmentsPage.tsx`
- Modify: `frontend-admin/src/pages/HospitalAdmin/HACasesPage.tsx`
- Modify: `frontend-admin/src/pages/HospitalAdmin/HAProductsPage.tsx`

**Interfaces:** Consumes `FormRow`（Task 1）。

- [ ] **Step 1: 逐个改造**（医院管理员端，字段对应超管版，同配对规则；读每个文件确认实际字段名后再改）：
  - HAHospitalPage（**Modal** 520→720）：`nameZh|nameEn`、`addressZh|addressEn`、`phone|contactPerson`、`contactInfo|sortOrder`；简介/上传/Media 整行。
  - HADoctorsPage（Drawer 520→720）：`nameZh|nameEn`、`titleZh|titleEn`、`specialtyZh|specialtyEn`、`pricePerVisit|sortOrder`；hospital Select/bio/photo/Media 整行。
  - HAEquipmentsPage（520→720）：`nameZh|nameEn`、`sortOrder`；desc/image/Media 整行。
  - HAEnvironmentsPage（520→720）：`nameZh|nameEn`、`sortOrder|isActive`；desc/image 整行。
  - HACasesPage（520→720）：`titleZh|titleEn`、`sortOrder`；summary/cover 整行。
  - HAProductsPage（520→720）：`nameZh|nameEn`、`priceMin|priceMax`、`contactPerson|contactInfo`、`sortOrder`；摘要/详情/cover/规格表/Media 整行。

- [ ] **Step 2: 构建验证**

Run: `cd frontend-admin && npm run build`
Expected: 构建成功，无 TS 错误。

- [ ] **Step 3: Commit**

```bash
git add frontend-admin/src/pages/HospitalAdmin/
git commit -m "feat(admin): two-column layout for hospital-admin (HA) forms"
```

---

## 完成标准

- 18 个表单在 720px 容器下成对短字段两列展示，长文本/上传/表格整行，页面更紧凑美观。
- 所有原有校验、翻译、提交逻辑不变。
- 上传视频可在 MediaUploadList 点击弹窗播放；上传图片可点击放大预览；封面正常渲染。
- ImageUpload 上传前对超限/错误类型给出明确提示。
- `npm run build` 全程通过。
