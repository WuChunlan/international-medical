package com.intlmedical.controller.hospitaladmin;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.intlmedical.entity.*;
import com.intlmedical.mapper.*;
import com.intlmedical.util.Result;
import com.intlmedical.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hospital-admin/media")
@RequiredArgsConstructor
public class HAMediaController {

    private final EntityMediaMapper entityMediaMapper;
    private final HospitalMapper hospitalMapper;
    private final DoctorMapper doctorMapper;
    private final EquipmentMapper equipmentMapper;
    private final HospitalEnvironmentMapper environmentMapper;
    private final CaseMapper caseMapper;

    @GetMapping
    public Result<List<EntityMedia>> list(
            @RequestParam String entityType,
            @RequestParam Long entityId) {
        if (!isOwned(entityType, entityId)) return Result.fail(403, "无权访问");
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
        if (!isOwned(media.getEntityType(), media.getEntityId())) return Result.fail(403, "无权访问");
        long existing = entityMediaMapper.selectCount(
            new LambdaQueryWrapper<EntityMedia>()
                .eq(EntityMedia::getEntityType, media.getEntityType())
                .eq(EntityMedia::getEntityId, media.getEntityId())
        );
        boolean isFirst = existing == 0;
        // Videos cannot be the cover image
        media.setIsCover(isFirst && !"video".equals(media.getMediaType()) ? 1 : 0);
        entityMediaMapper.insert(media);
        if (media.getIsCover() == 1) syncCoverToEntity(media);
        return Result.ok(media);
    }

    @Transactional
    @PutMapping("/{id}/set-cover")
    public Result<Void> setCover(@PathVariable Long id) {
        EntityMedia media = entityMediaMapper.selectById(id);
        if (media == null) return Result.fail("媒体资源不存在");
        if (!isOwned(media.getEntityType(), media.getEntityId())) return Result.fail(403, "无权访问");
        if ("video".equals(media.getMediaType())) return Result.fail(400, "视频不能设为主图");

        entityMediaMapper.update(null,
            new LambdaUpdateWrapper<EntityMedia>()
                .eq(EntityMedia::getEntityType, media.getEntityType())
                .eq(EntityMedia::getEntityId, media.getEntityId())
                .set(EntityMedia::getIsCover, 0)
        );
        entityMediaMapper.update(null,
            new LambdaUpdateWrapper<EntityMedia>()
                .eq(EntityMedia::getId, id)
                .set(EntityMedia::getIsCover, 1)
        );
        syncCoverToEntity(media);
        return Result.ok();
    }

    @Transactional
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        EntityMedia media = entityMediaMapper.selectById(id);
        if (media == null) return Result.ok();
        if (!isOwned(media.getEntityType(), media.getEntityId())) return Result.fail(403, "无权访问");
        entityMediaMapper.deleteById(id);
        if (media.getIsCover() != null && media.getIsCover() == 1) {
            clearEntityCover(media.getEntityType(), media.getEntityId());
        }
        return Result.ok();
    }

    private boolean isOwned(String entityType, Long entityId) {
        Long hospitalId = SecurityUtil.getCurrentHospitalId();
        if (hospitalId == null) return false;
        return switch (entityType) {
            case "hospital" -> hospitalId.equals(entityId);
            case "doctor" -> {
                Doctor d = doctorMapper.selectById(entityId);
                yield d != null && hospitalId.equals(d.getHospitalId());
            }
            case "equipment" -> {
                Equipment e = equipmentMapper.selectById(entityId);
                yield e != null && hospitalId.equals(e.getHospitalId());
            }
            case "environment" -> {
                HospitalEnvironment env = environmentMapper.selectById(entityId);
                yield env != null && hospitalId.equals(env.getHospitalId());
            }
            case "case" -> {
                Case c = caseMapper.selectById(entityId);
                yield c != null && hospitalId.equals(c.getHospitalId());
            }
            default -> false;
        };
    }

    private void syncCoverToEntity(EntityMedia media) {
        String type = media.getEntityType();
        Long entityId = media.getEntityId();
        String url = media.getUrl();
        switch (type) {
            case "hospital" -> hospitalMapper.update(null,
                new LambdaUpdateWrapper<Hospital>().eq(Hospital::getId, entityId).set(Hospital::getCoverImageUrl, url));
            case "doctor" -> doctorMapper.update(null,
                new LambdaUpdateWrapper<Doctor>().eq(Doctor::getId, entityId).set(Doctor::getPhotoUrl, url));
            case "equipment" -> equipmentMapper.update(null,
                new LambdaUpdateWrapper<Equipment>().eq(Equipment::getId, entityId).set(Equipment::getImageUrl, url));
            case "environment" -> environmentMapper.update(null,
                new LambdaUpdateWrapper<HospitalEnvironment>().eq(HospitalEnvironment::getId, entityId).set(HospitalEnvironment::getImageUrl, url));
            case "case" -> caseMapper.update(null,
                new LambdaUpdateWrapper<Case>().eq(Case::getId, entityId).set(Case::getCoverImageUrl, url));
        }
    }

    private void clearEntityCover(String type, Long entityId) {
        switch (type) {
            case "hospital" -> hospitalMapper.update(null,
                new LambdaUpdateWrapper<Hospital>().eq(Hospital::getId, entityId).set(Hospital::getCoverImageUrl, null));
            case "doctor" -> doctorMapper.update(null,
                new LambdaUpdateWrapper<Doctor>().eq(Doctor::getId, entityId).set(Doctor::getPhotoUrl, null));
            case "equipment" -> equipmentMapper.update(null,
                new LambdaUpdateWrapper<Equipment>().eq(Equipment::getId, entityId).set(Equipment::getImageUrl, null));
            case "environment" -> environmentMapper.update(null,
                new LambdaUpdateWrapper<HospitalEnvironment>().eq(HospitalEnvironment::getId, entityId).set(HospitalEnvironment::getImageUrl, null));
            case "case" -> caseMapper.update(null,
                new LambdaUpdateWrapper<Case>().eq(Case::getId, entityId).set(Case::getCoverImageUrl, null));
        }
    }
}
