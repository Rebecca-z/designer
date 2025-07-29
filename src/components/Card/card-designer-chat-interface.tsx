// card-designer-chat-interface.tsx - 会话界面组件

import { Avatar, Typography } from 'antd';
import React from 'react';
import CardWrapper from './card-designer-card-wrapper';
import {
  CardPadding,
  ComponentType,
  VariableItem,
} from './card-designer-types-updated';

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
  // 新增：卡片样式
  cardStyles?: {
    backgroundColor?: string;
    backgroundImage?: string;
    borderWidth?: string;
    borderStyle?: string;
    borderColor?: string;
    borderRadius?: string;
    boxShadow?: string;
    customCSS?: string;
    [key: string]: any;
  };
  // 新增：标题数据
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
  // 新增：布局方式
  layoutMode?: 'vertical' | 'flow';
  // 新增：变量数据
  variables?: VariableItem[];
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
  cardStyles = {},
  headerData,
  onHeaderDataChange,
  layoutMode = 'vertical',
  variables = [],
}) => {
  // 合并卡片样式
  const mergedCardStyles: React.CSSProperties = {
    backgroundColor: cardStyles.backgroundColor || '#fff',
    backgroundImage: cardStyles.backgroundImage || 'none',
    borderWidth: cardStyles.borderWidth || '1px',
    borderStyle: cardStyles.borderStyle || 'solid',
    borderColor: cardStyles.borderColor || '#e8e8e8',
    borderRadius: cardStyles.borderRadius || '13px',
    boxShadow: cardStyles.boxShadow || '0 2px 8px rgba(0,0,0,0.1)',
    ...cardStyles,
  };

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
        // 修复：确保容器能够正确显示内边距
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
          // flex: 1,
          // minWidth: 0,
          // 修复：确保内容区域能够正确显示
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
        <div
          style={mergedCardStyles}
          data-card-container="true"
          onClick={onCardSelect}
        >
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
            headerData={headerData} // 只有当header存在时才传递
            onHeaderDataChange={onHeaderDataChange}
            layoutMode={layoutMode}
            variables={variables}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
