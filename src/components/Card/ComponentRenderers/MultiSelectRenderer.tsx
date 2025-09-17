import { Select } from 'antd';
import React from 'react';
import { isVariable, resolveVariable } from '../../Card/utils';
import { DraggableWrapper } from '../Common/index';
import { multiSelectComponentStateManager } from '../Variable/utils';
import { BaseRendererProps } from './types';

// 下拉多选组件渲染器
const MultiSelectRenderer: React.FC<BaseRendererProps> = (props) => {
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
        return userEditedOptions.map((item) => {
          const label = item?.text?.content || item.label;
          return {
            label: isVariable(label)
              ? resolveVariable(label, variables)?.value
              : label,
            value: isVariable(item.value)
              ? resolveVariable(item.value, variables)?.value
              : item.value,
          };
        });
      }

      // 最后从组件数据结构中获取
      let options = comp.options || [];

      // 如果选项是字符串（变量引用）
      if (typeof options === 'string') {
        const list = isVariable(options)
          ? resolveVariable(options, variables)?.value
          : options || [];
        return list.map((opt: any) => {
          return {
            label: opt.text.content || '',
            value: opt.value,
          };
        });
      }

      // 确保选项格式正确
      if (Array.isArray(options)) {
        return options.map((option: any) => {
          return {
            label: isVariable(option.text?.content)
              ? resolveVariable(option.text?.content, variables)?.value
              : option.text?.content,
            value: isVariable(option.value)
              ? resolveVariable(option.value, variables)?.value
              : option.value,
          };
        });
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
        width: '100%',
        maxWidth: '350px',
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
          width: '100%',
          flex: 'none',
        }}
        onSelect={() => {}}
        onChange={() => {}}
        onDeselect={() => {}}
        onOpenChange={() => true}
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
      onCopy={props.onCopy}
    >
      {multiSelectElement}
    </DraggableWrapper>
  ) : (
    <div style={{ width: '100%' }}>{multiSelectElement}</div>
  );
};

export default MultiSelectRenderer;
