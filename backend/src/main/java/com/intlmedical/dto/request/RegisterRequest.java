package com.intlmedical.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
    private String firstName;
    private String lastName;
    private String gender;

    @NotBlank
    @Email
    private String email;

    private String phone;

    @NotBlank
    @Size(min = 8, max = 100)
    private String password;

    private String idCardNumber;
    private String passportNumber;
    private String idCardCountry;

    private String inviteCode;

    @NotBlank
    @Size(min = 6, max = 6)
    private String verifyCode;
}
