import React, { useEffect, useState } from 'react';
import { Form, Input, Select, Button, Card, Typography, message } from 'antd';
import api from '../../api';
import type { Hospital } from '../../types';

const { Title } = Typography;

const CreateStaffPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [roleId, setRoleId] = useState<number | undefined>(undefined);

  useEffect(() => {
    api.get('/api/admin/hospitals', { params: { page: 1, size: 200 } }).then((res) => {
      const d = res.data?.data ?? res.data;
      setHospitals(d?.records ?? d?.list ?? []);
    }).catch(() => {});
  }, []);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await api.post('/api/admin/users/staff', values);
      message.success('账号创建成功');
      form.resetFields();
      setRoleId(undefined);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      if (e.response?.data?.message) {
        message.error(e.response.data.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Title level={4} className="page-title" style={{ marginBottom: 16 }}>创建员工账号</Title>
      <Card className="page-card" style={{ maxWidth: 560 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="email" label="邮箱" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="登录邮箱" />
          </Form.Item>
          <Form.Item name="password" label="初始密码" rules={[{ required: true, min: 6 }]}>
            <Input.Password placeholder="至少6位" />
          </Form.Item>
          <Form.Item name="lastName" label="姓"><Input /></Form.Item>
          <Form.Item name="firstName" label="名"><Input /></Form.Item>
          <Form.Item name="roleId" label="角色" rules={[{ required: true }]}>
            <Select placeholder="选择角色" onChange={(v: number) => setRoleId(v)}>
              <Select.Option value={3}>医院管理员</Select.Option>
              <Select.Option value={4}>信息审核员</Select.Option>
            </Select>
          </Form.Item>
          {roleId === 3 && (
            <Form.Item name="hospitalId" label="绑定医院" rules={[{ required: true }]}>
              <Select placeholder="选择医院" showSearch
                filterOption={(input, option) =>
                  String(option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                }>
                {hospitals.map((h) => (
                  <Select.Option key={h.id} value={h.id}>{h.nameZh}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              创建账号
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default CreateStaffPage;
