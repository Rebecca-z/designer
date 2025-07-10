// card-designer-main.tsx - 完整的主设计器组件

import {
  CodeOutlined,
  CopyOutlined,
  EyeOutlined,
  FolderOpenOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  RedoOutlined,
  SaveOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import {
  Button,
  Divider,
  message,
  Modal,
  Space,
  Tooltip,
  Typography,
} from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Canvas from './card-designer-canvas';
import ComponentRenderer from './card-designer-components';
import { DEFAULT_DESIGN_DATA, DEVICE_SIZES } from './card-designer-constants';
import { ComponentPanel, PropertyPanel } from './card-designer-panels';
import { ComponentType, DesignData, Variable } from './card-designer-types';
import {
  exportToJSON,
  generateId,
  generatePreviewHTML,
  importFromJSON,
} from './card-designer-utils';
import ErrorBoundary from './ErrorBoundary';

const { Text } = Typography;

// 工具函数：根据路径更新组件
const updateComponentByPath = (
  data: DesignData,
  path: (string | number)[],
  updatedComponent: ComponentType,
): DesignData => {
  const newData = JSON.parse(JSON.stringify(data));
  let current = newData;

  for (let i = 0; i < path.length - 1; i++) {
    current = current[path[i]];
  }

  const lastKey = path[path.length - 1];
  current[lastKey] = updatedComponent;

  return newData;
};

// 工具函数：根据路径获取组件
const getComponentByPath = (
  data: DesignData,
  path: (string | number)[],
): ComponentType | null => {
  let current: any = data;

  for (const key of path) {
    if (current && current[key] !== undefined) {
      current = current[key];
    } else {
      return null;
    }
  }

  return current;
};

// 检查元素是否为输入类型
const isInputElement = (element: Element | null): boolean => {
  if (!element) return false;

  const tagName = element.tagName.toLowerCase();
  const inputTypes = ['input', 'textarea', 'select'];

  if (inputTypes.includes(tagName)) return true;
  if (element.getAttribute('contenteditable') === 'true') return true;

  const closestInput = element.closest(
    'input, textarea, select, [contenteditable="true"]',
  );
  return !!closestInput;
};

// 检查是否在属性面板内
const isInPropertyPanel = (element: Element | null): boolean => {
  if (!element) return false;

  const propertyPanel =
    element.closest('[data-panel="property"]') ||
    element.closest('.ant-tabs-tabpane') ||
    element.closest('.ant-form-item') ||
    element.closest('.ant-input') ||
    element.closest('.ant-select') ||
    element.closest('.ant-color-picker') ||
    element.closest('.ant-input-number') ||
    element.closest('.ant-switch') ||
    element.closest('.ant-upload');

  return !!propertyPanel;
};

const CardDesigner: React.FC = () => {
  // 基础状态
  const [device, setDevice] = useState<keyof typeof DEVICE_SIZES>('desktop');
  const [data, setData] = useState<DesignData>(DEFAULT_DESIGN_DATA);
  const [selectedComponent, setSelectedComponent] =
    useState<ComponentType | null>(null);
  const [selectedPath, setSelectedPath] = useState<(string | number)[] | null>(
    null,
  );
  const [history, setHistory] = useState<DesignData[]>([DEFAULT_DESIGN_DATA]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [previewVisible, setPreviewVisible] = useState<boolean>(false);
  const [variables, setVariables] = useState<Variable[]>([]);
  const [clipboard, setClipboard] = useState<ComponentType | null>(null);
  // const [isLoading, setIsLoading] = useState<boolean>(false);

  // 焦点状态管理
  const [canvasFocused, setCanvasFocused] = useState<boolean>(false);
  const canvasRef = useRef<boolean>(false);

  // 更新数据并记录历史
  const updateData = useCallback(
    (newData: DesignData) => {
      setData(newData);
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newData);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    },
    [history, historyIndex],
  );

  // 撤销操作
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setData(history[historyIndex - 1]);
      setSelectedComponent(null);
      setSelectedPath(null);
      message.success('撤销成功');
    }
  }, [historyIndex, history]);

  // 重做操作
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setData(history[historyIndex + 1]);
      setSelectedComponent(null);
      setSelectedPath(null);
      message.success('重做成功');
    }
  }, [historyIndex, history]);

  // 选择组件
  const selectComponent = useCallback(
    (component: ComponentType | null, path?: (string | number)[]) => {
      setSelectedComponent(component);
      setSelectedPath(path || null);
    },
    [],
  );

  // 画布获得焦点的回调
  const handleCanvasFocus = useCallback(() => {
    setCanvasFocused(true);
    canvasRef.current = true;
  }, []);

  // 画布失去焦点的回调
  const handleCanvasBlur = useCallback(() => {
    setCanvasFocused(false);
    canvasRef.current = false;
  }, []);

  // 智能删除组件逻辑
  const smartDeleteComponent = useCallback(
    (path: (string | number)[]) => {
      const activeElement = document.activeElement;
      const isInputFocused = isInputElement(activeElement);
      const isInPropertyPanelArea = isInPropertyPanel(activeElement);

      if (isInputFocused && isInPropertyPanelArea) {
        console.log('阻止删除：焦点在属性面板的输入框内');
        return false;
      }

      if (!canvasRef.current) {
        console.log('阻止删除：画布没有焦点');
        return false;
      }

      const newData = JSON.parse(JSON.stringify(data));
      let current = newData;

      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }

      const lastKey = path[path.length - 1];
      if (Array.isArray(current)) {
        current.splice(lastKey as number, 1);
      } else {
        delete current[lastKey];
      }

      updateData(newData);
      setSelectedComponent(null);
      setSelectedPath(null);
      message.success('组件已删除');
      return true;
    },
    [data, updateData],
  );

  // 普通删除组件
  const deleteComponent = useCallback(
    (path: (string | number)[]) => {
      const newData = JSON.parse(JSON.stringify(data));
      let current = newData;

      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }

      const lastKey = path[path.length - 1];
      if (Array.isArray(current)) {
        current.splice(lastKey as number, 1);
      } else {
        delete current[lastKey];
      }

      updateData(newData);
      setSelectedComponent(null);
      setSelectedPath(null);
      message.success('组件已删除');
    },
    [data, updateData],
  );

  // 复制组件
  const copyComponent = useCallback((component: ComponentType) => {
    const copied = { ...component, id: generateId() };
    setClipboard(copied);
    message.success('组件已复制到剪贴板');
  }, []);

  // 粘贴组件
  const pasteComponent = useCallback(() => {
    if (clipboard) {
      const newClipboard = { ...clipboard, id: generateId() };
      const newData = {
        ...data,
        elements: [...data.elements, newClipboard],
      };
      updateData(newData);
      message.success('组件已粘贴');
    }
  }, [clipboard, data, updateData]);

  // 更新选中的组件
  const updateSelectedComponent = useCallback(
    (updatedComponent: ComponentType) => {
      if (selectedPath) {
        const newData = updateComponentByPath(
          data,
          selectedPath,
          updatedComponent,
        );
        updateData(newData);
        setSelectedComponent(updatedComponent);
      }
    },
    [selectedPath, data, updateData],
  );

  // 实时同步选中组件的数据
  useEffect(() => {
    if (selectedPath) {
      const currentComponent = getComponentByPath(data, selectedPath);
      if (currentComponent && currentComponent.id === selectedComponent?.id) {
        setSelectedComponent(currentComponent);
      } else {
        setSelectedComponent(null);
        setSelectedPath(null);
      }
    }
  }, [data, selectedPath, selectedComponent?.id]);

  // 导出配置
  const exportConfig = useCallback(() => {
    const config = exportToJSON(data);
    const blob = new Blob([config], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `card-config-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('配置已导出');
  }, [data]);

  // 导入配置
  const importConfig = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const jsonData = importFromJSON(e.target?.result as string);
            if (jsonData) {
              updateData(jsonData);
              message.success('配置已导入');
            } else {
              message.error('配置文件格式错误');
            }
          } catch (error) {
            message.error('配置文件解析失败');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, [updateData]);

  // 保存配置到本地存储
  const saveConfig = useCallback(() => {
    try {
      const config = exportToJSON(data);
      localStorage.setItem('card-designer-config', config);
      localStorage.setItem(
        'card-designer-variables',
        JSON.stringify(variables),
      );
      message.success('配置已保存到本地');
    } catch (error) {
      message.error('保存失败');
    }
  }, [data, variables]);

  // 从本地存储加载配置
  const loadConfig = useCallback(() => {
    try {
      const config = localStorage.getItem('card-designer-config');
      const savedVariables = localStorage.getItem('card-designer-variables');

      if (config) {
        const parsedConfig = importFromJSON(config);
        if (parsedConfig) {
          updateData(parsedConfig);
        }
      }

      if (savedVariables) {
        setVariables(JSON.parse(savedVariables));
      }

      message.success('配置已加载');
    } catch (error) {
      message.error('加载失败');
    }
  }, [updateData]);

  // 清空画布
  const clearCanvas = useCallback(() => {
    Modal.confirm({
      title: '确认清空',
      content: '确定要清空画布吗？此操作不可撤销。',
      onOk: () => {
        updateData(DEFAULT_DESIGN_DATA);
        setSelectedComponent(null);
        setSelectedPath(null);
        setVariables([]);
        message.success('画布已清空');
      },
    });
  }, [updateData]);

  // 监听全局点击事件
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as Element;
      const canvasElement = document.querySelector('[data-canvas="true"]');
      const isCanvasClick = canvasElement?.contains(target);

      if (!isCanvasClick) {
        handleCanvasBlur();
      }
    };

    document.addEventListener('click', handleGlobalClick);
    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [handleCanvasBlur]);

  // 智能快捷键处理
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputFocused = isInputElement(activeElement);
      const isInPropertyPanelArea = isInPropertyPanel(activeElement);

      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            e.preventDefault();
            undo();
            break;
          case 'y':
            e.preventDefault();
            redo();
            break;
          case 'c':
            if (selectedComponent && canvasRef.current) {
              e.preventDefault();
              copyComponent(selectedComponent);
            }
            break;
          case 'v':
            if (clipboard && canvasRef.current) {
              e.preventDefault();
              pasteComponent();
            }
            break;
          case 's':
            e.preventDefault();
            saveConfig();
            break;
          case 'o':
            e.preventDefault();
            loadConfig();
            break;
        }
      }

      // 智能删除逻辑
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedComponent && selectedPath) {
          if (isInputFocused && isInPropertyPanelArea) {
            return; // 允许正常的输入框删除行为
          }

          if (!canvasRef.current) {
            return;
          }

          e.preventDefault();
          smartDeleteComponent(selectedPath);
        }
      }
    },
    [
      selectedComponent,
      selectedPath,
      clipboard,
      undo,
      redo,
      copyComponent,
      pasteComponent,
      saveConfig,
      loadConfig,
      smartDeleteComponent,
    ],
  );

  // 绑定快捷键
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div
        style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* 顶部工具栏 */}
        <div
          style={{
            height: '60px',
            backgroundColor: '#fff',
            borderBottom: '1px solid #d9d9d9',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            justifyContent: 'space-between',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <Space>
            {/* 设备切换 */}
            <Space>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                设备:
              </Text>
              {Object.entries(DEVICE_SIZES).map(([key, config]) => (
                <Tooltip key={key} title={config.name}>
                  <Button
                    type={device === key ? 'primary' : 'default'}
                    icon={<config.icon />}
                    onClick={() => setDevice(key as keyof typeof DEVICE_SIZES)}
                    size="small"
                  />
                </Tooltip>
              ))}
            </Space>

            <Divider type="vertical" />

            {/* 历史操作 */}
            <Space>
              <Tooltip title="撤销 (Ctrl+Z)">
                <Button
                  icon={<UndoOutlined />}
                  onClick={undo}
                  disabled={historyIndex <= 0}
                  size="small"
                />
              </Tooltip>
              <Tooltip title="重做 (Ctrl+Y)">
                <Button
                  icon={<RedoOutlined />}
                  onClick={redo}
                  disabled={historyIndex >= history.length - 1}
                  size="small"
                />
              </Tooltip>
            </Space>

            <Divider type="vertical" />

            {/* 编辑操作 */}
            <Space>
              <Tooltip title="复制 (Ctrl+C)">
                <Button
                  icon={<CopyOutlined />}
                  onClick={() =>
                    selectedComponent && copyComponent(selectedComponent)
                  }
                  disabled={!selectedComponent}
                  size="small"
                />
              </Tooltip>
              <Tooltip title="粘贴 (Ctrl+V)">
                <Button
                  icon={<PlusOutlined />}
                  onClick={pasteComponent}
                  disabled={!clipboard}
                  size="small"
                />
              </Tooltip>
            </Space>

            <Divider type="vertical" />

            {/* 文件操作 */}
            <Space>
              <Tooltip title="保存 (Ctrl+S)">
                <Button
                  icon={<SaveOutlined />}
                  onClick={saveConfig}
                  size="small"
                />
              </Tooltip>
              <Tooltip title="加载 (Ctrl+O)">
                <Button
                  icon={<FolderOpenOutlined />}
                  onClick={loadConfig}
                  size="small"
                />
              </Tooltip>
            </Space>
          </Space>

          <Space>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              组件数量: {data.elements.length} | 变量数量: {variables.length}
              {canvasFocused && (
                <span style={{ color: '#52c41a' }}> | 画布已聚焦</span>
              )}
            </Text>

            <Divider type="vertical" />

            <Button
              icon={<EyeOutlined />}
              onClick={() => setPreviewVisible(true)}
              size="small"
            >
              在线预览
            </Button>

            <Button
              type="primary"
              icon={<CodeOutlined />}
              onClick={exportConfig}
              size="small"
            >
              导出配置
            </Button>

            <Button
              icon={<QuestionCircleOutlined />}
              onClick={() => {
                Modal.info({
                  title: '快捷键说明',
                  content: (
                    <div>
                      <p>
                        <strong>Ctrl+Z:</strong> 撤销
                      </p>
                      <p>
                        <strong>Ctrl+Y:</strong> 重做
                      </p>
                      <p>
                        <strong>Ctrl+C:</strong> 复制选中组件
                      </p>
                      <p>
                        <strong>Ctrl+V:</strong> 粘贴组件
                      </p>
                      <p>
                        <strong>Ctrl+S:</strong> 保存配置
                      </p>
                      <p>
                        <strong>Ctrl+O:</strong> 加载配置
                      </p>
                      <p>
                        <strong>Delete/Backspace:</strong> 智能删除选中组件
                      </p>
                      <div
                        style={{
                          marginTop: '12px',
                          padding: '8px',
                          backgroundColor: '#f6ffed',
                          border: '1px solid #b7eb8f',
                          borderRadius: '4px',
                        }}
                      >
                        <strong>智能删除说明：</strong>
                        <br />• 只有在画布获得焦点且选中组件时才能删除
                        <br />• 在属性面板输入框编辑时不会误删组件
                        <br />• 确保删除操作的安全性和准确性
                      </div>
                    </div>
                  ),
                });
              }}
              size="small"
            />
          </Space>
        </div>

        {/* 主体区域 */}
        <div style={{ flex: 1, display: 'flex' }}>
          {/* 左侧组件面板 */}
          <ComponentPanel />

          {/* 中间画布 */}
          <div style={{ flex: 1 }}>
            <div data-canvas="true" style={{ height: '100%' }}>
              <Canvas
                data={data}
                onDataChange={updateData}
                selectedComponent={selectedComponent}
                selectedPath={selectedPath}
                onSelectComponent={selectComponent}
                onDeleteComponent={deleteComponent}
                onCopyComponent={copyComponent}
                device={device}
                onCanvasFocus={handleCanvasFocus}
              />
            </div>
          </div>

          {/* 右侧属性面板 */}
          <div data-panel="property" style={{ width: '300px' }}>
            <PropertyPanel
              selectedComponent={selectedComponent}
              onUpdateComponent={updateSelectedComponent}
              variables={variables}
              onUpdateVariables={setVariables}
            />
          </div>
        </div>

        {/* 预览模态框 */}
        <Modal
          title={
            <Space>
              <EyeOutlined />
              预览效果
              <Text type="secondary">({DEVICE_SIZES[device].name})</Text>
            </Space>
          }
          visible={previewVisible}
          onCancel={() => setPreviewVisible(false)}
          width={
            device === 'desktop'
              ? '90%'
              : device === 'tablet'
              ? '800px'
              : '420px'
          }
          footer={[
            <Button
              key="export"
              onClick={() => {
                const html = generatePreviewHTML(data);
                const blob = new Blob([html], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'card-preview.html';
                a.click();
                URL.revokeObjectURL(url);
                message.success('预览HTML已导出');
              }}
            >
              导出HTML
            </Button>,
            <Button key="close" onClick={() => setPreviewVisible(false)}>
              关闭
            </Button>,
          ]}
          centered
        >
          <div
            style={{
              padding: '20px',
              backgroundColor: '#f5f5f5',
              minHeight: '500px',
              maxHeight: '70vh',
              overflow: 'auto',
            }}
          >
            {/* 预览工具栏 */}
            <div
              style={{
                marginBottom: '16px',
                padding: '8px 12px',
                backgroundColor: '#fff',
                borderRadius: '6px',
                border: '1px solid #e8e8e8',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Space>
                <Text strong style={{ fontSize: '12px' }}>
                  预览模式
                </Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {DEVICE_SIZES[device].name} ({DEVICE_SIZES[device].width})
                </Text>
              </Space>
              <Space>
                <Button size="small" onClick={clearCanvas}>
                  清空画布
                </Button>
                <Button size="small" onClick={importConfig}>
                  导入配置
                </Button>
              </Space>
            </div>

            {/* 预览内容 */}
            <div
              style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                width:
                  device === 'desktop' ? '100%' : DEVICE_SIZES[device].width,
                margin: '0 auto',
              }}
            >
              {data.elements.map((component, index) => {
                if (!component) {
                  return (
                    <ErrorBoundary key={`preview-error-${index}`}>
                      <div
                        style={{
                          padding: '16px',
                          border: '1px dashed #faad14',
                          borderRadius: '4px',
                          textAlign: 'center',
                          color: '#faad14',
                          backgroundColor: '#fffbe6',
                          margin: '4px',
                        }}
                      >
                        ⚠️ 预览组件数据异常
                      </div>
                    </ErrorBoundary>
                  );
                }

                return (
                  <ErrorBoundary key={component.id || `preview-${index}`}>
                    <ComponentRenderer
                      component={component}
                      onSelect={() => {}}
                      isSelected={false}
                      selectedComponent={null}
                      selectedPath={null}
                      onUpdate={() => {}}
                      onDelete={() => {}}
                      onCopy={() => {}}
                      path={['elements', index]}
                      isPreview={true}
                    />
                  </ErrorBoundary>
                );
              })}
              {data.elements.length === 0 && (
                <div
                  style={{
                    textAlign: 'center',
                    color: '#999',
                    padding: '60px 0',
                    border: '2px dashed #d9d9d9',
                    borderRadius: '8px',
                  }}
                >
                  <Text type="secondary">暂无内容，请在设计器中添加组件</Text>
                </div>
              )}
            </div>

            {/* 配置信息 */}
            <div
              style={{
                marginTop: '16px',
                padding: '12px',
                backgroundColor: '#fff',
                borderRadius: '6px',
                border: '1px solid #e8e8e8',
              }}
            >
              <Text strong style={{ fontSize: '12px' }}>
                配置信息
              </Text>
              <div
                style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}
              >
                <p>组件数量: {data.elements.length}</p>
                <p>变量数量: {variables.length}</p>
                <p>历史记录: {history.length} 条</p>
                <p>当前设备: {DEVICE_SIZES[device].name}</p>
                <p>画布焦点: {canvasFocused ? '已聚焦' : '未聚焦'}</p>
              </div>
            </div>
          </div>
        </Modal>

        {/* 全局加载状态 */}
        {false && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255,255,255,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
            }}
          >
            <div
              style={{
                textAlign: 'center',
                padding: '20px',
                backgroundColor: '#fff',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
            >
              <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                处理中...
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>请稍候</div>
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
};

export default CardDesigner;
