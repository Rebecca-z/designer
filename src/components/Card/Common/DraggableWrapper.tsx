// 可拖拽的组件包装器(表单内)
import { CopyOutlined, DeleteOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { canDropInContainer, isSamePath } from '../ComponentRenderers/utils';
import { COMPONENT_TYPES } from '../constants';
import { ComponentType, DragItem } from '../type';

// 获取组件信息
const getComponentInfo = (tag: string) => {
  return COMPONENT_TYPES[tag] || tag;
};

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
  width?: string;
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
  width = '100%',
}) => {
  const ref = useRef<HTMLDivElement>(null);

  // 添加防抖和缓存机制
  const lastHoverState = useRef<{
    dragIndex: number;
    targetIndex: number;
    isSameContainer: boolean;
  } | null>(null);

  const isSubmitButton =
    component.tag === 'button' && component?.form_action_type === 'submit';

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
    width: `${width}`,
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
    onDelete?.(path);
  };

  const handleCopy = (e: any) => {
    if (isPreview) return;
    if (e?.stopPropagation && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    onCopy?.(component);
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
      data-component-index={index}
    >
      {/* 选中状态指示器 */}
      {isCurrentSelected && !isSubmitButton && (
        <>
          {/* 组件工具栏 */}
          <div
            style={{
              position: 'absolute',
              top: '-24px',
              left: '0',
              right: '0',
              height: '24px',
              width: '140px',
              backgroundColor: '#1890ff',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 8px',
              zIndex: 100,
            }}
          >
            {/* 组件类型显示 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flex: 1,
              }}
            >
              {/* 组件图标 */}
              {(() => {
                const IconComponent = getComponentInfo(component.tag).icon;
                return IconComponent ? (
                  <div
                    style={{
                      fontSize: '14px',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IconComponent />
                  </div>
                ) : null;
              })()}

              {/* 组件类型名称 */}
              <span
                style={{
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 500,
                }}
              >
                {getComponentInfo(component.tag).name}
              </span>
            </div>

            {/* 操作按钮区域 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
              }}
            >
              <Tooltip title="复制">
                <Button
                  size="small"
                  type="text"
                  icon={<CopyOutlined />}
                  style={{
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onClick={handleCopy}
                />
              </Tooltip>

              <Tooltip title="删除">
                <Button
                  size="small"
                  type="text"
                  icon={<DeleteOutlined />}
                  style={{
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onClick={handleDelete}
                  title="删除组件"
                />
              </Tooltip>
            </div>
          </div>
        </>
      )}
      {children}
    </div>
  );
};

export default DraggableWrapper;
