// card-designer-card-wrapper.tsx - 会话卡片包装器组件

import { DeleteOutlined, MoreOutlined } from '@ant-design/icons';
import { Button, Dropdown, message } from 'antd';
import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import ComponentRenderer from './card-designer-components';
import {
  ComponentType,
  DragItem,
  VariableItem,
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
  onClearSelection?: () => void; // 新增：清除选中状态的回调
}> = ({ component, index, path, onMove, children, onClearSelection }) => {
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
        const newIndex =
          targetIndex > dragIndex ? targetIndex - 1 : targetIndex;
        item.index = newIndex;

        // ✅ 修复：同时更新路径中的索引，确保路径与实际位置一致
        if (
          item.path &&
          item.path.length === 4 &&
          item.path[2] === 'elements'
        ) {
          item.path = [...item.path.slice(0, 3), newIndex];
          console.log('🔄 更新拖拽项路径:', {
            oldPath: path,
            newPath: item.path,
            oldIndex: dragIndex,
            newIndex: newIndex,
          });
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
      console.log('🟢 DragSortableItem 开始拖拽:', {
        tag: component.tag,
        index,
        componentId: component.id,
      });

      // 拖拽开始时清除选中状态
      if (onClearSelection) {
        console.log('🗑️ 拖拽开始时清除选中状态');
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
      {children}
    </div>
  );
};

interface CardWrapperProps {
  elements: ComponentType[];
  verticalSpacing: number;
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
  // 新增：标题数据
  headerData?: {
    title?: { content: string };
    subtitle?: { content: string };
    style?: string; // 改为字符串类型
  };
  // 新增：标题数据更新回调
  onHeaderDataChange?: (headerData: {
    title?: { content: string };
    subtitle?: { content: string };
    style?: string;
  }) => void;
  // 新增：布局方式
  layoutMode?: 'vertical' | 'flow';
  // 新增：变量数据
  variables?: VariableItem[];
}

const CardWrapper: React.FC<CardWrapperProps> = ({
  elements,
  verticalSpacing,
  selectedPath,
  hoveredPath,
  onElementsChange,
  onSelectComponent,
  onDeleteComponent,
  onCopyComponent,
  onCanvasFocus,
  isCardSelected,
  onCardSelect,
  headerData,
  onHeaderDataChange,
  layoutMode = 'vertical', // 默认垂直布局
  variables = [],
}) => {
  // 工具函数：检查画布中是否已存在标题组件
  const hasExistingTitle = (elements: ComponentType[]): boolean => {
    return elements.some((component) => component.tag === 'title');
  };

  // 工具函数：检查画布中是否已存在表单组件
  const hasExistingForm = (elements: ComponentType[]): boolean => {
    return elements.some((component) => component.tag === 'form');
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

  // 工具函数：根据目标位置清理组件的required字段
  const cleanRequiredFieldBasedOnTarget = (
    component: ComponentType,
    targetPath: (string | number)[],
  ): ComponentType => {
    // 需要处理required字段的组件类型
    const componentsWithRequired = [
      'input',
      'select_static',
      'multi_select_static',
    ];

    if (!componentsWithRequired.includes(component.tag)) {
      console.log('⏭️ 组件类型不需要处理 required 字段:', component.tag);
      return component;
    }

    // 检查目标位置是否在表单中
    const isTargetInForm =
      targetPath.length >= 6 &&
      targetPath[0] === 'dsl' &&
      targetPath[1] === 'body' &&
      targetPath[2] === 'elements' &&
      targetPath[4] === 'elements';

    // 检查目标位置是否在表单内的分栏容器中
    const isTargetInFormColumn =
      targetPath.length >= 10 &&
      targetPath[0] === 'dsl' &&
      targetPath[1] === 'body' &&
      targetPath[2] === 'elements' &&
      targetPath[4] === 'elements' &&
      targetPath[6] === 'columns' &&
      targetPath[8] === 'elements';

    // 检查目标位置是否在画布根节点
    const isTargetInRoot =
      targetPath.length === 3 &&
      targetPath[0] === 'dsl' &&
      targetPath[1] === 'body' &&
      targetPath[2] === 'elements';

    const cleanedComponent = { ...component };

    if (isTargetInRoot) {
      // 移动到画布根节点：删除required字段
      console.log('🎯 检测到移动到画布根节点，准备删除 required 字段');
      if ((cleanedComponent as any).required !== undefined) {
        const beforeValue = (cleanedComponent as any).required;
        delete (cleanedComponent as any).required;
        console.log('🧹 ✅ 成功删除 required 字段:', {
          componentId: component.id,
          componentTag: component.tag,
          beforeValue,
          afterHasRequired: (cleanedComponent as any).required !== undefined,
          targetPath,
          action: 'delete required field',
        });
      } else {
        console.log('ℹ️ 组件没有 required 字段，无需删除');
      }
    } else if (isTargetInForm || isTargetInFormColumn) {
      // 移动到表单中：保留required字段（如果有的话）
      console.log('✅ 保留required字段 - 移动到表单中:', {
        componentId: component.id,
        componentTag: component.tag,
        hasRequired: (cleanedComponent as any).required !== undefined,
        requiredValue: (cleanedComponent as any).required,
        targetPath,
        action: 'keep required field',
      });
      // 不需要特殊处理，required字段会被保留
    } else {
      console.log('⚠️ 未匹配到任何目标位置类型:', {
        componentId: component.id,
        targetPath,
        isTargetInRoot,
        isTargetInForm,
        isTargetInFormColumn,
      });
    }

    console.log('🔍 cleanRequiredFieldBasedOnTarget 执行完成:', {
      componentId: component.id,
      originalHasRequired: (component as any).required !== undefined,
      cleanedHasRequired: (cleanedComponent as any).required !== undefined,
      originalValue: (component as any).required,
      cleanedValue: (cleanedComponent as any).required,
    });

    return cleanedComponent;
  };

  // 根据路径添加组件到指定位置
  const addComponentByPath = (
    elements: ComponentType[],
    path: (string | number)[],
    newComponent: ComponentType,
    insertIndex?: number,
  ): ComponentType[] => {
    const newElements = [...elements];

    // 根据目标位置清理组件的required字段
    const cleanedComponent = cleanRequiredFieldBasedOnTarget(
      newComponent,
      path,
    );

    console.log('🎯 添加组件到路径:', {
      path,
      pathLength: path.length,
      pathDetails: path.map((item, index) => ({
        index,
        item,
        type: typeof item,
      })),
      newComponent: { id: cleanedComponent.id, tag: cleanedComponent.tag },
      insertIndex,
    });

    // 如果是根级别（直接添加到卡片）
    if (path.length === 3 && path[2] === 'elements') {
      if (insertIndex !== undefined) {
        newElements.splice(insertIndex, 0, cleanedComponent);
      } else {
        newElements.push(cleanedComponent);
      }
      console.log('✅ 根级别组件添加成功:', {
        componentId: cleanedComponent.id,
        componentTag: cleanedComponent.tag,
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
      componentToAdd?: ComponentType, // ✅ 修复：添加要添加的组件参数
    ): boolean => {
      if (!target) {
        console.error('❌ 路径导航失败：目标为空', {
          target: 'null',
          remainingPath,
          depth,
        });
        return false;
      }

      // 如果路径为空，说明已经到达目标位置，直接添加组件
      if (remainingPath.length === 0) {
        console.log('✅ 路径导航完成，到达目标位置，准备添加组件:', {
          targetType: typeof target,
          isArray: Array.isArray(target),
          targetLength: Array.isArray(target) ? target.length : 'N/A',
          insertIndex,
          componentId: componentToAdd?.id,
          componentTag: componentToAdd?.tag,
        });

        // 如果目标是数组，直接添加组件
        if (Array.isArray(target) && componentToAdd) {
          if (insertIndex !== undefined) {
            target.splice(insertIndex, 0, componentToAdd);
          } else {
            target.push(componentToAdd);
          }

          console.log('✅ 组件添加成功 (数组目标):', {
            componentId: componentToAdd.id,
            componentTag: componentToAdd.tag,
            insertIndex,
            arrayLength: target.length,
          });
          return true;
        }

        // 如果目标是对象，尝试添加到elements数组
        if (
          target.elements &&
          Array.isArray(target.elements) &&
          componentToAdd
        ) {
          if (insertIndex !== undefined) {
            target.elements.splice(insertIndex, 0, componentToAdd);
          } else {
            target.elements.push(componentToAdd);
          }

          console.log('✅ 组件添加成功 (对象elements):', {
            componentId: componentToAdd.id,
            componentTag: componentToAdd.tag,
            insertIndex,
            elementsLength: target.elements.length,
          });
          return true;
        }

        console.error('❌ 无法添加组件：目标既不是数组也没有elements属性', {
          targetType: typeof target,
          targetKeys: target ? Object.keys(target) : [],
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
        originalTargetPath,
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
              componentToAdd,
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
                componentToAdd,
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
                    componentToAdd,
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
              target.splice(insertIndex, 0, componentToAdd);
            } else {
              target.push(componentToAdd);
            }
            console.log('✅ 组件添加成功 (elements数组):', {
              componentId: componentToAdd.id,
              componentTag: componentToAdd.tag,
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
              target.elements.splice(insertIndex, 0, componentToAdd);
            } else {
              target.elements.push(componentToAdd);
            }
            console.log('✅ 组件添加成功 (组件elements):', {
              componentId: componentToAdd.id,
              componentTag: componentToAdd.tag,
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
                target.elements.splice(insertIndex, 0, componentToAdd);
              } else {
                target.elements.push(componentToAdd);
              }

              console.log('✅ 组件添加成功 (修复后):', {
                componentId: componentToAdd.id,
                componentTag: componentToAdd.tag,
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
            console.log('🔍 处理数字索引:', {
              nextKey,
              targetType: target ? typeof target : 'undefined',
              isArray: Array.isArray(target),
              targetLength: Array.isArray(target) ? target.length : 'N/A',
              depth,
              nextPath,
              targetDetails: target
                ? Array.isArray(target)
                  ? target.map((item, idx) => ({
                      index: idx,
                      id: item?.id || 'no id',
                      tag: item?.tag || 'no tag',
                    }))
                  : { id: target.id, tag: target.tag }
                : 'null/undefined',
            });

            if (
              Array.isArray(target) &&
              nextKey >= 0 &&
              nextKey < target.length
            ) {
              console.log('✅ 数字索引有效，继续导航:', {
                nextKey,
                targetLength: target.length,
                targetItem: target[nextKey]
                  ? { id: target[nextKey].id, tag: target[nextKey].tag }
                  : 'undefined',
                nextPath: nextPath.slice(1),
              });
              return navigateAndAdd(
                target[nextKey],
                nextPath.slice(1),
                depth + 1,
                rootElements,
                originalTargetPath,
                componentToAdd,
              );
            } else {
              // ✅ 修复：当数组为空时，直接添加组件
              if (Array.isArray(target) && target.length === 0) {
                console.log('✅ 目标数组为空，直接添加组件:', {
                  nextKey,
                  targetLength: target.length,
                  depth,
                  componentId: componentToAdd.id,
                  componentTag: componentToAdd.tag,
                });

                if (insertIndex !== undefined) {
                  target.splice(insertIndex, 0, componentToAdd);
                } else {
                  target.push(componentToAdd);
                }

                console.log('✅ 组件添加成功 (空数组):', {
                  componentId: componentToAdd.id,
                  componentTag: componentToAdd.tag,
                  insertIndex,
                  arrayLength: target.length,
                });
                return true;
              }

              // ✅ 修复：当目标不是数组时，尝试智能处理
              if (!Array.isArray(target) && target && target.tag === 'form') {
                console.log('✅ 目标不是数组而是表单组件，尝试智能处理:', {
                  targetTag: target.tag,
                  targetId: target.id,
                  hasElements: target.elements ? 'yes' : 'no',
                  elementsLength: target.elements
                    ? target.elements.length
                    : 'N/A',
                  nextKey,
                  depth,
                });

                // 如果表单有elements数组，尝试访问指定索引
                if (target.elements && Array.isArray(target.elements)) {
                  // ✅ 修复：如果索引超出范围，尝试智能修正
                  let correctedIndex = nextKey;
                  if (nextKey >= target.elements.length) {
                    console.warn('⚠️ 表单elements数组索引超出范围，尝试修正:', {
                      originalIndex: nextKey,
                      elementsLength: target.elements.length,
                      correctedIndex: 0,
                    });
                    correctedIndex = 0;
                  }

                  if (
                    correctedIndex >= 0 &&
                    correctedIndex < target.elements.length
                  ) {
                    console.log('✅ 从表单elements数组中获取组件:', {
                      originalIndex: nextKey,
                      correctedIndex,
                      elementsLength: target.elements.length,
                      targetItem: target.elements[correctedIndex]
                        ? {
                            id: target.elements[correctedIndex].id,
                            tag: target.elements[correctedIndex].tag,
                          }
                        : 'undefined',
                    });
                    return navigateAndAdd(
                      target.elements[correctedIndex],
                      nextPath.slice(1),
                      depth + 1,
                      rootElements,
                      originalTargetPath,
                      componentToAdd,
                    );
                  } else {
                    console.error('❌ 表单elements数组索引无效:', {
                      nextKey,
                      correctedIndex,
                      elementsLength: target.elements.length,
                      availableIndices: target.elements.map(
                        (_: any, idx: number) => idx,
                      ),
                      depth,
                    });
                    return false;
                  }
                } else {
                  console.error('❌ 表单组件缺少elements数组:', {
                    targetTag: target.tag,
                    targetId: target.id,
                    hasElements: target.elements ? 'yes' : 'no',
                    depth,
                  });
                  return false;
                }
              }

              console.error('❌ elements数组索引无效:', {
                nextKey,
                targetLength: Array.isArray(target) ? target.length : 'N/A',
                depth,
                targetType: target ? typeof target : 'undefined',
                isArray: Array.isArray(target),
                availableIndices: Array.isArray(target)
                  ? target.map((_, idx) => idx)
                  : 'N/A',
              });
              return false;
            }
          } else if (nextKey === 'elements') {
            console.log('🔍 处理elements路径段:', {
              targetTag: target ? target.tag : 'undefined',
              targetId: target ? target.id : 'undefined',
              depth,
              nextPath,
              hasElements: target && target.elements ? 'yes' : 'no',
              elementsIsArray:
                target && target.elements
                  ? Array.isArray(target.elements)
                  : 'N/A',
            });

            // 下一个也是elements，说明这是表单容器的结构
            if (target && target.elements && Array.isArray(target.elements)) {
              console.log('✅ 找到表单elements数组，继续导航:', {
                elementsLength: target.elements.length,
                nextPath: nextPath.slice(1),
              });
              return navigateAndAdd(
                target.elements,
                nextPath.slice(1),
                depth + 1,
                rootElements,
                originalTargetPath,
                componentToAdd,
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

                console.log('✅ 创建表单elements数组后继续导航:', {
                  elementsLength: target.elements.length,
                  nextPath: nextPath.slice(1),
                });

                return navigateAndAdd(
                  target.elements,
                  nextPath.slice(1),
                  depth + 1,
                  rootElements,
                  originalTargetPath,
                  componentToAdd,
                );
              } else {
                // ✅ 修复：当路径指向错误的组件类型时，尝试智能修正
                console.warn('⚠️ 路径指向了非容器组件，尝试智能修正:', {
                  targetTag: target ? target.tag : 'undefined',
                  targetId: target ? target.id : 'undefined',
                  depth,
                  nextPath,
                });

                // 如果当前目标是数组，说明我们已经到达了elements数组，直接在这里添加组件
                if (Array.isArray(target)) {
                  console.log('✅ 已到达elements数组，直接添加组件:', {
                    targetLength: target.length,
                    insertIndex,
                    componentId: componentToAdd.id,
                    componentTag: componentToAdd.tag,
                  });

                  if (insertIndex !== undefined) {
                    target.splice(insertIndex, 0, componentToAdd);
                  } else {
                    target.push(componentToAdd);
                  }

                  console.log('✅ 组件添加成功 (elements数组):', {
                    componentId: componentToAdd.id,
                    componentTag: componentToAdd.tag,
                    insertIndex,
                    arrayLength: target.length,
                  });
                  return true;
                }

                // ✅ 修复：如果当前目标是表单组件，但elements数组为空，需要创建分栏容器
                if (
                  target &&
                  target.tag === 'form' &&
                  (!target.elements || target.elements.length === 0)
                ) {
                  console.log('✅ 表单elements数组为空，创建分栏容器:', {
                    formId: target.id,
                    formTag: target.tag,
                  });

                  // 创建分栏容器
                  const columnSetComponent = {
                    id: `column_set_${Date.now()}_${Math.random()
                      .toString(36)
                      .substr(2, 9)}`,
                    tag: 'column_set',
                    name: 'ColumnSet',
                    columns: [
                      {
                        id: `column_${Date.now()}_${Math.random()
                          .toString(36)
                          .substr(2, 9)}`,
                        tag: 'column',
                        name: 'Column',
                        style: { flex: 1 }, // 使用style.flex而不是width
                        elements: [],
                      },
                      {
                        id: `column_${Date.now()}_${Math.random()
                          .toString(36)
                          .substr(2, 9)}`,
                        tag: 'column',
                        name: 'Column',
                        style: { flex: 1 }, // 使用style.flex而不是width
                        elements: [],
                      },
                      {
                        id: `column_${Date.now()}_${Math.random()
                          .toString(36)
                          .substr(2, 9)}`,
                        tag: 'column',
                        name: 'Column',
                        style: { flex: 1 }, // 使用style.flex而不是width
                        elements: [],
                      },
                    ],
                  };

                  // 将分栏容器添加到表单的elements数组中
                  if (!target.elements) {
                    target.elements = [];
                  }
                  target.elements.push(columnSetComponent);

                  console.log('✅ 分栏容器创建成功:', {
                    columnSetId: columnSetComponent.id,
                    columnsCount: columnSetComponent.columns.length,
                    formElementsLength: target.elements.length,
                  });

                  // 继续导航到分栏容器的第一列
                  return navigateAndAdd(
                    columnSetComponent.columns[0],
                    ['elements'],
                    depth + 1,
                    rootElements,
                    originalTargetPath,
                  );
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
                componentToAdd,
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
            componentToAdd,
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
          componentToAdd,
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
      originalPath: path,
      pathDetails: path.map((item, index) => ({
        index,
        item,
        type: typeof item,
      })),
    });

    // 验证路径的有效性
    if (path.length < 3) {
      console.error('❌ 路径长度不足:', {
        path,
        pathLength: path.length,
        expectedMinLength: 3,
      });
      return elements;
    }

    const success = navigateAndAdd(
      newElements,
      path.slice(3),
      0,
      newElements,
      path,
      cleanedComponent,
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
      elementsBeforeRemove: elements.length,
      elementsStructure: elements.map((el, idx) => ({
        index: idx,
        id: el.id,
        tag: el.tag,
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
        const removedComponent = newElements[index];
        newElements.splice(index, 1);
        console.log('✅ 根级别组件移除成功:', {
          removedIndex: index,
          removedComponent: {
            id: removedComponent.id,
            tag: removedComponent.tag,
          },
          newArrayLength: newElements.length,
          afterRemove: newElements.map((el, idx) => ({
            index: idx,
            id: el.id,
            tag: el.tag,
          })),
          originalArrayLength: elements.length,
          spliceResult: 'successful',
        });
      } else {
        console.error('❌ 根级别组件移除失败：索引无效', {
          index,
          arrayLength: newElements.length,
        });
      }
      console.log('🔄 根级别组件移除 - 返回新数组:', {
        returnArrayLength: newElements.length,
        returnArrayStructure: newElements.map((el, idx) => ({
          index: idx,
          id: el.id,
          tag: el.tag,
        })),
      });
      return newElements;
    }

    // 表单容器内组件移除 (路径长度为6)
    if (path.length === 6 && path[2] === 'elements' && path[4] === 'elements') {
      const formIndex = path[3] as number;
      const componentIndex = path[5] as number;

      console.log('🗑️ 表单容器内组件移除:', {
        formIndex,
        componentIndex,
        pathDetails: path,
        elementsLength: newElements.length,
      });

      // 检查表单索引是否有效
      if (formIndex >= 0 && formIndex < newElements.length) {
        const formComponent = newElements[formIndex];

        // 检查是否是表单组件且有elements数组
        if (
          formComponent &&
          formComponent.tag === 'form' &&
          Array.isArray((formComponent as any).elements)
        ) {
          const formElements = (formComponent as any).elements;

          console.log('🔍 表单容器检查通过:', {
            formId: formComponent.id,
            formElementsLength: formElements.length,
            componentIndex,
            componentToRemove: formElements[componentIndex]
              ? {
                  id: formElements[componentIndex].id,
                  tag: formElements[componentIndex].tag,
                }
              : 'undefined',
          });

          // 检查组件索引是否有效
          if (componentIndex >= 0 && componentIndex < formElements.length) {
            formElements.splice(componentIndex, 1);
            console.log('✅ 表单容器内组件移除成功:', {
              formIndex,
              removedComponentIndex: componentIndex,
              newFormElementsLength: formElements.length,
            });
          } else {
            console.error('❌ 表单容器内组件移除失败：组件索引无效', {
              componentIndex,
              formElementsLength: formElements.length,
            });
          }
        } else {
          console.error('❌ 表单容器内组件移除失败：不是有效的表单组件', {
            formComponent: formComponent
              ? {
                  id: formComponent.id,
                  tag: formComponent.tag,
                  hasElements: (formComponent as any).elements !== undefined,
                  elementsIsArray: Array.isArray(
                    (formComponent as any).elements,
                  ),
                }
              : 'null',
          });
        }
      } else {
        console.error('❌ 表单容器内组件移除失败：表单索引无效', {
          formIndex,
          elementsLength: newElements.length,
        });
      }
      return newElements;
    }

    // 分栏列删除 (路径长度为6，格式：['dsl', 'body', 'elements', columnSetIndex, 'columns', columnIndex])
    if (path.length === 6 && path[2] === 'elements' && path[4] === 'columns') {
      const columnSetIndex = path[3] as number;
      const columnIndex = path[5] as number;

      console.log('🗑️ 分栏列删除:', {
        columnSetIndex,
        columnIndex,
        pathDetails: path,
        elementsLength: newElements.length,
      });

      // 检查分栏容器索引是否有效
      if (columnSetIndex >= 0 && columnSetIndex < newElements.length) {
        const columnSetComponent = newElements[columnSetIndex];

        // 检查是否是分栏容器组件且有columns数组
        if (
          columnSetComponent &&
          columnSetComponent.tag === 'column_set' &&
          Array.isArray((columnSetComponent as any).columns)
        ) {
          const columns = (columnSetComponent as any).columns;

          console.log('🔍 分栏容器检查通过:', {
            columnSetId: columnSetComponent.id,
            columnsLength: columns.length,
            columnIndex,
            columnToRemove: columns[columnIndex]
              ? {
                  id: columns[columnIndex].id,
                  tag: columns[columnIndex].tag,
                }
              : 'undefined',
          });

          // 检查列索引是否有效
          if (columnIndex >= 0 && columnIndex < columns.length) {
            columns.splice(columnIndex, 1);
            console.log('✅ 分栏列删除成功:', {
              columnSetIndex,
              removedColumnIndex: columnIndex,
              newColumnsLength: columns.length,
            });

            // 如果删除后没有列了，删除整个分栏容器
            if (columns.length === 0) {
              console.log('🗑️ 删除最后一个列，删除整个分栏容器');
              newElements.splice(columnSetIndex, 1);
            }
          } else {
            console.error('❌ 分栏列删除失败：列索引无效', {
              columnIndex,
              columnsLength: columns.length,
            });
          }
        } else {
          console.error('❌ 分栏列删除失败：不是有效的分栏容器组件', {
            columnSetComponent: columnSetComponent
              ? {
                  id: columnSetComponent.id,
                  tag: columnSetComponent.tag,
                  hasColumns: (columnSetComponent as any).columns !== undefined,
                  columnsIsArray: Array.isArray(
                    (columnSetComponent as any).columns,
                  ),
                }
              : 'null',
          });
        }
      } else {
        console.error('❌ 分栏列删除失败：分栏容器索引无效', {
          columnSetIndex,
          elementsLength: newElements.length,
        });
      }
      return newElements;
    }

    // 表单内分栏列删除 (路径长度为8，格式：['dsl', 'body', 'elements', formIndex, 'elements', columnSetIndex, 'columns', columnIndex])
    if (
      path.length === 8 &&
      path[2] === 'elements' &&
      path[4] === 'elements' &&
      path[6] === 'columns'
    ) {
      const formIndex = path[3] as number;
      const columnSetIndex = path[5] as number;
      const columnIndex = path[7] as number;

      console.log('🗑️ 表单内分栏列删除:', {
        formIndex,
        columnSetIndex,
        columnIndex,
        pathDetails: path,
        elementsLength: newElements.length,
      });

      // 检查表单索引是否有效
      if (formIndex >= 0 && formIndex < newElements.length) {
        const formComponent = newElements[formIndex];

        // 检查是否是表单组件且有elements数组
        if (
          formComponent &&
          formComponent.tag === 'form' &&
          Array.isArray((formComponent as any).elements)
        ) {
          const formElements = (formComponent as any).elements;

          // 检查分栏容器索引是否有效
          if (columnSetIndex >= 0 && columnSetIndex < formElements.length) {
            const columnSetComponent = formElements[columnSetIndex];

            // 检查是否是分栏容器组件且有columns数组
            if (
              columnSetComponent &&
              columnSetComponent.tag === 'column_set' &&
              Array.isArray((columnSetComponent as any).columns)
            ) {
              const columns = (columnSetComponent as any).columns;

              console.log('🔍 表单内分栏容器检查通过:', {
                formId: formComponent.id,
                columnSetId: columnSetComponent.id,
                columnsLength: columns.length,
                columnIndex,
                columnToRemove: columns[columnIndex]
                  ? {
                      id: columns[columnIndex].id,
                      tag: columns[columnIndex].tag,
                    }
                  : 'undefined',
              });

              // 检查列索引是否有效
              if (columnIndex >= 0 && columnIndex < columns.length) {
                columns.splice(columnIndex, 1);
                console.log('✅ 表单内分栏列删除成功:', {
                  formIndex,
                  columnSetIndex,
                  removedColumnIndex: columnIndex,
                  newColumnsLength: columns.length,
                });

                // 如果删除后没有列了，删除整个分栏容器
                if (columns.length === 0) {
                  console.log('🗑️ 删除最后一个列，删除整个分栏容器');
                  formElements.splice(columnSetIndex, 1);
                }
              } else {
                console.error('❌ 表单内分栏列删除失败：列索引无效', {
                  columnIndex,
                  columnsLength: columns.length,
                });
              }
            } else {
              console.error('❌ 表单内分栏列删除失败：不是有效的分栏容器组件', {
                columnSetComponent: columnSetComponent
                  ? {
                      id: columnSetComponent.id,
                      tag: columnSetComponent.tag,
                      hasColumns:
                        (columnSetComponent as any).columns !== undefined,
                      columnsIsArray: Array.isArray(
                        (columnSetComponent as any).columns,
                      ),
                    }
                  : 'null',
              });
            }
          } else {
            console.error('❌ 表单内分栏列删除失败：分栏容器索引无效', {
              columnSetIndex,
              formElementsLength: formElements.length,
            });
          }
        } else {
          console.error('❌ 表单内分栏列删除失败：不是有效的表单组件', {
            formComponent: formComponent
              ? {
                  id: formComponent.id,
                  tag: formComponent.tag,
                  hasElements: (formComponent as any).elements !== undefined,
                  elementsIsArray: Array.isArray(
                    (formComponent as any).elements,
                  ),
                }
              : 'null',
          });
        }
      } else {
        console.error('❌ 表单内分栏列删除失败：表单索引无效', {
          formIndex,
          elementsLength: newElements.length,
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

      console.log('🔍 递归移除步骤:', {
        key,
        keyType: typeof key,
        depth,
        remainingPath: p,
        targetType: Array.isArray(target) ? 'array' : typeof target,
        targetTag: target?.tag,
        targetId: target?.id,
        hasElements: target?.elements !== undefined,
        elementsIsArray: Array.isArray(target?.elements),
        hasColumns: target?.columns !== undefined,
        columnsIsArray: Array.isArray(target?.columns),
      });

      if (key === 'elements' && Array.isArray(target.elements)) {
        console.log('✅ 递归进入 elements 数组:', {
          elementsLength: target.elements.length,
          depth,
          remainingPath: p.slice(1),
        });
        return recursiveRemove(target.elements, p.slice(1), depth + 1);
      }
      if (key === 'columns' && Array.isArray(target.columns)) {
        const colIdx = p[1] as number;
        if (colIdx >= 0 && colIdx < target.columns.length) {
          console.log('✅ 递归进入 columns 数组:', {
            colIdx,
            columnsLength: target.columns.length,
            depth,
          });
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
        console.log('✅ 递归进入数组索引:', {
          key,
          targetLength: target.length,
          depth,
          remainingPath: p.slice(1),
        });
        return recursiveRemove(target[key], p.slice(1), depth + 1);
      }
      // 兜底
      if (target[key] !== undefined) {
        console.log('⚠️ 使用兜底逻辑进入:', {
          key,
          targetKeyType: typeof target[key],
          depth,
          remainingPath: p.slice(1),
        });
        return recursiveRemove(target[key], p.slice(1), depth + 1);
      }
      console.error('❌ 递归移除失败，路径无效', {
        key,
        depth,
        target: {
          type: Array.isArray(target) ? 'array' : typeof target,
          tag: target?.tag,
          id: target?.id,
          keys: target ? Object.keys(target) : 'null',
        },
        remainingPath: p,
      });
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
      draggedItem: {
        type: draggedItem.type,
        isNew: draggedItem.isNew,
        component: draggedItem.component,
        componentTag: draggedItem.component?.tag,
      },
      targetPath,
      dropIndex,
      onHeaderDataChange: !!onHeaderDataChange,
    });

    // 特殊处理标题组件
    if (
      draggedItem.type === 'title' ||
      (draggedItem.component && draggedItem.component.tag === 'title')
    ) {
      console.log('🎯 检测到标题组件拖拽:', {
        isNew: draggedItem.isNew,
        component: draggedItem.component,
        hasCallback: !!onHeaderDataChange,
      });

      // 标题组件不添加到elements中，而是直接更新header数据
      if (draggedItem.isNew) {
        // 新标题组件，使用默认标题数据
        const defaultHeaderData = {
          title: { content: '主标题' },
          subtitle: { content: '副标题' },
          style: 'blue',
        };

        console.log(
          '🆕 创建新标题组件，准备更新header数据:',
          defaultHeaderData,
        );

        if (onHeaderDataChange) {
          console.log('✅ 调用onHeaderDataChange回调');
          onHeaderDataChange(defaultHeaderData);
          message.success('标题组件已添加到卡片头部');
        } else {
          console.error('❌ 缺少onHeaderDataChange回调函数');
          message.warning('无法添加标题数据，缺少回调函数');
        }
      } else if (draggedItem.component) {
        // 现有标题组件，从表单或其他位置移动到header
        const titleComponent = draggedItem.component as any;
        const headerData = {
          title: { content: titleComponent.title || '主标题' },
          subtitle: { content: titleComponent.subtitle || '副标题' },
          style: titleComponent.style || 'blue',
        };

        console.log('🔄 更新现有标题组件，准备更新header数据:', headerData);

        if (onHeaderDataChange) {
          console.log('✅ 调用onHeaderDataChange回调');
          onHeaderDataChange(headerData);
          message.success('标题组件已更新到卡片头部');
        } else {
          console.error('❌ 缺少onHeaderDataChange回调函数');
          message.warning('无法更新标题数据，缺少回调函数');
        }
      }
      return; // 标题组件处理完毕，直接返回
    }

    if (draggedItem.isNew) {
      // 检查表单组件限制（只在拖拽到根级别时检查）
      const isRootLevel =
        targetPath.length === 3 && targetPath[2] === 'elements';
      if (
        draggedItem.type === 'form' &&
        isRootLevel &&
        hasExistingForm(elements)
      ) {
        message.warning('画布中已存在表单容器，每个画布只能有一个表单容器');
        return;
      }

      // 新组件
      const newComponent = createDefaultComponent(draggedItem.type);

      console.log('🆕 创建新组件:', {
        componentType: draggedItem.type,
        componentId: newComponent.id,
        targetPath,
        dropIndex,
        pathAnalysis: {
          isRoot: isRootLevel,
          isForm: targetPath.includes('elements') && targetPath.length > 3,
          isColumn: targetPath.includes('columns'),
        },
      });

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

      console.log('🔄 现有组件移动 - 开始处理:', {
        componentId: draggedComponent.id,
        componentTag: draggedComponent.tag,
        fromPath: draggedPath,
        toPath: targetPath,
        dropIndex,
        elementsBeforeMove: elements.length,
      });

      // 检查表单组件限制（只在移动到根级别时检查，且不是自身移动）
      const isRootLevel =
        targetPath.length === 3 && targetPath[2] === 'elements';
      const isMovingFormToRoot = draggedComponent.tag === 'form' && isRootLevel;
      const isFormAlreadyAtRoot =
        draggedPath.length === 4 && draggedPath[2] === 'elements';

      if (
        isMovingFormToRoot &&
        !isFormAlreadyAtRoot &&
        hasExistingForm(elements)
      ) {
        message.warning('画布中已存在表单容器，每个画布只能有一个表单容器');
        return;
      }

      // ✅ 修复：确保操作的原子性，避免重复引用
      // 先移除原位置的组件
      console.log('🔄 开始移除组件 - 详细状态:', {
        originalElementsCount: elements.length,
        originalElements: elements.map((el, idx) => ({
          index: idx,
          id: el.id,
          tag: el.tag,
        })),
        draggedComponentId: draggedComponent.id,
        draggedPath,
      });

      let newElements = removeComponentByPath(elements, draggedPath);

      console.log('🗑️ 组件移除完成，验证结果:', {
        originalElementsLength: elements.length,
        newElementsLength: newElements.length,
        removedComponentId: draggedComponent.id,
        removedComponentTag: draggedComponent.tag,
        originalElements: elements.map((el, idx) => ({
          index: idx,
          id: el.id,
          tag: el.tag,
        })),
        newElements: newElements.map((el, idx) => ({
          index: idx,
          id: el.id,
          tag: el.tag,
        })),
        arraysAreSame: elements === newElements,
        deepEqual: JSON.stringify(elements) === JSON.stringify(newElements),
      });

      // ✅ 修复：验证组件确实被移除
      // 注意：这里只验证组件是否从原始位置被移除，而不是验证它完全不存在
      // 因为组件将被添加到新位置，所以完全不存在的检查是错误的
      let componentRemovedFromOriginalPosition = false;

      if (draggedPath.length === 4 && draggedPath[2] === 'elements') {
        // 根级别组件：检查原始索引位置是否还有这个组件
        const originalIndex = draggedPath[3] as number;
        componentRemovedFromOriginalPosition =
          originalIndex >= newElements.length ||
          newElements[originalIndex]?.id !== draggedComponent.id;
      } else if (draggedPath.length === 6 && draggedPath[4] === 'elements') {
        // 表单内组件：检查表单的elements数组
        const formIndex = draggedPath[3] as number;
        const componentIndex = draggedPath[5] as number;
        const formComponent = newElements[formIndex];
        if (formComponent && formComponent.tag === 'form') {
          const formElements = (formComponent as any).elements || [];
          componentRemovedFromOriginalPosition =
            componentIndex >= formElements.length ||
            formElements[componentIndex]?.id !== draggedComponent.id;
        }
      } else if (
        draggedPath.length === 8 &&
        draggedPath[4] === 'columns' &&
        draggedPath[6] === 'elements'
      ) {
        // 分栏内组件：检查分栏的elements数组
        const columnSetIndex = draggedPath[3] as number;
        const columnIndex = draggedPath[5] as number;
        const componentIndex = draggedPath[7] as number;
        const columnSetComponent = newElements[columnSetIndex];
        if (columnSetComponent && columnSetComponent.tag === 'column_set') {
          const columns = (columnSetComponent as any).columns || [];
          if (columnIndex < columns.length && columns[columnIndex].elements) {
            const columnElements = columns[columnIndex].elements;
            componentRemovedFromOriginalPosition =
              componentIndex >= columnElements.length ||
              columnElements[componentIndex]?.id !== draggedComponent.id;
          }
        }
      } else if (
        draggedPath.length === 10 &&
        draggedPath[4] === 'elements' &&
        draggedPath[6] === 'columns' &&
        draggedPath[8] === 'elements'
      ) {
        console.log('✅ 进入分栏容器内普通组件验证分支');
        // 分栏容器内普通组件：检查分栏的elements数组
        // 路径格式：['dsl', 'body', 'elements', formIndex, 'elements', columnSetIndex, 'columns', columnIndex, 'elements', componentIndex]
        const formIndex = draggedPath[3] as number;
        const columnSetIndex = draggedPath[5] as number;
        const columnIndex = draggedPath[7] as number;
        const componentIndex = draggedPath[9] as number;
        const formComponent = newElements[formIndex];

        console.log('🔍 分栏容器内普通组件验证 - 路径解析:', {
          formIndex,
          columnSetIndex,
          columnIndex,
          componentIndex,
          formComponent: formComponent
            ? {
                id: formComponent.id,
                tag: formComponent.tag,
                hasElements: (formComponent as any).elements !== undefined,
              }
            : 'null',
        });

        if (formComponent && formComponent.tag === 'form') {
          const formElements = (formComponent as any).elements || [];
          const columnSetComponent = formElements[columnSetIndex];

          console.log('🔍 分栏容器内普通组件验证:', {
            columnSetIndex,
            columnIndex,
            componentIndex,
            columnSetComponent: columnSetComponent
              ? {
                  id: columnSetComponent.id,
                  tag: columnSetComponent.tag,
                  hasColumns: (columnSetComponent as any).columns !== undefined,
                }
              : 'null',
          });

          if (columnSetComponent && columnSetComponent.tag === 'column_set') {
            const columns = (columnSetComponent as any).columns || [];

            console.log('🔍 分栏容器内普通组件验证 - 列检查:', {
              columnsLength: columns.length,
              columnIndex,
              targetColumn:
                columnIndex < columns.length
                  ? {
                      id: columns[columnIndex].id,
                      tag: columns[columnIndex].tag,
                      hasElements: columns[columnIndex].elements !== undefined,
                      elementsLength:
                        columns[columnIndex].elements?.length || 0,
                    }
                  : 'out of range',
            });

            if (columnIndex < columns.length && columns[columnIndex].elements) {
              const columnElements = columns[columnIndex].elements;

              console.log('🔍 分栏容器内普通组件验证 - 最终检查:', {
                componentIndex,
                columnElementsLength: columnElements.length,
                componentAtPosition:
                  componentIndex < columnElements.length
                    ? {
                        id: columnElements[componentIndex].id,
                        tag: columnElements[componentIndex].tag,
                      }
                    : 'out of range',
                expectedComponentId: draggedComponent.id,
                isRemoved:
                  componentIndex >= columnElements.length ||
                  columnElements[componentIndex]?.id !== draggedComponent.id,
              });

              componentRemovedFromOriginalPosition =
                componentIndex >= columnElements.length ||
                columnElements[componentIndex]?.id !== draggedComponent.id;
            }
          }
        }
      }

      console.log('🔍 组件移除验证结果:', {
        componentId: draggedComponent.id,
        originalPath: draggedPath,
        removedFromOriginalPosition: componentRemovedFromOriginalPosition,
        verificationMethod: 'specific position check',
      });

      if (!componentRemovedFromOriginalPosition) {
        console.error('❌ 组件移除失败，组件仍然在原始位置:', {
          componentId: draggedComponent.id,
          originalPath: draggedPath,
        });
        message.error('组件移动失败：无法从原位置移除组件');
        return;
      }

      // 修复目标路径：当移除组件后，需要调整目标路径中的索引
      let adjustedTargetPath = [...targetPath];

      // 如果是根级别移动（从根级别到容器），需要调整目标容器的索引
      if (
        draggedPath.length === 4 &&
        draggedPath[2] === 'elements' &&
        targetPath.length >= 4 &&
        targetPath[2] === 'elements'
      ) {
        const draggedIndex = draggedPath[3] as number;
        const targetContainerIndex = targetPath[3] as number;

        // 如果目标容器在被拖拽组件之后，索引需要减1
        if (targetContainerIndex > draggedIndex) {
          adjustedTargetPath[3] = targetContainerIndex - 1;
          console.log('🔧 调整目标路径索引:', {
            originalTargetPath: targetPath,
            adjustedTargetPath,
            draggedIndex,
            originalTargetContainerIndex: targetContainerIndex,
            adjustedTargetContainerIndex: targetContainerIndex - 1,
            reason: '移除组件后目标容器索引前移',
          });
        }
      }

      // 再添加到新位置（使用调整后的路径）
      console.log('🔄 使用调整后的路径添加组件:', {
        originalTargetPath: targetPath,
        adjustedTargetPath,
        draggedComponent: {
          id: draggedComponent.id,
          tag: draggedComponent.tag,
        },
        dropIndex,
        currentElementsCount: newElements.length,
      });

      newElements = addComponentByPath(
        newElements,
        adjustedTargetPath,
        draggedComponent,
        dropIndex,
      );

      console.log('✅ 组件移动完成，最终验证:', {
        finalElementsLength: newElements.length,
        movedComponentId: draggedComponent.id,
        targetPath,
        finalElementsSummary: newElements.map((el, idx) => ({
          index: idx,
          id: el.id,
          tag: el.tag,
        })),
      });

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
      // 如果是表单组件，检查是否已存在
      if (item.type === 'form' && hasExistingForm(elements)) {
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

      // 如果是表单组件且已存在，显示提示
      if (item.type === 'form' && hasExistingForm(elements)) {
        message.warning('画布中已存在表单容器，每个画布只能有一个表单容器');
        return;
      }
      // 特殊处理标题组件
      if (item.type === 'title') {
        // console.log('🎯 检测到标题组件拖拽，调用handleContainerDrop');
        handleContainerDrop(item, ['dsl', 'body', 'elements']);
        return;
      }

      if (item.isNew) {
        // 新组件
        const newComponent = createDefaultComponent(item.type);

        // 清理组件：如果是拖拽到画布根节点，移除 required 字段
        const cleanedComponent = cleanRequiredFieldBasedOnTarget(newComponent, [
          'dsl',
          'body',
          'elements',
        ]);

        // 其他组件添加到末尾
        onElementsChange([...elements, cleanedComponent]);
        message.success(`${item.type} 组件已添加到画布`);
      } else if (item.component && item.path) {
        // 现有组件移动到画布根级别
        // console.log('🔄 移动现有组件到画布根级别:', {
        //   component: { id: item.component.id, tag: item.component.tag },
        //   fromPath: item.path,
        // });

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
    // const currentTarget = e.currentTarget as HTMLElement;

    // console.log('🎯 卡片点击处理:', {
    //   targetTag: target.tagName,
    //   targetClass: target.className,
    //   targetId: target.id,
    //   targetDataset: target.dataset,
    //   targetAttributes: Array.from(target.attributes).map(
    //     (attr) => `${attr.name}="${attr.value}"`,
    //   ),
    //   isCurrentTarget: target === currentTarget,
    //   hasComponentWrapper: !!target.closest('[data-component-wrapper]'),
    //   hasDragSortableItem: !!target.closest('[data-drag-sortable-item]'),
    //   hasCardContainer: !!target.closest('[data-card-container]'),
    //   isCardSelected,
    //   componentId: target.getAttribute('data-component-id'),
    //   closestComponentWrapper: target
    //     .closest('[data-component-wrapper]')
    //     ?.getAttribute('data-component-id'),
    //   targetTextContent: target.textContent?.substring(0, 50),
    //   targetParentTag: target.parentElement?.tagName,
    //   targetParentClass: target.parentElement?.className,
    //   targetParentId: target.parentElement?.id,
    //   targetParentDataset: target.parentElement?.dataset,
    // });

    // 立即阻止事件冒泡，防止触发画布点击事件
    e.stopPropagation();

    // 如果卡片已经被选中，不再重复处理选中事件
    if (isCardSelected) {
      console.log('🚫 卡片已选中，跳过重复选中');
      return;
    }

    // 检查是否点击了组件包装器
    const componentWrapper = target.closest('[data-component-wrapper]');
    if (componentWrapper) {
      console.log('✅ 检测到组件点击，跳过卡片选中');
      return;
    }

    // 检查是否点击了拖拽排序项
    const dragSortableItem = target.closest('[data-drag-sortable-item]');
    if (dragSortableItem) {
      console.log('✅ 检测到拖拽排序项点击，跳过卡片选中');
      return;
    }

    // console.log('✅ 处理卡片选中');
    onCardSelect();
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: '#fff',
    borderRadius: '4px',
    border: isCardSelected ? '2px solid #1890ff' : '2px solid transparent',
    boxShadow: isCardSelected
      ? '0 0 8px rgba(24, 144, 255, 0.3)'
      : '0 2px 8px rgba(0, 0, 0, 0.1)',
    padding: '4px',
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
      <div
        style={{
          display: layoutMode === 'flow' ? 'flex' : 'flex',
          flexDirection: layoutMode === 'flow' ? 'row' : 'column',
          flexWrap: layoutMode === 'flow' ? 'wrap' : 'nowrap',
          gap: layoutMode === 'flow' ? '8px' : `${verticalSpacing}px`,
          position: 'relative',
        }}
      >
        {/* 标题显示区域 - 独立于elements显示 */}
        {(() => {
          return (
            headerData &&
            (headerData.title?.content || headerData.subtitle?.content)
          );
        })() && (
          <div
            style={{
              // padding: '16px 0',
              borderBottom: '1px solid #f0f0f0',
              // marginBottom: '16px',
              position: 'relative',
            }}
            data-component-wrapper="true"
            data-component-id="title-component"
            onMouseDown={(e) => {
              e.stopPropagation();
              console.log('🎯 标题被点击 (onMouseDown)，选中标题组件');
              // 创建一个虚拟的标题组件用于选中，包含完整的标题数据
              const titleComponent = {
                id: 'title-component',
                tag: 'title' as const,
                title: headerData?.title?.content || '主标题',
                subtitle: headerData?.subtitle?.content || '副标题',
                style: (headerData?.style || 'blue') as
                  | 'blue'
                  | 'wathet'
                  | 'turquoise'
                  | 'green'
                  | 'yellow'
                  | 'orange'
                  | 'red',
              };
              onSelectComponent(titleComponent, ['dsl', 'header']);
              onCanvasFocus();
            }}
            onClick={(e) => {
              e.stopPropagation();
              console.log('🎯 标题被点击 (onClick)，选中标题组件');
              // 创建一个虚拟的标题组件用于选中，包含完整的标题数据
              const titleComponent = {
                id: 'title-component',
                tag: 'title' as const,
                title: headerData?.title?.content || '主标题',
                subtitle: headerData?.subtitle?.content || '副标题',
                style: (headerData?.style || 'blue') as
                  | 'blue'
                  | 'wathet'
                  | 'turquoise'
                  | 'green'
                  | 'yellow'
                  | 'orange'
                  | 'red',
              };
              onSelectComponent(titleComponent, ['dsl', 'header']);
              onCanvasFocus();
            }}
          >
            {/* 标题内容区域 */}
            <div
              style={{
                padding: '16px',
                borderWidth: isSamePath(selectedPath || null, ['dsl', 'header'])
                  ? '2px'
                  : '2px',
                borderStyle: 'solid',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                // 应用主题样式
                ...(() => {
                  const themeStyle = headerData?.style || 'blue';
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
                          borderColor: '#7dd3fc',
                          titleColor: '#0ea5e9',
                          subtitleColor: '#0284c7',
                        };
                      case 'turquoise':
                        return {
                          backgroundColor: '#f0fdfa',
                          borderColor: '#5eead4',
                          titleColor: '#14b8a6',
                          subtitleColor: '#0f766e',
                        };
                      case 'green':
                        return {
                          backgroundColor: '#f0fdf4',
                          borderColor: '#86efac',
                          titleColor: '#22c55e',
                          subtitleColor: '#15803d',
                        };
                      case 'yellow':
                        return {
                          backgroundColor: '#fefce8',
                          borderColor: '#fde047',
                          titleColor: '#eab308',
                          subtitleColor: '#a16207',
                        };
                      case 'orange':
                        return {
                          backgroundColor: '#fff7ed',
                          borderColor: '#fdba74',
                          titleColor: '#f97316',
                          subtitleColor: '#ea580c',
                        };
                      case 'red':
                        return {
                          backgroundColor: '#fef2f2',
                          borderColor: '#fca5a5',
                          titleColor: '#ef4444',
                          subtitleColor: '#dc2626',
                        };
                      default:
                        return {
                          backgroundColor: '#e6f7ff',
                          borderColor: '#91d5ff',
                          titleColor: '#1890ff',
                          subtitleColor: '#096dd9',
                        };
                    }
                  };
                  const styles = getThemeStyles(themeStyle);
                  return {
                    backgroundColor: isSamePath(selectedPath || null, [
                      'dsl',
                      'header',
                    ])
                      ? 'rgba(24, 144, 255, 0.05)'
                      : styles.backgroundColor,
                    borderColor: isSamePath(selectedPath || null, [
                      'dsl',
                      'header',
                    ])
                      ? '#1890ff'
                      : styles.borderColor,
                    boxShadow: isSamePath(selectedPath || null, [
                      'dsl',
                      'header',
                    ])
                      ? '0 0 8px rgba(24, 144, 255, 0.3)'
                      : 'none',
                  };
                })(),
              }}
            >
              {/* 操作菜单 - 只在标题被选中时显示 */}
              {isSamePath(selectedPath || null, ['dsl', 'header']) && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    zIndex: 10,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Dropdown
                    menu={{
                      items: [
                        {
                          key: 'delete',
                          icon: <DeleteOutlined />,
                          label: '删除组件',
                          onClick: () => {
                            console.log('🗑️ 删除标题组件');
                            // 清除选择状态
                            onSelectComponent(null);
                            // 通知父组件删除header数据
                            if (onHeaderDataChange) {
                              onHeaderDataChange({
                                title: { content: '' },
                                subtitle: { content: '' },
                                style: 'blue',
                              });
                            }
                            message.success('标题组件已删除');
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

              {headerData?.title?.content && (
                <div
                  style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    marginBottom: headerData.subtitle?.content ? '8px' : '0',
                    // 应用主题样式的主标题颜色
                    color: (() => {
                      const themeStyle = headerData?.style || 'blue';
                      const getThemeStyles = (theme: string) => {
                        switch (theme) {
                          case 'blue':
                            return '#1890ff';
                          case 'wathet':
                            return '#0369a1';
                          case 'turquoise':
                            return '#0d9488';
                          case 'green':
                            return '#52c41a';
                          case 'yellow':
                            return '#faad14';
                          case 'orange':
                            return '#fa8c16';
                          case 'red':
                            return '#ff4d4f';
                          default:
                            return '#333';
                        }
                      };
                      return getThemeStyles(themeStyle);
                    })(),
                  }}
                >
                  {headerData.title.content}
                </div>
              )}
              {headerData?.subtitle?.content && (
                <div
                  style={{
                    fontSize: '14px',
                    // 应用主题样式的副标题颜色
                    color: (() => {
                      const themeStyle = headerData?.style || 'blue';
                      const getThemeStyles = (theme: string) => {
                        switch (theme) {
                          case 'blue':
                            return '#096dd9';
                          case 'wathet':
                            return '#0c4a6e';
                          case 'turquoise':
                            return '#0f766e';
                          case 'green':
                            return '#389e0d';
                          case 'yellow':
                            return '#d48806';
                          case 'orange':
                            return '#d46b08';
                          case 'red':
                            return '#cf1322';
                          default:
                            return '#666';
                        }
                      };
                      return getThemeStyles(themeStyle);
                    })(),
                  }}
                >
                  {headerData.subtitle.content}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 其他组件区域 */}
        {elements.length > 0 ? (
          <>
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
              const isSelected = isSamePath(
                selectedPath || null,
                componentPath,
              );
              const isHovered = isSamePath(hoveredPath, componentPath);

              return (
                <DragSortableItem
                  key={`${component.id}-${index}-${componentPath.join('-')}`}
                  component={component}
                  index={index}
                  path={componentPath}
                  onMove={handleCanvasComponentSort}
                  onClearSelection={() => onSelectComponent(null)}
                >
                  <ErrorBoundary>
                    <div
                      style={{
                        display:
                          layoutMode === 'flow' ? 'inline-block' : 'block',
                        // marginBottom: layoutMode === 'flow' ? '0' : '8px',
                        marginBottom: '0',
                        marginRight: layoutMode === 'flow' ? '8px' : '0',
                      }}
                    >
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
                        headerData={headerData}
                        variables={variables}
                      />
                    </div>
                  </ErrorBoundary>
                </DragSortableItem>
              );
            })}
          </>
        ) : (
          // 空状态提示
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '200px',
              color: '#999',
              border: '1px dashed #d9d9d9',
              borderRadius: '8px',
              backgroundColor: '#fafafa',
            }}
          >
            <div style={{ fontSize: '16px', marginBottom: '8px' }}>
              拖拽组件到这里
            </div>
          </div>
        )}
      </div>
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
