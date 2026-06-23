import React, { useEffect, useState, useCallback } from 'react';
import {
  Table, Button, Space, Popconfirm, message, Card, Typography, Row, Col, Tag, Modal, Form, Input,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '../../api';
import type { HospitalEnvironment } from '../../types';

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

const HAEnvironmentsPage: React.FC = () => {
  const [data, setData] = useState<HospitalEnvironment[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<HospitalEnvironment | null>(null);
  const [form] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/hospital-admin/environments');
      const d = res.data?.data ?? res.data;
      setData(Array.isArray(d) ? d : d?.list ?? []);
    } catch { message.error('获取诊疗环境失败'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/hospital-admin/environments/${id}`);
      message.success('删除成功');
      fetchData();
    } catch { message.error('删除失败'); }
  };

  const openModal = (record?: HospitalEnvironment) => {
    setEditRecord(record ?? null);
    if (record) form.setFieldsValue(record); else form.resetFields();
    setModalOpen(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (editRecord) {
        await api.put(`/api/hospital-admin/environments/${editRecord.id}`, values);
        message.success('更新成功，等待审核');
      } else {
        await api.post('/api/hospital-admin/environments', values);
        message.success('创建成功，等待审核');
      }
      setModalOpen(false);
      fetchData();
    } catch { message.error('操作失败'); }
  };

  const columns: ColumnsType<HospitalEnvironment> = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '中文名称', dataIndex: 'nameZh' },
    { title: '英文名称', dataIndex: 'nameEn' },
    { title: '审核状态', dataIndex: 'auditStatus', width: 100, render: auditTag },
    { title: '驳回原因', dataIndex: 'rejectionReason', ellipsis: true, render: (v: string | null) => v || '-' },
    {
      title: '操作', width: 120,
      render: (_: unknown, record: HospitalEnvironment) => (
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
        <Col><Title level={4} className="page-title">诊疗环境</Title></Col>
        <Col><Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>新增环境</Button></Col>
      </Row>
      <Card className="page-card">
        <Table rowKey="id" columns={columns} dataSource={data} loading={loading} pagination={false} />
      </Card>
      <Modal title={editRecord ? '编辑环境' : '新增环境'} open={modalOpen}
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

export default HAEnvironmentsPage;
