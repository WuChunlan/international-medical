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
}
