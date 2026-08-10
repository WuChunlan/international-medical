# 媒体可见性修复 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix HA media upload list showing empty after upload, and reviewer seeing `[object Object]` instead of media thumbnails in pending detail modal.

**Architecture:** Three changes in sequence — (1) backend splits media delete into two paths and adds pending-aware list endpoint; (2) frontend `MediaItem` type and `MediaUploadList` display pending items with status badges; (3) `ReviewerPendingPage` renders media thumbnails from `pending_data.media`.

**Tech Stack:** Spring Boot 3 / MyBatis-Plus 3 (Java), React 18 / Ant Design 5 / TypeScript

## Global Constraints

- `pending_changes.entity_type` uses plural form ("hospitals"), `entity_media.entity_type` uses singular ("hospital") — always convert with `toPlural()` / `toSingular()` when crossing tables
- `submitMediaEdit` upserts one `pending_changes` row per entity (unique on `entity_type + entity_id`) — all media ops accumulate in that one row's `pending_data.media` array
- `pending_data.media` items with `id == null` are new uploads not yet in `entity_media`; items with `id != null` are existing approved media
- No new DB migrations required for this feature
- Backend: use existing `PendingChangeMapper.selectByEntity(entityType, entityId)` to find pending records
- Frontend: `mediaApiUrl` prop on `MediaUploadList` defaults to `/api/admin/media`; HA pages pass `/api/hospital-admin/media` — changes to `MediaUploadList` must not break the admin path

---

### Task 1: Backend — Split media delete; add combined list endpoint

**Files:**
- Modify: `backend/src/main/java/com/intlmedical/controller/hospitaladmin/HAMediaController.java`

**Interfaces:**
- Produces:
  - `GET /api/hospital-admin/media?entityType=hospital&entityId=X` → `Result<List<MediaItemWithStatus>>` where `MediaItemWithStatus` is an inline record with fields: `Long id`, `String url`, `String mediaType`, `Integer isCover`, `Integer sortOrder`, `String status` ("approved" | "pending_add")
  - `DELETE /api/hospital-admin/media/{id}` → direct `entity_media` delete (no pending)
  - `DELETE /api/hospital-admin/media/pending?entityType=hospital&entityId=X&url=...` → removes matching `id=null` item from `pending_data.media`

- [ ] **Step 1: Add `MediaItemWithStatus` record and rewrite `list()` method**

Replace the existing `list()` method in `HAMediaController.java`:

```java
record MediaItemWithStatus(
    Long id, String url, String mediaType,
    Integer isCover, Integer sortOrder, String status
) {}

@GetMapping
public Result<List<MediaItemWithStatus>> list(
        @RequestParam String entityType,
        @RequestParam Long entityId) {
    if (!isOwned(entityType, entityId)) return Result.fail(403, "无权访问");

    // Approved items from entity_media
    List<EntityMedia> approved = entityMediaMapper.selectList(
        new LambdaQueryWrapper<EntityMedia>()
            .eq(EntityMedia::getEntityType, entityType)
            .eq(EntityMedia::getEntityId, entityId)
            .orderByAsc(EntityMedia::getSortOrder));

    List<MediaItemWithStatus> result = new java.util.ArrayList<>(
        approved.stream()
            .map(m -> new MediaItemWithStatus(
                m.getId(), m.getUrl(), m.getMediaType(),
                m.getIsCover(), m.getSortOrder(), "approved"))
            .toList());

    // Pending-add items from pending_changes.pending_data.media (id == null)
    String pluralType = toPlural(entityType);
    PendingChange pc = pendingChangeMapper.selectByEntity(pluralType, entityId);
    if (pc != null && "pending".equals(pc.getAuditStatus())) {
        try {
            com.fasterxml.jackson.databind.JsonNode mediaNode =
                objectMapper.readTree(pc.getPendingData()).path("media");
            if (mediaNode.isArray()) {
                for (com.fasterxml.jackson.databind.JsonNode m : mediaNode) {
                    if (m.path("id").isNull() || m.path("id").isMissingNode()) {
                        result.add(new MediaItemWithStatus(
                            null,
                            m.path("url").asText(""),
                            m.path("mediaType").asText("image"),
                            m.path("isCover").asInt(0),
                            m.path("sortOrder").asInt(result.size()),
                            "pending_add"));
                    }
                }
            }
        } catch (Exception ignored) {}
    }
    return Result.ok(result);
}
```

Add `ObjectMapper` injection to the controller (add field and constructor param):
```java
private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;
```

- [ ] **Step 2: Replace `delete()` with direct entity_media delete**

Replace the existing `delete()` method:

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

- [ ] **Step 3: Add `deletePending()` endpoint**

