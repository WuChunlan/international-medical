package com.intlmedical.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("cases")
public class Case {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long hospitalId;
    private String titleZh;
    private String titleEn;
    private String summaryZh;
    private String summaryEn;
    private String coverImageUrl;
    private Integer sortOrder;
    private Integer isActive;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
