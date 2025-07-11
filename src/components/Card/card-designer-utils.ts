// card-designer-utils.ts - 更新的工具函数文件

import { ComponentType, DesignData } from './card-designer-types';

const selectHtml = (comp: any) => {
  const selectOptions = (comp.options || [])
    .map(
      (option: any) =>
        `<option value="${option.value || ''}">${
          option.text?.content || '选项'
        }</option>`,
    )
    .join('');

  return `
  <div style="margin: 12px 0;">
    <label style="
      display: block;
      margin-bottom: 6px;
      font-weight: 500;
      color: #333;
      font-size: 14px;
    ">
      ${comp.name || 'Select'} ${
    comp.required ? '<span style="color: #ff4d4f;">*</span>' : ''
  }
    </label>
    <select style="
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #d9d9d9;
      border-radius: 6px;
      font-size: 14px;
      background-color: white;
      cursor: pointer;
      box-sizing: border-box;
    ">
      <option value="">请选择</option>
      ${selectOptions}
    </select>
  </div>
`;
};

const buttonHtml = (comp: any) => {
  const buttonText = comp.text?.content || '按钮';
  const isSubmit = comp.form_action_type === 'submit';
  const isReset = comp.form_action_type === 'reset';

  let buttonStyle = `
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.3s;
    border: 1px solid;
    margin: 8px 4px;
  `;

  if (isSubmit) {
    buttonStyle += `
      background-color: #1890ff;
      border-color: #1890ff;
      color: white;
    `;
  } else if (isReset) {
    buttonStyle += `
      background-color: #ff7875;
      border-color: #ff7875;
      color: white;
    `;
  } else {
    buttonStyle += `
      background-color: #f5f5f5;
      border-color: #d9d9d9;
      color: #333;
    `;
  }

  return `
    <button 
      style="${buttonStyle}"
      onMouseOver="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.15)';"
      onMouseOut="this.style.transform='translateY(0)'; this.style.boxShadow='none';"
      type="${isSubmit ? 'submit' : isReset ? 'reset' : 'button'}"
    >
      ${buttonText}
      ${comp.form_action_type ? ` (${comp.form_action_type})` : ''}
    </button>
  `;
};

// 渲染单个列的内容
const renderColumnContent = (
  col: any,
  index: number,
  renderFn: (component: ComponentType) => string,
) => {
  const colElements = (col.elements || []).map(renderFn).join('');

  return `
    <div style="
      flex: 1;
      min-height: 100px;
      padding: 16px;
      border: 1px solid #e8e8e8;
      border-radius: 6px;
      background-color: #fafafa;
    ">
      <div style="
        font-size: 12px; 
        color: #666; 
        margin-bottom: 12px;
        font-weight: bold;
        text-align: center;
        padding: 4px;
        background-color: #f0f0f0;
        border-radius: 4px;
      ">
        📐 第${index + 1}列
      </div>
      ${
        colElements ||
        '<div style="color: #ccc; text-align: center; padding: 20px; font-size: 12px;">空列</div>'
      }
    </div>
  `;
};

// 渲染分栏布局
const columnsHtml = (
  comp: any,
  renderFn: (component: ComponentType) => string,
) => {
  const columnsContent = (comp.columns || [])
    .map((col: any, index: number) => renderColumnContent(col, index, renderFn))
    .join('');

  return `
  <div style="
    border: 2px solid #f0e6ff;
    padding: 16px;
    border-radius: 8px;
    margin: 16px 0;
    background-color: #fafafa;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  ">
    <div style="
      margin-bottom: 16px;
      font-weight: bold;
      color: #722ed1;
      font-size: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    ">
      📐 分栏布局 (${comp.columns?.length || 2}列)
    </div>
    <div style="display: flex; gap: 16px;">
      ${columnsContent}
    </div>
  </div>
`;
};

