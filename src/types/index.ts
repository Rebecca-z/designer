// src/types/index.ts
export type DragItem = {
  type: string; // 'component' | 'layout'
  componentType: string; // 'text' | 'button' | 'layout-2' | ...
  label: string;
};

export type CanvasNode = {
  id: string;
  type: string; // 'text' | 'button' | 'layout-2' | ...
  props: Record<string, any>;
  children?: CanvasNode[];
};
