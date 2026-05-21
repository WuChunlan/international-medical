# 国际医疗项目 — 项目结构说明

## 目录结构

```
International-medical-mst/
├── db/
│   ├── schema.sql          # 数据库建表脚本
│   └── data.sql            # 初始数据（医院、医生、产品等）
├── backend/                # Spring Boot 后端（端口 8080）
├── frontend-site-a/        # 宣传展示网站 Site A（端口 3000）
├── frontend-site-b/        # 用户服务网站 Site B（端口 3001）
├── frontend-admin/         # 后台管理系统 Admin（端口 3002）
└── 需求文档_PRD.md
```

## 快速启动

### 1. 数据库（已完成）

```bash
mysql -u root -p < db/schema.sql
mysql -u root -p < db/data.sql
```

### 2. 后端

```bash
cd backend
# 修改 src/main/resources/application.yml 中的数据库密码
mvn spring-boot:run
# 或 ./mvnw spring-boot:run
```

> 需要安装 Maven：`brew install maven`

### 3. 前端 Site A（宣传展示）

```bash
cd frontend-site-a
npm run dev -- --port 3000
```

### 4. 前端 Site B（用户服务）

```bash
cd frontend-site-b
npm run dev -- --port 3001
```

### 5. 后台管理 Admin

```bash
cd frontend-admin
npm run dev -- --port 3002
```

## 默认账号

| 账号 | 密码 | 角色 |
|------|------|------|
| admin | 12345 | 管理员 |

## 技术栈

| 层 | 技术 |
|----|------|
| 后端 | Spring Boot 3.2 + MyBatis-Plus + Spring Security + JWT |
| 数据库 | MySQL 8.x |
| 缓存 | Redis（验证码） |
| 前端 | React 18 + TypeScript + Vite + Ant Design + i18next |
| 国际化 | i18next（中/英文切换） |


邮箱: admin@international-medical.com
新密码: Admin@123456