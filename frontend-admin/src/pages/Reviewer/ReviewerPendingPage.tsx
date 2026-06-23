import React, { useEffect, useState, useCallback } from 'react';
import {
  Card, Tabs, Table, Button, Space, Tag, Modal, Input, message, Typography, Badge,
} from 'antd';
import { CheckOutlined, CloseOutlined, EditOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '../../api';
import type { Hospital, Doctor, Equipment, HospitalEnvironment, MedicalCase, SpecialProduct } from '../../types';

const { Title, Text } = Typography;
const { TextArea } = Input;

type AuditRecord = { id: number; nameZh?: string; titleZh?: string; rejectionReason?: string | null; auditStatus?: string };

const auditTag = (s?: string) => {
  const m: Record<string, { color: string; label: string }> = {
    approved: { color: 'green', label: '已审核' },
    pending: { color: 'orange', label: '待审核' },
    rejected: { color: 'red', label: '已驳回' },
  };
  const v = m[s ?? ''] ?? { color: 'default', label: '待审核' };
  return <Tag color={v.color}>{v.label}</Tag>;
};

interface ResourceSection<T extends AuditRecord> {
  type: string;
  label: string;
  data: T[];
  nameKey: keyof T;
}

const ReviewerPendingPage: React.FC = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [environments, setEnvironments] = useState<HospitalEnvironment[]>([]);
  const [cases, setCases] = useState<MedicalCase[]>([]);
  const [products, setProducts] = useState<SpecialProduct[]>([]);
  const [loading, setLoading] = useState(false);

  const [rejectModal, setRejectModal] = useState<{ type: string; id: number } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [h, d, e, env, c, p] = await Promise.all([
        api.get('/api/reviewer/pending/hospitals'),
        api.get('/api/reviewer/pending/doctors'),
        api.get('/api/reviewer/pending/equipments'),
        api.get('/api/reviewer/pending/environments'),
        api.get('/api/reviewer/pending/cases'),
        api.get('/api/reviewer/pending/products'),
      ]);
      const unwrap = (res: { data: { data?: unknown } }) => {
        const d = res.data?.data ?? res.data;
        if (Array.isArray(d)) return d;
        return (d as { records?: unknown[]; list?: unknown[] })?.records ?? (d as { list?: unknown[] })?.list ?? [];
      };
      setHospitals(unwrap(h) as Hospital[]);
      setDoctors(unwrap(d) as Doctor[]);
      setEquipments(unwrap(e) as Equipment[]);
      setEnvironments(unwrap(env) as HospitalEnvironment[]);
      setCases(unwrap(c) as MedicalCase[]);
      setProducts(unwrap(p) as SpecialProduct[]);
    } catch {
      message.error('加载待审核数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleApprove = async (type: string, id: number) => {
    try {
      await api.put(`/api/reviewer/approve/${type}/${id}`);
      message.success('审核通过');
      fetchAll();
    } catch { message.error('操作失败'); }
  };

  const handleRejectSubmit = async () => {
    if (!rejectModal) return;
    if (!rejectReason.trim()) { message.warning('请填写驳回原因'); return; }
    try {
      await api.put(`/api/reviewer/reject/${rejectModal.type}/${rejectModal.id}`, { reason: rejectReason });
      message.success('已驳回');
      setRejectModal(null);
      setRejectReason('');
      fetchAll();
    } catch { message.error('操作失败'); }
  };

  const actionCol = (type: string): ColumnsType<AuditRecord>[number] => ({
    title: '操作',
    width: 140,
    render: (_: unknown, record: AuditRecord) => (
      <Space>
        <Button type="link" size="small" icon={<CheckOutlined />} style={{ color: '#52c41a' }}
          onClick={() => handleApprove(type, record.id)}>通过</Button>
        <Button type="link" size="small" danger icon={<CloseOutlined />}
          onClick={() => { setRejectModal({ type, id: record.id }); setRejectReason(''); }}>驳回</Button>
      </Space>
    ),
  });

  const baseColumns = (nameKey: string): ColumnsType<AuditRecord> => [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '名称/标题', dataIndex: nameKey, ellipsis: true },
    { title: '驳回原因', dataIndex: 'rejectionReason', ellipsis: true, render: (v: string | null) => v ? <Text type="danger">{v}</Text> : '-' },
  ];

  const tabs = [
    {
      key: 'hospitals', label: <Badge count={hospitals.length} size="small">医院</Badge>,
      table: <Table rowKey="id" dataSource={hospitals as AuditRecord[]} loading={loading}
        columns={[...baseColumns('nameZh'), actionCol('hospitals')]} pagination={false} />,
    },
    {
      key: 'doctors', label: <Badge count={doctors.length} size="small">医生</Badge>,
      table: <Table rowKey="id" dataSource={doctors as AuditRecord[]} loading={loading}
        columns={[...baseColumns('nameZh'), actionCol('doctors')]} pagination={false} />,
    },
    {
      key: 'equipments', label: <Badge count={equipments.length} size="small">设备</Badge>,
      table: <Table rowKey="id" dataSource={equipments as AuditRecord[]} loading={loading}
        columns={[...baseColumns('nameZh'), actionCol('equipments')]} pagination={false} />,
    },
    {
      key: 'environments', label: <Badge count={environments.length} size="small">环境</Badge>,
      table: <Table rowKey="id" dataSource={environments as AuditRecord[]} loading={loading}
        columns={[...baseColumns('nameZh'), actionCol('environments')]} pagination={false} />,
    },
    {
      key: 'cases', label: <Badge count={cases.length} size="small">案例</Badge>,
      table: <Table rowKey="id" dataSource={cases as AuditRecord[]} loading={loading}
        columns={[...baseColumns('titleZh'), actionCol('cases')]} pagination={false} />,
    },
    {
      key: 'products', label: <Badge count={products.length} size="small">产品</Badge>,
      table: <Table rowKey="id" dataSource={products as AuditRecord[]} loading={loading}
        columns={[...baseColumns('nameZh'), actionCol('products')]} pagination={false} />,
    },
  ];

  const totalPending = hospitals.length + doctors.length + equipments.length + environments.length + cases.length + products.length;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Title level={4} className="page-title">
          待审核内容
          {totalPending > 0 && <Tag color="orange" style={{ marginLeft: 8 }}>{totalPending} 条待处理</Tag>}
        </Title>
      </div>
      <Card className="page-card">
        <Tabs
          items={tabs.map((t) => ({ key: t.key, label: t.label, children: t.table }))}
        />
      </Card>

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
          onChange={(e) => setRejectReason(e.target.value)}
        />
      </Modal>
    </div>
  );
};

export default ReviewerPendingPage;
