// 画布上的子组件(设备提示、组件数量)

import { Typography } from 'antd';
import React from 'react';
import { DEVICE_SIZES } from './card-designer-constants';

const { Text } = Typography;

// 设备提示组件
export const DeviceIndicator: React.FC<{
  device: keyof typeof DEVICE_SIZES;
  canvasWidth: string;
}> = ({ device, canvasWidth }) => {
  const deviceConfig = DEVICE_SIZES[device];

  return (
    <div
      style={{
        position: 'absolute',
        top: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: '#fff',
        padding: '4px 12px',
        borderRadius: '16px',
        fontSize: '12px',
        color: '#666',
        border: '1px solid #d9d9d9',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        zIndex: 100,
      }}
    >
      <span style={{ marginRight: '4px' }}>
        <deviceConfig.icon />
      </span>
      {deviceConfig.name}
      {canvasWidth !== '100%' && ` (${canvasWidth})`}
    </div>
  );
};

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
