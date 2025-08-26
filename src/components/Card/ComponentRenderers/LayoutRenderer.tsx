// 布局组件渲染器 - HR 和 Title
import React from 'react';
import { replaceVariables } from '../utils';
import DraggableWrapper from './shared/DraggableWrapper';
import { BaseRendererProps } from './types';

// 分割线组件渲染器
export const HrRenderer: React.FC<BaseRendererProps> = (props) => {
  const {
    component,
    isPreview,
    enableDrag,
    selectedPath,
    onSelect,
    onCanvasFocus,
    path,
  } = props;

  const comp = component as any;

  // 检查当前组件是否被选中
  const isCurrentSelected =
    selectedPath &&
    path &&
    JSON.stringify(selectedPath) === JSON.stringify(path);

  // 获取边框样式配置
  const borderStyle = comp.style?.borderStyle || 'solid';

  // 获取选中状态样式
  const selectedStyles = isCurrentSelected
    ? {
        border: '2px solid #1890ff',
        borderRadius: '4px',
        backgroundColor: 'rgba(24, 144, 255, 0.05)',
      }
    : {
        border: '2px solid transparent',
      };

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
        transition: 'all 0.2s ease',
        ...selectedStyles,
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
    >
      {hrElement}
    </DraggableWrapper>
  ) : (
    hrElement
  );
};

// 标题组件渲染器
export const TitleRenderer: React.FC<BaseRendererProps> = (props) => {
  const {
    component,
    isPreview,
    enableDrag,
    variables = [],
    headerData,
    verticalSpacing = 8,
  } = props;
  const comp = component as any;

  // 获取主标题
  const getMainTitle = () => {
    try {
      // 优先使用 headerData 中的标题
      if (headerData?.title?.content) {
        return replaceVariables(headerData.title.content, variables);
      }

      // 然后使用组件自身的标题
      const rawTitle =
        comp.title?.content || comp.title || comp.text?.content || '标题';
      return replaceVariables(rawTitle, variables);
    } catch (error) {
      console.error('获取主标题时出错:', error);
      return '标题';
    }
  };

  // 获取副标题
  const getSubtitle = () => {
    try {
      // 优先使用 headerData 中的副标题
      if (headerData?.subtitle?.content) {
        return replaceVariables(headerData.subtitle.content, variables);
      }

      // 然后使用组件自身的副标题
      const rawSubtitle = comp.subtitle?.content || comp.subtitle || '';
      return rawSubtitle ? replaceVariables(rawSubtitle, variables) : '';
    } catch (error) {
      console.error('获取副标题时出错:', error);
      return '';
    }
  };

  // 获取主题颜色
  const getThemeColor = () => {
    const theme = headerData?.style || comp.theme || comp.color || 'blue';
    switch (theme) {
      case 'blue':
        return '#1890ff';
      case 'wathet':
        return '#13c2c2';
      case 'turquoise':
        return '#52c41a';
      case 'green':
        return '#52c41a';
      case 'yellow':
        return '#faad14';
      case 'orange':
        return '#fa8c16';
      case 'red':
        return '#f5222d';
      default:
        return '#1890ff';
    }
  };

  const mainTitle = getMainTitle();
  const subtitle = getSubtitle();
  const themeColor = getThemeColor();

  const titleElement = (
    <div
      style={{
        padding: `${verticalSpacing}px 0`,
        textAlign: 'center',
      }}
    >
      {/* 主标题 */}
      <h2
        style={{
          margin: '0 0 8px 0',
          fontSize: '20px',
          fontWeight: 600,
          color: themeColor,
          lineHeight: '1.4',
        }}
      >
        {mainTitle}
      </h2>

      {/* 副标题 */}
      {subtitle && (
        <p
          style={{
            margin: '0',
            fontSize: '14px',
            color: '#666',
            lineHeight: '1.4',
          }}
        >
          {subtitle}
        </p>
      )}
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
    >
      {titleElement}
    </DraggableWrapper>
  ) : (
    titleElement
  );
};
