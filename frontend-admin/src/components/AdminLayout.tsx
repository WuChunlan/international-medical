import React, { useState } from 'react'
import { Layout, Menu, Button, Tag, Breadcrumb, Modal, Form, Input, message, Alert } from 'antd'
import {
  DashboardOutlined,
  BankOutlined,
  UserOutlined,
  MedicineBoxOutlined,
  ShoppingOutlined,
  TeamOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  FileTextOutlined,
  AppstoreOutlined,
  AuditOutlined,
  SafetyCertificateOutlined,
  UsergroupAddOutlined,
  LockOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAdminAuthStore } from '../store/authStore'
import api from '../api'
import './AdminLayout.less'

const { Sider, Header, Content } = Layout

interface AdminLayoutProps {
  children: React.ReactNode
}

const adminMenuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '控制台' },
  { key: '/reviewer/pending', icon: <AuditOutlined />, label: '待审核内容' },
  { key: '/hospitals', icon: <BankOutlined />, label: '医院管理' },
  { key: '/doctors', icon: <UserOutlined />, label: '医生管理' },
  { key: '/equipments', icon: <MedicineBoxOutlined />, label: '设备管理' },
  { key: '/environments', icon: <BankOutlined />, label: '诊疗环境' },
  { key: '/service-teams', icon: <TeamOutlined />, label: '服务团队' },
  { key: '/service-features', icon: <AppstoreOutlined />, label: '服务功能' },
  { key: '/products', icon: <ShoppingOutlined />, label: '产品管理' },
  { key: '/cases', icon: <FileTextOutlined />, label: '过往案例' },
  { key: '/users', icon: <TeamOutlined />, label: '用户管理' },
  { key: '/hospital-admins', icon: <SafetyCertificateOutlined />, label: '医院管理员' },
  { key: '/customer-reps', icon: <UsergroupAddOutlined />, label: '客户代表' },
  { key: '/config', icon: <SettingOutlined />, label: '网站配置' },
]

const hospitalAdminMenuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '控制台' },
  { key: '/ha/hospital', icon: <BankOutlined />, label: '我的医院' },
  { key: '/ha/doctors', icon: <UserOutlined />, label: '医生管理' },
  { key: '/ha/equipments', icon: <MedicineBoxOutlined />, label: '设备管理' },
  { key: '/ha/environments', icon: <BankOutlined />, label: '诊疗环境' },
  { key: '/ha/products', icon: <ShoppingOutlined />, label: '产品管理' },
  { key: '/ha/cases', icon: <FileTextOutlined />, label: '过往案例' },
]

const reviewerMenuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '控制台' },
  { key: '/reviewer/pending', icon: <AuditOutlined />, label: '待审核内容' },
]

const customerRepMenuItems = [
  { key: '/rep/dashboard', icon: <DashboardOutlined />, label: '我的邀请' },
]

const roleLabels: Record<string, { text: string; color: string }> = {
  admin:          { text: '超级管理员', color: '#0A2540' },
  hospital_admin: { text: '医院管理员', color: '#2563EB' },
  reviewer:       { text: '审核员',     color: '#059669' },
  customer_rep:   { text: '客户代表',   color: 'purple' },
}

function getSelectedKey(pathname: string): string {
  if (pathname.startsWith('/ha/')) return pathname
  const first = pathname.split('/').filter(Boolean)[0]
  return first ? '/' + first : '/dashboard'
}

