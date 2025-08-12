// 富文本编辑器
import {
  AlignCenterOutlined,
  AlignLeftOutlined,
  AlignRightOutlined,
  BoldOutlined,
  CodeOutlined,
  ItalicOutlined,
  LinkOutlined,
  OrderedListOutlined,
  RedoOutlined,
  StrikethroughOutlined,
  UnderlineOutlined,
  UndoOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import Color from '@tiptap/extension-color';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Button,
  ColorPicker,
  Divider,
  Input,
  Modal,
  Select,
  Space,
  message,
} from 'antd';
import React, { useCallback } from 'react';
import FontSize from './FontSize';
import RichTextStyles from './RichTextStyles';

const { Option } = Select;

interface RichTextEditorProps {
  value?: any; // 支持JSON格式或HTML字符串
  onChange?: (json: any) => void; // 输出JSON格式
  placeholder?: string;
  height?: number;
  disabled?: boolean;
  showToolbar?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value = '',
  onChange,
  placeholder = '请输入内容...',
  height = 300,
  disabled = false,
  showToolbar = true,
  className,
  style,
}) => {
  const [linkModalVisible, setLinkModalVisible] = React.useState(false);
  const [linkUrl, setLinkUrl] = React.useState('');
  const [linkText, setLinkText] = React.useState('');
  const isInternalUpdateRef = React.useRef(false);

  const editor = useEditor({
    extensions: [
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
    ],
    content: value,
    onUpdate: ({ editor }) => {
      // 如果是内部更新，跳过onChange回调
      if (isInternalUpdateRef.current) {
        return;
      }

      const json = editor.getJSON();

      // 修复：确保所有段落都有明确的 textAlign 属性
      if (json.content) {
        const processNode = (node: any) => {
          if (node.type === 'paragraph' && !node.attrs?.textAlign) {
            node.attrs = { ...node.attrs, textAlign: 'left' };
          }
          if (node.content) {
            node.content.forEach(processNode);
          }
        };

        json.content.forEach(processNode);
      }

      onChange?.(json);
    },
    editable: !disabled,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
        style: `min-height: ${height - 60}px; padding: 12px;`,
      },
    },
  });

  // ✅ 修复：监听value变化，更新编辑器内容
  React.useEffect(() => {
    if (editor && value !== undefined && value !== null) {
      // 获取当前编辑器的JSON内容
      const currentContent = editor.getJSON();

      // 深度比较JSON内容，忽略不重要的属性差异
      const normalizeContent = (content: any) => {
        if (!content) return null;
        const normalized = JSON.parse(JSON.stringify(content));
        // 确保段落有默认的textAlign属性
        if (normalized.content) {
          const processNode = (node: any) => {
            if (node.type === 'paragraph' && !node.attrs?.textAlign) {
              node.attrs = { ...node.attrs, textAlign: 'left' };
            }
            if (node.content) {
              node.content.forEach(processNode);
            }
          };
          normalized.content.forEach(processNode);
        }
        return normalized;
      };

      const normalizedCurrent = normalizeContent(currentContent);
      const normalizedValue = normalizeContent(value);

      // 比较新值和当前内容是否不同（避免不必要的更新）
      const isSameContent =
        JSON.stringify(normalizedCurrent) === JSON.stringify(normalizedValue);

      console.log('🔄 RichTextEditor value变化检查:', {
        hasEditor: !!editor,
        newValue: value,
        currentContent,
        isSameContent,
        valueType: typeof value,
        timestamp: new Date().toISOString(),
      });

      if (!isSameContent && normalizedValue) {
        console.log('✅ 更新富文本编辑器内容:', {
          from: normalizedCurrent,
          to: normalizedValue,
        });

        // 标记为内部更新，避免触发onChange
        isInternalUpdateRef.current = true;

        // 使用setContent方法更新编辑器内容
        editor.commands.setContent(normalizedValue, { emitUpdate: false }); // 不触发onUpdate事件

        // 重置内部更新标记
        setTimeout(() => {
          isInternalUpdateRef.current = false;
        }, 0);
      }
    }
  }, [editor, value]);

  // 修复：确保编辑器初始化时有正确的默认内容
  React.useEffect(() => {
    if (editor && !value) {
      // 如果没有内容，设置默认的段落结构
      const defaultContent = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            attrs: { textAlign: 'left' },
            content: [],
          },
        ],
      };
      editor.commands.setContent(defaultContent, { emitUpdate: false });
    }
  }, [editor, value]);

  // 工具栏按钮样式
  const getButtonStyle = (isActive: boolean) => ({
    border: isActive ? '1px solid #1890ff' : '1px solid #d9d9d9',
    backgroundColor: isActive ? '#f0f9ff' : 'white',
    color: isActive ? '#1890ff' : '#666',
  });

  // 标题级别选项
  const headingLevels = [
    { value: 0, label: '正文' },
    { value: 1, label: 'H1' },
    { value: 2, label: 'H2' },
    { value: 3, label: 'H3' },
    { value: 4, label: 'H4' },
    { value: 5, label: 'H5' },
    { value: 6, label: 'H6' },
  ];

  // 字体大小选项
  const fontSizes = [
    { value: '12px', label: '12px' },
    { value: '14px', label: '14px' },
    { value: '16px', label: '16px' },
    { value: '18px', label: '18px' },
    { value: '20px', label: '20px' },
    { value: '24px', label: '24px' },
    { value: '28px', label: '28px' },
    { value: '32px', label: '32px' },
  ];

  // 设置标题级别
  const setHeading = useCallback(
    (level: number) => {
      if (editor) {
        if (level === 0) {
          editor.chain().focus().setParagraph().run();
        } else {
          editor
            .chain()
            .focus()
            .toggleHeading({ level: level as 1 | 2 | 3 | 4 | 5 | 6 })
            .run();
        }
      }
    },
    [editor],
  );

  // 设置字体大小
  const setFontSize = useCallback(
    (size: string) => {
      if (editor) {
        // 使用自定义FontSize扩展的命令
        editor.chain().focus().setFontSize(size).run();
      }
    },
    [editor],
  );

  // 设置文本对齐
  const setTextAlign = useCallback(
    (align: string) => {
      if (editor) {
        // 确保明确设置 textAlign 属性，而不是 null
        editor.chain().focus().setTextAlign(align).run();
      }
    },
    [editor],
  );

  // 插入链接
  const insertLink = () => {
    if (!editor) return;

    if (linkUrl) {
      if (linkText) {
        editor
          .chain()
          .focus()
          .insertContent(`<a href="${linkUrl}">${linkText}</a>`)
          .run();
      } else {
        editor.chain().focus().setLink({ href: linkUrl }).run();
      }
      setLinkModalVisible(false);
      setLinkUrl('');
      setLinkText('');
      message.success('链接插入成功');
    } else {
      message.error('请输入链接地址');
    }
  };

  if (!editor) {
    return <div>Loading...</div>;
  }

  return (
    <div className={className} style={style}>
      {showToolbar && (
        <div
          style={{
            border: '1px solid #d9d9d9',
            borderBottom: 'none',
            borderRadius: '6px 6px 0 0',
            padding: '8px 12px',
            backgroundColor: '#fafafa',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
            alignItems: 'center',
          }}
        >
          {/* 撤销/重做 */}
          <Space.Compact>
            <Button
              size="small"
              icon={<UndoOutlined />}
              title="撤销"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              style={getButtonStyle(false)}
            />
            <Button
              size="small"
              icon={<RedoOutlined />}
              title="重做"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              style={getButtonStyle(false)}
            />
          </Space.Compact>

          <Divider type="vertical" />

          {/* 标题级别 */}
          <Select
            size="small"
            style={{ width: 80 }}
            placeholder="标题"
            value={
              editor.isActive('heading', { level: 1 })
                ? 1
                : editor.isActive('heading', { level: 2 })
                ? 2
                : editor.isActive('heading', { level: 3 })
                ? 3
                : editor.isActive('heading', { level: 4 })
                ? 4
                : editor.isActive('heading', { level: 5 })
                ? 5
                : editor.isActive('heading', { level: 6 })
                ? 6
                : 0
            }
            onChange={setHeading}
          >
            {headingLevels.map((level) => (
              <Option key={level.value} value={level.value}>
                {level.label}
              </Option>
            ))}
          </Select>

          <Divider type="vertical" />

          {/* 字体大小 */}
          <Select
            size="small"
            style={{ width: 80 }}
            placeholder="大小"
            value={editor?.getAttributes('textStyle')?.fontSize || '16px'}
            onChange={setFontSize}
          >
            {fontSizes.map((size) => (
              <Option key={size.value} value={size.value}>
                {size.label}
              </Option>
            ))}
          </Select>

          <Divider type="vertical" />

          {/* 文本对齐 */}
          <Space.Compact>
            <Button
              size="small"
              icon={<AlignLeftOutlined />}
              title="左对齐"
              onClick={() => setTextAlign('left')}
              style={getButtonStyle(
                editor?.isActive({ textAlign: 'left' }) ||
                  !editor?.getAttributes('paragraph').textAlign ||
                  editor?.getAttributes('paragraph').textAlign === null,
              )}
            />
            <Button
              size="small"
              icon={<AlignCenterOutlined />}
              title="居中对齐"
              onClick={() => setTextAlign('center')}
              style={getButtonStyle(editor?.isActive({ textAlign: 'center' }))}
            />
            <Button
              size="small"
              icon={<AlignRightOutlined />}
              title="右对齐"
              onClick={() => setTextAlign('right')}
              style={getButtonStyle(editor?.isActive({ textAlign: 'right' }))}
            />
          </Space.Compact>

          <Divider type="vertical" />

          {/* 格式化按钮 */}
          <Space.Compact>
            <Button
              size="small"
              icon={<BoldOutlined />}
              title="加粗"
              onClick={() => editor.chain().focus().toggleBold().run()}
              style={getButtonStyle(editor.isActive('bold'))}
            />
            <Button
              size="small"
              icon={<ItalicOutlined />}
              title="斜体"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              style={getButtonStyle(editor.isActive('italic'))}
            />
            <Button
              size="small"
              icon={<UnderlineOutlined />}
              title="下划线"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              style={getButtonStyle(editor.isActive('underline'))}
            />
            <Button
              size="small"
              icon={<StrikethroughOutlined />}
              title="删除线"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              style={getButtonStyle(editor.isActive('strike'))}
            />
            <div
              title="文字颜色"
              style={{
                display: 'inline-block',
                marginLeft: '4px',
              }}
            >
              <ColorPicker
                size="small"
                value={editor?.getAttributes('textStyle').color || '#000000'}
                onChange={(color: any) => {
                  editor?.chain().focus().setColor(color.toHexString()).run();
                }}
                showText={false}
                trigger="hover"
                style={{
                  width: '28px',
                  height: '28px',
                }}
              />
            </div>
          </Space.Compact>

          <Divider type="vertical" />

          {/* 列表 */}
          <Space.Compact>
            <Button
              size="small"
              icon={<OrderedListOutlined />}
              title="有序列表"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              style={getButtonStyle(editor.isActive('orderedList'))}
            />
            <Button
              size="small"
              icon={<UnorderedListOutlined />}
              title="无序列表"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              style={getButtonStyle(editor.isActive('bulletList'))}
            />
          </Space.Compact>

          <Divider type="vertical" />

          {/* 插入功能 */}
          <Space.Compact>
            <Button
              size="small"
              icon={<LinkOutlined />}
              title="插入链接"
              onClick={() => setLinkModalVisible(true)}
              style={getButtonStyle(editor.isActive('link'))}
            />
          </Space.Compact>

          <Divider type="vertical" />

          {/* 代码块 */}
          <Space.Compact>
            <Button
              size="small"
              icon={<CodeOutlined />}
              title="代码块"
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              style={getButtonStyle(editor.isActive('codeBlock'))}
            />
          </Space.Compact>
        </div>
      )}

      {/* 编辑器内容区域 */}
      <div
        style={{
          border: '1px solid #d9d9d9',
          borderRadius: showToolbar ? '0 0 6px 6px' : '6px',
          backgroundColor: 'white',
          minHeight: height,
        }}
      >
        <RichTextStyles style={{ padding: '12px' }}>
          <EditorContent editor={editor} />
        </RichTextStyles>
      </div>

      {/* 插入链接模态框 */}
      <Modal
        title="插入链接"
        open={linkModalVisible}
        onOk={insertLink}
        onCancel={() => {
          setLinkModalVisible(false);
          setLinkUrl('');
          setLinkText('');
        }}
        okText="插入"
        cancelText="取消"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <label>链接地址:</label>
            <Input
              placeholder="请输入链接地址"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
            />
          </div>
          <div>
            <label>链接文本 (可选):</label>
            <Input
              placeholder="请输入链接文本"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
            />
          </div>
        </Space>
      </Modal>

      <style>{`
        .ProseMirror {
          outline: none;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: '${placeholder}';
          float: left;
          color: #aaa;
          pointer-events: none;
          height: 0;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
