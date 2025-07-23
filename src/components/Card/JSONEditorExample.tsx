import { Button, Card, message, Space } from 'antd';
import React, { useState } from 'react';
import JSONEditor from './JSONEditor';

const JSONEditorExample: React.FC = () => {
  const [jsonData, setJsonData] = useState<string>(`{
  "user": {
    "name": "张三",
    "age": 25,
    "isActive": true,
    "email": "zhangsan@example.com",
    "profile": {
      "avatar": "https://example.com/avatar.jpg",
      "bio": "这是一个用户简介",
      "tags": ["开发者", "设计师", "产品经理"]
    },
    "settings": {
      "theme": "dark",
      "notifications": true,
      "language": "zh-CN"
    }
  },
  "products": [
    {
      "id": 1,
      "name": "产品A",
      "price": 99.99,
      "category": "电子产品",
      "inStock": true
    },
    {
      "id": 2,
      "name": "产品B",
      "price": 199.99,
      "category": "服装",
      "inStock": false
    }
  ],
  "metadata": {
    "version": "1.0.0",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-15T12:30:00Z"
  }
}`);

  const handleJSONChange = (newJSON: string) => {
    setJsonData(newJSON);
    console.log('JSON数据已更新:', newJSON);
  };

  const handleSave = (json: string) => {
    message.success('JSON数据已保存！');
    console.log('保存的JSON数据:', json);
  };

  return (
    <div
      style={{
        padding: '20px',
        backgroundColor: '#f5f5f5',
        minHeight: '100vh',
      }}
    >
      <Card title="JSONEditor 组件示例" style={{ marginBottom: '20px' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <h3>功能特性</h3>
            <ul>
              <li>✅ 正确显示JSON数据的key和value</li>
              <li>✅ 支持对象和数组的折叠/展开</li>
              <li>✅ 在展示时允许直接编辑</li>
              <li>✅ 不同类型数据使用不同颜色显示</li>
              <li>✅ 支持行号显示</li>
              <li>✅ 支持复制JSON数据</li>
              <li>✅ 支持展开/折叠所有节点</li>
              <li>✅ 实时编辑和保存功能</li>
            </ul>
          </div>

          <div>
            <h3>使用说明</h3>
            <ol>
              <li>
                <strong>查看数据</strong>
                ：JSON数据以树形结构显示，清晰展示key和value
              </li>
              <li>
                <strong>折叠功能</strong>
                ：点击对象或数组前的箭头图标可以折叠/展开
              </li>
              <li>
                <strong>编辑数据</strong>：直接点击字符串、数字、布尔值进行编辑
              </li>
              <li>
                <strong>保存更改</strong>
                ：点击&ldquo;保存&rdquo;按钮或使用Ctrl+S快捷键
              </li>
              <li>
                <strong>复制数据</strong>：点击复制按钮将JSON数据复制到剪贴板
              </li>
              <li>
                <strong>展开所有</strong>：点击展开按钮可以展开所有折叠的节点
              </li>
            </ol>
          </div>
        </Space>
      </Card>

      <Card title="JSON数据编辑器" style={{ marginBottom: '20px' }}>
        <JSONEditor
          json={jsonData}
          title="用户数据"
          showLineNumbers={true}
          showCopyButton={true}
          showExpandButton={true}
          height={600}
          editable={true}
          onJSONChange={handleJSONChange}
          onSave={handleSave}
          style={{
            border: '1px solid #d9d9d9',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        />
      </Card>

      <Card title="只读模式示例">
        <JSONEditor
          json={`{
  "readonly": {
    "message": "这是一个只读的JSON数据",
    "timestamp": "2024-01-15T12:30:00Z",
    "version": "1.0.0"
  }
}`}
          title="只读数据"
          showLineNumbers={true}
          showCopyButton={true}
          showExpandButton={true}
          height={300}
          editable={false}
          readOnly={true}
          style={{
            border: '1px solid #d9d9d9',
            borderRadius: '8px',
            backgroundColor: '#fafafa',
          }}
        />
      </Card>

      <Card title="操作按钮" style={{ marginTop: '20px' }}>
        <Space>
          <Button
            type="primary"
            onClick={() => {
              const newData = `{
  "newData": {
    "message": "这是新添加的数据",
    "timestamp": "${new Date().toISOString()}",
    "random": ${Math.floor(Math.random() * 1000)}
  }
}`;
              setJsonData(newData);
              message.success('已加载新的JSON数据');
            }}
          >
            加载新数据
          </Button>

          <Button
            onClick={() => {
              console.log('当前JSON数据:', jsonData);
              message.info('当前数据已输出到控制台');
            }}
          >
            查看当前数据
          </Button>

          <Button
            onClick={() => {
              try {
                const parsed = JSON.parse(jsonData);
                message.success('JSON格式正确！');
                console.log('解析后的数据:', parsed);
              } catch (error) {
                message.error('JSON格式错误！');
              }
            }}
          >
            验证JSON格式
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default JSONEditorExample;
