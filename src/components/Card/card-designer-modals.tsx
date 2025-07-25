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
import { Variable } from './card-designer-types';
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
  data: any; // 更新为支持新的卡片数据结构
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
              {(() => {
                // 检查数据格式并获取正确的组件数量
                const isNewFormat =
                  data.dsl && data.dsl.body && data.dsl.body.elements;
                const elements = isNewFormat
                  ? data.dsl.body.elements
                  : data.elements || [];
                const headerData = isNewFormat ? data.dsl.header : null;
                const hasTitle =
                  headerData &&
                  (headerData.title?.content || headerData.subtitle?.content);
                const totalComponents = elements.length + (hasTitle ? 1 : 0);

                console.log('📊 预览工具栏组件统计:', {
                  isNewFormat,
                  elementsCount: elements.length,
                  hasTitle,
                  totalComponents,
                });

                return totalComponents > 0 ? (
                  <Text
                    type="secondary"
                    style={{ fontSize: '11px', color: '#52c41a' }}
                  >
                    • {totalComponents} 个组件{hasTitle ? ' (含标题)' : ''}
                  </Text>
                ) : null;
              })()}
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
            {(() => {
              // 检查数据格式并获取正确的elements
              const isNewFormat =
                data.dsl && data.dsl.body && data.dsl.body.elements;
              const elements = isNewFormat
                ? data.dsl.body.elements
                : data.elements || [];
              const headerData = isNewFormat ? data.dsl.header : null;

              console.log('🔍 预览模式数据检查:', {
                isNewFormat,
                hasHeader: !!headerData,
                headerContent: headerData,
                elementsCount: elements.length,
                elementsData: elements,
                fullData: data,
              });

              // 检查header数据的有效性
              const hasValidTitle =
                headerData?.title?.content &&
                headerData.title.content.trim() !== '';
              const hasValidSubtitle =
                headerData?.subtitle?.content &&
                headerData.subtitle.content.trim() !== '';
              const hasValidHeader = hasValidTitle || hasValidSubtitle;

              console.log('📋 Header数据详细检查:', {
                hasValidTitle,
                hasValidSubtitle,
                hasValidHeader,
                titleContent: headerData?.title?.content,
                subtitleContent: headerData?.subtitle?.content,
                headerStyle: headerData?.style,
              });

              // 创建要渲染的组件列表
              const componentsToRender = [];

              // 1. 如果有有效的header数据，先添加title组件
              if (hasValidHeader) {
                console.log('✅ 预览模式: 添加title组件到渲染列表');
                componentsToRender.push({
                  id: 'preview-title',
                  tag: 'title',
                  title: headerData.title?.content || '主标题',
                  subtitle: headerData.subtitle?.content || '副标题',
                  style: headerData.style || 'blue',
                });
              } else {
                console.log('❌ 预览模式: header数据无效，不添加title组件');
              }

              // 2. 添加body中的所有elements
              componentsToRender.push(...elements);

              console.log('📝 预览模式最终渲染列表:', {
                totalComponents: componentsToRender.length,
                hasTitle: componentsToRender.some(
                  (comp) => comp.tag === 'title',
                ),
                componentTypes: componentsToRender.map((comp) => comp.tag),
                renderingComponents: componentsToRender,
              });

              if (componentsToRender.length > 0) {
                return componentsToRender.map(
                  (component: any, index: number) => {
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
                        <div
                          style={{
                            marginBottom:
                              component.tag === 'title' ? '16px' : '8px',
                          }}
                        >
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
                            headerData={headerData}
                          />
                        </div>
                      </ErrorBoundary>
                    );
                  },
                );
              } else {
                return (
                  <div
                    style={{
                      textAlign: 'center',
                      color: '#999',
                      padding: '40px',
                      fontSize: '14px',
                    }}
                  >
                    🎨 暂无组件，请在编辑区域添加组件后预览
                  </div>
                );
              }
            })()}
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
                <span style={{ color: '#52c41a' }}>
                  {data?.elements?.length}
                </span>
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
