import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Spin, Row, Col, Card, Typography, Button, Tag } from 'antd';
import {
  BankOutlined,
  MedicineBoxOutlined,
  ShoppingOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import api from '../../api';
import Header from '../../components/Header';
import type { Hospital, SpecialProduct, Equipment } from '../../types';
import './index.less';

const { Title, Paragraph, Text } = Typography;

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language.startsWith('zh');

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [products, setProducts] = useState<SpecialProduct[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Hospital[]>('/api/hospitals'),
      api.get<SpecialProduct[]>('/api/products'),
      api.get<Equipment[]>('/api/equipments'),
    ])
      .then(([h, p, e]) => {
        setHospitals(h.data);
        setProducts(p.data);
        setEquipments(e.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="page-wrapper">
        <Header />
        <div className="page-loading">
          <Spin size="large" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <Header />

      <main className="page-main">
        {/* Hero */}
        <section className="home-hero">
          <div className="home-hero__inner">
            <div className="home-hero__badge">{t('home.badge')}</div>
            <Title level={1} className="home-hero__title">
              {t('home.hero_title')}
            </Title>
            <Paragraph className="home-hero__subtitle">
              {t('home.hero_subtitle')}
            </Paragraph>
            <div className="home-hero__actions">
              <a href="#hospitals" className="home-hero__btn home-hero__btn--primary">
                {t('home.explore_hospitals')}
              </a>
              <a href="#products" className="home-hero__btn home-hero__btn--ghost">
                {t('home.explore_products')}
              </a>
            </div>
          </div>
          <div className="home-hero__decoration" aria-hidden="true">
            <div className="home-hero__circle home-hero__circle--1" />
            <div className="home-hero__circle home-hero__circle--2" />
            <div className="home-hero__circle home-hero__circle--3" />
          </div>
        </section>

        {/* Hospitals */}
        {hospitals.length > 0 && (
          <section className="section-block" id="hospitals">
            <div className="section-inner">
              <div className="home-section-header">
                <div className="home-section-header__left">
                  <span className="home-section-header__icon"><BankOutlined /></span>
                  <Title level={2} className="section-title">
                    {t('home.hospitals')}
                  </Title>
                </div>
              </div>

              <Row gutter={[24, 24]} className="home-card-grid">
                {hospitals.map((h) => (
                  <Col key={h.id} xs={24} sm={12} lg={8}>
                    <Link to={`/hospital/${h.id}`} className="home-card-link">
                      <Card
                        hoverable
                        className="home-card"
                        cover={
                          h.coverImageUrl ? (
                            <img
                              src={h.coverImageUrl}
                              alt={isZh ? h.nameZh : h.nameEn}
                              className="home-card__cover"
                            />
                          ) : (
                            <div className="home-card__cover-placeholder">
                              <BankOutlined />
                            </div>
                          )
                        }
                      >
                        <Title level={4} className="home-card__title">
                          {isZh ? h.nameZh : h.nameEn}
                        </Title>
                        <Paragraph
                          ellipsis={{ rows: 2 }}
                          className="home-card__desc"
                        >
                          {isZh ? h.introZh : h.introEn}
                        </Paragraph>
                        <div className="home-card__footer">
                          <Button
                            type="link"
                            icon={<ArrowRightOutlined />}
                            className="home-card__link-btn"
                          >
                            {t('home.view_detail')}
                          </Button>
                        </div>
                      </Card>
                    </Link>
                  </Col>
                ))}
              </Row>
            </div>
          </section>
        )}

        {/* Products */}
        {products.length > 0 && (
          <section className="section-block section-block--alt" id="products">
            <div className="section-inner">
              <div className="home-section-header">
                <div className="home-section-header__left">
                  <span className="home-section-header__icon"><ShoppingOutlined /></span>
                  <Title level={2} className="section-title">
                    {t('home.products')}
                  </Title>
                </div>
              </div>

              <Row gutter={[24, 24]} className="home-card-grid">
                {products.map((p) => (
                  <Col key={p.id} xs={24} sm={12} lg={8}>
                    <Link to={`/product/${p.id}`} className="home-card-link">
                      <Card
                        hoverable
                        className="home-card"
                        cover={
                          p.coverImageUrl ? (
                            <img
                              src={p.coverImageUrl}
                              alt={isZh ? p.nameZh : p.nameEn}
                              className="home-card__cover"
                            />
                          ) : (
                            <div className="home-card__cover-placeholder">
                              <ShoppingOutlined />
                            </div>
                          )
                        }
                      >
                        <Title level={4} className="home-card__title">
                          {isZh ? p.nameZh : p.nameEn}
                        </Title>
                        <Paragraph
                          ellipsis={{ rows: 2 }}
                          className="home-card__desc"
                        >
                          {isZh ? p.summaryZh : p.summaryEn}
                        </Paragraph>
                        {(p.priceMin != null || p.priceMax != null) && (
                          <div className="home-card__price">
                            {p.priceMin != null && (
                              <Text className="home-card__price-value">
                                ¥{p.priceMin.toLocaleString()}
                              </Text>
                            )}
                            {p.priceMin != null && p.priceMax != null && (
                              <Text className="home-card__price-sep"> — </Text>
                            )}
                            {p.priceMax != null && (
                              <Text className="home-card__price-value">
                                ¥{p.priceMax.toLocaleString()}
                              </Text>
                            )}
                          </div>
                        )}
                        <div className="home-card__footer">
                          <Button
                            type="link"
                            icon={<ArrowRightOutlined />}
                            className="home-card__link-btn"
                          >
                            {t('home.view_detail')}
                          </Button>
                        </div>
                      </Card>
                    </Link>
                  </Col>
                ))}
              </Row>
            </div>
          </section>
        )}

        {/* Equipments */}
        {equipments.length > 0 && (
          <section className="section-block" id="equipments">
            <div className="section-inner">
              <div className="home-section-header">
                <div className="home-section-header__left">
                  <span className="home-section-header__icon"><MedicineBoxOutlined /></span>
                  <Title level={2} className="section-title">
                    {t('home.equipments')}
                  </Title>
                </div>
              </div>

              <Row gutter={[24, 24]} className="home-card-grid">
                {equipments.map((eq) => (
                  <Col key={eq.id} xs={24} sm={12} md={8} lg={6}>
                    <Card
                      hoverable
                      className="home-card home-card--equipment"
                      cover={
                        eq.imageUrl ? (
                          <img
                            src={eq.imageUrl}
                            alt={isZh ? eq.nameZh : eq.nameEn}
                            className="home-card__cover home-card__cover--sm"
                          />
                        ) : (
                          <div className="home-card__cover-placeholder home-card__cover-placeholder--sm">
                            <MedicineBoxOutlined />
                          </div>
                        )
                      }
                    >
                      <Title level={5} className="home-card__title">
                        {isZh ? eq.nameZh : eq.nameEn}
                      </Title>
                      {(isZh ? eq.descZh : eq.descEn) && (
                        <Paragraph
                          ellipsis={{ rows: 2 }}
                          className="home-card__desc"
                        >
                          {isZh ? eq.descZh : eq.descEn}
                        </Paragraph>
                      )}
                      {eq.hospitalId && (
                        <Tag color="blue" className="home-card__hospital-tag">
                          {t('home.equipment_tag')}
                        </Tag>
                      )}
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
