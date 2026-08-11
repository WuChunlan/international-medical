import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import './index.less';

export default function CtaSection() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const trust = [
    { value: '24/7', label: t('cta.trust_247') },
    { value: '100%', label: t('cta.trust_privacy') },
    { value: t('cta.trust_free_value'), label: t('cta.trust_free') },
  ];

  return (
    <section ref={ref} className="cta-section">
      <div className="cta-section__orb cta-section__orb--top" />
      <div className="cta-section__orb cta-section__orb--bottom" />
      <div className="cta-section__grid-overlay" />

      <div className={`cta-section__inner section-reveal${visible ? ' section-reveal--visible' : ''}`}>
        <div className="cta-section__eyebrow">
          <div className="cta-section__eyebrow-dot" />
          <span className="cta-section__eyebrow-label">{t('cta.eyebrow')}</span>
        </div>

        <h2 className="cta-section__title">{t('cta.title')}</h2>
        <div className="cta-section__divider" />
        <p className="cta-section__subtitle">{t('cta.subtitle')}</p>

        <div className="cta-section__buttons">
          <button className="cta-btn-primary" onClick={() => navigate('/login')}>
            {t('cta.primary')}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
          <a href="#hospitals" className="cta-btn-secondary">{t('cta.secondary')}</a>
        </div>

        <div className="cta-section__trust">
          {trust.map((item, i) => (
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
