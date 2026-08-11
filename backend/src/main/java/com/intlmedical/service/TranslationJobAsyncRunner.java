package com.intlmedical.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.intlmedical.entity.*;
import com.intlmedical.mapper.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * Holds @Async methods for translation jobs.
 * Must be a separate Spring bean so @Async proxy is applied on invocation.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TranslationJobAsyncRunner {

    private final TranslationJobMapper jobMapper;
    private final TranslationJobItemMapper itemMapper;
    private final ContentTranslationService translationService;

    private final HospitalMapper hospitalMapper;
    private final DoctorMapper doctorMapper;
    private final EquipmentMapper equipmentMapper;
    private final HospitalEnvironmentMapper environmentMapper;
    private final CaseMapper caseMapper;
    private final SpecialProductMapper productMapper;
    private final ProductVariantMapper variantMapper;
    private final ServiceTeamMapper serviceTeamMapper;
    private final ServiceFeatureMapper serviceFeatureMapper;
    private final SiteConfigMapper siteConfigMapper;

    @Async
    public void collectAndRunAsync(Long jobId, String lang,
                                   List<TranslationJobItem> items) {
        TranslationJob job = jobMapper.selectById(jobId);
        if (job == null) return;

        job.setTotal(items.size());
        jobMapper.updateById(job);

        for (TranslationJobItem item : items) {
            item.setJobId(jobId);
            item.setStatus("pending");
        }
        if (!items.isEmpty()) {
            for (int i = 0; i < items.size(); i += 200) {
                List<TranslationJobItem> batch =
                    items.subList(i, Math.min(i + 200, items.size()));
                batch.forEach(itemMapper::insert);
            }
        }

        runJob(jobId);
    }

    private void runJob(Long jobId) {
        TranslationJob job = jobMapper.selectById(jobId);
        if (job == null) return;

        List<TranslationJobItem> items = itemMapper.selectList(
            new LambdaQueryWrapper<TranslationJobItem>()
                .eq(TranslationJobItem::getJobId, jobId)
                .eq(TranslationJobItem::getStatus, "pending")
        );

        for (TranslationJobItem item : items) {
            TranslationJob current = jobMapper.selectById(jobId);
            if (current == null || "cancelled".equals(current.getStatus())) {
                log.info("翻译任务 {} 已取消，停止执行", jobId);
                return;
            }

            String zhText = loadZhText(item.getEntityType(), item.getEntityId(),
                                       item.getFieldName(), job.getLang());
            if (zhText == null || zhText.isBlank()) {
                markItem(item.getId(), "done", null);
                incrementDone(jobId);
                continue;
            }

            try {
                translationService.machineTranslate(
                    item.getEntityType(), item.getEntityId(),
                    item.getFieldName(), job.getLang(), zhText
                );
                markItem(item.getId(), "done", null);
                incrementDone(jobId);
            } catch (Exception e) {
                log.warn("任务 {} item {} 翻译失败: {}", jobId, item.getId(), e.getMessage());
                markItem(item.getId(), "failed", e.getMessage());
                incrementFailed(jobId);
            }
        }

        TranslationJob finalState = jobMapper.selectById(jobId);
        if (finalState != null && "running".equals(finalState.getStatus())) {
            jobMapper.update(null,
                new LambdaUpdateWrapper<TranslationJob>()
                    .eq(TranslationJob::getId, jobId)
                    .set(TranslationJob::getStatus, "done")
            );
        }
    }

    private String loadZhText(String entityType, Long entityId, String fieldName, String lang) {
        return switch (entityType) {
            case "ui_text" -> TranslationJobService.UI_TEXT_ZH.get(fieldName);
            case "hospital" -> {
                var h = hospitalMapper.selectById(entityId);
                yield h == null ? null : switch (fieldName) {
                    case "name"    -> h.getNameZh();
                    case "intro"   -> h.getIntroZh();
                    case "address" -> h.getAddressZh();
                    default -> null;
                };
            }
            case "doctor" -> {
                var d = doctorMapper.selectById(entityId);
                yield d == null ? null : switch (fieldName) {
                    case "name"      -> d.getNameZh();
                    case "title"     -> d.getTitleZh();
                    case "specialty" -> d.getSpecialtyZh();
                    case "bio"       -> d.getBioZh();
                    default -> null;
                };
            }
            case "equipment" -> {
                var e = equipmentMapper.selectById(entityId);
                yield e == null ? null : switch (fieldName) {
                    case "name" -> e.getNameZh();
                    case "desc" -> e.getDescZh();
                    default -> null;
                };
            }
            case "environment" -> {
                var e = environmentMapper.selectById(entityId);
                yield e == null ? null : switch (fieldName) {
                    case "name" -> e.getNameZh();
                    case "desc" -> e.getDescZh();
                    default -> null;
                };
            }
            case "case" -> {
                var c = caseMapper.selectById(entityId);
                yield c == null ? null : switch (fieldName) {
                    case "title"   -> c.getTitleZh();
                    case "summary" -> c.getSummaryZh();
                    case "detail"  -> c.getDetailZh();
                    default -> null;
                };
            }
            case "product" -> {
                var p = productMapper.selectById(entityId);
                yield p == null ? null : switch (fieldName) {
                    case "name"    -> p.getNameZh();
                    case "summary" -> p.getSummaryZh();
                    case "detail"  -> p.getDetailZh();
                    default -> null;
                };
            }
            case "variant" -> {
                var v = variantMapper.selectById(entityId);
                yield v == null ? null : switch (fieldName) {
                    case "name" -> v.getNameZh();
                    case "desc" -> v.getDescZh();
                    default -> null;
                };
            }
            case "service_team" -> {
                var s = serviceTeamMapper.selectById(entityId);
                yield s == null ? null : switch (fieldName) {
                    case "name"  -> s.getNameZh();
                    case "intro" -> s.getIntroZh();
                    default -> null;
                };
            }
            case "service_feature" -> {
                var f = serviceFeatureMapper.selectById(entityId);
                yield f == null ? null : switch (fieldName) {
                    case "name"  -> f.getNameZh();
                    case "intro" -> f.getIntroZh();
                    default -> null;
                };
            }
            case "site_config" -> {
                var cfg = siteConfigMapper.selectOne(
                    new LambdaQueryWrapper<SiteConfig>()
                        .eq(SiteConfig::getConfigKey, fieldName)
                );
                yield cfg == null ? null : cfg.getValueZh();
            }
            default -> null;
        };
    }

    private void markItem(Long id, String status, String error) {
        itemMapper.update(null,
            new LambdaUpdateWrapper<TranslationJobItem>()
                .eq(TranslationJobItem::getId, id)
                .set(TranslationJobItem::getStatus, status)
                .set(TranslationJobItem::getErrorMsg, error)
        );
    }

    private void incrementDone(Long jobId) {
        jobMapper.update(null,
            new LambdaUpdateWrapper<TranslationJob>()
                .eq(TranslationJob::getId, jobId)
                .setSql("done = done + 1")
        );
    }

    private void incrementFailed(Long jobId) {
        jobMapper.update(null,
            new LambdaUpdateWrapper<TranslationJob>()
                .eq(TranslationJob::getId, jobId)
                .setSql("failed = failed + 1")
        );
    }
}
