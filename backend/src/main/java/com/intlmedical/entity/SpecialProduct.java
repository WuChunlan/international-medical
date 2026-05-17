package com.intlmedical.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

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
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
