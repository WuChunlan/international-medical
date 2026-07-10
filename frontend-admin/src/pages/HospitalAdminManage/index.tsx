import React, { useEffect, useState, useCallback } from 'react'
import {
  Table, Button, Space, Popconfirm, message, Tag,
  Drawer, Form, Input, Select,
} from 'antd'
import FormRow from '../../components/FormRow'
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined, StopOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import api from '../../api'
import type { User, Hospital } from '../../types'

const HospitalAdminManage: React.FC = () => {
  const [data, setData] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [current, setCurrent] = useState(1)
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [savingDrawer, setSavingDrawer] = useState(false)
  const [editRecord, setEditRecord] = useState<User | null>(null)
  const [form] = Form.useForm()

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const res = await api.get('/api/admin/users/hospital-admins', { params: { page, size: 10 } })
      const d = res.data?.data ?? res.data
      setData(d?.records ?? d?.list ?? [])
      setTotal(d?.total ?? 0)
    } catch {
      message.error('获取医院管理员列表失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData(current)
    api.get('/api/admin/hospitals', { params: { page: 1, size: 500 } }).then(res => {
      const d = res.data?.data ?? res.data
      setHospitals(d?.records ?? d?.list ?? [])
    }).catch(() => {})
  }, [fetchData, current])

  const openCreate = () => {
    setEditRecord(null)
    form.resetFields()
    setDrawerOpen(true)
  }

  const openEdit = (record: User) => {
    setEditRecord(record)
    form.setFieldsValue({ email: record.email, firstName: record.firstName, lastName: record.lastName, hospitalId: record.hospitalId })
    setDrawerOpen(true)
  }

  const handleSubmit = async () => {
    setSavingDrawer(true)
    try {
      const values = await form.validateFields()
      if (editRecord) {
        await api.put(`/api/admin/users/hospital-admins/${editRecord.id}`, values)
        message.success('更新成功')
      } else {
        await api.post('/api/admin/users/staff', { ...values, roleId: 3 })
        message.success('创建成功')
      }
      setDrawerOpen(false)
      fetchData(current)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; errorFields?: unknown[] }
      if (e.response?.data?.message) message.error(e.response.data.message)
      else if (!e.errorFields) message.error('操作失败')
    } finally {
      setSavingDrawer(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/admin/users/hospital-admins/${id}`)
      message.success('删除成功')
      fetchData(current)
    } catch {
      message.error('删除失败')
    }
  }

  const hospitalName = (id?: number | null) => {
    if (!id) return '-'
    const h = hospitals.find(x => x.id === id)
    return h ? h.nameZh : String(id)
  }

  const columns: ColumnsType<User> = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '姓名', width: 120, render: (_, r: User) => [r.lastName, r.firstName].filter(Boolean).join(' ') || '-' },
    { title: '邮箱', dataIndex: 'email', ellipsis: true },
    {
      title: '绑定医院', dataIndex: 'hospitalId',
      render: (v: number | null | undefined) => v ? hospitalName(v) : <Tag color="warning">未绑定</Tag>,
    },
    {
      title: '状态', dataIndex: 'isActive', width: 90,
      render: (v: number) => v === 1
        ? <Tag color="success" icon={<CheckCircleOutlined />}>正常</Tag>
        : <Tag color="error" icon={<StopOutlined />}>禁用</Tag>,
    },
    {
      title: '操作', width: 140,
      render: (_, record: User) => (
        <Space size={0}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>编辑</Button>
          <Popconfirm title="确认删除该账号？" onConfirm={() => handleDelete(record.id)} okText="确认" cancelText="取消">
            <Button type="text" danger size="small" icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="page-card">
      <div className="page-header">
        <h3 className="page-title">医院管理员账号</h3>
        <p className="page-description">管理各医院的后台管理员账号</p>
      </div>
      <div className="page-toolbar">
        <div className="toolbar-left" />
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增管理员</Button>
      </div>
      <Table
        rowKey="id"
        size="middle"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{ current, pageSize: 10, total, showTotal: t => `共 ${t} 条`, position: ['bottomRight'], size: 'small', onChange: setCurrent }}
      />

      <Drawer
        title={editRecord ? '编辑医院管理员' : '新增医院管理员'}
        width={720}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        destroyOnClose
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setDrawerOpen(false)}>取消</Button>
            <Button type="primary" onClick={handleSubmit} loading={savingDrawer}>保存</Button>
          </div>
        }
      >
        <Form form={form} layout="vertical">
          <FormRow>
            <Form.Item name="email" label="邮箱" rules={[{ required: true, type: 'email' }]}>
              <Input placeholder="登录邮箱" />
            </Form.Item>
            <Form.Item
              name="password"
              label={editRecord ? '新密码（留空不修改）' : '初始密码'}
              rules={editRecord ? [] : [{ required: true, min: 6, message: '至少6位' }]}
            >
              <Input.Password placeholder={editRecord ? '留空则不修改密码' : '至少6位'} />
            </Form.Item>
          </FormRow>
          <FormRow>
            <Form.Item name="lastName" label="姓"><Input /></Form.Item>
            <Form.Item name="firstName" label="名"><Input /></Form.Item>
          </FormRow>
          <Form.Item name="hospitalId" label="绑定医院（可留空，让管理员自行创建）">
            <Select
              placeholder="选择已有医院，或留空由管理员创建"
              allowClear
              showSearch
              filterOption={(input, option) => String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              options={hospitals.map(h => ({ value: h.id, label: h.nameZh }))}
            />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  )
}

export default HospitalAdminManage
