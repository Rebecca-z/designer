// card-designer-canvas.tsx - 优化选中逻辑的画布组件

import { AppstoreOutlined } from '@ant-design/icons';
import { Typography } from 'antd';
import React, { useRef } from 'react';
import { useDrop } from 'react-dnd';
import ComponentRenderer from './card-designer-components';
import { DEVICE_SIZES } from './card-designer-constants';
import DragWrapper from './card-designer-drag-wrapper';
import { ComponentType, DesignData, DragItem } from './card-designer-types';
import { createDefaultComponent } from './card-designer-utils';
import ErrorBoundary from './ErrorBoundary';

const { Text } = Typography;

interface CanvasProps {
  data: DesignData;
  onDataChange: (data: DesignData) => void;
  selectedComponent: ComponentType | null;
  selectedPath: (string | number)[] | null;
  onSelectComponent: (
    component: ComponentType | null,
    path?: (string | number)[],
  ) => void;
  onDeleteComponent: (path: (string | number)[]) => void;
  onCopyComponent: (component: ComponentType) => void;
  device: keyof typeof DEVICE_SIZES;
  onCanvasFocus?: () => void; // 新增：画布获得焦点的回调
}

// 工具函数：获取嵌套路径的值
const getValueByPath = (obj: any, path: (string | number)[]): any => {
  return path.reduce((current, key) => current?.[key], obj);
};

// 工具函数：设置嵌套路径的值
const setValueByPath = (
  obj: any,
  path: (string | number)[],
  value: any,
): any => {
  const newObj = JSON.parse(JSON.stringify(obj));
  let current = newObj;

  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (!current[key]) {
      current[key] = typeof path[i + 1] === 'number' ? [] : {};
    }
    current = current[key];
  }

  const lastKey = path[path.length - 1];
  current[lastKey] = value;

  return newObj;
};

// 工具函数：删除嵌套路径的值
const deleteValueByPath = (obj: any, path: (string | number)[]): any => {
  const newObj = JSON.parse(JSON.stringify(obj));
  let current = newObj;

  for (let i = 0; i < path.length - 1; i++) {
    current = current[path[i]];
    if (!current) return newObj;
  }

  const lastKey = path[path.length - 1];
  if (Array.isArray(current)) {
    current.splice(lastKey as number, 1);
  } else {
    delete current[lastKey];
  }

  return newObj;
};

// 工具函数：移动数组中的元素
const moveArrayElement = (
  arr: any[],
  fromIndex: number,
  toIndex: number,
): any[] => {
  if (fromIndex === toIndex) return arr;
  const newArr = [...arr];
  const [removed] = newArr.splice(fromIndex, 1);
  newArr.splice(toIndex, 0, removed);
  return newArr;
};

// 工具函数：在指定位置插入元素
const insertIntoArray = (arr: any[], element: any, index: number): any[] => {
  const newArr = [...arr];
  newArr.splice(index, 0, element);
  return newArr;
};

// 检查组件是否为容器类型
const isContainerComponent = (componentType: string): boolean => {
  return componentType === 'form' || componentType === 'column_set';
};

// 检查是否可以在目标容器中放置指定类型的组件
const canDropInContainer = (
  draggedType: string,
  targetPath: (string | number)[],
): boolean => {
  // 容器组件不能嵌套到其他容器中
  if (isContainerComponent(draggedType)) {
    // 检查是否要放到容器内部（非根节点）
    return !targetPath.some(
      (segment) => segment === 'elements' || segment === 'columns',
    );
  }
  return true;
};

// 获取容器类型（用于错误提示）
const getContainerType = (path: (string | number)[]): string => {
  if (path.includes('columns')) return '分栏容器';
  if (path.includes('elements') && path.length > 2) return '表单容器';
  return '画布';
};

// 检查两个路径是否指向同一个组件
const isSamePath = (
  path1: (string | number)[] | null,
  path2: (string | number)[],
): boolean => {
  if (!path1) return false;
  return JSON.stringify(path1) === JSON.stringify(path2);
};

