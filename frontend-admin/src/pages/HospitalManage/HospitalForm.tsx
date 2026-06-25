import React, { useEffect, useState } from 'react'
import { Drawer, Form, Input, InputNumber, message, Button, Tooltip } from 'antd'
import { TranslationOutlined } from '@ant-design/icons'
import api from '../../api'
import type { Hospital } from '../../types'
import MediaUploadList from '../../components/MediaUploadList'
import ImageUpload from '../../components/ImageUpload'
import { useAutoTranslate } from '../../hooks/useAutoTranslate'

interface HospitalFormProps {
  open: boolean
  record: Hospital | null
  onClose: (refresh?: boolean) => void
}

const HospitalForm: React.FC<HospitalFormProps> = ({ open, record, onClose }) => {
  const [form] = Form.useForm()
  const [translating, setTranslating] = useState(false)
  const [loading, setLoading] = useState(false)
  const isEdit = !!record
  const { translateField, translateAll } = useAutoTranslate(form)

  useEffect(() => {
    if (open) {
      if (record) {
        form.setFieldsValue(record)
      } else {
        form.resetFields()
        form.setFieldsValue({ sortOrder: 0, isActive: 1 })
      }
    }
  }, [open, record, form])

  const handleOk = async () => {
    setLoading(true)
    try {
      const values = await form.validateFields()
      if (isEdit) {
        await api.put(`/api/admin/hospitals/${record!.id}`, { ...record, ...values })
        message.success('更新成功')
      } else {
        await api.post('/api/admin/hospitals', values)
        message.success('创建成功')
      }
      onClose(true)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; errorFields?: unknown[] }
      if (error.errorFields) return
      message.error(error.response?.data?.message || (isEdit ? '更新失败' : '创建失败'))
    } finally {
      setLoading(false)
    }
  }

  const handleTranslateAll = async () => {
    setTranslating(true)
    await translateAll()
    setTranslating(false)
    message.success('翻译完成')
  }

  return (
    <Drawer
      title={isEdit ? '编辑医院' : '新增医院'}
      width={520}
      open={open}
      onClose={() => onClose()}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={() => onClose()}>取消</Button>
          <Button type="primary" onClick={handleOk} loading={loading}>保存</Button>
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
        <Form.Item name="nameZh" label="中文名称" rules={[{ required: true, message: '请输入中文名称' }]}>
          <Input placeholder="请输入中文名称" onBlur={() => translateField('nameZh')} />
        </Form.Item>
        <Form.Item name="nameEn" label="英文名称" rules={[{ required: true, message: '请输入英文名称' }]}>
          <Input placeholder="输入中文名称后可自动翻译" />
        </Form.Item>
        <Form.Item name="introZh" label="中文简介" rules={[{ required: true, message: '请输入中文简介' }]}>
          <Input.TextArea rows={3} placeholder="请输入中文简介" onBlur={() => translateField('introZh')} />
        </Form.Item>
        <Form.Item name="introEn" label="英文简介" rules={[{ required: true, message: '请输入英文简介' }]}>
          <Input.TextArea rows={3} placeholder="输入中文简介后可自动翻译" />
        </Form.Item>
        <Form.Item name="addressZh" label="中文地址">
          <Input placeholder="请输入中文地址" onBlur={() => translateField('addressZh')} />
        </Form.Item>
        <Form.Item name="addressEn" label="英文地址">
          <Input placeholder="输入中文地址后可自动翻译" />
        </Form.Item>
        <Form.Item name="phone" label="电话">
          <Input placeholder="请输入电话" />
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
        <Form.Item name="coverImageUrl" label="封面图片">
          <ImageUpload category="hospitals/images" label="上传封面图" />
        </Form.Item>
      </Form>
      <MediaUploadList entityType="hospital" entityId={record?.id ?? null} />
    </Drawer>
  )
}

export default HospitalForm
