import React, { useState } from 'react';
import { Upload, Button, message, Image } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadChangeParam, UploadFile } from 'antd/es/upload';
import api from '../api';

interface ImageUploadProps {
  value?: string;
  onChange?: (url: string) => void;
  category: string;
  accept?: string;
  label?: string;
  uploadUrl?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  category,
  accept = 'image/*',
  label = '上传图片',
  uploadUrl = '/api/admin/upload',
}) => {
  const [uploading, setUploading] = useState(false);

  const customRequest = async (options: {
    file: File | Blob | string;
    onSuccess?: (body: unknown) => void;
    onError?: (err: Error) => void;
  }) => {
    const { file, onSuccess, onError } = options;
    const formData = new FormData();
    formData.append('file', file as File);
    formData.append('category', category);
    setUploading(true);
    try {
      const res = await api.post<string>(uploadUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data;
      onChange?.(url);
      onSuccess?.(url);
      message.success('上传成功');
    } catch (err) {
      const error = err as Error;
      onError?.(error);
      message.error('上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (info: UploadChangeParam<UploadFile>) => {
    if (info.file.status === 'removed') {
      onChange?.('');
    }
  };

  return (
    <div>
      <Upload
        accept={accept}
        showUploadList={false}
        customRequest={customRequest as never}
        onChange={handleChange}
      >
        <Button icon={<UploadOutlined />} loading={uploading}>
          {label}
        </Button>
      </Upload>
      {value && (
        <div className="image-upload-preview">
          <Image
            src={value}
            alt="preview"
            width={120}
            height={80}
            className="image-upload-preview__img"
            fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
          />
          <div className="image-upload-preview__url">
            {value}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
