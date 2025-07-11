// src/types/index.ts
export type DragItem = {
  type: string; // 'component' | 'layout'
  componentType: string; // 'text' | 'button' | 'layout-2' | ...
  label: string;
};

export type CanvasNode = {
  id: string;
  type: string; // 'text' | 'button' | 'layout-2' | 'title' | ...
  props: Record<string, any>;
  children?: CanvasNode[];
};

// 标题组件的 header 数据结构
export type HeaderData = {
  style: 'blue' | 'wethet' | 'green' | 'red';
  title: string;
  subtitle: string;
};

// 扩展 CanvasNode 以支持根级别的 header
export type CanvasData = {
  header?: HeaderData;
  elements: CanvasNode[];
};
