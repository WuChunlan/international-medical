import React, { useEffect, useState, useCallback } from 'react';
import {
  Table, Button, Space, Popconfirm, message, Card, Typography, Row, Col, Tag, Modal, Form, Input,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '../../api';
import type { Equipment } from '../../types';

const { Title } = Typography;

const auditTag = (s?: string) => {
  const m: Record<string, { color: string; label: string }> = {
    approved: { color: 'green', label: '已审核' },
    pending: { color: 'orange', label: '待审核' },
    rejected: { color: 'red', label: '已驳回' },
  };
  const v = m[s ?? ''] ?? { color: 'default', label: s ?? '-' };
  return <Tag color={v.color}>{v.label}</Tag>;
};

const HAEquipmentsPage: React.FC = () => {
  const [data, setData] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [current, setCurrent] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<Equipment | null>(null);
  const [form] = Form.useForm();

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/api/hospital-admin/equipments', { params: { page, size: 10 } });
      const d = res.data?.data ?? res.data;
      setData(d?.records ?? d?.list ?? []);
      setTotal(d?.total ?? 0);
    } catch { message.error('获取设备列表失败'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(current); }, [fetchData, current]);

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/hospital-admin/equipments/${id}`);
      message.success('删除成功');
      fetchData(current);
    } catch { message.error('删除失败'); }
  };

  const openModal = (record?: Equipment) => {
    setEditRecord(record ?? null);
    form.setFieldsValue(record ?? {});
    if (!record) form.resetFields();
    setModalOpen(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (editRecord) {
        await api.put(`/api/hospital-admin/equipments/${editRecord.id}`, values);
        message.success('更新成功，等待审核');
      } else {
        await api.post('/api/hospital-admin/equipments', values);
        message.success('创建成功，等待审核');
      }
      setModalOpen(false);
      fetchData(current);
    } catch { message.error('操作失败'); }
  };

  const columns: ColumnsType<Equipment> = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '中文名称', dataIndex: 'nameZh' },
    { title: '英文名称', dataIndex: 'nameEn' },
    { title: '审核状态', dataIndex: 'auditStatus', width: 100, render: auditTag },
    { title: '驳回原因', dataIndex: 'rejectionReason', ellipsis: true, render: (v: string | null) => v || '-' },
    {
      title: '操作', width: 120,
      render: (_: unknown, record: Equipment) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openModal(record)}>编辑</Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(record.id)} okText="确认" cancelText="取消">
            <Button type="link" danger size="small" icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" className="page-header-row">
        <Col><Title level={4} className="page-title">设备管理</Title></Col>
        <Col><Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>新增设备</Button></Col>
      </Row>
      <Card className="page-card">
        <Table rowKey="id" columns={columns} dataSource={data} loading={loading}
          pagination={{ current, pageSize: 10, total, showTotal: (t) => `共 ${t} 条`, onChange: (p) => setCurrent(p) }} />
      </Card>
      <Modal title={editRecord ? '编辑设备' : '新增设备'} open={modalOpen}
        onOk={handleModalOk} onCancel={() => setModalOpen(false)} okText="保存" cancelText="取消">
        <Form form={form} layout="vertical">
          <Form.Item name="nameZh" label="中文名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="nameEn" label="英文名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="descZh" label="描述(中文)"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="descEn" label="描述(英文)"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="sortOrder" label="排序"><Input type="number" /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default HAEquipmentsPage;
