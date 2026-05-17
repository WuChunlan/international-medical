import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Spin,
  message,
  Button,
  Table,
  Typography,
  Divider,
  Tag,
} from 'antd';
import { ShoppingOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import api from '../../api';
import { useAuthStore } from '../../store/authStore';
import Header from '../../components/Header';
import BookingModal from '../../components/BookingModal';
import MediaCarousel from '../../components/MediaCarousel';
import type { ProductDetail, ProductVariant } from '../../types';

const { Title, Paragraph } = Typography;

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const user = useAuthStore((s) => s.user);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProductDetail | null>(null);
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
      .get<ProductDetail>(`/api/products/${id}`)
      .then((res) => setData(res.data))
      .catch(() => message.error('Failed to load product details'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleBook = async () => {
    if (!user) {
      const redirect = encodeURIComponent(location.pathname);
      navigate(`/login?redirect=${redirect}`);
      return;
    }
    try {
      await api.post('/api/user/history', {
        targetType: 'product',
        targetId: Number(id),
      });
    } catch {
    }
    setBookingModal({
      visible: true,
      contactPerson: data?.product.contactPerson ?? null,
      contactInfo: data?.product.contactInfo ?? null,
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

  const { product, variants, mediaList } = data;
  const productName = isZh ? product.nameZh : product.nameEn;
  const productSummary = isZh ? product.summaryZh : product.summaryEn;
  const productDetail = isZh ? product.detailZh : product.detailEn;

  const columns = [
    {
      title: isZh ? '套餐名称' : 'Package',
      dataIndex: isZh ? 'nameZh' : 'nameEn',
      key: 'name',
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: isZh ? '描述' : 'Description',
      key: 'desc',
      render: (_: unknown, record: ProductVariant) => (
        <span>{isZh ? record.descZh ?? '—' : record.descEn ?? '—'}</span>
      ),
    },
    {
      title: isZh ? '价格' : 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price: number | null) =>
        price != null ? (
          <Tag className="variant-price-tag">
            ¥{price.toLocaleString()}
          </Tag>
        ) : (
          <span>—</span>
        ),
    },
    {
      title: isZh ? '操作' : 'Action',
      key: 'action',
      render: (_: unknown, record: ProductVariant) => (
        <Button
          type="primary"
          size="small"
          className="book-btn"
          onClick={() => handleBook()}
        >
          {t('product.book')}
        </Button>
      ),
    },
  ];

  return (
    <div className="page-wrapper">
      <Header />

      <main className="page-main">
        {/* Banner carousel */}
        <MediaCarousel mediaList={mediaList ?? []} />

        {/* Product hero info */}
        <section className="product-hero">
          <div className="product-hero__info">
            <Title level={1} className="product-title">
              {productName}
            </Title>
            <Paragraph className="product-summary">{productSummary}</Paragraph>

            {(product.priceMin != null || product.priceMax != null) && (
              <div className="product-price-range">
                {product.priceMin != null && (
                  <span>¥{product.priceMin.toLocaleString()}</span>
                )}
                {product.priceMin != null && product.priceMax != null && (
                  <span> — </span>
                )}
                {product.priceMax != null && (
                  <span>¥{product.priceMax.toLocaleString()}</span>
                )}
              </div>
            )}

            <Button
              type="primary"
              size="large"
              icon={<ShoppingOutlined />}
              className="book-btn book-btn--hero"
              onClick={() => handleBook()}
            >
              {t('product.book')}
            </Button>
          </div>
        </section>

        {/* Detail content */}
        {productDetail && (
          <section className="section-block">
            <div className="section-inner">
              <Title level={2} className="section-title">
                {t('product.title')}
              </Title>
              <Divider />
              <div
                className="product-detail-html"
                dangerouslySetInnerHTML={{ __html: productDetail }}
              />
            </div>
          </section>
        )}

        {/* Variants table */}
        {variants.length > 0 && (
          <section className="section-block section-block--alt">
            <div className="section-inner">
              <Title level={2} className="section-title">
                {t('product.variants')}
              </Title>
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
        visible={bookingModal.visible}
        onClose={() => setBookingModal((s) => ({ ...s, visible: false }))}
        contactPerson={bookingModal.contactPerson}
        contactInfo={bookingModal.contactInfo}
      />
    </div>
  );
}
