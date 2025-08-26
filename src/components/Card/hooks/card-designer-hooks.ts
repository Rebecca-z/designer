// card-designer-hooks.ts - 自定义Hooks

import { message } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ComponentType, DesignData, Variable } from '../type';
import {
  convertToTargetFormat,
  ensureComponentIds,
  generateId,
  importFromJSON,
  migrateCardLink,
  migrateTitleStyle,
  normalizeCombinationModes,
} from '../utils';

// 工具函数：根据路径更新组件 - 修复版本，防止嵌套错误
const updateComponentByPath = (
  data: DesignData,
  path: (string | number)[],
  updatedComponent: ComponentType,
): DesignData => {
  const newData = JSON.parse(JSON.stringify(data));

  // 验证路径格式
  if (
    path.length < 4 ||
    path[0] !== 'dsl' ||
    path[1] !== 'body' ||
    path[2] !== 'elements'
  ) {
    console.error('❌ 无效的组件路径:', path);
    return data;
  }

  if (path.length === 4) {
    // 根级组件: ['dsl', 'body', 'elements', index]
    const index = path[3] as number;
    if (index >= 0 && index < newData.dsl.body.elements.length) {
      newData.dsl.body.elements[index] = updatedComponent;
    } else {
      console.error('❌ 根级组件索引无效:', index);
    }
  } else if (path.length === 6 && path[4] === 'elements') {
    // 表单内组件: ['dsl', 'body', 'elements', formIndex, 'elements', componentIndex]
    const formIndex = path[3] as number;
    const componentIndex = path[5] as number;

    if (formIndex >= 0 && formIndex < newData.dsl.body.elements.length) {
      const formComponent = newData.dsl.body.elements[formIndex];

      if (formComponent && formComponent.tag === 'form') {
        const formElements = (formComponent as any).elements || [];
        if (componentIndex >= 0 && componentIndex < formElements.length) {
          const oldComponent = formElements[componentIndex];

          // 确保只更新组件本身，不影响表单结构
          // 验证更新的组件不是表单组件，防止嵌套
          if (updatedComponent.tag === 'form') {
            console.error('❌ 阻止表单组件的嵌套更新:', {
              formIndex,
              componentIndex,
              updatedComponentTag: updatedComponent.tag,
              expectedTag: oldComponent?.tag,
            });
            return data; // 返回原数据，不进行更新
          }

          (formComponent as any).elements[componentIndex] = updatedComponent;
        } else {
          console.error('❌ 表单内组件索引无效:', componentIndex);
        }
      } else {
        console.error('❌ 指定位置不是表单组件:', formComponent?.tag);
      }
    } else {
      console.error('❌ 表单索引无效:', formIndex);
    }
  } else if (
    path.length === 8 &&
    path[4] === 'columns' &&
    path[6] === 'elements'
  ) {
    // 分栏内组件: ['dsl', 'body', 'elements', columnSetIndex, 'columns', columnIndex, 'elements', componentIndex]
    const columnSetIndex = path[3] as number;
    const columnIndex = path[5] as number;
    const componentIndex = path[7] as number;

    if (
      columnSetIndex >= 0 &&
      columnSetIndex < newData.dsl.body.elements.length
    ) {
      const columnSetComponent = newData.dsl.body.elements[columnSetIndex];

      if (columnSetComponent && columnSetComponent.tag === 'column_set') {
        const columns = (columnSetComponent as any).columns || [];
        if (columnIndex >= 0 && columnIndex < columns.length) {
          const column = columns[columnIndex];
          if (column && column.elements) {
            const columnElements = column.elements;
            if (componentIndex >= 0 && componentIndex < columnElements.length) {
              column.elements[componentIndex] = updatedComponent;
            } else {
              console.error('❌ 分栏内组件索引无效:', componentIndex);
            }
          } else {
            console.error('❌ 分栏不存在或无elements属性');
          }
        } else {
          console.error('❌ 分栏索引无效:', columnIndex);
        }
      } else {
        console.error('❌ 指定位置不是分栏组件:', columnSetComponent?.tag);
      }
    } else {
      console.error('❌ 分栏容器索引无效:', columnSetIndex);
    }
  } else {
    console.error('❌ 不支持的路径格式:', path);
    return data;
  }

  // 验证数据结构的完整性，防止嵌套错误
  const validateDataStructure = (data: DesignData) => {
    const elements = (data as any).dsl?.body?.elements || [];
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      if (element && element.tag === 'form') {
        const formElements = (element as any).elements || [];
        for (let j = 0; j < formElements.length; j++) {
          const childElement = formElements[j];
          if (childElement && childElement.tag === 'form') {
            console.error('❌ 检测到表单嵌套错误:', {
              parentFormIndex: i,
              childFormIndex: j,
              parentFormId: element.id,
              childFormId: childElement.id,
            });
            return false;
          }
        }
      }
    }
    return true;
  };

  const isValid = validateDataStructure(newData);
  if (!isValid) {
    console.error('❌ 数据结构验证失败，返回原数据');
    return data;
  }

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
      // 直接更新状态，不使用防抖
      setSelectedComponent(component);
      setSelectedPath(path || null);
    },
    [],
  );

  const clearSelection = useCallback(() => {
    setSelectedComponent(null);
    setSelectedPath(null);
  }, []);

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

        // 检查是否是新格式的完整卡片数据
        if (
          parsed &&
          parsed.dsl &&
          parsed.dsl.body &&
          Array.isArray(parsed.dsl.body.elements)
        ) {
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

          // 确保所有组件都有ID
          newCardData.dsl.body.elements = ensureComponentIds(
            newCardData.dsl.body.elements,
          );

          // 处理多图混排组件的combination_mode
          newCardData.dsl.body.elements = normalizeCombinationModes(
            newCardData.dsl.body.elements,
          );

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
          // case 's':
          //   e.preventDefault();
          //   saveConfig();
          //   break;
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
