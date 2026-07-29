# HA Edit Audit (Shadow Copy) Design

**Date:** 2026-07-29  
**Scope:** backend, frontend-admin (Reviewer + all 6 HA pages)

---

## Background

When a hospital admin (HA) edits an already-approved record, the current code
overwrites the live row and sets `audit_status = 'pending'`, immediately hiding
the approved data from the public site until re-approved.

This spec adds a **shadow copy** mechanism: HA edits are staged in a
`pending_changes` table while the live row stays untouched. On reviewer
approval the staged data is applied to the live row.

Scope: all 6 HA-managed entity types — hospitals, doctors, equipments,
environments, cases, products.  
Delete operations are NOT in scope (delete remains direct).  
HA create operations are NOT changed (first-time creates continue to write
directly to the live table as `pending`).

---

## 1. Database Schema

### New table: `pending_changes`

```sql
CREATE TABLE pending_changes (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  entity_type      ENUM('hospitals','doctors','equipments',
                        'environments','cases','products') NOT NULL,
  entity_id        BIGINT UNSIGNED NOT NULL,
  pending_data     JSON NOT NULL,
  submitted_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  submitted_by     BIGINT UNSIGNED NOT NULL,
  audit_status     ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  rejection_reason TEXT DEFAULT NULL,
  reviewed_at      DATETIME DEFAULT NULL,
  reviewed_by      BIGINT UNSIGNED DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_entity (entity_type, entity_id),
  KEY idx_status (audit_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

The `UNIQUE KEY uk_entity` ensures only one pending change per entity at a
time. If the HA edits again while a change is pending, the row is replaced
via upsert (`INSERT ... ON DUPLICATE KEY UPDATE`).

No changes to any existing table.

---

## 2. `pending_data` JSON Snapshot Format

The JSON captures all mutable fields of the entity. Fields excluded from
the snapshot: `id`, `hospitalId`, `auditStatus`, `rejectionReason`,
`isActive`, `createdAt`, `updatedAt`.

All entity types include a `media` array capturing the desired
`entity_media` rows after approval.

### hospitals

```json
{
  "nameZh": "...", "nameEn": "...",
  "introZh": "...", "introEn": "...",
  "coverImageUrl": "...",
  "addressZh": "...", "addressEn": "...",
  "phone": "...", "contactPerson": "...", "contactInfo": "...",
  "sortOrder": 0,
  "media": [{ "url": "...", "mediaType": "image", "isCover": true, "sortOrder": 0 }]
}
```

### doctors

```json
{
  "nameZh": "...", "nameEn": "...",
  "specialtyZh": "...", "specialtyEn": "...",
  "bioZh": "...", "bioEn": "...",
  "photoUrl": "...",
  "pricePerVisit": 500.00,
  "titleZh": "...", "titleEn": "...",
  "sortOrder": 0,
  "media": []
}
```

### equipments

```json
{
  "nameZh": "...", "nameEn": "...",
  "descZh": "...", "descEn": "...",
  "imageUrl": "...",
  "sortOrder": 0,
  "media": []
}
```

### environments

```json
{
  "nameZh": "...", "nameEn": "...",
  "descZh": "...", "descEn": "...",
  "imageUrl": "...",
  "sortOrder": 0,
  "media": []
}
```

### cases

```json
{
  "titleZh": "...", "titleEn": "...",
  "summaryZh": "...", "summaryEn": "...",
  "detailZh": "...", "detailEn": "...",
  "coverImageUrl": "...",
  "sortOrder": 0,
  "media": []
}
```

### products

```json
{
  "nameZh": "...", "nameEn": "...",
  "summaryZh": "...", "summaryEn": "...",
  "detailZh": "...", "detailEn": "...",
  "coverImageUrl": "...",
  "priceMin": 1000.00, "priceMax": 5000.00,
  "contactPerson": "...", "contactInfo": "...",
  "sortOrder": 0,
  "media": [{ "url": "...", "mediaType": "image", "isCover": true, "sortOrder": 0 }],
  "variants": [
    { "nameZh": "套餐A", "nameEn": "Plan A", "descZh": "...", "descEn": "...",
      "price": 2000.00, "sortOrder": 0, "isActive": 1 }
  ]
}
```

For products, `variants` is always present (empty array if none). On
approval, ALL existing `product_variants` rows for the product are deleted
and re-inserted from the snapshot.

---

## 3. Data Flow

### HA Edit (the critical change)

```
PUT /api/hospital-admin/{type}/{id}
        │
        ├─ existing.auditStatus == "approved"
        │       → serialize request body to JSON snapshot
        │       → upsert pending_changes (entity_type, entity_id)
        │       → live table NOT modified
        │       → return 200 ok
        │
        └─ existing.auditStatus == "pending" or "rejected"
                → current behavior: overwrite live table, set auditStatus="pending"
                  (record was never publicly visible; no live version to preserve)
