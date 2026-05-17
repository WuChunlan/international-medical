package com.intlmedical.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

@Data
@TableName("hospital_banners")
public class HospitalBanner {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long hospitalId;
    private String imageUrl;
    private Integer sortOrder;
    private Integer isActive;
}
