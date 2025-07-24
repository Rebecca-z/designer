import { PlusOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { Button, Dropdown } from 'antd';
import React, { useState } from 'react';
import { VariableItem } from './card-designer-types-updated';

export interface VariableSelectorProps {
  variables: VariableItem[];
  onSelectVariable: (variableName: string, variableValue: string) => void;
  onAddVariable: () => void;
  disabled?: boolean;
}

const VariableSelector: React.FC<VariableSelectorProps> = ({
  variables,
  onSelectVariable,
  onAddVariable,
  disabled = false,
}) => {
  const [dropdownVisible, setDropdownVisible] = useState(false);

  // 过滤出文本类型的变量
  const textVariables = variables.filter((variable) => {
    if (typeof variable === 'object' && variable !== null) {
      const keys = Object.keys(variable as Record<string, any>);
      if (keys.length > 0) {
        const variableValue = (variable as Record<string, any>)[keys[0]];
        return typeof variableValue === 'string';
      }
    }
    return false;
  });

  // 处理变量选择
  const handleVariableSelect = (
    variableName: string,
    variableValue: string,
  ) => {
    onSelectVariable(variableName, variableValue);
    setDropdownVisible(false);
  };

  // 处理添加变量
  const handleAddVariable = () => {
    onAddVariable();
    setDropdownVisible(false);
  };

  // 构建菜单项
  const menuItems = [
    // 文本变量列表
    ...textVariables.map((variable) => {
      const keys = Object.keys(variable as Record<string, any>);
      const variableName = keys[0];
      const variableValue = (variable as Record<string, any>)[
        variableName
      ] as string;

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
                {variableValue}
              </div>
            </div>
            <ThunderboltOutlined
              style={{ color: '#1890ff', fontSize: '12px' }}
            />
          </div>
        ),
        onClick: () => handleVariableSelect(variableName, variableValue),
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

  // 如果没有文本变量，只显示新建变量选项
  const finalMenuItems =
    textVariables.length === 0
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
      placement="topRight"
      trigger={['click']}
    >
      <Button
        type="text"
        size="small"
        icon={<ThunderboltOutlined />}
        style={{
          position: 'absolute',
          bottom: '4px',
          right: '4px',
          zIndex: 10,
          padding: '2px 6px',
          height: '24px',
          fontSize: '12px',
          color: '#1890ff',
          border: '1px solid #d9d9d9',
          borderRadius: '4px',
          backgroundColor: '#fff',
        }}
        title="插入变量"
      >
        变量
      </Button>
    </Dropdown>
  );
};

export default VariableSelector;
