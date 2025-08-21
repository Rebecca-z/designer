// HrComponent 编辑界面 - 分割线组件
import { BgColorsOutlined, SettingOutlined } from '@ant-design/icons';
import { Form, Select, Tabs, Typography } from 'antd';
import React, { useCallback, useMemo } from 'react';
import { BaseComponentProps } from '../types';

const { Text } = Typography;
const { Option } = Select;

// 类型定义
interface HrStyle {
  borderStyle?: 'solid' | 'dashed' | 'dotted';
}

interface HrData {
  style?: HrStyle;
}

// 常量定义
const BORDER_STYLES = [
  {
    value: 'solid',
    label: '实线 (solid)',
    preview: { borderTop: '2px solid #666' },
  },
  {
    value: 'dashed',
    label: '虚线 (dashed)',
    preview: { borderTop: '2px dashed #666' },
  },
  {
    value: 'dotted',
    label: '点线 (dotted)',
    preview: { borderTop: '2px dotted #666' },
  },
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
  section: {
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
  VariableManagementPanel,
}) => {
  const [form] = Form.useForm();

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

  // 渲染样式设置内容 - 使用useMemo优化
  const styleSettingsContent = useMemo(
    () => (
      <div style={STYLES.section}>
        <div style={STYLES.sectionTitle}>🎨 样式设置</div>
        <Form form={form} layout="vertical">
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
        </Form>
      </div>
    ),
    [form, currentBorderStyle, handleBorderStyleChange],
  );

  // 渲染组件属性Tab内容 - 使用useMemo优化
  const componentTabContent = useMemo(
    () => (
      <div style={STYLES.contentPadding}>
        <div style={STYLES.infoBox}>
          <Text style={{ fontSize: '12px', color: '#0369a1' }}>
            🎯 当前选中：分割线组件
          </Text>
        </div>
        {styleSettingsContent}
      </div>
    ),
    [styleSettingsContent],
  );

  return (
    <div style={STYLES.container}>
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

export default HrComponent;
