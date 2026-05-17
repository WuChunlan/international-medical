import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api';
import type { ApiResult } from '../../api';
import type { MedicalCase } from '../../types';
import './CasesSection.less';

export default function CasesSection() {
  const { t, i18n } = useTranslation();
  const [cases, setCases] = useState<MedicalCase[]>([]);
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
    api.get<ApiResult<MedicalCase[]>>('/api/cases')
      .then(res => setCases(res.data.data))
      .catch(() => setCases([]))
      .finally(() => setLoading(false));
  }, []);

  const lang = i18n.language === 'zh' ? 'zh' : 'en';

  return (
    <section
      id="cases"
      ref={ref}
      className={`cases-section section-reveal${visible ? ' section-reveal--visible' : ''}`}
    >
      <div className="section-container">
        <div className="section-header">
          <div className="section-header__eyebrow">
            <div className="section-header__line section-header__line--light" />
            <span className="section-header__label section-header__label--light">{t('cases.section_subtitle')}</span>
            <div className="section-header__line section-header__line--light" />
          </div>
          <h2 className="section-header__title section-header__title--light">
            {t('cases.section_title')}
          </h2>
          <div className="gold-divider gold-divider--light" />
        </div>

        {loading ? (
          <div className="section-state section-state--light">{t('common.loading')}</div>
        ) : cases.length === 0 ? (
          <div className="section-state section-state--dark">{t('cases.no_data')}</div>
        ) : (
          <div className="cards-grid cards-grid--cases">
            {cases.map((c, idx) => (
              <CaseCard key={c.id} medCase={c} lang={lang} index={idx} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function CaseCard({ medCase, lang, index }: {
  medCase: MedicalCase; lang: string; index: number;
}) {
  const { t } = useTranslation();
  const siteBUrl = import.meta.env.VITE_SITE_B_URL || 'http://localhost:3001';
  const title = lang === 'zh' ? medCase.titleZh : medCase.titleEn;
  const summary = lang === 'zh' ? medCase.summaryZh : medCase.summaryEn;

  return (
    <div className="case-card" style={{ animationDelay: `${index * 100}ms` }}>
      <div className="case-card__cover">
        {medCase.coverImageUrl ? (
          <img src={medCase.coverImageUrl} alt={title} />
        ) : (
          <div
            className="case-card__cover-placeholder"
            style={{
              background: `linear-gradient(135deg, hsl(${210 + index * 20}, 40%, 20%) 0%, hsl(${220 + index * 20}, 50%, 15%) 100%)`,
            }}
          >
            <div className="case-card__cover-placeholder-inner">
              <span>{String(index + 1).padStart(2, '0')}</span>
            </div>
          </div>
        )}
        <div className="case-card__cover-gradient" />
      </div>

      <div className="case-card__content">
        <h3 className="case-card__title">{title}</h3>
        <p className="case-card__summary">{summary}</p>
        <button
          className="case-card__link-btn"
          onClick={() => { window.open(`${siteBUrl}/case/${medCase.id}`, '_blank', 'noopener,noreferrer'); }}
        >
          {t('cases.view_detail')}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
