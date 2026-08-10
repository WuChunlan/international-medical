# HA Edit Audit (Shadow Copy) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a hospital admin edits an already-approved record, stage the change in `pending_changes` so the live row stays visible until the reviewer approves.

**Architecture:** A new `pending_changes` table holds JSON snapshots of HA edits. HA update endpoints check the entity's current `audit_status`; if `approved`, they write to `pending_changes` instead of the live table. `PendingChangeService` handles serialization and the atomic apply-on-approval (overwrite entity + replace media/variants + set approved + delete pending row). The reviewer UI merges new records and pending edits into one list per type.

**Tech Stack:** Spring Boot 3, MyBatis-Plus 3, Jackson `ObjectMapper`, React 18, Ant Design 5, TypeScript.

## Global Constraints

- Package root: `com.intlmedical`
- MyBatis-Plus auto-fill: `createdAt` on INSERT via `MyBatisPlusConfig.insertFill` (field annotation `@TableField(fill = FieldFill.INSERT)`)
- Entity `@TableField(exist=false)` for transient fields not in DB
- `SecurityUtil.getCurrentUserId()` returns `Long` — reads from Spring Security context
- `SecurityUtil.getCurrentHospitalId()` returns `Long` — reads from JWT details
- All backend controllers call mappers directly (no intermediate service layer except `PendingChangeService`)
- Frontend API responses: `res.data?.data ?? res.data` unwrap pattern; paged results use `records` array
- `pending_data` JSON field names match Java camelCase entity field names (Jackson default)
- Entity type string literals: `"hospitals"`, `"doctors"`, `"equipments"`, `"environments"`, `"cases"`, `"products"` — exact values used in both backend switch statements and frontend

---

### Task 1: Database Migration — `pending_changes` table

**Files:**
- Modify: `db/schema_v3.sql`

**Interfaces:**
- Produces: `pending_changes` table in MySQL, used by Tasks 2–9

- [ ] **Step 1: Append the CREATE TABLE to `db/schema_v3.sql`**

Add before the `-- 角色初始数据` section:

```sql
-- ============================================================
-- 待审核变更（HA编辑已审核记录时的影子副本）
-- ============================================================
CREATE TABLE IF NOT EXISTS pending_changes (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='HA编辑待审核变更';
```

- [ ] **Step 2: Run the DDL against your local database**

```bash
mysql -u root -p international_medical < db/schema_v3.sql
# or just run the single CREATE TABLE statement directly:
mysql -u root -p international_medical -e "
CREATE TABLE IF NOT EXISTS pending_changes (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  entity_type      ENUM('hospitals','doctors','equipments','environments','cases','products') NOT NULL,
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
"
```

- [ ] **Step 3: Verify**

```bash
mysql -u root -p international_medical -e "DESCRIBE pending_changes;"
# Expected: 10 columns (id, entity_type, entity_id, pending_data, submitted_at,
#           submitted_by, audit_status, rejection_reason, reviewed_at, reviewed_by)
```

- [ ] **Step 4: Commit**

```bash
git add db/schema_v3.sql
git commit -m "feat(db): add pending_changes table for HA edit audit"
```

---

### Task 2: Backend — `PendingChange` entity + mapper

**Files:**
- Create: `backend/src/main/java/com/intlmedical/entity/PendingChange.java`
- Create: `backend/src/main/java/com/intlmedical/mapper/PendingChangeMapper.java`

**Interfaces:**
- Produces:
  - `PendingChange` entity with all fields from `pending_changes` table
  - `PendingChangeMapper.selectByEntity(String entityType, Long entityId)` → `PendingChange`
  - `PendingChangeMapper.selectPendingByType(String entityType)` → `List<PendingChange>`
  - `PendingChangeMapper` extends `BaseMapper<PendingChange>` (gives insert/updateById/deleteById)

- [ ] **Step 1: Create `PendingChange.java`**

