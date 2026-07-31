package com.intlmedical.dto.request;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class HAProductRequest {
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
    private List<ProductVariantDTO> variants;
}
