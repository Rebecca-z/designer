// FormComponent 编辑界面 - 表单容器组件
import { Form, Input } from 'antd';
import React, { useCallback, useMemo } from 'react';
import { PropertyPanel, SettingSection } from '../common';
import { BaseComponentProps } from '../types';
import type { FormData } from './type';

const FormComponent: React.FC<BaseComponentProps> = ({
  selectedComponent,
  topLevelTab,
  setTopLevelTab,
  handleValueChange,
  isVariableModalVisible,
  handleVariableModalOk,
  handleVariableModalCancel,
  editingVariable,
  isVariableModalFromVariablesTab,
  modalComponentType,
  VariableManagementPanel,
}) => {
  const [form] = Form.useForm();

  // 获取表单信息 - 使用useMemo优化
  const formInfo = useMemo(() => {
    const component = selectedComponent as any as FormData;
    const fullName = component.name || 'Form_';

    // 提取Form_后面的内容
    const suffix = fullName.startsWith('Form_')
      ? fullName.substring(5)
      : fullName;

    return {
      name: fullName,
      suffix: suffix,
      elementsCount: component.elements?.length || 0,
      id: selectedComponent.id,
    };
  }, [selectedComponent]);

  // 处理表单名称变化 - 使用useCallback优化
  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const userInput = e.target.value;
      // 拼接Form_前缀和用户输入的内容
      const fullName = `Form_${userInput}`;
      handleValueChange('name', fullName);
    },
    [handleValueChange, selectedComponent.id],
  );

  // 渲染表单设置内容 - 使用useMemo优化
  const formSettingsContent = useMemo(
    () => (
      <SettingSection title="📋 表单设置" form={form}>
        <Form.Item label="表单标识符">
          <Input
            value={formInfo.suffix}
            onChange={handleNameChange}
            placeholder="请输入标识符后缀"
            addonBefore="Form_"
            style={{ width: '100%' }}
          />
        </Form.Item>
      </SettingSection>
    ),
    [form, formInfo.suffix, handleNameChange],
  );

  return (
    <PropertyPanel
      activeTab={topLevelTab}
      onTabChange={setTopLevelTab}
      componentContent={formSettingsContent}
      eventTabDisabled={true}
      variableManagementComponent={<VariableManagementPanel />}
      isVariableModalVisible={isVariableModalVisible}
      handleVariableModalOk={handleVariableModalOk || (() => {})}
      handleVariableModalCancel={handleVariableModalCancel || (() => {})}
      editingVariable={editingVariable}
      isVariableModalFromVariablesTab={isVariableModalFromVariablesTab}
      modalComponentType={modalComponentType}
      selectedComponentTag={selectedComponent?.tag}
    />
  );
};

export default FormComponent;
