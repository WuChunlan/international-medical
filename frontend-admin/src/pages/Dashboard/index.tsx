import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Typography, Spin } from 'antd';
import {
  BankOutlined,
  MedicineBoxOutlined,
  TeamOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import api from '../../api';
import { useAdminAuthStore } from '../../store/authStore';
import './index.less';

const { Title, Text } = Typography;

interface StatItem {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

const Dashboard: React.FC = () => {
  const { username } = useAdminAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ hospitals: 0, products: 0, users: 0, cases: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const [hospitalsRes, productsRes, usersRes, casesRes] = await Promise.allSettled([
          api.get('/api/admin/hospitals', { params: { page: 1, size: 1 } }),
          api.get('/api/admin/products', { params: { page: 1, size: 1 } }),
          api.get('/api/admin/users', { params: { page: 1, size: 1 } }),
          api.get('/api/admin/cases', { params: { page: 1, size: 1 } }),
        ]);

        const getTotal = (res: PromiseSettledResult<{ data: { total?: number } }>) => {
          if (res.status === 'fulfilled') return res.value.data?.total ?? 0;
          return 0;
        };

        setStats({
          hospitals: getTotal(hospitalsRes as PromiseSettledResult<{ data: { total?: number } }>),
          products: getTotal(productsRes as PromiseSettledResult<{ data: { total?: number } }>),
          users: getTotal(usersRes as PromiseSettledResult<{ data: { total?: number } }>),
          cases: getTotal(casesRes as PromiseSettledResult<{ data: { total?: number } }>),
        });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statItems: StatItem[] = [
    { title: '医院总数', value: stats.hospitals, icon: <BankOutlined className="stat-icon-blue" />, color: '#e6f4ff' },
    { title: '产品总数', value: stats.products, icon: <MedicineBoxOutlined className="stat-icon-green" />, color: '#f6ffed' },
    { title: '用户总数', value: stats.users, icon: <TeamOutlined className="stat-icon-orange" />, color: '#fff7e6' },
    { title: '案例总数', value: stats.cases, icon: <FileTextOutlined className="stat-icon-purple" />, color: '#f9f0ff' },
  ];

  return (
    <div>
      <div className="dashboard-header">
        <Title level={4} className="page-title">欢迎回来，{username || 'admin'}</Title>
        <Text type="secondary">今天是个好日子，祝工作顺利！</Text>
      </div>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          {statItems.map((item) => (
            <Col xs={24} sm={12} lg={6} key={item.title}>
              <Card className="dashboard-stat-card" styles={{ body: { padding: '20px 24px' } }}>
                <div className="dashboard-stat-card__inner">
                  <Statistic
                    title={<span className="stat-title">{item.title}</span>}
                    value={item.value}
                    styles={{ content: { fontSize: 32, fontWeight: 700, color: '#001529' } }}
                  />
                  <div
                    className="dashboard-stat-card__icon-wrap"
                    style={{ background: item.color }}
                  >
                    {item.icon}
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Spin>

      <Row gutter={[16, 16]} className="dashboard-overview">
        <Col span={24}>
          <Card title="系统概览">
            <Text type="secondary">
              欢迎使用国际医疗旅游平台管理后台。您可以通过左侧菜单管理医院、医生、产品、用户等信息。
            </Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
