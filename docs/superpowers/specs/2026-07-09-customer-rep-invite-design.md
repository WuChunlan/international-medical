# 客户代表（Customer Rep）邀请与归属 — 设计文档

- 日期：2026-07-09
- 状态：已确认，待实现
- 方案：A（最小侵入，全部落在 `users` 表）

## 1. 背景与目标

新增一类角色「客户代表」（role_id=5）。每个代表拥有一个独立邀请码，可生成邀请二维码；客户扫码进入 frontend-site-a 注册，通过邀请码注册的客户归属于该代表。

目标能力：
- 超级管理员在管理端管理客户代表（增删改、启停）。
- 超管可查看每个代表名下客户数量。
- 超管可通过开关 `can_invite` 控制某代表的邀请码是否生效。
- 客户代表可登录管理端，拥有专属工作台，查看自己的邀请码/二维码与名下客户。

## 2. 关键决策（已确认）

| 决策点 | 结论 |
|---|---|
| 代表是否登录 | 登录现有管理端 frontend-admin，role_id=5，专属精简菜单工作台 |
| 二维码形态 | 链接式，前端 `qrcode.react` 实时渲染，指向 site-a 注册页 |
| `can_invite` 语义 | 独立开关，仅控制邀请码是否生效；不影响代表登录，不影响已归属老客户 |
| 代表创建方式 | 超管后台创建（邮箱+初始密码+姓名），后端自动生成唯一邀请码 |
| 无效邀请码注册 | 宽松：仍可正常注册，只是不归属任何代表（referred_by 为空） |
| 二维码基地址 | 存 `site_configs` 表 `config_key='site_a_base_url'`，超管在网站配置页维护 |
| 数据存储 | 方案 A：`users` 表加 3 列，不新建表 |

## 3. 数据模型

`users` 表已由 DBA 手动新增以下三列（本文档据此实现，schema 文件需补同步迁移脚本）：

```sql
ALTER TABLE users
  ADD COLUMN invite_code  VARCHAR(16) DEFAULT NULL COMMENT '邀请码，仅客户代表(role_id=5)有值',
  ADD COLUMN can_invite   TINYINT(1)  NOT NULL DEFAULT 1 COMMENT '客户代表邀请开关：1=生效 0=失效',
  ADD COLUMN referred_by  BIGINT UNSIGNED DEFAULT NULL COMMENT '归属客户代表 user_id，仅普通客户有值',
  ADD UNIQUE KEY uk_invite_code (invite_code),
  ADD KEY idx_referred_by (referred_by);
```

`roles` 表新增：`(5, 'customer_rep', '客户代表', 'Customer Rep')`。

角色映射（全系统）：`1=user 2=admin 3=hospital_admin 4=reviewer 5=customer_rep`。

**邀请码生成规则**：8 位，字符集为大写字母+数字去除易混字符（去掉 `0 O 1 I L`）。创建代表时后端生成并做唯一性校验，冲突则重试（最多若干次）。

**site_configs 新增行**：`config_key='site_a_base_url'`，`value_zh`/`value_en` 存 site-a 基地址（如 `https://site-a.example.com`），`description='客户代表邀请二维码指向的注册站点基地址'`。

## 4. 后端设计

### 4.1 实体
`User.java` 新增字段：`inviteCode`、`canInvite`、`referredBy`（`@TableField` 映射对应列）。

### 4.2 角色与安全
- `AuthService.login` role switch 增加 `case 5 -> "customer_rep"`。
- `JwtAuthenticationFilter` 无需改（自动 `ROLE_CUSTOMER_REP`）。
- `SecurityConfig` 增加：`.requestMatchers("/api/rep/**").hasAnyRole("ADMIN", "CUSTOMER_REP")`。
- 公开只读接口 `GET /api/auth/invite-info` 需在 `/api/auth/**` permitAll 范围内（已覆盖）。

### 4.3 超管接口 — `AdminCustomerRepController`（`/api/admin/customer-reps`）

