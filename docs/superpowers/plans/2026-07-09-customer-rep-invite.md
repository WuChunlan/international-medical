# 客户代表邀请与归属 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增「客户代表」角色，每个代表有独立邀请码/二维码；客户扫码到 frontend-site-a 注册后归属该代表；超管在管理端管理代表、查看名下客户数、开关邀请权限；代表可登录管理端专属工作台查看自己的邀请码与客户。

**Architecture:** 方案 A（最小侵入）。复用现有 `users` 单表 + `role_id` 区分角色的体系，新增 3 列（`invite_code` / `can_invite` / `referred_by`），不建新表。后端 Spring Boot + MyBatis-Plus 沿用现有 Controller/Mapper 直连模式；管理端 React + Antd 复用 `HospitalAdminManage` 的 Table+Drawer 模式；二维码用 `qrcode.react` 前端渲染，基地址存 `site_configs` 表由超管配置。

**Tech Stack:** Java 17 / Spring Boot 3 / Spring Security / MyBatis-Plus / MySQL；React + TypeScript + Vite + Antd 6 + axios；qrcode.react（新增）。

## Global Constraints

- 角色映射全系统统一：`1=user 2=admin 3=hospital_admin 4=reviewer 5=customer_rep`（`invite_code`/`can_invite` 仅对 role_id=5 有意义，`referred_by` 仅对 role_id=1 有值）。
- 邀请码：8 位，字符集 `ABCDEFGHJKMNPQRSTUVWXYZ23456789`（去除易混 `0 O 1 I L`），生成时唯一性校验冲突重试。
- 任何返回 `User` 的接口必须 `setPasswordHash(null)`。
- 代表工作台接口 `/api/rep/**` 的当前用户 id 一律从 `Authentication auth` 的 `(Long) auth.getPrincipal()` 取，绝不信任前端传参。
- 无效/关闭的邀请码：注册仍成功，仅 `referred_by=null`（宽松，不阻断）。
- 后端 API 统一返回 `Result<T>`（`Result.ok(data)` / `Result.fail(code,msg)`）；管理端 axios 拦截器已自动拆 `Result` 信封（`res.data` 即 `data`）。
- 测试现状：本仓库无既有测试、后端用 MySQL（非 H2）。本计划对纯逻辑（邀请码生成器）用 JUnit 做 TDD；对依赖 DB 的 Controller/Service 层用 `mvn -q compile` 编译验证 + 手动 HTTP 验证（curl），不新建集成测试框架（属超范围）。前端用 `npm run build` 验证。

---

## File Structure

**后端（backend/src/main/java/com/intlmedical/）**
- Modify `entity/User.java` — 加 `inviteCode` / `canInvite` / `referredBy` 字段。
- Create `util/InviteCodeGenerator.java` — 纯逻辑：生成 8 位邀请码 + 唯一性重试。
- Create `test/.../util/InviteCodeGeneratorTest.java` — 生成器单元测试。
- Modify `dto/request/RegisterRequest.java` — 加可选 `inviteCode`。
- Modify `service/AuthService.java` — login 加 `case 5`；register 归属逻辑；新增 `inviteInfo(code)`。
- Modify `controller/AuthController.java` — 新增 `GET /api/auth/invite-info`。
- Create `controller/admin/AdminCustomerRepController.java` — 超管管理代表（CRUD + 统计 + 开关 + 客户列表）。
- Create `controller/rep/RepController.java` — 代表工作台（`/api/rep/me`、`/api/rep/customers`）。
- Modify `config/SecurityConfig.java` — 加 `/api/rep/**` 规则。
- Modify `db/schema.sql`；Create `db/migration_v4.sql` — 同步 3 列 + 角色 + site_config 行。

**管理端（frontend-admin/src/）**
- Modify `types/index.ts` — `User` 加 `inviteCode?`/`canInvite?`/`referredBy?`。
- Modify `store/authStore.ts` — `Role` 加 `'customer_rep'`。
- Modify `pages/Login/index.tsx` — allowedRoles 加 `'customer_rep'`。
- Create `pages/CustomerRepManage/index.tsx` — 超管代表管理页。
- Create `components/InviteQrModal.tsx` — 二维码弹窗（共用组件）。
- Create `pages/RepDashboard/index.tsx` — 代表工作台。
- Modify `components/AdminLayout.tsx` — 菜单项 + 角色分支 + roleLabels。
- Modify `App.tsx` — 路由。
- Modify `package.json` — 加 `qrcode.react`。

**注册端（frontend-site-a/src/）**
- Modify `pages/Register/index.tsx` — 读 `?code=`、显示邀请人、随注册提交。
- Modify `i18n.ts` — 邀请相关文案 key。

---

## Task 1: User 实体加字段 + 数据库 schema 同步

**Files:**
- Modify: `backend/src/main/java/com/intlmedical/entity/User.java`
- Modify: `db/schema.sql:27-45`（users 建表段落）、`db/data.sql:6`（roles 插入）
- Create: `db/migration_v4.sql`

**Interfaces:**
- Produces: `User.getInviteCode()/setInviteCode(String)`、`getCanInvite()/setCanInvite(Integer)`、`getReferredBy()/setReferredBy(Long)`。

- [ ] **Step 1: 给 User 实体加三个字段**

在 `entity/User.java` 的 `hospitalId` 字段之后、`createdAt` 之前插入：

```java
    private String inviteCode;
    private Integer canInvite;
    private Long referredBy;
```

（MyBatis-Plus 默认驼峰↔下划线映射，`inviteCode→invite_code` 等无需 `@TableField`。）

- [ ] **Step 2: 创建迁移脚本 db/migration_v4.sql**

