import {
  BgColorsOutlined,
  FileTextOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Form, Input, Select, Tabs, Typography } from 'antd';
import React, { useCallback, useMemo } from 'react';
import AddVariableModal from '../../../Variable/AddVariableModal';
import { BaseComponentProps } from '../types';

const { Text } = Typography;
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
  sectionCard: {
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
  colorSwatch: {
    width: '12px',
    height: '12px',
    borderRadius: '2px',
    marginRight: '8px',
  },
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
          <div style={{ ...STYLES.colorSwatch, backgroundColor: color }} />
          {label}
        </div>
      </Option>
    ));
  }, []);

  // 组件内容 - 使用useMemo优化
  const componentTabContent = useMemo(
    () => (
      <div style={STYLES.contentPadding}>
        {/* 组件类型提示 */}
        <div style={STYLES.infoBox}>
          <FileTextOutlined
            style={{
              fontSize: 20,
              color: '#1890ff',
              marginRight: 8,
            }}
          />
          <Text strong style={{ color: '#1890ff', fontSize: 16 }}>
            🎯 当前选中：title
          </Text>
        </div>

        {/* 标题设置 */}
        <div style={STYLES.sectionCard}>
          <div style={STYLES.sectionTitle}>📝 内容设置</div>
          <Form form={form} layout="vertical">
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
                onChange={(e) =>
                  updateTitleComponent('subtitle', e.target.value)
                }
                placeholder="请输入副标题"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Form>
        </div>

        {/* 样式设置 */}
        <div style={STYLES.sectionCard}>
          <div style={STYLES.sectionTitle}>🎨 样式设置</div>
          <Form form={form} layout="vertical">
            <Form.Item label="主题颜色">
              <Select
                value={titleInfo.style}
                onChange={(value) => updateTitleComponent('style', value)}
                style={{ width: '100%' }}
              >
                {themeColorOptions}
              </Select>
            </Form.Item>
          </Form>
        </div>
      </div>
    ),
    [
      titleInfo,
      themeColorOptions,
      updateTitleComponent,
      selectedComponent.id,
      form,
    ],
  );

  return (
    <div style={STYLES.container}>
      {/* 标题组件编辑界面的变量添加模态框 */}
      <AddVariableModal
        visible={isVariableModalVisible}
        onOk={handleVariableModalOk || (() => {})}
        onCancel={handleVariableModalCancel || (() => {})}
        editingVariable={editingVariable}
        componentType={modalComponentType}
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

export default TitleComponent;
