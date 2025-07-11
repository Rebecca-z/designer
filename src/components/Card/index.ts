// index.ts - 卡片设计器主入口文件

// ==================== 主组件 ====================
// export { default as CardDesigner } from './card-designer-main-refactored';

// ==================== Hooks ====================
// export {
//   useClipboard,
//   useComponentDeletion,
//   useComponentSelection,
//   useComponentUpdate,
//   useConfigManagement,
//   useFocusManagement,
//   useHistory,
//   useKeyboardShortcuts,
//   useOutlineTree,
// } from './card-designer-hooks-exports';

// ==================== UI组件 ====================
export { default as Modals } from './card-designer-modals';
// export { default as Toolbar } from './card-designer-toolbar';

// ==================== 面板组件 ====================
// export { ComponentPanel, PropertyPanel } from './card-designer-panels';

// ==================== 画布组件 ====================
// export { default as Canvas } from './card-designer-canvas-refactored';

// 画布子组件
// export {
//   CanvasGrid,
//   CanvasHeader,
//   CanvasToolbar,
//   DeviceIndicator,
//   DragOverlay,
//   EmptyState,
// } from './card-designer-canvas-components';

// ==================== 渲染组件 ====================
// export { default as ComponentRenderer } from './card-designer-components';
// export { default as ComponentRendererCore } from './card-designer-renderer-core';

// ==================== 拖拽组件 ====================
// export { default as DragWrapper } from './card-designer-drag-wrapper';

// ==================== 错误处理 ====================
// export { default as ErrorBoundary } from './ErrorBoundary';

// ==================== 工具函数 ====================

// // 画布工具函数
// export {
//   CanvasDragHandler,
//   canDropInContainer,
//   deleteValueByPath,
//   getValueByPath,
//   insertIntoArray,
//   isContainerComponent,
//   isSamePath,
//   moveArrayElement,
//   setValueByPath,
// } from './card-designer-canvas-utils';

// 通用工具函数
// export {
//   cloneComponent,
//   convertFromTargetFormat,
//   convertToTargetFormat,
//   createDefaultComponent,
//   exportToJSON,
//   findComponentById,
//   generateId,
//   generatePreviewHTML,
//   generatePreviewHTMLAsync,
//   getComponentPath,
//   importFromJSON,
//   loadHTMLTemplate,
//   renderComponentToHTML,
//   validateComponent,
// } from './card-designer-utils';

// ==================== 类型定义 ====================
// export type {
//   ButtonComponent,
//   ColumnSetComponent,
//   ComponentBase,
//   ComponentConfig,
//   ComponentType,
//   DesignData,
//   DeviceConfig,
//   DragItem,
//   FormComponent,
//   HrComponent,
//   ImageCombinationComponent,
//   ImageComponent,
//   InputComponent,
//   PlainTextComponent,
//   RichTextComponent,
//   SelectComponent,
//   Variable,
// } from './card-designer-types';

// ==================== 常量定义 ====================
export {
  COMPONENT_CATEGORIES,
  COMPONENT_TYPES,
  DEFAULT_DESIGN_DATA,
  DEVICE_SIZES,
} from './card-designer-constants';

// ==================== 默认导出 ====================
export { default } from './card-designer-main-final';
