import { Button } from 'antd';
import React, { useState } from 'react';
import Canvas from './Canvas';
import DeviceSelector from './DeviceSelector';
import PreviewModal from './PreviewModal';
import PropertyPanel from './PropertyPanel';
import Sidebar from './Sidebar';

const SIDEBAR_WIDTH = 240;
const PROPERTY_PANEL_WIDTH = 320;

const Designer: React.FC = () => {
  const [selected, setSelected] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  // const [showCode, setShowCode] = useState(false);
  const [device, setDevice] = useState<'web' | 'phone' | 'pad'>('web');
  // 画布数据结构
  const [canvasData, setCanvasData] = useState<any[]>([]);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: 8,
          padding: '8px 16px',
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <Button onClick={() => setShowPreview(true)}>预览</Button>
        {/* <Button onClick={() => setShowCode(true)} style={{ marginLeft: 8 }}>
          出码
        </Button> */}
        <DeviceSelector
          value={device}
          onChange={setDevice}
          style={{ marginLeft: 8 }}
        />
      </div>
      <div
        style={{
          flex: 1,
          display: 'flex',
          minHeight: 0,
          background: '#f5f6fa',
        }}
      >
        {/* 左侧面板 */}
        <div
          style={{
            width: SIDEBAR_WIDTH,
            background: '#fff',
            borderRight: '1px solid #f0f0f0',
            height: '100%',
            overflow: 'auto',
          }}
        >
          <Sidebar />
        </div>
        {/* 中间画布自适应 */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            padding: '24px 0',
            overflow: 'auto',
          }}
        >
          <Canvas
            data={canvasData}
            setData={setCanvasData}
            selected={selected}
            setSelected={setSelected}
            device={device}
          />
        </div>
        {/* 右侧属性面板 */}
        <div
          style={{
            width: PROPERTY_PANEL_WIDTH,
            background: '#fff',
            borderLeft: '1px solid #f0f0f0',
            height: '100%',
            overflow: 'auto',
          }}
        >
          <PropertyPanel
            selected={selected}
            data={canvasData}
            setData={setCanvasData}
          />
        </div>
      </div>
      <PreviewModal
        visible={showPreview}
        onClose={() => setShowPreview(false)}
        data={canvasData}
      />
      {/* 出码弹窗可仿照PreviewModal实现 */}
    </div>
  );
};

export default Designer;
