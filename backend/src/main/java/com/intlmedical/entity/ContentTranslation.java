package com.intlmedical.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("content_translation")
public class ContentTranslation {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String entityType;
    private Long entityId;
    private String fieldName;
    private String lang;
    /** 翻译内容，is_reviewed=1 时对外展示 */
    private String content;
    /** 翻译失败原因 */
    private String errorMsg;
    /** 0=待翻译  1=已翻译  2=翻译失败 */
    private Integer isReviewed;
    private LocalDateTime updatedAt;
}
