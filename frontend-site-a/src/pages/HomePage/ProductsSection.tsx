import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api';
import type { ApiResult } from '../../api';
import type { SpecialProduct } from '../../types';
import './ProductsSection.less';

export default function ProductsSection() {
  const { t, i18n } = useTranslation();
  const [products, setProducts] = useState<SpecialProduct[]>([]);
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
    api.get<ApiResult<SpecialProduct[]>>('/api/products')
      .then(res => setProducts(res.data.data))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const lang = i18n.language === 'zh' ? 'zh' : 'en';

  return (
    <section
      id="products"
      ref={ref}
      className={`products-section section-reveal${visible ? ' section-reveal--visible' : ''}`}
    >
      <div className="section-container">
        <div className="section-header">
          <div className="section-header__eyebrow">
            <div className="section-header__line" />
            <span className="section-header__label">{t('products.section_subtitle')}</span>
            <div className="section-header__line" />
          </div>
          <h2 className="section-header__title section-header__title--dark">
            {t('products.section_title')}
          </h2>
          <div className="gold-divider" />
        </div>

        {loading ? (
          <div className="section-state section-state--dark">{t('common.loading')}</div>
        ) : products.length === 0 ? (
          <div className="section-state section-state--dark">{t('products.no_data')}</div>
        ) : (
          <div className="cards-grid cards-grid--products">
            {products.map((p, idx) => (
              <ProductCard key={p.id} product={p} lang={lang} index={idx} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ProductCard({ product, lang, index }: {
  product: SpecialProduct; lang: string; index: number;
}) {
  const { t } = useTranslation();
  const siteBUrl = import.meta.env.VITE_SITE_B_URL || 'http://localhost:3001';
  const name = lang === 'zh' ? product.nameZh : product.nameEn;
  const summary = lang === 'zh' ? product.summaryZh : product.summaryEn;

  const priceText = product.priceMin != null
    ? product.priceMin === product.priceMax
      ? `${product.priceMin.toLocaleString()} ${t('products.price_unit')}`
      : `${product.priceMin.toLocaleString()} - ${product.priceMax?.toLocaleString()} ${t('products.price_unit')}`
    : null;

  return (
    <div className="product-card">
      <div className="product-card__cover">
        {product.coverImageUrl ? (
          <img src={product.coverImageUrl} alt={name} />
        ) : (
          <div
            className="product-card__cover-placeholder"
            style={{
              background: `linear-gradient(135deg, hsl(${200 + index * 30}, 35%, 18%) 0%, hsl(${210 + index * 30}, 45%, 12%) 100%)`,
            }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="rgba(59,130,246,0.5)">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
        )}
        <div className="product-card__badge">
          <span>{String(index + 1).padStart(2, '0')}</span>
        </div>
      </div>

      <div className="product-card__content">
        <h3 className="product-card__name">{name}</h3>
        <p className="product-card__summary">{summary}</p>

        {priceText && (
          <div className="product-card__price-row">
            <span className="product-card__price-label">{t('products.price_range')}</span>
            <span className="product-card__price-value">{priceText}</span>
          </div>
        )}

        <div className="product-card__actions">
          <a
            href={`${siteBUrl}/product/${product.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="product-card__btn-outline"
          >
            {t('products.view_detail')}
          </a>
          <a
            href={`${siteBUrl}/product/${product.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="product-card__btn-primary"
          >
            {t('products.consult')}
          </a>
        </div>
      </div>
    </div>
  );
}
