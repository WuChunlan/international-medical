import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  zh: {
    translation: {
      nav: {
        language: 'English',
        logo: '国际医疗 · International Medical',
      },
      hero: {
        title: '国际医疗',
        subtitle_fallback: '国际医疗项目致力于为全球患者提供高品质的中国医疗服务，汇聚国内顶尖医院与专家资源，为您的健康保驾护航。',
        scroll_hint: '向下探索',
      },
      tabs: {
        professional: '专业治疗',
        special: '特需治疗',
        professional_desc: '汇聚国内顶尖医院与专家资源，为您提供专业、精准的医疗诊治服务，涵盖肿瘤、心血管、神经外科等多个专科领域。',
        special_desc: '为有特殊需求的患者提供定制化医疗方案，包括高端体检、慢病管理、康复疗养及特需产品等一站式服务。',
      },
      hospitals: {
        section_title: '顶尖医院',
        section_subtitle: 'Top Hospitals',
        view_more: '了解更多',
        no_data: '暂无医院信息',
      },
      equipment: {
        section_title: '高级医疗设备',
        section_subtitle: 'Advanced Medical Equipment',
        no_data: '暂无设备信息',
      },
      cases: {
        section_title: '成功案例',
        section_subtitle: 'Success Cases',
        view_detail: '查看详情',
        no_data: '暂无案例信息',
      },
      products: {
        section_title: '特需治疗',
        section_subtitle: 'Special Needs Treatment',
        view_detail: '查看详情',
        price_range: '参考价格',
        price_unit: '元',
        no_data: '暂无产品信息',
        consult: '立即咨询',
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
        logo: '国际医疗 · International Medical',
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
        section_title: 'Top Hospitals',
        section_subtitle: '顶尖医院',
        view_more: 'Learn More',
        no_data: 'No hospital information available',
      },
      equipment: {
        section_title: 'Advanced Medical Equipment',
        section_subtitle: '高级医疗设备',
        no_data: 'No equipment information available',
      },
      cases: {
        section_title: 'Success Cases',
        section_subtitle: '成功案例',
        view_detail: 'View Details',
        no_data: 'No case information available',
      },
      products: {
        section_title: 'Special Needs Treatment',
        section_subtitle: '特需治疗',
        view_detail: 'View Details',
        price_range: 'Reference Price',
        price_unit: 'CNY',
        no_data: 'No product information available',
        consult: 'Consult Now',
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
