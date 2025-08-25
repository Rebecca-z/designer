import { Form, Input, Select } from 'antd';
import React, { useCallback, useMemo } from 'react';
import {
  ComponentContent,
  ComponentNameInput,
  PropertyPanel,
  SettingSection,
} from '../common';
import { BaseComponentProps } from '../types';

const { Option } = Select;

// 类型定义
interface TitleData {
  title?: string;
  subtitle?: string;
  content?: string;
  style?: string;
}

// 主题颜色选项
const THEME_COLORS = [
  { value: 'blue', label: '蓝色 (blue)', color: '#1890ff' },
  { value: 'wathet', label: '淡蓝 (wathet)', color: '#13c2c2' },
  { value: 'turquoise', label: '青绿 (turquoise)', color: '#52c41a' },
  { value: 'green', label: '绿色 (green)', color: '#389e0d' },
  { value: 'yellow', label: '黄色 (yellow)', color: '#faad14' },
  { value: 'orange', label: '橙色 (orange)', color: '#fa8c16' },
  { value: 'red', label: '红色 (red)', color: '#f5222d' },
] as const;

// 颜色样本样式
const colorSwatchStyle = {
  width: '12px',
  height: '12px',
  borderRadius: '2px',
  marginRight: '8px',
} as const;

const TitleComponent: React.FC<BaseComponentProps> = ({
  selectedComponent,
  topLevelTab,
  setTopLevelTab,
  handleValueChange,
  VariableManagementPanel,
  isVariableModalVisible,
  handleVariableModalOk,
  handleVariableModalCancel,
  editingVariable,
  modalComponentType,
}) => {
  const [form] = Form.useForm();

  // 获取标题组件信息 - 使用useMemo优化
  const titleInfo = useMemo(() => {
    const component = selectedComponent as any as TitleData;
    return {
      title: component.title || component.content || '主标题',
      subtitle: component.subtitle || '副标题',
      style: component.style || 'blue',
    };
  }, [selectedComponent]);

  // 创建更新函数 - 使用useCallback优化
  const updateTitleComponent = useCallback(
    (field: string, value: any) => {
      handleValueChange(field, value);
    },
    [handleValueChange, selectedComponent.id],
  );

  // 生成主题颜色选项 - 使用useMemo优化
  const themeColorOptions = useMemo(() => {
    return THEME_COLORS.map(({ value, label, color }) => (
      <Option key={value} value={value}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ ...colorSwatchStyle, backgroundColor: color }} />
          {label}
        </div>
      </Option>
    ));
  }, []);

  // 组件属性内容
  const componentContent = useMemo(
    () => (
      <>
        <SettingSection title="📝 内容设置" form={form}>
          <ComponentNameInput
            prefix="Title_"
            suffix={selectedComponent.id}
            onChange={(name) => {
              // TitleComponent通常不需要名称更新，但保持接口一致性
              console.log('Title component name changed:', name);
            }}
          />

          <Form.Item label="主标题">
            <Input
              value={titleInfo.title}
              onChange={(e) => updateTitleComponent('title', e.target.value)}
              placeholder="请输入主标题"
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item label="副标题">
            <Input
              value={titleInfo.subtitle}
              onChange={(e) => updateTitleComponent('subtitle', e.target.value)}
              placeholder="请输入副标题"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </SettingSection>

        <SettingSection title="🎨 样式设置" form={form}>
          <Form.Item label="主题颜色">
            <Select
              value={titleInfo.style}
              onChange={(value) => updateTitleComponent('style', value)}
              style={{ width: '100%' }}
            >
              {themeColorOptions}
            </Select>
          </Form.Item>
        </SettingSection>
      </>
    ),
    [
      selectedComponent.id,
      titleInfo,
      themeColorOptions,
      updateTitleComponent,
      form,
    ],
  );

  return (
    <PropertyPanel
      activeTab={topLevelTab}
      onTabChange={setTopLevelTab}
      componentContent={
        <ComponentContent componentName="标题组件">
          {componentContent}
        </ComponentContent>
      }
      showEventTab={true}
      variableManagementComponent={<VariableManagementPanel />}
      isVariableModalVisible={isVariableModalVisible}
      handleVariableModalOk={handleVariableModalOk || (() => {})}
      handleVariableModalCancel={handleVariableModalCancel || (() => {})}
      editingVariable={editingVariable}
      modalComponentType={modalComponentType}
      selectedComponentTag={selectedComponent?.tag}
    />
  );
};

export default TitleComponent;
