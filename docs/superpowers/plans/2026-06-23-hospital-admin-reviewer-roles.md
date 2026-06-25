# 医院管理员与信息审核员角色实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增"医院管理员"（hospital_admin）和"信息审核员"（reviewer）两个角色，医院管理员可管理其绑定医院的数据，审核员可审核并编辑所有医院提交的数据，审核通过才在 frontend-site-a 展示。

**Architecture:** 在现有 user/admin 二元角色基础上新增两个角色（role_id=3/4），通过 users.hospital_id 绑定医院管理员与医院，为医院关联实体（doctors/equipments/cases/products/hospital_environments/hospital_banners）新增 audit_status 字段（pending/approved/rejected）和 rejection_reason 字段，后端新增 /api/hospital-admin/** 和 /api/reviewer/** 路由组，前端 admin 根据 JWT 中 role 字段动态渲染菜单和路由。

**Tech Stack:** Spring Boot 3.2 + MyBatis-Plus + Spring Security JWT | React 18 + Ant Design + Zustand + React Router

## Global Constraints

- 数据库: international_medical (MySQL 8)
- 后端: Java 17, Spring Boot 3.2.5, MyBatis-Plus 3.5.7
- 前端: React 18, TypeScript, Ant Design 5.x, Zustand, Vite
- JWT role 字段值: "admin" | "hospital_admin" | "reviewer" | "user"
- 所有新 API 路径前缀: /api/hospital-admin/**, /api/reviewer/**
- frontend-site-a 只展示 audit_status='approved' 的数据
- 现有 /api/admin/** 路由和功能保持不变
- 审核状态枚举: pending（待审核）| approved（已通过）| rejected（已拒绝）

---
## 文件结构

### 数据库变更
- Modify: `db/schema.sql` — 新增角色、hospital_id 列、audit 字段
- Create: `db/migration_v2.sql` — 增量 SQL（不破坏现有数据）

### 后端新文件
- Create: `backend/src/main/java/com/intlmedical/entity/HospitalAdminBinding.java` — 医院管理员与医院绑定（users.hospital_id 列已足够，此为可选）
- Modify: `backend/src/main/java/com/intlmedical/entity/User.java` — 新增 hospitalId 字段
- Modify: `backend/src/main/java/com/intlmedical/entity/Doctor.java` — 新增 auditStatus, rejectionReason
- Modify: `backend/src/main/java/com/intlmedical/entity/Equipment.java` — 新增 auditStatus, rejectionReason
- Modify: `backend/src/main/java/com/intlmedical/entity/Case.java` — 新增 auditStatus, rejectionReason
- Modify: `backend/src/main/java/com/intlmedical/entity/SpecialProduct.java` — 新增 auditStatus, rejectionReason
- Modify: `backend/src/main/java/com/intlmedical/entity/Hospital.java` — 新增 auditStatus, rejectionReason
- Modify: `backend/src/main/java/com/intlmedical/entity/HospitalEnvironment.java` — 新增 auditStatus, rejectionReason
- Modify: `backend/src/main/java/com/intlmedical/service/AuthService.java` — login 支持 hospital_admin/reviewer role
- Modify: `backend/src/main/java/com/intlmedical/config/SecurityConfig.java` — 新增路由权限规则
- Create: `backend/src/main/java/com/intlmedical/controller/hospitaladmin/HospitalAdminHospitalController.java`
- Create: `backend/src/main/java/com/intlmedical/controller/hospitaladmin/HospitalAdminDoctorController.java`
- Create: `backend/src/main/java/com/intlmedical/controller/hospitaladmin/HospitalAdminEquipmentController.java`
- Create: `backend/src/main/java/com/intlmedical/controller/hospitaladmin/HospitalAdminEnvironmentController.java`
- Create: `backend/src/main/java/com/intlmedical/controller/hospitaladmin/HospitalAdminCaseController.java`
- Create: `backend/src/main/java/com/intlmedical/controller/hospitaladmin/HospitalAdminProductController.java`
- Create: `backend/src/main/java/com/intlmedical/controller/reviewer/ReviewerController.java`
- Modify: `backend/src/main/java/com/intlmedical/controller/admin/AdminUserController.java` — 新增创建 hospital_admin/reviewer 账号接口
- Modify: `backend/src/main/java/com/intlmedical/controller/HospitalController.java` — list/detail 过滤 approved
- Modify: `backend/src/main/java/com/intlmedical/controller/DoctorController.java` — 过滤 approved
- Modify: `backend/src/main/java/com/intlmedical/controller/CaseController.java` — 过滤 approved
- Modify: `backend/src/main/java/com/intlmedical/controller/EquipmentController.java` — 过滤 approved
- Modify: `backend/src/main/java/com/intlmedical/controller/ProductController.java` — 过滤 approved
- Create: `backend/src/main/java/com/intlmedical/util/SecurityUtil.java` — 从 SecurityContext 取 userId

### 前端变更
- Modify: `frontend-admin/src/store/authStore.ts` — 存储 role 字段
- Modify: `frontend-admin/src/types/index.ts` — 新增审核相关类型
- Modify: `frontend-admin/src/components/AdminLayout.tsx` — 按 role 渲染菜单
- Modify: `frontend-admin/src/components/PrivateRoute.tsx` — 支持 role 校验
- Modify: `frontend-admin/src/pages/Login/index.tsx` — 登录后存 role
- Create: `frontend-admin/src/pages/HospitalAdminManage/` — 医院管理员管理页面集合
- Create: `frontend-admin/src/pages/ReviewerManage/` — 审核员工作台
- Modify: `frontend-admin/src/App.tsx` — 新增路由

---
---

### Task 1: 数据库增量迁移

**Files:**
- Create: `db/migration_v2.sql`

**Interfaces:**
- Produces: roles 表新增 id=3 (hospital_admin), id=4 (reviewer); users 表新增 hospital_id 列; 六张业务表新增 audit_status ENUM('pending','approved','rejected') DEFAULT 'pending' 和 rejection_reason TEXT

- [ ] **Step 1: 创建迁移脚本**

```sql
-- db/migration_v2.sql
USE international_medical;

-- 新增角色
INSERT IGNORE INTO roles (id, code, name_zh, name_en) VALUES
(3, 'hospital_admin', '医院管理员', 'Hospital Admin'),
(4, 'reviewer',       '信息审核员', 'Reviewer');

-- users 表新增 hospital_id (医院管理员绑定的医院)
ALTER TABLE users
  ADD COLUMN hospital_id BIGINT UNSIGNED DEFAULT NULL COMMENT '绑定医院ID（hospital_admin专用）' AFTER role_id;

-- 六张业务表新增审核字段
ALTER TABLE hospitals
  ADD COLUMN audit_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'approved' COMMENT '审核状态' AFTER is_active,
  ADD COLUMN rejection_reason TEXT DEFAULT NULL COMMENT '审核拒绝原因' AFTER audit_status;

ALTER TABLE doctors
  ADD COLUMN audit_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'approved' COMMENT '审核状态' AFTER is_active,
  ADD COLUMN rejection_reason TEXT DEFAULT NULL AFTER audit_status;

ALTER TABLE equipments
  ADD COLUMN audit_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'approved' COMMENT '审核状态' AFTER is_active,
  ADD COLUMN rejection_reason TEXT DEFAULT NULL AFTER audit_status;

ALTER TABLE hospital_environments
  ADD COLUMN audit_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'approved' COMMENT '审核状态' AFTER is_active,
  ADD COLUMN rejection_reason TEXT DEFAULT NULL AFTER audit_status;

ALTER TABLE cases
  ADD COLUMN audit_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'approved' COMMENT '审核状态' AFTER is_active,
  ADD COLUMN rejection_reason TEXT DEFAULT NULL AFTER audit_status;

ALTER TABLE special_products
  ADD COLUMN audit_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'approved' COMMENT '审核状态' AFTER is_active,
  ADD COLUMN rejection_reason TEXT DEFAULT NULL AFTER audit_status;
```

- [ ] **Step 2: 执行迁移**

```bash
mysql -u root -p international_medical < db/migration_v2.sql
```

Expected: Query OK, no errors

- [ ] **Step 3: 验证**

```sql
SHOW COLUMNS FROM hospitals LIKE 'audit_status';
-- Expected: Field=audit_status, Type=enum('pending','approved','rejected')
SELECT * FROM roles;
-- Expected: 4 rows including hospital_admin and reviewer
```

- [ ] **Step 4: Commit**

```bash
git add db/migration_v2.sql
git commit -m "feat: add hospital_admin/reviewer roles and audit_status fields"
```

---

### Task 2: 后端 — 实体类更新

**Files:**
- Modify: `backend/src/main/java/com/intlmedical/entity/User.java`
- Modify: `backend/src/main/java/com/intlmedical/entity/Hospital.java`
- Modify: `backend/src/main/java/com/intlmedical/entity/Doctor.java`
- Modify: `backend/src/main/java/com/intlmedical/entity/Equipment.java`
- Modify: `backend/src/main/java/com/intlmedical/entity/HospitalEnvironment.java`
- Modify: `backend/src/main/java/com/intlmedical/entity/Case.java`
- Modify: `backend/src/main/java/com/intlmedical/entity/SpecialProduct.java`

**Interfaces:**
- Produces: 所有实体包含 auditStatus (String) 和 rejectionReason (String) 字段；User 包含 hospitalId (Long)

- [ ] **Step 1: 更新 User.java — 新增 hospitalId**

在 `isActive` 字段后添加：
```java
@TableField("hospital_id")
private Long hospitalId;
```

- [ ] **Step 2: 更新六张业务实体 — 以 Hospital.java 为例，其余相同**

在 `isActive` 字段后添加：
```java
@TableField("audit_status")
private String auditStatus; // pending | approved | rejected

@TableField("rejection_reason")
private String rejectionReason;
```

对 Doctor.java、Equipment.java、HospitalEnvironment.java、Case.java、SpecialProduct.java 执行同样操作。

- [ ] **Step 3: 编译验证**

```bash
cd backend && mvn compile -q
```

Expected: BUILD SUCCESS

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/java/com/intlmedical/entity/
git commit -m "feat: add hospitalId to User and audit fields to business entities"
```

---
### Task 3: 后端 — SecurityUtil + AuthService + SecurityConfig

**Files:**
- Create: `backend/src/main/java/com/intlmedical/util/SecurityUtil.java`
- Modify: `backend/src/main/java/com/intlmedical/service/AuthService.java`
- Modify: `backend/src/main/java/com/intlmedical/config/SecurityConfig.java`

**Interfaces:**
- Produces: `SecurityUtil.getCurrentUserId(): Long`; login 支持 roleId=3→"hospital_admin", roleId=4→"reviewer"; 新路由权限规则

- [ ] **Step 1: 创建 SecurityUtil.java**

```java
// backend/src/main/java/com/intlmedical/util/SecurityUtil.java
package com.intlmedical.util;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class SecurityUtil {
    public static Long getCurrentUserId() {
        Object principal = SecurityContextHolder.getContext()
            .getAuthentication().getPrincipal();
        return (Long) principal;
    }
}
```

- [ ] **Step 2: 修改 AuthService.java — login 方法 role 映射**

将现有：
```java
String role = user.getRoleId() == 2 ? "admin" : "user";
```
替换为：
```java
String role = switch (user.getRoleId()) {
    case 2 -> "admin";
    case 3 -> "hospital_admin";
    case 4 -> "reviewer";
    default -> "user";
};
```

- [ ] **Step 3: 修改 SecurityConfig.java — 新增路由规则**

在 `.requestMatchers("/api/admin/**").hasRole("ADMIN")` 之前添加：
```java
.requestMatchers("/api/hospital-admin/**").hasAnyRole("ADMIN", "HOSPITAL_ADMIN")
.requestMatchers("/api/reviewer/**").hasAnyRole("ADMIN", "REVIEWER")
```

- [ ] **Step 4: 编译验证**

```bash
cd backend && mvn compile -q
```

Expected: BUILD SUCCESS

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/com/intlmedical/util/SecurityUtil.java \
        backend/src/main/java/com/intlmedical/service/AuthService.java \
        backend/src/main/java/com/intlmedical/config/SecurityConfig.java
git commit -m "feat: support hospital_admin/reviewer roles in auth and security"
```

---

### Task 4: 后端 — AdminUserController 新增账号管理接口

**Files:**
- Modify: `backend/src/main/java/com/intlmedical/controller/admin/AdminUserController.java`

**Interfaces:**
- Consumes: POST /api/admin/users/create-staff `{email, password, roleId(3|4), hospitalId?, firstName?, lastName?}`
- Produces: 创建 hospital_admin 或 reviewer 账号

- [ ] **Step 1: 在 AdminUserController 中添加内部类和接口**

在类末尾添加：
```java
@Data
static class CreateStaffRequest {
    private String email;
    private String password;
    private Integer roleId; // 3=hospital_admin, 4=reviewer
    private Long hospitalId; // required when roleId=3
    private String firstName;
    private String lastName;
}

@PostMapping("/create-staff")
public Result<Void> createStaff(@RequestBody CreateStaffRequest req) {
    if (req.getRoleId() != 3 && req.getRoleId() != 4) {
        return Result.fail(400, "roleId 只能为 3 或 4");
    }
    if (req.getRoleId() == 3 && req.getHospitalId() == null) {
        return Result.fail(400, "医院管理员必须绑定医院");
    }
    long exists = userMapper.selectCount(
        new LambdaQueryWrapper<User>().eq(User::getEmail, req.getEmail())
    );
    if (exists > 0) return Result.fail(409, "邮箱已存在");

    User user = new User();
    user.setRoleId(req.getRoleId());
    user.setEmail(req.getEmail());
    user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
    user.setHospitalId(req.getHospitalId());
    user.setFirstName(req.getFirstName());
    user.setLastName(req.getLastName());
    user.setIsActive(1);
    userMapper.insert(user);
    return Result.ok();
}
```

添加依赖注入（类顶部已有 `UserMapper`，新增）：
```java
private final PasswordEncoder passwordEncoder;
```

- [ ] **Step 2: 编译验证**

```bash
cd backend && mvn compile -q
```

Expected: BUILD SUCCESS

- [ ] **Step 3: Commit**

```bash
git add backend/src/main/java/com/intlmedical/controller/admin/AdminUserController.java
git commit -m "feat: add create-staff endpoint for hospital_admin/reviewer accounts"
```

---
### Task 5: 后端 — 医院管理员 API（/api/hospital-admin/**）

**Files:**
- Create: `backend/src/main/java/com/intlmedical/controller/hospitaladmin/HospitalAdminHospitalController.java`
- Create: `backend/src/main/java/com/intlmedical/controller/hospitaladmin/HospitalAdminDoctorController.java`
- Create: `backend/src/main/java/com/intlmedical/controller/hospitaladmin/HospitalAdminEquipmentController.java`
- Create: `backend/src/main/java/com/intlmedical/controller/hospitaladmin/HospitalAdminEnvironmentController.java`
- Create: `backend/src/main/java/com/intlmedical/controller/hospitaladmin/HospitalAdminCaseController.java`
- Create: `backend/src/main/java/com/intlmedical/controller/hospitaladmin/HospitalAdminProductController.java`

**Interfaces:**
- Consumes: JWT中 userId → 查 users.hospital_id → 确认操作的数据属于该医院
- Produces: 医院管理员只能读写自己医院的数据；新增/编辑后 audit_status 自动设为 'pending'

- [ ] **Step 1: 创建辅助方法 — 获取当前用户绑定的 hospitalId**

每个 controller 注入 UserMapper，通过如下方式获取 hospitalId：
```java
private Long getMyHospitalId() {
    Long userId = SecurityUtil.getCurrentUserId();
    User user = userMapper.selectById(userId);
    if (user == null || user.getHospitalId() == null) {
        throw new RuntimeException("未绑定医院");
    }
    return user.getHospitalId();
}
```

- [ ] **Step 2: 创建 HospitalAdminHospitalController.java**

```java
package com.intlmedical.controller.hospitaladmin;

import com.intlmedical.entity.Hospital;
import com.intlmedical.entity.User;
import com.intlmedical.mapper.HospitalMapper;
import com.intlmedical.mapper.UserMapper;
import com.intlmedical.util.Result;
import com.intlmedical.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/hospital-admin/hospital")
@RequiredArgsConstructor
public class HospitalAdminHospitalController {

    private final HospitalMapper hospitalMapper;
    private final UserMapper userMapper;

    private Long getMyHospitalId() {
        Long userId = SecurityUtil.getCurrentUserId();
        User user = userMapper.selectById(userId);
        if (user == null || user.getHospitalId() == null) throw new RuntimeException("未绑定医院");
        return user.getHospitalId();
    }

    @GetMapping
    public Result<Hospital> get() {
        return Result.ok(hospitalMapper.selectById(getMyHospitalId()));
    }

    @PutMapping
    public Result<Void> update(@RequestBody Hospital hospital) {
        Long hospitalId = getMyHospitalId();
        hospital.setId(hospitalId);
        hospital.setAuditStatus("pending");
        hospital.setRejectionReason(null);
        hospitalMapper.updateById(hospital);
        return Result.ok();
    }
}
```

- [ ] **Step 3: 创建 HospitalAdminDoctorController.java**

```java
package com.intlmedical.controller.hospitaladmin;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.intlmedical.entity.Doctor;
import com.intlmedical.entity.User;
import com.intlmedical.mapper.DoctorMapper;
import com.intlmedical.mapper.UserMapper;
import com.intlmedical.util.Result;
import com.intlmedical.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/hospital-admin/doctors")
@RequiredArgsConstructor
public class HospitalAdminDoctorController {

    private final DoctorMapper doctorMapper;
    private final UserMapper userMapper;

    private Long getMyHospitalId() {
        Long userId = SecurityUtil.getCurrentUserId();
        User user = userMapper.selectById(userId);
        if (user == null || user.getHospitalId() == null) throw new RuntimeException("未绑定医院");
        return user.getHospitalId();
    }

    @GetMapping
    public Result<List<Doctor>> list() {
        Long hospitalId = getMyHospitalId();
        return Result.ok(doctorMapper.selectList(
            new LambdaQueryWrapper<Doctor>().eq(Doctor::getHospitalId, hospitalId)));
    }

    @PostMapping
    public Result<Void> create(@RequestBody Doctor doctor) {
        doctor.setHospitalId(getMyHospitalId());
        doctor.setAuditStatus("pending");
        doctorMapper.insert(doctor);
        return Result.ok();
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody Doctor doctor) {
        Long hospitalId = getMyHospitalId();
        Doctor existing = doctorMapper.selectById(id);
        if (existing == null || !existing.getHospitalId().equals(hospitalId)) {
            return Result.fail(403, "无权操作");
        }
        doctor.setId(id);
        doctor.setHospitalId(hospitalId);
        doctor.setAuditStatus("pending");
        doctor.setRejectionReason(null);
        doctorMapper.updateById(doctor);
        return Result.ok();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        Long hospitalId = getMyHospitalId();
        Doctor existing = doctorMapper.selectById(id);
        if (existing == null || !existing.getHospitalId().equals(hospitalId)) {
            return Result.fail(403, "无权操作");
        }
        doctorMapper.deleteById(id);
        return Result.ok();
    }
}
```

- [ ] **Step 4: 按相同模式创建 Equipment/Environment/Case/Product controller**

HospitalAdminEquipmentController: 路径 `/api/hospital-admin/equipments`, 实体 Equipment, Mapper EquipmentMapper  
HospitalAdminEnvironmentController: 路径 `/api/hospital-admin/environments`, 实体 HospitalEnvironment, Mapper HospitalEnvironmentMapper  
HospitalAdminCaseController: 路径 `/api/hospital-admin/cases`, 实体 Case, Mapper CaseMapper  
HospitalAdminProductController: 路径 `/api/hospital-admin/products`, 实体 SpecialProduct, Mapper SpecialProductMapper  

每个 controller 结构与 DoctorController 完全相同，替换实体名和 Mapper 名即可。所有 create/update 操作将 auditStatus 设为 "pending"。

- [ ] **Step 5: 编译验证**

```bash
cd backend && mvn compile -q
```

Expected: BUILD SUCCESS

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/java/com/intlmedical/controller/hospitaladmin/
git commit -m "feat: add hospital-admin API controllers with hospital scope enforcement"
```

---
### Task 6: 后端 — 审核员 API（/api/reviewer/**）

**Files:**
- Create: `backend/src/main/java/com/intlmedical/controller/reviewer/ReviewerController.java`

**Interfaces:**
- Produces:
  - GET /api/reviewer/pending — 获取所有待审核数据列表（分实体类型）
  - PUT /api/reviewer/{entityType}/{id}/approve — 审核通过（设 audit_status='approved'）
  - PUT /api/reviewer/{entityType}/{id}/reject — 审核拒绝（设 audit_status='rejected', rejection_reason=?）
  - PUT /api/reviewer/{entityType}/{id} — 编辑该条数据（审核员可直接修改内容）
- entityType 取值: hospital | doctor | equipment | environment | case | product

- [ ] **Step 1: 创建 ReviewerController.java**

```java
package com.intlmedical.controller.reviewer;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.intlmedical.entity.*;
import com.intlmedical.mapper.*;
import com.intlmedical.util.Result;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/reviewer")
@RequiredArgsConstructor
public class ReviewerController {

    private final HospitalMapper hospitalMapper;
    private final DoctorMapper doctorMapper;
    private final EquipmentMapper equipmentMapper;
    private final HospitalEnvironmentMapper environmentMapper;
    private final CaseMapper caseMapper;
    private final SpecialProductMapper productMapper;

    @GetMapping("/pending")
    public Result<Map<String, Object>> pending() {
        Map<String, Object> result = new HashMap<>();
        result.put("hospitals", hospitalMapper.selectList(
            new LambdaQueryWrapper<Hospital>().eq(Hospital::getAuditStatus, "pending")));
        result.put("doctors", doctorMapper.selectList(
            new LambdaQueryWrapper<Doctor>().eq(Doctor::getAuditStatus, "pending")));
        result.put("equipments", equipmentMapper.selectList(
            new LambdaQueryWrapper<Equipment>().eq(Equipment::getAuditStatus, "pending")));
        result.put("environments", environmentMapper.selectList(
            new LambdaQueryWrapper<HospitalEnvironment>().eq(HospitalEnvironment::getAuditStatus, "pending")));
        result.put("cases", caseMapper.selectList(
            new LambdaQueryWrapper<Case>().eq(Case::getAuditStatus, "pending")));
        result.put("products", productMapper.selectList(
            new LambdaQueryWrapper<SpecialProduct>().eq(SpecialProduct::getAuditStatus, "pending")));
        return Result.ok(result);
    }

    @Data
    static class AuditRequest {
        private String rejectionReason;
    }

    @PutMapping("/hospitals/{id}/approve")
    public Result<Void> approveHospital(@PathVariable Long id) {
        hospitalMapper.update(null, new LambdaUpdateWrapper<Hospital>()
            .eq(Hospital::getId, id).set(Hospital::getAuditStatus, "approved").set(Hospital::getRejectionReason, null));
        return Result.ok();
    }

    @PutMapping("/hospitals/{id}/reject")
    public Result<Void> rejectHospital(@PathVariable Long id, @RequestBody AuditRequest req) {
        if (req.getRejectionReason() == null || req.getRejectionReason().isBlank()) {
            return Result.fail(400, "拒绝原因不能为空");
        }
        hospitalMapper.update(null, new LambdaUpdateWrapper<Hospital>()
            .eq(Hospital::getId, id).set(Hospital::getAuditStatus, "rejected")
            .set(Hospital::getRejectionReason, req.getRejectionReason()));
        return Result.ok();
    }

    @PutMapping("/hospitals/{id}")
    public Result<Void> editHospital(@PathVariable Long id, @RequestBody Hospital hospital) {
        hospital.setId(id);
        hospitalMapper.updateById(hospital);
        return Result.ok();
    }

    @PutMapping("/doctors/{id}/approve")
    public Result<Void> approveDoctor(@PathVariable Long id) {
        doctorMapper.update(null, new LambdaUpdateWrapper<Doctor>()
            .eq(Doctor::getId, id).set(Doctor::getAuditStatus, "approved").set(Doctor::getRejectionReason, null));
        return Result.ok();
    }

    @PutMapping("/doctors/{id}/reject")
    public Result<Void> rejectDoctor(@PathVariable Long id, @RequestBody AuditRequest req) {
        if (req.getRejectionReason() == null || req.getRejectionReason().isBlank()) return Result.fail(400, "拒绝原因不能为空");
        doctorMapper.update(null, new LambdaUpdateWrapper<Doctor>()
            .eq(Doctor::getId, id).set(Doctor::getAuditStatus, "rejected").set(Doctor::getRejectionReason, req.getRejectionReason()));
        return Result.ok();
    }

    @PutMapping("/doctors/{id}")
    public Result<Void> editDoctor(@PathVariable Long id, @RequestBody Doctor doctor) {
        doctor.setId(id);
        doctorMapper.updateById(doctor);
        return Result.ok();
    }

    @PutMapping("/equipments/{id}/approve")
    public Result<Void> approveEquipment(@PathVariable Long id) {
        equipmentMapper.update(null, new LambdaUpdateWrapper<Equipment>()
            .eq(Equipment::getId, id).set(Equipment::getAuditStatus, "approved").set(Equipment::getRejectionReason, null));
        return Result.ok();
    }

    @PutMapping("/equipments/{id}/reject")
    public Result<Void> rejectEquipment(@PathVariable Long id, @RequestBody AuditRequest req) {
        if (req.getRejectionReason() == null || req.getRejectionReason().isBlank()) return Result.fail(400, "拒绝原因不能为空");
        equipmentMapper.update(null, new LambdaUpdateWrapper<Equipment>()
            .eq(Equipment::getId, id).set(Equipment::getAuditStatus, "rejected").set(Equipment::getRejectionReason, req.getRejectionReason()));
        return Result.ok();
    }

    @PutMapping("/equipments/{id}")
    public Result<Void> editEquipment(@PathVariable Long id, @RequestBody Equipment equipment) {
        equipment.setId(id);
        equipmentMapper.updateById(equipment);
        return Result.ok();
    }

    @PutMapping("/environments/{id}/approve")
    public Result<Void> approveEnvironment(@PathVariable Long id) {
        environmentMapper.update(null, new LambdaUpdateWrapper<HospitalEnvironment>()
            .eq(HospitalEnvironment::getId, id).set(HospitalEnvironment::getAuditStatus, "approved").set(HospitalEnvironment::getRejectionReason, null));
        return Result.ok();
    }

    @PutMapping("/environments/{id}/reject")
    public Result<Void> rejectEnvironment(@PathVariable Long id, @RequestBody AuditRequest req) {
        if (req.getRejectionReason() == null || req.getRejectionReason().isBlank()) return Result.fail(400, "拒绝原因不能为空");
        environmentMapper.update(null, new LambdaUpdateWrapper<HospitalEnvironment>()
            .eq(HospitalEnvironment::getId, id).set(HospitalEnvironment::getAuditStatus, "rejected").set(HospitalEnvironment::getRejectionReason, req.getRejectionReason()));
        return Result.ok();
    }

    @PutMapping("/environments/{id}")
    public Result<Void> editEnvironment(@PathVariable Long id, @RequestBody HospitalEnvironment env) {
        env.setId(id);
        environmentMapper.updateById(env);
        return Result.ok();
    }

    @PutMapping("/cases/{id}/approve")
    public Result<Void> approveCase(@PathVariable Long id) {
        caseMapper.update(null, new LambdaUpdateWrapper<Case>()
            .eq(Case::getId, id).set(Case::getAuditStatus, "approved").set(Case::getRejectionReason, null));
        return Result.ok();
    }

    @PutMapping("/cases/{id}/reject")
    public Result<Void> rejectCase(@PathVariable Long id, @RequestBody AuditRequest req) {
        if (req.getRejectionReason() == null || req.getRejectionReason().isBlank()) return Result.fail(400, "拒绝原因不能为空");
        caseMapper.update(null, new LambdaUpdateWrapper<Case>()
            .eq(Case::getId, id).set(Case::getAuditStatus, "rejected").set(Case::getRejectionReason, req.getRejectionReason()));
        return Result.ok();
    }

    @PutMapping("/cases/{id}")
    public Result<Void> editCase(@PathVariable Long id, @RequestBody Case medCase) {
        medCase.setId(id);
        caseMapper.updateById(medCase);
        return Result.ok();
    }

    @PutMapping("/products/{id}/approve")
    public Result<Void> approveProduct(@PathVariable Long id) {
        productMapper.update(null, new LambdaUpdateWrapper<SpecialProduct>()
            .eq(SpecialProduct::getId, id).set(SpecialProduct::getAuditStatus, "approved").set(SpecialProduct::getRejectionReason, null));
        return Result.ok();
    }

    @PutMapping("/products/{id}/reject")
    public Result<Void> rejectProduct(@PathVariable Long id, @RequestBody AuditRequest req) {
        if (req.getRejectionReason() == null || req.getRejectionReason().isBlank()) return Result.fail(400, "拒绝原因不能为空");
        productMapper.update(null, new LambdaUpdateWrapper<SpecialProduct>()
            .eq(SpecialProduct::getId, id).set(SpecialProduct::getAuditStatus, "rejected").set(SpecialProduct::getRejectionReason, req.getRejectionReason()));
        return Result.ok();
    }

    @PutMapping("/products/{id}")
    public Result<Void> editProduct(@PathVariable Long id, @RequestBody SpecialProduct product) {
        product.setId(id);
        productMapper.updateById(product);
        return Result.ok();
    }
}
```

- [ ] **Step 2: 编译验证**

```bash
cd backend && mvn compile -q
```

Expected: BUILD SUCCESS

- [ ] **Step 3: Commit**

```bash
git add backend/src/main/java/com/intlmedical/controller/reviewer/
git commit -m "feat: add reviewer audit API for approve/reject/edit across all entities"
```

---
### Task 7: 后端 — 公开 API 过滤 approved 数据

**Files:**
- Modify: `backend/src/main/java/com/intlmedical/service/HospitalService.java`
- Modify: `backend/src/main/java/com/intlmedical/controller/DoctorController.java`
- Modify: `backend/src/main/java/com/intlmedical/controller/CaseController.java`
- Modify: `backend/src/main/java/com/intlmedical/controller/EquipmentController.java`
- Modify: `backend/src/main/java/com/intlmedical/controller/ProductController.java`

**Interfaces:**
- Produces: 所有公开 GET 接口只返回 is_active=1 AND audit_status='approved' 的记录

- [ ] **Step 1: 修改 HospitalService.java — listActive 方法**

找到 `listActive()` 方法中的 LambdaQueryWrapper，在 `.eq(Hospital::getIsActive, 1)` 后追加：
```java
.eq(Hospital::getAuditStatus, "approved")
```

找到 `getDetail(Long id)` 中查询 doctors/equipments 等子列表的地方，各自追加：
```java
.eq(Doctor::getAuditStatus, "approved")
.eq(Equipment::getAuditStatus, "approved")
```

- [ ] **Step 2: 修改各公开 Controller**

DoctorController — 在查询条件中追加 `.eq(Doctor::getAuditStatus, "approved")`  
CaseController — 追加 `.eq(Case::getAuditStatus, "approved")`  
EquipmentController — 追加 `.eq(Equipment::getAuditStatus, "approved")`  
ProductController — 追加 `.eq(SpecialProduct::getAuditStatus, "approved")`  

- [ ] **Step 3: 编译验证**

```bash
cd backend && mvn compile -q
```

Expected: BUILD SUCCESS

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/java/com/intlmedical/service/HospitalService.java \
        backend/src/main/java/com/intlmedical/controller/DoctorController.java \
        backend/src/main/java/com/intlmedical/controller/CaseController.java \
        backend/src/main/java/com/intlmedical/controller/EquipmentController.java \
        backend/src/main/java/com/intlmedical/controller/ProductController.java
git commit -m "feat: filter public API to only return approved records"
```

---

### Task 8: 前端 — authStore 和 types 更新

**Files:**
- Modify: `frontend-admin/src/store/authStore.ts`
- Modify: `frontend-admin/src/types/index.ts`
- Modify: `frontend-admin/src/pages/Login/index.tsx`

**Interfaces:**
- Produces: authStore 包含 `role: string | null`; types 包含 AuditStatus, AuditableEntity 等

- [ ] **Step 1: 修改 authStore.ts**

```typescript
// frontend-admin/src/store/authStore.ts
import { create } from 'zustand';

interface AdminAuthState {
  token: string | null;
  username: string | null;
  role: string | null;
  setAuth: (token: string, username: string, role: string) => void;
  logout: () => void;
}

export const useAdminAuthStore = create<AdminAuthState>((set) => ({
  token: localStorage.getItem('admin_token'),
  username: localStorage.getItem('admin_username'),
  role: localStorage.getItem('admin_role'),
  setAuth: (token, username, role) => {
    localStorage.setItem('admin_token', token);
    localStorage.setItem('admin_username', username);
    localStorage.setItem('admin_role', role);
    set({ token, username, role });
  },
  logout: () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_username');
    localStorage.removeItem('admin_role');
    set({ token: null, username: null, role: null });
  },
}));
```

- [ ] **Step 2: 在 types/index.ts 末尾追加**

```typescript
export type AuditStatus = 'pending' | 'approved' | 'rejected';

export interface AuditFields {
  auditStatus: AuditStatus;
  rejectionReason: string | null;
}

export interface StaffUser {
  email: string;
  password: string;
  roleId: 3 | 4;
  hospitalId?: number;
  firstName?: string;
  lastName?: string;
}
```

- [ ] **Step 3: 修改 Login/index.tsx — setAuth 传入 role**

找到登录成功后调用 `setAuth(token, username)` 的位置，改为：
```typescript
const { token, username, role } = res.data.data;
setAuth(token, username, role);
```

- [ ] **Step 4: Commit**

```bash
git add frontend-admin/src/store/authStore.ts \
        frontend-admin/src/types/index.ts \
        frontend-admin/src/pages/Login/
git commit -m "feat: store role in authStore and add audit types"
```

---

### Task 9: 前端 — AdminLayout 按角色渲染菜单

**Files:**
- Modify: `frontend-admin/src/components/AdminLayout.tsx`

**Interfaces:**
- Consumes: `useAdminAuthStore().role` → 'admin' | 'hospital_admin' | 'reviewer'
- Produces: admin 看全部菜单；hospital_admin 只看医院相关菜单；reviewer 只看审核工作台

- [ ] **Step 1: 修改 AdminLayout.tsx**

将 `menuItems` 常量替换为按 role 动态计算的版本：

```typescript
import { useAdminAuthStore } from '../store/authStore';
// ...在组件内:
const { username, logout, role } = useAdminAuthStore();

const adminMenuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '控制台' },
  { key: '/hospitals', icon: <BankOutlined />, label: '医院管理' },
  { key: '/doctors', icon: <UserOutlined />, label: '医生管理' },
  { key: '/equipments', icon: <MedicineBoxOutlined />, label: '设备管理' },
  { key: '/environments', icon: <BankOutlined />, label: '诊疗环境' },
  { key: '/service-teams', icon: <TeamOutlined />, label: '服务团队' },
  { key: '/service-features', icon: <AppstoreOutlined />, label: '服务功能' },
  { key: '/products', icon: <ShoppingOutlined />, label: '产品管理' },
  { key: '/cases', icon: <FileTextOutlined />, label: '过往案例' },
  { key: '/users', icon: <TeamOutlined />, label: '用户管理' },
  { key: '/config', icon: <SettingOutlined />, label: '网站配置' },
];

const hospitalAdminMenuItems = [
  { key: '/ha/dashboard', icon: <DashboardOutlined />, label: '控制台' },
  { key: '/ha/hospital', icon: <BankOutlined />, label: '医院信息' },
  { key: '/ha/doctors', icon: <UserOutlined />, label: '医生管理' },
  { key: '/ha/equipments', icon: <MedicineBoxOutlined />, label: '设备管理' },
  { key: '/ha/environments', icon: <BankOutlined />, label: '诊疗环境' },
  { key: '/ha/cases', icon: <FileTextOutlined />, label: '过往案例' },
  { key: '/ha/products', icon: <ShoppingOutlined />, label: '产品管理' },
];

const reviewerMenuItems = [
  { key: '/reviewer/pending', icon: <FileTextOutlined />, label: '待审核' },
];

const menuItems =
  role === 'hospital_admin' ? hospitalAdminMenuItems :
  role === 'reviewer' ? reviewerMenuItems :
  adminMenuItems;
```

- [ ] **Step 2: 编译验证**

```bash
cd frontend-admin && npm run build 2>&1 | tail -5
```

Expected: ✓ built in 或 no TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add frontend-admin/src/components/AdminLayout.tsx
git commit -m "feat: role-based menu rendering in AdminLayout"
```

---
### Task 10: 前端 — 医院管理员页面

**Files:**
- Create: `frontend-admin/src/pages/HospitalAdminManage/HADashboard.tsx`
- Create: `frontend-admin/src/pages/HospitalAdminManage/HAHospital.tsx`
- Create: `frontend-admin/src/pages/HospitalAdminManage/HADoctors.tsx`
- Create: `frontend-admin/src/pages/HospitalAdminManage/HAEquipments.tsx`
- Create: `frontend-admin/src/pages/HospitalAdminManage/HAEnvironments.tsx`
- Create: `frontend-admin/src/pages/HospitalAdminManage/HACases.tsx`
- Create: `frontend-admin/src/pages/HospitalAdminManage/HAProducts.tsx`

**Interfaces:**
- Consumes: /api/hospital-admin/** endpoints
- Produces: 医院管理员管理页面，显示审核状态标签，被拒绝时显示拒绝原因

- [ ] **Step 1: 创建 HADashboard.tsx**

```tsx
// frontend-admin/src/pages/HospitalAdminManage/HADashboard.tsx
import React from 'react';
import { Card, Typography } from 'antd';
const { Title, Text } = Typography;

const HADashboard: React.FC = () => (
  <Card>
    <Title level={4}>医院管理员控制台</Title>
    <Text>欢迎使用医院管理系统，请从左侧菜单选择管理项目。</Text>
  </Card>
);
export default HADashboard;
```

- [ ] **Step 2: 创建 HAHospital.tsx — 医院信息编辑（含审核状态显示）**

```tsx
// frontend-admin/src/pages/HospitalAdminManage/HAHospital.tsx
import React, { useEffect, useState } from 'react';
import { Card, Form, Input, Button, Tag, Alert, message, Typography } from 'antd';
import api from '../../api';
import type { Hospital } from '../../types';

const { Title } = Typography;

const auditTag = (status: string, reason: string | null) => {
  if (status === 'approved') return <Tag color="green">已通过</Tag>;
  if (status === 'rejected') return <Tag color="red">已拒绝</Tag>;
  return <Tag color="orange">待审核</Tag>;
};

const HAHospital: React.FC = () => {
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/api/hospital-admin/hospital').then(res => {
      const data = res.data?.data || res.data;
      setHospital(data);
      form.setFieldsValue(data);
    });
  }, [form]);

  const onSave = async (values: Partial<Hospital>) => {
    setLoading(true);
    try {
      await api.put('/api/hospital-admin/hospital', values);
      message.success('保存成功，等待审核');
      const res = await api.get('/api/hospital-admin/hospital');
      setHospital(res.data?.data || res.data);
    } catch {
      message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Title level={4}>医院信息</Title>
      {hospital && (
        <div style={{ marginBottom: 16 }}>
          审核状态：{auditTag(hospital.auditStatus as string, hospital.rejectionReason as string | null)}
          {hospital.auditStatus === 'rejected' && hospital.rejectionReason && (
            <Alert type="error" message={`拒绝原因：${hospital.rejectionReason}`} style={{ marginTop: 8 }} />
          )}
        </div>
      )}
      <Card>
        <Form form={form} layout="vertical" onFinish={onSave}>
          <Form.Item name="nameZh" label="中文名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="nameEn" label="英文名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="introZh" label="中文简介">
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="introEn" label="英文简介">
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="addressZh" label="中文地址">
            <Input />
          </Form.Item>
          <Form.Item name="addressEn" label="英文地址">
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="电话">
            <Input />
          </Form.Item>
          <Form.Item name="contactPerson" label="联系人">
            <Input />
          </Form.Item>
          <Form.Item name="contactInfo" label="联系方式">
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>保存（提交审核）</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};
export default HAHospital;
```

- [ ] **Step 3: 创建 HADoctors.tsx — 复用 DoctorManage 模式，追加审核状态列**

```tsx
// frontend-admin/src/pages/HospitalAdminManage/HADoctors.tsx
import React, { useEffect, useState } from 'react';
import { Table, Button, Tag, Space, Popconfirm, message, Card, Typography, Row, Col, Modal, Form, Input, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '../../api';
import type { Doctor } from '../../types';

const { Title } = Typography;

const auditTag = (s: string) =>
  s === 'approved' ? <Tag color="green">已通过</Tag> :
  s === 'rejected'  ? <Tag color="red">已拒绝</Tag> :
                      <Tag color="orange">待审核</Tag>;

const HADoctors: React.FC = () => {
  const [data, setData] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<Doctor | null>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/hospital-admin/doctors');
      setData(res.data?.data || []);
    } catch { message.error('获取医生列表失败'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => { setEditRecord(null); form.resetFields(); setModalOpen(true); };
  const openEdit = (r: Doctor) => { setEditRecord(r); form.setFieldsValue(r); setModalOpen(true); };

  const handleSave = async () => {
    const values = await form.validateFields();
    try {
      if (editRecord) {
        await api.put(`/api/hospital-admin/doctors/${editRecord.id}`, values);
      } else {
        await api.post('/api/hospital-admin/doctors', values);
      }
      message.success('保存成功，等待审核');
      setModalOpen(false);
      fetchData();
    } catch { message.error('保存失败'); }
  };

  const handleDelete = async (id: number) => {
    await api.delete(`/api/hospital-admin/doctors/${id}`);
    message.success('删除成功');
    fetchData();
  };

  const columns: ColumnsType<Doctor> = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '姓名(中)', dataIndex: 'nameZh' },
    { title: '专科', dataIndex: 'specialtyZh' },
    { title: '审核状态', dataIndex: 'auditStatus', render: (v: string, r: any) => (
      <Space direction="vertical" size={0}>
        {auditTag(v)}
        {v === 'rejected' && r.rejectionReason && <small style={{color:'red'}}>{r.rejectionReason}</small>}
      </Space>
    )},
    { title: '操作', render: (_: unknown, r: Doctor) => (
      <Space>
        <Button type="link" icon={<EditOutlined />} size="small" onClick={() => openEdit(r)}>编辑</Button>
        <Popconfirm title="确认删除？" onConfirm={() => handleDelete(r.id)}>
          <Button type="link" danger size="small" icon={<DeleteOutlined />}>删除</Button>
        </Popconfirm>
      </Space>
    )},
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col><Title level={4}>医生管理</Title></Col>
        <Col><Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>新增医生</Button></Col>
      </Row>
      <Card>
        <Table rowKey="id" columns={columns} dataSource={data} loading={loading} />
      </Card>
      <Modal title={editRecord ? '编辑医生' : '新增医生'} open={modalOpen}
        onOk={handleSave} onCancel={() => setModalOpen(false)} okText="保存（提交审核）">
        <Form form={form} layout="vertical">
          <Form.Item name="nameZh" label="中文姓名" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="nameEn" label="英文姓名" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="specialtyZh" label="专科(中)" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="specialtyEn" label="专科(英)" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="titleZh" label="职称(中)"><Input /></Form.Item>
          <Form.Item name="titleEn" label="职称(英)"><Input /></Form.Item>
          <Form.Item name="bioZh" label="简介(中)"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="bioEn" label="简介(英)"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="pricePerVisit" label="诊费(元)"><InputNumber style={{ width: '100%' }} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
export default HADoctors;
```

- [ ] **Step 4: 用相同模式创建 HAEquipments、HAEnvironments、HACases、HAProducts**

每个页面与 HADoctors 结构相同，替换以下内容：
- HAEquipments: endpoint `/api/hospital-admin/equipments`, 实体字段 nameZh/nameEn/descZh/descEn
- HAEnvironments: endpoint `/api/hospital-admin/environments`, 字段同 HAEquipments
- HACases: endpoint `/api/hospital-admin/cases`, 字段 titleZh/titleEn/summaryZh/summaryEn
- HAProducts: endpoint `/api/hospital-admin/products`, 字段 nameZh/nameEn/summaryZh/summaryEn/priceMin/priceMax

- [ ] **Step 5: 编译验证**

```bash
cd frontend-admin && npm run build 2>&1 | tail -5
```

Expected: built in (no errors)

- [ ] **Step 6: Commit**

```bash
git add frontend-admin/src/pages/HospitalAdminManage/
git commit -m "feat: hospital admin management pages with audit status display"
```

---
### Task 11: 前端 — 审核员工作台页面

**Files:**
- Create: `frontend-admin/src/pages/ReviewerManage/ReviewerPending.tsx`

**Interfaces:**
- Consumes: GET /api/reviewer/pending, PUT /api/reviewer/{entity}/{id}/approve, PUT /api/reviewer/{entity}/{id}/reject, PUT /api/reviewer/{entity}/{id}
- Produces: 标签页展示各类待审核数据，支持通过/拒绝/编辑操作

- [ ] **Step 1: 创建 ReviewerPending.tsx**

```tsx
// frontend-admin/src/pages/ReviewerManage/ReviewerPending.tsx
import React, { useEffect, useState } from 'react';
import { Tabs, Table, Button, Space, Tag, Popconfirm, Modal, Form, Input, message, Typography } from 'antd';
import { CheckOutlined, CloseOutlined, EditOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '../../api';

const { Title } = Typography;
const { TextArea } = Input;

interface PendingData {
  hospitals: any[];
  doctors: any[];
  equipments: any[];
  environments: any[];
  cases: any[];
  products: any[];
}

const ReviewerPending: React.FC = () => {
  const [data, setData] = useState<PendingData>({ hospitals: [], doctors: [], equipments: [], environments: [], cases: [], products: [] });
  const [loading, setLoading] = useState(false);
  const [rejectModal, setRejectModal] = useState<{ entity: string; id: number } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [editModal, setEditModal] = useState<{ entity: string; record: any } | null>(null);
  const [editForm] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/reviewer/pending');
      setData(res.data?.data || res.data);
    } catch { message.error('获取待审核数据失败'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleApprove = async (entity: string, id: number) => {
    await api.put(`/api/reviewer/${entity}/${id}/approve`);
    message.success('审核通过');
    fetchData();
  };

  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) { message.error('请填写拒绝原因'); return; }
    await api.put(`/api/reviewer/${rejectModal!.entity}/${rejectModal!.id}/reject`, { rejectionReason: rejectReason });
    message.success('已拒绝');
    setRejectModal(null);
    setRejectReason('');
    fetchData();
  };

  const handleEditSave = async () => {
    const values = await editForm.validateFields();
    await api.put(`/api/reviewer/${editModal!.entity}/${editModal!.record.id}`, values);
    message.success('保存成功');
    setEditModal(null);
    fetchData();
  };

  const makeColumns = (entity: string, nameKey: string): ColumnsType<any> => [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '名称', dataIndex: nameKey, ellipsis: true },
    { title: '操作', width: 220, render: (_: unknown, r: any) => (
      <Space>
        <Button type="primary" size="small" icon={<CheckOutlined />}
          onClick={() => handleApprove(entity, r.id)}>通过</Button>
        <Button danger size="small" icon={<CloseOutlined />}
          onClick={() => { setRejectModal({ entity, id: r.id }); setRejectReason(''); }}>拒绝</Button>
        <Button size="small" icon={<EditOutlined />}
          onClick={() => { setEditModal({ entity, record: r }); editForm.setFieldsValue(r); }}>编辑</Button>
      </Space>
    )},
  ];

  const tabs = [
    { key: 'hospitals',    label: `医院(${data.hospitals.length})`,    data: data.hospitals,    cols: makeColumns('hospitals', 'nameZh') },
    { key: 'doctors',      label: `医生(${data.doctors.length})`,      data: data.doctors,      cols: makeColumns('doctors', 'nameZh') },
    { key: 'equipments',   label: `设备(${data.equipments.length})`,   data: data.equipments,   cols: makeColumns('equipments', 'nameZh') },
    { key: 'environments', label: `环境(${data.environments.length})`, data: data.environments, cols: makeColumns('environments', 'nameZh') },
    { key: 'cases',        label: `案例(${data.cases.length})`,        data: data.cases,        cols: makeColumns('cases', 'titleZh') },
    { key: 'products',     label: `产品(${data.products.length})`,     data: data.products,     cols: makeColumns('products', 'nameZh') },
  ];

  return (
    <div>
      <Title level={4}>待审核数据</Title>
      <Tabs
        items={tabs.map(t => ({
          key: t.key,
          label: t.label,
          children: <Table rowKey="id" columns={t.cols} dataSource={t.data} loading={loading} size="small" />,
        }))}
      />

      <Modal title="填写拒绝原因" open={!!rejectModal} onOk={handleRejectSubmit}
        onCancel={() => setRejectModal(null)} okText="确认拒绝" okButtonProps={{ danger: true }}>
        <TextArea rows={4} value={rejectReason} onChange={e => setRejectReason(e.target.value)}
          placeholder="请说明拒绝原因，医院管理员将看到此内容" />
      </Modal>

      <Modal title="编辑数据" open={!!editModal} onOk={handleEditSave}
        onCancel={() => setEditModal(null)} okText="保存" width={600}>
        <Form form={editForm} layout="vertical">
          {editModal?.entity === 'hospitals' && <>
            <Form.Item name="nameZh" label="中文名称"><Input /></Form.Item>
            <Form.Item name="nameEn" label="英文名称"><Input /></Form.Item>
            <Form.Item name="introZh" label="中文简介"><Input.TextArea rows={3} /></Form.Item>
            <Form.Item name="introEn" label="英文简介"><Input.TextArea rows={3} /></Form.Item>
            <Form.Item name="addressZh" label="地址(中)"><Input /></Form.Item>
            <Form.Item name="phone" label="电话"><Input /></Form.Item>
          </>}
          {editModal?.entity === 'doctors' && <>
            <Form.Item name="nameZh" label="姓名(中)"><Input /></Form.Item>
            <Form.Item name="nameEn" label="姓名(英)"><Input /></Form.Item>
            <Form.Item name="specialtyZh" label="专科(中)"><Input /></Form.Item>
            <Form.Item name="bioZh" label="简介(中)"><Input.TextArea rows={3} /></Form.Item>
          </>}
          {(editModal?.entity === 'equipments' || editModal?.entity === 'environments') && <>
            <Form.Item name="nameZh" label="名称(中)"><Input /></Form.Item>
            <Form.Item name="nameEn" label="名称(英)"><Input /></Form.Item>
            <Form.Item name="descZh" label="描述(中)"><Input.TextArea rows={3} /></Form.Item>
          </>}
          {editModal?.entity === 'cases' && <>
            <Form.Item name="titleZh" label="标题(中)"><Input /></Form.Item>
            <Form.Item name="titleEn" label="标题(英)"><Input /></Form.Item>
            <Form.Item name="summaryZh" label="摘要(中)"><Input.TextArea rows={3} /></Form.Item>
          </>}
          {editModal?.entity === 'products' && <>
            <Form.Item name="nameZh" label="名称(中)"><Input /></Form.Item>
            <Form.Item name="nameEn" label="名称(英)"><Input /></Form.Item>
            <Form.Item name="summaryZh" label="摘要(中)"><Input.TextArea rows={3} /></Form.Item>
          </>}
        </Form>
      </Modal>
    </div>
  );
};
export default ReviewerPending;
```

- [ ] **Step 2: 编译验证**

```bash
cd frontend-admin && npm run build 2>&1 | tail -5
```

Expected: built in (no errors)

- [ ] **Step 3: Commit**

```bash
git add frontend-admin/src/pages/ReviewerManage/
git commit -m "feat: reviewer audit workbench with approve/reject/edit"
```

---

### Task 12: 前端 — App.tsx 新增路由 + 管理员创建账号页面

**Files:**
- Modify: `frontend-admin/src/App.tsx`
- Create: `frontend-admin/src/pages/UserManage/CreateStaff.tsx`

**Interfaces:**
- Consumes: 所有新建页面组件; POST /api/admin/users/create-staff
- Produces: 完整路由树，管理员可创建 hospital_admin/reviewer 账号

- [ ] **Step 1: 创建 CreateStaff.tsx**

```tsx
// frontend-admin/src/pages/UserManage/CreateStaff.tsx
import React, { useEffect, useState } from 'react';
import { Card, Form, Input, Select, Button, message, Typography } from 'antd';
import api from '../../api';
import type { Hospital } from '../../types';

const { Title } = Typography;

const CreateStaff: React.FC = () => {
  const [form] = Form.useForm();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [roleId, setRoleId] = useState<number>(3);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/api/admin/hospitals', { params: { page: 1, size: 100 } }).then(res => {
      const d = res.data?.data;
      setHospitals(d?.records || []);
    });
  }, []);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      await api.post('/api/admin/users/create-staff', values);
      message.success('账号创建成功');
      form.resetFields();
    } catch (e: any) {
      message.error(e?.response?.data?.message || '创建失败');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <Title level={4}>创建员工账号</Title>
      <Card style={{ maxWidth: 500 }}>
        <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ roleId: 3 }}>
          <Form.Item name="roleId" label="角色" rules={[{ required: true }]}>
            <Select onChange={v => setRoleId(v)}>
              <Select.Option value={3}>医院管理员</Select.Option>
              <Select.Option value={4}>信息审核员</Select.Option>
            </Select>
          </Form.Item>
          {roleId === 3 && (
            <Form.Item name="hospitalId" label="绑定医院" rules={[{ required: true, message: '请选择医院' }]}>
              <Select placeholder="选择医院">
                {hospitals.map(h => <Select.Option key={h.id} value={h.id}>{h.nameZh}</Select.Option>)}
              </Select>
            </Form.Item>
          )}
          <Form.Item name="email" label="邮箱" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, min: 6 }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="firstName" label="名"><Input /></Form.Item>
          <Form.Item name="lastName" label="姓"><Input /></Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>创建账号</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};
export default CreateStaff;
```

- [ ] **Step 2: 修改 App.tsx 新增所有路由**

在 `<Route path="users" element={<UserManage />} />` 下方添加：
```tsx
<Route path="users/create-staff" element={<CreateStaff />} />
<Route path="ha/dashboard" element={<HADashboard />} />
<Route path="ha/hospital" element={<HAHospital />} />
<Route path="ha/doctors" element={<HADoctors />} />
<Route path="ha/equipments" element={<HAEquipments />} />
<Route path="ha/environments" element={<HAEnvironments />} />
<Route path="ha/cases" element={<HACases />} />
<Route path="ha/products" element={<HAProducts />} />
<Route path="reviewer/pending" element={<ReviewerPending />} />
```

在文件顶部添加对应 import：
```tsx
import CreateStaff from './pages/UserManage/CreateStaff';
import HADashboard from './pages/HospitalAdminManage/HADashboard';
import HAHospital from './pages/HospitalAdminManage/HAHospital';
import HADoctors from './pages/HospitalAdminManage/HADoctors';
import HAEquipments from './pages/HospitalAdminManage/HAEquipments';
import HAEnvironments from './pages/HospitalAdminManage/HAEnvironments';
import HACases from './pages/HospitalAdminManage/HACases';
import HAProducts from './pages/HospitalAdminManage/HAProducts';
import ReviewerPending from './pages/ReviewerManage/ReviewerPending';
```

- [ ] **Step 3: 在 AdminLayout.tsx 的 admin 菜单项中新增"创建员工"入口**

在 adminMenuItems 的 users 项后添加：
```typescript
{ key: '/users/create-staff', icon: <UserOutlined />, label: '创建员工账号' },
```

- [ ] **Step 4: 编译验证**

```bash
cd frontend-admin && npm run build 2>&1 | tail -10
```

Expected: built in (no TypeScript errors)

- [ ] **Step 5: Commit**

```bash
git add frontend-admin/src/App.tsx \
        frontend-admin/src/pages/UserManage/CreateStaff.tsx \
        frontend-admin/src/components/AdminLayout.tsx
git commit -m "feat: add routing for hospital-admin/reviewer pages and create-staff page"
```

---

## 验收检查清单

- [ ] 执行 `db/migration_v2.sql` 后数据库有 4 个角色，六张表有 audit_status 列
- [ ] 以超级管理员登录 frontend-admin，在"创建员工账号"页创建一个 hospital_admin 账号并绑定医院
- [ ] 用 hospital_admin 账号登录，只看到医院相关菜单，能编辑医院信息、医生等，保存后状态变为"待审核"
- [ ] 创建一个 reviewer 账号，登录后只看到"待审核"菜单，能对各类数据进行审核通过/拒绝/编辑
- [ ] 审核通过后，访问 frontend-site-a 对应板块能看到该数据；审核未通过则不展示
- [ ] 审核拒绝时必须填写原因，hospital_admin 编辑页面显示拒绝原因和 Tag
- [ ] 现有 admin 账号功能不受影响，所有 /api/admin/** 路由正常工作
