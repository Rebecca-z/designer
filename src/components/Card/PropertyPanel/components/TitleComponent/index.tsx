import { FileTextOutlined } from '@ant-design/icons';
import { Form, Input, Select, Tabs, Typography } from 'antd';
import React from 'react';
import AddVariableModal from '../../../Variable/AddVariableModal';
import { BaseComponentProps } from '../types';

const { Text } = Typography;
const { Option } = Select;

const TitleComponent: React.FC<BaseComponentProps> = ({
  selectedComponent,
  topLevelTab,
  setTopLevelTab,
  handleValueChange,
  // onUpdateComponent,
  VariableManagementPanel,
  isVariableModalVisible,
  handleVariableModalOk,
  handleVariableModalCancel,
  editingVariable,
  modalComponentType,
}) => {
  // 将selectedComponent转换为any类型以访问title特定属性
  const titleComponent = selectedComponent as any;
  const [form] = Form.useForm();

  console.log('📝 渲染标题组件编辑界面:', {
    componentId: selectedComponent.id,
    topLevelTab,
    selectedComponent: titleComponent,
    title: titleComponent?.title,
    subtitle: titleComponent?.subtitle,
    style: titleComponent?.style,
  });

  // 创建更新函数，只使用 handleValueChange 方法，避免重复调用
  const updateTitleComponent = (field: string, value: any) => {
    console.log('🔧 标题组件更新:', {
      field,
      value,
      currentComponent: titleComponent,
    });

    // 只使用 handleValueChange，它内部会调用 onUpdateComponent
    handleValueChange(field, value);
  };

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
      {/* 标题组件编辑界面的变量添加模态框 - 最优先渲染 */}
      <AddVariableModal
        visible={isVariableModalVisible}
        onOk={handleVariableModalOk}
        onCancel={handleVariableModalCancel}
        editingVariable={editingVariable}
        componentType={modalComponentType}
      />
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
                  <FileTextOutlined
                    style={{
                      fontSize: 20,
                      color: '#1890ff',
                      marginRight: 8,
                    }}
                  />
                  <Text strong style={{ color: '#1890ff', fontSize: 16 }}>
                    🎯 当前选中：title
                  </Text>
                </div>

                {/* 标题设置 */}
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
                    📝 内容设置
                  </div>
                  <Form form={form} layout="vertical">
                    <Form.Item label="主标题">
                      <Input
                        value={
                          titleComponent?.title ||
                          titleComponent?.content ||
                          '主标题'
                        }
                        onChange={(e) => {
                          console.log('🔧 主标题输入变化:', e.target.value);
                          updateTitleComponent('title', e.target.value);
                        }}
                        placeholder="请输入主标题"
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                    <Form.Item label="副标题">
                      <Input
                        value={titleComponent?.subtitle || '副标题'}
                        onChange={(e) => {
                          console.log('🔧 副标题输入变化:', e.target.value);
                          updateTitleComponent('subtitle', e.target.value);
                        }}
                        placeholder="请输入副标题"
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
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{ fontWeight: 600, marginBottom: 8, fontSize: 15 }}
                  >
                    🎨 样式设置
                  </div>
                  <Form form={form} layout="vertical">
                    <Form.Item label="主题颜色">
                      <Select
                        value={titleComponent?.style || 'blue'}
                        onChange={(value) => {
                          console.log('🎨 主题颜色变化:', value);
                          updateTitleComponent('style', value);
                        }}
                        style={{ width: '100%' }}
                      >
                        <Option value="blue">
                          <div
                            style={{ display: 'flex', alignItems: 'center' }}
                          >
                            <div
                              style={{
                                width: '12px',
                                height: '12px',
                                backgroundColor: '#1890ff',
                                borderRadius: '2px',
                                marginRight: '8px',
                              }}
                            />
                            蓝色 (blue)
                          </div>
                        </Option>
                        <Option value="wathet">
                          <div
                            style={{ display: 'flex', alignItems: 'center' }}
                          >
                            <div
                              style={{
                                width: '12px',
                                height: '12px',
                                backgroundColor: '#13c2c2',
                                borderRadius: '2px',
                                marginRight: '8px',
                              }}
                            />
                            淡蓝 (wathet)
                          </div>
                        </Option>
                        <Option value="turquoise">
                          <div
                            style={{ display: 'flex', alignItems: 'center' }}
                          >
                            <div
                              style={{
                                width: '12px',
                                height: '12px',
                                backgroundColor: '#52c41a',
                                borderRadius: '2px',
                                marginRight: '8px',
                              }}
                            />
                            青绿 (turquoise)
                          </div>
                        </Option>
                        <Option value="green">
                          <div
                            style={{ display: 'flex', alignItems: 'center' }}
                          >
                            <div
                              style={{
                                width: '12px',
                                height: '12px',
                                backgroundColor: '#389e0d',
                                borderRadius: '2px',
                                marginRight: '8px',
                              }}
                            />
                            绿色 (green)
                          </div>
                        </Option>
                        <Option value="yellow">
                          <div
                            style={{ display: 'flex', alignItems: 'center' }}
                          >
                            <div
                              style={{
                                width: '12px',
                                height: '12px',
                                backgroundColor: '#faad14',
                                borderRadius: '2px',
                                marginRight: '8px',
                              }}
                            />
                            黄色 (yellow)
                          </div>
                        </Option>
                        <Option value="orange">
                          <div
                            style={{ display: 'flex', alignItems: 'center' }}
                          >
                            <div
                              style={{
                                width: '12px',
                                height: '12px',
                                backgroundColor: '#fa8c16',
                                borderRadius: '2px',
                                marginRight: '8px',
                              }}
                            />
                            橙色 (orange)
                          </div>
                        </Option>
                        <Option value="red">
                          <div
                            style={{ display: 'flex', alignItems: 'center' }}
                          >
                            <div
                              style={{
                                width: '12px',
                                height: '12px',
                                backgroundColor: '#f5222d',
                                borderRadius: '2px',
                                marginRight: '8px',
                              }}
                            />
                            红色 (red)
                          </div>
                        </Option>
                      </Select>
                    </Form.Item>
                  </Form>
                </div>

                {/* 标题信息 */}
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
                    📊 标题信息
                  </div>
                  <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>
                    <div style={{ marginBottom: 8 }}>
                      <Text strong>组件ID：</Text>
                      {selectedComponent.id}
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <Text strong>主题样式：</Text>
                      {titleComponent?.style || 'blue'}
                    </div>
                    <div>
                      <Text strong>组件类型：</Text>
                      标题组件 (title)
                    </div>
                  </div>
                </div>
              </div>
            ),
          },
          {
            key: 'variables',
            label: '变量',
            children: <VariableManagementPanel />,
          },
        ]}
      />
    </div>
  );
};

export default TitleComponent;
