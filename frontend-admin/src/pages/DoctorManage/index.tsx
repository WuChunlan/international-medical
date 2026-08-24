import React, { useEffect, useState, useCallback } from 'react'
import { Table, Button, Space, Switch, Popconfirm, message, Select, Divider, Tooltip } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import api from '../../api'
import type { Doctor, Hospital } from '../../types'
import DoctorForm from './DoctorForm'
import { useAdminAuthStore } from '../../store/authStore'

const DoctorManage: React.FC = () => {
  const [data, setData] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [current, setCurrent] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editRecord, setEditRecord] = useState<Doctor | null>(null)
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [filterHospitalId, setFilterHospitalId] = useState<number | undefined>(undefined)
  const { role, userId } = useAdminAuthStore()
  const isAdmin = role === 'admin'

  const canEdit = (record: Doctor) => isAdmin || record.createdUser === userId

  useEffect(() => {
    api.get('/api/admin/hospitals', { params: { page: 1, size: 100 } })
      .then(res => { const d = res.data?.data || res.data; setHospitals(d?.records || d?.list || []) })
      .catch(() => {})
  }, [])

  const fetchData = useCallback(async (page = 1, hospitalId?: number) => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = { page, size: 10 }
      if (hospitalId) params.hospitalId = hospitalId
      const res = await api.get('/api/admin/doctors', { params })
      const d = res.data?.data || res.data
      setData(d?.records || d?.list || [])
      setTotal(d?.total || 0)
    } catch {
      message.error('获取医生列表失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData(current, filterHospitalId) }, [fetchData, current, filterHospitalId])

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/admin/doctors/${id}`)
      message.success('删除成功')
      fetchData(current, filterHospitalId)
    } catch {
      message.error('删除失败')
    }
  }

  const handleToggleStatus = async (record: Doctor) => {
    try {
      await api.put(`/api/admin/doctors/${record.id}`, { ...record, isActive: record.isActive === 1 ? 0 : 1 })
      message.success('状态更新成功')
      fetchData(current, filterHospitalId)
    } catch {
      message.error('状态更新失败')
    }
  }

  const handleModalClose = (refresh?: boolean) => {
    setModalOpen(false)
    setEditRecord(null)
    if (refresh) fetchData(current, filterHospitalId)
  }

  const getHospitalName = (hospitalId: number | null) => {
    if (!hospitalId) return <span style={{ color: '#bbb' }}>未关联</span>
    return hospitals.find(h => h.id === hospitalId)?.nameZh || `医院${hospitalId}`
  }

  const columns: ColumnsType<Doctor> = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: '姓名', dataIndex: 'nameZh', width: 100 },
    { title: '职称', dataIndex: 'titleZh', width: 100 },
    { title: '科室', dataIndex: 'specialtyZh', ellipsis: true },
    { title: '所属医院', dataIndex: 'hospitalId', render: (id: number | null) => getHospitalName(id), ellipsis: true },
    { title: '价格', dataIndex: 'pricePerVisit', width: 100, render: (val: number | null) => (val != null ? `¥${val}` : '-') },
    {
      title: '状态', dataIndex: 'isActive', width: 100,
      render: (val: number, record: Doctor) => (
        <Switch checked={val === 1} checkedChildren="启用" unCheckedChildren="禁用"
          onChange={() => handleToggleStatus(record)} size="small" disabled={!canEdit(record)} />
      ),
    },
    {
      title: '操作', width: 150,
      render: (_: unknown, record: Doctor) => (
        <Space size={0}>
          <Tooltip title={canEdit(record) ? '' : '无权编辑他人数据'}>
            <Button type="text" size="small" icon={<EditOutlined />} disabled={!canEdit(record)}
              onClick={() => { setEditRecord(record); setModalOpen(true) }}>编辑</Button>
          </Tooltip>
          <Divider type="vertical" style={{ margin: '0 2px' }} />
          <Tooltip title={canEdit(record) ? '' : '无权删除他人数据'}>
            <Popconfirm title="确认删除该医生？" onConfirm={() => handleDelete(record.id)} okText="确认" cancelText="取消" disabled={!canEdit(record)}>
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
        <h3 className="page-title">医生管理</h3>
        <p className="page-description">管理平台上的所有合作医生</p>
      </div>
      <div className="page-toolbar">
        <div className="toolbar-left">
          {isAdmin && (
            <Select
              allowClear
              placeholder="按医院筛选"
              style={{ width: 200 }}
              value={filterHospitalId}
              onChange={val => { setFilterHospitalId(val); setCurrent(1) }}
              options={hospitals.map(h => ({ value: h.id, label: h.nameZh }))}
            />
          )}
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditRecord(null); setModalOpen(true) }}>
          新增医生
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
      <DoctorForm open={modalOpen} record={editRecord} hospitals={hospitals} onClose={handleModalClose} />
    </div>
  )
}

export default DoctorManage
