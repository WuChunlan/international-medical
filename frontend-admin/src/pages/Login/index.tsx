import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { useAdminAuthStore } from '../../store/authStore';

const { Title } = Typography;

interface LoginForm {
  account: string;
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
        account: values.account,
        password: values.password,
      });
      const data = res.data;
      const payload = data.data || data;
      if (payload.role && payload.role !== 'admin') {
        message.error('无管理员权限');
        return;
      }
      const token = payload.token || payload.accessToken || payload.access_token;
      const username = payload.username || values.account;
      if (!token) {
        message.error('登录失败：未获取到令牌');
        return;
      }
      setAuth(token, username);
      message.success('登录成功');
      navigate('/dashboard');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      message.error(error.response?.data?.message || '登录失败，请检查账号密码');
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
            name="account"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined className="login-input-icon" />}
              placeholder="用户名"
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
