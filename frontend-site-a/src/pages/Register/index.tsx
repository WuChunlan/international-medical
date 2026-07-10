import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Form, Input, Button, message, Typography, Select, Radio } from 'antd';
import {
  UserOutlined, MailOutlined, LockOutlined, IdcardOutlined,
  GlobalOutlined, SafetyOutlined, PhoneOutlined, FileOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import api from '../../api';

const { Title, Text } = Typography;

const COUNTRIES = [
  'China', 'United States', 'United Kingdom', 'Canada', 'Australia',
  'Germany', 'France', 'Japan', 'South Korea', 'Singapore',
  'Malaysia', 'Thailand', 'India', 'Brazil', 'Russia',
  'Italy', 'Spain', 'Netherlands', 'Switzerland', 'Sweden',
  'Norway', 'Denmark', 'Finland', 'New Zealand', 'South Africa',
  'Egypt', 'Nigeria', 'Kenya', 'Saudi Arabia', 'UAE',
  'Turkey', 'Iran', 'Pakistan', 'Bangladesh', 'Indonesia',
  'Philippines', 'Vietnam', 'Myanmar', 'Cambodia', 'Laos',
  'Mongolia', 'Kazakhstan', 'Ukraine', 'Poland', 'Czech Republic',
  'Hungary', 'Romania', 'Bulgaria', 'Greece', 'Portugal',
  'Mexico', 'Argentina', 'Chile', 'Colombia', 'Peru',
  'Other',
];

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [searchParams] = useSearchParams();
  const inviteCode = searchParams.get('code') || '';
  const [inviteName, setInviteName] = useState<string | null>(null);
  const [inviteChecked, setInviteChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!inviteCode) return;
    form.setFieldsValue({ inviteCode });
    api.get(`/api/auth/invite-info?code=${encodeURIComponent(inviteCode)}`)
      .then((res) => {
        const d = res.data?.data ?? res.data;
        setInviteName(d?.valid ? d.repName : null);
        setInviteChecked(true);
        if (!d?.valid) message.warning(t('auth.invite_invalid'));
      })
      .catch(() => setInviteChecked(true));
  }, [inviteCode, form, t]);

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
    if (!email) { message.warning('Please enter your email first'); return; }
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

  const onFinish = async (values: Record<string, string>) => {
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
          <a href="/" className="auth-logo-link">
            <span className="logo-zh">国际医疗共享平台</span>
            <span className="logo-divider">·</span>
            <span className="logo-en">International Medical</span>
          </a>
        </div>

        <Title level={2} className="auth-title">{t('auth.register_title')}</Title>

        <Form form={form} name="register" onFinish={onFinish} layout="vertical" size="large" className="auth-form">
          <div className="auth-form__row">
            <Form.Item name="lastName" label={t('auth.last_name')} rules={[{ required: true }]} style={{ flex: 1 }}>
              <Input prefix={<UserOutlined />} placeholder={t('auth.last_name')} />
            </Form.Item>
            <Form.Item name="firstName" label={t('auth.first_name')} rules={[{ required: true }]} style={{ flex: 1 }}>
              <Input prefix={<UserOutlined />} placeholder={t('auth.first_name')} />
            </Form.Item>
          </div>

          <Form.Item name="gender" label={t('auth.gender')} rules={[{ required: true }]}>
            <Radio.Group>
              <Radio value="male">{t('auth.gender_male')}</Radio>
              <Radio value="female">{t('auth.gender_female')}</Radio>
              <Radio value="other">{t('auth.gender_other')}</Radio>
            </Radio.Group>
          </Form.Item>

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

          <Form.Item name="phone" label={t('auth.phone')}>
            <Input prefix={<PhoneOutlined />} placeholder={t('auth.phone')} />
          </Form.Item>

          <Form.Item
            name="password"
            label={t('auth.password')}
            rules={[
              { required: true, message: `${t('auth.password')} required` },
              { min: 8, message: 'Password must be at least 8 characters' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder={t('auth.password')} autoComplete="new-password" />
          </Form.Item>

          <Form.Item name="idCardNumber" label={t('auth.id_card')}>
            <Input prefix={<IdcardOutlined />} placeholder={t('auth.id_card')} />
          </Form.Item>

          <Form.Item name="passportNumber" label={t('auth.passport')}>
            <Input prefix={<FileOutlined />} placeholder={t('auth.passport')} />
          </Form.Item>

          <Form.Item name="idCardCountry" label={t('auth.id_card_country')}>
            <Select
              showSearch
              placeholder={t('auth.id_card_country')}
              optionFilterProp="label"
              options={COUNTRIES.map((c) => ({ value: c, label: c }))}
              suffixIcon={<GlobalOutlined />}
            />
          </Form.Item>

          <Form.Item name="inviteCode" hidden><Input /></Form.Item>
          {inviteCode && (
            <div style={{ marginBottom: 16, padding: '8px 12px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6 }}>
              {inviteName
                ? t('auth.invited_by', { name: inviteName })
                : (inviteChecked ? t('auth.invite_invalid') : '...')}
            </div>
          )}

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
            <Button type="primary" htmlType="submit" block loading={loading} className="auth-submit-btn">
              {t('auth.submit_register')}
            </Button>
          </Form.Item>
        </Form>

        <div className="auth-switch">
          <Text type="secondary">{t('auth.switch_login')}</Text>
          {' '}
          <Link to="/login" className="auth-switch-link">{t('nav.login')}</Link>
        </div>
      </div>
    </div>
  );
}
