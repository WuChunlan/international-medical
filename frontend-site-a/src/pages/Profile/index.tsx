import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Spin,
  message,
  List,
  Button,
  Typography,
  Empty,
  Tag,
  Avatar,
} from 'antd';
import {
  BankOutlined,
  ShoppingOutlined,
  ClockCircleOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import api from '../../api';
import { useAuthStore } from '../../store/authStore';
import type { AuthState } from '../../store/authStore';
import Header from '../../components/Header';
import type { BrowseHistory } from '../../types';

const { Title, Text } = Typography;

export default function ProfilePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s: AuthState) => s.user);

  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<BrowseHistory[]>([]);

  const isZh = i18n.language.startsWith('zh');

  useEffect(() => {
    setLoading(true);
    api
      .get<BrowseHistory[]>('/api/user/history')
      .then((res) => setHistory(res.data))
      .catch(() => message.error('Failed to load history'))
      .finally(() => setLoading(false));
  }, []);

  const handleViewAgain = (record: BrowseHistory) => {
    if (record.targetType === 'hospital') {
      navigate(`/hospital/${record.targetId}`);
    } else {
      navigate(`/product/${record.targetId}`);
    }
  };

  return (
    <div className="page-wrapper">
      <Header />

      <main className="page-main">
        <section className="section-block">
          <div className="section-inner">
            <div className="profile-header">
              <Title level={2} className="section-title">
                {t('profile.title')}
              </Title>
              {user && (
                <Text type="secondary" className="profile-username">
                  @{user.username}
                </Text>
              )}
            </div>

            <Title level={3} className="profile-section-label">
              <ClockCircleOutlined className="section-title-icon" />
              {t('profile.history')}
            </Title>

            {loading ? (
              <div className="page-loading page-loading--inline">
                <Spin />
              </div>
            ) : history.length === 0 ? (
              <Empty
                description={t('profile.no_history')}
                className="profile-empty"
              />
            ) : (
              <List
                dataSource={history}
                className="history-list"
                renderItem={(record) => {
                  const name = isZh
                    ? record.targetNameZh
                    : record.targetNameEn;
                  const isHospital = record.targetType === 'hospital';
                  const dateStr = new Date(record.createdAt).toLocaleDateString(
                    isZh ? 'zh-CN' : 'en-US',
                    { year: 'numeric', month: 'long', day: 'numeric' }
                  );

                  return (
                    <List.Item
                      className="history-item"
                      actions={[
                        <Button
                          key="view"
                          type="primary"
                          ghost
                          icon={<ArrowRightOutlined />}
                          onClick={() => handleViewAgain(record)}
                        >
                          {t('profile.view_again')}
                        </Button>,
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            icon={
                              isHospital ? (
                                <BankOutlined />
                              ) : (
                                <ShoppingOutlined />
                              )
                            }
                            className={
                              isHospital
                                ? 'history-avatar history-avatar--hospital'
                                : 'history-avatar history-avatar--product'
                            }
                          />
                        }
                        title={
                          <span className="history-item__name">{name}</span>
                        }
                        description={
                          <span className="history-item__meta">
                            <Tag
                              color={isHospital ? 'blue' : 'green'}
                            >
                              {isHospital
                                ? t('profile.hospital_record')
                                : t('profile.product_record')}
                            </Tag>
                            <ClockCircleOutlined />
                            {dateStr}
                          </span>
                        }
                      />
                    </List.Item>
                  );
                }}
              />
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
