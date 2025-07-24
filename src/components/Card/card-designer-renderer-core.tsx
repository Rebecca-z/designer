// 修复后的 ComponentRendererCore.tsx - 完整解决表单嵌套显示问题

import { CopyOutlined, DeleteOutlined, MoreOutlined } from '@ant-design/icons';
import { Button, Divider, Dropdown, Input, Select } from 'antd';
import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { ComponentType, DragItem } from './card-designer-types-updated';

const { Option } = Select;
// const { Text } = Typography;

interface ComponentRendererCoreProps {
  component: ComponentType;
  isPreview?: boolean;
  onContainerDrop?: (
    draggedItem: DragItem,
    targetPath: (string | number)[],
    dropIndex?: number,
  ) => void;
  onComponentMove?: (
    draggedComponent: ComponentType,
    draggedPath: (string | number)[],
    targetPath: (string | number)[],
    dropIndex: number,
  ) => void;
  path?: (string | number)[];
  index?: number;
  containerPath?: (string | number)[];
  enableDrag?: boolean;
  enableSort?: boolean;
  // 新增：用于直接渲染子组件
  renderChildren?: (
    elements: ComponentType[],
    basePath: (string | number)[],
  ) => React.ReactNode[];
  // 新增：用于支持组件选中和操作菜单
  onSelect?: (component: ComponentType, path: (string | number)[]) => void;
  selectedPath?: (string | number)[] | null;
  onDelete?: (path: (string | number)[]) => void;
  onCopy?: (component: ComponentType) => void;
  onCanvasFocus?: () => void;
  // 新增：标题数据，用于title组件渲染
  headerData?: {
    title?: { content: string };
    subtitle?: { content: string };
    style?: string; // 改为字符串类型
  };
}

// 检查组件是否为容器类型
const isContainerComponent = (componentType: string): boolean => {
  // 支持左侧面板的容器组件类型
  return (
    componentType === 'form' ||
    componentType === 'column_set' ||
    componentType === 'form-container' ||
    componentType === 'layout-columns'
  );
};

// 检查是否可以在目标容器中放置指定类型的组件
const canDropInContainer = (
  draggedType: string,
  targetPath: (string | number)[],
): boolean => {
  console.log('🔍 canDropInContainer 检查:', {
    draggedType,
    targetPath,
    targetPathLength: targetPath.length,
  });

  // 容器组件不能嵌套到其他容器中
  if (isContainerComponent(draggedType)) {
    // 检查是否要放到容器内部（非根节点）
    const hasContainerSegment = targetPath.some(
      (segment) => segment === 'elements' || segment === 'columns',
    );

    console.log('🔍 容器组件嵌套检查:', {
      draggedType,
      hasContainerSegment,
      canDrop: !hasContainerSegment,
    });

    return !hasContainerSegment;
  }

  // 非容器组件可以放置在任何地方
  console.log('✅ 非容器组件可以放置:', {
    draggedType,
    canDrop: true,
  });
  return true;
};

// 辅助函数：检查两个路径是否相同
const isSamePath = (
  path1: (string | number)[] | null,
  path2: (string | number)[],
): boolean => {
  if (!path1) return false;
  return JSON.stringify(path1) === JSON.stringify(path2);
};

// 检查是否是父子关系
const isParentChild = (
  parentPath: (string | number)[],
  childPath: (string | number)[],
): boolean => {
  if (parentPath.length >= childPath.length) return false;
  for (let i = 0; i < parentPath.length; i++) {
    if (parentPath[i] !== childPath[i]) return false;
  }
  return true;
};

// 容器内子组件的插入式拖拽排序包装器
const ContainerSortableItem: React.FC<{
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
}> = ({
  component,
  path,
  index,
  containerPath,
  children,
  onComponentMove,
  enableSort = true,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [insertPosition, setInsertPosition] = React.useState<
    'before' | 'after' | null
  >(null);
  const insertTargetIndex = useRef<number>(index); // 记录最后一次hover的插入索引

  // 添加防抖和缓存机制
  const lastHoverState = useRef<{
    position: 'before' | 'after' | null;
    targetIndex: number;
    dragIndex: number;
    hoverIndex: number;
  } | null>(null);

  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 拖拽源配置
  const [{ isDragging }, drag] = useDrag({
    type: 'existing-component', // 修复：使用统一的拖拽类型，确保其他组件能识别
    item: () => {
      console.log('🟢 ContainerSortableItem 开始拖拽:', {
        tag: component.tag,
        path,
        componentId: component.id,
        index,
      });
      return {
        type: component.tag,
        component,
        path,
        isNew: false,
        isChildComponent: false, // 修复：容器内的组件不应该是子组件标识
      } as DragItem;
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: () => {
      const canDrag = component.tag !== 'title';
      console.log('🎯 ContainerSortableItem canDrag 检查:', {
        componentTag: component.tag,
        canDrag,
      });
      return canDrag;
    },
  });

  // 拖拽目标配置（用于排序）
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: [
      'component',
      'existing-component',
      'container-component',
      'canvas-component',
    ], // 添加canvas-component类型
    canDrop: (item: DragItem) => {
      if (!enableSort) return false;

      console.log('🔍 ContainerSortableItem canDrop 检查:', {
        itemType: item.type,
        isNew: item.isNew,
        hasComponent: !!item.component,
        componentTag: item.component?.tag,
        isChildComponent: item.isChildComponent,
        currentPath: path,
        containerPath,
        currentComponentTag: component.tag,
        currentComponentId: component.id,
      });

      // 不能拖拽到自己身上
      if (!item.isNew && item.path && isSamePath(item.path, path)) {
        console.log('❌ 不能拖拽到自己身上');
        return false;
      }

      // 不能拖拽到自己的子元素上
      if (!item.isNew && item.path && isParentChild(item.path, path)) {
        console.log('❌ 不能拖拽到自己的子元素上');
        return false;
      }

      // 检查是否是根节点组件拖拽到容器
      if (!item.isNew && item.component && item.path) {
        const isRootComponent =
          item.path.length === 4 &&
          item.path[0] === 'dsl' &&
          item.path[1] === 'body' &&
          item.path[2] === 'elements';

        if (isRootComponent) {
          console.log('🔍 根节点组件拖拽到容器检查:', {
            componentTag: item.component.tag,
            containerPath,
          });
        }
      }

      // 检查容器嵌套限制
      if (item.isNew) {
        // 左侧新组件的拖拽检查
        const canDrop = canDropInContainer(item.type, containerPath);
        console.log('✅ 新组件拖拽检查结果:', canDrop);
        return canDrop;
      } else if (item.component) {
        const canDrop = canDropInContainer(item.component.tag, containerPath);
        console.log('✅ 现有组件拖拽检查结果:', canDrop);
        return canDrop;
      }

      return true;
    },
    hover: (item: DragItem, monitor) => {
      if (!ref.current || !enableSort) return;

      // 清除之前的防抖定时器
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }

      // 使用防抖机制，延迟处理hover事件
      hoverTimeoutRef.current = setTimeout(() => {
        const dragIndex = item.path
          ? (item.path[item.path.length - 1] as number)
          : -1;
        const hoverIndex = index;

        // 不要替换自己
        if (dragIndex === hoverIndex) {
          return;
        }

        // 获取hover元素的边界矩形
        const hoverBoundingRect = ref.current?.getBoundingClientRect();
        if (!hoverBoundingRect) return;

        // 获取垂直方向的中点
        const hoverMiddleY =
          (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

        // 确定鼠标位置
        const clientOffset = monitor.getClientOffset();
        if (!clientOffset) return;

        // 获取鼠标相对于hover元素的位置
        const hoverClientY = clientOffset.y - hoverBoundingRect.top;

        // 插入式拖拽逻辑：确定插入位置
        let currentInsertPosition: 'before' | 'after' | null = null;
        let targetIndex: number;

        if (hoverClientY < hoverMiddleY) {
          // 鼠标在上半部分 - 插入到当前元素之前
          currentInsertPosition = 'before';
          targetIndex = hoverIndex;
        } else {
          // 鼠标在下半部分 - 插入到当前元素之后
          currentInsertPosition = 'after';
          targetIndex = hoverIndex + 1;
        }

        // 检查是否与上次状态相同，避免不必要的更新
        const currentHoverState = {
          position: currentInsertPosition,
          targetIndex,
          dragIndex,
          hoverIndex,
        };

        if (
          lastHoverState.current &&
          lastHoverState.current.position === currentHoverState.position &&
          lastHoverState.current.targetIndex ===
            currentHoverState.targetIndex &&
          lastHoverState.current.dragIndex === currentHoverState.dragIndex &&
          lastHoverState.current.hoverIndex === currentHoverState.hoverIndex
        ) {
          return; // 状态没有变化，不更新
        }

        // 更新缓存状态
        lastHoverState.current = currentHoverState;

        // 获取组件信息用于后续检查和日志
        const draggedComponent = item.component;
        const hoverComponent = component;

        console.log('🎯 容器内插入式拖拽检测:', {
          dragIndex,
          hoverIndex,
          hoverClientY,
          hoverMiddleY,
          insertPosition: currentInsertPosition,
          targetIndex,
          draggedComponent: draggedComponent?.tag,
          hoverComponent: hoverComponent.tag,
          willProceed: 'checking...',
        });

        // 更新插入位置状态，用于显示指示线
        setInsertPosition(currentInsertPosition);
        insertTargetIndex.current = targetIndex; // 更新记录

        // 避免无意义的移动
        if (currentInsertPosition === 'before') {
          // 插入到before位置：如果拖拽元素紧接在hover元素之前，则无意义
          if (dragIndex === hoverIndex - 1) {
            return;
          }
        } else {
          // 插入到after位置：如果拖拽元素紧接在hover元素之后，则无意义
          if (dragIndex === hoverIndex + 1) {
            return;
          }
        }

        // 不要拖拽到自己身上
        if (dragIndex === hoverIndex) {
          return;
        }

        // 只更新状态，不执行排序
        // 排序将在drop时执行
      }, 50); // 50ms防抖延迟
    },
    drop: (item: DragItem, monitor) => {
      if (monitor.didDrop() || !enableSort) return;

      // 清除防抖定时器
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }

      // 处理同容器内排序
      if (!item.isNew && item.path && item.component && onComponentMove) {
        const draggedPath = item.path;
        const draggedContainerPath = draggedPath.slice(0, -1);
        const targetContainerPath = containerPath;

        console.log('🔍 容器内排序检查:', {
          draggedPath,
          draggedContainerPath,
          targetContainerPath,
          isSameContainer: isSamePath(
            draggedContainerPath,
            targetContainerPath,
          ),
          insertTargetIndex: insertTargetIndex.current,
        });

        // 检查是否在同一容器内
        if (isSamePath(draggedContainerPath, targetContainerPath)) {
          console.log('✅ 执行容器内插入式排序 (drop):', {
            from: item.path[item.path.length - 1],
            insertAt: insertTargetIndex.current,
            draggedComponent: item.component.tag,
            hoverComponent: component.tag,
          });

          // 用最后一次hover的insertTargetIndex
          const targetPath = [
            ...draggedContainerPath,
            insertTargetIndex.current,
          ];
          onComponentMove(
            item.component,
            draggedPath,
            targetPath,
            insertTargetIndex.current,
          );

          // 更新监视器项目的索引
          item.path = targetPath;
        } else {
          // 处理跨容器移动
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

          console.log('🔄 执行跨容器移动:', {
            draggedComponent: {
              id: item.component.id,
              tag: item.component.tag,
            },
            draggedPath,
            targetPath: path,
            insertIndex,
            draggedContainerPath,
            targetContainerPath,
          });

          // 执行跨容器移动 - 传递正确的目标路径
          const targetPath = [...targetContainerPath, insertIndex];
          console.log('🎯 调用 onComponentMove 进行跨容器移动:', {
            component: item.component.tag,
            fromPath: draggedPath,
            toPath: targetPath,
            insertIndex,
          });
          onComponentMove(item.component, draggedPath, targetPath, insertIndex);
        }
      }
      setInsertPosition(null); // 清理
      lastHoverState.current = null; // 清理缓存状态
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  });

  // 清理定时器
  React.useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const opacity = isDragging ? 0.4 : 1;
  drag(drop(ref));

  const handleContainerSortableClick = (e: React.MouseEvent) => {
    // 阻止事件冒泡到容器，避免触发容器选中
    e.stopPropagation();
    e.preventDefault();
  };

  return (
    <div
      ref={ref}
      style={{
        opacity,
        position: 'relative',
        transition: 'all 0.15s ease', // 减少过渡时间，提高响应速度
        cursor: component.tag === 'title' ? 'default' : 'grab',
        marginBottom: '8px',
      }}
      onClick={handleContainerSortableClick}
      data-container-sortable-item="true"
    >
      {/* 插入位置指示线 */}
      {isOver && insertPosition === 'before' && (
        <div
          style={{
            position: 'absolute',
            top: '-2px',
            left: '0',
            right: '0',
            height: '3px',
            backgroundColor: '#1890ff',
            borderRadius: '1.5px',
            zIndex: 1000,
            boxShadow: '0 0 6px rgba(24, 144, 255, 0.6)',
            transition: 'opacity 0.1s ease', // 快速显示/隐藏
          }}
        />
      )}

      {isOver && insertPosition === 'after' && (
        <div
          style={{
            position: 'absolute',
            bottom: '-2px',
            left: '0',
            right: '0',
            height: '3px',
            backgroundColor: '#1890ff',
            borderRadius: '1.5px',
            zIndex: 1000,
            boxShadow: '0 0 6px rgba(24, 144, 255, 0.6)',
            transition: 'opacity 0.1s ease', // 快速显示/隐藏
          }}
        />
      )}

      {/* 拖拽悬停样式 */}
      {isOver && canDrop && enableSort && (
        <div
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            border: '2px dashed #1890ff',
            borderRadius: '4px',
            backgroundColor: 'rgba(24, 144, 255, 0.05)',
            pointerEvents: 'none',
            zIndex: 999,
            transition: 'all 0.1s ease', // 快速显示/隐藏
          }}
        />
      )}

      {children}
    </div>
  );
};

