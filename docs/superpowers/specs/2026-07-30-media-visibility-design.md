# 媒体可见性修复 设计规范

**日期：** 2026-07-30
**状态：** 已确认，待实现

---

## 背景

HA（医院管理员）在上传图片或视频时，变更经由 `submitMediaEdit` 写入 `pending_changes.pending_data.media`（JSON 数组），而 `MediaUploadList` 组件的列表接口只查询 `entity_media`（已审批数据），导致：

1. HA 上传后列表为空，无法看到刚上传的待审核媒体
2. Reviewer 详情弹窗中 `pending_data.media` 字段被 `String(v)` 渲染为 `[object Object],...`，看不到任何缩略图

---

## 业务规则

| 操作 | 行为 |
|------|------|
| 上传图片/视频（add） | → `pending_changes.pending_data.media`（新增 `id=null` 项），需审核 |
| 设为主图（set-cover） | → `pending_changes.pending_data.media`（修改 isCover），需审核 |
| 删除已审批项（`id != null`） | 直接删 `entity_media`，不走审核 |
| 删除待审核项（`id == null`，存在于 pending_data 里） | 从 `pending_data.media` 中移除该 url 对应条目；若 media 数组变空且无其他实体字段变更，则删整条 `pending_changes` 记录 |

---

## Section 1：后端 — `HAMediaController` 变更

### 1.1 `GET /api/hospital-admin/media` 改为合并返回

响应类型从 `List<EntityMedia>` 改为 `List<MediaItemWithStatus>`（Controller 内部 record）：

```java
record MediaItemWithStatus(
    Long id,          // entity_media.id；pending_add 项为 null
    String url,
    String mediaType,
    Integer isCover,
    Integer sortOrder,
    String status     // "approved" | "pending_add"
)
```

合并逻辑：
1. 查 `entity_media`（singular entityType，如 "hospital"）→ 全部 `status="approved"`
2. 查 `pending_changes`（plural entityType，如 "hospitals"，`entity_id=entityId`，`audit_status='pending'`）
3. 若有 pending 记录，解析 `pending_data.media`，取其中 `id == null` 的条目 → 追加到列表，`status="pending_add"`
4. 返回合并后列表（approved 在前，pending_add 在后）

**注意：** `pending_changes.entity_type` 用 plural（"hospitals"），`entity_media.entity_type` 用 singular（"hospital"）。查询时通过已有的 `toPlural()` 方法转换。

### 1.2 `DELETE /api/hospital-admin/media/{id}` — 已审批项直接删除

移除 `submitMediaEdit("delete", ...)` 调用，改为：

```java
@DeleteMapping("/{id}")
public Result<Void> delete(@PathVariable Long id) {
    EntityMedia media = entityMediaMapper.selectById(id);
    if (media == null) return Result.ok();
    if (!isOwned(media.getEntityType(), media.getEntityId())) return Result.fail(403, "无权访问");
    entityMediaMapper.deleteById(id);
    return Result.ok();
}
```

### 1.3 新增 `DELETE /api/hospital-admin/media/pending` — 删除待审核项

```
DELETE /api/hospital-admin/media/pending?entityType=hospital&entityId=X&url=<encoded-url>
```

逻辑：
1. 通过 `isOwned` 校验权限
2. 查 `pending_changes`（plural entityType，entityId，audit_status='pending'）
3. 从 `pending_data.media` 中移除与 `url` 匹配且 `id == null` 的条目
4. 若移除后 media 数组为空，且 pending_data 中无其他实体字段变更（即所有字段与 live entity 相同）→ 删整条 `pending_changes`；否则只更新 `pending_data`
5. 若整条 pending_changes 删除后无其他 pending 项，实体的 `hasPendingEdit` 自动消除

**"无其他实体字段变更"判断方式：** 将 `pending_data` 去掉 `media` 字段后与 live entity JSON 比较，若相等则无其他变更。

---

## Section 2：前端 — `MediaItem` 类型扩展

```typescript
// frontend-admin/src/types/index.ts
export interface MediaItem {
  id: number | null    // pending_add 时为 null
  entityType: string
  entityId: number
  mediaType: 'image' | 'video'
  url: string
  isCover: number
  sortOrder: number
  status?: 'approved' | 'pending_add'
}
```

