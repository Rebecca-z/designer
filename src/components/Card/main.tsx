import Canvas from './CanvasWrapper/ChatWrapperIndex';
import { DEFAULT_CARD_DATA, DEVICE_SIZES } from './constants';
import Modals from './Modals';
import { ComponentPanel, PropertyPanel } from './PropertyPanel';
import Toolbar from './ToolBar';
import { migrateTitleStyle } from './utils';

// 验证所有导入都存在
console.log('✅ ComponentPanel 导入成功:', typeof ComponentPanel);
console.log('✅ PropertyPanel 导入成功:', typeof PropertyPanel);
console.log('✅ Canvas 导入成功:', typeof Canvas);
console.log('✅ DEFAULT_CARD_DATA 导入成功:', typeof DEFAULT_CARD_DATA);
console.log('✅ Modals 导入成功:', typeof Modals);
console.log('✅ Toolbar 导入成功:', typeof Toolbar);

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
} from './hooks/card-designer-hooks';
import { CardDesignData, ComponentType, Variable, VariableItem } from './type';
import { variableCacheManager } from './Variable/utils/index';

const CardDesigner: React.FC = () => {
  // 基础状态
  const [device, setDevice] = useState<keyof typeof DEVICE_SIZES>('desktop');
  const [previewVisible, setPreviewVisible] = useState<boolean>(false);
  const [variables, setVariables] = useState<VariableItem[]>([]);

  // 使用自定义Hooks - 现在使用新的卡片数据结构
  const history = useHistory(DEFAULT_CARD_DATA as any);
  const selection = useComponentSelection();
  const outline = useOutlineTree();
  const focus = useFocusManagement();
  const clipboard = useClipboard();
  const config = useConfigManagement();

  // 安全检查：确保数据结构完整，并进行数据迁移
  const safeCardData = React.useMemo(() => {
    const data = history.data as unknown as CardDesignData;
    if (!data || !data.dsl || !data.dsl.body) {
      console.warn('⚠️ 卡片数据结构不完整，使用默认数据');
      return DEFAULT_CARD_DATA;
    }

    // 进行数据迁移
    const migratedData = migrateTitleStyle(data);

    return migratedData;
  }, [history.data]);

  // 处理变量更新 - 同时更新本地状态、缓存和卡片数据结构
  const handleUpdateVariables = (newVariables: VariableItem[]) => {
    // 立即更新本地状态
    setVariables(newVariables);

    // 更新变量缓存
    variableCacheManager.setVariables(newVariables);

    // 将变量转换为卡片数据结构格式并更新
    const cardVariables: { [key: string]: any } = {};

    newVariables.forEach((variable) => {
      if (typeof variable === 'object' && variable !== null) {
        // 检查是否是标准的Variable对象格式 {name, type, value, originalType, description}
        const varRecord = variable as any;
        if (varRecord.name && varRecord.value !== undefined) {
          // 保存变量名和值到全局数据
          cardVariables[varRecord.name] = varRecord.value;

          // 如果有 originalType，也需要保存到缓存中以便后续恢复
          if (varRecord.originalType) {
            const originalTypeKey = `__${varRecord.name}_originalType`;
            variableCacheManager.setVariable(
              originalTypeKey,
              varRecord.originalType,
            );
          }
        } else {
          // 自定义格式：{变量名: 模拟数据值, __变量名_originalType: 原始类型}
          const variableRecord = variable as { [key: string]: any };
          const keys = Object.keys(variableRecord);

          // 分离实际变量名和内部属性
          const actualVariableNames = keys.filter(
            (key) => !key.startsWith('__'),
          );

          // 只保存实际变量到全局数据，不保存内部属性
          actualVariableNames.forEach((variableName) => {
            cardVariables[variableName] = variableRecord[variableName];
          });
        }
      } else {
        // 兼容旧的Variable格式（向后兼容）
        const varAsVariable = variable as Variable;
        if (varAsVariable.name) {
          cardVariables[varAsVariable.name] = varAsVariable.value;
        }
      }
    });

    // 获取当前的历史数据并更新
    const currentData = history.data as unknown as CardDesignData;
    const updatedCardData = {
      ...currentData,
      variables: cardVariables,
    };

    // 立即更新历史数据，这会触发画布重新渲染
    history.updateData(updatedCardData as any);
  };

  // 从卡片数据结构初始化变量
  React.useEffect(() => {
    if (
      safeCardData.variables &&
      Object.keys(safeCardData.variables).length > 0
    ) {
      const cardVariables = safeCardData.variables;
      const variableItems: VariableItem[] = [];

      // 处理变量名和值，同时保留内部属性（如originalType）
      const actualVariableEntries = Object.entries(cardVariables).filter(
        ([key]) =>
          // 过滤出实际变量（排除旧格式后缀和内部属性）
          !key.endsWith('_type') &&
          !key.endsWith('_description') &&
          !key.startsWith('__'),
      );

      actualVariableEntries.forEach(([variableName, variableValue]) => {
        // 尝试从缓存中获取originalType信息
        const originalTypeKey = `__${variableName}_originalType`;
        const cachedOriginalType =
          variableCacheManager.getVariable(originalTypeKey);

        // 构建标准Variable对象格式
        const variableItem: Variable = {
          name: variableName,
          type:
            typeof variableValue === 'number'
              ? 'number'
              : typeof variableValue === 'object'
              ? 'object'
              : 'text',
          value: variableValue,
          originalType:
            cachedOriginalType ||
            (typeof variableValue === 'number' ? 'number' : 'text'),
          description: '',
        };

        variableItems.push(variableItem);
      });

      setVariables(variableItems);
    }
  }, [safeCardData.variables]);

  // 将VariableItem[]转换为Variable[]用于config函数
  const convertToVariableArray = (
    variableItems: VariableItem[],
  ): Variable[] => {
    return variableItems.map((item) => {
      if (typeof item === 'object' && item !== null) {
        // 新的格式：{变量名: 模拟数据值}
        const keys = Object.keys(item as { [key: string]: any });
        if (keys.length > 0) {
          const variableName = keys[0];
          const variableValue = (item as { [key: string]: any })[variableName];

          // 推断类型
          let variableType: 'text' | 'number' | 'boolean' | 'object';
          if (typeof variableValue === 'string') {
            variableType = 'text';
          } else if (typeof variableValue === 'number') {
            variableType = 'number';
          } else if (typeof variableValue === 'boolean') {
            variableType = 'boolean';
          } else {
            variableType = 'object';
          }

          return {
            name: variableName,
            value:
              typeof variableValue === 'object'
                ? JSON.stringify(variableValue)
                : String(variableValue),
            type: variableType,
          };
        }
      }

      // 兼容旧的Variable格式
      return item as Variable;
    });
  };

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
    } else if (
      path.length === 8 &&
      path[4] === 'elements' &&
      path[6] === 'columns'
    ) {
      // 表单内分栏列: ['dsl', 'body', 'elements', formIndex, 'elements', columnSetIndex, 'columns', columnIndex]
      const formIndex = path[3] as number;
      const columnSetIndex = path[5] as number;
      const columnIndex = path[7] as number;
      const formComponent = data.dsl.body.elements[formIndex];

      if (
        formComponent &&
        formComponent.tag === 'form' &&
        (formComponent as any).elements
      ) {
        const columnSetComponent = (formComponent as any).elements[
          columnSetIndex
        ];
        if (
          columnSetComponent &&
          columnSetComponent.tag === 'column_set' &&
          (columnSetComponent as any).columns
        ) {
          const column = (columnSetComponent as any).columns[columnIndex];
          if (column) {
            return {
              id: `${columnSetComponent.id}_column_${columnIndex}`,
              tag: 'column',
              ...column,
            };
          }
        }
      }
    } else if (
      path.length === 10 &&
      path[4] === 'elements' &&
      path[6] === 'columns' &&
      path[8] === 'elements'
    ) {
      // 表单内分栏容器内的组件: ['dsl', 'body', 'elements', formIndex, 'elements', columnSetIndex, 'columns', columnIndex, 'elements', componentIndex]
      const formIndex = path[3] as number;
      const columnSetIndex = path[5] as number;
      const columnIndex = path[7] as number;
      const componentIndex = path[9] as number;
      const formComponent = data.dsl.body.elements[formIndex];

      if (
        formComponent &&
        formComponent.tag === 'form' &&
        (formComponent as any).elements
      ) {
        const columnSetComponent = (formComponent as any).elements[
          columnSetIndex
        ];
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

      // 如果是标题组件选择路径，检查headerData是否存在
      if (
        selection.selectedPath.length === 2 &&
        selection.selectedPath[0] === 'dsl' &&
        selection.selectedPath[1] === 'header'
      ) {
        // 标题组件特殊处理：检查headerData是否存在
        if (
          safeCardData.dsl.header &&
          (safeCardData.dsl.header.title?.content ||
            safeCardData.dsl.header.subtitle?.content)
        ) {
          console.log('✅ 标题组件选择状态有效，headerData存在');
          return; // 标题组件选择状态有效
        } else {
          console.log('❌ 标题组件选择状态无效，headerData不存在');
          selection.clearSelection();
          return;
        }
      }

      // 特殊处理根级别分栏列选择：['dsl', 'body', 'elements', columnSetIndex, 'columns', columnIndex]
      if (
        selection.selectedPath.length === 6 &&
        selection.selectedPath[0] === 'dsl' &&
        selection.selectedPath[1] === 'body' &&
        selection.selectedPath[2] === 'elements' &&
        selection.selectedPath[4] === 'columns'
      ) {
        const columnSetIndex = selection.selectedPath[3] as number;
        const columnIndex = selection.selectedPath[5] as number;
        const columnSetComponent =
          safeCardData.dsl.body.elements[columnSetIndex];

        if (
          columnSetComponent &&
          columnSetComponent.tag === 'column_set' &&
          columnSetComponent.columns &&
          columnSetComponent.columns[columnIndex]
        ) {
          return; // 分栏列选择状态有效
        } else {
          console.log('❌ 根级别分栏列选择状态无效，清除选择');
          selection.clearSelection();
          return;
        }
      }

      // 特殊处理表单内分栏列选择：['dsl', 'body', 'elements', formIndex, 'elements', columnSetIndex, 'columns', columnIndex]
      if (
        selection.selectedPath.length === 8 &&
        selection.selectedPath[0] === 'dsl' &&
        selection.selectedPath[1] === 'body' &&
        selection.selectedPath[2] === 'elements' &&
        selection.selectedPath[4] === 'elements' &&
        selection.selectedPath[6] === 'columns'
      ) {
        const formIndex = selection.selectedPath[3] as number;
        const columnSetIndex = selection.selectedPath[5] as number;
        const columnIndex = selection.selectedPath[7] as number;
        const formComponent = safeCardData.dsl.body.elements[formIndex];

        if (
          formComponent &&
          formComponent.tag === 'form' &&
          formComponent.elements
        ) {
          const columnSetComponent = formComponent.elements[columnSetIndex];
          if (
            columnSetComponent &&
            columnSetComponent.tag === 'column_set' &&
            columnSetComponent.columns &&
            columnSetComponent.columns[columnIndex]
          ) {
            return; // 表单内分栏列选择状态有效
          } else {
            console.log('❌ 表单内分栏列选择状态无效，清除选择');
            selection.clearSelection();
            return;
          }
        } else {
          console.log('❌ 表单内分栏列选择状态无效，表单组件不存在');
          selection.clearSelection();
          return;
        }
      }

      // 对于其他组件选择路径，需要调整路径查找逻辑
      const component = getComponentByPath(
        safeCardData,
        selection.selectedPath,
      );
      if (component && component.id === selection.selectedComponent?.id) {
        // 组件仍然存在且匹配
      } else {
        console.log('❌ 组件选择状态无效，清除选择');
        selection.clearSelection();
      }
    }
  }, [safeCardData, selection.selectedPath, selection.selectedComponent?.id]);

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
        ...safeCardData,
        dsl: {
          ...safeCardData.dsl,
          body: {
            ...safeCardData.dsl.body,
            elements: [...safeCardData.dsl.body.elements, newComponent],
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

    // 检查是否为表单内分栏列中组件的删除路径
    if (
      path.length === 10 &&
      path[4] === 'elements' &&
      path[6] === 'columns' &&
      path[8] === 'elements'
    ) {
      // 表单内分栏列中组件: ['dsl', 'body', 'elements', formIndex, 'elements', columnSetIndex, 'columns', columnIndex, 'elements', componentIndex]
      console.log('🗑️ 检测到表单内分栏列中组件删除路径:', path);
    }

    let newData = JSON.parse(JSON.stringify(safeCardData));

    // 检查是否删除的是标题组件
    let isDeletingTitle = false;
    if (path.length === 4) {
      // 根级组件: ['dsl', 'body', 'elements', index]
      const index = path[3] as number;
      const componentToDelete = newData.dsl.body.elements[index];
      isDeletingTitle = componentToDelete && componentToDelete.tag === 'title';
      newData.dsl.body.elements.splice(index, 1);
      // console.log('🗑️ 删除根级组件:', { index, isTitle: isDeletingTitle });
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
        const componentToDelete = formComponent.elements[componentIndex];
        isDeletingTitle =
          componentToDelete && componentToDelete.tag === 'title';
        formComponent.elements.splice(componentIndex, 1);
      }
    } else if (path.length === 6 && path[4] === 'columns') {
      // 删除分栏列: ['dsl', 'body', 'elements', columnSetIndex, 'columns', columnIndex]
      const columnSetIndex = path[3] as number;
      const columnIndex = path[5] as number;
      const columnSetComponent = newData.dsl.body.elements[columnSetIndex];

      if (
        columnSetComponent &&
        columnSetComponent.tag === 'column_set' &&
        columnSetComponent.columns
      ) {
        // 检查要删除的列是否包含取消按钮
        const targetColumn = columnSetComponent.columns[columnIndex];
        const hasCancelButton = targetColumn?.elements?.some(
          (element: any) =>
            element.tag === 'button' && element.form_action_type === 'reset',
        );

        if (hasCancelButton) {
          console.log('⚠️ 该列包含取消按钮，不能删除');
          return;
        }

        // 删除指定的分栏列
        columnSetComponent.columns.splice(columnIndex, 1);

        // 如果删除后没有列了，删除整个分栏组件
        if (columnSetComponent.columns.length === 0) {
          newData.dsl.body.elements.splice(columnSetIndex, 1);
          // console.log('🗑️ 分栏列全部删除，删除整个分栏组件');
        } else {
          // 重新计算剩余列的宽度 - 确保每列都有flex属性
          columnSetComponent.columns = columnSetComponent.columns.map(
            (col: any) => ({
              ...col,
              style: {
                ...col.style,
                flex: col.style?.flex || col.flex || 1, // 兼容旧数据和新数据格式
              },
            }),
          );
        }

        // 如果当前选中的是被删除的列或之后的列，需要重置选中状态
        if (
          selection.selectedPath &&
          selection.selectedPath.length >= 6 &&
          selection.selectedPath[3] === columnSetIndex &&
          selection.selectedPath[4] === 'columns' &&
          (selection.selectedPath[5] as number) >= columnIndex
        ) {
          selection.clearSelection();
          // console.log('🔄 重置选中状态，因为删除了当前选中的列或其后的列');
        }
      }
    } else if (
      path.length === 8 &&
      path[4] === 'elements' &&
      path[6] === 'columns'
    ) {
      // 删除表单内分栏列: ['dsl', 'body', 'elements', formIndex, 'elements', columnSetIndex, 'columns', columnIndex]
      const formIndex = path[3] as number;
      const columnSetIndex = path[5] as number;
      const columnIndex = path[7] as number;
      const formComponent = newData.dsl.body.elements[formIndex];

      if (
        formComponent &&
        formComponent.tag === 'form' &&
        formComponent.elements
      ) {
        const columnSetComponent = formComponent.elements[columnSetIndex];
        if (
          columnSetComponent &&
          columnSetComponent.tag === 'column_set' &&
          columnSetComponent.columns
        ) {
          // 检查要删除的列是否包含取消按钮
          const targetColumn = columnSetComponent.columns[columnIndex];
          const hasCancelButton = targetColumn?.elements?.some(
            (element: any) =>
              element.tag === 'button' && element.form_action_type === 'reset',
          );

          if (hasCancelButton) {
            console.log('⚠️ 该列包含取消按钮，不能删除');
            return;
          }

          // 删除指定的分栏列
          columnSetComponent.columns.splice(columnIndex, 1);

          // 如果删除后没有列了，删除整个分栏组件
          if (columnSetComponent.columns.length === 0) {
            formComponent.elements.splice(columnSetIndex, 1);
            // console.log('🗑️ 表单内分栏列全部删除，删除整个分栏组件');
          } else {
            // 重新计算剩余列的宽度 - 确保每列都有flex属性
            columnSetComponent.columns = columnSetComponent.columns.map(
              (col: any) => ({
                ...col,
                style: {
                  ...col.style,
                  flex: col.style?.flex || col.flex || 1, // 兼容旧数据和新数据格式
                },
              }),
            );
          }

          // 如果当前选中的是被删除的列或之后的列，需要重置选中状态
          if (
            selection.selectedPath &&
            selection.selectedPath.length >= 8 &&
            selection.selectedPath[3] === formIndex &&
            selection.selectedPath[4] === 'elements' &&
            selection.selectedPath[5] === columnSetIndex &&
            selection.selectedPath[6] === 'columns' &&
            (selection.selectedPath[7] as number) >= columnIndex
          ) {
            selection.clearSelection();
            // console.log('🔄 重置选中状态，因为删除了当前选中的列或其后的列');
          }
        }
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
          const componentToDelete = column.elements[componentIndex];
          isDeletingTitle =
            componentToDelete && componentToDelete.tag === 'title';
          column.elements.splice(componentIndex, 1);
        }
      }
    } else if (
      path.length === 10 &&
      path[4] === 'elements' &&
      path[6] === 'columns' &&
      path[8] === 'elements'
    ) {
      // 表单内分栏列中组件: ['dsl', 'body', 'elements', formIndex, 'elements', columnSetIndex, 'columns', columnIndex, 'elements', componentIndex]
      const formIndex = path[3] as number;
      const columnSetIndex = path[5] as number;
      const columnIndex = path[7] as number;
      const componentIndex = path[9] as number;
      const formComponent = newData.dsl.body.elements[formIndex];

      if (
        formComponent &&
        formComponent.tag === 'form' &&
        formComponent.elements
      ) {
        const columnSetComponent = formComponent.elements[columnSetIndex];
        if (
          columnSetComponent &&
          columnSetComponent.tag === 'column_set' &&
          columnSetComponent.columns
        ) {
          const column = columnSetComponent.columns[columnIndex];
          if (column && column.elements) {
            const componentToDelete = column.elements[componentIndex];
            isDeletingTitle =
              componentToDelete && componentToDelete.tag === 'title';
            column.elements.splice(componentIndex, 1);
            console.log('🗑️ 删除表单内分栏列中组件:', {
              formIndex,
              columnSetIndex,
              columnIndex,
              componentIndex,
              isTitle: isDeletingTitle,
            });
          }
        }
      }
    } else {
      console.warn('⚠️ 不支持的删除路径格式:', path);
      return;
    }

    if (isDeletingTitle) {
      delete newData.dsl.header;
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
    const path = selection.selectedPath;

    // 检查是否是 header 中的标题组件: ['dsl', 'header']
    if (
      path &&
      path.length === 2 &&
      path[0] === 'dsl' &&
      path[1] === 'header' &&
      updatedComponent.tag === 'title'
    ) {
      console.log('📝 更新 header 中的标题组件:', updatedComponent);
      let newData = JSON.parse(JSON.stringify(safeCardData));

      // 转换组件格式为正确的 header 格式
      const titleComponent = updatedComponent as any;
      const headerData = {
        title: { content: titleComponent.title || '主标题' },
        subtitle: { content: titleComponent.subtitle || '副标题' },
        style: titleComponent.style || 'blue',
      };

      console.log('🔄 转换后的 header 数据格式:', headerData);
      newData.dsl.header = headerData;

      history.updateData(newData as any);
      console.log('✅ Header 标题组件更新成功');
      return;
    }

    // 检查是否是卡片选中状态
    if (path && path.length === 2 && path[0] === 'dsl' && path[1] === 'body') {
      console.log('🎯 卡片选中状态，不处理组件更新');
      return;
    }

    if (!path || path.length < 4) {
      console.warn('无效的选中路径:', path);
      return;
    }

    let newData = JSON.parse(JSON.stringify(safeCardData));

    if (path.length === 4) {
      // 根级组件: ['dsl', 'body', 'elements', index]
      const index = path[3] as number;
      newData.dsl.body.elements[index] = updatedComponent;
    } else if (path.length === 6 && path[4] === 'elements') {
      // 表单内组件（包括分栏容器）: ['dsl', 'body', 'elements', formIndex, 'elements', componentIndex]
      const formIndex = path[3] as number;
      const componentIndex = path[5] as number;
      const formComponent = newData.dsl.body.elements[formIndex];

      if (formComponent && formComponent.tag === 'form') {
        if (!formComponent.elements) {
          formComponent.elements = [];
        }
        const oldComponent = formComponent.elements[componentIndex];

        // 验证更新的组件不是表单组件，防止嵌套
        if (updatedComponent.tag === 'form') {
          console.error('❌ 阻止表单组件的嵌套更新 (main):', {
            formIndex,
            componentIndex,
            updatedComponentTag: updatedComponent.tag,
            expectedTag: oldComponent?.tag,
          });
          return; // 不进行更新
        }

        formComponent.elements[componentIndex] = updatedComponent;
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
        }
      }
    } else if (
      path.length === 10 &&
      path[4] === 'elements' &&
      path[6] === 'columns' &&
      path[8] === 'elements'
    ) {
      // 表单内分栏容器内的组件: ['dsl', 'body', 'elements', formIndex, 'elements', columnSetIndex, 'columns', columnIndex, 'elements', componentIndex]
      const formIndex = path[3] as number;
      const columnSetIndex = path[5] as number;
      const columnIndex = path[7] as number;
      const componentIndex = path[9] as number;
      const formComponent = newData.dsl.body.elements[formIndex];

      if (formComponent && formComponent.tag === 'form') {
        const formElements = (formComponent as any).elements || [];
        const columnSetComponent = formElements[columnSetIndex];

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
            console.log('🎯 更新表单内分栏容器内的组件:', {
              formIndex,
              columnSetIndex,
              columnIndex,
              componentIndex,
              componentTag: updatedComponent.tag,
              componentId: updatedComponent.id,
            });
          }
        }
      }
    } else {
      console.warn('⚠️ 不支持的组件路径格式:', path);
      return;
    }

    history.updateData(newData as any);
    selection.selectComponent(updatedComponent, selection.selectedPath);
  };

  // 处理卡片属性更新
  const handleUpdateCard = (updates: {
    vertical_spacing?: number;
    cardData?: CardDesignData; // 新增：支持完整的卡片数据更新
  }) => {
    let newData;

    // 如果提供了完整的卡片数据更新
    if (updates.cardData) {
      newData = updates.cardData;
    } else {
      // 原有的body更新逻辑
      newData = {
        ...safeCardData,
        dsl: {
          ...safeCardData.dsl,
          body: {
            ...safeCardData.dsl.body,
            ...updates,
          },
        },
      };
    }

    history.updateData(newData as any);
  };

  // 处理标题数据更新
  const handleHeaderDataChange = (headerData: {
    title?: { content: string };
    subtitle?: { content: string };
    style?: string;
  }) => {
    // 检查是否要删除标题（标题和副标题都为空）
    const shouldDeleteHeader =
      (!headerData.title?.content || headerData.title.content.trim() === '') &&
      (!headerData.subtitle?.content ||
        headerData.subtitle.content.trim() === '');

    if (shouldDeleteHeader) {
      const newData = {
        ...safeCardData,
        dsl: {
          ...safeCardData.dsl,
          header: undefined, // 删除header
        },
      };
      history.updateData(newData as any);
      return;
    }

    const newData = {
      ...safeCardData,
      dsl: {
        ...safeCardData.dsl,
        header: {
          ...(safeCardData.dsl.header || {}), // 确保header存在
          ...headerData,
        },
      },
    };

    history.updateData(newData as any);
  };

  // 处理卡片元素变化
  const handleElementsChange = (elements: ComponentType[]) => {
    const newData = {
      ...safeCardData,
      dsl: {
        ...safeCardData.dsl,
        body: {
          ...safeCardData.dsl.body,
          elements,
        },
      },
    };
    history.updateData(newData as any);
  };

  // 大纲树选择处理
  const handleOutlineSelect = (
    component: ComponentType | null,
    path: (string | number)[],
  ) => {
    selection.selectComponent(component, path);
    focus.handleCanvasFocus();
  };

  const handleSaveConfig = () => {
    config.saveConfig(safeCardData, convertToVariableArray(variables));
  };

  const handleLoadConfig = () => {
    config.loadConfig(history.updateData, (newVariables: Variable[]) => {
      // 将Variable[]转换为VariableItem[]
      const variableItems: VariableItem[] = newVariables.map((variable) => ({
        [variable.name]: variable.value,
      }));
      setVariables(variableItems);
    });
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
          ...safeCardData,
          dsl: {
            ...safeCardData.dsl,
            body: {
              ...safeCardData.dsl.body,
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
          cardId={safeCardData.id}
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
          onExport={() => config.exportConfig(safeCardData)}
          onPreview={() => setPreviewVisible(true)}
          elementsCount={safeCardData.dsl.body.elements.length}
          variablesCount={variables.length}
          canvasFocused={focus.canvasFocused}
          verticalSpacing={safeCardData.dsl.body.vertical_spacing}
        />

        {/* 主体区域 */}
        <div style={{ flex: 1, display: 'flex' }}>
          {/* 左侧组件面板 - 包含组件库和大纲树的Tab */}
          <ComponentPanel
            cardData={safeCardData}
            selectedPath={selection.selectedPath}
            onOutlineHover={outline.handleOutlineHover}
            onOutlineSelect={handleOutlineSelect}
          />

          {/* 中间画布 - 会话卡片界面 */}
          <div style={{ flex: 1 }}>
            <div data-canvas="true" style={{ height: '100%' }}>
              <Canvas
                data={safeCardData}
                onDataChange={(newData) => history.updateData(newData as any)}
                selectedPath={selection.selectedPath}
                hoveredPath={outline.hoveredPath}
                onSelectComponent={selection.selectComponent}
                onDeleteComponent={handleDelete}
                onCopyComponent={clipboard.copyComponent}
                device={device}
                onCanvasFocus={focus.handleCanvasFocus}
                onHeaderDataChange={handleHeaderDataChange}
                onElementsChange={handleElementsChange}
              />
            </div>
          </div>

          {/* 右侧属性面板 - 支持卡片属性配置 */}
          <div data-panel="property" style={{ width: '300px' }}>
            <PropertyPanel
              selectedPath={selection.selectedPath}
              onUpdateComponent={handleUpdateSelectedComponent}
              onUpdateCard={handleUpdateCard}
              variables={variables as VariableItem[]}
              onUpdateVariables={handleUpdateVariables}
              cardVerticalSpacing={safeCardData.dsl.body.vertical_spacing}
              headerData={safeCardData.dsl.header} // 只有当header存在时才传递
              cardData={safeCardData}
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
          data={safeCardData}
          device={device}
          variables={convertToVariableArray(variables)}
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
