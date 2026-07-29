import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin, Typography, Divider } from 'antd';
import { ArrowLeftOutlined, BankOutlined, CalendarOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import api from '../../api';
import Header from '../../components/Header';
import type { MedicalCase } from '../../types';
import './index.less';

const { Title, Paragraph } = Typography;

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isZh = i18n.language.startsWith('zh');

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MedicalCase | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get<MedicalCase>(`/api/cases/${id}`)
      .then(res => {
        if (res.data) {
          setData(res.data);
        } else {
          setData(null);
          setTimeout(() => navigate('/', { replace: true }), 2000);
        }
      })
      .catch(() => {
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="page-wrapper">
        <Header />
        <main className="page-main">
          <div className="page-loading"><Spin size="large" /></div>
        </main>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page-wrapper">
        <Header />
        <main className="page-main">
          <div className="page-loading">
            <Paragraph>{t('common.not_found')}</Paragraph>
            <Paragraph style={{ color: '#888', fontSize: '0.85rem' }}>{isZh ? '即将返回首页...' : 'Redirecting to home...'}</Paragraph>
          </div>
        </main>
      </div>
    );
  }

  const title = isZh ? data.titleZh : data.titleEn;
  const summary = isZh ? data.summaryZh : data.summaryEn;
  const detail = isZh ? data.detailZh : data.detailEn;
  const hospitalName = isZh ? data.hospitalNameZh : data.hospitalNameEn;
  const createdAt = data.createdAt ? data.createdAt.slice(0, 10) : null;

  return (
    <div className="page-wrapper">
      <Header />
      <main className="page-main">

        {/* Hero */}
        {data.coverImageUrl ? (
          <div className="case-hero">
            <img className="case-hero__img" src={data.coverImageUrl} alt={title ?? ''} />
            <div className="case-hero__overlay">
              <div>
                <h1 className="case-hero__title">{title}</h1>
                {summary && <p className="case-hero__summary">{summary}</p>}
                <div className="case-meta">
                  {hospitalName && (
                    <span className="case-meta__item">
                      <BankOutlined /> {hospitalName}
                    </span>
                  )}
                  {createdAt && (
                    <span className="case-meta__item">
                      <CalendarOutlined /> {createdAt}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="case-hero__no-img">
            <h1 className="case-hero__title">{title}</h1>
            {summary && <p className="case-hero__summary">{summary}</p>}
            <div className="case-meta">
              {hospitalName && (
                <span className="case-meta__item">
                  <BankOutlined /> {hospitalName}
                </span>
              )}
              {createdAt && (
                <span className="case-meta__item">
                  <CalendarOutlined /> {createdAt}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Detail content */}
        {detail && (
          <section className="section-block">
            <div className="section-inner">
              <button
                className="case-back-btn"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0067ED', padding: 0, fontSize: '0.9rem' }}
                onClick={() => navigate(-1)}
              >
                <ArrowLeftOutlined /> {isZh ? '返回' : 'Back'}
              </button>
              <Title level={2} className="section-title">
                {isZh ? '案例详情' : 'Case Detail'}
              </Title>
              <Divider />
              <div className="case-detail-html" dangerouslySetInnerHTML={{ __html: detail }} />
            </div>
          </section>
        )}

        {/* No detail fallback */}
        {!detail && (
          <section className="section-block">
            <div className="section-inner">
              <button
                className="case-back-btn"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0067ED', padding: 0, fontSize: '0.9rem' }}
                onClick={() => navigate(-1)}
              >
                <ArrowLeftOutlined /> {isZh ? '返回' : 'Back'}
              </button>
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
