// card-designer-components.tsx - 优化选中样式的组件渲染器

import {
  CopyOutlined,
  DeleteOutlined,
  MoreOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Button, Dropdown, Menu, message } from 'antd';
import React from 'react';
import { useDrop } from 'react-dnd';
import DragWrapper from './card-designer-drag-wrapper';
import ComponentRendererCore from './card-designer-renderer-core';
import { ComponentType, DesignData, DragItem } from './card-designer-types';
import ErrorBoundary from './ErrorBoundary';

interface ComponentRendererProps {
  component: ComponentType;
  onSelect: (component: ComponentType, path: (string | number)[]) => void;
  isSelected: boolean;
  selectedComponent: ComponentType | null;
  selectedPath: (string | number)[] | null;
  onUpdate: (data: DesignData) => void;
  onDelete: (path: (string | number)[]) => void;
  onCopy: (component: ComponentType) => void;
  path: (string | number)[];
  isPreview?: boolean;
  onContainerDrop?: (
    draggedItem: DragItem,
    targetPath: (string | number)[],
    dropIndex?: number,
  ) => void;
  onComponentSort?: (
    draggedComponent: ComponentType,
    draggedPath: (string | number)[],
    targetPath: (string | number)[],
    dropIndex: number,
  ) => void;
  onUpdateComponent?: (
    componentPath: (string | number)[],
    updatedComponent: ComponentType,
  ) => void;
  onCanvasFocus?: () => void;
}

// 检查组件是否为容器类型
const isContainerComponent = (componentType: string): boolean => {
  return componentType === 'form' || componentType === 'column_set';
};

// 检查是否可以在目标容器中放置指定类型的组件
const canDropInContainer = (
  draggedType: string,
  targetPath: (string | number)[],
): boolean => {
  // 容器组件不能嵌套到其他容器中
  if (isContainerComponent(draggedType)) {
    // 检查是否要放到容器内部（非根节点）
    return !targetPath.some(
      (segment) => segment === 'elements' || segment === 'columns',
    );
  }
  return true;
};

// 获取容器类型（用于错误提示）
const getContainerType = (path: (string | number)[]): string => {
  if (path.includes('columns')) return '分栏容器';
  if (path.includes('elements') && path.length > 2) return '表单容器';
  return '画布';
};

// 检查两个路径是否指向同一个组件
const isSamePath = (
  path1: (string | number)[] | null,
  path2: (string | number)[],
): boolean => {
  if (!path1) return false;
  return JSON.stringify(path1) === JSON.stringify(path2);
};

// 容器拖拽区域组件
const ContainerDropZone: React.FC<{
  targetPath: (string | number)[];
  placeholder: string;
  children?: React.ReactNode;
  onContainerDrop?: (
    draggedItem: DragItem,
    targetPath: (string | number)[],
    dropIndex?: number,
  ) => void;
}> = ({ targetPath, placeholder, children, onContainerDrop }) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ['component', 'existing-component'],
    canDrop: (item: DragItem) => {
      // 检查是否可以在此容器中放置
      if (item.isNew) {
        return canDropInContainer(item.type, targetPath);
      } else if (item.component) {
        return canDropInContainer(item.component.tag, targetPath);
      }
      return false;
    },
    drop: (item: DragItem, monitor) => {
      if (monitor.didDrop()) return;

      // 检查拖拽限制
      if (item.isNew && !canDropInContainer(item.type, targetPath)) {
        message.warning(`容器组件不能嵌套到${getContainerType(targetPath)}中`);
        return;
      } else if (
        item.component &&
        !canDropInContainer(item.component.tag, targetPath)
      ) {
        message.warning(`容器组件不能嵌套到${getContainerType(targetPath)}中`);
        return;
      }

      onContainerDrop?.(item, targetPath);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  });

  const dropZoneStyle = {
    minHeight: children ? 'auto' : '60px',
    border: isOver && canDrop ? '2px dashed #1890ff' : '2px dashed #d9d9d9',
    borderRadius: '4px',
    padding: '8px',
    backgroundColor: isOver && canDrop ? 'rgba(24, 144, 255, 0.05)' : '#fafafa',
    position: 'relative' as const,
    transition: 'all 0.2s ease',
  };

  return (
    <div ref={drop} style={dropZoneStyle}>
      {children || (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '60px',
            color: '#999',
            fontSize: '12px',
            textAlign: 'center',
          }}
        >
          <PlusOutlined style={{ marginRight: '4px' }} />
          {placeholder}
        </div>
      )}

      {isOver && canDrop && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(24, 144, 255, 0.9)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
            pointerEvents: 'none',
            zIndex: 1000,
          }}
        >
          释放以添加组件
        </div>
      )}

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
            fontWeight: 'bold',
            pointerEvents: 'none',
            zIndex: 1000,
          }}
        >
          ❌ 容器组件不能嵌套
        </div>
      )}
    </div>
  );
};