---

## Section 3：前端 — `MediaUploadList` 变更

### 3.1 渲染逻辑

`status="pending_add"` 条目：
- 显示橙色 `<Tag>待审核</Tag>`
- 禁用"设为主图"按钮
- **保留删除按钮**，点击后调 `DELETE /api/hospital-admin/media/pending?entityType=...&entityId=...&url=...`

`status="approved"` 条目（或无 status）：
- 保持原样，所有操作可用
- 删除调 `DELETE /api/hospital-admin/media/{id}`（已有逻辑）

### 3.2 删除 pending 项的 handler

```typescript
const handleDeletePending = async (url: string) => {
  try {
    await api.delete(mediaApiUrl + '/pending', {
      params: { entityType, entityId, url },
    });
    message.success('已取消');
    fetchMedia();
  } catch {
    message.error('操作失败');
  }
};
```

### 3.3 批量上传说明

前端已是逐个上传（每个文件一次 `POST /api/hospital-admin/media`），后端 `submitMediaEdit` 的 upsert 逻辑每次 add 都 append 到同一条 `pending_changes.pending_data.media`，天然支持批量上传合并为一条 pending record，无需额外修改。

---

## Section 4：前端 — `ReviewerPendingPage` 变更

### 4.1 `EntityFields` SKIP_KEYS 加 `'media'`

```typescript
const SKIP_KEYS = ['id', 'hospitalId', 'auditStatus', 'rejectionReason',
                   'createdAt', 'updatedAt', 'hasPendingEdit', 'media']
```

### 4.2 新增 `PendingMediaSection` 组件

```tsx
const PendingMediaSection: React.FC<{ data: Record<string, unknown> }> = ({ data }) => {
  const media = data.media as any[] | undefined
  if (!Array.isArray(media) || media.length === 0) return null
  return (
    <div style={{ marginTop: 16 }}>
      <Typography.Title level={5}>媒体文件</Typography.Title>
      <Image.PreviewGroup>
        <Space wrap>
          {media.map((m, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              {m.mediaType === 'image'
                ? <Image src={m.url} width={100} height={70} style={{ objectFit: 'cover', borderRadius: 4 }} />
                : <video src={m.url} width={100} height={70} style={{ objectFit: 'cover' }} />
              }
              {m.isCover === 1 && (
                <Tag color="gold" style={{ display: 'block', marginTop: 4 }}>主图</Tag>
              )}
              {!m.id && (
                <Tag color="orange" style={{ display: 'block', marginTop: 4 }}>新上传</Tag>
              )}
            </div>
          ))}
        </Space>
      </Image.PreviewGroup>
    </div>
  )
}
```

### 4.3 详情弹窗接入

**`isEdit=true`（编辑模式）：** 在右侧"待审核变更"列的 `EntityFields` 之后追加 `PendingMediaSection`：

```tsx
<Col span={12}>
  <Typography.Title level={5} style={{ color: '#1677ff' }}>待审核变更</Typography.Title>
  <EntityFields
    data={selectedItem.data as Record<string, unknown>}
    changedKeys={changedKeys}
    highlight={true}
  />
  <PendingMediaSection data={selectedItem.data as Record<string, unknown>} />
</Col>
```

**`isEdit=false`（新增模式）：** 在 `renderDetail(...)` 之后追加：

```tsx
{renderDetail(detailModal.type, selectedItem.data as DetailRecord, hospitalMap)}
<PendingMediaSection data={selectedItem.data as Record<string, unknown>} />
```

---

## 影响范围

| 文件 | 变更类型 |
|------|---------|
| `controller/hospitaladmin/HAMediaController.java` | GET list 改为合并返回；DELETE 分两路（已审批直删 / pending 项单独接口） |
| `frontend-admin/src/types/index.ts` | `MediaItem.id` 改为 `number \| null`，加 `status` 字段 |
| `frontend-admin/src/components/MediaUploadList.tsx` | 渲染 pending_add 标签；添加 handleDeletePending handler |
| `frontend-admin/src/pages/Reviewer/ReviewerPendingPage.tsx` | SKIP_KEYS 加 media；新增 PendingMediaSection；弹窗两处接入 |
