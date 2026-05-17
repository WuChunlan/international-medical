import React, { useEffect, useState } from 'react';
import { Button, message, Spin, Tag, Tooltip } from 'antd';
import {
  PictureOutlined,
  VideoCameraOutlined,
  StarOutlined,
  StarFilled,
  DeleteOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import api from '../api';
import type { MediaItem } from '../types';
import './MediaUploadList.less';

interface MediaUploadListProps {
  entityType: string;
  entityId: number | null;
}

const MediaUploadList: React.FC<MediaUploadListProps> = ({ entityType, entityId }) => {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<'image' | 'video' | null>(null);

  const fetchMedia = async () => {
    if (!entityId) return;
    setLoading(true);
    try {
      const res = await api.get<MediaItem[]>('/api/admin/media', {
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
        const uploadRes = await api.post<string>('/api/admin/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const url = uploadRes.data;
        await api.post('/api/admin/media', {
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
      await api.put(`/api/admin/media/${id}/set-cover`);
      message.success('已设为主图');
      fetchMedia();
    } catch {
      message.error('操作失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/admin/media/${id}`);
      message.success('已删除');
      fetchMedia();
    } catch {
      message.error('删除失败');
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
              key={item.id}
              className={`media-item${item.isCover ? ' media-item--cover' : ''}`}
            >
              <div className="media-item__thumb">
                {item.mediaType === 'image' ? (
                  <img src={item.url} alt="preview" />
                ) : (
                  <VideoCameraOutlined className="media-item__video-icon" />
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
                </div>
                <div className="media-item__url">{item.url}</div>
              </div>

              <div className="media-item__btns">
                {item.isCover !== 1 && (
                  <Tooltip title="设为主图">
                    <Button
                      type="text"
                      size="small"
                      icon={<StarOutlined />}
                      onClick={() => handleSetCover(item.id)}
                    />
                  </Tooltip>
                )}
                {item.isCover === 1 && (
                  <Tooltip title="当前主图">
                    <Button
                      type="text"
                      size="small"
                      icon={<StarFilled style={{ color: '#faad14' }} />}
                      disabled
                    />
                  </Tooltip>
                )}
                <Tooltip title="删除">
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDelete(item.id)}
                  />
                </Tooltip>
              </div>
            </div>
          ))
        )}
      </Spin>
    </div>
  );
};

export default MediaUploadList;
