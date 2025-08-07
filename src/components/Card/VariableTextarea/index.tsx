import { PlusOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { Button, Dropdown, Input, Tooltip } from 'antd';
import React, { useCallback, useRef, useState } from 'react';
import AddVariableModal from '../AddVariableModal';
import { Variable, VariableItem } from '../card-designer-types-updated';

const { TextArea } = Input;

export interface VariableTextareaProps {
  value: string;
  onChange: (value: string) => void;
  variables: VariableItem[];
  onAddVariable: (variable: VariableItem) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  style?: React.CSSProperties;
}

// 解析文本中的变量Tag（支持{{变量名}}和${变量名}两种格式）
const parseVariableTags = (text: string) => {
  const parts = [];
  let lastIndex = 0;

  // 合并两种格式的正则表达式
  const regex = /\{\{([^}]+)\}\}|\$\{([^}]+)\}/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // 添加变量前的文本
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex, match.index),
      });
    }

    // 确定变量名和完整匹配
    const variableName = match[1] || match[2]; // 第一个捕获组或第二个捕获组
    const fullMatch = match[0]; // 完整的匹配

    // 添加变量Tag
    parts.push({
      type: 'variable',
      content: variableName, // 变量名
      fullMatch: fullMatch, // 完整的变量占位符
    });

    lastIndex = match.index + fullMatch.length;
  }

  // 添加剩余的文本
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.slice(lastIndex),
    });
  }

  return parts;
};

// 变量Tag组件
const VariableTag: React.FC<{ variableName: string }> = ({ variableName }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      backgroundColor: '#e6f7ff',
      border: '1px solid #91d5ff',
      borderRadius: '4px',
      padding: '2px 6px',
      fontSize: '12px',
      color: '#1890ff',
      fontWeight: '500',
      margin: '0 2px',
      userSelect: 'none',
    }}
  >
    <ThunderboltOutlined style={{ fontSize: '10px' }} />
    {variableName}
  </span>
);

