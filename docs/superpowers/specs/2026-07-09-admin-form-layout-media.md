# frontend-admin 表单两列布局 + 视频预览 设计文档

- 日期：2026-07-09
- 状态：已确认，待实现
- 范围：frontend-admin 项目（React + TS + Vite + Antd 6）

## 1. 背景与目标

1. **表单两列布局**：现有管理端表单在 520px 宽的 Drawer/Modal 中用 Antd 垂直布局，每行一个字段，成对的中/英字段上下堆叠，页面偏长、不够美观。目标：让成对的短字段每行两列展示，更紧凑美观，覆盖全部 18 个表单。
2. **图片/视频上传与渲染核实**：确保图片、视频都能正确上传并可在管理端确认渲染。经核实后端链路正常，需修复的是 `MediaUploadList` 中视频只显示静态图标、无法播放确认的问题。

## 2. 关键决策（已确认）

| 决策点 | 结论 |
|---|---|
| 两列改造范围 | 全部 18 个表单 |
| 视频展示方式 | 列表缩略图保留图标 + 播放按钮，点击弹窗 `<video controls>` 播放 |
| Drawer/Modal 宽度 | 520 → 720px（容纳两列不拥挤）|
| 整行字段 | 多行 TextArea、图片上传、MediaUploadList、内嵌表格保持 span=24 |
| 复用方式 | 新增共享 `FormRow` 组件统一 Row+两 Col，减少样板 |
| 后端 | 不改动（已核实正常）|

## 3. 现状核实结论（上传链路）

- 后端 `application.yml`：multipart max-file-size / max-request-size = 2048MB。
- `FileUploadService`：应用层 50MB 上限（`upload_max_size_mb`），允许图片 `jpg,jpeg,png,webp,gif`、视频 `mp4,mov,avi,webm`（`site_configs` 配置），按扩展名校验。
- `WebMvcConfig`：`/media/**` 映射到 `upload_base_path`，Spring `ResourceHttpRequestHandler` 原生支持 HTTP Range，可流式播放视频。
- `ImageUpload`：图片预览用 Antd `Image` 正常渲染。
- **缺陷**：`MediaUploadList` 视频项缩略图只渲染 `<VideoCameraOutlined>` 图标，无播放入口，无法确认视频是否正确上传/可播放。

结论：图片、视频**上传**功能本身正常；要补的是**视频渲染/播放确认**与上传前的前端校验提示。

## 4. Part 1 — 表单两列布局

### 4.1 共享组件 `FormRow`

新建 `frontend-admin/src/components/FormRow.tsx`：

