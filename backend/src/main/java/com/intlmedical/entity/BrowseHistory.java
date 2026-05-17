package com.intlmedical.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("browse_history")
public class BrowseHistory {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private String targetType;  // hospital | product
    private Long targetId;
    private String targetNameZh;
    private String targetNameEn;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