const VariableTextarea: React.FC<VariableTextareaProps> = ({
  value,
  onChange,
  variables,
  onAddVariable,
  placeholder = '请输入内容，输入"{"快速添加变量',
  rows = 4,
  disabled = false,
  style,
}) => {
  const [showAddVariableModal, setShowAddVariableModal] = useState(false);
  const [cursorPosition, setCursorPosition] = useState<{
    start: number;
    end: number;
  } | null>(null);
  const [showVariableDropdown, setShowVariableDropdown] = useState(false);
  const textareaRef = useRef<any>(null);

  // 处理文本变化
  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      const textarea = e.target;
      const cursorPos = textarea.selectionStart;

      // 检查是否输入了"{"字符
      if (newValue.length > value.length && newValue[cursorPos - 1] === '{') {
        setCursorPosition({
          start: cursorPos - 1,
          end: cursorPos,
        });
        setShowVariableDropdown(true);
      }

      onChange(newValue);
    },
    [value, onChange],
  );

  // 处理变量选择
  const handleVariableSelect = useCallback(
    (variableName: string) => {
      if (cursorPosition && textareaRef.current) {
        const textarea = textareaRef.current.resizableTextArea?.textArea;
        if (textarea) {
          const currentValue = value;
          const beforeCursor = currentValue.substring(0, cursorPosition.start);
          const afterCursor = currentValue.substring(cursorPosition.end);

          // 插入变量Tag（使用${变量名}格式）
          const newValue = beforeCursor + `\${${variableName}}` + afterCursor;
          onChange(newValue);

          // 设置光标位置到变量Tag后面
          const newCursorPos =
            cursorPosition.start + `\${${variableName}}`.length;
          setTimeout(() => {
            textarea.setSelectionRange(newCursorPos, newCursorPos);
            textarea.focus();
          }, 0);
        }
      }

      setCursorPosition(null);
      setShowVariableDropdown(false);
    },
    [cursorPosition, value, onChange],
  );

  // 处理添加变量
  const handleAddVariable = useCallback(() => {
    setShowAddVariableModal(true);
    setShowVariableDropdown(false);
  }, []);

  // 处理添加变量弹窗确认 - 与全局Tab变量逻辑保持一致
  const handleAddVariableConfirm = useCallback(
    (variable: Variable) => {
      console.log('🔄 VariableTextarea handleAddVariableConfirm 被调用:', {
        variable: variable,
        timestamp: new Date().toISOString(),
      });

      // 解析模拟数据值（与全局Tab变量相同的逻辑）
      let parsedValue: any;
      try {
        // 尝试解析JSON格式的数据
        if (
          variable.type === 'object' ||
          variable.value.startsWith('{') ||
          variable.value.startsWith('[')
        ) {
          parsedValue = JSON.parse(variable.value);
        } else {
          // 对于文本和数字类型，直接使用字符串值
          parsedValue = variable.value;
        }
      } catch (error) {
        // 如果解析失败，使用原始字符串值
        parsedValue = variable.value;
      }

      // 创建{变量名:模拟数据值}格式的对象，不包含type和description信息
      const variableObject = {
        [variable.name]: parsedValue,
      };

      console.log('📦 VariableTextarea 创建的变量对象:', variableObject);

      // 立即调用onAddVariable回调，传递处理后的变量对象
      onAddVariable(variableObject as any);

      // 关闭弹窗
      setShowAddVariableModal(false);

      // 在光标位置插入新添加的变量
      if (cursorPosition && textareaRef.current) {
        const textarea = textareaRef.current.resizableTextArea?.textArea;
        if (textarea) {
          const currentValue = value;
          const beforeCursor = currentValue.substring(0, cursorPosition.start);
          const afterCursor = currentValue.substring(cursorPosition.end);

          // 插入新变量Tag（使用${变量名}格式）
          const newValue = beforeCursor + `\${${variable.name}}` + afterCursor;
          onChange(newValue);

          // 设置光标位置到变量Tag后面
          const newCursorPos =
            cursorPosition.start + `\${${variable.name}}`.length;
          setTimeout(() => {
            textarea.setSelectionRange(newCursorPos, newCursorPos);
            textarea.focus();
          }, 0);
        }
      }

      setCursorPosition(null);

      console.log('✅ VariableTextarea handleAddVariableConfirm 完成');
    },
    [cursorPosition, value, onChange, onAddVariable],
  );

  // 处理添加变量弹窗取消
  const handleAddVariableCancel = useCallback(() => {
    setShowAddVariableModal(false);
    setCursorPosition(null);
  }, []);

  // 处理变量图标点击
  const handleVariableIconClick = useCallback(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current.resizableTextArea?.textArea;
      if (textarea) {
        const cursorPos = textarea.selectionStart;
        setCursorPosition({
          start: cursorPos,
          end: cursorPos,
        });
        setShowVariableDropdown(true);
      }
    }
  }, []);

  // 过滤出文本类型的变量
  const textVariables = variables.filter((variable) => {
    if (typeof variable === 'object' && variable !== null) {
      const keys = Object.keys(variable as Record<string, any>);
      if (keys.length > 0) {
        const variableValue = (variable as Record<string, any>)[keys[0]];
        return typeof variableValue === 'string';
      }
    }
    return false;
  });

  // 构建菜单项
  const menuItems = [
    // 文本变量列表
    ...textVariables.map((variable) => {
      const keys = Object.keys(variable as Record<string, any>);
      const variableName = keys[0];
      const variableValue = (variable as Record<string, any>)[
        variableName
      ] as string;

      return {
        key: variableName,
        label: (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '4px 0',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, fontSize: '14px' }}>
                {variableName}
              </div>
              <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                {variableValue}
              </div>
            </div>
            <ThunderboltOutlined
              style={{ color: '#1890ff', fontSize: '12px' }}
            />
          </div>
        ),
        onClick: () => handleVariableSelect(variableName),
      };
    }),
    // 分割线
    {
      type: 'divider' as const,
    },
    // 新建变量选项
    {
      key: 'add-variable',
      label: (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            color: '#1890ff',
            fontWeight: 500,
          }}
        >
          <PlusOutlined style={{ marginRight: '8px' }} />
          新建变量
        </div>
      ),
      onClick: handleAddVariable,
    },
  ];

  // 如果没有文本变量，只显示新建变量选项
  const finalMenuItems =
    textVariables.length === 0
      ? [
          {
            key: 'add-variable',
            label: (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  color: '#1890ff',
                  fontWeight: 500,
                }}
              >
                <PlusOutlined style={{ marginRight: '8px' }} />
                新建变量
              </div>
            ),
            onClick: handleAddVariable,
          },
        ]
      : menuItems;

  const menu = {
    items: finalMenuItems,
    style: {
      minWidth: '200px',
      maxWidth: '300px',
    },
  };

  // 解析文本内容，渲染变量Tag
  const renderTextWithVariableTags = () => {
    const parts = parseVariableTags(value);

    return (
      <div
        style={{
          position: 'relative',
          minHeight: `${rows * 24 + 32}px`,
          border: '1px solid #d9d9d9',
          borderRadius: '6px',
          padding: '8px 12px',
          backgroundColor: '#fff',
          cursor: 'text',
          fontSize: '14px',
          lineHeight: '1.5',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          ...style,
        }}
        onClick={() => {
          if (textareaRef.current) {
            textareaRef.current.resizableTextArea?.textArea?.focus();
          }
        }}
      >
        {parts.map((part, index) => {
          if (part.type === 'variable') {
            return <VariableTag key={index} variableName={part.content} />;
          }
          return <span key={index}>{part.content}</span>;
        })}

        {/* 隐藏的TextArea用于输入 */}
        <TextArea
          ref={textareaRef}
          value={value}
          onChange={handleTextChange}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: 0,
            zIndex: 1,
            resize: 'none',
            border: 'none',
            background: 'transparent',
            padding: '8px 12px',
            fontSize: '14px',
            lineHeight: '1.5',
          }}
        />
      </div>
    );
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* 渲染带样式的文本内容 */}
      {renderTextWithVariableTags()}

      {/* 右下角变量图标 */}
      <Tooltip title="可输入{快速添加" placement="top">
        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            right: '8px',
            cursor: 'pointer',
            zIndex: 10,
          }}
        >
          <Dropdown
            menu={menu}
            open={showVariableDropdown}
            onOpenChange={setShowVariableDropdown}
            disabled={disabled}
            placement="topRight"
            trigger={['click']}
          >
            <Button
              type="text"
              size="small"
              icon={<ThunderboltOutlined />}
              onClick={handleVariableIconClick}
              style={{
                padding: '2px 6px',
                height: '24px',
                fontSize: '12px',
                color: '#1890ff',
                border: '1px solid #d9d9d9',
                borderRadius: '4px',
                backgroundColor: '#fff',
              }}
            />
          </Dropdown>
        </div>
      </Tooltip>

      {/* 添加变量弹窗 */}
      <AddVariableModal
        visible={showAddVariableModal}
        onOk={handleAddVariableConfirm}
        onCancel={handleAddVariableCancel}
        initialType="text"
      />
    </div>
  );
};

export default VariableTextarea;
