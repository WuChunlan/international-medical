package com.intlmedical.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.util.Map;

@Data
@TableName("hospital_environments")
public class HospitalEnvironment {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long hospitalId;
    private String nameZh;
    private String nameEn;
    private String descZh;
    private String descEn;
    private String imageUrl;
    private Integer sortOrder;
    private Integer isActive;
    @TableField("audit_status")
    private String auditStatus;
    @TableField("rejection_reason")
    private String rejectionReason;

    @TableField(exist = false)
    private Boolean hasPendingEdit;

    @TableField(exist = false)
    private Map<String, String> translations;
}
