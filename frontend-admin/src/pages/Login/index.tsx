import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Modal } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { useAdminAuthStore } from '../../store/authStore';

const { Title } = Typography;

interface LoginForm {
  email: string;
  password: string;
}

interface ChangePasswordForm {
  newPassword: string;
  confirmPassword: string;
}

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [changePwModal, setChangePwModal] = useState(false);
  const [changePwLoading, setChangePwLoading] = useState(false);
  const [changePwForm] = Form.useForm<ChangePasswordForm>();
  const navigate = useNavigate();
  const { setAuth } = useAdminAuthStore();

  const doNavigate = (role: string) => {
    navigate(role === 'customer_rep' ? '/rep/dashboard' : '/dashboard');
  };

  const onFinish = async (values: LoginForm) => {
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', {
        email: values.email,
        password: values.password,
      });
      const payload = res.data;
      const role = payload.role;
      const allowedRoles = ['admin', 'hospital_admin', 'reviewer', 'customer_rep'];
      if (!role || !allowedRoles.includes(role)) {
        message.error('无管理员权限，请使用管理员账号登录');
        return;
      }
      const token = payload.token;
      if (!token) {
        message.error('登录失败：未获取到令牌');
        return;
      }
      setAuth(token, payload.username || values.email, role, payload.hospitalId ?? null, payload.mustChangePassword ?? false);
      if (payload.mustChangePassword) {
        setChangePwModal(true);
      } else {
        message.success('登录成功');
        doNavigate(role);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      message.error(error.response?.data?.message || '登录失败，请检查账号和密码');
    } finally {
      setLoading(false);
    }
  };

  const onChangePassword = async (values: ChangePasswordForm) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('两次输入的密码不一致');
      return;
    }
    setChangePwLoading(true);
    try {
      await api.put('/api/profile/change-password', {
        newPassword: values.newPassword,
      });
      const { logout } = useAdminAuthStore.getState();
      logout();
      setChangePwModal(false);
      message.success('密码修改成功，请用新密码重新登录');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      message.error(e.response?.data?.message || '修改失败，请重试');
    } finally {
      setChangePwLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Card
        className="login-card"
        bodyStyle={{ padding: '40px 40px 32px' }}
      >
        <div className="login-logo-wrap">
          <div className="login-logo-circle">
            <UserOutlined className="login-logo-icon" />
          </div>
          <Title level={3} className="login-title">
            管理后台登录
          </Title>
          <Typography.Text type="secondary" className="login-subtitle">
            国际医疗旅游平台
          </Typography.Text>
        </div>

        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="email"
            rules={[{ required: true, message: '请输入账号' }]}
          >
            <Input
              prefix={<UserOutlined className="login-input-icon" />}
              placeholder="管理员账号"
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined className="login-input-icon" />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item className="login-form-footer">
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              className="login-submit-btn"
            >
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Modal
        title="首次登录 — 请修改密码"
        open={changePwModal}
        closable={false}
        maskClosable={false}
        footer={null}
      >
        <Typography.Paragraph type="secondary" style={{ marginBottom: 20 }}>
          您的账号是初次登录，请先设置新密码后再使用系统。
        </Typography.Paragraph>
        <Form form={changePwForm} layout="vertical" onFinish={onChangePassword}>
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[{ required: true, min: 6, message: '至少6位' }]}
          >
            <Input.Password placeholder="请设置新密码（至少6位）" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="确认密码"
            rules={[{ required: true, message: '请再次输入新密码' }]}
          >
            <Input.Password placeholder="再次输入新密码" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" loading={changePwLoading} block>
              确认修改并进入系统
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Login;
