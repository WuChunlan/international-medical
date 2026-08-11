package com.intlmedical.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("site_configs")
public class SiteConfig {
    @TableId(type = IdType.AUTO)
    private Integer id;
    private String configKey;
    private String valueZh;
    private String valueEn;
    private String description;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    @TableField(exist = false)
    private String value3rd;
}
