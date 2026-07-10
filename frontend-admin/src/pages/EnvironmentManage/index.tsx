import React, { useEffect, useState } from 'react'
import {
  Table, Button, Drawer, Form, Input, InputNumber, Switch,
  Space, Popconfirm, message, Select, Upload, Image,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import api from '../../api'
import type { Hospital, HospitalEnvironment } from '../../types'
import FormRow from '../../components/FormRow'

const { TextArea } = Input

const EnvironmentManage: React.FC = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [selectedHospitalId, setSelectedHospitalId] = useState<number | null>(null)
  const [environments, setEnvironments] = useState<HospitalEnvironment[]>([])
  const [loading, setLoading] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<HospitalEnvironment | null>(null)
  const [savingDrawer, setSavingDrawer] = useState(false)
  const [form] = Form.useForm()
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    api.get('/api/admin/hospitals', { params: { page: 1, size: 100 } })
      .then(res => { setHospitals(res.data.records || []) })
      .catch(() => {})
  }, [])

  const fetchEnvironments = async (hospitalId: number) => {
    setLoading(true)
    try {
      const res = await api.get<HospitalEnvironment[]>('/api/admin/hospital-environments', { params: { hospitalId } })
      setEnvironments(res.data)
    } finally {
      setLoading(false)
    }
  }

  const handleHospitalChange = (id: number) => {
    setSelectedHospitalId(id)
    fetchEnvironments(id)
  }

  const openCreate = () => {
    if (!selectedHospitalId) { message.warning('请先选择医院'); return }
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ hospitalId: selectedHospitalId, sortOrder: 0, isActive: true })
    setDrawerOpen(true)
  }

  const openEdit = (record: HospitalEnvironment) => {
    setEditing(record)
    form.setFieldsValue({ ...record, isActive: record.isActive === 1 })
    setDrawerOpen(true)
  }

  const handleDelete = async (id: number) => {
    await api.delete(`/api/admin/hospital-environments/${id}`)
    message.success('删除成功')
    if (selectedHospitalId) fetchEnvironments(selectedHospitalId)
  }

  const handleSubmit = async () => {
    setSavingDrawer(true)
    try {
      const values = await form.validateFields()
      const payload = { ...values, isActive: values.isActive ? 1 : 0 }
      if (editing) {
        await api.put(`/api/admin/hospital-environments/${editing.id}`, payload)
        message.success('更新成功')
      } else {
        await api.post('/api/admin/hospital-environments', payload)
        message.success('创建成功')
      }
      setDrawerOpen(false)
      if (selectedHospitalId) fetchEnvironments(selectedHospitalId)
    } catch (err: unknown) {
      const error = err as { errorFields?: unknown[] }
      if (!error.errorFields) message.error('操作失败')
    } finally {
      setSavingDrawer(false)
    }
  }

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('category', 'environments')
      const res = await api.post<string>('/api/admin/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      form.setFieldValue('imageUrl', res.data)
      message.success('上传成功')
    } catch {
      message.error('上传失败')
    } finally {
      setUploading(false)
    }
    return false
  }

  const columns: ColumnsType<HospitalEnvironment> = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    {
      title: '图片', dataIndex: 'imageUrl', width: 80,
      render: url => url ? <Image src={url} width={50} height={50} style={{ objectFit: 'cover' }} /> : '-',
    },
    { title: '名称（中）', dataIndex: 'nameZh' },
    { title: '名称（英）', dataIndex: 'nameEn' },
    {
      title: '简介（中）', dataIndex: 'descZh',
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
        <h3 className="page-title">诊疗环境管理</h3>
        <p className="page-description">管理医院的诊疗环境图片和介绍</p>
      </div>
      <div className="page-toolbar">
        <div className="toolbar-left">
          <Select
            placeholder="请选择医院"
            style={{ width: 300 }}
            onChange={handleHospitalChange}
            options={hospitals.map(h => ({ value: h.id, label: h.nameZh }))}
          />
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增环境</Button>
      </div>
      <Table rowKey="id" size="middle" columns={columns} dataSource={environments} loading={loading} pagination={false} />

      <Drawer
        title={editing ? '编辑诊疗环境' : '新增诊疗环境'}
        width={720}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setDrawerOpen(false)}>取消</Button>
            <Button type="primary" onClick={handleSubmit} loading={savingDrawer}>保存</Button>
          </div>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item name="hospitalId" hidden><Input /></Form.Item>
          <FormRow>
            <Form.Item name="nameZh" label="名称（中文）" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="nameEn" label="名称（英文）" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </FormRow>
          <Form.Item name="descZh" label="简介（中文）">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item name="descEn" label="简介（英文）">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item name="imageUrl" label="图片URL">
            <Input placeholder="输入图片URL或通过下方上传" />
          </Form.Item>
          <Form.Item label="上传图片">
            <Upload beforeUpload={handleUpload} showUploadList={false} accept="image/*">
              <Button icon={<UploadOutlined />} loading={uploading}>选择图片</Button>
            </Upload>
          </Form.Item>
          <FormRow>
            <Form.Item name="sortOrder" label="排序">
              <InputNumber min={0} />
            </Form.Item>
            <Form.Item name="isActive" label="启用" valuePropName="checked">
              <Switch />
            </Form.Item>
          </FormRow>
        </Form>
      </Drawer>
    </div>
  )
}

export default EnvironmentManage
