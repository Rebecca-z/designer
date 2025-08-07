export interface JSONEditorProps {
  json: string | object;
  title?: string;
  height?: string | number;
  className?: string;
  onJSONChange?: (newJSON: string) => void;
  onSave?: (json: string) => void;
  readOnly?: boolean;
  isVariableModalOpen?: boolean; // 新增：变量弹窗是否打开
}

export interface LineData {
  lineNumber: number;
  content: string;
  indent: number;
  isCollapsible: boolean;
  isCollapsed: boolean;
  nodeType: 'object' | 'array' | 'property' | 'value';
  path: string;
  originalValue?: any;
}

export interface JSONError {
  line: number;
  column: number;
  message: string;
}
