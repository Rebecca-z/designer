# JSONEditor 组件

一个功能强大的 JSON 编辑器组件，支持格式化、验证、折叠展开等功能。

## 新功能：外部方法调用

JSONEditor 现在支持通过 ref 调用内部方法，允许外部组件获取格式化后的 JSON 内容。

### 主要方法

#### `getFormattedJSON()`

获取格式化后的 JSON 内容，如果内容有错误则抛出错误信息。

**返回值：**

```typescript
{ success: true; data: string } | { success: false; error: string }
```

**使用示例：**

```typescript
const jsonEditorRef = useRef<JSONEditorRef>(null);

const handleGetJSON = () => {
  if (jsonEditorRef.current) {
    const result = jsonEditorRef.current.getFormattedJSON();

    if (result.success) {
      console.log('格式化后的JSON:', result.data);
      // 使用格式化后的JSON
    } else {
      console.error('JSON错误:', result.error);
      // 处理错误
    }
  }
};
```

#### `validateJSON()`

验证当前 JSON 格式是否正确。

**返回值：**

```typescript
{ isValid: boolean; errors: JSONError[] }
```

**使用示例：**

```typescript
const handleValidate = () => {
  if (jsonEditorRef.current) {
    const { isValid, errors } = jsonEditorRef.current.validateJSON();

    if (isValid) {
      console.log('JSON格式正确');
    } else {
      console.error('JSON验证错误:', errors);
    }
  }
};
```

#### `formatJSON()`

手动触发 JSON 格式化。

**使用示例：**

```typescript
const handleFormat = () => {
  if (jsonEditorRef.current) {
    jsonEditorRef.current.formatJSON();
  }
};
```

### 完整使用示例

```typescript
import React, { useRef } from 'react';
import { Button, message } from 'antd';
import JSONEditor, { JSONEditorRef } from './index';

const MyComponent: React.FC = () => {
  const jsonEditorRef = useRef<JSONEditorRef>(null);

  const handleGetFormattedJSON = () => {
    if (jsonEditorRef.current) {
      const result = jsonEditorRef.current.getFormattedJSON();

      if (result.success) {
        message.success('获取格式化JSON成功');
        // 这里可以将格式化后的JSON用于其他用途
        // 比如保存到文件、发送到服务器等
        console.log('格式化后的JSON:', result.data);
      } else {
        message.error(`JSON格式错误: ${result.error}`);
        console.error('JSON错误:', result.error);
      }
    }
  };

  return (
    <div>
      <Button type="primary" onClick={handleGetFormattedJSON}>
        获取格式化JSON
      </Button>

      <JSONEditor
        ref={jsonEditorRef}
        json={{ name: '示例', value: 123 }}
        title="JSON编辑器"
        height="400px"
      />
    </div>
  );
};
```

### 类型定义

```typescript
interface JSONEditorRef {
  getFormattedJSON: () =>
    | { success: true; data: string }
    | { success: false; error: string };
  validateJSON: () => { isValid: boolean; errors: JSONError[] };
  formatJSON: () => void;
}
```

### 注意事项

1. 确保在使用 ref 方法前检查 ref.current 是否存在
2. `getFormattedJSON()`方法会返回完全展开的格式化 JSON
3. 如果 JSON 格式有错误，`getFormattedJSON()`会返回错误信息而不是抛出异常
4. 所有方法都是同步的，可以立即获得结果

### 错误处理

当 JSON 格式有错误时，`getFormattedJSON()`会返回详细的错误信息：

```typescript
{
  success: false,
  error: "Unexpected token } in JSON at position 15"
}
```

这样可以方便外部组件进行错误处理和用户提示。
