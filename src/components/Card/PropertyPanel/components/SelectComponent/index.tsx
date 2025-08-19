// SelectComponent 编辑界面 - 下拉单选组件
import {
  BgColorsOutlined,
  DeleteOutlined,
  PlusOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Button, Form, Input, Segmented, Switch, Tabs, Typography } from 'antd';
import React from 'react';
import AddVariableModal from '../../../Variable/AddVariableModal';
import VariableBinding from '../../../Variable/VariableList';
import { selectComponentStateManager } from '../../../Variable/utils/index';
import { SelectComponentProps } from '../types';

const { Text } = Typography;

const SelectComponent: React.FC<SelectComponentProps> = ({
  selectedComponent,
  variables,
  topLevelTab,
  setTopLevelTab,
  selectOptionsMode,
  setSelectOptionsMode,
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

  console.log('📝 渲染下拉单选组件编辑界面:', {
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
                    🎯 当前选中：下拉单选组件
                  </Text>
                </div>

                {/* 基础设置 */}
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
                    ⚙️ 基础设置
                  </div>
                  <Form form={form} layout="vertical">
                    <Form.Item label="占位符">
                      <Input
                        value={(selectedComponent as any).placeholder || ''}
                        onChange={(e) =>
                          handleValueChange('placeholder', e.target.value)
                        }
                        placeholder="请选择..."
                      />
                    </Form.Item>
                    <Form.Item label="必填">
                      <Switch
                        checked={(selectedComponent as any).required || false}
                        onChange={(checked) =>
                          handleValueChange('required', checked)
                        }
                      />
                    </Form.Item>
                    <Form.Item label="禁用">
                      <Switch
                        checked={(selectedComponent as any).disabled || false}
                        onChange={(checked) =>
                          handleValueChange('disabled', checked)
                        }
                      />
                    </Form.Item>
                  </Form>
                </div>

                {/* 选项设置 */}
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
                    📋 选项设置
                  </div>
                  <Form form={form} layout="vertical">
                    <Form.Item label="选项来源">
                      <Segmented
                        value={selectOptionsMode}
                        style={{ marginBottom: 16 }}
                        onChange={(value) => {
                          setSelectOptionsMode(value as 'specify' | 'variable');
                        }}
                        options={[
                          { label: '指定', value: 'specify' },
                          { label: '绑定变量', value: 'variable' },
                        ]}
                      />

                      {selectOptionsMode === 'specify' && (
                        <div style={{ marginBottom: 16 }}>
                          <Text
                            strong
                            style={{ marginBottom: 8, display: 'block' }}
                          >
                            选项列表
                          </Text>
                          {((selectedComponent as any).options || []).map(
                            (option: any, index: number) => (
                              <div
                                key={index}
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
                                    选项 {index + 1}
                                  </Text>
                                  <Button
                                    type="text"
                                    size="small"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => {
                                      const newOptions = [
                                        ...(selectedComponent as any).options,
                                      ];
                                      newOptions.splice(index, 1);
                                      handleValueChange('options', newOptions);
                                    }}
                                  />
                                </div>
                                <Input
                                  value={option.label || ''}
                                  onChange={(e) => {
                                    const newOptions = [
                                      ...(selectedComponent as any).options,
                                    ];
                                    newOptions[index] = {
                                      ...option,
                                      label: e.target.value,
                                      value: e.target.value,
                                    };
                                    handleValueChange('options', newOptions);
                                  }}
                                  placeholder="选项名称"
                                />
                              </div>
                            ),
                          )}
                          <Button
                            type="dashed"
                            block
                            icon={<PlusOutlined />}
                            onClick={() => {
                              const newOptions = [
                                ...((selectedComponent as any).options || []),
                              ];
                              newOptions.push({
                                label: `选项${newOptions.length + 1}`,
                                value: `option${newOptions.length + 1}`,
                              });
                              handleValueChange('options', newOptions);
                            }}
                          >
                            添加选项
                          </Button>
                        </div>
                      )}

                      {selectOptionsMode === 'variable' && (
                        <div>
                          <VariableBinding
                            componentType="select_static"
                            variables={variables}
                            getFilteredVariables={getFilteredVariables}
                            value={(() => {
                              const rememberedVariable = selectedComponent
                                ? lastBoundVariables[selectedComponent.id]
                                : undefined;
                              const currentBoundVariable =
                                selectComponentStateManager.getBoundVariableName(
                                  selectedComponent.id,
                                );
                              return rememberedVariable || currentBoundVariable;
                            })()}
                            onChange={(value: string | undefined) => {
                              // 处理变量绑定逻辑
                              if (selectedComponent) {
                                if (value) {
                                  setLastBoundVariables((prev) => ({
                                    ...prev,
                                    [selectedComponent.id]: value,
                                  }));
                                  selectComponentStateManager.setBoundVariableName(
                                    selectedComponent.id,
                                    value,
                                  );
                                } else {
                                  setLastBoundVariables((prev) => {
                                    const newState = { ...prev };
                                    delete newState[selectedComponent.id];
                                    return newState;
                                  });
                                  selectComponentStateManager.setBoundVariableName(
                                    selectedComponent.id,
                                    '',
                                  );
                                }
                              }
                            }}
                            getVariableDisplayName={getVariableDisplayName}
                            getVariableKeys={getVariableKeys}
                            onAddVariable={() =>
                              handleAddVariableFromComponent('select_static')
                            }
                            placeholder="请选择选项变量"
                            label="绑定变量"
                            addVariableText="+新建数组变量"
                          />
                        </div>
                      )}
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

export default SelectComponent;
