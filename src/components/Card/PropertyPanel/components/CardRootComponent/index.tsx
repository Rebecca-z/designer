// CardRootComponent - 卡片根节点属性配置组件
import { LinkOutlined, SettingOutlined } from '@ant-design/icons';
import { Form, Input, InputNumber, Tabs, Typography } from 'antd';
import React, { useState } from 'react';

const { Text } = Typography;

export interface CardRootComponentProps {
  cardVerticalSpacing: number;
  onUpdateCard: (updates: any) => void;
  cardData?: any;
  handleValueChange: (field: string, value: any) => void;
}

const CardRootComponent: React.FC<CardRootComponentProps> = ({
  cardVerticalSpacing,
  onUpdateCard,
  cardData,
  handleValueChange,
}) => {
  const [activeTab, setActiveTab] = useState('properties');

  // 获取当前的card_link数据
  const cardLink = cardData?.dsl?.card_link?.multi_url || {};

  // 处理URL输入框变化
  const handleUrlChange = (field: string, value: string) => {
    const updatedMultiUrl = {
      ...cardLink,
      [field]: value,
    };

    // 更新全局数据 dsl.card_link.multi_url
    handleValueChange('card_link.multi_url', updatedMultiUrl);
  };

  console.log('📝 渲染卡片根节点编辑界面:', {
    cardVerticalSpacing,
    cardLink,
    activeTab,
  });

  return (
    <div>
      <div
        style={{
          marginBottom: '16px',
          padding: '12px',
          backgroundColor: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '6px',
        }}
      >
        <Text style={{ fontSize: '12px', color: '#0369a1' }}>
          🎯 当前选中：卡片
        </Text>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'properties',
            label: (
              <span
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <SettingOutlined />
                属性
              </span>
            ),
            children: (
              <div
                style={{
                  background: '#fff',
                  borderRadius: 6,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  padding: 16,
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    marginBottom: 8,
                    fontSize: 15,
                  }}
                >
                  ⚙️ 卡片属性
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: 500,
                      color: '#333',
                    }}
                  >
                    垂直间距
                  </label>
                  <InputNumber
                    value={cardVerticalSpacing || 8}
                    onChange={(value) => {
                      console.log('垂直间距输入变化:', value);
                      onUpdateCard({ vertical_spacing: value || 0 });
                    }}
                    min={0}
                    max={100}
                    step={1}
                    style={{ width: '100%' }}
                    addonAfter="px"
                    placeholder="设置垂直间距"
                  />
                </div>
              </div>
            ),
          },
          {
            key: 'events',
            label: (
              <span
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <LinkOutlined />
                事件
              </span>
            ),
            children: (
              <div
                style={{
                  background: '#fff',
                  borderRadius: 6,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  padding: 16,
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    marginBottom: 16,
                    fontSize: 15,
                  }}
                >
                  🔗 卡片链接配置
                </div>
                <Form layout="vertical">
                  <Form.Item label="URL">
                    <Input
                      value={cardLink.url || ''}
                      onChange={(e) => handleUrlChange('url', e.target.value)}
                      placeholder="请输入URL"
                      style={{ width: '100%' }}
                    />
                  </Form.Item>

                  <Form.Item label="Android URL">
                    <Input
                      value={cardLink.android_url || ''}
                      onChange={(e) =>
                        handleUrlChange('android_url', e.target.value)
                      }
                      placeholder="请输入Android URL"
                      style={{ width: '100%' }}
                    />
                  </Form.Item>

                  <Form.Item label="iOS URL">
                    <Input
                      value={cardLink.ios_url || ''}
                      onChange={(e) =>
                        handleUrlChange('ios_url', e.target.value)
                      }
                      placeholder="请输入iOS URL"
                      style={{ width: '100%' }}
                    />
                  </Form.Item>

                  <Form.Item label="PC URL">
                    <Input
                      value={cardLink.pc_url || ''}
                      onChange={(e) =>
                        handleUrlChange('pc_url', e.target.value)
                      }
                      placeholder="请输入PC URL"
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Form>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};

export default CardRootComponent;
