package com.intlmedical.controller;

import com.intlmedical.dto.request.LoginRequest;
import com.intlmedical.dto.request.RegisterRequest;
import com.intlmedical.dto.response.LoginResponse;
import com.intlmedical.service.AuthService;
import com.intlmedical.util.Result;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public Result<Void> register(@Valid @RequestBody RegisterRequest req) {
        authService.register(req);
        return Result.ok();
    }

    @PostMapping("/login")
    public Result<LoginResponse> login(@Valid @RequestBody LoginRequest req) {
        return Result.ok(authService.login(req));
    }

    @PostMapping("/send-code")
    public Result<Void> sendVerifyCode(@RequestParam String email) {
        authService.sendVerifyCode(email);
        return Result.ok();
    }
}
