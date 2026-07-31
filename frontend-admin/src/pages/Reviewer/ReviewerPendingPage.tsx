import React, { useEffect, useState, useCallback } from 'react'
import {
  Card, Tabs, Table, Button, Space, Modal, Input, message, Typography, Badge, Tag, Descriptions, Image, Alert, Row, Col,
} from 'antd'
import { CheckOutlined, CloseOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import api from '../../api'
import type { Hospital, Doctor, Equipment, HospitalEnvironment, MedicalCase, SpecialProduct, PendingItem } from '../../types'
import { StatusTag } from '../../components/StatusTag'

const { Text } = Typography
const { TextArea } = Input

type AuditRecord = { id: number; nameZh?: string; titleZh?: string | null; rejectionReason?: string | null; auditStatus?: string }
type PendingAuditItem = PendingItem<AuditRecord>
type DetailRecord = Hospital | Doctor | Equipment | HospitalEnvironment | MedicalCase | SpecialProduct | null

// ── EntityFields for generic diff display ────────────────────────

const SKIP_KEYS = ['id', 'hospitalId', 'auditStatus', 'rejectionReason',
                   'createdAt', 'updatedAt', 'hasPendingEdit', 'media']

const EntityFields: React.FC<{
  data: Record<string, unknown> | null | undefined
  changedKeys: string[]
  highlight: boolean
}> = ({ data, changedKeys, highlight }) => {
  if (!data) return null
  return (
    <Descriptions column={1} size="small" bordered>
      {Object.entries(data)
        .filter(([k]) => !SKIP_KEYS.includes(k))
        .map(([k, v]) => {
          const isChanged = highlight && changedKeys.includes(k)
          const displayVal = typeof v === 'string' && v.startsWith('<')
            ? <span dangerouslySetInnerHTML={{ __html: v }} />
            : String(v ?? '')
          return (
            <Descriptions.Item
              key={k}
              label={k}
              style={isChanged ? { backgroundColor: '#fffbe6' } : undefined}
            >
              {displayVal}
            </Descriptions.Item>
          )
        })}
    </Descriptions>
  )
}

const PendingMediaSection: React.FC<{ data: Record<string, unknown> | null | undefined }> = ({ data }) => {
  if (!data) return null
  const media = data.media as Array<{
    id?: number | null
    url: string
    mediaType: string
    isCover?: number
  }> | undefined
  if (!Array.isArray(media) || media.length === 0) return null
  return (
    <div style={{ marginTop: 16 }}>
      <Typography.Title level={5} style={{ marginBottom: 8 }}>媒体文件</Typography.Title>
      <Image.PreviewGroup>
        <Space wrap size={8}>
          {media.map((m, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              {m.mediaType === 'image' ? (
                <Image
                  src={m.url}
                  width={100}
                  height={70}
                  style={{ objectFit: 'cover', borderRadius: 4 }}
                />
              ) : (
                <video
                  src={m.url}
                  width={100}
                  height={70}
                  controls
                  style={{ objectFit: 'cover', borderRadius: 4, display: 'block' }}
                />
              )}
              <div style={{ marginTop: 4 }}>
                {m.isCover === 1 && <Tag color="gold">主图</Tag>}
                {(m.id === null || m.id === undefined) && <Tag color="orange">新上传</Tag>}
              </div>
            </div>
          ))}
        </Space>
      </Image.PreviewGroup>
    </div>
  )
}

// ── Detail modal renderer ─────────────────────────────────────────

const imgCell = (url: string | null | undefined) =>
  url ? <Image src={url} height={120} style={{ objectFit: 'cover', borderRadius: 4 }} /> : <Text type="secondary">-</Text>

const HospitalDetail: React.FC<{ r: Hospital }> = ({ r }) => (
  <Descriptions column={2} bordered>
    <Descriptions.Item label="审核状态">
      <StatusTag status={(r.auditStatus ?? 'pending') as 'approved' | 'pending' | 'rejected'} />
    </Descriptions.Item>
    <Descriptions.Item label="中文名称">{r.nameZh}</Descriptions.Item>
    <Descriptions.Item label="英文名称">{r.nameEn}</Descriptions.Item>
    <Descriptions.Item label="联系电话">{r.phone || '-'}</Descriptions.Item>
    <Descriptions.Item label="联系人">{r.contactPerson || '-'}</Descriptions.Item>
    <Descriptions.Item label="联系方式">{r.contactInfo || '-'}</Descriptions.Item>
    <Descriptions.Item label="中文地址" span={2}>{r.addressZh || '-'}</Descriptions.Item>
    <Descriptions.Item label="英文地址" span={2}>{r.addressEn || '-'}</Descriptions.Item>
    <Descriptions.Item label="中文简介" span={2}>
      <span style={{ whiteSpace: 'pre-wrap' }}>{r.introZh || '-'}</span>
    </Descriptions.Item>
    <Descriptions.Item label="英文简介" span={2}>
      <span style={{ whiteSpace: 'pre-wrap' }}>{r.introEn || '-'}</span>
    </Descriptions.Item>
    <Descriptions.Item label="封面图" span={2}>{imgCell(r.coverImageUrl)}</Descriptions.Item>
  </Descriptions>
)

const DoctorDetail: React.FC<{ r: Doctor; hospitalMap: Record<number, string> }> = ({ r, hospitalMap }) => (
  <Descriptions column={2} bordered>
    <Descriptions.Item label="审核状态">
      <StatusTag status={(r.auditStatus ?? 'pending') as 'approved' | 'pending' | 'rejected'} />
    </Descriptions.Item>
    <Descriptions.Item label="所属医院">{hospitalMap[r.hospitalId] || `ID: ${r.hospitalId}`}</Descriptions.Item>
    <Descriptions.Item label="中文姓名">{r.nameZh}</Descriptions.Item>
    <Descriptions.Item label="英文姓名">{r.nameEn}</Descriptions.Item>
    <Descriptions.Item label="中文职称">{r.titleZh || '-'}</Descriptions.Item>
    <Descriptions.Item label="英文职称">{r.titleEn || '-'}</Descriptions.Item>
    <Descriptions.Item label="中文专科">{r.specialtyZh}</Descriptions.Item>
    <Descriptions.Item label="英文专科">{r.specialtyEn}</Descriptions.Item>
    <Descriptions.Item label="每次就诊价格">
      {r.pricePerVisit != null ? `¥${r.pricePerVisit}` : '-'}
    </Descriptions.Item>
    <Descriptions.Item label="照片">{imgCell(r.photoUrl)}</Descriptions.Item>
    <Descriptions.Item label="中文简介" span={2}>
      <span style={{ whiteSpace: 'pre-wrap' }}>{r.bioZh || '-'}</span>
    </Descriptions.Item>
    <Descriptions.Item label="英文简介" span={2}>
      <span style={{ whiteSpace: 'pre-wrap' }}>{r.bioEn || '-'}</span>
    </Descriptions.Item>
  </Descriptions>
)

const EquipmentDetail: React.FC<{ r: Equipment; hospitalMap: Record<number, string> }> = ({ r, hospitalMap }) => (
  <Descriptions column={2} bordered>
    <Descriptions.Item label="审核状态">
      <StatusTag status={(r.auditStatus ?? 'pending') as 'approved' | 'pending' | 'rejected'} />
    </Descriptions.Item>
    <Descriptions.Item label="所属医院">{hospitalMap[r.hospitalId] || `ID: ${r.hospitalId}`}</Descriptions.Item>
    <Descriptions.Item label="中文名称">{r.nameZh}</Descriptions.Item>
    <Descriptions.Item label="英文名称">{r.nameEn}</Descriptions.Item>
    <Descriptions.Item label="图片" span={2}>{imgCell(r.imageUrl)}</Descriptions.Item>
    <Descriptions.Item label="中文描述" span={2}>
      <span style={{ whiteSpace: 'pre-wrap' }}>{r.descZh || '-'}</span>
    </Descriptions.Item>
    <Descriptions.Item label="英文描述" span={2}>
      <span style={{ whiteSpace: 'pre-wrap' }}>{r.descEn || '-'}</span>
    </Descriptions.Item>
  </Descriptions>
)

const EnvironmentDetail: React.FC<{ r: HospitalEnvironment; hospitalMap: Record<number, string> }> = ({ r, hospitalMap }) => (
  <Descriptions column={2} bordered>
    <Descriptions.Item label="审核状态">
      <StatusTag status={(r.auditStatus ?? 'pending') as 'approved' | 'pending' | 'rejected'} />
    </Descriptions.Item>
    <Descriptions.Item label="所属医院">{hospitalMap[r.hospitalId] || `ID: ${r.hospitalId}`}</Descriptions.Item>
    <Descriptions.Item label="中文名称">{r.nameZh}</Descriptions.Item>
    <Descriptions.Item label="英文名称">{r.nameEn}</Descriptions.Item>
    <Descriptions.Item label="图片" span={2}>{imgCell(r.imageUrl)}</Descriptions.Item>
    <Descriptions.Item label="中文描述" span={2}>
      <span style={{ whiteSpace: 'pre-wrap' }}>{r.descZh || '-'}</span>
    </Descriptions.Item>
    <Descriptions.Item label="英文描述" span={2}>
      <span style={{ whiteSpace: 'pre-wrap' }}>{r.descEn || '-'}</span>
    </Descriptions.Item>
  </Descriptions>
)

const CaseDetail: React.FC<{ r: MedicalCase }> = ({ r }) => (
  <Descriptions column={2} bordered>
    <Descriptions.Item label="审核状态">
      <StatusTag status={(r.auditStatus ?? 'pending') as 'approved' | 'pending' | 'rejected'} />
    </Descriptions.Item>
    <Descriptions.Item label="所属医院">{r.hospitalNameZh || r.hospitalId || '-'}</Descriptions.Item>
    <Descriptions.Item label="中文标题">{r.titleZh}</Descriptions.Item>
    <Descriptions.Item label="英文标题">{r.titleEn}</Descriptions.Item>
    <Descriptions.Item label="提交时间">{r.createdAt || '-'}</Descriptions.Item>
    <Descriptions.Item label="封面图" span={2}>{imgCell(r.coverImageUrl)}</Descriptions.Item>
    <Descriptions.Item label="中文摘要" span={2}>
      <span style={{ whiteSpace: 'pre-wrap' }}>{r.summaryZh || '-'}</span>
    </Descriptions.Item>
    <Descriptions.Item label="英文摘要" span={2}>
      <span style={{ whiteSpace: 'pre-wrap' }}>{r.summaryEn || '-'}</span>
    </Descriptions.Item>
    <Descriptions.Item label="中文详情" span={2}>
      <span style={{ whiteSpace: 'pre-wrap' }}>{r.detailZh || '-'}</span>
    </Descriptions.Item>
    <Descriptions.Item label="英文详情" span={2}>
      <span style={{ whiteSpace: 'pre-wrap' }}>{r.detailEn || '-'}</span>
    </Descriptions.Item>
  </Descriptions>
)

const ProductDetail: React.FC<{ r: SpecialProduct; hospitalMap: Record<number, string> }> = ({ r, hospitalMap }) => (
  <Descriptions column={2} bordered>
    <Descriptions.Item label="审核状态">
      <StatusTag status={(r.auditStatus ?? 'pending') as 'approved' | 'pending' | 'rejected'} />
    </Descriptions.Item>
    <Descriptions.Item label="所属医院">
      {r.hospitalId ? (hospitalMap[r.hospitalId] || `ID: ${r.hospitalId}`) : '-'}
    </Descriptions.Item>
    <Descriptions.Item label="中文名称">{r.nameZh}</Descriptions.Item>
    <Descriptions.Item label="英文名称">{r.nameEn}</Descriptions.Item>
    <Descriptions.Item label="价格区间">
      {r.priceMin != null ? `¥${r.priceMin} ~ ¥${r.priceMax}` : '-'}
    </Descriptions.Item>
    <Descriptions.Item label="联系人">{r.contactPerson || '-'}</Descriptions.Item>
    <Descriptions.Item label="联系方式">{r.contactInfo || '-'}</Descriptions.Item>
    <Descriptions.Item label="封面图" span={2}>{imgCell(r.coverImageUrl)}</Descriptions.Item>
    <Descriptions.Item label="中文摘要" span={2}>
      <span style={{ whiteSpace: 'pre-wrap' }}>{r.summaryZh || '-'}</span>
    </Descriptions.Item>
    <Descriptions.Item label="英文摘要" span={2}>
      <span style={{ whiteSpace: 'pre-wrap' }}>{r.summaryEn || '-'}</span>
    </Descriptions.Item>
    <Descriptions.Item label="中文详情" span={2}>
      <span style={{ whiteSpace: 'pre-wrap' }}>{r.detailZh || '-'}</span>
    </Descriptions.Item>
    <Descriptions.Item label="英文详情" span={2}>
      <span style={{ whiteSpace: 'pre-wrap' }}>{r.detailEn || '-'}</span>
    </Descriptions.Item>
  </Descriptions>
)

const typeLabels: Record<string, string> = {
  hospitals: '医院', doctors: '医生', equipments: '设备',
  environments: '诊疗环境', cases: '案例', products: '产品',
}

function renderDetail(type: string, record: DetailRecord, hospitalMap: Record<number, string>) {
  if (!record) return null
  switch (type) {
    case 'hospitals':    return <HospitalDetail    r={record as Hospital} />
    case 'doctors':      return <DoctorDetail      r={record as Doctor}              hospitalMap={hospitalMap} />
    case 'equipments':   return <EquipmentDetail   r={record as Equipment}           hospitalMap={hospitalMap} />
    case 'environments': return <EnvironmentDetail r={record as HospitalEnvironment} hospitalMap={hospitalMap} />
    case 'cases':        return <CaseDetail        r={record as MedicalCase} />
    case 'products':     return <ProductDetail     r={record as SpecialProduct}      hospitalMap={hospitalMap} />
    default:             return null
  }
}

// ── Main component ────────────────────────────────────────────────

const ReviewerPendingPage: React.FC = () => {
  const [hospitals, setHospitals] = useState<PendingItem<Hospital>[]>([])
  const [hospitalMap, setHospitalMap] = useState<Record<number, string>>({})
  const [doctors, setDoctors] = useState<PendingItem<Doctor>[]>([])
  const [equipments, setEquipments] = useState<PendingItem<Equipment>[]>([])
  const [environments, setEnvironments] = useState<PendingItem<HospitalEnvironment>[]>([])
  const [cases, setCases] = useState<PendingItem<MedicalCase>[]>([])
  const [products, setProducts] = useState<PendingItem<SpecialProduct>[]>([])
  const [loading, setLoading] = useState(true)
  const [rejectModal, setRejectModal] = useState<{ type: string; id: number; pendingChangeId?: number | null } | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [detailModal, setDetailModal] = useState<{ type: string; item: PendingAuditItem } | null>(null)
  const [refetchKey, setRefetchKey] = useState(0)
  const triggerRefetch = useCallback(() => setRefetchKey(k => k + 1), [])

  useEffect(() => {
    const unwrap = (res: { data: { data?: unknown } }) => {
      const d = res.data?.data ?? res.data
      if (Array.isArray(d)) return d
      return (d as { records?: unknown[]; list?: unknown[] })?.records ?? (d as { list?: unknown[] })?.list ?? []
    }

    let cancelled = false
    const requests = [
      api.get('/api/reviewer/pending/hospitals'),
      api.get('/api/reviewer/pending/doctors'),
      api.get('/api/reviewer/pending/equipments'),
      api.get('/api/reviewer/pending/environments'),
      api.get('/api/reviewer/pending/cases'),
      api.get('/api/reviewer/pending/products'),
      api.get('/api/reviewer/hospitals'),
    ]
    Promise.resolve()
      .then(() => { if (!cancelled) setLoading(true) })
      .then(() => Promise.all(requests))
      .then(([h, d, e, env, c, p, allH]) => {
        if (cancelled) return
        const pendingHospitals = unwrap(h) as PendingItem<Hospital>[]
        setHospitals(pendingHospitals)
        setDoctors(unwrap(d) as PendingItem<Doctor>[])
        setEquipments(unwrap(e) as PendingItem<Equipment>[])
        setEnvironments(unwrap(env) as PendingItem<HospitalEnvironment>[])
        setCases(unwrap(c) as PendingItem<MedicalCase>[])
        setProducts(unwrap(p) as PendingItem<SpecialProduct>[])
        setLoading(false)
        const allHospitals = unwrap(allH) as Hospital[]
        const map: Record<number, string> = {}
        allHospitals.forEach(h => { map[h.id] = h.nameZh })
        pendingHospitals.forEach(h => { if (!map[h.data.id]) map[h.data.id] = h.data.nameZh })
        setHospitalMap(map)
      })
      .catch(() => {
        if (!cancelled) {
          message.error('加载待审核数据失败')
          setLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [refetchKey])

  const handleApprove = async (type: string, id: number, pendingChangeId?: number | null) => {
    try {
      if (pendingChangeId) {
        await api.put(`/api/reviewer/approve-draft/${type}/${pendingChangeId}`)
      } else {
        await api.put(`/api/reviewer/approve/${type}/${id}`)
      }
      message.success('审核通过')
      setDetailModal(null)
      triggerRefetch()
    } catch { message.error('操作失败') }
  }

  const handleRejectSubmit = async () => {
    if (!rejectModal) return
    if (!rejectReason.trim()) { message.warning('请填写驳回原因'); return }
    try {
      if (rejectModal.pendingChangeId) {
        await api.put(`/api/reviewer/reject-draft/${rejectModal.type}/${rejectModal.pendingChangeId}`, { reason: rejectReason })
      } else {
        await api.put(`/api/reviewer/reject/${rejectModal.type}/${rejectModal.id}`, { reason: rejectReason })
      }
      message.success('已驳回')
      setRejectModal(null)
      setRejectReason('')
      setDetailModal(null)
      triggerRefetch()
    } catch { message.error('操作失败') }
  }

  const openReject = (type: string, id: number, pendingChangeId?: number | null) => {
    setDetailModal(null)
    setRejectModal({ type, id, pendingChangeId })
    setRejectReason('')
  }

  const editTypeCol: ColumnsType<PendingAuditItem>[number] = {
    title: '类型',
    key: 'editType',
    render: (_: unknown, record: PendingAuditItem) => (
      <Tag color={record.isEdit ? 'orange' : 'blue'}>
        {record.isEdit ? '编辑' : '新建'}
      </Tag>
    ),
    width: 80,
  }

  const actionCol = (type: string): ColumnsType<PendingAuditItem>[number] => ({
    title: '操作',
    width: 140,
    render: (_: unknown, record: PendingAuditItem) => (
      <Space>
        <Button type="link" size="small" icon={<CheckOutlined />} style={{ color: '#059669' }}
          onClick={e => { e.stopPropagation(); handleApprove(type, record.data.id, record.pendingChangeId) }}>通过</Button>
        <Button type="link" size="small" danger icon={<CloseOutlined />}
          onClick={e => { e.stopPropagation(); openReject(type, record.data.id, record.pendingChangeId) }}>驳回</Button>
      </Space>
    ),
  })

  const baseColumns = (nameKey: string): ColumnsType<PendingAuditItem> => [
    { title: 'ID', key: 'id', width: 60, render: (_, r) => r.data.id },
    { title: '名称/标题', key: 'name', ellipsis: true, render: (_, r) => (r.data as Record<string, unknown>)[nameKey] as string ?? '-' },
    { title: '驳回原因', key: 'rejectionReason', ellipsis: true,
      render: (_, r) => r.data.rejectionReason ? <Text type="danger">{r.data.rejectionReason}</Text> : '-' },
  ]

  const makeTable = <T extends AuditRecord>(
    type: string,
    data: PendingItem<T>[],
    nameKey: string,
  ) => (
    <Table
      rowKey={record => record.pendingChangeId != null ? `draft-${record.pendingChangeId}` : String(record.data.id)}
      size="middle"
      dataSource={data as PendingAuditItem[]}
      loading={loading}
      columns={[...baseColumns(nameKey), editTypeCol, actionCol(type)]}
      pagination={false}
      onRow={record => ({
        onClick: () => setDetailModal({ type, item: record as PendingAuditItem }),
        style: { cursor: 'pointer' },
      })}
    />
  )

  const totalPending = hospitals.length + doctors.length + equipments.length + environments.length + cases.length + products.length

  const tabs = [
    { key: 'hospitals',    label: <Badge count={hospitals.length}    size="small">医院</Badge>,    table: makeTable('hospitals',    hospitals,    'nameZh') },
    { key: 'doctors',      label: <Badge count={doctors.length}      size="small">医生</Badge>,    table: makeTable('doctors',      doctors,      'nameZh') },
    { key: 'equipments',   label: <Badge count={equipments.length}   size="small">设备</Badge>,    table: makeTable('equipments',   equipments,   'nameZh') },
    { key: 'environments', label: <Badge count={environments.length} size="small">环境</Badge>,    table: makeTable('environments', environments, 'nameZh') },
    { key: 'cases',        label: <Badge count={cases.length}        size="small">案例</Badge>,    table: makeTable('cases',        cases,        'titleZh') },
    { key: 'products',     label: <Badge count={products.length}     size="small">产品</Badge>,    table: makeTable('products',     products,     'nameZh') },
  ]

  const selectedItem = detailModal?.item ?? null

  const changedKeys: string[] = selectedItem?.isEdit && selectedItem.currentData
    ? Object.keys(selectedItem.data as Record<string, unknown>).filter(
        k => JSON.stringify((selectedItem.data as Record<string, unknown>)[k])
          !== JSON.stringify((selectedItem.currentData as Record<string, unknown>)[k])
      )
    : []

  return (
    <div className="page-card">
      <div className="page-header">
        <h3 className="page-title">
          待审核内容
          {totalPending > 0 && (
            <Tag color="#D97706" style={{ background: '#FFFBEB', borderColor: '#FDE68A', color: '#D97706', borderRadius: 2, fontSize: 12, marginLeft: 8 }}>
              {totalPending} 条待处理
            </Tag>
          )}
        </h3>
        <p className="page-description">审核医院管理员提交的内容，点击行可查看详情</p>
      </div>
      <Card>
        <Tabs items={tabs.map(t => ({ key: t.key, label: t.label, children: t.table }))} />
      </Card>

      {/* Reject reason modal */}
      <Modal
        title="驳回原因"
        open={!!rejectModal}
        onOk={handleRejectSubmit}
        onCancel={() => setRejectModal(null)}
        okText="确认驳回"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <TextArea
          rows={4}
          placeholder="请填写驳回原因（将显示给医院管理员）"
          value={rejectReason}
          onChange={e => setRejectReason(e.target.value)}
        />
      </Modal>

      {/* Detail modal */}
      <Modal
        title={`${typeLabels[detailModal?.type ?? ''] ?? ''}详情`}
        open={!!detailModal}
        onCancel={() => setDetailModal(null)}
        width={1200}
        footer={
          selectedItem ? (
            <Space>
              <Button onClick={() => setDetailModal(null)}>关闭</Button>
              <Button
                danger
                icon={<CloseOutlined />}
                onClick={() => openReject(detailModal!.type, selectedItem.data.id, selectedItem.pendingChangeId)}
              >
                驳回
              </Button>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                style={{ background: '#059669', borderColor: '#059669' }}
                onClick={() => handleApprove(detailModal!.type, selectedItem.data.id, selectedItem.pendingChangeId)}
              >
                审核通过
              </Button>
            </Space>
          ) : null
        }
      >
        {detailModal && selectedItem && (
          <>
            {selectedItem.data.rejectionReason && (
              <Alert
                type="error"
                message={`驳回原因：${selectedItem.data.rejectionReason}`}
                style={{ marginBottom: 16 }}
                showIcon
              />
            )}
            {selectedItem.isEdit && selectedItem.currentData ? (
              <Row gutter={24}>
                <Col span={12}>
                  <Typography.Title level={5} style={{ color: '#888' }}>当前数据</Typography.Title>
                  <EntityFields
                    data={selectedItem.currentData as Record<string, unknown>}
                    changedKeys={changedKeys}
                    highlight={false}
                  />
                </Col>
                <Col span={12}>
                  <Typography.Title level={5} style={{ color: '#1677ff' }}>待审核变更</Typography.Title>
                  <EntityFields
                    data={selectedItem.data as Record<string, unknown>}
                    changedKeys={changedKeys}
                    highlight={true}
                  />
                  <PendingMediaSection data={selectedItem.data as Record<string, unknown>} />
                </Col>
              </Row>
            ) : (
              <>
                {renderDetail(detailModal.type, selectedItem.data as DetailRecord, hospitalMap)}
                <PendingMediaSection data={selectedItem.data as Record<string, unknown>} />
              </>
            )}
          </>
        )}
      </Modal>
    </div>
  )
}

export default ReviewerPendingPage
