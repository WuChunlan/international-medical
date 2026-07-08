import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Spin, message, Avatar, Tag, Typography } from 'antd';
import { UserOutlined, MedicineBoxOutlined, HomeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import api from '../../api';
import { useAuthStore } from '../../store/authStore';
import type { AuthState } from '../../store/authStore';
import Header from '../../components/Header';
import BookingModal from '../../components/BookingModal';
import MediaCarousel from '../../components/MediaCarousel';
import { useCarousel } from '../../hooks/useCarousel';
import type { HospitalDetail, Doctor, Equipment, HospitalEnvironment } from '../../types';
import './index.less';
import React from 'react';

const { Title, Paragraph } = Typography;
const PER_PAGE = 4;

// ── Arrow SVGs ────────────────────────────────────────────────────────────────
const ArrowLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z"/>
  </svg>
);
const ArrowRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/>
  </svg>
);

// ── Generic section carousel with 4 per row ───────────────────────────────────
function SectionCarousel<T>({
  items,
  renderCard,
  theme = 'light',
}: {
  items: T[];
  renderCard: (item: T, idx: number) => React.ReactNode;
  theme?: 'light' | 'dark';
}) {
  const { visible, prev, next, hasMultiple, index, pages } = useCarousel(items.length, PER_PAGE, 4500);

  return (
    <div className="hd-carousel-wrap">
      <div className="hd-cards-row-wrap">
        {hasMultiple && (
          <button className="hd-nav__btn hd-side-btn hd-side-btn--prev" onClick={prev} aria-label="上一组"><ArrowLeft /></button>
        )}
        <div className="hd-cards-row">
          {visible.map((i, slot) => (
            <div key={`${i}-${slot}`} className="hd-card-slot" style={{ animationDelay: `${slot * 70}ms` }}>
              {renderCard(items[i], slot)}
            </div>
          ))}
        </div>
        {hasMultiple && (
          <button className="hd-nav__btn hd-side-btn hd-side-btn--next" onClick={next} aria-label="下一组"><ArrowRight /></button>
        )}
      </div>
      {hasMultiple && (
        <div className={`hd-nav hd-nav--${theme}`}>
          <div className="hd-nav__dots">
            {Array.from({ length: pages }, (_, i) => (
              <span key={i} className={`hd-nav__dot${i === index ? ' hd-nav__dot--active' : ''}`} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Equipment card ────────────────────────────────────────────────────────────
function EquipCard({ item, isZh }: { item: Equipment; isZh: boolean }) {
  return (
    <div className="hd-card hd-card--equip">
      <div className="hd-card__cover">
        {item.imageUrl
          ? <img src={item.imageUrl} alt={isZh ? item.nameZh : item.nameEn} />
          : <div className="hd-card__cover-ph"><MedicineBoxOutlined /></div>
        }
      </div>
      <div className="hd-card__body">
        <h4 className="hd-card__name">{isZh ? item.nameZh : item.nameEn}</h4>
        <p className="hd-card__desc">{isZh ? item.descZh : item.descEn}</p>
      </div>
    </div>
  );
}

// ── Environment card ──────────────────────────────────────────────────────────
function EnvCard({ item, isZh }: { item: HospitalEnvironment; isZh: boolean }) {
  return (
    <div className="hd-card hd-card--env">
      <div className="hd-card__cover">
        {item.imageUrl
          ? <img src={item.imageUrl} alt={isZh ? item.nameZh : item.nameEn} />
          : <div className="hd-card__cover-ph hd-card__cover-ph--env"><HomeOutlined /></div>
        }
      </div>
      <div className="hd-card__body">
        <h4 className="hd-card__name">{isZh ? item.nameZh : item.nameEn}</h4>
        {(isZh ? item.descZh : item.descEn) && (
          <p className="hd-card__desc">{isZh ? item.descZh : item.descEn}</p>
        )}
      </div>
    </div>
  );
}

// ── Doctor card ───────────────────────────────────────────────────────────────
function DoctorCard({
  doc, isZh, onBook,
}: { doc: Doctor; isZh: boolean; onBook: (d: Doctor) => void }) {
  const { t } = useTranslation();
  const name      = isZh ? doc.nameZh      : doc.nameEn;
  const title     = isZh ? doc.titleZh     : doc.titleEn;
  const specialty = isZh ? doc.specialtyZh : doc.specialtyEn;
  const bio       = isZh ? doc.bioZh       : doc.bioEn;

  return (
    <div className="hd-card hd-card--doctor">
      <div className="hd-card__doctor-top">
        <Avatar
          size={72}
          src={doc.photoUrl ?? undefined}
          icon={!doc.photoUrl ? <UserOutlined /> : undefined}
          className="hd-doctor-avatar"
        />
        <div className="hd-doctor-meta">
          <span className="hd-doctor-name">{name}</span>
          {title && <Tag color="blue" className="hd-doctor-title">{title}</Tag>}
          <Tag color="cyan" className="hd-doctor-specialty">{specialty}</Tag>
        </div>
      </div>
      {bio && (
        <p className="hd-card__desc hd-doctor-bio">{bio}</p>
      )}
      <button className="hd-book-btn" onClick={() => onBook(doc)}>
        {t('hospital.book')}
      </button>
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function SectionBlock({
  id, icon, title, alt = false, children,
}: {
  id?: string; icon: React.ReactNode; title: string; alt?: boolean; children: React.ReactNode;
}) {
  return (
    <section id={id} className={`hd-section${alt ? ' hd-section--alt' : ''}`}>
      <div className="hd-section__inner">
        <div className="hd-section__header">
          <span className="hd-section__icon">{icon}</span>
          <h2 className="hd-section__title">{title}</h2>
          <div className="hd-section__rule" />
        </div>
        {children}
      </div>
    </section>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function HospitalDetailPage() {
  const { id }       = useParams<{ id: string }>();
  const navigate     = useNavigate();
  const location     = useLocation();
  const { t, i18n } = useTranslation();
  const user         = useAuthStore((s: AuthState) => s.user);

  const [loading, setLoading]       = useState(true);
  const [data, setData]             = useState<HospitalDetail | null>(null);
  const [bookingModal, setBookingModal] = useState<{
    visible: boolean; contactPerson: string | null; contactInfo: string | null;
  }>({ visible: false, contactPerson: null, contactInfo: null });

  const isZh = i18n.language.startsWith('zh');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get<HospitalDetail>(`/api/hospitals/${id}`)
      .then(res => setData(res.data))
      .catch(() => message.error('Failed to load hospital details'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleBook = async (doctor: Doctor) => {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }
    try {
      await api.post('/api/user/history', { targetType: 'hospital', targetId: Number(id) });
    } catch { /* ignore */ }
    setBookingModal({
      visible: true,
      contactPerson: data?.hospital.contactPerson ?? doctor.nameZh,
      contactInfo:   data?.hospital.contactInfo   ?? data?.hospital.phone ?? null,
    });
  };

  if (loading) return <div className="page-loading"><Spin size="large" /></div>;
  if (!data)   return null;

  const { hospital, doctors, equipments, environments, mediaList } = data;
  const hospitalName  = isZh ? hospital.nameZh : hospital.nameEn;
  const hospitalIntro = isZh ? hospital.introZh : hospital.introEn;

  return (
    <div className="page-wrapper">
      <Header />
      <main className="page-main">
        <section id="hd-intro" className="hd-intro-wrap">
          <MediaCarousel mediaList={mediaList ?? []} />

          <div className="hd-hero">
            <div className="hd-hero__inner">
              <Title level={1} className="hd-hero__title">{hospitalName}</Title>
              <Paragraph className="hd-hero__intro">{hospitalIntro}</Paragraph>
            </div>
          </div>
        </section>

        {equipments.length > 0 && (
          <SectionBlock
            id="hd-equipment"
            icon={<MedicineBoxOutlined />}
            title={isZh ? '高端医疗设备' : 'Premium Medical Equipment'}
          >
            <SectionCarousel
              items={equipments}
              renderCard={(eq) => <EquipCard item={eq} isZh={isZh} />}
              theme="light"
            />
          </SectionBlock>
        )}

        {environments && environments.length > 0 && (
          <SectionBlock
            id="hd-environment"
            icon={<HomeOutlined />}
            title={isZh ? '舒适诊疗环境' : 'Comfortable Treatment Environment'}
            alt
          >
            <SectionCarousel
              items={environments}
              renderCard={(env) => <EnvCard item={env} isZh={isZh} />}
              theme="light"
            />
          </SectionBlock>
        )}

        {doctors.length > 0 && (
          <SectionBlock
            id="hd-doctors"
            icon={<UserOutlined />}
            title={t('hospital.doctors')}
          >
            <SectionCarousel
              items={doctors}
              renderCard={(doc) => <DoctorCard doc={doc} isZh={isZh} onBook={handleBook} />}
              theme="light"
            />
          </SectionBlock>
        )}
      </main>

      <BookingModal
        visible={bookingModal.visible}
        onClose={() => setBookingModal(s => ({ ...s, visible: false }))}
        contactPerson={bookingModal.contactPerson}
        contactInfo={bookingModal.contactInfo}
      />
    </div>
  );
}
