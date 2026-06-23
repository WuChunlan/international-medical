import React, { useEffect, useState, useCallback } from 'react';
import { Card, Typography, Descriptions, Button, Tag, message, Form, Input, Spin } from 'antd';
import { EditOutlined, SaveOutlined } from '@ant-design/icons';
import api from '../../api';
import type { Hospital } from '../../types';

const { Title } = Typography;

const auditStatusTag = (status?: string) => {
  const map: Record<string, { color: string; label: string }> = {
    approved: { color: 'green', label: '已审核' },
    pending: { color: 'orange', label: '待审核' },
    rejected: { color: 'red', label: '已驳回' },
  };
  const s = map[status ?? ''] ?? { color: 'default', label: status ?? '-' };
  return <Tag color={s.color}>{s.label}</Tag>;
};

const HAHospitalPage: React.FC = () => {
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form] = Form.useForm();

  const fetchHospital = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/hospital-admin/hospital');
      setHospital(res.data?.data ?? res.data);
    } catch {
      message.error('获取医院信息失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHospital(); }, [fetchHospital]);

  const handleEdit = () => {
    form.setFieldsValue(hospital);
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      await api.put('/api/hospital-admin/hospital', values);
      message.success('保存成功，等待审核');
      setEditing(false);
      fetchHospital();
    } catch {
      message.error('保存失败');
    }
  };

  if (loading) return <Spin style={{ margin: 40 }} />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} className="page-title">我的医院</Title>
        {!editing ? (
          <Button type="primary" icon={<EditOutlined />} onClick={handleEdit}>编辑</Button>
        ) : (
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>保存</Button>
        )}
      </div>

      {hospital && !editing && (
        <Card>
          {hospital.auditStatus === 'rejected' && hospital.rejectionReason && (
            <div style={{ background: '#fff2f0', border: '1px solid #ffccc7', borderRadius: 4, padding: '8px 12px', marginBottom: 16 }}>
              <b>驳回原因：</b>{hospital.rejectionReason}
            </div>
          )}
          <Descriptions column={2} bordered>
            <Descriptions.Item label="审核状态">{auditStatusTag(hospital.auditStatus)}</Descriptions.Item>
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
          <Form form={form} layout="vertical">
            <Form.Item name="nameZh" label="中文名称" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="nameEn" label="英文名称" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="phone" label="联系电话"><Input /></Form.Item>
            <Form.Item name="contactPerson" label="联系人"><Input /></Form.Item>
            <Form.Item name="contactInfo" label="联系方式"><Input /></Form.Item>
            <Form.Item name="addressZh" label="中文地址"><Input /></Form.Item>
            <Form.Item name="addressEn" label="英文地址"><Input /></Form.Item>
            <Form.Item name="introZh" label="中文简介">
              <Input.TextArea rows={4} />
            </Form.Item>
            <Form.Item name="introEn" label="英文简介">
              <Input.TextArea rows={4} />
            </Form.Item>
          </Form>
        </Card>
      )}
    </div>
  );
};

export default HAHospitalPage;
