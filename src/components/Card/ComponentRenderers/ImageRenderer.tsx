import React from 'react';
import { DraggableWrapper, ImgRenderer } from '../Common/index';
import { replaceVariables } from '../utils';
import { imageComponentStateManager } from '../Variable/utils/index';
import { BaseRendererProps } from './types';

// 单图组件渲染器
const ImageRenderer: React.FC<BaseRendererProps> = (props) => {
  const {
    component,
    isPreview,
    enableDrag,
    variables = [],
    verticalSpacing = 8,
  } = props;
  const comp = component as any;

  // 获取图片URL
  const getImageUrl = () => {
    try {
      const rawUrl = comp.img_url || comp.url || '';

      // 如果URL为空，尝试获取指定模式下的缓存内容作为回退
      if (!rawUrl || rawUrl.trim() === '') {
        const userEditedUrl = imageComponentStateManager.getUserEditedUrl(
          comp.id,
        );
        const fallbackUrl =
          userEditedUrl ||
          'https://lyra2-dev.rongcloud.net:8443/fcs-file/rcbw/demo.png';
        return fallbackUrl;
      }

      // 处理变量替换
      const processedUrl = replaceVariables(rawUrl, variables);

      // 如果变量替换后仍然是变量占位符格式（说明变量不存在或为空），回退到指定模式内容
      if (processedUrl === rawUrl && rawUrl.includes('${')) {
        const userEditedUrl = imageComponentStateManager.getUserEditedUrl(
          comp.id,
        );
        return (
          userEditedUrl ||
          'https://lyra2-dev.rongcloud.net:8443/fcs-file/rcbw/demo.png'
        );
      }
      return processedUrl;
    } catch (error) {
      console.error('获取图片URL时出错:', error);
      // 出错时也尝试回退到指定模式内容
      const userEditedUrl = imageComponentStateManager.getUserEditedUrl(
        comp.id,
      );
      return (
        userEditedUrl ||
        'https://lyra2-dev.rongcloud.net:8443/fcs-file/rcbw/demo.png'
      );
    }
  };

  // 获取图片对齐方式
  const getImageAlignment = () => {
    const align = comp.horizontal_alignment || comp.align || 'center';
    switch (align) {
      case 'top':
        return 'flex-start';
      case 'center':
        return 'center';
      default:
        return 'center';
    }
  };

  const imageUrl = getImageUrl();
  const alignment = getImageAlignment();

  const imageElement = (
    <div
      style={{
        display: 'flex',
        justifyContent: alignment,
        padding: `${verticalSpacing / 2}px 0`,
      }}
    >
      <div
        style={{
          maxWidth: '100%',
          aspectRatio: comp.style.crop_mode === 'default' ? 'auto' : '4/2',
        }}
      >
        <ImgRenderer
          item={{ img_url: imageUrl, alt: comp.alt }}
          style={{
            objectFit: comp.style.crop_mode === 'default' ? 'contain' : 'cover',
            objectPosition: comp.style.crop_mode === 'top' ? 'top' : 'center',
          }}
        />
      </div>
    </div>
  );

  return enableDrag && !isPreview ? (
    <DraggableWrapper
      component={component}
      path={props.path || []}
      index={props.index || 0}
      containerPath={props.containerPath || []}
      onComponentMove={props.onComponentMove}
      enableSort={props.enableSort}
      onSelect={props.onSelect}
      selectedPath={props.selectedPath}
      onCanvasFocus={props.onCanvasFocus}
      onClearSelection={props.onClearSelection}
      onDelete={props.onDelete}
      onCopy={props.onCopy}
    >
      {imageElement}
    </DraggableWrapper>
  ) : (
    imageElement
  );
};

export default ImageRenderer;
