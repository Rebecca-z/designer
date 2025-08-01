// card-designer-canvas-with-card.tsx - 集成会话卡片的画布组件

import React, { useRef } from 'react';
import {
  CanvasGrid,
  CanvasHeader,
  DeviceIndicator,
} from './card-designer-canvas-components';
import ChatInterface from './card-designer-chat-interface';
import { DEVICE_SIZES } from './card-designer-constants-updated';
import { CardDesignData, ComponentType } from './card-designer-types-updated';

interface CanvasProps {
  data: CardDesignData;
  onDataChange: (data: CardDesignData) => void;
  selectedPath: (string | number)[] | null;
  hoveredPath: (string | number)[] | null;
  onSelectComponent: (
    component: ComponentType | null,
    path?: (string | number)[],
  ) => void;
  onDeleteComponent: (path: (string | number)[]) => void;
  onCopyComponent: (component: ComponentType) => void;
  device: keyof typeof DEVICE_SIZES;
  onCanvasFocus?: () => void;
  // 新增：标题数据更新回调
  onHeaderDataChange?: (headerData: {
    title?: { content: string };
    subtitle?: { content: string };
    style?: string;
  }) => void;
  // 新增：元素变化回调
  onElementsChange?: (elements: ComponentType[]) => void;
}

const Canvas: React.FC<CanvasProps> = ({
  data,
  onDataChange,
  selectedPath,
  hoveredPath,
  onSelectComponent,
  onDeleteComponent,
  onCopyComponent,
  device,
  onCanvasFocus,
  onHeaderDataChange,
  onElementsChange,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  // 处理卡片元素变化
  const handleElementsChange = (elements: ComponentType[]) => {
    if (onElementsChange) {
      onElementsChange(elements);
    } else {
      // 兼容旧的方式
      const newData = {
        ...data,
        dsl: {
          ...data.dsl,
          body: {
            ...data.dsl.body,
            elements,
          },
        },
      };
      onDataChange(newData);
    }
  };

  // 检查是否选中了卡片本身
  const isCardSelected =
    selectedPath &&
    selectedPath.length === 2 &&
    selectedPath[0] === 'dsl' &&
    selectedPath[1] === 'body';

  // 处理画布点击事件
  const handleCanvasClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    // 如果点击的是卡片容器、组件包装器或拖拽排序项，不处理画布点击
    if (
      target.closest('[data-card-container]') ||
      target.closest('[data-component-wrapper]') ||
      target.closest('[data-drag-sortable-item]')
    ) {
      return;
    }

    // 如果点击的是操作按钮，不处理画布点击
    if (target.closest('.ant-dropdown') || target.closest('.ant-btn')) {
      return;
    }

    e.stopPropagation();
    onSelectComponent(null);
    onCanvasFocus?.();
  };

  // 处理画布获得焦点
  const handleCanvasFocus = () => {
    onCanvasFocus?.();
  };

  // 处理卡片选中
  const handleCardSelect = () => {
    // console.log(
    //   '🎯 处理卡片选中，调用 onSelectComponent(null, ["dsl", "body"])',
    // );
    onSelectComponent(null, ['dsl', 'body']);
  };

  const canvasWidth = DEVICE_SIZES[device].width;

  return (
    <div
      style={{
        width: '100%',
        height: 'calc(100vh - 60px)',
        overflow: 'auto',
        backgroundColor: '#f5f5f5',
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      {/* 设备切换提示 */}
      <DeviceIndicator device={device} canvasWidth={canvasWidth} />

      {/* 画布容器 */}
      <div
        ref={canvasRef}
        style={{
          width: canvasWidth,
          minHeight: '400px',
          backgroundColor: 'white',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          padding: '8px',
          borderRadius: '8px',
          border: '1px solid #e8e8e8',
          position: 'relative',
          transition: 'all 0.3s ease',
          outline: 'none',
        }}
        onClick={handleCanvasClick}
        onFocus={handleCanvasFocus}
        tabIndex={0}
      >
        {/* 画布标题 */}
        <CanvasHeader elementsCount={data.dsl.body.elements.length} />

        {/* 拖拽提示 - 全局拖拽都会添加到卡片内 */}
        {/* isOver && canDrop && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(24, 144, 255, 0.1)',
              border: '2px dashed #1890ff',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                textAlign: 'center',
                color: '#1890ff',
                fontSize: '16px',
                fontWeight: 'bold',
              }}
            >
              <div>释放以添加组件到卡片</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>
                所有组件都会自动添加到卡片容器内
              </div>
            </div>
          </div>
        ) */}

        {/* 会话界面 */}
        <div
          style={{
            minHeight: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
          }}
        >
          <ChatInterface
            elements={data.dsl.body.elements}
            verticalSpacing={data.dsl.body.vertical_spacing}
            padding={
              data.dsl.body.padding || {
                top: 16,
                right: 16,
                bottom: 16,
                left: 16,
              }
            }
            selectedPath={selectedPath}
            hoveredPath={hoveredPath}
            onElementsChange={handleElementsChange}
            onSelectComponent={onSelectComponent}
            onDeleteComponent={onDeleteComponent}
            onCopyComponent={onCopyComponent}
            onCanvasFocus={onCanvasFocus || (() => {})}
            isCardSelected={!!isCardSelected}
            onCardSelect={handleCardSelect}
            username="用户名"
            cardStyles={data.dsl.body.styles}
            headerData={(() => {
              // 检查header是否存在且有有效内容
              if (
                !data.dsl.header ||
                (!data.dsl.header.title?.content &&
                  !data.dsl.header.subtitle?.content)
              ) {
                return undefined;
              }

              return data.dsl.header;
            })()}
            onHeaderDataChange={onHeaderDataChange}
            layoutMode={data.dsl.body.direction || 'vertical'}
            variables={(() => {
              // 将卡片数据结构中的变量转换为VariableItem[]格式

              if (data.variables && Object.keys(data.variables).length > 0) {
                const convertedVariables = Object.entries(data.variables).map(
                  ([name, value]) => ({
                    [name]: value,
                  }),
                );
                return convertedVariables;
              }
              return [];
            })()}
          />
        </div>

        {/* 画布网格背景 */}
        <CanvasGrid />
      </div>
    </div>
  );
};

export default Canvas;
