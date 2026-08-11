package com.intlmedical.controller;

import com.intlmedical.entity.SiteConfig;
import com.intlmedical.service.ContentTranslationService;
import com.intlmedical.service.SiteConfigService;
import com.intlmedical.util.Result;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 公开接口：为 frontend-site-a 提供多语言 UI 文本。
 * - zh/en 直接从 site_config 读取已有的 valueZh/valueEn 字段，
 *   结合内置静态翻译返回完整 bundle。
 * - 其他语种从 content_translation 表读取 entity_type=site_config 的翻译内容。
 */
@RestController
@RequestMapping("/api/i18n")
@RequiredArgsConstructor
public class I18nController {

    private final SiteConfigService siteConfigService;
    private final ContentTranslationService translationService;

    private static final List<String> BUILTIN_LANGS = List.of("zh", "en");

    @GetMapping("/{lang}")
    public Result<Map<String, String>> getBundle(@PathVariable String lang) {
        // start with built-in zh keys as fallback
        Map<String, String> bundle = new LinkedHashMap<>(ZH_BUNDLE);

        if ("en".equals(lang)) {
            bundle.putAll(EN_BUNDLE);
            // override with admin-customized site_config values if present
            applyConfigOverrides(bundle, "en");
        } else if ("zh".equals(lang)) {
            applyConfigOverrides(bundle, "zh");
        } else {
            // 3rd language: start from zh, then apply translations from content_translation
            Map<String, String> translations = translationService.getAll("ui_text", 0L, lang);
            if (translations != null && !translations.isEmpty()) {
                bundle.putAll(translations);
            }
        }
        return Result.ok(bundle);
    }

    private void applyConfigOverrides(Map<String, String> bundle, String lang) {
        List<SiteConfig> configs = siteConfigService.getAll();
        boolean isZh = "zh".equals(lang);
        for (SiteConfig cfg : configs) {
            String key = cfg.getConfigKey();
            if (key == null) continue;
            String val = isZh ? cfg.getValueZh() : cfg.getValueEn();
            if (val != null && !val.isBlank()) {
                bundle.put(key, val);
            }
        }
    }

