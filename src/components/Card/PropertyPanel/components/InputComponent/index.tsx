// InputComponent 编辑界面 - 输入框组件
import { Form, Input, Segmented, Switch } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import VariableBinding from '../../../Variable/VariableList';
import { inputComponentStateManager } from '../../../Variable/utils';
import { PropertyPanel, SettingSection } from '../common';
import ComponentNameInput from '../common/ComponentNameInput';
import { useComponentName } from '../hooks/useComponentName';
import { InputComponentProps } from '../types';
import { CONTENT_MODES } from './constans';
import type { InputData } from './type';

const InputComponent: React.FC<InputComponentProps> = ({
  selectedComponent,
  selectedPath,
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
  lastBoundVariables,
  setLastBoundVariables,
}) => {
  // 使用通用的组件名称编辑Hook
  const { componentNameInfo, handleNameChange } = useComponentName({
    selectedComponent,
    prefix: 'Input_',
    handleValueChange,
  });

  // 检查组件是否嵌套在表单中
  const isNestedInForm = useMemo(() => {
    if (!selectedPath) return false;

    // 表单内组件路径：['dsl', 'body', 'elements', formIndex, 'elements', componentIndex]
    if (
      selectedPath.length === 6 &&
      selectedPath[0] === 'dsl' &&
      selectedPath[1] === 'body' &&
      selectedPath[2] === 'elements' &&
      selectedPath[4] === 'elements'
    ) {
      return true;
    }

    // 表单内分栏容器内的组件路径：['dsl', 'body', 'elements', formIndex, 'elements', columnSetIndex, 'columns', columnIndex, 'elements', componentIndex]
    if (
      selectedPath.length === 10 &&
      selectedPath[0] === 'dsl' &&
      selectedPath[1] === 'body' &&
      selectedPath[2] === 'elements' &&
      selectedPath[4] === 'elements' &&
      selectedPath[6] === 'columns' &&
      selectedPath[8] === 'elements'
    ) {
      return true;
    }

    return false;
  }, [selectedPath]);
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

        if (inputPlaceholderMode !== 'variable') {
          setInputPlaceholderMode('variable');
        }
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

        if (inputDefaultValueMode !== 'variable') {
          setInputDefaultValueMode('variable');
        }
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

      // 记住当前状态
      if (value === 'variable') {
        const currentContent =
          (selectedComponent as any).placeholder?.content || '';
        inputComponentStateManager.setUserEditedPlaceholder(
          selectedComponent.id,
          currentContent,
        );
      } else if (value === 'specify') {
        const boundVariable =
          inputComponentStateManager.getBoundPlaceholderVariableName(
            selectedComponent.id,
          );
        if (boundVariable) {
          setLastBoundVariables((prev) => ({
            ...prev,
            [`${selectedComponent.id}_placeholder`]: boundVariable,
          }));
        }
      }

      const updatedComponent = { ...selectedComponent };
      // 更新最新状态
      if (value === 'specify') {
        // 清除绑定的变量名
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
      } else if (value === 'variable') {
        const boundVariable =
          lastBoundVariables[`${selectedComponent.id}_placeholder`];
        if (boundVariable) {
          const variablePlaceholder = `\${${boundVariable}}`;
          (updatedComponent as any).placeholder = {
            content: variablePlaceholder,
            i18n_content: { 'en-US': variablePlaceholder },
          };
        }
        inputComponentStateManager.setBoundPlaceholderVariableName(
          selectedComponent.id,
          boundVariable,
        );
      } else {
        inputComponentStateManager.setBoundPlaceholderVariableName(
          selectedComponent.id,
          undefined,
        );
      }

      onUpdateComponent(updatedComponent);
    },
    [selectedComponent, setInputPlaceholderMode, onUpdateComponent],
  );

  // 处理默认值模式切换 - 使用useCallback优化
  const handleDefaultValueModeChange = useCallback(
    (value: 'specify' | 'variable') => {
      setInputDefaultValueMode(value);

      // 记住当前状态
      if (value === 'variable') {
        const currentContent =
          (selectedComponent as any).default_value?.content || '';
        inputComponentStateManager.setUserEditedDefaultValue(
          selectedComponent.id,
          currentContent,
        );
      } else if (value === 'specify') {
        const boundVariable =
          inputComponentStateManager.getBoundDefaultValueVariableName(
            selectedComponent.id,
          );
        console.warn('boundVariable', boundVariable);
        if (boundVariable) {
          setLastBoundVariables((prev) => ({
            ...prev,
            [`${selectedComponent.id}_default`]: boundVariable,
          }));
        }
      }

      const updatedComponent = { ...selectedComponent };
      // 更新最新状态
      if (value === 'specify') {
        // 清除绑定的变量名
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
      } else {
        const boundVariable =
          lastBoundVariables[`${selectedComponent.id}_default`];
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
        variableName || '',
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
        // 清除
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

  // 渲染组件设置内容 - 使用新的SettingSection
  const componentSettingsContent = useMemo(
    () => (
      <SettingSection title="🏷️ 组件设置" form={form}>
        <ComponentNameInput
          prefix="Input_"
          suffix={componentNameInfo.suffix}
          onChange={handleNameChange}
        />
      </SettingSection>
    ),
    [form, componentNameInfo.suffix, handleNameChange],
  );

  // 渲染基础设置内容 - 只在表单内显示
  const basicSettingsContent = useMemo(
    () => (
      <SettingSection title="⚙️ 基础设置" form={form}>
        <Form.Item label="必填">
          <Switch
            checked={inputInfo.required}
            onChange={(checked) => {
              // 只有在表单中才更新 required 字段到全局数据
              if (isNestedInForm) {
                handleValueChange('required', checked);
              }
            }}
          />
        </Form.Item>
      </SettingSection>
    ),
    [form, inputInfo.required, handleValueChange, isNestedInForm],
  );

  // 渲染占位符设置内容 - 使用新的SettingSection
  const placeholderSettingsContent = useMemo(
    () => (
      <SettingSection title="📝 占位符设置" form={form}>
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
              addVariableText="新建变量"
            />
          )}
        </Form.Item>
      </SettingSection>
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

  // 渲染默认值设置内容 - 使用新的SettingSection
  const defaultValueSettingsContent = useMemo(
    () => (
      <SettingSection title="🏷️ 默认值设置" form={form}>
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
              addVariableText="新建变量"
            />
          )}
        </Form.Item>
      </SettingSection>
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

  // 组合组件内容
  const componentContent = useMemo(
    () => (
      <>
        {componentSettingsContent}
        {isNestedInForm && basicSettingsContent}
        {placeholderSettingsContent}
        {defaultValueSettingsContent}
      </>
    ),
    [
      componentSettingsContent,
      isNestedInForm,
      basicSettingsContent,
      placeholderSettingsContent,
      defaultValueSettingsContent,
    ],
  );

  // 创建变量管理面板
  const VariableManagementComponent = React.useCallback(() => {
    return <VariableManagementPanel />;
  }, [VariableManagementPanel]);

  return (
    <PropertyPanel
      activeTab={topLevelTab}
      onTabChange={setTopLevelTab}
      componentContent={componentContent}
      eventTabDisabled={true}
      variableManagementComponent={<VariableManagementComponent />}
      isVariableModalVisible={isVariableModalVisible}
      handleVariableModalOk={handleVariableModalOk}
      handleVariableModalCancel={handleVariableModalCancel}
      editingVariable={editingVariable}
      isVariableModalFromVariablesTab={isVariableModalFromVariablesTab}
      modalComponentType={modalComponentType}
      selectedComponentTag={selectedComponent?.tag}
    />
  );
};

export default InputComponent;
