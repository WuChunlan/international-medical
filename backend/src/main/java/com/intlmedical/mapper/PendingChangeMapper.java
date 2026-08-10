package com.intlmedical.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.intlmedical.entity.PendingChange;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import java.util.List;

@Mapper
public interface PendingChangeMapper extends BaseMapper<PendingChange> {

    @Select("SELECT * FROM pending_changes WHERE entity_type = #{entityType} AND entity_id = #{entityId}")
    PendingChange selectByEntity(@Param("entityType") String entityType,
                                 @Param("entityId") Long entityId);

    @Select("SELECT * FROM pending_changes WHERE entity_type = #{entityType} AND audit_status = 'pending'")
    List<PendingChange> selectPendingByType(@Param("entityType") String entityType);

    @Select("SELECT * FROM pending_changes WHERE entity_type = #{entityType} AND entity_id IS NULL AND audit_status = 'pending'")
    List<PendingChange> selectNewDraftsByType(@Param("entityType") String entityType);
}
