import {
  CaretDownOutlined,
  CaretRightOutlined,
  CompressOutlined,
  CopyOutlined,
  ExpandOutlined,
  FileTextOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { Button, Card, Input, message, Space, Tooltip, Typography } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';

const { Text } = Typography;

export interface JSONNode {
  key: string;
  value: any;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  level: number;
  path: string;
  isCollapsible: boolean;
  children?: JSONNode[];
  parentKey?: string;
  propertyName?: string; // 新增：属性名称
  arrayIndex?: number; // 新增：数组索引
}

export interface JSONEditorProps {
  json: string | object;
  title?: string;
  showLineNumbers?: boolean;
  showCopyButton?: boolean;
  showExpandButton?: boolean;
  height?: string | number;
  className?: string;
  style?: React.CSSProperties;
  editable?: boolean;
  onJSONChange?: (newJSON: string) => void;
  onSave?: (json: string) => void;
  readOnly?: boolean;
}

const JSONEditor: React.FC<JSONEditorProps> = ({
  json: initialJSON,
  title = 'JSON 编辑器',
  showLineNumbers = true,
  showCopyButton = true,
  showExpandButton = true,
  height = 'auto',
  className,
  style,
  editable = true,
  onJSONChange,
  onSave,
  readOnly = false,
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [isAllExpanded, setIsAllExpanded] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<Map<string, any>>(
    new Map(),
  );
  const [isEditing, setIsEditing] = useState(false);

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

  // 格式化JSON字符串
  const formatJSON = (obj: any, indent: number = 2): string => {
    return JSON.stringify(obj, null, indent);
  };

  // 当外部json变化时更新内部状态
  useEffect(() => {
    setEditingValues(new Map());
    setIsDirty(false);
    setParseError(null);
  }, [initialJSON]);

  // 构建JSON节点树
  const jsonNodes = useMemo(() => {
    if (!parsedJSON) return [];

    const buildNodes = (
      obj: any,
      level: number = 0,
      path: string = '',
      parentKey: string = '',
      propertyName?: string,
      arrayIndex?: number,
    ): JSONNode[] => {
      const nodes: JSONNode[] = [];

      if (Array.isArray(obj)) {
        // 数组节点
        const arrayNode: JSONNode = {
          key: `array_${path}`,
          value: obj,
          type: 'array',
          level,
          path,
          isCollapsible: obj.length > 0,
          children: [],
          parentKey,
          propertyName,
          arrayIndex,
        };

        obj.forEach((item, index) => {
          const childPath = path ? `${path}[${index}]` : `[${index}]`;
          const childKey = `item_${childPath}`;

          if (typeof item === 'object' && item !== null) {
            const childNodes = buildNodes(
              item,
              level + 1,
              childPath,
              arrayNode.key,
              undefined,
              index,
            );
            arrayNode.children!.push(...childNodes);
          } else {
            arrayNode.children!.push({
              key: childKey,
              value: item,
              type: typeof item as any,
              level: level + 1,
              path: childPath,
              isCollapsible: false,
              parentKey: arrayNode.key,
              propertyName: undefined,
              arrayIndex: index,
            });
          }
        });

        nodes.push(arrayNode);
      } else if (typeof obj === 'object' && obj !== null) {
        // 对象节点
        const objectNode: JSONNode = {
          key: `object_${path}`,
          value: obj,
          type: 'object',
          level,
          path,
          isCollapsible: Object.keys(obj).length > 0,
          children: [],
          parentKey,
          propertyName,
          arrayIndex,
        };

        Object.entries(obj).forEach(([key, value]) => {
          const childPath = path ? `${path}.${key}` : key;
          const childKey = `property_${childPath}`;

          if (typeof value === 'object' && value !== null) {
            const childNodes = buildNodes(
              value,
              level + 1,
              childPath,
              objectNode.key,
              key,
            );
            objectNode.children!.push(...childNodes);
          } else {
            objectNode.children!.push({
              key: childKey,
              value,
              type: typeof value as any,
              level: level + 1,
              path: childPath,
              isCollapsible: false,
              parentKey: objectNode.key,
              propertyName: key,
              arrayIndex: undefined,
            });
          }
        });

        nodes.push(objectNode);
      } else {
        // 基本类型节点
        nodes.push({
          key: `value_${path}`,
          value: obj,
          type: typeof obj as any,
          level,
          path,
          isCollapsible: false,
          parentKey,
          propertyName,
          arrayIndex,
        });
      }

      return nodes;
    };

    return buildNodes(parsedJSON);
  }, [parsedJSON]);

  // 复制JSON
  const handleCopy = async () => {
    try {
      const jsonToCopy = formatJSON(parsedJSON);
      await navigator.clipboard.writeText(jsonToCopy);
      message.success('JSON已复制到剪贴板');
    } catch (err) {
      console.error('复制失败:', err);
      message.error('复制失败');
    }
  };

  // 展开/折叠所有
  const handleToggleAll = () => {
    if (isAllExpanded) {
      setExpandedNodes(new Set());
      setIsAllExpanded(false);
    } else {
      const allNodeKeys = new Set<string>();
      const collectNodeKeys = (nodes: JSONNode[]) => {
        nodes.forEach((node) => {
          if (node.isCollapsible) {
            allNodeKeys.add(node.key);
          }
          if (node.children && node.children.length > 0) {
            collectNodeKeys(node.children);
          }
        });
      };
      collectNodeKeys(jsonNodes);
      setExpandedNodes(allNodeKeys);
      setIsAllExpanded(true);
    }
  };

  // 展开/折叠单个节点
  const handleToggleNode = (nodeKey: string) => {
    const newExpandedNodes = new Set(expandedNodes);
    if (newExpandedNodes.has(nodeKey)) {
      newExpandedNodes.delete(nodeKey);
    } else {
      newExpandedNodes.add(nodeKey);
    }
    setExpandedNodes(newExpandedNodes);
  };

  // 根据编辑值更新JSON
  const updateJSONWithChanges = (obj: any, changes: Map<string, any>): any => {
    if (Array.isArray(obj)) {
      return obj.map((item, index) => {
        const path = `[${index}]`;
        const changeKey = `item_${path}`;

        if (changes.has(changeKey)) {
          return changes.get(changeKey);
        }

        if (typeof item === 'object' && item !== null) {
          return updateJSONWithChanges(item, changes);
        }

        return item;
      });
    } else if (typeof obj === 'object' && obj !== null) {
      const updated = { ...obj };

      Object.keys(obj).forEach((key) => {
        const value = obj[key];
        const path = key;
        const changeKey = `property_${path}`;

        if (changes.has(changeKey)) {
          updated[key] = changes.get(changeKey);
        } else if (typeof value === 'object' && value !== null) {
          updated[key] = updateJSONWithChanges(value, changes);
        }
      });

      return updated;
    }

    return obj;
  };

  // 保存编辑
  const handleSave = () => {
    try {
      const updatedJSON = updateJSONWithChanges(parsedJSON, editingValues);
      const jsonString = formatJSON(updatedJSON);

      if (onSave) {
        onSave(jsonString);
      }
      if (onJSONChange) {
        onJSONChange(jsonString);
      }

      setEditingValues(new Map());
      setIsDirty(false);
      setParseError(null);
      message.success('JSON已保存');
    } catch (error) {
      setParseError(error instanceof Error ? error.message : 'JSON格式错误');
      message.error('JSON格式错误，请检查语法');
    }
  };

  // 处理值编辑
  const handleValueEdit = (node: JSONNode, newValue: any) => {
    const newEditingValues = new Map(editingValues);
    newEditingValues.set(node.key, newValue);
    setEditingValues(newEditingValues);
    setIsDirty(true);
    setIsEditing(true);

    // 实时更新JSON
    try {
      const updatedJSON = updateJSONWithChanges(parsedJSON, newEditingValues);
      if (onJSONChange) {
        onJSONChange(formatJSON(updatedJSON));
      }
    } catch (error) {
      // 忽略实时更新时的错误
    }
  };

  // 处理键盘快捷键
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  // 获取值的显示文本
  const getValueDisplay = (node: JSONNode): string => {
    const editingValue = editingValues.get(node.key);
    const displayValue = editingValue !== undefined ? editingValue : node.value;

    switch (node.type) {
      case 'string':
        return `"${displayValue}"`;
      case 'number':
        return displayValue.toString();
      case 'boolean':
        return displayValue.toString();
      case 'null':
        return 'null';
      case 'object':
        return `{${Object.keys(displayValue).length} 个属性}`;
      case 'array':
        return `[${displayValue.length} 个元素]`;
      default:
        return String(displayValue);
    }
  };

  // 获取节点类型颜色
  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'string':
        return '#28a745';
      case 'number':
        return '#007bff';
      case 'boolean':
        return '#fd7e14';
      case 'null':
        return '#6c757d';
      case 'object':
        return '#6f42c1';
      case 'array':
        return '#e83e8c';
      default:
        return '#6c757d';
    }
  };

  // 渲染可编辑的值
  const renderEditableValue = (node: JSONNode) => {
    if (!editable || readOnly || node.isCollapsible) {
      return (
        <span
          style={{
            flex: 1,
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
            fontSize: '13px',
            lineHeight: '1.5',
            color: getTypeColor(node.type),
            fontWeight: node.type === 'string' ? 'normal' : '500',
          }}
        >
          {getValueDisplay(node)}
        </span>
      );
    }

    const editingValue = editingValues.get(node.key);
    const currentValue = editingValue !== undefined ? editingValue : node.value;

    if (node.type === 'string') {
      return (
        <Input
          value={currentValue}
          onChange={(e) => handleValueEdit(node, e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1,
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
            fontSize: '13px',
            border: '1px solid #ced4da',
            borderRadius: '3px',
            padding: '2px 6px',
            color: getTypeColor(node.type),
          }}
          size="small"
        />
      );
    } else if (node.type === 'number') {
      return (
        <Input
          type="number"
          value={currentValue}
          onChange={(e) =>
            handleValueEdit(node, parseFloat(e.target.value) || 0)
          }
          onKeyDown={handleKeyDown}
          style={{
            flex: 1,
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
            fontSize: '13px',
            border: '1px solid #ced4da',
            borderRadius: '3px',
            padding: '2px 6px',
            color: getTypeColor(node.type),
          }}
          size="small"
        />
      );
    } else if (node.type === 'boolean') {
      return (
        <select
          value={currentValue.toString()}
          onChange={(e) => handleValueEdit(node, e.target.value === 'true')}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1,
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
            fontSize: '13px',
            border: '1px solid #ced4da',
            borderRadius: '3px',
            padding: '2px 6px',
            backgroundColor: '#ffffff',
            color: getTypeColor(node.type),
          }}
        >
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      );
    } else {
      return (
        <span
          style={{
            flex: 1,
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
            fontSize: '13px',
            lineHeight: '1.5',
            color: getTypeColor(node.type),
          }}
        >
          {getValueDisplay(node)}
        </span>
      );
    }
  };

  // 渲染JSON节点
  const renderJSONNode = (node: JSONNode, index: number): React.ReactNode => {
    const isExpanded = expandedNodes.has(node.key);
    const hasChildren = node.children && node.children.length > 0;
    const isCollapsible = node.isCollapsible;
    const isEditingThisNode = editingValues.has(node.key);

    return (
      <div key={node.key} style={{ marginLeft: node.level * 20 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '6px 8px',
            cursor: isCollapsible ? 'pointer' : 'default',
            backgroundColor: isEditingThisNode
              ? '#e3f2fd'
              : isCollapsible
              ? '#f8f9fa'
              : 'transparent',
            borderLeft: isCollapsible ? '3px solid #0d6efd' : 'none',
            borderRadius: '4px',
            marginBottom: '2px',
            transition: 'all 0.2s ease',
            minHeight: '28px',
          }}
          onClick={() => isCollapsible && handleToggleNode(node.key)}
          onMouseEnter={(e) => {
            if (isCollapsible) {
              e.currentTarget.style.backgroundColor = '#e9ecef';
            }
          }}
          onMouseLeave={(e) => {
            if (isCollapsible) {
              e.currentTarget.style.backgroundColor = isEditingThisNode
                ? '#e3f2fd'
                : '#f8f9fa';
            }
          }}
        >
          {/* 折叠图标 */}
          {isCollapsible && (
            <span
              style={{ marginRight: 8, color: '#0d6efd', fontSize: '12px' }}
            >
              {isExpanded ? <CaretDownOutlined /> : <CaretRightOutlined />}
            </span>
          )}

          {/* 行号 */}
          {showLineNumbers && (
            <span
              style={{
                color: '#6c757d',
                fontSize: '11px',
                minWidth: '30px',
                textAlign: 'right',
                marginRight: '12px',
                userSelect: 'none',
                fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
              }}
            >
              {index + 1}
            </span>
          )}

          {/* 缩进 */}
          <span style={{ width: node.level * 16 }} />

          {/* 键名（如果是对象属性） */}
          {node.propertyName && (
            <span
              style={{
                color: '#212529',
                fontWeight: '600',
                marginRight: '8px',
                fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                fontSize: '13px',
                minWidth: 'fit-content',
              }}
            >
              &quot;{node.propertyName}&quot;:
            </span>
          )}

          {/* 数组索引（如果是数组元素） */}
          {node.arrayIndex !== undefined && (
            <span
              style={{
                color: '#6c757d',
                fontWeight: '500',
                marginRight: '8px',
                fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                fontSize: '12px',
                minWidth: 'fit-content',
              }}
            >
              [{node.arrayIndex}]:
            </span>
          )}

          {/* 可编辑的值 */}
          {renderEditableValue(node)}
        </div>

        {/* 子节点 */}
        {hasChildren && isExpanded && (
          <div>
            {node.children!.map((child, childIndex) =>
              renderJSONNode(child, childIndex),
            )}
          </div>
        )}

        {/* 折叠提示 */}
        {hasChildren && !isExpanded && (
          <div
            style={{
              padding: '4px 8px',
              marginLeft: 20,
              color: '#6c757d',
              fontSize: '11px',
              fontStyle: 'italic',
              backgroundColor: '#e9ecef',
              borderRadius: '4px',
              cursor: 'pointer',
              marginBottom: '4px',
              fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
            }}
            onClick={() => handleToggleNode(node.key)}
          >
            ... {node.children!.length} 个
            {node.type === 'object' ? '属性' : '元素'}已折叠
          </div>
        )}
      </div>
    );
  };

  // 渲染查看模式
  const renderViewMode = () => {
    if (parseError) {
      return (
        <div style={{ padding: '16px' }}>
          <div
            style={{
              padding: '12px',
              backgroundColor: '#f8d7da',
              color: '#721c24',
              borderRadius: '6px',
              border: '1px solid #f5c6cb',
            }}
          >
            <Text strong>JSON 解析错误:</Text> {parseError}
          </div>
        </div>
      );
    }

    return (
      <div
        style={{
          backgroundColor: '#ffffff',
          color: '#212529',
          borderRadius: '6px',
          overflow: 'auto',
          padding: '8px 0',
          fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
        }}
      >
        {jsonNodes.map((node, index) => renderJSONNode(node, index))}
      </div>
    );
  };

  return (
    <Card
      title={
        <Space>
          <FileTextOutlined style={{ color: '#0d6efd' }} />
          <Text strong>{title}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            JSON
          </Text>
          {isEditing && (
            <Text type="warning" style={{ fontSize: '12px' }}>
              [编辑中]
            </Text>
          )}
          {isDirty && (
            <Text type="warning" style={{ fontSize: '12px' }}>
              (已修改)
            </Text>
          )}
        </Space>
      }
      size="small"
      className={className}
      style={{
        ...style,
        height,
        overflow: 'auto',
        backgroundColor: '#ffffff',
        border: '1px solid #dee2e6',
      }}
      extra={
        <Space>
          {isDirty && (
            <Tooltip title="保存 (Ctrl+S)">
              <Button
                type="primary"
                size="small"
                icon={<SaveOutlined />}
                onClick={handleSave}
                disabled={readOnly}
              >
                保存
              </Button>
            </Tooltip>
          )}
          {showExpandButton && (
            <Tooltip title={isAllExpanded ? '折叠所有' : '展开所有'}>
              <Button
                type="text"
                size="small"
                icon={isAllExpanded ? <CompressOutlined /> : <ExpandOutlined />}
                onClick={handleToggleAll}
              />
            </Tooltip>
          )}
          {showCopyButton && (
            <Tooltip title="复制JSON">
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={handleCopy}
              />
            </Tooltip>
          )}
        </Space>
      }
      bodyStyle={{
        padding: 0,
        backgroundColor: '#ffffff',
      }}
    >
      {renderViewMode()}
    </Card>
  );
};

export default JSONEditor;
