import React, { useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select, message } from 'antd';
import api from '../../api';
import type { Doctor, Hospital } from '../../types';
import MediaUploadList from '../../components/MediaUploadList';

interface DoctorFormProps {
  open: boolean;
  record: Doctor | null;
  hospitals: Hospital[];
  onClose: (refresh?: boolean) => void;
}

const DoctorForm: React.FC<DoctorFormProps> = ({ open, record, hospitals, onClose }) => {
  const [form] = Form.useForm();
  const isEdit = !!record;

  useEffect(() => {
    if (open) {
      if (record) {
        form.setFieldsValue(record);
      } else {
        form.resetFields();
        form.setFieldsValue({ sortOrder: 0, isActive: 1 });
      }
    }
  }, [open, record, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (isEdit) {
        await api.put(`/api/admin/doctors/${record!.id}`, { ...record, ...values });
        message.success('更新成功');
      } else {
        await api.post('/api/admin/doctors', values);
        message.success('创建成功');
      }
      onClose(true);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; errorFields?: unknown[] };
      if (error.errorFields) return;
      message.error(error.response?.data?.message || (isEdit ? '更新失败' : '创建失败'));
    }
  };

  return (
    <Modal
      title={isEdit ? '编辑医生' : '新增医生'}
      open={open}
      onOk={handleOk}
      onCancel={() => onClose()}
      okText={isEdit ? '保存' : '创建'}
      cancelText="取消"
      width={720}
      destroyOnClose
    >
      <Form form={form} layout="vertical" className="form-wrap">
        <Form.Item
          name="hospitalId"
          label="所属医院"
          rules={[{ required: true, message: '请选择所属医院' }]}
        >
          <Select
            placeholder="请选择所属医院"
            options={hospitals.map((h) => ({ value: h.id, label: h.nameZh }))}
          />
        </Form.Item>

        <Form.Item
          name="nameZh"
          label="中文姓名"
          rules={[{ required: true, message: '请输入中文姓名' }]}
        >
          <Input placeholder="请输入中文姓名" />
        </Form.Item>

        <Form.Item
          name="nameEn"
          label="英文姓名"
          rules={[{ required: true, message: '请输入英文姓名' }]}
        >
          <Input placeholder="请输入英文姓名" />
        </Form.Item>

        <Form.Item name="titleZh" label="中文职称">
          <Input placeholder="请输入中文职称" />
        </Form.Item>

        <Form.Item name="titleEn" label="英文职称">
          <Input placeholder="请输入英文职称" />
        </Form.Item>

        <Form.Item
          name="specialtyZh"
          label="中文科室/专长"
          rules={[{ required: true, message: '请输入中文科室' }]}
        >
          <Input placeholder="请输入中文科室/专长" />
        </Form.Item>

        <Form.Item
          name="specialtyEn"
          label="英文科室/专长"
          rules={[{ required: true, message: '请输入英文科室' }]}
        >
          <Input placeholder="请输入英文科室/专长" />
        </Form.Item>

        <Form.Item name="bioZh" label="中文简介">
          <Input.TextArea rows={3} placeholder="请输入中文简介" />
        </Form.Item>

        <Form.Item name="bioEn" label="英文简介">
          <Input.TextArea rows={3} placeholder="请输入英文简介" />
        </Form.Item>

        <Form.Item name="pricePerVisit" label="每次诊费">
          <InputNumber min={0} className="input-number-full" placeholder="请输入诊费金额" />
        </Form.Item>

        <Form.Item name="sortOrder" label="排序">
          <InputNumber min={0} className="input-number-full" placeholder="排序值（数字越小越靠前）" />
        </Form.Item>
      </Form>

      <MediaUploadList entityType="doctor" entityId={record?.id ?? null} />
    </Modal>
  );
};

export default DoctorForm;
