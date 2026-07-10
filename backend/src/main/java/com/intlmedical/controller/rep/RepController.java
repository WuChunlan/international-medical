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

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
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
    public Result<Map<String, Object>> customers(
            Authentication auth,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long userId = (Long) auth.getPrincipal();
        IPage<User> result = userMapper.selectPage(
            new Page<>(page, size),
            new LambdaQueryWrapper<User>()
                // 仅投影非敏感字段，绝不返回证件号/护照等 PII
                .select(User::getId, User::getFirstName, User::getLastName,
                        User::getEmail, User::getPhone, User::getCreatedAt)
                .eq(User::getReferredBy, userId).orderByDesc(User::getId)
        );
        List<Map<String, Object>> records = new ArrayList<>();
        for (User u : result.getRecords()) {
            Map<String, Object> row = new HashMap<>();
            row.put("id", u.getId());
            row.put("firstName", u.getFirstName());
            row.put("lastName", u.getLastName());
            row.put("email", u.getEmail());
            row.put("phone", u.getPhone());
            row.put("createdAt", u.getCreatedAt());
            records.add(row);
        }
        Map<String, Object> data = new HashMap<>();
        data.put("records", records);
        data.put("total", result.getTotal());
        return Result.ok(data);
    }
}
