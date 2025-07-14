// card-designer-card-wrapper.tsx - 会话卡片包装器组件

import { PlusOutlined } from '@ant-design/icons';
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
  // 检查路径是否指向同一个组件
  const isSamePath = (
    path1: (string | number)[] | null,
    path2: (string | number)[],
  ): boolean => {
    if (!path1) return false;
    return JSON.stringify(path1) === JSON.stringify(path2);
  };

  // 拖拽处理
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ['component', 'existing-component'],
    canDrop: () => true,
    drop: (item: DragItem, monitor) => {
      if (monitor.didDrop()) return;

      if (item.isNew) {
        // 新组件
        const newComponent = createDefaultComponent(item.type);
        onElementsChange([...elements, newComponent]);
      } else if (item.component && item.path) {
        // 现有组件移动
        // 这里需要实现更复杂的逻辑来处理组件移动
        console.log('Move existing component to card', item);
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
              <ErrorBoundary key={component.id || `component-${index}`}>
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
                />
              </ErrorBoundary>
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
