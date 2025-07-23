# JSONEditor JSON 编辑器组件

一个基于 React + Ant Design + TypeScript 实现的 JSON 编辑器组件，支持对象和数组的智能折叠功能，采用明亮模式设计。

## 功能特性

- ✅ **结构折叠**：支持对象和数组的智能折叠
- ✅ **类型标识**：不同数据类型用不同颜色标识
- ✅ **明亮主题**：采用明亮模式设计风格
- ✅ **编辑功能**：支持 JSON 编辑和语法检查
- ✅ **键盘快捷键**：Ctrl+S 保存，Esc 取消
- ✅ **错误提示**：实时显示 JSON 语法错误
- ✅ **层级显示**：清晰的层级结构和缩进
- ✅ **复制功能**：一键复制 JSON 内容
- ✅ **展开/折叠**：支持全部展开或折叠
- ✅ **TypeScript**：完整的 TypeScript 类型支持

## 安装依赖

组件使用了以下依赖，确保项目中已安装：

```bash
npm install antd @ant-design/icons
```

## 基本用法

```tsx
import React, { useState } from 'react';
import JSONEditor from './JSONEditor';

const MyComponent: React.FC = () => {
  const [jsonData, setJsonData] = useState({
    user: {
      id: 1,
      name: '张三',
      profile: {
        age: 28,
        interests: ['编程', '阅读'],
      },
    },
  });

  const handleSave = (jsonString: string) => {
    const parsed = JSON.parse(jsonString);
    setJsonData(parsed);
    console.log('JSON已保存:', parsed);
  };

  return (
    <JSONEditor
      json={jsonData}
      title="用户数据"
      editable={true}
      onSave={handleSave}
    />
  );
};
```

## API 文档

### JSONEditorProps

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `json` | `string \| object` | - | **必填** 要显示的 JSON 数据 |
| `title` | `string` | `'JSON 编辑器'` | 编辑器标题 |
| `showLineNumbers` | `boolean` | `true` | 是否显示行号 |
| `showCopyButton` | `boolean` | `true` | 是否显示复制按钮 |
| `showExpandButton` | `boolean` | `true` | 是否显示展开/折叠按钮 |
| `showEditButton` | `boolean` | `true` | 是否显示编辑按钮 |
| `height` | `string \| number` | `'auto'` | 编辑器高度 |
| `className` | `string` | - | 自定义 CSS 类名 |
| `style` | `React.CSSProperties` | - | 自定义样式对象 |
| `editable` | `boolean` | `false` | 是否启用编辑功能 |
| `readOnly` | `boolean` | `false` | 是否只读模式 |
| `onJSONChange` | `(newJSON: string) => void` | - | JSON 变化时的回调函数 |
| `onSave` | `(json: string) => void` | - | 保存时的回调函数 |

### JSONNode 接口

```typescript
interface JSONNode {
  key: string; // 节点唯一标识
  value: any; // 节点值
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null'; // 数据类型
  level: number; // 层级深度
  path: string; // 节点路径
  isCollapsible: boolean; // 是否可折叠
  children?: JSONNode[]; // 子节点
  parentKey?: string; // 父节点标识
}
```

## 使用示例

### 1. 基本编辑功能

```tsx
const [data, setData] = useState(complexJSON);

<JSONEditor
  json={data}
  title="复杂数据结构"
  height={500}
  editable={true}
  onSave={(json) => {
    const parsed = JSON.parse(json);
    setData(parsed);
  }}
  onJSONChange={(json) => console.log('JSON变化:', json)}
/>;
```

### 2. 只读模式

```tsx
<JSONEditor
  json={apiResponse}
  title="API响应 (只读)"
  editable={false}
  readOnly={true}
  height={400}
/>
```

### 3. 自定义配置

```tsx
<JSONEditor
  json={configData}
  title="应用配置"
  height={450}
  showLineNumbers={false}
  showCopyButton={false}
  showExpandButton={true}
  showEditButton={true}
  editable={true}
  style={{ border: '2px solid #0d6efd' }}
  onSave={(json) => message.success('配置已保存')}
/>
```

### 4. 字符串 JSON 输入

```tsx
const jsonString = '{"name": "张三", "age": 28}';

<JSONEditor
  json={jsonString}
  title="字符串JSON"
  editable={true}
  onSave={handleSave}
/>;
```

## 折叠功能详解

### 折叠规则

组件会自动识别以下结构为可折叠：

- **对象**：包含属性的对象 `{key: value}`
- **数组**：包含元素的数组 `[item1, item2, ...]`
- **嵌套结构**：多层嵌套的对象和数组

