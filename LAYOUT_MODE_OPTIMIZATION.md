# 布局方式优化总结

## 优化概述

本次优化为卡片设计器新增了布局方式功能，用户可以在选中卡片时在右侧属性面板中设置布局方式，支持"垂直布局"和"流式布局"两种模式，并提供了直观的骨架屏预览效果。

## 优化目标

### 1. **新增布局方式选择**

- 在卡片选中时显示布局方式设置面板
- 支持"垂直"和"流式"两种布局模式
- 提供直观的布局预览效果

### 2. **实现布局样式差异**

- 垂直布局：组件垂直排列，使用垂直间距
- 流式布局：组件水平排列，支持换行，使用水平间距

### 3. **提升用户体验**

- 实时预览布局效果
- 直观的布局图标和预览
- 平滑的布局切换动画

## 技术实现

### 1. **数据结构扩展**

#### 修改 CardBody 接口

```typescript
export interface CardBody {
  direction: 'vertical';
  vertical_spacing: number;
  padding?: CardPadding;
  layout_mode?: 'vertical' | 'flow'; // 新增：布局方式
  elements: ComponentType[];
  styles?: {
    // ... 其他样式属性
  };
}
```

### 2. **属性面板优化**

#### 新增布局方式设置卡片

```typescript
{
  /* 布局方式设置 */
}
<Card title="📐 布局方式" size="small" style={{ marginBottom: '12px' }}>
  <Form layout="vertical" size="small">
    <Form.Item label="布局模式" help="选择卡片的布局方式，影响组件的排列方式">
      <Select
        value={cardData?.dsl?.body?.layout_mode || 'vertical'}
        onChange={(value) => {
          console.log('🎯 更新布局方式:', {
            oldValue: cardData?.dsl?.body?.layout_mode,
            newValue: value,
            timestamp: new Date().toISOString(),
          });
          onUpdateCard({ layout_mode: value });
        }}
        style={{ width: '100%' }}
      >
        <Option value="vertical">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '16px',
                height: '16px',
                backgroundColor: '#1890ff',
                borderRadius: '2px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '2px',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '2px',
                  backgroundColor: 'white',
                }}
              ></div>
              <div
                style={{
                  width: '100%',
                  height: '2px',
                  backgroundColor: 'white',
                }}
              ></div>
              <div
                style={{
                  width: '100%',
                  height: '2px',
                  backgroundColor: 'white',
                }}
              ></div>
            </div>
            <span>垂直布局</span>
          </div>
        </Option>
        <Option value="flow">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '16px',
                height: '16px',
                backgroundColor: '#52c41a',
                borderRadius: '2px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '1px',
                padding: '1px',
              }}
            >
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  backgroundColor: 'white',
                }}
              ></div>
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  backgroundColor: 'white',
                }}
              ></div>
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  backgroundColor: 'white',
                }}
              ></div>
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  backgroundColor: 'white',
                }}
              ></div>
            </div>
            <span>流式布局</span>
          </div>
        </Option>
      </Select>
    </Form.Item>

    {/* 布局预览 */}
    <Form.Item label="布局预览">
      <div
        style={{
          padding: '12px',
          backgroundColor: '#f5f5f5',
          borderRadius: '6px',
          border: '1px solid #d9d9d9',
        }}
      >
        {(cardData?.dsl?.body?.layout_mode || 'vertical') === 'vertical' ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              minHeight: '60px',
            }}
          >
            <div
              style={{
                height: '12px',
                backgroundColor: '#1890ff',
                borderRadius: '2px',
                opacity: 0.7,
              }}
            ></div>
            <div
              style={{
                height: '12px',
                backgroundColor: '#1890ff',
                borderRadius: '2px',
                opacity: 0.7,
              }}
            ></div>
            <div
              style={{
                height: '12px',
                backgroundColor: '#1890ff',
                borderRadius: '2px',
                opacity: 0.7,
              }}
            ></div>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '4px',
              minHeight: '60px',
            }}
          >
            <div
              style={{
                width: '30px',
                height: '20px',
                backgroundColor: '#52c41a',
                borderRadius: '2px',
                opacity: 0.7,
              }}
            ></div>
            <div
              style={{
                width: '40px',
                height: '20px',
                backgroundColor: '#52c41a',
                borderRadius: '2px',
                opacity: 0.7,
              }}
            ></div>
            <div
              style={{
                width: '25px',
                height: '20px',
                backgroundColor: '#52c41a',
                borderRadius: '2px',
                opacity: 0.7,
              }}
            ></div>
            <div
              style={{
                width: '35px',
                height: '20px',
                backgroundColor: '#52c41a',
                borderRadius: '2px',
                opacity: 0.7,
              }}
            ></div>
            <div
              style={{
                width: '20px',
                height: '20px',
                backgroundColor: '#52c41a',
                borderRadius: '2px',
                opacity: 0.7,
              }}
            ></div>
            <div
              style={{
                width: '45px',
                height: '20px',
                backgroundColor: '#52c41a',
                borderRadius: '2px',
                opacity: 0.7,
              }}
            ></div>
          </div>
        )}
      </div>
    </Form.Item>
  </Form>
</Card>;
```

