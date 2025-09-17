import { CodeOutlined } from '@ant-design/icons';
import { Button, Modal, Space, message } from 'antd';
import React from 'react';

// 导出模态框
interface ModalsProps {
  exportModalVisible: boolean;
  setExportModalVisible: (visible: boolean) => void;
  exportData: string;
  onDownloadConfig: () => void;
}

const ExportModal: React.FC<ModalsProps> = ({
  exportData,
  exportModalVisible,
  setExportModalVisible,
  onDownloadConfig,
}) => {
  // 复制到剪贴板
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(exportData);
      message.success('配置已复制到剪贴板');
    } catch (error) {
      // 降级方案
      const textArea = document.createElement('textarea');
      textArea.value = exportData;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        message.success('配置已复制到剪贴板');
      } catch (fallbackError) {
        message.error('复制失败，请手动复制');
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <>
      <Modal
        title={
          <Space>
            <CodeOutlined />
            导出配置
          </Space>
        }
        open={exportModalVisible}
        onCancel={() => setExportModalVisible(false)}
        width="80%"
        footer={[
          <Button key="copy" onClick={copyToClipboard}>
            复制到剪贴板
          </Button>,
          <Button key="download" type="primary" onClick={onDownloadConfig}>
            下载JSON文件
          </Button>,
          <Button key="close" onClick={() => setExportModalVisible(false)}>
            关闭
          </Button>,
        ]}
        centered
        destroyOnHidden
      >
        {/* JSON 配置内容 */}
        <pre
          style={{
            backgroundColor: '#f5f5f5',
            padding: '16px',
            borderRadius: '6px',
            maxHeight: '60vh',
            overflow: 'auto',
            fontSize: '12px',
            lineHeight: '1.4',
            fontFamily: 'Monaco, Consolas, "Courier New", monospace',
            border: '1px solid #e5e7eb',
            position: 'relative',
          }}
        >
          {exportData}
        </pre>
      </Modal>
    </>
  );
};

export default ExportModal;
