// card-designer-hooks.ts - 自定义Hooks

import { message } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ComponentType,
  DesignData,
  Variable,
} from './card-designer-types-updated';
import {
  convertToTargetFormat,
  ensureComponentIds,
  generateId,
  importFromJSON,
  migrateCardLink,
  migrateTitleStyle,
  normalizeCombinationModes,
} from './card-designer-utils';

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

// 历史管理Hook
export const useHistory = (initialData: DesignData) => {
  const [data, setData] = useState<DesignData>(initialData);
  const [history, setHistory] = useState<DesignData[]>([initialData]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

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

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setData(history[historyIndex - 1]);
      message.success('撤销成功');
      return true;
    }
    return false;
  }, [historyIndex, history]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setData(history[historyIndex + 1]);
      message.success('重做成功');
      return true;
    }
    return false;
  }, [historyIndex, history]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return {
    data,
    updateData,
    undo,
    redo,
    canUndo,
    canRedo,
    historyLength: history.length,
  };
};

// 组件选择Hook
export const useComponentSelection = () => {
  const [selectedComponent, setSelectedComponent] =
    useState<ComponentType | null>(null);
  const [selectedPath, setSelectedPath] = useState<(string | number)[] | null>(
    null,
  );

  const selectComponent = useCallback(
    (component: ComponentType | null, path?: (string | number)[]) => {
      console.log('🎯 selectComponent 被调用:', {
        componentId: component?.id,
        componentTag: component?.tag,
        path,
        pathLength: path?.length,
        isCard: path?.length === 2 && path[0] === 'dsl' && path[1] === 'body',
        timestamp: new Date().toISOString(),
        stack: new Error().stack?.split('\n').slice(1, 4).join('\n'),
      });

      // 直接更新状态，不使用防抖
      setSelectedComponent(component);
      setSelectedPath(path || null);

      console.log('✅ 选择状态已更新:', {
        newComponentId: component?.id,
        newPath: path || null,
        timestamp: new Date().toISOString(),
      });
    },
    [],
  );

  const clearSelection = useCallback(() => {
    console.log('🗑️ clearSelection 被调用:', {
      timestamp: new Date().toISOString(),
      stack: new Error().stack?.split('\n').slice(1, 4).join('\n'),
    });
    setSelectedComponent(null);
    setSelectedPath(null);
  }, []);

  // 监听选择状态变化
  useEffect(() => {
    console.log('🔄 选择状态变化:', {
      selectedComponent: selectedComponent?.id,
      selectedPath,
      timestamp: new Date().toISOString(),
    });
  }, [selectedComponent, selectedPath]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      // 清理工作
    };
  }, []);

  return {
    selectedComponent,
    selectedPath,
    selectComponent,
    clearSelection,
  };
};

// 大纲树Hook
export const useOutlineTree = () => {
  const [hoveredPath, setHoveredPath] = useState<(string | number)[] | null>(
    null,
  );

  const handleOutlineHover = useCallback((path: (string | number)[] | null) => {
    setHoveredPath(path);
  }, []);

  return {
    hoveredPath,
    handleOutlineHover,
  };
};

// 焦点管理Hook
export const useFocusManagement = () => {
  const [canvasFocused, setCanvasFocused] = useState<boolean>(false);
  const canvasRef = useRef<boolean>(false);

  const handleCanvasFocus = useCallback(() => {
    setCanvasFocused(true);
    canvasRef.current = true;
  }, []);

  const handleCanvasBlur = useCallback(() => {
    setCanvasFocused(false);
    canvasRef.current = false;
  }, []);

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

  return {
    canvasFocused,
    canvasRef,
    handleCanvasFocus,
    handleCanvasBlur,
  };
};

// 剪贴板Hook
export const useClipboard = () => {
  const [clipboard, setClipboard] = useState<ComponentType | null>(null);

  const copyComponent = useCallback((component: ComponentType) => {
    const copied = { ...component, id: generateId() };
    setClipboard(copied);
    message.success('组件已复制到剪贴板');
  }, []);

  const pasteComponent = useCallback(
    (data: DesignData, updateData: any) => {
      if (clipboard) {
        const newClipboard = { ...clipboard, id: generateId() };
        const newData = {
          ...data,
          elements: [...data.elements, newClipboard],
        };
        updateData(newData);
        message.success('组件已粘贴');
      }
    },
    [clipboard],
  );

  return {
    clipboard,
    copyComponent,
    pasteComponent,
  };
};

