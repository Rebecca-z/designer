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
  onSave,
  readOnly = false,
  isVariableModalOpen = false, // 新增：变量弹窗是否打开
}) => {
  const [jsonText, setJsonText] = useState('');
  const [lines, setLines] = useState<LineData[]>([]);
  const [collapsedPaths, setCollapsedPaths] = useState<Set<string>>(new Set());
  const [parseError, setParseError] = useState<string | null>(null);
  const [jsonErrors, setJsonErrors] = useState<JSONError[]>([]);
  const [isAllExpanded, setIsAllExpanded] = useState(false);
  const [isUserEditing, setIsUserEditing] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [lastValidJson, setLastValidJson] = useState<any>(null);
  const [isUpdatingFromCollapse, setIsUpdatingFromCollapse] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // 新增：撤销/重做功能
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isUndoRedoAction, setIsUndoRedoAction] = useState(false);

  // 解析初始JSON
  const parsedJSON = useMemo(() => {
    if (typeof initialJSON === 'string') {
      try {
        const parsed = JSON.parse(initialJSON);
        return parsed;
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

      if (error instanceof SyntaxError) {
        const match = errorMessage.match(/position (\d+)/);
        if (match) {
          const position = parseInt(match[1]);
          const lines = text.split('\n');
          let currentPos = 0;

          for (let lineNum = 0; lineNum < lines.length; lineNum++) {
            const lineLength = lines[lineNum].length + 1;
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
    forceExpand: boolean = false,
    currentCollapsedPaths?: Set<string>,
  ): { text: string; lines: LineData[] } => {
    const collapsedPathsToUse = currentCollapsedPaths || collapsedPaths;
    const lines: LineData[] = [];
    let lineNumber = 1;

    const buildJSONFromLines = (lines: LineData[]): string => {
      return lines
        .map((line) => {
          const indent = '  '.repeat(line.indent);
          return `${indent}${line.content}`;
        })
        .join('\n');
    };

    const formatValue = (value: any, indent: number, path: string): void => {
      if (value === null) return;
      if (typeof value === 'string') return;
      if (typeof value === 'number' || typeof value === 'boolean') return;

      if (path === 'root') {
        lines.length = 0;
        lineNumber = 1;
      }

      // 处理数组
      if (Array.isArray(value)) {
        const isCollapsed = forceExpand ? false : collapsedPathsToUse.has(path);
        if (isCollapsed) {
          lines.push({
            lineNumber,
            content: `[${value.length} items]`,
            indent,
            isCollapsible: true,
            isCollapsed: true,
            nodeType: 'array',
            path,
            originalValue: value,
          });
          lineNumber++;
          return;
        }

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

        value.forEach((item, index) => {
          const itemPath = `${path}[${index}]`;
          const itemIndent = indent + 2;

          if (typeof item === 'object' && item !== null) {
            const isItemCollapsed = forceExpand
              ? false
              : collapsedPathsToUse.has(itemPath);

            if (isItemCollapsed) {
              const keys = Object.keys(item);
              lines.push({
                lineNumber,
                content: `{${keys.length} properties}${
                  index < value.length - 1 ? ',' : ''
                }`,
                indent: itemIndent,
                isCollapsible: true,
                isCollapsed: true,
                nodeType: 'object',
                path: itemPath,
                originalValue: item,
              });
              lineNumber++;
            } else {
              lines.push({
                lineNumber,
                content: '{',
                indent: itemIndent,
                isCollapsible: true,
                isCollapsed: false,
                nodeType: 'object',
                path: itemPath,
              });
              lineNumber++;

              const keys = Object.keys(item);
              keys.forEach((key, keyIndex) => {
                const propPath = `${itemPath}.${key}`;
                const propIndent = itemIndent + 2;
                const propValue = item[key];

                if (typeof propValue === 'object' && propValue !== null) {
                  const isPropCollapsed = forceExpand
                    ? false
                    : collapsedPathsToUse.has(propPath);

                  if (isPropCollapsed) {
                    const propKeys = Object.keys(propValue);
                    lines.push({
                      lineNumber,
                      content: `"${key}": {${propKeys.length} properties}${
                        keyIndex < keys.length - 1 ? ',' : ''
                      }`,
                      indent: propIndent,
                      isCollapsible: true,
                      isCollapsed: true,
                      nodeType: 'property',
                      path: propPath,
                      originalValue: propValue,
                    });
                    lineNumber++;
                  } else {
                    lines.push({
                      lineNumber,
                      content: `"${key}": {`,
                      indent: propIndent,
                      isCollapsible: true,
                      isCollapsed: false,
                      nodeType: 'property',
                      path: propPath,
                    });
                    lineNumber++;

                    const propKeys = Object.keys(propValue);
                    propKeys.forEach((propKey, propKeyIndex) => {
                      const nestedPropPath = `${propPath}.${propKey}`;
                      const nestedPropIndent = propIndent + 2;
                      const nestedPropValue = propValue[propKey];

                      if (
                        typeof nestedPropValue === 'object' &&
                        nestedPropValue !== null
                      ) {
                        const isNestedPropCollapsed = forceExpand
                          ? false
                          : collapsedPathsToUse.has(nestedPropPath);

                        if (isNestedPropCollapsed) {
                          const nestedPropKeys = Object.keys(nestedPropValue);
                          lines.push({
                            lineNumber,
                            content: `"${propKey}": {${
                              nestedPropKeys.length
                            } properties}${
                              propKeyIndex < propKeys.length - 1 ? ',' : ''
                            }`,
                            indent: nestedPropIndent,
                            isCollapsible: true,
                            isCollapsed: true,
                            nodeType: 'property',
                            path: nestedPropPath,
                            originalValue: nestedPropValue,
                          });
                          lineNumber++;
                        } else {
                          lines.push({
                            lineNumber,
                            content: `"${propKey}": {`,
                            indent: nestedPropIndent,
                            isCollapsible: true,
                            isCollapsed: false,
                            nodeType: 'property',
                            path: nestedPropPath,
                          });
                          lineNumber++;

                          const nestedPropKeys = Object.keys(nestedPropValue);
                          nestedPropKeys.forEach(
                            (nestedKey, nestedKeyIndex) => {
                              const finalPropPath = `${nestedPropPath}.${nestedKey}`;
                              const finalPropIndent = nestedPropIndent + 2;
                              const finalPropValue = nestedPropValue[nestedKey];

                              const content =
                                typeof finalPropValue === 'string'
                                  ? `"${finalPropValue}"`
                                  : typeof finalPropValue === 'object' &&
                                    finalPropValue !== null
                                  ? JSON.stringify(finalPropValue)
                                  : String(finalPropValue);
                              const fullContent = `"${nestedKey}": ${content}${
                                nestedKeyIndex < nestedPropKeys.length - 1
                                  ? ','
                                  : ''
                              }`;
                              lines.push({
                                lineNumber,
                                content: fullContent,
                                indent: finalPropIndent,
                                isCollapsible: false,
                                isCollapsed: false,
                                nodeType: 'property',
                                path: finalPropPath,
                                originalValue: finalPropValue,
                              });
                              lineNumber++;
                            },
                          );

                          lines.push({
                            lineNumber,
                            content: `}${
                              propKeyIndex < propKeys.length - 1 ? ',' : ''
                            }`,
                            indent: nestedPropIndent,
                            isCollapsible: false,
                            isCollapsed: false,
                            nodeType: 'value',
                            path: `${nestedPropPath}_end`,
                          });
                          lineNumber++;
                        }
                      } else {
                        const content =
                          typeof nestedPropValue === 'string'
                            ? `"${nestedPropValue}"`
                            : typeof nestedPropValue === 'object' &&
                              nestedPropValue !== null
                            ? JSON.stringify(nestedPropValue)
                            : String(nestedPropValue);
                        const fullContent = `"${propKey}": ${content}${
                          propKeyIndex < propKeys.length - 1 ? ',' : ''
                        }`;
                        lines.push({
                          lineNumber,
                          content: fullContent,
                          indent: nestedPropIndent,
                          isCollapsible: false,
                          isCollapsed: false,
                          nodeType: 'property',
                          path: nestedPropPath,
                          originalValue: nestedPropValue,
                        });
                        lineNumber++;
                      }
                    });

                    lines.push({
                      lineNumber,
                      content: `}${keyIndex < keys.length - 1 ? ',' : ''}`,
                      indent: propIndent,
                      isCollapsible: false,
                      isCollapsed: false,
                      nodeType: 'value',
                      path: `${propPath}_end`,
                    });
                    lineNumber++;
                  }
                } else {
                  const content =
                    typeof propValue === 'string'
                      ? `"${propValue}"`
                      : typeof propValue === 'object' && propValue !== null
                      ? JSON.stringify(propValue)
                      : String(propValue);
                  const fullContent = `"${key}": ${content}${
                    keyIndex < keys.length - 1 ? ',' : ''
                  }`;
                  lines.push({
                    lineNumber,
                    content: fullContent,
                    indent: propIndent,
                    isCollapsible: false,
                    isCollapsed: false,
                    nodeType: 'property',
                    path: propPath,
                    originalValue: propValue,
                  });
                  lineNumber++;
                }
              });

              lines.push({
                lineNumber,
                content: `}${index < value.length - 1 ? ',' : ''}`,
                indent: itemIndent,
                isCollapsible: false,
                isCollapsed: false,
                nodeType: 'value',
                path: `${itemPath}_end`,
              });
              lineNumber++;
            }
          } else {
            const content =
              typeof item === 'string'
                ? `"${item}"`
                : typeof item === 'object' && item !== null
                ? JSON.stringify(item)
                : String(item);
            const fullContent = `${content}${
              index < value.length - 1 ? ',' : ''
            }`;
            lines.push({
              lineNumber,
              content: fullContent,
              indent: itemIndent,
              isCollapsible: false,
              isCollapsed: false,
              nodeType: 'value',
              path: itemPath,
              originalValue: item,
            });
            lineNumber++;
          }
        });

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
        return;
      }

      // 处理对象类型
      if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
      ) {
        const keys = Object.keys(value);
        if (keys.length === 0) return;

        const isCollapsed = forceExpand ? false : collapsedPathsToUse.has(path);

        if (isCollapsed) {
          lines.push({
            lineNumber,
            content: `{${keys.length} properties}`,
            indent,
            isCollapsible: true,
            isCollapsed: true,
            nodeType: 'object',
            path,
            originalValue: value,
          });
          lineNumber++;
          return;
        }

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

        keys.forEach((key, keyIndex) => {
          const propPath = `${path}.${key}`;
          const propIndent = indent + 2;
          const propValue = value[key];

          if (typeof propValue === 'object' && propValue !== null) {
            const isPropCollapsed = forceExpand
              ? false
              : collapsedPathsToUse.has(propPath);

            if (isPropCollapsed) {
              const propKeys = Object.keys(propValue);
              lines.push({
                lineNumber,
                content: `"${key}": {${propKeys.length} properties}${
                  keyIndex < keys.length - 1 ? ',' : ''
                }`,
                indent: propIndent,
                isCollapsible: true,
                isCollapsed: true,
                nodeType: 'property',
                path: propPath,
                originalValue: propValue,
              });
              lineNumber++;
            } else {
              lines.push({
                lineNumber,
                content: `"${key}": {`,
                indent: propIndent,
                isCollapsible: true,
                isCollapsed: false,
                nodeType: 'property',
                path: propPath,
              });
              lineNumber++;

              const propKeys = Object.keys(propValue);
              propKeys.forEach((propKey, propKeyIndex) => {
                const nestedPropPath = `${propPath}.${propKey}`;
                const nestedPropIndent = propIndent + 2;
                const nestedPropValue = propValue[propKey];

                if (
                  typeof nestedPropValue === 'object' &&
                  nestedPropValue !== null
                ) {
                  const isNestedPropCollapsed = forceExpand
                    ? false
                    : collapsedPathsToUse.has(nestedPropPath);

                  if (isNestedPropCollapsed) {
                    const nestedPropKeys = Object.keys(nestedPropValue);
                    lines.push({
                      lineNumber,
                      content: `"${propKey}": {${
                        nestedPropKeys.length
                      } properties}${
                        propKeyIndex < propKeys.length - 1 ? ',' : ''
                      }`,
                      indent: nestedPropIndent,
                      isCollapsible: true,
                      isCollapsed: true,
                      nodeType: 'property',
                      path: nestedPropPath,
                      originalValue: nestedPropValue,
                    });
                    lineNumber++;
                  } else {
                    lines.push({
                      lineNumber,
                      content: `"${propKey}": {`,
                      indent: nestedPropIndent,
                      isCollapsible: true,
                      isCollapsed: false,
                      nodeType: 'property',
                      path: nestedPropPath,
                    });
                    lineNumber++;

                    const nestedPropKeys = Object.keys(nestedPropValue);
                    nestedPropKeys.forEach((nestedKey, nestedKeyIndex) => {
                      const finalPropPath = `${nestedPropPath}.${nestedKey}`;
                      const finalPropIndent = nestedPropIndent + 2;
                      const finalPropValue = nestedPropValue[nestedKey];

                      const content =
                        typeof finalPropValue === 'string'
                          ? `"${finalPropValue}"`
                          : typeof finalPropValue === 'object' &&
                            finalPropValue !== null
                          ? JSON.stringify(finalPropValue)
                          : String(finalPropValue);
                      const fullContent = `"${nestedKey}": ${content}${
                        nestedKeyIndex < nestedPropKeys.length - 1 ? ',' : ''
                      }`;
                      lines.push({
                        lineNumber,
                        content: fullContent,
                        indent: finalPropIndent,
                        isCollapsible: false,
                        isCollapsed: false,
                        nodeType: 'property',
                        path: finalPropPath,
                        originalValue: finalPropValue,
                      });
                      lineNumber++;
                    });

                    lines.push({
                      lineNumber,
                      content: `}${
                        propKeyIndex < propKeys.length - 1 ? ',' : ''
                      }`,
                      indent: nestedPropIndent,
                      isCollapsible: false,
                      isCollapsed: false,
                      nodeType: 'value',
                      path: `${nestedPropPath}_end`,
                    });
                    lineNumber++;
                  }
                } else {
                  const content =
                    typeof nestedPropValue === 'string'
                      ? `"${nestedPropValue}"`
                      : typeof nestedPropValue === 'object' &&
                        nestedPropValue !== null
                      ? JSON.stringify(nestedPropValue)
                      : String(nestedPropValue);
                  const fullContent = `"${propKey}": ${content}${
                    propKeyIndex < propKeys.length - 1 ? ',' : ''
                  }`;
                  lines.push({
                    lineNumber,
                    content: fullContent,
                    indent: nestedPropIndent,
                    isCollapsible: false,
                    isCollapsed: false,
                    nodeType: 'property',
                    path: nestedPropPath,
                    originalValue: nestedPropValue,
                  });
                  lineNumber++;
                }
              });

              lines.push({
                lineNumber,
                content: `}${keyIndex < keys.length - 1 ? ',' : ''}`,
                indent: propIndent,
                isCollapsible: false,
                isCollapsed: false,
                nodeType: 'value',
                path: `${propPath}_end`,
              });
              lineNumber++;
            }
          } else {
            const content =
              typeof propValue === 'string'
                ? `"${propValue}"`
                : typeof propValue === 'object' && propValue !== null
                ? JSON.stringify(propValue)
                : String(propValue);
            const fullContent = `"${key}": ${content}${
              keyIndex < keys.length - 1 ? ',' : ''
            }`;
            lines.push({
              lineNumber,
              content: fullContent,
              indent: propIndent,
              isCollapsible: false,
              isCollapsed: false,
              nodeType: 'property',
              path: propPath,
              originalValue: propValue,
            });
            lineNumber++;
          }
        });

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
      }

      return;
    };

    formatValue(obj, 0, 'root');
    const text = buildJSONFromLines(lines);
    return { text, lines };
  };

  // 添加历史记录
  const addToHistory = (text: string) => {
    if (isUndoRedoAction) {
      setIsUndoRedoAction(false);
      return;
    }

    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(text);
      // 限制历史记录数量，避免内存泄漏
      if (newHistory.length > 50) {
        newHistory.shift();
      }
      return newHistory;
    });
    setHistoryIndex((prev) => prev + 1);
  };

  // 撤销功能
  const handleUndo = () => {
    if (historyIndex > 0) {
      setIsUndoRedoAction(true);
      const newIndex = historyIndex - 1;
      const previousText = history[newIndex];
      setJsonText(previousText);
      setHistoryIndex(newIndex);

      // 更新相关状态
      const { isValid, errors } = validateJSON(previousText);
      if (!isValid) {
        setParseError(errors[0]?.message || 'JSON格式错误');
        setJsonErrors(errors);
      } else {
        setParseError(null);
        setJsonErrors([]);
        try {
          const parsed = JSON.parse(previousText);
          setLastValidJson(parsed);
          if (!isFormatting && !isUpdatingFromCollapse) {
            const { lines: newLines } = formatJSONWithLines(parsed, false);
            setLines(newLines);
          }
        } catch (error) {
          // 忽略解析错误
        }
      }
    }
  };

  // 重做功能
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setIsUndoRedoAction(true);
      const newIndex = historyIndex + 1;
      const nextText = history[newIndex];
      setJsonText(nextText);
      setHistoryIndex(newIndex);

      // 更新相关状态
      const { isValid, errors } = validateJSON(nextText);
      if (!isValid) {
        setParseError(errors[0]?.message || 'JSON格式错误');
        setJsonErrors(errors);
      } else {
        setParseError(null);
        setJsonErrors([]);
        try {
          const parsed = JSON.parse(nextText);
          setLastValidJson(parsed);
          if (!isFormatting && !isUpdatingFromCollapse) {
            const { lines: newLines } = formatJSONWithLines(parsed, false);
            setLines(newLines);
          }
        } catch (error) {
          // 忽略解析错误
        }
      }
    }
  };

  // 插入空格到光标位置
  const insertSpacesAtCursor = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = jsonText;

    // 插入两个空格（标准缩进）
    const newText = currentText.slice(0, start) + '  ' + currentText.slice(end);
    setJsonText(newText);

    // 设置光标位置到插入的空格后面
    setTimeout(() => {
      if (textarea) {
        textarea.selectionStart = start + 2;
        textarea.selectionEnd = start + 2;
        textarea.focus();
      }
    }, 0);
  };

  // 处理文本变化
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setJsonText(newText);
    setIsUserEditing(true);

    // 添加到历史记录
    addToHistory(newText);

    const { isValid, errors } = validateJSON(newText);
    if (!isValid) {
      setParseError(errors[0]?.message || 'JSON格式错误');
      setJsonErrors(errors);
    } else {
      setParseError(null);
      setJsonErrors([]);
      try {
        const parsed = JSON.parse(newText);
        setLastValidJson(parsed);
        // 重新格式化行数据以保持折叠状态
        if (!isFormatting && !isUpdatingFromCollapse) {
          const { lines: newLines } = formatJSONWithLines(parsed, false);
          setLines(newLines);
        }
      } catch (error) {
        // 忽略解析错误
      }
    }
  };

  // 处理折叠/展开
  const handleToggleCollapse = (path: string) => {
    console.log('Toggle collapse for path:', path);

    // 立即更新折叠状态
    const newCollapsedPaths = new Set(collapsedPaths);
    if (newCollapsedPaths.has(path)) {
      newCollapsedPaths.delete(path);
    } else {
      newCollapsedPaths.add(path);
    }

    // 设置更新标志
    setIsUpdatingFromCollapse(true);

    // 立即更新文本内容和行数据
    if (lastValidJson) {
      const { text: newText, lines: newLines } = formatJSONWithLines(
        lastValidJson,
        false,
        newCollapsedPaths,
      );
      setJsonText(newText);
      setLines(newLines);
    }

    // 设置折叠状态
    setCollapsedPaths(newCollapsedPaths);

    // 延迟重置标志，确保状态更新完成
    setTimeout(() => {
      setIsUpdatingFromCollapse(false);
    }, 50);
  };

  // 展开/折叠所有
  const handleToggleAll = () => {
    setIsUpdatingFromCollapse(true);

    let newCollapsedPaths: Set<string>;

    if (isAllExpanded) {
      newCollapsedPaths = new Set();
      setIsAllExpanded(false);
    } else {
      newCollapsedPaths = new Set<string>();
      lines.forEach((line) => {
        if (line.isCollapsible) {
          newCollapsedPaths.add(line.path);
        }
      });
      setIsAllExpanded(true);
    }

    // 立即更新文本内容
    if (lastValidJson) {
      const { text: newText, lines: newLines } = formatJSONWithLines(
        lastValidJson,
        false,
        newCollapsedPaths,
      );
      setJsonText(newText);
      setLines(newLines);
    }

    // 设置折叠状态
    setCollapsedPaths(newCollapsedPaths);

    setTimeout(() => {
      setIsUpdatingFromCollapse(false);
    }, 100);
  };

  // 保存JSON
  const handleSave = () => {
    const { isValid } = validateJSON(jsonText);
    if (isValid) {
      try {
        const parsed = JSON.parse(jsonText);
        const { text } = formatJSONWithLines(parsed, true);
        if (onSave) {
          onSave(text);
        }
        message.success('JSON已保存');
      } catch (error) {
        if (onSave) {
          onSave(jsonText);
        }
        message.success('JSON已保存');
      }
    } else {
      message.error('JSON格式错误，无法保存');
    }
  };

  // 复制全部JSON
  const handleCopyAll = async () => {
    try {
      // 先展开所有数据
      setCollapsedPaths(new Set());
      setIsAllExpanded(true);

      // 使用lastValidJson而不是当前的jsonText来复制
      let jsonToCopy = lastValidJson;

      if (!jsonToCopy) {
        // 如果没有lastValidJson，尝试解析当前文本
        const { isValid } = validateJSON(jsonText);

        if (!isValid) {
          // 尝试修复JSON格式
          let fixedJson = jsonText;

          // 移除所有折叠的占位符文本
          fixedJson = fixedJson.replace(/\{[^}]*properties\}/g, '{}');
          fixedJson = fixedJson.replace(/\[\d+\s*items\]/g, '[]');

          fixedJson = fixedJson.replace(/}(\s*)(?=")/g, '},\n$1');
          fixedJson = fixedJson.replace(/}(\s*)(?={)/g, '},\n$1');
          fixedJson = fixedJson.replace(
            /"([^"]+)"\s*:\s*([^,}\s][^,}]*?)\s*(?=")/g,
            '"$1": $2,\n',
          );
          fixedJson = fixedJson.replace(/,(\s*[}\]])/g, '$1');

          const { isValid: isFixedValid } = validateJSON(fixedJson);
          if (isFixedValid) {
            jsonToCopy = JSON.parse(fixedJson);
          } else {
            // 如果无法修复，直接复制当前文本
            await navigator.clipboard.writeText(jsonText);
            message.success('JSON已复制到剪贴板');
            return;
          }
        } else {
          jsonToCopy = JSON.parse(jsonText);
        }
      }

      // 格式化并复制完整的JSON
      const { text, lines: newLines } = formatJSONWithLines(jsonToCopy, true);
      await navigator.clipboard.writeText(text);

      // 更新UI显示为展开状态
      setJsonText(text);
      setLines(newLines);
      setParseError(null);
      setJsonErrors([]);
      setIsUserEditing(true);
      setLastValidJson(jsonToCopy);

      message.success('JSON已复制到剪贴板');
    } catch (error) {
      console.error('Error in handleCopyAll:', error);
      message.error('复制失败');
    }
  };

  // 复制选中文本
  const handleCopySelected = async () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // 检查是否有选中的文本
    const selectedText = textarea.value.substring(
      textarea.selectionStart,
      textarea.selectionEnd,
    );

    if (selectedText && selectedText.trim() !== '') {
      // 如果有选中的文本，直接复制选中的内容
      await navigator.clipboard.writeText(selectedText);
      message.success('选中内容已复制到剪贴板');
      return;
    }

    // 如果没有选中文本，复制全部内容
    await handleCopyAll();
  };

  // 复制JSON（保持向后兼容）
  const handleCopy = async () => {
    await handleCopyAll();
  };

  // 处理滚动同步
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // 只在变量弹窗打开且textarea激活时处理特殊快捷键
    if (isVariableModalOpen && document.activeElement === textareaRef.current) {
      // Command+Z 或 Ctrl+Z：撤销
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        handleUndo();
        return;
      }

      // Command+Shift+Z 或 Ctrl+Shift+Z：重做
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        handleRedo();
        return;
      }

      // Tab键：插入空格
      if (e.key === 'Tab') {
        e.preventDefault();
        e.stopPropagation();
        insertSpacesAtCursor();
        return;
      }
    }

    // 原有的快捷键处理
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 's':
          e.preventDefault();
          handleSave();
          break;
        case 'c':
          e.preventDefault();
          // 在变量弹窗中，优先复制选中文本
          if (
            isVariableModalOpen &&
            document.activeElement === textareaRef.current
          ) {
            handleCopySelected();
          } else {
            handleCopy();
          }
          break;
      }
    }
  };

  // 格式化JSON
  const handleFormat = () => {
    console.log('handleFormat called, jsonText:', jsonText);

    try {
      setIsFormatting(true);

      // 先展开所有数据
      setCollapsedPaths(new Set());
      setIsAllExpanded(true);

      // 使用lastValidJson而不是当前的jsonText来格式化
      let jsonToFormat = lastValidJson;

      if (!jsonToFormat) {
        // 如果没有lastValidJson，尝试解析当前文本
        const { isValid } = validateJSON(jsonText);
        console.log('JSON validation result:', { isValid });

        if (!isValid) {
          console.log('JSON is invalid, attempting to fix format');

          let fixedJson = jsonText;
          console.log('Original JSON:', fixedJson);

          // 移除所有折叠的占位符文本
          fixedJson = fixedJson.replace(/\{[^}]*properties\}/g, '{}');
          fixedJson = fixedJson.replace(/\[\d+\s*items\]/g, '[]');

          fixedJson = fixedJson.replace(/}(\s*)(?=")/g, '},\n$1');
          console.log('After fixing object property commas:', fixedJson);

          fixedJson = fixedJson.replace(/}(\s*)(?={)/g, '},\n$1');
          console.log('After fixing array element commas:', fixedJson);

          fixedJson = fixedJson.replace(
            /"([^"]+)"\s*:\s*([^,}\s][^,}]*?)\s*(?=")/g,
            '"$1": $2,\n',
          );
          console.log('After fixing property value commas:', fixedJson);

          fixedJson = fixedJson.replace(/,(\s*[}\]])/g, '$1');
          console.log('Final fixed JSON:', fixedJson);

          const { isValid: isFixedValid } = validateJSON(fixedJson);
          console.log('Fixed JSON validation result:', { isFixedValid });
          if (isFixedValid) {
            console.log('JSON format fixed successfully');
            jsonToFormat = JSON.parse(fixedJson);
          } else {
            console.log('JSON format could not be fixed automatically');
            message.error('JSON格式错误，无法自动修复');
            return;
          }
        } else {
          jsonToFormat = JSON.parse(jsonText);
        }
      }

      console.log('JSON to format:', jsonToFormat);

      const { text, lines: newLines } = formatJSONWithLines(jsonToFormat, true);
      console.log('Formatted result:', { text, lines: newLines });

      setJsonText(text);
      setLines(newLines);
      setParseError(null);
      setJsonErrors([]);
      setIsUserEditing(true);
      setLastValidJson(jsonToFormat);

      message.success('JSON格式化完成');
    } catch (error) {
      console.error('Error in handleFormat:', error);
      message.error('JSON格式错误');
    } finally {
      setIsFormatting(false);
    }
  };

  // 检查行是否有错误
  const hasErrorOnLine = (lineNumber: number): boolean => {
    return jsonErrors.some((error) => error.line === lineNumber);
  };

  // 初始化时格式化JSON
  useEffect(() => {
    if (parsedJSON) {
      setIsFormatting(true);

      const { text, lines: newLines } = formatJSONWithLines(parsedJSON, false);
      setJsonText(text);
      setLines(newLines);
      setParseError(null);
      setJsonErrors([]);
      setIsUserEditing(false);
      setLastValidJson(parsedJSON);

      // 初始化历史记录
      setHistory([text]);
      setHistoryIndex(0);

      setIsFormatting(false);
    }
  }, [parsedJSON]);

  // 当lastValidJson变化时，重新格式化行数据（保持当前的折叠状态）
  useEffect(() => {
    if (
      lastValidJson &&
      isUserEditing &&
      !isFormatting &&
      !isUpdatingFromCollapse
    ) {
      const { lines: newLines } = formatJSONWithLines(
        lastValidJson,
        false,
        collapsedPaths,
      );
      setLines(newLines);
    }
  }, [lastValidJson, isUserEditing, collapsedPaths]);

  // 当折叠状态变化时，重新格式化行数据
  useEffect(() => {
    if (lastValidJson && !isFormatting && !isUpdatingFromCollapse) {
      const { lines: newLines } = formatJSONWithLines(
        lastValidJson,
        false,
        collapsedPaths,
      );
      setLines(newLines);
    }
  }, [collapsedPaths, lastValidJson, isUpdatingFromCollapse]);

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
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 4px',
                fontSize: '12px',
                lineHeight: '20px',
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
              lineHeight: '20px',
              fontSize: '12px',
            }}
            placeholder="输入JSON数据..."
          />
        </div>
      </div>
    </Card>
  );
};

export default JSONEditor;
