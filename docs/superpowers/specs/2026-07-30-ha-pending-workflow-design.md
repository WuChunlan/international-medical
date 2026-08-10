# HA Pending Workflow 设计规范

**日期：** 2026-07-30  
**状态：** 已确认，待实现

---

## 背景

医院管理员（HA）需要对医院信息及其下属数据（医生、设备、环境、案例、产品）进行新增和编辑，所有变更必须经审核员（Reviewer）审批后才能生效。本文档描述该审批流程的完整业务逻辑与实现规范。

---

## 业务规则总结

| 操作 | 路径 |
|------|------|
| HA 创建医院 | 直接 INSERT `hospitals`（status=pending），同时 INSERT `pending_changes`（entityId=医院id）→ Reviewer 审批 |
| HA 创建其他实体（医生/设备/环境/案例/产品） | 仅 INSERT `pending_changes`（entityId=NULL）→ Reviewer 审批 → 审批通过后 INSERT 实体表 |
| HA 编辑任意已存在实体（含图片/媒体）| INSERT/UPDATE `pending_changes`（entityId=实体id）→ Reviewer 审批 → 审批通过后 UPDATE 实体表 |
| HA 对医院图片（banner/封面）的增/改 | 同上，走 `submitMediaEdit` → `pending_changes` → 审批通过后写入 `entity_media` |

---

## Section 1：数据库 Schema 变更

```sql
-- 1. entity_id 改为可空（新增草稿在审批前 entity_id=NULL）
ALTER TABLE pending_changes
  MODIFY COLUMN entity_id BIGINT UNSIGNED NULL;

-- 2. 新增 hospital_id 列，用于 HA 列表按医院过滤新增草稿
ALTER TABLE pending_changes
  ADD COLUMN hospital_id BIGINT UNSIGNED NULL
  AFTER entity_id;
```

**唯一索引 `uk_entity(entity_type, entity_id)` 无需改动。**  
MySQL 对 UNIQUE 索引中的 NULL 视为互不相等，多条 entity_id=NULL 的记录可以共存，现有约束仍保证"每个实体最多一条待审编辑"。

### pending_changes 字段语义

| 场景 | entity_id | hospital_id |
|------|-----------|-------------|
| 新增草稿（doctor/equipment/env/case/product） | NULL | HA 的 hospital_id |
| 医院首次创建 | hospitals.id（已存在） | hospitals.id |
| 编辑已有实体 | 实体 id | HA 的 hospital_id |

---

## Section 2：PendingChange 实体与 Mapper

### PendingChange.java 新增字段

```java
private Long hospitalId;
```

### PendingChangeMapper.java 变更

```java
// 保留（不变）
@Select("SELECT * FROM pending_changes WHERE entity_type = #{entityType} AND entity_id = #{entityId}")
PendingChange selectByEntity(@Param("entityType") String entityType, @Param("entityId") Long entityId);

// 保留（不变）
@Select("SELECT * FROM pending_changes WHERE entity_type = #{entityType} AND audit_status = 'pending'")
List<PendingChange> selectPendingByType(@Param("entityType") String entityType);

// 新增：HA 列表用，按 hospital_id 过滤新增草稿（含 pending 和 rejected）
@Select("SELECT * FROM pending_changes WHERE entity_type = #{entityType} AND entity_id IS NULL AND hospital_id = #{hospitalId}")
List<PendingChange> selectNewDraftsByTypeAndHospital(@Param("entityType") String entityType, @Param("hospitalId") Long hospitalId);

// 修改（原 selectNewDraftsByType）：Reviewer 用，查所有新增草稿（pending + rejected）
@Select("SELECT * FROM pending_changes WHERE entity_type = #{entityType} AND entity_id IS NULL AND audit_status IN ('pending','rejected')")
List<PendingChange> selectAllNewDrafts(@Param("entityType") String entityType);
```

---

## Section 3：HA 列表 — 合并新增草稿

### 后端返回结构

所有 HA 列表接口（`/api/hospital-admin/{doctors|equipments|environments|cases|products}`）的 GET 返回从 `IPage<T>` 改为 `HAListResult<T>`：

```java
record HAListResult<T>(
    List<T> records,           // 已存在的实体（分页）
    long total,                // 分页 total（仅 records 部分）
    int current,
    int size,
    List<PendingDraft> drafts  // 新增草稿（entityId=NULL，按 hospital_id 过滤）
)

record PendingDraft(
    Long pendingChangeId,
    Object data,              // 反序列化的实体 JSON
    String auditStatus,       // "pending" 或 "rejected"
    String rejectionReason
)
```

