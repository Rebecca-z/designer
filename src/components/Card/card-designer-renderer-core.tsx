// ComponentRendererCore.tsx - 组件渲染核心

import { Button, Divider, Input, Select, Typography } from 'antd';
import React from 'react';
import { ComponentType } from './card-designer-types';

const { Option } = Select;
const { Text } = Typography;

interface ComponentRendererCoreProps {
  component: ComponentType;
  isPreview?: boolean;
}

const ComponentRendererCore: React.FC<ComponentRendererCoreProps> = ({
  component,
  isPreview = false,
}) => {
  // 安全检查
  if (!component || !component.tag) {
    console.warn('ComponentRendererCore: Invalid component:', component);
    return (
      <div
        style={{
          padding: '16px',
          border: '1px dashed #ff4d4f',
          borderRadius: '4px',
          textAlign: 'center',
          color: '#ff4d4f',
          backgroundColor: '#fff2f0',
        }}
      >
        ⚠️ 无效组件数据
      </div>
    );
  }

  const comp = component as any;

  switch (component.tag) {
    case 'form':
      return (
        <div
          style={{
            border: '1px dashed #ccc',
            padding: '16px',
            minHeight: '100px',
            borderRadius: '6px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
            }}
          >
            <Text type="secondary" style={{ fontSize: '12px' }}>
              📋 表单容器 {comp.name && `(${comp.name})`}
            </Text>
          </div>

          {comp.elements && comp.elements.length > 0 ? (
            comp.elements.map((element: ComponentType, index: number) => (
              <div key={element.id || index} style={{ marginBottom: '8px' }}>
                <ComponentRendererCore
                  component={element}
                  isPreview={isPreview}
                />
              </div>
            ))
          ) : !isPreview ? (
            <div
              style={{
                textAlign: 'center',
                color: '#999',
                padding: '20px 0',
                border: '1px dashed #d9d9d9',
                borderRadius: '4px',
                backgroundColor: '#fafafa',
              }}
            >
              拖拽组件到这里
            </div>
          ) : (
            <div
              style={{
                textAlign: 'center',
                color: '#ccc',
                padding: '10px 0',
                fontSize: '12px',
              }}
            >
              空表单
            </div>
          )}
        </div>
      );

    case 'column_set':
      return (
        <div
          style={{
            display: 'flex',
            gap: `${comp.gap || 8}px`,
            minHeight: '100px',
            border: '1px solid #f0f0f0',
            borderRadius: '6px',
            padding: '8px',
          }}
        >
          {comp.columns?.map((column: any, index: number) => (
            <div
              key={index}
              style={{
                flex: 1,
                border: '1px dashed #ccc',
                padding: '8px',
                minHeight: '80px',
                borderRadius: '4px',
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  color: '#666',
                  marginBottom: '4px',
                  textAlign: 'center',
                }}
              >
                📐 列 {index + 1}
              </div>

              {column.elements && column.elements.length > 0 ? (
                column.elements.map(
                  (element: ComponentType, elementIndex: number) => (
                    <div
                      key={element.id || elementIndex}
                      style={{ marginBottom: '4px' }}
                    >
                      <ComponentRendererCore
                        component={element}
                        isPreview={isPreview}
                      />
                    </div>
                  ),
                )
              ) : !isPreview ? (
                <div
                  style={{
                    textAlign: 'center',
                    color: '#999',
                    padding: '10px 0',
                    border: '1px dashed #d9d9d9',
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}
                >
                  拖拽组件到这里
                </div>
              ) : null}
            </div>
          )) || (
            <div
              style={{
                textAlign: 'center',
                color: '#999',
                padding: '20px',
                border: '1px dashed #d9d9d9',
                borderRadius: '4px',
                width: '100%',
              }}
            >
              无列配置
            </div>
          )}
        </div>
      );

    case 'plain_text':
      return (
        <div
          style={{
            color: comp.textColor || '#000000',
            fontSize: `${comp.fontSize || 14}px`,
            fontWeight: comp.fontWeight || 'normal',
            textAlign: comp.textAlign || 'left',
            lineHeight: 1.5,
            padding: '4px 0',
          }}
        >
          {comp.content || '文本内容'}
        </div>
      );

    case 'rich_text':
      return (
        <div
          style={{
            padding: '8px',
            border: '1px solid #f0f0f0',
            borderRadius: '4px',
            backgroundColor: '#fafafa',
          }}
        >
          {!isPreview && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              📝 富文本内容
            </Text>
          )}
          <div style={{ marginTop: isPreview ? '0' : '4px' }}>
            {comp.content?.content?.[0]?.content?.[0]?.text || '富文本内容'}
          </div>
        </div>
      );

    case 'hr':
      return <Divider style={{ margin: '8px 0' }} />;

    case 'img':
      return (
        <div style={{ textAlign: 'center' }}>
          <img
            src={
              comp.img_url || 'https://via.placeholder.com/300x200?text=图片'
            }
            alt="图片"
            style={{
              maxWidth: '100%',
              height: 'auto',
              width: comp.width ? `${comp.width}px` : 'auto',
              maxHeight: comp.height ? `${comp.height}px` : '200px',
              objectFit: 'cover',
              borderRadius: '4px',
              border: '1px solid #f0f0f0',
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://via.placeholder.com/300x200?text=图片加载失败';
            }}
          />
        </div>
      );

    case 'img_combination':
      return (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${
              comp.combination_mode === 'trisect'
                ? 3
                : comp.combination_mode === 'bisect'
                ? 2
                : 2
            }, 1fr)`,
            gap: '8px',
            padding: '8px',
            border: '1px solid #f0f0f0',
            borderRadius: '4px',
          }}
        >
          {(comp.img_list || []).length > 0 ? (
            (comp.img_list || []).map((img: any, index: number) => (
              <img
                key={index}
                src={
                  img.img_url || 'https://via.placeholder.com/150x150?text=图片'
                }
                alt={`图片${index + 1}`}
                style={{
                  width: '100%',
                  height: '100px',
                  objectFit: 'cover',
                  borderRadius: '4px',
                  border: '1px solid #f0f0f0',
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://via.placeholder.com/150x150?text=加载失败';
                }}
              />
            ))
          ) : (
            <div
              style={{
                gridColumn: `span ${
                  comp.combination_mode === 'trisect'
                    ? 3
                    : comp.combination_mode === 'bisect'
                    ? 2
                    : 2
                }`,
                textAlign: 'center',
                color: '#999',
                padding: '20px',
                border: '1px dashed #d9d9d9',
                borderRadius: '4px',
              }}
            >
              📷 图片组合
            </div>
          )}
        </div>
      );

    case 'title':
      return (
        <div>
          <h1>标题</h1>
          <h2>副标题</h2>
        </div>
      );
    case 'input':
      return (
        <Input
          placeholder={comp.placeholder?.content || '请输入'}
          defaultValue={comp.default_value?.content || ''}
          type={comp.inputType || 'text'}
          style={{ marginBottom: '8px' }}
          disabled={isPreview}
        />
      );

    case 'button':
      return (
        <Button
          type={comp.type || 'primary'}
          size={comp.size || 'middle'}
          danger={comp.danger || false}
          style={{ marginBottom: '8px' }}
          disabled={isPreview}
        >
          {comp.text?.content || '按钮'}
        </Button>
      );

    case 'select_static':
      return (
        <Select
          placeholder="请选择"
          style={{ width: '100%', marginBottom: '8px' }}
          disabled={isPreview}
        >
          {(comp.options || []).map((option: any, index: number) => (
            <Option key={option.value || index} value={option.value || ''}>
              {option.text?.content || `选项${index + 1}`}
            </Option>
          ))}
        </Select>
      );

    case 'multi_select_static':
      return (
        <Select
          mode="multiple"
          placeholder="请选择"
          style={{ width: '100%', marginBottom: '8px' }}
          disabled={isPreview}
        >
          {(comp.options || []).map((option: any, index: number) => (
            <Option key={option.value || index} value={option.value || ''}>
              {option.text?.content || `选项${index + 1}`}
            </Option>
          ))}
        </Select>
      );

    default:
      return (
        <div
          style={{
            padding: '16px',
            border: '1px dashed #ccc',
            borderRadius: '4px',
            textAlign: 'center',
            color: '#999',
            backgroundColor: '#fafafa',
          }}
        >
          ❓ 未知组件类型: {component.tag}
        </div>
      );
  }
};

export default ComponentRendererCore;
