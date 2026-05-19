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
        hospitals: '中国顶尖医院',
        equipment: '先进医疗设备',
        service_teams: '专业服务团队',
        cases: '过往成功案例',
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
      },
      hospitals: {
        section_title: '中国顶尖医院',
        section_subtitle: 'Top Hospitals in China',
        view_more: '了解更多',
        no_data: '暂无医院信息',
      },
      equipment: {
        section_title: '先进医疗设备',
        section_subtitle: 'Advanced Medical Equipment',
        no_data: '暂无设备信息',
        view_hospital: '查看所属医院',
      },
      service_teams: {
        section_title: '专业服务团队',
        section_subtitle: 'Professional Service Teams',
        no_data: '暂无服务团队信息',
      },
      cases: {
        section_title: '过往成功案例',
        section_subtitle: 'Past Success Cases',
        view_detail: '查看详情',
        no_data: '暂无案例信息',
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
      },
      hospital: {
        doctors: '专家团队',
        book: '预约就诊',
      },
      booking: {
        title: '预约咨询',
        message: '联系人：{{person}}，联系方式：{{info}}',
        close: '关闭',
      },
      profile: {
        title: '个人中心',
        history: '浏览记录',
        hospital_record: '医院',
        product_record: '产品',
        view_again: '再次查看',
      },
      auth: {
        login_title: '登录',
        register_title: '注册账号',
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
      },
      common: {
        loading: '加载中...',
        error: '加载失败，请稍后重试',
        read_more: '阅读更多',
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
        hospitals: 'Top Hospitals in China',
        equipment: 'Advanced Equipment',
        service_teams: 'Service Teams',
        cases: 'Past Success Cases',
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
      },
      hospitals: {
        section_title: 'Top Hospitals in China',
        section_subtitle: '中国顶尖医院',
        view_more: 'Learn More',
        no_data: 'No hospital information available',
      },
      equipment: {
        section_title: 'Advanced Medical Equipment',
        section_subtitle: '先进医疗设备',
        no_data: 'No equipment information available',
        view_hospital: 'View Hospital',
      },
      service_teams: {
        section_title: 'Professional Service Teams',
        section_subtitle: '专业服务团队',
        no_data: 'No service team information available',
      },
      cases: {
        section_title: 'Past Success Cases',
        section_subtitle: '过往成功案例',
        view_detail: 'View Details',
        no_data: 'No case information available',
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
      },
      hospital: {
        doctors: 'Expert Team',
        book: 'Book Appointment',
      },
      booking: {
        title: 'Book Consultation',
        message: 'Contact: {{person}}, Info: {{info}}',
        close: 'Close',
      },
      profile: {
        title: 'My Profile',
        history: 'Browse History',
        hospital_record: 'Hospital',
        product_record: 'Product',
        view_again: 'View Again',
      },
      auth: {
        login_title: 'Login',
        register_title: 'Create Account',
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
      },
      common: {
        loading: 'Loading...',
        error: 'Failed to load, please try again later',
        read_more: 'Read More',
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

export default i18n;