// 可拖拽的组件包装器
const DraggableWrapper: React.FC<{
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
  isChildComponent?: boolean; // 新增：标识是否为子组件
  // 新增：选中相关 props
  onSelect?: (component: ComponentType, path: (string | number)[]) => void;
  selectedPath?: (string | number)[] | null;
  onCanvasFocus?: () => void;
}> = ({
  component,
  path,
  index,
  containerPath,
  children,
  onComponentMove,
  enableSort = true,
  isChildComponent = false, // 新增参数
  // 新增：选中相关 props
  onSelect,
  selectedPath,
  onCanvasFocus,
}) => {
  const ref = useRef<HTMLDivElement>(null);

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
      console.log('🟢 DraggableWrapper 开始拖拽:', {
        tag: component.tag,
        path,
        componentId: component.id,
        index,
        isChildComponent,
      });
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
      console.log('🎯 DraggableWrapper canDrag 检查:', {
        componentTag: component.tag,
        canDrag,
        isChildComponent,
      });
      return canDrag;
    },
  });

  // 拖拽目标配置（用于排序）
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ['component', 'existing-component', 'canvas-component'], // 添加canvas-component类型
    canDrop: (item: DragItem) => {
      if (!enableSort) return false;

      console.log('🔍 DraggableWrapper canDrop 检查:', {
        itemType: item.type,
        isNew: item.isNew,
        hasComponent: !!item.component,
        componentTag: item.component?.tag,
        isChildComponent: item.isChildComponent,
        currentPath: path,
        containerPath,
      });

      // 不能拖拽到自己身上
      if (!item.isNew && item.path && isSamePath(item.path, path)) {
        return false;
      }

      // 不能拖拽到自己的子元素上
      if (!item.isNew && item.path && isParentChild(item.path, path)) {
        return false;
      }

      // 子组件不能拖拽到父组件上
      if (isChildComponent && !item.isNew && item.path) {
        const draggedPath = item.path;
        const currentPath = path;

        // 检查是否是父子关系
        if (isParentChild(currentPath, draggedPath)) {
          console.log('🚫 子组件不能拖拽到父组件上');
          return false;
        }
      }

      // 检查是否在同一容器中
      const draggedContainerPath = item.path ? item.path.slice(0, -1) : [];
      const currentContainerPath = containerPath;

      const isSameContainer = isSamePath(
        draggedContainerPath,
        currentContainerPath,
      );

      console.log('✅ DraggableWrapper canDrop 通过:', {
        isSameContainer,
        draggedContainerPath,
        currentContainerPath,
      });

      return true;
    },
    hover: (item: DragItem) => {
      if (!enableSort || !ref.current) return;

      // 防抖处理
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }

      hoverTimeoutRef.current = setTimeout(() => {
        if (!ref.current) return;

        const draggedIndex = item.path ? item.path[item.path.length - 1] : -1;
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

        // 安全检查：确保路径有效
        if (
          draggedPath.length >= 4 &&
          path.length >= 4 &&
          draggedPath[0] === 'dsl' &&
          draggedPath[1] === 'body' &&
          path[0] === 'dsl' &&
          path[1] === 'body'
        ) {
          console.log('🔄 执行同容器排序:', {
            draggedComponent: {
              id: item.component.id,
              tag: item.component.tag,
            },
            draggedPath,
            targetPath: path,
            targetIndex,
            isChildComponent,
          });

          // 执行排序
          onComponentMove(item.component, draggedPath, path, targetIndex);
        } else {
          console.warn('⚠️ 跳过无效的排序操作:', {
            draggedPath,
            targetPath: path,
            reason: '路径格式不正确',
          });
        }
      }, 50); // 50ms防抖延迟
    },
    drop: (item: DragItem, monitor) => {
      if (monitor.didDrop() || !enableSort) return;

      // 清除防抖定时器
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }

      // 处理跨容器移动
      if (!item.isNew && item.path && item.component && onComponentMove) {
        const draggedPath = item.path;
        const draggedContainerPath = draggedPath.slice(0, -1);
        const targetContainerPath = containerPath;

        // 只处理跨容器移动
        if (!isSamePath(draggedContainerPath, targetContainerPath)) {
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
            console.log('🔄 执行跨容器移动:', {
              draggedComponent: {
                id: item.component.id,
                tag: item.component.tag,
              },
              draggedPath,
              targetPath: path,
              insertIndex,
              draggedContainerPath,
              targetContainerPath,
            });

            // 执行跨容器移动
            onComponentMove(item.component, draggedPath, path, insertIndex);
          } else {
            console.warn('⚠️ 跳过无效的跨容器移动:', {
              draggedPath,
              targetPath: path,
              reason: '路径格式不正确',
            });
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

  // 检查当前组件是否被选中
  // const isCurrentSelected = isSamePath(selectedPath || null, path);

  // 处理组件点击选中
  const handleWrapperClick = (e: React.MouseEvent) => {
    // 检查点击的是否是包装器本身，而不是子组件
    const target = e.target as HTMLElement;
    const currentTarget = e.currentTarget as HTMLElement;

    // 如果点击的是子组件（有 data-component-wrapper 属性），不处理包装器的选中
    if (
      target.closest('[data-component-wrapper]') &&
      target !== currentTarget
    ) {
      console.log('🎯 DraggableWrapper 检测到子组件点击，跳过包装器选中');
      return;
    }

    // 阻止事件冒泡，防止触发父级选中
    e.stopPropagation();
    e.preventDefault();

    console.log('🎯 DraggableWrapper 组件被点击:', {
      componentId: component.id,
      componentTag: component.tag,
      path,
      isChildComponent,
    });

    // 处理组件选中
    onSelect?.(component, path);
    onCanvasFocus?.();
  };

  // 检查当前组件是否被选中
  const isCurrentSelected = isSamePath(selectedPath || null, path);

  // 包装器样式
  const wrapperStyle: React.CSSProperties = {
    position: 'relative',
    // border: isCurrentSelected ? '2px solid #1890ff' : '1px solid transparent', // 只有DraggableWrapper显示选中边框
    borderRadius: '4px',
    padding: '2px',
    margin: '1px 0',
    backgroundColor: isCurrentSelected
      ? 'rgba(24, 144, 255, 0.02)'
      : 'transparent',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    opacity,
    boxShadow: isCurrentSelected ? '0 0 4px rgba(24, 144, 255, 0.2)' : 'none',
  };

  // 拖拽时的样式调整
  if (isDragging) {
    wrapperStyle.zIndex = 1000;
  }

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
      {/* 拖拽排序提示线 - 顶部 */}
      {isOver && canDrop && enableSort && (
        <div
          style={{
            position: 'absolute',
            top: '-2px',
            left: '0',
            right: '0',
            height: '2px',
            backgroundColor: '#1890ff',
            borderRadius: '1px',
            zIndex: 1000,
            boxShadow: '0 0 4px rgba(24, 144, 255, 0.5)',
            transition: 'opacity 0.1s ease', // 快速显示/隐藏
          }}
        />
      )}
      {children}
      {/* 拖拽限制提示 */}
      {isOver && !canDrop && (
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
            zIndex: 1000,
            pointerEvents: 'none',
            transition: 'opacity 0.1s ease', // 快速显示/隐藏
          }}
        >
          ❌ 不能放置
        </div>
      )}
    </div>
  );
};

