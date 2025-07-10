// card-designer-utils.ts - 工具函数文件

import { ComponentType, DesignData } from './card-designer-types';

// 生成唯一ID
export const generateId = (): string => {
  return (
    'comp_' + Date.now().toString(36) + Math.random().toString(36).substr(2)
  );
};

// 创建默认组件
export const createDefaultComponent = (type: string): ComponentType => {
  const baseComponent = {
    id: generateId(),
    tag: type,
  };

  switch (type) {
    case 'plain_text':
      return {
        ...baseComponent,
        tag: 'plain_text',
        content: '这是一段文本',
        textColor: '#000000',
        fontSize: 14,
        fontWeight: 'normal',
        textAlign: 'left',
      } as ComponentType;

    case 'rich_text':
      return {
        ...baseComponent,
        tag: 'rich_text',
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: '这是富文本内容',
                },
              ],
            },
          ],
        },
      } as ComponentType;

    case 'input':
      return {
        ...baseComponent,
        tag: 'input',
        name: `input_${Date.now()}`,
        placeholder: {
          content: '请输入内容',
        },
        default_value: {
          content: '',
        },
        inputType: 'text',
        required: false,
      } as ComponentType;

    case 'button':
      return {
        ...baseComponent,
        tag: 'button',
        name: `button_${Date.now()}`,
        text: {
          tag: 'plain_text',
          content: '按钮',
        },
        type: 'primary',
        size: 'middle',
        danger: false,
      } as ComponentType;

    case 'select_static':
      return {
        ...baseComponent,
        tag: 'select_static',
        name: `select_${Date.now()}`,
        required: false,
        options: [
          {
            value: 'option1',
            text: {
              content: '选项一',
              i18n_content: { 'en-US': 'Option 1' },
            },
          },
          {
            value: 'option2',
            text: {
              content: '选项二',
              i18n_content: { 'en-US': 'Option 2' },
            },
          },
        ],
      } as ComponentType;

    case 'multi_select_static':
      return {
        ...baseComponent,
        tag: 'multi_select_static',
        name: `multi_select_${Date.now()}`,
        required: false,
        options: [
          {
            value: 'option1',
            text: {
              content: '选项一',
              i18n_content: { 'en-US': 'Option 1' },
            },
          },
          {
            value: 'option2',
            text: {
              content: '选项二',
              i18n_content: { 'en-US': 'Option 2' },
            },
          },
        ],
      } as ComponentType;

    case 'img':
      return {
        ...baseComponent,
        tag: 'img',
        img_url: 'https://via.placeholder.com/300x200?text=图片',
        width: 300,
        height: 200,
      } as ComponentType;

    case 'img_combination':
      return {
        ...baseComponent,
        tag: 'img_combination',
        combination_mode: 'trisect',
        combination_transparent: false,
        img_list: [
          {
            img_url: 'https://via.placeholder.com/150x150?text=图片1',
            i18n_img_url: {
              'en-US': 'https://via.placeholder.com/150x150?text=Image1',
            },
          },
          {
            img_url: 'https://via.placeholder.com/150x150?text=图片2',
            i18n_img_url: {
              'en-US': 'https://via.placeholder.com/150x150?text=Image2',
            },
          },
          {
            img_url: 'https://via.placeholder.com/150x150?text=图片3',
            i18n_img_url: {
              'en-US': 'https://via.placeholder.com/150x150?text=Image3',
            },
          },
        ],
      } as ComponentType;

    case 'hr':
      return {
        ...baseComponent,
        tag: 'hr',
      } as ComponentType;

    case 'form':
      return {
        ...baseComponent,
        tag: 'form',
        name: `form_${Date.now()}`,
        elements: [],
      } as ComponentType;

    case 'column_set':
      return {
        ...baseComponent,
        tag: 'column_set',
        gap: 8,
        columns: [
          {
            tag: 'column',
            elements: [],
          },
          {
            tag: 'column',
            elements: [],
          },
        ],
      } as ComponentType;

    default:
      return {
        ...baseComponent,
        tag: 'plain_text',
        content: `未知组件类型: ${type}`,
      } as ComponentType;
  }
};