const ComponentRenderer: React.FC<ComponentRendererProps> = ({
  component,
  onSelect,
  // isSelected,
  selectedComponent,
  selectedPath,
  onUpdate,
  onDelete,
  onCopy,
  path,
  isPreview = false,
  onContainerDrop,
  onComponentSort,
  onUpdateComponent,
  onCanvasFocus,
}) => {
  // 安全检查 - 防止组件为 undefined 或 null
  if (!component) {
    console.warn('ComponentRenderer: component is null or undefined', { path });
    return (
      <div
        style={{
          padding: '16px',
          border: '1px dashed #ff4d4f',
          borderRadius: '4px',
          textAlign: 'center',
          color: '#ff4d4f',
          backgroundColor: '#fff2f0',
          margin: '4px',
        }}
      >
        ⚠️ 组件数据丢失 (路径: {path.join(' > ')})
      </div>
    );
  }

  console.warn('component', component.tag, component.id);
  // 检查组件是否有基本属性
  if (!component.tag || !component.id) {
    console.warn('ComponentRenderer: component missing required properties', {
      component,
      path,
    });
    return (
      <div
        style={{
          padding: '16px',
          border: '1px dashed #faad14',
          borderRadius: '4px',
          textAlign: 'center',
          color: '#faad14',
          backgroundColor: '#fffbe6',
          margin: '4px',
        }}
      >
        ⚠️ 组件数据不完整 (ID: {component.id || '无'}, Tag:{' '}
        {component.tag || '无'})
      </div>
    );
  }

  // 检查当前组件是否被选中
  const isCurrentSelected = isSamePath(selectedPath, path);

  const handleClick = (e: React.MouseEvent) => {
    if (isPreview) return;
    e?.stopPropagation();
    onSelect(component, path);
    onCanvasFocus?.(); // 通知画布获得焦点
  };

  const handleDelete = (e: React.MouseEvent) => {
    if (isPreview) return;
    e?.stopPropagation();
    onDelete(path);
    message.success('组件已删除');
  };

  const handleCopy = (e: React.MouseEvent) => {
    if (isPreview) return;
    e?.stopPropagation();
    onCopy(component);
    message.success('组件已复制');
  };

  // 渲染子组件列表
  const renderChildComponents = (
    elements: ComponentType[],
    basePath: (string | number)[],
  ) => {
    if (!elements || !Array.isArray(elements)) return null;

    return elements.map((childComponent, index) => {
      if (!childComponent) {
        console.warn(
          'renderChildComponents: Invalid child component at index',
          index,
        );
        return (
          <ErrorBoundary key={`child-error-${index}`}>
            <div
              style={{
                padding: '8px',
                border: '1px dashed #faad14',
                borderRadius: '4px',
                textAlign: 'center',
                color: '#faad14',
                backgroundColor: '#fffbe6',
                margin: '4px',
                fontSize: '12px',
              }}
            >
              ⚠️ 子组件数据异常 (索引: {index})
            </div>
          </ErrorBoundary>
        );
      }

      const childPath = [...basePath, index];
      const isContainer =
        childComponent.tag === 'form' || childComponent.tag === 'column_set';
      const isChildSelected = isSamePath(selectedPath, childPath);

      return (
        <ErrorBoundary key={childComponent.id || `child-${index}`}>
          <DragWrapper
            component={childComponent}
            path={childPath}
            onContainerDrop={onContainerDrop || (() => {})}
            onComponentSort={onComponentSort || (() => {})}
            canAcceptDrop={isContainer}
            sortableContainer={true}
            containerPath={basePath}
            dropIndex={index}
            style={{ marginBottom: '8px' }}
          >
            <ComponentRenderer
              component={childComponent}
              onSelect={onSelect}
              isSelected={isChildSelected}
              selectedComponent={selectedComponent}
              selectedPath={selectedPath}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onCopy={onCopy}
              path={childPath}
              isPreview={isPreview}
              onContainerDrop={onContainerDrop}
              onComponentSort={onComponentSort}
              onUpdateComponent={onUpdateComponent}
              onCanvasFocus={onCanvasFocus}
            />
          </DragWrapper>
        </ErrorBoundary>
      );
    });
  };

  const contextMenu = (
    <Menu>
      <Menu.Item key="copy" icon={<CopyOutlined />} onClick={handleCopy}>
        复制组件
      </Menu.Item>
      <Menu.Item
        key="delete"
        icon={<DeleteOutlined />}
        onClick={handleDelete}
        danger
      >
        删除组件
      </Menu.Item>
    </Menu>
  );

  // 统一的选中样式配置
  const getSelectedStyle = (isSelected: boolean) => ({
    border:
      isSelected && !isPreview ? '2px solid #1890ff' : '1px solid #d9d9d9',
    backgroundColor:
      isSelected && !isPreview ? 'rgba(24, 144, 255, 0.05)' : '#fff',
    boxShadow:
      isSelected && !isPreview
        ? '0 0 8px rgba(24, 144, 255, 0.3)'
        : '0 2px 4px rgba(0,0,0,0.1)',
  });

  // 处理表单容器组件的特殊渲染
  if (component.tag === 'form') {
    const comp = component as any;
    return (
      <div
        style={{
          ...getSelectedStyle(isCurrentSelected),
          borderRadius: '6px',
          padding: '16px',
          margin: '4px 0',
          position: 'relative',
          cursor: isPreview ? 'default' : 'pointer',
          transition: 'all 0.2s ease',
        }}
        onClick={handleClick}
      >
        {/* 操作按钮 */}
        {isCurrentSelected && !isPreview && (
          <div
            style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              zIndex: 10,
            }}
          >
            <Dropdown
              overlay={contextMenu}
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
        {isCurrentSelected && !isPreview && (
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

        {/* 表单标题 */}
        <div
          style={{
            marginBottom: '12px',
            fontWeight: 'bold',
            color: '#333',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>📋</span>
          <span>表单容器</span>
          {comp.name && (
            <span
              style={{ color: '#666', fontSize: '12px', fontWeight: 'normal' }}
            >
              ({comp.name})
            </span>
          )}
        </div>

        {comp.description && (
          <div
            style={{
              marginBottom: '12px',
              color: '#666',
              fontSize: '12px',
              backgroundColor: '#f9f9f9',
              padding: '6px 8px',
              borderRadius: '4px',
              border: '1px solid #f0f0f0',
            }}
          >
            {comp.description}
          </div>
        )}

        {/* 表单内容区域 */}
        <ContainerDropZone
          targetPath={[...path, 'elements']}
          placeholder="拖拽组件到表单中（不支持容器组件嵌套）"
          onContainerDrop={onContainerDrop}
        >
          {renderChildComponents(comp.elements || [], [...path, 'elements'])}
        </ContainerDropZone>

        {/* 选中状态标签 */}
        {isCurrentSelected && !isPreview && (
          <div
            style={{
              position: 'absolute',
              bottom: '-20px',
              left: '0',
              backgroundColor: '#1890ff',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              whiteSpace: 'nowrap',
              zIndex: 10,
            }}
          >
            {component.tag} {comp.name && `(${comp.name})`}
          </div>
        )}
      </div>
    );
  }

  // 处理分栏容器组件的特殊渲染
  if (component.tag === 'column_set') {
    const comp = component as any;
    return (
      <div
        style={{
          ...getSelectedStyle(isCurrentSelected),
          borderRadius: '6px',
          padding: '16px',
          margin: '4px 0',
          position: 'relative',
          cursor: isPreview ? 'default' : 'pointer',
          transition: 'all 0.2s ease',
        }}
        onClick={handleClick}
      >
        {/* 操作按钮 */}
        {isCurrentSelected && !isPreview && (
          <div
            style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              zIndex: 10,
            }}
          >
            <Dropdown
              overlay={contextMenu}
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
        {isCurrentSelected && !isPreview && (
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

        {/* 分栏标题 */}
        <div
          style={{
            marginBottom: '12px',
            fontWeight: 'bold',
            color: '#333',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>📐</span>
          <span>分栏容器</span>
          <span
            style={{ color: '#666', fontSize: '12px', fontWeight: 'normal' }}
          >
            ({comp.columns?.length || 2}列)
          </span>
        </div>

        {/* 分栏内容区域 */}
        <div
          style={{
            display: 'flex',
            gap: `${comp.gap || 8}px`,
            minHeight: '100px',
          }}
        >
          {(comp.columns || []).map((column: any, columnIndex: number) => (
            <div
              key={columnIndex}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  color: '#666',
                  marginBottom: '8px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  padding: '4px',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '4px',
                  border: '1px solid #e8e8e8',
                }}
              >
                第{columnIndex + 1}列
              </div>
              <ContainerDropZone
                targetPath={[...path, 'columns', columnIndex, 'elements']}
                placeholder={`拖拽组件到第${
                  columnIndex + 1
                }列（不支持容器组件嵌套）`}
                onContainerDrop={onContainerDrop}
              >
                {renderChildComponents(column.elements || [], [
                  ...path,
                  'columns',
                  columnIndex,
                  'elements',
                ])}
              </ContainerDropZone>
            </div>
          ))}
        </div>

        {/* 选中状态标签 */}
        {isCurrentSelected && !isPreview && (
          <div
            style={{
              position: 'absolute',
              bottom: '-20px',
              left: '0',
              backgroundColor: '#1890ff',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              whiteSpace: 'nowrap',
              zIndex: 10,
            }}
          >
            {component.tag} ({comp.columns?.length || 2}列)
          </div>
        )}
      </div>
    );
  }

  // 普通组件渲染 - 统一选中样式
  const containerStyle: React.CSSProperties = {
    border:
      isCurrentSelected && !isPreview
        ? '2px solid #1890ff'
        : '1px solid transparent',
    padding: '4px',
    margin: '2px',
    borderRadius: '4px',
    cursor: isPreview ? 'default' : 'pointer',
    minHeight: '30px',
    position: 'relative',
    transition: 'all 0.2s ease',
    backgroundColor:
      isCurrentSelected && !isPreview
        ? 'rgba(24, 144, 255, 0.05)'
        : 'transparent',
    boxShadow:
      isCurrentSelected && !isPreview
        ? '0 0 4px rgba(24, 144, 255, 0.3)'
        : 'none',
  };

  return (
    <ErrorBoundary
      fallback={
        <div
          style={{
            padding: '16px',
            border: '1px solid #ff4d4f',
            borderRadius: '4px',
            textAlign: 'center',
            color: '#ff4d4f',
            backgroundColor: '#fff2f0',
            margin: '4px',
          }}
        >
          🚫 组件渲染失败
          <br />
          <small>组件类型: {component.tag}</small>
          <br />
          <small>组件ID: {component.id}</small>
        </div>
      }
    >
      <div style={containerStyle} onClick={handleClick}>
        {/* 组件操作按钮 */}
        {isCurrentSelected && !isPreview && (
          <div
            style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              zIndex: 10,
            }}
          >
            <Dropdown
              overlay={contextMenu}
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
        {isCurrentSelected && !isPreview && (
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

        {/* 组件内容渲染 */}
        <ComponentRendererCore component={component} isPreview={isPreview} />

        {/* 组件标签 */}
        {isCurrentSelected && !isPreview && (
          <div
            style={{
              position: 'absolute',
              bottom: '-20px',
              left: '0',
              backgroundColor: '#1890ff',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              whiteSpace: 'nowrap',
              zIndex: 10,
            }}
          >
            {component.tag} {component.name && `(${component.name})`}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default ComponentRenderer;
