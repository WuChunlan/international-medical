package com.intlmedical.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.intlmedical.entity.Doctor;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface DoctorMapper extends BaseMapper<Doctor> {}
