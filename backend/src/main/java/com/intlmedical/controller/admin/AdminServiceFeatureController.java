package com.intlmedical.controller.admin;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.intlmedical.entity.ServiceFeature;
import com.intlmedical.entity.ServiceTeamFeature;
import com.intlmedical.mapper.ServiceFeatureMapper;
import com.intlmedical.mapper.ServiceTeamFeatureMapper;
import com.intlmedical.service.ContentTranslationService;
import com.intlmedical.util.Result;
import com.intlmedical.util.SecurityUtil;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/service-features")
@RequiredArgsConstructor
public class AdminServiceFeatureController {

    private final ServiceFeatureMapper serviceFeatureMapper;
    private final ServiceTeamFeatureMapper serviceTeamFeatureMapper;
    private final ContentTranslationService contentTranslationService;

    @GetMapping
    public Result<IPage<ServiceFeatureDto>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        IPage<ServiceFeature> raw = serviceFeatureMapper.selectPage(
            new Page<>(page, size),
            new LambdaQueryWrapper<ServiceFeature>().orderByAsc(ServiceFeature::getSortOrder)
        );
        IPage<ServiceFeatureDto> result = raw.convert(sf -> {
            ServiceFeatureDto dto = new ServiceFeatureDto();
            dto.setId(sf.getId());
            dto.setNameZh(sf.getNameZh());
            dto.setNameEn(sf.getNameEn());
            dto.setIntroZh(sf.getIntroZh());
            dto.setIntroEn(sf.getIntroEn());
            dto.setImageUrl(sf.getImageUrl());
            dto.setSortOrder(sf.getSortOrder());
            dto.setIsActive(sf.getIsActive());
            dto.setCreatedUser(sf.getCreatedUser());
            dto.setCreatedAt(sf.getCreatedAt() != null ? sf.getCreatedAt().toString() : null);
            List<Long> teamIds = serviceTeamFeatureMapper.selectList(
                new LambdaQueryWrapper<ServiceTeamFeature>()
                    .eq(ServiceTeamFeature::getServiceFeatureId, sf.getId())
            ).stream().map(ServiceTeamFeature::getServiceTeamId).collect(Collectors.toList());
            dto.setTeamIds(teamIds);
            return dto;
        });
        return Result.ok(result);
    }

    @PostMapping
    public Result<Void> create(@RequestBody ServiceFeatureRequest req) {
        Long currentUserId = SecurityUtil.getCurrentUserId();
        ServiceFeature sf = req.toEntity();
        sf.setCreatedUser(currentUserId);
        sf.setUpdatedUser(currentUserId);
        sf.setAuditStatus("approved");
        serviceFeatureMapper.insert(sf);
        saveTeamLinks(sf.getId(), req.getTeamIds());
        contentTranslationService.autoTranslateEntityAsync("service_feature", sf.getId(), Map.of(
            "name", nullSafe(req.getNameZh()),
            "intro", nullSafe(req.getIntroZh())
        ));
        return Result.ok();
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody ServiceFeatureRequest req) {
        ServiceFeature existing = serviceFeatureMapper.selectById(id);
        if (existing == null) return Result.fail(404, "服务功能不存在");
        if (!SecurityUtil.canEdit(existing.getCreatedUser())) {
            return Result.fail(403, "无权编辑他人创建的数据");
        }
        ServiceFeature sf = req.toEntity();
        sf.setId(id);
        sf.setUpdatedUser(SecurityUtil.getCurrentUserId());
        sf.setAuditStatus("approved");
        serviceFeatureMapper.updateById(sf);
        serviceTeamFeatureMapper.delete(
            new LambdaQueryWrapper<ServiceTeamFeature>()
                .eq(ServiceTeamFeature::getServiceFeatureId, id)
        );
        saveTeamLinks(id, req.getTeamIds());
        contentTranslationService.autoTranslateEntityAsync("service_feature", id, Map.of(
            "name", nullSafe(req.getNameZh()),
            "intro", nullSafe(req.getIntroZh())
        ));
        return Result.ok();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        ServiceFeature existing = serviceFeatureMapper.selectById(id);
        if (existing == null) return Result.fail(404, "服务功能不存在");
        if (!SecurityUtil.canEdit(existing.getCreatedUser())) {
            return Result.fail(403, "无权删除他人创建的数据");
        }
        serviceTeamFeatureMapper.delete(
            new LambdaQueryWrapper<ServiceTeamFeature>()
                .eq(ServiceTeamFeature::getServiceFeatureId, id)
        );
        serviceFeatureMapper.deleteById(id);
        return Result.ok();
    }

    private void saveTeamLinks(Long featureId, List<Long> teamIds) {
        if (teamIds == null || teamIds.isEmpty()) return;
        for (Long teamId : teamIds) {
            ServiceTeamFeature link = new ServiceTeamFeature();
            link.setServiceTeamId(teamId);
            link.setServiceFeatureId(featureId);
            serviceTeamFeatureMapper.insert(link);
        }
    }

    private static String nullSafe(String s) { return s != null ? s : ""; }

    @Data
    public static class ServiceFeatureRequest {
        private String nameZh;
        private String nameEn;
        private String introZh;
        private String introEn;
        private String imageUrl;
        private Integer sortOrder;
        private Integer isActive;
        private List<Long> teamIds;

        public ServiceFeature toEntity() {
            ServiceFeature sf = new ServiceFeature();
            sf.setNameZh(nameZh);
            sf.setNameEn(nameEn);
            sf.setIntroZh(introZh);
            sf.setIntroEn(introEn);
            sf.setImageUrl(imageUrl);
            sf.setSortOrder(sortOrder != null ? sortOrder : 0);
            sf.setIsActive(isActive != null ? isActive : 1);
            return sf;
        }
    }

    @Data
    @EqualsAndHashCode(callSuper = false)
    public static class ServiceFeatureDto {
        private Long id;
        private String nameZh;
        private String nameEn;
        private String introZh;
        private String introEn;
        private String imageUrl;
        private Integer sortOrder;
        private Integer isActive;
        private Long createdUser;
        private String createdAt;
        private List<Long> teamIds;
    }
}
