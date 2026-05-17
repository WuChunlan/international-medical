import React, { useEffect } from 'react';
import { Modal, Form, Input, InputNumber, message } from 'antd';
import api from '../../api';
import type { SpecialProduct } from '../../types';
import MediaUploadList from '../../components/MediaUploadList';

interface ProductFormProps {
  open: boolean;
  record: SpecialProduct | null;
  onClose: (refresh?: boolean) => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ open, record, onClose }) => {
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
        await api.put(`/api/admin/products/${record!.id}`, { ...record, ...values });
        message.success('更新成功');
      } else {
        await api.post('/api/admin/products', values);
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
      title={isEdit ? '编辑产品' : '新增产品'}
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

        <Form.Item
          name="summaryZh"
          label="中文摘要"
          rules={[{ required: true, message: '请输入中文摘要' }]}
        >
          <Input.TextArea rows={3} placeholder="请输入中文摘要" />
        </Form.Item>

        <Form.Item
          name="summaryEn"
          label="英文摘要"
          rules={[{ required: true, message: '请输入英文摘要' }]}
        >
          <Input.TextArea rows={3} placeholder="请输入英文摘要" />
        </Form.Item>

        <Form.Item name="detailZh" label="中文详情">
          <Input.TextArea rows={4} placeholder="请输入中文详情" />
        </Form.Item>

        <Form.Item name="detailEn" label="英文详情">
          <Input.TextArea rows={4} placeholder="请输入英文详情" />
        </Form.Item>

        <Form.Item name="priceMin" label="最低价格">
          <InputNumber min={0} className="input-number-full" placeholder="请输入最低价格" />
        </Form.Item>

        <Form.Item name="priceMax" label="最高价格">
          <InputNumber min={0} className="input-number-full" placeholder="请输入最高价格" />
        </Form.Item>

        <Form.Item name="contactPerson" label="联系人">
          <Input placeholder="请输入联系人" />
        </Form.Item>

        <Form.Item name="contactInfo" label="联系方式">
          <Input placeholder="请输入联系方式" />
        </Form.Item>

        <Form.Item name="sortOrder" label="排序">
          <InputNumber min={0} className="input-number-full" placeholder="排序值（数字越小越靠前）" />
        </Form.Item>
      </Form>

      <MediaUploadList entityType="product" entityId={record?.id ?? null} />
    </Modal>
  );
};

export default ProductForm;
