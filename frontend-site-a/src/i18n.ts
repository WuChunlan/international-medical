import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  zh: {
    translation: {
      nav: {
        language: 'English',
        logo: '国际医疗共享平台 · International Medical',
        login: '登录',
        register: '注册',
        profile: '个人中心',
        logout: '退出登录',
        home: '首页',
        hospitals: '中国顶尖医院',
        equipment: '高端医疗设备',
        service_teams: '专业服务团队',
        cases: '过往成功案例',
        doctors: '专业医护人员',
        service_features: '省心品质服务',
        products: '特需治疗',
        hd_intro: '医院简介',
        hd_equipment: '高端医疗设备',
        hd_environment: '舒适诊疗环境',
        hd_doctors: '专业医护团队',
        pd_intro: '产品简介',
        pd_detail: '产品详情',
        pd_variants: '套餐选择',
      },
      hero: {
        title: '国际医疗共享平台',
        subtitle_fallback: '国际医疗项目致力于为全球患者提供高品质的中国医疗服务，汇聚国内顶尖医院与专家资源，为您的健康保驾护航。',
        scroll_hint: '向下探索',
      },
      tabs: {
        professional: '专科治疗',
        special: '特需门诊',
        professional_desc: '汇聚国内顶尖医院与专家资源，为您提供专业、精准的医疗诊治服务，涵盖肿瘤、心血管、神经外科等多个专科领域。',
        special_desc: '为有特殊需求的患者提供定制化医疗方案，包括高端体检、慢病管理、康复疗养及特需产品等一站式服务。',
        professional_tag: '专科诊疗',
        special_tag: '定制服务',
      },
      cta: {
        eyebrow: '开启您的旅程',
        title: '让优质中国医疗\n触手可及',
        subtitle: '专业医疗团队全程陪同，一对一定制服务，从预约挂号到康复随访，我们为您提供无忧的国际就医体验。',
        primary: '立即预约咨询',
        secondary: '了解合作医院',
        trust_247: '全天候服务',
        trust_privacy: '隐私保护',
        trust_free_value: '免费',
        trust_free: '初步咨询',
      },
      sco: {
        partner_hospitals: '合作顶尖医院',
        expert_specialists: '权威专家团队',
        patients_served: '成功服务患者',
        countries_covered: '覆盖国家地区',
      },
      hospitals: {
        section_title: '中国顶尖医院',
        section_subtitle: 'Top Hospitals in China',
        view_more: '了解更多',
        no_data: '暂无医院信息',
      },
      equipment: {
        section_title: '高端医疗设备',
        section_subtitle: 'Premium Medical Equipment',
        no_data: '暂无设备信息',
        view_hospital: '查看所属医院',
      },
      service_teams: {
        section_title: '专业服务团队',
        section_subtitle: 'Professional Service Teams',
        no_data: '暂无服务团队信息',
      },
      doctors: {
        section_title: '专业医护人员',
        section_subtitle: 'Professional Medical Staff',
        no_data: '暂无医护人员信息',
      },
      service_features: {
        section_title: '省心品质服务',
        section_subtitle: 'Quality Care Services',
        no_data: '暂无服务信息',
      },
      cases: {
        section_title: '过往成功案例',
        section_subtitle: 'Past Success Cases',
        view_detail: '查看详情',
        no_data: '暂无案例信息',
        detail_title: '案例详情',
        redirecting: '即将返回首页...',
      },
      products: {
        section_title: '特需门诊',
        section_subtitle: 'Special Needs Treatment',
        view_detail: '查看详情',
        price_range: '参考价格',
        price_unit: '元',
        no_data: '暂无产品信息',
        consult: '立即咨询',
      },
      product: {
        title: '产品详情',
        variants: '套餐选择',
        book: '立即预约',
        variant_name: '套餐名称',
        variant_desc: '描述',
        variant_action: '操作',
      },
      hospital: {
        doctors: '专业医护团队',
        book: '预约咨询',
        equipment_title: '高端医疗设备',
        environment_title: '舒适诊疗环境',
      },
      profile: {
        title: '个人中心',
        history: '浏览记录',
        hospital_record: '医院',
        product_record: '产品',
        view_again: '再次查看',
        no_history: '暂无浏览记录',
      },
      auth: {
        login_title: '登录',
        register_title: '注册账号',
        invited_by: '邀请人：{{name}}',
        invite_invalid: '邀请码无效，将以普通用户注册',
        invite_code_label: '邀请码',
        email: '邮箱',
        password: '密码',
        last_name: '姓',
        first_name: '名',
        gender: '性别',
        gender_male: '男',
        gender_female: '女',
        gender_other: '其他',
        phone: '联系方式',
        id_card: '身份证号',
        passport: '护照号',
        id_card_country: '证件签发国',
        verify_code: '验证码',
        send_code: '发送验证码',
        submit_login: '登录',
        submit_register: '注册',
        switch_login: '已有账号？',
        switch_register: '还没有账号？',
      },
      footer: {
        copyright: '© 2024 国际医疗项目. 保留所有权利。',
        tagline: '为全球患者提供高品质中国医疗服务',
        contact_cta: '合作请联系',
        contact_title: '联系我们',
        contact_person: '联系人',
        contact_phone: '电话',
        contact_none: '暂无联系方式',
      },
      booking: {
        title: '预约咨询',
        message: '联系人：{{person}}，联系方式：{{info}}',
        close: '关闭',
        contact_person: '联系人',
        contact_phone: '联系电话',
        no_contact: '暂无联系方式',
      },
      common: {
        loading: '加载中...',
        error: '加载失败，请稍后重试',
        read_more: '阅读更多',
        not_found: '案例不存在',
        back: '返回',
      },
    },
  },
  en: {
    translation: {
      nav: {
        language: '中文',
        logo: '国际医疗共享平台 · International Medical',
        login: 'Login',
        register: 'Register',
        profile: 'My Profile',
        logout: 'Logout',
        home: 'Home',
        hospitals: 'Top Hospitals in China',
        equipment: 'Premium Equipment',
        service_teams: 'Service Teams',
        cases: 'Past Success Cases',
        doctors: 'Medical Staff',
        service_features: 'Quality Services',
        products: 'Special Care',
        hd_intro: 'Hospital Overview',
        hd_equipment: 'Premium Equipment',
        hd_environment: 'Treatment Environment',
        hd_doctors: 'Medical Team',
        pd_intro: 'Overview',
        pd_detail: 'Details',
        pd_variants: 'Packages',
      },
      hero: {
        title: 'International Medical',
        subtitle_fallback: 'The International Medical Program is dedicated to providing high-quality Chinese medical services to patients worldwide, bringing together top hospitals and expert resources in China.',
        scroll_hint: 'Explore',
      },
      tabs: {
        professional: 'Professional Treatment',
        special: 'Special Needs Treatment',
        professional_desc: 'Bringing together top hospitals and expert resources in China, providing professional and precise medical diagnosis and treatment services, covering oncology, cardiovascular, neurosurgery and many other specialties.',
        special_desc: 'Providing customized medical solutions for patients with special needs, including premium health check-ups, chronic disease management, rehabilitation care and special needs products — all in one place.',
        professional_tag: 'Specialist Care',
        special_tag: 'Custom Service',
      },
      cta: {
        eyebrow: 'Begin Your Journey',
        title: "China's Finest Medical\nExpertise, Within Reach",
        subtitle: 'Our dedicated team provides end-to-end personalised care — from appointment booking to post-treatment follow-up — ensuring a seamless international medical experience.',
        primary: 'Book a Consultation',
        secondary: 'Explore Hospitals',
        trust_247: 'Support',
        trust_privacy: 'Confidential',
        trust_free_value: 'Free',
        trust_free: 'Initial Consult',
      },
      sco: {
        partner_hospitals: 'Partner Hospitals',
        expert_specialists: 'Expert Specialists',
        patients_served: 'Patients Served',
        countries_covered: 'Countries Covered',
      },
      hospitals: {
        section_title: 'Top Hospitals in China',
        section_subtitle: '中国顶尖医院',
        view_more: 'Learn More',
        no_data: 'No hospital information available',
      },
      equipment: {
        section_title: 'Premium Medical Equipment',
        section_subtitle: '高端医疗设备',
        no_data: 'No equipment information available',
        view_hospital: 'View Hospital',
      },
      service_teams: {
        section_title: 'Professional Service Teams',
        section_subtitle: '专业服务团队',
        no_data: 'No service team information available',
      },
      doctors: {
        section_title: 'Professional Medical Staff',
        section_subtitle: '专业医护人员',
        no_data: 'No medical staff available',
      },
      service_features: {
        section_title: 'Quality Care Services',
        section_subtitle: '省心品质服务',
        no_data: 'No services available',
      },
      cases: {
        section_title: 'Past Success Cases',
        section_subtitle: '过往成功案例',
        view_detail: 'View Details',
        no_data: 'No case information available',
        detail_title: 'Case Detail',
        redirecting: 'Redirecting to home...',
      },
      products: {
        section_title: 'Special Needs Treatment',
        section_subtitle: '特需门诊',
        view_detail: 'View Details',
        price_range: 'Reference Price',
        price_unit: 'CNY',
        no_data: 'No product information available',
        consult: 'Consult Now',
      },
      product: {
        title: 'Product Details',
        variants: 'Package Options',
        book: 'Book Now',
        variant_name: 'Package',
        variant_desc: 'Description',
        variant_action: 'Action',
      },
      hospital: {
        doctors: 'Medical Team',
        book: 'Book Consultation',
        equipment_title: 'Premium Medical Equipment',
        environment_title: 'Comfortable Treatment Environment',
      },
      profile: {
        title: 'My Profile',
        history: 'Browse History',
        hospital_record: 'Hospital',
        product_record: 'Product',
        view_again: 'View Again',
        no_history: 'No browse history yet',
      },
      auth: {
        login_title: 'Login',
        register_title: 'Create Account',
        invited_by: 'Invited by: {{name}}',
        invite_invalid: 'Invite code invalid; you will register as a regular user',
        invite_code_label: 'Invite Code',
        email: 'Email',
        password: 'Password',
        last_name: 'Last Name',
        first_name: 'First Name',
        gender: 'Gender',
        gender_male: 'Male',
        gender_female: 'Female',
        gender_other: 'Other',
        phone: 'Phone',
        id_card: 'ID Card Number',
        passport: 'Passport Number',
        id_card_country: 'Issuing Country',
        verify_code: 'Verification Code',
        send_code: 'Send Code',
        submit_login: 'Login',
        submit_register: 'Register',
        switch_login: 'Already have an account?',
        switch_register: "Don't have an account?",
      },
      footer: {
        copyright: '© 2024 International Medical Program. All rights reserved.',
        tagline: 'Providing world-class Chinese medical services to global patients',
        contact_cta: 'Contact Us',
        contact_title: 'Contact Us',
        contact_person: 'Contact',
        contact_phone: 'Phone',
        contact_none: 'No contact info available',
      },
      booking: {
        title: 'Book Consultation',
        message: 'Contact: {{person}}, Info: {{info}}',
        close: 'Close',
        contact_person: 'Contact',
        contact_phone: 'Phone',
        no_contact: 'No contact info available',
      },
      common: {
        loading: 'Loading...',
        error: 'Failed to load, please try again later',
        read_more: 'Read More',
        not_found: 'Case not found',
        back: 'Back',
      },
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'zh',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false },
  });

/**
 * Dynamically load a 3rd-language bundle from backend and add it to i18next.
 * Called by components when the user switches to a non-builtin language.
 */
export async function loadLang(lang: string): Promise<void> {
  if (lang === 'zh' || lang === 'zh-CN' || lang === 'en' || lang === 'en-US') return;
  if (i18n.hasResourceBundle(lang, 'translation')) return;
  try {
    const res = await fetch(`/api/i18n/${lang}`);
    const json = await res.json();
    // backend wraps response in { code, data } — unwrap if present
    const flat: Record<string, string> = json?.data ?? json ?? {};
    // convert flat "nav.login" → nested { nav: { login: ... } }
    const nested: Record<string, Record<string, string>> = {};
    for (const [key, value] of Object.entries(flat)) {
      const dot = key.indexOf('.');
      if (dot === -1) continue;
      const ns = key.slice(0, dot);
      const k  = key.slice(dot + 1);
      if (!nested[ns]) nested[ns] = {};
      nested[ns][k] = value;
    }
    i18n.addResourceBundle(lang, 'translation', nested, true, true);
  } catch {
    // silently fall back to zh/en
  }
}

export default i18n;
