import React, { useEffect, useState, useCallback } from 'react';
import {
  Card, Form, Input, Button, Typography, Spin, message, Divider, Row, Col,
} from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import api from '../../api';
import type { SiteConfig } from '../../types';
import ImageUpload from '../../components/ImageUpload';

const { Title, Text } = Typography;

const CONFIG_LABELS: Record<string, string> = {
  site_name: '网站名称',
  site_subtitle: '网站副标题',
  site_logo_url: '网站Logo',
  site_intro: '首页简介',
  contact_default_person: '默认联系人',
  contact_default_info: '默认联系方式',
};

const TARGET_KEYS = [
  'site_name', 'site_subtitle', 'site_logo_url', 'site_intro',
  'contact_default_person', 'contact_default_info',
];

interface ConfigFormValues { valueZh: string; valueEn: string; }

const LogoConfigForm: React.FC<{
  initialValues: ConfigFormValues;
  saving: boolean;
  onSave: (values: ConfigFormValues) => void;
}> = ({ initialValues, saving, onSave }) => {
  const [form] = Form.useForm<ConfigFormValues>();

  useEffect(() => {
    form.setFieldsValue(initialValues);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, initialValues.valueZh, initialValues.valueEn]);

  return (
    <Form form={form} layout="vertical" onFinish={onSave}>
      <Row gutter={16} align="middle">
        <Col xs={24} md={12}>
          <Form.Item name="valueZh" label="Logo URL（中英文共用）">
            <Input placeholder="上传后自动填入，或手动输入URL" />
          </Form.Item>
          <Form.Item label="上传新Logo（替换原有）">
            <ImageUpload
              category="misc"
              label="选择Logo图片"
              onChange={(url) => {
                form.setFieldsValue({ valueZh: url, valueEn: url });
              }}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item noStyle shouldUpdate>
            {() => {
              const url = form.getFieldValue('valueZh');
              return url ? (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: '#888', marginBottom: 8, fontSize: 12 }}>当前Logo预览</p>
                  <img
                    src={url}
                    alt="logo preview"
                    style={{ maxWidth: 160, maxHeight: 160, objectFit: 'contain', border: '1px solid #eee', padding: 8, borderRadius: 4 }}
                  />
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#bbb', fontSize: 12 }}>暂无Logo</div>
              );
            }}
          </Form.Item>
        </Col>
      </Row>
      <Divider className="config-divider" />
      <Form.Item className="login-form-footer">
        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>保存</Button>
      </Form.Item>
    </Form>
  );
};

const ConfigItemForm: React.FC<{
  configKey: string;
  initialValues: ConfigFormValues;
  saving: boolean;
  onSave: (values: ConfigFormValues) => void;
}> = ({ initialValues, saving, onSave }) => {
  const [form] = Form.useForm<ConfigFormValues>();

  useEffect(() => {
    form.setFieldsValue(initialValues);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, initialValues.valueZh, initialValues.valueEn]);

  return (
    <Form form={form} layout="vertical" onFinish={onSave}>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item name="valueZh" label="中文内容" rules={[{ required: true, message: '请输入中文内容' }]}>
            <Input.TextArea rows={3} placeholder="请输入中文内容" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="valueEn" label="英文内容" rules={[{ required: true, message: '请输入英文内容' }]}>
            <Input.TextArea rows={3} placeholder="请输入英文内容" />
          </Form.Item>
        </Col>
      </Row>
      <Divider className="config-divider" />
      <Form.Item className="login-form-footer">
        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>保存</Button>
      </Form.Item>
    </Form>
  );
};

const SiteConfigPage: React.FC = () => {
  const [configs, setConfigs] = useState<SiteConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/config');
      const d = res.data?.data || res.data;
      const list: SiteConfig[] = Array.isArray(d) ? d : d?.records || d?.list || [];
      setConfigs(list.filter((c) => TARGET_KEYS.includes(c.configKey)));
    } catch {
      message.error('获取配置失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConfigs(); }, [fetchConfigs]);

  const handleSave = async (configKey: string, values: ConfigFormValues) => {
    setSavingKey(configKey);
    try {
      await api.put(`/api/admin/config/${configKey}`, { valueZh: values.valueZh, valueEn: values.valueEn });
      message.success('保存成功');
      fetchConfigs();
    } catch {
      message.error('保存失败');
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div>
      <Row justify="space-between" align="middle" className="page-header-row">
        <Col><Title level={4} className="page-title">网站配置</Title></Col>
      </Row>
      <Spin spinning={loading}>
        {TARGET_KEYS.map((key) => {
          const config = configs.find((c) => c.configKey === key);
          const label = CONFIG_LABELS[key] || key;
          const initialValues = { valueZh: config?.valueZh || '', valueEn: config?.valueEn || '' };

          return (
            <Card
              key={key}
              className="config-card"
              title={
                <span>
                  <Text strong>{label}</Text>
                  <Text type="secondary" className="config-key-hint">({key})</Text>
                </span>
              }
            >
              {key === 'site_logo_url' ? (
                <LogoConfigForm
                  initialValues={initialValues}
                  saving={savingKey === key}
                  onSave={(values) => handleSave(key, values)}
                />
              ) : (
                <ConfigItemForm
                  configKey={key}
                  initialValues={initialValues}
                  saving={savingKey === key}
                  onSave={(values) => handleSave(key, values)}
                />
              )}
            </Card>
          );
        })}
      </Spin>
    </div>
  );
};

export default SiteConfigPage;
