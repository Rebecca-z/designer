import { ImportOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Modal, Space, Upload } from 'antd';
import React from 'react';

// 导入模态框
interface ModalsProps {
  importModalVisible: boolean;
  setImportModalVisible: (visible: boolean) => void;
  onFileUpload: (file: File) => boolean;
}

const ImportModal: React.FC<ModalsProps> = ({
  importModalVisible,
  setImportModalVisible,
  onFileUpload,
}) => {
  return (
    <>
      {/* 导入配置模态框 */}
      <Modal
        title={
          <Space>
            <ImportOutlined />
            导入配置
          </Space>
        }
        open={importModalVisible}
        onCancel={() => setImportModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setImportModalVisible(false)}>
            取消
          </Button>,
        ]}
        centered
        destroyOnHidden
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          {/* 上传区域 */}
          <Upload
            accept=".json"
            showUploadList={false}
            beforeUpload={onFileUpload}
            style={{ width: '100%' }}
            multiple={false}
            maxCount={1}
          >
            <div
              className="upload-area"
              style={{
                border: '2px dashed #d9d9d9',
                borderRadius: '6px',
                padding: '40px 20px',
                cursor: 'pointer',
                transition: 'all 0.3s',
                backgroundColor: '#fafafa',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#1890ff';
                e.currentTarget.style.backgroundColor = '#f0f9ff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#d9d9d9';
                e.currentTarget.style.backgroundColor = '#fafafa';
              }}
            >
              <UploadOutlined
                style={{
                  fontSize: '48px',
                  color: '#1890ff',
                  marginBottom: '16px',
                  display: 'block',
                }}
              />
              <div
                style={{
                  fontSize: '16px',
                  marginBottom: '8px',
                  fontWeight: 'bold',
                }}
              >
                点击或拖拽JSON文件到此处
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                支持标准的卡片配置JSON文件
              </div>
            </div>
          </Upload>
        </div>
      </Modal>
    </>
  );
};

export default ImportModal;
