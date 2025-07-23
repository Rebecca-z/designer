import { Button, Form, Input, InputNumber, Modal, Select } from 'antd';
import React, { useEffect, useState } from 'react';
import { Variable } from './card-designer-types-updated';

const { TextArea } = Input;
const { Option } = Select;

export interface AddVariableModalProps {
  visible: boolean;
  onOk: (variable: Variable) => void;
  onCancel: () => void;
  initialType?: 'text' | 'number' | 'image' | 'array';
}

export interface VariableFormData {
  type: 'text' | 'number' | 'image' | 'array';
  name: string;
  description: string;
  mockData: string;
}

const AddVariableModal: React.FC<AddVariableModalProps> = ({
  visible,
  onOk,
  onCancel,
  initialType = 'text',
}) => {
  const [form] = Form.useForm<VariableFormData>();
  const [selectedType, setSelectedType] = useState<
    'text' | 'number' | 'image' | 'array'
  >(initialType);

  // 获取默认模拟数据
  const getDefaultMockData = (
    type: 'text' | 'number' | 'image' | 'array',
  ): string => {
    switch (type) {
      case 'text':
        return '';
      case 'number':
        return '0';
      case 'image':
        return JSON.stringify(
          {
            img_key: 'img_v2_9dd98485-2900-4d65-ada9-e31d1408dcfg',
          },
          null,
          2,
        );
      case 'array':
        return JSON.stringify(
          [
            {
              text: '选项 1',
              value: '1',
              icon: {
                tag: 'standard_icon',
                token: 'chat-forbidden_outlined',
              },
            },
            {
              text: '选项 2',
              value: '2',
              icon: {
                tag: 'custom_icon',
                img_key: 'img_v2_9dd98485-2900-4d65-ada9-e31d1408dcfg',
              },
            },
            {
              text: '选项 3',
              value: '3',
            },
          ],
          null,
          2,
        );
      default:
        return '';
    }
  };

  // 当弹窗打开时重置表单
  useEffect(() => {
    if (visible) {
      form.resetFields();
      setSelectedType(initialType);
      form.setFieldsValue({
        type: initialType,
        mockData: getDefaultMockData(initialType),
      });
    }
  }, [visible, initialType, form]);

  // 处理类型变化
  const handleTypeChange = (value: 'text' | 'number' | 'image' | 'array') => {
    setSelectedType(value);
    form.setFieldsValue({
      mockData: getDefaultMockData(value),
    });
  };

  // 验证变量名称
  const validateVariableName = (_: any, value: string) => {
    if (!value) {
      return Promise.reject(new Error('请输入变量名称'));
    }

    // 检查是否以字母开头
    if (!/^[a-zA-Z]/.test(value)) {
      return Promise.reject(new Error('需以字母开头'));
    }

    // 检查是否只包含字母、数字、下划线
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(value)) {
      return Promise.reject(new Error('仅支持字母、数字、下划线的组合'));
    }

    return Promise.resolve();
  };

  // 验证JSON格式
  const validateJSON = (_: any, value: string) => {
    if (!value) {
      return Promise.resolve();
    }

    try {
      JSON.parse(value);
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(new Error('请输入有效的JSON格式'));
    }
  };

  // 处理提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // 将自定义类型映射到Variable接口支持的类型
      const mapTypeToVariableType = (
        type: 'text' | 'number' | 'image' | 'array',
      ): 'text' | 'number' | 'boolean' | 'object' => {
        switch (type) {
          case 'text':
            return 'text';
          case 'number':
            return 'number';
          case 'image':
          case 'array':
            return 'object';
          default:
            return 'text';
        }
      };

      // 构建Variable对象
      const variable: Variable = {
        name: values.name,
        type: mapTypeToVariableType(values.type),
        value: values.mockData,
      };

      onOk(variable);
      form.resetFields();
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 处理取消
  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  // 渲染模拟数据输入组件
  const renderMockDataInput = () => {
    switch (selectedType) {
      case 'text':
        return (
          <Form.Item
            name="mockData"
            label="模拟数据"
            rules={[{ required: true, message: '请输入模拟数据' }]}
          >
            <Input placeholder="请输入文本内容" maxLength={100} />
          </Form.Item>
        );

      case 'number':
        return (
          <Form.Item
            name="mockData"
            label="模拟数据"
            rules={[{ required: true, message: '请输入模拟数据' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入数字"
              min={-999999}
              max={999999}
            />
          </Form.Item>
        );

      case 'image':
        return (
          <Form.Item
            name="mockData"
            label="模拟数据"
            rules={[
              { required: true, message: '请输入模拟数据' },
              { validator: validateJSON },
            ]}
          >
            <TextArea
              rows={6}
              placeholder="请输入JSON格式的图片数据"
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>
        );

      case 'array':
        return (
          <Form.Item
            name="mockData"
            label="模拟数据"
            rules={[
              { required: true, message: '请输入模拟数据' },
              { validator: validateJSON },
            ]}
          >
            <TextArea
              rows={8}
              placeholder="请输入JSON格式的数组数据"
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      title="添加变量"
      open={visible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          取消
        </Button>,
        <Button key="submit" type="primary" onClick={handleSubmit}>
          提交
        </Button>,
      ]}
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          type: initialType,
          mockData: getDefaultMockData(initialType),
        }}
      >
        {/* 类型选择 */}
        <Form.Item
          name="type"
          label="类型"
          rules={[{ required: true, message: '请选择变量类型' }]}
        >
          <Select
            onChange={handleTypeChange}
            disabled={!!initialType && initialType !== 'text'}
          >
            <Option value="text">文本</Option>
            <Option value="number">正数</Option>
            <Option value="image">图片</Option>
            <Option value="array">变量数组</Option>
          </Select>
        </Form.Item>

        {/* 变量名称 */}
        <Form.Item
          name="name"
          label="变量名称"
          rules={[{ validator: validateVariableName }]}
        >
          <Input
            placeholder="变量名称应以字母开头、仅支持字母、数字下划线的组合"
            maxLength={50}
          />
        </Form.Item>

        {/* 变量描述 */}
        <Form.Item name="description" label="变量描述">
          <Input
            placeholder="请输入变量描述（可选）"
            maxLength={64}
            showCount
          />
        </Form.Item>

        {/* 模拟数据 */}
        {renderMockDataInput()}
      </Form>
    </Modal>
  );
};

export default AddVariableModal;
