import { Button, Form, Input, InputNumber, Modal, Select } from 'antd';
import React, { useEffect, useState } from 'react';
import { Variable } from './card-designer-types-updated';
import JSONEditor from './JSONEditor';
const { Option } = Select;

export interface AddVariableModalProps {
  visible: boolean;
  onOk: (variable: Variable) => void;
  onCancel: () => void;
  initialType?: 'text' | 'number' | 'image' | 'array';
  editingVariable?: Variable | null; // 新增：编辑的变量
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
  editingVariable = null, // 新增：编辑的变量
}) => {
  const [form] = Form.useForm<VariableFormData>();
  const [selectedType, setSelectedType] = useState<
    'text' | 'number' | 'image' | 'array'
  >(initialType);
  const [jsonData, setJsonData] = useState<string>(''); // 新增：JSON编辑器数据

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

  // 将Variable类型映射到表单类型
  const mapVariableTypeToFormType = (
    variableType: string,
  ): 'text' | 'number' | 'image' | 'array' => {
    switch (variableType) {
      case 'text':
        return 'text';
      case 'number':
        return 'number';
      case 'boolean':
        return 'text'; // 布尔值用文本表示
      case 'object':
        // 尝试判断是图片还是数组
        try {
          const parsed = JSON.parse(editingVariable?.value || '{}');
          if (parsed.img_key) {
            return 'image';
          } else if (Array.isArray(parsed)) {
            return 'array';
          }
        } catch (e) {
          // 解析失败，默认为图片
        }
        return 'image';
      default:
        return 'text';
    }
  };

  // 当弹窗打开时重置表单或回显编辑数据
  useEffect(() => {
    if (visible) {
      if (editingVariable) {
        // 编辑模式：回显数据
        const formType = mapVariableTypeToFormType(editingVariable.type);
        setSelectedType(formType);

        // 设置表单数据
        form.setFieldsValue({
          type: formType,
          name: editingVariable.name,
          description: '', // 描述字段暂时为空
          mockData: editingVariable.value,
        });

        // 设置JSON编辑器数据
        setJsonData(editingVariable.value);

        console.log('🔄 回显编辑数据:', {
          editingVariable,
          formType,
          mockData: editingVariable.value,
        });
      } else {
        // 新增模式：重置表单
        form.resetFields();
        setSelectedType(initialType);
        const defaultData = getDefaultMockData(initialType);
        form.setFieldsValue({
          type: initialType,
          mockData: defaultData,
        });
        setJsonData(defaultData);

        console.log('➕ 重置新增表单:', {
          initialType,
          defaultData,
        });
      }
    }
  }, [visible, initialType, editingVariable, form]);

  // 处理类型变化
  const handleTypeChange = (value: 'text' | 'number' | 'image' | 'array') => {
    setSelectedType(value);
    const defaultData = getDefaultMockData(value);
    form.setFieldsValue({
      mockData: defaultData,
    });
    setJsonData(defaultData);
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

      // 获取实际的模拟数据（优先使用JSON编辑器的数据）
      let actualMockData = values.mockData;
      if (selectedType === 'image' || selectedType === 'array') {
        actualMockData = jsonData;
      }

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
        value: actualMockData,
      };

      console.log('💾 提交变量数据:', {
        isEditing: !!editingVariable,
        variable,
        formValues: values,
        jsonData,
      });

      onOk(variable);
      form.resetFields();
      setJsonData('');
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 处理取消
  const handleCancel = () => {
    form.resetFields();
    setJsonData('');
    onCancel();
  };

  // 处理JSON编辑器数据变化
  const handleJSONChange = (newData: string) => {
    setJsonData(newData);
    console.log('📝 JSON数据变化:', newData);
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
            <JSONEditor
              json={jsonData}
              title="图片数据"
              onJSONChange={handleJSONChange}
              editable={true}
              height={200}
              showLineNumbers={false}
              showCopyButton={false}
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
            <JSONEditor
              json={jsonData}
              title="数组数据"
              onJSONChange={handleJSONChange}
              editable={true}
              height={300}
              showLineNumbers={false}
              showCopyButton={false}
            />
          </Form.Item>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      title={editingVariable ? '编辑变量' : '添加变量'}
      open={visible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          取消
        </Button>,
        <Button key="submit" type="primary" onClick={handleSubmit}>
          {editingVariable ? '更新' : '提交'}
        </Button>,
      ]}
      width={600}
      destroyOnHidden
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
            disabled={!!editingVariable} // 编辑模式下不允许修改类型
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
            disabled={!!editingVariable} // 编辑模式下不允许修改名称
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