// 导出JSON配置
export const exportToJSON = (data: DesignData): string => {
  return JSON.stringify(data, null, 2);
};

const selectOptions = (list: any[]) => {
  return list
    .map(
      (opt: any) =>
        `<option value="${opt.value}">${
          opt.text?.content || opt.value
        }</option>`,
    )
    .join('');
};

const imgList = (list: any[]) => {
  return list
    .map(
      (img: any) =>
        `<img src="${img.img_url}" alt="图片" style="width: 100%; height: 100px; object-fit: cover; border-radius: 4px;" />`,
    )
    .join('');
};

const columnMap = (list: any[], renderComponent: any) => {
  return list
    .map((col: any) => {
      const colElements = (col.elements || []).map(renderComponent).join('');
      return `<div style="flex: 1;">${colElements}</div>`;
    })
    .join('');
};
// 从JSON导入配置
export const importFromJSON = (jsonString: string): DesignData | null => {
  try {
    const parsed = JSON.parse(jsonString);

    // 验证数据结构
    if (
      parsed &&
      typeof parsed === 'object' &&
      parsed.direction &&
      Array.isArray(parsed.elements)
    ) {
      return parsed as DesignData;
    }

    return null;
  } catch (error) {
    console.error('JSON解析失败:', error);
    return null;
  }
};

