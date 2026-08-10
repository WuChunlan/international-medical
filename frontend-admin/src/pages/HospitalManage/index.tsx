import React, { useEffect, useState, useCallback } from 'react'
import { Table, Button, Space, Switch, Popconfirm, message, Divider, Modal, Input } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import api from '../../api'
import type { Hospital } from '../../types'
import HospitalForm from './HospitalForm'
import { StatusTag } from '../../components/StatusTag'

const HospitalManage: React.FC = () => {
  const [data, setData] = useState<Hospital[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [current, setCurrent] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editRecord, setEditRecord] = useState<Hospital | null>(null)
  const [rejectModal, setRejectModal] = useState<{ hospitalId: number; pcId?: number } | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [pendingMap, setPendingMap] = useState<Record<number, number>>({})

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const [hospitalsRes, pendingRes] = await Promise.all([
        api.get('/api/admin/hospitals', { params: { page, size: 10 } }),
        api.get('/api/reviewer/pending/hospitals'),
      ])
      const d = hospitalsRes.data?.data || hospitalsRes.data
      setData(d?.records || d?.list || [])
      setTotal(d?.total || 0)
      // Build a map: hospitalId → pendingChangeId for hospitals with a pending record
      const pending = (pendingRes.data?.data ?? []) as { data: { id: number }; pendingChangeId: number }[]
      const map: Record<number, number> = {}
      pending.forEach(item => { if (item.data?.id && item.pendingChangeId) map[item.data.id] = item.pendingChangeId })
      setPendingMap(map)
    } catch {
      message.error('获取医院列表失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData(current) }, [fetchData, current])

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/admin/hospitals/${id}`)
      message.success('删除成功')
      fetchData(current)
    } catch {
      message.error('删除失败')
    }
  }

  const handleToggleStatus = async (record: Hospital) => {
    try {
      await api.put(`/api/admin/hospitals/${record.id}`, { ...record, isActive: record.isActive === 1 ? 0 : 1 })
      message.success('状态更新成功')
      fetchData(current)
    } catch {
      message.error('状态更新失败')
    }
  }

  const handleApprove = async (hospitalId: number) => {
    const pcId = pendingMap[hospitalId]
    if (!pcId) { message.warning('未找到待审核记录'); return }
    try {
      await api.put(`/api/reviewer/approve-draft/hospitals/${pcId}`)
      message.success('已审核通过')
      fetchData(current)
    } catch {
      message.error('操作失败')
    }
  }

  const handleRejectSubmit = async () => {
    if (!rejectModal) return
    if (!rejectReason.trim()) { message.warning('请填写驳回原因'); return }
    const pcId = rejectModal.pcId ?? pendingMap[rejectModal.hospitalId]
    if (!pcId) { message.warning('未找到待审核记录'); return }
    try {
      await api.put(`/api/reviewer/reject-draft/hospitals/${pcId}`, { reason: rejectReason })
      message.success('已驳回')
      setRejectModal(null)
      setRejectReason('')
      fetchData(current)
    } catch {
      message.error('操作失败')
    }
  }

  const handleModalClose = (refresh?: boolean) => {
    setModalOpen(false)
    setEditRecord(null)
    if (refresh) fetchData(current)
  }

  const columns: ColumnsType<Hospital> = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: '中文名称', dataIndex: 'nameZh', ellipsis: true },
    { title: '英文名称', dataIndex: 'nameEn', ellipsis: true },
    { title: '联系人', dataIndex: 'contactPerson', width: 100 },
    { title: '排序', dataIndex: 'sortOrder', width: 80 },
    {
      title: '审核状态', dataIndex: 'auditStatus', width: 110,
      render: (v: string) => <StatusTag status={(v ?? 'pending') as 'approved' | 'pending' | 'rejected'} />,
    },
    {
      title: '状态', dataIndex: 'isActive', width: 90,
      render: (val: number, record: Hospital) => (
        <Switch checked={val === 1} checkedChildren="启用" unCheckedChildren="禁用"
          onChange={() => handleToggleStatus(record)} size="small" />
      ),
    },
    {
      title: '操作', width: 220,
      render: (_: unknown, record: Hospital) => {
        const hasPending = !!pendingMap[record.id]
        return (
          <Space size={0}>
            {hasPending && (
              <>
                <Button type="text" size="small" icon={<CheckOutlined />} style={{ color: '#059669' }}
                  onClick={() => handleApprove(record.id)}>通过</Button>
                <Button type="text" size="small" danger icon={<CloseOutlined />}
                  onClick={() => { setRejectModal({ hospitalId: record.id }); setRejectReason('') }}>驳回</Button>
                <Divider type="vertical" style={{ margin: '0 2px' }} />
              </>
            )}
            <Button type="text" size="small" icon={<EditOutlined />}
              onClick={() => { setEditRecord(record); setModalOpen(true) }}>编辑</Button>
            <Divider type="vertical" style={{ margin: '0 2px' }} />
            <Popconfirm title="确认删除该医院？" onConfirm={() => handleDelete(record.id)} okText="确认" cancelText="取消">
              <Button type="text" danger size="small" icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          </Space>
        )
      },
    },
  ]

  return (
    <div className="page-card">
      <div className="page-header">
        <h3 className="page-title">医院管理</h3>
        <p className="page-description">管理平台上的所有合作医院</p>
      </div>
      <div className="page-toolbar">
        <div className="toolbar-left" />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditRecord(null); setModalOpen(true) }}>
          新增医院
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
      <HospitalForm open={modalOpen} record={editRecord} onClose={handleModalClose} />

      <Modal
        title="驳回原因"
        open={!!rejectModal}
        onOk={handleRejectSubmit}
        onCancel={() => setRejectModal(null)}
        okText="确认驳回"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <Input.TextArea
          rows={4}
          placeholder="请填写驳回原因（将显示给医院管理员）"
          value={rejectReason}
          onChange={e => setRejectReason(e.target.value)}
        />
      </Modal>
    </div>
  )
}

export default HospitalManage
