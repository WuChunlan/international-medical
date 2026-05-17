package com.intlmedical.controller.admin;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.intlmedical.entity.Doctor;
import com.intlmedical.entity.EntityMedia;
import com.intlmedical.entity.Equipment;
import com.intlmedical.entity.Hospital;
import com.intlmedical.entity.SpecialProduct;
import com.intlmedical.mapper.DoctorMapper;
import com.intlmedical.mapper.EntityMediaMapper;
import com.intlmedical.mapper.EquipmentMapper;
import com.intlmedical.mapper.HospitalMapper;
import com.intlmedical.mapper.SpecialProductMapper;
import com.intlmedical.util.Result;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/media")
@RequiredArgsConstructor
public class AdminMediaController {

    private final EntityMediaMapper entityMediaMapper;
    private final HospitalMapper hospitalMapper;
    private final DoctorMapper doctorMapper;
    private final SpecialProductMapper specialProductMapper;
    private final EquipmentMapper equipmentMapper;

    @GetMapping
    public Result<List<EntityMedia>> list(
            @RequestParam String entityType,
            @RequestParam Long entityId) {
        List<EntityMedia> list = entityMediaMapper.selectList(
            new LambdaQueryWrapper<EntityMedia>()
                .eq(EntityMedia::getEntityType, entityType)
                .eq(EntityMedia::getEntityId, entityId)
                .orderByAsc(EntityMedia::getSortOrder)
        );
        return Result.ok(list);
    }

    @Transactional
    @PostMapping
    public Result<EntityMedia> create(@RequestBody EntityMedia media) {
        long existing = entityMediaMapper.selectCount(
            new LambdaQueryWrapper<EntityMedia>()
                .eq(EntityMedia::getEntityType, media.getEntityType())
                .eq(EntityMedia::getEntityId, media.getEntityId())
        );
        boolean isFirst = existing == 0;
        media.setIsCover(isFirst ? 1 : 0);
        entityMediaMapper.insert(media);
        if (isFirst) {
            syncCoverToEntity(media);
        }
        return Result.ok(media);
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody EntityMedia media) {
        media.setId(id);
        entityMediaMapper.updateById(media);
        return Result.ok();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        EntityMedia media = entityMediaMapper.selectById(id);
        if (media != null) {
            entityMediaMapper.deleteById(id);
            // If deleted item was the cover, clear entity cover field
            if (media.getIsCover() != null && media.getIsCover() == 1) {
                clearEntityCover(media.getEntityType(), media.getEntityId());
            }
        }
        return Result.ok();
    }

    @Transactional
    @PutMapping("/{id}/set-cover")
    public Result<Void> setCover(@PathVariable Long id) {
        EntityMedia media = entityMediaMapper.selectById(id);
        if (media == null) return Result.fail("媒体资源不存在");

        // Clear all covers for this entity
        entityMediaMapper.update(null,
            new LambdaUpdateWrapper<EntityMedia>()
                .eq(EntityMedia::getEntityType, media.getEntityType())
                .eq(EntityMedia::getEntityId, media.getEntityId())
                .set(EntityMedia::getIsCover, 0)
        );

        // Set this one as cover
        entityMediaMapper.update(null,
            new LambdaUpdateWrapper<EntityMedia>()
                .eq(EntityMedia::getId, id)
                .set(EntityMedia::getIsCover, 1)
        );

        // Sync cover URL back to entity's cover_image_url field for list queries
        syncCoverToEntity(media);
        return Result.ok();
    }

    private void syncCoverToEntity(EntityMedia media) {
        String type = media.getEntityType();
        Long entityId = media.getEntityId();
        String url = media.getUrl();

        switch (type) {
            case "hospital" -> hospitalMapper.update(null,
                new LambdaUpdateWrapper<Hospital>()
                    .eq(Hospital::getId, entityId)
                    .set(Hospital::getCoverImageUrl, url)
            );
            case "doctor" -> doctorMapper.update(null,
                new LambdaUpdateWrapper<Doctor>()
                    .eq(Doctor::getId, entityId)
                    .set(Doctor::getPhotoUrl, url)
            );
            case "product" -> specialProductMapper.update(null,
                new LambdaUpdateWrapper<SpecialProduct>()
                    .eq(SpecialProduct::getId, entityId)
                    .set(SpecialProduct::getCoverImageUrl, url)
            );
            case "equipment" -> equipmentMapper.update(null,
                new LambdaUpdateWrapper<Equipment>()
                    .eq(Equipment::getId, entityId)
                    .set(Equipment::getImageUrl, url)
            );
        }
    }

    private void clearEntityCover(String type, Long entityId) {
        switch (type) {
            case "hospital" -> hospitalMapper.update(null,
                new LambdaUpdateWrapper<Hospital>()
                    .eq(Hospital::getId, entityId)
                    .set(Hospital::getCoverImageUrl, null)
            );
            case "doctor" -> doctorMapper.update(null,
                new LambdaUpdateWrapper<Doctor>()
                    .eq(Doctor::getId, entityId)
                    .set(Doctor::getPhotoUrl, null)
            );
            case "product" -> specialProductMapper.update(null,
                new LambdaUpdateWrapper<SpecialProduct>()
                    .eq(SpecialProduct::getId, entityId)
                    .set(SpecialProduct::getCoverImageUrl, null)
            );
            case "equipment" -> equipmentMapper.update(null,
                new LambdaUpdateWrapper<Equipment>()
                    .eq(Equipment::getId, entityId)
                    .set(Equipment::getImageUrl, null)
            );
        }
    }
}
