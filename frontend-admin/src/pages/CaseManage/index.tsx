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
  Tag,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '../../api';
import type { MedicalCase } from '../../types';
import CaseForm from './CaseForm';

const { Title } = Typography;

const CaseManage: React.FC = () => {
  const [data, setData] = useState<MedicalCase[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [current, setCurrent] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<MedicalCase | null>(null);

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/cases', { params: { page, size: 10 } });
      const d = res.data?.data || res.data;
      setData(d?.records || d?.list || []);
      setTotal(d?.total || 0);
    } catch {
      message.error('获取案例列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(current);
  }, [fetchData, current]);

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/admin/cases/${id}`);
      message.success('删除成功');
      fetchData(current);
    } catch {
      message.error('删除失败');
    }
  };

  const handleToggleStatus = async (record: MedicalCase) => {
    try {
      await api.put(`/api/admin/cases/${record.id}`, {
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

  const handleEdit = (record: MedicalCase) => {
    setEditRecord(record);
    setModalOpen(true);
  };

  const handleModalClose = (refresh?: boolean) => {
    setModalOpen(false);
    setEditRecord(null);
    if (refresh) fetchData(current);
  };

  const columns: ColumnsType<MedicalCase> = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    {
      title: '关联医院',
      dataIndex: 'hospitalNameZh',
      width: 180,
      render: (val: string | null) =>
        val ? <Tag color="blue">{val}</Tag> : <span style={{ color: '#bbb' }}>未关联</span>,
    },
    { title: '案例标题', dataIndex: 'titleZh', ellipsis: true },
    {
      title: '封面',
      dataIndex: 'coverImageUrl',
      width: 80,
      render: (url: string | null) =>
        url ? (
          <img src={url} alt="cover" style={{ width: 48, height: 36, objectFit: 'cover', borderRadius: 4 }} />
        ) : (
          <span style={{ color: '#bbb', fontSize: 12 }}>无</span>
        ),
    },
    { title: '排序', dataIndex: 'sortOrder', width: 80 },
    {
      title: '状态',
      dataIndex: 'isActive',
      width: 100,
      render: (val: number, record: MedicalCase) => (
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
      render: (_: unknown, record: MedicalCase) => (
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
            title="确认删除该案例？"
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
          <Title level={4} className="page-title">过往案例管理</Title>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增案例
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

      <CaseForm
        open={modalOpen}
        record={editRecord}
        onClose={handleModalClose}
      />
    </div>
  );
};

export default CaseManage;
