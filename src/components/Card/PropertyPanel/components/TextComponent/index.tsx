// TextComponent 编辑界面 - 专门处理普通文本组件
import { BgColorsOutlined, SettingOutlined } from '@ant-design/icons';
import {
  ColorPicker,
  Form,
  Input,
  InputNumber,
  Segmented,
  Select,
  Tabs,
  Typography,
} from 'antd';
import React, { useCallback, useMemo } from 'react';
import {
  ComponentType,
  VariableItem,
} from '../../../card-designer-types-updated';
import AddVariableModal from '../../../Variable/AddVariableModal';
import { textComponentStateManager } from '../../../Variable/utils/index';
import VariableBinding from '../../../Variable/VariableList';

const { Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// 类型定义
interface TextData {
  content?: string;
  i18n_content?: {
    'en-US': string;
  };
  style?: {
    fontSize?: number;
    color?: string;
    textAlign?: string;
    numberOfLines?: number;
  };
}

// 常量定义
const CONTENT_MODES = [
  { label: '指定', value: 'specify' },
  { label: '绑定变量', value: 'variable' },
] as const;

const TEXT_ALIGN_OPTIONS = [
  { value: 'left', label: '左对齐' },
  { value: 'center', label: '居中对齐' },
  { value: 'right', label: '右对齐' },
] as const;

// 样式常量
const STYLES = {
  container: {
    width: '300px',
    height: 'calc(100vh - 60px)',
    backgroundColor: '#fafafa',
    borderLeft: '1px solid #d9d9d9',
    padding: '16px',
    overflow: 'auto',
  },
  tabBarStyle: {
    padding: '0 16px',
    backgroundColor: '#fff',
    margin: 0,
    borderBottom: '1px solid #d9d9d9',
  },
  contentPadding: { padding: '16px' },
  infoBox: {
    marginBottom: '16px',
    padding: '12px',
    backgroundColor: '#f0f9ff',
    border: '1px solid #bae6fd',
    borderRadius: '6px',
  },
  sectionCard: {
    marginBottom: '16px',
    background: '#fff',
    borderRadius: 6,
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
    padding: 16,
  },
  sectionTitle: {
    fontWeight: 600,
    marginBottom: 8,
    fontSize: 15,
  },
} as const;

export interface TextComponentProps {
  selectedComponent: ComponentType;
  selectedPath: (string | number)[] | null;
  variables: VariableItem[];
  topLevelTab: string;
  setTopLevelTab: (tab: string) => void;
  textContentMode: 'specify' | 'variable';
  setTextContentMode: (mode: 'specify' | 'variable') => void;
  lastBoundVariables: Record<string, string>;
  setLastBoundVariables: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  initializedComponents: Set<string>;
  onUpdateComponent: (component: ComponentType) => void;
  handleValueChange: (field: string, value: any) => void;
  getFilteredVariables: (componentType: string) => VariableItem[];
  getVariableDisplayName: (variable: VariableItem) => string;
  getVariableKeys: (variable: any) => string[];
  handleAddVariableFromComponent: (componentType: string) => void;
  isVariableModalVisible: boolean;
  handleVariableModalOk: (variable: any) => void;
  handleVariableModalCancel: () => void;
  editingVariable: any;
  isVariableModalFromVariablesTab: boolean;
  modalComponentType?: string;
  VariableManagementPanel: React.ComponentType;
}

const TextComponent: React.FC<TextComponentProps> = ({
  selectedComponent,
  variables,
  topLevelTab,
  setTopLevelTab,
  textContentMode,
  setTextContentMode,
  lastBoundVariables,
  setLastBoundVariables,
  onUpdateComponent,
  handleValueChange,
  getFilteredVariables,
  getVariableDisplayName,
  getVariableKeys,
  handleAddVariableFromComponent,
  isVariableModalVisible,
  handleVariableModalOk,
  handleVariableModalCancel,
  editingVariable,
  isVariableModalFromVariablesTab,
  modalComponentType,
  VariableManagementPanel,
}) => {
  const [form] = Form.useForm();

  // 获取文本组件信息 - 使用useMemo优化
  const textInfo = useMemo(() => {
    const component = selectedComponent as any as TextData;
    return {
      content: component.content || '',
      style: {
        fontSize: component.style?.fontSize || 14,
        color: component.style?.color || '#000000',
        textAlign: component.style?.textAlign || 'left',
        numberOfLines: component.style?.numberOfLines,
      },
    };
  }, [selectedComponent]);

  // 获取绑定的变量名 - 使用useCallback优化
  const getBoundVariableName = useCallback(() => {
    const boundVariableName =
      textComponentStateManager.getBoundVariableName(selectedComponent.id) ||
      '';
    return boundVariableName;
  }, [selectedComponent.id]);

  // 计算变量绑定值 - 使用useMemo优化
  const variableBindingValue = useMemo(() => {
    // 在绑定变量模式下，优先显示记住的变量
    const rememberedVariable = selectedComponent
      ? lastBoundVariables[selectedComponent.id]
      : undefined;
    const currentBoundVariable = getBoundVariableName();

    // 如果有记住的变量，使用记住的变量；否则使用当前绑定的变量
    const displayValue = rememberedVariable || currentBoundVariable;

    return displayValue;
  }, [selectedComponent, lastBoundVariables, getBoundVariableName]);

  // 获取普通文本内容 - 使用useCallback优化
  const getTextContent = useCallback(() => {
    if (!selectedComponent) return '';

    if (textContentMode === 'specify') {
      // 指定模式：显示用户编辑的内容
      const userEditedContent = textComponentStateManager.getUserEditedContent(
        selectedComponent.id,
      );

      if (userEditedContent !== undefined) {
        return userEditedContent;
      }

      // 如果没有用户编辑的内容，使用组件原始内容
      return (selectedComponent as any).content || '';
    } else if (textContentMode === 'variable') {
      // 绑定变量模式：显示变量的实际值
      const boundVariableName = getBoundVariableName();
      const rememberedVariable = lastBoundVariables[selectedComponent.id];
      const variableName = rememberedVariable || boundVariableName;

      if (variableName) {
        // 查找变量并获取其值
        const variable = variables.find((v: any) => {
          if (typeof v === 'object' && v !== null) {
            const keys = getVariableKeys(v);
            return keys.length > 0 && keys[0] === variableName;
          }
          return false;
        });

        if (variable) {
          const variableValue = (variable as any)[variableName];
          // 普通文本：直接返回字符串值
          return String(variableValue);
        }
      }

      // 如果没有找到变量，显示提示信息
      return '请选择要绑定的变量';
    }

    return '';
  }, [
    selectedComponent,
    textContentMode,
    getBoundVariableName,
    lastBoundVariables,
    variables,
    getVariableKeys,
  ]);

  // 更新普通文本内容 - 使用useCallback优化
  const updateTextContent = useCallback(
    (value: string) => {
      // 保存用户编辑的内容到状态管理器
      textComponentStateManager.setUserEditedContent(
        selectedComponent.id,
        value,
      );

      // 创建更新的组件对象
      const updatedComponent = { ...selectedComponent };

      // 在"指定"模式下，立即更新DSL数据以反映到画布
      if (textContentMode === 'specify') {
        (updatedComponent as any).content = value;
        (updatedComponent as any).i18n_content = {
          'en-US': value,
        };
      }

      // 更新组件
      onUpdateComponent(updatedComponent);
    },
    [selectedComponent, textContentMode, onUpdateComponent],
  );

  // 文本对齐选项 - 使用useMemo优化
  const textAlignOptions = useMemo(() => {
    return TEXT_ALIGN_OPTIONS.map(({ value, label }) => (
      <Option key={value} value={value}>
        {label}
      </Option>
    ));
  }, []);

  // 组件内容 - 使用useMemo优化
  const componentTabContent = useMemo(
    () => (
      <div style={STYLES.contentPadding}>
        <div style={STYLES.infoBox}>
          <Text style={{ fontSize: '12px', color: '#0369a1' }}>
            🎯 当前选中：普通文本组件
          </Text>
        </div>

        {/* 内容设置 */}
        <div style={STYLES.sectionCard}>
          <div style={STYLES.sectionTitle}>📝 内容设置</div>
          <Form form={form} layout="vertical">
            <Form.Item label="普通文本内容">
              {/* 内容模式切换 */}
              <Segmented
                value={textContentMode}
                style={{ marginBottom: 16 }}
                onChange={(value) => {
                  const newMode = value as 'specify' | 'variable';
                  setTextContentMode(newMode);

                  // 切换模式时的处理逻辑
                  if (selectedComponent) {
                    const updatedComponent = { ...selectedComponent };

                    if (newMode === 'specify') {
                      // 切换到指定模式
                      const userEditedContent =
                        textComponentStateManager.getUserEditedContent(
                          selectedComponent.id,
                        );

                      if (userEditedContent !== undefined) {
                        (updatedComponent as any).content = userEditedContent;
                        (updatedComponent as any).i18n_content = {
                          'en-US': userEditedContent,
                        };
                      }

                      textComponentStateManager.setBoundVariableName(
                        selectedComponent.id,
                        '',
                      );
                    } else if (newMode === 'variable') {
                      // 切换到绑定变量模式
                      const boundVariableName = getBoundVariableName();
                      const rememberedVariable =
                        lastBoundVariables[selectedComponent.id];
                      const variableName =
                        rememberedVariable || boundVariableName;

                      if (variableName) {
                        const variablePlaceholder = `\${${variableName}}`;
                        (updatedComponent as any).content = variablePlaceholder;
                        (updatedComponent as any).i18n_content = {
                          'en-US': variablePlaceholder,
                        };

                        textComponentStateManager.setBoundVariableName(
                          selectedComponent.id,
                          variableName,
                        );
                      }
                    }

                    onUpdateComponent(updatedComponent);
                  }
                }}
                options={[...CONTENT_MODES]}
              />

              {/* 指定模式下的文本输入 */}
              {textContentMode === 'specify' && (
                <div style={{ marginBottom: 16 }}>
                  <TextArea
                    value={getTextContent()}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      updateTextContent(e.target.value)
                    }
                    placeholder="请输入文本内容"
                    rows={4}
                    style={{ width: '100%' }}
                  />
                </div>
              )}

              {/* 绑定变量模式 */}
              {textContentMode === 'variable' && (
                <div>
                  <VariableBinding
                    componentType="plain_text"
                    variables={variables}
                    getFilteredVariables={getFilteredVariables}
                    value={variableBindingValue}
                    onChange={(value: string | undefined) => {
                      // 处理变量绑定逻辑
                      if (selectedComponent) {
                        if (value) {
                          setLastBoundVariables((prev) => ({
                            ...prev,
                            [selectedComponent.id]: value,
                          }));

                          const updatedComponent = { ...selectedComponent };
                          const variablePlaceholder = `\${${value}}`;
                          (updatedComponent as any).content =
                            variablePlaceholder;
                          (updatedComponent as any).i18n_content = {
                            'en-US': variablePlaceholder,
                          };

                          textComponentStateManager.setBoundVariableName(
                            selectedComponent.id,
                            value,
                          );

                          onUpdateComponent(updatedComponent);
                        } else {
                          // 清除变量
                          setLastBoundVariables((prev) => {
                            const newState = { ...prev };
                            delete newState[selectedComponent.id];
                            return newState;
                          });

                          textComponentStateManager.setBoundVariableName(
                            selectedComponent.id,
                            '',
                          );

                          const userEditedContent =
                            textComponentStateManager.getUserEditedContent(
                              selectedComponent.id,
                            );
                          if (userEditedContent !== undefined) {
                            const updatedComponent = { ...selectedComponent };
                            (updatedComponent as any).content =
                              userEditedContent;
                            (updatedComponent as any).i18n_content = {
                              'en-US': userEditedContent,
                            };
                            onUpdateComponent(updatedComponent);
                          }
                        }
                      }
                    }}
                    getVariableDisplayName={getVariableDisplayName}
                    getVariableKeys={getVariableKeys}
                    onAddVariable={() =>
                      handleAddVariableFromComponent('plain_text')
                    }
                    placeholder="请选择要绑定的变量"
                    label="绑定变量"
                    addVariableText="+新建变量"
                  />
                </div>
              )}
            </Form.Item>
          </Form>
        </div>

        {/* 样式设置 */}
        <div style={STYLES.sectionCard}>
          <div style={STYLES.sectionTitle}>🎨 样式设置</div>
          <Form form={form} layout="vertical">
            <Form.Item label="字体大小">
              <InputNumber
                value={textInfo.style.fontSize}
                onChange={(value) => handleValueChange('fontSize', value)}
                min={12}
                max={48}
                style={{ width: '100%' }}
                placeholder="设置字体大小"
                addonAfter="px"
              />
            </Form.Item>
            <Form.Item label="文字颜色">
              <ColorPicker
                value={textInfo.style.color}
                onChange={(color) =>
                  handleValueChange('color', color.toHexString())
                }
                showText
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item label="文字对齐">
              <Select
                value={textInfo.style.textAlign}
                onChange={(value) => handleValueChange('textAlign', value)}
                style={{ width: '100%' }}
              >
                {textAlignOptions}
              </Select>
            </Form.Item>
            <Form.Item label="最大行数">
              <InputNumber
                value={textInfo.style.numberOfLines}
                onChange={(value) => handleValueChange('numberOfLines', value)}
                min={1}
                max={10}
                style={{ width: '100%' }}
                placeholder="不限制"
              />
            </Form.Item>
          </Form>
        </div>
      </div>
    ),
    [
      textContentMode,
      setTextContentMode,
      getTextContent,
      updateTextContent,
      variableBindingValue,
      textInfo,
      textAlignOptions,
      form,
      selectedComponent,
      getBoundVariableName,
      lastBoundVariables,
      onUpdateComponent,
      setLastBoundVariables,
      variables,
      getFilteredVariables,
      getVariableDisplayName,
      getVariableKeys,
      handleAddVariableFromComponent,
      handleValueChange,
    ],
  );

  return (
    <div style={STYLES.container}>
      {/* 文本组件编辑界面的变量添加模态框 */}
      <AddVariableModal
        visible={isVariableModalVisible}
        onOk={handleVariableModalOk}
        onCancel={handleVariableModalCancel}
        editingVariable={editingVariable}
        componentType={
          isVariableModalFromVariablesTab
            ? undefined
            : modalComponentType || selectedComponent?.tag
        }
      />

      <Tabs
        activeKey={topLevelTab}
        onChange={setTopLevelTab}
        style={{ height: '100%' }}
        tabBarStyle={STYLES.tabBarStyle}
        size="small"
        items={[
          {
            key: 'component',
            label: (
              <span
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <SettingOutlined />
                组件属性
              </span>
            ),
            children: componentTabContent,
          },
          {
            key: 'variables',
            label: (
              <span
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <BgColorsOutlined />
                变量
              </span>
            ),
            children: <VariableManagementPanel />,
          },
        ]}
      />
    </div>
  );
};

export default TextComponent;
