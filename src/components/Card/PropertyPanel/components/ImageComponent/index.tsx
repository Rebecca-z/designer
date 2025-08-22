// ImageComponent 编辑界面 - 图片组件
import { Form, Input, Segmented, Select, Space } from 'antd';
import React, { useCallback, useMemo } from 'react';
import ImageUpload from '../../../ImageUpload';
import { imageComponentStateManager } from '../../../Variable/utils/index';
import VariableBinding from '../../../Variable/VariableList';
import { ComponentContent, PropertyPanel, SettingSection } from '../common';
import ComponentNameInput from '../common/ComponentNameInput';
import { useComponentName } from '../hooks/useComponentName';
import { ImageComponentProps } from '../types';

const { Option } = Select;

// 类型定义
interface ImageData {
  img_url?: string;
  i18n_img_url?: {
    'en-US': string;
  };
  style?: {
    crop_mode?: 'default' | 'top' | 'center';
  };
}

// 常量定义
const CROP_MODES = [
  { value: 'default', label: '完整展示' },
  { value: 'top', label: '顶部裁剪' },
  { value: 'center', label: '居中裁剪' },
] as const;

const CONTENT_MODES = [
  { label: '指定', value: 'specify' },
  { label: '绑定变量', value: 'variable' },
] as const;

