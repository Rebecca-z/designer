import { Input } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import VariableSelector from './VariableSelector';
import { VariableItem } from './card-designer-types-updated';

const { TextArea } = Input;

export interface VariableTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  variables: VariableItem[];
  onAddVariable: () => void;
  onEditVariable?: (variableName: string) => void; // 新增：编辑变量的回调
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
}

interface VariableInfo {
  name: string;
  value: string;
  startIndex: number;
  endIndex: number;
}

const VariableTextEditor: React.FC<VariableTextEditorProps> = ({
  value,
  onChange,
  variables,
  onAddVariable,
  onEditVariable,
  placeholder = '请输入文本内容',
  rows = 4,
  disabled = false,
}) => {
  const [editValue, setEditValue] = useState(value);
  const [isEditing, setIsEditing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<any>(null);
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 查找变量值
  const findVariableValue = (variableName: string): string => {
    for (const variable of variables) {
      if (typeof variable === 'object' && variable !== null) {
        const keys = Object.keys(variable as Record<string, any>);
        if (keys.length > 0 && keys[0] === variableName) {
          return String((variable as Record<string, any>)[variableName]);
        }
      }
    }
    return `{{${variableName}}}`; // 如果找不到变量，返回占位符
  };

  // 解析文本中的变量占位符
  const parseVariables = (text: string): (string | VariableInfo)[] => {
    const result: (string | VariableInfo)[] = [];
    const regex = /\{\{([^}]+)\}\}/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const variableName = match[1];
      const startIndex = match.index;
      const endIndex = startIndex + match[0].length;

      // 添加变量前的文本
      if (startIndex > lastIndex) {
        result.push(text.slice(lastIndex, startIndex));
      }

      // 查找变量值
      const variableValue = findVariableValue(variableName);

      // 添加变量信息
      result.push({
        name: variableName,
        value: variableValue,
        startIndex,
        endIndex,
      });

      lastIndex = endIndex;
    }

    // 添加剩余的文本
    if (lastIndex < text.length) {
      result.push(text.slice(lastIndex));
    }

    return result;
  };

  // 处理变量选择 - 适配VariableSelector的接口
  const handleVariableSelect = useCallback(
    (variableName: string, variableValue?: string) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _ = variableValue; // 保持接口兼容性

      if (isEditing) {
        // 在编辑模式下，在光标位置插入变量占位符
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
      } else {
        // 在预览模式下，切换到编辑模式并插入变量
        setIsEditing(true);
        setTimeout(() => {
          const textArea = textAreaRef.current?.resizableTextArea?.textArea;
          if (textArea) {
            const currentValue = editValue;
            const newValue = currentValue + `{{${variableName}}}`;
            setEditValue(newValue);
            onChange(newValue);

            // 设置光标位置到末尾
            setTimeout(() => {
              textArea.setSelectionRange(newValue.length, newValue.length);
              textArea.focus();
            }, 0);
          }
        }, 0);
      }
    },
    [isEditing, editValue, onChange],
  );

  // 处理文本内容变化
  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setEditValue(newValue);
      onChange(newValue);
    },
    [onChange],
  );

  // 处理TextArea失焦
  const handleTextAreaBlur = useCallback(() => {
    // console.log('TextArea blur, switching to preview mode');

    // 延迟处理，避免与点击事件冲突
    blurTimeoutRef.current = setTimeout(() => {
      // console.log('Switching to preview mode due to blur');
      setIsEditing(false);
    }, 300);
  }, []);

  // 处理容器点击
  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    // console.log('Container clicked');

    // 如果点击的是容器本身（不是TextArea或变量按钮），则恢复到查看态
    if (e.target === containerRef.current) {
      // console.log('Switching to preview mode due to container click');
      setIsEditing(false);
    }
  }, []);

  // 同步外部值变化
  useEffect(() => {
    setEditValue(value);
  }, [value]);

  // 清理超时
  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  // 渲染变量按钮（只在编辑态显示）
  const renderVariableButton = () => {
    if (!isEditing) {
      return null; // 查看态不显示变量按钮
    }

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

  // 渲染预览模式（变量可点击编辑，点击其他地方进入编辑态）
  const renderPreview = () => {
    const parsedContent = parseVariables(editValue);

    return (
      <div
        style={{
          border: '1px solid #d9d9d9',
          borderRadius: '6px',
          padding: '8px 12px',
          minHeight: `${rows * 24}px`,
          backgroundColor: '#fafafa',
          cursor: 'pointer',
          lineHeight: '1.5',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
        onClick={(e) => {
          // 如果点击的是容器本身（不是变量），则进入编辑态
          if (e.target === e.currentTarget) {
            console.log(
              '🎯 Clicking outside variables, switching to editing mode',
            );
            setIsEditing(true);
          }
        }}
      >
        {parsedContent.map((item, index) => {
          if (typeof item === 'string') {
            return <span key={index}>{item}</span>;
          } else {
            // 变量显示为可点击的按钮样式
            return (
              <span
                key={index}
                style={{
                  color: '#1890ff',
                  fontWeight: 'bold',
                  backgroundColor: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  margin: '0 2px',
                  cursor: 'pointer',
                  display: 'inline-block',
                }}
                onClick={(e) => {
                  e.stopPropagation(); // 阻止冒泡到容器
                  console.log(
                    '🎯 Variable clicked, opening edit modal:',
                    item.name,
                  );
                  // 调用父组件的方法来打开变量编辑弹窗
                  if (onEditVariable) {
                    onEditVariable(item.name);
                  }
                }}
                title={`点击编辑变量: ${item.name}`}
              >
                {item.value}
              </span>
            );
          }
        })}
        {parsedContent.length === 0 && editValue === '' && (
          <span style={{ color: '#bfbfbf' }}>{placeholder}</span>
        )}
      </div>
    );
  };

  // 渲染编辑模式（TextArea）
  const renderTextArea = () => {
    return (
      <TextArea
        ref={textAreaRef}
        value={editValue}
        onChange={handleTextChange}
        onBlur={handleTextAreaBlur}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        style={{
          resize: 'vertical',
          paddingBottom: '40px', // 为变量按钮留出空间
        }}
      />
    );
  };

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative' }}
      onClick={handleContainerClick}
    >
      {isEditing ? renderTextArea() : renderPreview()}
      {renderVariableButton()}
    </div>
  );
};

export default VariableTextEditor;
