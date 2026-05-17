import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Spin,
  message,
  Avatar,
  Tag,
  Button,
  Card,
  Row,
  Col,
  Typography,
  Divider,
} from 'antd';
import {
  UserOutlined,
  MedicineBoxOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import api from '../../api';
import { useAuthStore } from '../../store/authStore';
import Header from '../../components/Header';
import BookingModal from '../../components/BookingModal';
import MediaCarousel from '../../components/MediaCarousel';
import type { HospitalDetail, Doctor } from '../../types';

const { Title, Paragraph, Text } = Typography;

export default function HospitalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const user = useAuthStore((s) => s.user);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<HospitalDetail | null>(null);
  const [bookingModal, setBookingModal] = useState<{
    visible: boolean;
    contactPerson: string | null;
    contactInfo: string | null;
  }>({ visible: false, contactPerson: null, contactInfo: null });

  const isZh = i18n.language.startsWith('zh');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get<HospitalDetail>(`/api/hospitals/${id}`)
      .then((res) => setData(res.data))
      .catch(() => message.error('Failed to load hospital details'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleBook = async (doctor: Doctor) => {
    if (!user) {
      const redirect = encodeURIComponent(location.pathname);
      navigate(`/login?redirect=${redirect}`);
      return;
    }
    try {
      await api.post('/api/user/history', {
        targetType: 'hospital',
        targetId: Number(id),
      });
    } catch {
      // history recording failure is non-critical
    }
    setBookingModal({
      visible: true,
      contactPerson: data?.hospital.contactPerson ?? doctor.nameZh,
      contactInfo: data?.hospital.contactInfo ?? data?.hospital.phone ?? null,
    });
  };

  if (loading) {
    return (
      <div className="page-loading">
        <Spin size="large" />
      </div>
    );
  }

  if (!data) return null;

  const { hospital, doctors, equipments, mediaList } = data;
  const hospitalName = isZh ? hospital.nameZh : hospital.nameEn;
  const hospitalIntro = isZh ? hospital.introZh : hospital.introEn;
  // const hospitalAddress = isZh ? hospital.addressZh : hospital.addressEn;

  return (
    <div className="page-wrapper">
      <Header />

      <main className="page-main">
        {/* Banner carousel */}
        <MediaCarousel mediaList={mediaList ?? []} />

        {/* Hero info */}
        <section className="hospital-hero">
          <div className="hospital-hero__info">
            <Title level={1} className="hospital-title">
              {hospitalName}
            </Title>
            <Paragraph className="hospital-intro">{hospitalIntro}</Paragraph>

            {/* <div className="hospital-meta">
              {hospitalAddress && (
                <span className="hospital-meta__item">
                  <EnvironmentOutlined />
                  {hospitalAddress}
                </span>
              )}
              {hospital.phone && (
                <span className="hospital-meta__item">
                  <PhoneOutlined />
                  {hospital.phone}
                </span>
              )}
            </div> */}
          </div>
        </section>

        {/* Equipment section */}
        {equipments.length > 0 && (
          <section className="section-block">
            <div className="section-inner">
              <Title level={2} className="section-title">
                <MedicineBoxOutlined className="section-title-icon" />
                {t('hospital.equipment')}
              </Title>
              <Divider />
              <Row gutter={[24, 24]}>
                {equipments.map((eq) => (
                  <Col key={eq.id} xs={24} sm={12} md={8} lg={6}>
                    <Card
                      hoverable
                      cover={
                        eq.imageUrl ? (
                          <img
                            src={eq.imageUrl}
                            alt={isZh ? eq.nameZh : eq.nameEn}
                            className="equipment-img"
                          />
                        ) : (
                          <div className="equipment-img-placeholder">
                            <MedicineBoxOutlined />
                          </div>
                        )
                      }
                      className="equipment-card"
                    >
                      <Card.Meta
                        title={isZh ? eq.nameZh : eq.nameEn}
                        description={
                          isZh ? eq.descZh ?? '' : eq.descEn ?? ''
                        }
                      />
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          </section>
        )}

        {/* Doctors section */}
        {doctors.length > 0 && (
          <section className="section-block section-block--alt">
            <div className="section-inner">
              <Title level={2} className="section-title">
                <UserOutlined className="section-title-icon" />
                {t('hospital.doctors')}
              </Title>
              <Divider />
              <Row gutter={[24, 24]}>
                {doctors.map((doc) => {
                  const docName = isZh ? doc.nameZh : doc.nameEn;
                  const docTitle = isZh ? doc.titleZh : doc.titleEn;
                  const docSpecialty = isZh ? doc.specialtyZh : doc.specialtyEn;
                  const docBio = isZh ? doc.bioZh : doc.bioEn;

                  return (
                    <Col key={doc.id} xs={24} sm={12} md={8} lg={6}>
                      <Card className="doctor-card" hoverable>
                        <div className="doctor-card__header">
                          <Avatar
                            size={80}
                            src={doc.photoUrl ?? undefined}
                            icon={!doc.photoUrl ? <UserOutlined /> : undefined}
                            className="doctor-avatar"
                          />
                          <div className="doctor-card__name-block">
                            <Text strong className="doctor-name">
                              {docName}
                            </Text>
                            {docTitle && (
                              <Tag color="blue" className="doctor-title-tag">
                                {docTitle}
                              </Tag>
                            )}
                          </div>
                        </div>

                        <Tag color="cyan" className="doctor-specialty">
                          {docSpecialty}
                        </Tag>

                        {docBio && (
                          <Paragraph
                            ellipsis={{ rows: 3 }}
                            className="doctor-bio"
                          >
                            {docBio}
                          </Paragraph>
                        )}

                        {doc.pricePerVisit != null && (
                          <div className="doctor-price">
                            ¥{doc.pricePerVisit.toLocaleString()}
                            <span className="doctor-price__unit">
                              {isZh ? ' / 次' : ' / visit'}
                            </span>
                          </div>
                        )}

                        <Button
                          type="primary"
                          block
                          className="book-btn"
                          onClick={() => handleBook(doc)}
                        >
                          {t('hospital.book')}
                        </Button>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            </div>
          </section>
        )}
      </main>

      <BookingModal
        visible={bookingModal.visible}
        onClose={() => setBookingModal((s) => ({ ...s, visible: false }))}
        contactPerson={bookingModal.contactPerson}
        contactInfo={bookingModal.contactInfo}
      />
    </div>
  );
}
