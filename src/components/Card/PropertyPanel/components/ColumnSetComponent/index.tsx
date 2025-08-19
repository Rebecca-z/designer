// ColumnSetComponent 编辑界面 - 分栏组件
import { BgColorsOutlined, SettingOutlined } from '@ant-design/icons';
import { Form, InputNumber, Select, Tabs, Typography } from 'antd';
import React from 'react';
import { BaseComponentProps } from '../types';

const { Text } = Typography;
const { Option } = Select;

const ColumnSetComponent: React.FC<BaseComponentProps> = ({
  selectedComponent,
  topLevelTab,
  setTopLevelTab,
  handleValueChange,
  VariableManagementPanel,
}) => {
  const [form] = Form.useForm();

  console.log('📝 渲染分栏组件编辑界面:', {
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
                    🎯 当前选中：分栏组件
                  </Text>
                </div>

                {/* 布局设置 */}
                <div
                  style={{
                    background: '#fff',
                    borderRadius: 6,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    padding: 16,
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{ fontWeight: 600, marginBottom: 8, fontSize: 15 }}
                  >
                    📐 布局设置
                  </div>
                  <Form form={form} layout="vertical">
                    <Form.Item label="分栏数量">
                      <InputNumber
                        value={(selectedComponent as any).columns?.length || 2}
                        onChange={(value) => {
                          const newColumns = Array.from(
                            { length: value || 2 },
                            (_, index) => ({
                              width: `${Math.floor(100 / (value || 2))}%`,
                              elements:
                                (selectedComponent as any).columns?.[index]
                                  ?.elements || [],
                            }),
                          );
                          handleValueChange('columns', newColumns);
                        }}
                        min={1}
                        max={4}
                        style={{ width: '100%' }}
                        placeholder="设置分栏数量"
                      />
                    </Form.Item>
                    <Form.Item label="分栏间距">
                      <InputNumber
                        value={(selectedComponent as any).spacing || 16}
                        onChange={(value) =>
                          handleValueChange('spacing', value)
                        }
                        min={0}
                        max={50}
                        style={{ width: '100%' }}
                        placeholder="设置分栏间距"
                        addonAfter="px"
                      />
                    </Form.Item>
                    <Form.Item label="垂直对齐">
                      <Select
                        value={
                          (selectedComponent as any).verticalAlign || 'top'
                        }
                        onChange={(value) =>
                          handleValueChange('verticalAlign', value)
                        }
                        style={{ width: '100%' }}
                      >
                        <Option value="top">顶部对齐</Option>
                        <Option value="middle">居中对齐</Option>
                        <Option value="bottom">底部对齐</Option>
                        <Option value="stretch">拉伸对齐</Option>
                      </Select>
                    </Form.Item>
                  </Form>
                </div>

                {/* 分栏宽度设置 */}
                {(selectedComponent as any).columns && (
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
                      📏 分栏宽度
                    </div>
                    {(selectedComponent as any).columns.map(
                      (column: any, index: number) => (
                        <Form key={index} layout="vertical">
                          <Form.Item label={`第 ${index + 1} 栏宽度`}>
                            <Select
                              value={column.width || 'auto'}
                              onChange={(value) => {
                                const newColumns = [
                                  ...(selectedComponent as any).columns,
                                ];
                                newColumns[index] = {
                                  ...column,
                                  width: value,
                                };
                                handleValueChange('columns', newColumns);
                              }}
                              style={{ width: '100%' }}
                            >
                              <Option value="auto">自动</Option>
                              <Option value="25%">25%</Option>
                              <Option value="33.33%">33.33%</Option>
                              <Option value="50%">50%</Option>
                              <Option value="66.67%">66.67%</Option>
                              <Option value="75%">75%</Option>
                              <Option value="100%">100%</Option>
                            </Select>
                          </Form.Item>
                        </Form>
                      ),
                    )}
                  </div>
                )}
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

export default ColumnSetComponent;
