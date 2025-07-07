import { Button } from 'antd';
import React, { useState } from 'react';
import Canvas from './Canvas';
import DeviceSelector from './DeviceSelector';
import PreviewModal from './PreviewModal';
import PropertyPanel from './PropertyPanel';
import Sidebar from './Sidebar';

const SIDEBAR_WIDTH = 240;
const PROPERTY_PANEL_WIDTH = 320;

// 递归转换画布data为飞书互动卡片elements结构
function toCardElements(data: any[]): any[] {
  return data.map((node: any) => {
    switch (node.type) {
      case 'form-container':
        return {
          tag: 'form',
          name: node.props.name || `Form_${node.id}`,
          elements: node.children ? toCardElements(node.children) : [],
        };
      case 'layout-columns':
        return {
          tag: 'column_set',
          name: node.props.name || `ColumnSet_${node.id}`,
          elements: node.children ? toCardElements(node.children) : [],
        };
      case 'text':
        return {
          tag: 'plain_text',
          name: node.props.name || `Text_${node.id}`,
          text: node.props.text || '',
        };
      case 'richtext':
        return {
          tag: 'rich_text',
          name: node.props.name || `RichText_${node.id}`,
          text: node.props.text || '',
        };
      case 'divider':
        return {
          tag: 'hr',
          name: node.props.name || `Divider_${node.id}`,
        };
      case 'image':
        return {
          tag: 'img',
          name: node.props.name || `Img_${node.id}`,
          src: node.props.src || '',
        };
      case 'image-mix':
        return {
          tag: 'img_combination',
          name: node.props.name || `ImgMix_${node.id}`,
          images: node.props.images || [],
        };
      case 'input':
        return {
          tag: 'input',
          name: node.props.name || `Input_${node.id}`,
          required: !!node.props.required,
        };
      case 'button':
        return {
          tag: 'button',
          name: node.props.name || `Button_${node.id}`,
          type: node.props.type || 'primary',
          form_action_type: node.props.form_action_type || 'submit',
        };
      case 'select-single':
        return {
          tag: 'select_static',
          name: node.props.name || `Select_${node.id}`,
          options: node.props.options || [],
        };
      case 'select-multi':
        return {
          tag: 'multi_select_static',
          name: node.props.name || `MultiSelect_${node.id}`,
          options: node.props.options || [],
        };
      default:
        return { tag: node.type, name: node.props.name || node.id };
    }
  });
}

type CodeModalProps = { visible: boolean; onClose: () => void; data: any };
const CodeModal = ({ visible, onClose, data }: CodeModalProps) => (
  <div>
    <PreviewModal visible={visible} onClose={onClose} data={[]} />
    {/* 只用Antd Modal样式，内容为JSON */}
    {visible && (
      <div
        style={{
          position: 'fixed',
          top: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 2000,
          width: 900,
          background: '#fff',
          borderRadius: 8,
          boxShadow: '0 8px 24px #0001',
          padding: 24,
        }}
      >
        <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 16 }}>
          出码
        </div>
        <pre
          style={{
            maxHeight: 500,
            overflow: 'auto',
            background: '#f6f6f6',
            padding: 16,
            borderRadius: 4,
          }}
        >
          {JSON.stringify(data, null, 2)}
        </pre>
        <div style={{ textAlign: 'right' }}>
          <Button onClick={onClose}>关闭</Button>
        </div>
      </div>
    )}
  </div>
);

const Designer: React.FC = () => {
  const [selected, setSelected] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [device, setDevice] = useState<'web' | 'phone' | 'pad'>('web');
  // 画布数据结构
  const [canvasData, setCanvasData] = useState<any[]>([]);

  // 卡片结构
  const cardData = {
    name: '空白卡片',
    dsl: {
      body: {
        direction: 'vertical',
        vertical_spacing: 5,
        elements: toCardElements(canvasData),
      },
    },
    variables: [],
  };

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
        <Button onClick={() => setShowCode(true)} style={{ marginLeft: 8 }}>
          出码
        </Button>
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
      <CodeModal
        visible={showCode}
        onClose={() => setShowCode(false)}
        data={cardData}
      />
    </div>
  );
};

export default Designer;
