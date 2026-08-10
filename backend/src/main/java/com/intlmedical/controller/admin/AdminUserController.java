package com.intlmedical.controller.admin;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.intlmedical.entity.User;
import com.intlmedical.mapper.UserMapper;
import com.intlmedical.util.Result;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @GetMapping
    public Result<IPage<User>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        IPage<User> result = userMapper.selectPage(new Page<>(page, size), null);
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

    @PostMapping("/staff")
    public Result<Void> createStaff(@RequestBody CreateStaffRequest req) {
        if (req.getRoleId() != 3 && req.getRoleId() != 4) {
            return Result.fail(400, "roleId 必须为 3(医院管理员) 或 4(审核员)");
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
        user.setRoleId(req.getRoleId());
        user.setHospitalId(req.getHospitalId());
        user.setIsActive(1);
        // hospital_admin must change password on first login
        user.setMustChangePassword(req.getRoleId() == 3 ? 1 : 0);
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
            new LambdaQueryWrapper<User>().eq(User::getRoleId, 3)
        );
        result.getRecords().forEach(u -> u.setPasswordHash(null));
        return Result.ok(result);
    }

    @PutMapping("/hospital-admins/{id}")
    public Result<Void> updateHospitalAdmin(@PathVariable Long id,
                                             @RequestBody UpdateHospitalAdminRequest req) {
        User target = userMapper.selectById(id);
        if (target == null || target.getRoleId() != 3) {
            return Result.fail(404, "账号不存在");
        }
        // email uniqueness check (exclude self)
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
            // admin resetting password requires HA to change it again on next login
            wrapper.set(User::getMustChangePassword, 1);
        }
        userMapper.update(null, wrapper);
        return Result.ok();
    }

    @DeleteMapping("/hospital-admins/{id}")
    public Result<Void> deleteHospitalAdmin(@PathVariable Long id) {
        User target = userMapper.selectById(id);
        if (target == null || target.getRoleId() != 3) {
            return Result.fail(404, "账号不存在");
        }
        userMapper.deleteById(id);
        return Result.ok();
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
    public static class CreateStaffRequest {
        private String email;
        private String password;
        private String firstName;
        private String lastName;
        private Integer roleId;
        private Long hospitalId;
    }
}
