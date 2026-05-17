package com.intlmedical.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.intlmedical.entity.Case;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface CaseMapper extends BaseMapper<Case> {}
