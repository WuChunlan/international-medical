package com.intlmedical.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

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
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