const imagesHtml = (comp: any) => {
  const imagesHtml = Array.from(
    {
      length: Math.max(
        comp.img_list?.length || 0,
        comp.combination_mode === 'trisect'
          ? 3
          : comp.combination_mode === 'quad'
          ? 4
          : 2,
      ),
    },
    (_, i) => {
      const img = comp.img_list?.[i];
      return `
      <div style="
        background-color: #f0f0f0;
        height: 120px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #999;
        font-size: 12px;
        border: 1px solid #e0e0e0;
        ${comp.combination_transparent ? 'opacity: 0.8;' : ''}
      ">
        🖼️ 图${i + 1}
        ${
          img
            ? `<br><small>${
                img.img_url ? img.img_url.substring(0, 15) + '...' : ''
              }</small>`
            : ''
        }
      </div>
    `;
    },
  ).join('');

  return `
    <div style="
      margin: 16px 0;
      padding: 16px;
      background-color: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 8px;
    ">
      <div style="
        margin-bottom: 12px;
        font-weight: bold;
        color: #495057;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 8px;
      ">
        🖼️ 多图混排 (${comp.combination_mode})
      </div>
      <div style="
        display: grid;
        grid-template-columns: repeat(${
          comp.combination_mode === 'trisect'
            ? 3
            : comp.combination_mode === 'quad'
            ? 4
            : 2
        }, 1fr);
        gap: 8px;
      ">
        ${imagesHtml}
      </div>
    </div>
  `;
};

const multiSelectHtml = (comp: any) => {
  const multiSelectOptions = (comp.options || [])
    .map(
      (option: any) =>
        `<option value="${option.value || ''}">${
          option.text?.content || '选项'
        }</option>`,
    )
    .join('');

  return `
        <div style="margin: 12px 0;">
          <label style="
            display: block;
            margin-bottom: 6px;
            font-weight: 500;
            color: #333;
            font-size: 14px;
          ">
            ${comp.name || 'MultiSelect'} (多选) ${
    comp.required ? '<span style="color: #ff4d4f;">*</span>' : ''
  }
          </label>
          <select multiple style="
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #d9d9d9;
            border-radius: 6px;
            font-size: 14px;
            background-color: white;
            cursor: pointer;
            box-sizing: border-box;
            min-height: 80px;
          ">
            ${multiSelectOptions}
          </select>
          <div style="
            font-size: 11px;
            color: #999;
            margin-top: 4px;
          ">
            按住 Ctrl/Cmd 键可多选
          </div>
        </div>
      `;
};
// 组件渲染工具函数
export const renderComponentToHTML = (component: ComponentType): string => {
  const comp = component as any;

  switch (component.tag) {
    case 'form':
      return `
        <form style="
          border: 2px solid #e6f7ff; 
          padding: 20px; 
          border-radius: 8px; 
          margin: 16px 0;
          background-color: #f6ffed;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        ">
          <div style="
            margin-bottom: 16px; 
            font-weight: bold; 
            color: #52c41a;
            font-size: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
          ">
            📋 ${comp.name || '表单'}
          </div>
          ${
            (comp.elements || []).map(renderComponentToHTML).join('') ||
            '<p style="color: #999; text-align: center; padding: 20px;">空表单</p>'
          }
        </form>
      `;

    case 'column_set':
      return columnsHtml(comp, renderComponentToHTML);

    case 'plain_text':
      return `
        <div style="
          margin: 12px 0;
          padding: 12px;
          background-color: white;
          border-radius: 6px;
          border: 1px solid #f0f0f0;
          line-height: 1.6;
          font-size: 14px;
          color: #333;
        ">
          ${comp.content || '普通文本内容'}
        </div>
      `;

    case 'rich_text':
      return `
        <div style="
          margin: 12px 0;
          padding: 16px;
          background-color: #fff7e6;
          border: 1px solid #ffd591;
          border-radius: 6px;
          line-height: 1.8;
          font-size: 14px;
          color: #333;
          position: relative;
        ">
          <div style="
            position: absolute;
            top: 8px;
            right: 8px;
            font-size: 10px;
            color: #fa8c16;
            background-color: #fff2e8;
            padding: 2px 6px;
            border-radius: 4px;
            border: 1px solid #ffbb96;
          ">
            📝 富文本
          </div>
          <div style="font-weight: 500;">${
            comp.content?.content?.[0]?.content?.[0]?.text || '富文本内容'
          }</div>
        </div>
      `;

    case 'hr':
      return `
        <div style="margin: 20px 0;">
          <hr style="
            border: none; 
            border-top: 2px solid #d9d9d9; 
            margin: 0;
            border-radius: 1px;
          " />
        </div>
      `;

    case 'img':
      return `
        <div style="
          margin: 16px 0;
          text-align: center;
          padding: 16px;
          background-color: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 8px;
        ">
          <div style="
            background-color: #e9ecef;
            height: 200px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #6c757d;
            font-size: 14px;
            position: relative;
          ">
            🖼️ 图片组件
            <div style="
              position: absolute;
              bottom: 8px;
              right: 8px;
              font-size: 10px;
              background-color: white;
              padding: 2px 6px;
              border-radius: 4px;
              border: 1px solid #dee2e6;
            ">
              ${
                comp.img_url
                  ? comp.img_url.substring(0, 20) + '...'
                  : 'img_placeholder'
              }
            </div>
          </div>
        </div>
      `;

    case 'img_combination':
      return imagesHtml(comp);

    case 'input':
      return `
        <div style="margin: 12px 0;">
          <label style="
            display: block;
            margin-bottom: 6px;
            font-weight: 500;
            color: #333;
            font-size: 14px;
          ">
            ${comp.name || 'Input'} ${
        comp.required ? '<span style="color: #ff4d4f;">*</span>' : ''
      }
          </label>
          <input 
            type="text" 
            placeholder="${comp.placeholder?.content || '请输入'}"
            value="${comp.default_value?.content || ''}"
            style="
              width: 100%;
              padding: 8px 12px;
              border: 1px solid #d9d9d9;
              border-radius: 6px;
              font-size: 14px;
              box-sizing: border-box;
              transition: border-color 0.3s;
              background-color: white;
            "
            onFocus="this.style.borderColor='#1890ff'; this.style.boxShadow='0 0 0 2px rgba(24,144,255,0.2)';"
            onBlur="this.style.borderColor='#d9d9d9'; this.style.boxShadow='none';"
          />
        </div>
      `;

    case 'button':
      return buttonHtml(comp);

    case 'select_static':
      return selectHtml(comp);

    case 'multi_select_static':
      return multiSelectHtml(comp);

    default:
      return `
        <div style="
          padding: 16px;
          border: 2px dashed #ff4d4f;
          border-radius: 6px;
          text-align: center;
          color: #ff4d4f;
          background-color: #fff2f0;
          margin: 8px 0;
          font-size: 14px;
        ">
          ❓ 未知组件类型: ${(component as any).tag || 'unknown'}
        </div>
      `;
  }
};

