package com.intlmedical.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

@Data
@TableName("service_team_features")
public class ServiceTeamFeature {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long serviceTeamId;
    private Long serviceFeatureId;
}
