// 表单组件渲染器 - Input, Button, Select, MultiSelect
import { Button, Input, Select } from 'antd';
import React from 'react';
import { replaceVariables } from '../utils';
import {
  inputComponentStateManager,
  multiSelectComponentStateManager,
  selectComponentStateManager,
} from '../Variable/utils';
import DraggableWrapper from './shared/DraggableWrapper';
import { BaseRendererProps } from './types';

// 输入框组件渲染器
export const InputRenderer: React.FC<BaseRendererProps> = (props) => {
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
        width: 'auto',
      }}
      data-component-wrapper="true"
      data-component-id={comp.id}
    >
      <Input
        placeholder={placeholder}
        value={defaultValue}
        onChange={() => {}} // 空的onChange处理器，因为这只是预览
        disabled={isPreview}
        className="canvas-input-preview"
        style={{
          width: '200px',
          minWidth: '200px',
          maxWidth: '200px',
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
    >
      {inputElement}
    </DraggableWrapper>
  ) : (
    inputElement
  );
};

// 按钮组件渲染器
export const ButtonRenderer: React.FC<BaseRendererProps> = (props) => {
  const { component, isPreview, enableDrag, variables = [] } = props;
  const comp = component as any;

  // 获取按钮文本
  const getButtonText = () => {
    try {
      const rawText = comp.text?.content || comp.title || comp.label || '按钮';
      return replaceVariables(rawText, variables);
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
        width: '100%', // 按照原始实现，让按钮容器占满宽度
        // 移除边框，避免与DraggableWrapper的选中边框冲突导致闪烁
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
        disabled={isPreview}
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
    >
      {buttonElement}
    </DraggableWrapper>
  ) : (
    buttonElement
  );
};

// 下拉单选组件渲染器
export const SelectRenderer: React.FC<BaseRendererProps> = (props) => {
  const {
    component,
    isPreview,
    enableDrag,
    variables = [],
    verticalSpacing = 8,
  } = props;
  const comp = component as any;

  // 获取选项列表
  const getOptions = () => {
    try {
      // 优先检查是否有绑定的变量
      const boundVariableName =
        selectComponentStateManager.getBoundVariableName(comp.id);
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

          // 尝试解析变量值作为选项数组
          try {
            const parsedOptions =
              typeof value === 'string' ? JSON.parse(value) : value;
            if (Array.isArray(parsedOptions)) {
              const formattedOptions = parsedOptions.map((option: any) => ({
                label:
                  option.text?.content ||
                  option.label ||
                  option.text ||
                  String(option),
                value:
                  option.value || option.label || option.text || String(option),
              }));
              return formattedOptions;
            }
          } catch (parseError) {
            console.error('解析变量选项时出错:', parseError);
          }
        }
        return [];
      }

      // 然后从用户编辑的选项或组件数据中获取
      const userEditedOptions =
        selectComponentStateManager.getUserEditedOptions(comp.id);
      if (userEditedOptions && userEditedOptions.length > 0) {
        return userEditedOptions;
      }

      // 最后从组件数据结构中获取
      let options = comp.options || [];

      // 如果选项是字符串（变量引用）
      if (typeof options === 'string') {
        const variableContent = replaceVariables(options, variables);
        try {
          options = JSON.parse(variableContent);
        } catch {
          options = [];
        }
      }

      // 确保选项格式正确
      if (Array.isArray(options)) {
        return options.map((option: any) => ({
          label:
            option.text?.content ||
            option.label ||
            option.text ||
            String(option),
          value: option.value || option.label || option.text || String(option),
        }));
      }

      return [];
    } catch (error) {
      console.error('获取选项列表时出错:', error);
      return [];
    }
  };

  const options = getOptions();

  const selectElement = (
    <div
      style={{
        padding: `${verticalSpacing / 2}px 0`,
        display: 'inline-block',
        width: 'auto',
      }}
      data-component-wrapper="true"
      data-component-id={comp.id}
    >
      <Select
        placeholder="请选择"
        className="canvas-select-preview"
        value={null}
        defaultValue={null}
        style={{
          width: '200px',
          minWidth: '200px',
          maxWidth: '200px',
          flex: 'none',
        }}
        onSelect={() => {}}
        onChange={() => {}}
        onOpenChange={() => true}
        popupRender={(menu) => (
          <div
            style={{ pointerEvents: 'none' }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {menu}
          </div>
        )}
      >
        {options.map((option: any, index: number) => (
          <Select.Option key={index} value={option.value}>
            {option.label}
          </Select.Option>
        ))}
      </Select>
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
    >
      {selectElement}
    </DraggableWrapper>
  ) : (
    selectElement
  );
};

// 下拉多选组件渲染器
export const MultiSelectRenderer: React.FC<BaseRendererProps> = (props) => {
  const {
    component,
    isPreview,
    enableDrag,
    variables = [],
    verticalSpacing = 8,
  } = props;
  const comp = component as any;

  // 获取选项列表
  const getOptions = () => {
    try {
      // 优先检查是否有绑定的变量
      const boundVariableName =
        multiSelectComponentStateManager.getBoundVariableName(comp.id);
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

          // 尝试解析变量值作为选项数组
          try {
            const parsedOptions =
              typeof value === 'string' ? JSON.parse(value) : value;
            if (Array.isArray(parsedOptions)) {
              const formattedOptions = parsedOptions.map((option: any) => ({
                label:
                  option.text?.content ||
                  option.label ||
                  option.text ||
                  String(option),
                value:
                  option.value || option.label || option.text || String(option),
              }));
              return formattedOptions;
            }
          } catch (parseError) {
            console.error('解析变量选项时出错:', parseError);
          }
        }
        return [];
      }

      // 然后从用户编辑的选项或组件数据中获取
      const userEditedOptions =
        multiSelectComponentStateManager.getUserEditedOptions(comp.id);
      if (userEditedOptions && userEditedOptions.length > 0) {
        return userEditedOptions;
      }

      // 最后从组件数据结构中获取
      let options = comp.options || [];

      // 如果选项是字符串（变量引用）
      if (typeof options === 'string') {
        const variableContent = replaceVariables(options, variables);
        try {
          options = JSON.parse(variableContent);
        } catch {
          options = [];
        }
      }

      // 确保选项格式正确
      if (Array.isArray(options)) {
        return options.map((option: any) => ({
          label:
            option.text?.content ||
            option.label ||
            option.text ||
            String(option),
          value: option.value || option.label || option.text || String(option),
        }));
      }

      return [];
    } catch (error) {
      console.error('获取选项列表时出错:', error);
      return [];
    }
  };

  const options = getOptions();

  const multiSelectElement = (
    <div
      style={{
        padding: `${verticalSpacing / 2}px 0`,
        display: 'inline-block',
        width: 'auto',
      }}
      data-component-wrapper="true"
      data-component-id={comp.id}
    >
      <Select
        mode="multiple"
        placeholder="请选择"
        className="canvas-select-preview"
        value={[]}
        defaultValue={[]}
        style={{
          width: '200px',
          minWidth: '200px',
          maxWidth: '200px',
          flex: 'none',
        }}
        onSelect={() => {}}
        onChange={() => {}}
        onDeselect={() => {}}
        onOpenChange={() => true}
        popupRender={(menu) => (
          <div
            style={{ pointerEvents: 'none' }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {menu}
          </div>
        )}
      >
        {options.map((option: any, index: number) => (
          <Select.Option key={index} value={option.value}>
            {option.label}
          </Select.Option>
        ))}
      </Select>
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
    >
      {multiSelectElement}
    </DraggableWrapper>
  ) : (
    multiSelectElement
  );
};
