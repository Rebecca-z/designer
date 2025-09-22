import {
  CodeOutlined,
  EyeOutlined,
  ImportOutlined,
  LeftOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import { App, Button, Dropdown, Space, Tooltip, message } from 'antd';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CardDesignData } from '../type';
import styles from './index.less';

interface ToolbarProps {
  // 卡片信息
  cardData: CardDesignData;
  // 导入
  onImport: () => void;
  // 导出
  onExport: () => void;
  // 预览
  onPreview: () => void;
  // 保存
  onSave: () => void;
  // 发布
  onPublish: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  cardData,
  onImport,
  onExport,
  onPreview,
  onSave,
  onPublish,
}) => {
  const navigate = useNavigate();
  const { modal } = App.useApp();

  // 复制卡片ID
  const copyCardId = async () => {
    try {
      await navigator.clipboard.writeText(cardData.id);
      message.success('卡片ID已复制到剪贴板');
    } catch (error) {
      // 降级方案
      const textArea = document.createElement('textarea');
      textArea.value = cardData.id;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        message.success('卡片ID已复制到剪贴板');
      } catch (fallbackError) {
        message.error('复制失败，请手动复制');
      }
      document.body.removeChild(textArea);
    }
  };

  const handleSave = () => {
    onSave();
  };

  const handlePublish = () => {
    modal.confirm({
      title: '确定要发布吗',
      onOk: () => {
        onPublish();
      },
    });
  };

  const handleBack = () => {
    navigate(`/application/card`);
  };

  const contextMenu = {
    items: [
      {
        key: 'import',
        label: '导入配置',
        icon: <ImportOutlined />,
        onClick: onImport,
      },
      {
        key: 'preview',
        label: '在线预览',
        icon: <EyeOutlined />,
        onClick: onPreview,
      },
      {
        key: 'export',
        label: '导出配置',
        icon: <CodeOutlined />,
        onClick: onExport,
      },
    ],
  };

  return (
    <div className={styles.cardTools}>
      <Space>
        <LeftOutlined style={{ cursor: 'pointer' }} onClick={handleBack} />
        {/* 卡片ID显示 */}
        <div className={styles.cardToolsInfo}>
          <div>{cardData.name}</div>
          <div className={styles.cardToolsId}>
            <Tooltip title="点击复制卡片ID">
              <span style={{ cursor: 'pointer' }} onClick={copyCardId}>
                ID: {cardData.id}
              </span>
            </Tooltip>
            <span style={{ padding: '0 4px' }}>|</span>
            {/* <span>
              最新修改:
              {TimeDisplay(cardInfo?.update_time || cardInfo?.create_time)}
            </span> */}
          </div>
        </div>
      </Space>

      {/* 更多操作 */}
      <Space>
        <Dropdown
          menu={contextMenu}
          trigger={['click']}
          placement="bottomRight"
        >
          <div
            style={{
              borderRadius: '5px',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              backgroundColor: '#fff',
              border: '1px solid #d9d9d9',
              transition: 'background-color 0.3s',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <MoreOutlined />
          </div>
        </Dropdown>
        <Button onClick={handleSave}>保存</Button>
        <Button type="primary" onClick={handlePublish}>
          发布
        </Button>
      </Space>
    </div>
  );
};

export default Toolbar;
