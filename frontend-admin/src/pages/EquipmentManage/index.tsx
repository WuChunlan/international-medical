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
import type { Equipment, Hospital } from '../../types';
import EquipmentForm from './EquipmentForm';

const { Title } = Typography;

const EquipmentManage: React.FC = () => {
  const [data, setData] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [current, setCurrent] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<Equipment | null>(null);
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
      const res = await api.get('/api/admin/equipments', { params });
      const d = res.data?.data || res.data;
      setData(d?.records || d?.list || []);
      setTotal(d?.total || 0);
    } catch {
      message.error('获取设备列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(current, filterHospitalId);
  }, [fetchData, current, filterHospitalId]);

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/admin/equipments/${id}`);
      message.success('删除成功');
      fetchData(current, filterHospitalId);
    } catch {
      message.error('删除失败');
    }
  };

  const handleToggleStatus = async (record: Equipment) => {
    try {
      await api.put(`/api/admin/equipments/${record.id}`, {
        ...record,
        isActive: record.isActive === 1 ? 0 : 1,
      });
      message.success('状态更新成功');
      fetchData(current, filterHospitalId);
    } catch {
      message.error('状态更新失败');
    }
  };

  const getHospitalName = (hospitalId: number) => {
    const h = hospitals.find((h) => h.id === hospitalId);
    return h?.nameZh || `医院${hospitalId}`;
  };

  const columns: ColumnsType<Equipment> = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    {
      title: '图片',
      dataIndex: 'imageUrl',
      width: 80,
      render: (url: string | null) =>
        url ? (
          <img src={url} alt="cover" style={{ width: 48, height: 36, objectFit: 'cover', borderRadius: 4 }} />
        ) : (
          <span style={{ color: '#ccc' }}>—</span>
        ),
    },
    { title: '中文名称', dataIndex: 'nameZh', ellipsis: true },
    { title: '英文名称', dataIndex: 'nameEn', ellipsis: true },
    {
      title: '所属医院',
      dataIndex: 'hospitalId',
      render: (id: number) => getHospitalName(id),
      ellipsis: true,
    },
    { title: '排序', dataIndex: 'sortOrder', width: 80 },
    {
      title: '状态',
      dataIndex: 'isActive',
      width: 100,
      render: (val: number, record: Equipment) => (
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
      render: (_: unknown, record: Equipment) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            size="small"
            onClick={() => {
              setEditRecord(record);
              setModalOpen(true);
            }}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除该设备？"
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
          <Title level={4} className="page-title">设备管理</Title>
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
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditRecord(null);
                setModalOpen(true);
              }}
            >
              新增设备
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

      <EquipmentForm
        open={modalOpen}
        record={editRecord}
        hospitals={hospitals}
        onClose={(refresh) => {
          setModalOpen(false);
          setEditRecord(null);
          if (refresh) fetchData(current, filterHospitalId);
        }}
      />
    </div>
  );
};

export default EquipmentManage;
