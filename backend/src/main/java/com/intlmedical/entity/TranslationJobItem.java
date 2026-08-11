package com.intlmedical.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("translation_job_item")
public class TranslationJobItem {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long jobId;
    private String entityType;
    private Long entityId;
    private String entityLabel;
    private String fieldName;
    /** pending / done / failed */
    private String status;
    private String errorMsg;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
