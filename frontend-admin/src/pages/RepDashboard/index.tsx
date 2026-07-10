import React, { useEffect, useState } from 'react'
import { Card, Statistic, Button, Space, Typography, Table, message, Tag, Row, Col } from 'antd'
import { QrcodeOutlined, CopyOutlined } from '@ant-design/icons'
import api from '../../api'
import InviteQrModal from '../../components/InviteQrModal'

interface RepMe {
  inviteCode: string | null
  canInvite: number
  customerCount: number
  name: string
}

interface CustomerRecord {
  id: number
  firstName: string | null
  lastName: string | null
  email: string
  phone: string | null
  createdAt: string
}

interface CustomerPage {
  records: CustomerRecord[]
  total: number
}

const RepDashboard: React.FC = () => {
  const [me, setMe] = useState<RepMe | null>(null)
  const [custList, setCustList] = useState<CustomerRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [qrOpen, setQrOpen] = useState(false)

  useEffect(() => {
    api.get('/api/rep/me')
      .then((res) => setMe(res.data?.data ?? res.data))
      .catch(() => {})

    const fetchCustomers = async () => {
      setLoading(true)
      setCustList([])
      try {
        const res = await api.get('/api/rep/customers', { params: { page: 1, size: 100 } })
        const d = res.data?.data ?? res.data as CustomerPage | undefined
        setCustList(d?.records ?? [])
      } catch {
        setCustList([])
        message.error('获取客户列表失败')
      } finally {
        setLoading(false)
      }
    }

    fetchCustomers()
  }, [])

  const copyCode = async () => {
    if (!me?.inviteCode) return
    try {
      await navigator.clipboard.writeText(me.inviteCode)
      message.success('邀请码已复制')
    } catch {
      message.error('复制失败')
    }
  }

  return (
    <div className="page-card">
      <div className="page-header">
        <h3 className="page-title">我的邀请</h3>
        <p className="page-description">你的专属邀请码与名下客户</p>
      </div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <div>
                <Typography.Text type="secondary">我的邀请码</Typography.Text>
                <div>
                  <Typography.Text code style={{ fontSize: 20 }}>{me?.inviteCode ?? '-'}</Typography.Text>
                  <Button type="text" icon={<CopyOutlined />} onClick={copyCode} />
                </div>
              </div>
              {me?.canInvite === 0 && <Tag color="error">邀请权限已被关闭，邀请码当前无效</Tag>}
              <Button type="primary" icon={<QrcodeOutlined />} onClick={() => setQrOpen(true)} disabled={!me?.inviteCode}>
                查看邀请二维码
              </Button>
            </Space>
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Statistic title="我的客户总数" value={me?.customerCount ?? 0} />
          </Card>
        </Col>
      </Row>

      <Card title="我的客户">
        <Table
          rowKey="id"
          size="small"
          loading={loading}
          dataSource={custList}
          pagination={false}
          columns={[
            { title: '姓名', render: (_, r: CustomerRecord) => [r.lastName, r.firstName].filter(Boolean).join(' ') || '-' },
            { title: '邮箱', dataIndex: 'email', ellipsis: true },
            { title: '手机号', dataIndex: 'phone', render: (v: string | null) => v || '-' },
            { title: '注册时间', dataIndex: 'createdAt', width: 170 },
          ]}
        />
      </Card>

      <InviteQrModal open={qrOpen} inviteCode={me?.inviteCode ?? null} onClose={() => setQrOpen(false)} />
    </div>
  )
}

export default RepDashboard
