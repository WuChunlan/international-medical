import React, { useEffect, useState } from 'react';
import { Button, message, Spin, Tag, Tooltip, Modal, Image } from 'antd';
import {
  PictureOutlined,
  VideoCameraOutlined,
  StarOutlined,
  StarFilled,
  DeleteOutlined,
  UploadOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import api from '../api';
import type { MediaItem } from '../types';
import './MediaUploadList.less';

interface MediaUploadListProps {
  entityType: string;
  entityId: number | null;
  uploadUrl?: string;
  mediaApiUrl?: string;
}

const MediaUploadList: React.FC<MediaUploadListProps> = ({
  entityType,
  entityId,
  uploadUrl = '/api/admin/upload',
  mediaApiUrl = '/api/admin/media',
}) => {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<'image' | 'video' | null>(null);
  const [previewVideo, setPreviewVideo] = useState<string | null>(null);

  const fetchMedia = async () => {
    if (!entityId) return;
    setLoading(true);
    try {
      const res = await api.get<MediaItem[]>(mediaApiUrl, {
        params: { entityType, entityId },
      });
      setItems(res.data);
    } catch {
      message.error('加载媒体列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, [entityType, entityId]);

  const handleUpload = (mediaType: 'image' | 'video') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = mediaType === 'image' ? 'image/*' : 'video/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setUploading(mediaType);
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', `${entityType}s/${mediaType}s`);
        const uploadRes = await api.post<string>(uploadUrl, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const url = uploadRes.data;
        await api.post(mediaApiUrl, {
          entityType,
          entityId,
          mediaType,
          url,
          sortOrder: items.length,
        });
        message.success('上传成功');
        fetchMedia();
      } catch {
        message.error('上传失败');
      } finally {
        setUploading(null);
      }
    };
    input.click();
  };

  const handleSetCover = async (id: number) => {
    try {
      await api.put(`${mediaApiUrl}/${id}/set-cover`);
      message.success('已设为主图');
      fetchMedia();
    } catch {
      message.error('操作失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`${mediaApiUrl}/${id}`);
      message.success('已删除');
      fetchMedia();
    } catch {
      message.error('删除失败');
    }
  };

  const handleDeletePending = async (url: string) => {
    try {
      await api.delete(`${mediaApiUrl}/pending`, {
        params: { entityType, entityId, url },
      });
      message.success('已取消');
      fetchMedia();
    } catch {
      message.error('操作失败');
    }
  };

  if (!entityId) {
    return (
      <div className="media-upload-list">
        <div className="media-upload-list__label">图片 / 视频</div>
        <div className="media-upload-list__disabled-tip">保存后可添加图片和视频</div>
      </div>
    );
  }

  return (
    <div className="media-upload-list">
      <div className="media-upload-list__header">
        <span className="media-upload-list__label">图片 / 视频</span>
        <div className="media-upload-list__actions">
          <Button
            size="small"
            icon={<UploadOutlined />}
            loading={uploading === 'image'}
            onClick={() => handleUpload('image')}
          >
            添加图片
          </Button>
          <Button
            size="small"
            icon={<VideoCameraOutlined />}
            loading={uploading === 'video'}
            onClick={() => handleUpload('video')}
          >
            添加视频
          </Button>
        </div>
      </div>

      <Spin spinning={loading}>
        {items.length === 0 ? (
          <div className="media-upload-list__empty">暂无媒体，点击上方按钮添加</div>
        ) : (
          items.map((item) => (
            <div
              key={item.id != null ? item.id : `pending-${item.url}`}
              className={`media-item${item.isCover ? ' media-item--cover' : ''}${item.status === 'pending_add' ? ' media-item--pending' : ''}`}
            >
              <div className="media-item__thumb">
                {item.mediaType === 'image' ? (
                  <Image src={item.url} alt="preview" width={80} height={56}
                         style={{ objectFit: 'cover' }} />
                ) : (
                  <button
                    type="button"
                    className="media-item__video-btn"
                    aria-label="播放视频"
                    onClick={() => setPreviewVideo(item.url)}
                  >
                    <VideoCameraOutlined className="media-item__video-icon" />
                    <PlayCircleOutlined className="media-item__play-icon" />
                  </button>
                )}
              </div>

              <div className="media-item__info">
                <div className="media-item__type-tag">
                  {item.mediaType === 'image' ? (
                    <Tag icon={<PictureOutlined />} color="blue">图片</Tag>
                  ) : (
                    <Tag icon={<VideoCameraOutlined />} color="purple">视频</Tag>
                  )}
                  {item.isCover === 1 && (
                    <span className="media-item__cover-badge">★ 主图</span>
                  )}
                  {item.status === 'pending_add' && (
                    <Tag color="orange" style={{ marginLeft: 4 }}>待审核</Tag>
                  )}
                </div>
                <div className="media-item__url">{item.url}</div>
              </div>

              <div className="media-item__btns">
                {item.status !== 'pending_add' && item.isCover !== 1 && (
                  <Tooltip title="设为主图">
                    <Button
                      type="text"
                      size="small"
                      icon={<StarOutlined />}
                      onClick={() => handleSetCover(item.id as number)}
                    />
                  </Tooltip>
                )}
                {item.status !== 'pending_add' && item.isCover === 1 && (
                  <Tooltip title="当前主图">
                    <Button
                      type="text"
                      size="small"
                      icon={<StarFilled style={{ color: '#faad14' }} />}
                      disabled
                    />
                  </Tooltip>
                )}
                <Tooltip title={item.status === 'pending_add' ? '取消上传' : '删除'}>
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() =>
                      item.status === 'pending_add'
                        ? handleDeletePending(item.url)
                        : handleDelete(item.id as number)
                    }
                  />
                </Tooltip>
              </div>
            </div>
          ))
        )}
      </Spin>
      <Modal
        title="视频预览"
        open={previewVideo !== null}
        onCancel={() => setPreviewVideo(null)}
        footer={null}
        destroyOnClose
        width={720}
      >
        {previewVideo && (
          <video src={previewVideo} controls autoPlay style={{ width: '100%' }} />
        )}
      </Modal>
    </div>
  );
};

export default MediaUploadList;
