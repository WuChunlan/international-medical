import React, { useEffect, useState, useCallback } from 'react'
import { Form, Input, Button, Spin, message, Divider, Row, Col } from 'antd'
import { SaveOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import api from '../../api'
import type { SiteConfig } from '../../types'
import ImageUpload from '../../components/ImageUpload'

const CONFIG_LABELS: Record<string, string> = {
  site_name: '网站名称',
  site_subtitle: '网站副标题',
  site_logo_url: '网站Logo',
  site_intro: '首页简介',
  contact_contacts: '默认联系人列表',
  site_a_base_url: '客户端站点地址（邀请二维码用）',
}

const TARGET_KEYS = [
  'site_name', 'site_subtitle', 'site_logo_url', 'site_intro',
  'contact_contacts', 'site_a_base_url',
]

interface ContactEntry { name: string; phone: string }
interface ConfigFormValues { valueZh: string; valueEn: string }

const ContactsConfigForm: React.FC<{
  initialValues: ConfigFormValues
  saving: boolean
  onSave: (values: ConfigFormValues) => void
}> = ({ initialValues, saving, onSave }) => {
  const parseContacts = (v: string): ContactEntry[] => {
    try {
      const parsed = JSON.parse(v)
      if (Array.isArray(parsed)) return parsed
    } catch { /* ignore */ }
    return [{ name: '', phone: '' }]
  }

  const [contacts, setContacts] = useState<ContactEntry[]>(() => parseContacts(initialValues.valueZh))

  useEffect(() => {
    setContacts(parseContacts(initialValues.valueZh))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues.valueZh])

  const update = (idx: number, field: keyof ContactEntry, val: string) => {
    setContacts(prev => prev.map((c, i) => i === idx ? { ...c, [field]: val } : c))
  }

  const add = () => setContacts(prev => [...prev, { name: '', phone: '' }])
  const remove = (idx: number) => setContacts(prev => prev.filter((_, i) => i !== idx))

  const handleSave = () => {
    const clean = contacts.filter(c => c.name || c.phone)
    const json = JSON.stringify(clean)
    onSave({ valueZh: json, valueEn: json })
  }

  return (
    <div>
      {contacts.map((c, idx) => (
        <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
          <Input
            placeholder="联系人姓名"
            value={c.name}
            onChange={e => update(idx, 'name', e.target.value)}
            style={{ flex: 1 }}
          />
          <Input
            placeholder="联系电话"
            value={c.phone}
            onChange={e => update(idx, 'phone', e.target.value)}
            style={{ flex: 1 }}
          />
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => remove(idx)}
            disabled={contacts.length === 1}
          />
        </div>
      ))}
      <Button icon={<PlusOutlined />} onClick={add} style={{ marginBottom: 16 }}>
        添加联系人
      </Button>
      <Divider style={{ margin: '12px 0' }} />
      <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
        保存
      </Button>
    </div>
  )
}

const LogoConfigForm: React.FC<{
  initialValues: ConfigFormValues
  saving: boolean
  onSave: (values: ConfigFormValues) => void
}> = ({ initialValues, saving, onSave }) => {
  const [form] = Form.useForm<ConfigFormValues>()

  useEffect(() => {
    form.setFieldsValue(initialValues)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, initialValues.valueZh, initialValues.valueEn])

  return (
    <Form form={form} layout="vertical" onFinish={onSave}>
      <Row gutter={16} align="middle">
        <Col xs={24} md={12}>
          <Form.Item name="valueZh" label="Logo URL（中英文共用）">
            <Input placeholder="上传后自动填入，或手动输入URL" />
          </Form.Item>
          <Form.Item label="上传新Logo（替换原有）">
            <ImageUpload category="misc" label="选择Logo图片" onChange={url => form.setFieldsValue({ valueZh: url, valueEn: url })} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item noStyle shouldUpdate>
            {() => {
              const url = form.getFieldValue('valueZh')
              return url ? (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: '#888', marginBottom: 8, fontSize: 12 }}>当前Logo预览</p>
                  <img src={url} alt="logo preview" style={{ maxWidth: 160, maxHeight: 160, objectFit: 'contain', border: '1px solid #E5E7EB', padding: 8, borderRadius: 4 }} />
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#bbb', fontSize: 12 }}>暂无Logo</div>
              )
            }}
          </Form.Item>
        </Col>
      </Row>
      <Divider style={{ margin: '12px 0' }} />
      <Form.Item style={{ marginBottom: 0 }}>
        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>保存</Button>
      </Form.Item>
    </Form>
  )
}

const ConfigItemForm: React.FC<{
  configKey: string
  initialValues: ConfigFormValues
  saving: boolean
  onSave: (values: ConfigFormValues) => void
}> = ({ initialValues, saving, onSave }) => {
  const [form] = Form.useForm<ConfigFormValues>()

  useEffect(() => {
    form.setFieldsValue(initialValues)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, initialValues.valueZh, initialValues.valueEn])

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
      <Divider style={{ margin: '12px 0' }} />
      <Form.Item style={{ marginBottom: 0 }}>
        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>保存</Button>
      </Form.Item>
    </Form>
  )
}

const SiteConfigPage: React.FC = () => {
  const [configs, setConfigs] = useState<SiteConfig[]>([])
  const [loading, setLoading] = useState(false)
  const [savingKey, setSavingKey] = useState<string | null>(null)

  const fetchConfigs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/admin/config')
      const d = res.data?.data || res.data
      const list: SiteConfig[] = Array.isArray(d) ? d : d?.records || d?.list || []
      setConfigs(list.filter(c => TARGET_KEYS.includes(c.configKey)))
    } catch {
      message.error('获取配置失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchConfigs() }, [fetchConfigs])

  const handleSave = async (configKey: string, values: ConfigFormValues) => {
    setSavingKey(configKey)
    try {
      await api.put(`/api/admin/config/${configKey}`, { valueZh: values.valueZh, valueEn: values.valueEn })
      message.success('保存成功')
      fetchConfigs()
    } catch {
      message.error('保存失败')
    } finally {
      setSavingKey(null)
    }
  }

  return (
    <div className="page-card">
      <div className="page-header">
        <h3 className="page-title">网站配置</h3>
        <p className="page-description">管理网站基础信息和联系方式</p>
      </div>
      <Spin spinning={loading}>
        {TARGET_KEYS.map(key => {
          const config = configs.find(c => c.configKey === key)
          const label = CONFIG_LABELS[key] || key
          const initialValues = { valueZh: config?.valueZh || '', valueEn: config?.valueEn || '' }

          return (
            <div key={key} style={{ marginBottom: 24, padding: '20px 0', borderBottom: '1px solid #E5E7EB' }}>
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: '#0A2540' }}>{label}</span>
                <span style={{ marginLeft: 8, fontSize: 12, color: '#9CA3AF' }}>({key})</span>
              </div>
              {key === 'site_logo_url' ? (
                <LogoConfigForm initialValues={initialValues} saving={savingKey === key} onSave={values => handleSave(key, values)} />
              ) : key === 'contact_contacts' ? (
                <ContactsConfigForm initialValues={initialValues} saving={savingKey === key} onSave={values => handleSave(key, values)} />
              ) : (
                <ConfigItemForm configKey={key} initialValues={initialValues} saving={savingKey === key} onSave={values => handleSave(key, values)} />
              )}
            </div>
          )
        })}
      </Spin>
    </div>
  )
}

export default SiteConfigPage
