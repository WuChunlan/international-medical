import React, { useEffect, useState, useCallback } from 'react'
import { Card, Descriptions, Button, message, Form, Input, Spin, Alert } from 'antd'
import { EditOutlined, SaveOutlined, PlusOutlined } from '@ant-design/icons'
import api from '../../api'
import { useAdminAuthStore } from '../../store/authStore'
import type { Hospital } from '../../types'
import ImageUpload from '../../components/ImageUpload'
import MediaUploadList from '../../components/MediaUploadList'
import { StatusTag } from '../../components/StatusTag'
import FormRow from '../../components/FormRow'

const HospitalForm: React.FC<{ form: ReturnType<typeof Form.useForm>[0] }> = ({ form }) => (
  <Form form={form} layout="vertical">
    <FormRow>
      <Form.Item name="nameZh" label="中文名称" rules={[{ required: true }]}><Input /></Form.Item>
      <Form.Item name="nameEn" label="英文名称" rules={[{ required: true }]}><Input /></Form.Item>
    </FormRow>
    <FormRow>
      <Form.Item name="phone" label="联系电话"><Input /></Form.Item>
      <Form.Item name="contactPerson" label="联系人"><Input /></Form.Item>
    </FormRow>
    <Form.Item name="contactInfo" label="联系方式"><Input /></Form.Item>
    <FormRow>
      <Form.Item name="addressZh" label="中文地址"><Input /></Form.Item>
      <Form.Item name="addressEn" label="英文地址"><Input /></Form.Item>
    </FormRow>
    <Form.Item name="introZh" label="中文简介"><Input.TextArea rows={4} /></Form.Item>
    <Form.Item name="introEn" label="英文简介"><Input.TextArea rows={4} /></Form.Item>
    <Form.Item name="coverImageUrl" label="封面图片（首页列表展示，仅图片）">
      <ImageUpload category="hospitals/images" label="上传封面图" uploadUrl="/api/hospital-admin/upload" />
    </Form.Item>
  </Form>
)

const HAHospitalPage: React.FC = () => {
  const [hospital, setHospital] = useState<Hospital | null | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const { setAuth, username, role } = useAdminAuthStore()

  const fetchHospital = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/hospital-admin/hospital');
      setHospital(res.data ?? null);
    } catch {
      message.error('获取医院信息失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHospital(); }, [fetchHospital]);

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const res = await api.post('/api/hospital-admin/hospital', values);
      // Backend returns a new token with the hospitalId claim baked in
      const newToken = res.data as string;
      if (newToken) {
        // Parse hospitalId from the new token payload
        const payload = JSON.parse(atob(newToken.split('.')[1]));
        setAuth(newToken, username ?? '', role ?? 'hospital_admin', payload.hospital_id ?? null);
      }
      message.success('医院创建成功，等待审核');
      form.resetFields();
      fetchHospital();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      message.error(e.response?.data?.message ?? '创建失败');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = () => {
    form.setFieldsValue(hospital);
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      await api.put('/api/hospital-admin/hospital', values);
      message.success('保存成功，等待审核');
      setEditing(false);
      fetchHospital();
    } catch {
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading || hospital === undefined) return <Spin style={{ margin: 40 }} />

  // No hospital bound — show create form
  if (!hospital) {
    return (
      <div className="page-card">
        <div className="page-header">
          <h3 className="page-title">我的医院</h3>
        </div>
        <Alert
          type="info"
          message="您尚未绑定医院"
          description="请填写以下信息创建您的医院。创建后不可再新增，只能编辑。"
          style={{ marginBottom: 16 }}
          showIcon
        />
        <Card>
          <HospitalForm form={form} />
          <Button type="primary" icon={<PlusOutlined />} loading={saving} onClick={handleCreate}>
            创建医院
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="page-card">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 className="page-title">我的医院</h3>
        </div>
        <div>
          {!editing ? (
            <Button type="primary" icon={<EditOutlined />} onClick={handleEdit}>编辑</Button>
          ) : (
            <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>保存</Button>
          )}
        </div>
      </div>

      {hospital.auditStatus === 'rejected' && hospital.rejectionReason && (
        <Alert type="error" message={`驳回原因：${hospital.rejectionReason}`} style={{ marginBottom: 16 }} showIcon />
      )}

      {!editing && (
        <Card>
          <Descriptions column={2} bordered>
            <Descriptions.Item label="审核状态">
              <StatusTag status={hospital.auditStatus as 'approved' | 'pending' | 'rejected'} />
            </Descriptions.Item>
            <Descriptions.Item label="中文名称">{hospital.nameZh}</Descriptions.Item>
            <Descriptions.Item label="英文名称">{hospital.nameEn}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{hospital.phone}</Descriptions.Item>
            <Descriptions.Item label="联系人">{hospital.contactPerson}</Descriptions.Item>
            <Descriptions.Item label="联系方式">{hospital.contactInfo}</Descriptions.Item>
            <Descriptions.Item label="中文地址" span={2}>{hospital.addressZh}</Descriptions.Item>
            <Descriptions.Item label="英文地址" span={2}>{hospital.addressEn}</Descriptions.Item>
            <Descriptions.Item label="中文简介" span={2}>{hospital.introZh}</Descriptions.Item>
            <Descriptions.Item label="英文简介" span={2}>{hospital.introEn}</Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      {editing && (
        <Card>
          <HospitalForm form={form} />
        </Card>
      )}

      {hospital.id && (
        <Card title="轮播图片 / 视频（详情页展示，支持图片和视频）" style={{ marginTop: 16 }}>
          <MediaUploadList
            entityType="hospital"
            entityId={hospital.id}
            uploadUrl="/api/hospital-admin/upload"
            mediaApiUrl="/api/hospital-admin/media"
          />
        </Card>
      )}
    </div>
  )
}

export default HAHospitalPage