// 组件删除Hook
export const useComponentDeletion = () => {
  const smartDeleteComponent = useCallback(
    (
      path: (string | number)[],
      data: DesignData,
      updateData: any,
      canvasRef: any,
      clearSelection: any,
    ) => {
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
      clearSelection();
      message.success('组件已删除');
      return true;
    },
    [],
  );

  const deleteComponent = useCallback(
    (
      path: (string | number)[],
      data: DesignData,
      updateData: any,
      clearSelection: any,
    ) => {
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
      clearSelection();
      message.success('组件已删除');
    },
    [],
  );

  return {
    smartDeleteComponent,
    deleteComponent,
  };
};

// 组件更新Hook
export const useComponentUpdate = () => {
  const updateSelectedComponent = useCallback(
    (
      updatedComponent: ComponentType,
      selectedPath: (string | number)[] | null,
      data: DesignData,
      updateData: any,
    ) => {
      if (selectedPath) {
        const newData = updateComponentByPath(
          data,
          selectedPath,
          updatedComponent,
        );
        updateData(newData);
        return updatedComponent;
      }
      return null;
    },
    [],
  );

  // 实时同步选中组件的数据
  const syncSelectedComponent = useCallback(
    (
      selectedPath: (string | number)[] | null,
      selectedComponent: ComponentType | null,
      data: DesignData,
      clearSelection: any,
    ) => {
      if (selectedPath) {
        // 允许卡片选中路径通过，不清空
        if (
          selectedPath.length === 2 &&
          selectedPath[0] === 'dsl' &&
          selectedPath[1] === 'body'
        ) {
          return null;
        }
        const currentComponent = getComponentByPath(data, selectedPath);
        if (currentComponent && currentComponent.id === selectedComponent?.id) {
          return currentComponent;
        } else {
          clearSelection();
          return null;
        }
      }
      return selectedComponent;
    },
    [],
  );

  return {
    updateSelectedComponent,
    syncSelectedComponent,
  };
};

