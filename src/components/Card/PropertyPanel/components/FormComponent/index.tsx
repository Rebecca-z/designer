// FormComponent 编辑界面 - 表单容器组件
import {
  BgColorsOutlined,
  FormOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Form, Input, Tabs, Typography } from 'antd';
import React, { useCallback, useMemo } from 'react';
import { BaseComponentProps } from '../types';

const { Text } = Typography;

// 类型定义
interface FormData {
  name?: string;
  elements?: any[];
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
  contentPadding: { padding: '8px 0' },
  infoBox: {
    background: '#e6f7ff',
    border: '1px solid #91d5ff',
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  section: {
    background: '#fff',
    borderRadius: 6,
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: 600,
    marginBottom: 8,
    fontSize: 15,
  },
  tip: {
    marginTop: 12,
    fontSize: 12,
    color: '#666',
    lineHeight: 1.4,
  },
  infoItem: {
    fontSize: 13,
    color: '#666',
    lineHeight: 1.6,
    marginBottom: 8,
  },
} as const;

const FormComponent: React.FC<BaseComponentProps> = ({
  selectedComponent,
  topLevelTab,
  setTopLevelTab,
  handleValueChange,
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

      console.log('🔧 表单标识符变更:', {
        userInput,
        fullName,
        componentId: selectedComponent.id,
      });

      handleValueChange('name', fullName);
    },
    [handleValueChange, selectedComponent.id],
  );

  // 渲染表单设置内容 - 使用useMemo优化
  const formSettingsContent = useMemo(
    () => (
      <div style={STYLES.section}>
        <div style={STYLES.sectionTitle}>📋 表单设置</div>
        <Form form={form} layout="vertical">
          <Form.Item label="表单标识符">
            <Input
              value={formInfo.suffix}
              onChange={handleNameChange}
              placeholder="请输入标识符后缀"
              addonBefore="Form_"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </div>
    ),
    [form, formInfo.suffix, handleNameChange],
  );

  // 渲染组件属性Tab内容 - 使用useMemo优化
  const propertiesTabContent = useMemo(
    () => (
      <div style={STYLES.contentPadding}>
        {/* 组件类型提示 */}
        <div style={STYLES.infoBox}>
          <FormOutlined
            style={{
              fontSize: 20,
              color: '#1890ff',
              marginRight: 8,
            }}
          />
          <Text strong style={{ color: '#1890ff', fontSize: 16 }}>
            🎯 当前选中：form
          </Text>
        </div>
        {formSettingsContent}
      </div>
    ),
    [formSettingsContent],
  );

  return (
    <div style={STYLES.container}>
      <Tabs
        activeKey={topLevelTab}
        onChange={setTopLevelTab}
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
            children: propertiesTabContent,
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

export default FormComponent;
