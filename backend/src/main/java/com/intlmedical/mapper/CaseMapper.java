package com.intlmedical.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.intlmedical.dto.response.CaseVO;
import com.intlmedical.entity.Case;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface CaseMapper extends BaseMapper<Case> {

    @Select("SELECT c.*, h.name_zh AS hospital_name_zh, h.name_en AS hospital_name_en " +
            "FROM cases c LEFT JOIN hospitals h ON c.hospital_id = h.id " +
            "ORDER BY c.sort_order ASC, c.id DESC")
    IPage<CaseVO> selectPageWithHospital(Page<CaseVO> page);

    @Select("SELECT c.*, h.name_zh AS hospital_name_zh, h.name_en AS hospital_name_en " +
            "FROM cases c LEFT JOIN hospitals h ON c.hospital_id = h.id " +
            "WHERE c.is_active = 1 AND c.audit_status = 'approved' " +
            "ORDER BY c.sort_order ASC, c.id DESC")
    List<CaseVO> selectActiveWithHospital();
}
