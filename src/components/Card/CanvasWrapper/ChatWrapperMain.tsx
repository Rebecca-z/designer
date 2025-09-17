//  会话界面组件
import {
  EllipsisOutlined,
  LeftOutlined,
  SendOutlined,
  UsergroupAddOutlined,
  WifiOutlined,
} from '@ant-design/icons';
import { Avatar, Typography } from 'antd';
import React from 'react';
import { DEVICE_SIZES } from '../constants';
import CardWrapper from './CanvasCard';
import styles from './index.less';
import { ChatInterfaceProps } from './type';

const { Text } = Typography;

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  device,
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
  //  模拟移动端顶部
  const mobileHeader = (
    <div className={styles.mobileHeader}>
      <div className={styles.mobileItem}>
        <span className={styles.font20}>14:00</span>
        <WifiOutlined className={styles.font20} />
      </div>
      <div className={styles.mobileItem}>
        <LeftOutlined className={styles.font20}></LeftOutlined>
        <div className={styles.GroupName}>
          <span className={styles.font20}>Group</span>
          <span style={{ fontSize: '14px', color: '#ccc' }}>38 Members</span>
        </div>
        <EllipsisOutlined className={styles.font20} />
      </div>
    </div>
  );

  // 模拟pc端顶部
  const desktopHeader = (
    <div className={styles.desktopHeader}>
      <Avatar size={40} icon={<UsergroupAddOutlined />} />
      <span className={styles.font18}>Group</span>
      <UsergroupAddOutlined className={styles.font18} />
      <span className={styles.font12}>38</span>
    </div>
  );

  return (
    <div className={styles.chatWrapperMain}>
      {device.toString() === 'desktop' ? desktopHeader : mobileHeader}
      <div className={styles.chatWrapperBox}>
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
          className={styles.mainRight}
          style={{ width: DEVICE_SIZES[device].width }}
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
          <div className={styles.sendMsg}>
            <span>Send Message</span>
            <SendOutlined style={{ fontSize: '20px' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
