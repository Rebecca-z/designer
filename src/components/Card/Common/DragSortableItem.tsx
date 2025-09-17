import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { ComponentType } from '../type';

// 拖拽排序包装器组件
const DragSortableItem: React.FC<{
  component: ComponentType;
  index: number;
  path: (string | number)[];
  onMove: (dragIndex: number, hoverIndex: number) => void;
  children: React.ReactNode;
  onClearSelection?: () => void; // 新增：清除选中状态的回调
}> = React.memo(
  ({ component, index, path, onMove, children, onClearSelection }) => {
    const ref = useRef<HTMLDivElement>(null);
    // 添加防抖和缓存机制
    const lastHoverState = useRef<{
      position: 'before' | 'after' | null;
      targetIndex: number;
      dragIndex: number;
      hoverIndex: number;
    } | null>(null);

    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [{ handlerId }, drop] = useDrop({
      accept: ['canvas-component'],
      collect(monitor) {
        return {
          handlerId: monitor.getHandlerId(),
          isOver: monitor.isOver(),
        };
      },
      drop() {
        // 清除插入位置状态
        lastHoverState.current = null; // 清理缓存状态
      },
      hover(item: any, monitor) {
        if (!ref.current) {
          return;
        }

        // 清除之前的防抖定时器
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
        }

        // 使用防抖机制，延迟处理hover事件
        hoverTimeoutRef.current = setTimeout(() => {
          const dragIndex = item.index;
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

          // 避免无意义的移动
          // 检查是否是真正的移动操作
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

          // 1. 标题组件不能移动到非标题组件的位置
          if (
            draggedComponent.tag === 'title' &&
            hoverComponent.tag !== 'title'
          ) {
            return;
          }

          // 2. 非标题组件不能移动到标题组件的位置（第一位）
          if (
            draggedComponent.tag !== 'title' &&
            hoverComponent.tag === 'title'
          ) {
            return;
          }

          // 3. 不能将非标题组件插入到标题组件之前
          if (
            hoverComponent.tag === 'title' &&
            draggedComponent.tag !== 'title' &&
            currentInsertPosition === 'before'
          ) {
            return;
          }
          onMove(dragIndex, targetIndex);

          const newIndex =
            targetIndex > dragIndex ? targetIndex - 1 : targetIndex;
          item.index = newIndex;

          if (
            item.path &&
            item.path.length === 4 &&
            item.path[2] === 'elements'
          ) {
            item.path = [...item.path.slice(0, 3), newIndex];
          }
        }, 50); // 50ms防抖延迟
      },
    });

    // 清理定时器
    React.useEffect(() => {
      return () => {
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
        }
      };
    }, []);

    const [{ isDragging }, drag] = useDrag({
      type: 'canvas-component',
      item: () => {
        // 拖拽开始时清除选中状态
        if (onClearSelection) {
          onClearSelection();
        }

        return {
          type: component.tag,
          component,
          index,
          path,
          isNew: false,
        };
      },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
      canDrag: () => {
        const canDrag = component.tag !== 'title';
        return canDrag;
      },
    });

    const opacity = isDragging ? 0.4 : 1;
    drag(drop(ref));

    const handleDragSortableClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
    };

    return (
      <div
        ref={ref}
        style={{
          opacity,
          position: 'relative',
          transition: 'all 0.15s ease',
          cursor: component.tag === 'title' ? 'default' : 'grab',
        }}
        data-handler-id={handlerId}
        onClick={handleDragSortableClick}
        data-drag-sortable-item="true"
      >
        {children}
      </div>
    );
  },
);

export default DragSortableItem;
