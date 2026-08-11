import { useEffect, useState } from 'react';
import {
  App, Card, Typography, Table, Button, Tag, Modal, Form, Input, Select,
  Popconfirm, Progress, Tabs, Badge, Space, Tooltip,
} from 'antd';
import {
  PlusOutlined, StopOutlined, ReloadOutlined, EyeOutlined,
} from '@ant-design/icons';
import api from '../../api';

const { Title } = Typography;

interface TranslationJob {
  id: number;
  lang: string;
  status: 'running' | 'cancelled' | 'done';
  total: number;
  done: number;
  failed: number;
  createdAt: string;
}

interface JobItem {
  id: number;
  entityType: string;
  entityId: number;
  entityLabel: string;
  fieldName: string;
  status: 'pending' | 'done' | 'failed';
  errorMsg: string | null;
}

interface FailedRecord {
  id: number;
  entityType: string;
  entityId: number;
  fieldName: string;
  lang: string;
  content: string | null;
  errorMsg: string | null;
  updatedAt: string;
}

const LANG_OPTIONS = [
  { value: 'en', label: '英语（English，en）' },
  { value: 'ru', label: '俄语（Русский，ru）' },
  { value: 'es', label: '西班牙语（Español，es）' },
  { value: 'fr', label: '法语（Français，fr）' },
  { value: 'de', label: '德语（Deutsch，de）' },
  { value: 'ja', label: '日语（日本語，ja）' },
  { value: 'ko', label: '韩语（한국어，ko）' },
  { value: 'ar', label: '阿拉伯语（العربية，ar）' },
  { value: 'pt', label: '葡萄牙语（Português，pt）' },
  { value: 'it', label: '意大利语（Italiano，it）' },
  { value: 'nl', label: '荷兰语（Nederlands，nl）' },
  { value: 'tr', label: '土耳其语（Türkçe，tr）' },
  { value: 'th', label: '泰语（ภาษาไทย，th）' },
  { value: 'vi', label: '越南语（Tiếng Việt，vi）' },
  { value: 'id', label: '印尼语（Bahasa Indonesia，id）' },
  { value: 'hi', label: '印地语（हिन्दी，hi）' },
  { value: 'pl', label: '波兰语（Polski，pl）' },
];

const jobStatusTag = (status: string) => {
  if (status === 'running') return <Tag color="processing">翻译中</Tag>;
  if (status === 'done') return <Tag color="success">完成</Tag>;
  return <Tag color="default">已取消</Tag>;
};

