package com.intlmedical.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.intlmedical.entity.SiteConfig;
import com.intlmedical.mapper.SiteConfigMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class SiteConfigService {

    private final SiteConfigMapper siteConfigMapper;
    private final ContentTranslationService contentTranslationService;

    private static final Set<String> TRANSLATABLE_KEYS = Set.of(
        "site_name", "site_subtitle", "site_intro", "friendly_links"
    );

    public SiteConfig getByKey(String key) {
        return siteConfigMapper.selectOne(
            new LambdaQueryWrapper<SiteConfig>()
                .eq(SiteConfig::getConfigKey, key)
        );
    }

    public List<SiteConfig> getAll() {
        return siteConfigMapper.selectList(null);
    }

    public void update(String key, String valueZh, String valueEn) {
        update(key, valueZh, valueEn, null);
    }

    public void update(String key, String valueZh, String valueEn, String description) {
        SiteConfig existing = getByKey(key);
        if (existing == null) {
            SiteConfig record = new SiteConfig();
            record.setConfigKey(key);
            record.setValueZh(valueZh);
            record.setValueEn(valueEn);
            record.setDescription(description);
            siteConfigMapper.insert(record);
        } else {
            LambdaUpdateWrapper<SiteConfig> wrapper = new LambdaUpdateWrapper<SiteConfig>()
                .eq(SiteConfig::getConfigKey, key)
                .set(SiteConfig::getValueZh, valueZh)
                .set(SiteConfig::getValueEn, valueEn);
            if (description != null) {
                wrapper.set(SiteConfig::getDescription, description);
            }
            siteConfigMapper.update(null, wrapper);
        }

        if (TRANSLATABLE_KEYS.contains(key) && valueZh != null && !valueZh.isBlank()) {
            if ("friendly_links".equals(key)) {
                contentTranslationService.translateFriendlyLinksAsync(valueZh);
            } else {
                contentTranslationService.autoTranslateEntityAsync(
                    "site_config", 0L, Map.of(key, valueZh));
            }
        }
    }
}
