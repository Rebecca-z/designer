//  会话界面组件
import { SendOutlined } from '@ant-design/icons';
import { Avatar, Typography } from 'antd';
import React from 'react';
import { ComponentType, VariableItem } from '../type';
import CardWrapper from './CanvasCard';

const { Text } = Typography;

interface ChatInterfaceProps {
  elements: ComponentType[];
  verticalSpacing: number;
  selectedPath: (string | number)[] | null;
  hoveredPath: (string | number)[] | null;
  onElementsChange: (elements: ComponentType[]) => void;
  onSelectComponent: (
    component: ComponentType | null,
    path?: (string | number)[],
  ) => void;
  onDeleteComponent: (path: (string | number)[]) => void;
  onCopyComponent: (component: ComponentType) => void;
  onCanvasFocus: () => void;
  isCardSelected: boolean;
  onCardSelect: () => void;
  username?: string;
  avatar?: string;
  headerData?: {
    title?: { content: string };
    subtitle?: { content: string };
    style?: string; // 改为字符串类型
  };
  // 新增：标题数据更新回调
  onHeaderDataChange?: (headerData: {
    title?: { content: string };
    subtitle?: { content: string };
    style?: string;
  }) => void;
  layoutMode?: 'vertical' | 'flow';
  // 新增：变量数据
  variables?: VariableItem[];
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  elements,
  verticalSpacing,
  selectedPath,
  hoveredPath,
  onElementsChange,
  onSelectComponent,
  onDeleteComponent,
  onCopyComponent,
  onCanvasFocus,
  isCardSelected,
  onCardSelect,
  username = '用户名',
  avatar,
  headerData,
  onHeaderDataChange,
  layoutMode = 'vertical',
  variables = [],
}) => {
  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        padding: '24px 12px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        width: '100%',
        margin: '0 auto',
        boxSizing: 'border-box',
        justifyContent: 'center',
      }}
    >
      {/* 左侧头像 */}
      <div style={{ flexShrink: 0 }}>
        <Avatar
          size={40}
          src={avatar}
          style={{
            backgroundColor: avatar ? 'transparent' : '#1890ff',
            fontSize: '16px',
          }}
        >
          {!avatar && (username.charAt(0).toUpperCase() || 'U')}
        </Avatar>
      </div>

      {/* 右侧内容区域 */}
      <div
        style={{
          boxSizing: 'border-box',
          width: '680px',
        }}
      >
        {/* 用户名 */}
        <div style={{ marginBottom: '8px' }}>
          <Text strong style={{ fontSize: '14px', color: '#333' }}>
            {username}
          </Text>
        </div>
        {/* 卡片容器 */}
        <div data-card-container="true" onClick={onCardSelect}>
          <CardWrapper
            elements={elements}
            verticalSpacing={verticalSpacing}
            selectedPath={selectedPath}
            hoveredPath={hoveredPath}
            onElementsChange={onElementsChange}
            onSelectComponent={onSelectComponent}
            onDeleteComponent={onDeleteComponent}
            onCopyComponent={onCopyComponent}
            onCanvasFocus={onCanvasFocus}
            isCardSelected={isCardSelected}
            onCardSelect={onCardSelect}
            headerData={headerData} // 只有当header存在时才传递
            onHeaderDataChange={onHeaderDataChange}
            layoutMode={layoutMode}
            variables={variables}
          />
        </div>
        {/* ui发送界面 */}
        <div
          style={{
            width: '100%',
            border: '1px solid #ccc',
            borderRadius: '12px',
            marginTop: '16px',
            padding: '16px',
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#999',
            userSelect: 'none',
          }}
        >
          <span>Send Message</span>
          <SendOutlined style={{ fontSize: '20px' }} />
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
