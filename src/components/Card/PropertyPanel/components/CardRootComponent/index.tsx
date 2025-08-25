// CardRootComponent - 卡片根节点属性配置组件
import { Form, Input, InputNumber } from 'antd';
import React, { useCallback, useMemo } from 'react';
import { ComponentContent, PropertyPanel, SettingSection } from '../common';

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
  topLevelTab: string;
  setTopLevelTab: (tab: string) => void;
  VariableManagementPanel: React.ComponentType;
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

const CardRootComponent: React.FC<CardRootComponentProps> = ({
  cardVerticalSpacing,
  onUpdateCard,
  cardData,
  handleValueChange,
  topLevelTab,
  setTopLevelTab,
  VariableManagementPanel,
}) => {
  const [form] = Form.useForm();

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

  // 组件属性内容
  const componentContent = useMemo(
    () => (
      <>
        <SettingSection title="⚙️ 卡片属性123" form={form}>
          <Form.Item label="垂直间距">
            <InputNumber
              value={
                cardVerticalSpacing || VERTICAL_SPACING_CONFIG.defaultValue
              }
              onChange={handleVerticalSpacingChange}
              min={VERTICAL_SPACING_CONFIG.min}
              max={VERTICAL_SPACING_CONFIG.max}
              step={VERTICAL_SPACING_CONFIG.step}
              style={{ width: '100%' }}
              addonAfter="px"
              placeholder="设置垂直间距"
            />
          </Form.Item>
        </SettingSection>
      </>
    ),
    [form, cardVerticalSpacing, handleVerticalSpacingChange],
  );

  // 事件内容
  const eventContent = useMemo(
    () => (
      <div style={{ padding: '16px' }}>
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
            🔗 卡片链接配置
          </div>
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
      </div>
    ),
    [cardLink, handleUrlChange],
  );

  return (
    <PropertyPanel
      activeTab={topLevelTab}
      onTabChange={setTopLevelTab}
      componentContent={
        <ComponentContent componentName="卡片">
          {componentContent}
        </ComponentContent>
      }
      eventContent={eventContent}
      showEventTab={true}
      variableManagementComponent={<VariableManagementPanel />}
    />
  );
};

export default CardRootComponent;
