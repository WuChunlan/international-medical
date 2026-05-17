import React, { useEffect, useState, useCallback } from 'react';
import {
  Table,
  Button,
  Space,
  Switch,
  Popconfirm,
  message,
  Card,
  Typography,
  Row,
  Col,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '../../api';
import type { Hospital } from '../../types';
import HospitalForm from './HospitalForm';

const { Title } = Typography;

const HospitalManage: React.FC = () => {
  const [data, setData] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [current, setCurrent] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<Hospital | null>(null);

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/hospitals', {
        params: { page, size: 10 },
      });
      const d = res.data?.data || res.data;
      setData(d?.records || d?.list || []);
      setTotal(d?.total || 0);
    } catch {
      message.error('获取医院列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(current);
  }, [fetchData, current]);

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/admin/hospitals/${id}`);
      message.success('删除成功');
      fetchData(current);
    } catch {
      message.error('删除失败');
    }
  };

  const handleToggleStatus = async (record: Hospital) => {
    try {
      await api.put(`/api/admin/hospitals/${record.id}`, {
        ...record,
        isActive: record.isActive === 1 ? 0 : 1,
      });
      message.success('状态更新成功');
      fetchData(current);
    } catch {
      message.error('状态更新失败');
    }
  };

  const handleAdd = () => {
    setEditRecord(null);
    setModalOpen(true);
  };

  const handleEdit = (record: Hospital) => {
    setEditRecord(record);
    setModalOpen(true);
  };

  const handleModalClose = (refresh?: boolean) => {
    setModalOpen(false);
    setEditRecord(null);
    if (refresh) fetchData(current);
  };

  const columns: ColumnsType<Hospital> = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: '中文名称', dataIndex: 'nameZh', ellipsis: true },
    { title: '英文名称', dataIndex: 'nameEn', ellipsis: true },
    { title: '联系人', dataIndex: 'contactPerson', width: 100 },
    { title: '排序', dataIndex: 'sortOrder', width: 80 },
    {
      title: '状态',
      dataIndex: 'isActive',
      width: 100,
      render: (val: number, record: Hospital) => (
        <Switch
          checked={val === 1}
          checkedChildren="启用"
          unCheckedChildren="禁用"
          onChange={() => handleToggleStatus(record)}
          size="small"
        />
      ),
    },
    {
      title: '操作',
      width: 140,
      render: (_: unknown, record: Hospital) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除该医院？"
            onConfirm={() => handleDelete(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />} size="small">
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" className="page-header-row">
        <Col>
          <Title level={4} className="page-title">医院管理</Title>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增医院
          </Button>
        </Col>
      </Row>

      <Card className="page-card">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={{
            current,
            pageSize: 10,
            total,
            showSizeChanger: false,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (page) => setCurrent(page),
          }}
        />
      </Card>

      <HospitalForm
        open={modalOpen}
        record={editRecord}
        onClose={handleModalClose}
      />
    </div>
  );
};

export default HospitalManage;
