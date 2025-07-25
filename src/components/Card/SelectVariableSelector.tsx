import { PlusOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { Button, Dropdown } from 'antd';
import React, { useState } from 'react';
import { VariableItem } from './card-designer-types-updated';

export interface SelectVariableSelectorProps {
  variables: VariableItem[];
  onSelectVariable: (variableName: string) => void;
  onAddVariable: () => void;
  disabled?: boolean;
  placeholder?: string;
  selectedVariableName?: string;
}

const SelectVariableSelector: React.FC<SelectVariableSelectorProps> = ({
  variables,
  onSelectVariable,
  onAddVariable,
  disabled = false,
  placeholder = '请选择变量',
  selectedVariableName,
}) => {
  const [dropdownVisible, setDropdownVisible] = useState(false);

  // 过滤出数组类型的变量
  const arrayVariables = variables.filter((variable) => {
    if (typeof variable === 'object' && variable !== null) {
      const keys = Object.keys(variable as Record<string, any>);
      if (keys.length > 0) {
        const variableValue = (variable as Record<string, any>)[keys[0]];
        return Array.isArray(variableValue);
      }
    }
    return false;
  });

  // 处理变量选择
  const handleVariableSelect = (variableName: string) => {
    onSelectVariable(variableName);
    setDropdownVisible(false);
  };

  // 处理添加变量
  const handleAddVariable = () => {
    onAddVariable();
    setDropdownVisible(false);
  };

  // 构建菜单项
  const menuItems = [
    // 数组变量列表
    ...arrayVariables.map((variable) => {
      const keys = Object.keys(variable as Record<string, any>);
      const variableName = keys[0];
      const variableValue = (variable as Record<string, any>)[
        variableName
      ] as any[];

      return {
        key: variableName,
        label: (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '4px 0',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, fontSize: '14px' }}>
                {variableName}
              </div>
              <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                {Array.isArray(variableValue)
                  ? `${variableValue.length} 个选项`
                  : '数组变量'}
              </div>
            </div>
            <ThunderboltOutlined
              style={{ color: '#1890ff', fontSize: '12px' }}
            />
          </div>
        ),
        onClick: () => handleVariableSelect(variableName),
      };
    }),
    // 分割线
    {
      type: 'divider' as const,
    },
    // 新建变量选项
    {
      key: 'add-variable',
      label: (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            color: '#1890ff',
            fontWeight: 500,
          }}
        >
          <PlusOutlined style={{ marginRight: '8px' }} />
          新建变量
        </div>
      ),
      onClick: handleAddVariable,
    },
  ];

  // 如果没有数组变量，只显示新建变量选项
  const finalMenuItems =
    arrayVariables.length === 0
      ? [
          {
            key: 'add-variable',
            label: (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  color: '#1890ff',
                  fontWeight: 500,
                }}
              >
                <PlusOutlined style={{ marginRight: '8px' }} />
                新建变量
              </div>
            ),
            onClick: handleAddVariable,
          },
        ]
      : menuItems;

  const menu = {
    items: finalMenuItems,
    style: {
      minWidth: '200px',
      maxWidth: '300px',
    },
  };

  return (
    <Dropdown
      menu={menu}
      open={dropdownVisible}
      onOpenChange={setDropdownVisible}
      disabled={disabled}
      placement="bottomLeft"
      trigger={['click']}
    >
      <Button
        type="default"
        size="small"
        icon={<ThunderboltOutlined />}
        onClick={(e) => {
          // 阻止事件冒泡，避免触发父容器的点击事件
          e.stopPropagation();
          e.preventDefault();
        }}
        style={{
          width: '100%',
          textAlign: 'left',
          justifyContent: 'space-between',
          padding: '4px 8px',
          height: '32px',
          fontSize: '14px',
          color: '#333',
          border: '1px solid #d9d9d9',
          borderRadius: '6px',
          backgroundColor: '#fff',
        }}
        title="选择变量"
      >
        <span style={{ color: '#999' }}>
          {selectedVariableName || placeholder}
        </span>
        <ThunderboltOutlined style={{ color: '#1890ff', fontSize: '12px' }} />
      </Button>
    </Dropdown>
  );
};

export default SelectVariableSelector;
