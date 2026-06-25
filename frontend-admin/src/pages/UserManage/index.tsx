import React, { useEffect, useState, useCallback } from 'react'
import { Table, Button, Tag, message, Popconfirm } from 'antd'
import { CheckCircleOutlined, StopOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import api from '../../api'
import type { User } from '../../types'

const UserManage: React.FC = () => {
  const [data, setData] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [current, setCurrent] = useState(1)

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/users', {
        params: { page, size: 10 },
      });
      const d = res.data?.data || res.data;
      setData(d?.records || d?.list || []);
      setTotal(d?.total || 0);
    } catch {
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(current);
  }, [fetchData, current]);

  const handleToggle = async (record: User) => {
    try {
      await api.put(`/api/admin/users/${record.id}/toggle`);
      message.success('状态更新成功');
      fetchData(current);
    } catch {
      message.error('状态更新失败');
    }
  };

  const columns: ColumnsType<User> = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    {
      title: '姓名',
      key: 'name',
      width: 120,
      render: (_: unknown, record: User) => {
        const name = [record.lastName, record.firstName].filter(Boolean).join(' ');
        return name || record.username || '-';
      },
    },
    { title: '邮箱', dataIndex: 'email', ellipsis: true },
    {
      title: '性别',
      dataIndex: 'gender',
      width: 70,
      render: (val: string | null) => {
        if (val === 'male') return '男';
        if (val === 'female') return '女';
        if (val === 'other') return '其他';
        return '-';
      },
    },
    { title: '联系方式', dataIndex: 'phone', width: 130, render: (v: string | null) => v || '-' },
    {
      title: '证件国家',
      dataIndex: 'idCardCountry',
      width: 100,
      render: (val: string | null) => val || '-',
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      width: 180,
      render: (val: string) => {
        if (!val) return '-';
        return new Date(val).toLocaleString('zh-CN');
      },
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      width: 90,
      render: (val: number) =>
        val === 1 ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>正常</Tag>
        ) : (
          <Tag color="error" icon={<StopOutlined />}>禁用</Tag>
        ),
    },
    {
      title: '操作',
      width: 120,
      render: (_: unknown, record: User) => (
        <Popconfirm
          title={record.isActive === 1 ? '确认禁用该用户？' : '确认启用该用户？'}
          onConfirm={() => handleToggle(record)}
          okText="确认"
          cancelText="取消"
        >
          <Button
            type="link"
            size="small"
            danger={record.isActive === 1}
            icon={record.isActive === 1 ? <StopOutlined /> : <CheckCircleOutlined />}
          >
            {record.isActive === 1 ? '禁用' : '启用'}
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className="page-card">
      <div className="page-header">
        <h3 className="page-title">用户管理</h3>
        <p className="page-description">查看和管理平台C端注册用户</p>
      </div>
      <Table
        rowKey="id"
        size="middle"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{ current, pageSize: 10, total, showSizeChanger: false, showTotal: t => `共 ${t} 条`, position: ['bottomRight'], size: 'small', onChange: setCurrent }}
      />
    </div>
  )
};

export default UserManage;
