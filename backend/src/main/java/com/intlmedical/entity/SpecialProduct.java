package com.intlmedical.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@TableName("special_products")
public class SpecialProduct {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long hospitalId;
    private String nameZh;
    private String nameEn;
    private String summaryZh;
    private String summaryEn;
    private String detailZh;
    private String detailEn;
    private String coverImageUrl;
    private BigDecimal priceMin;
    private BigDecimal priceMax;
    private String contactPerson;
    private String contactInfo;
    private Integer sortOrder;
    private Integer isActive;
    @TableField("audit_status")
    private String auditStatus;
    @TableField("rejection_reason")
    private String rejectionReason;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    @TableField(exist = false)
    private Boolean hasPendingEdit;

    @TableField(exist = false)
    private List<ProductVariant> variants;

    @TableField(exist = false)
    private Map<String, String> translations;
}
