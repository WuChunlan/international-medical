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
  Select,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '../../api';
import type { Doctor, Hospital } from '../../types';
import DoctorForm from './DoctorForm';

const { Title } = Typography;

const DoctorManage: React.FC = () => {
  const [data, setData] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [current, setCurrent] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<Doctor | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [filterHospitalId, setFilterHospitalId] = useState<number | undefined>(undefined);

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const res = await api.get('/api/admin/hospitals', { params: { page: 1, size: 100 } });
        const d = res.data?.data || res.data;
        setHospitals(d?.records || d?.list || []);
      } catch {
        // ignore
      }
    };
    fetchHospitals();
  }, []);

  const fetchData = useCallback(async (page = 1, hospitalId?: number) => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, size: 10 };
      if (hospitalId) params.hospitalId = hospitalId;
      const res = await api.get('/api/admin/doctors', { params });
      const d = res.data?.data || res.data;
      setData(d?.records || d?.list || []);
      setTotal(d?.total || 0);
    } catch {
      message.error('获取医生列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(current, filterHospitalId);
  }, [fetchData, current, filterHospitalId]);

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/admin/doctors/${id}`);
      message.success('删除成功');
      fetchData(current, filterHospitalId);
    } catch {
      message.error('删除失败');
    }
  };

  const handleToggleStatus = async (record: Doctor) => {
    try {
      await api.put(`/api/admin/doctors/${record.id}`, {
        ...record,
        isActive: record.isActive === 1 ? 0 : 1,
      });
      message.success('状态更新成功');
      fetchData(current, filterHospitalId);
    } catch {
      message.error('状态更新失败');
    }
  };

  const handleAdd = () => {
    setEditRecord(null);
    setModalOpen(true);
  };

  const handleEdit = (record: Doctor) => {
    setEditRecord(record);
    setModalOpen(true);
  };

  const handleModalClose = (refresh?: boolean) => {
    setModalOpen(false);
    setEditRecord(null);
    if (refresh) fetchData(current, filterHospitalId);
  };

  const getHospitalName = (hospitalId: number) => {
    const h = hospitals.find((h) => h.id === hospitalId);
    return h?.nameZh || `医院${hospitalId}`;
  };

  const columns: ColumnsType<Doctor> = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: '姓名', dataIndex: 'nameZh', width: 100 },
    { title: '职称', dataIndex: 'titleZh', width: 100 },
    { title: '科室', dataIndex: 'specialtyZh', ellipsis: true },
    {
      title: '所属医院',
      dataIndex: 'hospitalId',
      render: (id: number) => getHospitalName(id),
      ellipsis: true,
    },
    {
      title: '价格',
      dataIndex: 'pricePerVisit',
      width: 100,
      render: (val: number | null) => (val != null ? `¥${val}` : '-'),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      width: 100,
      render: (val: number, record: Doctor) => (
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
      render: (_: unknown, record: Doctor) => (
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
            title="确认删除该医生？"
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
          <Title level={4} className="page-title">医生管理</Title>
        </Col>
        <Col>
          <Space>
            <Select
              allowClear
              placeholder="按医院筛选"
              className="filter-select"
              value={filterHospitalId}
              onChange={(val) => {
                setFilterHospitalId(val);
                setCurrent(1);
              }}
              options={hospitals.map((h) => ({ value: h.id, label: h.nameZh }))}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增医生
            </Button>
          </Space>
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

      <DoctorForm
        open={modalOpen}
        record={editRecord}
        hospitals={hospitals}
        onClose={handleModalClose}
      />
    </div>
  );
};

export default DoctorManage;
