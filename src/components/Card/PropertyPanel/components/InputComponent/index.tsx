// InputComponent 编辑界面 - 输入框组件
import { BgColorsOutlined, SettingOutlined } from '@ant-design/icons';
import { Form, Input, Segmented, Switch, Tabs, Typography } from 'antd';
import React from 'react';
import AddVariableModal from '../../../Variable/AddVariableModal';
import VariableBinding from '../../../Variable/VariableList';
import { inputComponentStateManager } from '../../../Variable/utils';
import { InputComponentProps } from '../types';

const { Text } = Typography;

const InputComponent: React.FC<InputComponentProps> = ({
  selectedComponent,
  variables,
  topLevelTab,
  setTopLevelTab,
  inputPlaceholderMode,
  setInputPlaceholderMode,
  inputDefaultValueMode,
  setInputDefaultValueMode,
  // lastBoundVariables: _lastBoundVariables,
  // setLastBoundVariables: _setLastBoundVariables,
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

  console.log('📝 渲染输入框组件编辑界面:', {
    componentId: selectedComponent.id,
    topLevelTab,
    variablesCount: variables.length,
  });

  // 获取绑定的占位符变量名
  const getBoundPlaceholderVariableName = () => {
    return (
      inputComponentStateManager.getBoundPlaceholderVariableName(
        selectedComponent.id,
      ) || ''
    );
  };

  // 获取绑定的默认值变量名
  const getBoundDefaultValueVariableName = () => {
    return (
      inputComponentStateManager.getBoundDefaultValueVariableName(
        selectedComponent.id,
      ) || ''
    );
  };

  // 更新占位符变量绑定
  const updatePlaceholderVariableBinding = (
    variableName: string | undefined,
  ) => {
    console.log('🔄 更新占位符变量绑定:', {
      componentId: selectedComponent.id,
      variableName,
      timestamp: new Date().toISOString(),
    });

    const updatedComponent = { ...selectedComponent };

    if (variableName) {
      // 绑定变量时，先保存当前的指定内容到缓存
      const currentContent =
        (selectedComponent as any).placeholder?.content || '';
      if (currentContent && !currentContent.startsWith('${')) {
        // 只有当前内容不是变量占位符时才保存
        inputComponentStateManager.setUserEditedPlaceholder(
          selectedComponent.id,
          currentContent,
        );
      }

      // 设置变量占位符
      const variablePlaceholder = `\${${variableName}}`;
      (updatedComponent as any).placeholder = {
        content: variablePlaceholder,
        i18n_content: { 'en-US': variablePlaceholder },
      };

      inputComponentStateManager.setBoundPlaceholderVariableName(
        selectedComponent.id,
        variableName,
      );
    } else {
      // 清除变量绑定，恢复用户编辑的内容
      const userEditedPlaceholder =
        inputComponentStateManager.getUserEditedPlaceholder(
          selectedComponent.id,
        );
      const content = userEditedPlaceholder || '';
      (updatedComponent as any).placeholder = {
        content: content,
        i18n_content: { 'en-US': content },
      };

      inputComponentStateManager.setBoundPlaceholderVariableName(
        selectedComponent.id,
        undefined,
      );
    }

    onUpdateComponent(updatedComponent);
  };

  // 更新默认值变量绑定
  const updateDefaultValueVariableBinding = (
    variableName: string | undefined,
  ) => {
    console.log('🔄 更新默认值变量绑定:', {
      componentId: selectedComponent.id,
      variableName,
      timestamp: new Date().toISOString(),
    });

    const updatedComponent = { ...selectedComponent };

    if (variableName) {
      // 绑定变量时，先保存当前的指定内容到缓存
      const currentContent =
        (selectedComponent as any).default_value?.content || '';
      if (currentContent && !currentContent.startsWith('${')) {
        // 只有当前内容不是变量占位符时才保存
        inputComponentStateManager.setUserEditedDefaultValue(
          selectedComponent.id,
          currentContent,
        );
      }

      // 设置变量占位符
      const variablePlaceholder = `\${${variableName}}`;
      (updatedComponent as any).default_value = {
        content: variablePlaceholder,
        i18n_content: { content: variablePlaceholder },
      };

      inputComponentStateManager.setBoundDefaultValueVariableName(
        selectedComponent.id,
        variableName,
      );
    } else {
      // 清除变量绑定，恢复用户编辑的内容
      const userEditedDefaultValue =
        inputComponentStateManager.getUserEditedDefaultValue(
          selectedComponent.id,
        );
      const content = userEditedDefaultValue || '';
      (updatedComponent as any).default_value = {
        content: content,
        i18n_content: { content: content },
      };

      inputComponentStateManager.setBoundDefaultValueVariableName(
        selectedComponent.id,
        undefined,
      );
    }

    onUpdateComponent(updatedComponent);
  };

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
                    backgroundColor: '#f6ffed',
                    border: '1px solid #b7eb8f',
                    borderRadius: '6px',
                  }}
                >
                  <Text style={{ fontSize: '12px', color: '#389e0d' }}>
                    🎯 当前选中：输入框组件
                  </Text>
                </div>

                {/* 基础设置 */}
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
                    ⚙️ 基础设置
                  </div>
                  <Form form={form} layout="vertical">
                    <Form.Item label="必填">
                      <Switch
                        checked={(selectedComponent as any).required || false}
                        onChange={(checked) =>
                          handleValueChange('required', checked)
                        }
                      />
                    </Form.Item>
                  </Form>
                </div>

                {/* 占位符设置 */}
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
                    📝 占位符设置
                  </div>
                  <Form form={form} layout="vertical">
                    <Form.Item label="占位符">
                      <Segmented
                        value={inputPlaceholderMode}
                        style={{ marginBottom: 16 }}
                        onChange={(value) => {
                          const newMode = value as 'specify' | 'variable';
                          setInputPlaceholderMode(newMode);

                          // 处理模式切换时的占位符显示逻辑
                          const updatedComponent = { ...selectedComponent };

                          if (newMode === 'specify') {
                            // 切换到指定模式：显示用户编辑的占位符内容
                            const userEditedPlaceholder =
                              inputComponentStateManager.getUserEditedPlaceholder(
                                selectedComponent.id,
                              );
                            const content = userEditedPlaceholder || '';
                            (updatedComponent as any).placeholder = {
                              content: content,
                              i18n_content: { 'en-US': content },
                            };
                          } else {
                            // 切换到变量模式：检查是否有绑定的变量
                            const boundVariable =
                              inputComponentStateManager.getBoundPlaceholderVariableName(
                                selectedComponent.id,
                              );

                            if (boundVariable) {
                              // 如果有绑定的变量，显示变量占位符
                              const variablePlaceholder = `\${${boundVariable}}`;
                              (updatedComponent as any).placeholder = {
                                content: variablePlaceholder,
                                i18n_content: { 'en-US': variablePlaceholder },
                              };
                            } else {
                              // 如果没有绑定变量，保持当前内容不变
                              // 不需要修改组件，让用户选择变量
                            }
                          }

                          onUpdateComponent(updatedComponent);
                        }}
                        options={[
                          { label: '指定', value: 'specify' },
                          { label: '绑定变量', value: 'variable' },
                        ]}
                      />

                      {inputPlaceholderMode === 'specify' && (
                        <Input
                          value={
                            (selectedComponent as any).placeholder?.content ||
                            ''
                          }
                          onChange={(e) => {
                            // 保存用户编辑的内容到状态管理器
                            inputComponentStateManager.setUserEditedPlaceholder(
                              selectedComponent.id,
                              e.target.value,
                            );

                            const updatedComponent = { ...selectedComponent };
                            (updatedComponent as any).placeholder = {
                              content: e.target.value,
                              i18n_content: { 'en-US': e.target.value },
                            };
                            onUpdateComponent(updatedComponent);
                          }}
                          placeholder="请输入占位符文本"
                        />
                      )}

                      {inputPlaceholderMode === 'variable' && (
                        <VariableBinding
                          componentType="input"
                          variables={variables}
                          getFilteredVariables={getFilteredVariables}
                          value={getBoundPlaceholderVariableName()}
                          onChange={(value: string | undefined) => {
                            updatePlaceholderVariableBinding(value);
                          }}
                          getVariableDisplayName={getVariableDisplayName}
                          getVariableKeys={getVariableKeys}
                          onAddVariable={() =>
                            handleAddVariableFromComponent('input')
                          }
                          placeholder="请选择占位符变量"
                          label="绑定变量"
                          addVariableText="+新建文本变量"
                        />
                      )}
                    </Form.Item>
                  </Form>
                </div>

                {/* 默认值设置 */}
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
                    🏷️ 默认值设置
                  </div>
                  <Form form={form} layout="vertical">
                    <Form.Item label="默认值">
                      <Segmented
                        value={inputDefaultValueMode}
                        style={{ marginBottom: 16 }}
                        onChange={(value) => {
                          const newMode = value as 'specify' | 'variable';
                          setInputDefaultValueMode(newMode);

                          // 处理模式切换时的默认值显示逻辑
                          const updatedComponent = { ...selectedComponent };

                          if (newMode === 'specify') {
                            // 切换到指定模式：显示用户编辑的默认值内容
                            const userEditedDefaultValue =
                              inputComponentStateManager.getUserEditedDefaultValue(
                                selectedComponent.id,
                              );
                            const content = userEditedDefaultValue || '';
                            (updatedComponent as any).default_value = {
                              content: content,
                              i18n_content: { content: content },
                            };
                          } else {
                            // 切换到变量模式：检查是否有绑定的变量
                            const boundVariable =
                              inputComponentStateManager.getBoundDefaultValueVariableName(
                                selectedComponent.id,
                              );

                            if (boundVariable) {
                              // 如果有绑定的变量，显示变量占位符
                              const variablePlaceholder = `\${${boundVariable}}`;
                              (updatedComponent as any).default_value = {
                                content: variablePlaceholder,
                                i18n_content: { content: variablePlaceholder },
                              };
                            } else {
                              // 如果没有绑定变量，保持当前内容不变
                              // 不需要修改组件，让用户选择变量
                            }
                          }

                          onUpdateComponent(updatedComponent);
                        }}
                        options={[
                          { label: '指定', value: 'specify' },
                          { label: '绑定变量', value: 'variable' },
                        ]}
                      />

                      {inputDefaultValueMode === 'specify' && (
                        <Input
                          value={
                            (selectedComponent as any).default_value?.content ||
                            ''
                          }
                          onChange={(e) => {
                            // 保存用户编辑的内容到状态管理器
                            inputComponentStateManager.setUserEditedDefaultValue(
                              selectedComponent.id,
                              e.target.value,
                            );

                            const updatedComponent = { ...selectedComponent };
                            (updatedComponent as any).default_value = {
                              content: e.target.value,
                              i18n_content: { content: e.target.value },
                            };
                            onUpdateComponent(updatedComponent);
                          }}
                          placeholder="请输入默认值"
                        />
                      )}

                      {inputDefaultValueMode === 'variable' && (
                        <VariableBinding
                          componentType="input"
                          variables={variables}
                          getFilteredVariables={getFilteredVariables}
                          value={getBoundDefaultValueVariableName()}
                          onChange={(value: string | undefined) => {
                            updateDefaultValueVariableBinding(value);
                          }}
                          getVariableDisplayName={getVariableDisplayName}
                          getVariableKeys={getVariableKeys}
                          onAddVariable={() =>
                            handleAddVariableFromComponent('input')
                          }
                          placeholder="请选择默认值变量"
                          label="绑定变量"
                          addVariableText="+新建变量"
                        />
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

export default InputComponent;
