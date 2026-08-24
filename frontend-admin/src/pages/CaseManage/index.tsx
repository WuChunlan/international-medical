import React, { useEffect, useState, useCallback } from 'react'
import { Table, Button, Space, Switch, Popconfirm, message, Tag, Divider, Tooltip } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import api from '../../api'
import type { MedicalCase } from '../../types'
import CaseForm from './CaseForm'
import { useAdminAuthStore } from '../../store/authStore'

const CaseManage: React.FC = () => {
  const [data, setData] = useState<MedicalCase[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [current, setCurrent] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editRecord, setEditRecord] = useState<MedicalCase | null>(null)
  const { role, userId } = useAdminAuthStore()
  const isAdmin = role === 'admin'

  const canEdit = (record: MedicalCase) => isAdmin || record.createdUser === userId

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const res = await api.get('/api/admin/cases', { params: { page, size: 10 } })
      const d = res.data?.data || res.data
      setData(d?.records || d?.list || [])
      setTotal(d?.total || 0)
    } catch {
      message.error('获取案例列表失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData(current) }, [fetchData, current])

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/admin/cases/${id}`)
      message.success('删除成功')
      fetchData(current)
    } catch {
      message.error('删除失败')
    }
  }

  const handleToggleStatus = async (record: MedicalCase) => {
    try {
      await api.put(`/api/admin/cases/${record.id}`, { ...record, isActive: record.isActive === 1 ? 0 : 1 })
      message.success('状态更新成功')
      fetchData(current)
    } catch {
      message.error('状态更新失败')
    }
  }

  const handleModalClose = (refresh?: boolean) => {
    setModalOpen(false)
    setEditRecord(null)
    if (refresh) fetchData(current)
  }

  const columns: ColumnsType<MedicalCase> = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    {
      title: '关联医院', dataIndex: 'hospitalNameZh', width: 180,
      render: (val: string | null) => val ? <Tag style={{ borderRadius: 2 }}>{val}</Tag> : <span style={{ color: '#bbb' }}>未关联</span>,
    },
    { title: '案例标题', dataIndex: 'titleZh', ellipsis: true },
    {
      title: '封面', dataIndex: 'coverImageUrl', width: 80,
      render: (url: string | null) => url
        ? <img src={url} alt="cover" style={{ width: 48, height: 36, objectFit: 'cover', borderRadius: 4 }} />
        : <span style={{ color: '#bbb', fontSize: 12 }}>无</span>,
    },
    { title: '排序', dataIndex: 'sortOrder', width: 80 },
    {
      title: '状态', dataIndex: 'isActive', width: 100,
      render: (val: number, record: MedicalCase) => (
        <Switch checked={val === 1} checkedChildren="启用" unCheckedChildren="禁用"
          onChange={() => handleToggleStatus(record)} size="small" disabled={!canEdit(record)} />
      ),
    },
    {
      title: '操作', width: 150,
      render: (_: unknown, record: MedicalCase) => (
        <Space size={0}>
          <Tooltip title={canEdit(record) ? '' : '无权编辑他人数据'}>
            <Button type="text" size="small" icon={<EditOutlined />} disabled={!canEdit(record)}
              onClick={() => { setEditRecord(record); setModalOpen(true) }}>编辑</Button>
          </Tooltip>
          <Divider type="vertical" style={{ margin: '0 2px' }} />
          <Tooltip title={canEdit(record) ? '' : '无权删除他人数据'}>
            <Popconfirm title="确认删除该案例？" onConfirm={() => handleDelete(record.id)} okText="确认" cancelText="取消" disabled={!canEdit(record)}>
              <Button type="text" danger size="small" icon={<DeleteOutlined />} disabled={!canEdit(record)}>删除</Button>
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <div className="page-card">
      <div className="page-header">
        <h3 className="page-title">过往案例管理</h3>
        <p className="page-description">管理平台上展示的医疗案例</p>
      </div>
      <div className="page-toolbar">
        <div className="toolbar-left" />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditRecord(null); setModalOpen(true) }}>
          新增案例
        </Button>
      </div>
      <Table
        rowKey="id"
        size="middle"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{ current, pageSize: 10, total, showSizeChanger: false, showTotal: t => `共 ${t} 条`, position: ['bottomRight'], size: 'small', onChange: setCurrent }}
      />
      <CaseForm open={modalOpen} record={editRecord} onClose={handleModalClose} />
    </div>
  )
}

export default CaseManage
