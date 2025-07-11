// card-designer-padding-editor.tsx - 内边距编辑器组件

import { InputNumber, Tooltip } from 'antd';
import React, { useState } from 'react';
import { CardPadding } from './card-designer-types-updated';

interface PaddingEditorProps {
  value: CardPadding;
  onChange: (padding: CardPadding) => void;
}

const PaddingEditor: React.FC<PaddingEditorProps> = ({ value, onChange }) => {
  const [hoveredSide, setHoveredSide] = useState<string | null>(null);

  const handleChange = (side: keyof CardPadding, newValue: number | null) => {
    if (newValue !== null) {
      onChange({
        ...value,
        [side]: newValue,
      });
    }
  };

  const boxStyle: React.CSSProperties = {
    position: 'relative',
    width: '120px',
    height: '80px',
    margin: '20px auto',
    backgroundColor: '#f0f0f0',
    border: '1px solid #d9d9d9',
    borderRadius: '4px',
  };

  const inputStyle: React.CSSProperties = {
    width: '40px',
    height: '24px',
    textAlign: 'center',
    fontSize: '11px',
  };

  const getTooltipContent = (side: string) => {
    const sideNames = {
      top: '上边距',
      right: '右边距',
      bottom: '下边距',
      left: '左边距',
    };
    return `${sideNames[side as keyof typeof sideNames]} (${
      value[side as keyof CardPadding]
    }px)`;
  };

  return (
    <div style={{ padding: '16px' }}>
      <div
        style={{
          textAlign: 'center',
          marginBottom: '12px',
          fontSize: '12px',
          color: '#666',
        }}
      >
        内边距设置 (像素)
      </div>

      <div style={boxStyle}>
        {/* 中心区域 */}
        <div
          style={{
            position: 'absolute',
            top: '24px',
            left: '24px',
            right: '24px',
            bottom: '24px',
            backgroundColor: '#fff',
            border: '1px dashed #d9d9d9',
            borderRadius: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            color: '#999',
          }}
        >
          内容区域
        </div>

        {/* 上边距 */}
        <Tooltip title={getTooltipContent('top')} placement="top">
          <div
            style={{
              position: 'absolute',
              top: '2px',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
            onMouseEnter={() => setHoveredSide('top')}
            onMouseLeave={() => setHoveredSide(null)}
          >
            <InputNumber
              style={{
                ...inputStyle,
                backgroundColor: hoveredSide === 'top' ? '#e6f7ff' : '#fff',
              }}
              value={value.top}
              onChange={(val) => handleChange('top', val)}
              min={0}
              max={100}
              size="small"
              controls={false}
            />
          </div>
        </Tooltip>

        {/* 右边距 */}
        <Tooltip title={getTooltipContent('right')} placement="right">
          <div
            style={{
              position: 'absolute',
              right: '2px',
              top: '50%',
              transform: 'translateY(-50%)',
            }}
            onMouseEnter={() => setHoveredSide('right')}
            onMouseLeave={() => setHoveredSide(null)}
          >
            <InputNumber
              style={{
                ...inputStyle,
                backgroundColor: hoveredSide === 'right' ? '#e6f7ff' : '#fff',
              }}
              value={value.right}
              onChange={(val) => handleChange('right', val)}
              min={0}
              max={100}
              size="small"
              controls={false}
            />
          </div>
        </Tooltip>

        {/* 下边距 */}
        <Tooltip title={getTooltipContent('bottom')} placement="bottom">
          <div
            style={{
              position: 'absolute',
              bottom: '2px',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
            onMouseEnter={() => setHoveredSide('bottom')}
            onMouseLeave={() => setHoveredSide(null)}
          >
            <InputNumber
              style={{
                ...inputStyle,
                backgroundColor: hoveredSide === 'bottom' ? '#e6f7ff' : '#fff',
              }}
              value={value.bottom}
              onChange={(val) => handleChange('bottom', val)}
              min={0}
              max={100}
              size="small"
              controls={false}
            />
          </div>
        </Tooltip>

        {/* 左边距 */}
        <Tooltip title={getTooltipContent('left')} placement="left">
          <div
            style={{
              position: 'absolute',
              left: '2px',
              top: '50%',
              transform: 'translateY(-50%)',
            }}
            onMouseEnter={() => setHoveredSide('left')}
            onMouseLeave={() => setHoveredSide(null)}
          >
            <InputNumber
              style={{
                ...inputStyle,
                backgroundColor: hoveredSide === 'left' ? '#e6f7ff' : '#fff',
              }}
              value={value.left}
              onChange={(val) => handleChange('left', val)}
              min={0}
              max={100}
              size="small"
              controls={false}
            />
          </div>
        </Tooltip>
      </div>

      {/* 快捷操作 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          marginTop: '12px',
        }}
      >
        <button
          type="button"
          style={{
            padding: '4px 8px',
            fontSize: '11px',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
            backgroundColor: '#fff',
            cursor: 'pointer',
          }}
          onClick={() => onChange({ top: 0, right: 0, bottom: 0, left: 0 })}
        >
          重置
        </button>

        <button
          type="button"
          style={{
            padding: '4px 8px',
            fontSize: '11px',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
            backgroundColor: '#fff',
            cursor: 'pointer',
          }}
          onClick={() => onChange({ top: 16, right: 16, bottom: 16, left: 16 })}
        >
          默认(16px)
        </button>
      </div>

      {/* 数值显示 */}
      <div
        style={{
          marginTop: '12px',
          fontSize: '11px',
          color: '#666',
          textAlign: 'center',
          backgroundColor: '#f8f9fa',
          padding: '8px',
          borderRadius: '4px',
          border: '1px solid #e8e8e8',
        }}
      >
        <div style={{ marginBottom: '4px' }}>
          <strong>当前设置：</strong>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '4px',
          }}
        >
          <span>上: {value.top}px</span>
          <span>右: {value.right}px</span>
          <span>下: {value.bottom}px</span>
          <span>左: {value.left}px</span>
        </div>
      </div>
    </div>
  );
};

export default PaddingEditor;
