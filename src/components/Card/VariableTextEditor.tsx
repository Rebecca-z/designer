import { Input } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import VariableSelector from './VariableSelector';
import { VariableItem } from './card-designer-types-updated';

const { TextArea } = Input;

export interface VariableTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  variables: VariableItem[];
  onAddVariable: () => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
}

const VariableTextEditor: React.FC<VariableTextEditorProps> = ({
  value,
  onChange,
  variables,
  onAddVariable,
  placeholder = '请输入文本内容',
  rows = 4,
  disabled = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const textAreaRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 处理变量选择
  const handleVariableSelect = (variableName: string) => {
    const textArea = textAreaRef.current?.resizableTextArea?.textArea;
    if (textArea) {
      const start = textArea.selectionStart;
      const end = textArea.selectionEnd;
      const currentValue = editValue;

      // 在光标位置插入变量占位符
      const newValue =
        currentValue.substring(0, start) +
        `{{${variableName}}}` +
        currentValue.substring(end);

      setEditValue(newValue);
      onChange(newValue);

      // 设置光标位置到变量占位符后面
      setTimeout(() => {
        const newCursorPos = start + `{{${variableName}}}`.length;
        textArea.setSelectionRange(newCursorPos, newCursorPos);
        textArea.focus();
      }, 0);
    }
  };

  // 处理文本变化
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setEditValue(newValue);
    onChange(newValue);
  };

  // 处理鼠标进入
  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  // 处理鼠标离开
  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  // 同步外部值变化
  useEffect(() => {
    setEditValue(value);
  }, [value]);

  // 渲染变量按钮（只在hover时显示）
  const renderVariableButton = () => {
    if (!isHovered) return null;

    return (
      <div
        style={{
          position: 'absolute',
          bottom: '8px',
          right: '8px',
          zIndex: 10,
        }}
      >
        <VariableSelector
          variables={variables}
          onSelectVariable={handleVariableSelect}
          onAddVariable={onAddVariable}
          disabled={disabled}
        />
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <TextArea
        ref={textAreaRef}
        value={editValue}
        onChange={handleTextChange}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        style={{
          resize: 'vertical',
          paddingBottom: isHovered ? '40px' : '8px', // 为变量按钮留出空间
        }}
      />
      {renderVariableButton()}
    </div>
  );
};

export default VariableTextEditor;
