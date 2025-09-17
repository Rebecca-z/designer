// 通用的组件名称输入框组件
import { Form, Input } from 'antd';
import React from 'react';

interface ComponentNameInputProps {
  prefix: string; // 组件类型前缀，如 'Text_', 'Input_' 等
  suffix: string; // 前缀后面的内容
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}

const ComponentNameInput: React.FC<ComponentNameInputProps> = ({
  prefix,
  suffix,
  onChange,
  placeholder = '请输入标识符后缀',
}) => {
  return (
    <Form.Item label="组件ID">
      <Input
        value={suffix}
        onChange={onChange}
        placeholder={placeholder}
        addonBefore={prefix}
        style={{ width: '100%' }}
      />
    </Form.Item>
  );
};

export default ComponentNameInput;
