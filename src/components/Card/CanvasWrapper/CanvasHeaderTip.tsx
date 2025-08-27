// 画布顶部提示
import { Typography } from 'antd';
import React from 'react';

const { Text } = Typography;

// 画布标题组件
export const CanvasHeader: React.FC<{
  elementsCount: number;
}> = ({ elementsCount }) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: '0',
        left: '0',
        right: '0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 8px',
      }}
    >
      <Text type="secondary" style={{ fontSize: '12px' }}>
        设计画布
      </Text>
      <Text type="secondary" style={{ fontSize: '12px' }}>
        组件数量: {elementsCount}
      </Text>
    </div>
  );
};
