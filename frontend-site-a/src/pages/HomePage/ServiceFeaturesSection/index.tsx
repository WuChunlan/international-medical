import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../../api';
import type { ServiceFeature } from '../../../types';
import { useCarousel } from '../../../hooks/useCarousel';
import './index.less';

interface IPage<T> {
  records: T[];
  total: number;
}

export default function ServiceFeaturesSection() {
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState<ServiceFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    api.get<IPage<ServiceFeature>>('/api/service-features', { params: { page: 1, size: 6 } })
      .then(res => setItems(res.data?.records ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const lang = i18n.language === 'zh' ? 'zh' : 'en';
  const { visible: visibleIdx, prev, next, hasMultiple, index, pages } = useCarousel(items.length);

  return (
    <section
      id="service-features"
      ref={ref}
      className={`service-features-section section-reveal${visible ? ' section-reveal--visible' : ''}`}
    >
      <div className="section-container">
        <div className="section-header">
          <div className="section-header__eyebrow">
            <div className="section-header__line" />
            <span className="section-header__label">{t('service_features.section_subtitle')}</span>
            <div className="section-header__line" />
          </div>
          <h2 className="section-header__title section-header__title--dark">
            {t('service_features.section_title')}
          </h2>
          <div className="gold-divider" />
        </div>

        {loading ? (
          <div className="section-state section-state--dark">{t('common.loading')}</div>
        ) : items.length === 0 ? (
          <div className="section-state section-state--dark">{t('service_features.no_data')}</div>
        ) : (
          <div className="carousel-wrap">
            <div className="carousel-cards-wrap">
              {hasMultiple && (
                <button className="carousel-nav__btn carousel-nav__btn--dark carousel-side-btn carousel-side-btn--prev" onClick={prev} aria-label="上一组">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z"/></svg>
                </button>
              )}
              <div className="cards-grid cards-grid--equipment">
                {visibleIdx.map((i, slot) => (
                  <ServiceFeatureCard key={`${items[i].id}-${slot}`} feature={items[i]} lang={lang} delay={slot * 80} />
                ))}
              </div>
              {hasMultiple && (
                <button className="carousel-nav__btn carousel-nav__btn--dark carousel-side-btn carousel-side-btn--next" onClick={next} aria-label="下一组">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>
                </button>
              )}
            </div>
            {hasMultiple && (
              <div className="carousel-nav">
                <div className="carousel-nav__dots">
                  {Array.from({ length: pages }, (_, i) => (
                    <span key={i} className={`carousel-nav__dot carousel-nav__dot--dark${i === index ? ' carousel-nav__dot--active' : ''}`} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function ServiceFeatureCard({ feature, lang, delay }: { feature: ServiceFeature; lang: string; delay: number }) {
  const name  = lang === 'zh' ? feature.nameZh  : feature.nameEn;
  const intro = lang === 'zh' ? feature.introZh : feature.introEn;

  return (
    <div className="sf-card" style={{ animationDelay: `${delay}ms` }}>
      <div className="sf-card__cover">
        {feature.imageUrl ? (
          <img src={feature.imageUrl} alt={name} />
        ) : (
          <div className="sf-card__cover-placeholder">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="rgba(59,130,246,0.4)">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
            </svg>
          </div>
        )}
      </div>
      <div className="sf-card__content">
        <div className="sf-card__name-row">
          <div className="sf-card__accent-bar" />
          <h3 className="sf-card__name">{name}</h3>
        </div>
        {intro && <p className="sf-card__intro">{intro}</p>}
      </div>
    </div>
  );
}
