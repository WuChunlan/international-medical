package com.intlmedical.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    @NotBlank
    private String account;  // email or username

    @NotBlank
    private String password;
}
