export const CROP_MODES = [
  { value: 'default', label: '完整展示' },
  { value: 'top', label: '顶部裁剪' },
  { value: 'center', label: '居中裁剪' },
] as const;

export const CONTENT_MODES = [
  { label: '指定', value: 'specify' },
  { label: '绑定变量', value: 'variable' },
] as const;
