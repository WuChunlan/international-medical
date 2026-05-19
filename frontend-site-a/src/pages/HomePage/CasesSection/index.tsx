import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../../api';
import type { ApiResult } from '../../../api';
import type { MedicalCase } from '../../../types';
import { useCarousel } from '../../../hooks/useCarousel';
import './index.less';

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
      .then(res => setCases(res.data ?? []))
      .catch(() => setCases([]))
      .finally(() => setLoading(false));
  }, []);

  const lang = i18n.language === 'zh' ? 'zh' : 'en';
  const { visible: visibleIdx, prev, next, hasMultiple, index } = useCarousel(cases.length);

  return (
    <section
      id="cases"
      ref={ref}
      className={`cases-section section-reveal${visible ? ' section-reveal--visible' : ''}`}
    >
      <div className="section-container">
        <div className="section-header">
          <div className="section-header__eyebrow">
            <div className="section-header__line" />
            <span className="section-header__label">{t('cases.section_subtitle')}</span>
            <div className="section-header__line" />
          </div>
          <h2 className="section-header__title">
            {t('cases.section_title')}
          </h2>
          <div className="gold-divider" />
        </div>

        {loading ? (
          <div className="section-state">{t('common.loading')}</div>
        ) : cases.length === 0 ? (
          <div className="section-state">{t('cases.no_data')}</div>
        ) : (
          <div className="carousel-wrap">
            <div className="cards-grid cards-grid--cases">
              {visibleIdx.map((i, slot) => (
                <CaseCard key={`${cases[i].id}-${slot}`} medCase={cases[i]} lang={lang} index={slot} />
              ))}
            </div>
            {hasMultiple && (
              <div className="carousel-nav">
                <button className="carousel-nav__btn carousel-nav__btn--light" onClick={prev} aria-label="上一组">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z"/></svg>
                </button>
                <div className="carousel-nav__dots">
                  {cases.map((_, i) => (
                    <span key={i} className={`carousel-nav__dot carousel-nav__dot--light${i === index ? ' carousel-nav__dot--active' : ''}`} />
                  ))}
                </div>
                <button className="carousel-nav__btn carousel-nav__btn--light" onClick={next} aria-label="下一组">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>
                </button>
              </div>
            )}
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
        <button className="case-card__link-btn">
          {t('cases.view_detail')}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
