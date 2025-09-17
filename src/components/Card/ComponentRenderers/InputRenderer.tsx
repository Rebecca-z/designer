import { Input } from 'antd';
import React from 'react';
import { DraggableWrapper } from '../Common/index';
import { replaceVariables } from '../utils';
import { inputComponentStateManager } from '../Variable/utils';
import { BaseRendererProps } from './types';

// 输入框组件渲染器
const InputRenderer: React.FC<BaseRendererProps> = (props) => {
  const {
    component,
    isPreview,
    enableDrag,
    variables = [],
    verticalSpacing = 8,
  } = props;
  const comp = component as any;

  // 获取占位符文本
  const getPlaceholder = () => {
    try {
      // 优先检查是否有绑定的变量
      const boundVariableName =
        inputComponentStateManager.getBoundPlaceholderVariableName(comp.id);
      if (boundVariableName) {
        // 从变量列表中获取值
        const variable = variables.find((v: any) => {
          // 处理两种变量格式
          if (typeof v === 'object' && v !== null) {
            if ('name' in v) {
              return v.name === boundVariableName;
            } else {
              return Object.keys(v)[0] === boundVariableName;
            }
          }
          return false;
        });

        if (variable) {
          let value;
          if ('name' in variable && 'value' in variable) {
            value = (variable as any).value;
          } else {
            value = (variable as any)[boundVariableName];
          }

          const result =
            typeof value === 'string' ? value : JSON.stringify(value);
          return result;
        }
        return `\${${boundVariableName}}`;
      }

      // 然后从inputComponentStateManager获取用户编辑的占位符
      const userEditedPlaceholder =
        inputComponentStateManager.getUserEditedPlaceholder(comp.id);
      if (userEditedPlaceholder !== undefined) {
        const result = replaceVariables(userEditedPlaceholder, variables);
        return result;
      }

      // 最后从组件数据结构中获取
      let rawPlaceholder;
      if (comp.placeholder?.content) {
        rawPlaceholder = comp.placeholder.content;
      } else if (typeof comp.placeholder === 'string') {
        rawPlaceholder = comp.placeholder;
      } else {
        rawPlaceholder = '请输入';
      }

      const result = replaceVariables(rawPlaceholder, variables);
      return result;
    } catch (error) {
      console.error('获取占位符时出错:', error);
      return '请输入';
    }
  };

  // 获取默认值
  const getDefaultValue = () => {
    try {
      // 优先检查是否有绑定的变量
      const boundVariableName =
        inputComponentStateManager.getBoundDefaultValueVariableName(comp.id);
      if (boundVariableName) {
        // 从变量列表中获取值
        const variable = variables.find((v: any) => {
          // 处理两种变量格式
          if (typeof v === 'object' && v !== null) {
            if ('name' in v) {
              return v.name === boundVariableName;
            } else {
              return Object.keys(v)[0] === boundVariableName;
            }
          }
          return false;
        });

        if (variable) {
          let value;
          if ('name' in variable && 'value' in variable) {
            value = (variable as any).value;
          } else {
            value = (variable as any)[boundVariableName];
          }

          const result =
            typeof value === 'string' ? value : JSON.stringify(value);
          return result;
        }

        return `\${${boundVariableName}}`;
      }

      // 然后从inputComponentStateManager获取用户编辑的默认值
      const userEditedDefaultValue =
        inputComponentStateManager.getUserEditedDefaultValue(comp.id);
      if (userEditedDefaultValue !== undefined) {
        return replaceVariables(userEditedDefaultValue, variables);
      }

      // 最后从组件数据结构中获取
      let rawValue;
      if (comp.default_value?.content) {
        rawValue = comp.default_value.content;
      } else if (typeof comp.default_value === 'string') {
        rawValue = comp.default_value;
      } else if (comp.value) {
        rawValue = comp.value;
      } else if (comp.defaultValue) {
        rawValue = comp.defaultValue;
      } else {
        rawValue = '';
      }

      return replaceVariables(rawValue, variables);
    } catch (error) {
      console.error('获取默认值时出错:', error);
      return '';
    }
  };

  const placeholder = getPlaceholder();
  const defaultValue = getDefaultValue();

  const inputElement = (
    <div
      style={{
        padding: `${verticalSpacing / 2}px 0`,
        display: 'inline-block',
        width: '100%',
        maxWidth: '350px',
      }}
      data-component-wrapper="true"
      data-component-id={comp.id}
    >
      <Input
        placeholder={placeholder}
        value={defaultValue}
        onChange={() => {}} // 空的onChange处理器，因为这只是预览
        className="canvas-input-preview"
        style={{
          width: '100%',
          maxWidth: '100%',
          border: '1px solid #d9d9d9',
          outline: 'none',
          boxShadow: 'none',
          flex: 'none',
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
      {inputElement}
    </DraggableWrapper>
  ) : (
    <div style={{ width: '100%' }}>{inputElement}</div>
  );
};

export default InputRenderer;
