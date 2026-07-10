import React, { useEffect, useState, useCallback } from 'react'
import {
  Table, Button, Space, Popconfirm, message, Tag, Switch,
  Drawer, Form, Input, Typography,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, QrcodeOutlined, CopyOutlined, TeamOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import api from '../../api'
import InviteQrModal from '../../components/InviteQrModal'
import type { User } from '../../types'

interface RepRow {
  id: number; email: string; firstName: string | null; lastName: string | null
  inviteCode: string | null; canInvite: number; isActive: number; customerCount: number
}

const CustomerRepManage: React.FC = () => {
  const [data, setData] = useState<RepRow[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [current, setCurrent] = useState(1)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editRecord, setEditRecord] = useState<RepRow | null>(null)
  const [form] = Form.useForm()
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [custDrawer, setCustDrawer] = useState<RepRow | null>(null)
  const [custList, setCustList] = useState<User[]>([])

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const res = await api.get('/api/admin/customer-reps', { params: { page, size: 10 } })
      const d = res.data?.data ?? res.data
      setData(d?.records ?? [])
      setTotal(d?.total ?? 0)
    } catch { message.error('获取客户代表列表失败') } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData(current) }, [fetchData, current])

  const openCreate = () => { setEditRecord(null); form.resetFields(); setDrawerOpen(true) }
  const openEdit = (r: RepRow) => {
    setEditRecord(r)
    form.setFieldsValue({ email: r.email, firstName: r.firstName, lastName: r.lastName })
    setDrawerOpen(true)
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const values = await form.validateFields()
      if (editRecord) {
        await api.put(`/api/admin/customer-reps/${editRecord.id}`, values)
        message.success('更新成功')
      } else {
        await api.post('/api/admin/customer-reps', values)
        message.success('创建成功，邀请码已生成')
      }
      setDrawerOpen(false); fetchData(current)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; errorFields?: unknown[] }
      if (e.response?.data?.message) message.error(e.response.data.message)
      else if (!e.errorFields) message.error('操作失败')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: number) => {
    try { await api.delete(`/api/admin/customer-reps/${id}`); message.success('删除成功'); fetchData(current) }
    catch { message.error('删除失败') }
  }

  const toggleInvite = async (r: RepRow) => {
    try { await api.put(`/api/admin/customer-reps/${r.id}/toggle-invite`); fetchData(current) }
    catch { message.error('切换失败') }
  }

  const openCustomers = async (r: RepRow) => {
    setCustList([])
    setCustDrawer(r)
    try {
      const res = await api.get(`/api/admin/customer-reps/${r.id}/customers`, { params: { page: 1, size: 100 } })
      const d = res.data?.data ?? res.data
      setCustList(d?.records ?? [])
    } catch { setCustList([]); message.error('获取客户列表失败') }
  }

  const copyCode = async (code: string | null) => {
    if (!code) return
    await navigator.clipboard.writeText(code); message.success('邀请码已复制')
  }

  const columns: ColumnsType<RepRow> = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '姓名', width: 120, render: (_, r) => [r.lastName, r.firstName].filter(Boolean).join(' ') || '-' },
    { title: '邮箱', dataIndex: 'email', ellipsis: true },
    {
      title: '邀请码', dataIndex: 'inviteCode', width: 150,
      render: (v: string | null) => v
        ? <Space><Typography.Text code>{v}</Typography.Text><Button type="text" size="small" icon={<CopyOutlined />} onClick={() => copyCode(v)} /></Space>
        : '-',
    },
    {
      title: '客户数', dataIndex: 'customerCount', width: 100,
      render: (v: number, r) => <Button type="link" size="small" icon={<TeamOutlined />} onClick={() => openCustomers(r)}>{v ?? 0}</Button>,
    },
    {
      title: '邀请权限', dataIndex: 'canInvite', width: 100,
      render: (v: number, r) => <Switch checked={v === 1} onChange={() => toggleInvite(r)} />,
    },
    {
      title: '状态', dataIndex: 'isActive', width: 80,
      render: (v: number) => v === 1 ? <Tag color="success">正常</Tag> : <Tag color="error">禁用</Tag>,
    },
    {
      title: '操作', width: 200,
      render: (_, r) => (
        <Space size={0}>
          <Button type="text" size="small" icon={<QrcodeOutlined />} onClick={() => setQrCode(r.inviteCode)}>二维码</Button>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button>
          <Popconfirm title="确认删除该代表？" onConfirm={() => handleDelete(r.id)} okText="确认" cancelText="取消">
            <Button type="text" danger size="small" icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="page-card">
      <div className="page-header">
        <h3 className="page-title">客户代表</h3>
        <p className="page-description">管理客户代表账号、邀请码与名下客户</p>
      </div>
      <div className="page-toolbar">
        <div className="toolbar-left" />
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增客户代表</Button>
      </div>
      <Table rowKey="id" size="middle" columns={columns} dataSource={data} loading={loading}
        pagination={{ current, pageSize: 10, total, showTotal: t => `共 ${t} 条`, position: ['bottomRight'], size: 'small', onChange: setCurrent }} />

      <Drawer title={editRecord ? '编辑客户代表' : '新增客户代表'} width={520} open={drawerOpen}
        onClose={() => setDrawerOpen(false)} destroyOnClose
        footer={<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={() => setDrawerOpen(false)}>取消</Button>
          <Button type="primary" onClick={handleSubmit} loading={saving}>保存</Button>
        </div>}>
        <Form form={form} layout="vertical">
          <Form.Item name="email" label="邮箱" rules={[{ required: true, type: 'email' }]}><Input placeholder="登录邮箱" /></Form.Item>
          <Form.Item name="password" label={editRecord ? '新密码（留空不修改）' : '初始密码'}
            rules={editRecord ? [] : [{ required: true, min: 8, message: '至少8位' }]}>
            <Input.Password placeholder={editRecord ? '留空则不修改密码' : '至少8位'} />
          </Form.Item>
          <Form.Item name="lastName" label="姓"><Input /></Form.Item>
          <Form.Item name="firstName" label="名"><Input /></Form.Item>
          {editRecord && <Form.Item label="邀请码"><Typography.Text code>{editRecord.inviteCode}</Typography.Text></Form.Item>}
        </Form>
      </Drawer>

      <InviteQrModal open={qrCode !== null} inviteCode={qrCode} onClose={() => setQrCode(null)} />

      <Drawer title={`${custDrawer ? [custDrawer.lastName, custDrawer.firstName].filter(Boolean).join(' ') : ''} 名下客户`}
        width={640} open={custDrawer !== null} onClose={() => setCustDrawer(null)} destroyOnClose>
        <Table rowKey="id" size="small" dataSource={custList} pagination={false}
          columns={[
            { title: '姓名', render: (_, r: User) => [r.lastName, r.firstName].filter(Boolean).join(' ') || '-' },
            { title: '邮箱', dataIndex: 'email', ellipsis: true },
            { title: '手机号', dataIndex: 'phone', render: (v) => v || '-' },
            { title: '注册时间', dataIndex: 'createdAt', width: 170 },
          ]} />
      </Drawer>
    </div>
  )
}

export default CustomerRepManage
