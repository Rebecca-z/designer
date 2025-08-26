// card-designer-components.tsx - 修复表单容器嵌套显示的组件渲染器

import { CopyOutlined, DeleteOutlined, MoreOutlined } from '@ant-design/icons';
import { Button, Dropdown, message } from 'antd';
import React from 'react';
import ComponentRendererCore from '../ComponentRenderers';
import { ComponentType, DesignData, DragItem, VariableItem } from '../type';
import ErrorBoundary from './ErrorBoundary';

interface ComponentRendererProps {
  component: ComponentType;
  onSelect: (component: ComponentType, path: (string | number)[]) => void;
  isSelected: boolean;
  selectedComponent: ComponentType | null;
  selectedPath: (string | number)[] | null;
  hoveredPath: (string | number)[] | null;
  isHovered: boolean;
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
  // 新增：标题数据
  headerData?: {
    title?: { content: string };
    subtitle?: { content: string };
    style?: string; // 改为字符串类型
  };
  // 新增：变量数据
  variables?: VariableItem[];
  // 新增：垂直间距
  verticalSpacing?: number;
}

// 检查两个路径是否指向同一个组件
const isSamePath = (
  path1: (string | number)[] | null,
  path2: (string | number)[],
): boolean => {
  if (!path1) return false;
  return JSON.stringify(path1) === JSON.stringify(path2);
};

const ComponentRenderer: React.FC<ComponentRendererProps> = ({
  component,
  onSelect,
  selectedPath,
  onDelete,
  onCopy,
  path,
  isPreview = false,
  onContainerDrop,
  onComponentSort,
  onUpdateComponent,
  onCanvasFocus,
  headerData,
  variables = [],
  verticalSpacing = 8,
}) => {
  // 安全检查 - 防止组件为 undefined 或 null
  if (!component) {
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

  // 检查组件是否有基本属性
  if (!component.tag || !component.id) {
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
  const isCurrentSelected = isSamePath(selectedPath || null, path);

  const handleClick = (e: React.MouseEvent) => {
    if (isPreview) return;

    // 立即阻止事件冒泡，防止触发卡片选中
    e.stopPropagation();
    e.preventDefault();

    // 直接处理组件选中
    onSelect(component, path);
    onCanvasFocus?.(); // 通知画布获得焦点
  };

  const handleDelete = (e: any) => {
    if (isPreview) return;
    if (e?.stopPropagation && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    onDelete(path);
    message.success('组件已删除');
  };

  const handleCopy = (e: any) => {
    if (isPreview) return;
    if (e?.stopPropagation && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    onCopy(component);
  };

  // 检查是否为表单容器下的分栏容器（包含提交和取消按钮的父容器）
  const isFormColumnSet =
    component.tag === 'column_set' &&
    path.length >= 6 &&
    path[0] === 'dsl' &&
    path[1] === 'body' &&
    path[2] === 'elements' &&
    path[4] === 'elements';

  const contextMenu = {
    items: [
      // 标题组件和表单组件不显示复制选项
      ...(component.tag !== 'title' && component.tag !== 'form'
        ? [
            {
              key: 'copy',
              icon: <CopyOutlined />,
              label: '复制组件',
              onClick: handleCopy,
            },
          ]
        : []),
      // 表单容器下的分栏容器不显示删除选项
      ...(!isFormColumnSet
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
  };

  // 如果是容器组件，直接使用 ComponentRendererCore 渲染
  if (component.tag === 'form' || component.tag === 'column_set') {
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
            🚫 容器组件渲染失败
            <br />
            <small>组件类型: {component.tag}</small>
            <br />
            <small>组件ID: {component.id}</small>
          </div>
        }
      >
        <div
          style={{
            // 容器组件不应用外层选中样式，避免双重边框
            // border: '2px solid transparent',
            backgroundColor: 'transparent',
            boxShadow: 'none',
            borderRadius: '8px',
            padding: '0',
            margin: '0',
            position: 'relative',
            cursor: isPreview ? 'default' : 'pointer',
            transition: 'all 0.2s ease',
          }}
          onClick={handleClick}
          data-component-wrapper="true"
          data-component-id={component.id}
        >
          {/* 操作按钮 - 表单容器下的分栏容器不显示，所有分栏容器都由自己的渲染器处理 */}
          {isCurrentSelected &&
            !isPreview &&
            !isFormColumnSet &&
            component.tag !== 'column_set' && (
              <div
                style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  zIndex: 10,
                }}
              >
                <Dropdown
                  menu={contextMenu}
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
          {/* 使用 ComponentRendererCore 渲染容器组件 */}
          <ComponentRendererCore
            component={component}
            isPreview={isPreview}
            onContainerDrop={onContainerDrop}
            onComponentMove={onComponentSort}
            onUpdateComponent={onUpdateComponent}
            path={path}
            index={0}
            containerPath={path.slice(0, -1)}
            enableDrag={
              !isPreview &&
              !(
                path.length === 4 &&
                path[0] === 'dsl' &&
                path[1] === 'body' &&
                path[2] === 'elements' &&
                // 只有非容器组件才禁用内部拖拽
                !(component.tag === 'form' || component.tag === 'column_set')
              )
            } // 根级别非容器组件禁用内部拖拽，让DragSortableItem处理
            enableSort={!isPreview}
            onSelect={onSelect}
            selectedPath={selectedPath}
            onDelete={onDelete}
            onCopy={onCopy}
            onCanvasFocus={onCanvasFocus}
            headerData={headerData}
            variables={variables}
            verticalSpacing={verticalSpacing}
          />
          {/* 选中状态标签 - 已移除调试信息显示 */}
        </div>
      </ErrorBoundary>
    );
  }

  // 普通组件渲染 - 统一选中样式
  const containerStyle: React.CSSProperties = {
    borderRadius: '4px',
    cursor: isPreview ? 'default' : 'pointer',
    position: 'relative',
    transition: 'all 0.2s ease',
    // 选中状态的边框和背景
    border: isCurrentSelected ? '2px solid #1890ff' : '2px solid transparent',
    backgroundColor: isCurrentSelected
      ? 'rgba(24, 144, 255, 0.02)'
      : 'transparent',
    boxShadow: isCurrentSelected ? '0 0 8px rgba(24, 144, 255, 0.3)' : 'none',
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
      <div
        style={containerStyle}
        onClick={handleClick}
        data-component-wrapper="true"
        data-component-id={component.id}
      >
        {/* 组件操作按钮 - 表单容器下的分栏容器和按钮组件不显示（按钮组件有自己的操作菜单） */}
        {isCurrentSelected &&
          !isPreview &&
          !isFormColumnSet &&
          component.tag !== 'button' && (
            <div
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                zIndex: 10,
              }}
            >
              <Dropdown
                menu={contextMenu}
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
        <ComponentRendererCore
          component={component}
          isPreview={isPreview}
          onUpdateComponent={onUpdateComponent}
          path={path}
          index={0}
          containerPath={path.slice(0, -1)}
          enableDrag={
            !isPreview &&
            !(
              path.length === 4 &&
              path[0] === 'dsl' &&
              path[1] === 'body' &&
              path[2] === 'elements'
            )
          }
          enableSort={!isPreview}
          onSelect={onSelect}
          selectedPath={selectedPath}
          onDelete={onDelete}
          onCopy={onCopy}
          onCanvasFocus={onCanvasFocus}
          headerData={headerData}
          variables={variables}
          verticalSpacing={verticalSpacing}
        />
      </div>
    </ErrorBoundary>
  );
};

export default ComponentRenderer;
