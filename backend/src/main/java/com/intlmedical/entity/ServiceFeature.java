package com.intlmedical.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.Map;

@Data
@TableName("service_features")
public class ServiceFeature {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String nameZh;
    private String nameEn;
    private String introZh;
    private String introEn;
    private String imageUrl;
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
    private Map<String, String> translations;
}
