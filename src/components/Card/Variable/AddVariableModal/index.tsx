// 添加变量弹窗
import { Button, Form, Input, InputNumber, Modal, Select } from 'antd';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Variable } from '../../card-designer-types-updated';
import JSONEditor, { JSONEditorRef } from '../../JSONEditor';
import RichTextEditor from '../../RichTextEditor/RichTextEditor';
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
  componentType, // 新增：当前选中组件的类型
}) => {
  const jsonEditorRef = useRef<JSONEditorRef>(null);

  const [form] = Form.useForm<VariableFormData>();
  const [selectedType, setSelectedType] = useState<VariableType>(initialType);

  // 使用Form.useWatch监听表单type字段的实时变化
  const currentFormType = Form.useWatch('type', form) || selectedType;
  const [jsonData, setJsonData] = useState<string>(''); // 新增：JSON编辑器数据
  const [jsonError, setJsonError] = useState<string>(''); // 新增：JSON错误信息
  const [isFirstOpen, setIsFirstOpen] = useState<boolean>(true); // 新增：跟踪是否是首次打开
  const [isUserEditing, setIsUserEditing] = useState<boolean>(false); // 新增：跟踪用户是否正在编辑

  // 根据组件类型过滤可用的变量类型
  const getAvailableVariableTypes = (
    componentType?: string,
  ): VariableType[] => {
    if (!componentType) {
      // 如果没有组件类型信息，返回所有类型
      return ['text', 'number', 'image', 'imageArray', 'array', 'richtext'];
    }

    // 根据组件类型返回对应的变量类型
    switch (componentType) {
      case 'plain_text':
        return ['text'];
      case 'rich_text':
        return ['richtext'];
      case 'img':
        console.log('✅ 图片组件，只返回图片类型');
        return ['image']; // 图片组件只支持图片类型，不支持图片数组
      case 'img_combination':
        console.log('✅ 多图混排组件，返回图片数组类型');
        return ['imageArray']; // 多图混排只支持图片数组类型
      case 'input':
        return ['text', 'number'];

      case 'select_static':
      case 'multi_select_static':
      case 'multi_select_static_text':
        return ['text', 'number']; // 下拉单选/多选组件的选项文本和回传参数支持文本和整数类型
      case 'select_static_array':
      case 'multi_select_static_array':
        return ['array']; // 下拉单选/多选组件的绑定变量模式支持选项数组类型
      case 'button':
        return ['text'];
      default:
        // 其他组件类型返回所有类型
        console.log('❓ 未知组件类型，返回所有变量类型');
        return ['text', 'number', 'image', 'imageArray', 'array', 'richtext'];
    }
  };

  // 根据组件类型获取默认的变量类型
  const getDefaultVariableType = (componentType?: string): VariableType => {
    if (!componentType) {
      return initialType;
    }

    // 根据组件类型返回默认的变量类型
    switch (componentType) {
      case 'plain_text':
        return 'text';
      case 'rich_text':
        return 'richtext';
      case 'img':
        return 'image';
      case 'img_combination':
        return 'imageArray';
      case 'input':
        return 'text';

      case 'select_static':
      case 'multi_select_static':
      case 'multi_select_static_text':
        return 'text'; // 下拉单选/多选组件默认选择文本类型
      case 'select_static_array':
      case 'multi_select_static_array':
        return 'array'; // 下拉单选/多选组件的绑定变量模式默认选择选项数组类型
      case 'button':
        return 'text';
      default:
        return initialType;
    }
  };

  // 获取可用的变量类型
  const availableTypes = getAvailableVariableTypes(componentType);

  // 获取默认的变量类型
  const defaultType = getDefaultVariableType(componentType);

  // 调试信息
  console.log('🔧 AddVariableModal 状态:', {
    componentType,
    availableTypes,
    defaultType,
    selectedType,
    initialType,
    isEditing: !!editingVariable,
    editingVariableName: editingVariable?.name,
  });

  // 获取默认模拟数据
  const getDefaultMockData = (type: VariableType): string => {
    switch (type) {
      case 'text':
        return '';
      case 'number':
        return '1';
      case 'image':
        return '';
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
              img_url:
                'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
              i18n_img_url: {
                'en-US':
                  'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
              },
            },
            {
              img_url:
                'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
              i18n_img_url: {
                'en-US':
                  'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
              },
            },
          ],
          null,
          2,
        );
      default:
        return '';
    }
  };

  // 使用useMemo确保Form的initialValues能够正确反映当前状态
  const formInitialValues = useMemo(
    () => ({
      type: selectedType,
      mockData: getDefaultMockData(selectedType),
      description: '',
    }),
    [selectedType],
  );

  // 简化的类型映射：直接使用 originalType
  const mapVariableTypeToFormType = (
    variableType: string,
  ): 'text' | 'number' | 'image' | 'array' | 'richtext' | 'imageArray' => {
    // 直接使用原始类型信息（新格式下总是可用）
    if (editingVariable?.originalType) {
      return editingVariable.originalType;
    }

    switch (variableType) {
      case 'text':
        return 'text';
      case 'number':
        return 'number';
      case 'object':
        try {
          const parsed = JSON.parse(editingVariable?.value || '{}');
          if (parsed.type === 'doc') {
            return 'richtext';
          } else if (Array.isArray(parsed)) {
            return 'array';
          }
        } catch (e) {
          console.warn('解析变量值失败:', e);
        }
        return 'text';
      default:
        return 'text';
    }
  };

  // 处理类型变化
  const handleTypeChange = (value: VariableType) => {
    setSelectedType(value);
    setIsUserEditing(false); // 重置用户编辑状态
    const defaultData = getDefaultMockData(value);

    // 更新表单值
    form.setFieldsValue({
      type: value,
      mockData: defaultData,
    });

    setJsonData(defaultData);
    setJsonError(''); // 切换类型时清除错误信息
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

  // 简化的提交处理
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // 对于 array 和 imageArray 类型，先验证 JSON 格式
      if (values.type === 'array' || values.type === 'imageArray') {
        try {
          JSON.parse(jsonData);
        } catch (error) {
          setJsonError('JSON格式错误，请检查输入');
          return;
        }
      }

      // 统一的变量创建逻辑
      let actualMockData: any;
      let internalType: string;

      // 根据变量类型处理模拟数据
      switch (values.type) {
        case 'text':
        case 'image':
          actualMockData = values.mockData;
          internalType = 'text';
          break;

        case 'number':
          actualMockData = Number(values.mockData);
          internalType = 'number';
          break;

        case 'richtext':
          try {
            // 富文本变量的值应该保存为JSON对象
            actualMockData = JSON.parse(jsonData);
            internalType = 'object';
            console.log('🎨 富文本变量保存为JSON对象:', {
              variableName: values.name,
              jsonData,
              parsedData: actualMockData,
              timestamp: new Date().toISOString(),
            });
          } catch (error) {
            console.error('富文本JSON解析失败:', error);
            actualMockData = jsonData; // 降级为字符串
            internalType = 'text';
          }
          break;

        case 'array':
        case 'imageArray':
          actualMockData = JSON.parse(jsonData);
          internalType = 'object';
          break;

        default:
          actualMockData = values.mockData;
          internalType = 'text';
      }

      // 构建统一的Variable对象
      const variable: Variable = {
        name: values.name,
        type: internalType as 'text' | 'number' | 'boolean' | 'object',
        value: actualMockData,
        originalType: values.type, // 保存真实的变量类型
        description: values.description || '',
      };

      onOk(variable);
      form.resetFields();
      setJsonData('');
      setJsonError('');
      setIsUserEditing(false);
    } catch (error) {
      // 表单验证失败时，不需要额外处理，Ant Design会自动显示错误信息
      console.log('表单验证失败:', error);
      // 不设置jsonError，让表单自己处理验证错误显示
    }
  };

  // 处理取消
  const handleCancel = () => {
    form.resetFields();
    setJsonData('');
    setJsonError(''); // 清除错误信息
    setIsUserEditing(false); // 重置用户编辑状态
    onCancel();
  };

  // 处理JSON编辑器数据变化
  const handleJSONChange = (newData: string) => {
    setIsUserEditing(true); // 标记用户正在编辑
    setJsonData(newData);
    // 当用户修改JSON内容时，清除错误信息
    if (jsonError) {
      setJsonError('');
    }
    console.log('📝 JSON数据变化:', newData);
  };

  // 处理富文本编辑器数据变化
  const handleRichTextChange = useCallback(
    (newData: any) => {
      const jsonString = JSON.stringify(newData);
      setIsUserEditing(true); // 标记用户正在编辑
      setJsonData(jsonString);
      // 只在必要时更新表单，避免循环更新
      const currentMockData = form.getFieldValue('mockData');
      if (currentMockData !== jsonString) {
        form.setFieldsValue({ mockData: jsonString });
      }
      console.log('📝 富文本数据变化:', jsonString);
    },
    [form],
  );

  // 获取富文本编辑器的值（使用useMemo缓存）
  const getRichTextValue = useMemo(() => {
    // 只在富文本类型时才解析JSON
    if (!jsonData || selectedType !== 'richtext') return undefined;
    try {
      return JSON.parse(jsonData);
    } catch (error) {
      console.error('解析富文本数据失败:', error);
      return undefined;
    }
  }, [jsonData, selectedType]);

  // 渲染模拟数据输入组件
  const renderMockDataInput = () => {
    switch (currentFormType) {
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
            rules={[{ required: true, message: '请输入模拟数据' }]}
          >
            <Input placeholder="请输入图片URL地址" maxLength={100} />
          </Form.Item>
        );

      case 'array':
        return (
          <div>
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
            {jsonError && (
              <div
                style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px' }}
              >
                {jsonError}
              </div>
            )}
          </div>
        );

      case 'imageArray':
        return (
          <div>
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
            {jsonError && (
              <div
                style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px' }}
              >
                {jsonError}
              </div>
            )}
          </div>
        );

      case 'richtext':
        return (
          <div>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>模拟数据</div>
            <RichTextEditor
              value={getRichTextValue}
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
    if (visible && !isUserEditing) {
      // 只在用户未编辑时执行
      console.log('🔍 弹窗打开，状态信息:', {
        editingVariable,
        defaultType,
        availableTypes,
        componentType,
        currentSelectedType: selectedType,
        isFirstOpen,
        isUserEditing,
      });

      if (editingVariable) {
        // 编辑模式：回显数据
        const formType = mapVariableTypeToFormType(editingVariable.type);
        setSelectedType(formType);

        // 设置表单数据
        let mockDataValue;
        if (
          (formType === 'richtext' ||
            formType === 'array' ||
            formType === 'imageArray') &&
          typeof editingVariable.value === 'object'
        ) {
          // JSON类型（富文本、数组、图片数组）：对象转字符串
          mockDataValue = JSON.stringify(editingVariable.value, null, 2);
          console.log('📋 JSON类型变量表单数据处理:', {
            variableName: editingVariable.name,
            formType,
            originalValue: editingVariable.value,
            convertedValue: mockDataValue,
            timestamp: new Date().toISOString(),
          });
        } else if (formType === 'number') {
          // 整数类型：确保是数值类型
          mockDataValue = Number(editingVariable.value);
          console.log('🔢 整数变量回显数据处理:', {
            variableName: editingVariable.name,
            originalValue: editingVariable.value,
            convertedValue: mockDataValue,
            valueType: typeof mockDataValue,
            timestamp: new Date().toISOString(),
          });
        } else {
          // 其他类型：保持原值
          mockDataValue = editingVariable.value;
        }

        form.setFieldsValue({
          type: formType,
          name: editingVariable.name,
          description: editingVariable.description || '', // 回显描述信息
          mockData: mockDataValue,
        });

        // 设置JSON编辑器数据（仅对非图片类型）
        if (formType !== 'image') {
          // 对于需要JSON格式的类型，确保jsonData是字符串格式
          if (
            (formType === 'richtext' ||
              formType === 'array' ||
              formType === 'imageArray') &&
            typeof editingVariable.value === 'object'
          ) {
            // 如果变量的值是JSON对象，需要序列化为字符串
            const jsonString = JSON.stringify(editingVariable.value, null, 2);
            setJsonData(jsonString);
            console.log('📋 JSON类型变量回显，对象转字符串:', {
              variableName: editingVariable.name,
              formType,
              originalValue: editingVariable.value,
              jsonString,
              timestamp: new Date().toISOString(),
            });
          } else {
            // 其他类型或者变量的值已经是字符串格式
            setJsonData(editingVariable.value);
          }
        }

        console.log('🔄 回显编辑数据:', {
          editingVariable,
          formType,
          mockData: editingVariable.value,
        });
      } else {
        // 新增模式：智能选择类型
        let typeToUse = defaultType;

        // 对于富文本组件，如果用户之前选择了富文本类型，则保持选择
        if (
          componentType === 'rich_text' &&
          !isFirstOpen &&
          selectedType === 'richtext'
        ) {
          typeToUse = 'richtext';
          console.log('✅ 富文本组件保持用户选择的富文本类型:', selectedType);
        } else if (isFirstOpen) {
          console.log('🔄 首次打开，使用默认类型:', defaultType);
          setIsFirstOpen(false); // 标记不再是首次打开
        } else {
          // 保持用户已选择的类型（适用于其他情况）
          typeToUse = selectedType;
          console.log('✅ 保持用户已选择的类型:', selectedType);
        }

        form.resetFields();
        setSelectedType(typeToUse);
        const defaultData = getDefaultMockData(typeToUse);

        // 使用setTimeout确保状态更新后再设置表单值
        setTimeout(() => {
          form.setFieldsValue({
            type: typeToUse,
            mockData: defaultData,
          });
        }, 0);

        setJsonData(defaultData);

        console.log('➕ 新增表单处理:', {
          initialType,
          defaultType,
          availableTypes,
          isFirstOpen,
          selectedType,
          typeToUse,
        });
      }
    }
  }, [
    visible,
    editingVariable,
    form,
    defaultType,
    availableTypes,
    componentType,
    isFirstOpen,
    selectedType,
    isUserEditing, // 添加到依赖数组
  ]);

  // 弹窗关闭时重置首次打开标志和编辑状态
  useEffect(() => {
    if (!visible) {
      // 弹窗关闭后，重置首次打开标志和编辑状态，为下次打开做准备
      setIsFirstOpen(true);
      setIsUserEditing(false);
    }
  }, [visible]);

  // 监听selectedType变化，同步更新表单值
  useEffect(() => {
    if (visible && !editingVariable) {
      // 只在新增模式下同步，编辑模式由上面的useEffect处理
      form.setFieldsValue({
        type: selectedType,
        mockData: getDefaultMockData(selectedType),
      });
    }
  }, [selectedType, visible, editingVariable, form]);

  // 调试日志：Modal渲染状态
  console.log('🔍 AddVariableModal 渲染状态:', {
    visible,
    editingVariable: editingVariable?.name,
    title: editingVariable ? '编辑变量' : '添加变量',
    timestamp: new Date().toISOString(),
    componentType,
    zIndex: 1000,
    containerTarget: 'document.body',
    modalId: `modal-${Math.random().toString(36).substr(2, 9)}`, // 添加唯一ID
  });

  // 详细的弹窗状态日志
  console.log('🔍 AddVariableModal 状态更新:', {
    visible,
    editingVariable: editingVariable?.name || 'null',
    isEditing: !!editingVariable,
    componentType,
    title: editingVariable ? '编辑变量' : '添加变量',
    timestamp: new Date().toISOString(),
  });

  return (
    <Modal
      title={editingVariable ? '编辑变量' : '添加变量'}
      open={visible}
      onCancel={handleCancel}
      maskClosable={!jsonError}
      keyboard={!jsonError}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          取消
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleSubmit}
          disabled={!!jsonError}
        >
          {editingVariable ? '更新' : '提交'}
        </Button>,
      ]}
      width={600}
      centered
      zIndex={1000}
      getContainer={() => document.body}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={formInitialValues}
        onValuesChange={(changedValues) => {
          if (changedValues.type && changedValues.type !== selectedType) {
            setSelectedType(changedValues.type);
            setIsUserEditing(false); // 重置用户编辑状态
          }
        }}
      >
        {/* 类型选择 */}
        <Form.Item
          name="type"
          label="类型"
          rules={[{ required: true, message: '请选择变量类型' }]}
        >
          <Select
            disabled={!!editingVariable} // 编辑模式时禁用类型选择
            onChange={handleTypeChange}
          >
            {availableTypes.map((type) => {
              const displayName =
                type === 'text'
                  ? '文本'
                  : type === 'number'
                  ? '整数'
                  : type === 'image'
                  ? '图片'
                  : type === 'imageArray'
                  ? '图片数组'
                  : type === 'array'
                  ? '选项数组'
                  : type === 'richtext'
                  ? '富文本'
                  : type;

              return (
                <Option key={type} value={type}>
                  {displayName}
                </Option>
              );
            })}
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
