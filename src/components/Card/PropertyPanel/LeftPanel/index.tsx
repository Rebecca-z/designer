// 左侧组件面板
import { Tabs, Typography } from 'antd';
import React from 'react';
import { useDrag } from 'react-dnd';
import { COMPONENT_CATEGORIES, COMPONENT_TYPES } from '../../constants';
import OutlineTree from '../OutlineTree';
import {
  ComponentLibraryProps,
  ComponentPanelProps,
  DraggableComponentProps,
} from '../types';

const { Text } = Typography;

// 可拖拽的组件项
const DraggableComponent: React.FC<DraggableComponentProps> = ({
  type,
  config,
  onComponentClick,
}) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'component',
    item: { type, isNew: true },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (onComponentClick) {
      onComponentClick(type);
    }
  };

  return (
    <div
      ref={drag}
      style={{
        border: '1px solid #d9d9d9',
        borderRadius: '6px',
        cursor: 'grab',
        transition: 'all 0.2s ease',
        backgroundColor: isDragging ? '#f0f9ff' : '#fff',
        opacity: isDragging ? 0.5 : 1,
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        minHeight: '38px',
        justifyContent: 'center',
        boxShadow: isDragging
          ? '0 4px 12px rgba(24, 144, 255, 0.3)'
          : '0 1px 3px rgba(0,0,0,0.1)',
      }}
      onMouseEnter={(e) => {
        if (!isDragging) {
          e.currentTarget.style.borderColor = '#1890ff';
          e.currentTarget.style.backgroundColor = '#f0f9ff';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragging) {
          e.currentTarget.style.borderColor = '#d9d9d9';
          e.currentTarget.style.backgroundColor = '#fff';
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
      onClick={handleClick}
    >
      <config.icon
        style={{
          fontSize: '18px',
          color: isDragging ? '#1890ff' : '#666',
        }}
      />
      <span
        style={{
          fontSize: '11px',
          color: isDragging ? '#1890ff' : '#333',
          fontWeight: isDragging ? 'bold' : 'normal',
          textAlign: 'center',
          lineHeight: '1.2',
        }}
      >
        {config.name}
      </span>
    </div>
  );
};

// 组件库面板
const ComponentLibrary: React.FC<ComponentLibraryProps> = ({
  onComponentClick,
}) => {
  const categories = COMPONENT_CATEGORIES.map((category) => ({
    ...category,
    components: Object.entries(COMPONENT_TYPES).filter(
      ([, config]) => config.category === category.key,
    ),
  }));

  return (
    <div style={{ padding: '12px 8px' }}>
      {categories.map((category) => (
        <div key={category.key} style={{ marginBottom: '24px' }}>
          {/* 分类标题 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              backgroundColor: '#f8f9fa',
              borderRadius: '6px',
            }}
          >
            <Text strong style={{ fontSize: '14px', color: '#333' }}>
              {category.title}
            </Text>
          </div>

          {/* 子组件网格布局 - 一行两列 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
            }}
          >
            {category.components.map(([type, config]) => (
              <DraggableComponent
                key={type}
                type={type}
                config={config}
                onComponentClick={onComponentClick}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// 左侧组件面板主组件
export const ComponentPanel: React.FC<ComponentPanelProps> = ({
  cardData,
  selectedPath,
  onOutlineHover,
  onOutlineSelect,
  onComponentClick,
}) => {
  return (
    <div
      style={{
        width: '300px',
        flexShrink: '0',
        height: 'calc(100vh - 60px)',
        backgroundColor: '#fafafa',
        borderRight: '1px solid #d9d9d9',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Tabs
        defaultActiveKey="components"
        style={{ flex: 1 }}
        tabBarStyle={{
          padding: '0 16px',
          backgroundColor: '#fff',
          margin: 0,
          borderBottom: '1px solid #d9d9d9',
        }}
        size="small"
        items={[
          {
            key: 'components',
            label: (
              <span
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                组件库
              </span>
            ),
            children: (
              <div style={{ height: 'calc(100vh - 120px)', overflow: 'auto' }}>
                <ComponentLibrary onComponentClick={onComponentClick} />
              </div>
            ),
          },
          {
            key: 'outline',
            label: (
              <span
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                大纲树
              </span>
            ),
            children: (
              <div style={{ height: 'calc(100vh - 120px)', overflow: 'auto' }}>
                <OutlineTree
                  data={cardData}
                  selectedPath={selectedPath}
                  onOutlineHover={onOutlineHover}
                  onOutlineSelect={onOutlineSelect}
                />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};

export default ComponentPanel;
