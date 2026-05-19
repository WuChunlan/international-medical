import React, { useCallback, useEffect, useState } from 'react';
import {
  Table, Button, Modal, Form, Input, InputNumber, Switch,
  Space, Popconfirm, message, Image, Tooltip
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, TranslationOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '../../api';
import type { ServiceTeam, PageResult } from '../../types';
import ImageUpload from '../../components/ImageUpload';
import { useAutoTranslate } from '../../hooks/useAutoTranslate';

const { TextArea } = Input;

const ServiceTeamManage: React.FC = () => {
  'use no memo';
  const [teams, setTeams] = useState<ServiceTeam[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceTeam | null>(null);
  const [translating, setTranslating] = useState(false);
  const [form] = Form.useForm();
  const { translateField, translateAll } = useAutoTranslate(form);

  const fetchTeams = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await api.get<PageResult<ServiceTeam>>('/api/admin/service-teams', {
        params: { page: p, size: 10 },
      });
      setTeams(res.data.records);
      setTotal(res.data.total);
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchTeams(page); }, [fetchTeams, page]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ sortOrder: 0, isActive: true });
    setModalOpen(true);
  };

  const openEdit = (record: ServiceTeam) => {
    setEditing(record);
    form.setFieldsValue({ ...record, isActive: record.isActive === 1 });
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    await api.delete(`/api/admin/service-teams/${id}`);
    message.success('删除成功');
    fetchTeams();
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const payload = { ...values, isActive: values.isActive ? 1 : 0 };
    if (editing) {
      await api.put(`/api/admin/service-teams/${editing.id}`, payload);
      message.success('更新成功');
    } else {
      await api.post('/api/admin/service-teams', payload);
      message.success('创建成功');
    }
    setModalOpen(false);
    fetchTeams();
  };

  const handleTranslateAll = async () => {
    setTranslating(true);
    await translateAll();
    setTranslating(false);
    message.success('翻译完成');
  };

  const columns: ColumnsType<ServiceTeam> = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    {
      title: '图片', dataIndex: 'imageUrl', width: 80,
      render: (url) => url ? <Image src={url} width={50} height={50} style={{ objectFit: 'cover' }} /> : '-',
    },
    { title: '团队名称（中）', dataIndex: 'nameZh' },
    { title: '团队名称（英）', dataIndex: 'nameEn' },
    {
      title: '简介（中）', dataIndex: 'introZh',
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
        <h2 style={{ margin: 0 }}>服务团队管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增团队</Button>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={teams}
        loading={loading}
        pagination={{ current: page, total, pageSize: 10, onChange: setPage }}
      />

      <Modal
        title={editing ? '编辑服务团队' : '新增服务团队'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={640}
        okText="保存"
        cancelText="取消"
      >
        <div style={{ textAlign: 'right', marginBottom: 12 }}>
          <Tooltip title="将所有中文字段自动翻译到对应英文字段（不覆盖已填写的英文内容）">
            <Button icon={<TranslationOutlined />} loading={translating} onClick={handleTranslateAll} size="small">
              一键翻译中→英
            </Button>
          </Tooltip>
        </div>
        <Form form={form} layout="vertical">
          <Form.Item name="nameZh" label="团队名称（中文）" rules={[{ required: true }]}>
            <Input placeholder="请输入中文名称" onBlur={() => translateField('nameZh')} />
          </Form.Item>
          <Form.Item name="nameEn" label="团队名称（英文）" rules={[{ required: true }]}>
            <Input placeholder="输入中文名称后可自动翻译" />
          </Form.Item>
          <Form.Item name="introZh" label="团队简介（中文）">
            <TextArea rows={3} placeholder="请输入中文简介" onBlur={() => translateField('introZh')} />
          </Form.Item>
          <Form.Item name="introEn" label="团队简介（英文）">
            <TextArea rows={3} placeholder="输入中文简介后可自动翻译" />
          </Form.Item>
          <Form.Item name="imageUrl" label="团队图片">
            <ImageUpload category="service-teams/images" label="上传图片" />
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

export default ServiceTeamManage;
