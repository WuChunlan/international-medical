import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { useAdminAuthStore } from '../../store/authStore';

const { Title } = Typography;

interface LoginForm {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAdminAuthStore();

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
      setAuth(token, payload.username || values.email, role, payload.hospitalId ?? null);
      message.success('登录成功');
      navigate('/dashboard');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      message.error(error.response?.data?.message || '登录失败，请检查邮箱和密码');
    } finally {
      setLoading(false);
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
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '邮箱格式不正确' },
            ]}
          >
            <Input
              prefix={<UserOutlined className="login-input-icon" />}
              placeholder="管理员邮箱"
              autoComplete="email"
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
    </div>
  );
};

export default Login;
