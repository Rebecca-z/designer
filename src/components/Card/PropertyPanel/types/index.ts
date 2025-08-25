// PropertyPanel 相关类型定义

import { CardDesignData, ComponentType, Variable } from '../../type';

// 事件管理相关类型定义
export interface EventAction {
  id: string;
  type: 'callback';
  action: string;
  paramType: 'string' | 'object';
  paramValue: string;
  confirmDialog: boolean;
}

// 可拖拽组件的 Props
export interface DraggableComponentProps {
  type: string;
  config: any;
}

// 组件库面板的 Props
export interface ComponentLibraryProps {
  // 预留属性，暂时为空
  [key: string]: any;
}

// 大纲树的 Props
export interface OutlineTreeProps {
  data: CardDesignData;
  selectedPath: (string | number)[] | null;
  onOutlineHover: (path: (string | number)[] | null) => void;
  onOutlineSelect: (
    component: ComponentType | null,
    path: (string | number)[],
  ) => void;
}

// 左侧组件面板的 Props
export interface ComponentPanelProps {
  cardData: CardDesignData;
  selectedPath: (string | number)[] | null;
  onOutlineHover: (path: (string | number)[] | null) => void;
  onOutlineSelect: (
    component: ComponentType | null,
    path: (string | number)[],
  ) => void;
}

// 右侧属性面板的 Props
export interface PropertyPanelProps {
  cardData: CardDesignData;
  selectedPath: (string | number)[] | null;
  variables: Variable[];
  onUpdate: (data: CardDesignData) => void;
  onAddVariable: (componentType?: string) => void;
  onVariableUpdate: (variables: Variable[]) => void;
}

// 事件编辑弹窗的 Props
export interface EventEditModalProps {
  visible: boolean;
  eventAction: EventAction;
  variables: Variable[];
  onOk: (action: EventAction) => void;
  onCancel: () => void;
  onChange: (field: string, value: any) => void;
  onAddVariable: () => void;
}

// 组件状态管理相关类型
export interface ComponentStateManager {
  getMode: (componentId: string) => string;
  setMode: (componentId: string, mode: string) => void;
  getLastBoundVariable: (componentId: string) => string | undefined;
  setLastBoundVariable: (componentId: string, variableName: string) => void;
  isInitialized: (componentId: string) => boolean;
  setInitialized: (componentId: string) => void;
  getUserEditedContent: (componentId: string) => any;
  setUserEditedContent: (componentId: string, content: any) => void;
  getBoundVariableName: (componentId: string) => string | undefined;
  setBoundVariableName: (
    componentId: string,
    variableName: string | undefined,
  ) => void;
}
