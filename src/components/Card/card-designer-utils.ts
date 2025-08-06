// card-designer-utils.ts - 更新的工具函数文件

import {
  ComponentType,
  DesignData,
  VariableItem,
} from './card-designer-types-updated';

import { normalizeRichTextContent } from './RichTextEditor/RichTextUtils';

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
  verticalSpacing: number = 8,
) => {
  const columnsContent = (comp.columns || [])
    .map((col: any, index: number) => renderColumnContent(col, index, renderFn))
    .join('');

  return `
  <div style="
    border: 2px solid #f0e6ff;
    padding: 16px;
    border-radius: 8px;
    margin: ${verticalSpacing}px 0;
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

const imagesHtml = (comp: any, verticalSpacing: number = 8) => {
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
      margin: ${verticalSpacing}px 0;
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
// 标题组件的样式主题
const getTitleThemeStyle = (theme: string) => {
  const themes = {
    blue: {
      background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
      color: '#fff',
    },
    wathet: {
      background: 'linear-gradient(135deg, #0369a1 0%, #0c4a6e 100%)',
      color: '#fff',
    },
    turquoise: {
      background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
      color: '#fff',
    },
    green: {
      background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
      color: '#fff',
    },
    yellow: {
      background: 'linear-gradient(135deg, #faad14 0%, #d48806 100%)',
      color: '#fff',
    },
    orange: {
      background: 'linear-gradient(135deg, #fa8c16 0%, #d46b08 100%)',
      color: '#fff',
    },
    red: {
      background: 'linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%)',
      color: '#fff',
    },
    default: {
      background: 'linear-gradient(135deg, #f0f0f0 0%, #d9d9d9 100%)',
      color: '#333',
    },
  };
  return themes[theme as keyof typeof themes] || themes.blue;
};

// 组件渲染工具函数
export const renderComponentToHTML = (
  component: ComponentType,
  verticalSpacing: number = 8,
): string => {
  const comp = component as any;

  switch (component.tag) {
    case 'title': {
      const themeStyle = getTitleThemeStyle(comp.style || 'blue');
      return `
        <div style="
          ${
            themeStyle.background ? `background: ${themeStyle.background};` : ''
          }
          color: ${themeStyle.color};
          padding: 24px 16px;
          border-radius: 8px;
          text-align: center;
          margin: 0 0 ${verticalSpacing}px 0;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        ">
          <h1 style="
            margin: 0 0 8px 0;
            font-size: 24px;
            font-weight: bold;
            color: ${themeStyle.color};
          ">
            ${comp.title || '主标题'}
          </h1>
          <p style="
            margin: 0;
            font-size: 14px;
            opacity: 0.9;
            color: ${themeStyle.color};
          ">
            ${comp.subtitle || '副标题'}
          </p>
        </div>
      `;
    }
    case 'form':
      return `
        <form style="
          border: 2px solid #e6f7ff; 
          padding: 20px; 
          border-radius: 8px; 
          margin: ${verticalSpacing}px 0;
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
      return columnsHtml(comp, renderComponentToHTML, verticalSpacing);

    case 'plain_text':
      return `
        <div style="
          margin: ${verticalSpacing}px 0;
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
          margin: ${verticalSpacing}px 0;
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
        <div style="margin: ${verticalSpacing}px 0;">
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
          margin: ${verticalSpacing}px 0;
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
      return imagesHtml(comp, verticalSpacing);

    case 'input':
      return `
        <div style="margin: ${verticalSpacing}px 0;">
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
          margin: ${verticalSpacing}px 0;
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
    case 'title':
      return {
        id: generateId(),
        tag: 'title',
        title: '主标题',
        subtitle: '副标题',
        style: 'blue', // 使用新的主题样式
      } as ComponentType;

    case 'form':
      return {
        tag: 'form',
        name: `Form_${generateId()}`,
        elements: [
          // 默认包含分栏容器（1列）
          {
            tag: 'column_set',
            id: generateId(),
            columns: [
              {
                tag: 'column',
                elements: [
                  // 提交按钮
                  {
                    id: generateId(),
                    tag: 'button',
                    name: `SubmitButton_${generateId()}`,
                    text: {
                      tag: 'plain_text',
                      content: '提交',
                      i18n_content: {
                        'en-US': 'Submit',
                      },
                    },
                    form_action_type: 'submit',
                    style: {
                      color: '#1890ff', // 默认蓝色
                    },
                    behaviors: [
                      {
                        type: 'callback',
                        callback: {
                          action: 'click',
                        },
                      },
                    ],
                  },
                  // 取消按钮
                  {
                    id: generateId(),
                    tag: 'button',
                    name: `CancelButton_${generateId()}`,
                    text: {
                      tag: 'plain_text',
                      content: '取消',
                      i18n_content: {
                        'en-US': 'Cancel',
                      },
                    },
                    form_action_type: 'reset',
                    style: {
                      color: '#000000', // 默认黑色
                    },
                    behaviors: [
                      {
                        type: 'callback',
                        callback: {
                          action: 'click',
                        },
                      },
                    ],
                  },
                ],
                flex: 1,
              },
            ],
          },
        ],
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
            flex: 1, // 默认列宽比例
          },
          {
            tag: 'column',
            elements: [],
            flex: 1, // 默认列宽比例
          },
          {
            tag: 'column',
            elements: [],
            flex: 1, // 默认列宽比例
          },
        ],
      } as ComponentType;

    case 'plain_text':
      return {
        id: generateId(),
        tag: 'plain_text',
        content: '这是一段普通文本，以默认的字号、字色、行高、行数展示',
        style: {
          fontSize: 14, // 默认字体大小
          numberOfLines: 1, // 默认最大行数
          textAlign: 'left', // 默认左对齐
          color: 'rgba(51, 51, 51, 1)', // ✅ 默认字色：深灰色
        },
        i18n_content: {
          'en-US': 'this is a plaintext rendered with the default styles',
        },
      } as ComponentType;

    case 'rich_text':
      return {
        id: generateId(),
        tag: 'rich_text',
        name: `RichText_${generateId()}`,
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: '这是富文本内容示例，支持',
                },
                {
                  type: 'text',
                  marks: [{ type: 'bold' }],
                  text: '加粗',
                },
                {
                  type: 'text',
                  text: '、',
                },
                {
                  type: 'text',
                  marks: [{ type: 'italic' }],
                  text: '斜体',
                },
                {
                  type: 'text',
                  text: '等格式。',
                },
              ],
            },
          ],
        },
        i18n_content: {
          'en-US': {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'This is a rich text content example that supports ',
                  },
                  {
                    type: 'text',
                    marks: [{ type: 'bold' }],
                    text: 'bold',
                  },
                  {
                    type: 'text',
                    text: ', ',
                  },
                  {
                    type: 'text',
                    marks: [{ type: 'italic' }],
                    text: 'italic',
                  },
                  {
                    type: 'text',
                    text: ' and other formats.',
                  },
                ],
              },
            ],
          },
        },
      } as ComponentType;

    case 'hr':
      return {
        tag: 'hr',
        id: generateId(),
        style: {
          borderStyle: 'solid',
        },
      } as ComponentType;

    case 'img':
      return {
        id: generateId(),
        tag: 'img',
        img_url: '/demo.png', // 使用public目录下的demo.png文件
        img_source: 'upload', // 默认使用文件上传
        crop_mode: 'default', // 默认完整展示
        i18n_img_url: {
          'en-US': '/demo.png',
        },
      } as ComponentType;

    case 'img_combination':
      return {
        id: generateId(),
        tag: 'img_combination',
        combination_mode: 'triple', // 保持原有的triple模式，不需要简化
        img_list: [
          {
            img_url: 'demo.png',
            i18n_img_url: {
              'en-US': 'demo.png',
            },
          },
          {
            img_url: 'demo.png',
            i18n_img_url: {
              'en-US': 'demo.png',
            },
          },
          {
            img_url: 'demo.png',
            i18n_img_url: {
              'en-US': 'demo.png',
            },
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
          content: '请输入文本内容',
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
              i18n_content: {
                'en-US': '选项1',
              },
            },
          },
          {
            value: '2',
            text: {
              content: '选项2',
              i18n_content: {
                'en-US': '选项2',
              },
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
              i18n_content: {
                'en-US': '选项1',
              },
            },
          },
          {
            value: '2',
            text: {
              content: '选项2',
              i18n_content: {
                'en-US': '选项2',
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

// 数据迁移函数：将旧的card_link格式迁移到新的multi_url格式
export const migrateCardLink = (cardData: any): any => {
  if (!cardData || !cardData.dsl || !cardData.dsl.card_link) {
    return cardData;
  }

  const cardLink = cardData.dsl.card_link;
  let needsMigration = false;
  let newCardLink = {
    multi_url: {
      url: 'http://www.baidu.com',
      android_url: 'http://www.baidu.com',
      ios_url: 'http://www.baidu.com',
      pc_url: 'http://www.baidu.com',
    },
  };

  // 如果存在旧的直接URL字段，迁移到multi_url中
  if (cardLink.url && !cardLink.multi_url) {
    newCardLink = {
      multi_url: {
        url: cardLink.url,
        android_url: cardLink.android_url || cardLink.url,
        ios_url: cardLink.ios_url || cardLink.url,
        pc_url: cardLink.pc_url || cardLink.url,
      },
    };
    needsMigration = true;
    console.log('✅ 数据迁移完成：card_link -> card_link.multi_url', {
      oldValue: cardLink,
      newValue: newCardLink,
    });
  }

  if (needsMigration) {
    const migratedData = {
      ...cardData,
      dsl: {
        ...cardData.dsl,
        card_link: newCardLink,
      },
    };

    return migratedData;
  }

  return cardData;
};

// 数据迁移函数：将旧的titleStyle字段迁移到新的style字符串中
export const migrateTitleStyle = (cardData: any): any => {
  // 检查是否需要迁移titleStyle字段
  const needsMigration =
    cardData?.dsl?.header?.titleStyle !== undefined ||
    (cardData?.dsl?.header?.style &&
      typeof cardData.dsl.header.style === 'object' &&
      cardData.dsl.header.style.themeStyle !== undefined);

  if (needsMigration) {
    // 处理titleStyle迁移
    const oldStyle = cardData.dsl.header.titleStyle;
    const themeStyle =
      cardData.dsl.header.style?.themeStyle || oldStyle || 'blue';
    const newStyle = themeStyle;

    // 迁移组件样式字段（保留id字段用于渲染）
    const migrateComponentStyles = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(migrateComponentStyles);
      }

      if (obj && typeof obj === 'object' && obj !== null) {
        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
          // 保留id字段，不在这里移除

          // 处理组件样式字段迁移
          if (
            [
              'fontSize',
              'fontWeight',
              'textAlign',
              'textColor',
              'numberOfLines',
              'width',
              'height',
              'backgroundColor',
              'borderColor',
              'borderRadius',
              'padding',
              'margin',
              'type',
              'size',
            ].includes(key)
          ) {
            // 这些是样式字段，需要移动到style对象中
            if (!result.style) {
              result.style = {};
            }
            result.style[key] = value;
          } else if (
            key === 'style' &&
            typeof value === 'object' &&
            value !== null
          ) {
            // 处理样式对象
            const styleObj: any = {};
            for (const [styleKey, styleValue] of Object.entries(value)) {
              if (styleKey === 'id') {
                continue; // 跳过样式对象中的id字段
              }
              styleObj[styleKey] = styleValue;
            }
            result[key] = styleObj;
          } else {
            result[key] = migrateComponentStyles(value);
          }
        }
        return result;
      }

      return obj;
    };

    // 只迁移组件样式字段，不移除id字段
    const migratedData = migrateComponentStyles(cardData);

    // 检查是否存在标题组件，如果不存在则移除header
    const hasTitleComponent = migratedData.dsl.body.elements.some(
      (component: any) => component.tag === 'title',
    );

    // 迁移标题组件数据到header
    const titleComponent = migratedData.dsl.body.elements.find(
      (component: any) => component.tag === 'title',
    );

    console.log('🔍 标题组件检查:', {
      hasTitleComponent,
      titleComponent: titleComponent
        ? { tag: titleComponent.tag, id: titleComponent.id }
        : null,
      elementsCount: migratedData.dsl.body.elements.length,
      currentHeader: migratedData.dsl.header,
    });

    if (needsMigration) {
      const finalData = {
        ...migratedData,
        dsl: {
          ...migratedData.dsl,
          header: {
            ...migratedData.dsl.header,
            style: newStyle,
          },
        },
      };

      // 删除旧的字段
      delete finalData.dsl.header.titleStyle;
      if (
        finalData.dsl.header.style &&
        typeof finalData.dsl.header.style === 'object'
      ) {
        delete finalData.dsl.header.style.themeStyle;
      }

      // 如果有标题组件，迁移标题数据到header
      if (titleComponent) {
        finalData.dsl.header.title = {
          content: titleComponent.title || '主标题',
          i18n_content: titleComponent.i18n_title || {
            'en-US': 'Title',
          },
        };
        finalData.dsl.header.subtitle = {
          content: titleComponent.subtitle || '副标题',
          i18n_content: titleComponent.i18n_subtitle || {
            'en-US': 'Subtitle',
          },
        };
        finalData.dsl.header.style = titleComponent.style || 'blue';
      }

      // 移除elements中的标题组件
      finalData.dsl.body.elements = finalData.dsl.body.elements.filter(
        (component: any) => component.tag !== 'title',
      );

      // 如果没有标题组件且header是空的，才移除header
      if (
        !hasTitleComponent &&
        (!finalData.dsl.header ||
          Object.keys(finalData.dsl.header).length === 0)
      ) {
        delete finalData.dsl.header;
      }

      console.log('✅ 迁移完成 (needsMigration=true):', {
        finalHeader: finalData.dsl.header,
        hasHeader: !!finalData.dsl.header,
        elementsCount: finalData.dsl.body.elements.length,
      });

      return finalData;
    }

    // 如果有标题组件，迁移标题数据到header
    if (titleComponent) {
      if (!migratedData.dsl.header) {
        migratedData.dsl.header = {};
      }
      migratedData.dsl.header.title = {
        content: titleComponent.title || '主标题',
        i18n_content: titleComponent.i18n_title || {
          'en-US': 'Title',
        },
      };
      migratedData.dsl.header.subtitle = {
        content: titleComponent.subtitle || '副标题',
        i18n_content: titleComponent.i18n_subtitle || {
          'en-US': 'Subtitle',
        },
      };
      migratedData.dsl.header.style = titleComponent.style || 'blue';

      // 移除elements中的标题组件
      migratedData.dsl.body.elements = migratedData.dsl.body.elements.filter(
        (component: any) => component.tag !== 'title',
      );
    } else if (
      migratedData.dsl.header &&
      Object.keys(migratedData.dsl.header).length === 0
    ) {
      // 如果没有标题组件且header是空的，才移除header
      console.log('🗑️ 删除空的header (no title component)');
      delete migratedData.dsl.header;
    }

    console.log('✅ 迁移完成 (needsMigration=false):', {
      finalHeader: migratedData.dsl.header,
      hasHeader: !!migratedData.dsl.header,
      elementsCount: migratedData.dsl.body.elements.length,
    });

    return migratedData;
  }

  return cardData;
};

// 转换为目标数据结构 - 更新为新的卡片数据结构
export const convertToTargetFormat = (data: any): any => {
  // 如果传入的是完整的卡片数据，先进行数据迁移，然后移除id字段
  if (data.name && data.dsl && data.variables) {
    const migratedData = migrateTitleStyle(data);

    // 移除id字段的函数
    const removeIds = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(removeIds);
      }

      if (obj && typeof obj === 'object' && obj !== null) {
        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
          if (key === 'id') {
            continue; // 跳过id字段
          }
          result[key] = removeIds(value);
        }
        return result;
      }

      return obj;
    };

    // 移除所有id字段
    const cleanedData = removeIds(migratedData);

    // 检查是否存在标题组件，如果不存在则移除header
    const hasTitleComponent = cleanedData.dsl.body.elements.some(
      (component: any) => component.tag === 'title',
    );

    // 修改逻辑：只有当没有标题组件且没有header数据时才移除header
    if (!hasTitleComponent && !cleanedData.dsl.header) {
      // 如果没有标题组件且没有header数据，则不创建header
      console.log('🗑️ 没有标题组件且没有header数据，不创建header');
    } else if (!hasTitleComponent && cleanedData.dsl.header) {
      // 如果没有标题组件但有header数据，保留header（用户可能手动创建了标题）
      console.log('✅ 保留header数据，即使elements中没有标题组件');
    } else if (hasTitleComponent) {
      // 如果有标题组件，确保header存在
      console.log('✅ 检测到标题组件，确保header存在');
    }

    // 移除elements中的标题组件
    cleanedData.dsl.body.elements = cleanedData.dsl.body.elements.filter(
      (component: any) => component.tag !== 'title',
    );

    return cleanedData;
  }

  // 如果是旧的DesignData格式，转换为新的卡片格式
  const convertComponent = (component: any): any => {
    // 跳过标题组件，不转换
    if (component.tag === 'title') {
      return null;
    }

    // 移除内部使用的字段，只保留目标结构需要的字段
    const converted: any = {
      tag: component.tag,
    };

    // 根据组件类型添加特定字段
    switch (component.tag) {
      case 'form':
        converted.name = component.name;
        converted.elements =
          component.elements?.map(convertComponent).filter(Boolean) || [];
        break;

      case 'column_set':
        converted.columns =
          component.columns?.map((col: any) => ({
            tag: 'column',
            elements: col.elements?.map(convertComponent).filter(Boolean) || [],
          })) || [];
        break;

      case 'plain_text':
        converted.content = component.content;
        if (component.i18n_content) {
          converted.i18n_content = component.i18n_content;
        }
        // 处理样式字段
        if (component.style) {
          converted.style = { ...component.style };
          // 确保textAlign有默认值
          if (!converted.style.textAlign) {
            converted.style.textAlign = 'left';
          }
          // 确保color有默认值
          if (!converted.style.color) {
            converted.style.color = 'rgba(51, 51, 51, 1)';
          }
        } else {
          // 如果没有style对象，创建默认的style对象
          converted.style = {
            textAlign: 'left',
            color: 'rgba(51, 51, 51, 1)', // ✅ 默认字色
          };
        }
        break;

      case 'rich_text': {
        // 导入时处理富文本格式转换
        const content = component.content;
        if (typeof content === 'string') {
          // 如果是HTML字符串，转换为JSON格式
          try {
            // 简单的HTML内容检测和转换
            if (content.includes('<') && content.includes('>')) {
              // 使用临时编辑器转换HTML为JSON
              converted.content = normalizeRichTextContent(content);
            } else {
              // 纯文本内容，创建基础的JSON结构
              converted.content = {
                type: 'doc',
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: content || '请输入富文本内容',
                      },
                    ],
                  },
                ],
              };
            }
          } catch (error) {
            console.warn('富文本内容转换失败:', error);
            // 转换失败时使用默认内容
            converted.content = {
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: '富文本内容',
                    },
                  ],
                },
              ],
            };
          }
        } else {
          // 如果已经是JSON格式，直接使用
          converted.content = content || {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: '请输入富文本内容',
                  },
                ],
              },
            ],
          };
        }

        // 处理多语言内容
        if (component.i18n_content) {
          const i18nContent: any = {};
          for (const [lang, langContent] of Object.entries(
            component.i18n_content,
          )) {
            if (typeof langContent === 'string') {
              // HTML字符串转JSON
              try {
                if (langContent.includes('<') && langContent.includes('>')) {
                  i18nContent[lang] = normalizeRichTextContent(langContent);
                } else {
                  i18nContent[lang] = {
                    type: 'doc',
                    content: [
                      {
                        type: 'paragraph',
                        content: [
                          {
                            type: 'text',
                            text: langContent || 'Rich text content',
                          },
                        ],
                      },
                    ],
                  };
                }
              } catch (error) {
                console.warn(`多语言富文本内容转换失败 (${lang}):`, error);
                i18nContent[lang] = {
                  type: 'doc',
                  content: [
                    {
                      type: 'paragraph',
                      content: [
                        {
                          type: 'text',
                          text: 'Rich text content',
                        },
                      ],
                    },
                  ],
                };
              }
            } else {
              // 已经是JSON格式
              i18nContent[lang] = langContent;
            }
          }
          converted.i18n_content = i18nContent;
        }
        break;
      }

      case 'img':
        converted.img_url = component.img_url;
        if (component.i18n_img_url) {
          converted.i18n_img_url = component.i18n_img_url;
        }
        break;

      case 'img_combination':
        converted.combination_mode = component.combination_mode;
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

  // 转换为新的卡片格式
  return {
    name: '空白卡片',
    variables: {},
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
        direction: data.direction || 'vertical',
        vertical_spacing: data.vertical_spacing || 8,
        padding: {
          top: 16,
          right: 16,
          bottom: 16,
          left: 16,
        },
        elements: data.elements?.map(convertComponent).filter(Boolean) || [],
      },
    },
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

    // 递归处理嵌套结构
    if (component.tag === 'form' && component.elements) {
      converted.elements = component.elements.map(convertComponent);
    }

    if (component.tag === 'column_set' && component.columns) {
      converted.columns = component.columns.map((col: any) => ({
        ...col,
        elements: col.elements?.map(convertComponent) || [],
      }));
    }

    // 处理其他可能的嵌套结构
    if (component.elements && Array.isArray(component.elements)) {
      converted.elements = component.elements.map(convertComponent);
    }

    // 处理columns结构（可能在其他组件类型中）
    if (component.columns && Array.isArray(component.columns)) {
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

// 递归为所有组件添加ID的辅助函数
export const ensureComponentIds = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(ensureComponentIds);
  }

  if (obj && typeof obj === 'object' && obj !== null) {
    // 如果对象有tag属性，说明是组件，需要添加ID
    if (obj.tag && !obj.id) {
      obj.id = generateId();
      console.log('🆔 为组件添加ID:', { tag: obj.tag, id: obj.id });
    }

    // 递归处理所有属性
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = ensureComponentIds(value);
    }
    return result;
  }

  return obj;
};

