// card-designer-card-wrapper.tsx - 会话卡片包装器组件

import { PlusOutlined } from '@ant-design/icons';
import { message } from 'antd';
import React from 'react';
import { useDrop } from 'react-dnd';
import ComponentRenderer from './card-designer-components';
import {
  CardPadding,
  ComponentType,
  DragItem,
} from './card-designer-types-updated';
import { createDefaultComponent } from './card-designer-utils';
import ErrorBoundary from './ErrorBoundary';

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

  // 检查画布中是否已存在标题组件
  const hasExistingTitle = (elements: ComponentType[]): boolean => {
    return elements.some((component) => component.tag === 'title');
  };

  // 将标题组件插入到数组开头的工具函数
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
        // 找到目标elements数组
        // current应该是一个包含elements属性的组件对象
        if (current && current.elements && Array.isArray(current.elements)) {
          if (insertIndex !== undefined) {
            current.elements.splice(insertIndex, 0, newComponent);
          } else {
            current.elements.push(newComponent);
          }
        } else {
          console.error('❌ 添加组件失败：无效的elements数组', {
            path,
            currentIndex: i,
            key,
            current: current ? 'exists' : 'undefined',
            hasElements: current && current.elements ? 'yes' : 'no',
          });
          return elements; // 返回原始数组，不做修改
        }
        return newElements;
      } else if (key === 'columns') {
        const columnIndex = path[i + 1] as number;
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
          i += 2; // 跳过下两个索引
        } else {
          console.error('❌ 添加组件失败：无效的分栏结构', {
            path,
            currentIndex: i,
            key,
            columnIndex,
            current: current ? 'exists' : 'undefined',
            hasColumns: current && current.columns ? 'yes' : 'no',
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
          });
          return elements; // 返回原始数组，不做修改
        }
      } else {
        if (current && current[key] !== undefined) {
          current = current[key];
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

    return newElements;
  };

  // 根据路径移除组件
  const removeComponentByPath = (
    elements: ComponentType[],
    path: (string | number)[],
  ): ComponentType[] => {
    const newElements = [...elements];
    let current: any = newElements;

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
        const nextIndex = path[i + 1] as number;
        // 安全检查：确保当前对象和索引有效
        if (!current || !current[nextIndex] || !current[nextIndex].elements) {
          console.error('❌ 路径导航错误：无效的元素路径', {
            path,
            currentIndex: i,
            key,
            nextIndex,
            current: current ? 'exists' : 'undefined',
            element: current && current[nextIndex] ? 'exists' : 'undefined',
          });
          return elements; // 返回原始数组，不做修改
        }
        current = current[nextIndex].elements;
        i++; // 跳过下一个索引
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
      }
    }

    // 移除目标组件
    const lastIndex = path[path.length - 1] as number;
    if (
      current &&
      Array.isArray(current) &&
      lastIndex >= 0 &&
      lastIndex < current.length
    ) {
      current.splice(lastIndex, 1);
    } else {
      console.error('❌ 无法移除组件：无效的目标索引', {
        path,
        lastIndex,
        currentLength: current ? current.length : 'undefined',
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

    if (draggedItem.isNew) {
      // 新组件
      const newComponent = createDefaultComponent(draggedItem.type);
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

    // 先移除原位置的组件
    let newElements = removeComponentByPath(elements, draggedPath);

    // 计算目标容器路径
    const targetContainerPath = targetPath.slice(0, -1);
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
      const titleIndex = newElements.findIndex((comp) => comp.tag === 'title');

      // 如果有标题组件，并且被拖拽的不是标题组件，确保不插入到标题组件之前
      if (
        titleIndex !== -1 &&
        draggedComponent.tag !== 'title' &&
        actualDropIndex <= titleIndex
      ) {
        actualDropIndex = titleIndex + 1;
        console.log('📌 调整插入位置，确保标题组件在最上方:', actualDropIndex);
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
              <div
                key={component.id || `component-${index}`}
                style={{ position: 'relative' }}
              >
                {/* 拖拽插入指示器 - 顶部 */}
                {isOver && canDrop && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      left: '0',
                      right: '0',
                      height: '2px',
                      backgroundColor: '#1890ff',
                      borderRadius: '1px',
                      zIndex: 1000,
                      opacity: 0.8,
                    }}
                  />
                )}

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
                  />
                </ErrorBoundary>

                {/* 拖拽插入指示器 - 底部（最后一个组件） */}
                {isOver && canDrop && index === elements.length - 1 && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-4px',
                      left: '0',
                      right: '0',
                      height: '2px',
                      backgroundColor: '#1890ff',
                      borderRadius: '1px',
                      zIndex: 1000,
                      opacity: 0.8,
                    }}
                  />
                )}
              </div>
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
