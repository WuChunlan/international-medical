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
                .eq(User::getEmail, req.getEmail())
        );
        if (count > 0) {
            throw new RuntimeException("该邮箱已注册");
        }

        User user = new User();
        user.setRoleId(1);
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
        userMapper.insert(user);

        redisTemplate.delete(CODE_PREFIX + req.getEmail());
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
        String role = switch (user.getRoleId()) {
            case 2 -> "admin";
            case 3 -> "hospital_admin";
            case 4 -> "reviewer";
            default -> "user";
        };
        String displayName = (user.getLastName() != null ? user.getLastName() : "") +
                             (user.getFirstName() != null ? user.getFirstName() : "");
        if (displayName.isBlank()) displayName = user.getEmail();
        String token = jwtUtil.generateToken(user.getId(), displayName, role, user.getHospitalId());
        return new LoginResponse(token, displayName, role, user.getHospitalId());
    }
}
