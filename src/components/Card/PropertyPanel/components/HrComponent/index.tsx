// HrComponent 编辑界面 - 分割线组件
import { BgColorsOutlined, SettingOutlined } from '@ant-design/icons';
import { Form, Select, Tabs, Typography } from 'antd';
import React from 'react';
import { BaseComponentProps } from '../types';

const { Text } = Typography;
const { Option } = Select;

const HrComponent: React.FC<BaseComponentProps> = ({
  selectedComponent,
  topLevelTab,
  setTopLevelTab,
  handleValueChange,
  VariableManagementPanel,
}) => {
  const [form] = Form.useForm();

  console.log('📝 渲染分割线组件编辑界面:', {
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
                    🎯 当前选中：分割线组件
                  </Text>
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
                    <Form.Item label="边框样式">
                      <Select
                        value={
                          (selectedComponent as any).style?.borderStyle ||
                          'solid'
                        }
                        onChange={(value) =>
                          handleValueChange('borderStyle', value)
                        }
                        style={{ width: '100%' }}
                        placeholder="选择边框样式"
                      >
                        <Option value="solid">
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                            }}
                          >
                            <div
                              style={{
                                width: '40px',
                                height: '2px',
                                backgroundColor: '#666',
                                borderTop: '2px solid #666',
                                borderStyle: 'solid',
                              }}
                            />
                            实线 (solid)
                          </div>
                        </Option>
                        <Option value="dashed">
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                            }}
                          >
                            <div
                              style={{
                                width: '40px',
                                height: '2px',
                                borderTop: '2px dashed #666',
                              }}
                            />
                            虚线 (dashed)
                          </div>
                        </Option>
                        <Option value="dotted">
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                            }}
                          >
                            <div
                              style={{
                                width: '40px',
                                height: '2px',
                                borderTop: '2px dotted #666',
                              }}
                            />
                            点线 (dotted)
                          </div>
                        </Option>
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

export default HrComponent;
