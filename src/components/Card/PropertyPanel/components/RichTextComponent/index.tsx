// RichTextComponent 编辑界面 - 专门处理富文本组件
import { BgColorsOutlined, SettingOutlined } from '@ant-design/icons';
import { Form, Segmented, Tabs, Typography } from 'antd';
import React, { useCallback, useEffect, useMemo } from 'react';
import {
  ComponentType,
  VariableItem,
} from '../../../card-designer-types-updated';
import RichTextEditor from '../../../RichTextEditor/RichTextEditor';
import AddVariableModal from '../../../Variable/AddVariableModal';
import { textComponentStateManager } from '../../../Variable/utils/index';
import VariableBinding from '../../../Variable/VariableList';

const { Text } = Typography;

// 类型定义
interface RichTextData {
  text?: {
    content?: string;
    i18n_content?: {
      'en-US': string;
    };
  };
}

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
    backgroundColor: '#f6ffed',
    border: '1px solid #b7eb8f',
    borderRadius: '6px',
  },
  section: {
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

export interface RichTextComponentProps {
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

const RichTextComponent: React.FC<RichTextComponentProps> = ({
  selectedComponent,
  selectedPath,
  variables,
  topLevelTab,
  setTopLevelTab,
  textContentMode,
  setTextContentMode,
  lastBoundVariables,
  setLastBoundVariables,
  onUpdateComponent,
  // handleValueChange: _,
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

  // 获取默认富文本内容 - 使用useCallback优化
  const getDefaultRichTextContent = useCallback(() => {
    return {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '请输入富文本内容',
            },
          ],
        },
      ],
    };
  }, []);

  // 初始化变量绑定状态 - 从组件数据中检测现有的变量占位符
  useEffect(() => {
    const component = selectedComponent as any as RichTextData;
    const textContent = component.text?.content || '';

    if (textContent.startsWith('${') && textContent.endsWith('}')) {
      const variableName = textContent.slice(2, -1);
      const currentBinding = textComponentStateManager.getBoundVariableName(
        selectedComponent.id,
      );
      if (currentBinding !== variableName) {
        textComponentStateManager.setBoundVariableName(
          selectedComponent.id,
          variableName,
        );
      }
    }
  }, [selectedComponent.id, selectedComponent]);

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

  // 获取富文本内容 - 根据当前模式显示不同内容
  const getRichTextContent = () => {
    if (!selectedComponent) return getDefaultRichTextContent();

    if (textContentMode === 'specify') {
      // 指定模式：显示用户编辑的内容
      const userEditedContent = textComponentStateManager.getUserEditedContent(
        selectedComponent.id,
      );

      if (userEditedContent !== undefined) {
        return userEditedContent;
      }

      // 如果没有用户编辑的内容，使用组件原始内容
      const content = (selectedComponent as any).content;
      return content || getDefaultRichTextContent();
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

          // 富文本：如果变量值是字符串，转换为富文本格式
          if (typeof variableValue === 'string') {
            return {
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: variableValue,
                    },
                  ],
                },
              ],
            };
          } else if (typeof variableValue === 'object') {
            return variableValue;
          }
        }
      }

      // 如果没有找到变量，显示提示信息
      return {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: '请选择要绑定的变量',
              },
            ],
          },
        ],
      };
    }

    return getDefaultRichTextContent();
  };

  // 更新富文本内容 - 保存用户编辑的内容
  const updateRichTextContent = (value: any) => {
    // 保存用户编辑的内容到状态管理器
    textComponentStateManager.setUserEditedContent(selectedComponent.id, value);

    // 创建更新的组件对象
    const updatedComponent = { ...selectedComponent };

    // 在"指定"模式下，立即更新DSL数据以反映到画布
    if (textContentMode === 'specify') {
      (updatedComponent as any).content = value;
    }

    // 更新组件
    onUpdateComponent(updatedComponent);
  };

  // 更新绑定的变量名
  const updateBoundVariableName = (variableName: string) => {
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
        const originalContent =
          (selectedComponent as any).content || getDefaultRichTextContent();
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
        // 富文本组件：同步更新 i18n_content
        (updatedComponent as any).i18n_content = {
          'en-US': userEditedContent,
        };
      } else {
        // 如果没有用户编辑的内容，使用默认内容
        const defaultContent = getDefaultRichTextContent();
        (updatedComponent as any).content = defaultContent;
        // 富文本组件：同步更新 i18n_content
        (updatedComponent as any).i18n_content = {
          'en-US': defaultContent,
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

  return (
    <div style={STYLES.container}>
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
                    🎯 当前选中：富文本组件
                  </Text>
                </div>

                {/* 内容设置 */}
                <div
                  style={{
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
                    <Form.Item label="富文本内容">
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
                                // 富文本组件：同步更新 i18n_content
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

                      {/* 富文本内容显示区域 - 仅在指定模式下显示 */}
                      {textContentMode === 'specify' && (
                        <div style={{ marginBottom: 16 }}>
                          <RichTextEditor
                            key={`rich-text-${
                              selectedComponent?.id
                            }-${selectedPath?.join('-')}-${textContentMode}`}
                            value={getRichTextContent()}
                            onChange={updateRichTextContent}
                            placeholder="请输入富文本内容..."
                            height={300}
                            showToolbar={true}
                          />
                        </div>
                      )}

                      {/* 绑定变量模式：显示变量选择器 */}
                      {textContentMode === 'variable' && (
                        <div>
                          <VariableBinding
                            componentType="rich_text"
                            variables={variables}
                            getFilteredVariables={getFilteredVariables}
                            value={variableBindingValue}
                            onChange={(value: string | undefined) => {
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
                                    // 富文本组件：同步更新 i18n_content
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
                              handleAddVariableFromComponent('rich_text')
                            }
                            placeholder="请选择要绑定的变量"
                            label="绑定变量"
                            addVariableText="+新建富文本变量"
                          />
                        </div>
                      )}
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

export default RichTextComponent;
