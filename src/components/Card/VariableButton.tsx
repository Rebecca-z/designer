import { EditOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import React from 'react';

export interface VariableButtonProps {
  variableName: string;
  variableValue?: string; // 可选参数，保持向后兼容
  onEdit: (variableName: string) => void;
  size?: 'small' | 'middle' | 'large';
}

const VariableButton: React.FC<VariableButtonProps> = ({
  variableName,
  onEdit,
  size = 'small',
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit(variableName);
  };

  return (
    <Tooltip title={`点击编辑变量 "${variableName}"`} placement="top">
      <Button
        type="primary"
        size={size}
        icon={<EditOutlined />}
        onClick={handleClick}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          margin: '0 2px',
          padding: '2px 8px',
          height: 'auto',
          fontSize: '12px',
          lineHeight: '1.2',
          backgroundColor: '#1890ff',
          borderColor: '#1890ff',
          borderRadius: '12px',
          cursor: 'pointer',
          userSelect: 'none',
          color: '#ffffff',
        }}
      >
        <span style={{ fontSize: '10px', fontWeight: 'bold' }}>Aa</span>
        <span>{variableName}</span>
      </Button>
    </Tooltip>
  );
};

export default VariableButton;
