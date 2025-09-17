import { Form, Input, Segmented, Select } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import VariableBinding from '../../../Variable/VariableList';
import { titleComponentStateManager } from '../../../Variable/utils/component-state';
import { variableCacheManager } from '../../../Variable/utils/variable-cache';
import { CONTENT_MODES } from '../InputComponent/constans';
import { PropertyPanel, SettingSection } from '../common';
import { BaseComponentProps } from '../types';
import { THEME_COLORS } from './constans';
import type { TitleData } from './type';

const { Option } = Select;

// 颜色样本样式
const colorSwatchStyle = {
  width: '12px',
  height: '12px',
  borderRadius: '2px',
  marginRight: '8px',
} as const;

const TitleComponent: React.FC<BaseComponentProps> = ({
  selectedComponent,
  topLevelTab,
  setTopLevelTab,
  handleValueChange,
  variables,
  getFilteredVariables,
  getVariableDisplayName,
  getVariableKeys,
  handleAddVariableFromComponent,
  lastBoundVariables,
  setLastBoundVariables,
  onUpdateComponent,
  VariableManagementPanel,
  isVariableModalVisible,
  handleVariableModalOk,
  handleVariableModalCancel,
  editingVariable,
  modalComponentType,
}) => {
  const [form] = Form.useForm();

  // 主标题模式状态管理
  const [titleMode, setTitleMode] = useState<'specify' | 'variable'>('specify');
  // 副标题模式状态管理
  const [subtitleMode, setSubtitleMode] = useState<'specify' | 'variable'>(
    'specify',
  );

  // 获取标题组件信息 - 使用useMemo优化
  const titleInfo = useMemo(() => {
    const component = selectedComponent as any as TitleData;
    return {
      title: component.title || component.content || '主标题',
      subtitle: component.subtitle || '副标题',
      style: component.style || 'blue',
    };
  }, [selectedComponent]);

  // 获取变量绑定信息 - 不使用useMemo，确保每次都获取最新状态
  const variableBindingInfo = (() => {
    const titleVariable =
      titleComponentStateManager.getBoundTitleVariableName(
        selectedComponent.id,
      ) || '';
    const subtitleVariable =
      titleComponentStateManager.getBoundSubtitleVariableName(
        selectedComponent.id,
      ) || '';

    return {
      titleVariable,
      subtitleVariable,
    };
  })();

  // 初始化模式状态
  useEffect(() => {
    const component = selectedComponent as any as TitleData;

    // 检测标题中的变量绑定
    const titleContent = component.title || component.content || '';
    if (titleContent.startsWith('${') && titleContent.endsWith('}')) {
      const variableName = titleContent.slice(2, -1);
      const currentBinding =
        titleComponentStateManager.getBoundTitleVariableName(
          selectedComponent.id,
        );
      if (currentBinding !== variableName) {
        titleComponentStateManager.setBoundTitleVariableName(
          selectedComponent.id,
          variableName,
        );

        if (titleMode !== 'variable') {
          setTitleMode('variable');
        }
      }
    }

    // 检测副标题中的变量绑定
    const subtitleContent = component.subtitle || '';
    if (subtitleContent.startsWith('${') && subtitleContent.endsWith('}')) {
      const variableName = subtitleContent.slice(2, -1);
      const currentBinding =
        titleComponentStateManager.getBoundSubtitleVariableName(
          selectedComponent.id,
        );
      if (currentBinding !== variableName) {
        titleComponentStateManager.setBoundSubtitleVariableName(
          selectedComponent.id,
          variableName,
        );

        if (subtitleMode !== 'variable') {
          setSubtitleMode('variable');
        }
      }
    }
  }, [selectedComponent.id, selectedComponent, titleMode, subtitleMode]);

  // 专门处理标题组件数据更新的函数
  const updateTitleData = useCallback(
    (field: string, value: any) => {
      console.log('🔄 更新标题组件数据:', { field, value, selectedComponent });

      // 对于标题组件，需要特殊处理数据结构
      if (field === 'title') {
        // 更新标题内容
        const updatedComponent = {
          ...selectedComponent,
          title: value,
        };
        console.log('📝 更新标题内容:', updatedComponent);

        // 如果当前是指定模式，保存用户编辑的内容到状态管理器
        if (titleMode === 'specify') {
          titleComponentStateManager.setUserEditedTitle(
            selectedComponent.id,
            value,
          );
        }

        onUpdateComponent(updatedComponent);
      } else if (field === 'subtitle') {
        // 更新副标题内容
        const updatedComponent = {
          ...selectedComponent,
          subtitle: value,
        };
        console.log('📝 更新副标题内容:', updatedComponent);

        // 如果当前是指定模式，保存用户编辑的内容到状态管理器
        if (subtitleMode === 'specify') {
          titleComponentStateManager.setUserEditedSubtitle(
            selectedComponent.id,
            value,
          );
        }

        onUpdateComponent(updatedComponent);
      } else if (field === 'style') {
        // 更新样式
        const updatedComponent = {
          ...selectedComponent,
          style: value,
        };
        console.log('📝 更新样式:', updatedComponent);
        onUpdateComponent(updatedComponent);
      } else {
        // 其他字段使用默认处理
        handleValueChange(field, value);
      }
    },
    [
      selectedComponent,
      onUpdateComponent,
      handleValueChange,
      titleMode,
      subtitleMode,
    ],
  );

  // 处理模式切换 - 参考InputComponent的handlePlaceholderModeChange方法
  const handleTitleModeChange = useCallback(
    (value: 'specify' | 'variable') => {
      setTitleMode(value);

      // 记住当前状态
      if (value === 'variable') {
        const currentContent =
          (selectedComponent as any).title ||
          (selectedComponent as any).content ||
          '';
        titleComponentStateManager.setUserEditedTitle(
          selectedComponent.id,
          currentContent,
        );
      } else if (value === 'specify') {
        const boundVariable =
          titleComponentStateManager.getBoundTitleVariableName(
            selectedComponent.id,
          );
        if (boundVariable) {
          setLastBoundVariables((prev) => ({
            ...prev,
            [`${selectedComponent.id}_title`]: boundVariable,
          }));
        }
      }

      const updatedComponent = { ...selectedComponent };
      // 更新最新状态
      if (value === 'specify') {
        // 清除绑定的变量名
        const userEditedTitle = titleComponentStateManager.getUserEditedTitle(
          selectedComponent.id,
        );
        const content = userEditedTitle || '主标题';
        (updatedComponent as any).title = content;
        titleComponentStateManager.setBoundTitleVariableName(
          selectedComponent.id,
          undefined,
        );
      } else if (value === 'variable') {
        const boundVariable =
          lastBoundVariables[`${selectedComponent.id}_title`];
        if (boundVariable) {
          const variableTitle = `\${${boundVariable}}`;
          (updatedComponent as any).title = variableTitle;
        }
        titleComponentStateManager.setBoundTitleVariableName(
          selectedComponent.id,
          boundVariable,
        );
      } else {
        titleComponentStateManager.setBoundTitleVariableName(
          selectedComponent.id,
          undefined,
        );
      }

      onUpdateComponent(updatedComponent);
    },
    [
      selectedComponent,
      setLastBoundVariables,
      onUpdateComponent,
      lastBoundVariables,
    ],
  );

  // 处理副标题模式切换 - 参考主标题的实现
  const handleSubtitleModeChange = useCallback(
    (value: 'specify' | 'variable') => {
      setSubtitleMode(value);

      // 记住当前状态
      if (value === 'variable') {
        const currentContent = (selectedComponent as any).subtitle || '';
        titleComponentStateManager.setUserEditedSubtitle(
          selectedComponent.id,
          currentContent,
        );
      } else if (value === 'specify') {
        const boundVariable =
          titleComponentStateManager.getBoundSubtitleVariableName(
            selectedComponent.id,
          );
        if (boundVariable) {
          setLastBoundVariables((prev) => ({
            ...prev,
            [`${selectedComponent.id}_subtitle`]: boundVariable,
          }));
        }
      }

      const updatedComponent = { ...selectedComponent };
      // 更新最新状态
      if (value === 'specify') {
        // 清除绑定的变量名
        const userEditedSubtitle =
          titleComponentStateManager.getUserEditedSubtitle(
            selectedComponent.id,
          );
        const content = userEditedSubtitle || '副标题';
        (updatedComponent as any).subtitle = content;
        titleComponentStateManager.setBoundSubtitleVariableName(
          selectedComponent.id,
          undefined,
        );
      } else if (value === 'variable') {
        const boundVariable =
          lastBoundVariables[`${selectedComponent.id}_subtitle`];
        if (boundVariable) {
          const variableSubtitle = `\${${boundVariable}}`;
          (updatedComponent as any).subtitle = variableSubtitle;
        }
        titleComponentStateManager.setBoundSubtitleVariableName(
          selectedComponent.id,
          boundVariable,
        );
      } else {
        titleComponentStateManager.setBoundSubtitleVariableName(
          selectedComponent.id,
          undefined,
        );
      }

      onUpdateComponent(updatedComponent);
    },
    [
      selectedComponent,
      setLastBoundVariables,
      onUpdateComponent,
      lastBoundVariables,
    ],
  );

  // 处理变量绑定变化 - 参考InputComponent的模式
  const handleTitleVariableBindingChange = useCallback(
    (variableName: string | undefined) => {
      // setTitleVariableBinding(variableName);

      if (variableName) {
        // 更新组件状态管理器
        titleComponentStateManager.setBoundTitleVariableName(
          selectedComponent.id,
          variableName,
        );

        // 更新组件数据
        const updatedComponent = { ...selectedComponent };
        (updatedComponent as any).title = `\${${variableName}}`;
        onUpdateComponent(updatedComponent);

        // 将变量值存入variableCacheManager
        const variableValue = variableCacheManager.getVariable(variableName);
        if (variableValue !== undefined) {
          console.log('📦 从变量缓存获取值:', { variableName, variableValue });
        }
      } else {
        // 清除变量绑定，恢复为默认标题
        console.log('❌ 清除变量绑定，恢复默认标题');

        // 清除组件状态管理器中的绑定
        titleComponentStateManager.setBoundTitleVariableName(
          selectedComponent.id,
          undefined,
        );

        // 恢复用户编辑的内容
        const userEditedTitle = titleComponentStateManager.getUserEditedTitle(
          selectedComponent.id,
        );
        const content = userEditedTitle || '主标题';

        // 更新组件数据
        const updatedComponent = { ...selectedComponent };
        (updatedComponent as any).title = content;
        onUpdateComponent(updatedComponent);
      }
    },
    [selectedComponent, onUpdateComponent, titleMode],
  );

  // 处理副标题变量绑定变化 - 参考主标题的实现
  const handleSubtitleVariableBindingChange = useCallback(
    (variableName: string | undefined) => {
      if (variableName) {
        // 更新组件状态管理器
        titleComponentStateManager.setBoundSubtitleVariableName(
          selectedComponent.id,
          variableName,
        );

        // 更新组件数据
        const updatedComponent = { ...selectedComponent };
        (updatedComponent as any).subtitle = `\${${variableName}}`;
        onUpdateComponent(updatedComponent);

        // 将变量值存入variableCacheManager
        const variableValue = variableCacheManager.getVariable(variableName);
        if (variableValue !== undefined) {
          console.log('📦 从变量缓存获取副标题值:', {
            variableName,
            variableValue,
          });
        }
      } else {
        // 清除变量绑定，恢复为默认副标题
        console.log('❌ 清除副标题变量绑定，恢复默认副标题');
        // 清除组件状态管理器中的绑定
        titleComponentStateManager.setBoundSubtitleVariableName(
          selectedComponent.id,
          undefined,
        );
        // 恢复用户编辑的内容
        const userEditedSubtitle =
          titleComponentStateManager.getUserEditedSubtitle(
            selectedComponent.id,
          );
        const content = userEditedSubtitle || '副标题';

        // 更新组件数据
        const updatedComponent = { ...selectedComponent };
        (updatedComponent as any).subtitle = content;
        onUpdateComponent(updatedComponent);
      }
    },
    [selectedComponent, onUpdateComponent, subtitleMode],
  );

  // 创建更新函数 - 使用useCallback优化
  const updateTitleComponent = useCallback(
    (field: string, value: any) => {
      updateTitleData(field, value);
    },
    [updateTitleData],
  );

  // 生成主题颜色选项 - 使用useMemo优化
  const themeColorOptions = useMemo(() => {
    return THEME_COLORS.map(({ value, label, color }) => (
      <Option key={value} value={value}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ ...colorSwatchStyle, backgroundColor: color }} />
          {label}
        </div>
      </Option>
    ));
  }, []);

  // 组件属性内容
  const componentContent = useMemo(
    () => (
      <>
        <SettingSection title="📝 内容设置" form={form}>
          {/* <ComponentNameInput
            prefix="Title_"
            suffix={selectedComponent.id}
            onChange={(name) => {
              // TitleComponent通常不需要名称更新，但保持接口一致性
              console.log('Title component name changed:', name);
            }}
          /> */}

          <Form.Item label="主标题">
            <Segmented
              value={titleMode}
              style={{ marginBottom: 16 }}
              onChange={handleTitleModeChange}
              options={[...CONTENT_MODES]}
            />

            {titleMode === 'specify' && (
              <Input
                value={titleInfo.title}
                onChange={(e) => updateTitleComponent('title', e.target.value)}
                placeholder="请输入主标题"
                style={{ width: '100%' }}
              />
            )}

            {titleMode === 'variable' && (
              <VariableBinding
                componentType="input"
                variables={variables || []}
                getFilteredVariables={getFilteredVariables}
                value={variableBindingInfo.titleVariable}
                onChange={handleTitleVariableBindingChange}
                getVariableDisplayName={getVariableDisplayName}
                getVariableKeys={getVariableKeys}
                onAddVariable={() => handleAddVariableFromComponent('input')}
                placeholder="请选择主标题变量"
                label="绑定变量"
                addVariableText="新建变量"
              />
            )}
          </Form.Item>
          <Form.Item label="副标题">
            <Segmented
              value={subtitleMode}
              style={{ marginBottom: 16 }}
              onChange={handleSubtitleModeChange}
              options={[...CONTENT_MODES]}
            />

            {subtitleMode === 'specify' && (
              <Input
                value={titleInfo.subtitle}
                onChange={(e) =>
                  updateTitleComponent('subtitle', e.target.value)
                }
                placeholder="请输入副标题"
                style={{ width: '100%' }}
              />
            )}

            {subtitleMode === 'variable' && (
              <VariableBinding
                componentType="input"
                variables={variables || []}
                getFilteredVariables={getFilteredVariables}
                value={variableBindingInfo.subtitleVariable}
                onChange={handleSubtitleVariableBindingChange}
                getVariableDisplayName={getVariableDisplayName}
                getVariableKeys={getVariableKeys}
                onAddVariable={() => handleAddVariableFromComponent('input')}
                placeholder="请选择副标题变量"
                label="绑定变量"
                addVariableText="新建变量"
              />
            )}
          </Form.Item>
        </SettingSection>

        <SettingSection title="🎨 样式设置" form={form}>
          <Form.Item label="主题颜色">
            <Select
              value={titleInfo.style}
              onChange={(value) => updateTitleComponent('style', value)}
              style={{ width: '100%' }}
            >
              {themeColorOptions}
            </Select>
          </Form.Item>
        </SettingSection>
      </>
    ),
    [
      selectedComponent.id,
      titleInfo,
      themeColorOptions,
      updateTitleComponent,
      form,
    ],
  );

  return (
    <PropertyPanel
      activeTab={topLevelTab}
      onTabChange={setTopLevelTab}
      componentContent={componentContent}
      eventTabDisabled={true}
      variableManagementComponent={<VariableManagementPanel />}
      isVariableModalVisible={isVariableModalVisible}
      handleVariableModalOk={handleVariableModalOk || (() => {})}
      handleVariableModalCancel={handleVariableModalCancel || (() => {})}
      editingVariable={editingVariable}
      modalComponentType={modalComponentType}
      selectedComponentTag={selectedComponent?.tag}
    />
  );
};

export default TitleComponent;
