package com.intlmedical.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    @NotBlank
    @jakarta.validation.constraints.Email
    private String email;

    @NotBlank
    private String password;
}
