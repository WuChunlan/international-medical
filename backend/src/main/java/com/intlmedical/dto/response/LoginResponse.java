package com.intlmedical.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private String username;
    private String role;
    private Long hospitalId;
    private boolean mustChangePassword;
    private Long userId;
}