```tsx
import React from 'react'
import { Row, Col } from 'antd'

/** 将两个（或一个）Form.Item 并排为一行两列。单个子元素时占满左列。 */
const FormRow: React.FC<{ children: React.ReactNode; gutter?: number }> = ({ children, gutter = 16 }) => {
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

用法：`<FormRow><Form.Item .../><Form.Item .../></FormRow>`。整行字段仍直接写 `<Form.Item>`，不包 FormRow。

### 4.2 每个表单的改造规则

- 容器宽度 520 → 720（Modal 同理）。
- 成对短字段用 `FormRow` 两列；具体配对见 4.3。
- 保持 span=24（不进 FormRow）：所有 `TextArea`（简介/详情/摘要/描述）、`ImageUpload`、`MediaUploadList`、内嵌 `Table`（产品规格/套餐）、`Select`（关联医院/团队等宽下拉，单独整行更清晰）。
- 完全保留：校验 rules、`onBlur` 翻译钩子、`.input-number-full`、`valuePropName`、hidden 字段、一键翻译按钮等所有现有逻辑。只包结构层。
- 单数剩余短字段（如只剩"排序"）可与相邻短字段配对；无可配对项时放 FormRow 左列（占半宽）或保持整行——以视觉平衡为准，实现时每表单具体标注。

### 4.3 各表单字段配对（18 个）

**超管端（12）**
- HospitalForm：`nameZh|nameEn`、`addressZh|addressEn`、`phone|contactPerson`、`contactInfo|sortOrder`；`introZh/introEn`(TextArea)、`coverImageUrl`、Media 整行。
- ProductForm（主产品）：`nameZh|nameEn`、`priceMin|priceMax`、`contactPerson|contactInfo`、`sortOrder`(+空或与联系配对)；`summaryZh/En`、`detailZh/En`、cover、规格表、Media 整行。
- ProductForm（套餐 SpecialProduct 子表单）：`nameZh|nameEn`、`price|sortOrder`；`descZh/En` 整行。
- DoctorForm：`nameZh|nameEn`、`titleZh|titleEn`、`specialtyZh|specialtyEn`、`pricePerVisit|sortOrder`；`hospitalId`(Select)、`bioZh/En`、`photoUrl`、Media 整行。
- EquipmentForm：`nameZh|nameEn`、`sortOrder`(+空)；`hospitalId`、`descZh/En`、image、Media 整行。
- CaseForm：`titleZh|titleEn`、`sortOrder`(+空)；`hospitalId`、`summaryZh/En`、cover 整行。
- EnvironmentManage：`nameZh|nameEn`、`imageUrl|sortOrder` 或 `sortOrder|isActive`；`descZh/En` 整行、`isActive`(Switch)。
- ServiceFeatureManage：`nameZh|nameEn`、`teamIds|sortOrder`、`sortOrder|isActive`；`introZh/En`、image 整行。
- ServiceTeamManage：`nameZh|nameEn`、`sortOrder|isActive`；`introZh/En`、image 整行。
- HospitalAdminManage：`email|password`(编辑时 password 可空)、`lastName|firstName`；`hospitalId` 整行。
- CustomerRepManage：`email|password`、`lastName|firstName`；邀请码只读展示整行。
- CreateStaff：`email|password`、`lastName|firstName`、`roleId|hospitalId`。

**医院管理员端（6）**（结构与超管版对应，同样规则）
- HAHospitalPage（Modal）、HADoctorsPage、HAEquipmentsPage、HAEnvironmentsPage、HACasesPage、HAProductsPage。

> 说明：配对以"两个短 input/inputNumber 且语义相关"为原则。实现时若某表单字段与上面标注略有出入，以该表单实际字段为准，遵循同一规则（短字段两列、长内容/上传/表格整行）。

## 5. Part 2 — 视频预览与上传校验

### 5.1 MediaUploadList 视频播放

改 `frontend-admin/src/components/MediaUploadList.tsx` + `.less`：
- 视频缩略图位：保留 `VideoCameraOutlined` 图标底，叠加一个居中"播放"按钮（`PlayCircleOutlined`，带 `aria-label="播放视频"`）。整个缩略图可点击。
- 点击视频项 → 打开 `Modal`（title 显示"视频预览"），内嵌 `<video src={url} controls autoPlay style={{width:'100%'}}>`。关闭 Modal 时停止播放（`destroyOnClose`）。
- 图片项缩略图改用 Antd `<Image>`（带 `preview`）以支持点击放大确认渲染。
- 组件内新增 `previewVideo` state（当前播放的 url），Modal 受控。

### 5.2 ImageUpload 上传前校验（健壮性）

改 `frontend-admin/src/components/ImageUpload.tsx`：
- `beforeUpload`：按 accept 校验类型；大小超限（前端硬编码提示与后端一致的 50MB，或读配置——本次用 50MB 常量并在文案注明）给 `message.error` 明确提示，阻止上传，避免大文件静默失败等待。
- 保持现有 customRequest、预览逻辑不变。

### 5.3 类型

`MediaItem` 已有 `mediaType/url/isCover`（types），无需改。

## 6. 验证

- `cd frontend-admin && npm run build` 通过（tsc + vite），无新增 TS 错误。
- 逻辑核实：图片上传→列表缩略图/封面预览可见；视频上传→列表出现视频项→点击弹窗可播放（依赖后端 `/media` range，已具备）。
- 两列布局在 720px Drawer 下不溢出、TextArea/上传/表格整行。

## 7. 明确不做（YAGNI）

- 不改后端、数据库、上传接口。
- 不引第三方视频播放器、不做转码/封面抽帧。
- 不改表单业务逻辑、校验规则、提交流程。
- 不做响应式移动端适配（管理端桌面为主；720px 在常见桌面宽度安全）。
