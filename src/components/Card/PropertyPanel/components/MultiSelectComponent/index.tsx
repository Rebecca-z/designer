// MultiSelectComponent 编辑界面 - 下拉多选组件
import {
  BgColorsOutlined,
  CloseOutlined,
  DeleteOutlined,
  PlusOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import {
  Button,
  Form,
  Input,
  Popover,
  Segmented,
  Switch,
  Tabs,
  Typography,
} from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import AddVariableModal from '../../../Variable/AddVariableModal';
import VariableBinding from '../../../Variable/VariableList';
import {
  multiSelectComponentStateManager,
  optionEditStateManager,
} from '../../../Variable/utils/index';
import { MultiSelectComponentProps } from '../types';

const { Text } = Typography;

const MultiSelectComponent: React.FC<MultiSelectComponentProps> = React.memo(
  ({
    selectedComponent,
    variables,
    topLevelTab,
    setTopLevelTab,
    multiSelectOptionsMode,
    setMultiSelectOptionsMode,
    lastBoundVariables,
    setLastBoundVariables,
    // onUpdateComponent: _,
    handleValueChange,
    // getFilteredVariables,
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
    const [optionPopoverVisible, setOptionPopoverVisible] = useState(false);
    const [editingOptionIndex, setEditingOptionIndex] = useState<number | null>(
      null,
    );
    const [optionForm] = Form.useForm();
    const [optionTextMode, setOptionTextMode] = useState<
      'specify' | 'variable'
    >('specify');
    const [optionValueMode, setOptionValueMode] = useState<
      'specify' | 'variable'
    >('specify');
    const [refreshKey, setRefreshKeyInternal] = useState(0);
    const [popoverRefreshKey, setPopoverRefreshKey] = useState(0); // 专门用于popover内部刷新
    const [isAddingVariable, setIsAddingVariable] = useState(false);
    const [forcePopoverOpen, setForcePopoverOpen] = useState(false);
    const isVariableOperatingRef = useRef(false);

    // 受保护的setRefreshKey函数
    const setRefreshKey = (updater: (prev: number) => number) => {
      if (
        isVariableModalVisible ||
        isAddingVariable ||
        isVariableOperatingRef.current
      ) {
        console.log('🚫 变量操作中，阻止setRefreshKey调用', {
          isVariableModalVisible,
          isAddingVariable,
          isVariableOperating: isVariableOperatingRef.current,
        });
        return;
      }
      console.log('✅ 允许setRefreshKey调用');
      setRefreshKeyInternal(updater);
    };

    console.log('📝 渲染下拉多选组件编辑界面:', {
      componentId: selectedComponent.id,
      topLevelTab,
      variablesCount: variables.length,
    });

    // 详细的变量数据调试
    console.log('🔍 属性面板接收到的变量数据:', {
      variables,
      variablesLength: variables.length,
      selectedComponentOptions: (selectedComponent as any).options,
    });

    // 手动刷新机制：只在组件ID变化时刷新
    useEffect(() => {
      console.log('🔄 组件ID变化，刷新选项列表');
      setRefreshKey((prev) => prev + 1);
    }, [selectedComponent.id]);

    // 注释掉有问题的useEffect，改用手动刷新机制
    // useEffect(() => {
    //   // 如果正在进行变量操作，完全阻止刷新
    //   if (
    //     isVariableModalVisible ||
    //     isAddingVariable ||
    //     isVariableOperatingRef.current
    //   ) {
    //     console.log('🔄 变量操作中，完全阻止刷新', {
    //       isVariableModalVisible,
    //       isAddingVariable,
    //       isVariableOperating: isVariableOperatingRef.current,
    //     });
    //     return;
    //   }

    //   console.log('🔄 组件数据变化，刷新选项列表');
    //   setRefreshKey((prev) => prev + 1);
    // }, [
    //   selectedComponent.id,
    //   JSON.stringify((selectedComponent as any).options),
    //   JSON.stringify(variables),
    //   isVariableModalVisible,
    //   isAddingVariable,
    // ]);

    // 处理选项编辑
    const handleEditOption = (index: number) => {
      const option = (selectedComponent as any).options[index];
      setEditingOptionIndex(index);

      // 检查是否为新的数据结构
      const textContent = option.text?.content || option.label || '';
      const valueContent = option.value || '';

      // 检查是否有绑定的变量
      const boundTextVariable = optionEditStateManager.getBoundTextVariableName(
        selectedComponent.id,
        index,
      );
      const boundValueVariable =
        optionEditStateManager.getBoundValueVariableName(
          selectedComponent.id,
          index,
        );

      // 获取用户编辑的内容
      const userEditedTextContent =
        optionEditStateManager.getUserEditedTextContent(
          selectedComponent.id,
          index,
        );
      const userEditedValue = optionEditStateManager.getUserEditedValue(
        selectedComponent.id,
        index,
      );

      // 判断模式：如果有绑定变量或者内容是变量占位符格式，则为变量模式
      const isTextVariableMode =
        boundTextVariable || textContent.startsWith('${');
      const isValueVariableMode =
        boundValueVariable ||
        (typeof valueContent === 'string' && valueContent.startsWith('${'));

      // 设置模式
      setOptionTextMode(isTextVariableMode ? 'variable' : 'specify');
      setOptionValueMode(isValueVariableMode ? 'variable' : 'specify');

      // 设置表单值
      optionForm.setFieldsValue({
        textContent: isTextVariableMode
          ? userEditedTextContent || ''
          : textContent,
        value: isValueVariableMode ? userEditedValue || '' : valueContent,
      });

      setOptionPopoverVisible(true);
      setForcePopoverOpen(true);
      // 重置刷新键以确保VariableBinding组件正确初始化
      if (
        !isVariableModalVisible &&
        !isAddingVariable &&
        !isVariableOperatingRef.current
      ) {
        setRefreshKey((prev) => prev + 1);
      }
    };

    // 保存选项编辑
    const handleSaveOption = () => {
      optionForm.validateFields().then((values) => {
        const newOptions = [...((selectedComponent as any).options || [])];
        if (editingOptionIndex !== null) {
          let textContent: string;
          let valueContent: string;

          // 处理选项文本
          if (optionTextMode === 'variable') {
            // 变量模式：保存用户编辑的内容到状态管理器，使用变量占位符
            const boundTextVariable =
              optionEditStateManager.getBoundTextVariableName(
                selectedComponent.id,
                editingOptionIndex,
              );
            if (boundTextVariable) {
              textContent = `\${${boundTextVariable}}`;
              // 保存用户编辑的内容（如果有的话）
              if (values.textContent) {
                optionEditStateManager.setUserEditedTextContent(
                  selectedComponent.id,
                  editingOptionIndex,
                  values.textContent,
                );
              }
            } else {
              textContent = values.textContent || '';
            }
          } else {
            // 指定模式：直接使用用户输入的内容
            textContent = values.textContent || '';
            // 保存到状态管理器
            optionEditStateManager.setUserEditedTextContent(
              selectedComponent.id,
              editingOptionIndex,
              textContent,
            );
          }

          // 处理回传参数
          if (optionValueMode === 'variable') {
            // 变量模式：保存用户编辑的内容到状态管理器，使用变量占位符
            const boundValueVariable =
              optionEditStateManager.getBoundValueVariableName(
                selectedComponent.id,
                editingOptionIndex,
              );
            if (boundValueVariable) {
              valueContent = `\${${boundValueVariable}}`;
              // 保存用户编辑的内容（如果有的话）
              if (values.value) {
                optionEditStateManager.setUserEditedValue(
                  selectedComponent.id,
                  editingOptionIndex,
                  values.value,
                );
              }
            } else {
              valueContent = values.value || '';
            }
          } else {
            // 指定模式：直接使用用户输入的内容
            valueContent = values.value || '';
            // 保存到状态管理器
            optionEditStateManager.setUserEditedValue(
              selectedComponent.id,
              editingOptionIndex,
              valueContent,
            );
          }

          // 构建新的数据结构
          const newOption = {
            value: valueContent,
            text: {
              content: textContent,
              i18n_content: {
                'en-US': textContent,
              },
            },
          };

          newOptions[editingOptionIndex] = newOption;
          handleValueChange('options', newOptions);
        }
        setOptionPopoverVisible(false);
        setForcePopoverOpen(false);
        setEditingOptionIndex(null);
        optionForm.resetFields();

        // popover关闭后延迟刷新，确保选项列表显示更新
        setTimeout(() => {
          console.log('🔄 保存选项后刷新以确保显示更新');
          setRefreshKey((prev) => prev + 1);
        }, 50);
      });
    };

    // 取消选项编辑
    const handleCancelOptionEdit = () => {
      setOptionPopoverVisible(false);
      setForcePopoverOpen(false);
      setEditingOptionIndex(null);
      optionForm.resetFields();

      // popover关闭后延迟刷新，确保变量回显正确显示
      setTimeout(() => {
        console.log('🔄 popover关闭后刷新以确保变量回显');
        setRefreshKey((prev) => prev + 1);
      }, 50);
    };

    // 获取文本和整数类型的变量
    const getTextAndNumberVariables = () => {
      return variables.filter((variable) => {
        // 处理新格式的变量（直接是对象）
        if (typeof variable === 'object' && !variable.hasOwnProperty('name')) {
          return true; // 新格式变量暂时都允许
        }
        // 处理旧格式的变量
        const varType =
          (variable as any).originalType || (variable as any).type;
        return varType === 'text' || varType === 'number';
      });
    };

    // 获取选项数组类型的变量
    const getOptionArrayVariables = () => {
      return variables.filter((variable) => {
        // 处理新格式的变量（直接是对象）
        if (typeof variable === 'object' && !variable.hasOwnProperty('name')) {
          // 检查变量类型是否为array
          const varType = (variable as any).type;
          return varType === 'array';
        }
        // 处理旧格式的变量
        const varType =
          (variable as any).originalType || (variable as any).type;
        return varType === 'array';
      });
    };

    // 获取安全的选项数组（用于指定模式）
    const getSafeOptionsArray = () => {
      const options = (selectedComponent as any).options;

      // 如果是字符串格式（变量绑定），返回默认选项
      if (typeof options === 'string') {
        console.log('🔄 检测到变量绑定格式，返回默认选项数组');
        return [
          {
            text: { content: '选项1', i18n_content: { 'en-US': 'Option 1' } },
            value: 'option1',
          },
          {
            text: { content: '选项2', i18n_content: { 'en-US': 'Option 2' } },
            value: 'option2',
          },
        ];
      }

      // 如果是数组格式，直接返回
      if (Array.isArray(options)) {
        return options;
      }

      // 其他情况返回默认选项
      console.log('🔄 options格式异常，返回默认选项数组');
      return [
        {
          text: { content: '选项1', i18n_content: { 'en-US': 'Option 1' } },
          value: 'option1',
        },
        {
          text: { content: '选项2', i18n_content: { 'en-US': 'Option 2' } },
          value: 'option2',
        },
      ];
    };

    // 解析变量值
    const resolveVariableValue = (content: string): string => {
      console.log('🔍 开始解析变量值:', { content });

      if (!content || !content.includes('${')) {
        console.log('📝 内容不包含变量，直接返回:', content);
        return content;
      }

      const variableMatch = content.match(/\$\{([^}]+)\}/);
      if (variableMatch && variableMatch[1]) {
        const variableName = variableMatch[1];
        console.log('🎯 提取到变量名:', variableName);
        console.log('📋 所有变量:', variables);

        // 查找变量
        const variable = variables.find((v) => {
          if (typeof v === 'object' && v !== null) {
            const keys = Object.keys(v as Record<string, any>);
            console.log('🔍 检查变量:', { v, keys, variableName });

            // 检查两种变量格式：
            // 1. 画布格式: {var_123: '22222'}
            // 2. 属性面板格式: {name: 'var_123', type: 'text', value: '22222', ...}
            const hasVariableName = keys.includes(variableName); // 格式1
            const isStandardFormat =
              keys.includes('name') && (v as any).name === variableName; // 格式2

            console.log('🔍 变量名匹配检查:', {
              variableName,
              keys,
              hasVariableName,
              isStandardFormat,
              variableObject: v,
              keysDetail: keys.map((key) => ({ key, value: (v as any)[key] })),
            });

            return hasVariableName || isStandardFormat;
          }
          return false;
        });

        console.log('✅ 找到的变量:', variable);

        if (variable && typeof variable === 'object') {
          // 根据变量格式获取值
          let variableValue;
          const keys = Object.keys(variable as Record<string, any>);

          if (
            keys.includes('name') &&
            (variable as any).name === variableName
          ) {
            // 标准格式: {name: 'var_123', value: '22222', ...}
            variableValue = (variable as any).value;
            console.log('💡 标准格式变量值:', {
              variableName,
              variableValue,
              source: 'value',
            });
          } else {
            // 画布格式: {var_123: '22222'}
            variableValue = (variable as any)[variableName];
            console.log('💡 画布格式变量值:', {
              variableName,
              variableValue,
              source: 'direct',
            });
          }

          if (variableValue !== undefined && variableValue !== null) {
            const result = String(variableValue);
            console.log('🎉 返回解析结果:', result);
            return result;
          }
        }

        // 如果找不到变量值，返回变量名（不带${}）
        console.log('⚠️ 变量未找到，返回变量名:', variableName);
        return variableName;
      }

      console.log('❌ 无法匹配变量格式，返回原内容:', content);
      return content;
    };

    // Popover内容
    const getPopoverContent = () => (
      <div style={{ width: 320, padding: '8px 0' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            paddingBottom: 8,
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <span style={{ fontWeight: 600 }}>选项设置</span>
          <Button
            type="text"
            size="small"
            icon={<CloseOutlined />}
            onClick={handleCancelOptionEdit}
          />
        </div>
        <Form form={optionForm} layout="vertical">
          {/* 选项文本 */}
          <Form.Item label="选项文本" style={{ marginBottom: 16 }}>
            <Segmented
              value={optionTextMode}
              onChange={(value) => {
                const newMode = value as 'specify' | 'variable';
                setOptionTextMode(newMode);

                if (editingOptionIndex !== null) {
                  if (newMode === 'specify') {
                    // 切换到指定模式：显示用户编辑的内容
                    const userEditedContent =
                      optionEditStateManager.getUserEditedTextContent(
                        selectedComponent.id,
                        editingOptionIndex,
                      );
                    optionForm.setFieldsValue({
                      textContent: userEditedContent || '',
                    });
                  } else {
                    // 切换到变量模式：检查是否有绑定的变量
                    // const boundVariable =
                    //   optionEditStateManager.getBoundTextVariableName(
                    //     selectedComponent.id,
                    //     editingOptionIndex,
                    //   );
                    // 变量模式下不需要设置textContent，由VariableBinding组件处理
                  }
                }
              }}
              options={[
                { label: '指定', value: 'specify' },
                { label: '绑定变量', value: 'variable' },
              ]}
              style={{ marginBottom: 8 }}
            />
            {optionTextMode === 'specify' && (
              <Form.Item
                name="textContent"
                rules={[{ required: true, message: '请输入选项文本' }]}
                style={{ marginBottom: 0 }}
              >
                <Input
                  placeholder="请输入选项文本"
                  onChange={(e) => {
                    // 实时保存用户编辑的内容
                    if (editingOptionIndex !== null) {
                      optionEditStateManager.setUserEditedTextContent(
                        selectedComponent.id,
                        editingOptionIndex,
                        e.target.value,
                      );
                    }
                  }}
                />
              </Form.Item>
            )}
            {optionTextMode === 'variable' && (
              <VariableBinding
                key={`text-${editingOptionIndex}-${popoverRefreshKey}`}
                componentType="text"
                variables={getTextAndNumberVariables()}
                getFilteredVariables={() => getTextAndNumberVariables()}
                value={
                  editingOptionIndex !== null
                    ? optionEditStateManager.getBoundTextVariableName(
                        selectedComponent.id,
                        editingOptionIndex,
                      ) || ''
                    : ''
                }
                onChange={(value: string | undefined) => {
                  // 处理变量绑定逻辑
                  if (editingOptionIndex !== null) {
                    console.log('🔗 选项文本变量绑定开始:', {
                      optionIndex: editingOptionIndex,
                      variableName: value,
                      componentId: selectedComponent.id,
                    });

                    isVariableOperatingRef.current = true;

                    optionEditStateManager.setBoundTextVariableName(
                      selectedComponent.id,
                      editingOptionIndex,
                      value,
                    );

                    // 延迟刷新，避免闪烁
                    setTimeout(() => {
                      isVariableOperatingRef.current = false;
                      console.log('🔄 变量操作完成，重置状态');

                      // 再次延迟，确保变量弹窗和popover状态稳定后再刷新
                      setTimeout(() => {
                        if (
                          !isVariableModalVisible &&
                          !isAddingVariable &&
                          !optionPopoverVisible
                        ) {
                          console.log('✅ 安全刷新以显示变量回显');
                          setRefreshKey((prev) => prev + 1);
                        } else if (
                          optionPopoverVisible &&
                          !isVariableModalVisible &&
                          !isAddingVariable
                        ) {
                          // 如果只是popover打开，进行局部刷新
                          console.log('🔄 popover内部局部刷新以显示变量回显');
                          setPopoverRefreshKey((prev) => prev + 1);
                        } else {
                          console.log('🚫 变量弹窗或popover仍打开，跳过刷新', {
                            isVariableModalVisible,
                            isAddingVariable,
                            optionPopoverVisible,
                          });
                        }
                      }, 100);
                    }, 50);
                  }
                }}
                getVariableDisplayName={getVariableDisplayName}
                getVariableKeys={getVariableKeys}
                onAddVariable={() => {
                  console.log('➕ 添加选项文本变量');
                  isVariableOperatingRef.current = true;
                  setIsAddingVariable(true);
                  handleAddVariableFromComponent('multi_select_static_text');
                  // 添加变量后重置状态
                  setTimeout(() => {
                    console.log('🔄 添加变量完成，重置状态');
                    setIsAddingVariable(false);
                    isVariableOperatingRef.current = false;
                  }, 100);
                }}
                placeholder="请选择文本变量"
                label=""
                addVariableText="新建变量"
              />
            )}
          </Form.Item>

          {/* 回传参数 */}
          <Form.Item label="回传参数" style={{ marginBottom: 16 }}>
            <Segmented
              value={optionValueMode}
              onChange={(value) => {
                const newMode = value as 'specify' | 'variable';
                setOptionValueMode(newMode);

                if (editingOptionIndex !== null) {
                  if (newMode === 'specify') {
                    // 切换到指定模式：显示用户编辑的内容
                    const userEditedValue =
                      optionEditStateManager.getUserEditedValue(
                        selectedComponent.id,
                        editingOptionIndex,
                      );
                    optionForm.setFieldsValue({
                      value: userEditedValue || '',
                    });
                  } else {
                    // 切换到变量模式：检查是否有绑定的变量
                    // const boundVariable =
                    //   optionEditStateManager.getBoundValueVariableName(
                    //     selectedComponent.id,
                    //     editingOptionIndex,
                    //   );
                    // 变量模式下不需要设置value，由VariableBinding组件处理
                  }
                }
              }}
              options={[
                { label: '指定', value: 'specify' },
                { label: '绑定变量', value: 'variable' },
              ]}
              style={{ marginBottom: 8 }}
            />
            {optionValueMode === 'specify' && (
              <Form.Item
                name="value"
                rules={[{ required: true, message: '请输入回传参数' }]}
                style={{ marginBottom: 0 }}
              >
                <Input
                  placeholder="请输入回传参数"
                  onChange={(e) => {
                    // 实时保存用户编辑的内容
                    if (editingOptionIndex !== null) {
                      optionEditStateManager.setUserEditedValue(
                        selectedComponent.id,
                        editingOptionIndex,
                        e.target.value,
                      );
                    }
                  }}
                />
              </Form.Item>
            )}
            {optionValueMode === 'variable' && (
              <VariableBinding
                key={`value-${editingOptionIndex}-${popoverRefreshKey}`}
                componentType="text"
                variables={getTextAndNumberVariables()}
                getFilteredVariables={() => getTextAndNumberVariables()}
                value={
                  editingOptionIndex !== null
                    ? optionEditStateManager.getBoundValueVariableName(
                        selectedComponent.id,
                        editingOptionIndex,
                      ) || ''
                    : ''
                }
                onChange={(value: string | undefined) => {
                  // 处理变量绑定逻辑
                  if (editingOptionIndex !== null) {
                    console.log('🔗 回传参数变量绑定开始:', {
                      optionIndex: editingOptionIndex,
                      variableName: value,
                      componentId: selectedComponent.id,
                    });

                    isVariableOperatingRef.current = true;

                    optionEditStateManager.setBoundValueVariableName(
                      selectedComponent.id,
                      editingOptionIndex,
                      value,
                    );

                    // 延迟刷新，避免闪烁
                    setTimeout(() => {
                      isVariableOperatingRef.current = false;
                      console.log('🔄 变量操作完成，重置状态');

                      // 再次延迟，确保变量弹窗和popover状态稳定后再刷新
                      setTimeout(() => {
                        if (
                          !isVariableModalVisible &&
                          !isAddingVariable &&
                          !optionPopoverVisible
                        ) {
                          console.log('✅ 安全刷新以显示变量回显');
                          setRefreshKey((prev) => prev + 1);
                        } else if (
                          optionPopoverVisible &&
                          !isVariableModalVisible &&
                          !isAddingVariable
                        ) {
                          // 如果只是popover打开，进行局部刷新
                          console.log('🔄 popover内部局部刷新以显示变量回显');
                          setPopoverRefreshKey((prev) => prev + 1);
                        } else {
                          console.log('🚫 变量弹窗或popover仍打开，跳过刷新', {
                            isVariableModalVisible,
                            isAddingVariable,
                            optionPopoverVisible,
                          });
                        }
                      }, 100);
                    }, 50);
                  }
                }}
                getVariableDisplayName={getVariableDisplayName}
                getVariableKeys={getVariableKeys}
                onAddVariable={() => {
                  console.log('➕ 添加回传参数变量');
                  isVariableOperatingRef.current = true;
                  setIsAddingVariable(true);
                  handleAddVariableFromComponent('multi_select_static_text');
                  // 添加变量后重置状态
                  setTimeout(() => {
                    console.log('🔄 添加变量完成，重置状态');
                    setIsAddingVariable(false);
                    isVariableOperatingRef.current = false;
                  }, 100);
                }}
                placeholder="请选择参数变量"
                label=""
                addVariableText="新建变量"
              />
            )}
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button size="small" onClick={handleCancelOptionEdit}>
              取消
            </Button>
            <Button size="small" type="primary" onClick={handleSaveOption}>
              保存
            </Button>
          </div>
        </Form>
      </div>
    );

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
                      🎯 当前选中：下拉多选组件
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
                      <Form.Item label="必填">
                        <Switch
                          checked={(selectedComponent as any).required || false}
                          onChange={(checked) =>
                            handleValueChange('required', checked)
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
                          value={multiSelectOptionsMode}
                          style={{ marginBottom: 16 }}
                          onChange={(value) => {
                            const newMode = value as 'specify' | 'variable';
                            console.log('🔄 选项来源模式切换:', {
                              from: multiSelectOptionsMode,
                              to: newMode,
                              componentId: selectedComponent.id,
                            });

                            setMultiSelectOptionsMode(newMode);

                            // 处理模式切换时的数据转换
                            if (selectedComponent) {
                              if (newMode === 'variable') {
                                // 切换到绑定变量模式，检查是否有已绑定的变量
                                const boundVariable =
                                  multiSelectComponentStateManager.getBoundVariableName(
                                    selectedComponent.id,
                                  );
                                const rememberedVariable =
                                  lastBoundVariables[selectedComponent.id];
                                const variableName =
                                  boundVariable || rememberedVariable;

                                if (variableName) {
                                  console.log(
                                    '🔗 应用已绑定的变量:',
                                    variableName,
                                  );
                                  handleValueChange(
                                    'options',
                                    `\${${variableName}}`,
                                  );
                                }
                              } else if (newMode === 'specify') {
                                // 切换到指定模式，检查当前options是否为字符串格式
                                const currentOptions = (
                                  selectedComponent as any
                                ).options;
                                if (typeof currentOptions === 'string') {
                                  console.log(
                                    '🔄 从绑定变量切换到指定模式，恢复默认选项',
                                  );
                                  const defaultOptions = [
                                    {
                                      text: {
                                        content: '选项1',
                                        i18n_content: { 'en-US': 'Option 1' },
                                      },
                                      value: 'option1',
                                    },
                                    {
                                      text: {
                                        content: '选项2',
                                        i18n_content: { 'en-US': 'Option 2' },
                                      },
                                      value: 'option2',
                                    },
                                  ];
                                  handleValueChange('options', defaultOptions);
                                }
                              }
                            }
                          }}
                          options={[
                            { label: '指定', value: 'specify' },
                            { label: '绑定变量', value: 'variable' },
                          ]}
                        />

                        {multiSelectOptionsMode === 'specify' && (
                          <div
                            key={`option-list-${refreshKey}`}
                            style={{ marginBottom: 16 }}
                          >
                            <Text
                              strong
                              style={{ marginBottom: 8, display: 'block' }}
                            >
                              选项列表
                            </Text>
                            {getSafeOptionsArray().map(
                              (option: any, index: number) => (
                                <div
                                  key={`option-${index}-${refreshKey}`}
                                  style={{
                                    marginBottom: 8,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                  }}
                                >
                                  <Popover
                                    content={getPopoverContent()}
                                    title={null}
                                    trigger="click"
                                    open={
                                      (optionPopoverVisible ||
                                        forcePopoverOpen) &&
                                      editingOptionIndex === index
                                    }
                                    onOpenChange={(visible) => {
                                      console.log('🔄 Popover onOpenChange:', {
                                        visible,
                                        index,
                                        isVariableModalVisible,
                                        isAddingVariable,
                                        editingOptionIndex,
                                        forcePopoverOpen,
                                      });

                                      // 如果正在进行变量操作，完全忽略onOpenChange事件
                                      if (
                                        isVariableModalVisible ||
                                        isAddingVariable
                                      ) {
                                        console.log(
                                          '🚫 变量操作中，忽略popover状态变化',
                                        );
                                        return;
                                      }

                                      if (visible) {
                                        handleEditOption(index);
                                      } else {
                                        console.log('✅ 正常关闭popover');
                                        handleCancelOptionEdit();
                                      }
                                    }}
                                    placement="rightTop"
                                    overlayStyle={{
                                      zIndex:
                                        isVariableModalVisible ||
                                        isAddingVariable
                                          ? 999
                                          : 1050,
                                    }}
                                  >
                                    <Button
                                      style={{
                                        flex: 1,
                                        textAlign: 'left',
                                        justifyContent: 'flex-start',
                                      }}
                                    >
                                      {(() => {
                                        const textContent =
                                          option.text?.content ||
                                          option.label ||
                                          `选项${index + 1}`;
                                        // 解析变量值以显示实际内容
                                        const resolvedValue =
                                          resolveVariableValue(textContent);

                                        // 调试日志
                                        console.log('🔍 选项按钮显示调试:', {
                                          index,
                                          textContent,
                                          resolvedValue,
                                          refreshKey,
                                          variables: variables.length,
                                          allVariables: variables,
                                          option: option,
                                          componentId: selectedComponent.id,
                                        });

                                        // 强制显示调试信息
                                        if (
                                          textContent &&
                                          textContent.includes('${')
                                        ) {
                                          console.log(
                                            '🚨 属性面板发现变量:',
                                            textContent,
                                          );
                                          console.log(
                                            '🚨 解析结果:',
                                            resolvedValue,
                                          );
                                        }

                                        return resolvedValue;
                                      })()}
                                    </Button>
                                  </Popover>
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
                                const newIndex = newOptions.length + 1;
                                newOptions.push({
                                  value: `option${newIndex}`,
                                  text: {
                                    content: `选项${newIndex}`,
                                    i18n_content: {
                                      'en-US': `Option${newIndex}`,
                                    },
                                  },
                                });
                                handleValueChange('options', newOptions);
                              }}
                            >
                              添加选项
                            </Button>
                          </div>
                        )}

                        {multiSelectOptionsMode === 'variable' && (
                          <div>
                            <VariableBinding
                              componentType="multi_select_static"
                              variables={getOptionArrayVariables()}
                              getFilteredVariables={() =>
                                getOptionArrayVariables()
                              }
                              value={(() => {
                                const rememberedVariable = selectedComponent
                                  ? lastBoundVariables[selectedComponent.id]
                                  : undefined;
                                const currentBoundVariable =
                                  multiSelectComponentStateManager.getBoundVariableName(
                                    selectedComponent.id,
                                  );
                                return (
                                  rememberedVariable || currentBoundVariable
                                );
                              })()}
                              onChange={(value: string | undefined) => {
                                console.log('🔗 选项来源绑定变量改变:', {
                                  componentId: selectedComponent.id,
                                  variableName: value,
                                  timestamp: new Date().toISOString(),
                                });

                                // 处理变量绑定逻辑
                                if (selectedComponent) {
                                  if (value) {
                                    // 设置状态管理
                                    setLastBoundVariables((prev) => ({
                                      ...prev,
                                      [selectedComponent.id]: value,
                                    }));
                                    multiSelectComponentStateManager.setBoundVariableName(
                                      selectedComponent.id,
                                      value,
                                    );

                                    // 更新DSL数据：设置options为${变量名}格式
                                    console.log(
                                      '📝 更新DSL数据为变量绑定格式:',
                                      `\${${value}}`,
                                    );
                                    handleValueChange(
                                      'options',
                                      `\${${value}}`,
                                    );
                                  } else {
                                    // 清除绑定
                                    setLastBoundVariables((prev) => {
                                      const newState = { ...prev };
                                      delete newState[selectedComponent.id];
                                      return newState;
                                    });
                                    multiSelectComponentStateManager.setBoundVariableName(
                                      selectedComponent.id,
                                      '',
                                    );

                                    // 恢复为指定模式的默认选项
                                    console.log(
                                      '🔄 清除变量绑定，恢复默认选项',
                                    );
                                    const defaultOptions = [
                                      {
                                        text: {
                                          content: '选项1',
                                          i18n_content: { 'en-US': 'Option 1' },
                                        },
                                        value: 'option1',
                                      },
                                      {
                                        text: {
                                          content: '选项2',
                                          i18n_content: { 'en-US': 'Option 2' },
                                        },
                                        value: 'option2',
                                      },
                                    ];
                                    handleValueChange(
                                      'options',
                                      defaultOptions,
                                    );
                                  }
                                }
                              }}
                              getVariableDisplayName={getVariableDisplayName}
                              getVariableKeys={getVariableKeys}
                              onAddVariable={() =>
                                handleAddVariableFromComponent(
                                  'multi_select_static_array',
                                )
                              }
                              placeholder="请选择选项变量"
                              label="绑定变量"
                              addVariableText="新建变量"
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
  },
);

MultiSelectComponent.displayName = 'MultiSelectComponent';

export default MultiSelectComponent;
