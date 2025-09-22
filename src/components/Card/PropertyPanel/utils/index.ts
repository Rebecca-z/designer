// PropertyPanel 工具函数
import { CardDesignData, ComponentType } from '../../type';

// 获取组件在数据结构中的实际路径和组件
export const getComponentRealPath = (
  data: CardDesignData,
  selectedPath: (string | number)[] | null,
): {
  component: ComponentType | null;
  realPath: (string | number)[] | null;
} => {
  if (!selectedPath) {
    return { component: null, realPath: null };
  }

  // 检查是否是卡片选中状态：['dsl', 'body']
  if (
    selectedPath.length === 2 &&
    selectedPath[0] === 'dsl' &&
    selectedPath[1] === 'body'
  ) {
    return { component: null, realPath: selectedPath };
  }

  // 检查是否是标题组件选中状态：['dsl', 'header']
  if (
    selectedPath &&
    selectedPath.length === 2 &&
    selectedPath[0] === 'dsl' &&
    selectedPath[1] === 'header'
  ) {
    // 创建一个虚拟的标题组件用于属性编辑，包含所有必要的属性
    const titleComponent: ComponentType = {
      id: data.dsl.header?.id || 'title-componen',
      tag: 'title',
      title: data.dsl.header?.title?.content || '主标题',
      subtitle: data.dsl.header?.subtitle?.content || '副标题',
      style: (data.dsl.header?.style || 'blue') as
        | 'blue'
        | 'wathet'
        | 'turquoise'
        | 'green'
        | 'yellow'
        | 'orange'
        | 'red',
    } as any;
    return { component: titleComponent, realPath: selectedPath };
  }

  if (selectedPath.length < 4) {
    return { component: null, realPath: null };
  }

  // 检查是否是卡片根元素路径：['dsl', 'body', 'elements', index] (长度必须为4)
  if (
    selectedPath.length === 4 &&
    selectedPath[0] === 'dsl' &&
    selectedPath[1] === 'body' &&
    selectedPath[2] === 'elements'
  ) {
    const index = selectedPath[3] as number;
    const component = data.dsl.body.elements[index];

    if (component) {
      return { component, realPath: selectedPath };
    }
  }

  // 检查是否是表单内的组件路径：['dsl', 'body', 'elements', formIndex, 'elements', componentIndex]
  if (
    selectedPath.length === 6 &&
    selectedPath[0] === 'dsl' &&
    selectedPath[1] === 'body' &&
    selectedPath[2] === 'elements' &&
    selectedPath[4] === 'elements'
  ) {
    const formIndex = selectedPath[3] as number;
    const componentIndex = selectedPath[5] as number;
    const formComponent = data.dsl.body.elements[formIndex];

    if (formComponent && formComponent.tag === 'form') {
      const formElements = (formComponent as any).elements || [];
      const component = formElements[componentIndex];

      if (component) {
        return { component, realPath: selectedPath };
      } else {
        console.warn('⚠️ 表单内组件索引无效:', {
          formIndex,
          componentIndex,
          formElementsLength: formElements.length,
          formComponent: formComponent,
        });
      }
    }
  }

  // 检查是否是表单内分栏容器内的组件路径：['dsl', 'body', 'elements', formIndex, 'elements', columnSetIndex, 'columns', columnIndex, 'elements', componentIndex]
  if (
    selectedPath.length === 10 &&
    selectedPath[0] === 'dsl' &&
    selectedPath[1] === 'body' &&
    selectedPath[2] === 'elements' &&
    selectedPath[4] === 'elements' &&
    selectedPath[6] === 'columns' &&
    selectedPath[8] === 'elements'
  ) {
    const formIndex = selectedPath[3] as number;
    const columnSetIndex = selectedPath[5] as number;
    const columnIndex = selectedPath[7] as number;
    const componentIndex = selectedPath[9] as number;
    const formComponent = data.dsl.body.elements[formIndex];

    if (formComponent && formComponent.tag === 'form') {
      const formElements = (formComponent as any).elements || [];
      const columnSetComponent = formElements[columnSetIndex];

      if (columnSetComponent && columnSetComponent.tag === 'column_set') {
        const columns = (columnSetComponent as any).columns || [];
        const column = columns[columnIndex];

        if (column && column.elements) {
          const component = column.elements[componentIndex];

          if (component) {
            return { component, realPath: selectedPath };
          } else {
            console.warn('⚠️ 表单内分栏容器内的组件索引无效:', {
              formIndex,
              columnSetIndex,
              columnIndex,
              componentIndex,
              columnElementsLength: column.elements?.length || 0,
            });
          }
        } else {
          console.warn('⚠️ 表单内分栏容器的列无效:', {
            formIndex,
            columnSetIndex,
            columnIndex,
            columnsLength: columns.length,
          });
        }
      } else {
        console.warn('⚠️ 表单内分栏容器无效:', {
          formIndex,
          columnSetIndex,
          columnSetComponent,
        });
      }
    }
  }

  // 检查是否是根级别分栏列选中路径：['dsl', 'body', 'elements', columnSetIndex, 'columns', columnIndex]
  if (
    selectedPath.length === 6 &&
    selectedPath[0] === 'dsl' &&
    selectedPath[1] === 'body' &&
    selectedPath[2] === 'elements' &&
    selectedPath[4] === 'columns'
  ) {
    const columnSetIndex = selectedPath[3] as number;
    const columnIndex = selectedPath[5] as number;
    const columnSetComponent = data.dsl.body.elements[columnSetIndex];

    if (columnSetComponent && columnSetComponent.tag === 'column_set') {
      const columns = (columnSetComponent as any).columns || [];
      const column = columns[columnIndex];

      if (column) {
        // 创建一个虚拟的分栏列组件用于属性编辑
        const columnComponent: ComponentType = {
          id: `${columnSetComponent.id}_column_${columnIndex}`,
          tag: 'column',
          ...column,
        };
        return { component: columnComponent, realPath: selectedPath };
      }
    }
  }

  // 检查是否是表单内分栏列选中路径：['dsl', 'body', 'elements', formIndex, 'elements', columnSetIndex, 'columns', columnIndex]
  if (
    selectedPath.length === 8 &&
    selectedPath[0] === 'dsl' &&
    selectedPath[1] === 'body' &&
    selectedPath[2] === 'elements' &&
    selectedPath[4] === 'elements' &&
    selectedPath[6] === 'columns'
  ) {
    const formIndex = selectedPath[3] as number;
    const columnSetIndex = selectedPath[5] as number;
    const columnIndex = selectedPath[7] as number;

    const formComponent = data.dsl.body.elements[formIndex];
    if (formComponent && formComponent.tag === 'form') {
      const formElements = (formComponent as any).elements || [];
      const columnSetComponent = formElements[columnSetIndex];

      if (columnSetComponent && columnSetComponent.tag === 'column_set') {
        const columns = (columnSetComponent as any).columns || [];
        const column = columns[columnIndex];

        if (column) {
          // 创建一个虚拟的分栏列组件用于属性编辑
          const columnComponent: ComponentType = {
            id: `${columnSetComponent.id}_column_${columnIndex}`,
            tag: 'column',
            ...column,
          };
          return { component: columnComponent, realPath: selectedPath };
        }
      }
    }
  }

  // 检查是否是表单内分栏内的组件路径：['dsl', 'body', 'elements', formIndex, 'elements', columnSetIndex, 'columns', columnIndex, 'elements', componentIndex]
  if (
    selectedPath.length === 10 &&
    selectedPath[0] === 'dsl' &&
    selectedPath[1] === 'body' &&
    selectedPath[2] === 'elements' &&
    selectedPath[4] === 'elements' &&
    selectedPath[6] === 'columns' &&
    selectedPath[8] === 'elements'
  ) {
    const formIndex = selectedPath[3] as number;
    const columnSetIndex = selectedPath[5] as number;
    const columnIndex = selectedPath[7] as number;
    const componentIndex = selectedPath[9] as number;

    const formComponent = data.dsl.body.elements[formIndex];
    if (formComponent && formComponent.tag === 'form') {
      const formElements = (formComponent as any).elements || [];
      const columnSetComponent = formElements[columnSetIndex];

      if (columnSetComponent && columnSetComponent.tag === 'column_set') {
        const columns = (columnSetComponent as any).columns || [];
        const column = columns[columnIndex];

        if (column && column.elements) {
          const component = column.elements[componentIndex];

          if (component) {
            return { component, realPath: selectedPath };
          }
        }
      }
    }
  }

  // 检查是否是嵌套表单内分栏容器选中路径：['dsl', 'body', 'elements', formIndex, 'elements', columnSetIndex, 'columns', columnIndex, 'elements', nestedFormIndex, 'elements', nestedColumnSetIndex]
  if (
    selectedPath.length === 12 &&
    selectedPath[0] === 'dsl' &&
    selectedPath[1] === 'body' &&
    selectedPath[2] === 'elements' &&
    selectedPath[4] === 'elements' &&
    selectedPath[6] === 'columns' &&
    selectedPath[8] === 'elements' &&
    selectedPath[10] === 'elements'
  ) {
    const formIndex = selectedPath[3] as number;
    const columnSetIndex = selectedPath[5] as number;
    const columnIndex = selectedPath[7] as number;
    const nestedFormIndex = selectedPath[9] as number;
    const nestedColumnSetIndex = selectedPath[11] as number;

    const formComponent = data.dsl.body.elements[formIndex];
    if (formComponent && formComponent.tag === 'form') {
      const formElements = (formComponent as any).elements || [];
      const columnSetComponent = formElements[columnSetIndex];

      if (columnSetComponent && columnSetComponent.tag === 'column_set') {
        const columns = (columnSetComponent as any).columns || [];
        const column = columns[columnIndex];

        if (column && column.elements) {
          const nestedFormComponent = column.elements[nestedFormIndex];

          if (nestedFormComponent && nestedFormComponent.tag === 'form') {
            const nestedFormElements =
              (nestedFormComponent as any).elements || [];
            const nestedColumnSetComponent =
              nestedFormElements[nestedColumnSetIndex];

            if (
              nestedColumnSetComponent &&
              nestedColumnSetComponent.tag === 'column_set'
            ) {
              return {
                component: nestedColumnSetComponent,
                realPath: selectedPath,
              };
            }
          }
        }
      }
    }
  }

  // 检查是否是嵌套表单内分栏列选中路径：['dsl', 'body', 'elements', formIndex, 'elements', columnSetIndex, 'columns', columnIndex, 'elements', nestedFormIndex, 'elements', nestedColumnSetIndex, 'columns', nestedColumnIndex]
  if (
    selectedPath.length === 14 &&
    selectedPath[0] === 'dsl' &&
    selectedPath[1] === 'body' &&
    selectedPath[2] === 'elements' &&
    selectedPath[4] === 'elements' &&
    selectedPath[6] === 'columns' &&
    selectedPath[8] === 'elements' &&
    selectedPath[10] === 'elements' &&
    selectedPath[12] === 'columns'
  ) {
    const formIndex = selectedPath[3] as number;
    const columnSetIndex = selectedPath[5] as number;
    const columnIndex = selectedPath[7] as number;
    const nestedFormIndex = selectedPath[9] as number;
    const nestedColumnSetIndex = selectedPath[11] as number;
    const nestedColumnIndex = selectedPath[13] as number;

    const formComponent = data.dsl.body.elements[formIndex];
    if (formComponent && formComponent.tag === 'form') {
      const formElements = (formComponent as any).elements || [];
      const columnSetComponent = formElements[columnSetIndex];

      if (columnSetComponent && columnSetComponent.tag === 'column_set') {
        const columns = (columnSetComponent as any).columns || [];
        const column = columns[columnIndex];

        if (column && column.elements) {
          const nestedFormComponent = column.elements[nestedFormIndex];

          if (nestedFormComponent && nestedFormComponent.tag === 'form') {
            const nestedFormElements =
              (nestedFormComponent as any).elements || [];
            const nestedColumnSetComponent =
              nestedFormElements[nestedColumnSetIndex];

            if (
              nestedColumnSetComponent &&
              nestedColumnSetComponent.tag === 'column_set'
            ) {
              const nestedColumns =
                (nestedColumnSetComponent as any).columns || [];
              const nestedColumn = nestedColumns[nestedColumnIndex];

              if (nestedColumn) {
                // 创建一个虚拟的嵌套分栏列组件用于属性编辑
                const nestedColumnComponent: ComponentType = {
                  id: `${nestedColumnSetComponent.id}_column_${nestedColumnIndex}`,
                  tag: 'column',
                  ...nestedColumn,
                };
                return {
                  component: nestedColumnComponent,
                  realPath: selectedPath,
                };
              }
            }
          }
        }
      }
    }
  }

  // 检查是否是嵌套表单内分栏内的组件路径：['dsl', 'body', 'elements', formIndex, 'elements', columnSetIndex, 'columns', columnIndex, 'elements', nestedFormIndex, 'elements', nestedColumnSetIndex, 'columns', nestedColumnIndex, 'elements', componentIndex]
  if (
    selectedPath.length === 16 &&
    selectedPath[0] === 'dsl' &&
    selectedPath[1] === 'body' &&
    selectedPath[2] === 'elements' &&
    selectedPath[4] === 'elements' &&
    selectedPath[6] === 'columns' &&
    selectedPath[8] === 'elements' &&
    selectedPath[10] === 'elements' &&
    selectedPath[12] === 'columns' &&
    selectedPath[14] === 'elements'
  ) {
    const formIndex = selectedPath[3] as number;
    const columnSetIndex = selectedPath[5] as number;
    const columnIndex = selectedPath[7] as number;
    const nestedFormIndex = selectedPath[9] as number;
    const nestedColumnSetIndex = selectedPath[11] as number;
    const nestedColumnIndex = selectedPath[13] as number;
    const componentIndex = selectedPath[15] as number;

    const formComponent = data.dsl.body.elements[formIndex];
    if (formComponent && formComponent.tag === 'form') {
      const formElements = (formComponent as any).elements || [];
      const columnSetComponent = formElements[columnSetIndex];

      if (columnSetComponent && columnSetComponent.tag === 'column_set') {
        const columns = (columnSetComponent as any).columns || [];
        const column = columns[columnIndex];

        if (column && column.elements) {
          const nestedFormComponent = column.elements[nestedFormIndex];

          if (nestedFormComponent && nestedFormComponent.tag === 'form') {
            const nestedFormElements =
              (nestedFormComponent as any).elements || [];
            const nestedColumnSetComponent =
              nestedFormElements[nestedColumnSetIndex];

            if (
              nestedColumnSetComponent &&
              nestedColumnSetComponent.tag === 'column_set'
            ) {
              const nestedColumns =
                (nestedColumnSetComponent as any).columns || [];
              const nestedColumn = nestedColumns[nestedColumnIndex];

              if (nestedColumn && nestedColumn.elements) {
                const component = nestedColumn.elements[componentIndex];

                if (component) {
                  return { component, realPath: selectedPath };
                }
              }
            }
          }
        }
      }
    }
  }

  // 检查是否是表单内分栏内的分栏组件路径：['dsl', 'body', 'elements', formIndex, 'elements', columnSetIndex, 'columns', columnIndex, 'elements', componentIndex, 'columns', nestedColumnIndex, 'elements', nestedComponentIndex]
  if (
    selectedPath.length === 14 &&
    selectedPath[0] === 'dsl' &&
    selectedPath[1] === 'body' &&
    selectedPath[2] === 'elements' &&
    selectedPath[4] === 'elements' &&
    selectedPath[6] === 'columns' &&
    selectedPath[8] === 'elements' &&
    selectedPath[10] === 'columns' &&
    selectedPath[12] === 'elements'
  ) {
    const formIndex = selectedPath[3] as number;
    const columnSetIndex = selectedPath[5] as number;
    const columnIndex = selectedPath[7] as number;
    const componentIndex = selectedPath[9] as number;
    const nestedColumnIndex = selectedPath[11] as number;
    const nestedComponentIndex = selectedPath[13] as number;

    const formComponent = data.dsl.body.elements[formIndex];
    if (formComponent && formComponent.tag === 'form') {
      const formElements = (formComponent as any).elements || [];
      const columnSetComponent = formElements[columnSetIndex];

      if (columnSetComponent && columnSetComponent.tag === 'column_set') {
        const columns = (columnSetComponent as any).columns || [];
        const column = columns[columnIndex];

        if (column && column.elements) {
          const nestedColumnSetComponent = column.elements[componentIndex];

          if (
            nestedColumnSetComponent &&
            nestedColumnSetComponent.tag === 'column_set'
          ) {
            const nestedColumns =
              (nestedColumnSetComponent as any).columns || [];
            const nestedColumn = nestedColumns[nestedColumnIndex];

            if (nestedColumn && nestedColumn.elements) {
              const component = nestedColumn.elements[nestedComponentIndex];

              if (component) {
                return { component, realPath: selectedPath };
              }
            }
          }
        }
      }
    }
  }

  // 检查是否是根级别分栏内的组件路径：['dsl', 'body', 'elements', columnSetIndex, 'columns', columnIndex, 'elements', componentIndex]
  if (
    selectedPath.length >= 8 &&
    selectedPath[0] === 'dsl' &&
    selectedPath[1] === 'body' &&
    selectedPath[2] === 'elements' &&
    selectedPath[4] === 'columns' &&
    selectedPath[6] === 'elements'
  ) {
    const columnSetIndex = selectedPath[3] as number;
    const columnIndex = selectedPath[5] as number;
    const componentIndex = selectedPath[7] as number;
    const columnSetComponent = data.dsl.body.elements[columnSetIndex];

    if (columnSetComponent && columnSetComponent.tag === 'column_set') {
      const columns = (columnSetComponent as any).columns || [];
      const column = columns[columnIndex];

      if (column && column.elements) {
        const component = column.elements[componentIndex];

        if (component) {
          return { component, realPath: selectedPath };
        }
      }
    }
  }

  console.warn('⚠️ 无法解析组件路径:', selectedPath);
  return { component: null, realPath: null };
};

// 获取变量对象的实际变量名（过滤掉内部属性）
export const getVariableKeys = (variable: any): string[] => {
  if (typeof variable === 'object' && variable !== null) {
    return Object.keys(variable as Record<string, any>).filter(
      (key) => !(key.startsWith('__') && key.endsWith('_originalType')),
    );
  }
  return [];
};

// 函数已在上面使用 export const 导出
