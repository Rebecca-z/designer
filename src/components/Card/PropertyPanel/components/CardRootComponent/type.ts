export interface MultiUrl {
  url?: string;
  android_url?: string;
  ios_url?: string;
  pc_url?: string;
}

export interface CardData {
  dsl?: {
    card_link?: {
      multi_url?: MultiUrl;
    };
  };
}

export interface CardRootComponentProps {
  cardVerticalSpacing: number;
  onUpdateCard: (updates: any) => void;
  cardData?: CardData;
  handleValueChange: (field: string, value: any) => void;
  topLevelTab: string;
  setTopLevelTab: (tab: string) => void;
  VariableManagementPanel: React.ComponentType;
  // 变量弹窗相关props
  isVariableModalVisible?: boolean;
  handleVariableModalOk?: (variable: any) => void;
  handleVariableModalCancel?: () => void;
  editingVariable?: any;
  isVariableModalFromVariablesTab?: boolean;
  modalComponentType?: string;
}
