import React, { useEffect, useState } from 'react'
import {
  Drawer, Form, Input, InputNumber, message, Button, Tooltip,
  Table, Space, Popconfirm, Modal,
} from 'antd'
import { TranslationOutlined, PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import api from '../../api'
import type { SpecialProduct, ProductVariant } from '../../types'
import MediaUploadList from '../../components/MediaUploadList'
import ImageUpload from '../../components/ImageUpload'
import { useAutoTranslate } from '../../hooks/useAutoTranslate'
import FormRow from '../../components/FormRow'

interface ProductFormProps {
  open: boolean
  record: SpecialProduct | null
  onClose: (refresh?: boolean) => void
}

const ProductForm: React.FC<ProductFormProps> = ({ open, record, onClose }) => {
  const [form] = Form.useForm()
  const [variantForm] = Form.useForm()
  const [translating, setTranslating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [variantModal, setVariantModal] = useState<{ open: boolean; row: ProductVariant | null }>({ open: false, row: null })
  const isEdit = !!record
  const { translateField, translateAll } = useAutoTranslate(form)

  useEffect(() => {
    if (open) {
      if (record) {
        form.setFieldsValue(record)
        loadVariants(record.id)
      } else {
        form.resetFields()
        form.setFieldsValue({ sortOrder: 0, isActive: 1 })
        setVariants([])
      }
    }
  }, [open, record, form])

  const loadVariants = async (productId: number) => {
    try {
      const res = await api.get(`/api/admin/products/${productId}/variants`)
      const d = res.data?.data || res.data
      setVariants(Array.isArray(d) ? d : [])
    } catch {
      setVariants([])
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const values = await form.validateFields()
      if (isEdit) {
        await api.put(`/api/admin/products/${record!.id}`, { ...record, ...values })
        message.success('更新成功')
      } else {
        await api.post('/api/admin/products', values)
        message.success('创建成功')
      }
      onClose(true)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; errorFields?: unknown[] }
      if (error.errorFields) return
      message.error(error.response?.data?.message || (isEdit ? '更新失败' : '创建失败'))
    } finally {
      setSaving(false)
    }
  }

  const handleTranslateAll = async () => {
    setTranslating(true)
    await translateAll()
    setTranslating(false)
    message.success('翻译完成')
  }

  const openVariantModal = (row: ProductVariant | null) => {
    variantForm.resetFields()
    if (row) variantForm.setFieldsValue(row)
    setVariantModal({ open: true, row })
  }

  const handleVariantSave = async () => {
    try {
      const values = await variantForm.validateFields()
      const pid = record!.id
      if (variantModal.row) {
        await api.put(`/api/admin/products/${pid}/variants/${variantModal.row.id}`, values)
      } else {
        await api.post(`/api/admin/products/${pid}/variants`, { ...values, isActive: 1, sortOrder: variants.length })
      }
      message.success(variantModal.row ? '套餐已更新' : '套餐已添加')
      setVariantModal({ open: false, row: null })
      loadVariants(pid)
    } catch (err: unknown) {
      const error = err as { errorFields?: unknown[] }
      if (!error.errorFields) message.error('保存失败')
    }
  }

  const handleVariantDelete = async (v: ProductVariant) => {
    try {
      await api.delete(`/api/admin/products/${record!.id}/variants/${v.id}`)
      message.success('已删除')
      loadVariants(record!.id)
    } catch {
      message.error('删除失败')
    }
  }

  const variantColumns: ColumnsType<ProductVariant> = [
    { title: '套餐名称', dataIndex: 'nameZh', ellipsis: true },
    { title: '描述', dataIndex: 'descZh', ellipsis: true },
    { title: '价格', dataIndex: 'price', width: 100, render: (v: number | null) => v != null ? `¥${v}` : '-' },
    { title: '排序', dataIndex: 'sortOrder', width: 70 },
    {
      title: '操作', width: 120,
      render: (_: unknown, row: ProductVariant) => (
        <Space size={0}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openVariantModal(row)}>编辑</Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleVariantDelete(row)} okText="确认" cancelText="取消">
            <Button type="text" danger size="small" icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <>
      <Drawer
        title={isEdit ? '编辑产品' : '新增产品'}
        width={720}
        open={open}
        onClose={() => onClose()}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => onClose()}>取消</Button>
            <Button type="primary" onClick={handleSave} loading={saving}>{isEdit ? '保存' : '创建'}</Button>
          </div>
        }
      >
        <div style={{ textAlign: 'right', marginBottom: 12 }}>
          <Tooltip title="将所有中文字段自动翻译到对应英文字段（不覆盖已填写的英文内容）">
            <Button icon={<TranslationOutlined />} loading={translating} onClick={handleTranslateAll} size="small">
              一键翻译中→英
            </Button>
          </Tooltip>
        </div>
        <Form form={form} layout="vertical">
          <FormRow>
            <Form.Item name="nameZh" label="中文名称" rules={[{ required: true, message: '请输入中文名称' }]}>
              <Input placeholder="请输入中文名称" onBlur={() => translateField('nameZh')} />
            </Form.Item>
            <Form.Item name="nameEn" label="英文名称" rules={[{ required: true, message: '请输入英文名称' }]}>
              <Input placeholder="输入中文名称后可自动翻译" />
            </Form.Item>
          </FormRow>
          <Form.Item name="summaryZh" label="中文摘要" rules={[{ required: true, message: '请输入中文摘要' }]}>
            <Input.TextArea rows={3} placeholder="请输入中文摘要" onBlur={() => translateField('summaryZh')} />
          </Form.Item>
          <Form.Item name="summaryEn" label="英文摘要" rules={[{ required: true, message: '请输入英文摘要' }]}>
            <Input.TextArea rows={3} placeholder="输入中文摘要后可自动翻译" />
          </Form.Item>
          <Form.Item name="detailZh" label="中文详情">
            <Input.TextArea rows={4} placeholder="请输入中文详情" onBlur={() => translateField('detailZh')} />
          </Form.Item>
          <Form.Item name="detailEn" label="英文详情">
            <Input.TextArea rows={4} placeholder="输入中文详情后可自动翻译" />
          </Form.Item>
          <FormRow>
            <Form.Item name="priceMin" label="最低价格">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入最低价格" />
            </Form.Item>
            <Form.Item name="priceMax" label="最高价格">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入最高价格" />
            </Form.Item>
          </FormRow>
          <FormRow>
            <Form.Item name="contactPerson" label="联系人">
              <Input placeholder="请输入联系人" />
            </Form.Item>
            <Form.Item name="contactInfo" label="联系方式">
              <Input placeholder="请输入联系方式" />
            </Form.Item>
          </FormRow>
          <Form.Item name="sortOrder" label="排序">
            <InputNumber min={0} style={{ width: '100%' }} placeholder="排序值（数字越小越靠前）" />
          </Form.Item>
          <Form.Item name="coverImageUrl" label="封面图片">
            <ImageUpload category="products/images" label="上传封面图" />
          </Form.Item>
        </Form>

        {isEdit && (
          <div style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <strong style={{ fontSize: 14 }}>套餐配置</strong>
              <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={() => openVariantModal(null)}>添加套餐</Button>
            </div>
            <Table rowKey="id" size="small" dataSource={variants} columns={variantColumns} pagination={false}
              locale={{ emptyText: '暂无套餐，点击"添加套餐"创建' }} />
          </div>
        )}

        <MediaUploadList entityType="product" entityId={record?.id ?? null} />
      </Drawer>

      <Modal
        title={variantModal.row ? '编辑套餐' : '添加套餐'}
        open={variantModal.open}
        onOk={handleVariantSave}
        onCancel={() => setVariantModal({ open: false, row: null })}
        okText="保存"
        cancelText="取消"
        width={480}
        destroyOnClose
      >
        <Form form={variantForm} layout="vertical">
          <FormRow>
            <Form.Item name="nameZh" label="套餐中文名称" rules={[{ required: true, message: '请输入套餐名称' }]}>
              <Input placeholder="例：基础套餐" />
            </Form.Item>
            <Form.Item name="nameEn" label="套餐英文名称" rules={[{ required: true, message: '请输入英文名称' }]}>
              <Input placeholder="e.g. Basic Package" />
            </Form.Item>
          </FormRow>
          <Form.Item name="descZh" label="中文描述">
            <Input.TextArea rows={2} placeholder="套餐包含内容（中文）" />
          </Form.Item>
          <Form.Item name="descEn" label="英文描述">
            <Input.TextArea rows={2} placeholder="Package description (English)" />
          </Form.Item>
          <FormRow>
            <Form.Item name="price" label="价格">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="套餐价格（留空表示面议）" />
            </Form.Item>
            <Form.Item name="sortOrder" label="排序">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="数字越小越靠前" />
            </Form.Item>
          </FormRow>
        </Form>
      </Modal>
    </>
  )
}

export default ProductForm
