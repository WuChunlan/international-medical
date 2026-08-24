package com.intlmedical.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.intlmedical.entity.*;
import com.intlmedical.mapper.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class TranslationJobService {

    private final TranslationJobMapper jobMapper;
    private final TranslationJobItemMapper itemMapper;
    private final ContentTranslationService translationService;
    private final TranslationJobAsyncRunner asyncRunner;

    // mappers for loading entity zh-fields
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
    private final ObjectMapper objectMapper;

    /**
     * 创建全量翻译任务，立即返回，收集+翻译全部异步执行
     */
    public TranslationJob startJob(String lang) {
        TranslationJob job = new TranslationJob();
        job.setLang(lang);
        job.setStatus("running");
        job.setTotal(0);
        job.setDone(0);
        job.setFailed(0);
        jobMapper.insert(job);

        // collectItems 在当前线程执行完后，将结果传给异步 runner
        // 避免在 @Async 方法内部再做耗时 DB 查询导致的不可预期延迟
        List<TranslationJobItem> items = collectItems(lang);
        asyncRunner.collectAndRunAsync(job.getId(), lang, items);

        return job;
    }

    public void cancelJob(Long jobId) {
        jobMapper.update(null,
            new LambdaUpdateWrapper<TranslationJob>()
                .eq(TranslationJob::getId, jobId)
                .eq(TranslationJob::getStatus, "running")
                .set(TranslationJob::getStatus, "cancelled")
        );
    }

    public void retryItem(Long itemId) {
        TranslationJobItem item = itemMapper.selectById(itemId);
        if (item == null || !"failed".equals(item.getStatus())) return;

        TranslationJob job = jobMapper.selectById(item.getJobId());
        if (job == null) return;

        String zhText = loadZhText(item.getEntityType(), item.getEntityId(), item.getFieldName());
        if (zhText == null || zhText.isBlank()) {
            markItem(itemId, "done", null);
            return;
        }
        try {
            translationService.machineTranslate(
                item.getEntityType(), item.getEntityId(),
                item.getFieldName(), job.getLang(), zhText
            );
            markItem(itemId, "done", null);
            jobMapper.update(null,
                new LambdaUpdateWrapper<TranslationJob>()
                    .eq(TranslationJob::getId, item.getJobId())
                    .setSql("done = done + 1, failed = failed - 1")
            );
            if ("site_config".equals(item.getEntityType())
                    && item.getFieldName().startsWith("friendly_links#")) {
                var cfg = siteConfigMapper.selectOne(new LambdaQueryWrapper<SiteConfig>()
                    .eq(SiteConfig::getConfigKey, "friendly_links"));
                if (cfg != null && cfg.getValueZh() != null) {
                    try {
                        String[] names = objectMapper.readValue(cfg.getValueZh(), String[].class);
                        translationService.assembleAndSaveFriendlyLinksTranslation(job.getLang(), names.length);
                    } catch (Exception ignored) {}
                }
            }
        } catch (Exception e) {
            markItem(itemId, "failed", e.getMessage());
        }
    }

    public TranslationJob getJob(Long jobId) {
        return jobMapper.selectById(jobId);
    }

    public List<TranslationJob> listJobs(String lang) {
        return jobMapper.selectList(
            new LambdaQueryWrapper<TranslationJob>()
                .eq(lang != null, TranslationJob::getLang, lang)
                .orderByDesc(TranslationJob::getId)
        );
    }

    public List<TranslationJobItem> listItems(Long jobId, String status) {
        return itemMapper.selectList(
            new LambdaQueryWrapper<TranslationJobItem>()
                .eq(TranslationJobItem::getJobId, jobId)
                .eq(status != null, TranslationJobItem::getStatus, status)
                .orderByAsc(TranslationJobItem::getEntityType, TranslationJobItem::getEntityId)
        );
    }

    // ── helpers ────────────────────────────────────────────────────────────────

    private void markItem(Long id, String status, String error) {
        itemMapper.update(null,
            new LambdaUpdateWrapper<TranslationJobItem>()
                .eq(TranslationJobItem::getId, id)
                .set(TranslationJobItem::getStatus, status)
                .set(TranslationJobItem::getErrorMsg, error)
        );
    }

    private List<TranslationJobItem> collectItems(String lang) {
        List<TranslationJobItem> items = new ArrayList<>();

        UI_TEXT_ZH.forEach((key, zh) -> {
            TranslationJobItem item = new TranslationJobItem();
            item.setEntityType("ui_text");
            item.setEntityId(0L);
            item.setEntityLabel("UI:" + key);
            item.setFieldName(key);
            item.setStatus("pending");
            items.add(item);
        });

        hospitalMapper.selectList(null).forEach(h ->
            addItems(items, "hospital", h.getId(), h.getNameZh(),
                Map.of("name", h.getNameZh(), "intro", nvl(h.getIntroZh()), "address", nvl(h.getAddressZh())))
        );
        doctorMapper.selectList(null).forEach(d ->
            addItems(items, "doctor", d.getId(), d.getNameZh(),
                Map.of("name", nvl(d.getNameZh()), "title", nvl(d.getTitleZh()),
                       "specialty", nvl(d.getSpecialtyZh()), "bio", nvl(d.getBioZh())))
        );
        equipmentMapper.selectList(null).forEach(e ->
            addItems(items, "equipment", e.getId(), e.getNameZh(),
                Map.of("name", nvl(e.getNameZh()), "desc", nvl(e.getDescZh())))
        );
        environmentMapper.selectList(null).forEach(e ->
            addItems(items, "environment", e.getId(), e.getNameZh(),
                Map.of("name", nvl(e.getNameZh()), "desc", nvl(e.getDescZh())))
        );
        caseMapper.selectList(null).forEach(c ->
            addItems(items, "case", c.getId(), c.getTitleZh(),
                Map.of("title", nvl(c.getTitleZh()), "summary", nvl(c.getSummaryZh()),
                       "detail", nvl(c.getDetailZh())))
        );
        productMapper.selectList(null).forEach(p ->
            addItems(items, "product", p.getId(), p.getNameZh(),
                Map.of("name", nvl(p.getNameZh()), "summary", nvl(p.getSummaryZh()),
                       "detail", nvl(p.getDetailZh())))
        );
        variantMapper.selectList(null).forEach(v ->
            addItems(items, "variant", v.getId(), v.getNameZh(),
                Map.of("name", nvl(v.getNameZh()), "desc", nvl(v.getDescZh())))
        );
        serviceTeamMapper.selectList(null).forEach(s ->
            addItems(items, "service_team", s.getId(), s.getNameZh(),
                Map.of("name", nvl(s.getNameZh()), "intro", nvl(s.getIntroZh())))
        );
        serviceFeatureMapper.selectList(null).forEach(f ->
            addItems(items, "service_feature", f.getId(), f.getNameZh(),
                Map.of("name", nvl(f.getNameZh()), "intro", nvl(f.getIntroZh())))
        );

        siteConfigMapper.selectList(null).forEach(cfg -> {
            if (cfg.getValueZh() == null || cfg.getValueZh().isBlank()) return;
            if ("friendly_links".equals(cfg.getConfigKey())) {
                try {
                    String[] names = objectMapper.readValue(cfg.getValueZh(), String[].class);
                    for (int i = 0; i < names.length; i++) {
                        if (names[i] == null || names[i].isBlank()) continue;
                        TranslationJobItem item = new TranslationJobItem();
                        item.setEntityType("site_config");
                        item.setEntityId(0L);
                        item.setEntityLabel("config:friendly_links");
                        item.setFieldName("friendly_links#" + i);
                        item.setStatus("pending");
                        items.add(item);
                    }
                } catch (Exception e) {
                    // malformed JSON — skip
                }
            } else {
                TranslationJobItem item = new TranslationJobItem();
                item.setEntityType("site_config");
                item.setEntityId(0L);
                item.setEntityLabel("config:" + cfg.getConfigKey());
                item.setFieldName(cfg.getConfigKey());
                item.setStatus("pending");
                items.add(item);
            }
        });

        return items;
    }

    private void addItems(List<TranslationJobItem> items, String entityType, Long entityId,
                          String label, Map<String, String> fields) {
        fields.forEach((field, zh) -> {
            if (zh == null || zh.isBlank()) return;
            TranslationJobItem item = new TranslationJobItem();
            item.setEntityType(entityType);
            item.setEntityId(entityId);
            item.setEntityLabel(label);
            item.setFieldName(field);
            items.add(item);
        });
    }

    private String loadZhText(String entityType, Long entityId, String fieldName) {
        return switch (entityType) {
            case "ui_text" -> UI_TEXT_ZH.get(fieldName);
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
                if (fieldName.startsWith("friendly_links#")) {
                    int idx;
                    try { idx = Integer.parseInt(fieldName.substring("friendly_links#".length())); }
                    catch (NumberFormatException e) { yield null; }
                    var cfg = siteConfigMapper.selectOne(
                        new LambdaQueryWrapper<SiteConfig>()
                            .eq(SiteConfig::getConfigKey, "friendly_links")
                    );
                    if (cfg == null || cfg.getValueZh() == null) yield null;
                    try {
                        String[] names = objectMapper.readValue(cfg.getValueZh(), String[].class);
                        yield idx < names.length ? names[idx] : null;
                    } catch (Exception e) { yield null; }
                }
                var cfg = siteConfigMapper.selectOne(
                    new LambdaQueryWrapper<SiteConfig>()
                        .eq(SiteConfig::getConfigKey, fieldName)
                );
                yield cfg == null ? null : cfg.getValueZh();
            }
            default -> null;
        };
    }

    private static String nvl(String s) {
        return s == null ? "" : s;
    }

    // public so TranslationJobAsyncRunner can reference it
    public static final Map<String, String> UI_TEXT_ZH = new LinkedHashMap<>();
    static {
        UI_TEXT_ZH.put("nav.login", "登录");
        UI_TEXT_ZH.put("nav.register", "注册");
        UI_TEXT_ZH.put("nav.logout", "退出登录");
        UI_TEXT_ZH.put("nav.profile", "个人中心");
        UI_TEXT_ZH.put("nav.hospitals", "中国顶尖医院");
        UI_TEXT_ZH.put("nav.equipment", "高端医疗设备");
        UI_TEXT_ZH.put("nav.service_teams", "专业服务团队");
        UI_TEXT_ZH.put("nav.cases", "过往成功案例");
        UI_TEXT_ZH.put("nav.home", "首页");
        UI_TEXT_ZH.put("nav.doctors", "专业医护人员");
        UI_TEXT_ZH.put("nav.service_features", "省心品质服务");
        UI_TEXT_ZH.put("nav.products", "特需治疗");
        UI_TEXT_ZH.put("nav.hd_intro", "医院简介");
        UI_TEXT_ZH.put("nav.hd_equipment", "高端医疗设备");
        UI_TEXT_ZH.put("nav.hd_environment", "舒适诊疗环境");
        UI_TEXT_ZH.put("nav.hd_doctors", "专业医护团队");
        UI_TEXT_ZH.put("nav.pd_intro", "产品简介");
        UI_TEXT_ZH.put("nav.pd_detail", "产品详情");
        UI_TEXT_ZH.put("nav.pd_variants", "套餐选择");
        UI_TEXT_ZH.put("hero.title", "国际医疗共享平台");
        UI_TEXT_ZH.put("hero.subtitle_fallback", "国际医疗项目致力于为全球患者提供高品质的中国医疗服务，汇聚国内顶尖医院与专家资源，为您的健康保驾护航。");
        UI_TEXT_ZH.put("hero.scroll_hint", "向下探索");
        UI_TEXT_ZH.put("tabs.professional", "专科治疗");
        UI_TEXT_ZH.put("tabs.special", "特需门诊");
        UI_TEXT_ZH.put("tabs.professional_desc", "汇聚国内顶尖医院与专家资源，为您提供专业、精准的医疗诊治服务，涵盖肿瘤、心血管、神经外科等多个专科领域。");
        UI_TEXT_ZH.put("tabs.special_desc", "为有特殊需求的患者提供定制化医疗方案，包括高端体检、慢病管理、康复疗养及特需产品等一站式服务。");
        UI_TEXT_ZH.put("tabs.professional_tag", "专科诊疗");
        UI_TEXT_ZH.put("tabs.special_tag", "定制服务");
        UI_TEXT_ZH.put("hospitals.section_title", "中国顶尖医院");
        UI_TEXT_ZH.put("hospitals.view_more", "了解更多");
        UI_TEXT_ZH.put("hospitals.no_data", "暂无医院信息");
        UI_TEXT_ZH.put("equipment.section_title", "高端医疗设备");
        UI_TEXT_ZH.put("equipment.no_data", "暂无设备信息");
        UI_TEXT_ZH.put("equipment.view_hospital", "查看所属医院");
        UI_TEXT_ZH.put("service_teams.section_title", "专业服务团队");
        UI_TEXT_ZH.put("service_teams.no_data", "暂无服务团队信息");
        UI_TEXT_ZH.put("doctors.section_title", "专业医护人员");
        UI_TEXT_ZH.put("doctors.no_data", "暂无医护人员信息");
        UI_TEXT_ZH.put("service_features.section_title", "省心品质服务");
        UI_TEXT_ZH.put("service_features.no_data", "暂无服务信息");
        UI_TEXT_ZH.put("cases.section_title", "过往成功案例");
        UI_TEXT_ZH.put("cases.view_detail", "查看详情");
        UI_TEXT_ZH.put("cases.no_data", "暂无案例信息");
        UI_TEXT_ZH.put("cases.detail_title", "案例详情");
        UI_TEXT_ZH.put("cases.redirecting", "即将返回首页...");
        UI_TEXT_ZH.put("products.section_title", "特需门诊");
        UI_TEXT_ZH.put("products.view_detail", "查看详情");
        UI_TEXT_ZH.put("products.price_range", "参考价格");
        UI_TEXT_ZH.put("products.price_unit", "元");
        UI_TEXT_ZH.put("products.no_data", "暂无产品信息");
        UI_TEXT_ZH.put("products.consult", "立即咨询");
        UI_TEXT_ZH.put("product.title", "产品详情");
        UI_TEXT_ZH.put("product.variants", "套餐选择");
        UI_TEXT_ZH.put("product.book", "立即预约");
        UI_TEXT_ZH.put("product.variant_name", "套餐名称");
        UI_TEXT_ZH.put("product.variant_desc", "描述");
        UI_TEXT_ZH.put("product.variant_action", "操作");
        UI_TEXT_ZH.put("hospital.doctors", "专业医护团队");
        UI_TEXT_ZH.put("hospital.book", "预约咨询");
        UI_TEXT_ZH.put("hospital.equipment_title", "高端医疗设备");
        UI_TEXT_ZH.put("hospital.environment_title", "舒适诊疗环境");
        UI_TEXT_ZH.put("booking.title", "预约咨询");
        UI_TEXT_ZH.put("booking.close", "关闭");
        UI_TEXT_ZH.put("booking.contact_person", "联系人");
        UI_TEXT_ZH.put("booking.contact_phone", "联系电话");
        UI_TEXT_ZH.put("booking.no_contact", "暂无联系方式");
        UI_TEXT_ZH.put("profile.title", "个人中心");
        UI_TEXT_ZH.put("profile.history", "浏览记录");
        UI_TEXT_ZH.put("profile.hospital_record", "医院");
        UI_TEXT_ZH.put("profile.product_record", "产品");
        UI_TEXT_ZH.put("profile.view_again", "再次查看");
        UI_TEXT_ZH.put("profile.no_history", "暂无浏览记录");
        UI_TEXT_ZH.put("footer.tagline", "为全球患者提供高品质中国医疗服务");
        UI_TEXT_ZH.put("footer.copyright", "© 2024 国际医疗项目. 保留所有权利。");
        UI_TEXT_ZH.put("footer.contact_cta", "合作请联系");
        UI_TEXT_ZH.put("footer.contact_title", "联系我们");
        UI_TEXT_ZH.put("footer.contact_person", "联系人");
        UI_TEXT_ZH.put("footer.contact_phone", "电话");
        UI_TEXT_ZH.put("footer.contact_none", "暂无联系方式");
        UI_TEXT_ZH.put("cta.eyebrow", "开启您的旅程");
        UI_TEXT_ZH.put("cta.title", "让优质中国医疗触手可及");
        UI_TEXT_ZH.put("cta.subtitle", "专业医疗团队全程陪同，一对一定制服务，从预约挂号到康复随访，我们为您提供无忧的国际就医体验。");
        UI_TEXT_ZH.put("cta.primary", "立即预约咨询");
        UI_TEXT_ZH.put("cta.secondary", "了解合作医院");
        UI_TEXT_ZH.put("cta.trust_247", "全天候服务");
        UI_TEXT_ZH.put("cta.trust_privacy", "隐私保护");
        UI_TEXT_ZH.put("cta.trust_free_value", "免费");
        UI_TEXT_ZH.put("cta.trust_free", "初步咨询");
        UI_TEXT_ZH.put("sco.partner_hospitals", "合作顶尖医院");
        UI_TEXT_ZH.put("sco.expert_specialists", "权威专家团队");
        UI_TEXT_ZH.put("sco.patients_served", "成功服务患者");
        UI_TEXT_ZH.put("sco.countries_covered", "覆盖国家地区");
        UI_TEXT_ZH.put("auth.login_title", "登录");
        UI_TEXT_ZH.put("auth.register_title", "注册账号");
        UI_TEXT_ZH.put("auth.email", "邮箱");
        UI_TEXT_ZH.put("auth.password", "密码");
        UI_TEXT_ZH.put("auth.last_name", "姓");
        UI_TEXT_ZH.put("auth.first_name", "名");
        UI_TEXT_ZH.put("auth.submit_login", "登录");
        UI_TEXT_ZH.put("auth.submit_register", "注册");
        UI_TEXT_ZH.put("auth.switch_login", "已有账号？");
        UI_TEXT_ZH.put("auth.switch_register", "还没有账号？");
        UI_TEXT_ZH.put("common.loading", "加载中...");
        UI_TEXT_ZH.put("common.error", "加载失败，请稍后重试");
        UI_TEXT_ZH.put("common.read_more", "阅读更多");
        UI_TEXT_ZH.put("common.not_found", "案例不存在");
        UI_TEXT_ZH.put("common.back", "返回");
    }
}