```java
package com.intlmedical.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("pending_changes")
public class PendingChange {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String entityType;
    private Long entityId;
    private String pendingData;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime submittedAt;
    private Long submittedBy;
    private String auditStatus;
    private String rejectionReason;
    private LocalDateTime reviewedAt;
    private Long reviewedBy;
}
```

- [ ] **Step 2: Create `PendingChangeMapper.java`**

```java
package com.intlmedical.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.intlmedical.entity.PendingChange;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import java.util.List;

@Mapper
public interface PendingChangeMapper extends BaseMapper<PendingChange> {

    @Select("SELECT * FROM pending_changes WHERE entity_type = #{entityType} AND entity_id = #{entityId}")
    PendingChange selectByEntity(@Param("entityType") String entityType,
                                 @Param("entityId") Long entityId);

    @Select("SELECT * FROM pending_changes WHERE entity_type = #{entityType} AND audit_status = 'pending'")
    List<PendingChange> selectPendingByType(@Param("entityType") String entityType);
}
```

- [ ] **Step 3: Build and verify no compile errors**

```bash
cd backend && mvn compile -q
# Expected: BUILD SUCCESS
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/java/com/intlmedical/entity/PendingChange.java \
        backend/src/main/java/com/intlmedical/mapper/PendingChangeMapper.java
git commit -m "feat(backend): add PendingChange entity and mapper"
```

---

### Task 3: Backend — `PendingChangeService`

**Files:**
- Create: `backend/src/main/java/com/intlmedical/service/PendingChangeService.java`

**Interfaces:**
- Consumes:
  - `PendingChangeMapper` from Task 2
  - All 6 entity mappers (already exist): `HospitalMapper`, `DoctorMapper`, `EquipmentMapper`, `HospitalEnvironmentMapper`, `CaseMapper`, `SpecialProductMapper`
  - `EntityMediaMapper` (already exists)
  - `ProductVariantMapper` (already exists)
  - `ObjectMapper` from Spring's Jackson (auto-wired)
- Produces:
  - `PendingChangeService.submitEdit(String entityType, Long entityId, Object entityData, Long submittedBy)` — upserts pending_changes row; throws `JsonProcessingException`
  - `PendingChangeService.applyApproval(String entityType, Long entityId, PendingChange pc, Long reviewerId)` — applies JSON to live tables; `@Transactional`; throws `JsonProcessingException`
  - `PendingChangeService.applyRejection(PendingChange pc, String reason, Long reviewerId)` — writes rejection to pending_changes row

- [ ] **Step 1: Create `PendingChangeService.java`**

File: `backend/src/main/java/com/intlmedical/service/PendingChangeService.java`