function getBreadcrumbLabel(pathname: string, allItems: { key: string; label: string }[]): string {
  const found = allItems.find(item => item.key === pathname || pathname.startsWith(item.key + '/'))
  return found?.label ?? ''
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false)
  const [changePwOpen, setChangePwOpen] = useState(false)
  const [changePwLoading, setChangePwLoading] = useState(false)
  const [changePwForm] = Form.useForm()
  const navigate = useNavigate()
  const location = useLocation()
  const { username, role, hospitalId, logout } = useAdminAuthStore()

  const handleChangePw = async () => {
    try {
      const values = await changePwForm.validateFields()
      if (values.newPassword !== values.confirmPassword) {
        message.error('两次密码不一致')
        return
      }
      setChangePwLoading(true)
      await api.put('/api/profile/change-password', {
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      })
      message.success('密码修改成功，请重新登录')
      changePwForm.resetFields()
      setChangePwOpen(false)
      logout()
      navigate('/login')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; errorFields?: unknown[] }
      if (e.response?.data?.message) message.error(e.response.data.message)
      else if (!e.errorFields) message.error('修改失败')
    } finally {
      setChangePwLoading(false)
    }
  }

  const menuItems =
    role === 'hospital_admin' ? hospitalAdminMenuItems :
    role === 'reviewer' ? reviewerMenuItems :
    role === 'customer_rep' ? customerRepMenuItems :
    adminMenuItems

  const selectedKey = getSelectedKey(location.pathname)
  const breadcrumbLabel = getBreadcrumbLabel(selectedKey, menuItems)

  const handleMenuClick = ({ key }: { key: string }) => navigate(key)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const roleInfo = role ? roleLabels[role] : null

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        theme="light"
        width={220}
        className="admin-sider"
        style={{ position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100, overflow: 'auto' }}
      >
        <div className="sider-logo">
          {collapsed ? <MedicineBoxOutlined style={{ fontSize: 20 }} /> : '国际医疗管理后台'}
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 'none', marginTop: 4 }}
        />
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 220, transition: 'margin-left 0.2s' }}>
        <Header className="admin-header">
          <div className="header-left">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 16, width: 36, height: 36, padding: 0 }}
            />
            {breadcrumbLabel && (
              <Breadcrumb
                items={[
                  { title: '控制台' },
                  ...(breadcrumbLabel !== '控制台' ? [{ title: breadcrumbLabel }] : []),
                ]}
                style={{ fontSize: 13 }}
              />
            )}
          </div>
          <div className="header-right">
            {roleInfo && (
              <Tag
                style={{
                  color: roleInfo.color,
                  background: '#F5F6F8',
                  borderColor: '#E5E7EB',
                  borderRadius: 2,
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                {roleInfo.text}
              </Tag>
            )}
            <span className="header-divider">|</span>
            <span className="header-username">{username || 'admin'}</span>
            <Button
                type="text"
                icon={<LockOutlined />}
                size="small"
                style={{ color: '#6B7280' }}
                onClick={() => setChangePwOpen(true)}
              >
                修改密码
              </Button>
            <Button
              type="text"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              size="small"
              style={{ color: '#6B7280' }}
            >
              退出
            </Button>
          </div>
        </Header>

        <Content className="admin-content">
          {role === 'hospital_admin' && !hospitalId && location.pathname !== '/ha/hospital' && (
            <Alert
              type="warning"
              showIcon
              message="请先创建医院"
              description={
                <span>
                  您尚未创建医院。请先前往
                  <Button type="link" size="small" style={{ padding: '0 4px' }} onClick={() => navigate('/ha/hospital')}>
                    我的医院
                  </Button>
                  完成医院创建，再使用其他功能。
                </span>
              }
              style={{ marginBottom: 16 }}
            />
          )}
          {children}
        </Content>
      </Layout>

      <Modal
        title="修改密码"
        open={changePwOpen}
        onOk={handleChangePw}
        onCancel={() => { setChangePwOpen(false); changePwForm.resetFields() }}
        okText="确认修改"
        cancelText="取消"
        confirmLoading={changePwLoading}
        destroyOnClose
      >
        <Form form={changePwForm} layout="vertical" style={{ marginTop: 8 }}>
          <Form.Item name="oldPassword" label="原密码" rules={[{ required: true, message: '请输入原密码' }]}>
            <Input.Password placeholder="请输入原密码" />
          </Form.Item>
          <Form.Item name="newPassword" label="新密码" rules={[{ required: true, min: 6, message: '至少6位' }]}>
            <Input.Password placeholder="请输入新密码（至少6位）" />
          </Form.Item>
          <Form.Item name="confirmPassword" label="确认新密码" rules={[{ required: true, message: '请再次输入新密码' }]}>
            <Input.Password placeholder="再次输入新密码" />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  )
}

export default AdminLayout