```

### HA Create (unchanged)

Direct insert to live table with `auditStatus = "pending"`. No
`pending_changes` row is created.

### Reviewer Pending List

Two sources are merged per entity type:

| Source | What it represents |
|--------|--------------------|
| Live table rows with `audit_status = 'pending'` | New records (first-time creates) |
| `pending_changes` rows with `audit_status = 'pending'` | Edits to approved records |

The merged list is returned by `GET /api/reviewer/pending/{type}`.  
Each item carries a boolean `isEdit` flag (`true` for pending_changes rows).  
Edit items also carry a `currentData` field containing the current live row
so the reviewer can compare old vs new.

### Reviewer Approve

```
PUT /api/reviewer/approve/{type}/{id}
        │
        ├─ pending_changes row exists for (type, id)?
        │       YES → applyPendingChange():
        │               1. deserialize pending_data JSON
        │               2. update live table columns
        │               3. delete + reinsert entity_media rows
        │               4. (products only) delete + reinsert product_variants
        │               5. set live row audit_status = "approved"
        │               6. delete pending_changes row
        │
        └─ NO (new record) → current behavior:
                set live row audit_status = "approved"
```

### Reviewer Reject

```
PUT /api/reviewer/reject/{type}/{id}
        │
        ├─ pending_changes row exists?
        │       YES → set pending_changes.audit_status = "rejected",
        │              write rejection_reason into pending_changes
        │              live table NOT modified
        │
        └─ NO → current behavior:
                set live row audit_status = "rejected", write rejection_reason
```

---

## 4. Backend Files

### New files

**`PendingChange.java`** — entity for `pending_changes` table

```java
@Data
@TableName("pending_changes")
public class PendingChange {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String entityType;
    private Long entityId;
    private String pendingData;          // raw JSON string
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime submittedAt;
    private Long submittedBy;
    private String auditStatus;          // "pending" | "approved" | "rejected"
    private String rejectionReason;
    private LocalDateTime reviewedAt;
    private Long reviewedBy;
}
```

**`PendingChangeMapper.java`**

```java
@Mapper
public interface PendingChangeMapper extends BaseMapper<PendingChange> {
    @Select("SELECT * FROM pending_changes WHERE entity_type = #{entityType} AND entity_id = #{entityId}")
    PendingChange selectByEntity(@Param("entityType") String entityType,
                                 @Param("entityId") Long entityId);

    @Select("SELECT * FROM pending_changes WHERE entity_type = #{entityType} AND audit_status = 'pending'")
    List<PendingChange> selectPendingByType(@Param("entityType") String entityType);
}
```

**`PendingChangeService.java`** — core logic

```java
@Service
@RequiredArgsConstructor
public class PendingChangeService {

    private final PendingChangeMapper pendingChangeMapper;
    private final HospitalMapper hospitalMapper;
    private final DoctorMapper doctorMapper;
    private final EquipmentMapper equipmentMapper;
    private final HospitalEnvironmentMapper environmentMapper;
    private final CaseMapper caseMapper;
    private final SpecialProductMapper productMapper;
    private final EntityMediaMapper entityMediaMapper;
    private final ProductVariantMapper variantMapper;
    private final ObjectMapper objectMapper;   // Spring's Jackson ObjectMapper