```java
package com.intlmedical.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.intlmedical.entity.*;
import com.intlmedical.mapper.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

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
    private final ObjectMapper objectMapper;

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
        setLiveAuditStatus(entityType, entityId, "approved", null);
        applyMedia(entityType, entityId, data);
        pendingChangeMapper.deleteById(pc.getId());
    }

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
        h.setIntroZh(textOrNull(d, "introZh"));
        h.setIntroEn(textOrNull(d, "introEn"));
        h.setCoverImageUrl(textOrNull(d, "coverImageUrl"));
        h.setAddressZh(textOrNull(d, "addressZh"));
        h.setAddressEn(textOrNull(d, "addressEn"));
        h.setPhone(textOrNull(d, "phone"));
        h.setContactPerson(textOrNull(d, "contactPerson"));
        h.setContactInfo(textOrNull(d, "contactInfo"));
        h.setSortOrder(d.path("sortOrder").asInt(0));
        hospitalMapper.updateById(h);
    }

    private void applyDoctor(Long id, JsonNode d) {
        Doctor dr = doctorMapper.selectById(id);
        dr.setNameZh(d.path("nameZh").asText(dr.getNameZh()));
        dr.setNameEn(d.path("nameEn").asText(dr.getNameEn()));
        dr.setSpecialtyZh(textOrNull(d, "specialtyZh"));
        dr.setSpecialtyEn(textOrNull(d, "specialtyEn"));
        dr.setBioZh(textOrNull(d, "bioZh"));
        dr.setBioEn(textOrNull(d, "bioEn"));
        dr.setPhotoUrl(textOrNull(d, "photoUrl"));
        dr.setPricePerVisit(decimalOrNull(d, "pricePerVisit"));
        dr.setTitleZh(textOrNull(d, "titleZh"));
        dr.setTitleEn(textOrNull(d, "titleEn"));
        dr.setSortOrder(d.path("sortOrder").asInt(0));
        doctorMapper.updateById(dr);
    }

    private void applyEquipment(Long id, JsonNode d) {
        Equipment eq = equipmentMapper.selectById(id);
        eq.setNameZh(d.path("nameZh").asText(eq.getNameZh()));
        eq.setNameEn(d.path("nameEn").asText(eq.getNameEn()));
        eq.setDescZh(textOrNull(d, "descZh"));
        eq.setDescEn(textOrNull(d, "descEn"));
        eq.setImageUrl(textOrNull(d, "imageUrl"));
        eq.setSortOrder(d.path("sortOrder").asInt(0));
        equipmentMapper.updateById(eq);
    }

    private void applyEnvironment(Long id, JsonNode d) {
        HospitalEnvironment env = environmentMapper.selectById(id);
        env.setNameZh(d.path("nameZh").asText(env.getNameZh()));
        env.setNameEn(d.path("nameEn").asText(env.getNameEn()));
        env.setDescZh(textOrNull(d, "descZh"));
        env.setDescEn(textOrNull(d, "descEn"));
        env.setImageUrl(textOrNull(d, "imageUrl"));
        env.setSortOrder(d.path("sortOrder").asInt(0));
        environmentMapper.updateById(env);
    }

    private void applyCase(Long id, JsonNode d) {
        Case c = caseMapper.selectById(id);
        c.setTitleZh(d.path("titleZh").asText(c.getTitleZh()));
        c.setTitleEn(d.path("titleEn").asText(c.getTitleEn()));
        c.setSummaryZh(textOrNull(d, "summaryZh"));
        c.setSummaryEn(textOrNull(d, "summaryEn"));
        c.setDetailZh(textOrNull(d, "detailZh"));
        c.setDetailEn(textOrNull(d, "detailEn"));
        c.setCoverImageUrl(textOrNull(d, "coverImageUrl"));
        c.setSortOrder(d.path("sortOrder").asInt(0));
        caseMapper.updateById(c);
    }

    private void applyProduct(Long id, JsonNode d) {
        SpecialProduct p = productMapper.selectById(id);
        p.setNameZh(d.path("nameZh").asText(p.getNameZh()));
        p.setNameEn(d.path("nameEn").asText(p.getNameEn()));
        p.setSummaryZh(textOrNull(d, "summaryZh"));
        p.setSummaryEn(textOrNull(d, "summaryEn"));
        p.setDetailZh(textOrNull(d, "detailZh"));
        p.setDetailEn(textOrNull(d, "detailEn"));
        p.setCoverImageUrl(textOrNull(d, "coverImageUrl"));
        p.setPriceMin(decimalOrNull(d, "priceMin"));
        p.setPriceMax(decimalOrNull(d, "priceMax"));
        p.setContactPerson(textOrNull(d, "contactPerson"));
        p.setContactInfo(textOrNull(d, "contactInfo"));
        p.setSortOrder(d.path("sortOrder").asInt(0));
        productMapper.updateById(p);
        variantMapper.delete(new LambdaQueryWrapper<ProductVariant>()
            .eq(ProductVariant::getProductId, id));
        JsonNode variants = d.path("variants");
        if (variants.isArray()) {
            for (JsonNode v : variants) {
                ProductVariant pv = new ProductVariant();
                pv.setProductId(id);
                pv.setNameZh(v.path("nameZh").asText(""));
                pv.setNameEn(v.path("nameEn").asText(""));
                pv.setDescZh(textOrNull(v, "descZh"));
                pv.setDescEn(textOrNull(v, "descEn"));
                pv.setPrice(decimalOrNull(v, "price"));
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
        switch (entityType) {
            case "hospitals" -> hospitalMapper.update(null,
                new LambdaUpdateWrapper<Hospital>()
                    .eq(Hospital::getId, entityId)
                    .set(Hospital::getAuditStatus, status)
                    .set(Hospital::getRejectionReason, reason));
            case "doctors" -> doctorMapper.update(null,
                new LambdaUpdateWrapper<Doctor>()
                    .eq(Doctor::getId, entityId)
                    .set(Doctor::getAuditStatus, status)
                    .set(Doctor::getRejectionReason, reason));
            case "equipments" -> equipmentMapper.update(null,
                new LambdaUpdateWrapper<Equipment>()
                    .eq(Equipment::getId, entityId)
                    .set(Equipment::getAuditStatus, status)
                    .set(Equipment::getRejectionReason, reason));
            case "environments" -> environmentMapper.update(null,
                new LambdaUpdateWrapper<HospitalEnvironment>()
                    .eq(HospitalEnvironment::getId, entityId)
                    .set(HospitalEnvironment::getAuditStatus, status)
                    .set(HospitalEnvironment::getRejectionReason, reason));
            case "cases" -> caseMapper.update(null,
                new LambdaUpdateWrapper<Case>()
                    .eq(Case::getId, entityId)
                    .set(Case::getAuditStatus, status)
                    .set(Case::getRejectionReason, reason));
            case "products" -> productMapper.update(null,
                new LambdaUpdateWrapper<SpecialProduct>()
                    .eq(SpecialProduct::getId, entityId)
                    .set(SpecialProduct::getAuditStatus, status)
                    .set(SpecialProduct::getRejectionReason, reason));
        }
    }

    private String textOrNull(JsonNode node, String field) {
        JsonNode n = node.path(field);
        if (n.isMissingNode() || n.isNull()) return null;
        return n.asText();
    }

    private BigDecimal decimalOrNull(JsonNode node, String field) {
        JsonNode n = node.path(field);
        if (n.isMissingNode() || n.isNull()) return null;
        return new BigDecimal(n.asText("0"));
    }
}
```

