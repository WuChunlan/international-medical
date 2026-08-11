package com.intlmedical.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.intlmedical.entity.ContentTranslation;
import com.intlmedical.mapper.ContentTranslationMapper;
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

    /** is_reviewed 状态常量 */
    public static final int STATUS_PENDING = 0; // 待翻译
    public static final int STATUS_DONE    = 1; // 已翻译（直接展示）
    public static final int STATUS_FAILED  = 2; // 翻译失败

    private final ContentTranslationMapper mapper;
    private final TranslateService translateService;
    private final SiteConfigService siteConfigService;

    /**
     * 查询已翻译的内容（is_reviewed=1 才返回，否则 null）
     * frontend-site-a 只读此结果
     */
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

    /**
     * 批量查询某实体所有字段的已翻译内容
     */
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

    /**
     * 机器翻译一条记录并直接写入 content，成功→1，失败→2
     * 原文更新时保留旧翻译（status 临时回到 0），翻译完成后直接覆盖
     */
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
            translated = row != null ? row.getContent() : null; // keep old content on failure
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
            // on success, overwrite content; on failure, keep old content intact
            if (status == STATUS_DONE) {
                update.set(ContentTranslation::getContent, translated);
            }
            mapper.update(null, update);
        }
    }

    /**
     * 异步触发翻译（Admin/审核流保存后非阻塞调用）
     */
    @Async
    public void autoTranslateEntityAsync(String entityType, Long entityId, Map<String, String> zhFields) {
        autoTranslateEntity(entityType, entityId, zhFields);
    }

    /**
     * 批量机器翻译某实体所有字段到所有目标语种（审核通过或 Admin 保存后调用）
     */
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
     * 删除某实体的所有翻译（实体删除时调用）
     */
    public void deleteByEntity(String entityType, Long entityId) {
        mapper.delete(
            new LambdaQueryWrapper<ContentTranslation>()
                .eq(ContentTranslation::getEntityType, entityType)
                .eq(ContentTranslation::getEntityId, entityId)
        );
    }

    /**
     * 查询所有翻译失败的记录（Admin 全局失败列表用）
     */
    public List<ContentTranslation> listFailed() {
        return mapper.selectList(
            new LambdaQueryWrapper<ContentTranslation>()
                .eq(ContentTranslation::getIsReviewed, STATUS_FAILED)
                .orderByDesc(ContentTranslation::getUpdatedAt)
        );
    }

    /**
     * 重试单条失败记录（需要传入对应的中文原文）
     */
    public void retryFailed(Long id, String zhText) {
        ContentTranslation row = mapper.selectById(id);
        if (row == null || row.getIsReviewed() != STATUS_FAILED) return;
        machineTranslate(row.getEntityType(), row.getEntityId(),
            row.getFieldName(), row.getLang(), zhText);
    }

    public List<String> getTargetLangs() {
        var cfg = siteConfigService.getByKey("translate_target_langs");
        String raw = (cfg != null && cfg.getValueEn() != null) ? cfg.getValueEn() : "en";
        return List.of(raw.split(",")).stream()
            .map(String::trim)
            .filter(s -> !s.isBlank())
            .collect(Collectors.toList());
    }
}
