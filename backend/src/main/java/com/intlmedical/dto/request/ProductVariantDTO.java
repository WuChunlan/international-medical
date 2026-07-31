package com.intlmedical.dto.request;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ProductVariantDTO {
    private String nameZh;
    private String nameEn;
    private String descZh;
    private String descEn;
    private BigDecimal price;
    private Integer sortOrder;
}
