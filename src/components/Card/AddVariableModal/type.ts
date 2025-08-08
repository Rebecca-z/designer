import { Variable } from '../card-designer-types-updated';

export type VariableType =
  | 'text'
  | 'number'
  | 'image'
  | 'array'
  | 'richtext'
  | 'imageArray';

export interface AddVariableModalProps {
  visible: boolean;
  onOk: (variable: Variable) => void;
  onCancel: () => void;
  initialType?: VariableType;
  editingVariable?: Variable | null; // 新增：编辑的变量
}

export interface VariableFormData {
  type: VariableType;
  name: string;
  description: string;
  mockData: string;
}
