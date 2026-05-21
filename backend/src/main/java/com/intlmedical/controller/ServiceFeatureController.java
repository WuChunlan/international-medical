package com.intlmedical.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.intlmedical.entity.ServiceFeature;
import com.intlmedical.mapper.ServiceFeatureMapper;
import com.intlmedical.util.Result;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/service-features")
@RequiredArgsConstructor
public class ServiceFeatureController {

    private final ServiceFeatureMapper serviceFeatureMapper;

    @GetMapping
    public Result<IPage<ServiceFeature>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        IPage<ServiceFeature> result = serviceFeatureMapper.selectPage(
            new Page<>(page, size),
            new LambdaQueryWrapper<ServiceFeature>()
                .eq(ServiceFeature::getIsActive, 1)
                .orderByAsc(ServiceFeature::getSortOrder)
        );
        return Result.ok(result);
    }
}
