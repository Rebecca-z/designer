// ButtonComponent 编辑界面 - 按钮组件
import { BgColorsOutlined, SettingOutlined } from '@ant-design/icons';
import { Form, Input, Select, Tabs, Typography } from 'antd';
import React from 'react';
import { BaseComponentProps } from '../types';

const { Text } = Typography;

const ButtonComponent: React.FC<BaseComponentProps> = ({
  selectedComponent,
  topLevelTab,
  setTopLevelTab,
  handleValueChange,
  VariableManagementPanel,
}) => {
  const [form] = Form.useForm();

  console.log('📝 渲染按钮组件编辑界面:', {
    componentId: selectedComponent.id,
    topLevelTab,
  });

  return (
    <div
      style={{
        width: '300px',
        height: 'calc(100vh - 60px)',
        backgroundColor: '#fafafa',
        borderLeft: '1px solid #d9d9d9',
        padding: '16px',
        overflow: 'auto',
      }}
    >
      <Tabs
        activeKey={topLevelTab}
        onChange={setTopLevelTab}
        style={{ height: '100%' }}
        tabBarStyle={{
          padding: '0 16px',
          backgroundColor: '#fff',
          margin: 0,
          borderBottom: '1px solid #d9d9d9',
        }}
        size="small"
        items={[
          {
            key: 'component',
            label: (
              <span
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <SettingOutlined />
                组件属性
              </span>
            ),
            children: (
              <div style={{ padding: '16px' }}>
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
                    🎯 当前选中：按钮组件
                  </Text>
                </div>

                {/* 内容设置 */}
                <div
                  style={{
                    marginBottom: '16px',
                    background: '#fff',
                    borderRadius: 6,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    padding: 16,
                  }}
                >
                  <div
                    style={{ fontWeight: 600, marginBottom: 8, fontSize: 15 }}
                  >
                    📝 内容设置
                  </div>
                  <Form form={form} layout="vertical">
                    <Form.Item label="按钮文案">
                      <Input
                        value={
                          (selectedComponent as any).text?.content || '按钮'
                        }
                        onChange={(e) => {
                          const value = e.target.value;
                          // 限制最多8个字符
                          if (value.length <= 8) {
                            handleValueChange('text.content', value);
                          }
                        }}
                        placeholder="按钮"
                        maxLength={8}
                        showCount
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </Form>
                </div>

                {/* 样式设置 */}
                <div
                  style={{
                    background: '#fff',
                    borderRadius: 6,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    padding: 16,
                  }}
                >
                  <div
                    style={{ fontWeight: 600, marginBottom: 8, fontSize: 15 }}
                  >
                    🎨 样式设置
                  </div>
                  <Form form={form} layout="vertical">
                    <Form.Item label="按钮颜色">
                      <Select
                        value={
                          (selectedComponent as any).style?.color || 'blue'
                        }
                        onChange={(value) => handleValueChange('color', value)}
                        style={{ width: '100%' }}
                      >
                        <Select.Option value="black">
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                            }}
                          >
                            <div
                              style={{
                                width: '16px',
                                height: '16px',
                                backgroundColor: '#000000',
                                border: '1px solid #d9d9d9',
                                borderRadius: '2px',
                              }}
                            />
                            黑色
                          </div>
                        </Select.Option>
                        <Select.Option value="blue">
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                            }}
                          >
                            <div
                              style={{
                                width: '16px',
                                height: '16px',
                                backgroundColor: '#1890ff',
                                border: '1px solid #d9d9d9',
                                borderRadius: '2px',
                              }}
                            />
                            蓝色
                          </div>
                        </Select.Option>
                        <Select.Option value="red">
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                            }}
                          >
                            <div
                              style={{
                                width: '16px',
                                height: '16px',
                                backgroundColor: '#ff4d4f',
                                border: '1px solid #d9d9d9',
                                borderRadius: '2px',
                              }}
                            />
                            红色
                          </div>
                        </Select.Option>
                      </Select>
                    </Form.Item>
                  </Form>
                </div>
              </div>
            ),
          },
          {
            key: 'variables',
            label: (
              <span
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <BgColorsOutlined />
                变量
              </span>
            ),
            children: <VariableManagementPanel />,
          },
        ]}
      />
    </div>
  );
};

export default ButtonComponent;