    /** Called by HA update endpoints when entity is 'approved'. */
    public void submitEdit(String entityType, Long entityId,
                           Object entityData, Long submittedBy) throws JsonProcessingException {
        String json = objectMapper.writeValueAsString(entityData);
        PendingChange pc = pendingChangeMapper.selectByEntity(entityType, entityId);
        if (pc == null) {
            pc = new PendingChange();
            pc.setEntityType(entityType);
            pc.setEntityId(entityId);
        }
        pc.setPendingData(json);
        pc.setSubmittedBy(submittedBy);
        pc.setAuditStatus("pending");
        pc.setRejectionReason(null);
        pc.setReviewedAt(null);
        pc.setReviewedBy(null);
        if (pc.getId() == null) {
            pendingChangeMapper.insert(pc);
        } else {
            pendingChangeMapper.updateById(pc);
        }
    }

    /** Called by ReviewerController.approve when a pending_changes row exists. */
    @Transactional
    public void applyApproval(String entityType, Long entityId,
                              PendingChange pc, Long reviewerId) throws JsonProcessingException {
        JsonNode data = objectMapper.readTree(pc.getPendingData());
        switch (entityType) {
            case "hospitals"    -> applyHospital(entityId, data);
            case "doctors"      -> applyDoctor(entityId, data);
            case "equipments"   -> applyEquipment(entityId, data);
            case "environments" -> applyEnvironment(entityId, data);
            case "cases"        -> applyCase(entityId, data);
            case "products"     -> applyProduct(entityId, data);
        }
        // Set live row to approved
        setLiveAuditStatus(entityType, entityId, "approved", null);
        // Apply media changes
        applyMedia(entityType, entityId, data);
        // Delete pending_changes row
        pendingChangeMapper.deleteById(pc.getId());
    }

    /** Called by ReviewerController.reject when a pending_changes row exists. */
    public void applyRejection(PendingChange pc, String reason, Long reviewerId) {
        pc.setAuditStatus("rejected");
        pc.setRejectionReason(reason);
        pc.setReviewedAt(LocalDateTime.now());
        pc.setReviewedBy(reviewerId);
        pendingChangeMapper.updateById(pc);
    }

    private void applyHospital(Long id, JsonNode d) {
        Hospital h = hospitalMapper.selectById(id);
        h.setNameZh(d.path("nameZh").asText(h.getNameZh()));
        h.setNameEn(d.path("nameEn").asText(h.getNameEn()));
        h.setIntroZh(d.path("introZh").asText(null));
        h.setIntroEn(d.path("introEn").asText(null));
        h.setCoverImageUrl(d.path("coverImageUrl").asText(null));
        h.setAddressZh(d.path("addressZh").asText(null));
        h.setAddressEn(d.path("addressEn").asText(null));
        h.setPhone(d.path("phone").asText(null));
        h.setContactPerson(d.path("contactPerson").asText(null));
        h.setContactInfo(d.path("contactInfo").asText(null));
        h.setSortOrder(d.path("sortOrder").asInt(0));
        hospitalMapper.updateById(h);
    }

    private void applyDoctor(Long id, JsonNode d) {
        Doctor dr = doctorMapper.selectById(id);
        dr.setNameZh(d.path("nameZh").asText(dr.getNameZh()));
        dr.setNameEn(d.path("nameEn").asText(dr.getNameEn()));
        dr.setSpecialtyZh(d.path("specialtyZh").asText(null));
        dr.setSpecialtyEn(d.path("specialtyEn").asText(null));
        dr.setBioZh(d.path("bioZh").asText(null));
        dr.setBioEn(d.path("bioEn").asText(null));
        dr.setPhotoUrl(d.path("photoUrl").asText(null));
        BigDecimal price = d.path("pricePerVisit").isMissingNode() ? null
            : new BigDecimal(d.path("pricePerVisit").asText("0"));
        dr.setPricePerVisit(price);
        dr.setTitleZh(d.path("titleZh").asText(null));
        dr.setTitleEn(d.path("titleEn").asText(null));
        dr.setSortOrder(d.path("sortOrder").asInt(0));
        doctorMapper.updateById(dr);
    }

    private void applyEquipment(Long id, JsonNode d) {
        Equipment eq = equipmentMapper.selectById(id);
        eq.setNameZh(d.path("nameZh").asText(eq.getNameZh()));
        eq.setNameEn(d.path("nameEn").asText(eq.getNameEn()));
        eq.setDescZh(d.path("descZh").asText(null));
        eq.setDescEn(d.path("descEn").asText(null));
        eq.setImageUrl(d.path("imageUrl").asText(null));
        eq.setSortOrder(d.path("sortOrder").asInt(0));
        equipmentMapper.updateById(eq);
    }

