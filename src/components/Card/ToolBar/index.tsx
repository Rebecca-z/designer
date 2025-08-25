// card-designer-toolbar-with-id.tsx - 带ID显示的工具栏组件

import {
  CodeOutlined,
  CopyOutlined,
  EyeOutlined,
  ImportOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  RedoOutlined,
  SaveOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import {
  Button,
  Divider,
  Modal,
  Space,
  Tooltip,
  Typography,
  message,
} from 'antd';
import React from 'react';
import { DEVICE_SIZES } from '../constants';
import { ComponentType } from '../type';

const { Text } = Typography;

interface ToolbarProps {
  // 卡片ID
  cardId: string;

  // 设备相关
  device: keyof typeof DEVICE_SIZES;
  onDeviceChange: (device: keyof typeof DEVICE_SIZES) => void;

  // 历史操作
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;

  // 编辑操作
  selectedComponent: ComponentType | null;
  clipboard: ComponentType | null;
  onCopy: () => void;
  onPaste: () => void;

  // 文件操作
  onSave: () => void;
  onImport: () => void;
  onExport: () => void;
  onPreview: () => void;

  // 统计信息
  elementsCount: number;
  variablesCount: number;
  canvasFocused: boolean;

  // 卡片设置
  verticalSpacing?: number;
}

const Toolbar: React.FC<ToolbarProps> = ({
  cardId,
  device,
  onDeviceChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  selectedComponent,
  clipboard,
  onCopy,
  onPaste,
  onSave,
  onImport,
  onExport,
  onPreview,
  elementsCount,
  variablesCount,
  canvasFocused,
  verticalSpacing,
}) => {
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

  const showShortcutsHelp = () => {
    Modal.info({
      title: '快捷键说明',
      content: (
        <div>
          <p>
            <strong>Ctrl+Z:</strong> 撤销
          </p>
          <p>
            <strong>Ctrl+Y:</strong> 重做
          </p>
          <p>
            <strong>Ctrl+C:</strong> 复制选中组件
          </p>
          <p>
            <strong>Ctrl+V:</strong> 粘贴组件
          </p>
          <p>
            <strong>Ctrl+S:</strong> 保存配置
          </p>
          <p>
            <strong>Ctrl+O:</strong> 加载配置
          </p>
          <p>
            <strong>Delete/Backspace:</strong> 智能删除选中组件
          </p>
          <div
            style={{
              marginTop: '12px',
              padding: '8px',
              backgroundColor: '#f6ffed',
              border: '1px solid #b7eb8f',
              borderRadius: '4px',
            }}
          >
            <strong>智能删除说明：</strong>
            <br />• 只有在画布获得焦点且选中组件时才能删除
            <br />• 在属性面板输入框编辑时不会误删组件
            <br />• 确保删除操作的安全性和准确性
            <br />• 卡片容器本身不可删除
          </div>
          <div
            style={{
              marginTop: '12px',
              padding: '8px',
              backgroundColor: '#e6f7ff',
              border: '1px solid #91d5ff',
              borderRadius: '4px',
            }}
          >
            <strong>会话卡片功能：</strong>
            <br />• 所有组件都会添加到卡片容器内
            <br />• 卡片容器模拟真实的会话界面
            <br />• 支持内边距和垂直间距配置
            <br />• 卡片ID可以复制用于外部引用
          </div>
        </div>
      ),
    });
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
        {/* 卡片ID显示 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 8px',
            backgroundColor: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
          onClick={copyCardId}
        >
          <Text type="secondary" style={{ fontSize: '12px' }}>
            ID:
          </Text>
          <Tooltip title="点击复制卡片ID">
            <Text
              code
              style={{
                fontSize: '11px',
                maxWidth: '80px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                cursor: 'pointer',
              }}
            >
              {cardId}
            </Text>
          </Tooltip>
          <CopyOutlined style={{ fontSize: '12px', color: '#1890ff' }} />
        </div>

        <Divider type="vertical" />

        {/* 设备切换 */}
        <Space>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            设备:
          </Text>
          {Object.entries(DEVICE_SIZES).map(([key, config]) => (
            <Tooltip key={key} title={config.name}>
              <Button
                type={device === key ? 'primary' : 'default'}
                icon={<config.icon />}
                onClick={() => onDeviceChange(key as keyof typeof DEVICE_SIZES)}
                size="small"
              />
            </Tooltip>
          ))}
        </Space>

        <Divider type="vertical" />

        {/* 历史操作 */}
        <Space>
          <Tooltip title="撤销 (Ctrl+Z)">
            <Button
              icon={<UndoOutlined />}
              onClick={onUndo}
              disabled={!canUndo}
              size="small"
            />
          </Tooltip>
          <Tooltip title="重做 (Ctrl+Y)">
            <Button
              icon={<RedoOutlined />}
              onClick={onRedo}
              disabled={!canRedo}
              size="small"
            />
          </Tooltip>
        </Space>

        <Divider type="vertical" />

        {/* 编辑操作 */}
        <Space>
          <Tooltip title="复制 (Ctrl+C)">
            <Button
              icon={<CopyOutlined />}
              onClick={onCopy}
              disabled={!selectedComponent}
              size="small"
            />
          </Tooltip>
          <Tooltip title="粘贴 (Ctrl+V)">
            <Button
              icon={<PlusOutlined />}
              onClick={onPaste}
              disabled={!clipboard}
              size="small"
            />
          </Tooltip>
        </Space>

        <Divider type="vertical" />

        {/* 文件操作 */}
        <Space>
          <Tooltip title="保存 (Ctrl+S)">
            <Button icon={<SaveOutlined />} onClick={onSave} size="small" />
          </Tooltip>
        </Space>
      </Space>

      <Space>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          组件数量: {elementsCount} | 变量数量: {variablesCount}
          {canvasFocused && (
            <span style={{ color: '#52c41a' }}> | 画布已聚焦</span>
          )}
        </Text>

        <Divider type="vertical" />

        {/* 导入导出按钮 */}
        <Button icon={<ImportOutlined />} onClick={onImport} size="small">
          导入
        </Button>

        <Button icon={<EyeOutlined />} onClick={onPreview} size="small">
          在线预览
        </Button>

        <Tooltip title={`当前间距: ${verticalSpacing || 8}px`}>
          <Button
            type="primary"
            icon={<CodeOutlined />}
            onClick={onExport}
            size="small"
          >
            导出配置
          </Button>
        </Tooltip>

        <Button
          icon={<QuestionCircleOutlined />}
          onClick={showShortcutsHelp}
          size="small"
        />
      </Space>
    </div>
  );
};

export default Toolbar;
