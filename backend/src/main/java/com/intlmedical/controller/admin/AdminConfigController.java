package com.intlmedical.controller.admin;

import com.intlmedical.entity.SiteConfig;
import com.intlmedical.service.SiteConfigService;
import com.intlmedical.util.Result;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/config")
@RequiredArgsConstructor
public class AdminConfigController {

    private final SiteConfigService siteConfigService;

    @GetMapping
    public Result<List<SiteConfig>> list() {
        return Result.ok(siteConfigService.getAll());
    }

    @PutMapping("/{key}")
    public Result<Void> update(@PathVariable String key, @RequestBody UpdateConfigRequest request) {
        siteConfigService.update(key, request.getValueZh(), request.getValueEn(), request.getDescription());
        return Result.ok();
    }

    @Data
    static class UpdateConfigRequest {
        private String valueZh;
        private String valueEn;
        private String description;
    }
}
