import {
  CaretDownOutlined,
  CaretRightOutlined,
  CompressOutlined,
  CopyOutlined,
  ExpandOutlined,
} from '@ant-design/icons';
import { Button, Card, message, Space, Tooltip, Typography } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import style from './index.less';
import type { JSONEditorProps, JSONError, LineData } from './type';
const { Text } = Typography;

const JSONEditor: React.FC<JSONEditorProps> = ({
  json: initialJSON,
  title = 'JSON 编辑器',
  height = '400px',
  className,
  onJSONChange,
  onSave,
  readOnly = false,
  isVariableModalOpen = false, // 新增：变量弹窗是否打开
}) => {
  const [jsonText, setJsonText] = useState('');
  const [lines, setLines] = useState<LineData[]>([]);
  const [collapsedPaths, setCollapsedPaths] = useState<Set<string>>(new Set());
  // const [isDirty, setIsDirty] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [jsonErrors, setJsonErrors] = useState<JSONError[]>([]);
  const [isAllExpanded, setIsAllExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // 解析初始JSON
  const parsedJSON = useMemo(() => {
    if (typeof initialJSON === 'string') {
      try {
        return JSON.parse(initialJSON);
      } catch (error) {
        setParseError(error instanceof Error ? error.message : 'JSON解析错误');
        return null;
      }
    }
    return initialJSON;
  }, [initialJSON]);

  // JSON 校验函数
  const validateJSON = (
    text: string,
  ): { isValid: boolean; errors: JSONError[] } => {
    const errors: JSONError[] = [];
    setCollapsedPaths(new Set());
    setIsAllExpanded(false);

    try {
      JSON.parse(text);
      return { isValid: true, errors: [] };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'JSON格式错误';

      // 尝试解析错误位置
      if (error instanceof SyntaxError) {
        const match = errorMessage.match(/position (\d+)/);
        if (match) {
          const position = parseInt(match[1]);
          const lines = text.split('\n');
          let currentPos = 0;

          for (let lineNum = 0; lineNum < lines.length; lineNum++) {
            const lineLength = lines[lineNum].length + 1; // +1 for newline
            if (currentPos + lineLength > position) {
              const column = position - currentPos;
              errors.push({
                line: lineNum + 1,
                column,
                message: errorMessage,
              });
              break;
            }
            currentPos += lineLength;
          }
        }
      }

      // 如果没有找到具体位置，添加通用错误
      if (errors.length === 0) {
        errors.push({
          line: 1,
          column: 1,
          message: errorMessage,
        });
      }

      return { isValid: false, errors };
    }
  };

  // 格式化JSON并生成行数据
  const formatJSONWithLines = (
    obj: any,
  ): { text: string; lines: LineData[] } => {
    const lines: LineData[] = [];
    let lineNumber = 1;

    const formatValue = (value: any, indent: number, path: string): string => {
      if (value === null) return 'null';
      if (typeof value === 'string') return `"${value}"`;
      if (typeof value === 'number' || typeof value === 'boolean')
        return String(value);

      if (Array.isArray(value)) {
        if (value.length === 0) return '[]';

        const isCollapsed = collapsedPaths.has(path);
        if (isCollapsed) {
          lines.push({
            lineNumber,
            content: `[${value.length} items]`,
            indent,
            isCollapsible: true,
            isCollapsed: true,
            nodeType: 'array',
            path,
          });
          lineNumber++;
          return `[${value.length} items]`;
        }

        // 添加开始括号行
        lines.push({
          lineNumber,
          content: '[',
          indent,
          isCollapsible: true,
          isCollapsed: false,
          nodeType: 'array',
          path,
        });
        lineNumber++;

        const items = value.map((item, index) => {
          const itemPath = `${path}[${index}]`;
          const itemIndent = indent + 2;

          if (typeof item === 'object' && item !== null) {
            // 检查当前数组项是否被折叠
            const isItemCollapsed = collapsedPaths.has(itemPath);

            if (isItemCollapsed) {
              // 如果数组项被折叠，只添加一行
              const keys = Object.keys(item);
              lines.push({
                lineNumber,
                content: `{${keys.length} properties}`,
                indent: itemIndent,
                isCollapsible: true,
                isCollapsed: true,
                nodeType: 'object',
                path: itemPath,
                originalValue: item,
              });
              lineNumber++;
              return `{${keys.length} properties}`;
            } else {
              // 如果数组项展开，处理所有嵌套行
              const formattedValue = formatValue(item, itemIndent, itemPath);
              const nestedLines = formattedValue.split('\n');

              // 为嵌套对象的每一行都添加行号
              nestedLines.forEach((line, lineIndex) => {
                const actualIndent =
                  lineIndex === 0 ? itemIndent : itemIndent + 2;
                lines.push({
                  lineNumber,
                  content: line,
                  indent: actualIndent,
                  isCollapsible: false,
                  isCollapsed: false,
                  nodeType: 'value',
                  path:
                    lineIndex === 0
                      ? itemPath
                      : `${itemPath}_line_${lineIndex}`,
                  originalValue: lineIndex === 0 ? item : undefined,
                });
                lineNumber++;
              });

              return formattedValue;
            }
          } else {
            const content =
              typeof item === 'string' ? `"${item}"` : String(item);
            lines.push({
              lineNumber,
              content,
              indent: itemIndent,
              isCollapsible: false,
              isCollapsed: false,
              nodeType: 'value',
              path: itemPath,
              originalValue: item,
            });
            lineNumber++;
            return content;
          }
        });

        // 添加结束括号行，与开始括号对齐
        lines.push({
          lineNumber,
          content: ']',
          indent,
          isCollapsible: false,
          isCollapsed: false,
          nodeType: 'value',
          path: `${path}_end`,
        });
        lineNumber++;

        // 使用正确的缩进格式
        const indentSpaces = '  '.repeat(indent);
        const itemIndentSpaces = '  '.repeat(indent + 1);
        return `[\n${items
          .map((item) => `${itemIndentSpaces}${item}`)
          .join(',\n')}\n${indentSpaces}]`;
      }

      if (typeof value === 'object' && value !== null) {
        const keys = Object.keys(value);
        if (keys.length === 0) return '{}';

        const isCollapsed = collapsedPaths.has(path);
        if (isCollapsed) {
          lines.push({
            lineNumber,
            content: `{${keys.length} properties}`,
            indent,
            isCollapsible: true,
            isCollapsed: true,
            nodeType: 'object',
            path,
          });
          lineNumber++;
          return `{${keys.length} properties}`;
        }

        // 添加开始大括号行
        lines.push({
          lineNumber,
          content: '{',
          indent,
          isCollapsible: true,
          isCollapsed: false,
          nodeType: 'object',
          path,
        });
        lineNumber++;

        const properties = keys.map((key) => {
          const propPath = `${path}.${key}`;
          const propIndent = indent + 2;
          const propValue = value[key];

          if (typeof propValue === 'object' && propValue !== null) {
            // 检查当前属性值是否被折叠
            const isPropCollapsed = collapsedPaths.has(propPath);

            if (isPropCollapsed) {
              // 如果属性值被折叠，只添加一行
              const propKeys = Object.keys(propValue);
              lines.push({
                lineNumber,
                content: `"${key}": {${propKeys.length} properties}`,
                indent: propIndent,
                isCollapsible: true,
                isCollapsed: true,
                nodeType: 'property',
                path: propPath,
                originalValue: propValue,
              });
              lineNumber++;
              return `"${key}": {${propKeys.length} properties}`;
            } else {
              // 如果属性值展开，处理所有嵌套行
              const formattedValue = formatValue(
                propValue,
                propIndent,
                propPath,
              );
              const nestedLines = formattedValue.split('\n');

              // 为嵌套对象的每一行都添加行号
              nestedLines.forEach((line, lineIndex) => {
                const content = lineIndex === 0 ? `"${key}": ${line}` : line;
                const actualIndent =
                  lineIndex === 0 ? propIndent : propIndent + 2;
                lines.push({
                  lineNumber,
                  content,
                  indent: actualIndent,
                  isCollapsible: false,
                  isCollapsed: false,
                  nodeType: 'property',
                  path:
                    lineIndex === 0
                      ? propPath
                      : `${propPath}_line_${lineIndex}`,
                  originalValue: lineIndex === 0 ? propValue : undefined,
                });
                lineNumber++;
              });

              return `"${key}": ${formattedValue}`;
            }
          } else {
            const content =
              typeof propValue === 'string'
                ? `"${propValue}"`
                : String(propValue);
            lines.push({
              lineNumber,
              content: `"${key}": ${content}`,
              indent: propIndent,
              isCollapsible: false,
              isCollapsed: false,
              nodeType: 'property',
              path: propPath,
              originalValue: propValue,
            });
            lineNumber++;
            return `"${key}": ${content}`;
          }
        });

        // 添加结束大括号行，与开始大括号对齐
        lines.push({
          lineNumber,
          content: '}',
          indent,
          isCollapsible: false,
          isCollapsed: false,
          nodeType: 'value',
          path: `${path}_end`,
        });
        lineNumber++;

        // 使用正确的缩进格式
        const indentSpaces = '  '.repeat(indent);
        const propIndentSpaces = '  '.repeat(indent + 1);
        return `{\n${properties
          .map((prop) => `${propIndentSpaces}${prop}`)
          .join(',\n')}\n${indentSpaces}}`;
      }

      return String(value);
    };

    const text = formatValue(obj, 0, 'root');
    return { text, lines };
  };

  // 处理文本变化
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setJsonText(newText);
    // setIsDirty(true);

    // 实时校验JSON
    const { isValid, errors } = validateJSON(newText);
    if (!isValid) {
      setParseError(errors[0]?.message || 'JSON格式错误');
      setJsonErrors(errors);
    } else {
      setParseError(null);
      setJsonErrors([]);
    }
  };

  // 处理折叠/展开
  const handleToggleCollapse = (path: string) => {
    const newCollapsedPaths = new Set(collapsedPaths);
    if (newCollapsedPaths.has(path)) {
      newCollapsedPaths.delete(path);
    } else {
      newCollapsedPaths.add(path);
    }
    setCollapsedPaths(newCollapsedPaths);
  };

  // 展开/折叠所有
  const handleToggleAll = () => {
    if (isAllExpanded) {
      setCollapsedPaths(new Set());
      setIsAllExpanded(false);
    } else {
      const allPaths = new Set<string>();
      lines.forEach((line) => {
        if (line.isCollapsible) {
          allPaths.add(line.path);
        }
      });
      setCollapsedPaths(allPaths);
      setIsAllExpanded(true);
    }
  };

  // 保存JSON
  const handleSave = () => {
    const { isValid } = validateJSON(jsonText);
    if (isValid) {
      if (onSave) {
        onSave(jsonText);
      }
      // setIsDirty(false);
      message.success('JSON已保存');
    } else {
      message.error('JSON格式错误，无法保存');
    }
  };

  // 复制JSON
  const handleCopy = async () => {
    try {
      setCollapsedPaths(new Set());
      setIsAllExpanded(false);

      try {
        // 重新格式化JSON以获取完整的展开文本
        const { isValid } = validateJSON(jsonText);
        if (isValid) {
          const parsed = JSON.parse(jsonText);
          const { text } = formatJSONWithLines(parsed);
          await navigator.clipboard.writeText(text);
          message.success('JSON已复制到剪贴板');
        } else {
          // 如果JSON无效，直接复制当前文本
          await navigator.clipboard.writeText(jsonText);
          message.success('JSON已复制到剪贴板');
        }
      } catch (err) {
        message.error('复制失败');
      }
    } catch (err) {
      message.error('复制失败');
    }
  };

  // 同步滚动
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  // 处理键盘快捷键
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // 处理Tab键 - 在textarea中插入2个空格而不是切换焦点
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;

      // 插入2个空格
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      textarea.value = newValue;

      // 设置光标位置到插入的空格后面
      textarea.selectionStart = textarea.selectionEnd = start + 2;

      // 触发change事件
      const event = new Event('input', { bubbles: true });
      textarea.dispatchEvent(event);
    }

    // 处理撤回快捷键 (Ctrl+Z 或 Cmd+Z)
    if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
      // 如果变量弹窗打开，阻止事件冒泡，让textarea自己处理撤回
      if (isVariableModalOpen) {
        e.stopPropagation();
        return;
      }
      // 如果变量弹窗关闭，不阻止默认行为，让textarea自己处理撤回
      return;
    }

    // 处理保存快捷键
    if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  // 格式化JSON
  const handleFormat = () => {
    const { isValid, errors } = validateJSON(jsonText);

    if (!isValid) {
      setParseError(errors[0]?.message || 'JSON格式错误');
      setJsonErrors(errors);
      message.error('JSON格式错误，无法格式化');
      return;
    }

    try {
      const parsed = JSON.parse(jsonText);
      const { text, lines } = formatJSONWithLines(parsed);
      setJsonText(text);
      setLines(lines);
      setParseError(null);
      setJsonErrors([]);
      // setIsDirty(false);

      if (onJSONChange) {
        onJSONChange(text);
      }
    } catch (error) {
      setParseError(error instanceof Error ? error.message : 'JSON格式错误');
    }
  };

  // 检查行是否有错误
  const hasErrorOnLine = (lineNumber: number): boolean => {
    return jsonErrors.some((error) => error.line === lineNumber);
  };

  // 初始化JSON文本和行数据
  useEffect(() => {
    if (parsedJSON) {
      const { text, lines } = formatJSONWithLines(parsedJSON);
      setJsonText(text);
      setLines(lines);
      setParseError(null);
      setJsonErrors([]);
    }
  }, [parsedJSON, collapsedPaths]);

  return (
    <Card
      title={
        <Space>
          <Text strong>{title}</Text>
        </Space>
      }
      size="small"
      className={`${style.jsonText} ${className}`}
      style={{
        height,
      }}
      extra={
        <Space>
          <Tooltip title="JSON格式化">
            <span
              style={{ cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}
              onClick={handleFormat}
            >
              JSON
            </span>
          </Tooltip>
          <Tooltip title={isAllExpanded ? '折叠所有' : '展开所有'}>
            <Button
              type="text"
              size="small"
              icon={isAllExpanded ? <CompressOutlined /> : <ExpandOutlined />}
              onClick={handleToggleAll}
            />
          </Tooltip>
          <Tooltip title="复制JSON">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={handleCopy}
            />
          </Tooltip>
        </Space>
      }
    >
      <div className={style.jsonTextContainer}>
        {/* 左侧行号和折叠箭头 */}
        <div ref={lineNumbersRef} className={style.jsonSerialMumber}>
          {lines.map((line, index) => (
            <div
              key={index}
              className={style.collapsibleIcon}
              style={{
                cursor: line.isCollapsible ? 'pointer' : 'default',
              }}
              onClick={() =>
                line.isCollapsible && handleToggleCollapse(line.path)
              }
            >
              <span style={{ fontSize: '11px' }}>{line.lineNumber}</span>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '2px' }}
              >
                {hasErrorOnLine(line.lineNumber) && (
                  <div
                    className={style.errorDot}
                    title={
                      jsonErrors.find((e) => e.line === line.lineNumber)
                        ?.message
                    }
                  />
                )}
                {line.isCollapsible && (
                  <span style={{ fontSize: '10px', color: '#0d6efd' }}>
                    {line.isCollapsed ? (
                      <CaretRightOutlined />
                    ) : (
                      <CaretDownOutlined />
                    )}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 右侧编辑区域 */}
        <div className={style.jsonEditorArea}>
          <textarea
            ref={textareaRef}
            value={jsonText}
            onChange={handleTextChange}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            disabled={readOnly}
            className={style.textarea}
            style={{
              color: parseError ? '#dc3545' : '#212529',
            }}
            placeholder="输入JSON数据..."
          />

          {/* 错误提示 */}
          {/* {parseError && (
            <div
              style={{
                position: 'absolute',
                bottom: '-55px',
                left: '-30px',
                backgroundColor: '#f8d7da',
                color: '#721c24',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '8px',
                border: '1px solid #f5c6cb',
                width: '80%',
                wordBreak: 'break-word',
              }}
            >
              {parseError}
            </div>
          )} */}
        </div>
      </div>
    </Card>
  );
};

export default JSONEditor;
