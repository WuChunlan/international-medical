package com.intlmedical.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("service_teams")
public class ServiceTeam {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String nameZh;
    private String nameEn;
    private String introZh;
    private String introEn;
    private String imageUrl;
    private Integer sortOrder;
    private Integer isActive;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
