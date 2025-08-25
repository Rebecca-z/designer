export interface InputData {
  required?: boolean;
  placeholder?: {
    content?: string;
    i18n_content?: {
      'en-US': string;
    };
  };
  default_value?: {
    content?: string;
    i18n_content?: {
      content: string;
    };
  };
}
