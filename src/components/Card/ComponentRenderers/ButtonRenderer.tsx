import { Button } from 'antd';
import React from 'react';
import { DraggableWrapper } from '../Common/index';
import { BaseRendererProps } from './types';

// 按钮组件渲染器
const ButtonRenderer: React.FC<BaseRendererProps> = (props) => {
  const { component, isPreview, enableDrag } = props;
  const comp = component as any;

  // 获取按钮文本
  const getButtonText = () => {
    try {
      const rawText = comp.text?.content || comp.title || comp.label || '按钮';
      return rawText;
    } catch (error) {
      console.error('获取按钮文本时出错:', error);
      return '按钮';
    }
  };

  // 获取按钮颜色 - 从style.color或color字段获取
  const getButtonColor = () => {
    return comp.style?.color || comp.color || 'blue'; // 默认蓝色
  };

  // 获取按钮类型
  const getButtonType = () => {
    const color = getButtonColor();
    switch (color) {
      case 'blue':
        return 'primary';
      case 'red':
        return 'primary'; // 使用danger属性
      case 'black':
        return 'default';
      default:
        return 'primary'; // 默认为primary（蓝色）
    }
  };

  // 获取按钮是否为危险按钮
  const isDanger = () => {
    return getButtonColor() === 'red';
  };

  const buttonText = getButtonText();
  const buttonType = getButtonType();
  const danger = isDanger();
  const buttonColor = getButtonColor();

  // 根据颜色获取按钮样式
  const getButtonStyles = () => {
    const baseStyle = {
      padding: '8px 16px',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: 500,
      minWidth: '80px',
      transition: 'none',
      boxShadow: 'none',
    };

    switch (buttonColor) {
      case 'black':
        return {
          ...baseStyle,
          color: '#000000',
          backgroundColor: '#ffffff',
          borderColor: '#d9d9d9',
        };
      case 'blue':
        return {
          ...baseStyle,
          color: '#ffffff',
          backgroundColor: '#1677ff',
          borderColor: '#1677ff',
        };
      case 'red':
        return {
          ...baseStyle,
          color: '#ffffff',
          backgroundColor: '#ff4d4f',
          borderColor: '#ff4d4f',
        };
      default:
        return {
          ...baseStyle,
          color: '#ffffff',
          backgroundColor: '#1677ff',
          borderColor: '#1677ff',
        };
    }
  };

  // 获取hover/focus时应该保持的边框颜色
  const getHoverBorderColor = () => {
    switch (buttonColor) {
      case 'black':
        return '#d9d9d9';
      case 'blue':
        return '#1677ff';
      case 'red':
        return '#ff4d4f';
      default:
        return '#1677ff';
    }
  };

  const buttonElement = (
    <div
      style={{
        border: 'none',
        padding: '0', // 确保没有额外的内边距
        margin: '0', // 确保没有额外的外边距
        transition: 'none', // 移除过渡效果，避免闪烁
        position: 'relative',
        display: 'inline-block', // 让按钮容器内联显示，支持并排
      }}
    >
      <Button
        type={buttonType as any}
        danger={danger}
        className={`canvas-button-preview button-color-${buttonColor}`}
        data-button-color={buttonColor}
        style={getButtonStyles()}
        onMouseEnter={(e) => {
          // 强制移除hover时的蓝色边框，保持原有颜色
          const target = e.target as HTMLElement;
          target.style.borderColor = getHoverBorderColor();
          target.style.boxShadow = 'none';
        }}
        onFocus={(e) => {
          // 强制移除focus时的蓝色边框，保持原有颜色
          const target = e.target as HTMLElement;
          target.style.borderColor = getHoverBorderColor();
          target.style.boxShadow = 'none';
          target.style.outline = 'none';
        }}
      >
        {buttonText}
      </Button>
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
      width={'auto'}
    >
      {buttonElement}
    </DraggableWrapper>
  ) : (
    buttonElement
  );
};

export default ButtonRenderer;
