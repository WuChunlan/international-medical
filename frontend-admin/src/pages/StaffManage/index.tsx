import React, { useEffect, useState } from 'react';
import {
  Table, Button, Modal, Form, Input, Select, Space, Popconfirm, message, Tag
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import api from '../../api';
import type { Hospital } from '../../types';

interface RoleOption { id: number; code: string; nameZh: string; nameEn: string }
interface StaffUser {
  id: number; email: string; firstName?: string; lastName?: string;
  roleId: number; hospitalId?: number; isActive: number; mustChangePassword?: number;
  managedLang?: string;
}

const StaffManagePage: React.FC = () => {
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [data, setData] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchName, setSearchName] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [searchRoleCode, setSearchRoleCode] = useState<string | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StaffUser | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    api.get('/api/admin/users/roles').then(r => setRoles(r.data ?? [])).catch(() => {});
    api.get('/api/admin/hospitals', { params: { page: 1, size: 200 } }).then(r => {
      const d = r.data?.data ?? r.data;
      setHospitals(d?.records ?? d?.list ?? []);
    }).catch(() => {});
  }, []);

  const fetchList = (p = 1) => {
    setLoading(true);
    const params: Record<string, unknown> = { page: p, size: 10 };
    if (searchRoleCode) params.roleCode = searchRoleCode;
    if (searchName) params.name = searchName;
    if (searchEmail) params.email = searchEmail;

    api.get('/api/admin/users/staff', { params })
      .then(r => {
        const d = r.data?.data ?? r.data;
        setData(d?.records ?? []);
        setTotal(d?.total ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { setPage(1); fetchList(1); }, []);

  const handleSearch = () => { setPage(1); fetchList(1); };
  const handleReset = () => {
    setSearchName('');
    setSearchEmail('');
    setSearchRoleCode(undefined);
    setPage(1);
    setTimeout(() => fetchList(1), 0);
  };

  const openCreate = () => { setEditing(null); form.resetFields(); setModalOpen(true); };
  const openEdit = (r: StaffUser) => {
    setEditing(r);
    const roleCode = roles.find(role => role.id === r.roleId)?.code;
    form.setFieldsValue({
      email: r.email, firstName: r.firstName, lastName: r.lastName,
      roleCode, hospitalId: r.hospitalId, managedLang: r.managedLang,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitLoading(true);
      if (editing) {
        await api.put(`/api/admin/users/staff/${editing.id}`, values);
        message.success('更新成功');
      } else {
        await api.post('/api/admin/users/staff', values);
        message.success('创建成功');
      }
      setModalOpen(false);
      fetchList(page);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; errorFields?: unknown[] };
      if (e.response?.data?.message) message.error(e.response.data.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/admin/users/staff/${id}`);
      message.success('删除成功');
      fetchList(page);
    } catch {
      message.error('删除失败');
    }
  };

  const roleMap = Object.fromEntries(roles.map(r => [r.id, r.nameZh]));

  const columns = [
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    { title: '姓名', key: 'name', render: (_: unknown, r: StaffUser) =>
      [r.lastName, r.firstName].filter(Boolean).join('') || '-' },
    {
      title: '角色', key: 'role',
      render: (_: unknown, r: StaffUser) => roleMap[r.roleId] || '-'
    },
    {
      title: '状态', key: 'status',
      render: (_: unknown, r: StaffUser) =>
        <Tag color={r.isActive === 1 ? 'green' : 'red'}>{r.isActive === 1 ? '启用' : '禁用'}</Tag>
    },
    {
      title: '操作', key: 'action',
      render: (_: unknown, r: StaffUser) => (
        <Space>
          <Button size="small" onClick={() => openEdit(r)}>编辑</Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(r.id)}>
            <Button size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      )
    },
  ];

  const selectedRole = roles.find(r => r.code === form.getFieldValue('roleCode'));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 16, fontWeight: 600 }}>账号管理</span>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          新建账号
        </Button>
      </div>

      <div style={{ background: '#fafafa', padding: 16, marginBottom: 16, borderRadius: 4 }}>
        <Space size="middle" wrap>
          <Input
            placeholder="姓名"
            value={searchName}
            onChange={e => setSearchName(e.target.value)}
            style={{ width: 160 }}
            allowClear
          />
          <Input
            placeholder="邮箱"
            value={searchEmail}
            onChange={e => setSearchEmail(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
          <Select
            placeholder="角色"
            value={searchRoleCode}
            onChange={v => setSearchRoleCode(v)}
            style={{ width: 160 }}
            allowClear
          >
            {roles.filter(r => ['hospital_admin', 'reviewer', 'base_admin', 'translation_admin', 'customer_rep'].includes(r.code))
              .map(r => (
                <Select.Option key={r.code} value={r.code}>{r.nameZh}</Select.Option>
              ))}
          </Select>
          <Button type="primary" onClick={handleSearch}>查询</Button>
          <Button onClick={handleReset}>重置</Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={data}
        columns={columns}
        pagination={{ current: page, total, pageSize: 10, onChange: p => { setPage(p); fetchList(p); } }}
      />

      <Modal
        title={editing ? '编辑账号' : '新建账号'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={submitLoading}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
          <Form.Item name="email" label="邮箱/账号" rules={[{ required: true, message: '请输入邮箱/账号' }]}>
            <Input placeholder="输入邮箱或账号" disabled={!!editing} />
          </Form.Item>
          {!editing && (
            <Form.Item name="password" label="初始密码" rules={[{ required: true, min: 6, message: '至少6位' }]}>
              <Input.Password placeholder="至少6位" />
            </Form.Item>
          )}
          {editing && (
            <Form.Item name="password" label="新密码（不填则不修改）">
              <Input.Password placeholder="留空不修改" />
            </Form.Item>
          )}
          <Form.Item name="lastName" label="姓"><Input /></Form.Item>
          <Form.Item name="firstName" label="名"><Input /></Form.Item>
          <Form.Item name="roleCode" label="角色" rules={[{ required: true, message: '请选择角色' }]}>
            <Select placeholder="选择角色">
              {roles.filter(r => ['hospital_admin', 'reviewer', 'base_admin', 'translation_admin', 'customer_rep'].includes(r.code))
                .map(r => (
                  <Select.Option key={r.code} value={r.code}>{r.nameZh}</Select.Option>
                ))}
            </Select>
          </Form.Item>
          {selectedRole?.code === 'hospital_admin' && (
            <Form.Item name="hospitalId" label="绑定医院" rules={[{ required: true, message: '请选择医院' }]}>
              <Select placeholder="选择医院" showSearch
                filterOption={(input, option) =>
                  String(option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                }>
                {hospitals.map(h => (
                  <Select.Option key={h.id} value={h.id}>{h.nameZh}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}
          {selectedRole?.code === 'translation_admin' && (
            <Form.Item name="managedLang" label="管理语种">
              <Input placeholder="如：en, ja, ko" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default StaffManagePage;