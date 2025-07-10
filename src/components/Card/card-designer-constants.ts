// constants.ts - 常量配置文件

import {
  AppstoreOutlined,
  BlockOutlined,
  CheckSquareOutlined,
  ColumnHeightOutlined,
  DesktopOutlined,
  EditOutlined,
  FileImageOutlined,
  FontSizeOutlined,
  FormOutlined,
  LineOutlined,
  MobileOutlined,
  SelectOutlined,
  TabletOutlined,
} from '@ant-design/icons';
import { ComponentConfig, DeviceConfig } from './card-designer-types';

// 设备尺寸配置
export const DEVICE_SIZES: Record<string, DeviceConfig> = {
  desktop: { width: '100%', icon: DesktopOutlined, name: '桌面端' },
  tablet: { width: '768px', icon: TabletOutlined, name: '平板端' },
  mobile: { width: '375px', icon: MobileOutlined, name: '移动端' },
};

// 组件类型定义
export const COMPONENT_TYPES: Record<string, ComponentConfig> = {
  // 容器组件
  form: { name: '表单容器', icon: FormOutlined, category: 'container' },
  column_set: {
    name: '分栏',
    icon: ColumnHeightOutlined,
    category: 'container',
  },

  // 展示组件
  plain_text: { name: '文本', icon: FontSizeOutlined, category: 'display' },
  rich_text: { name: '富文本', icon: EditOutlined, category: 'display' },
  hr: { name: '分割线', icon: LineOutlined, category: 'display' },
  img: { name: '图片', icon: FileImageOutlined, category: 'display' },
  img_combination: {
    name: '多图混排',
    icon: BlockOutlined,
    category: 'display',
  },

  // 交互组件
  input: { name: '输入框', icon: EditOutlined, category: 'interactive' },
  button: { name: '按钮', icon: AppstoreOutlined, category: 'interactive' },
  select_static: {
    name: '下拉单选',
    icon: SelectOutlined,
    category: 'interactive',
  },
  multi_select_static: {
    name: '下拉多选',
    icon: CheckSquareOutlined,
    category: 'interactive',
  },
};

// 组件分类配置
export const COMPONENT_CATEGORIES = [
  { key: 'container', title: '容器区块', color: '#52c41a' },
  { key: 'display', title: '展示区块', color: '#1890ff' },
  { key: 'interactive', title: '交互区块', color: '#722ed1' },
];

// 默认配置
export const DEFAULT_DESIGN_DATA = {
  direction: 'vertical' as const,
  vertical_spacing: 5,
  elements: [],
};
