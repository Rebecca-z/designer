import React from 'react';
import { DraggableWrapper } from '../Common/index';
import { replaceVariables } from '../utils';
import {
  textComponentStateManager,
  variableCacheManager,
} from '../Variable/utils/index';
import { BaseRendererProps } from './types';

// 纯文本组件渲染器
const PlainTextRenderer: React.FC<BaseRendererProps> = (props) => {
  const { component, isPreview, enableDrag, variables = [] } = props;
  const comp = component as any;

  // 获取文本内容
  const getTextContent = () => {
    try {
      // 检查是否有绑定的变量
      const boundVariableName = textComponentStateManager.getBoundVariableName(
        comp.id,
      );
      if (boundVariableName) {
        // 尝试从缓存获取变量值
        const cachedValue = variableCacheManager.getVariable(boundVariableName);

        if (cachedValue !== undefined) {
          return cachedValue;
        }

        // 从变量列表中获取值
        let variable = variables.find((v) => v.name === boundVariableName);

        // 如果标准格式查找失败，尝试VariableObject格式
        if (!variable) {
          variable = variables.find((v) => {
            // 检查是否是VariableObject格式（键值对格式）
            if (typeof v === 'object' && v !== null && !v.name) {
              // 获取变量的实际键名
              const keys = Object.keys(v).filter(
                (key) =>
                  !key.startsWith('_') && key !== 'type' && key !== 'value',
              );
              return keys.includes(boundVariableName);
            }
            return false;
          });
        }

        if (variable) {
          let value;

          // 处理标准Variable格式
          if (
            variable.name &&
            (variable.value !== undefined || variable.type !== undefined)
          ) {
            value =
              typeof variable.value === 'string'
                ? variable.value
                : JSON.stringify(variable.value);
          }
          // 处理VariableObject格式（键值对格式）
          else if (
            typeof variable === 'object' &&
            variable !== null &&
            !variable.name
          ) {
            // 从VariableObject中获取对应变量的值
            value = (variable as any)[boundVariableName];
            if (typeof value !== 'string') {
              value = JSON.stringify(value);
            }
          }

          if (value !== undefined) {
            variableCacheManager.setVariable(boundVariableName, value);
            return value;
          }
        }

        // 变量不存在时，返回用户编辑的内容或默认内容
        const userEditedContent =
          textComponentStateManager.getUserEditedContent(comp.id);
        if (userEditedContent !== undefined) {
          return userEditedContent;
        }
      }

      // 优先使用状态管理器中的内容（指定模式下的内容）
      const userEditedContent = textComponentStateManager.getUserEditedContent(
        comp.id,
      );
      if (userEditedContent !== undefined) {
        return userEditedContent;
      }

      // 使用组件原始内容，支持变量替换
      const originalText = comp.text?.content || comp.content || '文本内容';
      return replaceVariables(originalText, variables);
    } catch (error) {
      console.error('获取文本内容时出错:', error);
      return '文本内容';
    }
  };

  const textContent = getTextContent();

  // 获取组件样式设置
  const getTextStyles = () => {
    const style = comp.text?.style || comp.style || {};

    return {
      fontSize: style.fontSize ? `${style.fontSize}px` : '14px',
      lineHeight: '22px',
      color: style.color || '#333',
      textAlign: style.textAlign || 'left',
      // padding: `${verticalSpacing / 2}px 0`,
      wordWrap: 'break-word' as const,
      whiteSpace: 'pre-wrap',
      minHeight: '25px',
      wordBreak: 'break-word',
      ...(style.numberOfLines && style.numberOfLines > 0
        ? {
            display: '-webkit-box',
            WebkitLineClamp: style.numberOfLines,
            WebkitBoxOrient: 'vertical' as const,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }
        : {}),
    };
  };

  const textElement = <div style={getTextStyles()}>{textContent}</div>;

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
      {textElement}
    </DraggableWrapper>
  ) : (
    textElement
  );
};

export default PlainTextRenderer;