```sql
-- v4: 客户代表邀请与归属
USE international_medical;

ALTER TABLE users
  ADD COLUMN invite_code  VARCHAR(16) DEFAULT NULL COMMENT '邀请码，仅客户代表(role_id=5)有值' AFTER hospital_id,
  ADD COLUMN can_invite   TINYINT(1)  NOT NULL DEFAULT 1 COMMENT '客户代表邀请开关：1=生效 0=失效' AFTER invite_code,
  ADD COLUMN referred_by  BIGINT UNSIGNED DEFAULT NULL COMMENT '归属客户代表 user_id，仅普通客户有值' AFTER can_invite,
  ADD UNIQUE KEY uk_invite_code (invite_code),
  ADD KEY idx_referred_by (referred_by);

INSERT IGNORE INTO roles (id, code, name_zh, name_en) VALUES
  (5, 'customer_rep', '客户代表', 'Customer Rep');

INSERT IGNORE INTO site_configs (config_key, value_zh, value_en, description) VALUES
  ('site_a_base_url', 'http://localhost:3000', 'http://localhost:3000', '客户代表邀请二维码指向的注册站点基地址');
```

> 注：线上库 3 列已手动加好。此脚本用于保持 schema 文件与新环境一致。若 `site_configs` 无 `config_key`/`value_zh`/`value_en`/`description` 列名差异，以 `db/schema.sql` 中 site_configs 实际列为准调整。

- [ ] **Step 3: 同步 db/schema.sql**

在 `db/schema.sql` 的 users 建表中 `hospital_id` 行后加：

```sql
  invite_code     VARCHAR(16)      DEFAULT NULL COMMENT '邀请码，仅客户代表(role_id=5)有值',
  can_invite      TINYINT(1)       NOT NULL DEFAULT 1 COMMENT '客户代表邀请开关：1=生效 0=失效',
  referred_by     BIGINT UNSIGNED  DEFAULT NULL COMMENT '归属客户代表 user_id，仅普通客户有值',
```

并把 `role_id` 注释更新为 `1=user 2=admin 3=hospital_admin 4=reviewer 5=customer_rep`，在建表末尾（`PRIMARY KEY` 后）补 `UNIQUE KEY uk_invite_code (invite_code)` 与 `KEY idx_referred_by (referred_by)`。

- [ ] **Step 4: 编译验证**

Run: `cd backend && mvn -q compile`
Expected: BUILD 无错误（User 新字段编译通过）。

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/com/intlmedical/entity/User.java db/migration_v4.sql db/schema.sql db/data.sql
git commit -m "feat(customer-rep): add invite fields to User entity and schema"
```

---

## Task 2: 邀请码生成器（TDD）

**Files:**
- Create: `backend/src/main/java/com/intlmedical/util/InviteCodeGenerator.java`
- Test: `backend/src/test/java/com/intlmedical/util/InviteCodeGeneratorTest.java`

**Interfaces:**
- Produces: `InviteCodeGenerator.generate()` → `String`（8 位，字符集受限）；`InviteCodeGenerator.generateUnique(java.util.function.Predicate<String> exists)` → `String`（重试直到 `exists.test(code)==false`）。

- [ ] **Step 1: 写失败测试**

创建 `backend/src/test/java/com/intlmedical/util/InviteCodeGeneratorTest.java`：

```java
package com.intlmedical.util;

import org.junit.jupiter.api.Test;
import java.util.HashSet;
import java.util.Set;
import static org.junit.jupiter.api.Assertions.*;

class InviteCodeGeneratorTest {

    private static final String ALLOWED = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

    @Test
    void generate_hasLength8AndAllowedCharsOnly() {
        for (int i = 0; i < 200; i++) {
            String code = InviteCodeGenerator.generate();
            assertEquals(8, code.length(), "长度应为8");
            for (char c : code.toCharArray()) {
                assertTrue(ALLOWED.indexOf(c) >= 0, "非法字符: " + c);
            }
        }
    }

    @Test
    void generateUnique_retriesUntilNotExists() {
        Set<String> taken = new HashSet<>();
        // 前两次都判定"已存在"，第三次才通过
        int[] calls = {0};
        String code = InviteCodeGenerator.generateUnique(c -> {
            calls[0]++;
            return calls[0] < 3; // 前2次返回 true(已存在)
        });
        assertNotNull(code);
        assertEquals(3, calls[0], "应重试到第3次");
        assertFalse(taken.contains(code));
    }
}
```

- [ ] **Step 2: 运行确认失败**

Run: `cd backend && mvn -q -Dtest=InviteCodeGeneratorTest test`
Expected: 编译失败/测试失败（`InviteCodeGenerator` 不存在）。

- [ ] **Step 3: 写最小实现**

创建 `backend/src/main/java/com/intlmedical/util/InviteCodeGenerator.java`：

```java
package com.intlmedical.util;

import java.security.SecureRandom;
import java.util.function.Predicate;

public final class InviteCodeGenerator {

    private static final String ALLOWED = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    private static final int LENGTH = 8;
    private static final int MAX_RETRY = 20;
    private static final SecureRandom RANDOM = new SecureRandom();

    private InviteCodeGenerator() {}

    public static String generate() {
        StringBuilder sb = new StringBuilder(LENGTH);
        for (int i = 0; i < LENGTH; i++) {
            sb.append(ALLOWED.charAt(RANDOM.nextInt(ALLOWED.length())));
        }
        return sb.toString();
    }

    /** exists.test(code) 返回 true 表示该码已被占用，需要重试。 */
    public static String generateUnique(Predicate<String> exists) {
        for (int i = 0; i < MAX_RETRY; i++) {
            String code = generate();
            if (!exists.test(code)) {
                return code;
            }
        }
        throw new RuntimeException("邀请码生成失败：多次冲突");
    }
}
```

- [ ] **Step 4: 运行确认通过**

Run: `cd backend && mvn -q -Dtest=InviteCodeGeneratorTest test`
Expected: PASS（2 个测试通过）。

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/com/intlmedical/util/InviteCodeGenerator.java backend/src/test/java/com/intlmedical/util/InviteCodeGeneratorTest.java
git commit -m "feat(customer-rep): add invite code generator with tests"
```

---

## Task 3: 注册归属逻辑 + 邀请信息接口 + role_id=5 登录

**Files:**
- Modify: `backend/src/main/java/com/intlmedical/dto/request/RegisterRequest.java`
- Modify: `backend/src/main/java/com/intlmedical/service/AuthService.java`
- Modify: `backend/src/main/java/com/intlmedical/controller/AuthController.java`

