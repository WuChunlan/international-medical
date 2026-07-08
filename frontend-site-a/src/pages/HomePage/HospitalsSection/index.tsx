import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import api from '../../../api';
import type { Hospital } from '../../../types';
import { useCarousel } from '../../../hooks/useCarousel';
import './index.less';

export default function HospitalsSection() {
  const { t, i18n } = useTranslation();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
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
    api.get<Hospital[]>('/api/hospitals')
      .then(res => setHospitals(res.data ?? []))
      .catch(() => setHospitals([]))
      .finally(() => setLoading(false));
  }, []);

  const lang = i18n.language === 'zh' ? 'zh' : 'en';
  const { visible: visibleIdx, prev, next, hasMultiple, index, pages } = useCarousel(hospitals.length);

  return (
    <section
      id="hospitals"
      ref={ref}
      className={`hospitals-section section-reveal${visible ? ' section-reveal--visible' : ''}`}
    >
      <div className="section-container">
        <div className="section-header">
          <div className="section-header__eyebrow">
            <div className="section-header__line" />
            <span className="section-header__label">{t('hospitals.section_subtitle')}</span>
            <div className="section-header__line" />
          </div>
          <h2 className="section-header__title section-header__title--dark">
            {t('hospitals.section_title')}
          </h2>
          <div className="gold-divider" />
        </div>

        {loading ? (
          <div className="section-state section-state--light">{t('common.loading')}</div>
        ) : hospitals.length === 0 ? (
          <div className="section-state section-state--dark">{t('hospitals.no_data')}</div>
        ) : (
          <div className="carousel-wrap">
            <div className="carousel-cards-wrap">
              {hasMultiple && (
                <button className="carousel-nav__btn carousel-nav__btn--dark carousel-side-btn carousel-side-btn--prev" onClick={prev} aria-label="上一组">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z"/></svg>
                </button>
              )}
              <div className="cards-grid cards-grid--hospitals">
                {visibleIdx.map((i, slot) => (
                  <HospitalCard key={`${hospitals[i].id}-${slot}`} hospital={hospitals[i]} lang={lang} delay={slot * 80} />
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

function HospitalCard({ hospital, lang, delay }: {
  hospital: Hospital; lang: string; delay: number;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const name = lang === 'zh' ? hospital.nameZh : hospital.nameEn;
  const intro = lang === 'zh' ? hospital.introZh : hospital.introEn;

  return (
    <div
      className="hospital-card"
      role="button"
      tabIndex={0}
      style={{ animationDelay: `${delay}ms` }}
      onClick={() => navigate(`/hospital/${hospital.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(`/hospital/${hospital.id}`);
        }
      }}
    >
      <div className="hospital-card__img">
        {hospital.coverImageUrl ? (
          <img src={hospital.coverImageUrl} alt={name} />
        ) : (
          <div className="hospital-card__img-placeholder" />
        )}
      </div>

      <div className="hospital-card__overlay">
        <h3 className="hospital-card__name">{name}</h3>
        <p className="hospital-card__intro">{intro}</p>
        <span className="hospital-card__link">
          {t('hospitals.view_more')}
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
          </svg>
        </span>
      </div>
    </div>
  );
}
