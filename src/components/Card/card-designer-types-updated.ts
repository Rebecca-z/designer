// card-designer-types-updated.ts - 更新的类型定义

export interface ComponentBase {
  id: string;
  tag: string;
  name?: string;
  styles?: {
    // 布局样式
    display?: string;
    position?: string;
    width?: string;
    height?: string;
    minWidth?: string;
    minHeight?: string;

    // 间距样式
    margin?: string;
    padding?: string;

    // 字体样式
    fontSize?: string;
    fontWeight?: string;
    color?: string;
    lineHeight?: string;
    textAlign?: string;
    textDecoration?: string;

    // 背景样式
    backgroundColor?: string;
    backgroundImage?: string;
    backgroundRepeat?: string;
    backgroundPosition?: string;

    // 边框样式
    borderWidth?: string;
    borderStyle?: string;
    borderColor?: string;
    borderRadius?: string;

    // 阴影效果
    boxShadow?: string;
    textShadow?: string;

    // 自定义CSS
    customCSS?: string;

    // 其他样式属性
    [key: string]: any;
  };
}

export interface TitleComponent extends ComponentBase {
  tag: 'title';
  // title和subtitle属性已移到CardHeader中
  // title: string;
  // subtitle: string;
  style:
    | 'blue'
    | 'wathet'
    | 'turquoise'
    | 'green'
    | 'yellow'
    | 'orange'
    | 'red';
}

export interface TextComponent extends ComponentBase {
  tag: 'plain_text' | 'rich_text';
  content: string | any;
  i18n_content?: { [key: string]: string | any };
  fontSize?: 12 | 14 | 16; // 新增：字体大小
  numberOfLines?: number; // 新增：最大显示行数
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
  optionSource: 'specified' | 'variable'; // 新增：选项来源 - 指定或绑定变量
  variableName?: string; // 新增：绑定的变量名
  value?: string | string[]; // 新增：选中的值，单选为string，多选为string[]
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
  img_source?: 'upload' | 'variable'; // 新增：图片来源类型
  img_name?: string; // 新增：图片名称
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
  name: string;
  content: any; // TipTap JSON 格式的富文本内容或HTML字符串(向后兼容)
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
  | TitleComponent
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

// 新的卡片数据结构
export interface CardPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface CardBody {
  direction: 'vertical' | 'flow'; // 修改：支持垂直和流式布局
  vertical_spacing: number;
  padding?: CardPadding;
  elements: ComponentType[];
  styles?: {
    // 布局样式
    display?: string;
    position?: string;
    width?: string;
    height?: string;
    minWidth?: string;
    minHeight?: string;

    // 间距样式
    margin?: string;
    padding?: string;

    // 字体样式
    fontSize?: string;
    fontWeight?: string;
    color?: string;
    lineHeight?: string;
    textAlign?: string;
    textDecoration?: string;

    // 背景样式
    backgroundColor?: string;
    backgroundImage?: string;
    backgroundRepeat?: string;
    backgroundPosition?: string;

    // 边框样式
    borderWidth?: string;
    borderStyle?: string;
    borderColor?: string;
    borderRadius?: string;

    // 阴影效果
    boxShadow?: string;
    textShadow?: string;

    // 自定义CSS
    customCSS?: string;

    // 其他样式属性
    [key: string]: any;
  };
}

export interface CardHeader {
  style?: string; // 改为字符串类型，直接存储主题样式
  title: {
    content: string;
    i18n_content?: { [key: string]: string };
  };
  subtitle: {
    content: string;
    i18n_content?: { [key: string]: string };
  };
  // 索引签名
  [key: string]: any;
}

export interface CardLink {
  multi_url: {
    url: string;
    android_url: string;
    ios_url: string;
    pc_url: string;
  };
}

export interface CardDSL {
  schema: number;
  config: { [key: string]: any };
  card_link: CardLink;
  header?: CardHeader; // 改为可选，只有当存在标题组件时才创建
  body: CardBody;
}

export interface CardDesignData {
  id?: string; // 可选，因为可能从外部传入
  name: string;
  dsl: CardDSL;
  variables: { [key: string]: any };
}

// 旧的设计数据结构（向后兼容）
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

// 新的变量格式：{变量名: 模拟数据值}
export type VariableObject = { [key: string]: any };

// 兼容两种格式的变量类型
export type VariableItem = Variable | VariableObject;

export interface DragItem {
  type: string;
  component?: ComponentType;
  path?: (string | number)[];
  isNew?: boolean;
  isChildComponent?: boolean; // 标识是否为子组件
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
