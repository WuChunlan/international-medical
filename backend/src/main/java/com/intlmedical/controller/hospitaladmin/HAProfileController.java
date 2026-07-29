package com.intlmedical.controller.hospitaladmin;

import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.intlmedical.entity.User;
import com.intlmedical.mapper.UserMapper;
import com.intlmedical.util.Result;
import com.intlmedical.util.SecurityUtil;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/hospital-admin/profile")
@RequiredArgsConstructor
public class HAProfileController {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @PutMapping("/change-password")
    public Result<Void> changePassword(@RequestBody ChangePasswordRequest req) {
        Long userId = SecurityUtil.getCurrentUserId();
        if (userId == null) return Result.fail(403, "未登录");

        User user = userMapper.selectById(userId);
        if (user == null) return Result.fail(404, "用户不存在");

        if (req.getOldPassword() != null && !req.getOldPassword().isBlank()) {
            if (!passwordEncoder.matches(req.getOldPassword(), user.getPasswordHash())) {
                return Result.fail(400, "原密码错误");
            }
        }

        if (req.getNewPassword() == null || req.getNewPassword().length() < 6) {
            return Result.fail(400, "新密码至少6位");
        }

        userMapper.update(null, new LambdaUpdateWrapper<User>()
            .eq(User::getId, userId)
            .set(User::getPasswordHash, passwordEncoder.encode(req.getNewPassword()))
            .set(User::getMustChangePassword, 0));

        return Result.ok();
    }

    @Data
    public static class ChangePasswordRequest {
        private String oldPassword;
        private String newPassword;
    }
}
