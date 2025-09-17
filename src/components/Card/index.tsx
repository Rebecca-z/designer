import { App, message, Modal } from 'antd';
import React, { useEffect, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Canvas from './CanvasWrapper/ChatWrapperIndex';
import { DEFAULT_CARD_DATA, DEVICE_SIZES } from './constants';
import {
  useClipboard,
  useComponentSelection,
  useConfigManagement,
  useFocusManagement,
  useHistory,
  useKeyboardShortcuts,
  useOutlineTree,
} from './hooks/index';
import { ExportModal, ImportModal, PreviewModal } from './Modals/index';
import { ComponentPanel, PropertyPanel } from './PropertyPanel';
import Toolbar from './ToolBar';
import {
  CardDesignData,
  ComponentType,
  TitleComponent,
  Variable,
  VariableItem,
} from './type';
import { createDefaultComponent, generateId } from './utils';
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
      return DEFAULT_CARD_DATA;
    }
    return data;
  }, [history.data]);

  // 处理变量更新 - 同时更新本地状态、缓存和卡片数据结构
  const handleUpdateVariables = (newVariables: VariableItem[]) => {
    // 创建新的变量数组，确保引用发生变化
    const updatedVariables =
      newVariables?.map((variable) => ({
        ...variable,
        _lastUpdated: Date.now(), // 添加时间戳确保引用变化
      })) || [];

    // 立即更新本地状态
    setVariables(updatedVariables);

    // 更新变量缓存
    variableCacheManager.setVariables(updatedVariables);

    // 将变量转换为卡片数据结构格式并更新
    const cardVariables: { [key: string]: any } = {};

    updatedVariables?.forEach((variable) => {
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

  // 添加组件到根节点
  const addComponentToRoot = (component: ComponentType) => {
    const newData = {
      ...safeCardData,
      dsl: {
        ...safeCardData.dsl,
        body: {
          ...safeCardData.dsl.body,
          elements: [...safeCardData.dsl.body.elements, component],
        },
      },
    };
    history.updateData(newData as any);
  };

  // 添加标题组件到画布最上方（dsl.header位置）
  const addTitleComponentToHeader = (titleComponent: TitleComponent) => {
    const newData = {
      ...safeCardData,
      dsl: {
        ...safeCardData.dsl,
        header: {
          ...safeCardData.dsl.header,
          title: { content: titleComponent.title.content },
          subtitle: { content: titleComponent.subtitle.content },
          style: titleComponent.style,
        },
        body: {
          ...safeCardData.dsl.body,
        },
      },
    };
    history.updateData(newData as any);
    message.success('已添加标题组件到画布最上方');
  };

  // 添加组件到指定路径
  const addComponentToPath = (
    path: (string | number)[],
    component: ComponentType,
  ) => {
    let newData = JSON.parse(JSON.stringify(safeCardData));

    try {
      // 根据路径类型决定添加位置
      if (
        path.length === 4 &&
        path[0] === 'dsl' &&
        path[1] === 'body' &&
        path[2] === 'elements'
      ) {
        // 根级组件路径: ['dsl', 'body', 'elements', index]
        const targetIndex = path[3] as number;
        newData.dsl.body.elements.splice(targetIndex + 1, 0, component);
      } else if (path.length === 6 && path[4] === 'elements') {
        // 表单内组件路径: ['dsl', 'body', 'elements', formIndex, 'elements', componentIndex]
        const formIndex = path[3] as number;
        const componentIndex = path[5] as number;
        const formComponent = newData.dsl.body.elements[formIndex];

        if (
          formComponent &&
          formComponent.tag === 'form' &&
          formComponent.elements
        ) {
          formComponent.elements.splice(componentIndex + 1, 0, component);
        }
      } else if (path.length === 8 && path[4] === 'columns') {
        // 分栏列路径: ['dsl', 'body', 'elements', columnSetIndex, 'columns', columnIndex, 'elements', componentIndex]
        const columnSetIndex = path[3] as number;
        const columnIndex = path[5] as number;
        const componentIndex = path[7] as number;
        const columnSetComponent = newData.dsl.body.elements[columnSetIndex];

        if (
          columnSetComponent &&
          columnSetComponent.tag === 'column_set' &&
          columnSetComponent.columns &&
          columnSetComponent.columns[columnIndex]
        ) {
          const targetColumn = columnSetComponent.columns[columnIndex];
          if (targetColumn.elements) {
            targetColumn.elements.splice(componentIndex + 1, 0, component);
          }
        }
      } else if (path.length === 10 && path[6] === 'columns') {
        // 表单内分栏列路径: ['dsl', 'body', 'elements', formIndex, 'elements', columnSetIndex, 'columns', columnIndex, 'elements', componentIndex]
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
            columnSetComponent.columns &&
            columnSetComponent.columns[columnIndex]
          ) {
            const targetColumn = columnSetComponent.columns[columnIndex];
            if (targetColumn.elements) {
              targetColumn.elements.splice(componentIndex + 1, 0, component);
            }
          }
        }
      } else {
        // 其他情况，添加到根节点
        newData.dsl.body.elements.push(component);
      }

      history.updateData(newData as any);
    } catch (error) {
      console.error('❌ 添加组件失败:', error);
    }
  };

  // 处理组件库点击事件 - 添加组件到画布
  const handleComponentClick = (componentType: string) => {
    const newComponent: ComponentType = createDefaultComponent(componentType);

    if (!newComponent) {
      console.error('❌ 无法创建组件:', componentType);
      return;
    }

    // 特殊处理标题组件
    if (componentType === 'title') {
      if (safeCardData?.dsl?.header) {
        message.warning('画布中已存在标题组件，无法重复添加');
        return;
      }

      // 标题组件始终添加到画布最上方（dsl.header位置）
      addTitleComponentToHeader(newComponent as TitleComponent);
      return;
    }

    // 特殊处理表单容器组件
    if (componentType === 'form') {
      const hasForm = safeCardData.dsl.body.elements.some((item) => {
        return item.tag === 'form';
      });
      // 检查画布中是否已存在表单容器
      if (hasForm) {
        return;
      }
    }

    // 其他组件的正常逻辑
    if (selection.selectedPath && selection.selectedPath.length > 0) {
      // 有激活的组件，在其下方添加
      addComponentToPath(selection.selectedPath, newComponent);
    } else {
      // 没有激活的组件，添加到根节点
      addComponentToRoot(newComponent);
    }
  };

  // 组合操作函数
  const handleCopy = () => {
    if (selection.selectedComponent) {
      clipboard.copyComponent(selection.selectedComponent);
    }
  };

  // 对于卡片结构，粘贴到卡片内
  const handlePaste = () => {
    if (clipboard.clipboard) {
      if (['title', 'form'].includes(clipboard.clipboard.tag)) return;
      const newComponent = {
        ...clipboard.clipboard,
        id: generateId(),
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
    if (path[0] !== 'dsl' || path.length === 1) {
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
    if (path.length === 4) {
      // 根级组件: ['dsl', 'body', 'elements', index]
      const index = path[3] as number;
      newData.dsl.body.elements.splice(index, 1);
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
        } else {
          // 重新计算剩余列的宽度 - 确保每列都有flex属性
          columnSetComponent.columns = columnSetComponent.columns.map(
            (col: any) => ({
              ...col,
              style: {
                ...col.style,
                flex: col.style?.flex || 1,
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
            column.elements.splice(componentIndex, 1);
          }
        }
      }
    }

    if (path.length === 2 && path[1] === 'header') {
      delete newData.dsl.header;
    }

    history.updateData(newData as any);
    selection.clearSelection();
  };

  const handleSmartDelete = (path: (string | number)[]) => {
    // 检查是否为卡片本身，卡片不可删除
    if (path.length === 2 && path[0] === 'dsl' && path[1] === 'body') {
      return false;
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

      newData.dsl.header = headerData;
      history.updateData(newData as any);
      return;
    }

    // 检查是否是卡片选中状态
    if (path && path.length === 2 && path[0] === 'dsl' && path[1] === 'body') {
      return;
    }

    if (!path || path.length < 4) {
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
          return;
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
          }
        }
      }
    } else {
      console.warn('⚠️ 不支持的组件路径格式:', path);
      return;
    }

    history.updateData(newData as any);
    selection.selectComponent(
      updatedComponent,
      selection?.selectedPath as (string | number)[],
    );
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

  // 文件导入
  const handleFileUpload = (file: File) => {
    return config.handleFileUpload(file, history.updateData);
  };

  // 清空画布
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
        if (newData?.dsl?.header) {
          delete newData.dsl.header;
        }
        history.updateData(newData as any);
        selection.clearSelection();
      },
    });
  };

  // 保存
  const saveHandle = () => {
    message.success('保存成功');
  };

  // 发布
  const publishHandle = () => {
    console.warn('data===', {
      card_content: JSON.stringify(safeCardData),
      variable_content: variables ? JSON.stringify({ variables }) : '{}',
    });
    message.success('发布成功');
  };

  // 绑定快捷键
  useKeyboardShortcuts({
    undo: history.undo,
    redo: history.redo,
    copyComponent: clipboard.copyComponent,
    pasteComponent: handlePaste,
    smartDeleteComponent: handleSmartDelete,
    selectedComponent: selection.selectedComponent,
    selectedPath: selection.selectedPath,
    clipboard: clipboard.clipboard,
    canvasRef: focus.canvasRef,
  });

  // 从卡片数据结构初始化变量
  useEffect(() => {
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
          value: variableValue as string,
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
          return;
        } else {
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
          return;
        } else {
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
            return;
          } else {
            selection.clearSelection();
            return;
          }
        } else {
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
        selection.clearSelection();
      }
    }
  }, [safeCardData, selection.selectedPath, selection.selectedComponent?.id]);

  useEffect(() => {
    // getApplicationDetail(cardId).then((res) => {
    // 获取卡片信息
    // if (res?.card_id) {
    //   setCardInfo(res);
    // }
    // // 更新变量
    // if (res?.variable_content) {
    //   if (res?.variable_content === '{}') {
    //     handleUpdateVariables([]);
    //   } else {
    //     const result = JSON.parse(res?.variable_content);
    //     handleUpdateVariables(result.variables);
    //   }
    // }
    // 更新画布
    //   const data =
    //     res?.card_content && res?.card_content !== '{}'
    //       ? JSON.parse(res.card_content)
    //       : {};
    //   const newData = {
    //     ...safeCardData,
    //     name: res.card_name,
    //     id: res.card_id,
    //     ...data,
    //   };
    //   history.updateData(newData as any);
    // });
  }, []);

  return (
    <App>
      <DndProvider backend={HTML5Backend}>
        <div
          style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: '#e4e8ed',
          }}
        >
          {/* 顶部工具栏 - 显示卡片ID */}
          <Toolbar
            cardData={safeCardData}
            onImport={config.importConfig}
            onExport={() => config.exportConfig(safeCardData)}
            onPreview={() => setPreviewVisible(true)}
            onSave={saveHandle}
            onPublish={publishHandle}
          />

          {/* 主体区域 */}
          <div style={{ flex: 1, display: 'flex' }}>
            {/* 左侧组件面板 - 包含组件库和大纲树的Tab */}
            <ComponentPanel
              cardData={safeCardData}
              selectedPath={selection.selectedPath}
              onOutlineHover={outline.handleOutlineHover}
              onOutlineSelect={handleOutlineSelect}
              onComponentClick={handleComponentClick}
            />

            {/* 中间画布 - 会话卡片界面 */}
            <div style={{ flex: 1 }}>
              <div data-canvas="true" style={{ height: '100%' }}>
                <Canvas
                  data={safeCardData}
                  variables={variables as any[]}
                  onDeviceChange={setDevice}
                  canUndo={history.canUndo}
                  canRedo={history.canRedo}
                  onUndo={history.undo}
                  onRedo={history.redo}
                  selectedComponent={selection.selectedComponent}
                  clipboard={clipboard.clipboard}
                  onCopy={handleCopy}
                  onPaste={handlePaste}
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
                variables={variables as any[]}
                onUpdateVariables={handleUpdateVariables}
                cardVerticalSpacing={safeCardData.dsl.body.vertical_spacing}
                headerData={safeCardData.dsl.header}
                cardData={safeCardData}
              />
            </div>
          </div>

          {/* 导入  */}
          <ImportModal
            importModalVisible={config.importModalVisible}
            setImportModalVisible={config.setImportModalVisible}
            onFileUpload={handleFileUpload}
          />
          {/* 导出  */}
          <ExportModal
            exportModalVisible={config.exportModalVisible}
            setExportModalVisible={config.setExportModalVisible}
            exportData={config.exportData}
            onDownloadConfig={config.downloadConfig}
          />
          {/* 预览  */}
          <PreviewModal
            previewVisible={previewVisible}
            setPreviewVisible={setPreviewVisible}
            data={safeCardData}
            device={device}
            onClearCanvas={clearCanvas}
            onImportConfig={config.importConfig}
            variables={variables as any[]}
          />
        </div>
      </DndProvider>
    </App>
  );
};

export default CardDesigner;