**Interfaces:**
- Consumes: `RegisterRequest.getInviteCode()`；`User` 字段（Task 1）。
- Produces: `AuthService.inviteInfo(String code)` → `Map<String,Object>`（`{valid:boolean, repName:String|null}`）。

- [ ] **Step 1: RegisterRequest 加可选 inviteCode**

在 `dto/request/RegisterRequest.java` 的 `verifyCode` 字段前加：

```java
    private String inviteCode;
```

- [ ] **Step 2: AuthService.login 支持 role_id=5**

在 `login()` 的 role switch 中，`case 4 -> "reviewer";` 之后加一行：

```java
            case 5 -> "customer_rep";
```

- [ ] **Step 3: register 写入归属**

在 `register()` 中，`user.setIsActive(1);` 之后、`userMapper.insert(user);` 之前插入归属逻辑：

```java
        if (req.getInviteCode() != null && !req.getInviteCode().isBlank()) {
            User rep = userMapper.selectOne(
                new LambdaQueryWrapper<User>()
                    .eq(User::getRoleId, 5)
                    .eq(User::getIsActive, 1)
                    .eq(User::getCanInvite, 1)
                    .eq(User::getInviteCode, req.getInviteCode().trim())
            );
            if (rep != null) {
                user.setReferredBy(rep.getId());
            }
        }
```

（无效码：`rep==null`，`referredBy` 保持 null，注册照常成功。）

- [ ] **Step 4: 新增 inviteInfo 服务方法**

在 `AuthService` 末尾加：

```java
    public java.util.Map<String, Object> inviteInfo(String code) {
        java.util.Map<String, Object> result = new java.util.HashMap<>();
        if (code == null || code.isBlank()) {
            result.put("valid", false);
            result.put("repName", null);
            return result;
        }
        User rep = userMapper.selectOne(
            new LambdaQueryWrapper<User>()
                .eq(User::getRoleId, 5)
                .eq(User::getIsActive, 1)
                .eq(User::getCanInvite, 1)
                .eq(User::getInviteCode, code.trim())
        );
        boolean valid = rep != null;
        String name = null;
        if (valid) {
            name = (rep.getLastName() != null ? rep.getLastName() : "")
                 + (rep.getFirstName() != null ? rep.getFirstName() : "");
            if (name.isBlank()) name = rep.getEmail();
        }
        result.put("valid", valid);
        result.put("repName", name);
        return result;
    }
```

- [ ] **Step 5: AuthController 暴露 invite-info 接口**

在 `AuthController` 中 `sendVerifyCode` 方法后加：

```java
    @GetMapping("/invite-info")
    public Result<java.util.Map<String, Object>> inviteInfo(@RequestParam String code) {
        return Result.ok(authService.inviteInfo(code));
    }
```

（`/api/auth/**` 已 permitAll，无需改 SecurityConfig。）

- [ ] **Step 6: 编译验证**

Run: `cd backend && mvn -q compile`
Expected: BUILD 无错误。

- [ ] **Step 7: 手动 HTTP 验证（需本地起服务 + DB）**

先在库里造一个代表：`UPDATE users SET role_id=5, invite_code='TESTCODE', can_invite=1 WHERE id=<某测试用户>;`

Run: `curl 'http://localhost:8080/api/auth/invite-info?code=TESTCODE'`
Expected: `{"code":200,...,"data":{"valid":true,"repName":"..."}}`
Run: `curl 'http://localhost:8080/api/auth/invite-info?code=NOPE'`
Expected: `data.valid=false`

- [ ] **Step 8: Commit**

```bash
git add backend/src/main/java/com/intlmedical/dto/request/RegisterRequest.java backend/src/main/java/com/intlmedical/service/AuthService.java backend/src/main/java/com/intlmedical/controller/AuthController.java
git commit -m "feat(customer-rep): registration attribution + invite-info endpoint + role 5 login"
```

---

## Task 4: 超管管理代表接口

**Files:**
- Create: `backend/src/main/java/com/intlmedical/controller/admin/AdminCustomerRepController.java`

**Interfaces:**
- Consumes: `UserMapper`、`PasswordEncoder`、`InviteCodeGenerator`（Task 2）、`User` 字段（Task 1）。
- Produces: REST 端点见下。列表项复用 `User`，附加 `transient customerCount`（下方用 Map 组装返回而非改实体）。

- [ ] **Step 1: 创建 Controller 骨架 + 依赖**

创建 `controller/admin/AdminCustomerRepController.java`：

```java
package com.intlmedical.controller.admin;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.intlmedical.entity.User;
import com.intlmedical.mapper.UserMapper;
import com.intlmedical.util.InviteCodeGenerator;
import com.intlmedical.util.Result;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/customer-reps")
@RequiredArgsConstructor
public class AdminCustomerRepController {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Data
    public static class CreateRepRequest {
        private String email;
        private String password;
        private String firstName;
        private String lastName;
    }

    @Data
    public static class UpdateRepRequest {
        private String email;
        private String password;
        private String firstName;
        private String lastName;
    }
}
```

- [ ] **Step 2: 列表 + 客户数统计**

在类内加 `list`：

```java
    @GetMapping
    public Result<Map<String, Object>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        IPage<User> result = userMapper.selectPage(
            new Page<>(page, size),
            new LambdaQueryWrapper<User>().eq(User::getRoleId, 5).orderByDesc(User::getId)
        );
        List<User> reps = result.getRecords();
        reps.forEach(u -> u.setPasswordHash(null));

        // 一次聚合统计各代表客户数，避免 N+1
        Map<Long, Long> countMap = new HashMap<>();
        List<Long> repIds = reps.stream().map(User::getId).collect(Collectors.toList());
        if (!repIds.isEmpty()) {
            List<User> customers = userMapper.selectList(
                new LambdaQueryWrapper<User>()
                    .select(User::getReferredBy)
                    .in(User::getReferredBy, repIds)
            );
            for (User c : customers) {
                if (c.getReferredBy() != null) {
                    countMap.merge(c.getReferredBy(), 1L, Long::sum);
                }
            }
        }

        List<Map<String, Object>> records = new ArrayList<>();
        for (User u : reps) {
            Map<String, Object> row = new HashMap<>();
            row.put("id", u.getId());
            row.put("email", u.getEmail());
            row.put("firstName", u.getFirstName());
            row.put("lastName", u.getLastName());
            row.put("inviteCode", u.getInviteCode());
            row.put("canInvite", u.getCanInvite());
            row.put("isActive", u.getIsActive());
            row.put("createdAt", u.getCreatedAt());
            row.put("customerCount", countMap.getOrDefault(u.getId(), 0L));
            records.add(row);
        }
        Map<String, Object> data = new HashMap<>();
        data.put("records", records);
        data.put("total", result.getTotal());
        return Result.ok(data);
    }
```

