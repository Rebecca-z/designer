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
          console.error('❌ 尝试在非分栏组件上访问columns1:', {
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

    // ✅ 修复：重新设计路径导航逻辑，避免current被错误修改
    console.log('🚀 开始路径导航 (修复版):', {
      path,
      pathLength: path.length,
      startIndex: 3,
    });

    // 使用递归函数来正确导航路径
    const navigateAndAdd = (
      target: any,
      remainingPath: (string | number)[],
      depth: number = 0,
      rootElements?: ComponentType[], // ✅ 修复：添加根elements数组参数
      originalTargetPath?: (string | number)[], // ✅ 修复：添加原始目标路径参数
    ): boolean => {
      if (!target || remainingPath.length === 0) {
        console.error('❌ 路径导航失败：目标为空或路径为空', {
          target: target ? 'exists' : 'null',
          remainingPath,
          depth,
        });
        return false;
      }

      const key = remainingPath[0];
      const nextPath = remainingPath.slice(1);

      console.log(`🔍 路径导航步骤 ${depth}:`, {
        key,
        keyType: typeof key,
        targetType: target ? typeof target : 'undefined',
        isArray: Array.isArray(target),
        targetState: target
          ? {
              tag: target.tag || 'no tag',
              id: target.id || 'no id',
              hasElements: target.elements ? 'yes' : 'no',
              hasColumns: target.columns ? 'yes' : 'no',
            }
          : 'null/undefined',
        remainingPath,
        nextPath,
      });

      // 处理 'columns' 路径段
      if (key === 'columns') {
        console.log('🔍 处理columns路径段:', {
          targetTag: target ? target.tag : 'undefined',
          targetId: target ? target.id : 'undefined',
          depth,
        });

        // 检查当前对象是否是分栏容器
        if (
          target &&
          target.tag === 'column_set' &&
          target.columns &&
          Array.isArray(target.columns)
        ) {
          const columnIndex = nextPath[0] as number;

          if (
            typeof columnIndex === 'number' &&
            columnIndex >= 0 &&
            columnIndex < target.columns.length
          ) {
            const targetColumn = target.columns[columnIndex];

            // 检查目标列是否有elements数组
            if (
              !targetColumn.elements ||
              !Array.isArray(targetColumn.elements)
            ) {
              console.warn('⚠️ 分栏列缺少elements数组，自动创建:', {
                columnIndex,
                columnId: targetColumn.id,
                hasElements: targetColumn.elements ? 'yes' : 'no',
              });
              targetColumn.elements = [];
            }

            // 继续导航到列的elements数组
            return navigateAndAdd(
              targetColumn.elements,
              nextPath.slice(1),
              depth + 1,
              rootElements,
              originalTargetPath,
            );
          } else {
            console.error('❌ 分栏索引无效:', {
              columnIndex,
              columnsLength: target.columns.length,
              depth,
            });
            return false;
          }
        } else {
          // ✅ 修复：当路径指向错误的组件类型时，尝试智能修正
          console.warn('⚠️ 路径指向了非分栏组件，尝试智能修正:', {
            targetTag: target ? target.tag : 'undefined',
            targetId: target ? target.id : 'undefined',
            expectedTag: 'column_set',
            hasColumns: target && target.columns ? 'yes' : 'no',
            depth,
          });

          // 如果当前目标是数组（根elements），尝试查找分栏容器
          if (Array.isArray(target)) {
            console.log('🔍 在根elements数组中查找分栏容器');

            const columnSetIndex = target.findIndex(
              (comp) => comp && comp.tag === 'column_set',
            );

            if (columnSetIndex !== -1) {
              const columnSet = target[columnSetIndex];
              console.log('✅ 找到分栏容器，修正路径:', {
                columnSetIndex,
                columnSetId: columnSet.id,
                originalPath: remainingPath,
              });

              // 重新构建路径：先导航到分栏容器，然后处理columns
              const correctedPath = [columnSetIndex, 'columns', ...nextPath];
              return navigateAndAdd(
                target,
                correctedPath,
                depth,
                rootElements,
                originalTargetPath,
              );
            } else {
              console.error('❌ 在根elements中未找到分栏容器');
              return false;
            }
          }

          // ✅ 修复：如果当前目标是组件对象，使用rootElements进行全局查找
          if (target && typeof target === 'object' && target.tag) {
            console.log('🔍 当前目标是组件对象，使用rootElements进行全局查找');

            if (target.tag === 'form') {
              console.warn('⚠️ 路径指向了表单容器，但期望分栏容器');

              // 使用rootElements在全局查找分栏容器
              if (rootElements && Array.isArray(rootElements)) {
                const columnSetIndex = rootElements.findIndex(
                  (comp) => comp && comp.tag === 'column_set',
                );

                if (columnSetIndex !== -1) {
                  const columnSet = rootElements[columnSetIndex];
                  console.log('✅ 在全局找到分栏容器，修正路径:', {
                    columnSetIndex,
                    columnSetId: columnSet.id,
                    originalPath: remainingPath,
                  });

                  // 重新构建路径：先导航到分栏容器，然后处理columns
                  const correctedPath = [
                    columnSetIndex,
                    'columns',
                    ...nextPath,
                  ];
                  return navigateAndAdd(
                    rootElements,
                    correctedPath,
                    depth,
                    rootElements,
                    originalTargetPath,
                  );
                } else {
                  console.error('❌ 在全局elements中未找到分栏容器');
                  return false;
                }
              } else {
                console.error('❌ rootElements不可用，无法进行全局查找');
                return false;
              }
            }
          }

          console.error('❌ 无法修正路径，目标不是分栏容器');
          return false;
        }
      }

      // 处理 'elements' 路径段
      if (key === 'elements') {
        console.log('🔍 处理elements路径段:', {
          targetTag: target ? target.tag : 'undefined',
          targetId: target ? target.id : 'undefined',
          depth,
          targetDetails: target
            ? {
                id: target.id,
                tag: target.tag,
                name: target.name || 'no name',
                hasElements: target.elements ? 'yes' : 'no',
                hasColumns: target.columns ? 'yes' : 'no',
              }
            : 'null/undefined',
        });

        // 如果这是最后一个路径段，直接在这里添加组件
        if (nextPath.length === 0) {
          if (Array.isArray(target)) {
            // target本身就是elements数组
            if (insertIndex !== undefined) {
              target.splice(insertIndex, 0, newComponent);
            } else {
              target.push(newComponent);
            }
            console.log('✅ 组件添加成功 (elements数组):', {
              componentId: newComponent.id,
              componentTag: newComponent.tag,
              insertIndex,
              arrayLength: target.length,
            });
            return true;
          } else if (
            target &&
            target.elements &&
            Array.isArray(target.elements)
          ) {
            // target是组件对象，需要访问其elements属性
            if (insertIndex !== undefined) {
              target.elements.splice(insertIndex, 0, newComponent);
            } else {
              target.elements.push(newComponent);
            }
            console.log('✅ 组件添加成功 (组件elements):', {
              componentId: newComponent.id,
              componentTag: newComponent.tag,
              insertIndex,
              arrayLength: target.elements.length,
            });
            return true;
          } else {
            // 自动创建elements数组
            if (
              target &&
              (target.tag === 'form' || target.tag === 'column_set')
            ) {
              console.warn('⚠️ 容器组件缺少elements数组，自动创建:', {
                componentId: target.id,
                componentTag: target.tag,
                hasElements: target.elements ? 'yes' : 'no',
              });

              if (!target.elements || !Array.isArray(target.elements)) {
                target.elements = [];
              }

              if (insertIndex !== undefined) {
                target.elements.splice(insertIndex, 0, newComponent);
              } else {
                target.elements.push(newComponent);
              }

              console.log('✅ 组件添加成功 (修复后):', {
                componentId: newComponent.id,
                componentTag: newComponent.tag,
                insertIndex,
                arrayLength: target.elements.length,
              });
              return true;
            }

            console.error('❌ 无法找到或创建elements数组:', {
              target: target ? 'exists' : 'null',
              targetTag: target ? target.tag : 'undefined',
              depth,
            });
            return false;
          }
        } else {
          // 继续导航
          const nextKey = nextPath[0];

          if (typeof nextKey === 'number') {
            // 下一个是数组索引
            if (
              Array.isArray(target) &&
              nextKey >= 0 &&
              nextKey < target.length
            ) {
              return navigateAndAdd(
                target[nextKey],
                nextPath.slice(1),
                depth + 1,
                rootElements,
                originalTargetPath,
              );
            } else {
              console.error('❌ elements数组索引无效:', {
                nextKey,
                targetLength: Array.isArray(target) ? target.length : 'N/A',
                depth,
              });
              return false;
            }
          } else if (nextKey === 'elements') {
            // 下一个也是elements，说明这是表单容器的结构
            if (target && target.elements && Array.isArray(target.elements)) {
              return navigateAndAdd(
                target.elements,
                nextPath.slice(1),
                depth + 1,
                rootElements,
                originalTargetPath,
              );
            } else {
              // ✅ 修复：智能修正表单容器路径
              if (target && target.tag === 'form') {
                console.warn('⚠️ 表单组件缺少elements数组，自动创建:', {
                  componentId: target.id,
                  componentTag: target.tag,
                });

                if (!target.elements || !Array.isArray(target.elements)) {
                  target.elements = [];
                }

                return navigateAndAdd(
                  target.elements,
                  nextPath.slice(1),
                  depth + 1,
                  rootElements,
                  originalTargetPath,
                );
              } else {
                // ✅ 修复：当路径指向错误的组件类型时，尝试智能修正
                console.warn('⚠️ 路径指向了非容器组件，尝试智能修正:', {
                  targetTag: target ? target.tag : 'undefined',
                  targetId: target ? target.id : 'undefined',
                  depth,
                });

                // 如果当前目标是数组，说明我们已经到达了elements数组，直接在这里添加组件
                if (Array.isArray(target)) {
                  console.log('✅ 已到达elements数组，直接添加组件:', {
                    targetLength: target.length,
                    insertIndex,
                    componentId: newComponent.id,
                    componentTag: newComponent.tag,
                  });

                  if (insertIndex !== undefined) {
                    target.splice(insertIndex, 0, newComponent);
                  } else {
                    target.push(newComponent);
                  }

                  console.log('✅ 组件添加成功 (elements数组):', {
                    componentId: newComponent.id,
                    componentTag: newComponent.tag,
                    insertIndex,
                    arrayLength: target.length,
                  });
                  return true;
                }

                // 如果当前目标是组件对象，使用rootElements进行全局查找
                if (target && typeof target === 'object' && target.tag) {
                  console.log(
                    '🔍 当前目标是组件对象，使用rootElements进行全局查找',
                  );

                  // 根据原始目标路径判断应该查找什么类型的容器
                  const isTargetingForm =
                    originalTargetPath &&
                    originalTargetPath.length === 5 &&
                    originalTargetPath[0] === 'dsl' &&
                    originalTargetPath[1] === 'body' &&
                    originalTargetPath[2] === 'elements' &&
                    originalTargetPath[4] === 'elements';

                  const isTargetingColumn =
                    originalTargetPath &&
                    originalTargetPath.length === 7 &&
                    originalTargetPath[0] === 'dsl' &&
                    originalTargetPath[1] === 'body' &&
                    originalTargetPath[2] === 'elements' &&
                    originalTargetPath[4] === 'columns' &&
                    originalTargetPath[6] === 'elements';

                  if (isTargetingForm && target.tag !== 'form') {
                    console.warn('⚠️ 路径指向了非表单容器，但期望表单容器');

                    // 使用rootElements在全局查找表单容器
                    if (rootElements && Array.isArray(rootElements)) {
                      const formIndex = rootElements.findIndex(
                        (comp) => comp && comp.tag === 'form',
                      );

                      if (formIndex !== -1) {
                        const form = rootElements[formIndex];
                        console.log('✅ 在全局找到表单容器，修正路径:', {
                          formIndex,
                          formId: form.id,
                          originalPath: remainingPath,
                        });

                        // 重新构建路径：先导航到表单容器，然后处理elements
                        const correctedPath = [
                          formIndex,
                          'elements',
                          ...nextPath.slice(1),
                        ];
                        return navigateAndAdd(
                          rootElements,
                          correctedPath,
                          depth,
                          rootElements,
                          originalTargetPath,
                        );
                      } else {
                        console.error('❌ 在全局elements中未找到表单容器');
                        return false;
                      }
                    } else {
                      console.error('❌ rootElements不可用，无法进行全局查找');
                      return false;
                    }
                  } else if (isTargetingColumn && target.tag !== 'column_set') {
                    console.warn('⚠️ 路径指向了非分栏容器，但期望分栏容器');

                    // 使用rootElements在全局查找分栏容器
                    if (rootElements && Array.isArray(rootElements)) {
                      const columnIndex = rootElements.findIndex(
                        (comp) => comp && comp.tag === 'column_set',
                      );

                      if (columnIndex !== -1) {
                        const column = rootElements[columnIndex];
                        console.log('✅ 在全局找到分栏容器，修正路径:', {
                          columnIndex,
                          columnId: column.id,
                          originalPath: remainingPath,
                        });

                        // 重新构建路径：先导航到分栏容器，然后处理columns和elements
                        const correctedPath = [
                          columnIndex,
                          'columns',
                          ...nextPath.slice(1),
                        ];
                        return navigateAndAdd(
                          rootElements,
                          correctedPath,
                          depth,
                          rootElements,
                          originalTargetPath,
                        );
                      } else {
                        console.error('❌ 在全局elements中未找到分栏容器');
                        return false;
                      }
                    } else {
                      console.error('❌ rootElements不可用，无法进行全局查找');
                      return false;
                    }
                  }
                }

                console.error('❌ 无法修正路径，目标不是期望的容器类型');
                return false;
              }
            }
          } else {
            // 其他情况，直接访问elements属性
            if (target && target.elements && Array.isArray(target.elements)) {
              return navigateAndAdd(
                target.elements,
                nextPath,
                depth + 1,
                rootElements,
                originalTargetPath,
              );
            } else {
              console.error('❌ 无法访问elements属性:', {
                target: target ? 'exists' : 'null',
                targetTag: target ? target.tag : 'undefined',
                depth,
              });
              return false;
            }
          }
        }
      }

      // 处理数字索引
      if (typeof key === 'number') {
        console.log('🔍 处理数字索引:', {
          key,
          targetType: target ? typeof target : 'undefined',
          isArray: Array.isArray(target),
          targetLength: Array.isArray(target) ? target.length : 'N/A',
          targetComponent:
            Array.isArray(target) && target[key]
              ? {
                  id: target[key].id,
                  tag: target[key].tag,
                  name: target[key].name || 'no name',
                }
              : 'undefined',
          depth,
        });
        const nextTarget = Array.isArray(target) ? target[key] : undefined;
        // --- 新增：类型校验和全局修正 ---
        if (
          nextPath[0] === 'elements' &&
          nextTarget &&
          rootElements &&
          Array.isArray(rootElements)
        ) {
          // 检查目标路径是否指向表单容器
          const isTargetingForm =
            originalTargetPath &&
            originalTargetPath.length === 5 &&
            originalTargetPath[0] === 'dsl' &&
            originalTargetPath[1] === 'body' &&
            originalTargetPath[2] === 'elements' &&
            originalTargetPath[4] === 'elements';

          // 检查目标路径是否指向分栏容器
          const isTargetingColumn =
            originalTargetPath &&
            originalTargetPath.length === 7 &&
            originalTargetPath[0] === 'dsl' &&
            originalTargetPath[1] === 'body' &&
            originalTargetPath[2] === 'elements' &&
            originalTargetPath[4] === 'columns' &&
            originalTargetPath[6] === 'elements';

          console.log('🔍 路径修正分析:', {
            isTargetingForm,
            isTargetingColumn,
            targetPath: originalTargetPath || 'undefined',
            targetPathLength: originalTargetPath?.length || 0,
            nextTargetTag: nextTarget.tag,
            expectedTag: isTargetingForm
              ? 'form'
              : isTargetingColumn
              ? 'column_set'
              : 'unknown',
          });

          // 拖拽到表单容器但实际不是
          if (isTargetingForm && nextTarget.tag !== 'form') {
            const formIndex = rootElements.findIndex(
              (c) => c && c.tag === 'form',
            );
            if (formIndex !== -1) {
              const correctedPath = [formIndex, ...nextPath];
              console.warn('⚠️ 索引指向非表单容器，修正为全局表单容器:', {
                originalIndex: key,
                correctedIndex: formIndex,
                correctedPath,
              });
              // 修复：直接导航到修正后的目标，跳过当前数字索引处理
              const correctedTarget = rootElements[formIndex];
              return navigateAndAdd(
                correctedTarget,
                nextPath,
                depth + 1,
                rootElements,
                originalTargetPath,
              );
            }
          }
          // 拖拽到分栏容器但实际不是
          if (isTargetingColumn && nextTarget.tag !== 'column_set') {
            const colIndex = rootElements.findIndex(
              (c) => c && c.tag === 'column_set',
            );
            if (colIndex !== -1) {
              const correctedPath = [colIndex, ...nextPath];
              console.warn('⚠️ 索引指向非分栏容器，修正为全局分栏容器:', {
                originalIndex: key,
                correctedIndex: colIndex,
                correctedPath,
              });
              // 修复：直接导航到修正后的目标，跳过当前数字索引处理
              const correctedTarget = rootElements[colIndex];
              return navigateAndAdd(
                correctedTarget,
                nextPath,
                depth + 1,
                rootElements,
                originalTargetPath,
              );
            }
          }
        }
        // --- 原有逻辑 ---
        if (Array.isArray(target) && key >= 0 && key < target.length) {
          return navigateAndAdd(
            target[key],
            nextPath,
            depth + 1,
            rootElements,
            originalTargetPath,
          );
        } else {
          console.error('❌ 数组索引无效:', {
            key,
            targetLength: Array.isArray(target) ? target.length : 'N/A',
            depth,
          });
          return false;
        }
      }

      // 处理其他属性
      if (target && target[key] !== undefined) {
        return navigateAndAdd(
          target[key],
          nextPath,
          depth + 1,
          rootElements,
          originalTargetPath,
        );
      } else {
        console.error('❌ 属性路径无效:', {
          key,
          target: target ? 'exists' : 'null',
          availableKeys:
            target && typeof target === 'object' ? Object.keys(target) : 'N/A',
          depth,
        });
        return false;
      }
    };

    // 开始导航，从根elements数组开始
    console.log('🔍 路径导航开始 - 根elements数组状态:', {
      path: path.slice(3),
      pathLength: path.slice(3).length,
      rootElementsLength: newElements.length,
      rootElementsDetails: newElements.map((el, idx) => ({
        index: idx,
        id: el.id,
        tag: el.tag,
        name: el.name || 'no name',
      })),
    });

    const success = navigateAndAdd(
      newElements,
      path.slice(3),
      0,
      newElements,
      path,
    );

    if (success) {
      console.log('✅ 路径导航和组件添加完成');
      return newElements;
    } else {
      console.error('❌ 路径导航失败，返回原始数组');
      return elements;
    }
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

    // ✅ 修复：不要错误地修正拖拽路径，保持原始路径
    console.log('🔍 路径检查:', {
      originalDraggedPath: draggedPath,
      draggedComponent: {
        id: draggedComponent.id,
        tag: draggedComponent.tag,
      },
      currentElements: elements.map((el, idx) => ({
        index: idx,
        id: el.id,
        tag: el.tag,
      })),
    });

    // 保持原始拖拽路径，不要错误地修正为根级别路径
    let finalDraggedPath = draggedPath;

    // ✅ 修复：检查并修正目标路径
    let finalTargetPath = targetPath;

    // ✅ 修复：改进目标路径验证逻辑
    // 如果目标路径是根级别路径（指向画布），需要检查是否指向了正确的容器组件
    if (
      targetPath.length === 4 &&
      targetPath[0] === 'dsl' &&
      targetPath[1] === 'body' &&
      targetPath[2] === 'elements'
    ) {
      const targetIndex = targetPath[3] as number;
      const targetComponent = elements[targetIndex];

      console.log('🔍 目标路径检查:', {
        targetIndex,
        targetComponent: targetComponent
          ? { id: targetComponent.id, tag: targetComponent.tag }
          : 'undefined',
        targetPath,
        isContainer:
          targetComponent &&
          (targetComponent.tag === 'form' ||
            targetComponent.tag === 'column_set'),
      });

      // 如果目标路径指向的不是容器组件，说明路径错误
      if (
        !targetComponent ||
        (targetComponent.tag !== 'form' && targetComponent.tag !== 'column_set')
      ) {
        console.warn('⚠️ 目标路径指向了非容器组件，需要修正路径');

        // ✅ 修复：不要自动查找第一个容器，而是根据拖拽的目标来确定正确的容器
        // 这里应该根据实际的拖拽目标来构建正确的路径
        // 暂时保持原路径，让后续的路径导航逻辑来处理
        console.log('⚠️ 保持原路径，让路径导航逻辑处理:', {
          targetPath,
          targetComponent: targetComponent
            ? { id: targetComponent.id, tag: targetComponent.tag }
            : 'undefined',
        });
      }
    }

    // 添加详细的路径分析日志
    console.log('🔍 详细路径分析:', {
      draggedPathLength: finalDraggedPath.length,
      targetPathLength: finalTargetPath.length,
      draggedPathDetails: finalDraggedPath.map((item, index) => ({
        index,
        item,
        type: typeof item,
      })),
      targetPathDetails: finalTargetPath.map((item, index) => ({
        index,
        item,
        type: typeof item,
      })),
    });

    // 分析路径结构
    const draggedContainerPath = finalDraggedPath.slice(0, -1);
    const targetContainerPath = finalTargetPath.slice(0, -1);
    const draggedIndex = finalDraggedPath[
      finalDraggedPath.length - 1
    ] as number;

    console.log('🔍 路径分析:', {
      draggedContainerPath,
      targetContainerPath,
      draggedIndex,
      draggedPathDetails: draggedContainerPath.map((item, index) => ({
        index,
        item,
        type: typeof item,
      })),
      targetPathDetails: targetContainerPath.map((item, index) => ({
        index,
        item,
        type: typeof item,
      })),
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
      // ✅ 修复：避免重复添加'elements'
      let containerTargetPath = [...targetContainerPath, 'elements'];

      // 检查目标路径是否已经包含'elements'
      if (finalTargetPath[finalTargetPath.length - 1] === 'elements') {
        containerTargetPath = finalTargetPath;
        console.log('✅ 同容器移动：目标路径已包含elements，直接使用:', {
          originalTargetPath: finalTargetPath,
          containerTargetPath,
        });
      } else {
        console.log('✅ 同容器移动：为目标路径添加elements:', {
          targetContainerPath,
          containerTargetPath,
        });
      }

      console.log('🔍 查找目标容器:', {
        containerTargetPath,
        newElementsLength: newElements.length,
      });

      // 获取目标容器的elements数组
      const targetContainer = getElementsArrayByPath(
        newElements,
        containerTargetPath,
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
      let newElements = removeComponentByPath(elements, finalDraggedPath);

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

      // ✅ 修复：避免重复添加'elements'
      let containerTargetPath = targetElementsPath;

      // 检查目标路径是否已经包含'elements'
      if (finalTargetPath[finalTargetPath.length - 1] === 'elements') {
        // 如果目标路径已经以'elements'结尾，直接使用
        containerTargetPath = finalTargetPath;
        console.log('✅ 目标路径已包含elements，直接使用:', {
          originalTargetPath: finalTargetPath,
          containerTargetPath,
        });
      } else {
        // 否则添加'elements'
        console.log('✅ 为目标路径添加elements:', {
          targetContainerPath,
          containerTargetPath,
        });
      }

      // 计算实际的插入位置
      let actualDropIndex = dropIndex;

      // 如果目标是根节点（画布），需要考虑标题组件的影响
      if (
        containerTargetPath.length === 3 &&
        containerTargetPath[0] === 'dsl' &&
        containerTargetPath[1] === 'body' &&
        containerTargetPath[2] === 'elements'
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
        draggedPath: finalDraggedPath,
        containerTargetPath,
        actualDropIndex,
        newElementsLength: newElements.length,
      });

      // 验证并修正目标路径
      const validatedPath = validateAndCorrectPath(
        newElements,
        containerTargetPath,
      );

      console.log('🔍 路径验证结果:', {
        originalPath: containerTargetPath,
        validatedPath,
        pathChanged:
          JSON.stringify(containerTargetPath) !== JSON.stringify(validatedPath),
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
        fromPath: finalDraggedPath,
        toPath: containerTargetPath,
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