const Canvas: React.FC<CanvasProps> = ({
  data,
  onDataChange,
  selectedComponent,
  selectedPath,
  onSelectComponent,
  onDeleteComponent,
  onCopyComponent,
  device,
  onCanvasFocus,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  // 处理组件移动到画布根节点
  const handleComponentMoveToCanvas = (
    draggedComponent: ComponentType,
    draggedPath: (string | number)[],
  ) => {
    // 如果组件已经在根节点，不需要移动
    if (draggedPath.length === 2 && draggedPath[0] === 'elements') {
      return;
    }

    // 从其他容器移动到根节点
    // 1. 先删除原位置的组件
    const newDataAfterDelete = deleteValueByPath(data, draggedPath);

    // 2. 添加到根节点末尾
    const finalData = {
      ...newDataAfterDelete,
      elements: [...newDataAfterDelete.elements, draggedComponent],
    };

    onDataChange(finalData);
  };

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ['component', 'existing-component'],
    canDrop: (item: DragItem) => {
      // 新组件拖拽到画布根节点总是允许的
      if (item.isNew) return true;

      // 现有组件移动到画布根节点也总是允许的
      if (item.component && item.path) {
        // 如果组件已经在根节点，不需要移动
        if (item.path.length === 2 && item.path[0] === 'elements') {
          return false;
        }
        return true;
      }

      return false;
    },
    drop: (item: DragItem, monitor) => {
      if (monitor.didDrop()) return;

      if (item.isNew) {
        // 处理新组件拖拽到画布根节点
        const newComponent = createDefaultComponent(item.type);
        const newData = {
          ...data,
          elements: [...data.elements, newComponent],
        };
        onDataChange(newData);
      } else if (item.component && item.path) {
        // 处理现有组件拖拽到画布根节点（移动到末尾）
        handleComponentMoveToCanvas(item.component, item.path);
      }
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
    onCanvasFocus?.(); // 通知画布获得焦点
  };

  // 处理画布获得焦点
  const handleCanvasFocus = () => {
    onCanvasFocus?.();
  };

  // 处理组件拖拽到容器中
  const handleContainerDrop = (
    draggedItem: DragItem,
    targetPath: (string | number)[],
    dropIndex?: number,
  ) => {
    let newComponent: ComponentType;
    let newData = { ...data };

    if (draggedItem.isNew) {
      // 新组件
      newComponent = createDefaultComponent(draggedItem.type);

      // 检查是否可以在目标容器中放置
      if (!canDropInContainer(draggedItem.type, targetPath)) {
        console.warn(`容器组件不能嵌套到${getContainerType(targetPath)}中`);
        return;
      }
    } else if (draggedItem.component && draggedItem.path) {
      // 现有组件移动
      newComponent = draggedItem.component;

      // 检查是否可以在目标容器中放置
      if (!canDropInContainer(draggedItem.component.tag, targetPath)) {
        console.warn(`容器组件不能嵌套到${getContainerType(targetPath)}中`);
        return;
      }

      // 如果不是同一个容器内的排序，先从原位置删除
      const draggedContainerPath = draggedItem.path.slice(0, -1);
      const targetContainerPath = targetPath;

      if (
        JSON.stringify(draggedContainerPath) !==
        JSON.stringify(targetContainerPath)
      ) {
        newData = deleteValueByPath(data, draggedItem.path);
      }
    } else {
      return;
    }

    // 获取目标容器
    const targetContainer = getValueByPath(newData, targetPath);
    if (!targetContainer || !Array.isArray(targetContainer)) {
      console.warn('Target container not found or not an array:', targetPath);
      return;
    }

    // 确定插入位置
    const insertIndex =
      dropIndex !== undefined ? dropIndex : targetContainer.length;

    // 如果是同一个容器内的排序
    if (
      draggedItem.path &&
      JSON.stringify(draggedItem.path.slice(0, -1)) ===
        JSON.stringify(targetPath)
    ) {
      const currentIndex = draggedItem.path[
        draggedItem.path.length - 1
      ] as number;
      const newElements = moveArrayElement(
        targetContainer,
        currentIndex,
        insertIndex,
      );
      const finalData = setValueByPath(newData, targetPath, newElements);
      onDataChange(finalData);
    } else {
      // 不同容器间移动或新组件添加
      const newElements = insertIntoArray(
        targetContainer,
        newComponent,
        insertIndex,
      );
      const finalData = setValueByPath(newData, targetPath, newElements);
      onDataChange(finalData);
    }
  };

  // 处理组件排序（同级元素间移动）
  const handleComponentSort = (
    draggedComponent: ComponentType,
    draggedPath: (string | number)[],
    targetPath: (string | number)[],
    dropIndex: number,
  ) => {
    // 检查是否在同一个容器内
    const draggedContainerPath = draggedPath.slice(0, -1);
    const targetContainerPath = targetPath.slice(0, -1);

    if (
      JSON.stringify(draggedContainerPath) ===
      JSON.stringify(targetContainerPath)
    ) {
      // 同一容器内排序
      const containerPath = draggedContainerPath;
      const container = getValueByPath(data, containerPath);

      if (Array.isArray(container)) {
        const currentIndex = draggedPath[draggedPath.length - 1] as number;
        const newElements = moveArrayElement(
          container,
          currentIndex,
          dropIndex,
        );
        const newData = setValueByPath(data, containerPath, newElements);
        onDataChange(newData);
      }
    } else {
      // 不同容器间移动
      handleContainerDrop(
        { component: draggedComponent, path: draggedPath, isNew: false },
        targetContainerPath,
        dropIndex,
      );
    }
  };

  // 更新组件数据
  const handleUpdateComponent = (
    componentPath: (string | number)[],
    updatedComponent: ComponentType,
  ) => {
    const newData = setValueByPath(data, componentPath, updatedComponent);
    onDataChange(newData);
  };

  const canvasWidth = DEVICE_SIZES[device].width;
  const deviceConfig = DEVICE_SIZES[device];

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
      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#fff',
          padding: '4px 12px',
          borderRadius: '16px',
          fontSize: '12px',
          color: '#666',
          border: '1px solid #d9d9d9',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          zIndex: 100,
        }}
      >
        <deviceConfig.icon style={{ marginRight: '4px' }} />
        {deviceConfig.name}
        {canvasWidth !== '100%' && ` (${canvasWidth})`}
      </div>

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
          border:
            isOver && canDrop ? '2px dashed #1890ff' : '1px solid #e8e8e8',
          position: 'relative',
          marginTop: '40px',
          transition: 'all 0.3s ease',
          outline: 'none', // 移除默认焦点样式
        }}
        onClick={handleCanvasClick}
        onFocus={handleCanvasFocus}
        tabIndex={0} // 使画布可以获得焦点
      >
        {/* 画布标题 */}
        <div
          style={{
            position: 'absolute',
            top: '-35px',
            left: '0',
            right: '0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 8px',
          }}
        >
          <Text type="secondary" style={{ fontSize: '12px' }}>
            设计画布
          </Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            组件数量: {data.elements.length}
          </Text>
        </div>

        {/* 拖拽提示区域 */}
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
              <AppstoreOutlined
                style={{ fontSize: '32px', marginBottom: '8px' }}
              />
              <div>释放以添加组件到画布</div>
            </div>
          </div>
        )}

        {/* 组件渲染区域 */}
        <div style={{ minHeight: '100%' }}>
          {data.elements.map((component, index) => {
            // 安全检查
            if (!component) {
              console.warn('Canvas: Invalid component at index', index);
              return (
                <ErrorBoundary key={`error-${index}`}>
                  <div
                    style={{
                      padding: '16px',
                      border: '1px dashed #ff4d4f',
                      borderRadius: '4px',
                      textAlign: 'center',
                      color: '#ff4d4f',
                      backgroundColor: '#fff2f0',
                      margin: '4px',
                    }}
                  >
                    ⚠️ 组件数据异常 (索引: {index})
                  </div>
                </ErrorBoundary>
              );
            }

            const isContainer =
              component.tag === 'form' || component.tag === 'column_set';
            const componentPath = ['elements', index];
            const isSelected = isSamePath(selectedPath, componentPath);

            return (
              <ErrorBoundary key={component.id || `component-${index}`}>
                <DragWrapper
                  component={component}
                  path={componentPath}
                  onContainerDrop={handleContainerDrop}
                  onComponentSort={handleComponentSort}
                  canAcceptDrop={isContainer}
                  sortableContainer={true}
                  containerPath={['elements']}
                  dropIndex={index}
                >
                  <ComponentRenderer
                    component={component}
                    onSelect={onSelectComponent}
                    isSelected={isSelected}
                    selectedComponent={selectedComponent}
                    selectedPath={selectedPath}
                    onUpdate={(updatedData) => {
                      // 更新整个数据结构
                      onDataChange(updatedData);
                    }}
                    onDelete={onDeleteComponent}
                    onCopy={onCopyComponent}
                    path={componentPath}
                    onContainerDrop={handleContainerDrop}
                    onComponentSort={handleComponentSort}
                    onUpdateComponent={handleUpdateComponent}
                    onCanvasFocus={onCanvasFocus}
                  />
                </DragWrapper>
              </ErrorBoundary>
            );
          })}
        </div>

        {/* 空状态 */}
        {data.elements.length === 0 && !isOver && (
          <div
            style={{
              textAlign: 'center',
              color: '#999',
              padding: '80px 0',
              border: '2px dashed #d9d9d9',
              borderRadius: '8px',
              backgroundColor: '#fafafa',
            }}
          >
            <AppstoreOutlined
              style={{ fontSize: '48px', marginBottom: '16px' }}
            />
            <div style={{ fontSize: '16px', marginBottom: '8px' }}>
              拖拽组件到这里开始设计
            </div>
            <div style={{ fontSize: '12px' }}>从左侧面板拖拽组件到画布中</div>
          </div>
        )}

        {/* 画布网格背景 */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `
              linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
            pointerEvents: 'none',
            opacity: 0.3,
            zIndex: -1,
          }}
        />
      </div>

      {/* 画布工具栏 */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#fff',
          padding: '8px 16px',
          borderRadius: '20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          border: '1px solid #e8e8e8',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 100,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            color: '#666',
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: selectedComponent ? '#52c41a' : '#d9d9d9',
            }}
          />
          {selectedComponent ? '已选中组件' : '未选中组件'}
        </div>

        <div
          style={{
            width: '1px',
            height: '16px',
            backgroundColor: '#e8e8e8',
          }}
        />

        <Text type="secondary" style={{ fontSize: '12px' }}>
          {canvasWidth === '100%' ? '响应式' : canvasWidth}
        </Text>
      </div>
    </div>
  );
};

export default Canvas;
