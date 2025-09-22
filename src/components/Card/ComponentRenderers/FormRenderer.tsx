import React, { useRef } from 'react';
import { useDrop } from 'react-dnd';
import { DraggableWrapper } from '../Common/index';
import { ComponentType, DragItem } from '../type';
import { BaseRendererProps } from './types';
import { canDropInContainer, isContainerComponent, isSamePath } from './utils';

interface SmartDropZoneProps {
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
  onColumnSelect?: () => void;
  flexValue?: number;
}

const isParentChild = (
  parentPath: (string | number)[],
  childPath: (string | number)[],
): boolean => {
  if (parentPath.length >= childPath.length) return false;
  return parentPath.every((segment, index) => segment === childPath[index]);
};

const SmartDropZone: React.FC<SmartDropZoneProps> = ({
  targetPath,
  containerType,
  children,
  onContainerDrop,
  onComponentMove,
  childElements = [],
  onColumnSelect,
  flexValue,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [insertIndex, setInsertIndex] = React.useState<number>(0);

  const [{ isOver, canDrop, draggedItem }, drop] = useDrop({
    accept: ['component', 'existing-component', 'canvas-component'],
    canDrop: (item: DragItem) => {
      // 特殊处理标题组件 - 标题组件不能拖拽到容器中
      if (
        item.type === 'title' ||
        (item.component && item.component.tag === 'title')
      ) {
        return false;
      }

      // 子组件拖拽时的特殊处理
      if (item.isChildComponent) {
        if (item.path && isParentChild(item.path, targetPath)) {
          return false;
        }
        return canDropInContainer(item.component?.tag || item.type, targetPath);
      }

      // 检查是否可以在此容器中放置
      if (item.isNew) {
        return canDropInContainer(item.type, targetPath);
      } else if (item.component && item.path) {
        // 不能拖拽到自己的父容器中
        if (isParentChild(item.path, targetPath)) {
          return false;
        }

        // 检查是否是根节点组件拖拽到容器
        const isRootComponent =
          item.path.length === 4 &&
          item.path[0] === 'dsl' &&
          item.path[1] === 'body' &&
          item.path[2] === 'elements';

        if (
          !isRootComponent &&
          (containerType === 'column' || containerType === 'form')
        ) {
          // 分栏列和表单容器允许接受任何非容器组件的拖拽
          if (isContainerComponent(item.component?.tag || item.type)) {
            return false;
          }
          return true;
        } else if (!isRootComponent) {
          return false;
        }

        return canDropInContainer(item.component.tag, targetPath);
      }
      return false;
    },
    hover: (item: DragItem, monitor) => {
      if (!ref.current) return;

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;

      // 获取鼠标相对于容器的位置
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      const containerHeight = hoverBoundingRect.height;

      // 确定插入位置
      let currentInsertIndex = 0;

      // 如果容器为空，直接插入到内部
      if (childElements.length === 0) {
        currentInsertIndex = 0;
      } else {
        // 检查是否在容器的边缘区域
        const edgeThreshold = 20;

        if (hoverClientY <= edgeThreshold) {
          currentInsertIndex = 0;
        } else if (hoverClientY >= containerHeight - edgeThreshold) {
          currentInsertIndex = childElements.length;
        } else {
          // 在容器内部，根据鼠标位置确定插入位置
          const childHeight = containerHeight / childElements.length;
          const targetChildIndex = Math.floor(hoverClientY / childHeight);

          if (targetChildIndex < childElements.length) {
            const childTop = targetChildIndex * childHeight;
            const childMiddle = childTop + childHeight / 2;

            if (hoverClientY < childMiddle) {
              currentInsertIndex = targetChildIndex;
            } else {
              currentInsertIndex = targetChildIndex + 1;
            }
          } else {
            currentInsertIndex = childElements.length;
          }
        }
      }
      setInsertIndex(currentInsertIndex);
    },
    drop: (item: DragItem, monitor) => {
      if (monitor.didDrop()) return;

      if (item.isNew) {
        onContainerDrop?.(item, targetPath, insertIndex);
      } else if (item.component && item.path) {
        const draggedContainerPath = item.path.slice(0, -1);

        if (!isSamePath(draggedContainerPath, targetPath)) {
          if (!canDropInContainer(item.component.tag, targetPath)) {
            return;
          }

          const isRootComponent =
            item.path.length === 4 &&
            item.path[0] === 'dsl' &&
            item.path[1] === 'body' &&
            item.path[2] === 'elements';

          if (isRootComponent) {
            onContainerDrop?.(item, targetPath, insertIndex);
            return;
          }

          onComponentMove?.(item.component, item.path, targetPath, insertIndex);
        } else {
          if (!canDropInContainer(item.component.tag, targetPath)) {
            return;
          }
          onComponentMove?.(item.component, item.path, targetPath, insertIndex);
        }
      }

      setInsertIndex(0);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
      draggedItem: monitor.getItem(),
    }),
  });

  const hasContent = children && React.Children.count(children) > 0;

  const dropZoneStyle: React.CSSProperties = {
    minHeight: hasContent ? 'auto' : containerType === 'form' ? '60px' : '50px',
    borderRadius: '0',
    position: 'relative',
    transition: 'all 0.15s ease',
    flex: containerType === 'column' ? flexValue || 1 : 'none',
    pointerEvents: 'auto',
    boxShadow: isOver && canDrop ? '0 0 8px rgba(24, 144, 255, 0.4)' : 'none',
    width: '100%',
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    // 立即阻止事件冒泡，防止触发父级组件的选中
    e.stopPropagation();
    e.preventDefault();

    if (containerType === 'column') {
      if (onColumnSelect) {
        onColumnSelect();
      }
      return;
    }

    // 对于其他容器类型，确保只在点击容器本身时处理
    if (e.target === e.currentTarget) {
      // 事件冒泡已经在上面被阻止了
    }
  };

  return (
    <div ref={drop} style={dropZoneStyle} onClick={handleContainerClick}>
      {/* 内容区域 */}
      {hasContent ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: containerType === 'form' ? '12px' : '8px',
            pointerEvents: 'none',
          }}
        >
          <div style={{ pointerEvents: 'auto' }}>{children}</div>
        </div>
      ) : (
        <div
          style={{ minHeight: containerType === 'form' ? '60px' : '60px' }}
        />
      )}

      {/* 拖拽悬停提示 */}
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
          {draggedItem?.isChildComponent
            ? '释放以移动到表单'
            : '释放以添加到表单'}
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
            transition: 'opacity 0.1s ease',
          }}
        >
          ❌ 不能移动到这里
        </div>
      )}
    </div>
  );
};