    private void applyEnvironment(Long id, JsonNode d) {
        HospitalEnvironment env = environmentMapper.selectById(id);
        env.setNameZh(d.path("nameZh").asText(env.getNameZh()));
        env.setNameEn(d.path("nameEn").asText(env.getNameEn()));
        env.setDescZh(d.path("descZh").asText(null));
        env.setDescEn(d.path("descEn").asText(null));
        env.setImageUrl(d.path("imageUrl").asText(null));
        env.setSortOrder(d.path("sortOrder").asInt(0));
        environmentMapper.updateById(env);
    }

    private void applyCase(Long id, JsonNode d) {
        Case c = caseMapper.selectById(id);
        c.setTitleZh(d.path("titleZh").asText(c.getTitleZh()));
        c.setTitleEn(d.path("titleEn").asText(c.getTitleEn()));
        c.setSummaryZh(d.path("summaryZh").asText(null));
        c.setSummaryEn(d.path("summaryEn").asText(null));
        c.setDetailZh(d.path("detailZh").asText(null));
        c.setDetailEn(d.path("detailEn").asText(null));
        c.setCoverImageUrl(d.path("coverImageUrl").asText(null));
        c.setSortOrder(d.path("sortOrder").asInt(0));
        caseMapper.updateById(c);
    }

    private void applyProduct(Long id, JsonNode d) {
        SpecialProduct p = productMapper.selectById(id);
        p.setNameZh(d.path("nameZh").asText(p.getNameZh()));
        p.setNameEn(d.path("nameEn").asText(p.getNameEn()));
        p.setSummaryZh(d.path("summaryZh").asText(null));
        p.setSummaryEn(d.path("summaryEn").asText(null));
        p.setDetailZh(d.path("detailZh").asText(null));
        p.setDetailEn(d.path("detailEn").asText(null));
        p.setCoverImageUrl(d.path("coverImageUrl").asText(null));
        BigDecimal priceMin = d.path("priceMin").isMissingNode() ? null
            : new BigDecimal(d.path("priceMin").asText("0"));
        BigDecimal priceMax = d.path("priceMax").isMissingNode() ? null
            : new BigDecimal(d.path("priceMax").asText("0"));
        p.setPriceMin(priceMin);
        p.setPriceMax(priceMax);
        p.setContactPerson(d.path("contactPerson").asText(null));
        p.setContactInfo(d.path("contactInfo").asText(null));
        p.setSortOrder(d.path("sortOrder").asInt(0));
        productMapper.updateById(p);
        // Replace variants
        variantMapper.delete(new LambdaQueryWrapper<ProductVariant>()
            .eq(ProductVariant::getProductId, id));
        JsonNode variants = d.path("variants");
        if (variants.isArray()) {
            for (JsonNode v : variants) {
                ProductVariant pv = new ProductVariant();
                pv.setProductId(id);
                pv.setNameZh(v.path("nameZh").asText(""));
                pv.setNameEn(v.path("nameEn").asText(""));
                pv.setDescZh(v.path("descZh").asText(null));
                pv.setDescEn(v.path("descEn").asText(null));
                BigDecimal price = v.path("price").isMissingNode() ? null
                    : new BigDecimal(v.path("price").asText("0"));
                pv.setPrice(price);
                pv.setSortOrder(v.path("sortOrder").asInt(0));
                pv.setIsActive(v.path("isActive").asInt(1));
                variantMapper.insert(pv);
            }
        }
    }

    private void applyMedia(String entityType, Long entityId, JsonNode d) {
        JsonNode mediaNode = d.path("media");
        if (!mediaNode.isArray()) return;
        entityMediaMapper.delete(new LambdaQueryWrapper<EntityMedia>()
            .eq(EntityMedia::getEntityType, entityType)
            .eq(EntityMedia::getEntityId, entityId));
        for (JsonNode m : mediaNode) {
            EntityMedia em = new EntityMedia();
            em.setEntityType(entityType);
            em.setEntityId(entityId);
            em.setUrl(m.path("url").asText(""));
            em.setMediaType(m.path("mediaType").asText("image"));
            em.setIsCover(m.path("isCover").asInt(0));
            em.setSortOrder(m.path("sortOrder").asInt(0));
            entityMediaMapper.insert(em);
        }
    }

