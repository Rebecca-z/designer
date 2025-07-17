// 验证导出 - 模拟 card-designer-main-final.tsx 的导入语句

// 从合并的文件中导入组件
import {
  ComponentPanel,
  PropertyPanel,
} from './card-designer-property-panel-updated';

// 其他导入
import Canvas from './card-designer-canvas-with-card';
import {
  DEFAULT_CARD_DATA,
  DEVICE_SIZES,
} from './card-designer-constants-updated';
import Modals from './card-designer-modals';
import Toolbar from './card-designer-toolbar-with-id';

// 验证所有导入都存在
console.log('✅ ComponentPanel 导入成功:', typeof ComponentPanel);
console.log('✅ PropertyPanel 导入成功:', typeof PropertyPanel);
console.log('✅ Canvas 导入成功:', typeof Canvas);
console.log('✅ DEFAULT_CARD_DATA 导入成功:', typeof DEFAULT_CARD_DATA);
console.log('✅ Modals 导入成功:', typeof Modals);
console.log('✅ Toolbar 导入成功:', typeof Toolbar);

// 现在 card-designer-main-final.tsx 应该能正常工作

import { Modal } from 'antd';
import React, { useEffect, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
  useClipboard,
  useComponentSelection,
  useConfigManagement,
  useFocusManagement,
  useHistory,
  useKeyboardShortcuts,
  useOutlineTree,
} from './card-designer-hooks';
import {
  CardDesignData,
  CardPadding,
  ComponentType,
  Variable,
} from './card-designer-types-updated';

