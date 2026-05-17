package com.intlmedical.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.intlmedical.dto.request.LoginRequest;
import com.intlmedical.dto.request.RegisterRequest;
import com.intlmedical.dto.response.LoginResponse;
import com.intlmedical.entity.User;
import com.intlmedical.mapper.UserMapper;
import com.intlmedical.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final StringRedisTemplate redisTemplate;
    private final JavaMailSender mailSender;

    private static final String CODE_PREFIX = "verify:email:";
    private static final String RESEND_PREFIX = "verify:resend:";

    public void sendVerifyCode(String email) {
        String resendKey = RESEND_PREFIX + email;
        if (Boolean.TRUE.equals(redisTemplate.hasKey(resendKey))) {
            throw new RuntimeException("请60秒后再重新发送验证码");
        }
        String code = String.format("%06d", new SecureRandom().nextInt(1000000));
        redisTemplate.opsForValue().set(CODE_PREFIX + email, code, 600, TimeUnit.SECONDS);
        redisTemplate.opsForValue().set(resendKey, "1", 60, TimeUnit.SECONDS);

        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setTo(email);
        msg.setSubject("International Medical - Verification Code");
        msg.setText("Your verification code is: " + code + "\nValid for 10 minutes.");
        mailSender.send(msg);
    }

    public void register(RegisterRequest req) {
        String storedCode = redisTemplate.opsForValue().get(CODE_PREFIX + req.getEmail());
        if (storedCode == null || !storedCode.equals(req.getVerifyCode())) {
            throw new RuntimeException("验证码无效或已过期");
        }

        long count = userMapper.selectCount(
            new LambdaQueryWrapper<User>()
                .eq(User::getUsername, req.getUsername())
                .or().eq(User::getEmail, req.getEmail())
        );
        if (count > 0) {
            throw new RuntimeException("用户名或邮箱已存在");
        }

        User user = new User();
        user.setRoleId(1);  // user role
        user.setUsername(req.getUsername());
        user.setEmail(req.getEmail());
        user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        user.setIdCardNumber(req.getIdCardNumber());
        user.setIdCardCountry(req.getIdCardCountry());
        user.setIsActive(1);
        userMapper.insert(user);

        redisTemplate.delete(CODE_PREFIX + req.getEmail());
    }

    public LoginResponse login(LoginRequest req) {
        User user = userMapper.selectOne(
            new LambdaQueryWrapper<User>()
                .eq(User::getUsername, req.getAccount())
                .or().eq(User::getEmail, req.getAccount())
        );
        if (user == null || !passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("账号或密码错误");
        }
        if (user.getIsActive() != 1) {
            throw new RuntimeException("账号已被禁用");
        }
        String role = user.getRoleId() == 2 ? "admin" : "user";
        String token = jwtUtil.generateToken(user.getId(), user.getUsername(), role);
        return new LoginResponse(token, user.getUsername(), role);
    }
}
