import { Button, Card, Modal, Space, Typography } from 'antd';
import React, { useState } from 'react';
import RichTextEditor from './RichTextEditor';

const { Title } = Typography;

const RichTextEditorExample: React.FC = () => {
  const [content, setContent] = useState('<p>欢迎使用富文本编辑器！</p>');
  const [previewVisible, setPreviewVisible] = useState(false);

  const handleContentChange = (html: string) => {
    setContent(html);
    console.log('Content changed:', html);
  };

  const handleClear = () => {
    setContent('');
  };

  const handlePreview = () => {
    setPreviewVisible(true);
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>富文本编辑器示例</Title>

      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Card title="基础编辑器" size="small">
          <Space style={{ marginBottom: '16px' }}>
            <Button onClick={handleClear}>清空内容</Button>
            <Button type="primary" onClick={handlePreview}>
              预览内容
            </Button>
          </Space>

          <RichTextEditor
            value={content}
            onChange={handleContentChange}
            placeholder="开始编写您的内容..."
            height={400}
          />
        </Card>

        <Card title="简化版编辑器（无工具栏）" size="small">
          <RichTextEditor
            value="<p>这是一个简化版的富文本编辑器，没有工具栏。</p>"
            showToolbar={false}
            height={200}
            placeholder="简化版编辑器..."
          />
        </Card>

        <Card title="禁用状态" size="small">
          <RichTextEditor
            value="<p>这是一个<strong>禁用</strong>状态的编辑器，不可编辑。</p>"
            disabled={true}
            height={150}
          />
        </Card>

        <Card title="自定义样式" size="small">
          <RichTextEditor
            value="<p>这是一个自定义样式的编辑器。</p>"
            height={250}
            style={{ border: '2px solid #1890ff', borderRadius: '8px' }}
            placeholder="自定义样式编辑器..."
          />
        </Card>

        <Card title="当前内容 HTML">
          <pre
            style={{
              backgroundColor: '#f5f5f5',
              padding: '12px',
              borderRadius: '4px',
              maxHeight: '200px',
              overflow: 'auto',
            }}
          >
            {content}
          </pre>
        </Card>
      </Space>

      {/* 预览模态框 */}
      <Modal
        title="内容预览"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            关闭
          </Button>,
        ]}
        width={800}
      >
        <div
          style={{
            minHeight: '300px',
            padding: '16px',
            border: '1px solid #f0f0f0',
            borderRadius: '4px',
            backgroundColor: '#fff',
          }}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </Modal>
    </div>
  );
};

export default RichTextEditorExample;
