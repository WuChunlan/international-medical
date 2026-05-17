import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api';
import type { ApiResult } from '../../api';
import type { Equipment } from '../../types';
import './EquipmentSection.less';

export default function EquipmentSection() {
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    api.get<ApiResult<Equipment[]>>('/api/equipments')
      .then(res => setItems(res.data.data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (items.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % items.length);
    }, 4000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [items.length]);

  const lang = i18n.language === 'zh' ? 'zh' : 'en';
  const visibleCount = 3;
  const displayItems = items.length > 0
    ? Array.from({ length: visibleCount }, (_, i) => items[(current + i) % items.length])
    : [];

  return (
    <section
      id="equipment"
      ref={ref}
      className={`equipment-section section-reveal${visible ? ' section-reveal--visible' : ''}`}
    >
      <div className="section-container">
        <div className="section-header">
          <div className="section-header__eyebrow">
            <div className="section-header__line" />
            <span className="section-header__label">{t('equipment.section_subtitle')}</span>
            <div className="section-header__line" />
          </div>
          <h2 className="section-header__title section-header__title--dark">
            {t('equipment.section_title')}
          </h2>
          <div className="gold-divider" />
        </div>

        {loading ? (
          <div className="section-state section-state--dark">{t('common.loading')}</div>
        ) : items.length === 0 ? (
          <div className="section-state section-state--dark">{t('equipment.no_data')}</div>
        ) : (
          <>
            <div className="cards-grid cards-grid--equipment equipment-grid">
              {displayItems.map((eq, idx) => (
                <EquipmentCard key={`${eq.id}-${idx}`} equipment={eq} lang={lang} />
              ))}
            </div>
            <div className="equipment-dots">
              {items.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`equipment-dot${i === current ? ' equipment-dot--active' : ''}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function EquipmentCard({ equipment, lang }: { equipment: Equipment; lang: string }) {
  const name = lang === 'zh' ? equipment.nameZh : equipment.nameEn;
  const desc = lang === 'zh' ? equipment.descZh : equipment.descEn;

  return (
    <div className="equip-card">
      <div className="equip-card__cover">
        {equipment.imageUrl ? (
          <img src={equipment.imageUrl} alt={name} />
        ) : (
          <div className="equip-card__cover-placeholder">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="rgba(59,130,246,0.4)">
              <path d="M20 6h-2.18c.07-.44.18-.88.18-1.36C18 2.53 15.47 0 12.36 0c-1.73 0-3.24.86-4.19 2.18L12 6H8.82L7.17 3.62C6.22 1.86 4.35.75 2.36.75 1.06.75 0 1.81 0 3.11c0 .49.14.95.38 1.35L2.18 6H2c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-8 11c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
            </svg>
          </div>
        )}
      </div>
      <div className="equip-card__content">
        <div className="equip-card__name-row">
          <div className="equip-card__accent-bar" />
          <h3 className="equip-card__name">{name}</h3>
        </div>
        {desc && <p className="equip-card__desc">{desc}</p>}
      </div>
    </div>
  );
}