复用 `AdminUserController` / HospitalAdminManage 的分页 + 内部 Request DTO 模式。

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/admin/customer-reps?page&size` | 分页列表；每行附 `customerCount` |
| POST | `/api/admin/customer-reps` | 创建代表：校验邮箱唯一 → 生成唯一 invite_code → role_id=5, can_invite=1, is_active=1 |
| PUT | `/api/admin/customer-reps/{id}` | 编辑 email/firstName/lastName/password（留空不改密码）|
| PUT | `/api/admin/customer-reps/{id}/toggle-invite` | 切换 can_invite（0/1）|
| PUT | `/api/admin/customer-reps/{id}/toggle` | 启用/禁用账号 is_active |
| DELETE | `/api/admin/customer-reps/{id}` | 删除代表 |
| GET | `/api/admin/customer-reps/{id}/customers?page&size` | 该代表名下客户分页 |

`customerCount` 实现：对列表内代表 id 集合做一次 `SELECT referred_by, COUNT(*) ... WHERE referred_by IN (...) GROUP BY referred_by`，Map 回填，避免 N+1。所有返回的 User 需 `setPasswordHash(null)`。

**校验**：编辑/删除前校验 `target != null && roleId == 5`，否则 404。邮箱唯一性校验排除自身。

### 4.4 代表工作台接口 — `RepController`（`/api/rep`）

代表 id 从 SecurityContext（JWT userId）取，绝不信任前端传参。

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/rep/me` | 返回 inviteCode、canInvite、customerCount |
| GET | `/api/rep/customers?page&size` | 我名下客户分页（姓名/邮箱/注册时间/手机号）|

### 4.5 注册归属 — 改 `RegisterRequest` + `AuthService.register`

- `RegisterRequest` 新增可选字段 `inviteCode`（无校验注解）。
- register 逻辑：验证码校验、邮箱唯一校验不变。若 `inviteCode` 非空：
  - 查代表 `role_id=5 AND is_active=1 AND can_invite=1 AND invite_code=?`。
  - 命中则新客户 `referred_by = 代表id`；未命中则 `referred_by = null`（宽松，不阻断）。
- 新增 `GET /api/auth/invite-info?code=XXX`：返回 `{ valid: boolean, repName: string|null }`，供注册页显示邀请人与校验。仅在 `can_invite=1 && is_active=1` 时 valid=true。

## 5. 前端设计

### 5.1 管理端 frontend-admin（超管）

**新增页面** `pages/CustomerRepManage/index.tsx`（照搬 HospitalAdminManage 的 Table + Drawer 结构）：

- 列表列：ID、姓名、邮箱、邀请码（含复制按钮）、客户数（可点开抽屉看客户列表）、邀请开关（`Switch` 调 toggle-invite）、账号状态（Tag）、操作（编辑 / 查看二维码 / 删除）。
- 新增/编辑 Drawer：邮箱、初始密码（编辑时留空不改）、姓、名。邀请码为后端生成，编辑时只读展示。
- 二维码 Modal：先 `GET /api/config/site_a_base_url` 取基地址 → 用 `qrcode.react` 渲染 `{base}/register?code={inviteCode}`；提供「下载 PNG」「复制链接」按钮。
- `App.tsx` 加路由 `customer-reps`；`AdminLayout.adminMenuItems` 加菜单项「客户代表」（图标如 `UsergroupAddOutlined`）。

**代表工作台**（role_id=5 登录后）：

- 新增 `pages/RepDashboard/index.tsx`：顶部卡片展示「我的邀请码 + 二维码 + 客户总数」（数据来自 `/api/rep/me`），下方我的客户列表（`/api/rep/customers`，列：姓名/邮箱/注册时间/手机号）。
- `AdminLayout` 新增 `customerRepMenuItems`（控制台 + 我的邀请/客户），role 分支加 `role === 'customer_rep' ? customerRepMenuItems`。
- `roleLabels` 加 `customer_rep: { text: '客户代表', color: ... }`。
- `App.tsx` 加代表路由（如 `rep/dashboard`）。

### 5.2 注册端 frontend-site-a

- Register 页 `useSearchParams` 读 `?code=`，自动填入邀请码字段并锁定（只读）。
- 调 `GET /api/auth/invite-info?code=` 显示「邀请人：XXX」；无效则提示「邀请码无效，将以普通用户注册」但不阻断。
- 提交时将 `inviteCode` 一并 POST 给 `/api/auth/register`。
- 新增 i18n key（邀请人提示 / 邀请码无效提示）。

### 5.3 依赖

- frontend-admin 新增 `qrcode.react`。
- frontend-site-a 无需二维码库。

## 6. 单元边界与测试

- **邀请码生成器**（后端工具方法）：可独立测试字符集与长度、唯一重试。
- **register 归属逻辑**：带有效码→归属；带无效码→不归属仍成功；can_invite=0→不归属；不带码→原行为不变。
- **customerCount 聚合**：多代表批量统计正确、无客户返回 0。
- **权限隔离**：`/api/rep/*` 代表只能取到自己数据；`/api/admin/customer-reps/*` 仅 ADMIN。

## 7. 明确不做（YAGNI）

- 不做多邀请码 / 邀请码有效期 / 渠道活动统计（方案 C 内容）。
- 不做独立 customer_reps 表（方案 B）。
- 不做代表邀请码自助刷新（如需后续再加）。
- 不改动现有老客户的归属（历史数据 referred_by 保持 null）。

