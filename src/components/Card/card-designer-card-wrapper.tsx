// card-designer-card-wrapper.tsx - 会话卡片包装器组件

import { PlusOutlined } from '@ant-design/icons';
import { message } from 'antd';
import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import ComponentRenderer from './card-designer-components';
import {
  CardPadding,
  ComponentType,
  DragItem,
} from './card-designer-types-updated';
import { createDefaultComponent } from './card-designer-utils';
import ErrorBoundary from './ErrorBoundary';

// 拖拽排序包装器组件
const DragSortableItem: React.FC<{
  component: ComponentType;
  index: number;
  path: (string | number)[];
  onMove: (dragIndex: number, hoverIndex: number) => void;
  children: React.ReactNode;
}> = ({ component, index, path, onMove, children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [insertPosition, setInsertPosition] = React.useState<
    'before' | 'after' | null
  >(null);

  // 添加防抖和缓存机制
  const lastHoverState = useRef<{
    position: 'before' | 'after' | null;
    targetIndex: number;
    dragIndex: number;
    hoverIndex: number;
  } | null>(null);

  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [{ handlerId, isOver }, drop] = useDrop({
    accept: ['canvas-component'],
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
        isOver: monitor.isOver(),
      };
    },
    drop() {
      // 清除插入位置状态
      setInsertPosition(null);
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

        console.log('🎯 插入式拖拽检测:', {
          dragIndex,
          hoverIndex,
          hoverClientY,
          hoverMiddleY,
          insertPosition: currentInsertPosition,
          targetIndex,
          draggedComponent: draggedComponent.tag,
          hoverComponent: hoverComponent.tag,
          willProceed: 'checking...',
        });

        // 更新插入位置状态，用于显示指示线
        setInsertPosition(currentInsertPosition);

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

        // 特殊处理标题组件的拖拽限制

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

        // 执行插入式移动
        console.log('✅ 执行插入式移动:', {
          from: dragIndex,
          insertAt: targetIndex,
          insertPosition: currentInsertPosition,
          draggedComponent: draggedComponent.tag,
          hoverComponent: hoverComponent.tag,
        });

        onMove(dragIndex, targetIndex);

        // 注意：这里我们修改了监视器项目，因为我们在移动时修改了索引
        // 一般来说，最好避免修改监视器项目，但这里是为了性能考虑
        // 对于插入式移动，需要调整索引
        item.index = targetIndex > dragIndex ? targetIndex - 1 : targetIndex;
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
      console.log('🟢 DragSortableItem 开始拖拽:', {
        tag: component.tag,
        index,
        componentId: component.id,
      });
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
      console.log('🎯 DragSortableItem canDrag 检查:', {
        componentTag: component.tag,
        canDrag,
      });
      return canDrag;
    },
  });

  const opacity = isDragging ? 0.4 : 1;
  drag(drop(ref));

  const handleDragSortableClick = (e: React.MouseEvent) => {
    // 阻止事件冒泡到卡片容器，避免触发卡片选中
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
      }}
      data-handler-id={handlerId}
      onClick={handleDragSortableClick}
      data-drag-sortable-item="true"
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

      {/* 标题组件不可拖拽提示 */}
      {component.tag === 'title' && (
        <div
          style={{
            position: 'absolute',
            top: '-2px',
            right: '8px',
            backgroundColor: '#fa8c16',
            color: 'white',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: 'bold',
            zIndex: 10,
          }}
        >
          📌 固定顶部
        </div>
      )}

      {children}
    </div>
  );
};

interface CardWrapperProps {
  elements: ComponentType[];
  verticalSpacing: number;
  padding: CardPadding;
  selectedPath: (string | number)[] | null;
  hoveredPath: (string | number)[] | null;
  onElementsChange: (elements: ComponentType[]) => void;
  onSelectComponent: (
    component: ComponentType | null,
    path?: (string | number)[],
  ) => void;
  onDeleteComponent: (path: (string | number)[]) => void;
  onCopyComponent: (component: ComponentType) => void;
  onCanvasFocus: () => void;
  isCardSelected: boolean;
  onCardSelect: () => void;
}

