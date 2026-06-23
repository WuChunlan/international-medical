import React, { useEffect, useState, useCallback } from 'react';
import {
  Table, Button, Space, Popconfirm, message, Card, Typography, Row, Col,
  Tag, Modal, Form, Input, Select,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined, StopOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '../../api';
import type { User, Hospital } from '../../types';

const { Title } = Typography;

const HospitalAdminManage: React.FC = () => {
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [current, setCurrent] = useState(1);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<User | null>(null);
  const [form] = Form.useForm();

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/users/hospital-admins', { params: { page, size: 10 } });
      const d = res.data?.data ?? res.data;
      setData(d?.records ?? d?.list ?? []);
      setTotal(d?.total ?? 0);
    } catch {
      message.error('获取医院管理员列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(current);
    api.get('/api/admin/hospitals', { params: { page: 1, size: 500 } }).then((res) => {
      const d = res.data?.data ?? res.data;
      setHospitals(d?.records ?? d?.list ?? []);
    }).catch(() => {});
  }, [fetchData, current]);

  const openCreate = () => {
    setEditRecord(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record: User) => {
    setEditRecord(record);
    form.setFieldsValue({
      email: record.email,
      firstName: record.firstName,
      lastName: record.lastName,
      hospitalId: record.hospitalId,
    });
    setModalOpen(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (editRecord) {
        await api.put(`/api/admin/users/hospital-admins/${editRecord.id}`, values);
        message.success('更新成功');
      } else {
        await api.post('/api/admin/users/staff', { ...values, roleId: 3 });
        message.success('创建成功');
      }
      setModalOpen(false);
      fetchData(current);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      if (e.response?.data?.message) message.error(e.response.data.message);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/admin/users/hospital-admins/${id}`);
      message.success('删除成功');
      fetchData(current);
    } catch {
      message.error('删除失败');
    }
  };

  const hospitalName = (id?: number | null) => {
    if (!id) return '-';
    const h = hospitals.find((x) => x.id === id);
    return h ? h.nameZh : String(id);
  };

  const columns: ColumnsType<User> = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    {
      title: '姓名', width: 120,
      render: (_: unknown, r: User) => [r.lastName, r.firstName].filter(Boolean).join(' ') || '-',
    },
    { title: '邮箱', dataIndex: 'email', ellipsis: true },
    {
      title: '绑定医院', dataIndex: 'hospitalId',
      render: (v: number | null | undefined) => hospitalName(v),
    },
    {
      title: '状态', dataIndex: 'isActive', width: 90,
      render: (v: number) => v === 1
        ? <Tag color="success" icon={<CheckCircleOutlined />}>正常</Tag>
        : <Tag color="error" icon={<StopOutlined />}>禁用</Tag>,
    },
    {
      title: '操作', width: 140,
      render: (_: unknown, record: User) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>编辑</Button>
          <Popconfirm title="确认删除该账号？" onConfirm={() => handleDelete(record.id)} okText="确认" cancelText="取消">
            <Button type="link" danger size="small" icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" className="page-header-row">
        <Col><Title level={4} className="page-title">医院管理员账号</Title></Col>
        <Col><Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增管理员</Button></Col>
      </Row>
      <Card className="page-card">
        <Table rowKey="id" columns={columns} dataSource={data} loading={loading}
          pagination={{ current, pageSize: 10, total, showTotal: (t) => `共 ${t} 条`, onChange: (p) => setCurrent(p) }} />
      </Card>

      <Modal
        title={editRecord ? '编辑医院管理员' : '新增医院管理员'}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={() => setModalOpen(false)}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="email" label="邮箱" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="登录邮箱" />
          </Form.Item>
          <Form.Item
            name="password"
            label={editRecord ? '新密码（留空不修改）' : '初始密码'}
            rules={editRecord ? [] : [{ required: true, min: 6, message: '至少6位' }]}
          >
            <Input.Password placeholder={editRecord ? '留空则不修改密码' : '至少6位'} />
          </Form.Item>
          <Form.Item name="lastName" label="姓"><Input /></Form.Item>
          <Form.Item name="firstName" label="名"><Input /></Form.Item>
          <Form.Item name="hospitalId" label="绑定医院" rules={[{ required: true, message: '必须绑定一个医院' }]}>
            <Select placeholder="选择医院" showSearch
              filterOption={(input, option) =>
                String(option?.children ?? '').toLowerCase().includes(input.toLowerCase())
              }>
              {hospitals.map((h) => (
                <Select.Option key={h.id} value={h.id}>{h.nameZh}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default HospitalAdminManage;
