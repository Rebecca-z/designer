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
import React from 'react';
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
  // selectedPath: _,
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

  console.log('📝 渲染普通文本组件编辑界面:', {
    componentTag: selectedComponent.tag,
    componentId: selectedComponent.id,
    topLevelTab,
    variablesCount: variables.length,
  });

  // 获取绑定的变量名
  const getBoundVariableName = () => {
    const boundVariableName =
      textComponentStateManager.getBoundVariableName(selectedComponent.id) ||
      '';
    return boundVariableName;
  };

  // 获取普通文本内容 - 根据当前模式显示不同内容
  const getTextContent = () => {
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
  };

  // 更新普通文本内容 - 保存用户编辑的内容
  const updateTextContent = (value: string) => {
    // 保存用户编辑的内容到状态管理器
    textComponentStateManager.setUserEditedContent(selectedComponent.id, value);

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
  };

  // 更新绑定的变量名
  const updateBoundVariableName = (variableName: string) => {
    console.log('🔗 更新绑定变量名:', {
      componentId: selectedComponent.id,
      variableName,
      variables: variables,
      timestamp: new Date().toISOString(),
    });

    // 在更新前保存当前的用户编辑内容
    const currentUserEditedContent =
      textComponentStateManager.getUserEditedContent(selectedComponent.id);

    // 创建完整的更新组件对象
    const updatedComponent = { ...selectedComponent };

    if (variableName) {
      // 如果选择了变量，设置绑定变量名到状态管理器
      textComponentStateManager.setBoundVariableName(
        selectedComponent.id,
        variableName,
      );

      // 如果用户还没有编辑过文本，将组件的原始内容保存为用户编辑内容
      if (currentUserEditedContent === undefined) {
        // 普通文本组件：保存字符串内容
        const originalContent = (selectedComponent as any).content || '';
        textComponentStateManager.setUserEditedContent(
          selectedComponent.id,
          originalContent,
        );
      } else {
        // 确保用户编辑的内容不被清除
        textComponentStateManager.setUserEditedContent(
          selectedComponent.id,
          currentUserEditedContent,
        );
      }

      // 更新全局数据中的content和i18n_content为变量占位符格式
      const variablePlaceholder = `\${${variableName}}`;
      console.log('📝 设置变量占位符:', {
        componentId: selectedComponent.id,
        variableName,
        variablePlaceholder,
        timestamp: new Date().toISOString(),
      });
      (updatedComponent as any).content = variablePlaceholder;
      (updatedComponent as any).i18n_content = {
        'en-US': variablePlaceholder,
      };

      // 更新组件但不触发文本输入框重新渲染
      onUpdateComponent(updatedComponent);
    } else {
      // 如果清除了变量绑定，使用文本输入框中的内容作为最终文本
      const userEditedContent = textComponentStateManager.getUserEditedContent(
        selectedComponent.id,
      );

      if (userEditedContent !== undefined) {
        // 使用用户编辑的内容作为最终文本
        (updatedComponent as any).content = userEditedContent;
        (updatedComponent as any).i18n_content = {
          'en-US': userEditedContent,
        };
      } else {
        // 如果没有用户编辑的内容，使用默认内容
        const defaultContent = '请输入文本内容';
        (updatedComponent as any).content = defaultContent;
        (updatedComponent as any).i18n_content = {
          'en-US': 'Enter text content',
        };
      }

      // 清除绑定变量
      textComponentStateManager.setBoundVariableName(
        selectedComponent.id,
        undefined,
      );

      // 更新组件
      onUpdateComponent(updatedComponent);
    }
  };

  console.log('🚀🚀🚀 文本组件编辑界面 - return 开始执行');

  return (
    <div
      style={{
        width: '300px',
        height: 'calc(100vh - 60px)',
        backgroundColor: '#fafafa',
        borderLeft: '1px solid #d9d9d9',
        padding: '16px',
        overflow: 'auto',
      }}
    >
      {/* 文本组件编辑界面的变量添加模态框 - 最优先渲染 */}
      {console.log('🔥 文本组件编辑界面 - 准备渲染AddVariableModal (最优先)')}
      <AddVariableModal
        visible={isVariableModalVisible}
        onOk={handleVariableModalOk}
        onCancel={handleVariableModalCancel}
        editingVariable={editingVariable}
        componentType={
          isVariableModalFromVariablesTab
            ? undefined // 来自变量Tab时不传递组件类型，显示全部类型
            : modalComponentType || selectedComponent?.tag // 来自组件属性时优先使用保存的组件类型，回退到当前组件类型
        }
      />

      <Tabs
        activeKey={topLevelTab}
        onChange={setTopLevelTab}
        style={{ height: '100%' }}
        tabBarStyle={{
          padding: '0 16px',
          backgroundColor: '#fff',
          margin: 0,
          borderBottom: '1px solid #d9d9d9',
        }}
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
            children: (
              <div style={{ padding: '16px' }}>
                <div
                  style={{
                    marginBottom: '16px',
                    padding: '12px',
                    backgroundColor: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    borderRadius: '6px',
                  }}
                >
                  <Text style={{ fontSize: '12px', color: '#0369a1' }}>
                    🎯 当前选中：普通文本组件
                  </Text>
                </div>

                {/* 内容设置 */}
                <div
                  style={{
                    marginBottom: '16px',
                    background: '#fff',
                    borderRadius: 6,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    padding: 16,
                  }}
                >
                  <div
                    style={{ fontWeight: 600, marginBottom: 8, fontSize: 15 }}
                  >
                    📝 内容设置
                  </div>
                  <Form form={form} layout="vertical">
                    <Form.Item label="普通文本内容">
                      {/* 内容模式切换 */}
                      <Segmented
                        value={textContentMode}
                        style={{ marginBottom: 16 }}
                        onChange={(value) => {
                          const newMode = value as 'specify' | 'variable';
                          setTextContentMode(newMode);

                          // 切换模式时，立即更新DSL数据以反映到画布
                          if (selectedComponent) {
                            const updatedComponent = { ...selectedComponent };

                            if (newMode === 'specify') {
                              // 切换到指定模式：使用用户编辑的内容，并清除变量绑定
                              const userEditedContent =
                                textComponentStateManager.getUserEditedContent(
                                  selectedComponent.id,
                                );

                              if (userEditedContent !== undefined) {
                                (updatedComponent as any).content =
                                  userEditedContent;
                                (updatedComponent as any).i18n_content = {
                                  'en-US': userEditedContent,
                                };
                              }

                              // 清除变量绑定状态，确保画布不再显示变量内容
                              textComponentStateManager.setBoundVariableName(
                                selectedComponent.id,
                                '',
                              );
                            } else if (newMode === 'variable') {
                              // 切换到绑定变量模式：使用变量占位符
                              const boundVariableName = getBoundVariableName();
                              const rememberedVariable =
                                lastBoundVariables[selectedComponent.id];
                              const variableName =
                                rememberedVariable || boundVariableName;

                              if (variableName) {
                                const variablePlaceholder = `\${${variableName}}`;
                                (updatedComponent as any).content =
                                  variablePlaceholder;
                                (updatedComponent as any).i18n_content = {
                                  'en-US': variablePlaceholder,
                                };

                                // 设置变量绑定状态，确保画布显示变量内容
                                textComponentStateManager.setBoundVariableName(
                                  selectedComponent.id,
                                  variableName,
                                );
                              }
                            }

                            // 立即更新组件，触发画布重新渲染
                            onUpdateComponent(updatedComponent);
                          }
                        }}
                        options={[
                          { label: '指定', value: 'specify' },
                          { label: '绑定变量', value: 'variable' },
                        ]}
                      />

                      {/* 普通文本内容显示区域 - 仅在指定模式下显示 */}
                      {textContentMode === 'specify' && (
                        <div style={{ marginBottom: 16 }}>
                          <TextArea
                            value={getTextContent()}
                            onChange={(
                              e: React.ChangeEvent<HTMLTextAreaElement>,
                            ) => updateTextContent(e.target.value)}
                            placeholder="请输入文本内容"
                            rows={4}
                            style={{
                              width: '100%',
                            }}
                          />
                        </div>
                      )}

                      {/* 绑定变量模式：显示变量选择器 */}
                      {textContentMode === 'variable' && (
                        <div>
                          <VariableBinding
                            componentType="plain_text"
                            variables={variables}
                            getFilteredVariables={getFilteredVariables}
                            value={(() => {
                              // 在绑定变量模式下，优先显示记住的变量
                              const rememberedVariable = selectedComponent
                                ? lastBoundVariables[selectedComponent.id]
                                : undefined;
                              const currentBoundVariable =
                                getBoundVariableName();

                              // 如果有记住的变量，使用记住的变量；否则使用当前绑定的变量
                              const displayValue =
                                rememberedVariable || currentBoundVariable;

                              return displayValue;
                            })()}
                            onChange={(value: string | undefined) => {
                              console.log('🔄 VariableBinding onChange 触发:', {
                                componentId: selectedComponent.id,
                                selectedValue: value,
                                timestamp: new Date().toISOString(),
                              });
                              // 立即更新DSL中的变量绑定
                              updateBoundVariableName(value || '');

                              // 同时记住这个选择，用于UI显示
                              if (selectedComponent) {
                                if (value) {
                                  setLastBoundVariables((prev) => ({
                                    ...prev,
                                    [selectedComponent.id]: value,
                                  }));

                                  // 立即更新DSL数据为变量占位符，确保画布实时更新
                                  const updatedComponent = {
                                    ...selectedComponent,
                                  };
                                  const variablePlaceholder = `\${${value}}`;
                                  (updatedComponent as any).content =
                                    variablePlaceholder;
                                  (updatedComponent as any).i18n_content = {
                                    'en-US': variablePlaceholder,
                                  };

                                  // 设置变量绑定状态，确保画布显示变量内容
                                  textComponentStateManager.setBoundVariableName(
                                    selectedComponent.id,
                                    value,
                                  );

                                  onUpdateComponent(updatedComponent);
                                } else {
                                  // 清除变量时，也清除记忆，并恢复用户编辑的内容
                                  setLastBoundVariables((prev) => {
                                    const newState = { ...prev };
                                    delete newState[selectedComponent.id];
                                    return newState;
                                  });

                                  // 清除变量绑定状态
                                  textComponentStateManager.setBoundVariableName(
                                    selectedComponent.id,
                                    '',
                                  );

                                  // 恢复用户编辑的内容到DSL
                                  const userEditedContent =
                                    textComponentStateManager.getUserEditedContent(
                                      selectedComponent.id,
                                    );
                                  if (userEditedContent !== undefined) {
                                    const updatedComponent = {
                                      ...selectedComponent,
                                    };
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
                            // componentType="plain_text"
                            // variables={variables}
                            // getFilteredVariables={getFilteredVariables}
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
                <div
                  style={{
                    background: '#fff',
                    borderRadius: 6,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    padding: 16,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 600,
                      marginBottom: 8,
                      fontSize: 15,
                    }}
                  >
                    🎨 样式设置
                  </div>
                  <Form form={form} layout="vertical">
                    <Form.Item label="字体大小">
                      <InputNumber
                        value={(selectedComponent as any).style?.fontSize || 14}
                        onChange={(value) =>
                          handleValueChange('fontSize', value)
                        }
                        min={12}
                        max={48}
                        style={{ width: '100%' }}
                        placeholder="设置字体大小"
                        addonAfter="px"
                      />
                    </Form.Item>
                    <Form.Item label="文字颜色">
                      <ColorPicker
                        value={
                          (selectedComponent as any).style?.color || '#000000'
                        }
                        onChange={(color) =>
                          handleValueChange('color', color.toHexString())
                        }
                        showText
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                    <Form.Item label="文字对齐">
                      <Select
                        value={
                          (selectedComponent as any).style?.textAlign || 'left'
                        }
                        onChange={(value) =>
                          handleValueChange('textAlign', value)
                        }
                        style={{ width: '100%' }}
                      >
                        <Option value="left">左对齐</Option>
                        <Option value="center">居中对齐</Option>
                        <Option value="right">右对齐</Option>
                      </Select>
                    </Form.Item>
                    <Form.Item label="最大行数">
                      <InputNumber
                        value={
                          (selectedComponent as any).style?.numberOfLines ||
                          undefined
                        }
                        onChange={(value) =>
                          handleValueChange('numberOfLines', value)
                        }
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
