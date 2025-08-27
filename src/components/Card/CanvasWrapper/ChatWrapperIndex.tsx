// 会话卡片包装器组件
import {
  CopyOutlined,
  PlusOutlined,
  RedoOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import { Button, Space, Tooltip } from 'antd';
import React, { useRef } from 'react';
import { DEVICE_SIZES } from '../constants';
import { CardDesignData, ComponentType, VariableItem } from '../type';
import ChatInterface from './ChatWrapper';
interface CanvasProps {
  data: CardDesignData;
  onDataChange: (data: CardDesignData) => void;
  selectedPath: (string | number)[] | null;
  hoveredPath: (string | number)[] | null;
  onSelectComponent: (
    component: ComponentType | null,
    path?: (string | number)[],
  ) => void;
  onDeleteComponent: (path: (string | number)[]) => void;
  onCopyComponent: (component: ComponentType) => void;
  device: keyof typeof DEVICE_SIZES;
  onCanvasFocus?: () => void;
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
  // 新增：标题数据更新回调
  onHeaderDataChange?: (headerData: {
    title?: { content: string };
    subtitle?: { content: string };
    style?: string;
  }) => void;
  // 新增：元素变化回调
  onElementsChange?: (elements: ComponentType[]) => void;
}

const Canvas: React.FC<CanvasProps> = ({
  data,
  selectedPath,
  hoveredPath,
  onSelectComponent,
  onDeleteComponent,
  onCopyComponent,
  device,
  onCanvasFocus,
  onHeaderDataChange,
  onElementsChange,
  onDeviceChange,
  canUndo,
  canRedo,
  onRedo,
  onUndo,
  selectedComponent,
  clipboard,
  onCopy,
  onPaste,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  // 处理卡片元素变化
  const handleElementsChange = (elements: ComponentType[]) => {
    if (onElementsChange) {
      onElementsChange(elements);
    }
  };

  // 检查是否选中了卡片本身
  const isCardSelected =
    selectedPath &&
    selectedPath.length === 2 &&
    selectedPath[0] === 'dsl' &&
    selectedPath[1] === 'body';

  // 处理画布点击事件
  const handleCanvasClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    // 如果点击的是卡片容器、组件包装器或拖拽排序项，不处理画布点击
    if (
      target.closest('[data-card-container]') ||
      target.closest('[data-component-wrapper]') ||
      target.closest('[data-drag-sortable-item]')
    ) {
      return;
    }

    // 如果点击的是操作按钮，不处理画布点击
    if (target.closest('.ant-dropdown') || target.closest('.ant-btn')) {
      return;
    }

    e.stopPropagation();
    onSelectComponent(null);
    onCanvasFocus?.();
  };

  // 处理画布获得焦点
  const handleCanvasFocus = () => {
    onCanvasFocus?.();
  };

  // 处理卡片选中
  const handleCardSelect = () => {
    onSelectComponent(null, ['dsl', 'body']);
  };

  const canvasWidth = DEVICE_SIZES[device].width;

  return (
    <div
      style={{
        width: '100%',
        height: 'calc(100vh - 60px)',
        overflow: 'auto',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '38px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#fff',
          borderBottom: '1px solid #f0f0f0',
          padding: '0 16px',
          boxSizing: 'border-box',
          flexShrink: '0',
        }}
      >
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

        {/* 设备切换 */}
        <Space>
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
      </div>

      {/* 画布容器 */}
      <div
        ref={canvasRef}
        style={{
          width: canvasWidth,
          minHeight: '400px',
          borderRadius: '8px',
          position: 'relative',
          transition: 'all 0.3s ease',
          outline: 'none',
          padding: '16px',
          boxSizing: 'border-box',
          margin: '0 auto',
        }}
        onClick={handleCanvasClick}
        onFocus={handleCanvasFocus}
        tabIndex={0}
      >
        {/* 会话界面 */}
        <div
          style={{
            minHeight: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
          }}
        >
          <ChatInterface
            elements={(() => {
              return data.dsl.body.elements;
            })()}
            verticalSpacing={data.dsl.body.vertical_spacing}
            selectedPath={selectedPath}
            hoveredPath={hoveredPath}
            onElementsChange={handleElementsChange}
            onSelectComponent={onSelectComponent}
            onDeleteComponent={onDeleteComponent}
            onCopyComponent={onCopyComponent}
            onCanvasFocus={onCanvasFocus || (() => {})}
            isCardSelected={!!isCardSelected}
            onCardSelect={handleCardSelect}
            username="user name"
            headerData={(() => {
              if (
                !data.dsl.header ||
                (!data.dsl.header.title?.content &&
                  !data.dsl.header.subtitle?.content)
              ) {
                return undefined;
              }

              return data.dsl.header;
            })()}
            onHeaderDataChange={onHeaderDataChange}
            layoutMode={data.dsl.body.direction || 'vertical'}
            variables={(() => {
              // 将卡片数据结构中的变量转换为VariableItem[]格式
              if (data.variables && Object.keys(data.variables).length > 0) {
                const variableItems: VariableItem[] = [];

                // 只处理变量名和值，不包含type和description信息
                Object.entries(data.variables).forEach(([key, value]) => {
                  // 检查是否是变量名（不包含_type或_description后缀）
                  if (!key.endsWith('_type') && !key.endsWith('_description')) {
                    variableItems.push({
                      [key]: value,
                    });
                  }
                });
                return variableItems;
              }

              return [];
            })()}
          />
        </div>
      </div>
    </div>
  );
};

export default Canvas;
