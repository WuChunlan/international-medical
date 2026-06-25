import React, { useEffect, useState } from 'react'
import { Col, Row, Spin, Typography, Card } from 'antd'
import api from '../../api'
import { useAdminAuthStore } from '../../store/authStore'

const { Text } = Typography

const Dashboard: React.FC = () => {
  const { username, role } = useAdminAuthStore()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ hospitals: 0, products: 0, users: 0, cases: 0 })

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      try {
        if (role === 'admin') {
          const [hospitalsRes, productsRes, usersRes, casesRes] = await Promise.allSettled([
            api.get('/api/admin/hospitals', { params: { page: 1, size: 1 } }),
            api.get('/api/admin/products', { params: { page: 1, size: 1 } }),
            api.get('/api/admin/users', { params: { page: 1, size: 1 } }),
            api.get('/api/admin/cases', { params: { page: 1, size: 1 } }),
          ])
          const getTotal = (res: PromiseSettledResult<{ data: { total?: number } }>) =>
            res.status === 'fulfilled' ? (res.value.data?.total ?? 0) : 0
          setStats({
            hospitals: getTotal(hospitalsRes as PromiseSettledResult<{ data: { total?: number } }>),
            products:  getTotal(productsRes  as PromiseSettledResult<{ data: { total?: number } }>),
            users:     getTotal(usersRes     as PromiseSettledResult<{ data: { total?: number } }>),
            cases:     getTotal(casesRes     as PromiseSettledResult<{ data: { total?: number } }>),
          })
        }
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [role])

  const statCards = [
    { label: '医院总数', value: stats.hospitals, accent: 'accent-primary' },
    { label: '用户总数', value: stats.users,     accent: 'accent-blue'    },
    { label: '产品总数', value: stats.products,  accent: 'accent-green'   },
    { label: '案例总数', value: stats.cases,     accent: 'accent-amber'   },
  ]

  return (
    <div className="page-card">
      <div className="page-header">
        <h3 className="page-title">欢迎回来，{username || 'admin'}</h3>
        <p className="page-description">国际医疗管理后台</p>
      </div>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          {statCards.map(card => (
            <Col xs={24} sm={12} lg={6} key={card.label}>
              <div className={`stat-card ${card.accent}`}>
                <div className="stat-value">{card.value}</div>
                <div className="stat-label">{card.label}</div>
              </div>
            </Col>
          ))}
        </Row>
      </Spin>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card title="系统概览" styles={{ header: { fontSize: 14, fontWeight: 600 } }}>
            <Text type="secondary">
              欢迎使用国际医疗旅游平台管理后台。您可以通过左侧菜单管理医院、医生、产品、用户等信息。
            </Text>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
