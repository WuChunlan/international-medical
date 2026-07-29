import React, { useEffect, useState } from 'react'
import { Drawer, Form, Input, InputNumber, Select, message, Button, Tooltip } from 'antd'
import { TranslationOutlined } from '@ant-design/icons'
import api from '../../api'
import type { MedicalCase, Hospital } from '../../types'
import ImageUpload from '../../components/ImageUpload'
import FormRow from '../../components/FormRow'
import RichTextEditor from '../../components/RichTextEditor'
import { useAutoTranslate } from '../../hooks/useAutoTranslate'

interface CaseFormProps {
  open: boolean
  record: MedicalCase | null
  onClose: (refresh?: boolean) => void
}

const CaseForm: React.FC<CaseFormProps> = ({ open, record, onClose }) => {
  const [form] = Form.useForm()
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [translating, setTranslating] = useState(false)
  const [loading, setLoading] = useState(false)
  const isEdit = !!record
  const { translateField, translateAll } = useAutoTranslate(form)

  useEffect(() => {
    api.get('/api/admin/hospitals', { params: { page: 1, size: 200 } })
      .then(res => {
        const d = res.data?.data || res.data
        setHospitals(d?.records || d?.list || [])
      })
      .catch(() => {})
  }, [])

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
        await api.put(`/api/admin/cases/${record!.id}`, { ...record, ...values })
        message.success('更新成功')
      } else {
        await api.post('/api/admin/cases', values)
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
      title={isEdit ? '编辑案例' : '新增案例'}
      width={720}
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
        <Form.Item name="hospitalId" label="关联医院">
          <Select
            allowClear
            placeholder="请选择关联医院（可选）"
            options={hospitals.map(h => ({ value: h.id, label: h.nameZh }))}
            showSearch
            filterOption={(input, option) => String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
          />
        </Form.Item>
        <FormRow>
          <Form.Item name="titleZh" label="中文标题" rules={[{ required: true, message: '请输入中文标题' }]}>
            <Input placeholder="请输入中文标题" onBlur={() => translateField('titleZh')} />
          </Form.Item>
          <Form.Item name="titleEn" label="英文标题" rules={[{ required: true, message: '请输入英文标题' }]}>
            <Input placeholder="输入中文标题后可自动翻译" />
          </Form.Item>
        </FormRow>
        <Form.Item name="summaryZh" label="中文摘要">
          <Input.TextArea rows={3} placeholder="请输入中文摘要" onBlur={() => translateField('summaryZh')} />
        </Form.Item>
        <Form.Item name="summaryEn" label="英文摘要">
          <Input.TextArea rows={3} placeholder="输入中文摘要后可自动翻译" />
        </Form.Item>
        <Form.Item name="detailZh" label="中文详情">
          <RichTextEditor uploadUrl="/api/admin/upload" placeholder="请输入中文详情内容..." />
        </Form.Item>
        <Form.Item name="detailEn" label="英文详情">
          <RichTextEditor uploadUrl="/api/admin/upload" placeholder="Enter English detail content..." />
        </Form.Item>
        <Form.Item name="coverImageUrl" label="封面图片">
          <ImageUpload category="cases/images" label="上传封面图" />
        </Form.Item>
        <Form.Item name="sortOrder" label="排序">
          <InputNumber min={0} className="input-number-full" placeholder="排序值（数字越小越靠前）" />
        </Form.Item>
      </Form>
    </Drawer>
  )
}

export default CaseForm
