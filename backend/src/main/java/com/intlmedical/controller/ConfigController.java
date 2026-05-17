package com.intlmedical.controller;

import com.intlmedical.entity.SiteConfig;
import com.intlmedical.service.SiteConfigService;
import com.intlmedical.util.Result;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/config")
@RequiredArgsConstructor
public class ConfigController {

    private final SiteConfigService siteConfigService;

    @GetMapping
    public Result<List<SiteConfig>> list() {
        return Result.ok(siteConfigService.getAll());
    }

    @GetMapping("/{key}")
    public Result<SiteConfig> getByKey(@PathVariable String key) {
        return Result.ok(siteConfigService.getByKey(key));
    }
}
