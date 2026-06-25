import React, { useCallback, useEffect, useState } from 'react'
import {
  Table, Button, Drawer, Form, Input, InputNumber, Switch,
  Space, Popconfirm, message, Image, Tooltip,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, TranslationOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import api from '../../api'
import type { ServiceTeam, PageResult } from '../../types'
import ImageUpload from '../../components/ImageUpload'
import { useAutoTranslate } from '../../hooks/useAutoTranslate'

const { TextArea } = Input

const ServiceTeamManage: React.FC = () => {
  'use no memo'
  const [teams, setTeams] = useState<ServiceTeam[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [savingDrawer, setSavingDrawer] = useState(false)
  const [editing, setEditing] = useState<ServiceTeam | null>(null)
  const [translating, setTranslating] = useState(false)
  const [form] = Form.useForm()
  const { translateField, translateAll } = useAutoTranslate(form)

  const fetchTeams = useCallback(async (p: number) => {
    setLoading(true)
    try {
      const res = await api.get<PageResult<ServiceTeam>>('/api/admin/service-teams', { params: { page: p, size: 10 } })
      setTeams(res.data.records)
      setTotal(res.data.total)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTeams(page) }, [fetchTeams, page])

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ sortOrder: 0, isActive: true })
    setDrawerOpen(true)
  }

  const openEdit = (record: ServiceTeam) => {
    setEditing(record)
    form.setFieldsValue({ ...record, isActive: record.isActive === 1 })
    setDrawerOpen(true)
  }

  const handleDelete = async (id: number) => {
    await api.delete(`/api/admin/service-teams/${id}`)
    message.success('删除成功')
    fetchTeams(page)
  }

  const handleSubmit = async () => {
    setSavingDrawer(true)
    try {
      const values = await form.validateFields()
      const payload = { ...values, isActive: values.isActive ? 1 : 0 }
      if (editing) {
        await api.put(`/api/admin/service-teams/${editing.id}`, payload)
        message.success('更新成功')
      } else {
        await api.post('/api/admin/service-teams', payload)
        message.success('创建成功')
      }
      setDrawerOpen(false)
      fetchTeams(page)
    } catch (err: unknown) {
      const error = err as { errorFields?: unknown[] }
      if (!error.errorFields) message.error('操作失败')
    } finally {
      setSavingDrawer(false)
    }
  }

  const handleTranslateAll = async () => {
    setTranslating(true)
    await translateAll()
    setTranslating(false)
    message.success('翻译完成')
  }

  const columns: ColumnsType<ServiceTeam> = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    {
      title: '图片', dataIndex: 'imageUrl', width: 80,
      render: url => url ? <Image src={url} width={50} height={50} style={{ objectFit: 'cover' }} /> : '-',
    },
    { title: '团队名称（中）', dataIndex: 'nameZh' },
    { title: '团队名称（英）', dataIndex: 'nameEn' },
    {
      title: '简介（中）', dataIndex: 'introZh',
      render: v => v ? <span style={{ fontSize: 12 }}>{v.slice(0, 40)}{v.length > 40 ? '...' : ''}</span> : '-',
    },
    { title: '排序', dataIndex: 'sortOrder', width: 70 },
    { title: '状态', dataIndex: 'isActive', width: 70, render: v => <Switch checked={v === 1} disabled size="small" /> },
    {
      title: '操作', width: 120,
      render: (_, record) => (
        <Space size={0}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>编辑</Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="text" danger size="small" icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="page-card">
      <div className="page-header">
        <h3 className="page-title">服务团队管理</h3>
        <p className="page-description">管理首页展示的服务团队信息</p>
      </div>
      <div className="page-toolbar">
        <div className="toolbar-left" />
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增团队</Button>
      </div>
      <Table
        rowKey="id"
        size="middle"
        columns={columns}
        dataSource={teams}
        loading={loading}
        pagination={{ current: page, total, pageSize: 10, position: ['bottomRight'], size: 'small', onChange: setPage }}
      />

      <Drawer
        title={editing ? '编辑服务团队' : '新增服务团队'}
        width={520}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setDrawerOpen(false)}>取消</Button>
            <Button type="primary" onClick={handleSubmit} loading={savingDrawer}>保存</Button>
          </div>
        }
      >
        <div style={{ textAlign: 'right', marginBottom: 12 }}>
          <Tooltip title="将所有中文字段自动翻译到对应英文字段（不覆盖已填写的英文内容）">
            <Button icon={<TranslationOutlined />} loading={translating} onClick={handleTranslateAll} size="small">
              一键翻译中→英
            </Button>
          </Tooltip>
        </div>
        <Form form={form} layout="vertical">
          <Form.Item name="nameZh" label="团队名称（中文）" rules={[{ required: true }]}>
            <Input placeholder="请输入中文名称" onBlur={() => translateField('nameZh')} />
          </Form.Item>
          <Form.Item name="nameEn" label="团队名称（英文）" rules={[{ required: true }]}>
            <Input placeholder="输入中文名称后可自动翻译" />
          </Form.Item>
          <Form.Item name="introZh" label="团队简介（中文）">
            <TextArea rows={3} placeholder="请输入中文简介" onBlur={() => translateField('introZh')} />
          </Form.Item>
          <Form.Item name="introEn" label="团队简介（英文）">
            <TextArea rows={3} placeholder="输入中文简介后可自动翻译" />
          </Form.Item>
          <Form.Item name="imageUrl" label="团队图片">
            <ImageUpload category="service-teams/images" label="上传图片" />
          </Form.Item>
          <Form.Item name="sortOrder" label="排序">
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item name="isActive" label="启用" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  )
}

export default ServiceTeamManage
