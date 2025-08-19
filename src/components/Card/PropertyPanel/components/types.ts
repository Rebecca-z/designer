// 通用组件接口定义
import { ComponentType, VariableItem } from '../../card-designer-types-updated';

export interface BaseComponentProps {
  selectedComponent: ComponentType;
  selectedPath: (string | number)[] | null;
  variables: VariableItem[];
  topLevelTab: string;
  setTopLevelTab: (tab: string) => void;
  lastBoundVariables: Record<string, string>;
  setLastBoundVariables: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  initializedComponents: Set<string>;
  onUpdateComponent: (component: ComponentType) => void;
  handleValueChange: (field: string, value: any) => void;
  getFilteredVariables: (componentType: string) => VariableItem[];
  getVariableDisplayName: (variable: VariableItem) => string;
  getVariableKeys: (variable: any) => string[];
  handleAddVariableFromComponent: (componentType: string) => void;
  isVariableModalVisible: boolean;
  handleVariableModalOk: (variable: any) => void;
  handleVariableModalCancel: () => void;
  editingVariable: any;
  isVariableModalFromVariablesTab: boolean;
  modalComponentType?: string;
  VariableManagementPanel: React.ComponentType;
}

// 文本组件特有的Props
export interface TextComponentProps extends BaseComponentProps {
  textContentMode: 'specify' | 'variable';
  setTextContentMode: (mode: 'specify' | 'variable') => void;
}

// 输入框组件特有的Props
export interface InputComponentProps extends BaseComponentProps {
  inputPlaceholderMode: 'specify' | 'variable';
  setInputPlaceholderMode: (mode: 'specify' | 'variable') => void;
  inputDefaultValueMode: 'specify' | 'variable';
  setInputDefaultValueMode: (mode: 'specify' | 'variable') => void;
}

// 图片组件特有的Props
export interface ImageComponentProps extends BaseComponentProps {
  imageContentMode: 'specify' | 'variable';
  setImageContentMode: (mode: 'specify' | 'variable') => void;
  initializedImageComponents: Set<string>;
}

// 多图混排组件特有的Props
export interface ImgCombinationComponentProps extends BaseComponentProps {
  multiImageContentMode: 'specify' | 'variable';
  setMultiImageContentMode: (mode: 'specify' | 'variable') => void;
}

// 下拉选择组件特有的Props
export interface SelectComponentProps extends BaseComponentProps {
  selectOptionsMode: 'specify' | 'variable';
  setSelectOptionsMode: (mode: 'specify' | 'variable') => void;
}

// 下拉多选组件特有的Props
export interface MultiSelectComponentProps extends BaseComponentProps {
  multiSelectOptionsMode: 'specify' | 'variable';
  setMultiSelectOptionsMode: (mode: 'specify' | 'variable') => void;
}
