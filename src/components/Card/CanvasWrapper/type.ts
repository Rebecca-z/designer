import { ReactNode } from 'react';
import { DEVICE_SIZES } from '../constants';
import {
  CardDesignData,
  ComponentType,
  DesignData,
  DragItem,
  VariableItem,
} from '../type';
import { THEME_CONFIG } from './constants';

// 错误渲染
export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: any;
}

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

// 标题
export interface HeaderDataInterface {
  title?: { content: string };
  subtitle?: { content: string };
  style?: keyof typeof THEME_CONFIG;
}

export interface CardWrapperProps {
  elements: ComponentType[];
  verticalSpacing: number;
  selectedPath: (string | number)[] | null;
  hoveredPath: (string | number)[] | null;
  onElementsChange: (elements: ComponentType[]) => void;
  onSelectComponent: (
    component: ComponentType | null,
    path?: (string | number)[],
  ) => void;
  onDeleteComponent: (path: (string | number)[]) => void;
  onCopyComponent: (component: ComponentType) => void;
  onCanvasFocus: () => void;
  isCardSelected: boolean;
  onCardSelect: () => void;
  headerData?: HeaderDataInterface;
  // 标题数据更新回调
  onHeaderDataChange?: (headerData: HeaderDataInterface) => void;
  layoutMode?: 'vertical' | 'flow';
  variables?: VariableItem[];
}

export interface ChatInterfaceProps extends CardWrapperProps {
  device: keyof typeof DEVICE_SIZES;
  username?: string;
  avatar?: string;
}

// 页面中心区域内容
export interface CanvasProps {
  variables?: VariableItem[];
  data: CardDesignData;
  onDataChange: (data: CardDesignData) => void;
  selectedPath: (string | number)[] | null;
  hoveredPath: (string | number)[] | null;
  onSelectComponent: (
    component: ComponentType | null,
    path?: (string | number)[],
  ) => void;
  onDeleteComponent: (path: (string | number)[]) => void;
  onCopyComponent: (component: ComponentType) => void;
  device: keyof typeof DEVICE_SIZES;
  onCanvasFocus?: () => void;
  onDeviceChange: (device: keyof typeof DEVICE_SIZES) => void;
  // 历史操作
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  // 编辑操作
  selectedComponent: ComponentType | null;
  clipboard: ComponentType | null;
  onCopy: () => void;
  onPaste: () => void;
  // 新增：标题数据更新回调
  onHeaderDataChange?: (headerData: HeaderDataInterface) => void;
  // 新增：元素变化回调
  onElementsChange?: (elements: ComponentType[]) => void;
}

export interface ComponentRendererProps {
  component: ComponentType;
  onSelect: (
    component: ComponentType | null,
    path?: (string | number)[],
  ) => void;
  isSelected: boolean;
  selectedComponent: ComponentType | null;
  selectedPath: (string | number)[] | null;
  hoveredPath: (string | number)[] | null;
  isHovered: boolean;
  onUpdate: (data: DesignData) => void;
  onDelete: (path: (string | number)[]) => void;
  onCopy: (component: ComponentType) => void;
  path: (string | number)[];
  isPreview?: boolean;
  onContainerDrop?: (
    draggedItem: DragItem,
    targetPath: (string | number)[],
    dropIndex?: number,
  ) => void;
  onComponentSort?: (
    draggedComponent: ComponentType,
    draggedPath: (string | number)[],
    targetPath: (string | number)[],
    dropIndex: number,
  ) => void;
  onUpdateComponent?: (
    componentPath: (string | number)[],
    updatedComponent: ComponentType,
  ) => void;
  onHeaderDataChange?: (headerData: HeaderDataInterface) => void;
  onCanvasFocus?: () => void;
  headerData?: HeaderDataInterface;
  variables?: VariableItem[];
  verticalSpacing?: number;
}
