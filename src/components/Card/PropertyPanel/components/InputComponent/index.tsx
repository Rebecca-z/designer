// InputComponent 编辑界面 - 输入框组件
import { BgColorsOutlined, SettingOutlined } from '@ant-design/icons';
import { Form, Input, Segmented, Switch, Tabs, Typography } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AddVariableModal from '../../../Variable/AddVariableModal';
import VariableBinding from '../../../Variable/VariableList';
import { inputComponentStateManager } from '../../../Variable/utils';
import { InputComponentProps } from '../types';

const { Text } = Typography;

// 类型定义
interface InputData {
  required?: boolean;
  placeholder?: {
    content?: string;
    i18n_content?: {
      'en-US': string;
    };
  };
  default_value?: {
    content?: string;
    i18n_content?: {
      content: string;
    };
  };
}

// 常量定义
const CONTENT_MODES = [
  { label: '指定', value: 'specify' },
  { label: '绑定变量', value: 'variable' },
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

const InputComponent: React.FC<InputComponentProps> = ({
  selectedComponent,
  variables,
  topLevelTab,
  setTopLevelTab,
  inputPlaceholderMode,
  setInputPlaceholderMode,
  inputDefaultValueMode,
  setInputDefaultValueMode,
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
  const [, forceUpdate] = useState({});

  // 初始化变量绑定状态 - 从组件数据中检测现有的变量占位符
  useEffect(() => {
    const component = selectedComponent as any as InputData;

    // 检测占位符中的变量绑定
    const placeholderContent = component.placeholder?.content || '';
    if (
      placeholderContent.startsWith('${') &&
      placeholderContent.endsWith('}')
    ) {
      const variableName = placeholderContent.slice(2, -1);
      const currentBinding =
        inputComponentStateManager.getBoundPlaceholderVariableName(
          selectedComponent.id,
        );
      if (currentBinding !== variableName) {
        inputComponentStateManager.setBoundPlaceholderVariableName(
          selectedComponent.id,
          variableName,
        );
      }
    }

    // 检测默认值中的变量绑定
    const defaultValueContent = component.default_value?.content || '';
    if (
      defaultValueContent.startsWith('${') &&
      defaultValueContent.endsWith('}')
    ) {
      const variableName = defaultValueContent.slice(2, -1);
      const currentBinding =
        inputComponentStateManager.getBoundDefaultValueVariableName(
          selectedComponent.id,
        );
      if (currentBinding !== variableName) {
        inputComponentStateManager.setBoundDefaultValueVariableName(
          selectedComponent.id,
          variableName,
        );
      }
    }
  }, [selectedComponent.id, selectedComponent]);

  // 获取输入框信息 - 使用useMemo优化
  const inputInfo = useMemo(() => {
    const component = selectedComponent as any as InputData;
    return {
      required: component.required || false,
      placeholderContent: component.placeholder?.content || '',
      defaultValueContent: component.default_value?.content || '',
    };
  }, [selectedComponent]);

  // 获取变量绑定信息 - 不使用useMemo，确保每次都获取最新状态
  const variableBindingInfo = (() => {
    const placeholderVariable =
      inputComponentStateManager.getBoundPlaceholderVariableName(
        selectedComponent.id,
      ) || '';
    const defaultValueVariable =
      inputComponentStateManager.getBoundDefaultValueVariableName(
        selectedComponent.id,
      ) || '';

    return {
      placeholderVariable,
      defaultValueVariable,
    };
  })();

  // 处理占位符模式切换 - 使用useCallback优化
  const handlePlaceholderModeChange = useCallback(
    (value: 'specify' | 'variable') => {
      setInputPlaceholderMode(value);

      const updatedComponent = { ...selectedComponent };

      if (value === 'specify') {
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
        const boundVariable =
          inputComponentStateManager.getBoundPlaceholderVariableName(
            selectedComponent.id,
          );
        if (boundVariable) {
          const variablePlaceholder = `\${${boundVariable}}`;
          (updatedComponent as any).placeholder = {
            content: variablePlaceholder,
            i18n_content: { 'en-US': variablePlaceholder },
          };
        }
      }

      onUpdateComponent(updatedComponent);
    },
    [selectedComponent, setInputPlaceholderMode, onUpdateComponent],
  );

  // 处理默认值模式切换 - 使用useCallback优化
  const handleDefaultValueModeChange = useCallback(
    (value: 'specify' | 'variable') => {
      setInputDefaultValueMode(value);

      const updatedComponent = { ...selectedComponent };

      if (value === 'specify') {
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
        const boundVariable =
          inputComponentStateManager.getBoundDefaultValueVariableName(
            selectedComponent.id,
          );
        if (boundVariable) {
          const variablePlaceholder = `\${${boundVariable}}`;
          (updatedComponent as any).default_value = {
            content: variablePlaceholder,
            i18n_content: { content: variablePlaceholder },
          };
        }
      }

      onUpdateComponent(updatedComponent);
    },
    [selectedComponent, setInputDefaultValueMode, onUpdateComponent],
  );

  // 更新占位符变量绑定 - 使用useCallback优化
  const updatePlaceholderVariableBinding = useCallback(
    (variableName: string | undefined) => {
      // 先更新状态管理器
      inputComponentStateManager.setBoundPlaceholderVariableName(
        selectedComponent.id,
        variableName,
      );

      const updatedComponent = { ...selectedComponent };

      if (variableName) {
        const currentContent =
          (selectedComponent as any).placeholder?.content || '';
        if (currentContent && !currentContent.startsWith('${')) {
          inputComponentStateManager.setUserEditedPlaceholder(
            selectedComponent.id,
            currentContent,
          );
        }

        const variablePlaceholder = `\${${variableName}}`;
        (updatedComponent as any).placeholder = {
          content: variablePlaceholder,
          i18n_content: { 'en-US': variablePlaceholder },
        };
      } else {
        const userEditedPlaceholder =
          inputComponentStateManager.getUserEditedPlaceholder(
            selectedComponent.id,
          );
        const content = userEditedPlaceholder || '';
        (updatedComponent as any).placeholder = {
          content: content,
          i18n_content: { 'en-US': content },
        };
      }

      onUpdateComponent(updatedComponent);

      // 强制组件重新渲染以更新变量绑定显示
      setTimeout(() => {
        forceUpdate({});
      }, 50);
    },
    [selectedComponent, onUpdateComponent, forceUpdate],
  );

  // 更新默认值变量绑定 - 使用useCallback优化
  const updateDefaultValueVariableBinding = useCallback(
    (variableName: string | undefined) => {
      // 先更新状态管理器
      inputComponentStateManager.setBoundDefaultValueVariableName(
        selectedComponent.id,
        variableName,
      );

      const updatedComponent = { ...selectedComponent };

      if (variableName) {
        const currentContent =
          (selectedComponent as any).default_value?.content || '';
        if (currentContent && !currentContent.startsWith('${')) {
          inputComponentStateManager.setUserEditedDefaultValue(
            selectedComponent.id,
            currentContent,
          );
        }

        const variablePlaceholder = `\${${variableName}}`;
        (updatedComponent as any).default_value = {
          content: variablePlaceholder,
          i18n_content: { content: variablePlaceholder },
        };
      } else {
        const userEditedDefaultValue =
          inputComponentStateManager.getUserEditedDefaultValue(
            selectedComponent.id,
          );
        const content = userEditedDefaultValue || '';
        (updatedComponent as any).default_value = {
          content: content,
          i18n_content: { content: content },
        };
      }

      onUpdateComponent(updatedComponent);

      // 强制组件重新渲染以更新变量绑定显示
      setTimeout(() => {
        forceUpdate({});
      }, 50);
    },
    [selectedComponent, onUpdateComponent, forceUpdate],
  );

  // 处理占位符内容变化 - 使用useCallback优化
  const handlePlaceholderContentChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
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
    },
    [selectedComponent, onUpdateComponent],
  );

  // 处理默认值内容变化 - 使用useCallback优化
  const handleDefaultValueContentChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
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
    },
    [selectedComponent, onUpdateComponent],
  );

  // 渲染基础设置内容 - 使用useMemo优化
  const basicSettingsContent = useMemo(
    () => (
      <div style={STYLES.section}>
        <div style={STYLES.sectionTitle}>⚙️ 基础设置</div>
        <Form form={form} layout="vertical">
          <Form.Item label="必填">
            <Switch
              checked={inputInfo.required}
              onChange={(checked) => handleValueChange('required', checked)}
            />
          </Form.Item>
        </Form>
      </div>
    ),
    [form, inputInfo.required, handleValueChange],
  );

  // 渲染占位符设置内容 - 使用useMemo优化
  const placeholderSettingsContent = useMemo(
    () => (
      <div style={STYLES.section}>
        <div style={STYLES.sectionTitle}>📝 占位符设置</div>
        <Form form={form} layout="vertical">
          <Form.Item label="占位符">
            <Segmented
              value={inputPlaceholderMode}
              style={{ marginBottom: 16 }}
              onChange={handlePlaceholderModeChange}
              options={[...CONTENT_MODES]}
            />

            {inputPlaceholderMode === 'specify' && (
              <Input
                value={inputInfo.placeholderContent}
                onChange={handlePlaceholderContentChange}
                placeholder="请输入占位符文本"
              />
            )}

            {inputPlaceholderMode === 'variable' && (
              <VariableBinding
                componentType="input"
                variables={variables}
                getFilteredVariables={getFilteredVariables}
                value={variableBindingInfo.placeholderVariable}
                onChange={updatePlaceholderVariableBinding}
                getVariableDisplayName={getVariableDisplayName}
                getVariableKeys={getVariableKeys}
                onAddVariable={() => handleAddVariableFromComponent('input')}
                placeholder="请选择占位符变量"
                label="绑定变量"
                addVariableText="+新建文本变量"
              />
            )}
          </Form.Item>
        </Form>
      </div>
    ),
    [
      form,
      inputPlaceholderMode,
      handlePlaceholderModeChange,
      inputInfo.placeholderContent,
      handlePlaceholderContentChange,
      variables,
      getFilteredVariables,
      variableBindingInfo.placeholderVariable,
      updatePlaceholderVariableBinding,
      getVariableDisplayName,
      getVariableKeys,
      handleAddVariableFromComponent,
    ],
  );

  // 渲染默认值设置内容 - 使用useMemo优化
  const defaultValueSettingsContent = useMemo(
    () => (
      <div style={STYLES.section}>
        <div style={STYLES.sectionTitle}>🏷️ 默认值设置</div>
        <Form form={form} layout="vertical">
          <Form.Item label="默认值">
            <Segmented
              value={inputDefaultValueMode}
              style={{ marginBottom: 16 }}
              onChange={handleDefaultValueModeChange}
              options={[...CONTENT_MODES]}
            />

            {inputDefaultValueMode === 'specify' && (
              <Input
                value={inputInfo.defaultValueContent}
                onChange={handleDefaultValueContentChange}
                placeholder="请输入默认值"
              />
            )}

            {inputDefaultValueMode === 'variable' && (
              <VariableBinding
                componentType="input"
                variables={variables}
                getFilteredVariables={getFilteredVariables}
                value={variableBindingInfo.defaultValueVariable}
                onChange={updateDefaultValueVariableBinding}
                getVariableDisplayName={getVariableDisplayName}
                getVariableKeys={getVariableKeys}
                onAddVariable={() => handleAddVariableFromComponent('input')}
                placeholder="请选择默认值变量"
                label="绑定变量"
                addVariableText="+新建变量"
              />
            )}
          </Form.Item>
        </Form>
      </div>
    ),
    [
      form,
      inputDefaultValueMode,
      handleDefaultValueModeChange,
      inputInfo.defaultValueContent,
      handleDefaultValueContentChange,
      variables,
      getFilteredVariables,
      variableBindingInfo.defaultValueVariable,
      updateDefaultValueVariableBinding,
      getVariableDisplayName,
      getVariableKeys,
      handleAddVariableFromComponent,
    ],
  );

  // 渲染组件属性Tab内容 - 使用useMemo优化
  const componentTabContent = useMemo(
    () => (
      <div style={STYLES.contentPadding}>
        <div style={STYLES.infoBox}>
          <Text style={{ fontSize: '12px', color: '#389e0d' }}>
            🎯 当前选中：输入框组件
          </Text>
        </div>
        {basicSettingsContent}
        {placeholderSettingsContent}
        {defaultValueSettingsContent}
      </div>
    ),
    [
      basicSettingsContent,
      placeholderSettingsContent,
      defaultValueSettingsContent,
    ],
  );

  return (
    <div style={STYLES.container}>
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
            children: componentTabContent as React.ReactNode,
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
