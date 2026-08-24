        Long currentHospitalId = SecurityUtil.getCurrentHospitalId();
        if (!Objects.equals(currentHospitalId, existing.getHospitalId())) {
            return Result.fail(403, "无权操作");
        }
    } else if (SecurityUtil.isBaseAdmin()) {
        // 基础管理员：只能删除自己创建的数据
        if (!SecurityUtil.canEdit(existing.getCreatedUser())) {
            return Result.fail(403, "无权删除他人创建的数据");
        }
    } else if (!SecurityUtil.isAdmin()) {
        return Result.fail(403, "无权操作");
    }
    // Admin直接通过，无需额外判断
    
    // 软删除
    equipmentMapper.update(null,
        new LambdaUpdateWrapper<Equipment>()
            .eq(Equipment::getId, id)
            .set(Equipment::getIsActive, 0)
            .set(Equipment::getUpdatedUser, currentUserId)
    );
    
    return Result.ok();
}
```

### 5.3 需要同样改动的Controller

- `AdminDoctorController`：同样的CREATE/UPDATE/DELETE逻辑
- `AdminCaseController`：同样的CREATE/UPDATE/DELETE逻辑
- `AdminServiceTeamController`：同样的CREATE/UPDATE/DELETE逻辑

### 5.4 前端展示接口（公开接口改动）

为医院详情页新增专用查询接口，只返回该医院的数据：

```java
// DoctorController.java 新增
@GetMapping("/by-hospital/{hospitalId}")
public Result<List<Doctor>> listByHospital(
        @PathVariable Long hospitalId,
        @RequestParam(defaultValue = "zh") String lang) {
    List<Doctor> list = doctorMapper.selectList(
        new LambdaQueryWrapper<Doctor>()
            .eq(Doctor::getHospitalId, hospitalId)  // 只查该医院，排除null
            .eq(Doctor::getIsActive, 1)
            .eq(Doctor::getAuditStatus, "approved")
            .orderByAsc(Doctor::getSortOrder)
    );
    if (!BUILTIN_LANGS.contains(lang)) {
        list.forEach(d -> d.setTranslations(
            translationService.getAll("doctor", d.getId(), lang)
        ));
    }
    return Result.ok(list);
}
```

同样需要在 `EquipmentController`、`CaseController`、`ServiceTeamController` 中新增按医院查询接口。

---

## 6. 前端管理后台设计（frontend-admin）

### 6.1 用户状态管理

需要在 authStore 中存储 `roleId`，以便各组件判断权限：

```typescript
// types 中新增
interface UserInfo {
  id: number;
  roleId: number; // 1=user,2=admin,3=hospital_admin,4=reviewer,5=crep,6=trans_admin,7=base_admin
  hospitalId?: number;
  email: string;
}
```

### 6.2 表单组件改动（以 EquipmentForm.tsx 为例）

```typescript
const EquipmentForm: React.FC<EquipmentFormProps> = ({ open, record, hospitals, onClose }) => {
  const { userInfo } = useAuthStore();
  
  // 医院管理员必填，其他角色选填，基础管理员不显示
  const showHospitalField = userInfo?.roleId !== 7;
  const hospitalRequired = userInfo?.roleId === 3;

  return (
    <Drawer ...>
      <Form form={form} layout="vertical">
        {showHospitalField && (
          <Form.Item
            name="hospitalId"
            label="所属医院"
            rules={[{ required: hospitalRequired, message: '请选择所属医院' }]}
          >
            <Select
              placeholder="请选择所属医院"
              allowClear={!hospitalRequired}
              options={hospitals.map(h => ({ value: h.id, label: h.nameZh }))}
            />
          </Form.Item>
        )}
        {/* 其他字段不变 */}
      </Form>
    </Drawer>
  );
};
```

同样改动：`DoctorForm.tsx`、`CaseForm.tsx`、`ServiceTeamForm.tsx`。

### 6.3 列表页改动：操作按钮权限控制

列表页的"编辑"和"删除"按钮需要根据权限显示或禁用：

```typescript
// 判断当前用户是否可编辑某条数据
function canEdit(record: Equipment, userInfo: UserInfo): boolean {
  if (userInfo.roleId === 2) return true; // Admin可编辑所有
  if (userInfo.roleId === 3) {
    // 医院管理员：只能编辑自己医院的
    return record.hospitalId === userInfo.hospitalId;
  }
  if (userInfo.roleId === 7) {
    // 基础管理员：只能编辑自己创建的
    return record.createdUser === userInfo.id;
  }
  return false;
}

