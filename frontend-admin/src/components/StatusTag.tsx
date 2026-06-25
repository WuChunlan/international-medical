import { Tag } from 'antd'

type AuditStatus = 'approved' | 'pending' | 'rejected'

const statusConfig: Record<AuditStatus, { color: string; bg: string; border: string; label: string }> = {
  approved: { color: '#059669', bg: '#F0FDF4', border: '#A7F3D0', label: '已通过' },
  pending:  { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', label: '待审核' },
  rejected: { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', label: '已拒绝' },
}

export const StatusTag = ({ status }: { status: AuditStatus }) => {
  const c = statusConfig[status] ?? statusConfig.pending
  return (
    <Tag
      style={{
        color: c.color,
        background: c.bg,
        borderColor: c.border,
        borderRadius: 2,
        fontSize: 12,
        fontWeight: 500,
        lineHeight: '20px',
      }}
    >
      {c.label}
    </Tag>
  )
}
