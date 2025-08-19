// ImgCombinationComponent 编辑界面 - 多图混排组件
import {
  BgColorsOutlined,
  DeleteOutlined,
  PlusOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import {
  Button,
  Form,
  InputNumber,
  Segmented,
  Select,
  Tabs,
  Typography,
} from 'antd';
import React from 'react';
import ImageUpload from '../../../ImageUpload';
import AddVariableModal from '../../../Variable/AddVariableModal';
import VariableBinding from '../../../Variable/VariableList';
import { multiImageComponentStateManager } from '../../../Variable/utils/index';
import { ImgCombinationComponentProps } from '../types';

const { Text } = Typography;
const { Option } = Select;

const ImgCombinationComponent: React.FC<ImgCombinationComponentProps> = ({
  selectedComponent,
  variables,
  topLevelTab,
  setTopLevelTab,
  multiImageContentMode,
  setMultiImageContentMode,
  lastBoundVariables,
  setLastBoundVariables,
  // onUpdateComponent: _,
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

  console.log('📝 渲染多图混排组件编辑界面:', {
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
                    🎯 当前选中：多图混排组件
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
                        value={multiImageContentMode}
                        style={{ marginBottom: 16 }}
                        onChange={(value) => {
                          setMultiImageContentMode(
                            value as 'specify' | 'variable',
                          );
                        }}
                        options={[
                          { label: '指定', value: 'specify' },
                          { label: '绑定变量', value: 'variable' },
                        ]}
                      />

                      {multiImageContentMode === 'specify' && (
                        <div style={{ marginBottom: 16 }}>
                          <Text
                            strong
                            style={{ marginBottom: 8, display: 'block' }}
                          >
                            图片列表
                          </Text>
                          {((selectedComponent as any).images || []).map(
                            (image: any, index: number) => (
                              <div
                                key={`image-${index}`}
                                style={{
                                  marginBottom: 8,
                                  padding: '8px',
                                  border: '1px solid #d9d9d9',
                                  borderRadius: '4px',
                                }}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    marginBottom: 8,
                                  }}
                                >
                                  <Text style={{ flex: 1 }}>
                                    图片 {index + 1}
                                  </Text>
                                  <Button
                                    type="text"
                                    size="small"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => {
                                      const newImages = [
                                        ...(selectedComponent as any).images,
                                      ];
                                      newImages.splice(index, 1);
                                      handleValueChange('images', newImages);
                                    }}
                                  />
                                </div>
                                <ImageUpload
                                  value={image.url || ''}
                                  onChange={(url: string) => {
                                    const newImages = [
                                      ...(selectedComponent as any).images,
                                    ];
                                    newImages[index] = { ...image, url };
                                    handleValueChange('images', newImages);
                                  }}
                                  placeholder="请上传图片或输入图片URL"
                                />
                              </div>
                            ),
                          )}
                          <Button
                            type="dashed"
                            block
                            icon={<PlusOutlined />}
                            onClick={() => {
                              const newImages = [
                                ...((selectedComponent as any).images || []),
                              ];
                              newImages.push({
                                url: '',
                                alt: `图片${newImages.length + 1}`,
                              });
                              handleValueChange('images', newImages);
                            }}
                          >
                            添加图片
                          </Button>
                        </div>
                      )}

                      {multiImageContentMode === 'variable' && (
                        <div>
                          <VariableBinding
                            componentType="img_combination"
                            variables={variables}
                            getFilteredVariables={getFilteredVariables}
                            value={(() => {
                              const rememberedVariable = selectedComponent
                                ? lastBoundVariables[selectedComponent.id]
                                : undefined;
                              const currentBoundVariable =
                                multiImageComponentStateManager.getBoundVariableName(
                                  selectedComponent.id,
                                );
                              return rememberedVariable || currentBoundVariable;
                            })()}
                            onChange={(value: string | undefined) => {
                              if (selectedComponent) {
                                if (value) {
                                  setLastBoundVariables((prev) => ({
                                    ...prev,
                                    [selectedComponent.id]: value,
                                  }));
                                  multiImageComponentStateManager.setBoundVariableName(
                                    selectedComponent.id,
                                    value,
                                  );
                                } else {
                                  setLastBoundVariables((prev) => {
                                    const newState = { ...prev };
                                    delete newState[selectedComponent.id];
                                    return newState;
                                  });
                                  multiImageComponentStateManager.setBoundVariableName(
                                    selectedComponent.id,
                                    '',
                                  );
                                }
                              }
                            }}
                            getVariableDisplayName={getVariableDisplayName}
                            getVariableKeys={getVariableKeys}
                            onAddVariable={() =>
                              handleAddVariableFromComponent('img_combination')
                            }
                            placeholder="请选择要绑定的变量"
                            label="绑定变量"
                            addVariableText="+新建图片数组变量"
                          />
                        </div>
                      )}
                    </Form.Item>
                  </Form>
                </div>

                {/* 布局设置 */}
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
                    📐 布局设置
                  </div>
                  <Form form={form} layout="vertical">
                    <Form.Item label="排列方式">
                      <Select
                        value={(selectedComponent as any).layout || 'grid'}
                        onChange={(value) => handleValueChange('layout', value)}
                        style={{ width: '100%' }}
                      >
                        <Option value="grid">网格布局</Option>
                        <Option value="horizontal">水平排列</Option>
                        <Option value="vertical">垂直排列</Option>
                      </Select>
                    </Form.Item>
                    <Form.Item label="每行图片数量">
                      <InputNumber
                        value={(selectedComponent as any).columns || 2}
                        onChange={(value) =>
                          handleValueChange('columns', value)
                        }
                        min={1}
                        max={4}
                        style={{ width: '100%' }}
                        placeholder="设置每行图片数量"
                      />
                    </Form.Item>
                    <Form.Item label="图片间距">
                      <InputNumber
                        value={(selectedComponent as any).spacing || 8}
                        onChange={(value) =>
                          handleValueChange('spacing', value)
                        }
                        min={0}
                        max={20}
                        style={{ width: '100%' }}
                        placeholder="设置图片间距"
                        addonAfter="px"
                      />
                    </Form.Item>
                    <Form.Item label="图片圆角">
                      <InputNumber
                        value={(selectedComponent as any).borderRadius || 4}
                        onChange={(value) =>
                          handleValueChange('borderRadius', value)
                        }
                        min={0}
                        max={20}
                        style={{ width: '100%' }}
                        placeholder="设置图片圆角"
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

export default ImgCombinationComponent;
