// VariablesPanel - 可复用的变量管理面板
import React from 'react';

// 样式常量
const STYLES = {
  container: {
    padding: '16px',
    height: 'calc(100vh - 120px)',
    overflow: 'auto',
    backgroundColor: '#f8f9fa',
  },
} as const;

// 变量面板Props接口
export interface VariablesPanelProps {
  // 变量管理组件（从外部传入）
  variableManagementComponent: React.ReactNode;

  // 自定义样式
  style?: React.CSSProperties;
}

const VariablesPanel: React.FC<VariablesPanelProps> = ({
  variableManagementComponent,
  style,
}) => {
  return (
    <div style={{ ...STYLES.container, ...style }}>
      {variableManagementComponent}
    </div>
  );
};

export default VariablesPanel;
