package com.intlmedical.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("translation_job")
public class TranslationJob {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String lang;
    /** running / cancelled / done */
    private String status;
    private Integer total;
    private Integer done;
    private Integer failed;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
