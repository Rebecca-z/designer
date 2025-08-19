// ColumnComponent 编辑界面 - 列容器组件
import { TableOutlined } from '@ant-design/icons';
import { Form, InputNumber, Tabs, Typography } from 'antd';
import React from 'react';
import { BaseComponentProps } from '../types';

const { Text } = Typography;

const ColumnComponent: React.FC<BaseComponentProps> = ({
  selectedComponent,
  topLevelTab,
  setTopLevelTab,
  handleValueChange,
  VariableManagementPanel,
}) => {
  const [form] = Form.useForm();

  console.log('📝 渲染列组件编辑界面:', {
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
        items={[
          {
            key: 'properties',
            label: '组件属性',
            children: (
              <div style={{ padding: '8px 0' }}>
                {/* 组件类型提示 */}
                <div
                  style={{
                    background: '#e6f7ff',
                    border: '1px solid #91d5ff',
                    borderRadius: 6,
                    padding: 12,
                    marginBottom: 16,
                    textAlign: 'center',
                  }}
                >
                  <TableOutlined
                    style={{
                      fontSize: 20,
                      color: '#1890ff',
                      marginRight: 8,
                    }}
                  />
                  <Text strong style={{ color: '#1890ff', fontSize: 16 }}>
                    🎯 当前选中：column
                  </Text>
                </div>

                {/* 列设置 */}
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
                    📐 列设置
                  </div>
                  <Form form={form} layout="vertical">
                    <Form.Item label="列权重">
                      <InputNumber
                        value={(selectedComponent as any).style?.flex || 1}
                        onChange={(value) => {
                          // 更新style.flex字段
                          const currentStyle =
                            (selectedComponent as any).style || {};
                          handleValueChange('style', {
                            ...currentStyle,
                            flex: value || 1,
                          });
                        }}
                        min={1}
                        max={5}
                        step={1}
                        style={{ width: '100%' }}
                        placeholder="设置列权重"
                        addonAfter="权重"
                      />
                    </Form.Item>
                  </Form>

                  <div
                    style={{
                      marginTop: 12,
                      fontSize: 12,
                      color: '#666',
                      lineHeight: 1.4,
                    }}
                  >
                    💡
                    提示：列权重决定了该列在分栏中所占的比例。权重越大，列越宽。
                  </div>
                </div>

                {/* 列信息 */}
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
                    📊 列信息
                  </div>
                  <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>
                    <div style={{ marginBottom: 8 }}>
                      <Text strong>组件ID：</Text>
                      {selectedComponent.id || '未设置'}
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <Text strong>子元素数量：</Text>
                      {(selectedComponent as any).elements?.length || 0}
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <Text strong>当前权重：</Text>
                      {(selectedComponent as any).style?.flex || 1}
                    </div>
                    <div>
                      <Text strong>组件类型：</Text>
                      列容器 (column)
                    </div>
                  </div>
                </div>
              </div>
            ),
          },
          {
            key: 'variables',
            label: '变量',
            children: VariableManagementPanel,
          },
        ]}
      />
    </div>
  );
};

export default ColumnComponent;