Add after `delete()`:

```java
@DeleteMapping("/pending")
public Result<Void> deletePending(
        @RequestParam String entityType,
        @RequestParam Long entityId,
        @RequestParam String url) {
    if (!isOwned(entityType, entityId)) return Result.fail(403, "无权访问");
    String pluralType = toPlural(entityType);
    PendingChange pc = pendingChangeMapper.selectByEntity(pluralType, entityId);
    if (pc == null || !"pending".equals(pc.getAuditStatus())) return Result.ok();
    try {
        com.fasterxml.jackson.databind.node.ObjectNode root =
            (com.fasterxml.jackson.databind.node.ObjectNode)
                objectMapper.readTree(pc.getPendingData());
        com.fasterxml.jackson.databind.JsonNode mediaNode = root.path("media");
        if (!mediaNode.isArray()) return Result.ok();

        com.fasterxml.jackson.databind.node.ArrayNode updated =
            objectMapper.createArrayNode();
        for (com.fasterxml.jackson.databind.JsonNode m : mediaNode) {
            boolean isTargetPending = (m.path("id").isNull() || m.path("id").isMissingNode())
                && url.equals(m.path("url").asText(""));
            if (!isTargetPending) updated.add(m);
        }

        // Check if any pending-add items remain
        boolean hasPendingItems = false;
        for (com.fasterxml.jackson.databind.JsonNode m : updated) {
            if (m.path("id").isNull() || m.path("id").isMissingNode()) {
                hasPendingItems = true;
                break;
            }
        }

        if (!hasPendingItems) {
            // Check if entity fields differ from live entity (set-cover changes have id!=null)
            // Check for set-cover: any item with id!=null has different isCover than entity_media
            String singularType = entityType.endsWith("s")
                ? entityType.substring(0, entityType.length() - 1) : entityType;
            List<EntityMedia> liveMedia = entityMediaMapper.selectList(
                new LambdaQueryWrapper<EntityMedia>()
                    .eq(EntityMedia::getEntityType, singularType)
                    .eq(EntityMedia::getEntityId, entityId));
            java.util.Map<Long, Integer> liveCoverMap = liveMedia.stream()
                .collect(java.util.stream.Collectors.toMap(
                    EntityMedia::getId, EntityMedia::getIsCover));
            boolean hasCoverChange = false;
            for (com.fasterxml.jackson.databind.JsonNode m : updated) {
                com.fasterxml.jackson.databind.JsonNode idNode = m.path("id");
                if (!idNode.isNull() && !idNode.isMissingNode()) {
                    Long mId = idNode.asLong();
                    int pendingCover = m.path("isCover").asInt(0);
                    Integer liveCover = liveCoverMap.get(mId);
                    if (liveCover != null && liveCover != pendingCover) {
                        hasCoverChange = true;
                        break;
                    }
                }
            }

            // Also check if non-media entity fields changed
            // Get live entity fields by removing the media key from pending root
            root.set("media", updated);
            Object liveEntity = pendingChangeService.readLiveEntityPublic(pluralType, entityId);
            com.fasterxml.jackson.databind.node.ObjectNode liveNode =
                objectMapper.valueToTree(liveEntity);
            liveNode.remove("media");
            com.fasterxml.jackson.databind.node.ObjectNode pendingWithoutMedia =
                root.deepCopy();
            pendingWithoutMedia.remove("media");
            boolean hasEntityChange = !pendingWithoutMedia.equals(liveNode);

            if (!hasCoverChange && !hasEntityChange) {
                pendingChangeMapper.deleteById(pc.getId());
                return Result.ok();
            }
        }

        root.set("media", updated);
        pc.setPendingData(objectMapper.writeValueAsString(root));
        pendingChangeMapper.updateById(pc);
    } catch (Exception e) {
        return Result.fail("操作失败，请重试");
    }
    return Result.ok();
}
```

**Note:** `deletePending` calls `pendingChangeService.readLiveEntityPublic()` — this requires exposing `readLiveEntity` as a package-visible method in `PendingChangeService` (see Step 4).

- [ ] **Step 4: Expose `readLiveEntity` in `PendingChangeService`**

In `PendingChangeService.java`, change `readLiveEntity` from `private` to package-private:

```java
// Change: private Object readLiveEntity(...)
// To:
Object readLiveEntity(String entityType, Long entityId) {
    // existing body unchanged
}
```

Add a public wrapper method for use by controllers:
```java
public Object readLiveEntityPublic(String entityType, Long entityId) {
    return readLiveEntity(entityType, entityId);
}
```

- [ ] **Step 5: Build backend and verify no compile errors**

```bash
cd /Users/wuchunlan/Desktop/project/international-medical/backend
./mvnw compile -q
```