// 生成唯一ID
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// 创建默认组件 - 遵循新的数据结构
export const createDefaultComponent = (type: string): ComponentType => {
  switch (type) {
    case 'form':
      return {
        tag: 'form',
        name: `Form_${generateId()}`,
        elements: [],
        id: generateId(),
      } as ComponentType;

    case 'column_set':
      return {
        tag: 'column_set',
        id: generateId(),
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

    case 'plain_text':
      return {
        id: generateId(),
        tag: 'plain_text',
        content: '这是一段普通文本，以默认的字号、字色、行高、行数展示',
        i18n_content: {
          'en-US': 'this is a plaintext rendered with the default styles',
        },
      } as ComponentType;

    case 'rich_text':
      return {
        id: generateId(),
        tag: 'rich_text',
        content: {
          type: 'doc',
          content: [
            {
              content: [
                {
                  type: 'text',
                  text: '这是富文本内容示例',
                },
              ],
              type: 'paragraph',
            },
          ],
        },
        i18n_content: {
          'en-US': {
            type: 'doc',
            content: [
              {
                content: [
                  {
                    type: 'text',
                    text: 'This is rich text content example',
                  },
                ],
                type: 'paragraph',
              },
            ],
          },
        },
      } as ComponentType;

    case 'hr':
      return {
        tag: 'hr',
        id: generateId(),
      } as ComponentType;

    case 'img':
      return {
        id: generateId(),
        tag: 'img',
        img_url: 'img_v2_9dd98485-2900-4d65-ada9-e31d1408dcfg',
        i18n_img_url: {
          'en-US': 'img_v2_9dd98485-2900-4d65-ada9-e31d1408dcfg',
        },
      } as ComponentType;

    case 'img_combination':
      return {
        id: generateId(),
        tag: 'img_combination',
        combination_mode: 'trisect',
        combination_transparent: true,
        img_list: [
          {
            img_url: 'img_v2_9dd98485-2900-4d65-ada9-e31d1408dcfg',
            i18n_img_url: {
              'en-US': 'img_v2_9dd98485-2900-4d65-ada9-e31d1408dcfg',
            },
          },
          {
            img_url: 'img_v2_9dd98485-2900-4d65-ada9-e31d1408dcfg',
          },
        ],
      } as ComponentType;

    case 'input':
      return {
        id: generateId(),
        tag: 'input',
        name: `Input_${generateId()}`,
        required: false,
        default_value: {
          content: '',
          i18n_content: {
            'en-US': '',
          },
        },
        placeholder: {
          content: '请输入',
          i18n_content: {
            'en-US': 'input',
          },
        },
      } as ComponentType;

    case 'button':
      return {
        id: generateId(),
        tag: 'button',
        name: `Button_${generateId()}`,
        text: {
          tag: 'plain_text',
          content: '按钮',
          i18n_content: {
            'en-US': 'Button',
          },
        },
        behaviors: [
          {
            type: 'callback',
            callback: {
              action: 'click',
            },
          },
        ],
      } as ComponentType;

    case 'select_static':
      return {
        id: generateId(),
        tag: 'select_static',
        name: `Select_${generateId()}`,
        required: false,
        options: [
          {
            value: '1',
            text: {
              content: '选项1',
            },
          },
          {
            value: '2',
            text: {
              content: '选项2',
            },
          },
        ],
      } as ComponentType;

    case 'multi_select_static':
      return {
        id: generateId(),
        tag: 'multi_select_static',
        name: `MultiSelect_${generateId()}`,
        required: false,
        options: [
          {
            value: '1',
            text: {
              content: '选项1',
            },
          },
          {
            value: '2',
            text: {
              content: '选项2',
              i18n_content: {
                'en-US': 'option2',
              },
            },
          },
        ],
      } as ComponentType;

    default:
      return {
        id: generateId(),
        tag: 'plain_text',
        content: `未知组件类型: ${type}`,
        i18n_content: {
          'en-US': `Unknown component type: ${type}`,
        },
      } as ComponentType;
  }
};

// 转换为目标数据结构
export const convertToTargetFormat = (data: DesignData): any => {
  const convertComponent = (component: any): any => {
    // 移除内部使用的字段，只保留目标结构需要的字段
    const converted: any = {
      tag: component.tag,
    };

    // 根据组件类型添加特定字段
    switch (component.tag) {
      case 'form':
        converted.name = component.name;
        converted.elements = component.elements?.map(convertComponent) || [];
        break;

      case 'column_set':
        converted.columns =
          component.columns?.map((col: any) => ({
            tag: 'column',
            elements: col.elements?.map(convertComponent) || [],
          })) || [];
        break;

      case 'plain_text':
        converted.content = component.content;
        if (component.i18n_content) {
          converted.i18n_content = component.i18n_content;
        }
        break;

      case 'rich_text':
        converted.content = component.content;
        if (component.i18n_content) {
          converted.i18n_content = component.i18n_content;
        }
        break;

      case 'img':
        converted.img_url = component.img_url;
        if (component.i18n_img_url) {
          converted.i18n_img_url = component.i18n_img_url;
        }
        break;

      case 'img_combination':
        converted.combination_mode = component.combination_mode;
        converted.combination_transparent = component.combination_transparent;
        converted.img_list = component.img_list;
        break;

      case 'input':
        converted.name = component.name;
        converted.required = component.required;
        converted.default_value = component.default_value;
        converted.placeholder = component.placeholder;
        break;

      case 'button':
        converted.name = component.name;
        converted.text = component.text;
        if (component.form_action_type) {
          converted.form_action_type = component.form_action_type;
        }
        if (component.behaviors) {
          converted.behaviors = component.behaviors;
        }
        break;

      case 'select_static':
      case 'multi_select_static':
        converted.name = component.name;
        converted.required = component.required;
        converted.options = component.options;
        break;

      case 'hr':
        // 分割线组件没有额外字段

        break;

      default:
        // 保留所有字段
        Object.assign(converted, component);
        break;
    }

    return converted;
  };

  return {
    direction: 'vertical',
    vertical_spacing: 5,
    elements: data.elements.map(convertComponent),
  };
};

// 从目标格式转换回内部格式
export const convertFromTargetFormat = (targetData: any): DesignData => {
  const convertComponent = (component: any): ComponentType => {
    // 为组件添加内部需要的id字段
    const converted: any = {
      ...component,
      id: component.id || generateId(),
    };

    // 处理嵌套结构
    if (component.tag === 'form' && component.elements) {
      converted.elements = component.elements.map(convertComponent);
    }

    if (component.tag === 'column_set' && component.columns) {
      converted.columns = component.columns.map((col: any) => ({
        ...col,
        elements: col.elements?.map(convertComponent) || [],
      }));
    }

    return converted as ComponentType;
  };

  return {
    direction: targetData.direction || 'vertical',
    vertical_spacing: targetData.vertical_spacing || 5,
    elements: (targetData.elements || []).map(convertComponent),
  };
};

// 导出JSON配置
export const exportToJSON = (data: DesignData): string => {
  const targetFormat = convertToTargetFormat(data);
  return JSON.stringify(targetFormat, null, 2);
};

// 获取空内容占位符
const getEmptyContent = (): string => {
  return `
    <div style="
        text-align: center; 
        color: #999; 
        padding: 60px 0;
        border: 2px dashed #e0e0e0;
        border-radius: 8px;
        background-color: #fafafa;
    ">
        <div style="font-size: 48px; margin-bottom: 16px;">📝</div>
        <h3 style="margin: 0 0 8px 0; color: #666;">暂无内容</h3>
        <p style="margin: 0; font-size: 14px;">请在设计器中添加组件</p>
    </div>
  `;
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
      return convertFromTargetFormat(parsed);
    }

    return null;
  } catch (error) {
    console.error('JSON解析失败:', error);
    return null;
  }
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

