import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn'; // 导入中文语言包
import isToday from 'dayjs/plugin/isToday';
import isYesterday from 'dayjs/plugin/isYesterday';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  getDefaultRichTextJSON,
  getDefaultRichTextJSONEnglish,
  normalizeRichTextContent,
} from './RichTextEditor/RichTextUtils';
import { ComponentType, DesignData, VariableItem } from './type';

// 扩展dayjs功能
dayjs.extend(relativeTime);
dayjs.extend(isToday);
dayjs.extend(isYesterday);
dayjs.locale('zh-cn'); // 设置中文

export const defaultImg = {
  img_url: 'https://lyra2-dev.rongcloud.net:8443/fcs-file/rcbw/demo.png',
  i18n_img_url: {
    'en-US': 'https://lyra2-dev.rongcloud.net:8443/fcs-file/rcbw/demo.png',
  },
};

const isSameYear = (timestamp: Date): boolean => {
  return dayjs().isSame(timestamp, 'year');
};

// 构建组件ID
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// 是否为变量
export const isVariable = (content: string) => {
  return (
    typeof content === 'string' &&
    content?.startsWith('${') &&
    content?.endsWith('}')
  );
};

export const TimeDisplay = (time: Date) => {
  const formatTime = (time: Date) => {
    const date = dayjs(time);
    if (date.isToday()) {
      return `今天 ${date.format('HH:mm')}`;
    } else if (date.isYesterday()) {
      return `昨天 ${date.format('HH:mm')}`;
    } else if (isSameYear(time)) {
      return date.format('MM月DD日 HH:mm');
    } else {
      return date.format('YYYY年MM月DD日 HH:mm');
    }
  };
  return formatTime(time);
};

// 根据${字符串}获取变量中的值
export const resolveVariable = (variableString: string, variables: any[]) => {
  if (typeof variableString !== 'string') return false;
  // 检查是否是变量引用格式 ${variable_name}
  const variableRegex = /\$\{([^}]+)\}/;
  const match = variableString?.match(variableRegex) || '';

  if (!match) {
    return false; // 如果不是变量引用，直接返回原值
  }

  const variableName = match[1];

  // 在变量数组中查找对应的变量
  const variable = variables.find((v) => v?.name === variableName);
  if (!variable) {
    return undefined; // 如果没找到，返回原值
  }
  return variable;
};

