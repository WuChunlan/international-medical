import React, { useEffect, useRef, useState } from 'react'
import { Modal, Button, Space, message } from 'antd'
import { QRCodeCanvas } from 'qrcode.react'
import api from '../api'

interface Props {
  open: boolean
  inviteCode: string | null
  onClose: () => void
}

const InviteQrModal: React.FC<Props> = ({ open, inviteCode, onClose }) => {
  const [baseUrl, setBaseUrl] = useState('http://localhost:3000')
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    api.get('/api/config/site_a_base_url')
      .then((res) => {
        const d = res.data?.data ?? res.data
        if (d?.valueEn || d?.valueZh) setBaseUrl(d.valueEn || d.valueZh)
      })
      .catch(() => {})
  }, [open])

  const url = inviteCode ? `${baseUrl.replace(/\/$/, '')}/register?code=${inviteCode}` : ''

  const download = () => {
    const canvas = wrapRef.current?.querySelector('canvas')
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `invite-${inviteCode}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(url)
    message.success('链接已复制')
  }

  return (
    <Modal title="邀请二维码" open={open} onCancel={onClose} footer={null} destroyOnClose>
      <div style={{ textAlign: 'center', padding: 16 }} ref={wrapRef}>
        {url ? <QRCodeCanvas value={url} size={220} includeMargin /> : null}
        <div style={{ marginTop: 12, wordBreak: 'break-all', color: '#666', fontSize: 12 }}>{url}</div>
        <Space style={{ marginTop: 16 }}>
          <Button type="primary" onClick={download}>下载 PNG</Button>
          <Button onClick={copyLink}>复制链接</Button>
        </Space>
      </div>
    </Modal>
  )
}

export default InviteQrModal
