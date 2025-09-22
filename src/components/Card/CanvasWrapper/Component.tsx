// 普通组件(画布根节点)
import { CopyOutlined, DeleteOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import React from 'react';
import ComponentRendererCore from '../ComponentRenderers';
import { COMPONENT_TYPES } from '../constants';
import ErrorBoundary from './ErrorBoundary';
import { ComponentRendererProps } from './type';

// 检查两个路径是否指向同一个组件
const isSamePath = (
  path1: (string | number)[] | null,
  path2: (string | number)[],
): boolean => {
  if (!path1) return false;
  return JSON.stringify(path1) === JSON.stringify(path2);
};

// 获取组件信息
const getComponentInfo = (tag: string) => {
  return COMPONENT_TYPES[tag] || tag;
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
  onHeaderDataChange,
  headerData,
  variables = [],
  verticalSpacing = 8,
}) => {
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

    // 直接处理组件选中 - 确保只选中当前组件
    onSelect(component, path);
    onCanvasFocus?.(); // 通知画布获得焦点
  };

  const handleDelete = (e: any) => {
    if (isPreview) return;
    if (e?.stopPropagation && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    onDelete(path);
  };

  const handleCopy = (e: any) => {
    if (isPreview) return;
    if (e?.stopPropagation && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    onCopy(component);
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
          {/* 使用 ComponentRendererCore 渲染内容器组件 */}
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
            }
            enableSort={!isPreview}
            onSelect={onSelect}
            selectedPath={selectedPath}
            onDelete={onDelete}
            onCopy={onCopy}
            onCanvasFocus={onCanvasFocus}
            onHeaderDataChange={onHeaderDataChange}
            headerData={headerData}
            variables={variables}
            verticalSpacing={verticalSpacing}
          />
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
    border: isCurrentSelected ? '1px solid #1890ff' : '1px solid transparent',
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
        {/* 选中状态指示器 */}
        {isCurrentSelected && !isPreview && (
          <>
            {/* 组件工具栏 */}
            <div
              style={{
                position: 'absolute',
                top: '-24px',
                left: '0',
                right: '0',
                height: '24px',
                width: '140px',
                backgroundColor: '#1890ff',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 8px',
                zIndex: 100,
              }}
            >
              {/* 组件类型显示 */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flex: 1,
                }}
              >
                {/* 组件图标 */}
                {(() => {
                  const IconComponent = getComponentInfo(component.tag).icon;
                  return IconComponent ? (
                    <div
                      style={{
                        fontSize: '14px',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <IconComponent />
                    </div>
                  ) : null;
                })()}

                {/* 组件类型名称 */}
                <span
                  style={{
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 500,
                  }}
                >
                  {getComponentInfo(component.tag).name}
                </span>
              </div>

              {/* 操作按钮区域 */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                }}
              >
                {isCurrentSelected && component.tag !== 'title' && (
                  <Tooltip title="复制">
                    <Button
                      size="small"
                      type="text"
                      icon={<CopyOutlined />}
                      style={{
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onClick={handleCopy}
                    />
                  </Tooltip>
                )}
                <Tooltip title="删除">
                  <Button
                    size="small"
                    type="text"
                    icon={<DeleteOutlined />}
                    style={{
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onClick={handleDelete}
                    title="删除组件"
                  />
                </Tooltip>
              </div>
            </div>
          </>
        )}
        {/* 画布中各类子组件 */}
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
          onHeaderDataChange={onHeaderDataChange}
          headerData={headerData}
          variables={variables}
          verticalSpacing={verticalSpacing}
        />
      </div>
    </ErrorBoundary>
  );
};

export default ComponentRenderer;
