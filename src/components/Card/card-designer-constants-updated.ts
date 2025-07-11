// card-designer-constants-updated.ts - 更新的常量配置文件

import {
  AppstoreOutlined,
  BlockOutlined,
  CheckSquareOutlined,
  ColumnHeightOutlined,
  CrownOutlined,
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
import {
  CardDesignData,
  ComponentConfig,
  DeviceConfig,
} from './card-designer-types-updated';

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
  title: { name: '标题', icon: CrownOutlined, category: 'display' },
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

// 生成唯一ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// 默认卡片配置
export const DEFAULT_CARD_DATA: CardDesignData = {
  id: generateId(),
  name: '空白卡片',
  dsl: {
    schema: 0.1,
    config: {},
    card_link: {
      multi_url: {
        url: '',
        android_url: '',
        ios_url: '',
        pc_url: '',
      },
    },
    header: {
      style: {},
      title: {
        content: '',
        i18n_content: {
          'en-US': '',
        },
      },
      subtitle: {
        content: '',
        i18n_content: {
          'en-US': '',
        },
      },
    },
    body: {
      direction: 'vertical',
      vertical_spacing: 8,
      padding: {
        top: 16,
        right: 16,
        bottom: 16,
        left: 16,
      },
      elements: [],
    },
  },
  variables: {},
};

// 向后兼容的默认配置
export const DEFAULT_DESIGN_DATA = {
  direction: 'vertical' as const,
  vertical_spacing: 5,
  elements: [],
};
