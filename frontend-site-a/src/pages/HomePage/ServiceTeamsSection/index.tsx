import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../../api';
import type { ServiceTeam } from '../../../types';
import { useCarousel } from '../../../hooks/useCarousel';
import './index.less';

export default function ServiceTeamsSection() {
  const { t, i18n } = useTranslation();
  const [teams, setTeams] = useState<ServiceTeam[]>([]);
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
    api.get<ServiceTeam[]>('/api/service-teams')
      .then(res => setTeams(res.data))
      .catch(() => setTeams([]))
      .finally(() => setLoading(false));
  }, []);

  const lang = i18n.language === 'zh' ? 'zh' : 'en';
  const { visible: visibleIdx, prev, next, hasMultiple, index } = useCarousel(teams.length, 3);

  return (
    <section
      id="service-teams"
      ref={ref}
      className={`service-teams-section section-reveal${visible ? ' section-reveal--visible' : ''}`}
    >
      <div className="section-container">
        <div className="section-header">
          <div className="section-header__eyebrow">
            <div className="section-header__line" />
            <span className="section-header__label">{t('service_teams.section_subtitle')}</span>
            <div className="section-header__line" />
          </div>
          <h2 className="section-header__title section-header__title--dark">
            {t('service_teams.section_title')}
          </h2>
          <div className="gold-divider" />
        </div>

        {loading ? (
          <div className="section-state section-state--dark">{t('common.loading')}</div>
        ) : teams.length === 0 ? (
          <div className="section-state section-state--dark">{t('service_teams.no_data')}</div>
        ) : (
          <div className="carousel-wrap">
            <div className="carousel-cards-wrap">
              {hasMultiple && (
                <button className="carousel-nav__btn carousel-nav__btn--dark carousel-side-btn carousel-side-btn--prev" onClick={prev} aria-label="上一组">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z"/></svg>
                </button>
              )}
              <div className={`cards-grid cards-grid--teams cards-grid--teams-${Math.min(visibleIdx.length, 3)}`}>
                {visibleIdx.map((i, slot) => (
                  <TeamCard key={`${teams[i].id}-${slot}`} team={teams[i]} lang={lang} delay={slot * 80} />
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
                  {teams.map((_, i) => (
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

function TeamCard({ team, lang, delay }: { team: ServiceTeam; lang: string; delay: number }) {
  const name = lang === 'zh' ? team.nameZh : team.nameEn;
  const intro = lang === 'zh' ? team.introZh : team.introEn;

  return (
    <div className="team-card" style={{ animationDelay: `${delay}ms` }}>
      <div className="team-card__cover">
        {team.imageUrl ? (
          <img src={team.imageUrl} alt={name} />
        ) : (
          <div className="team-card__cover-placeholder">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="rgba(59,130,246,0.4)">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
          </div>
        )}
        <div className="team-card__cover-gradient" />
      </div>
      <div className="team-card__content">
        <div className="team-card__name-row">
          <div className="team-card__accent-bar" />
          <h3 className="team-card__name">{name}</h3>
        </div>
        {intro && <p className="team-card__intro">{intro}</p>}
      </div>
    </div>
  );
}
