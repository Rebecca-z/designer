// TextComponent 编辑界面 - 专门处理普通文本组件
import { ColorPicker, Form, Input, InputNumber, Segmented, Select } from 'antd';
import React, { useCallback, useMemo } from 'react';

import { textComponentStateManager } from '../../../Variable/utils/index';
import VariableBinding from '../../../Variable/VariableList';
import {
  ComponentContent,
  ComponentNameInput,
  PropertyPanel,
  SettingSection,
} from '../common';
import { useComponentName } from '../hooks/useComponentName';
import { CONTENT_MODES, TEXT_ALIGN_OPTIONS } from './constans';
import type { TextComponentProps, TextData } from './type';

const { TextArea } = Input;
const { Option } = Select;

const TextComponent: React.FC<TextComponentProps> = ({
  selectedComponent,
  variables,
  topLevelTab,
  setTopLevelTab,
  textContentMode,
  setTextContentMode,
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
    prefix: 'PlainText_',
    handleValueChange,
  });

  // 获取文本组件信息 - 使用useMemo优化
  const textInfo = useMemo(() => {
    const component = selectedComponent as any as TextData;
    return {
      content: component.content || '',
      style: {
        fontSize: component.style?.fontSize || 14,
        color: component.style?.color || '#000000',
        textAlign: component.style?.textAlign || 'left',
        numberOfLines: component.style?.numberOfLines,
      },
    };
  }, [selectedComponent]);

  // 获取绑定的变量名 - 使用useCallback优化
  const getBoundVariableName = useCallback(() => {
    const boundVariableName =
      textComponentStateManager.getBoundVariableName(selectedComponent.id) ||
      '';
    return boundVariableName;
  }, [selectedComponent.id]);

  // 计算变量绑定值 - 使用useMemo优化
  const variableBindingValue = useMemo(() => {
    // 在绑定变量模式下，优先显示记住的变量
    const rememberedVariable = selectedComponent
      ? lastBoundVariables[selectedComponent.id]
      : undefined;
    const currentBoundVariable = getBoundVariableName();

    // 如果有记住的变量，使用记住的变量；否则使用当前绑定的变量
    const displayValue = rememberedVariable || currentBoundVariable;

    return displayValue;
  }, [selectedComponent, lastBoundVariables, getBoundVariableName]);

  // 获取普通文本内容 - 使用useCallback优化
  const getTextContent = useCallback(() => {
    if (!selectedComponent) return '';

    if (textContentMode === 'specify') {
      // 指定模式：显示用户编辑的内容
      const userEditedContent = textComponentStateManager.getUserEditedContent(
        selectedComponent.id,
      );

      if (userEditedContent !== undefined) {
        return userEditedContent;
      }

      // 如果没有用户编辑的内容，使用组件原始内容
      return (selectedComponent as any).content || '';
    } else if (textContentMode === 'variable') {
      // 绑定变量模式：显示变量的实际值
      const boundVariableName = getBoundVariableName();
      const rememberedVariable = lastBoundVariables[selectedComponent.id];
      const variableName = rememberedVariable || boundVariableName;

      if (variableName) {
        // 查找变量并获取其值
        const variable = variables.find((v: any) => {
          if (typeof v === 'object' && v !== null) {
            const keys = getVariableKeys(v);
            return keys.length > 0 && keys[0] === variableName;
          }
          return false;
        });

        if (variable) {
          const variableValue = (variable as any)[variableName];
          // 普通文本：直接返回字符串值
          return String(variableValue);
        }
      }

      // 如果没有找到变量，显示提示信息
      return '请选择要绑定的变量';
    }

    return '';
  }, [
    selectedComponent,
    textContentMode,
    getBoundVariableName,
    lastBoundVariables,
    variables,
    getVariableKeys,
  ]);

  // 更新普通文本内容 - 使用useCallback优化
  const updateTextContent = useCallback(
    (value: string) => {
      // 保存用户编辑的内容到状态管理器
      textComponentStateManager.setUserEditedContent(
        selectedComponent.id,
        value,
      );

      // 创建更新的组件对象
      const updatedComponent = { ...selectedComponent };

      // 在"指定"模式下，立即更新DSL数据以反映到画布
      if (textContentMode === 'specify') {
        (updatedComponent as any).content = value;
        (updatedComponent as any).i18n_content = {
          'en-US': value,
        };
      }

      // 更新组件
      onUpdateComponent(updatedComponent);
    },
    [selectedComponent, textContentMode, onUpdateComponent],
  );

  // 文本对齐选项 - 使用useMemo优化
  const textAlignOptions = useMemo(() => {
    return TEXT_ALIGN_OPTIONS.map(({ value, label }) => (
      <Option key={value} value={value}>
        {label}
      </Option>
    ));
  }, []);

  // 组件内容 - 使用useMemo优化
  const componentTabContent = useMemo(
    () => (
      <>
        <SettingSection title="📝 内容设置" form={form}>
          <ComponentNameInput
            prefix="PlainText_"
            suffix={componentNameInfo.suffix}
            onChange={handleNameChange}
          />

          <Form.Item label="普通文本内容">
            {/* 内容模式切换 */}
            <Segmented
              value={textContentMode}
              style={{ marginBottom: 16 }}
              onChange={(value) => {
                const newMode = value as 'specify' | 'variable';
                if (selectedComponent) {
                  // 在切换模式前，先缓存当前模式的内容
                  if (textContentMode === 'specify') {
                    // 从指定模式切换出去时，缓存当前的文本内容
                    const currentContent = getTextContent();
                    textComponentStateManager.setUserEditedContent(
                      selectedComponent.id,
                      currentContent,
                    );
                  } else if (textContentMode === 'variable') {
                    // 从变量模式切换出去时，记住当前绑定的变量
                    const currentBoundVariable =
                      textComponentStateManager.getBoundVariableName(
                        selectedComponent.id,
                      );
                    if (currentBoundVariable) {
                      setLastBoundVariables((prev) => ({
                        ...prev,
                        [selectedComponent.id]: currentBoundVariable,
                      }));
                    }
                  }

                  // 切换模式
                  setTextContentMode(newMode);

                  const updatedComponent = { ...selectedComponent };

                  if (newMode === 'specify') {
                    // 切换到指定模式：恢复之前缓存的内容
                    const cachedContent =
                      textComponentStateManager.getUserEditedContent(
                        selectedComponent.id,
                      );

                    const contentToUse =
                      cachedContent !== undefined
                        ? cachedContent
                        : (selectedComponent as any).content || '文本内容';

                    (updatedComponent as any).content = contentToUse;
                    (updatedComponent as any).i18n_content = {
                      'en-US': contentToUse,
                    };

                    // 清除变量绑定
                    textComponentStateManager.setBoundVariableName(
                      selectedComponent.id,
                      undefined,
                    );
                  } else if (newMode === 'variable') {
                    // 切换到绑定变量模式：恢复之前记住的变量
                    const rememberedVariable =
                      lastBoundVariables[selectedComponent.id];

                    if (rememberedVariable) {
                      // 恢复之前绑定的变量
                      const variablePlaceholder = `\${${rememberedVariable}}`;
                      (updatedComponent as any).content = variablePlaceholder;
                      (updatedComponent as any).i18n_content = {
                        'en-US': variablePlaceholder,
                      };

                      textComponentStateManager.setBoundVariableName(
                        selectedComponent.id,
                        rememberedVariable,
                      );
                    } else {
                      // 没有记住的变量，清除绑定
                      textComponentStateManager.setBoundVariableName(
                        selectedComponent.id,
                        undefined,
                      );
                    }
                  }

                  onUpdateComponent(updatedComponent);
                }
              }}
              options={[...CONTENT_MODES]}
            />

            {/* 指定模式下的文本输入 */}
            {textContentMode === 'specify' && (
              <div style={{ marginBottom: 16 }}>
                <TextArea
                  value={getTextContent()}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    updateTextContent(e.target.value)
                  }
                  placeholder="请输入文本内容"
                  rows={4}
                  style={{ width: '100%' }}
                />
              </div>
            )}

            {/* 绑定变量模式 */}
            {textContentMode === 'variable' && (
              <div>
                <VariableBinding
                  componentType="plain_text"
                  variables={variables}
                  getFilteredVariables={getFilteredVariables}
                  value={variableBindingValue}
                  onChange={(value: string | undefined) => {
                    // 处理变量绑定逻辑
                    if (selectedComponent) {
                      if (value) {
                        setLastBoundVariables((prev) => ({
                          ...prev,
                          [selectedComponent.id]: value,
                        }));

                        const updatedComponent = { ...selectedComponent };
                        const variablePlaceholder = `\${${value}}`;
                        (updatedComponent as any).content = variablePlaceholder;
                        (updatedComponent as any).i18n_content = {
                          'en-US': variablePlaceholder,
                        };

                        textComponentStateManager.setBoundVariableName(
                          selectedComponent.id,
                          value,
                        );

                        onUpdateComponent(updatedComponent);
                      } else {
                        // 清除变量：回到指定模式，显示缓存的内容
                        textComponentStateManager.setBoundVariableName(
                          selectedComponent.id,
                          undefined,
                        );

                        // 获取缓存的指定模式内容
                        const cachedContent =
                          textComponentStateManager.getUserEditedContent(
                            selectedComponent.id,
                          );

                        const contentToUse =
                          cachedContent !== undefined
                            ? cachedContent
                            : (selectedComponent as any).content || '文本内容';

                        const updatedComponent = { ...selectedComponent };
                        (updatedComponent as any).content = contentToUse;
                        (updatedComponent as any).i18n_content = {
                          'en-US': contentToUse,
                        };

                        onUpdateComponent(updatedComponent);
                      }
                    }
                  }}
                  getVariableDisplayName={getVariableDisplayName}
                  getVariableKeys={getVariableKeys}
                  onAddVariable={() =>
                    handleAddVariableFromComponent('plain_text')
                  }
                  placeholder="请选择要绑定的变量"
                  label="绑定变量"
                  addVariableText="+新建变量"
                />
              </div>
            )}
          </Form.Item>
        </SettingSection>

        <SettingSection title="🎨 样式设置" form={form}>
          <Form.Item label="字体大小">
            <InputNumber
              value={textInfo.style.fontSize}
              onChange={(value) => handleValueChange('fontSize', value)}
              min={12}
              max={48}
              style={{ width: '100%' }}
              placeholder="设置字体大小"
              addonAfter="px"
            />
          </Form.Item>
          <Form.Item label="文字颜色">
            <ColorPicker
              value={textInfo.style.color}
              onChange={(color) =>
                handleValueChange('color', color.toHexString())
              }
              showText
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item label="文字对齐">
            <Select
              value={textInfo.style.textAlign}
              onChange={(value) => handleValueChange('textAlign', value)}
              style={{ width: '100%' }}
            >
              {textAlignOptions}
            </Select>
          </Form.Item>
          <Form.Item label="最大行数">
            <InputNumber
              value={textInfo.style.numberOfLines}
              onChange={(value) => handleValueChange('numberOfLines', value)}
              min={1}
              max={10}
              style={{ width: '100%' }}
              placeholder="不限制"
            />
          </Form.Item>
        </SettingSection>
      </>
    ),
    [
      textContentMode,
      setTextContentMode,
      getTextContent,
      updateTextContent,
      variableBindingValue,
      textInfo,
      textAlignOptions,
      form,
      selectedComponent,
      getBoundVariableName,
      lastBoundVariables,
      onUpdateComponent,
      setLastBoundVariables,
      variables,
      getFilteredVariables,
      getVariableDisplayName,
      getVariableKeys,
      handleAddVariableFromComponent,
      handleValueChange,
    ],
  );

  return (
    <PropertyPanel
      activeTab={topLevelTab}
      onTabChange={setTopLevelTab}
      componentContent={
        <ComponentContent componentName="文本组件">
          {componentTabContent}
        </ComponentContent>
      }
      variableManagementComponent={<VariableManagementPanel />}
      isVariableModalVisible={isVariableModalVisible}
      handleVariableModalOk={handleVariableModalOk}
      handleVariableModalCancel={handleVariableModalCancel}
      editingVariable={editingVariable}
      isVariableModalFromVariablesTab={isVariableModalFromVariablesTab}
      modalComponentType={modalComponentType}
      selectedComponentTag={selectedComponent?.tag}
    />
  );
};

export default TextComponent;
