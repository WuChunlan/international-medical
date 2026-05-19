import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import './index.less';

const CONTENT = {
  zh: {
    eyebrow: '开启您的旅程',
    title: '让优质中国医疗\n触手可及',
    subtitle: '专业医疗团队全程陪同，一对一定制服务，从预约挂号到康复随访，我们为您提供无忧的国际就医体验。',
    primary: '立即预约咨询',
    secondary: '了解合作医院',
    trust: [
      { value: '24/7', label: '全天候服务' },
      { value: '100%', label: '隐私保护' },
      { value: '免费', label: '初步咨询' },
    ],
  },
  en: {
    eyebrow: 'Begin Your Journey',
    title: "China's Finest Medical\nExpertise, Within Reach",
    subtitle: "Our dedicated team provides end-to-end personalised care — from appointment booking to post-treatment follow-up — ensuring a seamless international medical experience.",
    primary: 'Book a Consultation',
    secondary: 'Explore Hospitals',
    trust: [
      { value: '24/7', label: 'Support' },
      { value: '100%', label: 'Confidential' },
      { value: 'Free', label: 'Initial Consult' },
    ],
  },
};

export default function CtaSection() {
  const { i18n } = useTranslation();
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const lang = i18n.language === 'zh' ? 'zh' : 'en';
  const c = CONTENT[lang];
  const navigate = useNavigate();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="cta-section">
      <div className="cta-section__orb cta-section__orb--top" />
      <div className="cta-section__orb cta-section__orb--bottom" />
      <div className="cta-section__grid-overlay" />

      <div className={`cta-section__inner section-reveal${visible ? ' section-reveal--visible' : ''}`}>
        <div className="cta-section__eyebrow">
          <div className="cta-section__eyebrow-dot" />
          <span className="cta-section__eyebrow-label">{c.eyebrow}</span>
        </div>

        <h2 className="cta-section__title">{c.title}</h2>
        <div className="cta-section__divider" />
        <p className="cta-section__subtitle">{c.subtitle}</p>

        <div className="cta-section__buttons">
          <button className="cta-btn-primary" onClick={() => navigate('/login')}>
            {c.primary}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
          <a href="#hospitals" className="cta-btn-secondary">{c.secondary}</a>
        </div>

        <div className="cta-section__trust">
          {c.trust.map((item, i) => (
            <div key={i} className="cta-trust-item">
              <span className="cta-trust-item__value">{item.value}</span>
              <span className="cta-trust-item__label">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
