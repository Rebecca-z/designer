// VariableBinding 组件 - 通用变量绑定选择器
// 支持文本、富文本、图片、多图混排组件的变量绑定功能

import { PlusOutlined } from '@ant-design/icons';
import { Divider, Form, Select } from 'antd';
import React from 'react';
import { VariableItem } from '../../type';

export interface VariableBindingProps {
  /** 当前绑定的变量名 */
  value?: string;
  /** 变量改变回调 */
  onChange?: (variableName: string | undefined) => void;
  /** 组件类型，用于过滤对应类型的变量 */
  componentType:
    | 'plain_text'
    | 'rich_text'
    | 'img'
    | 'img_combination'
    | 'input'
    | 'select_static'
    | 'select_static_array'
    | 'multi_select_static'
    | 'multi_select_static_array'
    | 'multi_select_static_text'
    | 'button';
  /** 可用的变量列表 */
  variables: VariableItem[];
  /** 变量过滤函数 */
  getFilteredVariables: (componentType: string) => VariableItem[];
  /** 获取变量显示名称 */
  getVariableDisplayName: (variable: VariableItem) => string;
  /** 获取变量Keys（过滤内部属性） */
  getVariableKeys: (variable: any) => string[];
  /** 打开添加变量弹窗的回调 */
  onAddVariable?: () => void;
  /** 占位符文本 */
  placeholder?: string;
  /** 样式 */
  style?: React.CSSProperties;
  /** 标签文本 */
  label?: string;
  /** 新建变量按钮文本 */
  addVariableText?: string;
}

/**
 * 通用变量绑定组件
 * 提供统一的变量选择和新建变量功能
 */
const VariableBinding: React.FC<VariableBindingProps> = ({
  value,
  onChange,
  componentType,
  getFilteredVariables,
  getVariableDisplayName,
  getVariableKeys,
  onAddVariable,
  placeholder = '请选择变量',
  style = { width: '100%' },
  label = '绑定变量 (可选)',
  addVariableText,
}) => {
  // 根据组件类型获取过滤后的变量列表
  const filteredVariables = getFilteredVariables(componentType);

  const getTitleText = () => {
    switch (componentType) {
      case 'plain_text':
        return '文本';
      case 'rich_text':
        return '富文本';
      case 'img':
        return '图片';
      case 'img_combination':
        return '图片数组';
      case 'input':
        return '文本/整数';
      case 'select_static':
        return '选项数组';
      case 'select_static_array':
        return '选项数组'; // 下拉单选组件的绑定变量模式支持选项数组类型
      case 'multi_select_static':
        return '选项数组'; // 下拉多选组件的选项文本和回传参数支持文本和整数类型
      case 'multi_select_static_array':
        return '选项数组'; // 下拉多选组件的绑定变量模式支持选项数组类型
      case 'multi_select_static_text':
        return '文本/整数'; // 下拉多选组件的选项文本和回传参数支持文本和整数类型
      case 'button':
        return '文本';
      default:
        return '变量';
    }
  };

  const finalAddVariableText = addVariableText || '新建变量';

  // 处理变量选择改变
  const handleVariableChange = (selectedValue: string | undefined) => {
    if (onChange) {
      onChange(selectedValue);
    }
  };

  // 处理添加变量
  const handleAddVariable = () => {
    console.log('➕ 变量绑定组件 - 新建变量:', {
      componentType,
      availableVariablesCount: filteredVariables.length,
      timestamp: new Date().toISOString(),
    });

    if (onAddVariable) {
      onAddVariable();
    }
  };

  return (
    <>
      <Form.Item label={label}>
        <Select
          value={value}
          onChange={handleVariableChange}
          placeholder={placeholder}
          style={style}
          allowClear
          popupRender={(menu) => (
            <div>
              {/* 标题区域 */}
              <div
                style={{
                  padding: '8px',
                  borderBottom: '1px solid #f0f0f0',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#666',
                }}
              >
                {getTitleText()}
              </div>
              {menu}
              <Divider style={{ margin: '8px 0' }} />
              <div
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  color: '#1890ff',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
                onClick={handleAddVariable}
              >
                <PlusOutlined />
                {finalAddVariableText}
              </div>
            </div>
          )}
        >
          {filteredVariables.map((variable, index) => {
            if (typeof variable === 'object' && variable !== null) {
              let variableName: string;

              // 检查是否是标准Variable对象格式
              if (
                variable.name &&
                (variable.type !== undefined || variable.value !== undefined)
              ) {
                // 标准Variable对象：直接使用name属性作为变量名
                variableName = variable.name;
              } else {
                // 键值对格式：获取变量的实际键名
                const keys = getVariableKeys(variable);
                if (keys.length > 0) {
                  variableName = keys[0];
                } else {
                  return null;
                }
              }

              const displayName = getVariableDisplayName(variable);

              return (
                <Select.Option
                  key={`${variableName}-${index}`}
                  value={variableName}
                >
                  {displayName}
                </Select.Option>
              );
            }
            return null;
          })}
        </Select>
      </Form.Item>
    </>
  );
};

export default VariableBinding;
