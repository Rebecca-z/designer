// card-designer-chat-interface.tsx - 会话界面组件

import { Avatar, Typography } from 'antd';
import React from 'react';
import CardWrapper from './card-designer-card-wrapper';
import { CardPadding, ComponentType } from './card-designer-types-updated';

const { Text } = Typography;

interface ChatInterfaceProps {
  elements: ComponentType[];
  verticalSpacing: number;
  padding: CardPadding;
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
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  elements,
  verticalSpacing,
  padding,
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
}) => {
  return (
    <div
      style={{
        display: 'flex',
        gap: '12px',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        width: '100%',
        margin: '0 auto',
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
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* 用户名 */}
        <div style={{ marginBottom: '8px' }}>
          <Text strong style={{ fontSize: '14px', color: '#333' }}>
            {username}
          </Text>
        </div>

        {/* 卡片容器 */}
        <CardWrapper
          elements={elements}
          verticalSpacing={verticalSpacing}
          padding={padding}
          selectedPath={selectedPath}
          hoveredPath={hoveredPath}
          onElementsChange={onElementsChange}
          onSelectComponent={onSelectComponent}
          onDeleteComponent={onDeleteComponent}
          onCopyComponent={onCopyComponent}
          onCanvasFocus={onCanvasFocus}
          isCardSelected={isCardSelected}
          onCardSelect={onCardSelect}
        />
      </div>
    </div>
  );
};

export default ChatInterface;
