import {
  AppstoreAddOutlined,
  BarsOutlined,
  BorderOutlined,
  DownSquareOutlined,
  EditOutlined,
  FolderOutlined,
  FontSizeOutlined,
  FormOutlined,
  PictureOutlined,
  SelectOutlined,
} from '@ant-design/icons';
import { Divider, Tabs } from 'antd';
import React from 'react';
import DraggableItem from './Designer/DraggableItem';

const iconMap: Record<string, React.ReactNode> = {
  // 容器
  'form-container': <FormOutlined style={{ fontSize: 18, color: '#1890ff' }} />,
  'layout-columns': (
    <AppstoreAddOutlined style={{ fontSize: 18, color: '#1890ff' }} />
  ),
  // 展示
  text: <FontSizeOutlined style={{ fontSize: 18, color: '#52c41a' }} />,
  richtext: <EditOutlined style={{ fontSize: 18, color: '#52c41a' }} />,
  divider: <BorderOutlined style={{ fontSize: 18, color: '#52c41a' }} />,
  image: <PictureOutlined style={{ fontSize: 18, color: '#52c41a' }} />,
  'image-mix': <PictureOutlined style={{ fontSize: 18, color: '#52c41a' }} />,
  // 交互
  input: <BarsOutlined style={{ fontSize: 18, color: '#faad14' }} />,
  button: <DownSquareOutlined style={{ fontSize: 18, color: '#faad14' }} />,
  'select-single': (
    <SelectOutlined style={{ fontSize: 18, color: '#faad14' }} />
  ),
  'select-multi': <SelectOutlined style={{ fontSize: 18, color: '#faad14' }} />,
  // 布局
  'layout-2': (
    <AppstoreAddOutlined style={{ fontSize: 18, color: '#1890ff' }} />
  ),
  'layout-3': (
    <AppstoreAddOutlined style={{ fontSize: 18, color: '#1890ff' }} />
  ),
  'layout-4': (
    <AppstoreAddOutlined style={{ fontSize: 18, color: '#1890ff' }} />
  ),
  'layout-1-3': (
    <AppstoreAddOutlined style={{ fontSize: 18, color: '#1890ff' }} />
  ),
  'layout-1-2': (
    <AppstoreAddOutlined style={{ fontSize: 18, color: '#1890ff' }} />
  ),
};

const containerList = [
  {
    type: 'component' as const,
    componentType: 'form-container',
    label: '表单容器',
  },
  {
    type: 'component' as const,
    componentType: 'layout-columns',
    label: '分栏',
  },
];
const displayList = [
  { type: 'component' as const, componentType: 'text', label: '文本' },
  { type: 'component' as const, componentType: 'richtext', label: '富文本' },
  { type: 'component' as const, componentType: 'divider', label: '分割线' },
  { type: 'component' as const, componentType: 'image', label: '图片' },
  { type: 'component' as const, componentType: 'image-mix', label: '多图混排' },
];
const interactiveList = [
  { type: 'component' as const, componentType: 'input', label: '输入框' },
  { type: 'component' as const, componentType: 'button', label: '按钮' },
  {
    type: 'component' as const,
    componentType: 'select-single',
    label: '下拉单选',
  },
  {
    type: 'component' as const,
    componentType: 'select-multi',
    label: '下拉多选',
  },
];

const layoutList = [
  { type: 'layout' as const, componentType: 'layout-2', label: '两栏' },
  { type: 'layout' as const, componentType: 'layout-3', label: '三栏' },
  { type: 'layout' as const, componentType: 'layout-4', label: '四栏' },
  { type: 'layout' as const, componentType: 'layout-1-3', label: '1:3' },
  { type: 'layout' as const, componentType: 'layout-1-2', label: '1:2' },
];

const renderDraggable = (item: {
  type: 'component' | 'layout';
  componentType: string;
  label: string;
}) => (
  <DraggableItem key={item.componentType} {...item}>
    <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
      <span style={{ width: '50%', display: 'flex', alignItems: 'center' }}>
        {iconMap[item.componentType] || (
          <FolderOutlined style={{ fontSize: 18 }} />
        )}
        <span style={{ marginLeft: 8 }}>{item.label}</span>
      </span>
      <span style={{ flex: 1 }} />
    </div>
  </DraggableItem>
);

const Sidebar: React.FC = () => (
  <Tabs defaultActiveKey="components" style={{ height: '100%' }}>
    <Tabs.TabPane tab="组件" key="components">
      <div style={{ padding: '8px 0' }}>
        <div
          style={{ fontWeight: 500, color: '#888', padding: '4px 16px 2px' }}
        >
          容器
        </div>
        {containerList.map(renderDraggable)}
        <Divider style={{ margin: '8px 0' }} />
        <div
          style={{ fontWeight: 500, color: '#888', padding: '4px 16px 2px' }}
        >
          展示
        </div>
        {displayList.map(renderDraggable)}
        <Divider style={{ margin: '8px 0' }} />
        <div
          style={{ fontWeight: 500, color: '#888', padding: '4px 16px 2px' }}
        >
          交互
        </div>
        {interactiveList.map(renderDraggable)}
      </div>
    </Tabs.TabPane>
    <Tabs.TabPane tab="布局" key="layout">
      {layoutList.map(renderDraggable)}
    </Tabs.TabPane>
  </Tabs>
);

export default Sidebar;