// 检查元素是否为输入类型
export const isInputElement = (element: Element | null): boolean => {
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
export const isInPropertyPanel = (element: Element | null): boolean => {
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

// 创建默认模版
export const createDefaultComponent = (type: string): ComponentType => {
  switch (type) {
    case 'title':
      return {
        id: generateId(),
        tag: 'title',
        title: {
          content: '主标题',
        },
        subtitle: {
          content: '副标题',
        },
        style: 'blue',
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
                    name: `Button_${generateId()}`,
                    text: {
                      tag: 'plain_text',
                      content: '提交',
                      i18n_content: {
                        'en-US': '提交',
                      },
                    },
                    form_action_type: 'submit',
                    style: {
                      color: 'blue',
                    },
                    behaviors: [],
                  },
                  // 取消按钮
                  {
                    id: generateId(),
                    tag: 'button',
                    name: `Button_${generateId()}`,
                    text: {
                      tag: 'plain_text',
                      content: '取消',
                      i18n_content: {
                        'en-US': '取消',
                      },
                    },
                    form_action_type: 'reset',
                    style: {
                      color: 'black',
                    },
                  },
                ],
                style: { flex: 1 },
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
            style: { flex: 1 },
          },
          {
            tag: 'column',
            elements: [],
            style: { flex: 1 },
          },
          {
            tag: 'column',
            elements: [],
            style: { flex: 1 },
          },
        ],
      } as ComponentType;

    case 'plain_text':
      return {
        id: generateId(),
        tag: 'plain_text',
        name: `PlainText_${generateId()}`, // 添加name字段
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
        content: getDefaultRichTextJSON(),
        i18n_content: {
          'en-US': getDefaultRichTextJSONEnglish(),
        },
      } as ComponentType;

    case 'hr':
      return {
        tag: 'hr',
        id: generateId(),
        name: `Hr_${generateId()}`,
        style: {
          borderStyle: 'solid',
        },
      } as ComponentType;

    case 'img':
      return {
        id: generateId(),
        tag: 'img',
        name: `Img_${generateId()}`,
        style: {
          crop_mode: 'default',
        },
        ...defaultImg,
      } as ComponentType;

    case 'img_combination':
      return {
        id: generateId(),
        tag: 'img_combination',
        name: `ImgCombination_${generateId()}`,
        combination_mode: 'triple',
        img_list: [{ ...defaultImg }, { ...defaultImg }, { ...defaultImg }],
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
            'en-US': '按钮',
          },
        },
        style: {
          color: 'blue', // 默认蓝色
        },
        // 不默认创建behaviors字段，只在需要时添加
      } as ComponentType;

    case 'select_static':
      return {
        id: generateId(),
        tag: 'select_static',
        name: `SelectStatic_${generateId()}`,
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
        name: `MultiSelectStatic_${generateId()}`,
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

// 转换为目标数据结构 - 更新为新的卡片数据结构
export const convertToTargetFormat = (data: any): any => {
  // 如果传入的是完整的卡片数据，先进行数据迁移，然后移除id字段
  if (data.name && data.dsl && data.variables) {
    const migratedData = data;

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
        converted.name = component.name; // 添加name字段
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
        converted.name = component.name; // 添加name字段
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
              converted.content = getDefaultRichTextJSON();
            }
          } catch (error) {
            console.warn('富文本内容转换失败:', error);
            // 转换失败时使用默认内容
            converted.content = getDefaultRichTextJSON();
          }
        } else {
          // 如果已经是JSON格式，直接使用
          converted.content = content || getDefaultRichTextJSON();
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
                  i18nContent[lang] = getDefaultRichTextJSON();
                }
              } catch (error) {
                console.warn(`多语言富文本内容转换失败 (${lang}):`, error);
                i18nContent[lang] = getDefaultRichTextJSON();
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
        converted.name = component.name; // 添加name字段
        converted.img_url = component.img_url;
        if (component.i18n_img_url) {
          converted.i18n_img_url = component.i18n_img_url;
        }
        // 处理样式字段
        if (component.style) {
          converted.style = { ...component.style };
        }
        break;

      case 'img_combination':
        converted.name = component.name; // 添加name字段
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
        // 只有非重置按钮才包含behaviors字段
        if (component.behaviors && component.form_action_type !== 'reset') {
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
        converted.name = component.name; // 添加name字段
        // 处理样式字段
        if (component.style) {
          converted.style = { ...component.style };
        }
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
        elements: data.elements?.map(convertComponent).filter(Boolean) || [],
      },
    },
  };
};

// 从目标格式转换回内部格式
const convertFromTargetFormat = (targetData: any): DesignData => {
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
        obj.combination_mode = 'bisect';
      } else if (obj.combination_mode.startsWith('trisect_')) {
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

// 变量替换工具函数
export const replaceVariables = (
  text: string,
  variables: VariableItem[],
): string => {
  if (!text || !variables || variables.length === 0) {
    return text;
  }

  // 创建变量映射
  const variableMap: { [key: string]: string } = {};
  variables?.forEach((variable) => {
    if (typeof variable === 'object' && variable !== null) {
      // 处理 Variable 格式：{ name: string, value: any, type: string }
      if ('name' in variable && 'value' in variable) {
        const varName = (variable as any).name;
        const varValue = (variable as any).value;
        const varType = (variable as any).type;

        // 对于图片数组类型，保持JSON格式；其他类型转为字符串
        if (varType === 'imageArray' && Array.isArray(varValue)) {
          variableMap[varName] = JSON.stringify(varValue);
        } else {
          variableMap[varName] = String(varValue);
        }
      }
      // 处理 VariableObject 格式：{ 变量名: 变量值 }
      else {
        const keys = Object.keys(variable as Record<string, any>);
        if (keys.length > 0) {
          const variableName = keys[0];
          const variableValue = (variable as Record<string, any>)[variableName];

          // 如果是数组，保持JSON格式；否则转为字符串
          if (Array.isArray(variableValue)) {
            variableMap[variableName] = JSON.stringify(variableValue);
          } else {
            variableMap[variableName] = String(variableValue);
          }
        }
      }
    }
  });

  let result = text;

  // 替换${变量名}格式
  result = result.replace(/\$\{([^}]+)\}/g, (match, variableName) => {
    const replacement = variableMap[variableName] || match;
    return replacement;
  });

  return result;
};
