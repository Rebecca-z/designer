export interface JSONEditorProps {
  json: string | object;
  title?: string;
  height?: string | number;
  className?: string;
  onJSONChange?: (newJSON: string) => void;
  onSave?: (json: string) => void;
  readOnly?: boolean;
  isVariableModalOpen?: boolean; // 新增：变量弹窗是否打开
  componentType?: string; // 新增：当前选中组件的类型，用于过滤变量类型
}

// 新增：JSONEditor对外暴露的方法接口
export interface JSONEditorRef {
  getFormattedJSON: () =>
    | { success: true; data: string }
    | { success: false; error: string; data: undefined };
  validateJSON: () => { isValid: boolean; errors: JSONError[] };
  formatJSON: () => Promise<void>;
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
