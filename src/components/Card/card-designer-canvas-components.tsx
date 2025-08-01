// card-designer-canvas-components.tsx - 画布子组件

import { AppstoreOutlined } from '@ant-design/icons';
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
        top: '-35px',
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

// 拖拽提示组件
export const DragOverlay: React.FC<{
  isOver: boolean;
  canDrop: boolean;
}> = ({ isOver, canDrop }) => {
  if (!isOver || !canDrop) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(24, 144, 255, 0.1)',
        border: '2px dashed #1890ff',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          color: '#1890ff',
          fontSize: '16px',
          fontWeight: 'bold',
        }}
      >
        <AppstoreOutlined style={{ fontSize: '32px', marginBottom: '8px' }} />
        <div>释放以添加组件到画布</div>
      </div>
    </div>
  );
};

// 空状态组件
export const EmptyState: React.FC<{
  show: boolean;
}> = ({ show }) => {
  if (!show) return null;

  return (
    <div
      style={{
        textAlign: 'center',
        color: '#999',
        padding: '80px 0',
        border: '2px dashed #d9d9d9',
        borderRadius: '8px',
        backgroundColor: '#fafafa',
      }}
    >
      <AppstoreOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
      <div style={{ fontSize: '16px', marginBottom: '8px' }}>
        拖拽组件到这里开始设计
      </div>
      <div style={{ fontSize: '12px' }}>从左侧面板拖拽组件到画布中</div>
    </div>
  );
};

// 画布网格背景组件
export const CanvasGrid: React.FC = () => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px',
        pointerEvents: 'none',
        opacity: 0.3,
        zIndex: -1,
      }}
    />
  );
};
