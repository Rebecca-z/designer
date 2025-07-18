// card-designer-modals.tsx - 完整的模态框组件

import {
  CodeOutlined,
  EyeOutlined,
  ImportOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { Button, Modal, Space, Typography, Upload, message } from 'antd';
import React from 'react';
import ComponentRenderer from './card-designer-components';
import { DEVICE_SIZES } from './card-designer-constants';
import { DesignData, Variable } from './card-designer-types';
import { generatePreviewHTML } from './card-designer-utils';
import ErrorBoundary from './ErrorBoundary';

const { Text } = Typography;

interface ModalsProps {
  // 导出模态框
  exportModalVisible: boolean;
  setExportModalVisible: (visible: boolean) => void;
  exportData: string;
  onDownloadConfig: () => void;

  // 导入模态框
  importModalVisible: boolean;
  setImportModalVisible: (visible: boolean) => void;
  onFileUpload: (file: File) => boolean;

  // 预览模态框
  previewVisible: boolean;
  setPreviewVisible: (visible: boolean) => void;
  data: DesignData;
  device: keyof typeof DEVICE_SIZES;
  variables: Variable[];
  historyLength: number;
  canvasFocused: boolean;
  onClearCanvas: () => void;
  onImportConfig: () => void;
}

const Modals: React.FC<ModalsProps> = ({
  exportModalVisible,
  setExportModalVisible,
  exportData,
  onDownloadConfig,
  importModalVisible,
  setImportModalVisible,
  onFileUpload,
  previewVisible,
  setPreviewVisible,
  data,
  device,
  variables,
  historyLength,
  canvasFocused,
  onClearCanvas,
  onImportConfig,
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

  // 导出HTML预览
  const exportHTMLPreview = () => {
    try {
      const html = generatePreviewHTML(data);
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `card-preview-${
        new Date().toISOString().split('T')[0]
      }.html`;
      a.click();
      URL.revokeObjectURL(url);
      message.success('预览HTML已导出');
    } catch (error) {
      message.error('导出HTML失败');
      console.error('Export HTML error:', error);
    }
  };

  return (
    <>
      {/* 导出配置模态框 */}
      <Modal
        title={
          <Space>
            <CodeOutlined />
            导出配置
            <Text type="secondary">(目标数据结构)</Text>
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
        <div style={{ marginBottom: '16px' }}>
          {/* 数据结构说明 */}
          <div
            style={{
              padding: '12px',
              backgroundColor: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '6px',
              marginBottom: '16px',
            }}
          >
            <h4 style={{ margin: '0 0 8px 0', color: '#0369a1' }}>
              数据结构说明
            </h4>
            <div style={{ fontSize: '12px', color: '#0c4a6e' }}>
              <p style={{ margin: '4px 0' }}>
                • direction: vertical - 垂直布局（固定值，不可修改）
              </p>
              <p style={{ margin: '4px 0' }}>
                • vertical_spacing: 5 - 组件间垂直间距
              </p>
              <p style={{ margin: '4px 0' }}>
                • elements: [] - 主要组件列表，只能包含表单容器和分栏组件
              </p>
              <p style={{ margin: '4px 0' }}>
                • 表单容器支持嵌套：输入框、按钮、选择器等交互组件
              </p>
              <p style={{ margin: '4px 0' }}>
                • 分栏组件支持嵌套：文本、图片、分割线等展示组件
              </p>
            </div>
          </div>

          {/* 提示信息 */}
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: '#fef3c7',
              border: '1px solid #fcd34d',
              borderRadius: '4px',
              marginBottom: '12px',
            }}
          >
            <Text style={{ fontSize: '12px', color: '#92400e' }}>
              💡
              提示：此数据结构已移除内部字段（如id等），只保留目标API所需的字段
            </Text>
          </div>

          {/* 统计信息 */}
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '4px',
              marginBottom: '12px',
            }}
          >
            <div
              style={{
                fontSize: '12px',
                color: '#166534',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>📊 配置统计：</span>
              <span>
                组件数量: {data.elements.length} | 变量数量: {variables.length}{' '}
                | 历史记录: {historyLength}
              </span>
            </div>
          </div>
        </div>

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

        {/* 底部提示 */}
        <div
          style={{
            marginTop: '12px',
            padding: '8px 12px',
            backgroundColor: '#f3f4f6',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            fontSize: '11px',
            color: '#374151',
          }}
        >
          <strong>使用说明：</strong>{' '}
          复制JSON配置后，可以在其他项目中导入使用，或直接调用API接口
        </div>
      </Modal>

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
              <div
                style={{ fontSize: '11px', color: '#999', marginTop: '8px' }}
              >
                文件大小限制: 10MB，格式: .json
              </div>
            </div>
          </Upload>

          {/* 支持的文件格式说明 */}
          <div
            style={{
              marginTop: '20px',
              padding: '12px',
              backgroundColor: '#f6ffed',
              border: '1px solid #b7eb8f',
              borderRadius: '4px',
              textAlign: 'left',
            }}
          >
            <h4 style={{ margin: '0 0 8px 0', color: '#389e0d' }}>
              📁 支持的文件格式
            </h4>
            <div style={{ fontSize: '12px', color: '#52c41a' }}>
              <p style={{ margin: '4px 0' }}>• 标准JSON配置文件（.json）</p>
              <p style={{ margin: '4px 0' }}>
                • 包含direction、vertical_spacing、elements字段
              </p>
              <p style={{ margin: '4px 0' }}>
                • 支持表单容器和分栏组件的嵌套结构
              </p>
              <p style={{ margin: '4px 0' }}>
                • 自动验证数据格式并转换为内部结构
              </p>
            </div>
          </div>

          {/* 示例配置说明 */}
          <div
            style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: '#e6f7ff',
              border: '1px solid #91d5ff',
              borderRadius: '4px',
              textAlign: 'left',
            }}
          >
            <h4 style={{ margin: '0 0 8px 0', color: '#0958d9' }}>
              📝 配置文件示例结构
            </h4>
            <pre
              style={{
                fontSize: '11px',
                color: '#1d4ed8',
                margin: '8px 0 0 0',
                backgroundColor: '#f8fafc',
                padding: '8px',
                borderRadius: '4px',
                overflow: 'auto',
                maxHeight: '120px',
              }}
            >
              {`{
  "direction": "vertical",
  "vertical_spacing": 5,
  "elements": [
    {
      "tag": "form",
      "name": "示例表单",
      "elements": [...]
    }
  ]
}`}
            </pre>
          </div>
        </div>
      </Modal>

      {/* 预览模态框 */}
      <Modal
        title={
          <Space>
            <EyeOutlined />
            预览效果
            <Text type="secondary">({DEVICE_SIZES[device].name})</Text>
          </Space>
        }
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        width={
          device === 'desktop' ? '90%' : device === 'tablet' ? '800px' : '420px'
        }
        footer={[
          <Button key="export" onClick={exportHTMLPreview}>
            导出HTML
          </Button>,
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            关闭
          </Button>,
        ]}
        centered
        destroyOnHidden
        style={{ top: 20 }}
      >
        <div
          style={{
            padding: '20px',
            backgroundColor: '#f5f5f5',
            minHeight: '500px',
            maxHeight: '70vh',
            overflow: 'auto',
            borderRadius: '8px',
          }}
        >
          {/* 预览工具栏 */}
          <div
            style={{
              marginBottom: '16px',
              padding: '8px 12px',
              backgroundColor: '#fff',
              borderRadius: '6px',
              border: '1px solid #e8e8e8',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <Space>
              <Text strong style={{ fontSize: '12px' }}>
                📱 预览模式
              </Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {DEVICE_SIZES[device].name} ({DEVICE_SIZES[device].width})
              </Text>
              {data.elements.length > 0 && (
                <Text
                  type="secondary"
                  style={{ fontSize: '11px', color: '#52c41a' }}
                >
                  • {data.elements.length} 个组件
                </Text>
              )}
            </Space>
            <Space>
              <Button size="small" onClick={onClearCanvas} danger>
                清空画布
              </Button>
              <Button size="small" onClick={onImportConfig}>
                导入配置
              </Button>
            </Space>
          </div>

          {/* 预览内容 */}
          <div
            style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              width: device === 'desktop' ? '100%' : DEVICE_SIZES[device].width,
              margin: '0 auto',
              minHeight: '400px',
              border: '1px solid #e8e8e8',
            }}
          >
            {data.elements.length > 0 ? (
              data.elements.map((component, index) => {
                if (!component) {
                  return (
                    <ErrorBoundary key={`preview-error-${index}`}>
                      <div
                        style={{
                          padding: '16px',
                          border: '1px dashed #faad14',
                          borderRadius: '4px',
                          textAlign: 'center',
                          color: '#faad14',
                          backgroundColor: '#fffbe6',
                          margin: '4px',
                        }}
                      >
                        ⚠️ 预览组件数据异常 (索引: {index})
                      </div>
                    </ErrorBoundary>
                  );
                }

                return (
                  <ErrorBoundary key={`preview-${component.id}-${index}`}>
                    <div style={{ marginBottom: '8px' }}>
                      <ComponentRenderer
                        component={component}
                        onSelect={() => {}}
                        isSelected={false}
                        selectedComponent={null}
                        selectedPath={null}
                        onUpdate={() => {}}
                        onDelete={() => {}}
                        onCopy={() => {}}
                        path={['elements', index]}
                        isPreview={true}
                        hoveredPath={null}
                        isHovered={false}
                      />
                    </div>
                  </ErrorBoundary>
                );
              })
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  color: '#999',
                  padding: '60px 0',
                  border: '2px dashed #d9d9d9',
                  borderRadius: '8px',
                  backgroundColor: '#fafafa',
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
                <Text
                  type="secondary"
                  style={{
                    fontSize: '16px',
                    display: 'block',
                    marginBottom: '8px',
                  }}
                >
                  暂无内容
                </Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  请在设计器中添加组件
                </Text>
              </div>
            )}
          </div>

          {/* 配置信息面板 */}
          <div
            style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: '#fff',
              borderRadius: '6px',
              border: '1px solid #e8e8e8',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <Text strong style={{ fontSize: '12px', color: '#333' }}>
              📊 配置信息
            </Text>
            <div
              style={{
                marginTop: '8px',
                fontSize: '12px',
                color: '#666',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '8px',
              }}
            >
              <div>
                <strong>组件数量:</strong>{' '}
                <span style={{ color: '#52c41a' }}>{data.elements.length}</span>
              </div>
              <div>
                <strong>变量数量:</strong>{' '}
                <span style={{ color: '#1890ff' }}>{variables.length}</span>
              </div>
              <div>
                <strong>历史记录:</strong>{' '}
                <span style={{ color: '#722ed1' }}>{historyLength} 条</span>
              </div>
              <div>
                <strong>当前设备:</strong>{' '}
                <span style={{ color: '#fa8c16' }}>
                  {DEVICE_SIZES[device].name}
                </span>
              </div>
              <div>
                <strong>画布焦点:</strong>{' '}
                <span style={{ color: canvasFocused ? '#52c41a' : '#999' }}>
                  {canvasFocused ? '已聚焦' : '未聚焦'}
                </span>
              </div>
              <div>
                <strong>数据大小:</strong>{' '}
                <span style={{ color: '#13c2c2' }}>
                  {(JSON.stringify(data).length / 1024).toFixed(2)} KB
                </span>
              </div>
            </div>

            {/* 操作提示 */}
            <div
              style={{
                marginTop: '12px',
                padding: '8px',
                backgroundColor: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '4px',
                fontSize: '11px',
                color: '#0369a1',
              }}
            >
              <strong>💡 提示：</strong>
              预览模式下组件不可交互，可导出为HTML文件在浏览器中独立查看
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Modals;
