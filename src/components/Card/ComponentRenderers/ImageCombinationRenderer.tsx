import React from 'react';
import { resolveVariable } from '../../Card/utils';
import { DraggableWrapper, ImgRenderer } from '../Common/index';
import { BaseRendererProps } from './types';

// 多图混排组件渲染器
const ImageCombinationRenderer: React.FC<BaseRendererProps> = (props) => {
  const { component, isPreview, enableDrag, variables = [] } = props;
  const comp = component as any;

  // 根据组合模式和实际图片数量推断具体的布局类型和所需图片数量
  const inferLayoutFromImages = (
    combinationMode: string,
    actualImageCount: number,
    isVariableMode: boolean,
    componentId?: string,
  ): { layoutType: string; requiredImageCount: number } => {
    // 优先使用用户在属性面板选择的布局（变量模式和指定模式都适用）
    try {
      const layoutChoiceManager = (window as any).layoutChoiceManager;
      if (
        layoutChoiceManager &&
        typeof layoutChoiceManager.getChoice === 'function' &&
        componentId
      ) {
        const userSelectedLayout = layoutChoiceManager.getChoice(componentId);
        if (userSelectedLayout) {
          // 根据用户选择的布局返回对应的图片数量
          switch (userSelectedLayout) {
            case 'double':
              return { layoutType: 'double', requiredImageCount: 2 };
            case 'triple':
              return { layoutType: 'triple', requiredImageCount: 3 };
            case 'bisect_2':
              return { layoutType: 'bisect_2', requiredImageCount: 2 };
            case 'bisect_4':
              return { layoutType: 'bisect_4', requiredImageCount: 4 };
            case 'bisect_6':
              return { layoutType: 'bisect_6', requiredImageCount: 6 };
            case 'trisect_3':
              return { layoutType: 'trisect_3', requiredImageCount: 3 };
            case 'trisect_6':
              return { layoutType: 'trisect_6', requiredImageCount: 6 };
            case 'trisect_9':
              return { layoutType: 'trisect_9', requiredImageCount: 9 };
          }
        }
      }
    } catch (error) {
      console.log('无法获取用户选择的布局:', error);
    }

    // 指定模式或变量模式没有用户选择时，根据图片数量推断
    switch (combinationMode) {
      case 'double':
        return { layoutType: 'double', requiredImageCount: 2 };

      case 'triple':
        return { layoutType: 'triple', requiredImageCount: 3 };

      case 'bisect':
        if (isVariableMode) {
          // 变量模式默认：根据实际图片数量推断最接近的布局
          if (actualImageCount <= 2)
            return { layoutType: 'bisect_2', requiredImageCount: 2 };
          if (actualImageCount <= 4)
            return { layoutType: 'bisect_4', requiredImageCount: 4 };
          return { layoutType: 'bisect_6', requiredImageCount: 6 };
        } else {
          // 指定模式：根据实际图片数量确定布局
          if (actualImageCount === 2)
            return { layoutType: 'bisect_2', requiredImageCount: 2 };
          if (actualImageCount === 4)
            return { layoutType: 'bisect_4', requiredImageCount: 4 };
          if (actualImageCount === 6)
            return { layoutType: 'bisect_6', requiredImageCount: 6 };
          // 默认为4张图片的布局
          return { layoutType: 'bisect_4', requiredImageCount: 4 };
        }

      case 'trisect':
        if (isVariableMode) {
          // 变量模式默认：根据实际图片数量推断最接近的布局
          if (actualImageCount <= 3)
            return { layoutType: 'trisect_3', requiredImageCount: 3 };
          if (actualImageCount <= 6)
            return { layoutType: 'trisect_6', requiredImageCount: 6 };
          return { layoutType: 'trisect_9', requiredImageCount: 9 };
        } else {
          // 指定模式：根据实际图片数量确定布局
          if (actualImageCount === 3)
            return { layoutType: 'trisect_3', requiredImageCount: 3 };
          if (actualImageCount === 6)
            return { layoutType: 'trisect_6', requiredImageCount: 6 };
          if (actualImageCount === 9)
            return { layoutType: 'trisect_9', requiredImageCount: 9 };
          // 默认为9张图片的布局
          return { layoutType: 'trisect_9', requiredImageCount: 9 };
        }

      default:
        return { layoutType: 'double', requiredImageCount: 2 };
    }
  };

  // 获取图片列表（根据模式和布局要求处理）
  const getImageListByMode = (requiredImageCount: number) => {
    try {
      // 使用外部已经处理好的数据
      let sourceImagesForProcessing = comp.img_list || [];
      const isVariableModeLocal =
        typeof sourceImagesForProcessing === 'string' &&
        sourceImagesForProcessing.includes('${');

      // 处理变量绑定
      if (isVariableModeLocal) {
        const variableContent = resolveVariable(
          sourceImagesForProcessing,
          variables,
        );
        try {
          sourceImagesForProcessing = variableContent.value;
        } catch (parseError) {
          sourceImagesForProcessing = [];
        }
      }

      // 确保是数组
      if (!Array.isArray(sourceImagesForProcessing)) {
        sourceImagesForProcessing = [];
      }
      // 处理图片数组：保持原始数组长度，将无效图片标记为占位符
      const processedSourceImagesLocal = sourceImagesForProcessing.map(
        (img: any, index: any) => {
          const isValid = img && img.img_url && img.img_url.trim() !== '';
          if (!isValid) {
            return {
              img_url: '',
              isPlaceholder: false,
              alt: `占位图片 ${index + 1}`,
            };
          } else {
            return {
              ...img,
              isPlaceholder: false,
            };
          }
        },
      );

      let finalImages = [];

      if (isVariableModeLocal) {
        // 只取有效图片用于变量模式
        const validSourceImages = processedSourceImagesLocal.filter(
          (img: any) => !img.isPlaceholder,
        );

        for (let i = 0; i < requiredImageCount; i++) {
          if (i < validSourceImages.length) {
            // 有实际图片
            finalImages.push({
              ...validSourceImages[i],
              isPlaceholder: false,
            });
          } else {
            // 添加占位符
            finalImages.push({
              img_url: '',
              isPlaceholder: false,
              alt: `占位图片 ${i + 1}`,
            });
          }
        }
      } else {
        // 如果图片数量与布局要求不匹配，自动调整
        if (processedSourceImagesLocal.length !== requiredImageCount) {
          for (let i = 0; i < requiredImageCount; i++) {
            if (i < processedSourceImagesLocal.length) {
              // 保留现有图片
              finalImages.push(processedSourceImagesLocal[i]);
            } else {
              // 添加默认图片
              finalImages.push({
                img_url:
                  'https://lyra2-dev.rongcloud.net:8443/fcs-file/rcbw/demo.png',
                i18n_img_url: {
                  'en-US':
                    'https://lyra2-dev.rongcloud.net:8443/fcs-file/rcbw/demo.png',
                },
                isPlaceholder: false,
              });
            }
          }
        } else {
          // 图片数量匹配，直接使用
          finalImages = processedSourceImagesLocal;
        }
      }

      return finalImages;
    } catch (error) {
      console.error('❌ 获取图片列表时出错:', error);
      return [];
    }
  };

  const combinationMode = comp.combination_mode || 'double';

  // 先获取原始图片数据进行布局推断
  let sourceImages = comp.img_list || comp.imgs || comp.images || [];
  const isVariableMode =
    typeof sourceImages === 'string' && sourceImages.includes('${');

  // 对于指定模式，我们需要预处理数据来推断布局
  let processedSourceImages = [];
  if (!isVariableMode) {
    if (!Array.isArray(sourceImages)) {
      sourceImages = [];
    }

    // 处理图片数组：保持原始数组长度，将无效图片标记为占位符
    processedSourceImages = sourceImages.map((img: any, index: any) => {
      const isValid = img && img.img_url && img.img_url.trim() !== '';
      if (!isValid) {
        return {
          img_url: '',
          isPlaceholder: true,
          alt: `占位图片 ${index + 1}`,
        };
      } else {
        return {
          ...img,
          isPlaceholder: false,
        };
      }
    });
  } else {
    // 变量模式：使用默认的空数组进行布局推断，实际数据在getImageListByMode中处理
    processedSourceImages = [];
  }

  // 根据图片数量推断具体的布局类型和所需图片数量
  const { layoutType, requiredImageCount } = inferLayoutFromImages(
    combinationMode,
    processedSourceImages.length, // 使用总图片数量（包含占位符）进行推断
    isVariableMode,
    comp.id, // 传入组件ID用于获取用户选择的布局
  );

  // 获取最终的图片列表
  const images = getImageListByMode(requiredImageCount);
  const imageCount = images.length;

  // 根据布局模式和图片数量渲染
  const renderImages = () => {
    if (!images || images.length === 0) {
      return (
        <div
          style={{
            width: '100%',
            height: '260px',
            backgroundColor: '#f5f5f5',
            border: '1px dashed #d9d9d9',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#999',
            fontSize: '14px',
          }}
        >
          🖼️ 多图混排区域
        </div>
      );
    }

    // 使用推断的layoutType进行渲染
    switch (layoutType) {
      case 'double':
        // 双图模式：左稍大右更大
        if (imageCount >= 2) {
          return (
            <div style={{ display: 'flex', gap: '6px' }}>
              <div style={{ flex: 1.2 }}>
                <ImgRenderer
                  item={images[0]}
                  style={{ height: '100%', width: '100%' }}
                />
              </div>
              <div style={{ flex: 1.8 }}>
                <ImgRenderer
                  item={images[1]}
                  style={{ height: '100%', width: '100%' }}
                />
              </div>
            </div>
          );
        } else if (imageCount === 1) {
          // 显示1张图片：单图布局
          return (
            <div style={{ height: '260px' }}>
              <ImgRenderer
                item={images[0]}
                style={{ height: '100%', width: '100%' }}
              />
            </div>
          );
        } else {
          // 没有图片：显示空状态
          return null;
        }

      case 'triple':
        // 三图模式：左侧1张大图，右侧上下2张小正方形图片
        if (imageCount >= 3) {
          return (
            <div
              style={{
                display: 'flex',
                gap: '6px',
              }}
            >
              <div style={{ width: '66.5%', minHeight: 0, aspectRatio: 1 }}>
                <ImgRenderer
                  item={images[0]}
                  style={{
                    height: '100%',
                    width: '100%',
                    fontSize: 0,
                    minHeight: 0,
                  }}
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  width: '33%',
                }}
              >
                <div style={{ aspectRatio: 1, minHeight: 0 }}>
                  <ImgRenderer
                    item={images[1]}
                    style={{ height: '100%', width: '100%' }}
                  />
                </div>
                <div style={{ aspectRatio: 1, minHeight: 0 }}>
                  <ImgRenderer
                    item={images[2]}
                    style={{ height: '100%', width: '100%' }}
                  />
                </div>
              </div>
            </div>
          );
        } else if (imageCount === 2) {
          // 显示2张图片：左右布局
          return (
            <div
              style={{
                display: 'flex',
                gap: '6px',
                height: `${(260 - 6) / 2}px`,
              }}
            >
              <div style={{ flex: 2 }}>
                <ImgRenderer
                  item={images[0]}
                  style={{ height: '100%', width: '100%' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <ImgRenderer
                  item={images[1]}
                  style={{ height: '100%', width: '100%' }}
                />
              </div>
            </div>
          );
        } else if (imageCount === 1) {
          // 显示1张图片：单图布局
          return (
            <div style={{ height: `${260}px` }}>
              <ImgRenderer
                item={images[0]}
                style={{ height: '100%', width: '100%' }}
              />
            </div>
          );
        } else {
          // 没有图片：显示空状态
          return null;
        }

      case 'bisect_2':
        // 双列一行（2图）
        // console.log('🔲 bisect_2模式渲染:', { imageCount, images });
        return (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px',
            }}
          >
            {images.map((item: any, index: any) => (
              <div
                key={index}
                style={{
                  aspectRatio: '1 / 1',
                  overflow: 'hidden',
                  borderRadius: '4px',
                }}
              >
                <ImgRenderer
                  item={item}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            ))}
          </div>
        );

      case 'bisect_4':
        // 双列两行（4图）
        // console.log('🔲 bisect_4模式渲染:', { imageCount, images });
        return (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px',
            }}
          >
            {images.map((item: any, index: any) => (
              <div
                key={index}
                style={{
                  aspectRatio: '1 / 1',
                  overflow: 'hidden',
                  borderRadius: '4px',
                }}
              >
                <ImgRenderer
                  item={item}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            ))}
          </div>
        );

      case 'bisect_6':
        // 双列三行（6图）
        // console.log('🔲 bisect_6模式渲染:', { imageCount, images });
        return (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px',
            }}
          >
            {images.map((item: any, index: any) => (
              <div
                key={index}
                style={{
                  aspectRatio: '1 / 1',
                  overflow: 'hidden',
                  borderRadius: '4px',
                }}
              >
                <ImgRenderer
                  item={item}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            ))}
          </div>
        );

      case 'bisect':
        // 双列模式：正方形布局，严格按布局要求显示（兼容旧数据）
        return (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '6px',
              width: '100%',
            }}
          >
            {images.map((img: any, index: number) => (
              <div
                key={index}
                style={{
                  aspectRatio: '1 / 1',
                  width: '100%',
                  overflow: 'hidden',
                  borderRadius: '4px',
                }}
              >
                <ImgRenderer
                  item={img}
                  style={{
                    height: '100%',
                    width: '100%',
                    objectFit: 'cover',
                  }}
                />
              </div>
            ))}
          </div>
        );

      case 'trisect_3':
        // 三列一行（3图）
        return (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '6px',
            }}
          >
            {images.map((item: any, index: any) => (
              <div
                key={index}
                style={{
                  aspectRatio: '1 / 1',
                  overflow: 'hidden',
                  borderRadius: '4px',
                }}
              >
                <ImgRenderer
                  item={item}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            ))}
          </div>
        );

      case 'trisect_6':
        // 三列两行（6图）
        return (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '6px',
            }}
          >
            {images.map((item: any, index: any) => (
              <div
                key={index}
                style={{
                  aspectRatio: '1 / 1',
                  overflow: 'hidden',
                  borderRadius: '4px',
                }}
              >
                <ImgRenderer
                  item={item}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            ))}
          </div>
        );

      case 'trisect_9':
        // 三列三行（9图）
        return (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '6px',
            }}
          >
            {images.map((item: any, index: any) => (
              <div
                key={index}
                style={{
                  aspectRatio: '1 / 1',
                  overflow: 'hidden',
                  borderRadius: '4px',
                }}
              >
                <ImgRenderer
                  item={item}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            ))}
          </div>
        );

      case 'trisect':
        // 三列模式：严格按布局要求显示（兼容旧数据）
        // const trisectRows = Math.ceil(imageCount / 3);
        // const singleImageHeight = 200;
        // const trisectTotalHeight =
        //   trisectRows * singleImageHeight + (trisectRows - 1) * 6;

        return (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '6px',
              height: `${
                Math.ceil(imageCount / 3) * 200 +
                (Math.ceil(imageCount / 3) - 1) * 6
              }px`,
            }}
          >
            {images.map((img: any, index: number) => (
              <div key={index}>
                <ImgRenderer
                  item={img}
                  style={{ height: `${200}px`, width: '100%' }}
                />
              </div>
            ))}
          </div>
        );

      default:
        // 默认网格布局，图片高度更高

        return (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                imageCount <= 2
                  ? `repeat(${imageCount}, 1fr)`
                  : 'repeat(3, 1fr)',
              gap: '6px',
              height: `${
                Math.ceil(imageCount / 3) * 200 +
                (Math.ceil(imageCount / 3) - 1) * 6
              }px`,
            }}
          >
            {images
              .slice(0, Math.min(imageCount, 9))
              .map((img: any, index: number) => (
                <div key={index}>
                  <ImgRenderer
                    item={img}
                    style={{ height: `${200}px`, width: '100%' }}
                  />
                </div>
              ))}
          </div>
        );
    }
  };

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
      {renderImages()}
    </DraggableWrapper>
  ) : (
    renderImages()
  );
};

export default ImageCombinationRenderer;
