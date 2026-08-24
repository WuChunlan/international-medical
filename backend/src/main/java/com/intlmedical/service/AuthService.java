package com.intlmedical.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.intlmedical.dto.request.LoginRequest;
import com.intlmedical.dto.request.RegisterRequest;
import com.intlmedical.dto.response.LoginResponse;
import com.intlmedical.entity.User;
import com.intlmedical.mapper.UserMapper;
import com.intlmedical.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final RoleService roleService;

    public void register(RegisterRequest req) {
        long count = userMapper.selectCount(
            new LambdaQueryWrapper<User>()
                .eq(User::getEmail, req.getEmail())
        );
        if (count > 0) {
            throw new RuntimeException("该邮箱已注册");
        }

        User user = new User();
        user.setRoleId(roleService.getIdByCode("user"));
        user.setFirstName(req.getFirstName());
        user.setLastName(req.getLastName());
        user.setGender(req.getGender());
        user.setEmail(req.getEmail());
        user.setPhone(req.getPhone());
        user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        user.setIdCardNumber(req.getIdCardNumber());
        user.setPassportNumber(req.getPassportNumber());
        user.setIdCardCountry(req.getIdCardCountry());
        user.setIsActive(1);
        if (req.getInviteCode() != null && !req.getInviteCode().isBlank()) {
            User rep = userMapper.selectOne(
                new LambdaQueryWrapper<User>()
                    .eq(User::getRoleId, roleService.getIdByCode("customer_rep"))
                    .eq(User::getIsActive, 1)
                    .eq(User::getCanInvite, 1)
                    .eq(User::getInviteCode, req.getInviteCode().trim())
            );
            if (rep != null) {
                user.setReferredBy(rep.getId());
            }
        }
        userMapper.insert(user);
    }

    public LoginResponse login(LoginRequest req) {
        User user = userMapper.selectOne(
            new LambdaQueryWrapper<User>()
                .eq(User::getEmail, req.getEmail())
        );
        if (user == null || !passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("邮箱或密码错误");
        }
        if (user.getIsActive() != 1) {
            throw new RuntimeException("账号已被禁用");
        }
        String role = roleService.getCodeById(user.getRoleId());
        String displayName = (user.getLastName() != null ? user.getLastName() : "") +
                             (user.getFirstName() != null ? user.getFirstName() : "");
        if (displayName.isBlank()) displayName = user.getEmail();
        String token = jwtUtil.generateToken(user.getId(), displayName, role, user.getHospitalId());
        boolean mustChange = user.getMustChangePassword() != null && user.getMustChangePassword() == 1;
        return new LoginResponse(token, displayName, role, user.getHospitalId(), mustChange, user.getId());
    }

    public java.util.Map<String, Object> inviteInfo(String code) {
        java.util.Map<String, Object> result = new java.util.HashMap<>();
        if (code == null || code.isBlank()) {
            result.put("valid", false);
            result.put("repName", null);
            return result;
        }
        User rep = userMapper.selectOne(
            new LambdaQueryWrapper<User>()
                .eq(User::getRoleId, roleService.getIdByCode("customer_rep"))
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
}