// 表单容器渲染器
const FormRenderer: React.FC<BaseRendererProps> = (props) => {
  const {
    component,
    isPreview,
    enableDrag,
    renderChildren,
    path = [],
    selectedPath,
  } = props;
  const comp = component as any;
  const formElements = comp.elements || [];
  const formPath = [...path, 'elements'];

  // 检查当前表单容器是否被选中
  const isCurrentSelected = selectedPath && isSamePath(selectedPath, path);

  // 使用外部传入的渲染函数或内部函数
  const internalRenderChildren = (
    elements: ComponentType[],
    basePath: (string | number)[],
  ) => {
    return elements.map((element, elementIndex) => {
      const childPath = [...basePath, elementIndex];

      if (renderChildren) {
        return renderChildren([element], childPath)[0];
      }

      // 这里应该递归调用主渲染器，但为了避免循环依赖，我们先返回简单内容
      return <div key={elementIndex}>Component: {element.tag}</div>;
    });
  };

  const renderChildElements = renderChildren || internalRenderChildren;

  const formContent = (
    <div
      style={{
        borderWidth: '2px',
        borderStyle: 'solid',
        borderColor: isCurrentSelected && !isPreview ? '#1890ff' : '#e8e8e8',
        borderRadius: '6px',
        backgroundColor:
          isCurrentSelected && !isPreview
            ? 'rgba(24, 144, 255, 0.02)'
            : '#fafafa',
        transition: 'all 0.2s ease',
        position: 'relative',
        minHeight: '100px',
        padding: '8px',
        boxShadow:
          isCurrentSelected && !isPreview
            ? '0 0 8px rgba(24, 144, 255, 0.3)'
            : '0 1px 3px rgba(0, 0, 0, 0.1)',
      }}
      onClick={(e) => {
        // 立即阻止事件冒泡，防止触发父级组件的选中
        e.stopPropagation();
        e.preventDefault();

        // 点击表单容器本身时选中表单容器
        if (e.target === e.currentTarget && props.onSelect) {
          props.onSelect(component, path);
        }
      }}
    >
      <SmartDropZone
        targetPath={formPath}
        containerType="form"
        onContainerDrop={props.onContainerDrop}
        onComponentMove={props.onComponentMove}
        childElements={formElements}
      >
        {formElements.length > 0 ? (
          renderChildElements(formElements, formPath)
        ) : (
          <div
            style={{
              textAlign: 'center',
              color: '#999',
              fontSize: '14px',
              padding: '20px',
              borderWidth: '1px',
              borderStyle: 'dashed',
              borderColor: '#d9d9d9',
              borderRadius: '4px',
              backgroundColor: '#fff',
            }}
          >
            拖拽组件到此处构建表单
          </div>
        )}
      </SmartDropZone>
    </div>
  );

  return enableDrag && !isPreview ? (
    <DraggableWrapper
      component={component}
      path={path}
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
      {formContent}
    </DraggableWrapper>
  ) : (
    formContent
  );
};

export default FormRenderer;
