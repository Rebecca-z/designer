// src/components/PreviewModal.tsx
import { Button, Modal } from 'antd';
import React from 'react';
import type { CanvasNode } from '../../types';

type PreviewModalProps = {
  visible: boolean;
  onClose: () => void;
  data: CanvasNode[];
};

const renderNode = (node: CanvasNode): React.ReactNode => {
  switch (node.type) {
    case 'text':
      return (
        <span
          style={{ color: node.props.color, fontSize: node.props.fontSize }}
        >
          {node.props.text || '普通文本'}
        </span>
      );
    case 'button':
      return (
        <Button
          style={{
            color: node.props.color,
            background: node.props.background,
            margin: 4,
          }}
          disabled={node.props.disabled}
        >
          {node.props.text || '按钮'}
        </Button>
      );
    case 'input':
      return (
        <input
          placeholder={node.props.placeholder}
          disabled={node.props.disabled}
          style={{ margin: 4 }}
        />
      );
    case 'layout-2':
      return (
        <div style={{ display: 'flex', gap: 8, margin: 4 }}>
          {node.children?.map((child) => (
            <div key={child.id} style={{ flex: 1 }}>
              {renderNode(child)}
            </div>
          ))}
        </div>
      );
    // 你可以继续扩展其他组件和布局类型
    default:
      return <span>{node.type}</span>;
  }
};

const PreviewModal: React.FC<PreviewModalProps> = ({
  visible,
  onClose,
  data,
}) => (
  <Modal
    title="预览"
    open={visible}
    onCancel={onClose}
    footer={null}
    width={900}
    style={{ background: '#f5f5f5' }}
  >
    <div style={{ minHeight: 400, padding: 24, background: '#fff' }}>
      {data.length === 0 ? (
        <div style={{ color: '#bbb', textAlign: 'center', marginTop: 100 }}>
          暂无内容
        </div>
      ) : (
        data.map((node) => (
          <div key={node.id} style={{ marginBottom: 12 }}>
            {renderNode(node)}
          </div>
        ))
      )}
    </div>
  </Modal>
);

export default PreviewModal;