- [ ] **Step 2: Build and verify**

```bash
cd backend && mvn compile -q
# Expected: BUILD SUCCESS
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/main/java/com/intlmedical/service/PendingChangeService.java
git commit -m "feat(backend): add PendingChangeService with submit/apply/reject logic"
```

---

### Task 4: Backend — Add `hasPendingEdit` transient field to 6 entities + populate in HA list controllers

**Files:**
- Modify: `backend/src/main/java/com/intlmedical/entity/Hospital.java`
- Modify: `backend/src/main/java/com/intlmedical/entity/Doctor.java`
- Modify: `backend/src/main/java/com/intlmedical/entity/Equipment.java`
- Modify: `backend/src/main/java/com/intlmedical/entity/HospitalEnvironment.java`
- Modify: `backend/src/main/java/com/intlmedical/entity/Case.java`
- Modify: `backend/src/main/java/com/intlmedical/entity/SpecialProduct.java`
- Modify: `backend/src/main/java/com/intlmedical/controller/admin/AdminUserController.java` (HA hospital list — look for method listing hospitals for HA role)
- Modify: relevant HA list controllers (read each controller to find the list endpoints for doctors/equipment/environments/cases/products)

**Interfaces:**
- Consumes: `PendingChangeMapper.selectPendingByType(String)` from Task 2
- Produces: all 6 entity classes have `Boolean hasPendingEdit` transient field; HA list endpoints set it

- [ ] **Step 1: Add transient field to each entity class**

For each of the 6 entity files, add inside the class body (after all existing `@TableField` fields):

```java
@TableField(exist = false)
private Boolean hasPendingEdit;
```

