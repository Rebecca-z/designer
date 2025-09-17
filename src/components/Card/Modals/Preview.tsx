import { EyeOutlined } from '@ant-design/icons';
import { Button, Modal, Space, Typography } from 'antd';
import React from 'react';
import ComponentRenderer from '../CanvasWrapper/Component';
import ErrorBoundary from '../CanvasWrapper/ErrorBoundary';
import { DEVICE_SIZES, Variable } from '../constants';
const { Text } = Typography;

// 预览模态框
interface ModalsProps {
  previewVisible: boolean;
  setPreviewVisible: (visible: boolean) => void;
  data: any;
  device: keyof typeof DEVICE_SIZES;
  variables: Variable[];
  onClearCanvas: () => void;
  onImportConfig: () => void;
}
const PreviewModal: React.FC<ModalsProps> = ({
  previewVisible,
  setPreviewVisible,
  data,
  device,
  variables,
  onClearCanvas,
  onImportConfig,
}) => {
  return (
    <>
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
        width={device === 'desktop' ? '90%' : '500px'}
        footer={[
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
            padding: '12px',
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
                const elements = data.dsl.body.elements || [];
                const headerData = data.dsl.header || null;
                const hasTitle =
                  headerData &&
                  (headerData.title?.content || headerData.subtitle?.content);
                const totalComponents = elements.length + (hasTitle ? 1 : 0);

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
              padding: '12px',
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
              const elements = data.dsl.body.elements || [];
              const headerData = data.dsl.header || null;
              const verticalSpacing = data.dsl.body.vertical_spacing || 8;

              // 检查header数据的有效性
              const hasValidTitle =
                headerData?.title?.content &&
                headerData.title.content.trim() !== '';
              const hasValidSubtitle =
                headerData?.subtitle?.content &&
                headerData.subtitle.content.trim() !== '';
              const hasValidHeader = hasValidTitle || hasValidSubtitle;

              // 创建要渲染的组件列表
              const componentsToRender = [];

              // 1. 如果有有效的header数据，先添加title组件
              if (hasValidHeader) {
                componentsToRender.push({
                  id: 'preview-title',
                  tag: 'title',
                  title: headerData.title?.content || '主标题',
                  subtitle: headerData.subtitle?.content || '副标题',
                  style: headerData.style || 'blue',
                });
              }

              // 2. 添加body中的所有elements
              componentsToRender.push(...elements);

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
                              component.tag === 'title'
                                ? '16px'
                                : `${verticalSpacing}px`,
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
                            verticalSpacing={verticalSpacing}
                            variables={variables}
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
        </div>
      </Modal>
    </>
  );
};

export default PreviewModal;
