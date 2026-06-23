import React, { useState } from 'react';
import { Layout, Menu, Button, Typography, Space, Avatar, Tag } from 'antd';
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
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuthStore } from '../store/authStore';
import './AdminLayout.less';

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

interface AdminLayoutProps {
  children: React.ReactNode;
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
  { key: '/config', icon: <SettingOutlined />, label: '网站配置' },
  { key: '/create-staff', icon: <SafetyCertificateOutlined />, label: '创建账号' },
];

const hospitalAdminMenuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '控制台' },
  { key: '/ha/hospital', icon: <BankOutlined />, label: '我的医院' },
  { key: '/ha/doctors', icon: <UserOutlined />, label: '医生管理' },
  { key: '/ha/equipments', icon: <MedicineBoxOutlined />, label: '设备管理' },
  { key: '/ha/environments', icon: <BankOutlined />, label: '诊疗环境' },
  { key: '/ha/products', icon: <ShoppingOutlined />, label: '产品管理' },
  { key: '/ha/cases', icon: <FileTextOutlined />, label: '过往案例' },
];

const reviewerMenuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '控制台' },
  { key: '/reviewer/pending', icon: <AuditOutlined />, label: '待审核内容' },
];

const roleLabels: Record<string, { text: string; color: string }> = {
  admin: { text: '超级管理员', color: 'red' },
  hospital_admin: { text: '医院管理员', color: 'blue' },
  reviewer: { text: '审核员', color: 'green' },
};

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { username, role, logout } = useAdminAuthStore();

  const menuItems =
    role === 'hospital_admin' ? hospitalAdminMenuItems :
    role === 'reviewer' ? reviewerMenuItems :
    adminMenuItems;

  const handleMenuClick = ({ key }: { key: string }) => navigate(key);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const selectedKey = '/' + location.pathname.split('/').filter(Boolean)[0] || '/dashboard';

  const roleInfo = role ? roleLabels[role] : null;

  return (
    <Layout className="admin-layout">
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        theme="dark"
        width={220}
        className="admin-sider"
      >
        <div className={`admin-sider__logo${collapsed ? ' admin-sider__logo--collapsed' : ''}`}>
          {!collapsed ? (
            <Text className="admin-sider__logo-text">国际医疗管理后台</Text>
          ) : (
            <MedicineBoxOutlined className="admin-collapsed-icon" />
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={handleMenuClick}
          className="admin-sider__menu"
        />
      </Sider>

      <Layout className="admin-main" style={{ marginLeft: collapsed ? 80 : 220 }}>
        <Header className="admin-header">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className="admin-header__collapse-btn"
          />
          <Space>
            {roleInfo && !collapsed && (
              <Tag color={roleInfo.color}>{roleInfo.text}</Tag>
            )}
            <Avatar size="small" className="admin-avatar" icon={<UserOutlined />} />
            <Text className="admin-header__user-text">{username || 'admin'}</Text>
            <Button
              type="text"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              className="admin-header__logout-btn"
            >
              退出
            </Button>
          </Space>
        </Header>

        <Content className="admin-content">
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