// 处理多图混排组件的combination_mode智能推断
export const normalizeCombinationModes = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(normalizeCombinationModes);
  }

  if (obj && typeof obj === 'object' && obj !== null) {
    // 如果是多图混排组件，需要处理combination_mode
    if (obj.tag === 'img_combination' && obj.combination_mode && obj.img_list) {
      const imageCount = Array.isArray(obj.img_list) ? obj.img_list.length : 0;

      // 如果是bisect或trisect开头的模式，需要简化存储
      if (obj.combination_mode.startsWith('bisect_')) {
        console.log('🔄 简化bisect模式存储:', {
          oldMode: obj.combination_mode,
          newMode: 'bisect',
          imageCount,
        });
        obj.combination_mode = 'bisect';
      } else if (obj.combination_mode.startsWith('trisect_')) {
        console.log('🔄 简化trisect模式存储:', {
          oldMode: obj.combination_mode,
          newMode: 'trisect',
          imageCount,
        });
        obj.combination_mode = 'trisect';
      }

      // 如果导入的数据中combination_mode是简化的bisect或trisect，根据图片数量推断具体模式
      else if (obj.combination_mode === 'bisect') {
        console.log('🎯 推断bisect具体模式:', {
          mode: 'bisect',
          imageCount,
          inferred: `根据${imageCount}张图片推断为具体模式`,
        });
        // 这里不修改存储的值，保持为'bisect'，由显示逻辑处理
      } else if (obj.combination_mode === 'trisect') {
        console.log('🎯 推断trisect具体模式:', {
          mode: 'trisect',
          imageCount,
          inferred: `根据${imageCount}张图片推断为具体模式`,
        });
        // 这里不修改存储的值，保持为'trisect'，由显示逻辑处理
      }
    }

    // 递归处理所有属性
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = normalizeCombinationModes(value);
    }
    return result;
  }

  return obj;
};