- [ ] **Step 3: 创建代表（自动生成邀请码）**

```java
    @PostMapping
    public Result<Void> create(@RequestBody CreateRepRequest req) {
        if (req.getEmail() == null || req.getEmail().isBlank()
                || req.getPassword() == null || req.getPassword().isBlank()) {
            return Result.fail(400, "邮箱和密码必填");
        }
        long exists = userMapper.selectCount(
            new LambdaQueryWrapper<User>().eq(User::getEmail, req.getEmail())
        );
        if (exists > 0) return Result.fail(400, "该邮箱已被使用");

        String code = InviteCodeGenerator.generateUnique(c ->
            userMapper.selectCount(new LambdaQueryWrapper<User>().eq(User::getInviteCode, c)) > 0
        );

        User user = new User();
        user.setEmail(req.getEmail());
        user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        user.setFirstName(req.getFirstName());
        user.setLastName(req.getLastName());
        user.setRoleId(5);
        user.setInviteCode(code);
        user.setCanInvite(1);
        user.setIsActive(1);
        userMapper.insert(user);
        return Result.ok();
    }
```

- [ ] **Step 4: 编辑 / 删除 / 开关 / 账号启停**

```java
    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody UpdateRepRequest req) {
        User target = userMapper.selectById(id);
        if (target == null || target.getRoleId() != 5) return Result.fail(404, "代表不存在");
        if (req.getEmail() != null && !req.getEmail().equals(target.getEmail())) {
            long exists = userMapper.selectCount(
                new LambdaQueryWrapper<User>().eq(User::getEmail, req.getEmail()).ne(User::getId, id)
            );
            if (exists > 0) return Result.fail(400, "该邮箱已被使用");
        }
        LambdaUpdateWrapper<User> w = new LambdaUpdateWrapper<User>()
            .eq(User::getId, id)
            .set(req.getEmail() != null, User::getEmail, req.getEmail())
            .set(req.getFirstName() != null, User::getFirstName, req.getFirstName())
            .set(req.getLastName() != null, User::getLastName, req.getLastName());
        if (req.getPassword() != null && !req.getPassword().isBlank()) {
            w.set(User::getPasswordHash, passwordEncoder.encode(req.getPassword()));
        }
        userMapper.update(null, w);
        return Result.ok();
    }

    @PutMapping("/{id}/toggle-invite")
    public Result<Void> toggleInvite(@PathVariable Long id) {
        User target = userMapper.selectById(id);
        if (target == null || target.getRoleId() != 5) return Result.fail(404, "代表不存在");
        int next = (target.getCanInvite() != null && target.getCanInvite() == 1) ? 0 : 1;
        userMapper.update(null, new LambdaUpdateWrapper<User>()
            .eq(User::getId, id).set(User::getCanInvite, next));
        return Result.ok();
    }

    @PutMapping("/{id}/toggle")
    public Result<Void> toggle(@PathVariable Long id) {
        User target = userMapper.selectById(id);
        if (target == null || target.getRoleId() != 5) return Result.fail(404, "代表不存在");
        int next = (target.getIsActive() != null && target.getIsActive() == 1) ? 0 : 1;
        userMapper.update(null, new LambdaUpdateWrapper<User>()
            .eq(User::getId, id).set(User::getIsActive, next));
        return Result.ok();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        User target = userMapper.selectById(id);
        if (target == null || target.getRoleId() != 5) return Result.fail(404, "代表不存在");
        userMapper.deleteById(id);
        return Result.ok();
    }
```

- [ ] **Step 5: 查看某代表名下客户**

```java
    @GetMapping("/{id}/customers")
    public Result<IPage<User>> customers(
            @PathVariable Long id,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        IPage<User> result = userMapper.selectPage(
            new Page<>(page, size),
            new LambdaQueryWrapper<User>().eq(User::getReferredBy, id).orderByDesc(User::getId)
        );
        result.getRecords().forEach(u -> u.setPasswordHash(null));
        return Result.ok(result);
    }
```

- [ ] **Step 6: 编译验证**

Run: `cd backend && mvn -q compile`
Expected: BUILD 无错误。

- [ ] **Step 7: 手动 HTTP 验证（用 admin token）**

```bash
TOKEN=<admin-jwt>
curl -X POST localhost:8080/api/admin/customer-reps -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"email":"rep1@test.com","password":"12345678","lastName":"张","firstName":"三"}'
curl localhost:8080/api/admin/customer-reps -H "Authorization: Bearer $TOKEN"
```
Expected: 创建成功；列表含该代表，`inviteCode` 非空，`customerCount=0`。

- [ ] **Step 8: Commit**

```bash
git add backend/src/main/java/com/intlmedical/controller/admin/AdminCustomerRepController.java
git commit -m "feat(customer-rep): admin controller for managing customer reps"
```

---

## Task 5: 代表工作台接口

**Files:**
- Create: `backend/src/main/java/com/intlmedical/controller/rep/RepController.java`
- Modify: `backend/src/main/java/com/intlmedical/config/SecurityConfig.java`

**Interfaces:**
- Consumes: `UserMapper`、`User` 字段、`Authentication`（Spring Security）。
- Produces: `GET /api/rep/me`、`GET /api/rep/customers`。

- [ ] **Step 1: SecurityConfig 加 /api/rep 规则**

在 `SecurityConfig.filterChain` 的 reviewer 规则行后加：