    // ── Static zh bundle ───────────────────────────────────────────────────────
    private static final Map<String, String> ZH_BUNDLE = Map.ofEntries(
        Map.entry("nav.login", "登录"),
        Map.entry("nav.register", "注册"),
        Map.entry("nav.logout", "退出登录"),
        Map.entry("nav.profile", "个人中心"),
        Map.entry("nav.hospitals", "中国顶尖医院"),
        Map.entry("nav.equipment", "高端医疗设备"),
        Map.entry("nav.service_teams", "专业服务团队"),
        Map.entry("nav.cases", "过往成功案例"),
        Map.entry("nav.home", "首页"),
        Map.entry("nav.doctors", "专业医护人员"),
        Map.entry("nav.service_features", "省心品质服务"),
        Map.entry("nav.products", "特需治疗"),
        Map.entry("nav.hd_intro", "医院简介"),
        Map.entry("nav.hd_equipment", "高端医疗设备"),
        Map.entry("nav.hd_environment", "舒适诊疗环境"),
        Map.entry("nav.hd_doctors", "专业医护团队"),
        Map.entry("nav.pd_intro", "产品简介"),
        Map.entry("nav.pd_detail", "产品详情"),
        Map.entry("nav.pd_variants", "套餐选择"),
        Map.entry("hero.title", "国际医疗共享平台"),
        Map.entry("hero.subtitle_fallback", "国际医疗项目致力于为全球患者提供高品质的中国医疗服务，汇聚国内顶尖医院与专家资源，为您的健康保驾护航。"),
        Map.entry("hero.scroll_hint", "向下探索"),
        Map.entry("tabs.professional", "专科治疗"),
        Map.entry("tabs.special", "特需门诊"),
        Map.entry("tabs.professional_desc", "汇聚国内顶尖医院与专家资源，为您提供专业、精准的医疗诊治服务，涵盖肿瘤、心血管、神经外科等多个专科领域。"),
        Map.entry("tabs.special_desc", "为有特殊需求的患者提供定制化医疗方案，包括高端体检、慢病管理、康复疗养及特需产品等一站式服务。"),
        Map.entry("hospitals.section_title", "中国顶尖医院"),
        Map.entry("hospitals.section_subtitle", "Top Hospitals in China"),
        Map.entry("hospitals.view_more", "了解更多"),
        Map.entry("hospitals.no_data", "暂无医院信息"),
        Map.entry("equipment.section_title", "高端医疗设备"),
        Map.entry("equipment.section_subtitle", "Premium Medical Equipment"),
        Map.entry("equipment.no_data", "暂无设备信息"),
        Map.entry("equipment.view_hospital", "查看所属医院"),
        Map.entry("service_teams.section_title", "专业服务团队"),
        Map.entry("service_teams.section_subtitle", "Professional Service Teams"),
        Map.entry("service_teams.no_data", "暂无服务团队信息"),
        Map.entry("doctors.section_title", "专业医护人员"),
        Map.entry("doctors.section_subtitle", "Professional Medical Staff"),
        Map.entry("doctors.no_data", "暂无医护人员信息"),
        Map.entry("service_features.section_title", "省心品质服务"),
        Map.entry("service_features.section_subtitle", "Quality Care Services"),
        Map.entry("service_features.no_data", "暂无服务信息"),
        Map.entry("cases.section_title", "过往成功案例"),
        Map.entry("cases.section_subtitle", "Past Success Cases"),
        Map.entry("cases.view_detail", "查看详情"),
        Map.entry("cases.no_data", "暂无案例信息"),
        Map.entry("products.section_title", "特需门诊"),
        Map.entry("products.section_subtitle", "Special Needs Treatment"),
        Map.entry("products.view_detail", "查看详情"),
        Map.entry("products.price_range", "参考价格"),
        Map.entry("products.price_unit", "元"),
        Map.entry("products.no_data", "暂无产品信息"),
        Map.entry("products.consult", "立即咨询"),
        Map.entry("product.title", "产品详情"),
        Map.entry("product.variants", "套餐选择"),
        Map.entry("product.book", "立即预约"),
        Map.entry("hospital.doctors", "专业医护团队"),
        Map.entry("hospital.book", "预约咨询"),
        Map.entry("booking.title", "预约咨询"),
        Map.entry("booking.message", "联系人：{{person}}，联系方式：{{info}}"),
        Map.entry("booking.close", "关闭"),
        Map.entry("profile.title", "个人中心"),
        Map.entry("profile.history", "浏览记录"),
        Map.entry("profile.hospital_record", "医院"),
        Map.entry("profile.product_record", "产品"),
        Map.entry("profile.view_again", "再次查看"),
        Map.entry("auth.login_title", "登录"),
        Map.entry("auth.register_title", "注册账号"),
        Map.entry("auth.email", "邮箱"),
        Map.entry("auth.password", "密码"),
        Map.entry("auth.last_name", "姓"),
        Map.entry("auth.first_name", "名"),
        Map.entry("auth.submit_login", "登录"),
        Map.entry("auth.submit_register", "注册"),
        Map.entry("auth.switch_login", "已有账号？"),
        Map.entry("auth.switch_register", "还没有账号？"),
        Map.entry("footer.copyright", "© 2024 国际医疗项目. 保留所有权利。"),
        Map.entry("footer.tagline", "为全球患者提供高品质中国医疗服务"),
        Map.entry("common.loading", "加载中..."),
        Map.entry("common.error", "加载失败，请稍后重试"),
        Map.entry("common.read_more", "阅读更多"),
        Map.entry("common.not_found", "案例不存在"),
        Map.entry("common.back", "返回"),
        Map.entry("cases.detail_title", "案例详情"),
        Map.entry("cases.redirecting", "即将返回首页..."),
        Map.entry("tabs.professional_tag", "专科诊疗"),
        Map.entry("tabs.special_tag", "定制服务"),
        Map.entry("cta.eyebrow", "开启您的旅程"),
        Map.entry("cta.title", "让优质中国医疗\n触手可及"),
        Map.entry("cta.subtitle", "专业医疗团队全程陪同，一对一定制服务，从预约挂号到康复随访，我们为您提供无忧的国际就医体验。"),
        Map.entry("cta.primary", "立即预约咨询"),
        Map.entry("cta.secondary", "了解合作医院"),
        Map.entry("cta.trust_247", "全天候服务"),
        Map.entry("cta.trust_privacy", "隐私保护"),
        Map.entry("cta.trust_free_value", "免费"),
        Map.entry("cta.trust_free", "初步咨询"),
        Map.entry("sco.partner_hospitals", "合作顶尖医院"),
        Map.entry("sco.expert_specialists", "权威专家团队"),
        Map.entry("sco.patients_served", "成功服务患者"),
        Map.entry("sco.countries_covered", "覆盖国家地区"),
        Map.entry("footer.contact_cta", "合作请联系"),
        Map.entry("footer.contact_title", "联系我们"),
        Map.entry("footer.contact_person", "联系人"),
        Map.entry("footer.contact_phone", "电话"),
        Map.entry("footer.contact_none", "暂无联系方式"),
        Map.entry("booking.contact_person", "联系人"),
        Map.entry("booking.contact_phone", "联系电话"),
        Map.entry("booking.no_contact", "暂无联系方式"),
        Map.entry("product.variant_name", "套餐名称"),
        Map.entry("product.variant_desc", "描述"),
        Map.entry("product.variant_action", "操作"),
        Map.entry("hospital.equipment_title", "高端医疗设备"),
        Map.entry("hospital.environment_title", "舒适诊疗环境"),
        Map.entry("profile.no_history", "暂无浏览记录")
    );

