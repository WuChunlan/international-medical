package com.intlmedical.controller.admin;

import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.intlmedical.entity.User;
import com.intlmedical.mapper.UserMapper;
import com.intlmedical.util.Result;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserMapper userMapper;

    @GetMapping
    public Result<IPage<User>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        IPage<User> result = userMapper.selectPage(new Page<>(page, size), null);
        // Exclude password_hash from response
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
}
