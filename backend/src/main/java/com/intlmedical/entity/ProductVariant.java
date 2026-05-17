package com.intlmedical.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
@TableName("product_variants")
public class ProductVariant {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long productId;
    private String nameZh;
    private String nameEn;
    private String descZh;
    private String descEn;
    private BigDecimal price;
    private Integer sortOrder;
    private Integer isActive;
}
