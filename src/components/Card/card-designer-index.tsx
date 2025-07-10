// index.tsx - 入口文件

import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import React from 'react';
import CardDesigner from './card-designer-main';

// 全局样式
const globalStyles = `
  * {
    box-sizing: border-box;
  }
  
  body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  #root {
    height: 100vh;
    overflow: hidden;
  }
  
  .ant-modal-body {
    padding: 0;
  }
  
  .ant-collapse-content > .ant-collapse-content-box {
    padding: 16px 0;
  }
  
  .ant-tabs-content-holder {
    overflow: hidden;
  }
  
  .ant-tabs-tabpane {
    height: 100%;
  }
  
  /* 自定义滚动条样式 */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  
  ::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }
  
  ::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
  
  /* 拖拽时的样式 */
  .dragging {
    opacity: 0.5;
  }
  
  .drag-over {
    background-color: #e6f7ff;
    border: 2px dashed #1890ff;
  }
  
  /* 组件选中状态 */
  .component-selected {
    border: 2px solid #1890ff;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  }
  
  /* 响应式设计 */
  @media (max-width: 768px) {
    .card-designer-panel {
      width: 200px;
    }
  }
  
  @media (max-width: 480px) {
    .card-designer-panel {
      width: 180px;
    }
  }
`;

// 注入全局样式
const StyleProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = globalStyles;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return <>{children}</>;
};

// 主应用组件
const App: React.FC = () => {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
          wireframe: false,
        },
        components: {
          Button: {
            borderRadius: 4,
          },
          Card: {
            borderRadius: 8,
          },
          Modal: {
            borderRadius: 8,
          },
          Input: {
            borderRadius: 4,
          },
          Select: {
            borderRadius: 4,
          },
        },
      }}
    >
      <StyleProvider>
        <CardDesigner />
      </StyleProvider>
    </ConfigProvider>
  );
};

export default App;
