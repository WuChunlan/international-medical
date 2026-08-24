package com.intlmedical.controller.admin;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.intlmedical.entity.Role;
import com.intlmedical.entity.User;
import com.intlmedical.mapper.RoleMapper;
import com.intlmedical.mapper.UserMapper;
import com.intlmedical.service.RoleService;
import com.intlmedical.util.Result;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserMapper userMapper;
    private final RoleMapper roleMapper;
    private final RoleService roleService;
    private final PasswordEncoder passwordEncoder;

    @GetMapping("/roles")
    public Result<List<Role>> listRoles() {
        return Result.ok(roleMapper.selectList(null));
    }

    @GetMapping
    public Result<IPage<User>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        // 只查询普通用户（role_id=1, code='user'）
        IPage<User> result = userMapper.selectPage(
            new Page<>(page, size),
            new LambdaQueryWrapper<User>().eq(User::getRoleId, roleService.getIdByCode("user"))
        );
        result.getRecords().forEach(user -> user.setPasswordHash(null));
        return Result.ok(result);
    }

    @PutMapping("/{id}/toggle")
    public Result<Void> toggle(@PathVariable Long id) {
        User user = userMapper.selectById(id);
        if (user == null) {
            return Result.fail(404, "用户不存在");
        }
        int newStatus = user.getIsActive() != null && user.getIsActive() == 1 ? 0 : 1;
        userMapper.update(null,
            new LambdaUpdateWrapper<User>()
                .eq(User::getId, id)
                .set(User::getIsActive, newStatus)
        );
        return Result.ok();
    }

    @GetMapping("/staff")
    public Result<IPage<User>> listAllStaff(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String roleCode,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String email) {
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();

        // 只查询员工角色，排除普通用户
        List<String> staffRoles = List.of("hospital_admin", "reviewer", "base_admin", "translation_admin", "customer_rep");
        List<Integer> roleIds = staffRoles.stream()
            .map(roleService::getIdByCode)
            .toList();
        wrapper.in(User::getRoleId, roleIds);

        // 按角色过滤
        if (roleCode != null && !roleCode.isBlank()) {
            wrapper.eq(User::getRoleId, roleService.getIdByCode(roleCode));
        }

        // 按姓名过滤（firstName 或 lastName 包含）
        if (name != null && !name.isBlank()) {
            wrapper.and(w -> w.like(User::getFirstName, name).or().like(User::getLastName, name));
        }

        // 按邮箱过滤
        if (email != null && !email.isBlank()) {
            wrapper.like(User::getEmail, email);
        }

        IPage<User> result = userMapper.selectPage(new Page<>(page, size), wrapper);
        result.getRecords().forEach(u -> u.setPasswordHash(null));
        return Result.ok(result);
    }

    @PutMapping("/staff/{id}")
    public Result<Void> updateStaff(@PathVariable Long id, @RequestBody UpdateStaffRequest req) {
        User target = userMapper.selectById(id);
        if (target == null) return Result.fail(404, "账号不存在");
        if (req.getEmail() != null && !req.getEmail().equals(target.getEmail())) {
            long exists = userMapper.selectCount(
                new LambdaQueryWrapper<User>().eq(User::getEmail, req.getEmail()).ne(User::getId, id)
            );
            if (exists > 0) return Result.fail(400, "该账号已被使用");
        }
        LambdaUpdateWrapper<User> wrapper = new LambdaUpdateWrapper<User>()
            .eq(User::getId, id)
            .set(req.getEmail() != null, User::getEmail, req.getEmail())
            .set(req.getFirstName() != null, User::getFirstName, req.getFirstName())
            .set(req.getLastName() != null, User::getLastName, req.getLastName());
        if (req.getPassword() != null && !req.getPassword().isBlank()) {
            wrapper.set(User::getPasswordHash, passwordEncoder.encode(req.getPassword()));
        }
        userMapper.update(null, wrapper);
        return Result.ok();
    }

    @DeleteMapping("/staff/{id}")
    public Result<Void> deleteStaff(@PathVariable Long id) {
        User target = userMapper.selectById(id);
        if (target == null) return Result.fail(404, "账号不存在");
        userMapper.deleteById(id);
        return Result.ok();
    }

    @PostMapping("/staff")
    public Result<Void> createStaff(@RequestBody CreateStaffRequest req) {        if (req.getRoleCode() == null || req.getRoleCode().isBlank()) {
            return Result.fail(400, "角色不能为空");
        }
        Role role = roleMapper.selectOne(
            new LambdaQueryWrapper<Role>().eq(Role::getCode, req.getRoleCode())
        );
        if (role == null) {
            return Result.fail(400, "角色不存在");
        }
        if (req.getEmail() == null || req.getEmail().isBlank()) {
            return Result.fail(400, "账号不能为空");
        }
        long exists = userMapper.selectCount(
            new LambdaQueryWrapper<User>().eq(User::getEmail, req.getEmail())
        );
        if (exists > 0) {
            return Result.fail(400, "该账号已被使用");
        }
        User user = new User();
        user.setEmail(req.getEmail());
        user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        user.setFirstName(req.getFirstName());
        user.setLastName(req.getLastName());
        user.setRoleId(role.getId());
        user.setHospitalId(req.getHospitalId());
        user.setIsActive(1);
        user.setMustChangePassword("hospital_admin".equals(req.getRoleCode()) ? 1 : 0);
        userMapper.insert(user);
        return Result.ok();
    }

    // ---- Hospital Admin CRUD ----

    @GetMapping("/hospital-admins")
    public Result<IPage<User>> listHospitalAdmins(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        IPage<User> result = userMapper.selectPage(
            new Page<>(page, size),
            new LambdaQueryWrapper<User>().eq(User::getRoleId, roleService.getIdByCode("hospital_admin"))
        );
        result.getRecords().forEach(u -> u.setPasswordHash(null));
        return Result.ok(result);
    }

    @PutMapping("/hospital-admins/{id}")
    public Result<Void> updateHospitalAdmin(@PathVariable Long id,
                                             @RequestBody UpdateHospitalAdminRequest req) {
        User target = userMapper.selectById(id);
        if (target == null || !"hospital_admin".equals(roleService.getCodeById(target.getRoleId()))) {
            return Result.fail(404, "账号不存在");
        }
        if (req.getEmail() != null && !req.getEmail().equals(target.getEmail())) {
            long exists = userMapper.selectCount(
                new LambdaQueryWrapper<User>()
                    .eq(User::getEmail, req.getEmail())
                    .ne(User::getId, id)
            );
            if (exists > 0) return Result.fail(400, "该账号已被使用");
        }
        LambdaUpdateWrapper<User> wrapper = new LambdaUpdateWrapper<User>()
            .eq(User::getId, id)
            .set(req.getEmail() != null, User::getEmail, req.getEmail())
            .set(req.getFirstName() != null, User::getFirstName, req.getFirstName())
            .set(req.getLastName() != null, User::getLastName, req.getLastName())
            .set(User::getHospitalId, req.getHospitalId());
        if (req.getPassword() != null && !req.getPassword().isBlank()) {
            wrapper.set(User::getPasswordHash, passwordEncoder.encode(req.getPassword()));
            wrapper.set(User::getMustChangePassword, 1);
        }
        userMapper.update(null, wrapper);
        return Result.ok();
    }

    @DeleteMapping("/hospital-admins/{id}")
    public Result<Void> deleteHospitalAdmin(@PathVariable Long id) {
        User target = userMapper.selectById(id);
        if (target == null || !"hospital_admin".equals(roleService.getCodeById(target.getRoleId()))) {
            return Result.fail(404, "账号不存在");
        }
        userMapper.deleteById(id);
        return Result.ok();
    }

    // ---- Base Admin CRUD ----

    @GetMapping("/base-admins")
    public Result<IPage<User>> listBaseAdmins(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        IPage<User> result = userMapper.selectPage(
            new Page<>(page, size),
            new LambdaQueryWrapper<User>().eq(User::getRoleId, roleService.getIdByCode("base_admin"))
        );
        result.getRecords().forEach(u -> u.setPasswordHash(null));
        return Result.ok(result);
    }

    @PutMapping("/base-admins/{id}")
    public Result<Void> updateBaseAdmin(@PathVariable Long id,
                                        @RequestBody UpdateBaseAdminRequest req) {
        User target = userMapper.selectById(id);
        if (target == null || !"base_admin".equals(roleService.getCodeById(target.getRoleId()))) {
            return Result.fail(404, "账号不存在");
        }
        if (req.getEmail() != null && !req.getEmail().equals(target.getEmail())) {
            long exists = userMapper.selectCount(
                new LambdaQueryWrapper<User>()
                    .eq(User::getEmail, req.getEmail())
                    .ne(User::getId, id)
            );
            if (exists > 0) return Result.fail(400, "该账号已被使用");
        }
        LambdaUpdateWrapper<User> wrapper = new LambdaUpdateWrapper<User>()
            .eq(User::getId, id)
            .set(req.getEmail() != null, User::getEmail, req.getEmail())
            .set(req.getFirstName() != null, User::getFirstName, req.getFirstName())
            .set(req.getLastName() != null, User::getLastName, req.getLastName());
        if (req.getPassword() != null && !req.getPassword().isBlank()) {
            wrapper.set(User::getPasswordHash, passwordEncoder.encode(req.getPassword()));
        }
        userMapper.update(null, wrapper);
        return Result.ok();
    }

    @DeleteMapping("/base-admins/{id}")
    public Result<Void> deleteBaseAdmin(@PathVariable Long id) {
        User target = userMapper.selectById(id);
        if (target == null || !"base_admin".equals(roleService.getCodeById(target.getRoleId()))) {
            return Result.fail(404, "账号不存在");
        }
        userMapper.deleteById(id);
        return Result.ok();
    }

    @Data
    public static class UpdateStaffRequest {
        private String email;
        private String password;
        private String firstName;
        private String lastName;
    }

    @Data
    public static class UpdateHospitalAdminRequest {
        private String email;
        private String password;
        private String firstName;
        private String lastName;
        private Long hospitalId;
    }

    @Data
    public static class UpdateBaseAdminRequest {
        private String email;
        private String password;
        private String firstName;
        private String lastName;
    }

    @Data
    public static class CreateStaffRequest {
        private String email;
        private String password;
        private String firstName;
        private String lastName;
        private String roleCode;
        private Long hospitalId;
    }
}