### 折叠操作

1. **单节点折叠**：点击对象或数组前的箭头图标
2. **全部展开**：点击右上角的展开按钮
3. **全部折叠**：点击右上角的折叠按钮
4. **折叠提示**：折叠后显示节点数量和类型信息

### 层级结构

- 使用缩进显示层级关系
- 每个层级增加 24px 的左边距
- 可折叠节点有蓝色左边框标识
- 鼠标悬停时背景色变化

## 类型标识系统

### 颜色编码

| 类型      | 颜色      | 说明       |
| --------- | --------- | ---------- |
| `string`  | `#d63384` | 字符串类型 |
| `number`  | `#0d6efd` | 数字类型   |
| `boolean` | `#198754` | 布尔类型   |
| `null`    | `#6c757d` | 空值类型   |
| `object`  | `#fd7e14` | 对象类型   |
| `array`   | `#6f42c1` | 数组类型   |

### 值显示格式

- **字符串**：`"value"`
- **数字**：`42`
- **布尔值**：`true` / `false`
- **空值**：`null`
- **对象**：`{3 个属性}`
- **数组**：`[5 个元素]`

## 编辑功能详解

### 编辑模式操作

1. **进入编辑模式**：点击右上角的编辑按钮
2. **保存 JSON**：
   - 点击保存按钮
   - 使用快捷键 `Ctrl+S` (Windows) 或 `Cmd+S` (Mac)
3. **取消编辑**：
   - 点击取消按钮
   - 使用快捷键 `Esc`
4. **语法检查**：编辑时实时检查 JSON 语法

### 状态指示

- **编辑中**：标题栏显示 `[编辑中]` 标识
- **已修改**：编辑区域显示 `(已修改)` 提示
- **语法错误**：红色边框和错误提示信息
- **快捷键提示**：编辑模式下显示快捷键说明

### 回调函数

#### onJSONChange

```tsx
const handleJSONChange = (newJSON: string) => {
  console.log('JSON已更新:', newJSON);
  // 可以在这里进行实时验证、格式化等操作
};

<JSONEditor json={data} editable={true} onJSONChange={handleJSONChange} />;
```

#### onSave

```tsx
const handleSave = (jsonString: string) => {
  try {
    const parsed = JSON.parse(jsonString);
    // 保存到服务器或本地存储
    saveToServer(parsed);
    // 更新本地状态
    setData(parsed);
    message.success('JSON已保存');
  } catch (error) {
    message.error('JSON格式错误，保存失败');
  }
};

<JSONEditor json={data} editable={true} onSave={handleSave} />;
```

## 明亮主题设计

### 颜色方案

- **背景色**：`#ffffff` (纯白)
- **边框色**：`#dee2e6` (浅灰)
- **文字色**：`#212529` (深灰)
- **次要文字**：`#6c757d` (中灰)
- **可折叠背景**：`#f8f9fa` (极浅灰)
- **悬停背景**：`#e9ecef` (浅灰)

### 视觉层次

- 清晰的层级缩进
- 可折叠节点的蓝色边框标识
- 类型标签的颜色编码
- 平滑的过渡动画效果

## 性能优化

- 使用 `useMemo` 缓存 JSON 解析结果
- 使用 `Set` 数据结构管理展开状态
- 递归渲染优化，避免不必要的重渲染
- 编辑状态管理，避免频繁的状态更新

## 注意事项

1. **JSON 格式**：确保输入的 JSON 格式正确
2. **大文件处理**：对于非常大的 JSON 文件，建议设置合适的高度限制
3. **浏览器兼容性**：复制功能使用了 `navigator.clipboard` API，需要现代浏览器支持
4. **编辑性能**：编辑大文件时建议使用 `onJSONChange` 进行防抖处理
5. **状态同步**：确保外部状态与组件内部状态保持同步

## 完整示例

查看 `JSONEditorExample.tsx` 文件获取完整的使用示例，包括：

- 用户数据结构示例
- API 响应数据示例
- 应用配置示例
- 只读模式示例
- 自定义配置示例
- 使用说明和类型标识说明

## 技术实现

- **React Hooks**：使用 `useState`、`useMemo`、`useRef`、`useEffect` 管理状态
- **Ant Design**：基于 Card、Button、Tooltip、Input 等组件构建
- **TypeScript**：完整的类型定义和类型安全
- **JSON 解析**：智能解析 JSON 结构，构建节点树
- **递归渲染**：支持无限层级的嵌套结构
- **状态管理**：编辑状态、展开状态、错误状态的管理

## 许可证

MIT License