```java
                // Customer rep endpoints
                .requestMatchers("/api/rep/**").hasAnyRole("ADMIN", "CUSTOMER_REP")
```

- [ ] **Step 2: 创建 RepController**

创建 `controller/rep/RepController.java`：

```java
package com.intlmedical.controller.rep;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.intlmedical.entity.User;
import com.intlmedical.mapper.UserMapper;
import com.intlmedical.util.Result;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/rep")
@RequiredArgsConstructor
public class RepController {

    private final UserMapper userMapper;

    @GetMapping("/me")
    public Result<Map<String, Object>> me(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        User rep = userMapper.selectById(userId);
        if (rep == null || rep.getRoleId() != 5) {
            return Result.fail(403, "非客户代表账号");
        }
        long count = userMapper.selectCount(
            new LambdaQueryWrapper<User>().eq(User::getReferredBy, userId)
        );
        Map<String, Object> data = new HashMap<>();
        data.put("inviteCode", rep.getInviteCode());
        data.put("canInvite", rep.getCanInvite());
        data.put("customerCount", count);
        String name = (rep.getLastName() != null ? rep.getLastName() : "")
                    + (rep.getFirstName() != null ? rep.getFirstName() : "");
        data.put("name", name.isBlank() ? rep.getEmail() : name);
        return Result.ok(data);
    }

    @GetMapping("/customers")
    public Result<IPage<User>> customers(
            Authentication auth,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long userId = (Long) auth.getPrincipal();
        IPage<User> result = userMapper.selectPage(
            new Page<>(page, size),
            new LambdaQueryWrapper<User>().eq(User::getReferredBy, userId).orderByDesc(User::getId)
        );
        result.getRecords().forEach(u -> u.setPasswordHash(null));
        return Result.ok(result);
    }
}
```

- [ ] **Step 3: 编译验证**

Run: `cd backend && mvn -q compile`
Expected: BUILD 无错误。

- [ ] **Step 4: 手动 HTTP 验证（用代表 token）**

```bash
REP_TOKEN=<customer_rep-jwt>
curl localhost:8080/api/rep/me -H "Authorization: Bearer $REP_TOKEN"
```
Expected: 返回自己的 `inviteCode`/`canInvite`/`customerCount`/`name`。

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/com/intlmedical/controller/rep/RepController.java backend/src/main/java/com/intlmedical/config/SecurityConfig.java
git commit -m "feat(customer-rep): rep workspace endpoints + security rule"
```

---

## Task 6: site-a 注册页支持邀请码

**Files:**
- Modify: `frontend-site-a/src/pages/Register/index.tsx`
- Modify: `frontend-site-a/src/i18n.ts`

**Interfaces:**
- Consumes: `GET /api/auth/invite-info?code=`（Task 3）、`POST /api/auth/register`（含 inviteCode）。

- [ ] **Step 1: i18n 加文案 key**

在 `i18n.ts` 的中文 `auth` 段（`register_title` 附近）加：

```javascript
        invited_by: '邀请人：{{name}}',
        invite_invalid: '邀请码无效，将以普通用户注册',
        invite_code_label: '邀请码',
```

在英文 `auth` 段对应加：

```javascript
        invited_by: 'Invited by: {{name}}',
        invite_invalid: 'Invite code invalid; you will register as a regular user',
        invite_code_label: 'Invite Code',
```

- [ ] **Step 2: Register 组件读取 URL code 并校验**

在 `Register/index.tsx` 顶部 import 增加 `useEffect`、`useSearchParams`：

```javascript
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
```

在 `const [form] = Form.useForm();` 之后加状态与副作用：

```javascript
  const [searchParams] = useSearchParams();
  const inviteCode = searchParams.get('code') || '';
  const [inviteName, setInviteName] = useState<string | null>(null);
  const [inviteChecked, setInviteChecked] = useState(false);

  useEffect(() => {
    if (!inviteCode) return;
    form.setFieldsValue({ inviteCode });
    api.get(`/api/auth/invite-info?code=${encodeURIComponent(inviteCode)}`)
      .then((res) => {
        const d = res.data?.data ?? res.data;
        setInviteName(d?.valid ? d.repName : null);
        setInviteChecked(true);
        if (!d?.valid) message.warning(t('auth.invite_invalid'));
      })
      .catch(() => setInviteChecked(true));
  }, [inviteCode, form, t]);
