import {
  CaretDownOutlined,
  CaretRightOutlined,
  CompressOutlined,
  CopyOutlined,
  ExpandOutlined,
} from '@ant-design/icons';
import { Button, Card, message, Space, Tooltip, Typography } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';

const { Text } = Typography;

export interface JSONEditorProps {
  json: string | object;
  title?: string;
  height?: string | number;
  className?: string;
  style?: React.CSSProperties;
  onJSONChange?: (newJSON: string) => void;
  onSave?: (json: string) => void;
  readOnly?: boolean;
}

interface LineData {
  lineNumber: number;
  content: string;
  indent: number;
  isCollapsible: boolean;
  isCollapsed: boolean;
  nodeType: 'object' | 'array' | 'property' | 'value';
  path: string;
  originalValue?: any;
}

interface JSONError {
  line: number;
  column: number;
  message: string;
}

const JSONEditor: React.FC<JSONEditorProps> = ({
  json: initialJSON,
  title = 'JSON 编辑器',
  height = '400px',
  className,
  style,
  onJSONChange,
  onSave,
  readOnly = false,
}) => {
  const [jsonText, setJsonText] = useState('');
  const [lines, setLines] = useState<LineData[]>([]);
  const [collapsedPaths, setCollapsedPaths] = useState<Set<string>>(new Set());
  const [isDirty, setIsDirty] = useState(false);
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
            const formattedValue = formatValue(item, itemIndent, itemPath);
            // 对于对象和数组，只添加第一行到行数据中
            const firstLine = formattedValue.split('\n')[0];
            lines.push({
              lineNumber,
              content: firstLine,
              indent: itemIndent,
              isCollapsible: false,
              isCollapsed: false,
              nodeType: 'value',
              path: itemPath,
              originalValue: item,
            });
            lineNumber++;
            // 处理嵌套的格式化，确保正确的缩进
            const nestedLines = formattedValue.split('\n');
            if (nestedLines.length > 1) {
              // 为嵌套内容添加额外的缩进
              return nestedLines
                .map((line, index) => {
                  if (index === 0) return line;
                  return '  ' + line;
                })
                .join('\n');
            }
            return formattedValue;
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
            const formattedValue = formatValue(propValue, propIndent, propPath);
            // 对于对象和数组，只添加第一行到行数据中
            const firstLine = formattedValue.split('\n')[0];
            lines.push({
              lineNumber,
              content: `"${key}": ${firstLine}`,
              indent: propIndent,
              isCollapsible: false,
              isCollapsed: false,
              nodeType: 'property',
              path: propPath,
              originalValue: propValue,
            });
            lineNumber++;
            // 处理嵌套的格式化，确保正确的缩进
            const nestedLines = formattedValue.split('\n');
            if (nestedLines.length > 1) {
              // 为嵌套内容添加额外的缩进
              const nestedFormatted = nestedLines
                .map((line, index) => {
                  if (index === 0) return line;
                  return '  ' + line;
                })
                .join('\n');
              return `"${key}": ${nestedFormatted}`;
            }
            return `"${key}": ${formattedValue}`;
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
    setIsDirty(true);

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
      setIsDirty(false);
      message.success('JSON已保存');
    } else {
      message.error('JSON格式错误，无法保存');
    }
  };

  // 复制JSON
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonText);
      message.success('JSON已复制到剪贴板');
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
      setIsDirty(false);

      if (onJSONChange) {
        onJSONChange(text);
      }

      message.success('JSON格式化成功');
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
      className={className}
      style={{
        ...style,
        height,
      }}
      extra={
        <Space>
          {isDirty && (
            <Button
              type="primary"
              size="small"
              onClick={handleFormat}
              disabled={readOnly}
            >
              格式化
            </Button>
          )}
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
      <div
        style={{
          display: 'flex',
        }}
      >
        {/* 左侧行号和折叠箭头 */}
        <div
          ref={lineNumbersRef}
          style={{
            width: '50px',
            backgroundColor: '#f8f9fa',
            borderRight: '1px solid #dee2e6',
            overflow: 'hidden',
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
            fontSize: '12px',
            lineHeight: '1.5',
            color: '#6c757d',
            userSelect: 'none',
          }}
        >
          {lines.map((line, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 8px',
                height: '20px',
                cursor: line.isCollapsible ? 'pointer' : 'default',
                position: 'relative',
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
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#dc3545',
                      flexShrink: 0,
                    }}
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
        <div style={{ flex: 1, position: 'relative' }}>
          <textarea
            ref={textareaRef}
            value={jsonText}
            onChange={handleTextChange}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            disabled={readOnly}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              outline: 'none',
              resize: 'none',
              fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
              fontSize: '12px',
              lineHeight: '1.5',
              // backgroundColor: parseError ? '#fff5f5' : '#ffffff',
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
