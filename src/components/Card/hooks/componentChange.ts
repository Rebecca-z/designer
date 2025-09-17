import { useCallback } from 'react';
import { ComponentType, DesignData } from '../type';
import { isInPropertyPanel, isInputElement } from '../utils';

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
