package com.intlmedical.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

@Data
@TableName("doctors")
public class Doctor {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long hospitalId;
    private String nameZh;
    private String nameEn;
    private String specialtyZh;
    private String specialtyEn;
    private String bioZh;
    private String bioEn;
    private String photoUrl;
    private BigDecimal pricePerVisit;
    private String titleZh;
    private String titleEn;
    private Integer sortOrder;
    private Integer isActive;
    @TableField("audit_status")
    private String auditStatus;
    @TableField("rejection_reason")
    private String rejectionReason;
    @TableField("created_user")
    private Long createdUser;
    @TableField("updated_user")
    private Long updatedUser;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    @TableField(exist = false)
    private Boolean hasPendingEdit;

    @TableField(exist = false)
    private Map<String, String> translations;
}
