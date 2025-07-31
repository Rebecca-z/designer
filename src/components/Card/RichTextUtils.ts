import Color from '@tiptap/extension-color';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import { Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import FontSize from './FontSize';

// 配置和编辑器一致的扩展
const extensions = [
  StarterKit.configure({
    // 禁用StarterKit中可能冲突的扩展
    link: false,
    underline: false,
  }),
  Underline,
  Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      class: 'rich-text-link',
    },
  }),
  TextAlign.configure({
    types: ['heading', 'paragraph'],
  }),
  TextStyle.configure({
    HTMLAttributes: {
      class: 'tiptap-text-style',
    },
  }),
  Color.configure({
    types: ['textStyle'],
  }),
  FontSize,
];

/**
 * 将TipTap JSON格式转换为HTML字符串
 * @param json TipTap的JSON格式内容
 * @returns HTML字符串
 */
export const convertJSONToHTML = (json: any): string => {
  if (!json) {
    return '<p>请输入富文本内容</p>';
  }

  // 如果已经是HTML字符串，直接返回(向后兼容)
  if (typeof json === 'string') {
    return json;
  }

  try {
    // 创建临时编辑器实例来转换JSON为HTML
    const tempEditor = new Editor({
      extensions,
      content: json,
      editable: false,
    });

    const html = tempEditor.getHTML();
    tempEditor.destroy();
    return html;
  } catch (error) {
    console.warn('富文本JSON转HTML失败:', error);
    return '<p>富文本内容解析失败</p>';
  }
};

/**
 * 检查内容是否为JSON格式
 * @param content 内容
 * @returns 是否为JSON格式
 */
export const isJSONFormat = (content: any): boolean => {
  return (
    content && typeof content === 'object' && content.type && content.content
  );
};

/**
 * 获取默认的富文本JSON内容
 * @returns 默认的JSON格式内容
 */
export const getDefaultRichTextJSON = () => ({
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
});

/**
 * 获取默认的英文富文本JSON内容
 * @returns 默认的英文JSON格式内容
 */
export const getDefaultRichTextJSONEnglish = () => ({
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
});

/**
 * 将HTML字符串转换为TipTap JSON格式
 * @param html HTML字符串
 * @returns TipTap JSON格式
 */
export const convertHTMLToJSON = (html: string): any => {
  if (!html || typeof html !== 'string') {
    return getDefaultRichTextJSON();
  }

  try {
    // 创建临时编辑器实例来转换HTML为JSON
    const tempEditor = new Editor({
      extensions,
      content: html,
      editable: false,
    });

    const json = tempEditor.getJSON();
    tempEditor.destroy();
    return json;
  } catch (error) {
    console.warn('富文本HTML转JSON失败:', error);
    return getDefaultRichTextJSON();
  }
};

/**
 * 标准化富文本内容格式
 * 自动检测内容格式并转换为JSON
 * @param content 内容（可能是HTML字符串或JSON对象）
 * @returns 标准化的JSON格式
 */
export const normalizeRichTextContent = (content: any): any => {
  if (!content) {
    return getDefaultRichTextJSON();
  }

  // 如果已经是JSON格式，直接返回
  if (isJSONFormat(content)) {
    return content;
  }

  // 如果是HTML字符串，转换为JSON
  if (typeof content === 'string') {
    return convertHTMLToJSON(content);
  }

  // 其他情况返回默认内容
  return getDefaultRichTextJSON();
};
