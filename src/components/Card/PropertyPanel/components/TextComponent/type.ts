import {
  ComponentType,
  VariableItem,
} from '../../../card-designer-types-updated';

export interface TextData {
  content?: string;
  i18n_content?: {
    'en-US': string;
  };
  style?: {
    fontSize?: number;
    color?: string;
    textAlign?: string;
    numberOfLines?: number;
  };
}

export interface TextComponentProps {
  selectedComponent: ComponentType;
  selectedPath: (string | number)[] | null;
  variables: VariableItem[];
  topLevelTab: string;
  setTopLevelTab: (tab: string) => void;
  textContentMode: 'specify' | 'variable';
  setTextContentMode: (mode: 'specify' | 'variable') => void;
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