Read each entity file before editing to confirm exact insertion point.

- [ ] **Step 2: Find the HA list endpoints**

The HA hospital list is in `HAHospitalController` or similar — search for "hospital-admin" controllers:

```bash
grep -r "hospital.admin\|hospitalAdmin\|hospital_admin" backend/src/main/java --include="*.java" -l
grep -r "hasPendingEdit\|HAHospital\|HADoctor\|HACase\|HAEquip\|HAEnviron\|HAProduct" backend/src/main/java --include="*.java" -l
# Look for controllers under controller/hospitaladmin/ or similar
find backend/src/main/java -name "HA*.java" -type f
```

- [ ] **Step 3: Inject `PendingChangeMapper` into each HA list controller and populate `hasPendingEdit`**

In each HA list controller, after the existing `@Autowired` mapper fields, add:

```java
@Autowired
private PendingChangeMapper pendingChangeMapper;
```

Then in the list/page method, after the list is fetched, add a batch-populate block. Example for doctors:

```java
List<PendingChange> pending = pendingChangeMapper.selectPendingByType("doctors");
Set<Long> pendingIds = pending.stream()
    .map(PendingChange::getEntityId)
    .collect(java.util.stream.Collectors.toSet());
records.forEach(d -> d.setHasPendingEdit(pendingIds.contains(d.getId())));
```

Apply the same pattern for all 6 entity types, using the correct entity type string.

- [ ] **Step 4: Build and verify**

```bash
cd backend && mvn compile -q
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/com/intlmedical/entity/*.java \
        backend/src/main/java/com/intlmedical/controller/
git commit -m "feat(backend): add hasPendingEdit transient field and populate in HA list endpoints"
```

---

### Task 5: Backend — Modify HA update endpoints to route approved records through `PendingChangeService`

**Files:**
- Modify: the 6 HA update endpoint methods (in the same HA controllers found in Task 4)

**Interfaces:**
- Consumes: `PendingChangeService.submitEdit(String, Long, Object, Long)` from Task 3
- Requires: `SecurityUtil.getCurrentUserId()` for submittedBy

- [ ] **Step 1: Read each HA controller's update method**

For each of the 6 entity types, read the controller file and find the `@PutMapping` update method.

- [ ] **Step 2: Add `PendingChangeService` injection to each HA controller**

```java
@Autowired
private PendingChangeService pendingChangeService;
```

- [ ] **Step 3: Replace each update method body with the audit-routing pattern**

For each entity, the update method should follow this pattern (example for doctors):

```java
@PutMapping("/{id}")
public Result<?> update(@PathVariable Long id, @RequestBody Doctor doctor) {
    Long hospitalId = SecurityUtil.getCurrentHospitalId();
    Doctor existing = doctorMapper.selectById(id);
    if ("approved".equals(existing.getAuditStatus())) {
        Long userId = SecurityUtil.getCurrentUserId();
        try {
            pendingChangeService.submitEdit("doctors", id, doctor, userId);
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            return Result.fail("提交失败，请重试");
        }
    } else {
        doctor.setId(id);
        doctor.setHospitalId(hospitalId);
        doctor.setAuditStatus("pending");
        doctor.setRejectionReason(null);
        doctorMapper.updateById(doctor);
    }
    return Result.ok();
}
```

Apply the same pattern to all 6 entity update methods:
- `"hospitals"` — `hospitalMapper.selectById(hospitalId)` (note: use hospitalId for hospital entity, not a pathVariable id)
- `"doctors"` — `doctorMapper.selectById(id)`
- `"equipments"` — `equipmentMapper.selectById(id)`
- `"environments"` — `environmentMapper.selectById(id)`
- `"cases"` — `caseMapper.selectById(id)`
- `"products"` — `productMapper.selectById(id)`

Note for hospital: the HA only manages their own hospital, so the lookup may differ — read the existing update method carefully to understand the current id source.

- [ ] **Step 4: Build and verify**

