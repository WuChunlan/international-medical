package com.intlmedical.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.intlmedical.entity.ServiceFeature;
import com.intlmedical.mapper.ServiceFeatureMapper;
import com.intlmedical.service.ContentTranslationService;
import com.intlmedical.util.Result;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/service-features")
@RequiredArgsConstructor
public class ServiceFeatureController {

    private final ServiceFeatureMapper serviceFeatureMapper;
    private final ContentTranslationService translationService;

    private static final List<String> BUILTIN_LANGS = List.of("zh", "en");

    @GetMapping
    public Result<IPage<ServiceFeature>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "zh") String lang) {
        IPage<ServiceFeature> result = serviceFeatureMapper.selectPage(
            new Page<>(page, size),
            new LambdaQueryWrapper<ServiceFeature>()
                .eq(ServiceFeature::getIsActive, 1)
                .orderByAsc(ServiceFeature::getSortOrder)
        );
        if (!BUILTIN_LANGS.contains(lang)) {
            result.getRecords().forEach(f -> f.setTranslations(
                translationService.getAll("service_feature", f.getId(), lang)
            ));
        }
        return Result.ok(result);
    }
}
