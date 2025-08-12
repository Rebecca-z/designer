// JSON格式化显示编辑工具
import {
  CaretDownOutlined,
  CaretRightOutlined,
  CompressOutlined,
  CopyOutlined,
  ExpandOutlined,
} from '@ant-design/icons';
import { Button, Card, message, Space, Tooltip, Typography } from 'antd';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import style from './index.less';
import type {
  JSONEditorProps,
  JSONEditorRef,
  JSONError,
  LineData,
} from './type';

const { Text } = Typography;

// 常量定义
const CONSTANTS = {
  HISTORY_LIMIT: 50,
  INDENT_SIZE: 1,
  LINE_HEIGHT: 20,
  FONT_SIZE: 12,
  ERROR_COLOR: '#dc3545',
  TEXT_COLOR: '#212529',
  COLLAPSE_UPDATE_DELAY: 50,
  FORMAT_UPDATE_DELAY: 100,
} as const;

// 工具函数
const utils = {
  // JSON验证
  validateJSON: (text: string): { isValid: boolean; errors: JSONError[] } => {
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
  },

  // 修复JSON格式
  fixJSONFormat: (text: string): string => {
    let fixedJson = text;

    // 移除折叠占位符
    fixedJson = fixedJson.replace(/\{[^}]*properties\}/g, '{}');
    fixedJson = fixedJson.replace(/\[\d+\s*items\]/g, '[]');

    // 修复逗号问题
    fixedJson = fixedJson.replace(/}(\s*)(?=")/g, '},\n$1');
    fixedJson = fixedJson.replace(/}(\s*)(?={)/g, '},\n$1');
    fixedJson = fixedJson.replace(
      /"([^"]+)"\s*:\s*([^,}\s][^,}]*?)\s*(?=")/g,
      '"$1": $2,\n',
    );
    fixedJson = fixedJson.replace(/,(\s*[}\]])/g, '$1');

    return fixedJson;
  },

  // 生成JSON内容字符串
  generateJSONContent: (value: any): string => {
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'object' && value !== null)
      return JSON.stringify(value);
    return String(value);
  },

  // 检查行是否有错误
  hasErrorOnLine: (lineNumber: number, errors: JSONError[]): boolean => {
    return errors.some((error) => error.line === lineNumber);
  },
};

// 格式化JSON并生成行数据的核心函数
const formatJSONWithLines = (
  obj: any,
  forceExpand: boolean = false,
  currentCollapsedPaths?: Set<string>,
): { text: string; lines: LineData[] } => {
  const collapsedPathsToUse = currentCollapsedPaths || new Set<string>();
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

  const formatObject = (
    obj: any,
    indent: number,
    path: string,
    addComma = false,
    skipOpeningBrace = false,
  ) => {
    const keys = Object.keys(obj);
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
        originalValue: obj,
      });
      lineNumber++;
      return;
    }

    if (!skipOpeningBrace) {
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
    }

    keys.forEach((key, keyIndex) => {
      const propPath = `${path}.${key}`;
      const propIndent = indent + CONSTANTS.INDENT_SIZE;
      const propValue = obj[key];

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

          formatObject(
            propValue,
            propIndent + CONSTANTS.INDENT_SIZE,
            propPath,
            keyIndex < keys.length - 1,
            true,
          );
        }
      } else {
        const content = utils.generateJSONContent(propValue);
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
      content: `}${addComma ? ',' : ''}`,
      indent,
      isCollapsible: false,
      isCollapsed: false,
      nodeType: 'value',
      path: `${path}_end`,
    });
    lineNumber++;
  };

  const formatValue = (value: any, indent: number, path: string): void => {
    if (
      value === null ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      return;
    }

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
        const itemIndent = indent + CONSTANTS.INDENT_SIZE;

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
            formatObject(
              item,
              itemIndent,
              itemPath,
              index < value.length - 1,
              false,
            );
          }
        } else {
          const content = utils.generateJSONContent(item);
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

    // 处理对象
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      formatObject(value, indent, path, false, false);
    }
  };

  formatValue(obj, 0, 'root');
  const text = buildJSONFromLines(lines);
  return { text, lines };
};

