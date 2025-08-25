// 常量定义
export const URL_FIELDS = [
  { key: 'url', label: 'URL', placeholder: '请输入URL' },
  {
    key: 'android_url',
    label: 'Android URL',
    placeholder: '请输入Android URL',
  },
  { key: 'ios_url', label: 'iOS URL', placeholder: '请输入iOS URL' },
  { key: 'pc_url', label: 'PC URL', placeholder: '请输入PC URL' },
] as const;

export const VERTICAL_SPACING_CONFIG = {
  min: 0,
  max: 100,
  step: 1,
  defaultValue: 8,
} as const;
