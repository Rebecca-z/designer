// 组件渲染器共享类型定义
import { ComponentType, DragItem, VariableItem } from '../type';

export interface BaseRendererProps {
  component: ComponentType;
  isPreview?: boolean;
  onContainerDrop?: (
    draggedItem: DragItem,
    targetPath: (string | number)[],
    dropIndex?: number,
  ) => void;
  onComponentMove?: (
    draggedComponent: ComponentType,
    draggedPath: (string | number)[],
    targetPath: (string | number)[],
    dropIndex: number,
  ) => void;
  onUpdateComponent?: (
    componentPath: (string | number)[],
    updatedComponent: ComponentType,
  ) => void;
  path?: (string | number)[];
  index?: number;
  containerPath?: (string | number)[];
  enableDrag?: boolean;
  enableSort?: boolean;
  renderChildren?: (
    elements: ComponentType[],
    basePath: (string | number)[],
  ) => React.ReactNode[];
  onSelect?: (component: ComponentType, path: (string | number)[]) => void;
  selectedPath?: (string | number)[] | null;
  onDelete?: (path: (string | number)[]) => void;
  onCopy?: (component: ComponentType) => void;
  onCanvasFocus?: () => void;
  onClearSelection?: () => void;
  headerData?: {
    title?: { content: string };
    subtitle?: { content: string };
    style?: string;
  };
  variables?: VariableItem[];
  verticalSpacing?: number;
}

export interface WrapperProps {
  component: ComponentType;
  path: (string | number)[];
  index: number;
  containerPath: (string | number)[];
  onComponentMove?: (
    draggedComponent: ComponentType,
    draggedPath: (string | number)[],
    targetPath: (string | number)[],
    dropIndex: number,
  ) => void;
  enableSort?: boolean;
  onSelect?: (component: ComponentType, path: (string | number)[]) => void;
  selectedPath?: (string | number)[] | null;
  onCanvasFocus?: () => void;
  onClearSelection?: () => void;
  children: React.ReactNode;
}
