// card-designer-drag-wrapper.tsx - 完全增强的拖拽包装器组件

import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { ComponentType, DragItem } from './card-designer-types';

interface EnhancedDragWrapperProps {
  component: ComponentType;
  path: (string | number)[];
  children: React.ReactNode;
  onContainerDrop: (
    draggedItem: DragItem,
    targetPath: (string | number)[],
    dropIndex?: number,
  ) => void;
  onComponentSort: (
    draggedComponent: ComponentType,
    draggedPath: (string | number)[],
    targetPath: (string | number)[],
    dropIndex: number,
  ) => void;
  canAcceptDrop?: boolean; // 是否可以接受组件拖入
  sortableContainer?: boolean; // 是否支持排序
  containerPath?: (string | number)[]; // 容器路径（用于排序）
  dropIndex?: number; // 在容器中的索引
  className?: string;
  style?: React.CSSProperties;
}

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

const EnhancedDragWrapper: React.FC<EnhancedDragWrapperProps> = ({
  component,
  path,
  children,
  onContainerDrop,
  onComponentSort,
  canAcceptDrop = false,
  sortableContainer = false,
  containerPath,
  dropIndex = 0,
  className,
  style,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  // 拖拽源配置
  const [{ isDragging }, drag] = useDrag({
    type: 'existing-component',
    item: {
      type: component.tag,
      component,
      path,
      isNew: false,
    } as DragItem,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // 拖拽目标配置
  const [{ isOver, canDrop, draggedItem }, drop] = useDrop({
    accept: ['component', 'existing-component'],
    canDrop: (item: DragItem) => {
      // 如果是容器组件，检查拖拽限制
      if (canAcceptDrop) {
        if (item.isNew) {
          return canDropInContainer(item.type, [...path, 'elements']);
        } else if (item.component) {
          return canDropInContainer(item.component.tag, [...path, 'elements']);
        }
      }

      // 排序情况下，检查是否可以拖拽
      if (sortableContainer && containerPath) {
        if (item.isNew) {
          return canDropInContainer(item.type, containerPath);
        } else if (item.component) {
          // 不能拖拽到自己身上
          if (item.path && JSON.stringify(item.path) === JSON.stringify(path)) {
            return false;
          }
          return canDropInContainer(item.component.tag, containerPath);
        }
      }

      return true;
    },
    hover: (item: DragItem, monitor) => {
      if (!ref.current) return;

      // 获取鼠标相对于组件的位置
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;

      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      // 如果支持排序且是现有组件
      if (sortableContainer && !item.isNew && item.path && containerPath) {
        const draggedPath = item.path;
        const targetPath = path;

        // 检查是否在同一容器内
        const draggedContainerPath = draggedPath.slice(0, -1);
        const targetContainerPath = containerPath;

        if (
          JSON.stringify(draggedContainerPath) ===
          JSON.stringify(targetContainerPath)
        ) {
          const draggedIndex = draggedPath[draggedPath.length - 1] as number;
          let targetIndex = dropIndex;

          // 根据鼠标位置决定插入位置
          if (hoverClientY > hoverMiddleY) {
            targetIndex = dropIndex + 1;
          }

          // 避免无意义的移动
          if (
            draggedIndex === targetIndex ||
            draggedIndex === targetIndex - 1
          ) {
            return;
          }

          // 执行排序
          onComponentSort(
            item.component!,
            draggedPath,
            targetPath,
            targetIndex,
          );
        }
      }
    },
    drop: (item: DragItem, monitor) => {
      if (monitor.didDrop()) return;

      if (canAcceptDrop) {
        // 处理组件拖入容器
        let targetPath: (string | number)[];

        if (component.tag === 'form') {
          targetPath = [...path, 'elements'];
        } else if (component.tag === 'column_set') {
          // 对于分栏组件，默认拖入第一列
          targetPath = [...path, 'columns', 0, 'elements'];
        } else {
          return;
        }

        // 检查拖拽限制
        if (item.isNew && !canDropInContainer(item.type, targetPath)) {
          console.warn('容器组件不能嵌套到其他容器中');
          return;
        } else if (
          item.component &&
          !canDropInContainer(item.component.tag, targetPath)
        ) {
          console.warn('容器组件不能嵌套到其他容器中');
          return;
        }

        onContainerDrop(item, targetPath);
      } else if (sortableContainer && containerPath) {
        // 处理排序
        if (!item.isNew && item.path && item.component) {
          // 确定插入位置
          const rect = ref.current?.getBoundingClientRect();
          const clientOffset = monitor.getClientOffset();
          let insertIndex = dropIndex;

          if (rect && clientOffset) {
            const hoverMiddleY = rect.top + rect.height / 2;
            if (clientOffset.y > hoverMiddleY) {
              insertIndex = dropIndex + 1;
            }
          }

          // 检查拖拽限制
          if (!canDropInContainer(item.component.tag, containerPath)) {
            console.warn('容器组件不能嵌套到其他容器中');
            return;
          }

          onComponentSort(item.component, item.path, path, insertIndex);
        } else if (item.isNew) {
          // 新组件直接添加
          if (!canDropInContainer(item.type, containerPath)) {
            console.warn('容器组件不能嵌套到其他容器中');
            return;
          }
          onContainerDrop(item, containerPath, dropIndex + 1);
        }
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
      draggedItem: monitor.getItem(),
    }),
  });

  // 合并拖拽引用
  drag(drop(ref));

  // 确定样式
  const wrapperStyle: React.CSSProperties = {
    position: 'relative',
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
    transition: 'all 0.2s ease',
    ...style,
  };

  // 拖拽悬停样式
  if (isOver && canDrop) {
    if (canAcceptDrop) {
      // 容器组件悬停样式
      wrapperStyle.border = '2px dashed #1890ff';
      wrapperStyle.backgroundColor = 'rgba(24, 144, 255, 0.05)';
    } else if (sortableContainer) {
      // 排序悬停样式
      wrapperStyle.borderTop = '2px solid #1890ff';
    }
  }

  return (
    <div ref={ref} className={className} style={wrapperStyle}>
      {children}

      {/* 拖拽提示 */}
      {isOver && canDrop && canAcceptDrop && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(24, 144, 255, 0.9)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
            pointerEvents: 'none',
            zIndex: 1000,
          }}
        >
          释放以添加到
          {component.tag === 'form' ? '表单' : '分栏'}
        </div>
      )}

      {/* 排序插入线 */}
      {isOver && canDrop && sortableContainer && !canAcceptDrop && (
        <div
          style={{
            position: 'absolute',
            top: -2,
            left: 0,
            right: 0,
            height: '4px',
            backgroundColor: '#1890ff',
            borderRadius: '2px',
            zIndex: 1000,
          }}
        />
      )}

      {/* 容器嵌套限制提示 */}
      {isOver && !canDrop && draggedItem && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(255, 77, 79, 0.9)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
            pointerEvents: 'none',
            zIndex: 1000,
          }}
        >
          ❌ 容器组件不能嵌套
        </div>
      )}
    </div>
  );
};

export default EnhancedDragWrapper;