// 样式常量（保留必要的样式）
const STYLES = {
  inputCompact: {
    width: '100%',
  },
  uploadButton: {
    borderRadius: '0 6px 6px 0',
  },
} as const;

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

  // 使用通用的组件名称编辑Hook
  const { componentNameInfo, handleNameChange } = useComponentName({
    selectedComponent,
    prefix: 'Img_',
    handleValueChange,
  });

  // 获取图片信息 - 使用useMemo优化
  const imageInfo = useMemo(() => {
    const component = selectedComponent as any as ImageData;
    return {
      imgUrl: component.img_url || '',
      cropMode: component.style?.crop_mode || 'default',
      userEditedUrl:
        imageComponentStateManager.getUserEditedUrl(selectedComponent.id) || '',
    };
  }, [selectedComponent]);

  // 获取变量绑定信息 - 使用useMemo优化
  const variableBindingInfo = useMemo(() => {
    const rememberedVariable = lastBoundVariables[selectedComponent.id];
    const currentBoundVariable =
      imageComponentStateManager.getBoundVariableName(selectedComponent.id);
    const displayValue = rememberedVariable || currentBoundVariable;

    return {
      rememberedVariable,
      currentBoundVariable,
      displayValue,
    };
  }, [selectedComponent.id, lastBoundVariables]);

  // 处理模式切换 - 使用useCallback优化
  const handleModeChange = useCallback(
    (value: 'specify' | 'variable') => {
      setImageContentMode(value);

      const updatedComponent = { ...selectedComponent };

      if (value === 'specify') {
        // 切换到指定模式：显示用户编辑的图片
        const userEditedUrl = imageComponentStateManager.getUserEditedUrl(
          selectedComponent.id,
        );
        (updatedComponent as any).img_url = userEditedUrl || '';
        (updatedComponent as any).i18n_img_url = {
          'en-US': userEditedUrl || '',
        };
      } else {
        // 切换到变量模式：检查是否有绑定的变量
        const boundVariable = imageComponentStateManager.getBoundVariableName(
          selectedComponent.id,
        );
        const rememberedVariable = lastBoundVariables[selectedComponent.id];

        if (boundVariable || rememberedVariable) {
          const variableName = boundVariable || rememberedVariable;
          const variablePlaceholder = `\${${variableName}}`;
          (updatedComponent as any).img_url = variablePlaceholder;
          (updatedComponent as any).i18n_img_url = {
            'en-US': variablePlaceholder,
          };
        } else {
          const userEditedUrl = imageComponentStateManager.getUserEditedUrl(
            selectedComponent.id,
          );
          (updatedComponent as any).img_url = userEditedUrl || '';
          (updatedComponent as any).i18n_img_url = {
            'en-US': userEditedUrl || '',
          };
        }
      }

      onUpdateComponent(updatedComponent);
    },
    [
      selectedComponent,
      setImageContentMode,
      lastBoundVariables,
      onUpdateComponent,
    ],
  );

  // 处理图片URL变化 - 使用useCallback优化
  const handleImageUrlChange = useCallback(
    (url: string) => {
      imageComponentStateManager.setUserEditedUrl(selectedComponent.id, url);

      const updatedComponent = { ...selectedComponent };
      (updatedComponent as any).img_url = url;
      (updatedComponent as any).i18n_img_url = {
        'en-US': url,
      };
      onUpdateComponent(updatedComponent);
    },
    [selectedComponent, onUpdateComponent],
  );

  // 处理变量绑定变化 - 使用useCallback优化
  const handleVariableBindingChange = useCallback(
    (value: string | undefined) => {
      if (!selectedComponent) return;

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

        const updatedComponent = { ...selectedComponent };
        const variablePlaceholder = `\${${value}}`;
        (updatedComponent as any).img_url = variablePlaceholder;
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

        const updatedComponent = { ...selectedComponent };
        if (imageContentMode === 'variable') {
          const userEditedUrl = imageComponentStateManager.getUserEditedUrl(
            selectedComponent.id,
          );
          (updatedComponent as any).img_url = userEditedUrl || '';
          (updatedComponent as any).i18n_img_url = {
            'en-US': userEditedUrl || '',
          };
        } else {
          (updatedComponent as any).img_url = '';
          (updatedComponent as any).i18n_img_url = {
            'en-US': '',
          };
        }

        onUpdateComponent(updatedComponent);
      }
    },
    [
      selectedComponent,
      setLastBoundVariables,
      imageContentMode,
      onUpdateComponent,
    ],
  );

  // 渲染图片设置内容 - 使用useMemo优化
  const imageSettingsContent = useMemo(
    () => (
      <SettingSection title="🖼️ 图片设置" form={form}>
        <Form.Item label="图片来源">
          <Segmented
            value={imageContentMode}
            style={{ marginBottom: 16 }}
            onChange={handleModeChange}
            options={[...CONTENT_MODES]}
          />

          {imageContentMode === 'specify' && (
            <div>
              <Space.Compact style={STYLES.inputCompact}>
                <Input
                  value={imageInfo.userEditedUrl}
                  onChange={(e) => handleImageUrlChange(e.target.value)}
                  placeholder="请输入图片路径或选择上传"
                  style={{ flex: 1 }}
                />
                <ImageUpload
                  onUploadSuccess={handleImageUrlChange}
                  style={STYLES.uploadButton}
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
                value={variableBindingInfo.displayValue}
                onChange={handleVariableBindingChange}
                getVariableDisplayName={getVariableDisplayName}
                getVariableKeys={getVariableKeys}
                onAddVariable={() => handleAddVariableFromComponent('img')}
                placeholder="请选择图片变量"
                label="绑定变量"
                addVariableText="+新建图片变量"
              />
            </div>
          )}
        </Form.Item>
      </SettingSection>
    ),
    [
      form,
      imageContentMode,
      handleModeChange,
      imageInfo.userEditedUrl,
      handleImageUrlChange,
      variables,
      getFilteredVariables,
      variableBindingInfo.displayValue,
      handleVariableBindingChange,
      getVariableDisplayName,
      getVariableKeys,
      handleAddVariableFromComponent,
    ],
  );

  // 渲染组件设置内容 - 使用useMemo优化
  const componentSettingsContent = useMemo(
    () => (
      <SettingSection title="🏷️ 组件设置" useForm={false}>
        <ComponentNameInput
          prefix="Img_"
          suffix={componentNameInfo.suffix}
          onChange={handleNameChange}
        />
      </SettingSection>
    ),
    [componentNameInfo.suffix, handleNameChange],
  );

  // 渲染样式设置内容 - 使用useMemo优化
  const styleSettingsContent = useMemo(
    () => (
      <SettingSection title="🎨 样式设置" form={form}>
        <Form.Item label="裁剪方式">
          <Select
            value={imageInfo.cropMode}
            onChange={(value) => handleValueChange('crop_mode', value)}
            style={{ width: '100%' }}
          >
            {CROP_MODES.map(({ value, label }) => (
              <Option key={value} value={value}>
                {label}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </SettingSection>
    ),
    [form, imageInfo.cropMode, handleValueChange],
  );

  // 渲染组件属性Tab内容 - 使用useMemo优化
  const componentTabContent = useMemo(
    () => (
      <>
        {componentSettingsContent}
        {imageSettingsContent}
        {styleSettingsContent}
      </>
    ),
    [componentSettingsContent, imageSettingsContent, styleSettingsContent],
  );

  return (
    <PropertyPanel
      activeTab={topLevelTab}
      onTabChange={setTopLevelTab}
      componentContent={
        <ComponentContent componentName="图片">
          {componentTabContent}
        </ComponentContent>
      }
      variableManagementComponent={<VariableManagementPanel />}
      isVariableModalVisible={isVariableModalVisible}
      handleVariableModalOk={handleVariableModalOk || (() => {})}
      handleVariableModalCancel={handleVariableModalCancel || (() => {})}
      editingVariable={editingVariable}
      isVariableModalFromVariablesTab={isVariableModalFromVariablesTab}
      modalComponentType={modalComponentType}
      selectedComponentTag={selectedComponent?.tag}
    />
  );
};

export default ImageComponent;
