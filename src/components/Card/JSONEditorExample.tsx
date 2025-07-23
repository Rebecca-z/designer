import { Card, message, Space, Typography } from 'antd';
import React, { useState } from 'react';
import JSONEditor from './JSONEditor';

const { Title, Paragraph, Text } = Typography;

const JSONEditorExample: React.FC = () => {
  // 示例JSON数据
  const [userData, setUserData] = useState({
    user: {
      id: 1,
      name: '张三',
      email: 'zhangsan@example.com',
      profile: {
        age: 28,
        location: '北京',
        interests: ['编程', '阅读', '旅行'],
        settings: {
          theme: 'light',
          notifications: true,
          language: 'zh-CN',
        },
      },
      posts: [
        {
          id: 1,
          title: '第一篇博客',
          content: '这是我的第一篇博客内容...',
          tags: ['技术', '编程'],
          comments: [
            { id: 1, author: '李四', content: '写得很好！' },
            { id: 2, author: '王五', content: '学习了！' },
          ],
        },
        {
          id: 2,
          title: '第二篇博客',
          content: '这是我的第二篇博客内容...',
          tags: ['生活', '感悟'],
          comments: [],
        },
      ],
    },
    metadata: {
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T12:30:00Z',
      version: '1.0.0',
    },
  });

  const [apiResponse, setApiResponse] = useState({
    success: true,
    data: {
      users: [
        { id: 1, name: '用户1', role: 'admin' },
        { id: 2, name: '用户2', role: 'user' },
        { id: 3, name: '用户3', role: 'user' },
      ],
      pagination: {
        page: 1,
        pageSize: 10,
        total: 100,
        totalPages: 10,
      },
    },
    message: '获取用户列表成功',
    timestamp: '2024-01-15T12:30:00Z',
  });

  const [configData, setConfigData] = useState({
    app: {
      name: '我的应用',
      version: '2.1.0',
      environment: 'production',
      features: {
        darkMode: true,
        notifications: true,
        analytics: false,
      },
    },
    database: {
      host: 'localhost',
      port: 5432,
      name: 'myapp',
      credentials: {
        username: 'admin',
        password: '******',
      },
    },
    api: {
      baseUrl: 'https://api.example.com',
      timeout: 5000,
      retries: 3,
      endpoints: {
        users: '/users',
        posts: '/posts',
        comments: '/comments',
      },
    },
  });

  // 处理JSON保存
  const handleSave = (jsonString: string, type: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      switch (type) {
        case 'userData':
          setUserData(parsed);
          break;
        case 'apiResponse':
          setApiResponse(parsed);
          break;
        case 'configData':
          setConfigData(parsed);
          break;
      }
      message.success(`${type} 数据已保存`);
    } catch (error) {
      message.error('JSON格式错误，保存失败');
    }
  };

  // 处理JSON变化
  const handleJSONChange = (newJSON: string, type: string) => {
    console.log(`${type} JSON已更新:`, newJSON);
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>JSON编辑器组件示例</Title>
      <Paragraph>
        这是一个支持直接编辑的JSON编辑器组件，用户可以在查看时直接编辑数据，无需切换编辑模式。
      </Paragraph>

      <Card style={{ marginBottom: '24px' }}>
        <Title level={4}>功能特性</Title>
        <ul>
          <li>
            ✅ <Text strong>直接编辑</Text>：在查看模式下直接编辑数据
          </li>
          <li>
            ✅ <Text strong>结构折叠</Text>：支持对象和数组的智能折叠
          </li>
          <li>
            ✅ <Text strong>实时更新</Text>：编辑时实时更新JSON结构
          </li>
          <li>
            ✅ <Text strong>简洁显示</Text>：移除类型标签，只展示数据结构
          </li>
          <li>
            ✅ <Text strong>键盘快捷键</Text>：Ctrl+S 保存
          </li>
          <li>
            ✅ <Text strong>状态指示</Text>：显示编辑状态和修改状态
          </li>
          <li>
            ✅ <Text strong>明亮主题</Text>：采用明亮模式设计风格
          </li>
        </ul>
      </Card>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 用户数据示例 */}
        <div>
          <Title level={3}>用户数据结构示例</Title>
          <Paragraph>
            直接点击任何值进行编辑，支持字符串、数字、布尔值的直接编辑。
          </Paragraph>
          <JSONEditor
            json={userData}
            title="用户数据"
            height={500}
            editable={true}
            onSave={(json) => handleSave(json, 'userData')}
            onJSONChange={(json) => handleJSONChange(json, 'userData')}
          />
        </div>

        {/* API响应示例 */}
        <div>
          <Title level={3}>API响应数据示例</Title>
          <Paragraph>
            支持嵌套对象的编辑，修改后点击保存按钮或使用Ctrl+S保存。
          </Paragraph>
          <JSONEditor
            json={apiResponse}
            title="API响应"
            height={400}
            editable={true}
            onSave={(json) => handleSave(json, 'apiResponse')}
            onJSONChange={(json) => handleJSONChange(json, 'apiResponse')}
          />
        </div>

        {/* 配置文件示例 */}
        <div>
          <Title level={3}>应用配置示例</Title>
          <Paragraph>展示应用配置结构，支持各种数据类型的直接编辑。</Paragraph>
          <JSONEditor
            json={configData}
            title="应用配置"
            height={450}
            editable={true}
            onSave={(json) => handleSave(json, 'configData')}
            onJSONChange={(json) => handleJSONChange(json, 'configData')}
          />
        </div>

        {/* 只读模式示例 */}
        <div>
          <Title level={3}>只读模式示例</Title>
          <Paragraph>
            设置 <Text code>editable={false}</Text> 或{' '}
            <Text code>readOnly={true}</Text> 来禁用编辑功能。
          </Paragraph>
          <JSONEditor
            json={{
              status: 'success',
              message: '操作成功',
              data: {
                items: [1, 2, 3, 4, 5],
                count: 5,
              },
            }}
            title="只读数据"
            height={300}
            editable={false}
            readOnly={true}
          />
        </div>

        {/* 自定义配置示例 */}
        <div>
          <Title level={3}>自定义配置示例</Title>
          <Paragraph>隐藏部分功能按钮，自定义样式。</Paragraph>
          <JSONEditor
            json={{
              simple: {
                text: '简单的JSON结构',
                number: 42,
                boolean: true,
                nullValue: null,
                array: ['a', 'b', 'c'],
                object: { key: 'value' },
              },
            }}
            title="自定义配置"
            height={300}
            showLineNumbers={false}
            showCopyButton={false}
            showExpandButton={true}
            editable={true}
            style={{ border: '2px solid #0d6efd' }}
            onSave={() => message.success('简单数据已保存')}
          />
        </div>

        {/* 使用说明 */}
        <Card>
          <Title level={4}>使用说明</Title>
          <div style={{ marginBottom: '16px' }}>
            <Text strong>直接编辑操作：</Text>
            <ul>
              <li>直接点击任何值进行编辑</li>
              <li>字符串：直接输入文本</li>
              <li>数字：输入数字值</li>
              <li>布尔值：选择 true 或 false</li>
              <li>对象和数组：点击箭头展开/折叠</li>
            </ul>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <Text strong>保存操作：</Text>
            <ul>
              <li>点击右上角的保存按钮</li>
              <li>
                使用快捷键 <Text code>Ctrl+S</Text>
              </li>
              <li>
                编辑时会显示 <Text code>[编辑中]</Text> 和{' '}
                <Text code>(已修改)</Text> 标识
              </li>
            </ul>
          </div>
          <div>
            <Text strong>折叠操作：</Text>
            <ul>
              <li>点击对象或数组前的箭头图标进行折叠/展开</li>
              <li>点击右上角的展开/折叠按钮控制全部节点</li>
              <li>折叠后显示节点数量信息</li>
            </ul>
          </div>
        </Card>
      </Space>
    </div>
  );
};

export default JSONEditorExample;
