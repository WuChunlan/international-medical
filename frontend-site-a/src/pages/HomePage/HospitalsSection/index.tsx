import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../../api';
import type { ApiResult } from '../../../api';
import type { Hospital } from '../../../types';
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
    api.get<ApiResult<Hospital[]>>('/api/hospitals')
      .then(res => setHospitals(res.data.data))
      .catch(() => setHospitals([]))
      .finally(() => setLoading(false));
  }, []);

  const lang = i18n.language === 'zh' ? 'zh' : 'en';

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
          <div className="cards-grid cards-grid--hospitals">
            {hospitals.map((h, idx) => (
              <HospitalCard key={h.id} hospital={h} lang={lang} delay={idx * 150} />
            ))}
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
  const name = lang === 'zh' ? hospital.nameZh : hospital.nameEn;
  const intro = lang === 'zh' ? hospital.introZh : hospital.introEn;
  const siteBUrl = import.meta.env.VITE_SITE_B_URL || 'http://localhost:3001';

  return (
    <div className="hospital-card" style={{ animationDelay: `${delay}ms` }}>
      <div className="hospital-card__cover">
        {hospital.coverImageUrl ? (
          <img src={hospital.coverImageUrl} alt={name} />
        ) : (
          <div className="hospital-card__cover-placeholder">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="rgba(59,130,246,0.3)">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/>
            </svg>
          </div>
        )}
        <div className="hospital-card__cover-gradient" />
      </div>

      <div className="hospital-card__content">
        <div className="hospital-card__name-row">
          <div className="hospital-card__accent-bar" />
          <h3 className="hospital-card__name">{name}</h3>
        </div>
        <p className="hospital-card__intro">{intro}</p>
        <a
          href={`${siteBUrl}/hospital/${hospital.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hospital-card__link"
        >
          {t('hospitals.view_more')}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
          </svg>
        </a>
      </div>
    </div>
  );
}
