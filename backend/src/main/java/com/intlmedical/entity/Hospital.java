package com.intlmedical.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("hospitals")
public class Hospital {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String nameZh;
    private String nameEn;
    private String introZh;
    private String introEn;
    private String coverImageUrl;
    private String videoUrl;
    private String addressZh;
    private String addressEn;
    private String phone;
    private String contactPerson;
    private String contactInfo;
    private Integer sortOrder;
    private Integer isActive;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