export default function TranslationManagePage() {
  const { message } = App.useApp();
  const [jobs, setJobs] = useState<TranslationJob[]>([]);
  const [langs, setLangs] = useState<string[]>([]);
  const [jobModalOpen, setJobModalOpen] = useState(false);
  const [detailJobId, setDetailJobId] = useState<number | null>(null);
  const [jobItems, setJobItems] = useState<JobItem[]>([]);
  const [itemFilter, setItemFilter] = useState<string | undefined>(undefined);
  const [jobLang, setJobLang] = useState('');
  const [polling, setPolling] = useState(false);
  const [failedRecords, setFailedRecords] = useState<FailedRecord[]>([]);
  const [retryRecord, setRetryRecord] = useState<FailedRecord | null>(null);
  const [retryZhText, setRetryZhText] = useState('');
  const [retryLoading, setRetryLoading] = useState(false);
  const [addLangValue, setAddLangValue] = useState('');
  const [addLangLoading, setAddLangLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('langs');

  // api interceptor already unwraps { code, data } → r.data is the payload directly
  const loadJobs = () =>
    api.get('/api/admin/translation/jobs').then(r => setJobs(Array.isArray(r.data) ? r.data : []));

  const loadLangs = () =>
    api.get('/api/admin/translation/langs').then(r => setLangs(Array.isArray(r.data) ? r.data : []));

  const loadFailed = () =>
    api.get('/api/admin/translation/failed').then(r => setFailedRecords(Array.isArray(r.data) ? r.data : []));

  useEffect(() => {
    loadJobs();
    loadLangs();
    loadFailed();
  }, []);

  useEffect(() => {
    const hasRunning = jobs.some(j => j.status === 'running');
    if (!hasRunning) { setPolling(false); return; }
    setPolling(true);
    const t = setInterval(loadJobs, 4000);
    return () => clearInterval(t);
  }, [jobs]);

  const handleStartJob = async () => {
    if (!jobLang) { message.warning('请选择语种'); return; }
    await api.post('/api/admin/translation/jobs', { lang: jobLang });
    message.success('全量翻译任务已启动');
    setJobModalOpen(false);
    setJobLang('');
    loadJobs();
  };

  const handleAddLang = () => {
    if (!addLangValue) { message.warning('请选择语种'); return; }
    if (langs.includes(addLangValue)) { message.warning('该语种已存在'); return; }
    setAddLangLoading(true);
    api.post(`/api/admin/translation/langs/${addLangValue}`)
      .then(() => {
        message.success(`已添加 ${addLangValue}，全量翻译任务已自动启动`);
        setAddLangValue('');
        loadLangs();
        loadJobs();
        setActiveTab('jobs');
      })
      .catch(() => message.error('添加失败，请重试'))
      .finally(() => setAddLangLoading(false));
  };

  const handleRemoveLang = async (lang: string) => {
    await api.delete(`/api/admin/translation/langs/${lang}`);
    message.success(`已移除语种 ${lang}`);
    loadLangs();
  };

  const handleCancel = async (id: number) => {
    await api.post(`/api/admin/translation/jobs/${id}/cancel`);
    message.success('任务已取消');
    loadJobs();
  };

  const openDetail = async (id: number, filter?: string) => {
    setDetailJobId(id);
    setItemFilter(filter);
    const r = await api.get(`/api/admin/translation/jobs/${id}/items`,
      { params: filter ? { status: filter } : {} });
    setJobItems(Array.isArray(r.data) ? r.data : []);
  };

  const handleRetry = async (itemId: number) => {
    await api.post(`/api/admin/translation/jobs/items/${itemId}/retry`);
    message.success('已触发重试');
    if (detailJobId) openDetail(detailJobId, itemFilter);
  };

  const handleRetryFailed = async () => {
    if (!retryRecord || !retryZhText.trim()) return;
    setRetryLoading(true);
    try {
      await api.post(`/api/admin/translation/failed/${retryRecord.id}/retry`, { zhText: retryZhText });
      message.success('已触发重试');
      setRetryRecord(null);
      setRetryZhText('');
      loadFailed();
    } finally {
      setRetryLoading(false);
    }
  };

  const jobColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    {
      title: '语种', dataIndex: 'lang', key: 'lang',
      render: (v: string) => <Tag>{v}</Tag>,
    },
    { title: '状态', dataIndex: 'status', key: 'status', render: jobStatusTag },
    {
      title: '进度', key: 'progress',
      render: (_: unknown, r: TranslationJob) => (
        <Space size={0} style={{ width: 180, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <Progress
            percent={r.total ? Math.round((r.done / r.total) * 100) : 0}
            size="small"
            status={r.status === 'running' ? 'active' : undefined}
          />
          <span style={{ fontSize: 12, color: '#888' }}>
            {r.done}/{r.total} 完成
            {r.failed > 0 && <span style={{ color: '#f5222d', marginLeft: 8 }}>{r.failed} 失败</span>}
          </span>
        </Space>
      ),
    },
    {
      title: '创建时间', dataIndex: 'createdAt', key: 'createdAt',
      render: (v: string) => v?.replace('T', ' ').slice(0, 16),
    },
    {
      title: '操作', key: 'action',
      render: (_: unknown, r: TranslationJob) => (
        <Space>
          <Tooltip title="查看明细">
            <Button size="small" icon={<EyeOutlined />} onClick={() => openDetail(r.id)}>明细</Button>
          </Tooltip>
          {r.failed > 0 && (
            <Button size="small" danger onClick={() => openDetail(r.id, 'failed')}>
              {r.failed} 失败
            </Button>
          )}
          {r.status === 'running' && (
            <Popconfirm title="确认取消任务？" onConfirm={() => handleCancel(r.id)}>
              <Button size="small" icon={<StopOutlined />} danger>取消</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const itemColumns = [
    {
      title: '实体类型', dataIndex: 'entityType', key: 'entityType',
      render: (v: string) => <Tag>{v}</Tag>,
    },
    { title: '实体名称', dataIndex: 'entityLabel', key: 'entityLabel' },
    { title: '字段', dataIndex: 'fieldName', key: 'fieldName' },
    {
      title: '状态', dataIndex: 'status', key: 'status',
      render: (v: string) => {
        if (v === 'done') return <Tag color="success">完成</Tag>;
        if (v === 'failed') return <Tag color="error">失败</Tag>;
        return <Tag>待处理</Tag>;
      },
    },
    {
      title: '错误信息', dataIndex: 'errorMsg', key: 'errorMsg',
      ellipsis: true,
      render: (v: string | null) => v ?? '—',
    },
    {
      title: '操作', key: 'action',
      render: (_: unknown, r: JobItem) =>
        r.status === 'failed' ? (
          <Button size="small" icon={<ReloadOutlined />} onClick={() => handleRetry(r.id)}>重试</Button>
        ) : null,
    },
  ];

  const failedColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '实体类型', dataIndex: 'entityType', key: 'entityType', render: (v: string) => <Tag>{v}</Tag> },
    { title: '实体ID', dataIndex: 'entityId', key: 'entityId', width: 80 },
    { title: '字段', dataIndex: 'fieldName', key: 'fieldName', width: 80 },
    { title: '语种', dataIndex: 'lang', key: 'lang', width: 70, render: (v: string) => <Tag>{v}</Tag> },
    {
      title: '失败原因', dataIndex: 'errorMsg', key: 'errorMsg',
      ellipsis: true,
      render: (v: string | null) => <span style={{ color: '#f5222d' }}>{v ?? '—'}</span>,
    },
    {
      title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', width: 140,
      render: (v: string) => v?.replace('T', ' ').slice(0, 16),
    },
    {
      title: '操作', key: 'action',
      render: (_: unknown, r: FailedRecord) => (
        <Button size="small" icon={<ReloadOutlined />} onClick={() => { setRetryRecord(r); setRetryZhText(''); }}>
          重试
        </Button>
      ),
    },
  ];

  // languages not yet configured — used to filter the "add" dropdown
  const availableLangOptions = LANG_OPTIONS.filter(o => !langs.includes(o.value));

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>翻译管理</Title>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
        {
          key: 'langs',
          label: '语种配置',
          children: (
            <Card>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 500, marginBottom: 8 }}>当前目标语种</div>
                <Space wrap>
                  {langs.length === 0 && <span style={{ color: '#bbb' }}>暂无配置</span>}
                  {langs.map(l => (
                    <Tag
                      key={l}
                      closable
                      onClose={e => { e.preventDefault(); handleRemoveLang(l); }}
                      color="blue"
                      style={{ fontSize: 14, padding: '2px 10px' }}
                    >
                      {LANG_OPTIONS.find(o => o.value === l)?.label ?? l}
                    </Tag>
                  ))}
                </Space>
              </div>
              <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 20 }}>
                <div style={{ fontWeight: 500, marginBottom: 8 }}>新增语种</div>
                <div style={{ color: '#888', fontSize: 13, marginBottom: 12 }}>
                  新增后会自动触发该语种的全量翻译任务，可在"翻译任务"Tab 查看进度。
                </div>
                {availableLangOptions.length === 0 ? (
                  <span style={{ color: '#bbb', fontSize: 13 }}>所有支持的语种均已配置</span>
                ) : (
                  <Space>
                    <Select
                      style={{ width: 220 }}
                      placeholder="选择要新增的语种"
                      value={addLangValue || undefined}
                      onChange={setAddLangValue}
                      options={availableLangOptions}
                    />
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      loading={addLangLoading}
                      onClick={handleAddLang}
                    >
                      添加并启动翻译
                    </Button>
                  </Space>
                )}
              </div>
            </Card>
          ),
        },
        {
          key: 'jobs',
          label: (
            <span>
              翻译任务
              {polling && <Badge status="processing" style={{ marginLeft: 6 }} />}
            </span>
          ),
          children: (
            <Card
              // extra={
              //   <Button type="primary" icon={<PlusOutlined />} onClick={() => setJobModalOpen(true)}>
              //     启动全量翻译
              //   </Button>
              // }
            >
              <Table
                dataSource={jobs}
                columns={jobColumns}
                rowKey="id"
                size="small"
                pagination={{ pageSize: 20 }}
              />
            </Card>
          ),
        },
        {
          key: 'failed',
          label: (
            <span>
              全局失败列表
              {failedRecords.length > 0 && <Tag color="error" style={{ marginLeft: 6 }}>{failedRecords.length}</Tag>}
            </span>
          ),
          children: (
            <Card extra={<Button icon={<ReloadOutlined />} onClick={loadFailed}>刷新</Button>}>
              <Table
                dataSource={failedRecords}
                columns={failedColumns}
                rowKey="id"
                size="small"
                pagination={{ pageSize: 20 }}
              />
            </Card>
          ),
        },
      ]} />

      {/* 启动全量翻译 Modal */}
      <Modal
        title="启动全量翻译任务"
        open={jobModalOpen}
        onOk={handleStartJob}
        onCancel={() => { setJobModalOpen(false); setJobLang(''); }}
        okText="启动"
      >
        <Form layout="vertical" style={{ marginTop: 8 }}>
          <Form.Item label="目标语种" required>
            <Select
              options={LANG_OPTIONS}
              placeholder="选择语种"
              value={jobLang || undefined}
              onChange={setJobLang}
            />
          </Form.Item>
          <div style={{ color: '#888', fontSize: 13 }}>
            任务将对所有医院、医生、设备、病例、产品等实体做全量机器翻译，可在任务列表中查看进度并随时取消。
          </div>
        </Form>
      </Modal>

      {/* 任务明细 Modal */}
      <Modal
        title={`任务明细 #${detailJobId}${itemFilter ? ` · 仅显示${itemFilter}` : ''}`}
        open={detailJobId !== null}
        onCancel={() => { setDetailJobId(null); setJobItems([]); setItemFilter(undefined); }}
        footer={null}
        width={820}
      >
        <Table
          dataSource={jobItems}
          columns={itemColumns}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 20 }}
        />
      </Modal>

      {/* 重试失败翻译 Modal */}
      <Modal
        title="重试翻译"
        open={retryRecord !== null}
        onOk={handleRetryFailed}
        confirmLoading={retryLoading}
        onCancel={() => { setRetryRecord(null); setRetryZhText(''); }}
        okText="提交重试"
      >
        {retryRecord && (
          <div style={{ marginTop: 8 }}>
            <div style={{ marginBottom: 12, color: '#888', fontSize: 13 }}>
              实体：{retryRecord.entityType} #{retryRecord.entityId} · 字段：{retryRecord.fieldName} · 语种：{retryRecord.lang}
            </div>
            {retryRecord.errorMsg && (
              <div style={{ marginBottom: 12, color: '#f5222d', fontSize: 13 }}>
                失败原因：{retryRecord.errorMsg}
              </div>
            )}
            <div style={{ marginBottom: 6 }}>请输入最新中文原文（用于本次翻译）：</div>
            <Input.TextArea
              rows={4}
              value={retryZhText}
              onChange={e => setRetryZhText(e.target.value)}
              placeholder="输入中文原文..."
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
