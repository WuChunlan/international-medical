import React, { useState } from 'react'
import { Layout, Menu, Button, Tag, Breadcrumb } from 'antd'
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
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAdminAuthStore } from '../store/authStore'
import './AdminLayout.less'

const { Sider, Header, Content } = Layout

interface AdminLayoutProps {
  children: React.ReactNode
}

const adminMenuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '控制台' },
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
  const navigate = useNavigate()
  const location = useLocation()
  const { username, role, logout } = useAdminAuthStore()

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
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}

export default AdminLayout
