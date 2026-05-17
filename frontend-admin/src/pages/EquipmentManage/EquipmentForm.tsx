import React, { useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select, message } from 'antd';
import api from '../../api';
import type { Equipment, Hospital } from '../../types';
import MediaUploadList from '../../components/MediaUploadList';

interface EquipmentFormProps {
  open: boolean;
  record: Equipment | null;
  hospitals: Hospital[];
  onClose: (refresh?: boolean) => void;
}

const EquipmentForm: React.FC<EquipmentFormProps> = ({ open, record, hospitals, onClose }) => {
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
        await api.put(`/api/admin/equipments/${record!.id}`, { ...record, ...values });
        message.success('更新成功');
      } else {
        await api.post('/api/admin/equipments', values);
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
      title={isEdit ? '编辑设备' : '新增设备'}
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
          label="中文名称"
          rules={[{ required: true, message: '请输入中文名称' }]}
        >
          <Input placeholder="请输入中文名称" />
        </Form.Item>

        <Form.Item
          name="nameEn"
          label="英文名称"
          rules={[{ required: true, message: '请输入英文名称' }]}
        >
          <Input placeholder="请输入英文名称" />
        </Form.Item>

        <Form.Item name="descZh" label="中文描述">
          <Input.TextArea rows={3} placeholder="请输入中文描述" />
        </Form.Item>

        <Form.Item name="descEn" label="英文描述">
          <Input.TextArea rows={3} placeholder="请输入英文描述" />
        </Form.Item>

        <Form.Item name="sortOrder" label="排序">
          <InputNumber min={0} className="input-number-full" placeholder="排序值（数字越小越靠前）" />
        </Form.Item>
      </Form>

      <MediaUploadList entityType="equipment" entityId={record?.id ?? null} />
    </Modal>
  );
};

export default EquipmentForm;
