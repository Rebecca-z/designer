import { Button, Form, Input, Popover, Space } from 'antd';
import React, { useState } from 'react';

interface SelectOptionEditorProps {
  option: {
    value: string;
    text: {
      content: string;
      i18n_content?: { [key: string]: string };
    };
  };
  onUpdate: (updatedOption: {
    value: string;
    text: {
      content: string;
      i18n_content?: { [key: string]: string };
    };
  }) => void;
  children: React.ReactNode;
}

const SelectOptionEditor: React.FC<SelectOptionEditorProps> = ({
  option,
  onUpdate,
  children,
}) => {
  const [form] = Form.useForm();
  const [isVisible, setIsVisible] = useState(false);

  const handleSubmit = (values: any) => {
    const updatedOption = {
      value: values.value || option.value,
      text: {
        content: values.content || option.text.content,
        i18n_content: {
          'en-US':
            values.i18n_content || option.text.i18n_content?.['en-US'] || '',
        },
      },
    };
    onUpdate(updatedOption);
    setIsVisible(false);
  };

  const handleCancel = () => {
    setIsVisible(false);
    form.resetFields();
  };

  const content = (
    <div style={{ width: 300, padding: '8px 0' }}>
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          value: option.value,
          content: option.text.content,
          i18n_content: option.text.i18n_content?.['en-US'] || '',
        }}
        onFinish={handleSubmit}
      >
        <Form.Item
          label="选项值"
          name="value"
          rules={[{ required: true, message: '请输入选项值' }]}
        >
          <Input placeholder="请输入选项值" />
        </Form.Item>
        <Form.Item
          label="选项文本"
          name="content"
          rules={[{ required: true, message: '请输入选项文本' }]}
        >
          <Input placeholder="请输入选项文本" />
        </Form.Item>
        <Form.Item label="英文文本" name="i18n_content">
          <Input placeholder="请输入英文文本（可选）" />
        </Form.Item>
        <Form.Item style={{ marginBottom: 0 }}>
          <Space>
            <Button type="primary" htmlType="submit" size="small">
              确定
            </Button>
            <Button size="small" onClick={handleCancel}>
              取消
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );

  return (
    <Popover
      content={content}
      title="编辑选项"
      trigger="click"
      open={isVisible}
      onOpenChange={setIsVisible}
      placement="right"
    >
      <div style={{ cursor: 'pointer' }}>{children}</div>
    </Popover>
  );
};

export default SelectOptionEditor;