### 3. **组件接口扩展**

#### 修改 CardWrapperProps 接口

```typescript
interface CardWrapperProps {
  // ... 其他属性
  // 新增：布局方式
  layoutMode?: 'vertical' | 'flow';
}
```

#### 修改 ChatInterfaceProps 接口

```typescript
interface ChatInterfaceProps {
  // ... 其他属性
  // 新增：布局方式
  layoutMode?: 'vertical' | 'flow';
}
```

### 4. **布局样式实现**

#### 卡片内容容器样式

```typescript
{/* 卡片内容 */}
<div
  style={{
    display: layoutMode === 'flow' ? 'flex' : 'flex',
    flexDirection: layoutMode === 'flow' ? 'row' : 'column',
    flexWrap: layoutMode === 'flow' ? 'wrap' : 'nowrap',
    gap: layoutMode === 'flow' ? '8px' : `${verticalSpacing}px`,
    position: 'relative',
  }}
>
```

#### 组件包装器样式

```typescript
<div
  style={{
    display: layoutMode === 'flow' ? 'inline-block' : 'block',
    marginBottom: layoutMode === 'flow' ? '0' : '8px',
    marginRight: layoutMode === 'flow' ? '8px' : '0',
  }}
>
  <ComponentRenderer ... />
</div>
```

### 5. **数据传递链路**

#### 数据流向

```
PropertyPanel (布局方式设置)
  ↓ onUpdateCard({ layout_mode: value })
CardDesigner (主组件)
  ↓ data.dsl.body.layout_mode
Canvas (画布组件)
  ↓ layoutMode={data.dsl.body.layout_mode || 'vertical'}
ChatInterface (会话界面)
  ↓ layoutMode={layoutMode}
CardWrapper (卡片包装器)
  ↓ layoutMode={layoutMode}
```

## 布局效果对比

### 垂直布局 (vertical)

- **排列方式**: 组件垂直排列
- **间距**: 使用垂直间距 (`verticalSpacing`)
- **换行**: 不换行
- **适用场景**: 传统卡片布局，适合内容较多的场景

### 流式布局 (flow)

- **排列方式**: 组件水平排列
- **间距**: 使用水平间距 (8px)
- **换行**: 支持自动换行
- **适用场景**: 标签式布局，适合内容较少的场景

## 用户体验优化

### 1. **直观的图标设计**

- 垂直布局：蓝色背景，三条白色横线
- 流式布局：绿色背景，四个白色小方块

### 2. **实时预览效果**

- 骨架屏预览，直观展示布局效果
- 垂直布局：三条蓝色横条
- 流式布局：多个绿色小方块

### 3. **平滑切换**

- 布局切换时保持组件内容不变
- 使用 CSS transition 实现平滑动画

## 技术亮点

### 1. **类型安全**

- 使用 TypeScript 严格类型定义
- 布局方式限制为 'vertical' | 'flow'

### 2. **响应式设计**

- 流式布局支持自动换行
- 适配不同屏幕尺寸

### 3. **性能优化**

- 布局切换不影响组件状态
- 使用 CSS flexbox 实现高效布局

### 4. **可扩展性**

- 预留了更多布局方式的扩展空间
- 布局逻辑与组件逻辑分离

## 总结

本次优化成功为卡片设计器新增了布局方式功能，用户可以根据内容特点选择合适的布局方式：

- **垂直布局**：适合内容较多、需要清晰层次结构的场景
- **流式布局**：适合内容较少、需要紧凑展示的场景

通过直观的图标设计和实时预览，用户可以快速理解不同布局的效果，提升了设计器的易用性和灵活性。