```bash
cd backend && mvn compile -q
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/com/intlmedical/controller/
git commit -m "feat(backend): route HA updates for approved records through pending_changes"
```

---

### Task 6: Backend — Modify `ReviewerController` approve/reject endpoints to use `PendingChangeService`

**Files:**
- Modify: `backend/src/main/java/com/intlmedical/controller/reviewer/ReviewerController.java`

**Interfaces:**
- Consumes: `PendingChangeService.applyApproval(String, Long, PendingChange, Long)` and `applyRejection(PendingChange, String, Long)` from Task 3
- Consumes: `PendingChangeMapper.selectByEntity(String, Long)` and `selectPendingByType(String)` from Task 2

- [ ] **Step 1: Read the existing ReviewerController**

```
Read backend/src/main/java/com/intlmedical/controller/reviewer/ReviewerController.java
```

Note the existing approve and reject endpoint signatures, and the existing pending list endpoint.

- [ ] **Step 2: Inject `PendingChangeMapper` and `PendingChangeService`**

```java
@Autowired
private PendingChangeMapper pendingChangeMapper;

@Autowired
private PendingChangeService pendingChangeService;
```

- [ ] **Step 3: Modify the approve endpoint**

Find the `PUT /approve/{type}/{id}` endpoint and update it to check for pending changes first:

```java
@PutMapping("/approve/{type}/{id}")
public Result<?> approve(@PathVariable String type, @PathVariable Long id) {
    Long reviewerId = SecurityUtil.getCurrentUserId();
    PendingChange pc = pendingChangeMapper.selectByEntity(type, id);
    if (pc != null && "pending".equals(pc.getAuditStatus())) {
        try {
            pendingChangeService.applyApproval(type, id, pc, reviewerId);
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            return Result.fail("审核失败，请重试");
        }
    } else {
        // Original approval logic for new (non-edit) records
        // Keep the existing switch/if-else that sets audit_status = 'approved' on the live entity
        // (read the existing implementation and preserve it in this else branch)
    }
    return Result.ok();
}
```

Read the original approve method body carefully and preserve the existing new-record approval logic in the `else` branch.

- [ ] **Step 4: Modify the reject endpoint similarly**

```java
@PutMapping("/reject/{type}/{id}")
public Result<?> reject(@PathVariable String type, @PathVariable Long id,
                        @RequestBody(required = false) Map<String, String> body) {
    Long reviewerId = SecurityUtil.getCurrentUserId();
    String reason = body != null ? body.get("reason") : null;
    PendingChange pc = pendingChangeMapper.selectByEntity(type, id);
    if (pc != null && "pending".equals(pc.getAuditStatus())) {
        pendingChangeService.applyRejection(pc, reason, reviewerId);
    } else {
        // Original rejection logic for new records — preserve existing implementation
    }
    return Result.ok();
}
```

- [ ] **Step 5: Update pending list endpoints to include `isEdit` flag**

The reviewer list endpoints should now return a `PendingItem`-style response. Add a `PendingItem` record class either inline or as a small inner class:

```java
record PendingItem(Object data, boolean isEdit, Object currentData) {}
```

In the `GET /pending/{type}` endpoint, merge:
1. New records (audit_status = 'pending' in live entity table) → `isEdit = false`, `currentData = null`
2. Edit records (rows in `pending_changes` with audit_status = 'pending') → `isEdit = true`, `currentData = live entity`

Example for doctors type:

```java
case "doctors" -> {
    List<Doctor> newDoctors = doctorMapper.selectList(
        new LambdaQueryWrapper<Doctor>()
            .eq(Doctor::getHospitalId, hospitalId) // if scoped to hospital
            .eq(Doctor::getAuditStatus, "pending"));
    List<PendingChange> edits = pendingChangeMapper.selectPendingByType("doctors");
    List<PendingItem> items = new ArrayList<>();
    newDoctors.forEach(d -> items.add(new PendingItem(d, false, null)));
    edits.forEach(pc -> {
        Doctor current = doctorMapper.selectById(pc.getEntityId());
        if (current != null) {
            try {
                Object pendingData = objectMapper.readValue(pc.getPendingData(), Doctor.class);
                items.add(new PendingItem(pendingData, true, current));
            } catch (Exception e) { /* skip malformed */ }
        }
    });
    return Result.ok(items);
}
```

