import { Button, Form, Input, InputNumber, Modal, Select } from 'antd';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
    console.log('🔍 获取可用变量类型:', { componentType });

    if (!componentType) {
      // 如果没有组件类型信息，返回所有类型
      console.log('✅ 无组件类型，返回所有变量类型');
      return ['text', 'number', 'image', 'imageArray', 'array', 'richtext'];
    }

    // 根据组件类型返回对应的变量类型
    switch (componentType) {
      case 'plain_text':
        return ['text'];
      case 'rich_text':
        return ['richtext'];
      case 'img':
        return ['image', 'imageArray'];
      case 'input':
        return ['text', 'number'];
      case 'select_static':
      case 'multi_select_static':
        return ['array'];
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
      case 'input':
        return 'text';
      case 'select_static':
      case 'multi_select_static':
        return 'array';
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
            },
            {
              img_url:
                'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
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
        // 检查是否是新格式的图片变量（text类型但originalType是image）
        if (editingVariable?.originalType === 'image') {
          return 'image';
        }
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
    console.log('🔄 类型变更:', { oldType: selectedType, newType: value });

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

    console.log('✅ 类型变更完成:', {
      selectedType: value,
      mockData: defaultData,
      formType: form.getFieldValue('type'),
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
      // 先获取表单数据
      const values = await form.validateFields();

      // 如果是富文本类型，直接处理富文本编辑器数据
      if (values.type === 'richtext') {
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
        setJsonError(''); // 清除错误信息
        setIsUserEditing(false); // 重置用户编辑状态
        return;
      }

      // 如果是图片类型，直接处理字符串输入
      if (values.type === 'image') {
        // 构建Variable对象，保存为键值对格式
        const variable: Variable = {
          name: values.name,
          type: 'text', // 图片URL作为文本类型
          value: values.mockData, // 直接使用输入的URL字符串
          originalType: values.type, // 应该是 'image'
          description: values.description || '',
        };

        console.log('💾 [图片类型] 提交图片变量数据:', {
          isEditing: !!editingVariable,
          selectedType,
          formType: values.type,
          variable,
          imageUrl: values.mockData,
          originalType: variable.originalType,
        });

        onOk(variable);
        form.resetFields();
        setJsonData('');
        setJsonError('');
        setIsUserEditing(false);
        return;
      }

      // 如果是数组或图片数组类型，需要验证JSON编辑器
      if (values.type === 'array' || values.type === 'imageArray') {
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
            const errorMessage =
              originalErrors[0]?.message ||
              'SyntaxError: Unexpected end of JSON input';
            setJsonError(errorMessage);
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
              setJsonError(''); // 清除错误信息
              setIsUserEditing(false); // 重置用户编辑状态
              return;
            } else {
              console.error(
                '获取格式化JSON失败:',
                result?.success ? '未知错误' : result?.error,
              );
              const errorMessage =
                (result?.success ? '未知错误' : result?.error) ||
                'SyntaxError: Unexpected end of JSON input';
              setJsonError(errorMessage);
              return;
            }
          } else {
            console.error('格式化后JSON验证失败:', errors);
            const errorMessage =
              errors[0]?.message || 'SyntaxError: Unexpected end of JSON input';
            setJsonError(errorMessage);
            return;
          }
        } else {
          console.error('JSON编辑器引用不存在');
          setJsonError('JSON编辑器初始化失败');
          return;
        }
      }

      // 对于非JSON类型，使用原有的逻辑
      let actualMockData = values.mockData;
      if (['array', 'imageArray'].includes(selectedType)) {
        actualMockData = jsonData;
      }
      // 图片类型使用表单输入的字符串值

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
            return 'text'; // 新的图片类型使用text
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

      console.log('💾 [通用类型] 提交变量数据:', {
        isEditing: !!editingVariable,
        selectedType,
        formType: values.type,
        variable,
        formValues: values,
        originalType: variable.originalType,
        jsonData,
      });

      onOk(variable);
      form.resetFields();
      setJsonData('');
      setIsUserEditing(false); // 重置用户编辑状态
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 处理取消
  const handleCancel = () => {
    // 如果有JSON错误，阻止弹窗关闭
    if (jsonError) {
      return;
    }
    form.resetFields();
    setJsonData('');
    setJsonError(''); // 清除错误信息
    setIsUserEditing(false); // 重置用户编辑状态
    onCancel();
  };

  // 处理JSON编辑器数据变化
  const handleJSONChange = (newData: string) => {
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
              defaultValue={1}
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
        form.setFieldsValue({
          type: formType,
          name: editingVariable.name,
          description: editingVariable.description || '', // 回显描述信息
          mockData: editingVariable.value,
        });

        // 设置JSON编辑器数据（仅对非图片类型）
        if (formType !== 'image') {
          setJsonData(editingVariable.value);
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
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={formInitialValues}
        onValuesChange={(changedValues, allValues) => {
          console.log('🔍 Form值变化:', { changedValues, allValues });

          // 如果类型字段发生变化，同步更新selectedType状态
          if (changedValues.type && changedValues.type !== selectedType) {
            console.log('🔄 同步更新selectedType:', {
              oldType: selectedType,
              newType: changedValues.type,
            });
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
          help={`可用类型: ${availableTypes.join(', ')}`}
        >
          <Select
            onChange={handleTypeChange}
            onFocus={() => {
              console.log('🔍 Select获得焦点，当前状态:', {
                selectedType,
                availableTypes,
                formValue: form.getFieldValue('type'),
              });
            }}
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

              console.log('🔧 渲染Select选项:', {
                type,
                displayName,
                availableTypes,
              });

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
