import { UploadOutlined } from '@ant-design/icons';
import { Button, Modal, Upload } from 'antd';
import React from 'react';

interface ImageUploadProps {
  onUploadSuccess: (imageUrl: string) => void;
  disabled?: boolean;
  style?: React.CSSProperties;
  buttonProps?: {
    type?: 'primary' | 'default';
    size?: 'small' | 'middle' | 'large';
    icon?: React.ReactNode;
    title?: string;
    children?: React.ReactNode;
  };
}

/**
 * 通用图片上传组件
 * 支持图片尺寸、大小和比例校验
 */
const ImageUpload: React.FC<ImageUploadProps> = ({
  onUploadSuccess,
  disabled = false,
  style,
  buttonProps = {},
}) => {
  /**
   * 校验图片尺寸、大小和比例
   */
  const validateImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      // 1. 校验文件大小（不超过10MB）
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        reject('图片大小不能超过 10MB');
        return;
      }

      // 2. 校验文件类型
      if (!file.type.startsWith('image/')) {
        reject('请选择图片文件');
        return;
      }

      // 3. 校验图片尺寸和比例
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;

        img.onload = () => {
          const { width, height } = img;

          console.log('📏 图片尺寸检查:', {
            fileName: file.name,
            width,
            height,
            fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
            ratio: `${width}:${height}`,
            aspectRatio: width / height,
          });

          // 校验尺寸范围（1500 × 3000 px 范围内）
          if (width > 1500 || height > 3000) {
            reject(
              `图片尺寸 ${width} × ${height} px 超出范围，请选择 1500 × 3000 px 范围内的图片`,
            );
            return;
          }

          // 校验最小尺寸（避免图片过小）
          if (width < 100 || height < 100) {
            reject(
              `图片尺寸 ${width} × ${height} px 过小，请选择至少 100 × 100 px 的图片`,
            );
            return;
          }

          // 校验宽高比（高度:宽度 不超过 16:9，即 height/width ≤ 16/9）
          const aspectRatio = height / width;
          const maxAspectRatio = 16 / 9; // 约 1.78

          if (aspectRatio > maxAspectRatio) {
            const currentRatio = `${Math.round(height)}:${Math.round(width)}`;
            reject(
              `图片比例 ${currentRatio} 超出范围，高度与宽度的比例不能超过 16:9`,
            );
            return;
          }

          console.log('✅ 图片校验通过:', {
            fileName: file.name,
            dimensions: `${width} × ${height}`,
            size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
            aspectRatio: `${Math.round(height)}:${Math.round(width)}`,
            aspectRatioValue: aspectRatio.toFixed(2),
          });

          resolve(imageUrl);
        };

        img.onerror = () => {
          reject('图片格式不支持或文件损坏');
        };

        img.src = imageUrl;
      };

      reader.onerror = () => {
        reject('文件读取失败');
      };

      reader.readAsDataURL(file);
    });
  };

  /**
   * 处理文件上传前的校验
   */
  const handleBeforeUpload = (file: File) => {
    console.log('📁 开始上传图片:', {
      fileName: file.name,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      fileType: file.type,
    });

    validateImage(file)
      .then((imageUrl) => {
        console.log('📁 图片上传成功，调用回调:', {
          fileName: file.name,
          imageUrlLength: imageUrl.length,
        });
        onUploadSuccess(imageUrl);
      })
      .catch((error) => {
        console.error('❌ 图片校验失败:', error);
        Modal.error({
          title: '图片上传失败',
          content: error,
          okText: '确定',
        });
      });

    return false; // 阻止自动上传
  };

  const defaultButtonProps = {
    type: 'primary' as const,
    icon: <UploadOutlined />,
    title: '上传图片',
    children: undefined,
    ...buttonProps,
  };

  return (
    <Upload
      accept="image/*"
      showUploadList={false}
      disabled={disabled}
      beforeUpload={handleBeforeUpload}
    >
      <Button
        type={defaultButtonProps.type}
        size={defaultButtonProps.size}
        icon={defaultButtonProps.icon}
        title={defaultButtonProps.title}
        disabled={disabled}
        style={style}
      >
        {defaultButtonProps.children}
      </Button>
    </Upload>
  );
};

export default ImageUpload;