Apply the same pattern for all 6 entity types. Read the existing pending list implementation first to understand the current scoping logic (e.g., whether it filters by hospitalId for HA role).

- [ ] **Step 6: Inject `ObjectMapper`**

```java
@Autowired
private ObjectMapper objectMapper;
```

- [ ] **Step 7: Build and verify**

```bash
cd backend && mvn compile -q
```

- [ ] **Step 8: Commit**

```bash
git add backend/src/main/java/com/intlmedical/controller/reviewer/ReviewerController.java
git commit -m "feat(backend): route reviewer approve/reject through PendingChangeService; add isEdit to pending list"
```

---

### Task 7: Frontend — Add `hasPendingEdit` and `PendingItem` types + "编辑待审核" badge to all 6 HA pages

**Files:**
- Modify: `frontend-admin/src/types/index.ts`
- Modify: `frontend-admin/src/pages/HospitalAdmin/HAHospitalPage.tsx`
- Modify: `frontend-admin/src/pages/HospitalAdmin/HADoctorsPage.tsx`
- Modify: `frontend-admin/src/pages/HospitalAdmin/HAEquipmentsPage.tsx`
- Modify: `frontend-admin/src/pages/HospitalAdmin/HAEnvironmentsPage.tsx`
- Modify: `frontend-admin/src/pages/HospitalAdmin/HACasesPage.tsx`
- Modify: `frontend-admin/src/pages/HospitalAdmin/HAProductsPage.tsx`

**Interfaces:**
- Consumes: `hasPendingEdit` field now returned by backend HA list endpoints (Task 4)
- Produces: visible orange "编辑待审核" tag in each entity's table row when `record.hasPendingEdit === true`

- [ ] **Step 1: Update `types/index.ts`**

Read the file first, then add `hasPendingEdit?: boolean` to each of the 6 entity interfaces (Hospital, Doctor, Equipment, HospitalEnvironment/Environment, Case/MedCase, SpecialProduct/Product).

Also add the `PendingItem` interface:

```typescript
export interface PendingItem<T = Record<string, unknown>> {
  data: T
  isEdit: boolean
  currentData: T | null
}
```

- [ ] **Step 2: Add "编辑待审核" badge to each HA page table**

In each HA page, find the Ant Design `<Table columns={...}>` definition and locate the column that displays the entity name (usually the first data column). Add a rendered tag inline after the name, or add a separate "状态" column.

Pattern to add inline in the name column render:

```tsx
render: (text: string, record: EntityType) => (
  <span>
    {text}
    {record.hasPendingEdit && (
      <Tag color="orange" style={{ marginLeft: 8 }}>编辑待审核</Tag>
    )}
  </span>
)
```

Add `import { Tag } from 'antd'` if not already imported.

Apply this to all 6 HA pages.

- [ ] **Step 3: Verify build**

```bash
cd frontend-admin && npm run build 2>&1 | tail -20
# Expected: no TypeScript errors
```

- [ ] **Step 4: Commit**

```bash
git add frontend-admin/src/types/index.ts \
        frontend-admin/src/pages/HospitalAdmin/
git commit -m "feat(frontend-admin): add hasPendingEdit badge to HA pages"
```

---

### Task 8: Frontend — Update `ReviewerPendingPage` to show isEdit tag and two-column diff modal

**Files:**
- Modify: `frontend-admin/src/pages/Reviewer/ReviewerPendingPage.tsx`

**Interfaces:**
- Consumes: `PendingItem` shape from backend (Task 6): `{ data, isEdit, currentData }`
- Consumes: `PendingItem` TypeScript interface from Task 7's `types/index.ts`
- Produces: "编辑"/"新建" tag in table; two-column diff layout in detail modal for edit items

