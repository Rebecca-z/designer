// InputComponent 编辑界面 - 输入框组件
import { BgColorsOutlined, SettingOutlined } from '@ant-design/icons';
import {
  ColorPicker,
  Form,
  Input,
  InputNumber,
  Segmented,
  Select,
  Switch,
  Tabs,
  Typography,
} from 'antd';
import React from 'react';
import AddVariableModal from '../../../Variable/AddVariableModal';
import VariableBinding from '../../../Variable/VariableList';
import { InputComponentProps } from '../types';

const { Text } = Typography;
// const { TextArea } = Typography; // 暂时未使用
const { Option } = Select;

const InputComponent: React.FC<InputComponentProps> = ({
  selectedComponent,
  variables,
  topLevelTab,
  setTopLevelTab,
  inputPlaceholderMode,
  setInputPlaceholderMode,
  inputDefaultValueMode,
  setInputDefaultValueMode,
  // lastBoundVariables: _lastBoundVariables,
  // setLastBoundVariables: _setLastBoundVariables,
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

  console.log('📝 渲染输入框组件编辑界面:', {
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
                    backgroundColor: '#f6ffed',
                    border: '1px solid #b7eb8f',
                    borderRadius: '6px',
                  }}
                >
                  <Text style={{ fontSize: '12px', color: '#389e0d' }}>
                    🎯 当前选中：输入框组件
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
                    <Form.Item label="输入框类型">
                      <Select
                        value={(selectedComponent as any).input_type || 'text'}
                        onChange={(value) =>
                          handleValueChange('input_type', value)
                        }
                        style={{ width: '100%' }}
                      >
                        <Option value="text">文本</Option>
                        <Option value="number">数字</Option>
                        <Option value="email">邮箱</Option>
                        <Option value="password">密码</Option>
                        <Option value="tel">电话</Option>
                      </Select>
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

                {/* 占位符设置 */}
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
                    📝 占位符设置
                  </div>
                  <Form form={form} layout="vertical">
                    <Form.Item label="占位符">
                      <Segmented
                        value={inputPlaceholderMode}
                        style={{ marginBottom: 16 }}
                        onChange={(value) => {
                          setInputPlaceholderMode(
                            value as 'specify' | 'variable',
                          );
                        }}
                        options={[
                          { label: '指定', value: 'specify' },
                          { label: '绑定变量', value: 'variable' },
                        ]}
                      />

                      {inputPlaceholderMode === 'specify' && (
                        <Input
                          value={
                            (selectedComponent as any).placeholder?.content ||
                            ''
                          }
                          onChange={(e) => {
                            const updatedComponent = { ...selectedComponent };
                            (updatedComponent as any).placeholder = {
                              content: e.target.value,
                            };
                            onUpdateComponent(updatedComponent);
                          }}
                          placeholder="请输入占位符文本"
                        />
                      )}

                      {inputPlaceholderMode === 'variable' && (
                        <VariableBinding
                          componentType="input"
                          variables={variables}
                          getFilteredVariables={getFilteredVariables}
                          value={''}
                          onChange={() => {
                            // 处理变量绑定逻辑
                          }}
                          getVariableDisplayName={getVariableDisplayName}
                          getVariableKeys={getVariableKeys}
                          onAddVariable={() =>
                            handleAddVariableFromComponent('input')
                          }
                          placeholder="请选择占位符变量"
                          label="绑定变量"
                          addVariableText="+新建文本变量"
                        />
                      )}
                    </Form.Item>
                  </Form>
                </div>

                {/* 默认值设置 */}
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
                    🏷️ 默认值设置
                  </div>
                  <Form form={form} layout="vertical">
                    <Form.Item label="默认值">
                      <Segmented
                        value={inputDefaultValueMode}
                        style={{ marginBottom: 16 }}
                        onChange={(value) => {
                          setInputDefaultValueMode(
                            value as 'specify' | 'variable',
                          );
                        }}
                        options={[
                          { label: '指定', value: 'specify' },
                          { label: '绑定变量', value: 'variable' },
                        ]}
                      />

                      {inputDefaultValueMode === 'specify' && (
                        <Input
                          value={
                            (selectedComponent as any).default_value?.content ||
                            ''
                          }
                          onChange={(e) => {
                            const updatedComponent = { ...selectedComponent };
                            (updatedComponent as any).default_value = {
                              content: e.target.value,
                            };
                            onUpdateComponent(updatedComponent);
                          }}
                          placeholder="请输入默认值"
                        />
                      )}

                      {inputDefaultValueMode === 'variable' && (
                        <VariableBinding
                          componentType="input"
                          variables={variables}
                          getFilteredVariables={getFilteredVariables}
                          value={''}
                          onChange={() => {
                            // 处理变量绑定逻辑
                          }}
                          getVariableDisplayName={getVariableDisplayName}
                          getVariableKeys={getVariableKeys}
                          onAddVariable={() =>
                            handleAddVariableFromComponent('input')
                          }
                          placeholder="请选择默认值变量"
                          label="绑定变量"
                          addVariableText="+新建变量"
                        />
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
                    <Form.Item label="字体大小">
                      <InputNumber
                        value={(selectedComponent as any).style?.fontSize || 14}
                        onChange={(value) =>
                          handleValueChange('fontSize', value)
                        }
                        min={12}
                        max={24}
                        style={{ width: '100%' }}
                        placeholder="设置字体大小"
                        addonAfter="px"
                      />
                    </Form.Item>
                    <Form.Item label="文字颜色">
                      <ColorPicker
                        value={
                          (selectedComponent as any).style?.color || '#000000'
                        }
                        onChange={(color) =>
                          handleValueChange('color', color.toHexString())
                        }
                        showText
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                    <Form.Item label="背景颜色">
                      <ColorPicker
                        value={
                          (selectedComponent as any).style?.backgroundColor ||
                          '#ffffff'
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

export default InputComponent;
