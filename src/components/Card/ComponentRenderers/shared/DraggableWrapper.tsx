// 可拖拽的组件包装器
import { CopyOutlined, DeleteOutlined, MoreOutlined } from '@ant-design/icons';
import { Button, Dropdown, message } from 'antd';
import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { ComponentType, DragItem } from '../../type';
import { canDropInContainer, isSamePath } from '../utils';

// 检查是否是父子关系
const isParentChild = (
  parentPath: (string | number)[],
  childPath: (string | number)[],
): boolean => {
  if (parentPath.length >= childPath.length) return false;
  return parentPath.every((segment, index) => segment === childPath[index]);
};

interface DraggableWrapperProps {
  component: ComponentType;
  path: (string | number)[];
  index: number;
  containerPath: (string | number)[];
  children: React.ReactNode;
  onComponentMove?: (
    draggedComponent: ComponentType,
    draggedPath: (string | number)[],
    targetPath: (string | number)[],
    dropIndex: number,
  ) => void;
  enableSort?: boolean;
  isChildComponent?: boolean;
  onSelect?: (component: ComponentType, path: (string | number)[]) => void;
  selectedPath?: (string | number)[] | null;
  onCanvasFocus?: () => void;
  onClearSelection?: () => void;
  isPreview?: boolean;
  onDelete?: (path: (string | number)[]) => void;
  onCopy?: (component: ComponentType) => void;
}