Expected: BUILD SUCCESS

- [ ] **Step 6: Commit**

```bash
cd /Users/wuchunlan/Desktop/project/international-medical
git add backend/src/main/java/com/intlmedical/controller/hospitaladmin/HAMediaController.java
git add backend/src/main/java/com/intlmedical/service/PendingChangeService.java
git commit -m "feat(backend): split media delete paths; add combined media list with pending items"
```

---

### Task 2: Frontend — `MediaItem` type and `MediaUploadList` updates

**Files:**
- Modify: `frontend-admin/src/types/index.ts`
- Modify: `frontend-admin/src/components/MediaUploadList.tsx`

**Interfaces:**
- Consumes: `GET /api/hospital-admin/media` now returns `{ id: number | null, url, mediaType, isCover, sortOrder, status: 'approved' | 'pending_add' }[]`
- Consumes: `DELETE /api/hospital-admin/media/pending?entityType=...&entityId=...&url=...`

- [ ] **Step 1: Update `MediaItem` type in `types/index.ts`**

Replace the existing `MediaItem` interface:

```typescript
export interface MediaItem {
  id: number | null;   // null for pending_add items
  entityType: string;
  entityId: number;
  mediaType: 'image' | 'video';
  url: string;
  isCover: number;
  sortOrder: number;
  status?: 'approved' | 'pending_add';
}
```

- [ ] **Step 2: Add `handleDeletePending` and update render logic in `MediaUploadList.tsx`**

In `MediaUploadList.tsx`, add the handler after `handleDelete`:

```typescript
const handleDeletePending = async (url: string) => {
  try {
    await api.delete(`${mediaApiUrl}/pending`, {
      params: { entityType, entityId, url },
    });
    message.success('已取消');
    fetchMedia();
  } catch {
    message.error('操作失败');
  }
};
```

- [ ] **Step 3: Update item render to show status badge and conditional actions**

Replace the inner `items.map(...)` block (lines 144–211 in the current file) with:

```tsx
items.map((item) => (
  <div
    key={item.id != null ? item.id : `pending-${item.url}`}
    className={`media-item${item.isCover ? ' media-item--cover' : ''}${item.status === 'pending_add' ? ' media-item--pending' : ''}`}
  >
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

    <div className="media-item__info">
      <div className="media-item__type-tag">
        {item.mediaType === 'image' ? (
          <Tag icon={<PictureOutlined />} color="blue">图片</Tag>
        ) : (
          <Tag icon={<VideoCameraOutlined />} color="purple">视频</Tag>
        )}
        {item.isCover === 1 && (
          <span className="media-item__cover-badge">★ 主图</span>
        )}
        {item.status === 'pending_add' && (
          <Tag color="orange" style={{ marginLeft: 4 }}>待审核</Tag>
        )}
      </div>
      <div className="media-item__url">{item.url}</div>
    </div>

    <div className="media-item__btns">
      {item.status !== 'pending_add' && item.isCover !== 1 && (
        <Tooltip title="设为主图">
          <Button
            type="text"
            size="small"
            icon={<StarOutlined />}
            onClick={() => handleSetCover(item.id as number)}
          />
        </Tooltip>
      )}
      {item.status !== 'pending_add' && item.isCover === 1 && (
        <Tooltip title="当前主图">
          <Button
            type="text"
            size="small"
            icon={<StarFilled style={{ color: '#faad14' }} />}
            disabled
          />
        </Tooltip>
      )}
      <Tooltip title={item.status === 'pending_add' ? '取消上传' : '删除'}>
        <Button
          type="text"
          size="small"
          danger
          icon={<DeleteOutlined />}
          onClick={() =>
            item.status === 'pending_add'
              ? handleDeletePending(item.url)
              : handleDelete(item.id as number)
          }
        />
      </Tooltip>
    </div>
  </div>
))
```

- [ ] **Step 4: Build frontend and check for TypeScript errors**

```bash
cd /Users/wuchunlan/Desktop/project/international-medical/frontend-admin
npm run build 2>&1 | tail -20
```

Expected: no TypeScript errors. If `item.id` as `number` causes type errors on the admin path (where `id` is always `number`), the cast `item.id as number` in `handleSetCover` and `handleDelete` calls is correct because those buttons are only shown when `status !== 'pending_add'`.

- [ ] **Step 5: Commit**

```bash
cd /Users/wuchunlan/Desktop/project/international-medical
git add frontend-admin/src/types/index.ts
git add frontend-admin/src/components/MediaUploadList.tsx
git commit -m "feat(frontend): show pending_add media items in MediaUploadList with status badge"
```

---

