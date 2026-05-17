import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  zh: {
    translation: {
      nav: { language: 'English', profile: '个人中心', logout: '退出登录', login: '登录', register: '注册' },
      home: {
        badge: '国际医疗服务平台',
        hero_title: '专业国际医疗\n健康护航全球',
        hero_subtitle: '汇聚顶级医院、权威专家与先进设备，为您提供一站式国际医疗服务。',
        explore_hospitals: '探索合作医院',
        explore_products: '查看特需产品',
        hospitals: '合作医院',
        products: '特需产品',
        equipments: '医疗设备',
        view_detail: '查看详情',
        equipment_tag: '医院设备',
      },
      hospital: { title: '医院详情', equipment: '高级医疗设备', doctors: '专家团队', book: '立即预约' },
      product: { title: '产品详情', variants: '套餐选择', book: '立即预约' },
      auth: {
        login_title: '登录', register_title: '注册',
        username: '用户名', email: '邮箱', password: '密码',
        id_card: '当地身份证号', id_card_country: '证件签发国',
        verify_code: '邮箱验证码', send_code: '发送验证码',
        submit_login: '登录', submit_register: '注册',
        switch_register: '没有账号？立即注册', switch_login: '已有账号？立即登录',
      },
      booking: {
        title: '预约信息',
        message: '请您与 {{person}} 联系，联系方式为：{{info}}，以便于帮您预约安排。',
        close: '关闭',
      },
      profile: {
        title: '个人中心', history: '浏览记录',
        hospital_record: '医院预约', product_record: '产品预约',
        view_again: '再次查看',
      },
    },
  },
  en: {
    translation: {
      nav: { language: '中文', profile: 'Profile', logout: 'Logout', login: 'Login', register: 'Register' },
      home: {
        badge: 'International Medical Platform',
        hero_title: 'World-Class Medical Care\nFor You, Anywhere',
        hero_subtitle: 'Connecting you with top hospitals, expert physicians, and advanced medical equipment for comprehensive international healthcare.',
        explore_hospitals: 'Explore Hospitals',
        explore_products: 'View Products',
        hospitals: 'Partner Hospitals',
        products: 'Special Products',
        equipments: 'Medical Equipment',
        view_detail: 'View Details',
        equipment_tag: 'Hospital Equipment',
      },
      hospital: { title: 'Hospital Details', equipment: 'Advanced Medical Equipment', doctors: 'Expert Team', book: 'Book Now' },
      product: { title: 'Product Details', variants: 'Package Options', book: 'Book Now' },
      auth: {
        login_title: 'Login', register_title: 'Register',
        username: 'Username', email: 'Email', password: 'Password',
        id_card: 'Local ID Card Number', id_card_country: 'Issuing Country',
        verify_code: 'Email Verification Code', send_code: 'Send Code',
        submit_login: 'Login', submit_register: 'Register',
        switch_register: "Don't have an account? Register", switch_login: 'Already have an account? Login',
      },
      booking: {
        title: 'Booking Information',
        message: 'Please contact {{person}} at {{info}} to arrange your appointment.',
        close: 'Close',
      },
      profile: {
        title: 'My Profile', history: 'Browse History',
        hospital_record: 'Hospital Inquiry', product_record: 'Product Inquiry',
        view_again: 'View Again',
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
    detection: { order: ['localStorage', 'navigator'], caches: ['localStorage'] },
    interpolation: { escapeValue: false },
  });

export default i18n;