// 在列表columns中
const columns = [
  // ... 其他列
  {
    title: '所属医院',
    dataIndex: 'hospitalId',
    render: (hospitalId: number | null) => {
      if (!hospitalId) return <Tag color="blue">平台通用</Tag>;
      const hospital = hospitals.find(h => h.id === hospitalId);
      return hospital?.nameZh || '-';
    },
  },
  {
    title: '操作',
    render: (_: unknown, record: Equipment) => {
      const editable = canEdit(record, userInfo);
      return (
        <>
          <Button
            size="small"
            onClick={() => handleEdit(record)}
            disabled={!editable}
          >
            编辑
          </Button>
          <Button
            size="small"
            danger
            onClick={() => handleDelete(record.id)}
            disabled={!editable}
          >
            删除
          </Button>
        </>
      );
    },
  },
];
```

### 6.4 菜单权限控制

```typescript
const menuConfig = [
  { key: 'hospitals',   label: '医院管理',  allowedRoles: [2, 4] },
  { key: 'equipments',  label: '医疗设备',  allowedRoles: [2, 3, 7] },
  { key: 'doctors',     label: '医护人员',  allowedRoles: [2, 3, 7] },
  { key: 'cases',       label: '成功案例',  allowedRoles: [2, 3, 7] },
  { key: 'services',    label: '服务项目',  allowedRoles: [2, 3, 7] },
  { key: 'users',       label: '用户管理',  allowedRoles: [2] },
  // ... 其他菜单项
];

const visibleMenus = menuConfig.filter(item => 
  item.allowedRoles.includes(userInfo.roleId)
);
```

### 6.5 创建基础管理员账号（AdminUserController改动）

```java
@PostMapping("/staff")
public Result<Void> createStaff(@RequestBody CreateStaffRequest req) {
    // 扩展：roleId 允许 3=hospital_admin, 4=reviewer, 7=base_admin
    if (req.getRoleId() != 3 && req.getRoleId() != 4 && req.getRoleId() != 7) {
        return Result.fail(400, "roleId 必须为 3(医院管理员)、4(审核员) 或 7(基础管理员)");
    }
    // ... 其余逻辑不变
}
```

---

## 7. 前端展示站点设计（frontend-site-a）

### 7.1 首页（无需改动）

现有接口（`/api/equipments`、`/api/doctors` 等）返回所有 `isActive=1 AND auditStatus='approved'` 的数据，自然包含 `hospitalId=null` 的平台通用数据。

### 7.2 医院详情页改动

将数据请求由全量查询改为按医院过滤：

```typescript
// HospitalDetail/index.tsx 改动

// 改前（前端过滤，性能差）
const res = await api.get('/api/doctors');
const doctors = res.data.records.filter(d => d.hospitalId === hospitalId);

// 改后（后端过滤，精确）
const res = await api.get(`/api/doctors/by-hospital/${hospitalId}`);
const doctors = res.data;
```

同样需要改动：设备、案例、服务的查询。

---

## 8. 改动文件清单

### 8.1 数据库

- `db/data.sql`：新增4张表的ALTER语句（hospital_id允许null，新增3个审计字段）

### 8.2 后端（backend/src/main/java/com/intlmedical/）

| 文件 | 改动类型 | 说明 |
|------|---------|------|
| `entity/Equipment.java` | 修改 | 新增createdUser/updatedUser/updatedAt字段 |
| `entity/Doctor.java` | 修改 | 新增createdUser/updatedUser/updatedAt字段 |
| `entity/Case.java` | 修改 | 新增createdUser/updatedUser/updatedAt字段 |
| `entity/ServiceTeam.java` | 修改 | 新增createdUser/updatedUser/updatedAt字段 |
| `util/SecurityUtil.java` | 修改 | 新增getCurrentRoleId/isAdmin/isBaseAdmin/isHospitalAdmin/canEdit方法 |
| `util/JwtUtil.java` | 修改（确认） | 确保包含getRoleId方法 |
| `controller/admin/AdminEquipmentController.java` | 修改 | 角色判断、审核分流、设置createdUser |
| `controller/admin/AdminDoctorController.java` | 修改 | 同上 |
| `controller/admin/AdminCaseController.java` | 修改 | 同上 |
| `controller/admin/AdminServiceTeamController.java` | 修改 | 同上 |
| `controller/admin/AdminUserController.java` | 修改 | 允许创建roleId=7的用户 |
| `controller/DoctorController.java` | 修改 | 新增by-hospital接口 |
| `controller/EquipmentController.java` | 修改 | 新增by-hospital接口 |
| `controller/CaseController.java` | 修改 | 新增by-hospital接口 |
| `controller/ServiceTeamController.java` | 修改 | 新增by-hospital接口 |

### 8.3 前端管理后台（frontend-admin/src/）

| 文件 | 改动类型 | 说明 |
|------|---------|------|
| `types/index.ts` | 修改 | UserInfo新增roleId、createdUser等字段 |
| `store/authStore.ts` | 修改 | 存储roleId |
| `pages/EquipmentManage/EquipmentForm.tsx` | 修改 | 医院字段条件显示/必填逻辑 |
| `pages/DoctorManage/DoctorForm.tsx` | 修改 | 同上 |
| `pages/CaseManage/CaseForm.tsx` | 修改 | 同上 |
| `pages/ServiceFeatureManage/...` | 修改 | 同上 |
| `pages/EquipmentManage/index.tsx` | 修改 | 操作按钮权限控制，列表加所属医院列 |
| `pages/DoctorManage/index.tsx` | 修改 | 同上 |
| `pages/CaseManage/index.tsx` | 修改 | 同上 |
| `layout/Sidebar.tsx` 或菜单配置 | 修改 | 根据roleId控制菜单显示 |

### 8.4 前端展示站点（frontend-site-a/src/）

| 文件 | 改动类型 | 说明 |
|------|---------|------|
| `pages/HospitalDetail/index.tsx` | 修改 | 数据请求改为by-hospital接口 |
