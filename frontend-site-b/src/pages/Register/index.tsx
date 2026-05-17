import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, message, Typography } from 'antd';
import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
  IdcardOutlined,
  GlobalOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import api from '../../api';

const { Title, Text } = Typography;

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCountdown = () => {
    setCountdown(60);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendCode = async () => {
    const email = form.getFieldValue('email');
    if (!email) {
      message.warning('Please enter your email first');
      return;
    }
    setSendingCode(true);
    try {
      await api.post(`/api/auth/send-code?email=${encodeURIComponent(email)}`);
      message.success('Verification code sent!');
      startCountdown();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      message.error(axiosErr.response?.data?.message || 'Failed to send code');
    } finally {
      setSendingCode(false);
    }
  };

  const onFinish = async (values: {
    username: string;
    email: string;
    password: string;
    idCardNumber: string;
    idCardCountry: string;
    verifyCode: string;
  }) => {
    setLoading(true);
    try {
      await api.post('/api/auth/register', values);
      message.success('Registration successful! Please login.');
      navigate('/login');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      message.error(axiosErr.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card--wide">
        <div className="auth-card__logo">
          <a href="http://localhost:3000" className="auth-logo-link">
            <span className="logo-zh">国际医疗</span>
            <span className="logo-divider">·</span>
            <span className="logo-en">International Medical</span>
          </a>
        </div>

        <Title level={2} className="auth-title">
          {t('auth.register_title')}
        </Title>

        <Form
          form={form}
          name="register"
          onFinish={onFinish}
          layout="vertical"
          size="large"
          className="auth-form"
        >
          <Form.Item
            name="username"
            label={t('auth.username')}
            rules={[{ required: true, message: `${t('auth.username')} required` }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder={t('auth.username')}
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item
            name="email"
            label={t('auth.email')}
            rules={[
              { required: true, message: `${t('auth.email')} required` },
              { type: 'email', message: 'Invalid email format' },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder={t('auth.email')}
              autoComplete="email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={t('auth.password')}
            rules={[
              { required: true, message: `${t('auth.password')} required` },
              { min: 6, message: 'Password must be at least 6 characters' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder={t('auth.password')}
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item
            name="idCardNumber"
            label={t('auth.id_card')}
            rules={[{ required: true, message: `${t('auth.id_card')} required` }]}
          >
            <Input
              prefix={<IdcardOutlined />}
              placeholder={t('auth.id_card')}
            />
          </Form.Item>

          <Form.Item
            name="idCardCountry"
            label={t('auth.id_card_country')}
            rules={[{ required: true, message: `${t('auth.id_card_country')} required` }]}
          >
            <Input
              prefix={<GlobalOutlined />}
              placeholder={t('auth.id_card_country')}
            />
          </Form.Item>

          <Form.Item
            name="verifyCode"
            label={t('auth.verify_code')}
            rules={[{ required: true, message: `${t('auth.verify_code')} required` }]}
          >
            <Input
              prefix={<SafetyOutlined />}
              placeholder={t('auth.verify_code')}
              addonAfter={
                <Button
                  type="link"
                  size="small"
                  disabled={countdown > 0 || sendingCode}
                  loading={sendingCode}
                  onClick={handleSendCode}
                  className="send-code-btn"
                >
                  {countdown > 0 ? `${countdown}s` : t('auth.send_code')}
                </Button>
              }
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              className="auth-submit-btn"
            >
              {t('auth.submit_register')}
            </Button>
          </Form.Item>
        </Form>

        <div className="auth-switch">
          <Text type="secondary">{t('auth.switch_login')}</Text>
          {' '}
          <Link to="/login" className="auth-switch-link">
            {t('nav.login')}
          </Link>
        </div>
      </div>
    </div>
  );
}