const DraggableWrapper: React.FC<DraggableWrapperProps> = ({
  component,
  path,
  index,
  containerPath,
  children,
  onComponentMove,
  enableSort = true,
  isChildComponent = false,
  onSelect,
  selectedPath,
  onCanvasFocus,
  onClearSelection,
  onDelete,
  onCopy,
  isPreview = false,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [indicatorPosition, setIndicatorPosition] = React.useState<
    'top' | 'bottom' | null
  >(null);

  // 添加防抖和缓存机制
  const lastHoverState = useRef<{
    dragIndex: number;
    targetIndex: number;
    isSameContainer: boolean;
  } | null>(null);

  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 拖拽源配置
  const [{ isDragging }, drag] = useDrag({
    type: 'existing-component',
    item: () => {
      // 拖拽开始时清除选中状态
      if (onClearSelection) {
        onClearSelection();
      }

      return {
        type: component.tag,
        component,
        path,
        isNew: false,
        isChildComponent,
      } as DragItem;
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: () => {
      const canDrag = component.tag !== 'title';
      return canDrag;
    },
  });

  // 拖拽目标配置（用于排序）
  const [{ isOver }, drop] = useDrop({
    accept: ['component', 'existing-component', 'canvas-component'],
    canDrop: (item: DragItem) => {
      if (!enableSort) return false;

      // 不能拖拽到自己身上
      if (!item.isNew && item.path && isSamePath(item.path, path)) {
        return false;
      }

      // 不能拖拽到自己的子元素上
      if (!item.isNew && item.path && isParentChild(item.path, path)) {
        return false;
      }

      // 不允许拖拽到任何普通组件上
      const isContainerComponent =
        component.tag === 'form' || component.tag === 'column_set';

      if (!isContainerComponent) {
        return false;
      }

      // 子组件不能拖拽到父组件上
      if (isChildComponent && !item.isNew && item.path) {
        const draggedPath = item.path;
        const currentPath = path;

        // 检查是否是父子关系
        if (isParentChild(currentPath, draggedPath)) {
          return false;
        }
      }

      return true;
    },
    hover: (item: DragItem, monitor) => {
      if (!enableSort || !ref.current) return;

      // 获取鼠标位置
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;

      // 获取元素位置
      const rect = ref.current.getBoundingClientRect();
      const hoverMiddleY = rect.top + rect.height / 2;

      // 根据鼠标位置设置指示线位置
      if (clientOffset.y < hoverMiddleY) {
        setIndicatorPosition('top');
      } else {
        setIndicatorPosition('bottom');
      }

      // 防抖处理
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }

      hoverTimeoutRef.current = setTimeout(() => {
        if (!ref.current) return;

        const draggedIndex = item.path
          ? typeof item.path[item.path.length - 1] === 'number'
            ? (item.path[item.path.length - 1] as number)
            : -1
          : -1;
        const targetIndex = index;

        // 检查是否是同一容器内的排序
        const draggedContainerPath = item.path ? item.path.slice(0, -1) : [];
        const currentContainerPath = containerPath;
        const isSameContainer = isSamePath(
          draggedContainerPath,
          currentContainerPath,
        );

        // 构建当前悬停状态
        const currentHoverState = {
          dragIndex: draggedIndex,
          targetIndex,
          isSameContainer,
        };

        // 检查状态是否发生变化
        if (
          lastHoverState.current &&
          lastHoverState.current.dragIndex === currentHoverState.dragIndex &&
          lastHoverState.current.targetIndex ===
            currentHoverState.targetIndex &&
          lastHoverState.current.isSameContainer ===
            currentHoverState.isSameContainer
        ) {
          return; // 状态没有变化，不更新
        }

        // 更新缓存状态
        lastHoverState.current = currentHoverState;

        // 避免无意义的移动
        if (draggedIndex === targetIndex || draggedIndex === targetIndex - 1) {
          return;
        }

        // 获取拖拽路径
        const draggedPath = item.path;

        // 安全检查：确保路径有效
        if (
          draggedPath &&
          draggedPath.length >= 4 &&
          path.length >= 4 &&
          draggedPath[0] === 'dsl' &&
          draggedPath[1] === 'body' &&
          path[0] === 'dsl' &&
          path[1] === 'body' &&
          item.component
        ) {
          // 检查是否是根节点组件拖拽到容器
          const isRootComponentToContainer =
            draggedPath.length === 4 &&
            draggedPath[0] === 'dsl' &&
            draggedPath[1] === 'body' &&
            draggedPath[2] === 'elements' &&
            // 拖拽到容器内子组件
            (path.length === 6 ||
              // 拖拽到根节点的容器组件本身
              (path.length === 4 &&
                path[0] === 'dsl' &&
                path[1] === 'body' &&
                path[2] === 'elements' &&
                component.tag === 'form')); // 当前组件是表单容器

          if (isRootComponentToContainer) {
            return; // 阻止在hover时处理，留给drop处理器
          }
        }
      }, 50); // 50ms防抖延迟
    },
    drop: (item: DragItem, monitor) => {
      if (monitor.didDrop() || !enableSort) return;

      // 清除防抖定时器
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }

      // 清除指示线位置
      setIndicatorPosition(null);

      // 处理组件移动（包括同容器排序和跨容器移动）
      if (!item.isNew && item.path && item.component && onComponentMove) {
        const draggedPath = item.path;
        const draggedContainerPath = draggedPath.slice(0, -1);
        const targetContainerPath = containerPath;
        const isSameContainer = isSamePath(
          draggedContainerPath,
          targetContainerPath,
        );

        if (!isSameContainer) {
          // 跨容器移动
          // 确定插入位置
          const rect = ref.current?.getBoundingClientRect();
          const clientOffset = monitor.getClientOffset();
          let insertIndex = index;

          if (rect && clientOffset) {
            const hoverMiddleY = rect.top + rect.height / 2;
            if (clientOffset.y > hoverMiddleY) {
              insertIndex = index + 1;
            }
          }

          // 检查拖拽限制
          if (!canDropInContainer(item.component.tag, targetContainerPath)) {
            console.warn('容器组件不能嵌套到其他容器中');
            return;
          }

          // 安全检查：确保路径有效
          if (
            draggedPath.length >= 4 &&
            path.length >= 4 &&
            draggedPath[0] === 'dsl' &&
            draggedPath[1] === 'body' &&
            path[0] === 'dsl' &&
            path[1] === 'body'
          ) {
            // 执行跨容器移动 - 使用正确的目标容器路径
            const targetPath = [...targetContainerPath, insertIndex];

            onComponentMove(
              item.component,
              draggedPath,
              targetPath,
              insertIndex,
            );
          }
        } else {
          // 同容器内排序
          // 确定目标索引
          const rect = ref.current?.getBoundingClientRect();
          const clientOffset = monitor.getClientOffset();
          let targetIndex = index;

          if (rect && clientOffset) {
            const hoverMiddleY = rect.top + rect.height / 2;
            if (clientOffset.y > hoverMiddleY) {
              targetIndex = index + 1;
            }
          }

          // 安全检查：确保路径有效
          if (
            draggedPath.length >= 4 &&
            path.length >= 4 &&
            draggedPath[0] === 'dsl' &&
            draggedPath[1] === 'body' &&
            path[0] === 'dsl' &&
            path[1] === 'body'
          ) {
            // 执行排序
            onComponentMove(item.component, draggedPath, path, targetIndex);
          }
        }
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const opacity = isDragging ? 0.4 : 1;
  drag(drop(ref));

  // 处理组件点击选中
  const handleWrapperClick = (e: React.MouseEvent) => {
    // 阻止事件冒泡，防止触发父级选中
    e.stopPropagation();
    e.preventDefault();

    // 处理组件选中
    onSelect?.(component, path);
    onCanvasFocus?.();
  };

  // 检查当前组件是否被选中
  const isCurrentSelected = isSamePath(selectedPath || null, path);

  // 包装器样式 - 始终保持一致的边框空间，避免闪烁
  const wrapperStyle: React.CSSProperties = {
    position: 'relative',
    borderRadius: '4px',
    padding: '0',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: 'transparent',
    backgroundColor: isCurrentSelected
      ? 'rgba(24, 144, 255, 0.02)'
      : 'transparent',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
    opacity,
  };

  // 选中状态的边框和阴影效果
  const isContainerComponent =
    component.tag === 'form' || component.tag === 'column_set';

  if (isCurrentSelected && !isContainerComponent) {
    wrapperStyle.borderColor = '#1890ff';
    wrapperStyle.boxShadow = '0 0 8px rgba(24, 144, 255, 0.3)';
  } else {
    const isInColumnContainer = containerPath.some(
      (segment) => segment === 'columns',
    );
    const isInFormContainer =
      containerPath.some((segment) => segment === 'elements') &&
      containerPath.length > 4;
    if (isInColumnContainer || isInFormContainer) {
      if (!isCurrentSelected) {
        wrapperStyle.borderColor = 'transparent';
        wrapperStyle.boxShadow = 'none';
      }
    } else {
      if (!isContainerComponent && !isCurrentSelected) {
        wrapperStyle.borderColor = 'transparent';
        wrapperStyle.boxShadow = 'none';
      }
    }
  }

  if (isOver && enableSort && !isCurrentSelected) {
    wrapperStyle.boxShadow = '0 0 8px rgba(24, 144, 255, 0.4)';
  }

  // 拖拽时的样式调整
  if (isDragging) {
    wrapperStyle.zIndex = 1000;
  }

  const handleDelete = (e: any) => {
    if (isPreview) return;
    if (e?.stopPropagation && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    console.warn('Deleting component at path:', path);
    onDelete?.(path);
    message.success('组件已删除');
  };

  const handleCopy = (e: any) => {
    if (isPreview) return;
    if (e?.stopPropagation && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    onCopy?.(component);
  };

  const contextMenu = {
    items: [
      {
        key: 'copy',
        icon: <CopyOutlined />,
        label: '复制组件',
        onClick: handleCopy,
      },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: '删除组件',
        onClick: handleDelete,
        danger: true,
      },
    ],
  };

  return (
    <div
      ref={ref}
      style={wrapperStyle}
      onClick={handleWrapperClick}
      onMouseDown={(e) => {
        // 子组件拖拽时阻止事件冒泡
        if (isChildComponent) {
          e.stopPropagation();
        }
      }}
    >
      {/* 拖拽悬停时的蓝色线条指示线 */}
      {isOver && enableSort && indicatorPosition && (
        <div
          style={{
            position: 'absolute',
            top: indicatorPosition === 'top' ? '0' : '100%',
            left: '0',
            right: '0',
            height: '2px',
            backgroundColor: '#1890ff',
            borderRadius: '1px',
            zIndex: 1000,
            boxShadow: '0 0 4px rgba(24, 144, 255, 0.6)',
            transform:
              indicatorPosition === 'top'
                ? 'translateY(-50%)'
                : 'translateY(50%)',
            pointerEvents: 'none',
          }}
        />
      )}

      {isCurrentSelected && (
        <Dropdown
          menu={contextMenu}
          trigger={['click']}
          placement="bottomRight"
        >
          <Button
            size="small"
            type="primary"
            icon={<MoreOutlined />}
            style={{
              position: 'absolute',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              right: '0',
              top: '0',
              zIndex: 99,
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </Dropdown>
      )}

      {children}
    </div>
  );
};

export default DraggableWrapper;
