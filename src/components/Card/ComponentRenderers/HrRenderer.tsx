import React from 'react';
import { DraggableWrapper } from '../Common/index';
import { BaseRendererProps } from './types';

const HrRenderer: React.FC<BaseRendererProps> = (props) => {
  const {
    component,
    selectedPath,
    onSelect,
    onCanvasFocus,
    path,
    isPreview,
    enableDrag,
  } = props;
  const comp = component as any;
  // 检查当前组件是否被选中
  const isCurrentSelected =
    selectedPath &&
    path &&
    JSON.stringify(selectedPath) === JSON.stringify(path);

  // 获取边框样式配置
  const borderStyle = comp.style?.borderStyle || 'solid';

  // 处理点击事件
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (onSelect && path) {
      onSelect(component, path);
    }
    if (onCanvasFocus) {
      onCanvasFocus();
    }
  };

  const hrElement = (
    <div
      style={{
        padding: '8px 0',
        cursor: 'pointer',
        width: '100%',
        borderRadius: '4px',
      }}
      onClick={handleClick}
      data-component-wrapper="true"
      data-component-id={comp.id}
    >
      {/* 使用自定义分割线，支持样式配置 */}
      <div
        style={{
          height: '0', // 使用border来渲染线条，所以高度为0
          borderTop: `1px ${borderStyle} ${
            isCurrentSelected ? '#1890ff' : '#d9d9d9'
          }`,
          margin: '0',
          transition: 'all 0.2s ease',
        }}
      />
    </div>
  );

  return enableDrag && !isPreview ? (
    <DraggableWrapper
      component={component}
      path={props.path || []}
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
      {hrElement}
    </DraggableWrapper>
  ) : (
    hrElement
  );
};

export default HrRenderer;
