import React, { useEffect, useState, useCallback } from 'react'
import { Table, Button, Space, Popconfirm, message, Drawer, Form, Input } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import api from '../../api'
import type { SpecialProduct } from '../../types'
import { StatusTag } from '../../components/StatusTag'
import FormRow from '../../components/FormRow'

const HAProductsPage: React.FC = () => {
  const [data, setData] = useState<SpecialProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [current, setCurrent] = useState(1)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editRecord, setEditRecord] = useState<SpecialProduct | null>(null)
  const [form] = Form.useForm()

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const res = await api.get('/api/hospital-admin/products', { params: { page, size: 10 } })
      const d = res.data?.data ?? res.data
      setData(d?.records ?? d?.list ?? [])
      setTotal(d?.total ?? 0)
    } catch {
      message.error('获取产品列表失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData(current) }, [fetchData, current])

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/hospital-admin/products/${id}`)
      message.success('删除成功')
      fetchData(current)
    } catch {
      message.error('删除失败')
    }
  }

  const openDrawer = (record?: SpecialProduct) => {
    setEditRecord(record ?? null)
    if (record) form.setFieldsValue(record); else form.resetFields()
    setDrawerOpen(true)
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const values = await form.validateFields()
      if (editRecord) {
        await api.put(`/api/hospital-admin/products/${editRecord.id}`, values)
        message.success('更新成功，等待审核')
      } else {
        await api.post('/api/hospital-admin/products', values)
        message.success('创建成功，等待审核')
      }
      setDrawerOpen(false)
      fetchData(current)
    } catch (err: unknown) {
      const error = err as { errorFields?: unknown[] }
      if (!error.errorFields) message.error('操作失败')
    } finally {
      setSaving(false)
    }
  }

  const columns: ColumnsType<SpecialProduct> = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '中文名称', dataIndex: 'nameZh', ellipsis: true },
    { title: '英文名称', dataIndex: 'nameEn', ellipsis: true },
    {
      title: '审核状态', dataIndex: 'auditStatus', width: 100,
      render: (v: string) => <StatusTag status={v as 'approved' | 'pending' | 'rejected'} />,
    },
    { title: '驳回原因', dataIndex: 'rejectionReason', ellipsis: true, render: (v: string | null) => v || '-' },
    {
      title: '操作', width: 120,
      render: (_, record: SpecialProduct) => (
        <Space size={0}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openDrawer(record)}>编辑</Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(record.id)} okText="确认" cancelText="取消">
            <Button type="text" danger size="small" icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="page-card">
      <div className="page-header">
        <h3 className="page-title">产品管理</h3>
        <p className="page-description">管理本院特需产品，提交后等待审核</p>
      </div>
      <div className="page-toolbar">
        <div className="toolbar-left" />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openDrawer()}>新增产品</Button>
      </div>
      <Table rowKey="id" size="middle" columns={columns} dataSource={data} loading={loading}
        pagination={{ current, pageSize: 10, total, showTotal: t => `共 ${t} 条`, position: ['bottomRight'], size: 'small', onChange: setCurrent }} />

      <Drawer
        title={editRecord ? '编辑产品' : '新增产品'}
        width={720}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setDrawerOpen(false)}>取消</Button>
            <Button type="primary" onClick={handleSubmit} loading={saving}>保存</Button>
          </div>
        }
      >
        <Form form={form} layout="vertical">
          <FormRow>
            <Form.Item name="nameZh" label="中文名称" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="nameEn" label="英文名称" rules={[{ required: true }]}><Input /></Form.Item>
          </FormRow>
          <Form.Item name="summaryZh" label="摘要(中文)" rules={[{ required: true }]}><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="summaryEn" label="摘要(英文)" rules={[{ required: true }]}><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="detailZh" label="详情(中文)"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="detailEn" label="详情(英文)"><Input.TextArea rows={3} /></Form.Item>
          <FormRow>
            <Form.Item name="priceMin" label="最低价格"><Input type="number" /></Form.Item>
            <Form.Item name="priceMax" label="最高价格"><Input type="number" /></Form.Item>
          </FormRow>
          <FormRow>
            <Form.Item name="contactPerson" label="联系人"><Input /></Form.Item>
            <Form.Item name="contactInfo" label="联系方式"><Input /></Form.Item>
          </FormRow>
          <Form.Item name="sortOrder" label="排序"><Input type="number" /></Form.Item>
        </Form>
      </Drawer>
    </div>
  )
}

export default HAProductsPage
