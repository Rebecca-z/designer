// ButtonComponent 编辑界面 - 按钮组件
import { BgColorsOutlined, SettingOutlined } from '@ant-design/icons';
import {
  ColorPicker,
  Form,
  Input,
  InputNumber,
  Select,
  Tabs,
  Typography,
} from 'antd';
import React from 'react';
import { BaseComponentProps } from '../types';

const { Text } = Typography;
const { Option } = Select;

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
                    <Form.Item label="按钮文字">
                      <Input
                        value={(selectedComponent as any).text || ''}
                        onChange={(e) =>
                          handleValueChange('text', e.target.value)
                        }
                        placeholder="按钮"
                      />
                    </Form.Item>
                    <Form.Item label="按钮类型">
                      <Select
                        value={(selectedComponent as any).type || 'primary'}
                        onChange={(value) => handleValueChange('type', value)}
                        style={{ width: '100%' }}
                      >
                        <Option value="primary">主要按钮</Option>
                        <Option value="default">默认按钮</Option>
                        <Option value="dashed">虚线按钮</Option>
                        <Option value="text">文本按钮</Option>
                        <Option value="link">链接按钮</Option>
                      </Select>
                    </Form.Item>
                    <Form.Item label="按钮大小">
                      <Select
                        value={(selectedComponent as any).size || 'middle'}
                        onChange={(value) => handleValueChange('size', value)}
                        style={{ width: '100%' }}
                      >
                        <Option value="large">大号</Option>
                        <Option value="middle">中号</Option>
                        <Option value="small">小号</Option>
                      </Select>
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
                    <Form.Item label="宽度">
                      <InputNumber
                        value={(selectedComponent as any).style?.width}
                        onChange={(value) => handleValueChange('width', value)}
                        min={50}
                        max={300}
                        style={{ width: '100%' }}
                        placeholder="自动"
                        addonAfter="px"
                      />
                    </Form.Item>
                    <Form.Item label="高度">
                      <InputNumber
                        value={(selectedComponent as any).style?.height}
                        onChange={(value) => handleValueChange('height', value)}
                        min={20}
                        max={80}
                        style={{ width: '100%' }}
                        placeholder="自动"
                        addonAfter="px"
                      />
                    </Form.Item>
                    <Form.Item label="背景颜色">
                      <ColorPicker
                        value={
                          (selectedComponent as any).style?.backgroundColor ||
                          '#1890ff'
                        }
                        onChange={(color) =>
                          handleValueChange(
                            'backgroundColor',
                            color.toHexString(),
                          )
                        }
                        showText
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                    <Form.Item label="文字颜色">
                      <ColorPicker
                        value={
                          (selectedComponent as any).style?.color || '#ffffff'
                        }
                        onChange={(color) =>
                          handleValueChange('color', color.toHexString())
                        }
                        showText
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                    <Form.Item label="圆角">
                      <InputNumber
                        value={
                          (selectedComponent as any).style?.borderRadius || 6
                        }
                        onChange={(value) =>
                          handleValueChange('borderRadius', value)
                        }
                        min={0}
                        max={50}
                        style={{ width: '100%' }}
                        addonAfter="px"
                      />
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