```

- [ ] **Step 3: 表单渲染邀请码字段 + 邀请人提示**

在 `<Form ...>` 内、验证码字段前加（隐藏承载值 + 可视提示）：

```jsx
          <Form.Item name="inviteCode" hidden><Input /></Form.Item>
          {inviteCode && (
            <div style={{ marginBottom: 16, padding: '8px 12px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6 }}>
              {inviteName
                ? t('auth.invited_by', { name: inviteName })
                : (inviteChecked ? t('auth.invite_invalid') : '...')}
            </div>
          )}
```

（`onFinish` 无需改：`values` 已含 `inviteCode`，随 `api.post('/api/auth/register', values)` 一起提交。）

- [ ] **Step 4: 构建验证**

Run: `cd frontend-site-a && npm run build`
Expected: 构建成功，无 TS 错误。

- [ ] **Step 5: Commit**

```bash
git add frontend-site-a/src/pages/Register/index.tsx frontend-site-a/src/i18n.ts
git commit -m "feat(site-a): registration reads invite code from URL and shows inviter"
```

---

## Task 7: 管理端类型/角色/登录/依赖

**Files:**
- Modify: `frontend-admin/src/types/index.ts:119-135`
- Modify: `frontend-admin/src/store/authStore.ts:3`
- Modify: `frontend-admin/src/pages/Login/index.tsx:29`
- Modify: `frontend-admin/package.json`

**Interfaces:**
- Produces: `User.inviteCode?`/`canInvite?`/`referredBy?`；`Role` 含 `'customer_rep'`。

- [ ] **Step 1: User 类型加字段**

在 `types/index.ts` 的 `User` 接口 `isActive` 前加：

```typescript
  inviteCode?: string | null;
  canInvite?: number | null;
  referredBy?: number | null;
```

- [ ] **Step 2: Role 类型加 customer_rep**

`store/authStore.ts` 第 3 行改为：

```typescript
type Role = 'admin' | 'hospital_admin' | 'reviewer' | 'user' | 'customer_rep' | null;
```

- [ ] **Step 3: Login 允许代表登录**

`pages/Login/index.tsx` 的 allowedRoles 改为：

```typescript
      const allowedRoles = ['admin', 'hospital_admin', 'reviewer', 'customer_rep'];
```

- [ ] **Step 4: 安装 qrcode.react**

Run: `cd frontend-admin && npm install qrcode.react`
Expected: `package.json` dependencies 出现 `qrcode.react`。

- [ ] **Step 5: 构建验证**

Run: `cd frontend-admin && npm run build`
Expected: 构建成功。

- [ ] **Step 6: Commit**

```bash
git add frontend-admin/src/types/index.ts frontend-admin/src/store/authStore.ts frontend-admin/src/pages/Login/index.tsx frontend-admin/package.json frontend-admin/package-lock.json
git commit -m "feat(admin): types, role, login and qrcode dep for customer rep"
```

---

## Task 8: 二维码弹窗共用组件

**Files:**
- Create: `frontend-admin/src/components/InviteQrModal.tsx`

**Interfaces:**
- Consumes: `qrcode.react`（Task 7）、`GET /api/config/site_a_base_url`。
- Produces: `<InviteQrModal open inviteCode onClose />` — props: `open: boolean`, `inviteCode: string | null`, `onClose: () => void`。

- [ ] **Step 1: 创建组件**

创建 `components/InviteQrModal.tsx`：

```tsx
import React, { useEffect, useRef, useState } from 'react'
import { Modal, Button, Space, message } from 'antd'
import { QRCodeCanvas } from 'qrcode.react'
import api from '../api'

interface Props {
  open: boolean
  inviteCode: string | null
  onClose: () => void
}

const InviteQrModal: React.FC<Props> = ({ open, inviteCode, onClose }) => {
  const [baseUrl, setBaseUrl] = useState('http://localhost:3000')
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    api.get('/api/config/site_a_base_url')
      .then((res) => {
        const d = res.data?.data ?? res.data
        if (d?.valueEn || d?.valueZh) setBaseUrl(d.valueEn || d.valueZh)
      })
      .catch(() => {})
  }, [open])

  const url = inviteCode ? `${baseUrl.replace(/\/$/, '')}/register?code=${inviteCode}` : ''

  const download = () => {
    const canvas = wrapRef.current?.querySelector('canvas')
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `invite-${inviteCode}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(url)
    message.success('链接已复制')
  }

  return (
    <Modal title="邀请二维码" open={open} onCancel={onClose} footer={null} destroyOnClose>
      <div style={{ textAlign: 'center', padding: 16 }} ref={wrapRef}>
        {url ? <QRCodeCanvas value={url} size={220} includeMargin /> : null}
        <div style={{ marginTop: 12, wordBreak: 'break-all', color: '#666', fontSize: 12 }}>{url}</div>
        <Space style={{ marginTop: 16 }}>
          <Button type="primary" onClick={download}>下载 PNG</Button>
          <Button onClick={copyLink}>复制链接</Button>
        </Space>
      </div>
    </Modal>
  )
}

export default InviteQrModal
```

- [ ] **Step 2: 构建验证**

Run: `cd frontend-admin && npm run build`
Expected: 构建成功。

- [ ] **Step 3: Commit**

```bash
git add frontend-admin/src/components/InviteQrModal.tsx
git commit -m "feat(admin): shared invite QR modal component"
```

---

## Task 9: 超管客户代表管理页

**Files:**
- Create: `frontend-admin/src/pages/CustomerRepManage/index.tsx`

**Interfaces:**
- Consumes: `/api/admin/customer-reps` 系列（Task 4）、`InviteQrModal`（Task 8）。

- [ ] **Step 1: 创建页面（列表 + 新增/编辑 Drawer + 开关 + 二维码 + 客户抽屉）**

创建 `pages/CustomerRepManage/index.tsx`：

```tsx
import React, { useEffect, useState, useCallback } from 'react'
import {
  Table, Button, Space, Popconfirm, message, Tag, Switch,
  Drawer, Form, Input, Typography,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, QrcodeOutlined, CopyOutlined, TeamOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import api from '../../api'
import InviteQrModal from '../../components/InviteQrModal'
import type { User } from '../../types'

interface RepRow {
  id: number; email: string; firstName: string | null; lastName: string | null
  inviteCode: string | null; canInvite: number; isActive: number; customerCount: number
}

const CustomerRepManage: React.FC = () => {
  const [data, setData] = useState<RepRow[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [current, setCurrent] = useState(1)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editRecord, setEditRecord] = useState<RepRow | null>(null)
  const [form] = Form.useForm()
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [custDrawer, setCustDrawer] = useState<RepRow | null>(null)
  const [custList, setCustList] = useState<User[]>([])

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const res = await api.get('/api/admin/customer-reps', { params: { page, size: 10 } })
      const d = res.data?.data ?? res.data
      setData(d?.records ?? [])
      setTotal(d?.total ?? 0)
    } catch { message.error('获取客户代表列表失败') } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData(current) }, [fetchData, current])

  const openCreate = () => { setEditRecord(null); form.resetFields(); setDrawerOpen(true) }
  const openEdit = (r: RepRow) => {
    setEditRecord(r)
    form.setFieldsValue({ email: r.email, firstName: r.firstName, lastName: r.lastName })
    setDrawerOpen(true)
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const values = await form.validateFields()
      if (editRecord) {
        await api.put(`/api/admin/customer-reps/${editRecord.id}`, values)
        message.success('更新成功')
      } else {
        await api.post('/api/admin/customer-reps', values)
        message.success('创建成功，邀请码已生成')
      }
      setDrawerOpen(false); fetchData(current)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; errorFields?: unknown[] }
      if (e.response?.data?.message) message.error(e.response.data.message)
      else if (!e.errorFields) message.error('操作失败')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: number) => {
    try { await api.delete(`/api/admin/customer-reps/${id}`); message.success('删除成功'); fetchData(current) }
    catch { message.error('删除失败') }
  }

  const toggleInvite = async (r: RepRow) => {
    try { await api.put(`/api/admin/customer-reps/${r.id}/toggle-invite`); fetchData(current) }
    catch { message.error('切换失败') }
  }

  const openCustomers = async (r: RepRow) => {
    setCustDrawer(r)
    try {
      const res = await api.get(`/api/admin/customer-reps/${r.id}/customers`, { params: { page: 1, size: 100 } })
      const d = res.data?.data ?? res.data
      setCustList(d?.records ?? [])
    } catch { setCustList([]) }
  }

  const copyCode = async (code: string | null) => {
    if (!code) return
    await navigator.clipboard.writeText(code); message.success('邀请码已复制')
  }

  const columns: ColumnsType<RepRow> = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '姓名', width: 120, render: (_, r) => [r.lastName, r.firstName].filter(Boolean).join(' ') || '-' },
    { title: '邮箱', dataIndex: 'email', ellipsis: true },
    {
      title: '邀请码', dataIndex: 'inviteCode', width: 150,
      render: (v: string | null) => v
        ? <Space><Typography.Text code>{v}</Typography.Text><Button type="text" size="small" icon={<CopyOutlined />} onClick={() => copyCode(v)} /></Space>
        : '-',
    },
    {
      title: '客户数', dataIndex: 'customerCount', width: 100,
      render: (v: number, r) => <Button type="link" size="small" icon={<TeamOutlined />} onClick={() => openCustomers(r)}>{v ?? 0}</Button>,
    },
    {
      title: '邀请权限', dataIndex: 'canInvite', width: 100,
      render: (v: number, r) => <Switch checked={v === 1} onChange={() => toggleInvite(r)} />,
    },
    {
      title: '状态', dataIndex: 'isActive', width: 80,
      render: (v: number) => v === 1 ? <Tag color="success">正常</Tag> : <Tag color="error">禁用</Tag>,
    },
    {
      title: '操作', width: 200,
      render: (_, r) => (
        <Space size={0}>
          <Button type="text" size="small" icon={<QrcodeOutlined />} onClick={() => setQrCode(r.inviteCode)}>二维码</Button>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button>
          <Popconfirm title="确认删除该代表？" onConfirm={() => handleDelete(r.id)} okText="确认" cancelText="取消">
            <Button type="text" danger size="small" icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="page-card">
      <div className="page-header">
        <h3 className="page-title">客户代表</h3>
        <p className="page-description">管理客户代表账号、邀请码与名下客户</p>
      </div>
      <div className="page-toolbar">
        <div className="toolbar-left" />
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增客户代表</Button>
      </div>
      <Table rowKey="id" size="middle" columns={columns} dataSource={data} loading={loading}
        pagination={{ current, pageSize: 10, total, showTotal: t => `共 ${t} 条`, position: ['bottomRight'], size: 'small', onChange: setCurrent }} />

      <Drawer title={editRecord ? '编辑客户代表' : '新增客户代表'} width={520} open={drawerOpen}
        onClose={() => setDrawerOpen(false)} destroyOnClose
        footer={<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={() => setDrawerOpen(false)}>取消</Button>
          <Button type="primary" onClick={handleSubmit} loading={saving}>保存</Button>
        </div>}>
        <Form form={form} layout="vertical">
          <Form.Item name="email" label="邮箱" rules={[{ required: true, type: 'email' }]}><Input placeholder="登录邮箱" /></Form.Item>
          <Form.Item name="password" label={editRecord ? '新密码（留空不修改）' : '初始密码'}
            rules={editRecord ? [] : [{ required: true, min: 8, message: '至少8位' }]}>
            <Input.Password placeholder={editRecord ? '留空则不修改密码' : '至少8位'} />
          </Form.Item>
          <Form.Item name="lastName" label="姓"><Input /></Form.Item>
          <Form.Item name="firstName" label="名"><Input /></Form.Item>
          {editRecord && <Form.Item label="邀请码"><Typography.Text code>{editRecord.inviteCode}</Typography.Text></Form.Item>}
        </Form>
      </Drawer>

      <InviteQrModal open={qrCode !== null} inviteCode={qrCode} onClose={() => setQrCode(null)} />

      <Drawer title={`${custDrawer ? [custDrawer.lastName, custDrawer.firstName].filter(Boolean).join(' ') : ''} 名下客户`}
        width={640} open={custDrawer !== null} onClose={() => setCustDrawer(null)} destroyOnClose>
        <Table rowKey="id" size="small" dataSource={custList} pagination={false}
          columns={[
            { title: '姓名', render: (_, r: User) => [r.lastName, r.firstName].filter(Boolean).join(' ') || '-' },
            { title: '邮箱', dataIndex: 'email', ellipsis: true },
            { title: '手机号', dataIndex: 'phone', render: (v) => v || '-' },
            { title: '注册时间', dataIndex: 'createdAt', width: 170 },
          ]} />
      </Drawer>
    </div>
  )
}

export default CustomerRepManage
```

- [ ] **Step 2: 构建验证**

Run: `cd frontend-admin && npm run build`
Expected: 构建成功，无 TS 错误。

- [ ] **Step 3: Commit**

```bash
git add frontend-admin/src/pages/CustomerRepManage/index.tsx
git commit -m "feat(admin): customer rep management page"
```

---

## Task 10: 代表工作台页

**Files:**
- Create: `frontend-admin/src/pages/RepDashboard/index.tsx`

**Interfaces:**
- Consumes: `/api/rep/me`、`/api/rep/customers`（Task 5）、`InviteQrModal`（Task 8）。

- [ ] **Step 1: 创建工作台页**

创建 `pages/RepDashboard/index.tsx`：

```tsx
import React, { useEffect, useState } from 'react'
import { Card, Statistic, Button, Space, Typography, Table, message, Tag, Row, Col } from 'antd'
import { QrcodeOutlined, CopyOutlined } from '@ant-design/icons'
import api from '../../api'
import InviteQrModal from '../../components/InviteQrModal'
import type { User } from '../../types'

const RepDashboard: React.FC = () => {
  const [me, setMe] = useState<{ inviteCode: string | null; canInvite: number; customerCount: number; name: string } | null>(null)
  const [custList, setCustList] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [qrOpen, setQrOpen] = useState(false)

  useEffect(() => {
    api.get('/api/rep/me').then((res) => setMe(res.data?.data ?? res.data)).catch(() => {})
    setLoading(true)
    api.get('/api/rep/customers', { params: { page: 1, size: 100 } })
      .then((res) => { const d = res.data?.data ?? res.data; setCustList(d?.records ?? []) })
      .catch(() => {}).finally(() => setLoading(false))
  }, [])

  const copyCode = async () => {
    if (!me?.inviteCode) return
    await navigator.clipboard.writeText(me.inviteCode); message.success('邀请码已复制')
  }

  return (
    <div className="page-card">
      <div className="page-header">
        <h3 className="page-title">我的邀请</h3>
        <p className="page-description">你的专属邀请码与名下客户</p>
      </div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <div>
                <Typography.Text type="secondary">我的邀请码</Typography.Text>
                <div><Typography.Text code style={{ fontSize: 20 }}>{me?.inviteCode ?? '-'}</Typography.Text>
                  <Button type="text" icon={<CopyOutlined />} onClick={copyCode} /></div>
              </div>
              {me?.canInvite === 0 && <Tag color="error">邀请权限已被关闭，邀请码当前无效</Tag>}
              <Button type="primary" icon={<QrcodeOutlined />} onClick={() => setQrOpen(true)} disabled={!me?.inviteCode}>查看邀请二维码</Button>
            </Space>
          </Card>
        </Col>
        <Col span={12}>
          <Card><Statistic title="我的客户总数" value={me?.customerCount ?? 0} /></Card>
        </Col>
      </Row>

      <Card title="我的客户">
        <Table rowKey="id" size="small" loading={loading} dataSource={custList} pagination={false}
          columns={[
            { title: '姓名', render: (_, r: User) => [r.lastName, r.firstName].filter(Boolean).join(' ') || '-' },
            { title: '邮箱', dataIndex: 'email', ellipsis: true },
            { title: '手机号', dataIndex: 'phone', render: (v) => v || '-' },
            { title: '注册时间', dataIndex: 'createdAt', width: 170 },
          ]} />
      </Card>

      <InviteQrModal open={qrOpen} inviteCode={me?.inviteCode ?? null} onClose={() => setQrOpen(false)} />
    </div>
  )
}

export default RepDashboard
```

- [ ] **Step 2: 构建验证**

Run: `cd frontend-admin && npm run build`
Expected: 构建成功。

- [ ] **Step 3: Commit**

```bash
git add frontend-admin/src/pages/RepDashboard/index.tsx
git commit -m "feat(admin): customer rep workspace dashboard"
```

---

## Task 11: 菜单/角色/路由接线

**Files:**
- Modify: `frontend-admin/src/components/AdminLayout.tsx:29-59,80-97`
- Modify: `frontend-admin/src/App.tsx`

**Interfaces:**
- Consumes: `CustomerRepManage`（Task 9）、`RepDashboard`（Task 10）。

- [ ] **Step 1: AdminLayout 加菜单/角色**

在 `AdminLayout.tsx` 的 `adminMenuItems` 中「医院管理员」项后加：

```tsx
  { key: '/customer-reps', icon: <UsergroupAddOutlined />, label: '客户代表' },
```

在 `reviewerMenuItems` 定义之后加代表菜单：

```tsx
const customerRepMenuItems = [
  { key: '/rep/dashboard', icon: <DashboardOutlined />, label: '我的邀请' },
]
```

在 role 分支选择处（`role === 'reviewer' ? reviewerMenuItems :` 之后、`adminMenuItems` 之前）加：

```tsx
    role === 'customer_rep' ? customerRepMenuItems :
```

在 `roleLabels` 对象中加：

```tsx
  customer_rep: { text: '客户代表', color: 'purple' },
```

确认顶部 import 含 `UsergroupAddOutlined`（缺则从 `@ant-design/icons` 补入）。

- [ ] **Step 2: App.tsx 加路由 + import**

在 `App.tsx` 顶部 import 加：

```tsx
import CustomerRepManage from './pages/CustomerRepManage';
import RepDashboard from './pages/RepDashboard';
```

在超管路由段（`hospital-admins` 行后）加：

```tsx
                <Route path="customer-reps" element={<CustomerRepManage />} />
```

在 reviewer 路由段后加代表路由：

```tsx
                {/* Customer rep routes */}
                <Route path="rep/dashboard" element={<RepDashboard />} />
```

- [ ] **Step 3: 构建验证**

Run: `cd frontend-admin && npm run build`
Expected: 构建成功。

- [ ] **Step 4: 端到端手动验证**

1. 超管登录 → 侧栏「客户代表」→ 新增代表 → 列表出现、邀请码非空。
2. 点「二维码」→ 弹窗显示二维码与链接（`{base}/register?code=XXX`）。
3. 用该链接在 site-a 打开 → 注册页显示「邀请人：XX」→ 完成注册。
4. 超管在该代表行「客户数」→ 应为 1，抽屉列出该客户。
5. 关闭该代表「邀请权限」开关 → 再用同链接注册 → 提示邀请码无效，仍可注册，但不计入客户数。
6. 用代表账号登录管理端 → 看到「我的邀请」工作台 → 邀请码/二维码/客户数正确。

- [ ] **Step 5: Commit**

```bash
git add frontend-admin/src/components/AdminLayout.tsx frontend-admin/src/App.tsx
git commit -m "feat(admin): wire customer rep menu, role and routes"
```

---

## 完成标准

- 超管可创建/编辑/删除客户代表，每个代表有唯一邀请码。
- 超管可查看每个代表的客户数与名下客户列表。
- 超管可开关每个代表的邀请权限（`can_invite`），关闭后邀请码失效。
- 客户扫码/打开邀请链接到 site-a 注册，成功归属该代表；无效码仍可注册但不归属。
- 客户代表可登录管理端专属工作台，查看自己的邀请码、二维码与客户列表。





