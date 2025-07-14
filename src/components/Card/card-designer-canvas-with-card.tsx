// card-designer-canvas-with-card.tsx - 集成会话卡片的画布组件

import React, { useRef } from 'react';
import { useDrop } from 'react-dnd';
import {
  CanvasGrid,
  CanvasHeader,
  CanvasToolbar,
  DeviceIndicator,
} from './card-designer-canvas-components';
import ChatInterface from './card-designer-chat-interface';
import { DEVICE_SIZES } from './card-designer-constants-updated';
import {
  CardDesignData,
  ComponentType,
  DragItem,
} from './card-designer-types-updated';
import { createDefaultComponent } from './card-designer-utils';

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
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  console.warn('data====', data);

  // 处理卡片元素变化
  const handleElementsChange = (elements: ComponentType[]) => {
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
  };

  // 检查是否选中了卡片本身
  const isCardSelected =
    selectedPath &&
    selectedPath.length === 2 &&
    selectedPath[0] === 'dsl' &&
    selectedPath[1] === 'body';

  // 拖拽处理 - 所有拖拽都会被重定向到卡片内
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ['component', 'existing-component'],
    canDrop: () => true,
    drop: (item: DragItem, monitor) => {
      if (monitor.didDrop()) return;

      // 所有拖拽到画布外的组件都添加到卡片内
      handleElementsChange([
        ...data.dsl.body.elements,
        createDefaultComponent(item.type),
      ]);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  });

  // 处理画布点击事件
  const handleCanvasClick = (e: React.MouseEvent) => {
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
    onSelectComponent(null, ['dsl', 'body']);
  };

  // 处理垂直间距变化
  // const handleVerticalSpacingChange = (spacing: number) => {
  //   const newData = {
  //     ...data,
  //     dsl: {
  //       ...data.dsl,
  //       body: {
  //         ...data.dsl.body,
  //         vertical_spacing: spacing,
  //       },
  //     },
  //   };
  //   onDataChange(newData);
  // };

  // 处理内边距变化
  // const handlePaddingChange = (padding: CardPadding) => {
  //   const newData = {
  //     ...data,
  //     dsl: {
  //       ...data.dsl,
  //       body: {
  //         ...data.dsl.body,
  //         padding,
  //       },
  //     },
  //   };
  //   onDataChange(newData);
  // };

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
        ref={(node) => {
          canvasRef.current = node;
          drop(node);
        }}
        style={{
          width: canvasWidth,
          minHeight: '600px',
          backgroundColor: 'white',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #e8e8e8',
          position: 'relative',
          marginTop: '40px',
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
        {isOver && canDrop && (
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
        )}

        {/* 会话界面 */}
        <div
          style={{
            minHeight: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            paddingTop: '40px',
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
            onCanvasFocus={onCanvasFocus}
            isCardSelected={!!isCardSelected}
            onCardSelect={handleCardSelect}
            username="用户名"
          />
        </div>

        {/* 画布网格背景 */}
        <CanvasGrid />
      </div>

      {/* 画布工具栏 */}
      <CanvasToolbar
        selectedComponent={selectedPath ? {} : null}
        canvasWidth={canvasWidth}
        hoveredPath={hoveredPath}
      />
    </div>
  );
};

export default Canvas;
