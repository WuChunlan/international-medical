package com.intlmedical.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("roles")
public class Role {
    @TableId(type = IdType.AUTO)
    private Integer id;
    private String code;
    private String nameZh;
    private String nameEn;
}
