# 变量编辑功能修复验证

## 问题描述

在之前的实现中，点击编辑变量列表中的变量时，弹出编辑变量弹窗后，编辑完内容点击更新，数据没有正确更新到变量列表和数据结构中。

## 问题根因分析

### 1. 数据格式不匹配

- `editingVariable` 是 `Variable` 类型：`{ name: string, value: string, type: string }`
- `variables` 数组中的元素是 `VariableItem` 类型：`{ 变量名: 值 }`
- 在编辑模式下，代码试图通过 `v === editingVariable` 来匹配变量，但格式不匹配

### 2. 对象引用比较失败

```typescript
// 错误的比较方式
const newVariables = variables.map((v) => {
  if (v === editingVariable) {
    // 这里永远不会匹配成功
    return variableObject;
  }
  return v;
});
```

## 修复方案

### 1. 添加变量名称查找函数

```typescript
// 根据变量名称查找变量在数组中的索引
const findVariableIndexByName = (variableName: string): number => {
  return variables.findIndex((v) => {
    if (typeof v === 'object' && v !== null) {
      const keys = Object.keys(v as VariableObject);
      return keys.length > 0 && keys[0] === variableName;
    }
    return false;
  });
};
```

### 2. 修改编辑更新逻辑

```typescript
if (editingVariable) {
  // 编辑模式：通过变量名称查找并更新现有变量
  const variableIndex = findVariableIndexByName(editingVariable.name);

  if (variableIndex !== -1) {
    // 找到变量，更新它
    const newVariables = [...variables];
    newVariables[variableIndex] = variableObject;
    onUpdateVariables(newVariables);

    console.log('🔄 更新变量:', {
      variableName: editingVariable.name,
      variableIndex,
      oldVariable: variables[variableIndex],
      newVariable: variableObject,
      allVariables: newVariables,
    });
  } else {
    // 没找到变量，作为新变量添加
    const newVariables = [...variables, variableObject];
    onUpdateVariables(newVariables);
    console.log('⚠️ 未找到要编辑的变量，作为新变量添加:', {
      variableName: editingVariable.name,
      newVariable: variableObject,
      allVariables: newVariables,
    });
  }
}
```

## 修复后的数据流

### 1. 编辑流程

```
用户点击编辑按钮
→ 创建 Variable 对象 { name, value, type }
→ 设置 editingVariable 状态
→ 打开 AddVariableModal 弹窗
→ 弹窗回显数据
→ 用户修改数据
→ 点击更新按钮
→ 通过变量名称查找要更新的变量
→ 更新 variables 数组
→ 调用 onUpdateVariables 更新全局状态
→ 关闭弹窗，清空 editingVariable
```

### 2. 数据更新验证

```typescript
// 在 handleAddVariableFromModal 中添加详细的日志
console.log('🔄 更新变量:', {
  variableName: editingVariable.name,
  variableIndex,
  oldVariable: variables[variableIndex],
  newVariable: variableObject,
  allVariables: newVariables,
});
```

## 测试用例

### 测试场景 1：编辑文本变量

1. 创建一个文本变量 `userName: "张三"`
2. 点击编辑按钮
3. 修改值为 `"李四"`
4. 点击更新
5. **预期结果**：变量列表显示 `userName: "李四"`

### 测试场景 2：编辑数字变量

1. 创建一个数字变量 `age: 25`
2. 点击编辑按钮
3. 修改值为 `30`
4. 点击更新
5. **预期结果**：变量列表显示 `age: 30`

### 测试场景 3：编辑对象变量

1. 创建一个图片变量 `avatar: { img_key: "old_key" }`
2. 点击编辑按钮
3. 修改 img_key 为 `"new_key"`
4. 点击更新
5. **预期结果**：变量列表显示 `avatar: { img_key: "new_key" }`

### 测试场景 4：编辑数组变量

1. 创建一个数组变量 `options: [{ text: "选项1", value: "1" }]`
2. 点击编辑按钮
3. 添加新选项 `{ text: "选项2", value: "2" }`
4. 点击更新
5. **预期结果**：变量列表显示更新后的数组

## 验证步骤

### 1. 启动应用

```bash
npm run dev
```

### 2. 进入设计器页面

- 访问 `/designer` 页面
- 确保变量管理面板可见

### 3. 创建测试变量

- 点击"添加自定义变量"
- 创建不同类型的变量进行测试

### 4. 执行编辑测试

- 点击变量项的编辑按钮
- 修改变量值
- 点击更新按钮
- 验证变量列表是否实时更新

### 5. 检查控制台日志

- 打开浏览器开发者工具
- 查看控制台中的更新日志
- 确认数据更新流程正确

## 预期结果

### ✅ 成功指标

1. **数据回显正确**：编辑弹窗正确显示当前变量数据
2. **更新成功**：点击更新后变量列表立即显示新数据
3. **全局同步**：全局状态和卡片数据结构同步更新
4. **类型保持**：编辑后变量类型保持不变
5. **错误处理**：如果找不到要编辑的变量，会作为新变量添加

### ❌ 失败指标

1. **数据不回显**：编辑弹窗显示空数据或默认数据
2. **更新失败**：点击更新后变量列表没有变化
3. **数据丢失**：编辑后变量数据丢失或格式错误
4. **类型错误**：编辑后变量类型发生变化

## 修复验证清单

- [x] 添加 `findVariableIndexByName` 函数
- [x] 修改 `handleAddVariableFromModal` 中的编辑逻辑
- [x] 使用变量名称而不是对象引用来匹配变量
- [x] 添加详细的日志输出用于调试
- [x] 处理找不到变量的边界情况
- [x] 确保数据格式转换正确
- [x] 验证全局状态更新流程

## 总结

通过修复变量匹配逻辑，现在编辑功能应该能够正确工作：

1. **正确识别要编辑的变量**：通过变量名称而不是对象引用
2. **准确更新数据**：在正确的位置更新变量数据
3. **实时同步状态**：确保全局状态和 UI 同步更新
4. **完整的错误处理**：处理各种边界情况

这个修复确保了变量编辑功能的完整性和可靠性。