const CardDesigner: React.FC = () => {
  // 基础状态
  const [device, setDevice] = useState<keyof typeof DEVICE_SIZES>('desktop');
  const [previewVisible, setPreviewVisible] = useState<boolean>(false);
  const [variables, setVariables] = useState<Variable[]>([]);

  // 使用自定义Hooks - 现在使用新的卡片数据结构
  const history = useHistory(DEFAULT_CARD_DATA as any);
  const selection = useComponentSelection();
  const outline = useOutlineTree();
  const focus = useFocusManagement();
  const clipboard = useClipboard();
  // const deletion = useComponentDeletion();
  // const update = useComponentUpdate();
  const config = useConfigManagement();

  // 类型转换：将历史数据转为卡片数据
  const cardData = history.data as unknown as CardDesignData;

  // 根据路径获取组件的辅助函数 - 支持嵌套组件
  const getComponentByPath = (
    data: CardDesignData,
    path: (string | number)[],
  ): ComponentType | null => {
    if (
      path.length < 4 ||
      path[0] !== 'dsl' ||
      path[1] !== 'body' ||
      path[2] !== 'elements'
    ) {
      return null;
    }

    if (path.length === 4) {
      // 根级组件: ['dsl', 'body', 'elements', index]
      const index = path[3] as number;
      return data.dsl.body.elements[index] || null;
    } else if (path.length === 6 && path[4] === 'elements') {
      // 表单内组件: ['dsl', 'body', 'elements', formIndex, 'elements', componentIndex]
      const formIndex = path[3] as number;
      const componentIndex = path[5] as number;
      const formComponent = data.dsl.body.elements[formIndex];

      if (
        formComponent &&
        formComponent.tag === 'form' &&
        (formComponent as any).elements
      ) {
        return (formComponent as any).elements[componentIndex] || null;
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
      const columnSetComponent = data.dsl.body.elements[columnSetIndex];

      if (
        columnSetComponent &&
        columnSetComponent.tag === 'column_set' &&
        (columnSetComponent as any).columns
      ) {
        const column = (columnSetComponent as any).columns[columnIndex];
        if (column && column.elements) {
          return column.elements[componentIndex] || null;
        }
      }
    }

    return null;
  };

  // 处理组件更新的副作用
  useEffect(() => {
    if (selection.selectedPath) {
      // 如果是卡片选择路径，不需要检查组件存在性
      if (
        selection.selectedPath.length === 2 &&
        selection.selectedPath[0] === 'dsl' &&
        selection.selectedPath[1] === 'body'
      ) {
        return; // 卡片选择路径不需要验证
      }

      // 对于组件选择路径，需要调整路径查找逻辑
      const component = getComponentByPath(cardData, selection.selectedPath);
      if (component && component.id === selection.selectedComponent?.id) {
        // 组件仍然存在且匹配
      } else {
        selection.clearSelection();
      }
    }
  }, [cardData, selection.selectedPath, selection.selectedComponent?.id]);

  // 组合操作函数
  const handleCopy = () => {
    if (selection.selectedComponent) {
      clipboard.copyComponent(selection.selectedComponent);
    }
  };

  const handlePaste = () => {
    // 对于卡片结构，粘贴到卡片内
    if (clipboard.clipboard) {
      const newComponent = {
        ...clipboard.clipboard,
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      };
      const newData = {
        ...cardData,
        dsl: {
          ...cardData.dsl,
          body: {
            ...cardData.dsl.body,
            elements: [...cardData.dsl.body.elements, newComponent],
          },
        },
      };
      history.updateData(newData as any);
    }
  };

  const handleDelete = (path: (string | number)[]) => {
    if (
      path.length < 4 ||
      path[0] !== 'dsl' ||
      path[1] !== 'body' ||
      path[2] !== 'elements'
    ) {
      console.warn('无效的删除路径:', path);
      return;
    }

    let newData = JSON.parse(JSON.stringify(cardData));

    console.log('🗑️ 删除组件:', {
      path,
      pathLength: path.length,
    });

    if (path.length === 4) {
      // 根级组件: ['dsl', 'body', 'elements', index]
      const index = path[3] as number;
      newData.dsl.body.elements.splice(index, 1);
      console.log('🗑️ 删除根级组件:', { index });
    } else if (path.length === 6 && path[4] === 'elements') {
      // 表单内组件: ['dsl', 'body', 'elements', formIndex, 'elements', componentIndex]
      const formIndex = path[3] as number;
      const componentIndex = path[5] as number;
      const formComponent = newData.dsl.body.elements[formIndex];

      if (
        formComponent &&
        formComponent.tag === 'form' &&
        formComponent.elements
      ) {
        formComponent.elements.splice(componentIndex, 1);
        console.log('🗑️ 删除表单内组件:', { formIndex, componentIndex });
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
      const columnSetComponent = newData.dsl.body.elements[columnSetIndex];

      if (
        columnSetComponent &&
        columnSetComponent.tag === 'column_set' &&
        columnSetComponent.columns
      ) {
        const column = columnSetComponent.columns[columnIndex];
        if (column && column.elements) {
          column.elements.splice(componentIndex, 1);
          console.log('🗑️ 删除分栏内组件:', {
            columnSetIndex,
            columnIndex,
            componentIndex,
          });
        }
      }
    } else {
      console.warn('⚠️ 不支持的删除路径格式:', path);
      return;
    }

    history.updateData(newData as any);
    selection.clearSelection();
  };

  const handleSmartDelete = (path: (string | number)[]) => {
    // 检查是否为卡片本身，卡片不可删除
    if (path.length === 2 && path[0] === 'dsl' && path[1] === 'body') {
      return false; // 卡片本身不可删除
    }
    handleDelete(path);
    return true;
  };

  const handleUpdateSelectedComponent = (updatedComponent: ComponentType) => {
    // 检查是否是卡片选中状态
    if (
      selection.selectedPath &&
      selection.selectedPath.length === 2 &&
      selection.selectedPath[0] === 'dsl' &&
      selection.selectedPath[1] === 'body'
    ) {
      console.log('🎯 卡片选中状态，不处理组件更新');
      return;
    }

    if (!selection.selectedPath || selection.selectedPath.length < 4) {
      console.warn('无效的选中路径:', selection.selectedPath);
      return;
    }

    const path = selection.selectedPath;
    let newData = JSON.parse(JSON.stringify(cardData));

    console.log('🔄 更新组件:', {
      componentId: updatedComponent.id,
      componentTag: updatedComponent.tag,
      path,
      pathLength: path.length,
    });

    if (path.length === 4) {
      // 根级组件: ['dsl', 'body', 'elements', index]
      const index = path[3] as number;
      newData.dsl.body.elements[index] = updatedComponent;
      console.log('📝 更新根级组件:', {
        index,
        componentTag: updatedComponent.tag,
      });
    } else if (path.length === 6 && path[4] === 'elements') {
      // 表单内组件: ['dsl', 'body', 'elements', formIndex, 'elements', componentIndex]
      const formIndex = path[3] as number;
      const componentIndex = path[5] as number;
      const formComponent = newData.dsl.body.elements[formIndex];

      if (formComponent && formComponent.tag === 'form') {
        if (!formComponent.elements) {
          formComponent.elements = [];
        }
        formComponent.elements[componentIndex] = updatedComponent;
        console.log('📋 更新表单内组件:', {
          formIndex,
          componentIndex,
          componentTag: updatedComponent.tag,
        });
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
      const columnSetComponent = newData.dsl.body.elements[columnSetIndex];

      if (columnSetComponent && columnSetComponent.tag === 'column_set') {
        if (!columnSetComponent.columns) {
          columnSetComponent.columns = [];
        }
        const column = columnSetComponent.columns[columnIndex];
        if (column) {
          if (!column.elements) {
            column.elements = [];
          }
          column.elements[componentIndex] = updatedComponent;
          console.log('📐 更新分栏内组件:', {
            columnSetIndex,
            columnIndex,
            componentIndex,
            componentTag: updatedComponent.tag,
          });
        }
      }
    } else {
      console.warn('⚠️ 不支持的组件路径格式:', path);
      return;
    }

    history.updateData(newData as any);
    // 移除这行代码，避免重新设置选择状态
    // selection.selectComponent(updatedComponent, selection.selectedPath);
  };

  // 处理卡片属性更新
  const handleUpdateCard = (updates: {
    vertical_spacing?: number;
    padding?: CardPadding;
  }) => {
    console.log('🎯 处理卡片属性更新:', {
      updates,
      currentVerticalSpacing: cardData.dsl.body.vertical_spacing,
      currentPadding: cardData.dsl.body.padding,
      timestamp: new Date().toISOString(),
    });

    const newData = {
      ...cardData,
      dsl: {
        ...cardData.dsl,
        body: {
          ...cardData.dsl.body,
          ...updates,
        },
      },
    };

    // 如果更新了垂直间距，记录详细信息
    if (updates.vertical_spacing !== undefined) {
      console.log('📏 垂直间距更新:', {
        oldValue: cardData.dsl.body.vertical_spacing,
        newValue: updates.vertical_spacing,
        willAffectExport: true,
        exportConfigWillInclude: updates.vertical_spacing,
      });
    }

    history.updateData(newData as any);
  };

  // 大纲树选择处理
  const handleOutlineSelect = (
    component: ComponentType | null,
    path: (string | number)[],
  ) => {
    console.log('🌳 大纲树选择处理:', {
      componentId: component?.id,
      componentTag: component?.tag,
      path,
      pathLength: path.length,
      isCard: path.length === 2 && path[0] === 'dsl' && path[1] === 'body',
    });
    selection.selectComponent(component, path);
    focus.handleCanvasFocus();
  };

  const handleSaveConfig = () => {
    config.saveConfig(
      {
        direction: 'vertical' as const,
        vertical_spacing: cardData.dsl.body.vertical_spacing,
        elements: cardData.dsl.body.elements,
      } as any,
      variables,
    );
  };

  const handleLoadConfig = () => {
    config.loadConfig(history.updateData, setVariables);
  };

  const handleFileUpload = (file: File) => {
    return config.handleFileUpload(file, history.updateData);
  };

  const clearCanvas = () => {
    Modal.confirm({
      title: '确认清空',
      content: '确定要清空卡片内容吗？此操作不可撤销。',
      onOk: () => {
        const newData = {
          ...cardData,
          dsl: {
            ...cardData.dsl,
            body: {
              ...cardData.dsl.body,
              elements: [],
            },
          },
        };
        history.updateData(newData as any);
        selection.clearSelection();
        setVariables([]);
      },
    });
  };

  // 绑定快捷键
  useKeyboardShortcuts({
    undo: history.undo,
    redo: history.redo,
    copyComponent: clipboard.copyComponent,
    pasteComponent: handlePaste,
    saveConfig: handleSaveConfig,
    loadConfig: handleLoadConfig,
    smartDeleteComponent: handleSmartDelete,
    selectedComponent: selection.selectedComponent,
    selectedPath: selection.selectedPath,
    clipboard: clipboard.clipboard,
    canvasRef: focus.canvasRef,
  });

  return (
    <DndProvider backend={HTML5Backend}>
      <div
        style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* 顶部工具栏 - 显示卡片ID */}
        <Toolbar
          cardId={cardData.id}
          device={device}
          onDeviceChange={setDevice}
          canUndo={history.canUndo}
          canRedo={history.canRedo}
          onUndo={history.undo}
          onRedo={history.redo}
          selectedComponent={selection.selectedComponent}
          clipboard={clipboard.clipboard}
          onCopy={handleCopy}
          onPaste={handlePaste}
          onSave={handleSaveConfig}
          onLoad={handleLoadConfig}
          onImport={config.importConfig}
          onExport={() =>
            config.exportConfig({
              direction: 'vertical' as const,
              vertical_spacing: cardData.dsl.body.vertical_spacing,
              elements: cardData.dsl.body.elements,
            } as any)
          }
          onPreview={() => setPreviewVisible(true)}
          elementsCount={cardData.dsl.body.elements.length}
          variablesCount={variables.length}
          canvasFocused={focus.canvasFocused}
          verticalSpacing={cardData.dsl.body.vertical_spacing}
        />

        {/* 主体区域 */}
        <div style={{ flex: 1, display: 'flex' }}>
          {/* 左侧组件面板 - 包含组件库和大纲树的Tab */}
          <ComponentPanel
            data={cardData}
            selectedPath={selection.selectedPath}
            onOutlineHover={outline.handleOutlineHover}
            onOutlineSelect={handleOutlineSelect}
          />

          {/* 中间画布 - 会话卡片界面 */}
          <div style={{ flex: 1 }}>
            <div data-canvas="true" style={{ height: '100%' }}>
              <Canvas
                data={cardData}
                onDataChange={(newData) => history.updateData(newData as any)}
                selectedPath={selection.selectedPath}
                hoveredPath={outline.hoveredPath}
                onSelectComponent={selection.selectComponent}
                onDeleteComponent={handleDelete}
                onCopyComponent={clipboard.copyComponent}
                device={device}
                onCanvasFocus={focus.handleCanvasFocus}
              />
            </div>
          </div>

          {/* 右侧属性面板 - 支持卡片属性配置 */}
          <div data-panel="property" style={{ width: '300px' }}>
            <PropertyPanel
              selectedComponent={selection.selectedComponent}
              selectedPath={selection.selectedPath}
              onUpdateComponent={handleUpdateSelectedComponent}
              onUpdateCard={handleUpdateCard}
              variables={variables}
              onUpdateVariables={setVariables}
              cardVerticalSpacing={cardData.dsl.body.vertical_spacing}
              cardPadding={
                cardData.dsl.body.padding || {
                  top: 16,
                  right: 16,
                  bottom: 16,
                  left: 16,
                }
              }
              cardData={cardData}
            />
          </div>
        </div>

        {/* 模态框组件 */}
        <Modals
          exportModalVisible={config.exportModalVisible}
          setExportModalVisible={config.setExportModalVisible}
          exportData={config.exportData}
          onDownloadConfig={config.downloadConfig}
          importModalVisible={config.importModalVisible}
          setImportModalVisible={config.setImportModalVisible}
          onFileUpload={handleFileUpload}
          previewVisible={previewVisible}
          setPreviewVisible={setPreviewVisible}
          data={{
            direction: 'vertical' as const,
            vertical_spacing: cardData.dsl.body.vertical_spacing,
            elements: cardData.dsl.body.elements,
          }}
          device={device}
          variables={variables}
          historyLength={history.historyLength}
          canvasFocused={focus.canvasFocused}
          onClearCanvas={clearCanvas}
          onImportConfig={config.importConfig}
        />
      </div>
    </DndProvider>
  );
};

export default CardDesigner;
