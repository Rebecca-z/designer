# 富文本编辑器组件

基于 TipTap 构建的功能丰富的富文本编辑器组件，支持 React + TypeScript + Ant Design。

## 功能特性

- ✅ **基础文本编辑**: 加粗、斜体、下划线、删除线
- ✅ **字体设置**: 字体系列、字体大小
- ✅ **颜色设置**: 文字颜色、背景颜色/高亮
- ✅ **对齐方式**: 左对齐、居中、右对齐、两端对齐
- ✅ **列表支持**: 有序列表、无序列表
- ✅ **插入功能**: 链接、图片、表格
- ✅ **代码块和引用**: 代码块、引用块
- ✅ **撤销重做**: 完整的编辑历史管理
- ✅ **工具栏配置**: 可显示/隐藏工具栏
- ✅ **禁用状态**: 支持只读模式
- ✅ **自定义样式**: 支持自定义高度、样式等

## 安装依赖

```bash
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-text-align @tiptap/extension-color @tiptap/extension-text-style @tiptap/extension-font-family @tiptap/extension-highlight @tiptap/extension-underline @tiptap/extension-subscript @tiptap/extension-superscript @tiptap/extension-link @tiptap/extension-image @tiptap/extension-table @tiptap/extension-table-row @tiptap/extension-table-cell @tiptap/extension-table-header
```

## 基本用法

```tsx
import React, { useState } from 'react';
import RichTextEditor from './components/Card/RichTextEditor';

const MyComponent = () => {
  const [content, setContent] = useState('<p>初始内容</p>');

  const handleContentChange = (html: string) => {
    setContent(html);
    console.log('内容已更新:', html);
  };

  return (
    <RichTextEditor
      value={content}
      onChange={handleContentChange}
      placeholder="请输入内容..."
      height={400}
    />
  );
};
```

## Props 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `value` | `string` | `''` | 编辑器内容（HTML 格式） |
| `onChange` | `(html: string) => void` | - | 内容变化回调函数 |
| `placeholder` | `string` | `'请输入内容...'` | 占位符文本 |
| `height` | `number` | `300` | 编辑器高度（像素） |
| `disabled` | `boolean` | `false` | 是否禁用编辑 |
| `showToolbar` | `boolean` | `true` | 是否显示工具栏 |
| `className` | `string` | - | 自定义 CSS 类名 |
| `style` | `React.CSSProperties` | - | 自定义样式 |

## 使用示例

### 基础编辑器

```tsx
<RichTextEditor
  value={content}
  onChange={setContent}
  placeholder="开始编写您的内容..."
  height={400}
/>
```

### 简化版（无工具栏）

```tsx
<RichTextEditor
  value={content}
  showToolbar={false}
  height={200}
  placeholder="简化版编辑器..."
/>
```

### 只读模式

```tsx
<RichTextEditor value={content} disabled={true} height={300} />
```

### 自定义样式

```tsx
<RichTextEditor
  value={content}
  onChange={setContent}
  height={350}
  style={{
    border: '2px solid #1890ff',
    borderRadius: '8px',
  }}
  className="my-custom-editor"
/>
```

## 工具栏功能

### 文本格式化

- **加粗** (Ctrl+B): 设置文本加粗
- **斜体** (Ctrl+I): 设置文本斜体
- **下划线** (Ctrl+U): 添加下划线
- **删除线**: 添加删除线效果

### 字体设置

- **字体系列**: 支持宋体、黑体、微软雅黑、Arial 等
- **字体大小**: 从小到超大多种尺寸选择

### 颜色设置

- **文字颜色**: 设置文本颜色
- **背景颜色**: 设置文本背景色/高亮效果

### 对齐方式

- **左对齐**: 文本左对齐
- **居中对齐**: 文本居中对齐
- **右对齐**: 文本右对齐
- **两端对齐**: 文本两端对齐

### 列表功能

- **有序列表**: 创建数字编号列表
- **无序列表**: 创建项目符号列表

### 插入功能

- **插入链接**: 添加超链接
- **插入图片**: 添加图片（支持 URL）
- **插入表格**: 创建 3x3 表格（可调整）

### 其他功能

- **代码块**: 插入代码块
- **引用**: 插入引用块
- **撤销/重做**: 编辑历史管理

## 自定义扩展

如需添加更多功能，可以修改 `extensions` 配置：

```tsx
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
// 导入其他扩展...

const editor = useEditor({
  extensions: [
    StarterKit,
    // 添加更多扩展
    YourCustomExtension.configure({
      // 配置选项
    }),
  ],
  // 其他配置...
});
```

## 样式自定义

组件包含内置样式，你也可以通过 CSS 进一步自定义：

```css
/* 自定义编辑器样式 */
.my-custom-editor .ProseMirror {
  font-family: 'Microsoft YaHei', sans-serif;
  line-height: 1.6;
}

/* 自定义链接样式 */
.rich-text-link {
  color: #1890ff;
  text-decoration: underline;
}

/* 自定义表格样式 */
.ProseMirror table {
  border: 1px solid #ddd;
}
```

## 注意事项

1. **依赖安装**: 确保已安装所有必需的 TipTap 依赖包
2. **HTML 内容**: 组件输出标准 HTML 格式内容
3. **性能优化**: 大量内容时建议使用防抖处理 onChange 回调
4. **浏览器兼容**: 支持现代浏览器，IE 需要 polyfill
5. **图片处理**: 目前支持 URL 图片，如需上传功能请自行扩展

## 开发调试

在开发环境中，你可以通过浏览器开发者工具查看编辑器状态：

```tsx
const editor = useEditor({
  // 配置...
  onUpdate: ({ editor }) => {
    console.log('Editor content:', editor.getHTML());
    console.log('Editor JSON:', editor.getJSON());
  },
});
```

## 更新日志

- v1.0.0: 初始版本，包含基础富文本编辑功能
- 支持文本格式化、颜色设置、对齐、列表、插入功能等
- 提供完整的工具栏和自定义选项
