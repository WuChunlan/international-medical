package com.intlmedical.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.intlmedical.entity.ContentTranslation;
import com.intlmedical.entity.SiteConfig;
import com.intlmedical.mapper.ContentTranslationMapper;
import com.intlmedical.mapper.SiteConfigMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ContentTranslationService {

    public static final int STATUS_PENDING = 0;
    public static final int STATUS_DONE    = 1;
    public static final int STATUS_FAILED  = 2;

    private final ContentTranslationMapper mapper;
    private final TranslateService translateService;
    private final SiteConfigMapper siteConfigMapper;
    private final ObjectMapper objectMapper;

    public String get(String entityType, Long entityId, String fieldName, String lang) {
        ContentTranslation row = mapper.selectOne(
            new LambdaQueryWrapper<ContentTranslation>()
                .eq(ContentTranslation::getEntityType, entityType)
                .eq(ContentTranslation::getEntityId, entityId)
                .eq(ContentTranslation::getFieldName, fieldName)
                .eq(ContentTranslation::getLang, lang)
        );
        if (row == null) return null;
        return row.getIsReviewed() == STATUS_DONE ? row.getContent() : null;
    }

    public Map<String, String> getAll(String entityType, Long entityId, String lang) {
        List<ContentTranslation> rows = mapper.selectList(
            new LambdaQueryWrapper<ContentTranslation>()
                .eq(ContentTranslation::getEntityType, entityType)
                .eq(ContentTranslation::getEntityId, entityId)
                .eq(ContentTranslation::getLang, lang)
                .eq(ContentTranslation::getIsReviewed, STATUS_DONE)
        );
        return rows.stream().collect(Collectors.toMap(
            ContentTranslation::getFieldName,
            ContentTranslation::getContent
        ));
    }

    public void machineTranslate(String entityType, Long entityId,
                                  String fieldName, String lang, String zhText) {
        if (zhText == null || zhText.isBlank()) return;

        ContentTranslation row = mapper.selectOne(
            new LambdaQueryWrapper<ContentTranslation>()
                .eq(ContentTranslation::getEntityType, entityType)
                .eq(ContentTranslation::getEntityId, entityId)
                .eq(ContentTranslation::getFieldName, fieldName)
                .eq(ContentTranslation::getLang, lang)
        );

        String translated;
        String errorMsg = null;
        int status;
        try {
            translated = translateService.translate(zhText, lang);
            status = STATUS_DONE;
        } catch (Exception e) {
            translated = row != null ? row.getContent() : null;
            errorMsg = e.getMessage();
            status = STATUS_FAILED;
            log.warn("机器翻译失败 entity={} id={} field={} lang={}: {}",
                entityType, entityId, fieldName, lang, e.getMessage());
        }

        if (row == null) {
            ContentTranslation newRow = new ContentTranslation();
            newRow.setEntityType(entityType);
            newRow.setEntityId(entityId);
            newRow.setFieldName(fieldName);
            newRow.setLang(lang);
            newRow.setContent(translated);
            newRow.setErrorMsg(errorMsg);
            newRow.setIsReviewed(status);
            mapper.insert(newRow);
        } else {
            var update = new LambdaUpdateWrapper<ContentTranslation>()
                .eq(ContentTranslation::getEntityType, entityType)
                .eq(ContentTranslation::getEntityId, entityId)
                .eq(ContentTranslation::getFieldName, fieldName)
                .eq(ContentTranslation::getLang, lang)
                .set(ContentTranslation::getIsReviewed, status)
                .set(ContentTranslation::getErrorMsg, errorMsg);
            if (status == STATUS_DONE) {
                update.set(ContentTranslation::getContent, translated);
            }
            mapper.update(null, update);
        }
    }

    @Async
    public void autoTranslateEntityAsync(String entityType, Long entityId, Map<String, String> zhFields) {
        autoTranslateEntity(entityType, entityId, zhFields);
    }

    public void autoTranslateEntity(String entityType, Long entityId, Map<String, String> zhFields) {
        List<String> targetLangs = getTargetLangs();
        for (String lang : targetLangs) {
            for (Map.Entry<String, String> entry : zhFields.entrySet()) {
                String zhText = entry.getValue();
                if (zhText == null || zhText.isBlank()) continue;
                machineTranslate(entityType, entityId, entry.getKey(), lang, zhText);
            }
        }
    }

    /**
     * 保存 friendly_links 后异步翻译：逐条翻译每个名称，组装 JSON 数组写入 content_translations
     */
    @Async
    public void translateFriendlyLinksAsync(String valueZh) {
        try {
            String[] names = objectMapper.readValue(valueZh, String[].class);
            List<String> targetLangs = getTargetLangs();
            for (String lang : targetLangs) {
                String[] translated = new String[names.length];
                for (int i = 0; i < names.length; i++) {
                    if (names[i] == null || names[i].isBlank()) {
                        translated[i] = "";
                        continue;
                    }
                    try {
                        translated[i] = translateService.translate(names[i], lang);
                    } catch (Exception e) {
                        log.warn("friendly_link[{}] 翻译失败 lang={}: {}", i, lang, e.getMessage());
                        translated[i] = names[i];
                    }
                }
                saveFriendlyLinksContent(lang, translated);
            }
        } catch (Exception e) {
            log.warn("translateFriendlyLinksAsync 解析失败: {}", e.getMessage());
        }
    }

    /**
     * 从 content_translations 中读取各索引项，组装完整 JSON 数组并持久化（Job 完成后调用）
     */
    public void assembleAndSaveFriendlyLinksTranslation(String lang, int count) {
        String[] names = new String[count];
        for (int i = 0; i < count; i++) {
            ContentTranslation row = mapper.selectOne(
                new LambdaQueryWrapper<ContentTranslation>()
                    .eq(ContentTranslation::getEntityType, "site_config")
                    .eq(ContentTranslation::getEntityId, 0L)
                    .eq(ContentTranslation::getFieldName, "friendly_links#" + i)
                    .eq(ContentTranslation::getLang, lang)
                    .eq(ContentTranslation::getIsReviewed, STATUS_DONE)
            );
            names[i] = (row != null && row.getContent() != null) ? row.getContent() : "";
        }
        saveFriendlyLinksContent(lang, names);
    }

    private void saveFriendlyLinksContent(String lang, String[] names) {
        try {
            String assembled = objectMapper.writeValueAsString(names);
            ContentTranslation existing = mapper.selectOne(
                new LambdaQueryWrapper<ContentTranslation>()
                    .eq(ContentTranslation::getEntityType, "site_config")
                    .eq(ContentTranslation::getEntityId, 0L)
                    .eq(ContentTranslation::getFieldName, "friendly_links")
                    .eq(ContentTranslation::getLang, lang)
            );
            if (existing == null) {
                ContentTranslation row = new ContentTranslation();
                row.setEntityType("site_config");
                row.setEntityId(0L);
                row.setFieldName("friendly_links");
                row.setLang(lang);
                row.setContent(assembled);
                row.setIsReviewed(STATUS_DONE);
                mapper.insert(row);
            } else {
                mapper.update(null, new LambdaUpdateWrapper<ContentTranslation>()
                    .eq(ContentTranslation::getEntityType, "site_config")
                    .eq(ContentTranslation::getEntityId, 0L)
                    .eq(ContentTranslation::getFieldName, "friendly_links")
                    .eq(ContentTranslation::getLang, lang)
                    .set(ContentTranslation::getContent, assembled)
                    .set(ContentTranslation::getIsReviewed, STATUS_DONE)
                    .set(ContentTranslation::getErrorMsg, null)
                );
            }
        } catch (Exception e) {
            log.warn("saveFriendlyLinksContent lang={}: {}", lang, e.getMessage());
        }
    }

    public void deleteByEntity(String entityType, Long entityId) {
        mapper.delete(
            new LambdaQueryWrapper<ContentTranslation>()
                .eq(ContentTranslation::getEntityType, entityType)
                .eq(ContentTranslation::getEntityId, entityId)
        );
    }

    public List<ContentTranslation> listFailed() {
        return mapper.selectList(
            new LambdaQueryWrapper<ContentTranslation>()
                .eq(ContentTranslation::getIsReviewed, STATUS_FAILED)
                .orderByDesc(ContentTranslation::getUpdatedAt)
        );
    }

    public void retryFailed(Long id, String zhText) {
        ContentTranslation row = mapper.selectById(id);
        if (row == null || row.getIsReviewed() != STATUS_FAILED) return;
        machineTranslate(row.getEntityType(), row.getEntityId(),
            row.getFieldName(), row.getLang(), zhText);
    }

    public List<String> getTargetLangs() {
        SiteConfig cfg = siteConfigMapper.selectOne(
            new LambdaQueryWrapper<SiteConfig>()
                .eq(SiteConfig::getConfigKey, "translate_target_langs")
        );
        String raw = (cfg != null && cfg.getValueEn() != null) ? cfg.getValueEn() : "en";
        return List.of(raw.split(",")).stream()
            .map(String::trim)
            .filter(s -> !s.isBlank())
            .collect(Collectors.toList());
    }
}
