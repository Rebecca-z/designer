# 左侧面板拖拽优化总结

## 功能需求

允许左侧展示区块（除了标题）和交互区块拖拽移动到画布中的表单容器和分栏容器中，拖拽进来的时候可以是插入到任意位置。

## 优化措施

### 1. 创建 DraggableItem 组件

- **文件位置**: `src/components/Designer/DraggableItem.tsx`
- **功能**: 为左侧面板的组件提供拖拽源功能
- **特性**:
  - 使用`useDrag` hook 实现拖拽
  - 拖拽类型为`'component'`
  - 支持拖拽时的视觉反馈
  - 防抖和状态缓存机制

### 2. 优化 SmartDropZone 组件

- **文件位置**: `src/components/Card/card-designer-renderer-core.tsx`
- **新增功能**:
  - 插入位置检测（before/after/inside）
  - 边缘检测阈值（20px）
  - 插入位置指示线
  - 精确的插入索引计算

#### 插入位置检测逻辑

```typescript
// 如果容器为空，直接插入到内部
if (childElements.length === 0) {
  currentInsertPosition = 'inside';
  currentInsertIndex = 0;
} else {
  // 检查是否在容器的边缘区域
  const edgeThreshold = 20;

  // 检查顶部边缘
  if (hoverClientY <= edgeThreshold) {
    currentInsertPosition = 'before';
    currentInsertIndex = 0;
  }
  // 检查底部边缘
  else if (hoverClientY >= containerHeight - edgeThreshold) {
    currentInsertPosition = 'after';
    currentInsertIndex = childElements.length;
  }
  // 在容器内部，根据鼠标位置确定插入位置
  else {
    const childHeight = containerHeight / childElements.length;
    const targetChildIndex = Math.floor(hoverClientY / childHeight);
    // ... 计算具体插入位置
  }
}
```

### 3. 优化 ContainerSortableItem 和 DraggableWrapper

- **文件位置**: `src/components/Card/card-designer-renderer-core.tsx`
- **优化内容**:
  - 更新`canDrop`逻辑，支持左侧新组件拖拽
  - 确保容器嵌套限制正确工作
  - 支持插入到任意位置

### 4. 更新容器组件识别

- **文件位置**: `src/components/Card/card-designer-renderer-core.tsx`
- **更新内容**: `isContainerComponent`函数

```typescript
const isContainerComponent = (componentType: string): boolean => {
  return (
    componentType === 'form' ||
    componentType === 'column_set' ||
    componentType === 'form-container' ||
    componentType === 'layout-columns'
  );
};
```

## 支持的组件类型

### 展示区块（可以拖拽到容器中）

- `text` - 文本
- `richtext` - 富文本
- `divider` - 分割线
- `image` - 图片
- `image-mix` - 多图混排

### 交互区块（可以拖拽到容器中）

- `input` - 输入框
- `button` - 按钮
- `select-single` - 下拉单选
- `select-multi` - 下拉多选

### 容器区块（不能嵌套到其他容器中）

- `form-container` - 表单容器
- `layout-columns` - 分栏

### 限制组件

- `title` - 标题组件不能拖拽到容器中

## 拖拽流程

### 1. 左侧组件拖拽

1. 用户从左侧面板拖拽组件
2. `DraggableItem`组件创建拖拽项
3. 拖拽类型为`'component'`，`isNew: true`

### 2. 容器接收拖拽

1. `SmartDropZone`检测拖拽悬停
2. 根据鼠标位置确定插入位置
3. 显示插入位置指示线
4. 显示拖拽提示信息

### 3. 组件放置

1. 检查组件类型是否允许放置
2. 计算正确的插入索引
3. 调用`onContainerDrop`或`onComponentMove`
4. 更新组件树结构

## 插入位置指示

### 视觉指示

- **顶部插入**: 蓝色指示线显示在容器顶部
- **底部插入**: 蓝色指示线显示在容器底部
- **内部插入**: 容器背景高亮显示

### 文字提示

- "插入到顶部" - 当鼠标在容器顶部边缘
- "插入到底部" - 当鼠标在容器底部边缘
- "插入到容器内" - 当容器为空时

## 技术实现细节

### 拖拽类型统一

- 左侧新组件: `'component'`
- 画布现有组件: `'canvas-component'`
- 容器内组件: `'container-component'`
- 通用组件: `'existing-component'`

### 路径处理

- 支持复杂的嵌套路径
- 正确处理父子关系检查
- 避免循环嵌套

### 性能优化

- 防抖机制减少频繁更新
- 状态缓存避免重复计算
- 快速过渡动画提供流畅体验

## 测试建议

### 功能测试

1. 测试左侧展示区块拖拽到表单容器
2. 测试左侧交互区块拖拽到分栏容器
3. 测试插入到不同位置（顶部、中间、底部）
4. 测试容器为空时的拖拽
5. 测试容器已有组件时的拖拽

### 限制测试

1. 测试标题组件不能拖拽到容器
2. 测试容器组件不能嵌套
3. 测试拖拽到自己身上的限制
4. 测试拖拽到子元素的限制

### 用户体验测试

1. 测试插入位置指示线的显示
2. 测试拖拽提示信息的准确性
3. 测试拖拽过程的流畅性
4. 测试边缘检测的精确性

## 注意事项

1. **边缘检测阈值**: 当前设置为 20px，可根据实际需求调整
2. **容器嵌套限制**: 确保容器组件不会嵌套到其他容器中
3. **标题组件限制**: 标题组件只能在画布顶部，不能拖拽到容器中
4. **路径安全**: 确保所有路径操作都有安全检查
5. **性能考虑**: 大量组件时注意拖拽性能优化