    private void setLiveAuditStatus(String entityType, Long entityId,
                                     String status, String reason) {
        // Same switch logic as ReviewerController.updateAuditStatus
        switch (entityType) {
            case "hospitals"    -> hospitalMapper.update(null,
                new LambdaUpdateWrapper<Hospital>()
                    .eq(Hospital::getId, entityId)
                    .set(Hospital::getAuditStatus, status)
                    .set(Hospital::getRejectionReason, reason));
            case "doctors"      -> doctorMapper.update(null,
                new LambdaUpdateWrapper<Doctor>()
                    .eq(Doctor::getId, entityId)
                    .set(Doctor::getAuditStatus, status)
                    .set(Doctor::getRejectionReason, reason));
            case "equipments"   -> equipmentMapper.update(null,
                new LambdaUpdateWrapper<Equipment>()
                    .eq(Equipment::getId, entityId)
                    .set(Equipment::getAuditStatus, status)
                    .set(Equipment::getRejectionReason, reason));
            case "environments" -> environmentMapper.update(null,
                new LambdaUpdateWrapper<HospitalEnvironment>()
                    .eq(HospitalEnvironment::getId, entityId)
                    .set(HospitalEnvironment::getAuditStatus, status)
                    .set(HospitalEnvironment::getRejectionReason, reason));
            case "cases"        -> caseMapper.update(null,
                new LambdaUpdateWrapper<Case>()
                    .eq(Case::getId, entityId)
                    .set(Case::getAuditStatus, status)
                    .set(Case::getRejectionReason, reason));
            case "products"     -> productMapper.update(null,
                new LambdaUpdateWrapper<SpecialProduct>()
                    .eq(SpecialProduct::getId, entityId)
                    .set(SpecialProduct::getAuditStatus, status)
                    .set(SpecialProduct::getRejectionReason, reason));
        }
    }
}
```

### Modified files

**6 HA update methods** — pattern (same for all 6 controllers):

```java
// BEFORE (example: HADoctorController.update)
doctor.setId(id);
doctor.setHospitalId(hospitalId);
doctor.setAuditStatus("pending");
doctor.setRejectionReason(null);
doctorMapper.updateById(doctor);
return Result.ok();

// AFTER
Doctor existing = doctorMapper.selectById(id);
if ("approved".equals(existing.getAuditStatus())) {
    Long userId = SecurityUtil.getCurrentUserId();
    pendingChangeService.submitEdit("doctors", id, doctor, userId);
} else {
    doctor.setId(id);
    doctor.setHospitalId(hospitalId);
    doctor.setAuditStatus("pending");
    doctor.setRejectionReason(null);
    doctorMapper.updateById(doctor);
}
return Result.ok();
```

Note: `HAHospitalController.update` does not have an `existing` lookup yet —
one must be added. The hospital is always a single row per HA, so the
`hospitalId` from the token is used as `entityId`.

**`ReviewerController`** — 3 methods changed:

1. `GET /api/reviewer/pending/{type}` — new merged response shape:
   ```java
   @GetMapping("/pending/{type}")
   public Result<List<PendingItem>> pending(@PathVariable String type) { ... }

   // PendingItem DTO:
   public record PendingItem(
       Object data,        // the entity or pending_data deserialized
       boolean isEdit,     // true = pending_changes row, false = new record
       Object currentData  // non-null only when isEdit=true (current live row)
   ) {}
   ```
   Each tab in the reviewer frontend uses a single endpoint per type.
   The existing per-type GET endpoints (`/pending/hospitals`, etc.) are
   refactored to use the new `pending/{type}` route.

2. `PUT /api/reviewer/approve/{type}/{id}`:
   ```java
   PendingChange pc = pendingChangeMapper.selectByEntity(type, id);
   if (pc != null) {
       pendingChangeService.applyApproval(type, id, pc, reviewerId);
   } else {
       updateAuditStatus(type, id, "approved", null);  // existing logic
   }
   ```

3. `PUT /api/reviewer/reject/{type}/{id}`:
   ```java
   PendingChange pc = pendingChangeMapper.selectByEntity(type, id);
   if (pc != null) {
       pendingChangeService.applyRejection(pc, req.getReason(), reviewerId);
   } else {
       updateAuditStatus(type, id, "rejected", req.getReason());  // existing logic
   }
   ```

---

## 5. API Contract Changes

### `GET /api/reviewer/pending/{type}`

**Before:** returns `List<EntityType>` from the live table.

**After:** returns `List<PendingItem>`:

```json
[
  {
    "data": { /* entity fields */ },
    "isEdit": false,
    "currentData": null
  },
  {
    "data": { /* pending_data fields */ },
    "isEdit": true,
    "currentData": { /* current live row fields */ }
  }
]
```

HA list endpoints (`GET /api/hospital-admin/{type}`) add a `hasPendingEdit`
boolean to each item. This requires the HA list queries to LEFT JOIN (or
separate query) against `pending_changes`:

```java
// Option: bulk fetch pending entity IDs after the list query
Set<Long> pendingIds = pendingChangeMapper.selectPendingByType("doctors")
    .stream().map(PendingChange::getEntityId).collect(toSet());
