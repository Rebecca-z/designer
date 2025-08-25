interface OptionItem {
  text: {
    content: string;
    i18n_content: {
      'en-US': string;
    };
  };
  value: string;
}

export const DEFAULT_OPTIONS: OptionItem[] = [
  {
    text: { content: '选项1', i18n_content: { 'en-US': 'Option 1' } },
    value: 'option1',
  },
  {
    text: { content: '选项2', i18n_content: { 'en-US': 'Option 2' } },
    value: 'option2',
  },
] as const;

export const CONTENT_MODES = [
  { label: '指定', value: 'specify' },
  { label: '绑定变量', value: 'variable' },
] as const;
