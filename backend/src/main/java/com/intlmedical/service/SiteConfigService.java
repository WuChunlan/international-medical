package com.intlmedical.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.intlmedical.entity.SiteConfig;
import com.intlmedical.mapper.SiteConfigMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SiteConfigService {

    private final SiteConfigMapper siteConfigMapper;

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
        SiteConfig existing = getByKey(key);
        if (existing == null) {
            SiteConfig record = new SiteConfig();
            record.setConfigKey(key);
            record.setValueZh(valueZh);
            record.setValueEn(valueEn);
            siteConfigMapper.insert(record);
        } else {
            siteConfigMapper.update(null,
                new LambdaUpdateWrapper<SiteConfig>()
                    .eq(SiteConfig::getConfigKey, key)
                    .set(SiteConfig::getValueZh, valueZh)
                    .set(SiteConfig::getValueEn, valueEn)
            );
        }
    }
}