const CardWrapper: React.FC<CardWrapperProps> = ({
  elements,
  verticalSpacing,
  padding,
  selectedPath,
  hoveredPath,
  onElementsChange,
  onSelectComponent,
  onDeleteComponent,
  onCopyComponent,
  onCanvasFocus,
  isCardSelected,
  onCardSelect,
}) => {
  console.warn('elements', elements);

  // 工具函数：检查画布中是否已存在标题组件
  const hasExistingTitle = (elements: ComponentType[]): boolean => {
    return elements.some((component) => component.tag === 'title');
  };

  // 验证并修正路径，确保索引在有效范围内
  const validateAndCorrectPath = (
    elements: ComponentType[],
    path: (string | number)[],
  ): (string | number)[] => {
    const newPath = [...path];

    // 验证路径前缀
    if (
      newPath.length < 3 ||
      newPath[0] !== 'dsl' ||
      newPath[1] !== 'body' ||
      newPath[2] !== 'elements'
    ) {
      console.warn('⚠️ 路径前缀无效，返回原始路径');
      return path;
    }

    // 检查根级别索引
    if (newPath.length >= 4 && typeof newPath[3] === 'number') {
      const rootIndex = newPath[3] as number;
      if (rootIndex >= elements.length) {
        console.warn(
          `⚠️ 根级别索引 ${rootIndex} 超出范围，调整为 ${elements.length - 1}`,
        );
        newPath[3] = Math.max(0, elements.length - 1);
      }
    }

    // 检查分栏索引
    if (
      newPath.length >= 6 &&
      newPath[4] === 'columns' &&
      typeof newPath[5] === 'number'
    ) {
      const rootIndex = newPath[3] as number;
      const columnIndex = newPath[5] as number;

      if (rootIndex < elements.length) {
        const rootComponent = elements[rootIndex];
        if (
          rootComponent &&
          rootComponent.tag === 'column_set' &&
          rootComponent.columns
        ) {
          const columns = rootComponent.columns;
          if (columnIndex >= columns.length) {
            console.warn(
              `⚠️ 分栏索引 ${columnIndex} 超出范围，调整为 ${
                columns.length - 1
              }`,
            );
            newPath[5] = Math.max(0, columns.length - 1);
          }
        }
      }
    }

    return newPath;
  };

  // 工具函数：将标题组件插入到数组开头
  const insertTitleAtTop = (
    elements: ComponentType[],
    titleComponent: ComponentType,
  ): ComponentType[] => {
    // 移除现有的标题组件（如果存在）
    const elementsWithoutTitle = elements.filter(
      (component) => component.tag !== 'title',
    );
    // 将标题组件插入到开头
    return [titleComponent, ...elementsWithoutTitle];
  };

  // 检查路径是否指向同一个组件
  const isSamePath = (
    path1: (string | number)[] | null,
    path2: (string | number)[],
  ): boolean => {
    if (!path1) return false;
    return JSON.stringify(path1) === JSON.stringify(path2);
  };

  // 根据路径获取elements数组的辅助函数
  const getElementsArrayByPath = (
    elements: ComponentType[],
    path: (string | number)[],
  ): ComponentType[] | null => {
    let current: any = elements;

    console.log('🔍 getElementsArrayByPath 开始解析:', {
      path,
      elementsLength: elements.length,
    });

    // 检查路径是否以 ['dsl', 'body', 'elements'] 开头
    const isStandardPath =
      path.length >= 3 &&
      path[0] === 'dsl' &&
      path[1] === 'body' &&
      path[2] === 'elements';

    // 根据路径格式决定起始索引
    const startIndex = isStandardPath ? 3 : 0;

    console.log('🔍 路径格式分析:', {
      isStandardPath,
      startIndex,
      pathPrefix: isStandardPath ? path.slice(0, 3) : '从根级别开始',
    });

    for (let i = startIndex; i < path.length; i++) {
      const key = path[i];
      const nextKey = path[i + 1];
      console.log(`🔍 路径解析步骤 ${i}:`, {
        key,
        keyType: typeof key,
        currentType: current ? typeof current : 'undefined',
        isArray: Array.isArray(current),
        hasElements: current && current.elements ? 'yes' : 'no',
        currentKeys:
          current && typeof current === 'object' ? Object.keys(current) : 'N/A',
        nextKey,
      });

      if (key === 'elements') {
        // 1. 如果已经到达最后，直接返回
        if (i === path.length - 1) {
          if (Array.isArray(current)) return current;
          if (current && Array.isArray(current.elements))
            return current.elements;
          return null;
        }
        // 2. 如果下一个key不是数字，说明已经到达目标数组
        if (typeof nextKey !== 'number') {
          if (Array.isArray(current)) return current;
          if (current && Array.isArray(current.elements))
            return current.elements;
          return null;
        }
        // 3. 否则继续导航
        if (Array.isArray(current) && current[nextKey]) {
          current = current[nextKey];
          i++;
          continue;
        }
        if (
          current &&
          Array.isArray(current.elements) &&
          current.elements[nextKey]
        ) {
          current = current.elements[nextKey];
          i++;
          continue;
        }
        console.error('❌ 无效的elements数组索引导航:', {
          current: current ? 'exists' : 'undefined',
          isArray: Array.isArray(current),
          hasElements: current && current.elements ? 'yes' : 'no',
          nextKey,
          arrayLength: Array.isArray(current) ? current.length : 'N/A',
          elementsArrayLength:
            current && current.elements && Array.isArray(current.elements)
              ? current.elements.length
              : 'N/A',
        });
        return null;
      } else if (key === 'columns') {
        const columnIndex = path[i + 1] as number;
        if (
          current &&
          current.tag === 'column_set' &&
          current.columns &&
          Array.isArray(current.columns) &&
          current.columns[columnIndex] &&
          current.columns[columnIndex].elements
        ) {
          current = current.columns[columnIndex].elements;
          i += 2; // 跳过下两个索引
          console.log(
            `✅ 导航到分栏 ${columnIndex} 的elements:`,
            current.length,
          );
        } else {
          console.error('❌ 尝试在非分栏组件上访问columns:', {
            currentTag: current ? current.tag : 'undefined',
            currentId: current ? current.id : 'undefined',
            columnIndex,
            expectedTag: 'column_set',
            hasColumns: current && current.columns ? 'yes' : 'no',
            targetColumnExists:
              current && current.columns && current.columns[columnIndex]
                ? 'yes'
                : 'no',
          });
          return null;
        }
      } else if (typeof key === 'number') {
        if (current && Array.isArray(current) && current[key]) {
          current = current[key];
          console.log(`✅ 导航到数组索引 ${key}:`, {
            nextComponent: current
              ? { id: current.id, tag: current.tag }
              : 'undefined',
          });
        } else {
          console.error('❌ 无效的数字索引导航:', {
            current: current ? 'exists' : 'undefined',
            isArray: Array.isArray(current),
            key,
            arrayLength: Array.isArray(current) ? current.length : 'N/A',
          });
          return null;
        }
      } else {
        if (current && current[key] !== undefined) {
          current = current[key];
          console.log(`✅ 导航到属性 ${key}:`, {
            nextValue: current
              ? typeof current === 'object'
                ? { id: current.id, tag: current.tag }
                : current
              : 'undefined',
          });
        } else {
          console.error('❌ 无效的属性导航:', {
            current: current ? 'exists' : 'undefined',
            key,
            availableKeys:
              current && typeof current === 'object'
                ? Object.keys(current)
                : 'N/A',
          });
          return null;
        }
      }
    }

    console.log('❌ 路径解析完成但未找到目标:', {
      finalCurrent: current
        ? Array.isArray(current)
          ? `array(${current.length})`
          : typeof current
        : 'undefined',
    });
    return null;
  };

  // 根据路径添加组件到指定位置
  const addComponentByPath = (
    elements: ComponentType[],
    path: (string | number)[],
    newComponent: ComponentType,
    insertIndex?: number,
  ): ComponentType[] => {
    const newElements = [...elements];
    let current: any = newElements;

    console.log('🎯 添加组件到路径:', {
      path,
      pathLength: path.length,
      pathDetails: path.map((item, index) => ({
        index,
        item,
        type: typeof item,
      })),
      newComponent: { id: newComponent.id, tag: newComponent.tag },
      insertIndex,
    });

    // 如果是根级别（直接添加到卡片）
    if (path.length === 3 && path[2] === 'elements') {
      if (insertIndex !== undefined) {
        newElements.splice(insertIndex, 0, newComponent);
      } else {
        newElements.push(newComponent);
      }
      console.log('✅ 根级别组件添加成功:', {
        componentId: newComponent.id,
        componentTag: newComponent.tag,
        insertIndex,
        finalLength: newElements.length,
      });
      return newElements;
    }

    // 导航到目标容器
    for (let i = 3; i < path.length; i++) {
      const key = path[i];

      console.log(`🔍 路径导航步骤 ${i}:`, {
        key,
        keyType: typeof key,
        currentType: current ? typeof current : 'undefined',
        isArray: Array.isArray(current),
        currentKeys:
          current && typeof current === 'object' ? Object.keys(current) : 'N/A',
        currentLength: Array.isArray(current) ? current.length : 'N/A',
        pathSegment: path.slice(i, i + 3), // 显示当前和接下来的几个路径段
        currentState: current
          ? {
              tag: current.tag || 'no tag',
              id: current.id || 'no id',
              hasElements: current.elements ? 'yes' : 'no',
              hasColumns: current.columns ? 'yes' : 'no',
            }
          : 'null/undefined',
      });

      if (key === 'elements') {
        // 检查是否是最后一个 elements（目标位置）
        if (i === path.length - 1) {
          // 这是目标elements数组，在这里插入组件
          // 如果current是组件对象，需要访问它的elements属性
          let targetArray;
          if (current && Array.isArray(current)) {
            targetArray = current;
          } else if (
            current &&
            current.elements &&
            Array.isArray(current.elements)
          ) {
            targetArray = current.elements;
          } else {
            console.error('❌ 添加组件失败：目标不是有效的elements数组', {
              path,
              currentIndex: i,
              key,
              current: current ? 'exists' : 'undefined',
              isArray: Array.isArray(current),
              hasElements: current && current.elements ? 'yes' : 'no',
              elementsIsArray:
                current && current.elements
                  ? Array.isArray(current.elements)
                  : 'N/A',
            });
            return elements; // 返回原始数组，不做修改
          }

          if (insertIndex !== undefined) {
            targetArray.splice(insertIndex, 0, newComponent);
          } else {
            targetArray.push(newComponent);
          }

          console.log('✅ 组件添加成功 (指定位置):', {
            componentId: newComponent.id,
            componentTag: newComponent.tag,
            insertIndex,
            arrayLength: targetArray.length,
            targetPath: path,
          });
          return newElements;
        } else {
          // 这是中间的elements，需要继续导航
          // 下一个应该是数组索引
          const nextIndex = path[i + 1];

          // 检查下一个是否是数字索引
          if (typeof nextIndex === 'number') {
            if (
              current &&
              Array.isArray(current) &&
              nextIndex >= 0 &&
              nextIndex < current.length
            ) {
              current = current[nextIndex];
              i++; // 跳过下一个索引
              console.log(`✅ 导航到数组索引 ${nextIndex}:`, {
                nextComponent: current
                  ? { id: current.id, tag: current.tag }
                  : 'undefined',
              });
            } else {
              console.error('❌ 添加组件失败：无效的elements数组索引', {
                path,
                currentIndex: i,
                key,
                nextIndex,
                current: current ? 'exists' : 'undefined',
                isArray: Array.isArray(current),
                arrayLength: Array.isArray(current) ? current.length : 'N/A',
                validRange: Array.isArray(current)
                  ? `0-${current.length - 1}`
                  : 'N/A',
              });

              // 尝试恢复：如果索引超出范围，使用最后一个有效索引
              if (Array.isArray(current) && current.length > 0) {
                const fallbackIndex = current.length - 1;
                console.warn(`⚠️ 尝试使用回退索引: ${fallbackIndex}`);
                current = current[fallbackIndex];
                i++; // 跳过下一个索引
                console.log(`✅ 使用回退索引 ${fallbackIndex}:`, {
                  nextComponent: current
                    ? { id: current.id, tag: current.tag }
                    : 'undefined',
                });
              } else {
                return elements; // 返回原始数组，不做修改
              }
            }
          } else if (nextIndex === 'elements') {
            // 如果下一个也是 'elements'，说明这是表单容器的结构
            // 当前current应该是表单组件对象，需要访问其elements属性
            if (
              current &&
              current.elements &&
              Array.isArray(current.elements)
            ) {
              current = current.elements;
              i++; // 跳过下一个 'elements'
              console.log('✅ 导航到表单组件的elements数组:', {
                componentTag: current.tag || 'unknown',
                elementsLength: current.length,
              });
            } else {
              console.error('❌ 添加组件失败：表单组件没有elements数组', {
                path,
                currentIndex: i,
                key,
                nextIndex,
                current: current ? 'exists' : 'undefined',
                hasElements: current && current.elements ? 'yes' : 'no',
                currentTag: current ? current.tag : 'undefined',
              });
              return elements; // 返回原始数组，不做修改
            }
          } else {
            // 如果下一个不是数字也不是 'elements'，说明这是目标elements数组
            // 检查current是否是组件对象，需要访问其elements属性
            if (
              current &&
              current.elements &&
              Array.isArray(current.elements)
            ) {
              current = current.elements;
              console.log('✅ 导航到组件对象的elements数组:', {
                componentTag: current.tag || 'unknown',
                elementsLength: current.length,
              });
            } else {
              console.error('❌ 添加组件失败：无法找到elements数组', {
                path,
                currentIndex: i,
                key,
                nextIndex,
                current: current ? 'exists' : 'undefined',
                hasElements: current && current.elements ? 'yes' : 'no',
              });
              return elements; // 返回原始数组，不做修改
            }
          }
        }
      } else if (key === 'columns') {
        const columnIndex = path[i + 1] as number;
        if (
          current &&
          current.tag === 'column_set' &&
          current.columns &&
          Array.isArray(current.columns) &&
          current.columns[columnIndex] &&
          current.columns[columnIndex].elements
        ) {
          current = current.columns[columnIndex].elements;
          i += 2; // 跳过下两个索引
          console.log(
            `✅ 导航到分栏 ${columnIndex} 的elements:`,
            current.length,
          );
        } else {
          console.error('❌ 尝试在非分栏组件上访问columns:', {
            currentTag: current ? current.tag : 'undefined',
            currentId: current ? current.id : 'undefined',
            columnIndex,
            expectedTag: 'column_set',
            hasColumns: current && current.columns ? 'yes' : 'no',
            columnsLength:
              current && current.columns ? current.columns.length : 0,
            targetColumnExists:
              current && current.columns && current.columns[columnIndex]
                ? 'yes'
                : 'no',
          });
          return elements; // 返回原始数组，不做修改
        }
      } else if (typeof key === 'number') {
        if (
          current &&
          Array.isArray(current) &&
          key >= 0 &&
          key < current.length
        ) {
          current = current[key];
          console.log(`✅ 导航到数组索引 ${key}:`, {
            nextComponent: current
              ? { id: current.id, tag: current.tag }
              : 'undefined',
          });
        } else {
          console.error('❌ 添加组件失败：无效的数组索引', {
            path,
            currentIndex: i,
            key,
            current: current ? 'exists' : 'undefined',
            isArray: Array.isArray(current),
            arrayLength: Array.isArray(current) ? current.length : 'N/A',
            validRange: Array.isArray(current)
              ? `0-${current.length - 1}`
              : 'N/A',
          });

          // 尝试恢复：如果索引超出范围，使用最后一个有效索引
          if (Array.isArray(current) && current.length > 0) {
            const fallbackIndex = current.length - 1;
            console.warn(`⚠️ 尝试使用回退索引: ${fallbackIndex}`);
            current = current[fallbackIndex];
            console.log(`✅ 使用回退索引 ${fallbackIndex}:`, {
              nextComponent: current
                ? { id: current.id, tag: current.tag }
                : 'undefined',
            });
          } else {
            return elements; // 返回原始数组，不做修改
          }
        }
      } else {
        if (current && current[key] !== undefined) {
          current = current[key];

          // 如果导航到了一个对象的elements属性，需要检查下一步
          if (key === 'elements' && current && Array.isArray(current)) {
            // 已经到达了elements数组，继续处理
            console.log('✅ 导航到elements数组:', {
              elementsLength: current.length,
            });
            continue;
          }
        } else {
          console.error('❌ 添加组件失败：无效的属性路径', {
            path,
            currentIndex: i,
            key,
            current: current ? 'exists' : 'undefined',
            availableKeys:
              current && typeof current === 'object'
                ? Object.keys(current)
                : 'N/A',
          });
          return elements; // 返回原始数组，不做修改
        }
      }
    }

    // 如果执行到这里，说明已经成功导航到目标位置
    // current应该指向目标数组
    if (Array.isArray(current)) {
      if (insertIndex !== undefined) {
        current.splice(insertIndex, 0, newComponent);
        console.log('✅ 组件添加成功 (指定位置):', {
          componentId: newComponent.id,
          componentTag: newComponent.tag,
          insertIndex,
          arrayLength: current.length,
          targetPath: path,
        });
      } else {
        current.push(newComponent);
        console.log('✅ 组件添加成功 (末尾):', {
          componentId: newComponent.id,
          componentTag: newComponent.tag,
          arrayLength: current.length,
          targetPath: path,
        });
      }
    } else {
      console.error('❌ 添加组件失败：最终目标不是数组', {
        path,
        current: current
          ? {
              type: typeof current,
              tag: current.tag || 'no tag',
              keys: Object.keys(current),
            }
          : 'null/undefined',
      });
      return elements;
    }

    return newElements;
  };

  // 根据路径移除组件
  const removeComponentByPath = (
    elements: ComponentType[],
    path: (string | number)[],
  ): ComponentType[] => {
    const newElements = [...elements];

    console.log('🗑️ 从路径移除组件:', {
      path,
      pathLength: path.length,
      pathDetails: path.map((item, index) => ({
        index,
        item,
        type: typeof item,
      })),
    });

    // 根级别组件移除
    if (path.length === 4 && path[2] === 'elements') {
      const index = path[3] as number;
      console.log('✅ 根级别组件移除:', {
        index,
        componentToRemove: newElements[index]
          ? { id: newElements[index].id, tag: newElements[index].tag }
          : 'undefined',
        arrayLength: newElements.length,
        beforeRemove: newElements.map((el, idx) => ({
          index: idx,
          id: el.id,
          tag: el.tag,
        })),
      });

      if (index >= 0 && index < newElements.length) {
        newElements.splice(index, 1);
        console.log('✅ 根级别组件移除成功:', {
          removedIndex: index,
          newArrayLength: newElements.length,
          afterRemove: newElements.map((el, idx) => ({
            index: idx,
            id: el.id,
            tag: el.tag,
          })),
        });
      } else {
        console.error('❌ 根级别组件移除失败：索引无效', {
          index,
          arrayLength: newElements.length,
        });
      }
      return newElements;
    }

    // 递归辅助函数，支持 columns 嵌套
    function recursiveRemove(
      target: any,
      p: (string | number)[],
      depth: number,
    ): boolean {
      if (!target || p.length === 0) return false;
      if (p.length === 1 && typeof p[0] === 'number' && Array.isArray(target)) {
        // 到达目标数组
        const idx = p[0] as number;
        if (idx >= 0 && idx < target.length) {
          console.log('✅ 递归移除目标:', {
            idx,
            id: target[idx]?.id,
            tag: target[idx]?.tag,
            depth,
          });
          target.splice(idx, 1);
          return true;
        } else {
          console.error('❌ 递归移除失败，索引无效', {
            idx,
            arrLen: target.length,
            depth,
          });
          return false;
        }
      }
      // 递归进入
      const key = p[0];
      if (key === 'elements' && Array.isArray(target.elements)) {
        return recursiveRemove(target.elements, p.slice(1), depth + 1);
      }
      if (key === 'columns' && Array.isArray(target.columns)) {
        const colIdx = p[1] as number;
        if (colIdx >= 0 && colIdx < target.columns.length) {
          return recursiveRemove(target.columns[colIdx], p.slice(2), depth + 1);
        } else {
          console.error('❌ 递归移除失败，columns索引无效', {
            colIdx,
            columnsLen: target.columns.length,
            depth,
          });
          return false;
        }
      }
      if (typeof key === 'number' && Array.isArray(target)) {
        return recursiveRemove(target[key], p.slice(1), depth + 1);
      }
      // 兜底
      if (target[key] !== undefined) {
        return recursiveRemove(target[key], p.slice(1), depth + 1);
      }
      console.error('❌ 递归移除失败，路径无效', { key, depth, target });
      return false;
    }

    const ok = recursiveRemove(newElements, path.slice(3), 0);
    if (!ok) {
      console.error('❌ removeComponentByPath 递归移除失败', { path });
    }
    return newElements;
  };

  // 处理容器拖拽
  const handleContainerDrop = (
    draggedItem: DragItem,
    targetPath: (string | number)[],
    dropIndex?: number,
  ) => {
    console.log('🎯 处理容器拖拽:', {
      draggedItem: { type: draggedItem.type, isNew: draggedItem.isNew },
      targetPath,
      dropIndex,
    });

    // 特殊处理标题组件
    if (
      draggedItem.type === 'title' ||
      (draggedItem.component && draggedItem.component.tag === 'title')
    ) {
      // 标题组件只能在画布根节点显示
      const isRootLevel =
        targetPath.length === 3 &&
        targetPath[0] === 'dsl' &&
        targetPath[1] === 'body' &&
        targetPath[2] === 'elements';

      if (!isRootLevel) {
        message.warning('标题组件只能放置在画布根节点的最上方');
        return;
      }

      // 检查是否已存在标题组件
      if (hasExistingTitle(elements)) {
        message.warning('画布中已存在标题组件，每个画布只能有一个标题组件');
        return;
      }
    }

    if (draggedItem.isNew) {
      // 新组件
      const newComponent = createDefaultComponent(draggedItem.type);

      console.log('🆕 创建新组件:', {
        componentType: draggedItem.type,
        componentId: newComponent.id,
        targetPath,
        dropIndex,
        pathAnalysis: {
          isRoot: targetPath.length === 3 && targetPath[2] === 'elements',
          isForm: targetPath.includes('elements') && targetPath.length > 3,
          isColumn: targetPath.includes('columns'),
        },
      });

      // 如果是标题组件，强制放置在最顶部
      if (draggedItem.type === 'title') {
        onElementsChange(insertTitleAtTop(elements, newComponent));
        message.success('标题组件已添加到画布顶部');
        return;
      }

      const newElements = addComponentByPath(
        elements,
        targetPath,
        newComponent,
        dropIndex,
      );
      onElementsChange(newElements);
    } else if (draggedItem.component && draggedItem.path) {
      // 现有组件移动
      const draggedComponent = draggedItem.component;
      const draggedPath = draggedItem.path;

      // 如果是标题组件，强制移动到画布根节点顶部
      if (draggedComponent.tag === 'title') {
        let newElements = removeComponentByPath(elements, draggedPath);
        onElementsChange(insertTitleAtTop(newElements, draggedComponent));
        message.success('标题组件已移动到画布顶部');
        return;
      }

      // 先移除原位置的组件
      let newElements = removeComponentByPath(elements, draggedPath);

      // 再添加到新位置
      newElements = addComponentByPath(
        newElements,
        targetPath,
        draggedComponent,
        dropIndex,
      );

      onElementsChange(newElements);
    }
  };

  // 处理画布组件排序（专门用于DragSortableItem） - 插入式排序
  const handleCanvasComponentSort = (
    dragIndex: number,
    insertIndex: number,
  ) => {
    console.log('🔄 处理画布组件插入式排序:', {
      dragIndex,
      insertIndex,
      draggedComponent: elements[dragIndex]?.tag,
      totalElements: elements.length,
    });

    const draggedComponent = elements[dragIndex];

    if (!draggedComponent) {
      console.warn('无效的拖拽组件索引:', dragIndex);
      return;
    }

    // 防止无意义的移动
    // 插入式移动中，只有当拖拽元素就在插入位置时才是无意义的
    if (
      dragIndex === insertIndex ||
      (insertIndex > 0 && dragIndex === insertIndex - 1)
    ) {
      console.log('⚠️ 跳过无意义的移动:', {
        dragIndex,
        insertIndex,
        reason: dragIndex === insertIndex ? '拖拽到相同位置' : '拖拽到紧邻位置',
      });
      return;
    }

    // 确保插入索引有效
    if (insertIndex < 0 || insertIndex > elements.length) {
      console.warn('无效的插入索引:', insertIndex);
      return;
    }

    // 严格的标题组件限制
    if (draggedComponent.tag === 'title') {
      // 标题组件只能插入到第一位
      if (insertIndex !== 0) {
        message.info('标题组件只能在画布的最上方');
        return;
      }
    } else {
      // 非标题组件不能插入到标题组件的位置
      const targetComponent = elements[insertIndex];
      if (targetComponent && targetComponent.tag === 'title') {
        return;
      }

      // 如果第一位是标题组件，非标题组件不能插入到第一位
      if (insertIndex === 0 && elements[0]?.tag === 'title') {
        message.info('标题组件必须保持在画布顶部');
        return;
      }
    }

    let finalInsertIndex = insertIndex;

    // 特殊处理：确保标题组件始终在第一位
    if (finalInsertIndex === 0 && draggedComponent.tag !== 'title') {
      const hasTitle = elements.some((comp) => comp.tag === 'title');
      if (hasTitle) {
        finalInsertIndex = 1; // 调整到标题后面
        message.info('已调整位置，标题组件保持在顶部');
      }
    }

    // 确保索引有效
    if (
      dragIndex < 0 ||
      dragIndex >= elements.length ||
      finalInsertIndex < 0 ||
      finalInsertIndex > elements.length
    ) {
      console.warn('索引超出范围');
      return;
    }

    const newElements = [...elements];

    // 执行插入式移动：先移除，后插入
    const [movedComponent] = newElements.splice(dragIndex, 1);

    // 调整插入索引（如果插入位置在拖拽位置之后，需要减1）
    const adjustedInsertIndex =
      finalInsertIndex > dragIndex ? finalInsertIndex - 1 : finalInsertIndex;

    // 插入到新位置
    newElements.splice(adjustedInsertIndex, 0, movedComponent);

    console.log('✅ 插入式排序完成:', {
      from: dragIndex,
      insertAt: finalInsertIndex,
      adjustedTo: adjustedInsertIndex,
      movedComponent: movedComponent.tag,
    });

    onElementsChange(newElements);
  };

  // 处理组件排序
  const handleComponentSort = (
    draggedComponent: ComponentType,
    draggedPath: (string | number)[],
    targetPath: (string | number)[],
    dropIndex: number,
  ) => {
    console.log('🔄 处理组件排序:', {
      draggedComponent: { id: draggedComponent.id, tag: draggedComponent.tag },
      draggedPath,
      targetPath,
      dropIndex,
    });

    // 添加详细的路径分析日志
    console.log('🔍 详细路径分析:', {
      draggedPathLength: draggedPath.length,
      targetPathLength: targetPath.length,
      draggedPathDetails: draggedPath.map((item, index) => ({
        index,
        item,
        type: typeof item,
      })),
      targetPathDetails: targetPath.map((item, index) => ({
        index,
        item,
        type: typeof item,
      })),
    });

    // 分析路径结构
    const draggedContainerPath = draggedPath.slice(0, -1);
    const targetContainerPath = targetPath.slice(0, -1);
    const draggedIndex = draggedPath[draggedPath.length - 1] as number;

    console.log('🔍 路径分析:', {
      draggedContainerPath,
      targetContainerPath,
      draggedIndex,
      isSameContainer:
        JSON.stringify(draggedContainerPath) ===
        JSON.stringify(targetContainerPath),
    });

    // 检查是否在同一容器内移动
    const isSameContainer =
      JSON.stringify(draggedContainerPath) ===
      JSON.stringify(targetContainerPath);

    if (isSameContainer) {
      // 同容器内移动 - 使用位置交换而不是删除+添加
      console.log('🔄 同容器内移动:', {
        draggedIndex,
        targetIndex: dropIndex,
        containerPath: draggedContainerPath,
      });

      // 如果是根级别容器（画布），使用专门的排序函数
      if (
        draggedContainerPath.length === 3 &&
        draggedContainerPath[0] === 'dsl' &&
        draggedContainerPath[1] === 'body' &&
        draggedContainerPath[2] === 'elements'
      ) {
        handleCanvasComponentSort(draggedIndex, dropIndex);
        return;
      }

      // 对于其他容器，实现类似的位置交换逻辑
      let newElements = [...elements];

      // 使用路径找到目标容器
      const targetElementsPath = [...targetContainerPath, 'elements'];

      console.log('🔍 查找目标容器:', {
        targetElementsPath,
        newElementsLength: newElements.length,
      });

      // 获取目标容器的elements数组
      const targetContainer = getElementsArrayByPath(
        newElements,
        targetElementsPath,
      );

      console.log('🔍 目标容器查找结果:', {
        targetContainer: targetContainer
          ? `array(${targetContainer.length})`
          : 'null',
        isArray: Array.isArray(targetContainer),
      });

      if (targetContainer && Array.isArray(targetContainer)) {
        // 执行插入式移动：先移除，后插入（与根级别逻辑保持一致）
        const draggedItem = targetContainer[draggedIndex];

        console.log('🔍 排序前的容器状态:', {
          containerLength: targetContainer.length,
          draggedIndex,
          dropIndex,
          draggedItem: draggedItem
            ? { id: draggedItem.id, tag: draggedItem.tag }
            : 'null',
          containerElements: targetContainer.map((el, idx) => ({
            index: idx,
            id: el.id,
            tag: el.tag,
          })),
        });

        // 移除原位置的组件
        targetContainer.splice(draggedIndex, 1);

        // 调整插入索引（如果插入位置在拖拽位置之后，需要减1）
        const adjustedTargetIndex =
          dropIndex > draggedIndex ? dropIndex - 1 : dropIndex;

        // 插入到新位置
        targetContainer.splice(adjustedTargetIndex, 0, draggedItem);

        console.log('✅ 同容器内排序完成:', {
          from: draggedIndex,
          to: adjustedTargetIndex,
          containerLength: targetContainer.length,
          movedComponent: draggedItem.tag,
          containerElementsAfter: targetContainer.map((el, idx) => ({
            index: idx,
            id: el.id,
            tag: el.tag,
          })),
        });

        console.log('🔄 调用 onElementsChange 更新数据');
        onElementsChange(newElements);
      } else {
        console.error('❌ 无法找到目标容器');
      }
    } else {
      // 跨容器移动 - 使用删除+添加
      console.log('🔄 跨容器移动:', {
        from: draggedContainerPath,
        to: targetContainerPath,
        draggedComponent: {
          id: draggedComponent.id,
          tag: draggedComponent.tag,
        },
      });

      // 先移除原位置的组件
      let newElements = removeComponentByPath(elements, draggedPath);

      console.log('🔍 移除后的数组状态:', {
        originalLength: elements.length,
        newLength: newElements.length,
        removedComponent: {
          id: draggedComponent.id,
          tag: draggedComponent.tag,
        },
        newElements: newElements.map((el, idx) => ({
          index: idx,
          id: el.id,
          tag: el.tag,
        })),
      });

      // 计算目标容器路径
      const targetElementsPath = [...targetContainerPath, 'elements'];

      // 计算实际的插入位置
      let actualDropIndex = dropIndex;

      // 如果目标是根节点（画布），需要考虑标题组件的影响
      if (
        targetElementsPath.length === 3 &&
        targetElementsPath[0] === 'dsl' &&
        targetElementsPath[1] === 'body' &&
        targetElementsPath[2] === 'elements'
      ) {
        // 检查是否有标题组件
        const titleIndex = newElements.findIndex(
          (comp) => comp.tag === 'title',
        );

        // 如果有标题组件，并且被拖拽的不是标题组件，确保不插入到标题组件之前
        if (
          titleIndex !== -1 &&
          draggedComponent.tag !== 'title' &&
          actualDropIndex <= titleIndex
        ) {
          actualDropIndex = titleIndex + 1;
          console.log(
            '📌 调整插入位置，确保标题组件在最上方:',
            actualDropIndex,
          );
        }
      }

      console.log('🔍 跨容器移动详细信息:', {
        draggedPath,
        targetElementsPath,
        actualDropIndex,
        newElementsLength: newElements.length,
      });

      // 验证并修正目标路径
      const validatedPath = validateAndCorrectPath(
        newElements,
        targetElementsPath,
      );

      console.log('🔍 路径验证结果:', {
        originalPath: targetElementsPath,
        validatedPath,
        pathChanged:
          JSON.stringify(targetElementsPath) !== JSON.stringify(validatedPath),
      });

      // 添加到新位置
      newElements = addComponentByPath(
        newElements,
        validatedPath,
        draggedComponent,
        actualDropIndex,
      );

      console.log('✅ 跨容器移动完成:', {
        movedComponent: { id: draggedComponent.id, tag: draggedComponent.tag },
        fromPath: draggedPath,
        toPath: targetElementsPath,
        finalElementsLength: newElements.length,
      });

      onElementsChange(newElements);
    }
  };

  // 拖拽处理
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ['component', 'existing-component'],
    canDrop: (item: DragItem) => {
      // 如果是标题组件，检查是否已存在
      if (item.type === 'title' && hasExistingTitle(elements)) {
        return false;
      }
      return true;
    },
    drop: (item: DragItem, monitor) => {
      if (monitor.didDrop()) return;

      // 如果是标题组件且已存在，显示提示
      if (item.type === 'title' && hasExistingTitle(elements)) {
        message.warning('画布中已存在标题组件，每个画布只能有一个标题组件');
        return;
      }

      console.log('🎯 画布拖拽处理:', {
        itemType: item.type,
        isNew: item.isNew,
        hasComponent: !!item.component,
        hasPath: !!item.path,
      });

      if (item.isNew) {
        // 新组件
        const newComponent = createDefaultComponent(item.type);

        // 如果是标题组件，放置在最顶部
        if (item.type === 'title') {
          onElementsChange(insertTitleAtTop(elements, newComponent));
          message.success('标题组件已添加到画布顶部');
        } else {
          // 其他组件添加到末尾
          onElementsChange([...elements, newComponent]);
          message.success(`${item.type} 组件已添加到画布`);
        }
      } else if (item.component && item.path) {
        // 现有组件移动到画布根级别
        console.log('🔄 移动现有组件到画布根级别:', {
          component: { id: item.component.id, tag: item.component.tag },
          fromPath: item.path,
        });

        // 检查是否是从容器中移动到根级别
        if (item.path.length > 4) {
          // 从容器移动到根级别
          handleContainerDrop(item, ['dsl', 'body', 'elements']);
        } else {
          // 根级别内部移动，这种情况通常由排序处理
          console.log('⚠️ 根级别内部移动应该由排序处理');
        }
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  });

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const currentTarget = e.currentTarget as HTMLElement;

    console.log('🎯 卡片点击处理:', {
      targetTag: target.tagName,
      targetClass: target.className,
      isCurrentTarget: target === currentTarget,
      hasComponentWrapper: !!target.closest('[data-component-wrapper]'),
      hasDragSortableItem: !!target.closest('[data-drag-sortable-item]'),
      hasCardContainer: !!target.closest('[data-card-container]'),
      isCardSelected,
    });

    // 立即阻止事件冒泡，防止触发画布点击事件
    e.stopPropagation();

    // 如果卡片已经被选中，不再重复处理选中事件
    if (isCardSelected) {
      console.log('🚫 卡片已选中，跳过重复选中');
      return;
    }

    // 如果点击的是组件包装器或拖拽排序项，不处理卡片选中
    if (
      target.closest('[data-component-wrapper]') ||
      target.closest('[data-drag-sortable-item]')
    ) {
      console.log('🚫 阻止卡片选中：点击的是组件或拖拽项');
      return;
    }

    // 如果点击的是操作按钮，不处理卡片选中
    if (target.closest('.ant-dropdown') || target.closest('.ant-btn')) {
      console.log('🚫 阻止卡片选中：点击的是操作按钮');
      return;
    }

    // 如果点击的是卡片容器本身或其子元素（但不是组件或按钮），则处理卡片选中
    console.log('✅ 处理卡片选中');
    onCardSelect();
    onCanvasFocus();
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: '#fff',
    borderRadius: '12px',
    border: isCardSelected ? '2px solid #1890ff' : '1px solid #e8e8e8',
    boxShadow: isCardSelected
      ? '0 0 8px rgba(24, 144, 255, 0.3)'
      : '0 2px 8px rgba(0, 0, 0, 0.1)',
    padding: `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px`,
    minHeight: '200px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative',
  };

  // 拖拽悬停样式
  if (isOver && canDrop) {
    cardStyle.border = '2px dashed #1890ff';
    cardStyle.backgroundColor = 'rgba(24, 144, 255, 0.05)';
  }

  return (
    <div
      ref={drop}
      style={cardStyle}
      onClick={handleCardClick}
      data-card-container="true"
    >
      {/* 选中状态指示器 */}
      {isCardSelected && (
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
      {/* 拖拽提示 */}
      {isOver && canDrop && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(24, 144, 255, 0.9)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 'bold',
            pointerEvents: 'none',
            zIndex: 1000,
          }}
        >
          释放以添加组件到卡片
        </div>
      )}
      {/* 卡片内容 */}
      {elements.length > 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: `${verticalSpacing}px`,
            position: 'relative',
          }}
        >
          {elements.map((component, index) => {
            if (!component) {
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
                    }}
                  >
                    ⚠️ 组件数据异常
                  </div>
                </ErrorBoundary>
              );
            }

            const componentPath = ['dsl', 'body', 'elements', index];
            const isSelected = isSamePath(selectedPath, componentPath);
            const isHovered = isSamePath(hoveredPath, componentPath);

            return (
              <DragSortableItem
                key={`${component.id}-${index}-${componentPath.join('-')}`}
                component={component}
                index={index}
                path={componentPath}
                onMove={handleCanvasComponentSort}
              >
                <ErrorBoundary>
                  <ComponentRenderer
                    component={component}
                    onSelect={onSelectComponent}
                    isSelected={isSelected}
                    selectedComponent={null}
                    selectedPath={selectedPath}
                    onUpdate={() => {}}
                    onDelete={onDeleteComponent}
                    onCopy={onCopyComponent}
                    path={componentPath}
                    onCanvasFocus={onCanvasFocus}
                    hoveredPath={hoveredPath}
                    isHovered={isHovered}
                    onContainerDrop={handleContainerDrop}
                    onComponentSort={handleComponentSort}
                    isPreview={false}
                  />
                </ErrorBoundary>
              </DragSortableItem>
            );
          })}
        </div>
      ) : (
        // 空状态
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '160px',
            color: '#999',
            border: '2px dashed #d9d9d9',
            borderRadius: '8px',
            backgroundColor: '#fafafa',
          }}
        >
          <PlusOutlined style={{ fontSize: '32px', marginBottom: '12px' }} />
          <div style={{ fontSize: '16px', marginBottom: '8px' }}>
            拖拽组件到这里
          </div>
          <div style={{ fontSize: '12px' }}>从左侧面板拖拽组件到卡片中</div>
        </div>
      )}
      {/* 卡片标签 */}
      {isCardSelected && (
        <div
          style={{
            position: 'absolute',
            bottom: '-20px',
            left: '0',
            backgroundColor: '#1890ff',
            color: 'white',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            whiteSpace: 'nowrap',
            zIndex: 10,
          }}
        >
          卡片容器
        </div>
      )}
    </div>
  );
};

export default CardWrapper;