// 从JSON导入配置 - 支持旧格式和新格式
export const importFromJSON = (jsonString: string): DesignData | null => {
  try {
    const parsed = JSON.parse(jsonString);

    // 检查是否是新格式的卡片数据
    if (
      parsed &&
      typeof parsed === 'object' &&
      parsed.dsl &&
      parsed.dsl.body &&
      Array.isArray(parsed.dsl.body.elements)
    ) {
      console.log('✅ 检测到新格式卡片数据，转换为旧格式');
      // 新格式转换为旧格式，确保为组件添加ID
      const oldFormatData = {
        direction: parsed.dsl.body.direction || 'vertical',
        vertical_spacing: parsed.dsl.body.vertical_spacing || 5,
        elements: parsed.dsl.body.elements || [],
      };

      // 先确保所有组件都有ID，然后处理combination_mode
      const dataWithIds = ensureComponentIds(oldFormatData);
      const dataWithNormalizedModes = normalizeCombinationModes(dataWithIds);
      return convertFromTargetFormat(dataWithNormalizedModes);
    }

    // 验证旧格式数据结构
    if (
      parsed &&
      typeof parsed === 'object' &&
      parsed.direction &&
      Array.isArray(parsed.elements)
    ) {
      console.log('✅ 检测到旧格式数据，直接使用');
      // 先确保所有组件都有ID，然后处理combination_mode
      const dataWithIds = ensureComponentIds(parsed);
      const dataWithNormalizedModes = normalizeCombinationModes(dataWithIds);
      return convertFromTargetFormat(dataWithNormalizedModes);
    }

    console.error('❌ 不支持的数据格式:', parsed);
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
export const generatePreviewHTML = (data: any): string => {
  // 检查是否是新格式的卡片数据
  const isNewFormat = data.dsl && data.dsl.body && data.dsl.body.elements;

  let bodyContent = '';
  let stats = {
    totalComponents: 0,
    formCount: 0,
    columnCount: 0,
    verticalSpacing: 8,
  };
  let direction = 'vertical';
  let headerInfo = null;

  if (isNewFormat) {
    // 新格式卡片数据处理
    const elements = data.dsl.body.elements || [];
    const verticalSpacing = data.dsl.body.vertical_spacing || 8;
    bodyContent = elements
      .map((element: any) => renderComponentToHTML(element, verticalSpacing))
      .join('');

    // 从header获取主题信息
    headerInfo = data.dsl.header;

    stats = {
      totalComponents: elements.length,
      formCount: elements.filter((el: any) => el.tag === 'form').length,
      columnCount: elements.filter((el: any) => el.tag === 'column_set').length,
      verticalSpacing: verticalSpacing,
    };
    direction = data.dsl.body.direction || 'vertical';
  } else {
    // 旧格式数据处理（向后兼容）
    const elements = data.elements || [];
    const verticalSpacing = data.vertical_spacing || 8;
    bodyContent = elements
      .map((element: any) => renderComponentToHTML(element, verticalSpacing))
      .join('');

    stats = {
      totalComponents: elements.length,
      formCount: elements.filter((el: any) => el.tag === 'form').length,
      columnCount: elements.filter((el: any) => el.tag === 'column_set').length,
      verticalSpacing: verticalSpacing,
    };
    direction = data.direction || 'vertical';
  }

  const timestamp = new Date().toLocaleString();

  // 生成header HTML（如果存在）
  let headerHTML = '';
  if (
    headerInfo &&
    (headerInfo.title?.content || headerInfo.subtitle?.content)
  ) {
    const themeStyle = getTitleThemeStyle(headerInfo.style || 'blue');
    headerHTML = `
      <div style="
        ${themeStyle.background ? `background: ${themeStyle.background};` : ''}
        color: ${themeStyle.color};
        padding: 24px 16px;
        border-radius: 8px;
        text-align: center;
        margin: 0 0 24px 0;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      ">
        ${
          headerInfo.title?.content
            ? `
          <h1 style="
            margin: 0 0 8px 0;
            font-size: 24px;
            font-weight: bold;
            color: ${themeStyle.color};
          ">
            ${headerInfo.title.content}
          </h1>
        `
            : ''
        }
        ${
          headerInfo.subtitle?.content
            ? `
          <p style="
            margin: 0;
            font-size: 14px;
            opacity: 0.9;
            color: ${themeStyle.color};
          ">
            ${headerInfo.subtitle.content}
          </p>
        `
            : ''
        }
      </div>
    `;
  }

  console.log('✅ 在线预览HTML生成:', {
    isNewFormat,
    hasHeader: !!headerInfo,
    headerTheme: headerInfo?.style,
    elementsCount: stats.totalComponents,
    bodyContentLength: bodyContent.length,
    headerHTMLLength: headerHTML.length,
  });

  // 组合最终的body内容
  const finalBodyContent = headerHTML + (bodyContent || getEmptyContent());

  // 读取HTML模板并替换占位符
  return getHTMLTemplate()
    .replace('{{TITLE}}', '卡片设计器预览')
    .replace('{{TIMESTAMP}}', timestamp)
    .replace('{{TOTAL_COMPONENTS}}', stats.totalComponents.toString())
    .replace('{{FORM_COUNT}}', stats.formCount.toString())
    .replace('{{COLUMN_COUNT}}', stats.columnCount.toString())
    .replace('{{VERTICAL_SPACING}}', stats.verticalSpacing.toString())
    .replace('{{DIRECTION}}', direction)
    .replace('{{BODY_CONTENT}}', finalBodyContent);
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

// 变量替换工具函数
export const replaceVariables = (
  text: string,
  variables: VariableItem[],
): string => {
  if (!text || !variables || variables.length === 0) {
    console.log('❌ replaceVariables: 缺少文本或变量数据', {
      text: text,
      variablesLength: variables?.length,
      variables: variables,
    });
    return text;
  }

  // 创建变量映射
  const variableMap: { [key: string]: string } = {};
  variables.forEach((variable) => {
    if (typeof variable === 'object' && variable !== null) {
      const keys = Object.keys(variable as Record<string, any>);
      if (keys.length > 0) {
        const variableName = keys[0];
        const variableValue = (variable as Record<string, any>)[variableName];
        variableMap[variableName] = String(variableValue);
      }
    }
  });

  console.log('📋 变量映射表:', {
    variableMap: variableMap,
    mapKeys: Object.keys(variableMap),
    variablesCount: variables.length,
  });

  // 替换变量占位符
  const result = text.replace(/\{\{([^}]+)\}\}/g, (match, variableName) => {
    const replacement = variableMap[variableName] || match;
    console.log('🔄 变量替换:', {
      match: match,
      variableName: variableName,
      replacement: replacement,
      found: !!variableMap[variableName],
    });
    return replacement;
  });

  console.log('✅ replaceVariables 结果:', {
    originalText: text,
    resultText: result,
    changed: text !== result,
  });

  return result;
};
