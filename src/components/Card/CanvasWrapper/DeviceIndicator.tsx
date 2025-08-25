import React from 'react';
import { DEVICE_SIZES } from '../constants';
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