// 智能拖拽区域组件 - 支持表单和分栏
const SmartDropZone: React.FC<{
  targetPath: (string | number)[];
  containerType: 'form' | 'column';
  columnIndex?: number;
  children?: React.ReactNode;
  onContainerDrop?: (
    draggedItem: DragItem,
    targetPath: (string | number)[],
    dropIndex?: number,
  ) => void;
  onComponentMove?: (
    draggedComponent: ComponentType,
    draggedPath: (string | number)[],
    targetPath: (string | number)[],
    dropIndex: number,
  ) => void;
  childElements?: ComponentType[];
}> = ({
  targetPath,
  containerType,
  columnIndex,
  children,
  onContainerDrop,
  onComponentMove,
  childElements = [],
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [insertPosition, setInsertPosition] = React.useState<
    'before' | 'after' | 'inside' | null
  >(null);
  const [insertIndex, setInsertIndex] = React.useState<number>(0);

  const [{ isOver, canDrop, draggedItem }, drop] = useDrop({
    accept: ['component', 'existing-component', 'canvas-component'],
    canDrop: (item: DragItem) => {
      console.log('🔍 SmartDropZone canDrop 检查:', {
        itemType: item.type,
        isNew: item.isNew,
        hasComponent: !!item.component,
        componentTag: item.component?.tag,
        isChildComponent: item.isChildComponent,
        targetPath,
        childElementsCount: childElements.length,
        containerType,
      });

      // 特殊处理标题组件 - 标题组件不能拖拽到容器中
      if (
        item.type === 'title' ||
        (item.component && item.component.tag === 'title')
      ) {
        console.log('❌ 标题组件不能拖拽到容器中');
        return false;
      }

      // 子组件拖拽时的特殊处理
      if (item.isChildComponent) {
        // 子组件可以拖拽到其他容器中，但不能拖拽到自己的父容器
        if (item.path && isParentChild(item.path, targetPath)) {
          console.log('❌ 子组件不能拖拽到自己的父容器');
          return false;
        }
        const canDrop = canDropInContainer(
          item.component?.tag || item.type,
          targetPath,
        );
        console.log('✅ 子组件拖拽检查结果:', canDrop);
        return canDrop;
      }

      // 检查是否可以在此容器中放置
      if (item.isNew) {
        const canDrop = canDropInContainer(item.type, targetPath);
        console.log('✅ 新组件拖拽检查结果:', canDrop);
        return canDrop;
      } else if (item.component && item.path) {
        // 不能拖拽到自己的父容器中
        if (isParentChild(item.path, targetPath)) {
          console.log('❌ 不能拖拽到自己的父容器中');
          return false;
        }

        // 检查是否是根节点组件拖拽到容器
        const isRootComponent =
          item.path.length === 4 &&
          item.path[0] === 'dsl' &&
          item.path[1] === 'body' &&
          item.path[2] === 'elements';

        if (isRootComponent) {
          console.log('🔍 根节点组件拖拽到容器检查:', {
            componentTag: item.component.tag,
            targetPath,
            containerType,
          });
        }

        // ✅ 修复：限制容器热区的拖拽接受条件
        // 只有当组件是从根级别拖拽到容器时，才允许容器热区接受
        if (!isRootComponent) {
          console.log('❌ 非根级别组件不能拖拽到容器热区');
          return false;
        }

        const canDrop = canDropInContainer(item.component.tag, targetPath);
        console.log('✅ 现有组件拖拽检查结果:', canDrop);
        return canDrop;
      }
      console.log('❌ 默认拒绝拖拽');
      return false;
    },
    hover: (item: DragItem, monitor) => {
      if (!ref.current) return;

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;

      // 获取鼠标相对于容器的位置
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      const hoverClientX = clientOffset.x - hoverBoundingRect.left;
      const containerHeight = hoverBoundingRect.height;
      const containerWidth = hoverBoundingRect.width;

      // 确定插入位置
      let currentInsertPosition: 'before' | 'after' | 'inside' | null = null;
      let currentInsertIndex = 0;

      // 如果容器为空，直接插入到内部
      if (childElements.length === 0) {
        currentInsertPosition = 'inside';
        currentInsertIndex = 0;
      } else {
        // 检查是否在容器的边缘区域
        const edgeThreshold = 20; // 边缘检测阈值

        // 检查顶部边缘
        if (hoverClientY <= edgeThreshold) {
          currentInsertPosition = 'before';
          currentInsertIndex = 0;
        }
        // 检查底部边缘
        else if (hoverClientY >= containerHeight - edgeThreshold) {
          currentInsertPosition = 'after';
          currentInsertIndex = childElements.length;
        }
        // 检查左侧边缘
        else if (hoverClientX <= edgeThreshold) {
          currentInsertPosition = 'before';
          currentInsertIndex = 0;
        }
        // 检查右侧边缘
        else if (hoverClientX >= containerWidth - edgeThreshold) {
          currentInsertPosition = 'after';
          currentInsertIndex = childElements.length;
        }
        // 在容器内部，根据鼠标位置确定插入位置
        else {
          // 计算每个子元素的位置
          const childHeight = containerHeight / childElements.length;
          const targetChildIndex = Math.floor(hoverClientY / childHeight);

          if (targetChildIndex < childElements.length) {
            const childTop = targetChildIndex * childHeight;
            const childMiddle = childTop + childHeight / 2;

            if (hoverClientY < childMiddle) {
              currentInsertPosition = 'before';
              currentInsertIndex = targetChildIndex;
            } else {
              currentInsertPosition = 'after';
              currentInsertIndex = targetChildIndex + 1;
            }
          } else {
            currentInsertPosition = 'after';
            currentInsertIndex = childElements.length;
          }
        }
      }

      // 更新插入位置状态
      setInsertPosition(currentInsertPosition);
      setInsertIndex(currentInsertIndex);
    },
    drop: (item: DragItem, monitor) => {
      if (monitor.didDrop()) return;

      console.log('🎯 SmartDropZone 拖拽处理:', {
        containerType,
        targetPath,
        item: {
          type: item.type,
          isNew: item.isNew,
          hasComponent: !!item.component,
          hasPath: !!item.path,
          isChildComponent: item.isChildComponent,
        },
        childElementsCount: childElements.length,
        columnIndex,
        insertPosition,
        insertIndex,
      });

      if (item.isNew) {
        // 新组件添加到指定位置
        console.log('✅ 新组件拖拽到容器:', {
          itemType: item.type,
          targetPath,
          insertIndex,
          insertPosition,
        });
        onContainerDrop?.(item, targetPath, insertIndex);
      } else if (item.component && item.path) {
        // 现有组件移动
        const draggedContainerPath = item.path.slice(0, -1);

        // 检查是否是跨容器移动
        if (!isSamePath(draggedContainerPath, targetPath)) {
          // 检查拖拽限制
          if (!canDropInContainer(item.component.tag, targetPath)) {
            console.warn(
              `容器组件不能嵌套到${
                containerType === 'form' ? '表单' : '分栏'
              }中`,
            );
            return;
          }

          // 检查是否是根节点组件移动到容器
          const isRootComponent =
            item.path.length === 4 &&
            item.path[0] === 'dsl' &&
            item.path[1] === 'body' &&
            item.path[2] === 'elements';

          if (isRootComponent) {
            console.log('🔄 根节点组件移动到容器:', {
              component: item.component.tag,
              from: item.path,
              to: targetPath,
              containerType,
              insertIndex,
            });
          }

          // 子组件跨容器移动的特殊处理
          if (item.isChildComponent) {
            console.log('🔄 子组件跨容器移动:', {
              component: item.component.tag,
              from: draggedContainerPath,
              to: targetPath,
              containerType,
            });
          }

          // 移动到指定位置
          console.log('🎯 调用 onComponentMove (同容器):', {
            component: item.component.tag,
            fromPath: item.path,
            toPath: targetPath,
            insertIndex,
            targetPath,
          });
          onComponentMove?.(
            item.component,
            item.path,
            targetPath, // ✅ 修复：直接传递targetPath，不添加insertIndex
            insertIndex,
          );
        } else {
          // 同容器内的拖拽 - 移动到指定位置
          console.log('🔄 同容器内拖拽到指定位置:', {
            component: item.component.tag,
            targetPath,
            insertIndex,
          });

          // 检查拖拽限制
          if (!canDropInContainer(item.component.tag, targetPath)) {
            console.warn(
              `容器组件不能嵌套到${
                containerType === 'form' ? '表单' : '分栏'
              }中`,
            );
            return;
          }

          // 移动到指定位置
          console.log('🎯 调用 onComponentMove (同容器):', {
            component: item.component.tag,
            fromPath: item.path,
            toPath: targetPath,
            insertIndex,
            targetPath,
          });
          onComponentMove?.(
            item.component,
            item.path,
            targetPath, // ✅ 修复：直接传递targetPath，不添加insertIndex
            insertIndex,
          );
        }
      }

      // 清理状态
      setInsertPosition(null);
      setInsertIndex(0);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
      draggedItem: monitor.getItem(),
    }),
  });

  // 确保children存在且有内容时不显示空状态
  const hasContent = children && React.Children.count(children) > 0;

  const dropZoneStyle: React.CSSProperties = {
    minHeight: hasContent ? 'auto' : containerType === 'form' ? '60px' : '50px',
    padding: '4px',
    border: isOver && canDrop ? '1px dashed #1890ff' : '1px dashed #e0e0e0',
    borderRadius: '2px',
    backgroundColor:
      isOver && canDrop ? 'rgba(24, 144, 255, 0.02)' : 'transparent',
    position: 'relative',
    transition: 'all 0.15s ease', // 减少过渡时间，提高响应速度
    flex: containerType === 'column' ? 1 : 'none',
    // 确保拖拽区域始终可交互，即使有子组件
    pointerEvents: 'auto',
  };

  // 拖拽悬停效果
  if (isOver && canDrop) {
    dropZoneStyle.transform = 'scale(1.02)';
    dropZoneStyle.boxShadow = '0 4px 12px rgba(24, 144, 255, 0.2)';
  }

  // 拖拽限制效果
  if (isOver && !canDrop) {
    dropZoneStyle.border = '2px dashed #ff4d4f';
    dropZoneStyle.backgroundColor = 'rgba(255, 77, 79, 0.05)';
    dropZoneStyle.transform = 'scale(0.98)';
  }

  const emptyStateMessage =
    containerType === 'form'
      ? '拖拽组件到表单中'
      : `拖拽组件到第${(columnIndex ?? 0) + 1}列`;

  const dropMessage = (isChildComponent?: boolean) => {
    if (isChildComponent) {
      return containerType === 'form'
        ? '释放以移动到表单'
        : `释放以移动到第${(columnIndex ?? 0) + 1}列`;
    }
    return containerType === 'form'
      ? '释放以添加到表单'
      : `释放以添加到第${(columnIndex ?? 0) + 1}列`;
  };

  // 处理点击事件 - 确保不阻止子组件的选中
  const handleContainerClick = (e: React.MouseEvent) => {
    // 只在点击容器本身（而非子组件）时阻止事件传播
    if (e.target === e.currentTarget) {
      e.stopPropagation();
    }
    // 允许子组件的点击事件正常冒泡
  };

  return (
    <div ref={drop} style={dropZoneStyle} onClick={handleContainerClick}>
      {/* 简约的分栏列标题 */}
      {containerType === 'column' && (
        <div
          style={{
            fontSize: '10px',
            color: '#999',
            marginBottom: hasContent ? '4px' : '4px',
            textAlign: 'center',
            fontWeight: 'normal',
            padding: '2px 4px',
            backgroundColor: 'transparent',
            borderRadius: '2px',
            border: '1px dashed #e0e0e0',
          }}
          onClick={(e) => e.stopPropagation()} // 阻止标题点击冒泡
        >
          第{(columnIndex ?? 0) + 1}列
        </div>
      )}

      {/* 插入位置指示线 */}
      {isOver && canDrop && insertPosition === 'before' && (
        <div
          style={{
            position: 'absolute',
            top: '-2px',
            left: '0',
            right: '0',
            height: '3px',
            backgroundColor: '#1890ff',
            borderRadius: '1.5px',
            zIndex: 1000,
            boxShadow: '0 0 6px rgba(24, 144, 255, 0.6)',
            transition: 'opacity 0.1s ease',
          }}
        />
      )}

      {isOver && canDrop && insertPosition === 'after' && (
        <div
          style={{
            position: 'absolute',
            bottom: '-2px',
            left: '0',
            right: '0',
            height: '3px',
            backgroundColor: '#1890ff',
            borderRadius: '1.5px',
            zIndex: 1000,
            boxShadow: '0 0 6px rgba(24, 144, 255, 0.6)',
            transition: 'opacity 0.1s ease',
          }}
        />
      )}

      {/* 内容区域 */}
      {hasContent ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: containerType === 'form' ? '12px' : '8px',
            // 确保内容区域不会阻止拖拽事件
            pointerEvents: 'none',
          }}
        >
          <div style={{ pointerEvents: 'auto' }}>{children}</div>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: containerType === 'form' ? '80px' : '60px',
            color: '#999',
            fontSize: '12px',
            textAlign: 'center',
            border: '1px dashed #d9d9d9',
            borderRadius: '4px',
            backgroundColor: '#fafafa',
          }}
        >
          {emptyStateMessage}
        </div>
      )}

      {/* 拖拽悬停提示 */}
      {isOver && canDrop && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(24, 144, 255, 0.9)',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
            pointerEvents: 'none',
            zIndex: 1000,
            transition: 'opacity 0.1s ease', // 快速显示/隐藏
          }}
        >
          {dropMessage(draggedItem?.isChildComponent)}
          {insertPosition && (
            <div style={{ fontSize: '10px', marginTop: '2px' }}>
              {insertPosition === 'before' && '插入到顶部'}
              {insertPosition === 'after' && '插入到底部'}
              {insertPosition === 'inside' && '插入到容器内'}
            </div>
          )}
        </div>
      )}

      {/* 拖拽限制提示 */}
      {isOver && !canDrop && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(255, 77, 79, 0.9)',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
            pointerEvents: 'none',
            zIndex: 1000,
            transition: 'opacity 0.1s ease', // 快速显示/隐藏
          }}
        >
          ❌ 不能移动到这里
        </div>
      )}
    </div>
  );
};

