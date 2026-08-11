import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Spin, message, Button, Table, Typography, Divider,
} from 'antd';
import { ShoppingOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import api from '../../api';
import { useAuthStore } from '../../store/authStore';
import type { AuthState } from '../../store/authStore';
import Header from '../../components/Header';
import BookingModal from '../../components/BookingModal';
import MediaCarousel from '../../components/MediaCarousel';
import { useContacts } from '../../hooks/useContacts';
import type { ProductDetail, ProductVariant } from '../../types';
import { t9n } from '../../utils/i18nField';

const { Title, Paragraph } = Typography;

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const user = useAuthStore((s: AuthState) => s.user);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProductDetail | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const contacts = useContacts();

  const lang = i18n.language;

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get<ProductDetail>(`/api/products/${id}`, { params: { lang } })
      .then((res) => setData(res.data))
      .catch(() => message.error('Failed to load product details'))
      .finally(() => setLoading(false));
  }, [id, lang]);

  const handleBook = async () => {
    if (!user) {
      const redirect = encodeURIComponent(location.pathname);
      navigate(`/login?redirect=${redirect}`);
      return;
    }
    try {
      await api.post('/api/user/history', { targetType: 'product', targetId: Number(id) });
    } catch { /* ignore */ }
    setBookingOpen(true);
  };

  if (loading) {
    return <div className="page-loading"><Spin size="large" /></div>;
  }
  if (!data) return null;

  const { product, variants, mediaList } = data;
  const productName    = t9n(product as unknown as Record<string, unknown>, 'name', lang);
  const productSummary = t9n(product as unknown as Record<string, unknown>, 'summary', lang);
  const productDetail  = t9n(product as unknown as Record<string, unknown>, 'detail', lang);

  const columns = [
    {
      title: t('product.variant_name'),
      key: 'name',
      render: (_: unknown, record: ProductVariant) => (
        <strong>{t9n(record as unknown as Record<string, unknown>, 'name', lang)}</strong>
      ),
    },
    {
      title: t('product.variant_desc'),
      key: 'desc',
      render: (_: unknown, record: ProductVariant) => (
        <span>{t9n(record as unknown as Record<string, unknown>, 'desc', lang) || '—'}</span>
      ),
    },
    {
      title: t('product.variant_action'),
      key: 'action',
      width: 110,
      render: () => (
        <Button type="primary" size="small" className="book-btn" onClick={handleBook}>
          {t('product.book')}
        </Button>
      ),
    },
  ];

  return (
    <div className="page-wrapper">
      <Header />
      <main className="page-main">
        <section id="pd-intro" className="pd-intro-wrap">
          <MediaCarousel mediaList={mediaList ?? []} />

          <div className="product-hero">
            <div className="product-hero__info">
              <Title level={1} className="product-title">{productName}</Title>
              <Paragraph className="product-summary">{productSummary}</Paragraph>
              <Button
                type="primary"
                size="large"
                icon={<ShoppingOutlined />}
                className="book-btn book-btn--hero"
                onClick={handleBook}
              >
                {t('product.book')}
              </Button>
            </div>
          </div>
        </section>

        {productDetail && (
          <section id="pd-detail" className="section-block">
            <div className="section-inner">
              <Title level={2} className="section-title">{t('product.title')}</Title>
              <Divider />
              <div className="product-detail-html" dangerouslySetInnerHTML={{ __html: productDetail }} />
            </div>
          </section>
        )}

        {variants.length > 0 && (
          <section id="pd-variants" className="section-block section-block--alt">
            <div className="section-inner">
              <Title level={2} className="section-title">{t('product.variants')}</Title>
              <Divider />
              <Table
                dataSource={variants}
                columns={columns}
                rowKey="id"
                pagination={false}
                className="variants-table"
              />
            </div>
          </section>
        )}
      </main>

      <BookingModal
        visible={bookingOpen}
        onClose={() => setBookingOpen(false)}
        contacts={contacts}
      />
    </div>
  );
}
