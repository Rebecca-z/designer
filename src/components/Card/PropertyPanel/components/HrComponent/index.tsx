// HrComponent 编辑界面 - 分割线组件
import { Form, Select } from 'antd';
import React, { useCallback, useMemo } from 'react';
import { ComponentContent, PropertyPanel, SettingSection } from '../common';
import ComponentNameInput from '../common/ComponentNameInput';
import { useComponentName } from '../hooks/useComponentName';
import { BaseComponentProps } from '../types';
import { BORDER_STYLES } from './constans';
import type { HrData } from './type';

const { Option } = Select;

// 样式常量（保留必要的样式）
const STYLES = {
  previewLine: {
    width: '40px',
    height: '2px',
  },
} as const;

const HrComponent: React.FC<BaseComponentProps> = ({
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

  // 使用通用的组件名称编辑Hook
  const { componentNameInfo, handleNameChange } = useComponentName({
    selectedComponent,
    prefix: 'Hr_',
    handleValueChange,
  });

  // 获取当前边框样式 - 使用useMemo优化
  const currentBorderStyle = useMemo(() => {
    const component = selectedComponent as any as HrData;
    return component.style?.borderStyle || 'solid';
  }, [selectedComponent]);

  // 处理边框样式变化 - 使用useCallback优化
  const handleBorderStyleChange = useCallback(
    (value: string) => {
      handleValueChange('borderStyle', value);
    },
    [handleValueChange],
  );

  // 渲染组件设置内容 - 使用useMemo优化
  const componentSettingsContent = useMemo(
    () => (
      <SettingSection title="🏷️ 组件设置" useForm={false}>
        <ComponentNameInput
          prefix="Hr_"
          suffix={componentNameInfo.suffix}
          onChange={handleNameChange}
        />
      </SettingSection>
    ),
    [componentNameInfo.suffix, handleNameChange],
  );

  // 渲染样式设置内容 - 使用useMemo优化
  const styleSettingsContent = useMemo(
    () => (
      <SettingSection title="🎨 样式设置" form={form}>
        <Form.Item label="边框样式">
          <Select
            value={currentBorderStyle}
            onChange={handleBorderStyleChange}
            style={{ width: '100%' }}
            placeholder="选择边框样式"
          >
            {BORDER_STYLES.map(({ value, label, preview }) => (
              <Option key={value} value={value}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <div
                    style={{
                      ...STYLES.previewLine,
                      ...preview,
                    }}
                  />
                  {label}
                </div>
              </Option>
            ))}
          </Select>
        </Form.Item>
      </SettingSection>
    ),
    [form, currentBorderStyle, handleBorderStyleChange],
  );

  // 渲染组件属性Tab内容 - 使用useMemo优化
  const componentTabContent = useMemo(
    () => (
      <>
        {componentSettingsContent}
        {styleSettingsContent}
      </>
    ),
    [componentSettingsContent, styleSettingsContent],
  );

  return (
    <PropertyPanel
      activeTab={topLevelTab}
      onTabChange={setTopLevelTab}
      componentContent={
        <ComponentContent componentName="分割线">
          {componentTabContent}
        </ComponentContent>
      }
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

export default HrComponent;
