// PropertyPanel - 可复用的属性面板组件（集成VariablesPanel）
import { BgColorsOutlined, SettingOutlined } from '@ant-design/icons';
import { Tabs } from 'antd';
import React from 'react';
import AddVariableModal from '../../../Variable/AddVariableModal';
import VariablesPanel from './VariablesPanel';

// 样式常量
const STYLES = {
  container: {
    width: '300px',
    height: 'calc(100vh - 60px)',
    backgroundColor: '#f8f9fa',
    borderLeft: '1px solid #e9ecef',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  tabBarStyle: {
    padding: '0 16px',
    backgroundColor: '#fff',
    margin: 0,
    borderBottom: '1px solid #d9d9d9',
  },
} as const;

// 属性面板Props接口
export interface PropertyPanelProps {
  // Tab相关
  activeTab: string;
  onTabChange: (key: string) => void;

  // 组件属性内容（slot）
  componentContent: React.ReactNode;

  // 事件内容（slot，可选）
  eventContent?: React.ReactNode;

  // 变量管理组件（从外部传入）
  variableManagementComponent: React.ReactNode;

  // 变量模态框相关props
  isVariableModalVisible?: boolean;
  handleVariableModalOk?: (variable: any) => void;
  handleVariableModalCancel?: () => void;
  editingVariable?: any;
  isVariableModalFromVariablesTab?: boolean;
  modalComponentType?: string;
  selectedComponentTag?: string;

  // 自定义Tab配置（可选）
  customTabs?: Array<{
    key: string;
    label: React.ReactNode;
    children: React.ReactNode;
  }>;

  // 是否显示事件Tab
  showEventTab?: boolean;
}

const PropertyPanel: React.FC<PropertyPanelProps> = ({
  activeTab,
  onTabChange,
  componentContent,
  eventContent,
  variableManagementComponent,
  isVariableModalVisible,
  handleVariableModalOk,
  handleVariableModalCancel,
  editingVariable,
  isVariableModalFromVariablesTab,
  modalComponentType,
  selectedComponentTag,
  customTabs,
  showEventTab = false,
}) => {
  // 构建默认Tabs
  const defaultTabs = [
    {
      key: 'component',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <SettingOutlined />
          组件属性
        </span>
      ),
      children: componentContent,
    },
  ];

  // 如果显示事件Tab，添加事件Tab
  if (showEventTab && eventContent) {
    defaultTabs.push({
      key: 'events',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          ⚡ 事件
        </span>
      ),
      children: eventContent,
    });
  }

  // 添加变量Tab - 使用内置的VariablesPanel（不传递模态框props，因为在顶层统一管理）
  defaultTabs.push({
    key: 'variables',
    label: (
      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <BgColorsOutlined />
        变量
      </span>
    ),
    children: (
      <VariablesPanel
        variableManagementComponent={variableManagementComponent}
      />
    ),
  });

  // 合并自定义Tabs
  const allTabs = customTabs ? [...defaultTabs, ...customTabs] : defaultTabs;

  console.log('🔍 PropertyPanel 模态框状态:', {
    isVariableModalVisible,
    hasHandleVariableModalOk: !!handleVariableModalOk,
    hasHandleVariableModalCancel: !!handleVariableModalCancel,
    modalComponentType,
    selectedComponentTag,
    isVariableModalFromVariablesTab,
    editingVariable,
    activeTab,
    timestamp: new Date().toISOString(),
  });

  return (
    <>
      <div style={STYLES.container}>
        <Tabs
          activeKey={activeTab}
          onChange={onTabChange}
          style={{ height: '100%' }}
          tabBarStyle={STYLES.tabBarStyle}
          size="small"
          items={allTabs}
        />
      </div>

      {/* 统一的变量模态框 - 在PropertyPanel顶层渲染，无论在哪个Tab都可以弹出 */}
      {isVariableModalVisible &&
        handleVariableModalOk &&
        handleVariableModalCancel && (
          <AddVariableModal
            visible={isVariableModalVisible}
            onOk={handleVariableModalOk}
            onCancel={handleVariableModalCancel}
            editingVariable={editingVariable}
            componentType={
              isVariableModalFromVariablesTab
                ? undefined
                : modalComponentType || selectedComponentTag
            }
          />
        )}
    </>
  );
};

export default PropertyPanel;
