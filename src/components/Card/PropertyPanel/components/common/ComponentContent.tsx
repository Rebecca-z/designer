// ComponentContent - 组件属性内容容器
import { Typography } from 'antd';
import React from 'react';

const { Text } = Typography;

// 样式常量
const STYLES = {
  container: {
    padding: '16px',
    height: 'calc(100vh - 120px)',
    overflow: 'auto',
    backgroundColor: '#f8f9fa',
  },
  infoBox: {
    padding: '8px 12px',
    backgroundColor: '#e6f7ff',
    border: '1px solid #91d5ff',
    borderRadius: '4px',
    marginBottom: '16px',
    textAlign: 'center' as const,
  },
  contentPadding: {
    padding: '0 4px',
  },
} as const;

// 组件内容Props接口
export interface ComponentContentProps {
  // 组件名称（用于显示标题）
  componentName: string;

  // 组件内容（slot）
  children: React.ReactNode;

  // 自定义样式
  style?: React.CSSProperties;

  // 是否显示信息框
  showInfoBox?: boolean;
}

const ComponentContent: React.FC<ComponentContentProps> = ({
  componentName,
  children,
  style,
  showInfoBox = true,
}) => {
  return (
    <div style={{ ...STYLES.container, ...style }}>
      {showInfoBox && (
        <div style={STYLES.infoBox}>
          <Text style={{ fontSize: '12px', color: '#0369a1' }}>
            🎯 当前选中：{componentName}
          </Text>
        </div>
      )}

      <div style={STYLES.contentPadding}>{children}</div>
    </div>
  );
};

export default ComponentContent;