// Attach hasPendingEdit = pendingIds.contains(entity.getId()) to each item
```

The HA list response wraps each entity in a DTO:

```json
{
  "id": 1,
  "nameZh": "张医生",
  ...
  "hasPendingEdit": true
}
```

Since all 6 HA entity types are paginated `IPage` responses, the simplest
approach is to add `hasPendingEdit` as a `@Transient` (non-DB) field to
each entity class, populated in the controller before returning.

---

## 6. Frontend Changes

### `frontend-admin` — HA management pages (6 pages)

Each entity list row adds a new badge alongside the existing `StatusTag`:

```tsx
{record.hasPendingEdit && (
  <Tag color="orange">编辑待审核</Tag>
)}
```

The edit button remains functional regardless of `hasPendingEdit`. Submitting
a new edit while one is pending simply replaces it (backend upsert).

### `frontend-admin` — `ReviewerPendingPage.tsx`

Two changes:

1. **List table**: add an "编辑" tag in each row where `isEdit === true`.
   ```tsx
   { title: '类型', render: (_, r) => r.isEdit ? <Tag color="orange">编辑</Tag> : <Tag>新建</Tag> }
   ```

2. **Detail modal**: when `isEdit === true`, show a two-column diff layout:
   - Left column: "当前已审核" — rendered from `currentData`
   - Right column: "申请修改为" — rendered from `data`
   - Changed fields are highlighted with a light yellow background
   - When `isEdit === false`, render as before (single column)

The detail modal width stays at 1200px; the two-column diff fits within it.

---

## 7. Files Changed Summary

| File | Change |
|------|--------|
| `db/schema_v3.sql` | Add `pending_changes` table |
| `entity/PendingChange.java` | New |
| `mapper/PendingChangeMapper.java` | New |
| `service/PendingChangeService.java` | New |
| `controller/hospitaladmin/HAHospitalController.java` | Update: route edit to pending_changes when approved |
| `controller/hospitaladmin/HADoctorController.java` | Update: same |
| `controller/hospitaladmin/HAEquipmentController.java` | Update: same |
| `controller/hospitaladmin/HAEnvironmentController.java` | Update: same |
| `controller/hospitaladmin/HACaseController.java` | Update: same |
| `controller/hospitaladmin/HAProductController.java` | Update: same |
| `controller/reviewer/ReviewerController.java` | Update: merge new + edit in pending list; apply/reject via service |
| `entity/Hospital.java` (and other 5) | Add `@TableField(exist=false) Boolean hasPendingEdit` transient field |
| `frontend-admin/src/pages/Reviewer/ReviewerPendingPage.tsx` | Update: isEdit tag + diff modal |
| `frontend-admin/src/pages/HospitalAdmin/HA*Page.tsx` (6 files) | Update: render "编辑待审核" badge |

---

## 8. Out of Scope

- HA delete — remains direct, no audit
- Super-admin direct edits (`/api/admin/**`) — not affected
- Reviewer direct edits (`PUT /api/reviewer/edit/{type}/{id}`) — not affected; reviewer edits bypass audit by design
- frontend-site-a — no changes (public queries only read approved live rows)
