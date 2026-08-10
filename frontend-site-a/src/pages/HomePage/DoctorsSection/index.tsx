import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { Avatar, Tag } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import api from '../../../api';
import type { Doctor } from '../../../types';
import { useCarousel } from '../../../hooks/useCarousel';
import BookingModal from '../../../components/BookingModal';
import { useAuthStore } from '../../../store/authStore';
import type { AuthState } from '../../../store/authStore';
import { useContacts } from '../../../hooks/useContacts';
import './index.less';

interface IPage<T> {
  records: T[];
  total: number;
}

export default function DoctorsSection() {
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const contacts = useContacts();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    api.get<IPage<Doctor>>('/api/doctors', { params: { page: 1, size: 200 } })
      .then(res => setItems(res.data?.records ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const isZh = i18n.language.startsWith('zh');
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s: AuthState) => s.user);
  const { visible: visibleIdx, prev, next, hasMultiple, index, pages } = useCarousel(items.length);

  const handleBook = async (doc: Doctor) => {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }
    try {
      await api.post('/api/user/history', { targetType: 'hospital', targetId: doc.hospitalId });
    } catch { /* ignore */ }
    setBookingOpen(true);
  };

  return (
    <section
      id="doctors"
      ref={ref}
      className={`doctors-section section-reveal${visible ? ' section-reveal--visible' : ''}`}
    >
      <div className="section-container">
        <div className="section-header">
          <div className="section-header__eyebrow">
            <div className="section-header__line" />
            <span className="section-header__label">{t('doctors.section_subtitle')}</span>
            <div className="section-header__line" />
          </div>
          <h2 className="section-header__title section-header__title--dark">
            {t('doctors.section_title')}
          </h2>
          <div className="gold-divider" />
        </div>

        {loading ? (
          <div className="section-state section-state--dark">{t('common.loading')}</div>
        ) : items.length === 0 ? (
          <div className="section-state section-state--dark">{t('doctors.no_data')}</div>
        ) : (
          <div className="carousel-wrap">
            <div className="carousel-cards-wrap">
              {hasMultiple && (
                <button className="carousel-nav__btn carousel-nav__btn--dark carousel-side-btn carousel-side-btn--prev" onClick={prev} aria-label="上一组">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z"/></svg>
                </button>
              )}
              <div className="cards-grid cards-grid--doctors">
                {visibleIdx.map((i, slot) => (
                  <DoctorCard key={`${items[i].id}-${slot}`} doc={items[i]} isZh={isZh} onBook={handleBook} />
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

      <BookingModal
        visible={bookingOpen}
        onClose={() => setBookingOpen(false)}
        contacts={contacts}
      />
    </section>
  );
}

function DoctorCard({ doc, isZh, onBook }: { doc: Doctor; isZh: boolean; onBook: (d: Doctor) => void }) {
  const { t } = useTranslation();
  const name      = isZh ? doc.nameZh      : doc.nameEn;
  const title     = isZh ? doc.titleZh     : doc.titleEn;
  const specialty = isZh ? doc.specialtyZh : doc.specialtyEn;
  const bio       = isZh ? doc.bioZh       : doc.bioEn;

  return (
    <div className="dc-card">
      <div className="dc-card__top">
        <Avatar
          size={72}
          src={doc.photoUrl ?? undefined}
          icon={!doc.photoUrl ? <UserOutlined /> : undefined}
          className="dc-card__avatar"
        />
        <div className="dc-card__meta">
          <span className="dc-card__name">{name}</span>
          {title && <Tag color="blue" className="dc-card__tag">{title}</Tag>}
          {specialty && <Tag color="cyan" className="dc-card__tag">{specialty}</Tag>}
        </div>
      </div>
      {bio && <p className="dc-card__bio">{bio}</p>}
      <button className="dc-card__book-btn" onClick={() => onBook(doc)}>
        {t('hospital.book')}
      </button>
    </div>
  );
}
