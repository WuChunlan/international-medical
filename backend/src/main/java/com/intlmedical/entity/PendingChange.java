package com.intlmedical.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("pending_changes")
public class PendingChange {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String entityType;
    private Long entityId;
    private String pendingData;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime submittedAt;
    private Long submittedBy;
    private String auditStatus;
    private String rejectionReason;
    private LocalDateTime reviewedAt;
    private Long reviewedBy;
}
