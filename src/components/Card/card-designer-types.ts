// types.ts - 类型定义文件

export interface ComponentBase {
  id: string;
  tag: string;
  name?: string;
}

export interface PlainTextComponent extends ComponentBase {
  tag: 'plain_text';
  content: string;
  textColor?: string;
  fontSize?: number;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
  i18n_content?: { [key: string]: string };
}

export interface InputComponent extends ComponentBase {
  tag: 'input';
  name: string;
  required?: boolean;
  placeholder?: {
    content: string;
    i18n_content?: { [key: string]: string };
  };
  default_value?: {
    content: string;
    i18n_content?: { [key: string]: string };
  };
  inputType?: 'text' | 'password' | 'number' | 'email' | 'tel';
}

export interface ButtonComponent extends ComponentBase {
  tag: 'button';
  name: string;
  text: {
    tag: 'plain_text';
    content: string;
    i18n_content?: { [key: string]: string };
  };
  type?: 'primary' | 'default' | 'dashed' | 'text' | 'link';
  size?: 'small' | 'middle' | 'large';
  danger?: boolean;
  form_action_type?: 'submit' | 'reset';
  behaviors?: Array<{
    type: 'open_url' | 'callback';
    open_url?: {
      multi_url: {
        url: string;
        android_url?: string;
        ios_url?: string;
        pc_url?: string;
      };
    };
    callback?: { [key: string]: any };
  }>;
}

export interface SelectComponent extends ComponentBase {
  tag: 'select_static' | 'multi_select_static';
  name: string;
  required?: boolean;
  options: Array<{
    value: string;
    text: {
      content: string;
      i18n_content?: { [key: string]: string };
    };
  }>;
}

export interface ImageComponent extends ComponentBase {
  tag: 'img';
  img_url: string;
  width?: number;
  height?: number;
  i18n_img_url?: { [key: string]: string };
}

export interface FormComponent extends ComponentBase {
  tag: 'form';
  name: string;
  elements: ComponentType[];
}

export interface ColumnSetComponent extends ComponentBase {
  tag: 'column_set';
  gap?: number;
  columns: Array<{
    tag: 'column';
    elements: ComponentType[];
  }>;
}

export interface HrComponent extends ComponentBase {
  tag: 'hr';
}

export interface RichTextComponent extends ComponentBase {
  tag: 'rich_text';
  content: {
    type: 'doc';
    content: Array<{
      type: 'paragraph';
      content: Array<{
        type: 'text' | 'mention';
        text?: string;
        attrs?: { id: string; label: string };
      }>;
    }>;
  };
  i18n_content?: { [key: string]: any };
}

export interface ImageCombinationComponent extends ComponentBase {
  tag: 'img_combination';
  combination_mode: 'trisect' | 'bisect' | 'quad';
  combination_transparent?: boolean;
  img_list: Array<{
    img_url: string;
    i18n_img_url?: { [key: string]: string };
  }>;
}

export type ComponentType =
  | PlainTextComponent
  | InputComponent
  | ButtonComponent
  | SelectComponent
  | ImageComponent
  | FormComponent
  | ColumnSetComponent
  | HrComponent
  | RichTextComponent
  | ImageCombinationComponent;

export interface DesignData {
  direction: 'vertical';
  vertical_spacing: number;
  elements: ComponentType[];
}

export interface Variable {
  name: string;
  value: string;
  type: 'text' | 'number' | 'boolean' | 'object';
}

export interface DragItem {
  type: string;
  component?: ComponentType;
  path?: (string | number)[];
  isNew?: boolean;
}

export interface DeviceConfig {
  width: string;
  icon: React.ComponentType;
  name: string;
}

export interface ComponentConfig {
  name: string;
  icon: React.ComponentType;
  category: 'container' | 'display' | 'interactive';
}
