// CardRootComponent - 卡片根节点属性配置组件
import { LinkOutlined, SettingOutlined } from '@ant-design/icons';
import { Form, Input, InputNumber, Tabs, Typography } from 'antd';
import React, { useCallback, useMemo, useState } from 'react';

const { Text } = Typography;

// 类型定义
interface MultiUrl {
  url?: string;
  android_url?: string;
  ios_url?: string;
  pc_url?: string;
}

interface CardData {
  dsl?: {
    card_link?: {
      multi_url?: MultiUrl;
    };
  };
}

export interface CardRootComponentProps {
  cardVerticalSpacing: number;
  onUpdateCard: (updates: any) => void;
  cardData?: CardData;
  handleValueChange: (field: string, value: any) => void;
}

// 常量定义
const URL_FIELDS = [
  { key: 'url', label: 'URL', placeholder: '请输入URL' },
  {
    key: 'android_url',
    label: 'Android URL',
    placeholder: '请输入Android URL',
  },
  { key: 'ios_url', label: 'iOS URL', placeholder: '请输入iOS URL' },
  { key: 'pc_url', label: 'PC URL', placeholder: '请输入PC URL' },
] as const;

const VERTICAL_SPACING_CONFIG = {
  min: 0,
  max: 100,
  step: 1,
  defaultValue: 8,
} as const;

// 样式常量
const STYLES = {
  infoBox: {
    marginBottom: '16px',
    padding: '12px',
    backgroundColor: '#f0f9ff',
    border: '1px solid #bae6fd',
    borderRadius: '6px',
  },
  section: {
    background: '#fff',
    borderRadius: 6,
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
    padding: 16,
  },
  sectionTitle: {
    fontWeight: 600,
    marginBottom: 8,
    fontSize: 15,
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 500,
    color: '#333',
  },
} as const;

const CardRootComponent: React.FC<CardRootComponentProps> = ({
  cardVerticalSpacing,
  onUpdateCard,
  cardData,
  handleValueChange,
}) => {
  const [activeTab, setActiveTab] = useState<'properties' | 'events'>(
    'properties',
  );

  // 获取当前的card_link数据 - 使用useMemo优化
  const cardLink = useMemo(
    () => cardData?.dsl?.card_link?.multi_url || {},
    [cardData?.dsl?.card_link?.multi_url],
  );

  // 处理URL输入框变化 - 使用useCallback优化
  const handleUrlChange = useCallback(
    (field: string, value: string) => {
      const updatedMultiUrl: MultiUrl = {
        ...cardLink,
        [field]: value,
      };

      // 更新全局数据 dsl.card_link.multi_url
      handleValueChange('card_link.multi_url', updatedMultiUrl);
    },
    [cardLink, handleValueChange],
  );

  // 处理垂直间距变化 - 使用useCallback优化
  const handleVerticalSpacingChange = useCallback(
    (value: number | null) => {
      onUpdateCard({
        vertical_spacing: value || VERTICAL_SPACING_CONFIG.defaultValue,
      });
    },
    [onUpdateCard],
  );

  // 渲染属性Tab内容 - 使用useMemo优化
  const propertiesTabContent = useMemo(
    () => (
      <div style={STYLES.section}>
        <div style={STYLES.sectionTitle}>⚙️ 卡片属性</div>
        <div style={{ marginBottom: '16px' }}>
          <label style={STYLES.label}>垂直间距</label>
          <InputNumber
            value={cardVerticalSpacing || VERTICAL_SPACING_CONFIG.defaultValue}
            onChange={handleVerticalSpacingChange}
            min={VERTICAL_SPACING_CONFIG.min}
            max={VERTICAL_SPACING_CONFIG.max}
            step={VERTICAL_SPACING_CONFIG.step}
            style={{ width: '100%' }}
            addonAfter="px"
            placeholder="设置垂直间距"
          />
        </div>
      </div>
    ),
    [cardVerticalSpacing, handleVerticalSpacingChange],
  );

  // 渲染事件Tab内容 - 使用useMemo优化
  const eventsTabContent = useMemo(
    () => (
      <div style={STYLES.section}>
        <div style={STYLES.sectionTitle}>🔗 卡片链接配置</div>
        <Form layout="vertical">
          {URL_FIELDS.map(({ key, label, placeholder }) => (
            <Form.Item key={key} label={label}>
              <Input
                value={cardLink[key as keyof MultiUrl] || ''}
                onChange={(e) => handleUrlChange(key, e.target.value)}
                placeholder={placeholder}
                style={{ width: '100%' }}
              />
            </Form.Item>
          ))}
        </Form>
      </div>
    ),
    [cardLink, handleUrlChange],
  );

  return (
    <div>
      <div style={STYLES.infoBox}>
        <Text style={{ fontSize: '12px', color: '#0369a1' }}>
          🎯 当前选中：卡片
        </Text>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as 'properties' | 'events')}
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
            children: propertiesTabContent,
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
            children: eventsTabContent,
          },
        ]}
      />
    </div>
  );
};

export default CardRootComponent;
