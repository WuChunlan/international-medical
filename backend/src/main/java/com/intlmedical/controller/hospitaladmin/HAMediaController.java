package com.intlmedical.controller.hospitaladmin;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.intlmedical.entity.*;
import com.intlmedical.mapper.*;
import com.intlmedical.service.PendingChangeService;
import com.intlmedical.util.Result;
import com.intlmedical.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
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
    private final PendingChangeService pendingChangeService;
    private final PendingChangeMapper pendingChangeMapper;
    private final ObjectMapper objectMapper;

    record MediaItemWithStatus(
        Long id, String url, String mediaType,
        Integer isCover, Integer sortOrder, String status
    ) {}

    @GetMapping
    public Result<List<MediaItemWithStatus>> list(
            @RequestParam String entityType,
            @RequestParam Long entityId) {
        if (!isOwned(entityType, entityId)) return Result.fail(403, "无权访问");

        // Approved items from entity_media
        List<EntityMedia> approved = entityMediaMapper.selectList(
            new LambdaQueryWrapper<EntityMedia>()
                .eq(EntityMedia::getEntityType, entityType)
                .eq(EntityMedia::getEntityId, entityId)
                .orderByAsc(EntityMedia::getSortOrder));

        List<MediaItemWithStatus> result = new java.util.ArrayList<>(
            approved.stream()
                .map(m -> new MediaItemWithStatus(
                    m.getId(), m.getUrl(), m.getMediaType(),
                    m.getIsCover(), m.getSortOrder(), "approved"))
                .toList());

        // Pending-add items from pending_changes.pending_data.media (id == null)
        String pluralType = toPlural(entityType);
        PendingChange pc = pendingChangeMapper.selectByEntity(pluralType, entityId);
        if (pc != null && "pending".equals(pc.getAuditStatus())) {
            try {
                com.fasterxml.jackson.databind.JsonNode mediaNode =
                    objectMapper.readTree(pc.getPendingData()).path("media");
                if (mediaNode.isArray()) {
                    for (com.fasterxml.jackson.databind.JsonNode m : mediaNode) {
                        if (m.path("id").isNull() || m.path("id").isMissingNode()) {
                            result.add(new MediaItemWithStatus(
                                null,
                                m.path("url").asText(""),
                                m.path("mediaType").asText("image"),
                                m.path("isCover").asInt(0),
                                m.path("sortOrder").asInt(result.size()),
                                "pending_add"));
                        }
                    }
                }
            } catch (Exception ignored) {}
        }
        return Result.ok(result);
    }

    @PostMapping
    public Result<Void> create(@RequestBody EntityMedia media) {
        if (!isOwned(media.getEntityType(), media.getEntityId())) return Result.fail(403, "无权访问");
        Long userId = SecurityUtil.getCurrentUserId();
        String entityType = toPlural(media.getEntityType());
        try {
            pendingChangeService.submitMediaEdit(entityType, media.getEntityId(),
                "add", media, null, userId);
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            return Result.fail("提交失败，请重试");
        }
        return Result.ok();
    }

    @PutMapping("/{id}/set-cover")
    public Result<Void> setCover(@PathVariable Long id) {
        EntityMedia media = entityMediaMapper.selectById(id);
        if (media == null) return Result.fail("媒体资源不存在");
        if (!isOwned(media.getEntityType(), media.getEntityId())) return Result.fail(403, "无权访问");
        if ("video".equals(media.getMediaType())) return Result.fail(400, "视频不能设为主图");
        Long userId = SecurityUtil.getCurrentUserId();
        String entityType = toPlural(media.getEntityType());
        try {
            pendingChangeService.submitMediaEdit(entityType, media.getEntityId(),
                "set-cover", null, id, userId);
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            return Result.fail("提交失败，请重试");
        }
        return Result.ok();
    }

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

    @DeleteMapping("/pending")
    public Result<Void> deletePending(
            @RequestParam String entityType,
            @RequestParam Long entityId,
            @RequestParam String url) {
        if (!isOwned(entityType, entityId)) return Result.fail(403, "无权访问");
        String pluralType = toPlural(entityType);
        PendingChange pc = pendingChangeMapper.selectByEntity(pluralType, entityId);
        if (pc == null || !"pending".equals(pc.getAuditStatus())) return Result.ok();
        try {
            com.fasterxml.jackson.databind.node.ObjectNode root =
                (com.fasterxml.jackson.databind.node.ObjectNode)
                    objectMapper.readTree(pc.getPendingData());
            com.fasterxml.jackson.databind.JsonNode mediaNode = root.path("media");
            if (!mediaNode.isArray()) return Result.ok();

            com.fasterxml.jackson.databind.node.ArrayNode updated =
                objectMapper.createArrayNode();
            for (com.fasterxml.jackson.databind.JsonNode m : mediaNode) {
                boolean isTargetPending = (m.path("id").isNull() || m.path("id").isMissingNode())
                    && url.equals(m.path("url").asText(""));
                if (!isTargetPending) updated.add(m);
            }

            // Check if any pending-add items remain
            boolean hasPendingItems = false;
            for (com.fasterxml.jackson.databind.JsonNode m : updated) {
                if (m.path("id").isNull() || m.path("id").isMissingNode()) {
                    hasPendingItems = true;
                    break;
                }
            }

            if (!hasPendingItems) {
                // Check for set-cover changes: any id!=null item with different isCover than entity_media
                String singularType = toSingular(entityType);
                List<EntityMedia> liveMedia = entityMediaMapper.selectList(
                    new LambdaQueryWrapper<EntityMedia>()
                        .eq(EntityMedia::getEntityType, singularType)
                        .eq(EntityMedia::getEntityId, entityId));
                java.util.Map<Long, Integer> liveCoverMap = liveMedia.stream()
                    .collect(java.util.stream.Collectors.toMap(
                        EntityMedia::getId, EntityMedia::getIsCover));
                boolean hasCoverChange = false;
                for (com.fasterxml.jackson.databind.JsonNode m : updated) {
                    com.fasterxml.jackson.databind.JsonNode idNode = m.path("id");
                    if (!idNode.isNull() && !idNode.isMissingNode()) {
                        Long mId = idNode.asLong();
                        int pendingCover = m.path("isCover").asInt(0);
                        Integer liveCover = liveCoverMap.get(mId);
                        if (liveCover != null && liveCover != pendingCover) {
                            hasCoverChange = true;
                            break;
                        }
                    }
                }

                if (!hasCoverChange) {
                    pendingChangeMapper.deleteById(pc.getId());
                    return Result.ok();
                }
            }

            root.set("media", updated);
            pc.setPendingData(objectMapper.writeValueAsString(root));
            pendingChangeMapper.updateById(pc);
        } catch (Exception e) {
            return Result.fail("操作失败，请重试");
        }
        return Result.ok();
    }

    private boolean isOwned(String entityType, Long entityId) {
        Long hospitalId = SecurityUtil.getCurrentHospitalId();
        if (hospitalId == null) return false;
        return switch (entityType) {
            case "hospital", "hospitals" -> hospitalId.equals(entityId);
            case "doctor", "doctors" -> {
                Doctor d = doctorMapper.selectById(entityId);
                yield d != null && hospitalId.equals(d.getHospitalId());
            }
            case "equipment", "equipments" -> {
                Equipment e = equipmentMapper.selectById(entityId);
                yield e != null && hospitalId.equals(e.getHospitalId());
            }
            case "environment", "environments" -> {
                HospitalEnvironment env = environmentMapper.selectById(entityId);
                yield env != null && hospitalId.equals(env.getHospitalId());
            }
            case "case", "cases" -> {
                Case c = caseMapper.selectById(entityId);
                yield c != null && hospitalId.equals(c.getHospitalId());
            }
            default -> false;
        };
    }

    // entity_media stores singular types; PendingChangeService uses plural
    private String toPlural(String singular) {
        return switch (singular) {
            case "hospital"    -> "hospitals";
            case "doctor"      -> "doctors";
            case "equipment"   -> "equipments";
            case "environment" -> "environments";
            case "case"        -> "cases";
            default            -> singular;
        };
    }

    private String toSingular(String plural) {
        return switch (plural) {
            case "hospitals"    -> "hospital";
            case "doctors"      -> "doctor";
            case "equipments"   -> "equipment";
            case "environments" -> "environment";
            case "cases"        -> "case";
            default             -> plural;
        };
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
