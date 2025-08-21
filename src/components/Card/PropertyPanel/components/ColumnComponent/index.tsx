// ColumnComponent 编辑界面 - 列容器组件
import { BgColorsOutlined, SettingOutlined } from '@ant-design/icons';
import { Tabs, Typography } from 'antd';
import React from 'react';
import { BaseComponentProps } from '../types';

const { Text } = Typography;

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

const ColumnComponent: React.FC<BaseComponentProps> = ({
  topLevelTab,
  setTopLevelTab,
  VariableManagementPanel,
}) => {
  const propertiesTabContent = (
    <div>
      <Text strong style={{ color: '#1890ff', fontSize: 16 }}>
        🎯 当前选中：column
      </Text>
    </div>
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

export default ColumnComponent;
