import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Form, Input, Button, message, Typography } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import api from '../../api';
import { useAuthStore } from '../../store/authStore';
import type { AuthState } from '../../store/authStore';

const { Title, Text } = Typography;

interface LoginResponse {
  token: string;
  username: string;
  role: string;
}

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setUser = useAuthStore((s: AuthState) => s.setUser);
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const res = await api.post<LoginResponse>('/api/auth/login', {
        email: values.email,
        password: values.password,
      });
      const { token, username, role } = res.data;
      setUser({ token, username, role });
      message.success(t('auth.submit_login') + ' ✓');
      const redirect = searchParams.get('redirect');
      navigate(redirect ? decodeURIComponent(redirect) : '/profile', { replace: true });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      message.error(axiosErr.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__logo">
          <a href="/" className="auth-logo-link">
            <span className="logo-zh">国际医疗共享平台</span>
            <span className="logo-divider">·</span>
            <span className="logo-en">International Medical</span>
          </a>
        </div>

        <Title level={2} className="auth-title">{t('auth.login_title')}</Title>

        <Form name="login" onFinish={onFinish} layout="vertical" size="large" className="auth-form">
          <Form.Item
            name="email"
            label={t('auth.email')}
            rules={[
              { required: true, message: `${t('auth.email')} required` },
              { type: 'email', message: 'Invalid email format' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder={t('auth.email')} autoComplete="email" />
          </Form.Item>

          <Form.Item
            name="password"
            label={t('auth.password')}
            rules={[{ required: true, message: `${t('auth.password')} required` }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder={t('auth.password')} autoComplete="current-password" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading} className="auth-submit-btn">
              {t('auth.submit_login')}
            </Button>
          </Form.Item>
        </Form>

        <div className="auth-switch">
          <Text type="secondary">{t('auth.switch_register')}</Text>
          {' '}
          <Link to="/register" className="auth-switch-link">{t('nav.register')}</Link>
        </div>
      </div>
    </div>
  );
}
