// ImageComponent 编辑界面 - 图片组件
import { BgColorsOutlined, SettingOutlined } from '@ant-design/icons';
import { Form, InputNumber, Segmented, Select, Tabs, Typography } from 'antd';
import React from 'react';
import ImageUpload from '../../../ImageUpload';
import AddVariableModal from '../../../Variable/AddVariableModal';
import { imageComponentStateManager } from '../../../Variable/utils/index';
import VariableBinding from '../../../Variable/VariableList';
import { ImageComponentProps } from '../types';

const { Text } = Typography;
const { Option } = Select;

const ImageComponent: React.FC<ImageComponentProps> = ({
  selectedComponent,
  variables,
  topLevelTab,
  setTopLevelTab,
  imageContentMode,
  setImageContentMode,
  lastBoundVariables,
  setLastBoundVariables,
  onUpdateComponent,
  handleValueChange,
  getFilteredVariables,
  getVariableDisplayName,
  getVariableKeys,
  handleAddVariableFromComponent,
  isVariableModalVisible,
  handleVariableModalOk,
  handleVariableModalCancel,
  editingVariable,
  isVariableModalFromVariablesTab,
  modalComponentType,
  VariableManagementPanel,
}) => {
  const [form] = Form.useForm();

  console.log('📝 渲染图片组件编辑界面:', {
    componentId: selectedComponent.id,
    topLevelTab,
    variablesCount: variables.length,
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
      <AddVariableModal
        visible={isVariableModalVisible}
        onOk={handleVariableModalOk}
        onCancel={handleVariableModalCancel}
        editingVariable={editingVariable}
        componentType={
          isVariableModalFromVariablesTab
            ? undefined
            : modalComponentType || selectedComponent?.tag
        }
      />

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
                    🎯 当前选中：图片组件
                  </Text>
                </div>

                {/* 图片设置 */}
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
                    🖼️ 图片设置
                  </div>
                  <Form form={form} layout="vertical">
                    <Form.Item label="图片来源">
                      <Segmented
                        value={imageContentMode}
                        style={{ marginBottom: 16 }}
                        onChange={(value) => {
                          setImageContentMode(value as 'specify' | 'variable');
                        }}
                        options={[
                          { label: '指定', value: 'specify' },
                          { label: '绑定变量', value: 'variable' },
                        ]}
                      />

                      {imageContentMode === 'specify' && (
                        <div>
                          <ImageUpload
                            value={(selectedComponent as any).img_url || ''}
                            onChange={(value) => {
                              const updatedComponent = { ...selectedComponent };
                              (updatedComponent as any).img_url = value;
                              onUpdateComponent(updatedComponent);
                            }}
                          />
                        </div>
                      )}

                      {imageContentMode === 'variable' && (
                        <div>
                          <VariableBinding
                            componentType="img"
                            variables={variables}
                            getFilteredVariables={getFilteredVariables}
                            value={(() => {
                              const rememberedVariable = selectedComponent
                                ? lastBoundVariables[selectedComponent.id]
                                : undefined;
                              const currentBoundVariable =
                                imageComponentStateManager.getBoundVariableName(
                                  selectedComponent.id,
                                );

                              const displayValue =
                                rememberedVariable || currentBoundVariable;

                              console.log('🔍 图片VariableBinding显示值:', {
                                componentId: selectedComponent?.id,
                                rememberedVariable,
                                currentBoundVariable,
                                displayValue,
                              });

                              return displayValue;
                            })()}
                            onChange={(value: string | undefined) => {
                              // 处理图片变量绑定逻辑
                              if (selectedComponent) {
                                if (value) {
                                  setLastBoundVariables((prev) => ({
                                    ...prev,
                                    [selectedComponent.id]: value,
                                  }));

                                  imageComponentStateManager.setBoundVariableName(
                                    selectedComponent.id,
                                    value,
                                  );

                                  const updatedComponent = {
                                    ...selectedComponent,
                                  };
                                  const variablePlaceholder = `\${${value}}`;
                                  (updatedComponent as any).img_url =
                                    variablePlaceholder;
                                  onUpdateComponent(updatedComponent);
                                } else {
                                  setLastBoundVariables((prev) => {
                                    const newState = { ...prev };
                                    delete newState[selectedComponent.id];
                                    return newState;
                                  });

                                  imageComponentStateManager.setBoundVariableName(
                                    selectedComponent.id,
                                    '',
                                  );

                                  const updatedComponent = {
                                    ...selectedComponent,
                                  };
                                  (updatedComponent as any).img_url = '';
                                  onUpdateComponent(updatedComponent);
                                }
                              }
                            }}
                            getVariableDisplayName={getVariableDisplayName}
                            getVariableKeys={getVariableKeys}
                            onAddVariable={() =>
                              handleAddVariableFromComponent('img')
                            }
                            placeholder="请选择图片变量"
                            label="绑定变量"
                            addVariableText="+新建图片变量"
                          />
                        </div>
                      )}
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
                    <Form.Item label="显示模式">
                      <Select
                        value={
                          (selectedComponent as any).style?.mode || 'cover'
                        }
                        onChange={(value) => handleValueChange('mode', value)}
                        style={{ width: '100%' }}
                      >
                        <Option value="cover">填充</Option>
                        <Option value="contain">适应</Option>
                        <Option value="fill">拉伸</Option>
                      </Select>
                    </Form.Item>
                    <Form.Item label="宽度">
                      <InputNumber
                        value={(selectedComponent as any).style?.width}
                        onChange={(value) => handleValueChange('width', value)}
                        min={20}
                        max={500}
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
                        max={500}
                        style={{ width: '100%' }}
                        placeholder="自动"
                        addonAfter="px"
                      />
                    </Form.Item>
                    <Form.Item label="圆角">
                      <InputNumber
                        value={
                          (selectedComponent as any).style?.borderRadius || 0
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

export default ImageComponent;
