import type { FormData, Parameter } from './type';

export const BUTTON_COLORS = [
  { value: 'black', label: '黑色gray', color: '#000000' },
  { value: 'blue', label: '蓝色blue', color: '#1890ff' },
  { value: 'red', label: '红色red', color: '#ff4d4f' },
] as const;

export const DEFAULT_FORM_DATA: FormData = {
  pcUrl: '',
  mobileUrl: '',
  paramType: 'object',
};

export const DEFAULT_PARAMETER: Parameter = {
  id: 1,
  param1: '',
  param2: '',
};
