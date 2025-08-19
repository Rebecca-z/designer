// FormComponent 编辑界面 - 表单容器组件
import { FormOutlined } from '@ant-design/icons';
import { Form, Input, Tabs, Typography } from 'antd';
import React from 'react';
import { BaseComponentProps } from '../types';

const { Text } = Typography;

const FormComponent: React.FC<BaseComponentProps> = ({
  selectedComponent,
  topLevelTab,
  setTopLevelTab,
  handleValueChange,
  VariableManagementPanel,
}) => {
  const [form] = Form.useForm();

  console.log('📝 渲染表单组件编辑界面:', {
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
                  <FormOutlined
                    style={{
                      fontSize: 20,
                      color: '#1890ff',
                      marginRight: 8,
                    }}
                  />
                  <Text strong style={{ color: '#1890ff', fontSize: 16 }}>
                    🎯 当前选中：form
                  </Text>
                </div>

                {/* 表单设置 */}
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
                    📋 表单设置
                  </div>
                  <Form form={form} layout="vertical">
                    <Form.Item label="表单名称">
                      <Input
                        value={(selectedComponent as any).name || 'Form'}
                        onChange={(e) =>
                          handleValueChange('name', e.target.value)
                        }
                        placeholder="设置表单名称"
                        style={{ width: '100%' }}
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
                    💡 提示：表单容器用于包含表单元素，支持数据收集和提交。
                  </div>
                </div>

                {/* 表单信息 */}
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
                    📊 表单信息
                  </div>
                  <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>
                    <div style={{ marginBottom: 8 }}>
                      <Text strong>组件ID：</Text>
                      {selectedComponent.id}
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <Text strong>子元素数量：</Text>
                      {(selectedComponent as any).elements?.length || 0}
                    </div>
                    <div>
                      <Text strong>组件类型：</Text>
                      表单容器 (form)
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

export default FormComponent;
