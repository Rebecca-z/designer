# PropertyPanel Components

这个目录包含了从 RightPanel/index.tsx 中拆分出来的各种组件类型的样式交互界面。

## 重构进度

### ✅ 已完成 (11 个组件)

- **TextComponent** - 普通文本组件
- **RichTextComponent** - 富文本组件
- **InputComponent** - 输入框组件
- **ImageComponent** - 图片组件
- **HrComponent** - 分割线组件
- **ImgCombinationComponent** - 多图混排组件
- **ColumnSetComponent** - 分栏组件
- **SelectComponent** - 下拉单选组件
- **MultiSelectComponent** - 下拉多选组件
- **ButtonComponent** - 按钮组件
- **TitleComponent** - 标题组件

## 结构说明

### 通用接口

- `types.ts` - 定义了所有组件共用的接口和类型
- `BaseComponentProps` - 基础组件属性接口
- 每个组件都有特定的扩展接口

### 组件结构

每个组件都包含：

1. **组件属性 Tab** - 组件特定的配置选项
2. **变量 Tab** - 变量管理面板
3. **样式设置** - 样式相关配置
4. **变量绑定** - 支持变量绑定功能

### 使用方式

```typescript
import { TextComponent, InputComponent, ImageComponent } from './components';

// 在 RightPanel 中使用
if (isTextComponent) {
  return <TextComponent {...props} />;
}
```

## 重构的好处

1. **代码分离** - 每个组件有独立的文件，便于维护
2. **类型安全** - 统一的接口定义，减少类型错误
3. **代码复用** - 通用逻辑可以在不同组件间共享
4. **易于扩展** - 新增组件类型时只需添加新文件
5. **调试友好** - 问题定位更准确，日志更清晰

## 接下来的工作

继续将剩余的组件从 RightPanel/index.tsx 中拆分出来，并逐步完善每个组件的功能。