// 获取HTML模板
const getHTMLTemplate = (): string => {
  // 在实际项目中，这里应该从外部文件读取模板
  // 例如：import htmlTemplate from './preview-template.html';
  // 或者通过 fetch 请求获取

  // 这里为了演示，直接返回模板字符串
  // 实际使用时，建议将模板存储在单独的 .html 文件中
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{TITLE}}</title>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
            line-height: 1.6; margin: 0; padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 800px; margin: 0 auto; background-color: white;
            padding: 32px; border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            position: relative; overflow: hidden;
        }
        .container::before {
            content: ''; position: absolute; top: -2px; left: -2px; right: -2px; bottom: -2px;
            background: linear-gradient(45deg, #667eea, #764ba2, #667eea);
            border-radius: 12px; z-index: -1;
        }
        .header {
            text-align: center; margin-bottom: 32px; padding-bottom: 20px;
            border-bottom: 2px solid #f0f0f0; position: relative;
        }
        .header::after {
            content: ''; position: absolute; bottom: -2px; left: 50%; transform: translateX(-50%);
            width: 100px; height: 2px; background: linear-gradient(90deg, #667eea, #764ba2);
            border-radius: 1px;
        }
        .header h1 {
            color: #333; margin: 0 0 8px 0; font-size: 28px; font-weight: 600;
            background: linear-gradient(135deg, #667eea, #764ba2);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .header p { color: #666; margin: 0; font-size: 14px; }
        .stats {
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            padding: 20px; border-radius: 12px; margin-bottom: 24px;
            display: flex; justify-content: space-around; text-align: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .stat-item { flex: 1; position: relative; }
        .stat-item:not(:last-child)::after {
            content: ''; position: absolute; right: 0; top: 50%; transform: translateY(-50%);
            width: 1px; height: 60%; background-color: rgba(255,255,255,0.5);
        }
        .stat-number {
            font-size: 24px; font-weight: bold; color: #333;
            margin-bottom: 4px; display: block;
        }
        .stat-label { font-size: 12px; color: #666; font-weight: 500; }
        .content { margin: 24px 0; min-height: 200px; }
        .footer {
            margin-top: 40px; padding-top: 20px; border-top: 2px solid #f0f0f0;
            text-align: center; color: #999; font-size: 12px; position: relative;
        }
        .footer::before {
            content: ''; position: absolute; top: -2px; left: 50%; transform: translateX(-50%);
            width: 100px; height: 2px; background: linear-gradient(90deg, #667eea, #764ba2);
            border-radius: 1px;
        }
        .footer p { margin: 8px 0; line-height: 1.5; }
        .footer .tech-info {
            background-color: #f8f9fa; padding: 12px; border-radius: 8px;
            margin: 16px 0; border: 1px solid #e9ecef;
        }
        @media (max-width: 768px) {
            body { padding: 10px; }
            .container { padding: 20px; margin: 0; }
            .stats { flex-direction: column; gap: 12px; }
            .stat-item:not(:last-child)::after { display: none; }
            .header h1 { font-size: 24px; }
            .stat-number { font-size: 20px; }
        }
        .container { transition: all 0.3s ease; }
        .container:hover { transform: translateY(-2px); box-shadow: 0 25px 50px rgba(0,0,0,0.15); }
        @media print {
            body { background: white; padding: 0; }
            .container { box-shadow: none; border: 1px solid #ddd; margin: 0; padding: 20px; }
            .container::before { display: none; }
            .container:hover { transform: none; }
            .header h1 { color: #333 !important; -webkit-text-fill-color: #333 !important; }
            .stats { background: #f5f5f5; border: 1px solid #ddd; }
        }
    </style>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const container = document.querySelector('.container');
            container.style.opacity = '0';
            container.style.transform = 'translateY(20px)';
            setTimeout(() => {
                container.style.transition = 'all 0.6s ease';
                container.style.opacity = '1';
                container.style.transform = 'translateY(0)';
            }, 100);
            
            const statNumbers = document.querySelectorAll('.stat-number');
            statNumbers.forEach(function(element) {
                const finalValue = parseInt(element.textContent) || 0;
                let currentValue = 0;
                const increment = Math.ceil(finalValue / 20);
                const timer = setInterval(function() {
                    currentValue += increment;
                    if (currentValue >= finalValue) {
                        currentValue = finalValue;
                        clearInterval(timer);
                    }
                    if (element.textContent.includes('px')) {
                        element.textContent = currentValue + 'px';
                    } else {
                        element.textContent = currentValue;
                    }
                }, 50);
            });
            
            document.addEventListener('keydown', function(e) {
                if (e.ctrlKey && e.key === 'p') {
                    e.preventDefault();
                    window.print();
                }
                if (e.ctrlKey && e.key === 's') {
                    e.preventDefault();
                    const link = document.createElement('a');
                    link.download = 'card-preview-' + new Date().toISOString().split('T')[0] + '.html';
                    link.href = 'data:text/html;charset=utf-8,' + encodeURIComponent(document.documentElement.outerHTML);
                    link.click();
                }
            });
            
            console.log('🎨 卡片设计器预览页面已加载完成');
        });
    </script>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎨 {{TITLE}}</h1>
            <p>由卡片设计器生成 • {{TIMESTAMP}}</p>
        </div>
        <div class="stats">
            <div class="stat-item">
                <span class="stat-number">{{TOTAL_COMPONENTS}}</span>
                <div class="stat-label">组件总数</div>
            </div>
            <div class="stat-item">
                <span class="stat-number">{{FORM_COUNT}}</span>
                <div class="stat-label">表单容器</div>
            </div>
            <div class="stat-item">
                <span class="stat-number">{{COLUMN_COUNT}}</span>
                <div class="stat-label">分栏组件</div>
            </div>
            <div class="stat-item">
                <span class="stat-number">{{VERTICAL_SPACING}}px</span>
                <div class="stat-label">垂直间距</div>
            </div>
        </div>
        <div class="content">
            {{BODY_CONTENT}}
        </div>
        <div class="footer">
            <div class="tech-info">
                <p>⚡ <strong>技术支持：</strong>卡片设计器 | 📊 <strong>数据结构版本：</strong>v1.0 | 🔄 <strong>布局方向：</strong>{{DIRECTION}} | 📱 <strong>响应式设计</strong></p>
            </div>
            <p>🎨 此预览页面可以保存为HTML文件、直接打印或转换为PDF</p>
            <p>💡 支持深色模式、高对比度模式和无障碍访问</p>
            <p style="margin-top: 16px; font-size: 10px; opacity: 0.7;">Generated by Card Designer • {{TIMESTAMP}} • 版权所有</p>
        </div>
    </div>
</body>
</html>`;
};

// 在实际项目中推荐的模板加载方式：
export const loadHTMLTemplate = async (): Promise<string> => {
  try {
    // 方式1：通过 fetch 加载外部模板文件
    const response = await fetch('/templates/preview-template.html');
    return await response.text();
  } catch (error) {
    console.warn('无法加载外部模板文件，使用内置模板');
    // 回退到内置模板
    return getHTMLTemplate();
  }
};

// 异步版本的 generatePreviewHTML
export const generatePreviewHTMLAsync = async (
  data: DesignData,
): Promise<string> => {
  const bodyContent = data.elements.map(renderComponentToHTML).join('');

  // 统计信息
  const stats = {
    totalComponents: data.elements.length,
    formCount: data.elements.filter((el) => el.tag === 'form').length,
    columnCount: data.elements.filter((el) => el.tag === 'column_set').length,
    verticalSpacing: data.vertical_spacing,
  };

  const timestamp = new Date().toLocaleString();

  // 尝试加载外部模板
  const template = await loadHTMLTemplate();

  return template
    .replace('{{TITLE}}', '卡片设计器预览')
    .replace(/{{TIMESTAMP}}/g, timestamp)
    .replace('{{TOTAL_COMPONENTS}}', stats.totalComponents.toString())
    .replace('{{FORM_COUNT}}', stats.formCount.toString())
    .replace('{{COLUMN_COUNT}}', stats.columnCount.toString())
    .replace('{{VERTICAL_SPACING}}', stats.verticalSpacing.toString())
    .replace('{{DIRECTION}}', data.direction)
    .replace('{{BODY_CONTENT}}', bodyContent || getEmptyContent());
}; // card-designer-utils.ts - 工具函数文件

// 生成预览HTML - 使用外部模板
export const generatePreviewHTML = (data: DesignData): string => {
  const bodyContent = data.elements.map(renderComponentToHTML).join('');

  // 统计信息
  const stats = {
    totalComponents: data.elements.length,
    formCount: data.elements.filter((el) => el.tag === 'form').length,
    columnCount: data.elements.filter((el) => el.tag === 'column_set').length,
    verticalSpacing: data.vertical_spacing,
  };

  const timestamp = new Date().toLocaleString();

  // 读取HTML模板并替换占位符
  return getHTMLTemplate()
    .replace('{{TITLE}}', '卡片设计器预览')
    .replace('{{TIMESTAMP}}', timestamp)
    .replace('{{TOTAL_COMPONENTS}}', stats.totalComponents.toString())
    .replace('{{FORM_COUNT}}', stats.formCount.toString())
    .replace('{{COLUMN_COUNT}}', stats.columnCount.toString())
    .replace('{{VERTICAL_SPACING}}', stats.verticalSpacing.toString())
    .replace('{{DIRECTION}}', data.direction)
    .replace('{{BODY_CONTENT}}', bodyContent || getEmptyContent());
};

// 验证组件数据完整性
export const validateComponent = (component: ComponentType): boolean => {
  if (!component || typeof component !== 'object') {
    return false;
  }

  if (!component.tag) {
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
