import React, { useEffect, useState } from 'react'
import { Col, Row, Spin, Typography, Card, Statistic, Badge, List, Tag, Alert, Button } from 'antd'
import {
  BankOutlined, UserOutlined, ShoppingOutlined, FileTextOutlined,
  AuditOutlined, CheckCircleOutlined, ClockCircleOutlined, TeamOutlined,
  QrcodeOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import api from '../../api'
import { useAdminAuthStore } from '../../store/authStore'

const { Text } = Typography

// ── Admin dashboard ──────────────────────────────────────────────
interface AdminStats { hospitals: number; products: number; users: number; cases: number }

const AdminDashboard: React.FC<{ username: string }> = ({ username }) => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<AdminStats>({ hospitals: 0, products: 0, users: 0, cases: 0 })
  const [pendingCount, setPendingCount] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const [hRes, pRes, uRes, cRes, ...pendingResults] = await Promise.allSettled([
          api.get('/api/admin/hospitals', { params: { page: 1, size: 1 } }),
          api.get('/api/admin/products', { params: { page: 1, size: 1 } }),
          api.get('/api/admin/users', { params: { page: 1, size: 1 } }),
          api.get('/api/admin/cases', { params: { page: 1, size: 1 } }),
          api.get('/api/reviewer/pending/hospitals'),
          api.get('/api/reviewer/pending/doctors'),
          api.get('/api/reviewer/pending/equipments'),
          api.get('/api/reviewer/pending/environments'),
          api.get('/api/reviewer/pending/cases'),
          api.get('/api/reviewer/pending/products'),
        ])
        const getTotal = (res: PromiseSettledResult<{ data: { total?: number } }>) =>
          res.status === 'fulfilled' ? (res.value.data?.total ?? 0) : 0
        const getLen = (res: PromiseSettledResult<{ data: unknown }>) => {
          if (res.status !== 'fulfilled') return 0
          const d = (res.value.data as { data?: unknown })?.data ?? res.value.data
          if (Array.isArray(d)) return d.length
          const r = d as { records?: unknown[]; list?: unknown[] }
          return (r?.records ?? r?.list ?? []).length
        }
        setStats({
          hospitals: getTotal(hRes as PromiseSettledResult<{ data: { total?: number } }>),
          products:  getTotal(pRes  as PromiseSettledResult<{ data: { total?: number } }>),
          users:     getTotal(uRes  as PromiseSettledResult<{ data: { total?: number } }>),
          cases:     getTotal(cRes  as PromiseSettledResult<{ data: { total?: number } }>),
        })
        setPendingCount(pendingResults.reduce((sum, r) => sum + getLen(r as PromiseSettledResult<{ data: unknown }>), 0))
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  const statCards = [
    { label: '医院总数', value: stats.hospitals, icon: <BankOutlined />, accent: 'accent-primary', path: '/hospitals' },
    { label: '用户总数', value: stats.users,     icon: <UserOutlined />,  accent: 'accent-blue',    path: '/users' },
    { label: '产品总数', value: stats.products,  icon: <ShoppingOutlined />, accent: 'accent-green', path: '/products' },
    { label: '案例总数', value: stats.cases,     icon: <FileTextOutlined />, accent: 'accent-amber', path: '/cases' },
  ]

  const quickLinks = [
    { label: '医院管理', path: '/hospitals', icon: <BankOutlined /> },
    { label: '医生管理', path: '/doctors', icon: <UserOutlined /> },
    { label: '产品管理', path: '/products', icon: <ShoppingOutlined /> },
    { label: '用户管理', path: '/users', icon: <TeamOutlined /> },
  ]

  return (
    <>
      <div className="page-header">
        <h3 className="page-title">欢迎回来，{username}</h3>
        <p className="page-description">超级管理员 · 国际医疗管理后台</p>
      </div>
      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          {statCards.map(card => (
            <Col xs={24} sm={12} lg={6} key={card.label}>
              <div className={`stat-card ${card.accent}`} style={{ cursor: 'pointer' }} onClick={() => navigate(card.path)}>
                <div className="stat-value">{card.value}</div>
                <div className="stat-label">{card.label}</div>
              </div>
            </Col>
          ))}
        </Row>

        {pendingCount > 0 && (
          <Alert
            style={{ marginTop: 16 }}
            type="warning"
            showIcon
            icon={<AuditOutlined />}
            message={
              <span>
                当前有 <strong>{pendingCount}</strong> 条内容待审核，请及时处理。
              </span>
            }
            action={
              <Button size="small" type="link" onClick={() => navigate('/reviewer/pending')}>
                查看审核队列
              </Button>
            }
          />
        )}

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={24}>
            <Card title="快捷入口" styles={{ header: { fontSize: 14, fontWeight: 600 } }}>
              <Row gutter={[12, 12]}>
                {quickLinks.map(l => (
                  <Col key={l.path} xs={12} sm={6}>
                    <Card
                      hoverable
                      size="small"
                      style={{ textAlign: 'center', cursor: 'pointer' }}
                      onClick={() => navigate(l.path)}
                    >
                      <div style={{ fontSize: 22, marginBottom: 4, color: '#2563EB' }}>{l.icon}</div>
                      <Text style={{ fontSize: 13 }}>{l.label}</Text>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>
        </Row>
      </Spin>
    </>
  )
}

// ── Hospital admin dashboard ─────────────────────────────────────
interface HAStats { doctors: number; equipments: number; products: number; cases: number; auditStatus?: string; rejectionReason?: string | null }

const HospitalAdminDashboard: React.FC<{ username: string }> = ({ username }) => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<HAStats>({ doctors: 0, equipments: 0, products: 0, cases: 0 })
  const navigate = useNavigate()

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const [hRes, dRes, eRes, pRes, cRes] = await Promise.allSettled([
          api.get('/api/hospital-admin/hospital'),
          api.get('/api/hospital-admin/doctors', { params: { page: 1, size: 1 } }),
          api.get('/api/hospital-admin/equipments', { params: { page: 1, size: 1 } }),
          api.get('/api/hospital-admin/products', { params: { page: 1, size: 1 } }),
          api.get('/api/hospital-admin/cases', { params: { page: 1, size: 1 } }),
        ])
        const getTotal = (res: PromiseSettledResult<{ data: { total?: number } }>) =>
          res.status === 'fulfilled' ? (res.value.data?.total ?? 0) : 0
        const hospital = hRes.status === 'fulfilled'
          ? ((hRes.value.data as { data?: HAStats })?.data ?? hRes.value.data as HAStats)
          : null
        setStats({
          auditStatus: hospital?.auditStatus,
          rejectionReason: hospital?.rejectionReason,
          doctors:    getTotal(dRes as PromiseSettledResult<{ data: { total?: number } }>),
          equipments: getTotal(eRes as PromiseSettledResult<{ data: { total?: number } }>),
          products:   getTotal(pRes as PromiseSettledResult<{ data: { total?: number } }>),
          cases:      getTotal(cRes as PromiseSettledResult<{ data: { total?: number } }>),
        })
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  const statCards = [
    { label: '医生数量', value: stats.doctors,    icon: <UserOutlined />,      accent: 'accent-primary', path: '/ha/doctors' },
    { label: '设备数量', value: stats.equipments,  icon: <BankOutlined />,      accent: 'accent-blue',    path: '/ha/equipments' },
    { label: '产品数量', value: stats.products,    icon: <ShoppingOutlined />,  accent: 'accent-green',   path: '/ha/products' },
    { label: '案例数量', value: stats.cases,       icon: <FileTextOutlined />,  accent: 'accent-amber',   path: '/ha/cases' },
  ]

  const auditStatusMap: Record<string, { color: string; text: string }> = {
    pending:  { color: 'processing', text: '审核中' },
    approved: { color: 'success',    text: '已通过' },
    rejected: { color: 'error',      text: '已驳回' },
  }
  const auditInfo = stats.auditStatus ? auditStatusMap[stats.auditStatus] : null

  return (
    <>
      <div className="page-header">
        <h3 className="page-title">欢迎回来，{username}</h3>
        <p className="page-description">医院管理员 · 管理你的医院信息</p>
      </div>
      <Spin spinning={loading}>
        {auditInfo && (
          <Alert
            style={{ marginBottom: 16 }}
            type={stats.auditStatus === 'rejected' ? 'error' : stats.auditStatus === 'approved' ? 'success' : 'info'}
            showIcon
            message={
              <span>医院审核状态：<Tag color={auditInfo.color}>{auditInfo.text}</Tag></span>
            }
            description={stats.rejectionReason ? `驳回原因：${stats.rejectionReason}` : undefined}
            action={
              <Button size="small" type="link" onClick={() => navigate('/ha/hospital')}>
                查看医院信息
              </Button>
            }
          />
        )}
        <Row gutter={[16, 16]}>
          {statCards.map(card => (
            <Col xs={24} sm={12} lg={6} key={card.label}>
              <div className={`stat-card ${card.accent}`} style={{ cursor: 'pointer' }} onClick={() => navigate(card.path)}>
                <div className="stat-value">{card.value}</div>
                <div className="stat-label">{card.label}</div>
              </div>
            </Col>
          ))}
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={24}>
            <Card title="提交须知" styles={{ header: { fontSize: 14, fontWeight: 600 } }}>
              <List
                size="small"
                dataSource={[
                  '医院信息、医生、设备、产品、案例等内容提交后需经过审核方可在前台展示。',
                  '被驳回的内容会在对应页面显示驳回原因，修改后可重新提交。',
                  '审核通过后的内容如需修改，修改提交后将重新进入审核流程。',
                ]}
                renderItem={item => (
                  <List.Item>
                    <Text type="secondary" style={{ fontSize: 13 }}>{item}</Text>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>
      </Spin>
    </>
  )
}

// ── Reviewer dashboard ───────────────────────────────────────────
const ReviewerDashboard: React.FC<{ username: string }> = ({ username }) => {
  const [loading, setLoading] = useState(true)
  const [counts, setCounts] = useState({ hospitals: 0, doctors: 0, equipments: 0, environments: 0, cases: 0, products: 0 })
  const navigate = useNavigate()

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const results = await Promise.allSettled([
          api.get('/api/reviewer/pending/hospitals'),
          api.get('/api/reviewer/pending/doctors'),
          api.get('/api/reviewer/pending/equipments'),
          api.get('/api/reviewer/pending/environments'),
          api.get('/api/reviewer/pending/cases'),
          api.get('/api/reviewer/pending/products'),
        ])
        const getLen = (res: PromiseSettledResult<{ data: unknown }>) => {
          if (res.status !== 'fulfilled') return 0
          const d = (res.value.data as { data?: unknown })?.data ?? res.value.data
          if (Array.isArray(d)) return d.length
          const r = d as { records?: unknown[]; list?: unknown[] }
          return (r?.records ?? r?.list ?? []).length
        }
        const [h, d, e, env, c, p] = results.map(r => getLen(r as PromiseSettledResult<{ data: unknown }>))
        setCounts({ hospitals: h, doctors: d, equipments: e, environments: env, cases: c, products: p })
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  const total = Object.values(counts).reduce((a, b) => a + b, 0)

  const items = [
    { label: '医院', count: counts.hospitals },
    { label: '医生', count: counts.doctors },
    { label: '设备', count: counts.equipments },
    { label: '诊疗环境', count: counts.environments },
    { label: '案例',  count: counts.cases },
    { label: '产品', count: counts.products },
  ]

  return (
    <>
      <div className="page-header">
        <h3 className="page-title">欢迎回来，{username}</h3>
        <p className="page-description">审核员 · 负责审核医院管理员提交的内容</p>
      </div>
      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Card style={{ textAlign: 'center' }}>
              <Statistic
                title="待审核总数"
                value={total}
                valueStyle={{ color: total > 0 ? '#D97706' : '#059669', fontSize: 36 }}
                prefix={total > 0 ? <ClockCircleOutlined /> : <CheckCircleOutlined />}
              />
              <Button
                type="primary"
                style={{ marginTop: 16 }}
                onClick={() => navigate('/reviewer/pending')}
                disabled={total === 0}
              >
                {total > 0 ? '前往审核' : '暂无待审核'}
              </Button>
            </Card>
          </Col>
          <Col xs={24} sm={16}>
            <Card title="各类别待审核数量" styles={{ header: { fontSize: 14, fontWeight: 600 } }}>
              <Row gutter={[8, 8]}>
                {items.map(item => (
                  <Col key={item.label} span={8}>
                    <Card size="small" style={{ textAlign: 'center' }}>
                      <Badge count={item.count} showZero color={item.count > 0 ? '#D97706' : '#9CA3AF'}>
                        <div style={{ padding: '8px 16px', fontSize: 13 }}>{item.label}</div>
                      </Badge>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={24}>
            <Card title="审核职责说明" styles={{ header: { fontSize: 14, fontWeight: 600 } }}>
              <List
                size="small"
                dataSource={[
                  '审核医院管理员提交的医院、医生、设备、诊疗环境、产品、案例等内容。',
                  '审核通过后内容将在前台正式展示；驳回时请填写具体原因以便管理员修改。',
                  '请尽快处理待审核内容，避免医院管理员长时间等待。',
                ]}
                renderItem={item => (
                  <List.Item>
                    <Text type="secondary" style={{ fontSize: 13 }}>{item}</Text>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>
      </Spin>
    </>
  )
}

// ── Customer rep dashboard ───────────────────────────────────────
const CustomerRepDashboard: React.FC<{ username: string }> = ({ username }) => {
  const [customerCount, setCustomerCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/api/rep/me')
      .then((res) => {
        const d = (res.data as { data?: { customerCount?: number }; customerCount?: number })?.data ?? res.data as { customerCount?: number }
        setCustomerCount(d?.customerCount ?? 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <div className="page-header">
        <h3 className="page-title">欢迎回来，{username}</h3>
        <p className="page-description">客户代表 · 管理你的邀请客户</p>
      </div>
      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Card style={{ textAlign: 'center' }}>
              <Statistic title="我的客户总数" value={customerCount} prefix={<TeamOutlined />} valueStyle={{ color: '#2563EB', fontSize: 36 }} />
              <Button
                type="primary"
                icon={<QrcodeOutlined />}
                style={{ marginTop: 16 }}
                onClick={() => navigate('/rep/dashboard')}
              >
                查看邀请码与客户
              </Button>
            </Card>
          </Col>
          <Col xs={24} sm={16}>
            <Card title="客户代表须知" styles={{ header: { fontSize: 14, fontWeight: 600 } }}>
              <List
                size="small"
                dataSource={[
                  '通过你的专属邀请码或二维码邀请客户注册，客户将归属在你名下。',
                  '在「我的邀请」页面可查看邀请码、二维码及所有名下客户信息。',
                  '如邀请权限被关闭，请联系超级管理员开启。',
                ]}
                renderItem={item => (
                  <List.Item>
                    <Text type="secondary" style={{ fontSize: 13 }}>{item}</Text>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>
      </Spin>
    </>
  )
}

// ── Root ─────────────────────────────────────────────────────────
const Dashboard: React.FC = () => {
  const { username, role } = useAdminAuthStore()
  const name = username || 'admin'

  return (
    <div className="page-card">
      {role === 'admin'          && <AdminDashboard         username={name} />}
      {role === 'hospital_admin' && <HospitalAdminDashboard username={name} />}
      {role === 'reviewer'       && <ReviewerDashboard      username={name} />}
      {role === 'customer_rep'   && <CustomerRepDashboard   username={name} />}
      {!role && (
        <>
          <div className="page-header">
            <h3 className="page-title">欢迎回来，{name}</h3>
            <p className="page-description">国际医疗管理后台</p>
          </div>
          <Card>
            <Text type="secondary">欢迎使用国际医疗旅游平台管理后台。</Text>
          </Card>
        </>
      )}
    </div>
  )
}

export default Dashboard