**查询逻辑：**
1. 分页查询实体表（不变）
2. `selectNewDraftsByTypeAndHospital(entityType, hospitalId)` 查 pending + rejected 草稿
3. 反序列化草稿 JSON，组装 `PendingDraft` 列表
4. 一并返回

**新增"重新提交"接口：**
```
PUT /api/hospital-admin/{doctors|equipments|environments|cases|products}/drafts/{pcId}
```
HA 修改被驳回的新增草稿后调用此接口，服务端更新 `pending_data` 并将 `audit_status` 重置为 `pending`。

### 前端 HA 列表页变更（以 HADoctorsPage 为例）

- `drafts` 条目在表格顶部展示，rowKey 用 `pending-{pendingChangeId}`
- auditStatus=pending → 橙色标签"新增待审核"
- auditStatus=rejected → 红色标签"新增已驳回" + 显示 rejectionReason + "重新提交"按钮
- 已存在实体的 `hasPendingEdit` 橙色标签逻辑不变
- 前端 `types/index.ts` 新增 `HAListResult` 和 `PendingDraft` 类型

---

## Section 4：PendingChangeService 变更

### 所有 submit* 方法加 hospitalId 参数

```java
// 新增草稿（entityId=null）
void submitNewDraft(String entityType, Object entityData,
                    Long hospitalId, Long submittedBy)

// 医院首次创建（entityId 已知）
void submitNewDraftWithEntityId(String entityType, Object entityData,
                                 Long entityId, Long hospitalId, Long submittedBy)

// 编辑已有实体
void submitEdit(String entityType, Long entityId,
                Object entityData, Long hospitalId, Long submittedBy)

// 媒体编辑（add / set-cover / delete）
void submitMediaEdit(String entityType, Long entityId,
                     String action, EntityMedia newMedia, Long targetId,
                     Long hospitalId, Long submittedBy)
```

所有方法内 `pc.setHospitalId(hospitalId)` 写入。

### HAHospitalController.create 改为事务

移除现有 try/catch 吞异常的写法，将 hospital INSERT + pending_changes INSERT 包进同一个 `@Transactional` 方法（新增私有事务方法或在 service 层）。如果 pending_changes 插入失败，整个事务回滚，HA 看到明确错误。

### HA 各 Controller 调用方更新

所有调用 `submitNewDraft` / `submitEdit` / `submitMediaEdit` 的地方，传入 `SecurityUtil.getCurrentHospitalId()` 作为 `hospitalId`。

---

## Section 5：Reviewer 端变更

### ReviewerController pending* 接口

各接口中 `selectNewDraftsByType` 替换为 `selectAllNewDrafts`（含 pending + rejected），让 Reviewer 也能看到已被驳回但尚未重新提交的草稿（便于追踪）。

HA 重新提交后 status 重置为 pending，会重新出现在 Reviewer 列表中。

**批准/驳回逻辑不变：**  
- `approve-draft/{type}/{pcId}`：`applyApproval` 中 entityId=null 时走 `insertNewEntity`，审批后写入实体表并更新 `pending_changes.entity_id`
- `reject-draft/{type}/{pcId}`：`applyRejection` 设置 status=rejected + rejectionReason

---

## 影响范围

| 文件 | 变更类型 |
|------|---------|
| `db/data.sql` | DDL：entity_id 可空，加 hospital_id 列 |
| `entity/PendingChange.java` | 加 hospitalId 字段 |
| `mapper/PendingChangeMapper.java` | 新增/修改查询方法 |
| `service/PendingChangeService.java` | 所有 submit* 方法加 hospitalId 参数 |
| `controller/hospitaladmin/HAHospitalController.java` | create 改为事务，提交 pending_changes 时传 hospitalId |
| `controller/hospitaladmin/HADoctorController.java` | list 返回 HAListResult；create/update/drafts 接口更新 |
| `controller/hospitaladmin/HAEquipmentController.java` | 同上 |
| `controller/hospitaladmin/HAEnvironmentController.java` | 同上 |
| `controller/hospitaladmin/HACaseController.java` | 同上 |
| `controller/hospitaladmin/HAProductController.java` | 同上 |
| `controller/hospitaladmin/HAMediaController.java` | submitMediaEdit 传 hospitalId |
| `controller/reviewer/ReviewerController.java` | selectNewDraftsByType → selectAllNewDrafts |
| `frontend-admin/src/types/index.ts` | 新增 HAListResult、PendingDraft 类型 |
| `frontend-admin/src/pages/HospitalAdmin/HA*Page.tsx` | 列表合并草稿；重新提交逻辑 |
