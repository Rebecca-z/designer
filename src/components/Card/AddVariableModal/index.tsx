import { Button, Form, Input, InputNumber, Modal, Select } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { Variable } from '../card-designer-types-updated';
import JSONEditor, { JSONEditorRef } from '../JSONEditor';
import RichTextEditor from '../RichTextEditor/RichTextEditor';
import type {
  AddVariableModalProps,
  VariableFormData,
  VariableType,
} from './type';
const { Option } = Select;

const AddVariableModal: React.FC<AddVariableModalProps> = ({
  visible,
  onOk,
  onCancel,
  initialType = 'text',
  editingVariable = null, // 新增：编辑的变量
}) => {
  const jsonEditorRef = useRef<JSONEditorRef>(null);

  const [form] = Form.useForm<VariableFormData>();
  const [selectedType, setSelectedType] = useState<VariableType>(initialType);
  const [jsonData, setJsonData] = useState<string>(''); // 新增：JSON编辑器数据

  // 获取默认模拟数据
  const getDefaultMockData = (type: VariableType): string => {
    switch (type) {
      case 'text':
        return '';
      case 'number':
        return '0';
      case 'image':
        return JSON.stringify(
          {
            img_url: 'img_v2_9dd98485-2900-4d65-ada9-e31d1408dcfg',
          },
          null,
          2,
        );
      case 'array':
        return JSON.stringify(
          [
            {
              text: {
                content: '选项 1',
                i18n_content: {
                  'en-US': 'Option 1',
                },
              },
              value: '1',
            },
            {
              text: {
                content: '选项 2',
                i18n_content: {
                  'en-US': 'Option 2',
                },
              },
              value: '2',
            },
            {
              text: {
                content: '选项 3',
                i18n_content: {
                  'en-US': 'Option 3',
                },
              },
              value: '3',
            },
          ],
          null,
          2,
        );
      case 'richtext':
        return JSON.stringify({
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              attrs: { textAlign: 'left' },
              content: [
                {
                  type: 'text',
                  text: '请输入富文本内容...',
                },
              ],
            },
          ],
        });
      case 'imageArray':
        return JSON.stringify(
          [
            {
              img_key: 'img_v2_9dd98485-2900-4d65-ada9-e31d1408dcfg',
            },
            {
              img_key: 'img_v2_9dd98485-2900-4d65-ada9-e31d1408dcfg',
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
  ): 'text' | 'number' | 'image' | 'array' | 'richtext' | 'imageArray' => {
    // 优先使用原始类型信息
    if (editingVariable?.originalType) {
      return editingVariable.originalType;
    }

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
          if (parsed.img_url) {
            return 'image';
          } else if (Array.isArray(parsed)) {
            // 检查是否为图片数组
            if (parsed.length > 0 && parsed[0].img_key) {
              return 'imageArray';
            }
            return 'array';
          } else if (parsed.type === 'doc') {
            return 'richtext';
          }
        } catch (e) {
          // 解析失败，默认为图片
        }
        return 'image';
      default:
        return 'text';
    }
  };

  // 处理类型变化
  const handleTypeChange = (value: VariableType) => {
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
      // 先获取表单数据
      const values = await form.validateFields();

      // 如果是富文本类型，直接处理富文本编辑器数据
      if (selectedType === 'richtext') {
        // 构建Variable对象
        const variable: Variable = {
          name: values.name,
          type: 'object',
          value: jsonData,
          originalType: selectedType,
          description: values.description || '',
        };

        console.log('💾 提交富文本变量数据:', {
          isEditing: !!editingVariable,
          variable,
          richTextData: jsonData,
        });

        onOk(variable);
        form.resetFields();
        setJsonData('');
        return;
      }

      // 如果是数组、图片或图片数组类型，需要验证JSON编辑器
      if (
        selectedType === 'array' ||
        selectedType === 'image' ||
        selectedType === 'imageArray'
      ) {
        if (jsonEditorRef.current) {
          const { formatJSON, validateJSON, getFormattedJSON } =
            jsonEditorRef.current;

          console.log('开始验证JSON编辑器...');

          // 先验证原始内容，不进行格式化
          const { isValid: originalValid, errors: originalErrors } =
            validateJSON();
          console.warn('原始JSON验证结果:', {
            isValid: originalValid,
            errors: originalErrors,
          });

          if (!originalValid) {
            console.error('JSON格式错误，请检查输入:', originalErrors);
            return;
          }

          // 原始内容有效，进行格式化
          await formatJSON();
          const { isValid, errors } = validateJSON();
          console.warn('格式化后JSON验证结果:', { isValid, errors });

          if (isValid) {
            const result = getFormattedJSON();
            console.warn('result=====', result);
            if (result?.success && result.data) {
              console.warn('格式化后的JSON:', JSON.parse(result.data));

              // 构建Variable对象
              const variable: Variable = {
                name: values.name,
                type: 'object',
                value: result.data,
                originalType: selectedType,
                description: values.description || '',
              };

              console.log('💾 提交变量数据:', {
                isEditing: !!editingVariable,
                variable,
                formattedJsonData: result.data,
              });

              onOk(variable);
              form.resetFields();
              setJsonData('');
              return;
            } else {
              console.error('获取格式化JSON失败:', result?.error);
              return;
            }
          } else {
            console.error('格式化后JSON验证失败:', errors);
            return;
          }
        } else {
          console.error('JSON编辑器引用不存在');
          return;
        }
      }

      // 对于非JSON类型，使用原有的逻辑
      let actualMockData = values.mockData;
      if (selectedType === 'image' || selectedType === 'array') {
        actualMockData = jsonData;
      }

      // 将自定义类型映射到Variable接口支持的类型
      const mapTypeToVariableType = (
        type: VariableType,
      ): 'text' | 'number' | 'boolean' | 'object' => {
        switch (type) {
          case 'text':
            return 'text';
          case 'number':
            return 'number';
          case 'image':
          case 'array':
          case 'richtext':
          case 'imageArray':
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
        originalType: values.type,
        description: values.description || '',
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

  // 处理富文本编辑器数据变化
  const handleRichTextChange = (newData: any) => {
    const jsonString = JSON.stringify(newData);
    setJsonData(jsonString);
    form.setFieldsValue({ mockData: jsonString });
    console.log('📝 富文本数据变化:', jsonString);
  };

  // 获取富文本编辑器的值
  const getRichTextValue = () => {
    if (!jsonData) return undefined;
    try {
      return JSON.parse(jsonData);
    } catch (error) {
      console.error('解析富文本数据失败:', error);
      return undefined;
    }
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
              ref={jsonEditorRef}
              json={jsonData}
              title="图片数据"
              onJSONChange={handleJSONChange}
              isVariableModalOpen={visible}
              height={200}
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
              ref={jsonEditorRef}
              json={jsonData}
              title="数组数据"
              onJSONChange={handleJSONChange}
              isVariableModalOpen={visible}
              height={200}
            />
          </Form.Item>
        );

      case 'imageArray':
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
              ref={jsonEditorRef}
              json={jsonData}
              title="图片数组数据"
              onJSONChange={handleJSONChange}
              isVariableModalOpen={visible}
              height={200}
            />
          </Form.Item>
        );

      case 'richtext':
        return (
          <div>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>模拟数据</div>
            <RichTextEditor
              value={getRichTextValue()}
              onChange={handleRichTextChange}
              placeholder="请输入富文本内容..."
              height={200}
              showToolbar={true}
            />
          </div>
        );

      default:
        return null;
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
          description: editingVariable.description || '', // 回显描述信息
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
        // 新增模式：重置表单，使用传入的初始化数据
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
          description: '', // 添加描述字段的初始值
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
            value={selectedType} // 确保显示当前选中的类型
          >
            <Option value="text">文本</Option>
            <Option value="number">正数</Option>
            <Option value="image">图片</Option>
            <Option value="imageArray">图片数组</Option>
            <Option value="array">选项数组</Option>
            <Option value="richtext">富文本</Option>
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
