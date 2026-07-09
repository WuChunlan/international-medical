package com.intlmedical.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("users")
public class User {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Integer roleId;
    private String firstName;
    private String lastName;
    private String gender;
    private String email;
    private String phone;
    private String passwordHash;
    private String idCardNumber;
    private String passportNumber;
    private String idCardCountry;
    private Integer isActive;
    @TableField("hospital_id")
    private Long hospitalId;
    private String inviteCode;
    private Integer canInvite;
    private Long referredBy;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