    // ── Static en bundle ───────────────────────────────────────────────────────
    private static final Map<String, String> EN_BUNDLE = Map.ofEntries(
        Map.entry("nav.login", "Login"),
        Map.entry("nav.register", "Register"),
        Map.entry("nav.logout", "Logout"),
        Map.entry("nav.profile", "My Profile"),
        Map.entry("nav.hospitals", "Top Hospitals in China"),
        Map.entry("nav.equipment", "Premium Equipment"),
        Map.entry("nav.service_teams", "Service Teams"),
        Map.entry("nav.cases", "Past Success Cases"),
        Map.entry("nav.home", "Home"),
        Map.entry("nav.doctors", "Medical Staff"),
        Map.entry("nav.service_features", "Quality Services"),
        Map.entry("nav.products", "Special Care"),
        Map.entry("nav.hd_intro", "Hospital Overview"),
        Map.entry("nav.hd_equipment", "Premium Equipment"),
        Map.entry("nav.hd_environment", "Treatment Environment"),
        Map.entry("nav.hd_doctors", "Medical Team"),
        Map.entry("nav.pd_intro", "Overview"),
        Map.entry("nav.pd_detail", "Details"),
        Map.entry("nav.pd_variants", "Packages"),
        Map.entry("hero.title", "International Medical"),
        Map.entry("hero.subtitle_fallback", "The International Medical Program is dedicated to providing high-quality Chinese medical services to patients worldwide, bringing together top hospitals and expert resources in China."),
        Map.entry("hero.scroll_hint", "Explore"),
        Map.entry("tabs.professional", "Professional Treatment"),
        Map.entry("tabs.special", "Special Needs Treatment"),
        Map.entry("tabs.professional_desc", "Bringing together top hospitals and expert resources in China, providing professional and precise medical diagnosis and treatment services, covering oncology, cardiovascular, neurosurgery and many other specialties."),
        Map.entry("tabs.special_desc", "Providing customized medical solutions for patients with special needs, including premium health check-ups, chronic disease management, rehabilitation care and special needs products — all in one place."),
        Map.entry("hospitals.section_title", "Top Hospitals in China"),
        Map.entry("hospitals.section_subtitle", "中国顶尖医院"),
        Map.entry("hospitals.view_more", "Learn More"),
        Map.entry("hospitals.no_data", "No hospital information available"),
        Map.entry("equipment.section_title", "Premium Medical Equipment"),
        Map.entry("equipment.section_subtitle", "高端医疗设备"),
        Map.entry("equipment.no_data", "No equipment information available"),
        Map.entry("equipment.view_hospital", "View Hospital"),
        Map.entry("service_teams.section_title", "Professional Service Teams"),
        Map.entry("service_teams.section_subtitle", "专业服务团队"),
        Map.entry("service_teams.no_data", "No service team information available"),
        Map.entry("doctors.section_title", "Professional Medical Staff"),
        Map.entry("doctors.section_subtitle", "专业医护人员"),
        Map.entry("doctors.no_data", "No medical staff available"),
        Map.entry("service_features.section_title", "Quality Care Services"),
        Map.entry("service_features.section_subtitle", "省心品质服务"),
        Map.entry("service_features.no_data", "No services available"),
        Map.entry("cases.section_title", "Past Success Cases"),
        Map.entry("cases.section_subtitle", "过往成功案例"),
        Map.entry("cases.view_detail", "View Details"),
        Map.entry("cases.no_data", "No case information available"),
        Map.entry("products.section_title", "Special Needs Treatment"),
        Map.entry("products.section_subtitle", "特需门诊"),
        Map.entry("products.view_detail", "View Details"),
        Map.entry("products.price_range", "Reference Price"),
        Map.entry("products.price_unit", "CNY"),
        Map.entry("products.no_data", "No product information available"),
        Map.entry("products.consult", "Consult Now"),
        Map.entry("product.title", "Product Details"),
        Map.entry("product.variants", "Package Options"),
        Map.entry("product.book", "Book Now"),
        Map.entry("hospital.doctors", "Medical Team"),
        Map.entry("hospital.book", "Book Consultation"),
        Map.entry("booking.title", "Book Consultation"),
        Map.entry("booking.message", "Contact: {{person}}, Info: {{info}}"),
        Map.entry("booking.close", "Close"),
        Map.entry("profile.title", "My Profile"),
        Map.entry("profile.history", "Browse History"),
        Map.entry("profile.hospital_record", "Hospital"),
        Map.entry("profile.product_record", "Product"),
        Map.entry("profile.view_again", "View Again"),
        Map.entry("auth.login_title", "Login"),
        Map.entry("auth.register_title", "Create Account"),
        Map.entry("auth.email", "Email"),
        Map.entry("auth.password", "Password"),
        Map.entry("auth.last_name", "Last Name"),
        Map.entry("auth.first_name", "First Name"),
        Map.entry("auth.submit_login", "Login"),
        Map.entry("auth.submit_register", "Register"),
        Map.entry("auth.switch_login", "Already have an account?"),
        Map.entry("auth.switch_register", "Don't have an account?"),
        Map.entry("footer.copyright", "© 2024 International Medical Program. All rights reserved."),
        Map.entry("footer.tagline", "Providing world-class Chinese medical services to global patients"),
        Map.entry("common.loading", "Loading..."),
        Map.entry("common.error", "Failed to load, please try again later"),
        Map.entry("common.read_more", "Read More"),
        Map.entry("common.not_found", "Case not found"),
        Map.entry("common.back", "Back"),
        Map.entry("cases.detail_title", "Case Detail"),
        Map.entry("cases.redirecting", "Redirecting to home..."),
        Map.entry("tabs.professional_tag", "Specialist Care"),
        Map.entry("tabs.special_tag", "Custom Service"),
        Map.entry("cta.eyebrow", "Begin Your Journey"),
        Map.entry("cta.title", "China's Finest Medical\nExpertise, Within Reach"),
        Map.entry("cta.subtitle", "Our dedicated team provides end-to-end personalised care — from appointment booking to post-treatment follow-up — ensuring a seamless international medical experience."),
        Map.entry("cta.primary", "Book a Consultation"),
        Map.entry("cta.secondary", "Explore Hospitals"),
        Map.entry("cta.trust_247", "Support"),
        Map.entry("cta.trust_privacy", "Confidential"),
        Map.entry("cta.trust_free_value", "Free"),
        Map.entry("cta.trust_free", "Initial Consult"),
        Map.entry("sco.partner_hospitals", "Partner Hospitals"),
        Map.entry("sco.expert_specialists", "Expert Specialists"),
        Map.entry("sco.patients_served", "Patients Served"),
        Map.entry("sco.countries_covered", "Countries Covered"),
        Map.entry("footer.contact_cta", "Contact Us"),
        Map.entry("footer.contact_title", "Contact Us"),
        Map.entry("footer.contact_person", "Contact"),
        Map.entry("footer.contact_phone", "Phone"),
        Map.entry("footer.contact_none", "No contact info available"),
        Map.entry("booking.contact_person", "Contact"),
        Map.entry("booking.contact_phone", "Phone"),
        Map.entry("booking.no_contact", "No contact info available"),
        Map.entry("product.variant_name", "Package"),
        Map.entry("product.variant_desc", "Description"),
        Map.entry("product.variant_action", "Action"),
        Map.entry("hospital.equipment_title", "Premium Medical Equipment"),
        Map.entry("hospital.environment_title", "Comfortable Treatment Environment"),
        Map.entry("profile.no_history", "No browse history yet")
    );
}