- [ ] **Step 1: Read the current `ReviewerPendingPage.tsx`**

Understand the current data shape, column definitions, and modal/drawer implementation before making changes.

- [ ] **Step 2: Update API response handling**

The pending list endpoint now returns `PendingItem[]` instead of raw entity arrays. Update the data fetch and local state type. The table rows should map `item.data` for display, but store the full `PendingItem` for modal use.

- [ ] **Step 3: Add "编辑"/"新建" column**

Add a column to the table:

```tsx
{
  title: '类型',
  key: 'editType',
  render: (_: unknown, record: PendingItem) => (
    <Tag color={record.isEdit ? 'orange' : 'blue'}>
      {record.isEdit ? '编辑' : '新建'}
    </Tag>
  ),
  width: 80,
}
```

- [ ] **Step 4: Update the detail modal to show two-column diff for edit items**

When the modal opens for a record where `record.isEdit === true`, show a side-by-side layout:

```tsx
{selectedItem?.isEdit && selectedItem.currentData ? (
  <Row gutter={24}>
    <Col span={12}>
      <Typography.Title level={5} style={{ color: '#888' }}>当前数据</Typography.Title>
      <EntityFields data={selectedItem.currentData} changedKeys={changedKeys} highlight={false} />
    </Col>
    <Col span={12}>
      <Typography.Title level={5} style={{ color: '#1677ff' }}>待审核变更</Typography.Title>
      <EntityFields data={selectedItem.data} changedKeys={changedKeys} highlight={true} />
    </Col>
  </Row>
) : (
  // existing single-column display for new records
  <EntityFields data={selectedItem?.data} changedKeys={[]} highlight={false} />
)}
```

Where `changedKeys` is computed by comparing `selectedItem.data` vs `selectedItem.currentData` (shallow key comparison):

```tsx
const changedKeys = selectedItem?.isEdit && selectedItem.currentData
  ? Object.keys(selectedItem.data as Record<string, unknown>).filter(
      k => JSON.stringify((selectedItem.data as Record<string, unknown>)[k])
        !== JSON.stringify((selectedItem.currentData as Record<string, unknown>)[k])
    )
  : []
```

The `EntityFields` component renders `<Descriptions>` items. For `highlight={true}`, wrap changed fields in `<span style={{ backgroundColor: '#fffbe6' }}>`.

Implement `EntityFields` as a local function component within the file:

```tsx
const EntityFields: React.FC<{
  data: Record<string, unknown> | null | undefined
  changedKeys: string[]
  highlight: boolean
}> = ({ data, changedKeys, highlight }) => {
  if (!data) return null
  const SKIP_KEYS = ['id', 'hospitalId', 'auditStatus', 'rejectionReason',
                     'createdAt', 'updatedAt', 'hasPendingEdit']
  return (
    <Descriptions column={1} size="small" bordered>
      {Object.entries(data)
        .filter(([k]) => !SKIP_KEYS.includes(k))
        .map(([k, v]) => {
          const isChanged = highlight && changedKeys.includes(k)
          const displayVal = typeof v === 'string' && v.startsWith('<')
            ? <span dangerouslySetInnerHTML={{ __html: v }} />
            : String(v ?? '')
          return (
            <Descriptions.Item
              key={k}
              label={k}
              style={isChanged ? { backgroundColor: '#fffbe6' } : undefined}
            >
              {displayVal}
            </Descriptions.Item>
          )
        })}
    </Descriptions>
  )
}
```

- [ ] **Step 5: Verify build**

```bash
cd frontend-admin && npm run build 2>&1 | tail -20
# Expected: no TypeScript errors
```

- [ ] **Step 6: Commit**

```bash
git add frontend-admin/src/pages/Reviewer/ReviewerPendingPage.tsx
git commit -m "feat(frontend-admin): show isEdit tag and two-column diff in reviewer pending page"
```