const JSONEditor = forwardRef<JSONEditorRef, JSONEditorProps>(
  (
    {
      json: initialJSON,
      title = 'JSON 编辑器',
      height = '400px',
      className,
      onSave,
      readOnly = false,
      isVariableModalOpen = false,
      // componentType, // 新增：当前选中组件的类型
    },
    ref,
  ) => {
    // 状态管理
    const [jsonText, setJsonText] = useState('');
    const [lines, setLines] = useState<LineData[]>([]);
    const [collapsedPaths, setCollapsedPaths] = useState<Set<string>>(
      new Set(),
    );
    const [parseError, setParseError] = useState<string | null>(null);
    const [jsonErrors, setJsonErrors] = useState<JSONError[]>([]);
    const [isAllExpanded, setIsAllExpanded] = useState(false);
    const [isUserEditing, setIsUserEditing] = useState(false);
    const [isFormatting, setIsFormatting] = useState(false);
    const [lastValidJson, setLastValidJson] = useState<any>(null);
    const [isUpdatingFromCollapse, setIsUpdatingFromCollapse] = useState(false);

    // 撤销/重做功能
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [isUndoRedoAction, setIsUndoRedoAction] = useState(false);

    // Refs
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const lineNumbersRef = useRef<HTMLDivElement>(null);

    // 解析初始JSON
    const parsedJSON = useMemo(() => {
      if (typeof initialJSON === 'string') {
        try {
          return JSON.parse(initialJSON);
        } catch (error) {
          setParseError(
            error instanceof Error ? error.message : 'JSON解析错误',
          );
          return null;
        }
      }
      return initialJSON;
    }, [initialJSON]);

    // 添加历史记录
    const addToHistory = useCallback(
      (text: string) => {
        if (isUndoRedoAction) {
          setIsUndoRedoAction(false);
          return;
        }

        setHistory((prev) => {
          const newHistory = prev.slice(0, historyIndex + 1);
          newHistory.push(text);
          if (newHistory.length > CONSTANTS.HISTORY_LIMIT) {
            newHistory.shift();
          }
          return newHistory;
        });
        setHistoryIndex((prev) => prev + 1);
      },
      [historyIndex, isUndoRedoAction],
    );

    // 更新JSON状态
    const updateJSONState = useCallback(
      (newText: string, isValid: boolean, errors: JSONError[]) => {
        setJsonText(newText);

        if (!isValid) {
          setParseError(errors[0]?.message || 'JSON格式错误');
          setJsonErrors(errors);
        } else {
          setParseError(null);
          setJsonErrors([]);
          try {
            const parsed = JSON.parse(newText);
            setLastValidJson(parsed);
            if (!isFormatting && !isUpdatingFromCollapse) {
              const { lines: newLines } = formatJSONWithLines(parsed, false);
              setLines(newLines);

              const collapsibleLines = newLines.filter(
                (line) => line.isCollapsible,
              );
              const allExpanded = collapsibleLines.every(
                (line) => !collapsedPaths.has(line.path),
              );
              setIsAllExpanded(allExpanded);
            }
          } catch (error) {
            // 忽略解析错误
          }
        }
      },
      [collapsedPaths, isFormatting, isUpdatingFromCollapse],
    );

    // 撤销功能
    const handleUndo = useCallback(() => {
      if (historyIndex > 0) {
        setIsUndoRedoAction(true);
        const newIndex = historyIndex - 1;
        const previousText = history[newIndex];
        const { isValid, errors } = utils.validateJSON(previousText);

        updateJSONState(previousText, isValid, errors);
        setHistoryIndex(newIndex);
      }
    }, [historyIndex, history, updateJSONState]);

    // 重做功能
    const handleRedo = useCallback(() => {
      if (historyIndex < history.length - 1) {
        setIsUndoRedoAction(true);
        const newIndex = historyIndex + 1;
        const nextText = history[newIndex];
        const { isValid, errors } = utils.validateJSON(nextText);

        updateJSONState(nextText, isValid, errors);
        setHistoryIndex(newIndex);
      }
    }, [historyIndex, history, updateJSONState]);

    // 插入空格到光标位置
    const insertSpacesAtCursor = useCallback(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentText = jsonText;

      const newText =
        currentText.slice(0, start) + '  ' + currentText.slice(end);
      setJsonText(newText);

      setTimeout(() => {
        if (textarea) {
          textarea.selectionStart = start + 2;
          textarea.selectionEnd = start + 2;
          textarea.focus();
        }
      }, 0);
    }, [jsonText]);

    // 处理文本变化
    const handleTextChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newText = e.target.value;
        setIsUserEditing(true);
        addToHistory(newText);

        const { isValid, errors } = utils.validateJSON(newText);
        updateJSONState(newText, isValid, errors);
      },
      [addToHistory, updateJSONState],
    );

    // 处理折叠/展开
    const handleToggleCollapse = useCallback(
      (path: string) => {
        const { isValid } = utils.validateJSON(jsonText);

        if (!isValid && parseError) {
          message.error('JSON格式错误，请先修复错误再展开/折叠');
          return;
        }

        const newCollapsedPaths = new Set(collapsedPaths);
        if (newCollapsedPaths.has(path)) {
          newCollapsedPaths.delete(path);
        } else {
          newCollapsedPaths.add(path);
        }

        setIsUpdatingFromCollapse(true);

        if (isUserEditing && parseError) {
          setCollapsedPaths(newCollapsedPaths);
          const collapsibleLines = lines.filter((line) => line.isCollapsible);
          const allExpanded = collapsibleLines.every(
            (line) => !newCollapsedPaths.has(line.path),
          );
          setIsAllExpanded(allExpanded);

          setTimeout(() => {
            setIsUpdatingFromCollapse(false);
          }, CONSTANTS.COLLAPSE_UPDATE_DELAY);
          return;
        }

        if (lastValidJson) {
          const { text: newText, lines: newLines } = formatJSONWithLines(
            lastValidJson,
            false,
            newCollapsedPaths,
          );
          setJsonText(newText);
          setLines(newLines);
        }

        setCollapsedPaths(newCollapsedPaths);
        const collapsibleLines = lines.filter((line) => line.isCollapsible);
        const allExpanded = collapsibleLines.every(
          (line) => !newCollapsedPaths.has(line.path),
        );
        setIsAllExpanded(allExpanded);

        setTimeout(() => {
          setIsUpdatingFromCollapse(false);
        }, CONSTANTS.COLLAPSE_UPDATE_DELAY);
      },
      [
        jsonText,
        parseError,
        collapsedPaths,
        isUserEditing,
        lines,
        lastValidJson,
      ],
    );

    // 展开/折叠所有
    const handleToggleAll = useCallback(() => {
      const { isValid } = utils.validateJSON(jsonText);

      if (!isValid && parseError) {
        message.error('JSON格式错误，请先修复错误再展开/折叠');
        return;
      }

      setIsUpdatingFromCollapse(true);

      let newCollapsedPaths: Set<string>;

      if (isAllExpanded) {
        newCollapsedPaths = new Set<string>();
        lines.forEach((line) => {
          if (line.isCollapsible) {
            newCollapsedPaths.add(line.path);
          }
        });
        setIsAllExpanded(false);
      } else {
        newCollapsedPaths = new Set();
        setIsAllExpanded(true);
      }

      if (isUserEditing && parseError) {
        setCollapsedPaths(newCollapsedPaths);
        setTimeout(() => {
          setIsUpdatingFromCollapse(false);
        }, CONSTANTS.FORMAT_UPDATE_DELAY);
        return;
      }

      if (lastValidJson) {
        const { text: newText, lines: newLines } = formatJSONWithLines(
          lastValidJson,
          false,
          newCollapsedPaths,
        );
        setJsonText(newText);
        setLines(newLines);
      }

      setCollapsedPaths(newCollapsedPaths);

      setTimeout(() => {
        setIsUpdatingFromCollapse(false);
      }, CONSTANTS.FORMAT_UPDATE_DELAY);
    }, [
      jsonText,
      parseError,
      isAllExpanded,
      lines,
      isUserEditing,
      lastValidJson,
    ]);

    // 保存JSON
    const handleSave = useCallback(() => {
      const { isValid } = utils.validateJSON(jsonText);
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
    }, [jsonText, onSave]);

    // 复制全部JSON
    const handleCopyAll = useCallback(async () => {
      try {
        const { isValid } = utils.validateJSON(jsonText);

        if (!isValid && parseError) {
          message.error('JSON格式错误，请先修复错误再复制');
          return;
        }

        setCollapsedPaths(new Set());
        setIsAllExpanded(true);

        let jsonToCopy = lastValidJson;

        if (!jsonToCopy) {
          if (!isValid) {
            const fixedJson = utils.fixJSONFormat(jsonText);
            const { isValid: isFixedValid } = utils.validateJSON(fixedJson);
            if (isFixedValid) {
              jsonToCopy = JSON.parse(fixedJson);
            } else {
              await navigator.clipboard.writeText(jsonText);
              message.success('JSON已复制到剪贴板');
              return;
            }
          } else {
            jsonToCopy = JSON.parse(jsonText);
          }
        }

        const { text, lines: newLines } = formatJSONWithLines(jsonToCopy, true);
        await navigator.clipboard.writeText(text);

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
    }, [jsonText, parseError, lastValidJson]);

    // 复制选中文本
    const handleCopySelected = useCallback(async () => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const selectedText = textarea.value.substring(
        textarea.selectionStart,
        textarea.selectionEnd,
      );

      if (selectedText && selectedText.trim() !== '') {
        await navigator.clipboard.writeText(selectedText);
        message.success('选中内容已复制到剪贴板');
        return;
      }

      await handleCopyAll();
    }, [handleCopyAll]);

    // 处理滚动同步
    const handleScroll = useCallback(
      (e: React.UIEvent<HTMLTextAreaElement>) => {
        if (lineNumbersRef.current) {
          lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
        }
      },
      [],
    );

    // 处理键盘事件
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (
          isVariableModalOpen &&
          document.activeElement === textareaRef.current
        ) {
          if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            handleUndo();
            return;
          }

          if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            handleRedo();
            return;
          }

          if (e.key === 'Tab') {
            e.preventDefault();
            e.stopPropagation();
            insertSpacesAtCursor();
            return;
          }
        }

        if (e.ctrlKey || e.metaKey) {
          switch (e.key) {
            case 's':
              e.preventDefault();
              handleSave();
              break;
            case 'c':
              e.preventDefault();
              if (
                isVariableModalOpen &&
                document.activeElement === textareaRef.current
              ) {
                handleCopySelected();
              } else {
                handleCopyAll();
              }
              break;
          }
        }
      },
      [
        isVariableModalOpen,
        handleUndo,
        handleRedo,
        insertSpacesAtCursor,
        handleSave,
        handleCopySelected,
        handleCopyAll,
      ],
    );

    // 格式化JSON
    const handleFormat = useCallback((): Promise<void> => {
      return new Promise((resolve, reject) => {
        try {
          const { isValid } = utils.validateJSON(jsonText);

          if (!isValid && parseError) {
            message.error('JSON格式错误，请先修复错误再格式化');
            resolve();
            return;
          }

          setIsFormatting(true);
          setCollapsedPaths(new Set());
          setIsAllExpanded(true);

          let jsonToFormat = lastValidJson;

          if (!jsonToFormat) {
            if (!isValid) {
              const fixedJson = utils.fixJSONFormat(jsonText);
              const { isValid: isFixedValid } = utils.validateJSON(fixedJson);
              if (isFixedValid) {
                jsonToFormat = JSON.parse(fixedJson);
              } else {
                message.error('JSON格式错误，无法自动修复');
                reject(new Error('JSON格式错误，无法自动修复'));
                return;
              }
            } else {
              jsonToFormat = JSON.parse(jsonText);
            }
          }

          const { text, lines: newLines } = formatJSONWithLines(
            jsonToFormat,
            true,
          );

          setJsonText(text);
          setLines(newLines);
          setParseError(null);
          setJsonErrors([]);
          setIsUserEditing(true);
          setLastValidJson(jsonToFormat);

          message.success('JSON格式化完成');

          setTimeout(() => {
            setIsFormatting(false);
            resolve();
          }, 0);
        } catch (error) {
          console.error('Error in handleFormat:', error);
          message.error('JSON格式错误');
          setIsFormatting(false);
          reject(error);
        }
      });
    }, [jsonText, parseError, lastValidJson]);

    // 暴露给外部的方法
    useImperativeHandle(ref, () => ({
      getFormattedJSON: () => {
        const { isValid, errors } = utils.validateJSON(jsonText);

        if (isUserEditing) {
          if (isValid) {
            try {
              const parsed = JSON.parse(jsonText);
              const { text } = formatJSONWithLines(parsed, true);
              return { success: true as const, data: text };
            } catch (error) {
              return {
                success: false as const,
                error: error instanceof Error ? error.message : 'JSON解析错误',
                data: undefined,
              };
            }
          } else {
            return {
              success: false as const,
              error: errors[0]?.message || 'JSON格式错误',
              data: undefined,
            };
          }
        }

        if (isValid) {
          try {
            const parsed = JSON.parse(jsonText);
            const { text } = formatJSONWithLines(parsed, true);
            return { success: true as const, data: text };
          } catch (error) {
            return {
              success: false as const,
              error: error instanceof Error ? error.message : 'JSON解析错误',
              data: undefined,
            };
          }
        }

        if (lastValidJson) {
          try {
            const { text } = formatJSONWithLines(lastValidJson, true);
            return { success: true as const, data: text };
          } catch (error) {
            return {
              success: false as const,
              error: error instanceof Error ? error.message : 'JSON格式化错误',
              data: undefined,
            };
          }
        }

        return {
          success: false as const,
          error: errors[0]?.message || 'JSON格式错误',
          data: undefined,
        };
      },
      validateJSON: () => {
        const originalValidation = utils.validateJSON(jsonText);

        if (isUserEditing) {
          return originalValidation;
        }

        if (originalValidation.isValid) {
          return originalValidation;
        }

        if (lastValidJson) {
          try {
            const { text } = formatJSONWithLines(lastValidJson, true);
            return utils.validateJSON(text);
          } catch (error) {
            return originalValidation;
          }
        }

        return originalValidation;
      },
      formatJSON: async () => {
        await handleFormat();
      },
    }));

    // 初始化时格式化JSON
    useEffect(() => {
      if (parsedJSON) {
        setIsFormatting(true);

        const { text, lines: newLines } = formatJSONWithLines(
          parsedJSON,
          false,
        );
        setJsonText(text);
        setLines(newLines);
        setParseError(null);
        setJsonErrors([]);
        setIsUserEditing(false);
        setLastValidJson(parsedJSON);

        setHistory([text]);
        setHistoryIndex(0);

        const hasCollapsibleLines = newLines.some((line) => line.isCollapsible);
        setIsAllExpanded(hasCollapsibleLines && collapsedPaths.size === 0);

        setIsFormatting(false);
      }
    }, [parsedJSON]);

    // 当lastValidJson变化时，重新格式化行数据
    useEffect(() => {
      if (
        lastValidJson &&
        isUserEditing &&
        !isFormatting &&
        !isUpdatingFromCollapse &&
        !parseError
      ) {
        const { lines: newLines } = formatJSONWithLines(
          lastValidJson,
          false,
          collapsedPaths,
        );
        setLines(newLines);
      }
    }, [
      lastValidJson,
      isUserEditing,
      collapsedPaths,
      parseError,
      isFormatting,
      isUpdatingFromCollapse,
    ]);

    // 当折叠状态变化时，重新格式化行数据
    useEffect(() => {
      if (
        lastValidJson &&
        !isFormatting &&
        !isUpdatingFromCollapse &&
        !parseError
      ) {
        const { lines: newLines } = formatJSONWithLines(
          lastValidJson,
          false,
          collapsedPaths,
        );
        setLines(newLines);
      }
    }, [
      collapsedPaths,
      lastValidJson,
      isUpdatingFromCollapse,
      parseError,
      isFormatting,
    ]);

    return (
      <Card
        title={
          <Space>
            <Text strong>{title}</Text>
          </Space>
        }
        size="small"
        className={`${style.jsonText} ${className}`}
        style={{ height }}
        extra={
          <Space>
            <Tooltip title="JSON格式化">
              <span
                style={{
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500',
                }}
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
                onClick={handleCopyAll}
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
                  height: `${CONSTANTS.LINE_HEIGHT}px`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 4px',
                  fontSize: `${CONSTANTS.FONT_SIZE}px`,
                  lineHeight: `${CONSTANTS.LINE_HEIGHT}px`,
                }}
                onClick={() => {
                  if (line.isCollapsible) {
                    handleToggleCollapse(line.path);
                  }
                }}
              >
                <span style={{ fontSize: '11px' }}>{line.lineNumber}</span>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '2px' }}
                >
                  {utils.hasErrorOnLine(line.lineNumber, jsonErrors) && (
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
                color: parseError
                  ? CONSTANTS.ERROR_COLOR
                  : CONSTANTS.TEXT_COLOR,
                lineHeight: `${CONSTANTS.LINE_HEIGHT}px`,
                fontSize: `${CONSTANTS.FONT_SIZE}px`,
              }}
              placeholder="输入JSON数据..."
            />
          </div>
        </div>
      </Card>
    );
  },
);

export default JSONEditor;
export type { JSONEditorRef } from './type';
