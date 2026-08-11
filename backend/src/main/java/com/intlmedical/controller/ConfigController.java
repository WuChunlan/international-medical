package com.intlmedical.controller;

import com.intlmedical.entity.SiteConfig;
import com.intlmedical.service.ContentTranslationService;
import com.intlmedical.service.SiteConfigService;
import com.intlmedical.util.Result;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/config")
@RequiredArgsConstructor
public class ConfigController {

    private final SiteConfigService siteConfigService;
    private final ContentTranslationService translationService;

    private static final List<String> BUILTIN_LANGS = List.of("zh", "en");

    @GetMapping
    public Result<List<SiteConfig>> list() {
        return Result.ok(siteConfigService.getAll());
    }

    @GetMapping("/{key}")
    public Result<SiteConfig> getByKey(
            @PathVariable String key,
            @RequestParam(defaultValue = "zh") String lang) {
        SiteConfig cfg = siteConfigService.getByKey(key);
        if (cfg != null && !BUILTIN_LANGS.contains(lang)) {
            String translated = translationService.get("site_config", 0L, key, lang);
            if (translated != null) cfg.setValue3rd(translated);
        }
        return Result.ok(cfg);
    }

    /** 公开接口：返回当前已配置的所有语言（含内置的 zh） */
    @GetMapping("/langs")
    public Result<List<String>> getLangs() {
        List<String> configured = translationService.getTargetLangs();
        List<String> all = new ArrayList<>();
        all.add("zh");
        if (!configured.contains("en")) all.add("en");
        all.addAll(configured);
        return Result.ok(all);
    }
}