// 配置管理Hook
export const useConfigManagement = () => {
  const [exportModalVisible, setExportModalVisible] = useState<boolean>(false);
  const [importModalVisible, setImportModalVisible] = useState<boolean>(false);
  const [exportData, setExportData] = useState<string>('');

  const exportConfig = useCallback((data: any) => {
    try {
      const targetFormat = convertToTargetFormat(data);
      const exportJson = JSON.stringify(targetFormat, null, 2);
      setExportData(exportJson);
      setExportModalVisible(true);
    } catch (error) {
      message.error('导出配置失败');
      console.error('Export error:', error);
    }
  }, []);

  const downloadConfig = useCallback(() => {
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `card-config-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('配置已下载');
  }, [exportData]);

  const importConfig = useCallback(() => {
    setImportModalVisible(true);
  }, []);

  const handleFileUpload = useCallback((file: File, updateData: any) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonString = e.target?.result as string;
        const parsed = JSON.parse(jsonString);

        console.log('🔍 原始导入数据检查:', {
          parsed,
          hasDsl: !!parsed.dsl,
          hasHeader: !!(parsed.dsl && parsed.dsl.header),
          headerContent: parsed.dsl?.header,
        });

        // 检查是否是新格式的完整卡片数据
        if (
          parsed &&
          parsed.dsl &&
          parsed.dsl.body &&
          Array.isArray(parsed.dsl.body.elements)
        ) {
          console.log('✅ 检测到新格式完整卡片数据，直接使用');

          // 创建新的卡片数据，保留原始的header信息
          const newCardData: any = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2),
            name: parsed.name || '导入的卡片',
            dsl: {
              schema: parsed.dsl.schema || 0.1,
              config: parsed.dsl.config || {},
              card_link: parsed.dsl.card_link || {
                multi_url: {
                  url: '',
                  android_url: '',
                  ios_url: '',
                  pc_url: '',
                },
              },
              body: {
                direction: parsed.dsl.body.direction || 'vertical',
                vertical_spacing: parsed.dsl.body.vertical_spacing || 8,
                padding: parsed.dsl.body.padding || {
                  top: 16,
                  right: 16,
                  bottom: 16,
                  left: 16,
                },
                elements: parsed.dsl.body.elements || [],
              },
            },
            variables: parsed.variables || {},
          };

          // 如果原始数据包含header，则保留header
          if (parsed.dsl.header) {
            console.log('✅ 保留原始header数据:', parsed.dsl.header);
            newCardData.dsl.header = parsed.dsl.header;
          } else {
            console.log('❌ 原始数据无header，不创建header');
          }

          console.log('🔍 导入前元素检查:', {
            elementsCount: newCardData.dsl.body.elements.length,
            sampleElement: newCardData.dsl.body.elements[0],
            hasIds: newCardData.dsl.body.elements.map((el: any) => ({
              tag: el.tag,
              hasId: !!el.id,
            })),
          });

          // 确保所有组件都有ID
          newCardData.dsl.body.elements = ensureComponentIds(
            newCardData.dsl.body.elements,
          );

          console.log('✅ ID检查完成:', {
            elementsCount: newCardData.dsl.body.elements.length,
            sampleElement: newCardData.dsl.body.elements[0],
            allHaveIds: newCardData.dsl.body.elements.every(
              (el: any) => !!el.id,
            ),
          });

          // 处理多图混排组件的combination_mode
          newCardData.dsl.body.elements = normalizeCombinationModes(
            newCardData.dsl.body.elements,
          );

          console.log('✅ 新格式数据处理完成:', newCardData);

          // 进行数据迁移
          const migratedData = migrateTitleStyle(migrateCardLink(newCardData));
          updateData(migratedData);
          setImportModalVisible(false);
          message.success('配置导入成功');
          return;
        }

        // 处理旧格式数据
        const jsonData = importFromJSON(jsonString);
        if (jsonData) {
          // 检查原始数据是否包含header信息
          const jsonAny = jsonData as any;
          const hasHeaderData =
            jsonAny.header ||
            jsonAny.title ||
            jsonAny.subtitle ||
            (jsonAny.dsl && jsonAny.dsl.header);

          console.log('🔍 旧格式数据header检查:', {
            hasHeaderData,
            hasHeader: !!jsonAny.header,
            hasTitle: !!jsonAny.title,
            hasSubtitle: !!jsonAny.subtitle,
            hasDslHeader: !!(jsonAny.dsl && jsonAny.dsl.header),
            originalData: jsonData,
          });

          // 将旧格式数据转换为新格式的卡片数据
          const newCardData: any = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2),
            name: '导入的卡片',
            dsl: {
              schema: 0.1,
              config: {},
              card_link: {
                multi_url: {
                  url: '',
                  android_url: '',
                  ios_url: '',
                  pc_url: '',
                },
              },
              body: {
                direction: jsonData.direction || 'vertical',
                vertical_spacing: jsonData.vertical_spacing || 8,
                padding: {
                  top: 16,
                  right: 16,
                  bottom: 16,
                  left: 16,
                },
                elements: jsonData.elements || [],
              },
            },
            variables: {},
          };

          // 只有当原始数据包含header信息时才创建header
          if (hasHeaderData) {
            console.log('✅ 检测到旧格式header数据，创建header对象');
            newCardData.dsl.header = {
              style: 'blue', // 直接存储主题样式字符串
              title: {
                content: '标题',
                i18n_content: {
                  'en-US': 'Title',
                },
              },
              subtitle: {
                content: '副标题',
                i18n_content: {
                  'en-US': 'Subtitle',
                },
              },
            };
          } else {
            console.log('❌ 未检测到旧格式header数据，不创建header对象');
          }

          console.log('✅ 旧格式数据转换完成:', {
            originalFormat: jsonData,
            newCardFormat: newCardData,
          });

          // 进行数据迁移
          const migratedData = migrateTitleStyle(migrateCardLink(newCardData));
          updateData(migratedData);
          setImportModalVisible(false);
          message.success('配置导入成功');
        } else {
          message.error('配置文件格式错误');
        }
      } catch (error) {
        message.error('配置文件解析失败');
        console.error('Import error:', error);
      }
    };
    reader.readAsText(file);
    return false; // 阻止自动上传
  }, []);

  const saveConfig = useCallback((data: any, variables: Variable[]) => {
    try {
      const targetFormat = convertToTargetFormat(data);
      const configData = {
        ...targetFormat,
        variables,
      };
      const configJson = JSON.stringify(configData, null, 2);
      localStorage.setItem('cardDesignerConfig', configJson);
      message.success('配置已保存到本地存储');
    } catch (error) {
      message.error('保存配置失败');
      console.error('Save error:', error);
    }
  }, []);

  const loadConfig = useCallback((updateData: any, setVariables: any) => {
    try {
      const config = localStorage.getItem('cardDesignerConfig');
      if (config) {
        const parsedConfig = JSON.parse(config);

        // 检查是否是新的卡片格式
        if (parsedConfig.name && parsedConfig.dsl && parsedConfig.variables) {
          // 新格式：进行数据迁移后使用
          const migratedData = migrateTitleStyle(migrateCardLink(parsedConfig));
          updateData(migratedData);
          setVariables(migratedData.variables || []);
          message.success('配置已从本地存储加载');
        } else {
          // 旧格式：转换为新格式
          const jsonData = importFromJSON(config);
          if (jsonData) {
            const newCardData = {
              id:
                Date.now().toString(36) + Math.random().toString(36).substr(2),
              name: '导入的卡片',
              dsl: {
                schema: 0.1,
                config: {},
                card_link: {
                  multi_url: {
                    url: 'http://www.baidu.com',
                    android_url: 'http://www.baidu.com',
                    ios_url: 'http://www.baidu.com',
                    pc_url: 'http://www.baidu.com',
                  },
                },
                header: {
                  style: 'blue', // 直接存储主题样式字符串
                  title: {
                    content: '标题',
                    i18n_content: {
                      'en-US': 'Title',
                    },
                  },
                  subtitle: {
                    content: '副标题',
                    i18n_content: {
                      'en-US': 'Subtitle',
                    },
                  },
                },
                body: {
                  direction: jsonData.direction || 'vertical',
                  vertical_spacing: jsonData.vertical_spacing || 8,
                  padding: {
                    top: 16,
                    right: 16,
                    bottom: 16,
                    left: 16,
                  },
                  elements: jsonData.elements || [],
                },
              },
              variables: parsedConfig.variables || [],
            };
            updateData(newCardData);
            setVariables(parsedConfig.variables || []);
            message.success('旧格式配置已转换并加载');
          } else {
            message.error('配置文件格式错误');
          }
        }
      } else {
        message.warning('没有找到保存的配置');
      }
    } catch (error) {
      message.error('加载配置失败');
      console.error('Load error:', error);
    }
  }, []);

  return {
    exportModalVisible,
    setExportModalVisible,
    importModalVisible,
    setImportModalVisible,
    exportData,
    exportConfig,
    downloadConfig,
    importConfig,
    handleFileUpload,
    saveConfig,
    loadConfig,
  };
};

// 快捷键Hook
export const useKeyboardShortcuts = (handlers: {
  undo: () => boolean;
  redo: () => boolean;
  copyComponent: (component: ComponentType) => void;
  pasteComponent: () => void;
  saveConfig: () => void;
  loadConfig: () => void;
  smartDeleteComponent: (path: (string | number)[]) => boolean;
  selectedComponent: ComponentType | null;
  selectedPath: (string | number)[] | null;
  clipboard: ComponentType | null;
  canvasRef: any;
}) => {
  const {
    undo,
    redo,
    copyComponent,
    pasteComponent,
    saveConfig,
    loadConfig,
    smartDeleteComponent,
    selectedComponent,
    selectedPath,
    clipboard,
    canvasRef,
  } = handlers;

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
      canvasRef,
    ],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};
