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

  const [{ isDragging }, drag] = useDrag({
    type: 'canvas-component',
    item: () => {
      console.log('🚀 DragSortableItem 开始拖拽:', {
        componentId: component.id,
        componentTag: component.tag,
        index,
        path,
        canDrag: component.tag !== 'title',
      });
      return {
        id: component.id,
        index,
        component,
        path,
        type: component.tag,
        isNew: false,
      };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    // 标题组件不允许拖拽
    canDrag: () => {
      const canDrag = component.tag !== 'title';
      console.log('🎯 DragSortableItem canDrag 检查:', {
        componentTag: component.tag,
        canDrag,
      });
      return canDrag;
    },
  });

  const [{ handlerId, isOver }, drop] = useDrop({
    accept: 'canvas-component',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
        isOver: monitor.isOver(),
      };
    },
    hover(item: any, monitor) {
      if (!ref.current) {
        return;
      }

      console.log('🖱️ DragSortableItem hover 触发:', {
        draggedComponent: item.component?.tag,
        draggedIndex: item.index,
        hoverComponent: component.tag,
        hoverIndex: index,
      });

      const dragIndex = item.index;
      const hoverIndex = index;

      // 不要替换自己
      if (dragIndex === hoverIndex) {
        return;
      }

      // 获取hover元素的边界矩形
      const hoverBoundingRect = ref.current?.getBoundingClientRect();

      // 获取垂直方向的中点
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

      // 确定鼠标位置
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;

      // 获取鼠标相对于hover元素的位置
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      // 只有当鼠标越过了元素的中点时才执行移动
      // 向下拖拽时，只有当鼠标位于下半部分时才移动
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      // 向上拖拽时，只有当鼠标位于上半部分时才移动
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      // 特殊处理标题组件的拖拽限制
      const draggedComponent = item.component;
      const hoverComponent = component;

      // 1. 标题组件不能移动到非标题组件的位置
      if (draggedComponent.tag === 'title' && hoverComponent.tag !== 'title') {
        return;
      }

      // 2. 非标题组件不能移动到标题组件的位置（第一位）
      if (draggedComponent.tag !== 'title' && hoverComponent.tag === 'title') {
        return;
      }

      // 3. 不能将非标题组件移动到第一位（如果第一位是标题）
      if (hoverIndex === 0 && draggedComponent.tag !== 'title') {
        return;
      }

      // 执行移动
      onMove(dragIndex, hoverIndex);

      // 注意：这里我们修改了监视器项目，因为我们在移动时修改了索引
      // 一般来说，最好避免修改监视器项目，但这里是为了性能考虑
      item.index = hoverIndex;
    },
  });

  const opacity = isDragging ? 0.4 : 1;
  drag(drop(ref));

  return (
    <div
      ref={ref}
      style={{
        opacity,
        position: 'relative',
        transition: 'all 0.2s ease',
        cursor: component.tag === 'title' ? 'default' : 'grab',
      }}
      data-handler-id={handlerId}
    >
      {/* 拖拽排序指示线 */}
      {isOver && (
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

    // 从索引3开始导航（跳过 'dsl', 'body', 'elements'）
    for (let i = 3; i < path.length; i++) {
      const key = path[i];

      if (key === 'elements') {
        // 如果是最后一个elements，返回当前数组或对象的elements属性
        if (i === path.length - 1) {
          if (Array.isArray(current)) {
            return current;
          } else if (
            current &&
            current.elements &&
            Array.isArray(current.elements)
          ) {
            return current.elements;
          } else {
            return null;
          }
        } else {
          // 中间的elements，继续导航
          const nextIndex = path[i + 1] as number;
          if (current && Array.isArray(current) && current[nextIndex]) {
            current = current[nextIndex];
            i++; // 跳过下一个索引
          } else {
            return null;
          }
        }
      } else if (key === 'columns') {
        const columnIndex = path[i + 1] as number;
        if (
          current &&
          current.columns &&
          Array.isArray(current.columns) &&
          current.columns[columnIndex] &&
          current.columns[columnIndex].elements
        ) {
          current = current.columns[columnIndex].elements;
          i += 2; // 跳过下两个索引
        } else {
          return null;
        }
      } else if (typeof key === 'number') {
        if (current && Array.isArray(current) && current[key]) {
          current = current[key];
        } else {
          return null;
        }
      } else {
        if (current && current[key] !== undefined) {
          current = current[key];
        } else {
          return null;
        }
      }
    }

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
      return newElements;
    }

    // 导航到目标容器
    for (let i = 3; i < path.length; i++) {
      const key = path[i];

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
          return newElements;
        } else {
          // 这是中间的elements，需要继续导航
          // 下一个应该是数组索引
          const nextIndex = path[i + 1] as number;
          if (current && Array.isArray(current) && current[nextIndex]) {
            current = current[nextIndex];
            i++; // 跳过下一个索引
          } else {
            console.error('❌ 添加组件失败：无效的elements数组索引', {
              path,
              currentIndex: i,
              key,
              nextIndex,
              current: current ? 'exists' : 'undefined',
              isArray: Array.isArray(current),
              arrayLength: Array.isArray(current) ? current.length : 'N/A',
            });
            return elements; // 返回原始数组，不做修改
          }
        }
      } else if (key === 'columns') {
        const columnIndex = path[i + 1] as number;
        const nextKey = path[i + 2]; // 应该是'elements'

        console.log('🔍 处理分栏路径导航:', {
          currentKey: key,
          columnIndex,
          nextKey,
          currentType: current ? current.tag : 'undefined',
          hasColumns: current && current.columns ? 'yes' : 'no',
          columnsLength:
            current && current.columns ? current.columns.length : 0,
          targetColumnExists:
            current && current.columns && current.columns[columnIndex]
              ? 'yes'
              : 'no',
          targetColumnHasElements:
            current &&
            current.columns &&
            current.columns[columnIndex] &&
            current.columns[columnIndex].elements
              ? 'yes'
              : 'no',
        });

        // current应该是ColumnSetComponent，它有columns属性
        // path[i + 2]应该是'elements'
        if (
          current &&
          current.columns &&
          Array.isArray(current.columns) &&
          current.columns[columnIndex] &&
          current.columns[columnIndex].elements
        ) {
          current = current.columns[columnIndex].elements;
          console.log('✅ 成功导航到分栏elements数组:', {
            columnIndex,
            elementsLength: current.length,
          });
          i += 2; // 跳过下两个索引
        } else {
          console.error('❌ 添加组件失败：无效的分栏结构', {
            path,
            currentIndex: i,
            key,
            columnIndex,
            nextKey,
            current: current ? 'exists' : 'undefined',
            currentTag: current ? current.tag : 'undefined',
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
        if (current && Array.isArray(current) && current[key]) {
          current = current[key];
        } else {
          console.error('❌ 添加组件失败：无效的数组索引', {
            path,
            currentIndex: i,
            key,
            current: current ? 'exists' : 'undefined',
            isArray: Array.isArray(current),
            arrayLength: Array.isArray(current) ? current.length : 'N/A',
          });
          return elements; // 返回原始数组，不做修改
        }
      } else {
        if (current && current[key] !== undefined) {
          current = current[key];

          // 如果导航到了一个对象的elements属性，需要检查下一步
          if (key === 'elements' && current && Array.isArray(current)) {
            // 已经到达了elements数组，继续处理
            continue;
          }
        } else {
          console.error('❌ 添加组件失败：无效的属性路径', {
            path,
            currentIndex: i,
            key,
            current: current ? 'exists' : 'undefined',
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
    let current: any = newElements;

    console.log('🗑️ 从路径移除组件:', { path });

    // 如果是根级别
    if (path.length === 4 && path[2] === 'elements') {
      const index = path[3] as number;
      newElements.splice(index, 1);
      return newElements;
    }

    // 导航到父容器
    for (let i = 3; i < path.length - 1; i++) {
      const key = path[i];

      if (key === 'elements') {
        // 检查是否是倒数第二个elements（父容器）
        if (i === path.length - 2) {
          // 这是目标组件的父elements数组
          // 不需要进一步导航，current就是目标数组
          break;
        } else {
          // 这是中间的elements，需要继续导航
          const nextIndex = path[i + 1] as number;
          if (current && Array.isArray(current) && current[nextIndex]) {
            current = current[nextIndex];
            i++; // 跳过下一个索引
          } else {
            console.error('❌ 路径导航错误：无效的elements数组索引', {
              path,
              currentIndex: i,
              key,
              nextIndex,
              current: current ? 'exists' : 'undefined',
              isArray: Array.isArray(current),
              arrayLength: Array.isArray(current) ? current.length : 'N/A',
            });
            return elements; // 返回原始数组，不做修改
          }
        }
      } else if (key === 'columns') {
        const columnSetIndex = path[i + 1] as number;
        const columnIndex = path[i + 2] as number;
        // 安全检查：确保分栏结构有效
        if (
          !current ||
          !current[columnSetIndex] ||
          !current[columnSetIndex].columns ||
          !current[columnSetIndex].columns[columnIndex] ||
          !current[columnSetIndex].columns[columnIndex].elements
        ) {
          console.error('❌ 路径导航错误：无效的分栏路径', {
            path,
            currentIndex: i,
            key,
            columnSetIndex,
            columnIndex,
            current: current ? 'exists' : 'undefined',
          });
          return elements; // 返回原始数组，不做修改
        }
        current = current[columnSetIndex].columns[columnIndex].elements;
        i += 2; // 跳过下两个索引
      } else if (typeof key === 'number') {
        if (current && Array.isArray(current) && current[key]) {
          current = current[key];
        } else {
          console.error('❌ 路径导航错误：无效的数组索引', {
            path,
            currentIndex: i,
            key,
            current: current ? 'exists' : 'undefined',
            isArray: Array.isArray(current),
            arrayLength: Array.isArray(current) ? current.length : 'N/A',
          });
          return elements; // 返回原始数组，不做修改
        }
      } else {
        // 安全检查：确保属性存在
        if (!current || current[key] === undefined) {
          console.error('❌ 路径导航错误：无效的属性路径', {
            path,
            currentIndex: i,
            key,
            current: current ? 'exists' : 'undefined',
          });
          return elements; // 返回原始数组，不做修改
        }
        current = current[key];

        // 如果导航到了一个对象的elements属性，需要检查下一步
        if (key === 'elements' && current && Array.isArray(current)) {
          // 已经到达了elements数组，继续处理
          continue;
        }
      }
    }

    // 移除目标组件
    const lastIndex = path[path.length - 1] as number;

    // 确定目标数组
    let targetArray;
    if (current && Array.isArray(current)) {
      targetArray = current;
    } else if (current && current.elements && Array.isArray(current.elements)) {
      targetArray = current.elements;
    } else {
      console.error('❌ 无法移除组件：无效的目标数组', {
        path,
        lastIndex,
        current: current ? 'exists' : 'undefined',
        isArray: Array.isArray(current),
        hasElements: current && current.elements ? 'yes' : 'no',
        elementsIsArray:
          current && current.elements ? Array.isArray(current.elements) : 'N/A',
      });
      return elements; // 返回原始数组，不做修改
    }

    if (lastIndex >= 0 && lastIndex < targetArray.length) {
      targetArray.splice(lastIndex, 1);
    } else {
      console.error('❌ 无法移除组件：无效的目标索引', {
        path,
        lastIndex,
        targetArrayLength: targetArray.length,
      });
      return elements; // 返回原始数组，不做修改
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

  // 处理画布组件排序（专门用于DragSortableItem）
  const handleCanvasComponentSort = (dragIndex: number, hoverIndex: number) => {
    console.log('🔄 处理画布组件排序:', { dragIndex, hoverIndex });

    const draggedComponent = elements[dragIndex];
    const hoverComponent = elements[hoverIndex];

    if (!draggedComponent || !hoverComponent) {
      console.warn('无效的组件索引');
      return;
    }

    // 防止无意义的移动
    if (dragIndex === hoverIndex) {
      return;
    }

    // 严格的标题组件限制
    if (draggedComponent.tag === 'title') {
      // 标题组件只能在第一位
      if (hoverIndex !== 0) {
        message.info('标题组件只能在画布的最上方');
        return;
      }
    } else {
      // 非标题组件不能移动到标题组件的位置
      if (hoverComponent.tag === 'title') {
        // message.info('不能将组件移动到标题组件的位置');
        return;
      }

      // 如果第一位是标题组件，非标题组件不能移动到第一位
      if (hoverIndex === 0 && elements[0]?.tag === 'title') {
        message.info('标题组件必须保持在画布顶部');
        return;
      }
    }

    let targetIndex = hoverIndex;

    // 特殊处理：确保标题组件始终在第一位
    if (targetIndex === 0 && draggedComponent.tag !== 'title') {
      const hasTitle = elements.some((comp) => comp.tag === 'title');
      if (hasTitle) {
        targetIndex = 1; // 调整到标题后面
        message.info('已调整位置，标题组件保持在顶部');
      }
    }

    // 确保索引有效
    if (
      dragIndex < 0 ||
      dragIndex >= elements.length ||
      targetIndex < 0 ||
      targetIndex >= elements.length
    ) {
      console.warn('索引超出范围');
      return;
    }

    const newElements = [...elements];

    // 移除拖拽的组件
    newElements.splice(dragIndex, 1);

    // 调整目标索引（如果目标索引在拖拽索引之后，需要减1）
    const adjustedTargetIndex =
      targetIndex > dragIndex ? targetIndex - 1 : targetIndex;

    // 插入到新位置
    newElements.splice(adjustedTargetIndex, 0, draggedComponent);

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

    // 计算容器路径
    const draggedContainerPath = draggedPath.slice(0, -1);
    const targetContainerPath = targetPath.slice(0, -1);
    const draggedIndex = draggedPath[draggedPath.length - 1] as number;

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

      // 获取目标容器的elements数组
      const targetContainer = getElementsArrayByPath(
        newElements,
        targetElementsPath,
      );

      if (targetContainer && Array.isArray(targetContainer)) {
        // 执行位置交换
        const draggedItem = targetContainer[draggedIndex];
        targetContainer.splice(draggedIndex, 1);

        // 调整目标索引
        const adjustedTargetIndex =
          dropIndex > draggedIndex ? dropIndex - 1 : dropIndex;
        targetContainer.splice(adjustedTargetIndex, 0, draggedItem);

        onElementsChange(newElements);
      } else {
        console.error('❌ 无法找到目标容器');
      }
    } else {
      // 跨容器移动 - 使用删除+添加
      console.log('🔄 跨容器移动:', {
        from: draggedContainerPath,
        to: targetContainerPath,
      });

      // 先移除原位置的组件
      let newElements = removeComponentByPath(elements, draggedPath);

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

      // 添加到新位置
      newElements = addComponentByPath(
        newElements,
        targetElementsPath,
        draggedComponent,
        actualDropIndex,
      );

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
    e.stopPropagation();
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
    <div ref={drop} style={cardStyle} onClick={handleCardClick}>
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
