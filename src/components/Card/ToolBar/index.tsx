// 工具栏
import {
  CodeOutlined,
  CopyOutlined,
  EyeOutlined,
  ImportOutlined,
  LeftOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import {
  Button,
  Dropdown,
  message,
  Modal,
  Space,
  Tooltip,
  Typography,
} from 'antd';
import React from 'react';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

interface ToolbarProps {
  // 卡片ID
  cardId: string;

  // 文件操作
  onSave: () => void;
  onImport: () => void;
  onExport: () => void;
  onPreview: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  cardId,
  onImport,
  onExport,
  onPreview,
}) => {
  const navigate = useNavigate();

  // 复制卡片ID
  const copyCardId = async () => {
    try {
      await navigator.clipboard.writeText(cardId);
      message.success('卡片ID已复制到剪贴板');
    } catch (error) {
      // 降级方案
      const textArea = document.createElement('textarea');
      textArea.value = cardId;
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
    // onSave();
    message.success('保存成功');
  };

  const handlePublish = () => {
    // 发布逻辑
    Modal.confirm({
      title: '确认发布吗?',
      onOk: () => {
        message.success('发布成功');
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
    <div
      style={{
        height: '60px',
        backgroundColor: '#fff',
        borderBottom: '1px solid #d9d9d9',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        justifyContent: 'space-between',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <Space>
        <LeftOutlined style={{ cursor: 'pointer' }} onClick={handleBack} />
        {/* 卡片ID显示 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 8px',
            backgroundColor: '#f0f9ff',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
          onClick={copyCardId}
        >
          <Text type="secondary" style={{ fontSize: '12px' }}>
            ID:
          </Text>
          <Tooltip title="点击复制卡片ID">
            <>
              {cardId}
              <CopyOutlined style={{ fontSize: '12px', color: '#1890ff' }} />
            </>
          </Tooltip>
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
