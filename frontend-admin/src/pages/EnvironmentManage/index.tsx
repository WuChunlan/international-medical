import React, { useEffect, useState } from 'react';
import {
  Table, Button, Modal, Form, Input, InputNumber, Switch,
  Space, Popconfirm, message, Select, Upload, Image
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '../../api';
import type { Hospital, HospitalEnvironment } from '../../types';

const { TextArea } = Input;

const EnvironmentManage: React.FC = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState<number | null>(null);
  const [environments, setEnvironments] = useState<HospitalEnvironment[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<HospitalEnvironment | null>(null);
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api.get('/api/admin/hospitals', { params: { page: 1, size: 100 } }).then((res) => {
      setHospitals(res.data.records || []);
    });
  }, []);

  const fetchEnvironments = async (hospitalId: number) => {
    setLoading(true);
    try {
      const res = await api.get<HospitalEnvironment[]>('/api/admin/hospital-environments', {
        params: { hospitalId },
      });
      setEnvironments(res.data);
    } finally {
      setLoading(false);
    }
  };

  const handleHospitalChange = (id: number) => {
    setSelectedHospitalId(id);
    fetchEnvironments(id);
  };

  const openCreate = () => {
    if (!selectedHospitalId) { message.warning('请先选择医院'); return; }
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ hospitalId: selectedHospitalId, sortOrder: 0, isActive: true });
    setModalOpen(true);
  };

  const openEdit = (record: HospitalEnvironment) => {
    setEditing(record);
    form.setFieldsValue({ ...record, isActive: record.isActive === 1 });
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    await api.delete(`/api/admin/hospital-environments/${id}`);
    message.success('删除成功');
    if (selectedHospitalId) fetchEnvironments(selectedHospitalId);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const payload = { ...values, isActive: values.isActive ? 1 : 0 };
    if (editing) {
      await api.put(`/api/admin/hospital-environments/${editing.id}`, payload);
      message.success('更新成功');
    } else {
      await api.post('/api/admin/hospital-environments', payload);
      message.success('创建成功');
    }
    setModalOpen(false);
    if (selectedHospitalId) fetchEnvironments(selectedHospitalId);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'environments');
      const res = await api.post<string>('/api/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      form.setFieldValue('imageUrl', res.data);
      message.success('上传成功');
    } catch {
      message.error('上传失败');
    } finally {
      setUploading(false);
    }
    return false;
  };

  const columns: ColumnsType<HospitalEnvironment> = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    {
      title: '图片', dataIndex: 'imageUrl', width: 80,
      render: (url) => url ? <Image src={url} width={50} height={50} style={{ objectFit: 'cover' }} /> : '-',
    },
    { title: '名称（中）', dataIndex: 'nameZh' },
    { title: '名称（英）', dataIndex: 'nameEn' },
    {
      title: '简介（中）', dataIndex: 'descZh',
      render: (v) => v ? <span style={{ fontSize: 12 }}>{v.slice(0, 40)}{v.length > 40 ? '...' : ''}</span> : '-',
    },
    { title: '排序', dataIndex: 'sortOrder', width: 70 },
    {
      title: '状态', dataIndex: 'isActive', width: 70,
      render: (v) => <Switch checked={v === 1} disabled size="small" />,
    },
    {
      title: '操作', width: 120,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>编辑</Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>诊疗环境管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增环境</Button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Select
          placeholder="请选择医院"
          style={{ width: 300 }}
          onChange={handleHospitalChange}
          options={hospitals.map((h) => ({ value: h.id, label: h.nameZh }))}
        />
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={environments}
        loading={loading}
        pagination={false}
      />

      <Modal
        title={editing ? '编辑诊疗环境' : '新增诊疗环境'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={640}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="hospitalId" hidden><Input /></Form.Item>
          <Form.Item name="nameZh" label="名称（中文）" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="nameEn" label="名称（英文）" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
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
          <Form.Item name="sortOrder" label="排序">
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item name="isActive" label="启用" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EnvironmentManage;