// 生成预览HTML
export const generatePreviewHTML = (data: DesignData): string => {
  // 递归渲染组件
  const renderComponent = (component: ComponentType): string => {
    const comp = component as any;

    switch (component.tag) {
      case 'plain_text':
        return `<div style="color: ${comp.textColor || '#000'}; font-size: ${
          comp.fontSize || 14
        }px; font-weight: ${comp.fontWeight || 'normal'}; text-align: ${
          comp.textAlign || 'left'
        }; margin: 8px 0;">${comp.content || ''}</div>`;

      case 'rich_text':
        return `<div style="padding: 8px; border: 1px solid #f0f0f0; border-radius: 4px; margin: 8px 0;">${
          comp.content?.content?.[0]?.content?.[0]?.text || ''
        }</div>`;

      case 'input':
        return `<input type="${comp.inputType || 'text'}" placeholder="${
          comp.placeholder?.content || ''
        }" value="${
          comp.default_value?.content || ''
        }" style="width: 100%; padding: 8px; border: 1px solid #d9d9d9; border-radius: 4px; margin: 8px 0;" />`;

      case 'button':
        return `<button style="padding: 8px 16px; border: 1px solid #d9d9d9; border-radius: 4px; cursor: pointer; margin: 8px 0; ${
          comp.type === 'primary'
            ? 'background-color: #1890ff; color: white;'
            : 'background-color: white; color: #333;'
        }">${comp.text?.content || '按钮'}</button>`;

      case 'select_static':
      case 'multi_select_static':
        return `<select ${
          component.tag === 'multi_select_static' ? 'multiple' : ''
        } style="width: 100%; padding: 8px; border: 1px solid #d9d9d9; border-radius: 4px; margin: 8px 0;">${selectOptions(
          comp.options || [],
        )}</select>`;

      case 'img':
        return `<img src="${comp.img_url}" alt="图片" style="max-width: 100%; height: auto; border-radius: 4px; margin: 8px 0;" />`;

      case 'img_combination':
        return `<div style="display: grid; grid-template-columns: repeat(${
          comp.combination_mode === 'trisect'
            ? 3
            : comp.combination_mode === 'bisect'
            ? 2
            : 2
        }, 1fr); gap: 8px; margin: 8px 0;">${imgList(
          comp.img_list || [],
        )}</div>`;

      case 'hr':
        return `<hr style="border: none; border-top: 1px solid #d9d9d9; margin: 16px 0;" />`;

      case 'form':
        return `<form style="border: 1px solid #d9d9d9; padding: 16px; border-radius: 8px; margin: 8px 0;"><h3>📋 ${
          comp.name || '表单'
        }</h3>${(comp.elements || []).map(renderComponent).join('')}</form>`;

      case 'column_set':
        return `<div style="display: flex; gap: ${
          comp.gap || 8
        }px; margin: 8px 0;">${columnMap(
          comp.columns || [],
          renderComponent,
        )}</div>`;

      default:
        return `<div style="padding: 8px; border: 1px dashed #ccc; margin: 8px 0;">未知组件: ${component.tag}</div>`;
    }
  };

  const bodyContent = data.elements.map(renderComponent).join('');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>卡片预览</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body>
    <div class="container">
        ${
          bodyContent ||
          '<p style="text-align: center; color: #999;">暂无内容</p>'
        }
    </div>
</body>
</html>`;
};

// 验证组件数据完整性
export const validateComponent = (component: ComponentType): boolean => {
  if (!component || typeof component !== 'object') {
    return false;
  }

  if (!component.id || !component.tag) {
    return false;
  }

  // 根据组件类型进行特定验证
  switch (component.tag) {
    case 'form':
      return Array.isArray(component?.elements);

    case 'column_set':
      return (
        Array.isArray(component?.columns) &&
        component?.columns.every(
          (col: any) => col.tag === 'column' && Array.isArray(col.elements),
        )
      );

    case 'input':
    case 'button':
    case 'select_static':
    case 'multi_select_static':
      return typeof component?.name === 'string';

    default:
      return true;
  }
};

// 深拷贝组件
export const cloneComponent = (component: ComponentType): ComponentType => {
  const cloned = JSON.parse(JSON.stringify(component));
  cloned.id = generateId();

  // 递归更新子组件ID
  const updateChildIds = (obj: any) => {
    if (Array.isArray(obj)) {
      obj.forEach(updateChildIds);
    } else if (obj && typeof obj === 'object') {
      if (obj.id && obj.tag) {
        obj.id = generateId();
      }
      Object.values(obj).forEach(updateChildIds);
    }
  };

  updateChildIds(cloned);
  return cloned;
};

// 查找组件
export const findComponentById = (
  data: DesignData,
  id: string,
): ComponentType | null => {
  const search = (elements: ComponentType[]): ComponentType | null => {
    for (const element of elements) {
      if (element.id === id) {
        return element;
      }

      // 搜索容器组件的子元素
      if (element.tag === 'form') {
        const formElement = element as any;
        if (formElement.elements) {
          const found = search(formElement.elements);
          if (found) return found;
        }
      } else if (element.tag === 'column_set') {
        const colElement = element as any;
        if (colElement.columns) {
          for (const column of colElement.columns) {
            if (column.elements) {
              const found = search(column.elements);
              if (found) return found;
            }
          }
        }
      }
    }
    return null;
  };

  return search(data.elements);
};

// 获取组件路径
export const getComponentPath = (
  data: DesignData,
  id: string,
): (string | number)[] | null => {
  const search = (
    elements: ComponentType[],
    basePath: (string | number)[],
  ): (string | number)[] | null => {
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      const currentPath = [...basePath, i];

      if (element.id === id) {
        return currentPath;
      }

      // 搜索容器组件的子元素
      if (element.tag === 'form') {
        const formElement = element as any;
        if (formElement.elements) {
          const found = search(formElement.elements, [
            ...currentPath,
            'elements',
          ]);
          if (found) return found;
        }
      } else if (element.tag === 'column_set') {
        const colElement = element as any;
        if (colElement.columns) {
          for (let j = 0; j < colElement.columns.length; j++) {
            const column = colElement.columns[j];
            if (column.elements) {
              const found = search(column.elements, [
                ...currentPath,
                'columns',
                j,
                'elements',
              ]);
              if (found) return found;
            }
          }
        }
      }
    }
    return null;
  };

  return search(data.elements, ['elements']);
};
