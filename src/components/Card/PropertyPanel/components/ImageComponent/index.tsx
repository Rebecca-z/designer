// ImageComponent 编辑界面 - 图片组件
import { BgColorsOutlined, SettingOutlined } from '@ant-design/icons';
import { Form, Input, Segmented, Select, Space, Tabs, Typography } from 'antd';
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
                          const newMode = value as 'specify' | 'variable';
                          setImageContentMode(newMode);

                          // 处理模式切换时的图片显示逻辑
                          const updatedComponent = { ...selectedComponent };

                          if (newMode === 'specify') {
                            // 切换到指定模式：显示用户编辑的图片
                            const userEditedUrl =
                              imageComponentStateManager.getUserEditedUrl(
                                selectedComponent.id,
                              );
                            (updatedComponent as any).img_url =
                              userEditedUrl || '';
                            // 同步更新 i18n_img_url
                            (updatedComponent as any).i18n_img_url = {
                              'en-US': userEditedUrl || '',
                            };
                          } else {
                            // 切换到变量模式：检查是否有绑定的变量
                            const boundVariable =
                              imageComponentStateManager.getBoundVariableName(
                                selectedComponent.id,
                              );
                            const rememberedVariable =
                              lastBoundVariables[selectedComponent.id];

                            if (boundVariable || rememberedVariable) {
                              // 如果有绑定变量，显示变量占位符
                              const variableName =
                                boundVariable || rememberedVariable;
                              const variablePlaceholder = `\${${variableName}}`;
                              (updatedComponent as any).img_url =
                                variablePlaceholder;
                              // 同步更新 i18n_img_url
                              (updatedComponent as any).i18n_img_url = {
                                'en-US': variablePlaceholder,
                              };
                            } else {
                              // 如果没有绑定变量，显示指定图片
                              const userEditedUrl =
                                imageComponentStateManager.getUserEditedUrl(
                                  selectedComponent.id,
                                );
                              (updatedComponent as any).img_url =
                                userEditedUrl || '';
                              // 同步更新 i18n_img_url
                              (updatedComponent as any).i18n_img_url = {
                                'en-US': userEditedUrl || '',
                              };
                            }
                          }

                          onUpdateComponent(updatedComponent);
                        }}
                        options={[
                          { label: '指定', value: 'specify' },
                          { label: '绑定变量', value: 'variable' },
                        ]}
                      />

                      {imageContentMode === 'specify' && (
                        <div>
                          <Space.Compact style={{ width: '100%' }}>
                            <Input
                              value={
                                imageComponentStateManager.getUserEditedUrl(
                                  selectedComponent.id,
                                ) || ''
                              }
                              onChange={(e) => {
                                // 保存用户编辑的URL到独立状态
                                imageComponentStateManager.setUserEditedUrl(
                                  selectedComponent.id,
                                  e.target.value,
                                );

                                // 立即更新组件显示（只在指定模式下）
                                const updatedComponent = {
                                  ...selectedComponent,
                                };
                                (updatedComponent as any).img_url =
                                  e.target.value;
                                // 同步更新 i18n_img_url
                                (updatedComponent as any).i18n_img_url = {
                                  'en-US': e.target.value,
                                };
                                onUpdateComponent(updatedComponent);
                              }}
                              placeholder="请输入图片路径或选择上传"
                              style={{ flex: 1 }}
                            />
                            <ImageUpload
                              onUploadSuccess={(imageUrl) => {
                                // 保存上传的URL到独立状态
                                imageComponentStateManager.setUserEditedUrl(
                                  selectedComponent.id,
                                  imageUrl,
                                );

                                // 立即更新组件显示（只在指定模式下）
                                const updatedComponent = {
                                  ...selectedComponent,
                                };
                                (updatedComponent as any).img_url = imageUrl;
                                // 同步更新 i18n_img_url
                                (updatedComponent as any).i18n_img_url = {
                                  'en-US': imageUrl,
                                };
                                onUpdateComponent(updatedComponent);
                              }}
                              style={{
                                borderRadius: '0 6px 6px 0',
                              }}
                              buttonProps={{
                                type: 'primary',
                                children: '上传',
                                title: '上传图片',
                              }}
                            />
                          </Space.Compact>
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
                                  // 绑定变量时
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
                                  // 同步更新 i18n_img_url
                                  (updatedComponent as any).i18n_img_url = {
                                    'en-US': variablePlaceholder,
                                  };
                                  onUpdateComponent(updatedComponent);
                                } else {
                                  // 清除变量绑定时
                                  setLastBoundVariables((prev) => {
                                    const newState = { ...prev };
                                    delete newState[selectedComponent.id];
                                    return newState;
                                  });

                                  imageComponentStateManager.setBoundVariableName(
                                    selectedComponent.id,
                                    '',
                                  );

                                  // 清除绑定变量后，根据当前模式决定显示的图片
                                  const updatedComponent = {
                                    ...selectedComponent,
                                  };

                                  if (imageContentMode === 'variable') {
                                    // 在变量模式下清除绑定，显示指定图片（如果有的话）
                                    const userEditedUrl =
                                      imageComponentStateManager.getUserEditedUrl(
                                        selectedComponent.id,
                                      );
                                    (updatedComponent as any).img_url =
                                      userEditedUrl || '';
                                    // 同步更新 i18n_img_url
                                    (updatedComponent as any).i18n_img_url = {
                                      'en-US': userEditedUrl || '',
                                    };
                                  } else {
                                    // 在指定模式下（理论上不会发生）
                                    (updatedComponent as any).img_url = '';
                                    // 同步更新 i18n_img_url
                                    (updatedComponent as any).i18n_img_url = {
                                      'en-US': '',
                                    };
                                  }

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
                    <Form.Item label="裁剪方式">
                      <Select
                        value={
                          (selectedComponent as any).style?.crop_mode ||
                          'default'
                        }
                        onChange={(value) =>
                          handleValueChange('crop_mode', value)
                        }
                        style={{ width: '100%' }}
                      >
                        <Option value="default">完整展示</Option>
                        <Option value="top">顶部裁剪</Option>
                        <Option value="center">居中裁剪</Option>
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

export default ImageComponent;
