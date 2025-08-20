// 修复后的 ComponentRendererCore.tsx - 完整解决表单嵌套显示问题

import { CopyOutlined, DeleteOutlined, MoreOutlined } from '@ant-design/icons';
import { Button, Divider, Dropdown, Input, Select } from 'antd';
import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import {
  ComponentType,
  DragItem,
  VariableItem,
} from './card-designer-types-updated';
import { replaceVariables } from './card-designer-utils';
import RichTextStyles from './RichTextEditor/RichTextStyles';
import { convertJSONToHTML } from './RichTextEditor/RichTextUtils';
import {
  textComponentStateManager,
  variableCacheManager,
} from './Variable/utils/index';

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
  onUpdateComponent?: (
    componentPath: (string | number)[],
    updatedComponent: ComponentType,
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
  onClearSelection?: () => void; // 新增：清除选中状态的回调
  // 新增：标题数据，用于title组件渲染
  headerData?: {
    title?: { content: string };
    subtitle?: { content: string };
    style?: string; // 改为字符串类型
  };
  // 新增：变量数据，用于变量替换
  variables?: VariableItem[];
  // 新增：垂直间距
  verticalSpacing?: number;
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
  // console.log('🔍 canDropInContainer 检查:', {
  //   draggedType,
  //   targetPath,
  //   targetPathLength: targetPath.length,
  // });

  // 特殊规则：分栏容器可以拖拽到表单容器内，但不能拖拽到表单容器下的分栏容器的列中
  if (draggedType === 'column_set') {
    // 检查目标路径是否指向表单容器的 elements
    // 路径格式：['dsl', 'body', 'elements', formIndex, 'elements']
    const isTargetingFormElements =
      targetPath.length >= 5 &&
      targetPath[0] === 'dsl' &&
      targetPath[1] === 'body' &&
      targetPath[2] === 'elements' &&
      targetPath[4] === 'elements';

    // 检查是否要拖拽到表单容器下的分栏容器的列中
    // 路径格式：['dsl', 'body', 'elements', formIndex, 'elements', columnSetIndex, 'columns', columnIndex, 'elements']
    const isTargetingFormColumnElements =
      targetPath.length >= 9 &&
      targetPath[0] === 'dsl' &&
      targetPath[1] === 'body' &&
      targetPath[2] === 'elements' &&
      targetPath[4] === 'elements' &&
      targetPath[6] === 'columns' &&
      targetPath[8] === 'elements';

    // console.log('🔍 分栏容器拖拽检查:', {
    //   draggedType,
    //   targetPath,
    //   isTargetingFormElements,
    //   isTargetingFormColumnElements,
    //   canDrop: isTargetingFormElements && !isTargetingFormColumnElements,
    // });

    // 只允许拖拽到表单容器的 elements，不允许拖拽到表单容器下的分栏容器的列中
    return isTargetingFormElements && !isTargetingFormColumnElements;
  }

  // 特殊规则：表单容器下的分栏容器不允许拖拽离开表单
  if (draggedType === 'column_set') {
    // 检查是否是从表单容器内拖拽分栏容器到根级别
    // 如果目标路径是根级别（路径长度为4），且分栏容器原本在表单内，则不允许拖拽
    const isTargetingRootLevel =
      targetPath.length === 4 &&
      targetPath[0] === 'dsl' &&
      targetPath[1] === 'body' &&
      targetPath[2] === 'elements';

    if (isTargetingRootLevel) {
      console.log('❌ 表单容器下的分栏容器不允许拖拽离开表单');
      return false;
    }
  }

  // 其他容器组件不能嵌套到其他容器中
  if (isContainerComponent(draggedType)) {
    // 检查是否要放到容器内部（非根节点）
    const hasContainerSegment = targetPath.some(
      (segment) => segment === 'elements' || segment === 'columns',
    );

    // console.log('🔍 容器组件嵌套检查:', {
    //   draggedType,
    //   hasContainerSegment,
    //   canDrop: !hasContainerSegment,
    // });

    return !hasContainerSegment;
  }

  // 非容器组件可以放置在任何地方
  // 特殊处理：检查是否是拖拽到分栏列
  const isTargetingColumn =
    targetPath.length >= 7 &&
    targetPath.includes('columns') &&
    targetPath.includes('elements');

  // 特殊处理：检查是否是拖拽到表单容器
  const isTargetingForm =
    targetPath.length >= 5 &&
    targetPath.includes('elements') &&
    !targetPath.includes('columns');

  if (isTargetingColumn) {
    // console.log('✅ 普通组件可以拖拽到分栏列:', {
    //   draggedType,
    //   targetPath,
    //   canDrop: true,
    // });
    return true;
  }

  if (isTargetingForm) {
    // console.log('✅ 普通组件可以拖拽到表单容器:', {
    //   draggedType,
    //   targetPath,
    //   canDrop: true,
    // });
    return true;
  }

  // console.log('✅ 非容器组件可以放置:', {
  //   draggedType,
  //   canDrop: true,
  // });
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
  const [indicatorPosition, setIndicatorPosition] = React.useState<
    'top' | 'bottom' | null
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
      // console.log('🟢 ContainerSortableItem 开始拖拽:', {
      //   tag: component.tag,
      //   path,
      //   componentId: component.id,
      //   index,
      // });
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
      // console.log('🎯 ContainerSortableItem canDrag 检查:', {
      //   componentTag: component.tag,
      //   canDrag,
      // });
      return canDrag;
    },
  });

  // 拖拽目标配置（用于排序）
  const [{ isOver }, drop] = useDrop({
    accept: [
      'component',
      'existing-component',
      'container-component',
      'canvas-component',
    ], // 添加canvas-component类型
    canDrop: (item: DragItem) => {
      if (!enableSort) return false;

      // console.log('🔍 ContainerSortableItem canDrop 检查:', {
      //   itemType: item.type,
      //   isNew: item.isNew,
      //   hasComponent: !!item.component,
      //   componentTag: item.component?.tag,
      //   isChildComponent: item.isChildComponent,
      //   currentPath: path,
      //   containerPath,
      //   currentComponentTag: component.tag,
      //   currentComponentId: component.id,
      // });

      // 不能拖拽到自己身上
      if (!item.isNew && item.path && isSamePath(item.path, path)) {
        // console.log('❌ 不能拖拽到自己身上');
        return false;
      }

      // 不能拖拽到自己的子元素上
      if (!item.isNew && item.path && isParentChild(item.path, path)) {
        // console.log('❌ 不能拖拽到自己的子元素上');
        return false;
      }

      // 检查是否是根节点组件拖拽到容器
      // if (!item.isNew && item.component && item.path) {
      //   const isRootComponent =
      //     item.path.length === 4 &&
      //     item.path[0] === 'dsl' &&
      //     item.path[1] === 'body' &&
      //     item.path[2] === 'elements';

      //   if (isRootComponent) {
      //     console.log('🔍 根节点组件拖拽到容器检查:', {
      //       componentTag: item.component.tag,
      //       containerPath,
      //     });
      //   }
      // }

      // 检查容器嵌套限制
      if (item.isNew) {
        // 左侧新组件的拖拽检查
        const canDrop = canDropInContainer(item.type, containerPath);
        return canDrop;
      } else if (item.component) {
        const canDrop = canDropInContainer(item.component.tag, containerPath);
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
          setIndicatorPosition('top');
        } else {
          // 鼠标在下半部分 - 插入到当前元素之后
          currentInsertPosition = 'after';
          targetIndex = hoverIndex + 1;
          setIndicatorPosition('bottom');
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
        // const draggedComponent = item.component;
        // const hoverComponent = component;

        // console.log('🎯 容器内插入式拖拽检测:', {
        //   dragIndex,
        //   hoverIndex,
        //   hoverClientY,
        //   hoverMiddleY,
        //   insertPosition: currentInsertPosition,
        //   targetIndex,
        //   draggedComponent: draggedComponent?.tag,
        //   hoverComponent: hoverComponent.tag,
        //   willProceed: 'checking...',
        // });

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
      if (monitor.didDrop() || !enableSort) {
        console.log('🚫 ContainerSortableItem drop 跳过:', {
          didDrop: monitor.didDrop(),
          enableSort,
          componentTag: component.tag,
          componentId: component.id,
        });
        return;
      }

      // console.log('✅ ContainerSortableItem drop 开始处理:', {
      //   componentTag: component.tag,
      //   componentId: component.id,
      //   itemType: item.type,
      //   isNew: item.isNew,
      //   hasComponent: !!item.component,
      //   enableSort,
      // });

      // 清除防抖定时器
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }

      // 清除指示线位置
      setIndicatorPosition(null);

      // 处理同容器内排序
      if (!item.isNew && item.path && item.component && onComponentMove) {
        const draggedPath = item.path;
        const draggedContainerPath = draggedPath.slice(0, -1);
        const targetContainerPath = containerPath;

        // console.log('🔍 容器内排序检查:', {
        //   draggedPath,
        //   draggedContainerPath,
        //   targetContainerPath,
        //   isSameContainer: isSamePath(
        //     draggedContainerPath,
        //     targetContainerPath,
        //   ),
        //   insertTargetIndex: insertTargetIndex.current,
        // });

        // 检查是否在同一容器内
        if (isSamePath(draggedContainerPath, targetContainerPath)) {
          // console.log('✅ 执行容器内插入式排序 (drop):', {
          //   from: item.path[item.path.length - 1],
          //   insertAt: insertTargetIndex.current,
          //   draggedComponent: item.component.tag,
          //   hoverComponent: component.tag,
          // });

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

          // 检查是否是根节点组件移动到容器
          const isRootComponent =
            draggedPath.length === 4 &&
            draggedPath[0] === 'dsl' &&
            draggedPath[1] === 'body' &&
            draggedPath[2] === 'elements';

          if (isRootComponent) {
            // console.log('🔄 ContainerSortableItem: 根节点组件移动到容器:', {
            //   component: item.component.tag,
            //   from: draggedPath,
            //   to: targetContainerPath,
            //   insertIndex,
            // });

            // 对于根节点组件移动到容器，需要特殊处理路径
            // targetContainerPath 已经是容器的路径，我们需要添加 'elements' 来指向容器的子元素数组
            // 但是要检查路径是否已经包含 'elements'
            let correctTargetPath;
            if (
              targetContainerPath[targetContainerPath.length - 1] === 'elements'
            ) {
              correctTargetPath = targetContainerPath;
            } else {
              correctTargetPath = [...targetContainerPath, 'elements'];
            }

            // console.log(
            //   '🎯 ContainerSortableItem 调用 onComponentMove 处理根节点移动:',
            //   {
            //     component: item.component.tag,
            //     fromPath: draggedPath,
            //     toPath: correctTargetPath,
            //     insertIndex,
            //     targetContainerPath,
            //     pathAnalysis: {
            //       hasElements:
            //         targetContainerPath[targetContainerPath.length - 1] ===
            //         'elements',
            //       finalPath: correctTargetPath,
            //     },
            //   },
            // );
            onComponentMove(
              item.component,
              draggedPath,
              correctTargetPath,
              insertIndex,
            );
            return;
          }

          // console.log('🔄 执行跨容器移动:', {
          //   draggedComponent: {
          //     id: item.component.id,
          //     tag: item.component.tag,
          //   },
          //   draggedPath,
          //   targetPath: path,
          //   insertIndex,
          //   draggedContainerPath,
          //   targetContainerPath,
          // });

          // 执行跨容器移动 - 传递正确的目标路径
          const targetPath = [...targetContainerPath, insertIndex];
          // console.log('🎯 调用 onComponentMove 进行跨容器移动:', {
          //   component: item.component.tag,
          //   fromPath: draggedPath,
          //   toPath: targetPath,
          //   insertIndex,
          // });
          onComponentMove(item.component, draggedPath, targetPath, insertIndex);
        }
      }
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
    // 对于按钮组件，不阻止事件，让它能够正确处理选中
    const isButtonComponent = component.tag === 'button';

    if (isButtonComponent) {
      // 按钮组件不阻止事件，让它能够正确处理选中
      return;
    }

    // 对于其他组件，阻止事件冒泡到容器，避免触发容器选中
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
        // marginBottom: '8px',
        // 🎯 新增：拖拽悬停时显示蓝色线条指示线
        boxShadow:
          isOver && enableSort ? '0 0 8px rgba(24, 144, 255, 0.4)' : 'none',
      }}
      onClick={handleContainerSortableClick}
      data-container-sortable-item="true"
    >
      {/* 🎯 新增：拖拽悬停时的蓝色线条指示线 */}
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
      {/* 移除插入位置指示线 */}

      {/* 移除拖拽悬停样式 */}

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
  onClearSelection?: () => void; // 新增：清除选中状态的回调
}> = ({
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
      // console.log('🎯 DraggableWrapper canDrag 检查:', {
      //   componentTag: component.tag,
      //   canDrag,
      //   isChildComponent,
      // });
      return canDrag;
    },
  });

  // 拖拽目标配置（用于排序）
  const [{ isOver }, drop] = useDrop({
    accept: ['component', 'existing-component', 'canvas-component'], // 添加canvas-component类型
    canDrop: (item: DragItem) => {
      if (!enableSort) return false;

      // console.log('🔍 DraggableWrapper canDrop 检查:', {
      //   itemType: item.type,
      //   isNew: item.isNew,
      //   hasComponent: !!item.component,
      //   componentTag: item.component?.tag,
      //   isChildComponent: item.isChildComponent,
      //   currentComponentTag: component.tag,
      //   currentPath: path,
      //   containerPath,
      // });

      // 不能拖拽到自己身上
      if (!item.isNew && item.path && isSamePath(item.path, path)) {
        return false;
      }

      // 不能拖拽到自己的子元素上
      if (!item.isNew && item.path && isParentChild(item.path, path)) {
        return false;
      }

      // 🚫 新增：不允许拖拽到任何普通组件上
      const isContainerComponent =
        component.tag === 'form' || component.tag === 'column_set';

      if (!isContainerComponent) {
        console.log('🚫 不允许拖拽到普通组件上:', {
          currentComponentTag: component.tag,
          containerPath,
        });
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
      // const draggedContainerPath = item.path ? item.path.slice(0, -1) : [];
      // const currentContainerPath = containerPath;

      // const isSameContainer = isSamePath(
      //   draggedContainerPath,
      //   currentContainerPath,
      // );

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
            // console.log(
            //   '🚫 ContainerSortableItem hover: 阻止根节点到容器的排序:',
            //   {
            //     draggedComponent: item.component.tag,
            //     draggedPath,
            //     targetPath: path,
            //     reason: '这应该由drop处理器处理跨容器移动',
            //   },
            // );
            return; // 阻止在hover时处理，留给drop处理器
          }

          // console.log('🔄 执行同容器排序:', {
          //   draggedComponent: {
          //     id: item.component.id,
          //     tag: item.component.tag,
          //   },
          //   draggedPath,
          //   targetPath: path,
          //   targetIndex,
          //   isChildComponent,
          // });

          // ✅ 修复：hover事件不执行实际移动，只用于视觉反馈
          // 实际的移动操作将在drop事件中处理
          // console.log('💡 hover检测到排序需求，等待drop事件执行实际移动:', {
          //   component: item.component.tag,
          //   fromPath: draggedPath,
          //   targetPath: path,
          //   targetIndex,
          // });
        } else {
          // console.warn('⚠️ 跳过无效的排序操作:', {
          //   draggedPath,
          //   targetPath: path,
          //   reason: '路径格式不正确或缺少必要数据',
          // });
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

        // console.log('🎯 drop事件处理组件移动:', {
        //   draggedComponent: item.component.tag,
        //   draggedPath,
        //   targetContainerPath,
        //   isSameContainer,
        //   isChildComponent,
        // });

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
            // console.log('🔄 执行跨容器移动:', {
            //   draggedComponent: {
            //     id: item.component.id,
            //     tag: item.component.tag,
            //   },
            //   draggedPath,
            //   targetPath: path,
            //   insertIndex,
            //   draggedContainerPath,
            //   targetContainerPath,
            // });

            // 执行跨容器移动 - 使用正确的目标容器路径
            const targetPath = [...targetContainerPath, insertIndex];
            // console.log('🔄 计算目标路径:', {
            //   targetContainerPath,
            //   insertIndex,
            //   computedTargetPath: targetPath,
            // });
            onComponentMove(
              item.component,
              draggedPath,
              targetPath,
              insertIndex,
            );
          } else {
            console.warn('⚠️ 跳过无效的跨容器移动:', {
              draggedPath,
              targetPath: path,
              reason: '路径格式不正确',
            });
          }
        } else {
          // 同容器内排序
          // console.log('🔄 同容器内排序 (drop事件):', {
          //   draggedComponent: item.component.tag,
          //   draggedPath,
          //   targetPath: path,
          //   index,
          // });

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
            // console.log('✅ 执行同容器排序:', {
            //   draggedComponent: {
            //     id: item.component.id,
            //     tag: item.component.tag,
            //   },
            //   draggedPath,
            //   targetPath: path,
            //   targetIndex,
            //   isChildComponent,
            // });

            // 执行排序
            onComponentMove(item.component, draggedPath, path, targetIndex);
          } else {
            console.warn('⚠️ 跳过无效的排序操作:', {
              draggedPath,
              targetPath: path,
              reason: '路径格式不正确或缺少必要数据',
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

    // 对于按钮组件，允许点击选中，即使有子组件的 data-component-wrapper 属性
    const isButtonComponent = component.tag === 'button';

    // 如果点击的是子组件（有 data-component-wrapper 属性），且不是按钮组件，不处理包装器的选中
    if (
      !isButtonComponent &&
      target.closest('[data-component-wrapper]') &&
      target !== currentTarget
    ) {
      console.log('🎯 DraggableWrapper 检测到子组件点击，跳过包装器选中');
      return;
    }

    // 阻止事件冒泡，防止触发父级选中
    e.stopPropagation();
    e.preventDefault();

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
    // padding: '2px',
    padding: '0',
    margin: '1px 0',
    backgroundColor: isCurrentSelected
      ? 'rgba(24, 144, 255, 0.02)'
      : 'transparent',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    opacity,
    boxShadow: isCurrentSelected ? '0 0 4px rgba(24, 144, 255, 0.2)' : 'none',
  };

  // ✅ 修复：当作为分栏列或表单容器的子组件时，禁用 hover 效果
  const isInColumnContainer = containerPath.some(
    (segment) => segment === 'columns',
  );
  const isInFormContainer =
    containerPath.some((segment) => segment === 'elements') &&
    containerPath.length > 4; // 确保是在表单的 elements 数组中
  if (isInColumnContainer || isInFormContainer) {
    // 在分栏列或表单容器中，子组件不显示 hover 边框效果
    wrapperStyle.border = 'none';
    wrapperStyle.boxShadow = 'none';
  }

  // ✅ 修复：普通组件在任何情况下都不显示 hover 边框（待激活态）
  const isContainerComponent =
    component.tag === 'form' || component.tag === 'column_set';
  if (!isContainerComponent) {
    // 普通组件不显示 hover 边框效果
    wrapperStyle.border = 'none';
    wrapperStyle.boxShadow = 'none';
  }

  // 🎯 新增：拖拽悬停时显示蓝色线条指示线
  if (isOver && enableSort) {
    // 移除边框和背景，只保留阴影效果
    wrapperStyle.boxShadow = '0 0 8px rgba(24, 144, 255, 0.4)';
  }

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
      {/* 🎯 新增：拖拽悬停时的蓝色线条指示线 */}
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
      {children}
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
  onColumnSelect?: () => void; // 新增：分栏列选中回调
  flexValue?: number; // 新增：flex值
}> = ({
  targetPath,
  containerType,
  columnIndex,
  children,
  onContainerDrop,
  onComponentMove,
  childElements = [],
  onColumnSelect,
  flexValue,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [insertPosition, setInsertPosition] = React.useState<
    'before' | 'after' | 'inside' | null
  >(null);
  const [indicatorPosition, setIndicatorPosition] = React.useState<
    'top' | 'bottom' | null
  >(null);
  const [insertIndex, setInsertIndex] = React.useState<number>(0);

  const [{ isOver, canDrop, draggedItem }, drop] = useDrop({
    accept: ['component', 'existing-component', 'canvas-component'],
    canDrop: (item: DragItem) => {
      // console.log('🔍 SmartDropZone canDrop 检查:', {
      //   itemType: item.type,
      //   isNew: item.isNew,
      //   hasComponent: !!item.component,
      //   componentTag: item.component?.tag,
      //   isChildComponent: item.isChildComponent,
      //   targetPath,
      //   childElementsCount: childElements.length,
      //   containerType,
      // });

      // 特殊处理标题组件 - 标题组件不能拖拽到容器中
      if (
        item.type === 'title' ||
        (item.component && item.component.tag === 'title')
      ) {
        // console.log('❌ 标题组件不能拖拽到容器中');
        return false;
      }

      // 子组件拖拽时的特殊处理
      if (item.isChildComponent) {
        // 子组件可以拖拽到其他容器中，但不能拖拽到自己的父容器
        if (item.path && isParentChild(item.path, targetPath)) {
          // console.log('❌ 子组件不能拖拽到自己的父容器');
          return false;
        }
        const canDrop = canDropInContainer(
          item.component?.tag || item.type,
          targetPath,
        );
        // console.log('✅ 子组件拖拽检查结果:', canDrop);
        return canDrop;
      }

      // 检查是否可以在此容器中放置
      if (item.isNew) {
        const canDrop = canDropInContainer(item.type, targetPath);
        // console.log('✅ 新组件拖拽检查结果:', canDrop);
        return canDrop;
      } else if (item.component && item.path) {
        // 不能拖拽到自己的父容器中
        if (isParentChild(item.path, targetPath)) {
          // console.log('❌ 不能拖拽到自己的父容器中');
          return false;
        }

        // 检查是否是根节点组件拖拽到容器
        const isRootComponent =
          item.path.length === 4 &&
          item.path[0] === 'dsl' &&
          item.path[1] === 'body' &&
          item.path[2] === 'elements';

        // 检查是否是从表单容器内拖拽分栏容器到根级别
        const isFormColumnSetDraggedToRoot =
          item.component?.tag === 'column_set' &&
          item.path.length >= 6 &&
          item.path[0] === 'dsl' &&
          item.path[1] === 'body' &&
          item.path[2] === 'elements' &&
          item.path[4] === 'elements' &&
          targetPath.length === 4 &&
          targetPath[0] === 'dsl' &&
          targetPath[1] === 'body' &&
          targetPath[2] === 'elements';

        if (isFormColumnSetDraggedToRoot) {
          // console.log('❌ 表单容器下的分栏容器不允许拖拽离开表单');
          return false;
        }

        // if (isRootComponent) {
        //   console.log('🔍 根节点组件拖拽到容器检查:', {
        //     componentTag: item.component.tag,
        //     targetPath,
        //     containerType,
        //   });
        // }

        // ✅ 修复：限制容器热区的拖拽接受条件
        // 只有当组件是从根级别拖拽到容器时，才允许容器热区接受
        // 但是对于分栏列和表单容器，我们允许从任何位置拖拽普通组件
        if (
          !isRootComponent &&
          (containerType === 'column' || containerType === 'form')
        ) {
          // 分栏列和表单容器允许接受任何非容器组件的拖拽
          if (isContainerComponent(item.component?.tag || item.type)) {
            // console.log(
            //   `❌ 容器组件不能拖拽到${
            //     containerType === 'column' ? '分栏列' : '表单容器'
            //   }中`,
            // );
            return false;
          }

          // 特殊检查：分栏容器不能拖拽到表单容器下的分栏容器的列中
          if (
            item.component?.tag === 'column_set' &&
            containerType === 'column'
          ) {
            // 检查目标路径是否指向表单容器下的分栏容器的列
            const isTargetingFormColumnElements =
              targetPath.length >= 9 &&
              targetPath[0] === 'dsl' &&
              targetPath[1] === 'body' &&
              targetPath[2] === 'elements' &&
              targetPath[4] === 'elements' &&
              targetPath[6] === 'columns' &&
              targetPath[8] === 'elements';

            if (isTargetingFormColumnElements) {
              console.log('❌ 分栏容器不能拖拽到表单容器下的分栏容器的列中');
              return false;
            }
          }

          // console.log(
          //   `✅ 普通组件可以拖拽到${
          //     containerType === 'column' ? '分栏列' : '表单容器'
          //   }中`,
          // );
          return true;
        } else if (!isRootComponent) {
          console.log('❌ 非根级别组件不能拖拽到容器热区');
          return false;
        }

        const canDrop = canDropInContainer(item.component.tag, targetPath);
        // console.log('✅ 现有组件拖拽检查结果:', canDrop);
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

      // 根据鼠标位置设置指示线位置
      const hoverMiddleY = hoverBoundingRect.top + containerHeight / 2;
      if (clientOffset.y < hoverMiddleY) {
        setIndicatorPosition('top');
      } else {
        setIndicatorPosition('bottom');
      }

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

      // 清除指示线位置
      setIndicatorPosition(null);

      // console.log('🎯 SmartDropZone 拖拽处理:', {
      //   containerType,
      //   targetPath,
      //   item: {
      //     type: item.type,
      //     isNew: item.isNew,
      //     hasComponent: !!item.component,
      //     hasPath: !!item.path,
      //     isChildComponent: item.isChildComponent,
      //   },
      //   childElementsCount: childElements.length,
      //   columnIndex,
      //   insertPosition,
      //   insertIndex,
      // });

      if (item.isNew) {
        // 新组件添加到指定位置
        // console.log('✅ 新组件拖拽到容器:', {
        //   itemType: item.type,
        //   targetPath,
        //   insertIndex,
        //   insertPosition,
        // });
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
            // console.log('🔄 根节点组件移动到容器:', {
            //   component: item.component.tag,
            //   from: item.path,
            //   to: targetPath,
            //   containerType,
            //   insertIndex,
            // });

            // 对于根节点组件移动到容器，使用 onContainerDrop 来处理移动逻辑
            // 这样会正确地移除原组件并添加到新位置
            // console.log('🎯 调用 onContainerDrop 处理根节点到容器的移动:', {
            //   draggedItem: item,
            //   targetPath,
            //   insertIndex,
            // });
            onContainerDrop?.(item, targetPath, insertIndex);
            return;
          }

          // 子组件跨容器移动的特殊处理
          // if (item.isChildComponent) {
          //   console.log('🔄 子组件跨容器移动:', {
          //     component: item.component.tag,
          //     from: draggedContainerPath,
          //     to: targetPath,
          //     containerType,
          //   });
          // }

          // 容器间移动到指定位置（非根节点组件）
          // console.log('🎯 调用 onComponentMove (跨容器):', {
          //   component: item.component.tag,
          //   fromPath: item.path,
          //   toPath: targetPath,
          //   insertIndex,
          //   targetPath,
          // });
          onComponentMove?.(
            item.component,
            item.path,
            targetPath, // ✅ 修复：直接传递targetPath，不添加insertIndex
            insertIndex,
          );
        } else {
          // 同容器内的拖拽 - 移动到指定位置
          // console.log('🔄 同容器内拖拽到指定位置:', {
          //   component: item.component.tag,
          //   targetPath,
          //   insertIndex,
          // });

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
          // console.log('🎯 调用 onComponentMove (同容器):', {
          //   component: item.component.tag,
          //   fromPath: item.path,
          //   toPath: targetPath,
          //   insertIndex,
          //   targetPath,
          // });
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
    // padding: '4px', //
    borderRadius: '0', // 不要圆角，由外层管理
    position: 'relative',
    transition: 'all 0.15s ease',
    // 对于分栏列，使用传入的flexValue
    flex: containerType === 'column' ? flexValue || 1 : 'none',
    // 确保拖拽区域始终可交互，即使有子组件
    pointerEvents: 'auto',
    // 🎯 新增：拖拽悬停时显示蓝色线条指示线
    boxShadow: isOver && canDrop ? '0 0 8px rgba(24, 144, 255, 0.4)' : 'none',
  };

  // 移除拖拽视觉效果，由外层容器管理选中样式

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
    // console.log('🖱️ SmartDropZone 点击事件:', {
    //   containerType,
    //   target: e.target,
    //   currentTarget: e.currentTarget,
    //   clickedOnSelf: e.target === e.currentTarget,
    // });

    // 对于分栏列，触发选中回调
    if (containerType === 'column') {
      // console.log('✅ 分栏列点击 - 触发选中回调');
      if (onColumnSelect) {
        onColumnSelect();
      }
      return;
    }

    // 对于表单容器，只在点击容器本身（而非子组件）时阻止事件传播
    if (e.target === e.currentTarget) {
      console.log('🛑 表单容器点击 - 阻止事件传播');
      e.stopPropagation();
    }
    // 允许子组件的点击事件正常冒泡
  };

  return (
    <div ref={drop} style={dropZoneStyle} onClick={handleContainerClick}>
      {/* 🎯 新增：拖拽悬停时的蓝色线条指示线 */}
      {isOver && canDrop && indicatorPosition && (
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
        // 表单容器和分栏列为空时都不显示提示，只占位
        <div
          style={{ minHeight: containerType === 'form' ? '60px' : '60px' }}
        />
      )}

      {/* 拖拽悬停提示 - 只在表单容器中显示 */}
      {isOver && canDrop && containerType === 'form' && (
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
            transition: 'opacity 0.1s ease',
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

const ImgRenderer: React.FC<{ item: any; style?: React.CSSProperties }> = (
  props,
) => {
  // 安全处理 undefined 或 null 的 item
  const item = props.item || {};
  const hasValidImage = item.img_url && item.img_url.trim() !== '';

  return (
    <>
      {hasValidImage ? (
        <img
          src={item.img_url}
          onError={(e) => {
            // 图片加载失败时显示空状态
            const target = e.target as HTMLImageElement;
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = `
                <div style="
                  ${Object.entries({
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#fafafa',
                    border: '1px dashed #d9d9d9',
                    color: '#999',
                    fontSize: '12px',
                    gap: '8px',
                  })
                    .map(
                      ([key, value]) =>
                        `${key
                          .replace(/([A-Z])/g, '-$1')
                          .toLowerCase()}: ${value}`,
                    )
                    .join('; ')}
                ">
                  <div style="font-size: 24px; opacity: 0.5;">📷</div>
                  <div>图片加载失败</div>
                </div>
              `;
            }
          }}
          style={{
            objectFit: 'cover',
            border: '1px solid #f0f0f0',
            borderRadius: '4px',
            ...props.style,
          }}
        />
      ) : (
        <div
          style={{
            ...props.style,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#fafafa',
            border: '1px dashed #d9d9d9',
            color: '#999',
            fontSize: '12px',
            gap: '8px',
          }}
        >
          <div style={{ fontSize: '24px', opacity: 0.5 }}>📷</div>
          <div>请上传图片</div>
        </div>
      )}
    </>
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
  onUpdateComponent,
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
  onClearSelection,
  headerData,
  variables = [],
  verticalSpacing = 8,
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

      // 组件选中和操作处理
      const handleClick = (e: React.MouseEvent) => {
        // 立即阻止事件冒泡，防止触发父级选中
        e.stopPropagation();
        e.preventDefault();

        // 简化选中逻辑，直接处理组件选中
        onSelect?.(element, childPath);
        onCanvasFocus?.();
      };

      const handleDelete = () => {
        onDelete?.(childPath);
      };

      const handleCopy = () => {
        onCopy?.(element);
      };

      // 组件内容 - 对于非容器组件，直接渲染内容，避免双重包装
      const componentContent = (() => {
        // 如果是容器组件，需要递归调用 ComponentRendererCore
        if (element.tag === 'form' || element.tag === 'column_set') {
          return (
            <ComponentRendererCore
              component={element}
              isPreview={isPreview}
              onContainerDrop={onContainerDrop}
              onComponentMove={onComponentMove}
              onUpdateComponent={onUpdateComponent}
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
              variables={variables}
            />
          );
        } else {
          // 对于按钮组件，启用拖拽包装以确保选中功能正常
          const shouldEnableDrag = element.tag === 'button';

          return (
            <ComponentRendererCore
              component={element}
              isPreview={isPreview}
              onContainerDrop={onContainerDrop}
              onComponentMove={onComponentMove}
              onUpdateComponent={onUpdateComponent}
              path={childPath}
              index={elementIndex}
              containerPath={basePath}
              enableDrag={shouldEnableDrag} // 按钮组件启用拖拽包装
              enableSort={false} // 禁用内部排序，避免冲突
              onSelect={onSelect}
              selectedPath={selectedPath}
              onDelete={onDelete}
              onCopy={onCopy}
              onCanvasFocus={onCanvasFocus}
              headerData={headerData}
              variables={variables}
              renderChildren={undefined} // 使用默认渲染函数
            />
          );
        }
      })();

      // 包装器样式
      const wrapperStyle: React.CSSProperties = {
        position: 'relative',
        border: '2px solid transparent', // 始终使用透明边框，避免双边框
        borderRadius: '4px',
        padding: '4px',
        margin: `${verticalSpacing}px 0`,
        backgroundColor: 'transparent', // 始终使用透明背景
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        opacity: 1, // 固定透明度为1，因为这里不需要拖拽状态
      };

      // ✅ 修复：当在分栏列或表单容器中时，子组件不显示 hover 边框效果
      const isInColumnContainer = basePath.some(
        (segment) => segment === 'columns',
      );
      const isInFormContainer =
        basePath.some((segment) => segment === 'elements') &&
        basePath.length > 4; // 确保是在表单的 elements 数组中
      if (isInColumnContainer || isInFormContainer) {
        // 在分栏列或表单容器中，子组件不显示 hover 边框效果
        wrapperStyle.border = 'none';
        wrapperStyle.padding = '2px';
        // 在预览模式下保持垂直间距，在编辑模式下使用较小的间距
        wrapperStyle.margin = isPreview ? `${verticalSpacing}px 0` : '1px 0';
      }

      // ✅ 修复：普通组件在任何情况下都不显示 hover 边框（待激活态）
      const isContainerComponent =
        element.tag === 'form' || element.tag === 'column_set';
      if (!isContainerComponent) {
        // 普通组件不显示 hover 边框效果
        wrapperStyle.border = 'none';
        wrapperStyle.padding = '2px';
        // 在预览模式下保持垂直间距，在编辑模式下使用较小的间距
        wrapperStyle.margin = isPreview ? `${verticalSpacing}px 0` : '1px 0';
      }

      const showActions =
        element.tag !== 'button' ||
        (element as any).form_action_type !== 'submit';

      const selectableWrapper = (
        <div
          style={wrapperStyle}
          onClick={handleClick}
          data-component-wrapper="true"
          data-component-id={element.id}
        >
          {/* 操作按钮 */}
          {isSelected && !isPreview && onDelete && onCopy && showActions && (
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
                    // 标题组件和表单组件不显示复制选项
                    ...(element.tag !== 'title' && element.tag !== 'form'
                      ? [
                          {
                            key: 'copy',
                            icon: <CopyOutlined />,
                            label: '复制组件',
                            onClick: handleCopy,
                          },
                        ]
                      : []),
                    // 提交按钮不显示删除选项
                    ...(element.tag !== 'button' ||
                    (element as any).form_action_type !== 'submit'
                      ? [
                          {
                            key: 'delete',
                            icon: <DeleteOutlined />,
                            label: '删除组件',
                            onClick: handleDelete,
                            danger: true,
                          },
                        ]
                      : []),
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
            style={{
              marginBottom: isPreview ? `${verticalSpacing}px` : '8px',
            }}
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
      // const isCurrentSelected = isSamePath(selectedPath || null, path);

      const formContent = (
        <div
          style={{
            borderRadius: '4px',
            backgroundColor: 'transparent',
            transition: 'all 0.2s ease',
            position: 'relative',
            minHeight: '80px',
          }}
        >
          {/* 简化的拖拽区域 - 移除SmartDropZone的嵌套 */}
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
          onClearSelection={onClearSelection}
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
      const isCurrentSelected = isSamePath(selectedPath || null, path);

      // 检查分栏组件是否在表单中
      const isInForm = path.length >= 6 && path[4] === 'elements';

      // 根据位置确定选中边框颜色
      const getSelectedBorderColor = () => {
        if (!isCurrentSelected || isPreview) return 'transparent';
        return isInForm ? '#1890ff' : 'transparent'; // 表单中为红色，根节点为蓝色
      };

      // 检查是否有分栏列被选中
      let selectedColumnIndex = -1;

      // 检查根级别分栏列选中 (路径长度为6)
      if (
        selectedPath &&
        selectedPath.length === 6 &&
        selectedPath[0] === 'dsl' &&
        selectedPath[1] === 'body' &&
        selectedPath[2] === 'elements' &&
        selectedPath[4] === 'columns' &&
        selectedPath[3] === path[3] // 分栏组件的索引
      ) {
        selectedColumnIndex = selectedPath[5] as number;
        console.log('✅ 根级别分栏列选中状态匹配:', {
          selectedPath,
          currentPath: path,
          selectedColumnIndex,
        });
      }

      // 检查表单内分栏列选中 (路径长度为8)
      if (
        selectedPath &&
        selectedPath.length === 8 &&
        selectedPath[0] === 'dsl' &&
        selectedPath[1] === 'body' &&
        selectedPath[2] === 'elements' &&
        selectedPath[4] === 'elements' &&
        selectedPath[6] === 'columns' &&
        selectedPath[3] === path[3] && // 表单索引
        selectedPath[5] === path[5] // 分栏组件在表单内的索引
      ) {
        selectedColumnIndex = selectedPath[7] as number;
        console.log('✅ 表单内分栏列选中状态匹配:', {
          selectedPath,
          currentPath: path,
          selectedColumnIndex,
        });
      }

      // 调试信息：输出当前路径和选中路径的详细信息
      if (selectedPath && selectedPath.length >= 6) {
        console.log('🔍 分栏组件路径匹配检查:', {
          selectedPath,
          currentPath: path,
          pathLength: selectedPath.length,
          isRootLevel: selectedPath.length === 6,
          isFormLevel: selectedPath.length === 8,
          selectedPathIndices: {
            dsl: selectedPath[0],
            body: selectedPath[1],
            elements: selectedPath[2],
            componentIndex: selectedPath[3],
            columns: selectedPath[4],
            columnIndex: selectedPath[5],
          },
          currentPathIndices: {
            dsl: path[0],
            body: path[1],
            elements: path[2],
            componentIndex: path[3],
          },
        });
      }

      // 更精确的路径匹配检查 - 根级别分栏列
      const isExactRootPathMatch =
        selectedPath &&
        selectedPath.length === 6 &&
        selectedPath[0] === 'dsl' &&
        selectedPath[1] === 'body' &&
        selectedPath[2] === 'elements' &&
        selectedPath[4] === 'columns' &&
        selectedPath[3] === path[3];

      if (isExactRootPathMatch) {
        const exactSelectedColumnIndex = selectedPath[5] as number;
        console.log('🎯 根级别精确路径匹配成功:', {
          selectedPath,
          currentPath: path,
          exactSelectedColumnIndex,
          selectedColumnIndex,
          willUpdate: exactSelectedColumnIndex !== selectedColumnIndex,
        });
        selectedColumnIndex = exactSelectedColumnIndex;
      }

      // 更精确的路径匹配检查 - 表单内分栏列
      const isExactFormPathMatch =
        selectedPath &&
        selectedPath.length === 8 &&
        selectedPath[0] === 'dsl' &&
        selectedPath[1] === 'body' &&
        selectedPath[2] === 'elements' &&
        selectedPath[4] === 'elements' &&
        selectedPath[6] === 'columns' &&
        selectedPath[3] === path[3] && // 表单索引
        selectedPath[5] === path[5]; // 分栏组件在表单内的索引

      if (isExactFormPathMatch) {
        const exactSelectedColumnIndex = selectedPath[7] as number;
        console.log('🎯 表单内精确路径匹配成功:', {
          selectedPath,
          currentPath: path,
          exactSelectedColumnIndex,
          selectedColumnIndex,
          willUpdate: exactSelectedColumnIndex !== selectedColumnIndex,
        });
        selectedColumnIndex = exactSelectedColumnIndex;
      }

      const columnContent = (
        <div
          style={{
            border: `2px solid ${getSelectedBorderColor()}`,
            borderRadius: '4px',
            backgroundColor:
              isCurrentSelected && !isPreview
                ? 'rgba(24, 144, 255, 0.05)'
                : 'transparent',
            boxShadow:
              isCurrentSelected && !isPreview
                ? '0 0 8px rgba(24, 144, 255, 0.3)'
                : 'none',
            transition: 'all 0.2s ease',
            position: 'relative',
            minHeight: '60px',
            padding: '0', // 移除padding，避免影响flex布局
            width: '100%', // 确保容器有明确宽度
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && onSelect) {
              // 点击分栏容器整体时选中整个组件
              onSelect(component, path);
            }
          }}
        >
          {/* 分栏内容区域 */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'nowrap',
              alignItems: 'stretch',
              gap: '2px', //
              padding: '0', // 移除内边距
              minHeight: '60px',
              width: '100%',
            }}
            data-columns-count={columns.length}
            data-total-width={columns.reduce(
              (sum: number, col: any) => sum + (col.style?.flex || 1),
              0,
            )}
          >
            {columns.map((column: any, columnIndex: number) => {
              const columnElements = column.elements || [];
              const columnPath = [...path, 'columns', columnIndex, 'elements'];
              const columnSelectionPath = [...path, 'columns', columnIndex];
              const isColumnSelected = selectedColumnIndex === columnIndex;

              // 调试信息：检查分栏列的选中状态
              if (selectedPath && selectedPath.length >= 6) {
                console.log('🔍 分栏列选中状态检查:', {
                  columnIndex,
                  selectedColumnIndex,
                  isColumnSelected,
                  selectedPath,
                  columnSelectionPath,
                  pathMatch:
                    JSON.stringify(selectedPath) ===
                    JSON.stringify(columnSelectionPath),
                  exactMatch:
                    selectedPath.length === columnSelectionPath.length &&
                    selectedPath.every(
                      (segment, index) =>
                        segment === columnSelectionPath[index],
                    ),
                });
              }

              // 计算列宽比例
              const columnFlex = column.style?.flex || 1;
              const totalFlex = columns.reduce(
                (sum: number, col: any) => sum + (col.style?.flex || 1),
                0,
              );
              const flexValue = columnFlex / totalFlex;

              return (
                <SmartDropZone
                  key={`column-dropzone-${columnIndex}-${columnFlex}-${totalFlex}`}
                  containerType="column"
                  targetPath={columnPath}
                  onContainerDrop={onContainerDrop}
                  onComponentMove={onComponentMove}
                  childElements={columnElements}
                  onColumnSelect={() => {
                    if (onSelect) {
                      const columnComponent = {
                        id: `${component.id}_column_${columnIndex}`,
                        tag: 'column',
                        ...column,
                      };
                      onSelect(columnComponent, columnSelectionPath);
                    }
                  }}
                  flexValue={flexValue} // 传递flex值给SmartDropZone
                >
                  <div
                    key={`column-${columnIndex}-${columnFlex}-${totalFlex}`}
                    style={{
                      position: 'relative',
                      minHeight: '60px',
                      border: isColumnSelected
                        ? '1px dashed #1890ff'
                        : '1px dashed #d9d9d9',
                      borderRadius: '4px',
                      backgroundColor: isColumnSelected
                        ? 'rgba(24, 144, 255, 0.02)'
                        : 'transparent',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                      padding: '8px',
                      boxSizing: 'border-box',
                    }}
                    className="column-container"
                    data-column-index={columnIndex}
                    data-flex-value={flexValue}
                    data-column-flex={columnFlex}
                    data-total-flex={totalFlex}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelect) {
                        const columnComponent = {
                          id: `${component.id}_column_${columnIndex}`,
                          tag: 'column',
                          ...column,
                        };
                        onSelect(columnComponent, columnSelectionPath);
                      }
                    }}
                    onMouseEnter={(e) => {
                      const element = e.currentTarget;
                      if (!isColumnSelected) {
                        element.style.border = '1px dashed #1890ff';
                      }
                    }}
                    onMouseLeave={(e) => {
                      const element = e.currentTarget;
                      if (!isColumnSelected) {
                        element.style.border = '1px dashed #d9d9d9';
                      }
                    }}
                  >
                    {/* 选中时显示操作菜单 - 不包含提交按钮的列才显示 */}
                    {(() => {
                      const hasSubmitButton = columnElements.some(
                        (element: any) =>
                          element.tag === 'button' &&
                          element.form_action_type === 'submit',
                      );

                      return isColumnSelected && !isPreview && !hasSubmitButton;
                    })() && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          zIndex: 10,
                        }}
                      >
                        <Dropdown
                          menu={{
                            items: [
                              {
                                key: 'delete',
                                icon: <DeleteOutlined />,
                                label: '删除列',
                                onClick: () => {
                                  if (onDelete) {
                                    onDelete(columnSelectionPath);
                                  }
                                },
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
                    {/* 渲染列内组件 */}
                    {columnElements.length > 0 ? (
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          // gap: '8px',
                          alignItems: 'flex-start',
                        }}
                      >
                        {internalRenderChildren(columnElements, columnPath)}
                      </div>
                    ) : null}
                  </div>
                </SmartDropZone>
              );
            })}
          </div>
        </div>
      );

      return enableDrag && !isPreview ? (
        <DraggableWrapper
          key={`column-set-${component.id}-${JSON.stringify(
            comp.columns?.map((col: any) => col.width),
          )}`}
          component={component}
          path={path}
          index={index}
          containerPath={containerPath}
          onComponentMove={onComponentMove}
          enableSort={enableSort}
          onSelect={onSelect}
          selectedPath={selectedPath}
          onCanvasFocus={onCanvasFocus}
          onClearSelection={onClearSelection}
        >
          {columnContent}
        </DraggableWrapper>
      ) : (
        <div
          key={`column-set-${component.id}-${JSON.stringify(
            comp.columns?.map((col: any) => col.width),
          )}`}
        >
          {columnContent}
        </div>
      );
    }

    // 所有其他组件类型的渲染逻辑保持不变...
    case 'plain_text': {
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

        // console.log('📝 文本组件被点击:', {
        //   componentId: comp.id,
        //   componentTag: comp.tag,
        //   path,
        // });

        // console.log('📝 检查 onSelect 回调:', {
        //   onSelectExists: !!onSelect,
        //   onSelectType: typeof onSelect,
        // });

        // 处理组件选中
        if (onSelect) {
          // console.log('📝 调用 onSelect 回调:', {
          //   component,
          //   path,
          // });
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
      const isCurrentSelected = isSamePath(selectedPath || null, path);

      // console.log('📝 文本组件选中状态检查:', {
      //   componentId: comp.id,
      //   componentTag: comp.tag,
      //   path,
      //   selectedPath,
      //   isCurrentSelected,
      //   isPreview,
      // });

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

      // 处理变量替换
      console.log('🔍 文本组件变量替换检查:', {
        componentId: comp.id,
        originalContent: comp.content || '文本内容',
        userEditedContent: textComponentStateManager.getUserEditedContent(
          comp.id,
        ),
        boundVariableName: textComponentStateManager.getBoundVariableName(
          comp.id,
        ),
        variablesCount: variables.length,
        variables: variables,
        hasVariables: variables.length > 0,
        variablesKeys: variables
          .map((v) => {
            if (typeof v === 'object' && v !== null) {
              return Object.keys(v as Record<string, any>);
            }
            return [];
          })
          .flat(),
        cacheStats: variableCacheManager.getCacheStats(),
        component: component,
        comp: comp,
        componentContent: component.content,
        compContent: comp.content,
        componentBoundVariable: textComponentStateManager.getBoundVariableName(
          comp.id,
        ),
        compBoundVariable: textComponentStateManager.getBoundVariableName(
          comp.id,
        ),
        componentFull: component,
        compFull: comp,
      });

      // 确定要显示的内容
      let displayContent: string;

      // 如果组件绑定了变量，优先使用变量值
      const boundVariableName = textComponentStateManager.getBoundVariableName(
        comp.id,
      );
      if (boundVariableName) {
        // 从缓存中获取变量值
        const variableValue =
          variableCacheManager.getVariable(boundVariableName);

        if (variableValue !== undefined) {
          displayContent = String(variableValue);

          console.log('✅ 文本组件绑定变量显示 (从缓存):', {
            componentId: comp.id,
            boundVariableName: boundVariableName,
            variableValue: variableValue,
            displayContent: displayContent,
          });
        } else {
          // 如果缓存中没有，尝试从传入的变量列表中查找
          const boundVariable = variables.find((variable) => {
            if (typeof variable === 'object' && variable !== null) {
              const keys = Object.keys(variable as Record<string, any>);
              return keys.includes(boundVariableName);
            }
            return false;
          });

          if (boundVariable) {
            const keys = Object.keys(boundVariable as Record<string, any>);
            const variableValue = (boundVariable as Record<string, any>)[
              keys[0]
            ];
            displayContent = String(variableValue);

            console.log('✅ 文本组件绑定变量显示 (从变量列表):', {
              componentId: comp.id,
              boundVariableName: boundVariableName,
              variableValue: variableValue,
              displayContent: displayContent,
            });
          } else {
            // 如果找不到变量值，显示用户编辑的内容或默认内容
            const userEditedContent =
              textComponentStateManager.getUserEditedContent(comp.id);
            if (userEditedContent !== undefined) {
              displayContent = userEditedContent;
            } else {
              displayContent = comp.content || '文本内容';
            }

            console.log('⚠️ 文本组件绑定变量未找到，显示用户编辑内容:', {
              componentId: comp.id,
              boundVariableName: boundVariableName,
              userEditedContent: userEditedContent,
              displayContent: displayContent,
            });
          }
        }
      } else {
        // 如果没有绑定变量，优先显示用户编辑的内容
        const userEditedContent =
          textComponentStateManager.getUserEditedContent(comp.id);
        if (userEditedContent !== undefined) {
          displayContent = userEditedContent;
        } else {
          // 使用通用的变量替换逻辑
          displayContent = replaceVariables(
            comp.content || '文本内容',
            variables,
          );
        }

        console.log('✅ 文本组件显示用户编辑内容:', {
          componentId: comp.id,
          userEditedContent: userEditedContent,
          displayContent: displayContent,
          boundVariableName: boundVariableName,
        });
      }

      console.log('✅ 文本组件最终显示内容:', {
        componentId: comp.id,
        originalContent: comp.content || '文本内容',
        userEditedContent: textComponentStateManager.getUserEditedContent(
          comp.id,
        ),
        displayContent: displayContent,
        boundVariableName: boundVariableName,
      });

      const textContent = (
        <div
          style={{ ...mergedStyles, ...selectedStyles }}
          onClick={handleTextClick}
          data-component-wrapper="true"
          data-component-id={comp.id}
        >
          {displayContent}
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
          onClearSelection={onClearSelection}
        >
          {textContent}
        </DraggableWrapper>
      ) : (
        textContent
      );
    }

    case 'rich_text': {
      // 检查当前组件是否被选中
      const isCurrentSelected = isSamePath(selectedPath || null, path);
      const comp = component as any;

      console.log('🔍 富文本组件变量替换检查:', {
        componentId: comp.id,
        originalContent: comp.content,
        userEditedContent: textComponentStateManager.getUserEditedContent(
          comp.id,
        ),
        boundVariableName: textComponentStateManager.getBoundVariableName(
          comp.id,
        ),
        variablesCount: variables.length,
        variables: variables,
        hasVariables: variables.length > 0,
        component: component,
        comp: comp,
      });

      // 确定要显示的内容
      let displayContent: any;

      // 如果组件绑定了变量，优先使用变量值
      const boundVariableName = textComponentStateManager.getBoundVariableName(
        comp.id,
      );
      if (boundVariableName) {
        // 从缓存中获取变量值
        const variableValue =
          variableCacheManager.getVariable(boundVariableName);

        if (variableValue !== undefined) {
          displayContent = variableValue;

          console.log('✅ 富文本组件绑定变量显示 (从缓存):', {
            componentId: comp.id,
            boundVariableName: boundVariableName,
            variableValue: variableValue,
            displayContent: displayContent,
          });
        } else {
          // 如果缓存中没有，尝试从传入的变量列表中查找
          const boundVariable = variables.find((variable) => {
            if (typeof variable === 'object' && variable !== null) {
              const keys = Object.keys(variable as Record<string, any>);
              return keys.includes(boundVariableName);
            }
            return false;
          });

          if (boundVariable) {
            const variableValue = (boundVariable as Record<string, any>)[
              boundVariableName
            ];
            displayContent = variableValue;

            console.log('✅ 富文本组件绑定变量显示 (从变量列表):', {
              componentId: comp.id,
              boundVariableName: boundVariableName,
              variableValue: variableValue,
              displayContent: displayContent,
            });
          } else {
            // 如果找不到变量值，显示占位符
            displayContent = comp.content || {
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: '富文本内容',
                    },
                  ],
                },
              ],
            };
          }
        }
      } else {
        // 如果没有绑定变量，优先显示用户编辑的内容
        const userEditedContent =
          textComponentStateManager.getUserEditedContent(comp.id);
        if (userEditedContent !== undefined) {
          displayContent = userEditedContent;
        } else {
          // 使用组件原始内容
          displayContent = comp.content || {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: '富文本内容',
                  },
                ],
              },
            ],
          };
        }

        console.log('✅ 富文本组件显示用户编辑内容:', {
          componentId: comp.id,
          userEditedContent: userEditedContent,
          displayContent: displayContent,
          boundVariableName: boundVariableName,
        });
      }

      console.log('✅ 富文本组件最终显示内容:', {
        componentId: comp.id,
        originalContent: comp.content,
        userEditedContent: textComponentStateManager.getUserEditedContent(
          comp.id,
        ),
        displayContent: displayContent,
        boundVariableName: boundVariableName,
      });

      // 处理点击事件
      const handleRichTextClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        if (onSelect) {
          onSelect(component, path);
        }

        if (onCanvasFocus) {
          onCanvasFocus();
        }
      };

      const richTextContent = (
        <div
          style={{
            // marginBottom: '12px',
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
          onClick={handleRichTextClick}
          data-component-wrapper="true"
          data-component-id={comp.id}
        >
          <RichTextStyles
            style={{
              minHeight: '20px',
            }}
          >
            <div
              dangerouslySetInnerHTML={{
                __html: convertJSONToHTML(displayContent),
              }}
            />
          </RichTextStyles>
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
          onClearSelection={onClearSelection}
        >
          {richTextContent}
        </DraggableWrapper>
      ) : (
        richTextContent
      );
    }

    case 'hr': {
      // 检查当前组件是否被选中
      const isCurrentSelected = isSamePath(selectedPath || null, path);

      // 获取边框样式，默认为solid
      const borderStyle = comp.style?.borderStyle || 'solid';

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
            // 处理组件选中
            if (onSelect) {
              onSelect(component, path);
            }
            if (onCanvasFocus) {
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
              borderWidth: '1px',
              borderStyle: borderStyle, // 应用动态边框样式
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
      const isCurrentSelected = isSamePath(selectedPath || null, path);

      // 获取图片URL，支持变量绑定
      const getImageUrl = () => {
        console.log('🖼️ 图片组件获取URL:', {
          componentId: comp.id,
          img_url: comp.img_url,
          variable_name: comp.variable_name,
          variablesCount: variables.length,
          variables: variables.map((v, index) => ({
            index,
            variable: v,
            keys: typeof v === 'object' && v !== null ? Object.keys(v) : [],
            firstKey:
              typeof v === 'object' && v !== null ? Object.keys(v)[0] : null,
            firstValue:
              typeof v === 'object' && v !== null && Object.keys(v).length > 0
                ? v[Object.keys(v)[0]]
                : null,
          })),
        });

        let finalUrl;
        let variableName;

        // 1. 优先从 img_url 中提取变量名（${variableName} 格式）
        if (comp.img_url && comp.img_url.includes('${')) {
          const variableMatch = comp.img_url.match(/\$\{([^}]+)\}/);
          if (variableMatch && variableMatch[1]) {
            variableName = variableMatch[1];
            console.log('🔍 从img_url提取变量名:', variableName);
          }
        }

        // 2. 备用：从历史数据的 variable_name 属性获取（兼容性）
        if (!variableName && comp.variable_name) {
          variableName = comp.variable_name;
          console.log('🔍 使用variable_name（兼容模式）:', variableName);
        }

        // 3. 如果找到变量名，查找对应的变量
        if (variableName) {
          const variable = variables.find((v) => {
            if (typeof v === 'object' && v !== null) {
              const keys = Object.keys(v as Record<string, any>);
              return keys.length > 0 && keys[0] === variableName;
            }
            return false;
          });

          console.log('🔍 找到变量:', { variableName, variable });

          if (variable) {
            const variableValue = (variable as Record<string, any>)[
              variableName
            ];

            console.log('🔍 变量值解析:', {
              variableName,
              variableValue,
              valueType: typeof variableValue,
            });

            // 解析变量值获取图片URL
            if (typeof variableValue === 'string') {
              // 新的字符串格式图片变量
              console.log('✅ 找到图片URL (字符串):', variableValue);
              finalUrl = variableValue;
              console.log('🎯 即将返回URL:', finalUrl);
              return finalUrl;
            } else if (
              typeof variableValue === 'object' &&
              variableValue !== null
            ) {
              if (variableValue.img_url) {
                console.log('✅ 找到图片URL (对象):', variableValue.img_url);
                finalUrl = variableValue.img_url;
                console.log('🎯 即将返回URL:', finalUrl);
                return finalUrl;
              } else if (
                Array.isArray(variableValue) &&
                variableValue.length > 0 &&
                variableValue[0].img_url
              ) {
                console.log('✅ 找到图片URL (数组):', variableValue[0].img_url);
                finalUrl = variableValue[0].img_url;
                console.log('🎯 即将返回URL:', finalUrl);
                return finalUrl;
              }
            }

            console.log('⚠️ 变量值中没有找到有效的img_url');
          } else {
            console.log('❌ 没有找到对应的变量:', variableName);
          }
        }

        // 5. 默认返回备用图片URL
        // 如果img_url是变量占位符格式，则返回默认图片
        if (comp.img_url && comp.img_url.includes('${')) {
          finalUrl = '/demo.png';
          console.log('🔙 变量解析失败，返回默认图片URL:', finalUrl);
        } else {
          finalUrl = comp.img_url || '/demo.png';
          console.log('🔙 返回原始图片URL:', finalUrl);
        }
        return finalUrl;
      };

      // 获取裁剪方式对应的样式
      const getCropStyle = () => {
        const cropMode = comp.style?.crop_mode || 'default';
        const baseStyle: React.CSSProperties = {
          borderRadius: '4px',
          border: 'none', // 移除图片本身的边框，避免双边框
        };

        switch (cropMode) {
          case 'top':
            return {
              ...baseStyle,
              width: '100%',
              height: '200px', // 固定高度，实现4:3比例
              objectFit: 'cover' as const,
              objectPosition: 'top', // 显示图片顶部
            };
          case 'center':
            return {
              ...baseStyle,
              width: '100%',
              height: '200px', // 固定高度，实现4:3比例
              objectFit: 'cover' as const,
              objectPosition: 'center', // 显示图片中心
            };
          case 'default':
          default:
            return {
              ...baseStyle,
              maxWidth: '100%',
              height: 'auto',
              objectFit: 'contain' as const, // 完整展示图片
            };
        }
      };

      const imgContent = (
        <div
          style={{
            textAlign: 'center',
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
            overflow: 'hidden', // 确保裁剪效果正常
            position: 'relative', // 为绝对定位的标签提供定位上下文
          }}
        >
          <img
            src={(() => {
              const url = getImageUrl();
              console.log('🖼️ 图片组件渲染时获取的URL:', url);
              return url;
            })()}
            alt="图片"
            style={{
              ...getCropStyle(),
              // 图片加载失败时显示图裂状态的基础样式
              backgroundColor: '#f5f5f5',
            }}
            onLoad={(e) => {
              const img = e.target as HTMLImageElement;
              console.log('✅ 图片加载成功:', {
                componentId: comp.id,
                src: img.src,
                naturalWidth: img.naturalWidth,
                naturalHeight: img.naturalHeight,
              });

              // 加载成功时移除错误样式
              img.style.backgroundColor = '';
              img.style.border = '';
              img.style.opacity = '1';

              // 移除错误提示元素
              const parent = img.parentElement;
              if (parent) {
                const errorElement = parent.querySelector(
                  '.image-error-overlay',
                );
                if (errorElement) {
                  errorElement.remove();
                }
              }
            }}
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              const isVariableBound =
                comp.img_url && comp.img_url.includes('${');

              console.log('❌ 图片加载失败:', {
                componentId: comp.id,
                originalSrc: img.src,
                isVariableBound,
                error: e,
                crossOrigin: img.crossOrigin,
                networkState: navigator.onLine ? 'online' : 'offline',
              });

              // 如果是变量绑定的图片，显示图裂状态，不再回退到demo.png
              if (isVariableBound) {
                console.log('🖼️ 变量绑定图片加载失败，显示图裂状态');

                // 设置图裂样式
                img.style.backgroundColor = '#fafafa';
                img.style.border = '2px dashed #d9d9d9';
                img.style.opacity = '0.6';

                // 添加错误提示覆盖层
                const parent = img.parentElement;
                if (parent && !parent.querySelector('.image-error-overlay')) {
                  const errorOverlay = document.createElement('div');
                  errorOverlay.className = 'image-error-overlay';
                  errorOverlay.style.cssText = `
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    color: #999;
                    font-size: 12px;
                    text-align: center;
                    pointer-events: none;
                    z-index: 1;
                    background: rgba(255, 255, 255, 0.9);
                    padding: 8px 12px;
                    border-radius: 4px;
                    white-space: nowrap;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                  `;
                  errorOverlay.innerHTML = '🖼️<br/>图片加载失败';

                  // 确保父容器有相对定位
                  if (
                    parent.style.position !== 'absolute' &&
                    parent.style.position !== 'relative'
                  ) {
                    parent.style.position = 'relative';
                  }

                  parent.appendChild(errorOverlay);
                }
              } else {
                // 非变量绑定的图片，使用原有的重试逻辑
                const originalSrc = img.src;
                if (
                  !originalSrc.includes('?retry=1') &&
                  !originalSrc.includes('/demo.png')
                ) {
                  const retrySrc = originalSrc.includes('?')
                    ? `${originalSrc}&retry=1&t=${Date.now()}`
                    : `${originalSrc}?retry=1&t=${Date.now()}`;
                  console.log('🔄 尝试重新加载图片:', retrySrc);
                  img.src = retrySrc;
                } else {
                  // 重试失败，使用备用图片
                  console.log('🔙 重试失败，使用备用图片');
                  img.src = '/demo.png';
                }
              }
            }}
          />
          {/* 显示图片信息（仅在编辑模式下） */}
          {!isPreview && isCurrentSelected && (
            <div
              style={{
                position: 'absolute',
                top: '4px',
                left: '4px',
                backgroundColor: 'rgba(24, 144, 255, 0.8)',
                color: 'white',
                padding: '2px 6px',
                borderRadius: '2px',
                fontSize: '10px',
                fontWeight: 'bold',
              }}
            >
              {comp.img_source === 'variable' ? '🔗' : '📁'}
              {'demo.png'}
            </div>
          )}
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
      const isCurrentSelected = isSamePath(selectedPath || null, path);

      const inputContent = (
        <div
          style={{
            border:
              isCurrentSelected && !isPreview
                ? '2px solid #1890ff'
                : '2px solid transparent',
            borderRadius: '6px',
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
          <Input
            placeholder={(() => {
              // 解析占位文本变量
              const placeholderContent = comp.placeholder?.content || '请输入';

              console.log('🔍 ComponentRendererCore - 输入框占位文本解析:', {
                componentId: comp.id,
                isPreview,
                placeholderContent,
                hasVariables: variables.length > 0,
                variablesCount: variables.length,
                variables: variables,
                containsVariable: placeholderContent.includes('${'),
              });

              if (placeholderContent.includes('${')) {
                const variableMatch = placeholderContent.match(/\$\{([^}]+)\}/);
                if (variableMatch && variableMatch[1]) {
                  const variableName = variableMatch[1];

                  console.log('🔍 ComponentRendererCore - 查找变量:', {
                    variableName,
                    variables: variables,
                    variablesType: Array.isArray(variables)
                      ? 'array'
                      : typeof variables,
                    variablesDetailed: variables.map(
                      (v: any, index: number) => ({
                        index,
                        type: typeof v,
                        isObject: typeof v === 'object' && v !== null,
                        keys:
                          typeof v === 'object' && v !== null
                            ? Object.keys(v)
                            : [],
                        value: v,
                      }),
                    ),
                  });

                  // 支持两种变量格式：
                  // 1. VariableItem格式：{变量名: 值}
                  // 2. Variable格式：{name: 变量名, value: 值, type: 类型}
                  const variable = variables.find((v: any) => {
                    if (typeof v === 'object' && v !== null) {
                      // Variable格式：{name, value, type}
                      if (v.name && v.name === variableName) {
                        return true;
                      }
                      // VariableItem格式：{变量名: 值}
                      return Object.keys(v).some(
                        (key) => !key.startsWith('__') && key === variableName,
                      );
                    }
                    return false;
                  });

                  console.log('🔍 ComponentRendererCore - 变量查找结果:', {
                    variableName,
                    foundVariable: variable,
                    variableKeys: variable ? Object.keys(variable) : [],
                  });

                  if (variable) {
                    // 根据变量格式获取变量值
                    let variableValue;
                    if (
                      (variable as any).name &&
                      (variable as any).value !== undefined
                    ) {
                      // Variable格式：{name, value, type}
                      variableValue = (variable as any).value;
                    } else {
                      // VariableItem格式：{变量名: 值}
                      variableValue = (variable as any)[variableName];
                    }

                    console.log(
                      '✅ ComponentRendererCore - 输入框占位文本解析变量成功:',
                      {
                        componentId: comp.id,
                        isPreview,
                        variableName,
                        variableValue,
                        placeholderContent,
                        resolvedValue: String(variableValue),
                        variableFormat: (variable as any).name
                          ? 'Variable'
                          : 'VariableItem',
                      },
                    );
                    return String(variableValue);
                  } else {
                    console.log('❌ ComponentRendererCore - 变量未找到:', {
                      componentId: comp.id,
                      isPreview,
                      variableName,
                      placeholderContent,
                      availableVariables: variables.map((v: any) => {
                        if (typeof v === 'object' && v !== null) {
                          return Object.keys(v).filter(
                            (key) => !key.startsWith('__'),
                          );
                        }
                        return 'unknown';
                      }),
                    });
                  }
                }
              }

              console.log('🔍 ComponentRendererCore - 返回原始占位文本:', {
                componentId: comp.id,
                isPreview,
                placeholderContent,
              });

              return placeholderContent;
            })()}
            value={(() => {
              // 解析默认文本变量
              const defaultContent = comp.default_value?.content || '';
              if (defaultContent.includes('${')) {
                const variableMatch = defaultContent.match(/\$\{([^}]+)\}/);
                if (variableMatch && variableMatch[1]) {
                  const variableName = variableMatch[1];
                  // 支持两种变量格式：
                  // 1. VariableItem格式：{变量名: 值}
                  // 2. Variable格式：{name: 变量名, value: 值, type: 类型}
                  const variable = variables.find((v: any) => {
                    if (typeof v === 'object' && v !== null) {
                      // Variable格式：{name, value, type}
                      if (v.name && v.name === variableName) {
                        return true;
                      }
                      // VariableItem格式：{变量名: 值}
                      return Object.keys(v).some(
                        (key) => !key.startsWith('__') && key === variableName,
                      );
                    }
                    return false;
                  });

                  if (variable) {
                    // 根据变量格式获取变量值
                    let variableValue;
                    if (
                      (variable as any).name &&
                      (variable as any).value !== undefined
                    ) {
                      // Variable格式：{name, value, type}
                      variableValue = (variable as any).value;
                    } else {
                      // VariableItem格式：{变量名: 值}
                      variableValue = (variable as any)[variableName];
                    }

                    console.log(
                      '✅ ComponentRendererCore - 输入框默认文本解析变量成功:',
                      {
                        componentId: comp.id,
                        isPreview,
                        variableName,
                        variableValue,
                        defaultContent,
                        resolvedValue: String(variableValue),
                        variableFormat: (variable as any).name
                          ? 'Variable'
                          : 'VariableItem',
                      },
                    );
                    return String(variableValue);
                  }
                }
              }
              return defaultContent;
            })()}
            type="text"
            style={{
              width: '250px',
              padding: '8px 12px',
              border: '1px solid #d9d9d9',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: 'white',
            }}
            disabled={isPreview}
            readOnly={isPreview}
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
      const isCurrentSelected = isSamePath(selectedPath || null, path);
      const buttonColor = (comp as any).style?.color || '#fff';

      // 获取按钮颜色样式
      const getButtonStyle = (customColor?: string) => {
        const baseStyle = {
          backgroundColor: '#1890ff',
          color: '#ffffff',
        };

        // 如果有自定义颜色，覆盖默认颜色
        if (customColor) {
          return {
            ...baseStyle,
            border: `1px solid ${
              buttonColor === '#000000' ? '#d0d3d6' : customColor
            }`,
            backgroundColor:
              buttonColor === '#000000' ? '#ffffff' : customColor,
            color: buttonColor === '#000000' ? '#1f2329' : '#ffffff',
          };
        }

        return baseStyle;
      };

      const buttonStyle = getButtonStyle((comp as any).style?.color);

      const buttonContent = (
        <div
          style={{
            width: '100%',
            border: isCurrentSelected
              ? '2px solid #1890ff'
              : '2px solid transparent',
            transition: 'all 0.2s ease',
            position: 'relative',
            display: 'inline-block', // 让按钮容器内联显示，支持并排
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
              ...buttonStyle,
            }}
            disabled={isPreview}
          >
            {comp.text?.content || '按钮'}
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
          onClearSelection={onClearSelection}
        >
          {buttonContent}
        </DraggableWrapper>
      ) : (
        buttonContent
      );
    }

    case 'select_static': {
      // 检查当前组件是否被选中
      const isCurrentSelected = isSamePath(selectedPath || null, path);

      // 处理选项数据：支持变量绑定和静态选项
      const getSelectOptions = () => {
        // 如果options是字符串且包含变量占位符，解析变量值
        if (typeof comp.options === 'string' && comp.options.includes('${')) {
          const variableMatch = comp.options.match(/\$\{([^}]+)\}/);
          if (variableMatch && variableMatch[1]) {
            const variableName = variableMatch[1];
            console.log('🔍 下拉单选组件解析变量:', {
              componentId: comp.id,
              variableName,
              variablesCount: variables?.length || 0,
            });

            // 查找变量
            const variable = variables?.find((v: any) => {
              if (typeof v === 'object' && v !== null) {
                // 支持两种格式：{name, value} 和 {variableName: value}
                if (v.name && v.name === variableName) {
                  return true;
                }
                return Object.keys(v).some(
                  (key) => !key.startsWith('__') && key === variableName,
                );
              }
              return false;
            });

            if (variable) {
              let variableValue;
              if (variable.name && variable.value !== undefined) {
                // Variable格式：{name, value, type}
                variableValue = variable.value;
              } else {
                // VariableItem格式：{variableName: value}
                variableValue = variable[variableName];
              }

              console.log('✅ 找到下拉单选变量值:', {
                variableName,
                variableValue,
                valueType: typeof variableValue,
              });

              // 如果变量值是数组，直接使用
              if (Array.isArray(variableValue)) {
                return variableValue.map((item: any, index: number) => ({
                  value:
                    typeof item === 'object'
                      ? item.value || `option_${index}`
                      : item,
                  text: {
                    content:
                      typeof item === 'object'
                        ? item.label || item.text || item
                        : item,
                  },
                }));
              }
            }

            console.log('⚠️ 下拉单选变量未找到或格式不正确，使用默认选项');
            // 变量未找到或格式不正确，返回默认选项
            return [
              { value: 'option1', text: { content: '选项1' } },
              { value: 'option2', text: { content: '选项2' } },
            ];
          }
        }

        // 静态选项：确保是数组格式
        if (Array.isArray(comp.options)) {
          return comp.options;
        }

        // 默认选项
        return [
          { value: 'option1', text: { content: '选项1' } },
          { value: 'option2', text: { content: '选项2' } },
        ];
      };

      const selectOptions = getSelectOptions();

      const selectContent = (
        <div
          style={{
            // marginBottom: '12px',
            border:
              isCurrentSelected && !isPreview
                ? '2px solid #1890ff'
                : '2px solid transparent',
            borderRadius: '6px',
            // padding: '8px',
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
          <Select
            placeholder="请选择"
            style={{
              width: '250px',
              fontSize: '14px',
            }}
            // 画布中只允许下拉查看，不允许选中
            value={undefined} // 始终保持空值，不显示任何选中状态
            onChange={() => {
              // 空的onChange处理，不允许选中任何选项
            }}
            onSelect={() => {
              // 阻止选中操作
              return false;
            }}
          >
            {selectOptions.map((option: any, optionIndex: number) => {
              // 安全地提取选项显示文本
              let displayText = `选项${optionIndex + 1}`;
              if (option.text) {
                if (typeof option.text === 'string') {
                  displayText = option.text;
                } else if (
                  typeof option.text === 'object' &&
                  option.text.content
                ) {
                  const textContent = option.text.content;

                  console.log('🔍 画布选项显示调试:', {
                    textContent,
                    textContentType: typeof textContent,
                    variablesCount: variables.length,
                    variables: variables.map((v: any) => ({
                      name: v.name,
                      keys: Object.keys(v),
                      data: v,
                    })),
                  });

                  // 智能显示逻辑：根据模式显示不同的值
                  if (
                    typeof textContent === 'string' &&
                    textContent.includes('${')
                  ) {
                    // 变量模式
                    const match = textContent.match(/\$\{([^}]+)\}/);
                    if (match && match[1] && match[1] !== 'placeholder') {
                      // 有绑定变量，显示变量值
                      const variableName = match[1];

                      // 查找变量的实际值
                      const variable = variables.find((v: any) => {
                        const nameMatch = v.name && v.name === variableName;
                        const keyMatch = Object.prototype.hasOwnProperty.call(
                          v,
                          variableName,
                        );
                        return nameMatch || keyMatch;
                      });

                      if (variable) {
                        let variableValue;
                        if (variable.name && variable.value !== undefined) {
                          variableValue = variable.value;
                        } else {
                          variableValue = variable[variableName];
                        }

                        if (
                          typeof variableValue === 'string' ||
                          typeof variableValue === 'number'
                        ) {
                          displayText = String(variableValue);
                        } else {
                          displayText =
                            typeof textContent === 'string'
                              ? textContent
                              : `选项${optionIndex + 1}`; // 变量值不是简单类型，显示原始内容或默认文本
                        }
                      } else {
                        displayText =
                          typeof textContent === 'string'
                            ? textContent
                            : `选项${optionIndex + 1}`; // 变量未找到，显示原始内容或默认文本
                      }
                    } else {
                      // 没有绑定变量或是placeholder，显示原始内容（应该是指定模式的内容）
                      displayText =
                        typeof textContent === 'string'
                          ? textContent
                          : `选项${optionIndex + 1}`;
                    }
                  } else {
                    // 指定模式，显示指定文本
                    displayText =
                      typeof textContent === 'string'
                        ? textContent
                        : `选项${optionIndex + 1}`;
                  }
                }
              } else if (option.label) {
                displayText = option.label;
              }

              return (
                <Option
                  key={option.value || optionIndex}
                  value={option.value || ''}
                >
                  {displayText}
                </Option>
              );
            })}
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
      const isCurrentSelected = isSamePath(selectedPath || null, path);

      // 处理选项数据：支持变量绑定和静态选项
      const getMultiSelectOptions = () => {
        // 如果options是字符串且包含变量占位符，解析变量值
        if (typeof comp.options === 'string' && comp.options.includes('${')) {
          const variableMatch = comp.options.match(/\$\{([^}]+)\}/);
          if (
            variableMatch &&
            variableMatch[1] &&
            variableMatch[1] !== 'placeholder'
          ) {
            const variableName = variableMatch[1];
            console.log('🔍 下拉多选组件解析变量:', {
              componentId: comp.id,
              variableName,
              variablesCount: variables?.length || 0,
            });

            // 查找变量
            const variable = variables?.find((v: any) => {
              if (typeof v === 'object' && v !== null) {
                // 支持两种格式：{name, value} 和 {variableName: value}
                if (v.name && v.name === variableName) {
                  return true;
                }
                return Object.keys(v).some(
                  (key) => !key.startsWith('__') && key === variableName,
                );
              }
              return false;
            });

            if (variable) {
              let variableValue;
              if (variable.name && variable.value !== undefined) {
                // Variable格式：{name, value, type}
                variableValue = variable.value;
              } else {
                // VariableItem格式：{variableName: value}
                variableValue = variable[variableName];
              }

              console.log('✅ 找到下拉多选变量值:', {
                variableName,
                variableValue,
                valueType: typeof variableValue,
              });

              // 如果变量值是数组，直接使用
              if (Array.isArray(variableValue)) {
                return variableValue.map((item: any, index: number) => {
                  console.log('🔍 处理选项数组项:', { item, index });

                  if (typeof item === 'object' && item !== null) {
                    // 处理标准的选项对象格式：{text: {content: "..."}, value: "..."}
                    if (
                      item.text &&
                      typeof item.text === 'object' &&
                      item.text.content
                    ) {
                      return {
                        value: item.value || `option_${index}`,
                        text: {
                          content: item.text.content,
                          i18n_content: item.text.i18n_content,
                        },
                      };
                    }

                    // 兼容其他格式：{label: "...", value: "..."} 或 {text: "...", value: "..."}
                    const displayText =
                      item.label ||
                      item.text ||
                      item.name ||
                      `选项${index + 1}`;
                    return {
                      value: item.value || `option_${index}`,
                      text: {
                        content: displayText,
                      },
                    };
                  }

                  // 如果是字符串或其他类型，直接使用
                  return {
                    value: `option_${index}`,
                    text: {
                      content: String(item),
                    },
                  };
                });
              }
            }

            console.log('⚠️ 下拉多选变量未找到或格式不正确，使用默认选项');
            // 变量未找到或格式不正确，返回默认选项
            return [
              { value: 'option1', text: { content: '选项1' } },
              { value: 'option2', text: { content: '选项2' } },
            ];
          }
        }

        // 静态选项：确保是数组格式
        if (Array.isArray(comp.options)) {
          return comp.options;
        }

        // 默认选项
        return [
          { value: 'option1', text: { content: '选项1' } },
          { value: 'option2', text: { content: '选项2' } },
        ];
      };

      const multiSelectOptions = getMultiSelectOptions();

      const multiSelectContent = (
        <div
          style={{
            // marginBottom: '12px',
            border:
              isCurrentSelected && !isPreview
                ? '2px solid #1890ff'
                : '2px solid transparent',
            borderRadius: '6px',
            // padding: '8px',
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
          <Select
            mode="multiple"
            placeholder="请选择"
            style={{
              width: '250px',
              fontSize: '14px',
            }}
            // 画布中只允许下拉查看，不允许选中
            value={[]} // 始终保持空值，不显示任何选中状态
            onChange={() => {
              // 空的onChange处理，不允许选中任何选项
            }}
            onSelect={() => {
              // 阻止选中操作
              return false;
            }}
            onDeselect={() => {
              // 阻止取消选中操作
              return false;
            }}
          >
            {multiSelectOptions.map((option: any, optionIndex: number) => {
              // 安全地提取选项显示文本
              let displayText = `选项${optionIndex + 1}`;
              if (option.text) {
                if (typeof option.text === 'string') {
                  displayText = option.text;
                } else if (
                  typeof option.text === 'object' &&
                  option.text.content
                ) {
                  displayText =
                    typeof option.text.content === 'string'
                      ? option.text.content
                      : `选项${optionIndex + 1}`;
                }
              } else if (option.label) {
                displayText = option.label;
              }

              // 解析变量值以显示实际内容
              if (displayText && displayText.includes('${')) {
                console.log('🎨 画布变量解析开始:', { displayText });
                const variableMatch = displayText.match(/\$\{([^}]+)\}/);
                if (variableMatch && variableMatch[1]) {
                  const variableName = variableMatch[1];
                  console.log('🎨 画布提取变量名:', variableName);
                  console.log('🎨 画布所有变量:', variables);

                  // 查找变量
                  const variable = variables.find((v: any) => {
                    if (typeof v === 'object' && v !== null) {
                      const keys = Object.keys(v as Record<string, any>);
                      console.log('🎨 画布检查变量:', {
                        v,
                        keys,
                        variableName,
                      });
                      return keys.length > 0 && keys[0] === variableName;
                    }
                    return false;
                  });

                  console.log('🎨 画布找到变量:', variable);

                  if (variable && typeof variable === 'object') {
                    const variableValue = (variable as any)[variableName];
                    console.log('🎨 画布变量值:', {
                      variableName,
                      variableValue,
                    });
                    if (variableValue !== undefined && variableValue !== null) {
                      displayText = String(variableValue);
                      console.log('🎨 画布最终显示:', displayText);
                    } else {
                      // 如果找不到变量值，显示变量名（不带${}）
                      displayText = variableName;
                    }
                  } else {
                    // 如果找不到变量，显示变量名（不带${}）
                    displayText = variableName;
                  }
                }
              }

              return (
                <Option
                  key={option.value || optionIndex}
                  value={option.value || ''}
                >
                  {displayText}
                </Option>
              );
            })}
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
          {multiSelectContent}
        </DraggableWrapper>
      ) : (
        multiSelectContent
      );
    }

    case 'img_combination': {
      // 检查当前组件是否被选中
      const isCurrentSelected = isSamePath(selectedPath || null, path);

      // 解析多图混排的图片列表（支持变量绑定）
      const getImageList = () => {
        console.log('🖼️ 多图混排获取图片列表:', {
          componentId: comp.id,
          img_list: comp.img_list,
          img_list_type: typeof comp.img_list,
          isString: typeof comp.img_list === 'string',
          includesVariable:
            typeof comp.img_list === 'string' && comp.img_list.includes('${'),
          variablesCount: variables.length,
        });

        // 如果img_list是变量占位符格式，解析变量
        if (typeof comp.img_list === 'string' && comp.img_list.includes('${')) {
          const variableMatch = comp.img_list.match(/\$\{([^}]+)\}/);
          if (variableMatch && variableMatch[1]) {
            const variableName = variableMatch[1];
            console.log('🔍 从img_list提取变量名:', variableName);

            // 查找对应的变量
            const variable = variables.find((v) => {
              if (typeof v === 'object' && v !== null) {
                const keys = Object.keys(v as Record<string, any>);
                return keys.length > 0 && keys[0] === variableName;
              }
              return false;
            });

            console.log('🔍 找到变量:', { variableName, variable });

            if (variable) {
              const variableValue = (variable as Record<string, any>)[
                variableName
              ];
              console.log('🔍 变量值解析:', {
                variableName,
                variableValue,
                valueType: typeof variableValue,
                isArray: Array.isArray(variableValue),
              });

              // 解析变量值获取图片数组
              if (Array.isArray(variableValue) && variableValue.length > 0) {
                console.log('✅ 找到图片数组:', variableValue);
                return variableValue;
              } else {
                console.log('❌ 变量值不是有效的图片数组');
              }
            } else {
              console.log('❌ 没有找到对应的变量:', variableName);
            }
          }

          // 变量解析失败，返回空数组或默认图片
          console.log('🔙 变量解析失败，返回默认图片数组');
          return [];
        }

        // 如果img_list是普通数组，直接返回
        if (Array.isArray(comp.img_list)) {
          console.log('🔙 返回原始图片数组:', comp.img_list);
          return comp.img_list;
        }

        // 其他情况返回空数组
        console.log('🔙 返回空数组');
        return [];
      };

      const resolvedImageList = getImageList();

      const imgCombContent = (
        <div
          style={{
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
            width: '100%', // 确保宽度与父容器一致
            maxWidth: '100%', // 限制最大宽度
            overflow: 'hidden', // 防止内容溢出
          }}
        >
          <div
            style={{
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
              display: 'flex',
              flexWrap: comp.combination_mode === 'triple' ? 'nowrap' : 'wrap', // 三图模式不换行
              gap: '1px',
              width: '100%', // 确保宽度与父容器一致
              maxWidth: '100%', // 限制最大宽度
              alignItems:
                comp.combination_mode === 'triple' ? 'stretch' : 'flex-start', // 三图模式拉伸对齐
            }}
          >
            {/* 二图模式 */}
            {comp.combination_mode === 'double' && (
              <>
                <ImgRenderer
                  item={resolvedImageList?.[0]}
                  key="double-img-0"
                  style={{
                    width: '32.4%',
                    aspectRatio: '24 / 33',
                    maxWidth: '32.4%', // 限制最大宽度
                    flexShrink: 0, // 防止收缩
                  }}
                />
                <ImgRenderer
                  item={resolvedImageList?.[1]}
                  key="double-img-1"
                  style={{
                    width: 'calc(100% - 32.4% - 4px)',
                    aspectRatio: '49.33 / 33',
                    maxWidth: 'calc(100% - 32.4% - 4px)', // 限制最大宽度
                    flexShrink: 0, // 防止收缩
                  }}
                />
              </>
            )}

            {/* 三图模式 */}
            {comp.combination_mode === 'triple' && (
              <>
                <ImgRenderer
                  item={resolvedImageList?.[0]}
                  key="triple-img-0"
                  style={{
                    width: '66.5%',
                    aspectRatio: 1,
                    maxWidth: '66.5%', // 限制最大宽度
                    flexShrink: 0, // 防止收缩
                    flexBasis: '66.5%', // 设置基础宽度
                  }}
                />
                <div
                  style={{
                    width: '33%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    flexDirection: 'column',
                    maxWidth: '33%', // 限制最大宽度
                    flexShrink: 0, // 防止收缩
                    flexBasis: '33%', // 设置基础宽度
                    gap: '1px', // 添加间距
                  }}
                >
                  <ImgRenderer
                    item={resolvedImageList?.[1]}
                    key="triple-img-1"
                    style={{
                      aspectRatio: '1',
                      width: '100%', // 确保宽度与父容器一致
                      maxWidth: '100%', // 限制最大宽度
                      flex: '1', // 让两个小图平分高度
                    }}
                  />
                  <ImgRenderer
                    item={resolvedImageList?.[2]}
                    key="triple-img-2"
                    style={{
                      aspectRatio: '1',
                      width: '100%', // 确保宽度与父容器一致
                      maxWidth: '100%', // 限制最大宽度
                      flex: '1', // 让两个小图平分高度
                    }}
                  />
                </div>
              </>
            )}
            {/* 两列模式 */}
            {comp.combination_mode.includes('bisect') && (
              <>
                {(resolvedImageList || []).map(
                  (item: any, imgIndex: number) => (
                    <ImgRenderer
                      item={item}
                      key={`bisect-img-${imgIndex}-${item?.img_url || 'empty'}`}
                      style={{
                        width: 'calc(50% - 2px)',
                        aspectRatio: 1,
                        maxWidth: 'calc(50% - 2px)', // 限制最大宽度
                        flexShrink: 0, // 防止收缩
                      }}
                    />
                  ),
                )}
              </>
            )}
            {/* 三列模式 */}
            {comp.combination_mode.includes('trisect') && (
              <>
                {(resolvedImageList || []).map(
                  (item: any, imgIndex: number) => (
                    <ImgRenderer
                      item={item}
                      key={`trisect-img-${imgIndex}-${
                        item?.img_url || 'empty'
                      }`}
                      style={{
                        width: 'calc(33.33% - 2.67px)',
                        aspectRatio: 1,
                        maxWidth: 'calc(33.33% - 2.67px)', // 限制最大宽度
                        flexShrink: 0, // 防止收缩
                      }}
                    />
                  ),
                )}
              </>
            )}

            {resolvedImageList.length === 0 && (
              <div
                style={{
                  gridColumn: `span ${
                    comp.combination_mode === 'trisect' ||
                    comp.combination_mode.startsWith?.('trisect_')
                      ? 3
                      : comp.combination_mode === 'bisect' ||
                        comp.combination_mode.startsWith?.('bisect_')
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
      // 检查是否有headerData，没有则不渲染标题
      if (
        !headerData ||
        (!headerData.title?.content && !headerData.subtitle?.content)
      ) {
        return null;
      }

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
