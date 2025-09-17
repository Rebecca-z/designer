// CardRootComponent - 卡片根节点属性配置组件
import { Form, Input, InputNumber } from 'antd';
import React, { useCallback, useMemo } from 'react';
import { PropertyPanel, SettingSection } from '../common';
import { URL_FIELDS, VERTICAL_SPACING_CONFIG } from './constans';
import type { CardRootComponentProps, MultiUrl } from './type';

const CardRootComponent: React.FC<CardRootComponentProps> = ({
  cardVerticalSpacing,
  onUpdateCard,
  cardData,
  handleValueChange,
  topLevelTab,
  setTopLevelTab,
  VariableManagementPanel,
  isVariableModalVisible,
  handleVariableModalOk,
  handleVariableModalCancel,
  editingVariable,
  isVariableModalFromVariablesTab,
  modalComponentType,
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
        <SettingSection title="⚙️ 卡片属性" form={form}>
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
      componentContent={componentContent}
      eventContent={eventContent}
      eventTabDisabled={false}
      variableManagementComponent={<VariableManagementPanel />}
      isVariableModalVisible={isVariableModalVisible}
      handleVariableModalOk={handleVariableModalOk}
      handleVariableModalCancel={handleVariableModalCancel}
      editingVariable={editingVariable}
      isVariableModalFromVariablesTab={isVariableModalFromVariablesTab}
      modalComponentType={modalComponentType}
    />
  );
};

export default CardRootComponent;