### Task 3: Frontend — `ReviewerPendingPage` media thumbnails

**Files:**
- Modify: `frontend-admin/src/pages/Reviewer/ReviewerPendingPage.tsx`

**Interfaces:**
- Consumes: `selectedItem.data` (type `Record<string, unknown>`) may contain a `media` array field from `pending_data`

- [ ] **Step 1: Add `'media'` to `SKIP_KEYS`**

In `ReviewerPendingPage.tsx`, find the line:
```typescript
const SKIP_KEYS = ['id', 'hospitalId', 'auditStatus', 'rejectionReason',
                   'createdAt', 'updatedAt', 'hasPendingEdit']
```

Replace with:
```typescript
const SKIP_KEYS = ['id', 'hospitalId', 'auditStatus', 'rejectionReason',
                   'createdAt', 'updatedAt', 'hasPendingEdit', 'media']
```

- [ ] **Step 2: Add `PendingMediaSection` component**

Add this component definition after the `EntityFields` component (after line 50):

```tsx
const PendingMediaSection: React.FC<{ data: Record<string, unknown> | null | undefined }> = ({ data }) => {
  if (!data) return null
  const media = data.media as Array<{
    id?: number | null
    url: string
    mediaType: string
    isCover?: number
  }> | undefined
  if (!Array.isArray(media) || media.length === 0) return null
  return (
    <div style={{ marginTop: 16 }}>
      <Typography.Title level={5} style={{ marginBottom: 8 }}>媒体文件</Typography.Title>
      <Image.PreviewGroup>
        <Space wrap size={8}>
          {media.map((m, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              {m.mediaType === 'image' ? (
                <Image
                  src={m.url}
                  width={100}
                  height={70}
                  style={{ objectFit: 'cover', borderRadius: 4 }}
                />
              ) : (
                <video
                  src={m.url}
                  width={100}
                  height={70}
                  style={{ objectFit: 'cover', borderRadius: 4, display: 'block' }}
                />
              )}
              <div style={{ marginTop: 4 }}>
                {m.isCover === 1 && <Tag color="gold">主图</Tag>}
                {(m.id === null || m.id === undefined) && <Tag color="orange">新上传</Tag>}
              </div>
            </div>
          ))}
        </Space>
      </Image.PreviewGroup>
    </div>
  )
}
```

Also add `Image` to antd imports (it may already be imported — check and add if missing).

- [ ] **Step 3: Wire `PendingMediaSection` into the detail modal**

Find the detail modal rendering block (around line 457). There are two branches:

**Branch A — `isEdit=true` (two-column diff):** append `PendingMediaSection` after the right column's `EntityFields`:

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

**Branch B — `isEdit=false` (new record, uses `renderDetail`):** append after `renderDetail(...)`:

```tsx
{renderDetail(detailModal.type, selectedItem.data as DetailRecord, hospitalMap)}
<PendingMediaSection data={selectedItem.data as Record<string, unknown>} />
```

- [ ] **Step 4: Build and verify TypeScript**

```bash
cd /Users/wuchunlan/Desktop/project/international-medical/frontend-admin
npm run build 2>&1 | tail -20
```

Expected: BUILD SUCCESS with no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
cd /Users/wuchunlan/Desktop/project/international-medical
git add frontend-admin/src/pages/Reviewer/ReviewerPendingPage.tsx
git commit -m "feat(frontend): render media thumbnails in reviewer pending detail modal"
```

---

### Task 4: Manual smoke test

No automated tests are written for this — these are UI-dependent flows. Verify manually:

- [ ] **HA side — upload shows in list:**
  1. Log in as HA, go to 我的医院 → 轮播图片/视频
  2. Upload an image
  3. After upload completes, list should show the image with orange "待审核" tag
  4. The approved items (if any) still show without the tag

- [ ] **HA side — cancel pending upload:**
  1. With a "待审核" item visible, click the delete (trash) button on it
  2. The item disappears from the list
  3. If it was the only pending item and no other entity fields were changed, no pending badge on hospital card

- [ ] **HA side — delete approved item:**
  1. Click delete on an "approved" (no tag) item
  2. Item disappears immediately, no audit flow triggered

- [ ] **Reviewer side — media thumbnails visible:**
  1. Log in as reviewer, go to 待审核内容 → 医院 tab
  2. Click any hospital pending item to open detail modal
  3. If `pending_data` has a `media` array, thumbnails render at the bottom
  4. New uploads (id=null) show "新上传" tag; isCover=1 items show "主图" tag

- [ ] **Final commit if all smoke tests pass:**

```bash
cd /Users/wuchunlan/Desktop/project/international-medical
git log --oneline -5
```

Verify the 3 commits from Tasks 1–3 are present.