// 样式合并函数
const mergeStyles = (
  component: ComponentType,
  defaultStyles: React.CSSProperties,
): React.CSSProperties => {
  const componentStyles = component.styles || {};

  // 合并默认样式和组件样式
  const mergedStyles = { ...defaultStyles };

  // 应用组件样式
  Object.keys(componentStyles).forEach((key) => {
    if (
      key !== 'customCSS' &&
      componentStyles[key] !== undefined &&
      componentStyles[key] !== ''
    ) {
      mergedStyles[key as keyof React.CSSProperties] = componentStyles[key];
    }
  });

  return mergedStyles;
};

const ComponentRendererCore: React.FC<ComponentRendererCoreProps> = ({
  component,
  isPreview = false,
  onContainerDrop,
  onComponentMove,
  path = [],
  index = 0,
  containerPath = [],
  enableDrag = true,
  enableSort = true,
  renderChildren,
  onSelect,
  selectedPath,
  onDelete,
  onCopy,
  onCanvasFocus,
  headerData,
}) => {
  // 安全检查
  if (!component || !component.tag) {
    console.warn('ComponentRendererCore: Invalid component:', component);
    return (
      <div
        style={{
          padding: '16px',
          border: '1px dashed #ff4d4f',
          borderRadius: '4px',
          textAlign: 'center',
          color: '#ff4d4f',
          backgroundColor: '#fff2f0',
        }}
      >
        ⚠️ 无效组件数据
      </div>
    );
  }

  const comp = component as any;

  // 内部渲染子组件的函数
  const internalRenderChildren = (
    elements: ComponentType[],
    basePath: (string | number)[],
  ): React.ReactNode[] => {
    if (!elements || !Array.isArray(elements) || elements.length === 0) {
      return [];
    }

    console.log('🔄 内部渲染子组件:', {
      elementsCount: elements.length,
      basePath,
      elements: elements.map((el) => ({ id: el?.id, tag: el?.tag })),
    });

    return elements.map((element, elementIndex) => {
      if (!element || !element.id) {
        console.warn('⚠️ 无效的子组件:', elementIndex, element);
        return (
          <div
            key={`invalid-${elementIndex}`}
            style={{
              padding: '8px',
              border: '1px dashed #ff4d4f',
              borderRadius: '4px',
              color: '#ff4d4f',
              fontSize: '12px',
              textAlign: 'center',
              margin: '4px 0',
            }}
          >
            ⚠️ 无效组件数据 (索引: {elementIndex})
          </div>
        );
      }

      const childPath = [...basePath, elementIndex];
      const isSelected = isSamePath(selectedPath || null, childPath);

      console.log(`✅ 渲染子组件 ${elementIndex}:`, {
        elementId: element.id,
        elementTag: element.tag,
        childPath,
        isSelected,
        enableDrag,
        isPreview,
      });

      // 组件选中和操作处理
      const handleClick = (e: React.MouseEvent) => {
        // 立即阻止事件冒泡，防止触发父级选中
        e.stopPropagation();
        e.preventDefault();

        // 确保点击的是组件包装器本身，而不是其子元素
        const target = e.target as HTMLElement;
        const currentTarget = e.currentTarget as HTMLElement;

        // 检查点击目标是否是组件包装器本身
        if (
          target === currentTarget ||
          target.closest('[data-component-wrapper]') === currentTarget
        ) {
          // 直接处理组件选中，不使用setTimeout
          onSelect?.(element, childPath);
          onCanvasFocus?.();
        }
      };

      const handleDelete = () => {
        onDelete?.(childPath);
      };

      const handleCopy = () => {
        onCopy?.(element);
      };

      // 组件内容
      const componentContent = (
        <ComponentRendererCore
          component={element}
          isPreview={isPreview}
          onContainerDrop={onContainerDrop}
          onComponentMove={onComponentMove}
          path={childPath}
          index={elementIndex}
          containerPath={basePath}
          enableDrag={enableDrag}
          enableSort={enableSort}
          onSelect={onSelect}
          selectedPath={selectedPath}
          onDelete={onDelete}
          onCopy={onCopy}
          onCanvasFocus={onCanvasFocus}
          headerData={headerData}
        />
      );

      // 包装器样式
      const wrapperStyle: React.CSSProperties = {
        position: 'relative',
        border: '2px solid transparent', // 始终使用透明边框，避免双边框
        borderRadius: '4px',
        padding: '4px',
        margin: '2px 0',
        backgroundColor: 'transparent', // 始终使用透明背景
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        opacity: 1, // 固定透明度为1，因为这里不需要拖拽状态
      };

      const selectableWrapper = (
        <div
          style={wrapperStyle}
          onClick={handleClick}
          data-component-wrapper="true"
          data-component-id={element.id}
        >
          {/* 操作按钮 */}
          {isSelected && !isPreview && onDelete && onCopy && (
            <div
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                zIndex: 10,
              }}
            >
              <Dropdown
                menu={{
                  items: [
                    // 标题组件不显示复制选项
                    ...(element.tag !== 'title'
                      ? [
                          {
                            key: 'copy',
                            icon: <CopyOutlined />,
                            label: '复制组件',
                            onClick: handleCopy,
                          },
                        ]
                      : []),
                    {
                      key: 'delete',
                      icon: <DeleteOutlined />,
                      label: '删除组件',
                      onClick: handleDelete,
                      danger: true,
                    },
                  ],
                }}
                trigger={['click']}
                placement="bottomRight"
              >
                <Button
                  size="small"
                  type="primary"
                  icon={<MoreOutlined />}
                  style={{
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </Dropdown>
            </div>
          )}
          {/* 选中状态指示器 */}
          {isSelected && !isPreview && (
            <div
              style={{
                position: 'absolute',
                top: '-2px',
                left: '-2px',
                width: '8px',
                height: '8px',
                backgroundColor: '#1890ff',
                borderRadius: '50%',
                zIndex: 10,
              }}
            />
          )}
          {componentContent}
        </div>
      );

      if (enableDrag && !isPreview) {
        console.log('🟢 渲染 ContainerSortableItem for:', {
          elementTag: element.tag,
          elementId: element.id,
          childPath,
          enableDrag,
          isPreview,
        });
        return (
          <ContainerSortableItem
            key={`${element.id}-${elementIndex}-${childPath.join('-')}`}
            component={element}
            path={childPath}
            index={elementIndex}
            containerPath={basePath}
            onComponentMove={onComponentMove}
            enableSort={enableSort}
          >
            {selectableWrapper}
          </ContainerSortableItem>
        );
      } else {
        return (
          <div
            key={`${element.id}-${elementIndex}-${childPath.join('-')}`}
            style={{ marginBottom: '8px' }}
          >
            {selectableWrapper}
          </div>
        );
      }
    });
  };

  // 使用外部传入的渲染函数或内部函数
  const renderChildElements = renderChildren || internalRenderChildren;

  switch (component.tag) {
    case 'form': {
      const formElements = comp.elements || [];
      const formPath = [...path, 'elements'];

      // 检查当前组件是否被选中
      const isCurrentSelected = isSamePath(selectedPath, path);

      console.log('📋 渲染表单容器:', {
        formName: comp.name,
        elementsCount: formElements.length,
        formPath,
        elements: formElements.map((el: any) => ({ id: el?.id, tag: el?.tag })),
        isCurrentSelected,
      });

      const formContent = (
        <div
          style={{
            border: 'none', // 移除容器边框，只保留DraggableWrapper的边框
            borderRadius: '4px',
            backgroundColor: '#fff',
            transition: 'all 0.2s ease',
            position: 'relative',
          }}
        >
          {/* 简约的表单标题 */}
          {isCurrentSelected && !isPreview && (
            <div
              style={{
                position: 'absolute',
                top: '-8px',
                left: '8px',
                backgroundColor: '#1890ff',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '500',
                zIndex: 10,
              }}
            >
              📋 表单 {comp.name && `(${comp.name})`}
            </div>
          )}
          {/* 表单拖拽区域 */}
          <div style={{ padding: '12px', minHeight: '60px' }}>
            <SmartDropZone
              targetPath={formPath}
              containerType="form"
              onContainerDrop={onContainerDrop}
              onComponentMove={onComponentMove}
              childElements={formElements}
            >
              {formElements.length > 0
                ? renderChildElements(formElements, formPath)
                : null}
            </SmartDropZone>
          </div>
        </div>
      );

      return enableDrag && !isPreview ? (
        <DraggableWrapper
          component={component}
          path={path}
          index={index}
          containerPath={containerPath}
          onComponentMove={onComponentMove}
          enableSort={enableSort}
          onSelect={onSelect}
          selectedPath={selectedPath}
          onCanvasFocus={onCanvasFocus}
        >
          {formContent}
        </DraggableWrapper>
      ) : (
        formContent
      );
    }

    case 'column_set': {
      const columns = comp.columns || [];

      // 检查当前组件是否被选中
      const isCurrentSelected = isSamePath(selectedPath, path);

      console.log('📐 渲染分栏容器:', {
        columnsCount: columns.length,
        columns: columns.map((col: any, idx: number) => ({
          columnIndex: idx,
          elementsCount: col.elements?.length || 0,
          elements:
            col.elements?.map((el: any) => ({ id: el?.id, tag: el?.tag })) ||
            [],
        })),
        isCurrentSelected,
      });

      const columnContent = (
        <div
          style={{
            border: 'none', // 移除容器边框，只保留DraggableWrapper的边框
            borderRadius: '4px',
            backgroundColor: '#fff',
            transition: 'all 0.2s ease',
            position: 'relative',
          }}
        >
          {/* 简约的分栏标题 */}
          {isCurrentSelected && !isPreview && (
            <div
              style={{
                position: 'absolute',
                top: '-8px',
                left: '8px',
                backgroundColor: '#1890ff',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '500',
                zIndex: 10,
              }}
            >
              📐 分栏 ({columns.length}列)
            </div>
          )}

          {/* 分栏内容区域 */}
          <div
            style={{
              display: 'flex',
              gap: `${comp.gap || 16}px`,
              padding: '12px',
              minHeight: '60px',
            }}
          >
            {columns.map((column: any, columnIndex: number) => {
              const columnElements = column.elements || [];
              const columnPath = [...path, 'columns', columnIndex, 'elements'];

              console.log(`📐 渲染第${columnIndex + 1}列:`, {
                columnIndex,
                elementsCount: columnElements.length,
                columnPath,
                elements: columnElements.map((el: any) => ({
                  id: el?.id,
                  tag: el?.tag,
                })),
              });

              return (
                <SmartDropZone
                  key={`column-${columnIndex}-${columnPath.join('-')}`}
                  targetPath={columnPath}
                  containerType="column"
                  columnIndex={columnIndex}
                  onContainerDrop={onContainerDrop}
                  onComponentMove={onComponentMove}
                  childElements={columnElements}
                >
                  {columnElements.length > 0
                    ? renderChildElements(columnElements, columnPath)
                    : null}
                </SmartDropZone>
              );
            })}
          </div>
        </div>
      );

      return enableDrag && !isPreview ? (
        <DraggableWrapper
          component={component}
          path={path}
          index={index}
          containerPath={containerPath}
          onComponentMove={onComponentMove}
          enableSort={enableSort}
          onSelect={onSelect}
          selectedPath={selectedPath}
          onCanvasFocus={onCanvasFocus}
        >
          {columnContent}
        </DraggableWrapper>
      ) : (
        columnContent
      );
    }

    // 所有其他组件类型的渲染逻辑保持不变...
    case 'plain_text': {
      console.log('📝 渲染 plain_text 组件:', {
        componentId: comp.id,
        content: comp.content,
        textColor: comp.textColor,
        fontSize: comp.fontSize,
        fontWeight: comp.fontWeight,
        textAlign: comp.textAlign,
        numberOfLines: comp.numberOfLines,
        style: comp.style,
        path,
        isPreview,
        enableDrag,
      });

      // 从 style 对象中读取样式属性，如果没有则从根属性读取
      const fontSize = comp.style?.fontSize || comp.fontSize || 14;
      const fontWeight = comp.style?.fontWeight || comp.fontWeight || 'normal';
      const textAlign = comp.style?.textAlign || comp.textAlign || 'left';
      const numberOfLines =
        comp.style?.numberOfLines || comp.numberOfLines || 1;

      const defaultStyles: React.CSSProperties = {
        color: comp.style?.color || '#000000', // 使用配置的字色或默认黑色
        fontSize: `${fontSize}px`,
        fontWeight: fontWeight,
        textAlign: textAlign,
        lineHeight: 1.5,
        backgroundColor: '#fff',
        borderRadius: '4px',
        // 添加最大行数限制
        display: '-webkit-box',
        WebkitLineClamp: numberOfLines,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        wordBreak: 'break-word',
        whiteSpace: 'normal',
        minHeight: '25px',
        // maxHeight: `${numberOfLines * 1.5 * fontSize}px`,
      };

      const mergedStyles = mergeStyles(component, defaultStyles);

      const handleTextClick = (e: React.MouseEvent) => {
        // 立即阻止事件冒泡，防止触发父级选中
        e.stopPropagation();
        e.preventDefault();

        console.log('📝 文本组件被点击:', {
          componentId: comp.id,
          componentTag: comp.tag,
          path,
        });

        console.log('📝 检查 onSelect 回调:', {
          onSelectExists: !!onSelect,
          onSelectType: typeof onSelect,
        });

        // 处理组件选中
        if (onSelect) {
          console.log('📝 调用 onSelect 回调:', {
            component,
            path,
          });
          onSelect(component, path);
        } else {
          console.log('❌ onSelect 回调不存在');
        }

        if (onCanvasFocus) {
          console.log('📝 调用 onCanvasFocus 回调');
          onCanvasFocus();
        } else {
          console.log('❌ onCanvasFocus 回调不存在');
        }
      };

      // 检查当前组件是否被选中
      const isCurrentSelected = isSamePath(selectedPath, path);

      console.log('📝 文本组件选中状态检查:', {
        componentId: comp.id,
        componentTag: comp.tag,
        path,
        selectedPath,
        isCurrentSelected,
        isPreview,
      });

      // 选中状态样式
      const selectedStyles: React.CSSProperties = {
        border:
          isCurrentSelected && !isPreview
            ? '2px solid #1890ff'
            : '2px solid transparent',
        backgroundColor:
          isCurrentSelected && !isPreview ? 'rgba(24, 144, 255, 0.05)' : '#fff',
        boxShadow:
          isCurrentSelected && !isPreview
            ? '0 0 8px rgba(24, 144, 255, 0.3)'
            : 'none',
      };

      const textContent = (
        <div
          style={{ ...mergedStyles, ...selectedStyles }}
          onClick={handleTextClick}
          data-component-wrapper="true"
          data-component-id={comp.id}
        >
          {comp.content || '文本内容'}
        </div>
      );

      return enableDrag && !isPreview ? (
        <DraggableWrapper
          component={component}
          path={path}
          index={index}
          containerPath={containerPath}
          onComponentMove={onComponentMove}
          enableSort={enableSort}
          onSelect={onSelect}
          selectedPath={selectedPath}
          onCanvasFocus={onCanvasFocus}
        >
          {textContent}
        </DraggableWrapper>
      ) : (
        textContent
      );
    }

    case 'rich_text': {
      console.log('📝 渲染 rich_text 组件:', {
        componentId: comp.id,
        content: comp.content,
        style: comp.style,
        path,
        isPreview,
        enableDrag,
      });

      // 从 style 对象中读取样式属性，如果没有则从根属性读取
      const fontSize = comp.style?.fontSize || comp.fontSize || 14;
      const fontWeight = comp.style?.fontWeight || comp.fontWeight || 'normal';
      const textAlign = comp.style?.textAlign || comp.textAlign || 'left';
      const numberOfLines =
        comp.style?.numberOfLines || comp.numberOfLines || 1;

      const defaultStyles: React.CSSProperties = {
        // padding: '12px',
        borderRadius: '4px',
        backgroundColor: '#fff7e6',
        position: 'relative',
        color: comp.style?.color || '#000000', // 使用配置的字色或默认黑色
        fontSize: `${fontSize}px`,
        fontWeight: fontWeight,
        textAlign: textAlign,
        lineHeight: 1.5,
        // 添加最大行数限制
        display: '-webkit-box',
        WebkitLineClamp: numberOfLines,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        wordBreak: 'break-word',
        whiteSpace: 'normal',
        // maxHeight: `${numberOfLines * 1.5 * fontSize}px`,
      };

      const mergedStyles = mergeStyles(component, defaultStyles);

      const handleRichTextClick = (e: React.MouseEvent) => {
        // 立即阻止事件冒泡，防止触发父级选中
        e.stopPropagation();
        e.preventDefault();

        console.log('📝 富文本组件被点击:', {
          componentId: comp.id,
          componentTag: comp.tag,
          path,
        });

        console.log('📝 检查 onSelect 回调:', {
          onSelectExists: !!onSelect,
          onSelectType: typeof onSelect,
        });

        // 处理组件选中
        if (onSelect) {
          console.log('📝 调用 onSelect 回调:', {
            component,
            path,
          });
          onSelect(component, path);
        } else {
          console.log('❌ onSelect 回调不存在');
        }

        if (onCanvasFocus) {
          console.log('📝 调用 onCanvasFocus 回调');
          onCanvasFocus();
        } else {
          console.log('❌ onCanvasFocus 回调不存在');
        }
      };

      // 检查当前组件是否被选中
      const isCurrentSelected = isSamePath(selectedPath, path);

      console.log('📝 富文本组件选中状态检查:', {
        componentId: comp.id,
        componentTag: comp.tag,
        path,
        selectedPath,
        isCurrentSelected,
        isPreview,
      });

      // 选中状态样式
      const selectedStyles: React.CSSProperties = {
        // border:
        //   isCurrentSelected && !isPreview
        //     ? '2px solid #1890ff'
        //     : '2px solid #f0f0f0',
        backgroundColor:
          isCurrentSelected && !isPreview
            ? 'rgba(24, 144, 255, 0.05)'
            : '#fff7e6',
        boxShadow:
          isCurrentSelected && !isPreview
            ? '0 0 8px rgba(24, 144, 255, 0.3)'
            : 'none',
      };

      const richTextContent = (
        <div
          style={{ ...mergedStyles, ...selectedStyles }}
          onClick={handleRichTextClick}
          data-component-wrapper="true"
          data-component-id={comp.id}
        >
          <div style={{ minHeight: '50px' }}>
            {comp.content?.content?.[0]?.content?.[0]?.text || '富文本内容'}
          </div>
        </div>
      );

      return enableDrag && !isPreview ? (
        <DraggableWrapper
          component={component}
          path={path}
          index={index}
          containerPath={containerPath}
          onComponentMove={onComponentMove}
          enableSort={enableSort}
          onSelect={onSelect}
          selectedPath={selectedPath}
          onCanvasFocus={onCanvasFocus}
        >
          {richTextContent}
        </DraggableWrapper>
      ) : (
        richTextContent
      );
    }

    case 'hr': {
      console.log('📏 渲染分割线组件:', {
        componentId: comp.id,
        path,
        isPreview,
        enableDrag,
        enableSort,
      });

      // 检查当前组件是否被选中
      const isCurrentSelected = isSamePath(selectedPath, path);

      // 选中样式
      const selectedStyles: React.CSSProperties = isCurrentSelected
        ? {
            border: '2px solid #1890ff',
            borderRadius: '4px',
            backgroundColor: 'rgba(24, 144, 255, 0.05)',
            // boxShadow: '0 0 0 1px rgba(24, 144, 255, 0.2)',
          }
        : {
            border: '2px solid transparent',
          };

      const hrContent = (
        <div
          style={{
            // margin: '12px 0',
            padding: '8px 0', // 扩大可选范围
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            ...selectedStyles,
          }}
          onClick={(e) => {
            // 立即阻止事件冒泡，防止触发父级选中
            e.stopPropagation();
            e.preventDefault();

            console.log('📏 分割线组件被点击:', {
              componentId: comp.id,
              componentTag: comp.tag,
              path,
            });

            // 处理组件选中
            if (onSelect) {
              console.log('📏 调用 onSelect 回调:', {
                component,
                path,
              });
              onSelect(component, path);
            }

            if (onCanvasFocus) {
              console.log('📏 调用 onCanvasFocus 回调');
              onCanvasFocus();
            }
          }}
          data-component-wrapper="true"
          data-component-id={comp.id}
        >
          <Divider
            style={{
              margin: '0',
              borderColor: isCurrentSelected ? '#1890ff' : '#d9d9d9',
              borderWidth: isCurrentSelected ? '2px' : '2px',
              transition: 'all 0.2s ease',
            }}
          />
        </div>
      );

      return enableDrag && !isPreview ? (
        <DraggableWrapper
          component={component}
          path={path}
          index={index}
          containerPath={containerPath}
          onComponentMove={onComponentMove}
          enableSort={enableSort}
          onSelect={onSelect}
          selectedPath={selectedPath}
          onCanvasFocus={onCanvasFocus}
        >
          {hrContent}
        </DraggableWrapper>
      ) : (
        hrContent
      );
    }

    case 'img': {
      // 检查当前组件是否被选中
      const isCurrentSelected = isSamePath(selectedPath, path);

      const imgContent = (
        <div
          style={{
            textAlign: 'center',
            // padding: '12px',
            backgroundColor: '#fff',
            border:
              isCurrentSelected && !isPreview
                ? '2px solid #1890ff'
                : '2px solid #f0f0f0',
            borderRadius: '4px',
            boxShadow:
              isCurrentSelected && !isPreview
                ? '0 0 8px rgba(24, 144, 255, 0.3)'
                : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <img
            src={comp.img_url || '/demo.png'}
            alt="图片"
            style={{
              maxWidth: '100%',
              height: 'auto',
              width: comp.width ? `${comp.width}px` : 'auto',
              maxHeight: comp.height ? `${comp.height}px` : '200px',
              objectFit: 'cover',
              borderRadius: '4px',
              border: 'none', // 移除图片本身的边框，避免双边框
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/demo.png';
            }}
          />
        </div>
      );

      return enableDrag && !isPreview ? (
        <DraggableWrapper
          component={component}
          path={path}
          index={index}
          containerPath={containerPath}
          onComponentMove={onComponentMove}
          enableSort={enableSort}
          onSelect={onSelect}
          selectedPath={selectedPath}
          onCanvasFocus={onCanvasFocus}
        >
          {imgContent}
        </DraggableWrapper>
      ) : (
        imgContent
      );
    }

    case 'input': {
      // 检查当前组件是否被选中
      const isCurrentSelected = isSamePath(selectedPath, path);

      const inputContent = (
        <div
          style={{
            marginBottom: '12px',
            border:
              isCurrentSelected && !isPreview
                ? '2px solid #1890ff'
                : '2px solid transparent',
            borderRadius: '6px',
            padding: '8px',
            backgroundColor:
              isCurrentSelected && !isPreview
                ? 'rgba(24, 144, 255, 0.05)'
                : 'transparent',
            boxShadow:
              isCurrentSelected && !isPreview
                ? '0 0 8px rgba(24, 144, 255, 0.3)'
                : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <label
            style={{
              display: 'block',
              marginBottom: '6px',
              fontWeight: 500,
              color: '#333',
              fontSize: '14px',
            }}
          >
            {comp.name || 'Input'}{' '}
            {comp.required ? <span style={{ color: '#ff4d4f' }}>*</span> : ''}
          </label>
          <Input
            placeholder={comp.placeholder?.content || '请输入'}
            defaultValue={comp.default_value?.content || ''}
            type={comp.inputType || 'text'}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d9d9d9',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: 'white',
            }}
            disabled={isPreview}
          />
        </div>
      );

      return enableDrag && !isPreview ? (
        <DraggableWrapper
          component={component}
          path={path}
          index={index}
          containerPath={containerPath}
          onComponentMove={onComponentMove}
          enableSort={enableSort}
          onSelect={onSelect}
          selectedPath={selectedPath}
          onCanvasFocus={onCanvasFocus}
        >
          {inputContent}
        </DraggableWrapper>
      ) : (
        inputContent
      );
    }

    case 'button': {
      // 检查当前组件是否被选中
      const isCurrentSelected = isSamePath(selectedPath, path);

      const buttonContent = (
        <div
          style={{
            marginBottom: '12px',
            border:
              isCurrentSelected && !isPreview
                ? '2px solid #1890ff'
                : '2px solid transparent',
            borderRadius: '6px',
            padding: '8px',
            backgroundColor:
              isCurrentSelected && !isPreview
                ? 'rgba(24, 144, 255, 0.05)'
                : 'transparent',
            boxShadow:
              isCurrentSelected && !isPreview
                ? '0 0 8px rgba(24, 144, 255, 0.3)'
                : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <Button
            type={comp.type || 'primary'}
            size={comp.size || 'middle'}
            danger={comp.danger || false}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 500,
            }}
            disabled={isPreview}
          >
            {comp.text?.content || '按钮'}
            {comp.form_action_type && ` (${comp.form_action_type})`}
          </Button>
        </div>
      );

      return enableDrag && !isPreview ? (
        <DraggableWrapper
          component={component}
          path={path}
          index={index}
          containerPath={containerPath}
          onComponentMove={onComponentMove}
          enableSort={enableSort}
          onSelect={onSelect}
          selectedPath={selectedPath}
          onCanvasFocus={onCanvasFocus}
        >
          {buttonContent}
        </DraggableWrapper>
      ) : (
        buttonContent
      );
    }

    case 'select_static': {
      // 检查当前组件是否被选中
      const isCurrentSelected = isSamePath(selectedPath, path);

      const selectContent = (
        <div
          style={{
            marginBottom: '12px',
            border:
              isCurrentSelected && !isPreview
                ? '2px solid #1890ff'
                : '2px solid transparent',
            borderRadius: '6px',
            padding: '8px',
            backgroundColor:
              isCurrentSelected && !isPreview
                ? 'rgba(24, 144, 255, 0.05)'
                : 'transparent',
            boxShadow:
              isCurrentSelected && !isPreview
                ? '0 0 8px rgba(24, 144, 255, 0.3)'
                : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <label
            style={{
              display: 'block',
              marginBottom: '6px',
              fontWeight: 500,
              color: '#333',
              fontSize: '14px',
            }}
          >
            {comp.name || 'Select'}{' '}
            {comp.required ? <span style={{ color: '#ff4d4f' }}>*</span> : ''}
          </label>
          <Select
            placeholder="请选择"
            style={{
              width: '100%',
              fontSize: '14px',
            }}
            disabled={isPreview}
          >
            {(comp.options || []).map((option: any, optionIndex: number) => (
              <Option
                key={option.value || optionIndex}
                value={option.value || ''}
              >
                {option.text?.content || `选项${optionIndex + 1}`}
              </Option>
            ))}
          </Select>
        </div>
      );

      return enableDrag && !isPreview ? (
        <DraggableWrapper
          component={component}
          path={path}
          index={index}
          containerPath={containerPath}
          onComponentMove={onComponentMove}
          enableSort={enableSort}
          onSelect={onSelect}
          selectedPath={selectedPath}
          onCanvasFocus={onCanvasFocus}
        >
          {selectContent}
        </DraggableWrapper>
      ) : (
        selectContent
      );
    }

    case 'multi_select_static': {
      // 检查当前组件是否被选中
      const isCurrentSelected = isSamePath(selectedPath, path);

      const multiSelectContent = (
        <div
          style={{
            marginBottom: '12px',
            border:
              isCurrentSelected && !isPreview
                ? '2px solid #1890ff'
                : '2px solid transparent',
            borderRadius: '6px',
            padding: '8px',
            backgroundColor:
              isCurrentSelected && !isPreview
                ? 'rgba(24, 144, 255, 0.05)'
                : 'transparent',
            boxShadow:
              isCurrentSelected && !isPreview
                ? '0 0 8px rgba(24, 144, 255, 0.3)'
                : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <label
            style={{
              display: 'block',
              marginBottom: '6px',
              fontWeight: 500,
              color: '#333',
              fontSize: '14px',
            }}
          >
            {comp.name || 'MultiSelect'} (多选){' '}
            {comp.required ? <span style={{ color: '#ff4d4f' }}>*</span> : ''}
          </label>
          <Select
            mode="multiple"
            placeholder="请选择"
            style={{
              width: '100%',
              fontSize: '14px',
            }}
            disabled={isPreview}
          >
            {(comp.options || []).map((option: any, optionIndex: number) => (
              <Option
                key={option.value || optionIndex}
                value={option.value || ''}
              >
                {option.text?.content || `选项${optionIndex + 1}`}
              </Option>
            ))}
          </Select>
          <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
            按住 Ctrl/Cmd 键可多选
          </div>
        </div>
      );

      return enableDrag && !isPreview ? (
        <DraggableWrapper
          component={component}
          path={path}
          index={index}
          containerPath={containerPath}
          onComponentMove={onComponentMove}
          enableSort={enableSort}
          onSelect={onSelect}
          selectedPath={selectedPath}
          onCanvasFocus={onCanvasFocus}
        >
          {multiSelectContent}
        </DraggableWrapper>
      ) : (
        multiSelectContent
      );
    }

    case 'img_combination': {
      // 检查当前组件是否被选中
      const isCurrentSelected = isSamePath(selectedPath, path);

      const imgCombContent = (
        <div
          style={{
            // padding: '12px',
            backgroundColor: '#fff',
            border:
              isCurrentSelected && !isPreview
                ? '2px solid #1890ff'
                : '2px solid #f0f0f0',
            borderRadius: '4px',
            boxShadow:
              isCurrentSelected && !isPreview
                ? '0 0 8px rgba(24, 144, 255, 0.3)'
                : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <div
            style={{
              marginBottom: '12px',
              fontWeight: 'bold',
              color: '#495057',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            🖼️ 多图混排 ({comp.combination_mode})
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${
                comp.combination_mode === 'trisect'
                  ? 3
                  : comp.combination_mode === 'bisect'
                  ? 2
                  : 2
              }, 1fr)`,
              gap: '8px',
            }}
          >
            {(comp.img_list || []).length > 0 ? (
              (comp.img_list || []).map((img: any, imgIndex: number) => (
                <img
                  key={`img-${component.id}-${imgIndex}`}
                  src={img.img_url || '/demo.png'}
                  alt={`图片${imgIndex + 1}`}
                  style={{
                    width: '100%',
                    height: '100px',
                    objectFit: 'cover',
                    borderRadius: '4px',
                    border: '1px solid #f0f0f0',
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/demo.png';
                  }}
                />
              ))
            ) : (
              <div
                style={{
                  gridColumn: `span ${
                    comp.combination_mode === 'trisect'
                      ? 3
                      : comp.combination_mode === 'bisect'
                      ? 2
                      : 2
                  }`,
                  textAlign: 'center',
                  color: '#999',
                  padding: '20px',
                  border: '1px dashed #d9d9d9',
                  borderRadius: '4px',
                }}
              >
                📷 图片组合
              </div>
            )}
          </div>
        </div>
      );

      return enableDrag && !isPreview ? (
        <DraggableWrapper
          component={component}
          path={path}
          index={index}
          containerPath={containerPath}
          onComponentMove={onComponentMove}
          enableSort={enableSort}
          onSelect={onSelect}
          selectedPath={selectedPath}
          onCanvasFocus={onCanvasFocus}
        >
          {imgCombContent}
        </DraggableWrapper>
      ) : (
        imgCombContent
      );
    }

    case 'title': {
      // 从CardHeader中读取标题信息
      const headerTitle = headerData?.title?.content || '主标题';
      const headerSubtitle = headerData?.subtitle?.content || '副标题';
      const themeStyle = headerData?.style || 'blue'; // 直接读取字符串

      // 根据主题样式设置不同的样式
      const getThemeStyles = (theme: string) => {
        switch (theme) {
          case 'blue':
            return {
              backgroundColor: '#e6f7ff',
              borderColor: '#91d5ff',
              titleColor: '#1890ff',
              subtitleColor: '#096dd9',
            };
          case 'wathet':
            return {
              backgroundColor: '#f0f9ff',
              borderColor: '#bae6fd',
              titleColor: '#0369a1',
              subtitleColor: '#0c4a6e',
            };
          case 'turquoise':
            return {
              backgroundColor: '#f0fdfa',
              borderColor: '#99f6e4',
              titleColor: '#0d9488',
              subtitleColor: '#0f766e',
            };
          case 'green':
            return {
              backgroundColor: '#f6ffed',
              borderColor: '#b7eb8f',
              titleColor: '#52c41a',
              subtitleColor: '#389e0d',
            };
          case 'yellow':
            return {
              backgroundColor: '#fffbe6',
              borderColor: '#ffe58f',
              titleColor: '#faad14',
              subtitleColor: '#d48806',
            };
          case 'orange':
            return {
              backgroundColor: '#fff7e6',
              borderColor: '#ffd591',
              titleColor: '#fa8c16',
              subtitleColor: '#d46b08',
            };
          case 'red':
            return {
              backgroundColor: '#fff2f0',
              borderColor: '#ffccc7',
              titleColor: '#ff4d4f',
              subtitleColor: '#cf1322',
            };
          default:
            return {
              backgroundColor: '#fff',
              borderColor: '#f0f0f0',
              titleColor: '#333',
              subtitleColor: '#666',
            };
        }
      };

      const themeStyles = getThemeStyles(themeStyle);

      const titleContent = (
        <div
          style={{
            padding: '16px',
            backgroundColor: themeStyles.backgroundColor,
            border: `1px solid ${themeStyles.borderColor}`,
            borderRadius: '4px',
            // textAlign: 'center',
          }}
        >
          <h1
            style={{
              margin: '0 0 8px 0',
              fontSize: '24px',
              color: themeStyles.titleColor,
            }}
          >
            {headerTitle}
          </h1>
          <h2
            style={{
              margin: '0',
              fontSize: '16px',
              color: themeStyles.subtitleColor,
            }}
          >
            {headerSubtitle}
          </h2>
        </div>
      );

      return enableDrag && !isPreview ? (
        <DraggableWrapper
          component={component}
          path={path}
          index={index}
          containerPath={containerPath}
          onComponentMove={onComponentMove}
          enableSort={enableSort}
          onSelect={onSelect}
          selectedPath={selectedPath}
          onCanvasFocus={onCanvasFocus}
        >
          {titleContent}
        </DraggableWrapper>
      ) : (
        titleContent
      );
    }

    default: {
      const unknownContent = (
        <div
          style={{
            padding: '16px',
            border: '1px dashed #ccc',
            borderRadius: '4px',
            textAlign: 'center',
            color: '#999',
            backgroundColor: '#fafafa',
          }}
        >
          ❓ 未知组件类型: {(component as any).tag}
        </div>
      );

      return enableDrag && !isPreview ? (
        <DraggableWrapper
          component={component}
          path={path}
          index={index}
          containerPath={containerPath}
          onComponentMove={onComponentMove}
          enableSort={enableSort}
          onSelect={onSelect}
          selectedPath={selectedPath}
          onCanvasFocus={onCanvasFocus}
        >
          {unknownContent}
        </DraggableWrapper>
      ) : (
        unknownContent
      );
    }
  }
};

export default ComponentRendererCore;
