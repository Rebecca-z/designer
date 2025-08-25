import { Variable } from '../../type';

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
  editingVariable?: Variable | undefined; // 新增：编辑的变量
  componentType?: string; // 新增：当前选中组件的类型，用于过滤变量类型
}

export interface VariableFormData {
  type: VariableType;
  name: string;
  description: string;
  mockData: string;
}
