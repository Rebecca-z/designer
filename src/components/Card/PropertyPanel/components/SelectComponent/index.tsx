// SelectComponent 编辑界面 - 下拉单选组件
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
import React, { useEffect, useMemo, useRef, useState } from 'react';
import AddVariableModal from '../../../Variable/AddVariableModal';
import VariableBinding from '../../../Variable/VariableList';
import {
  optionEditStateManager,
  selectComponentStateManager,
} from '../../../Variable/utils/index';
import ComponentNameInput from '../common/ComponentNameInput';
import { useComponentName } from '../hooks/useComponentName';
import { SelectComponentProps } from '../types';

const { Text } = Typography;

interface OptionItem {
  text: {
    content: string;
    i18n_content: {
      'en-US': string;
    };
  };
  value: string;
}

// 常量定义
const DEFAULT_OPTIONS: OptionItem[] = [
  {
    text: { content: '选项1', i18n_content: { 'en-US': 'Option 1' } },
    value: 'option1',
  },
  {
    text: { content: '选项2', i18n_content: { 'en-US': 'Option 2' } },
    value: 'option2',
  },
] as const;

const CONTENT_MODES = [
  { label: '指定', value: 'specify' },
  { label: '绑定变量', value: 'variable' },
] as const;

// 样式常量
const STYLES = {
  container: {
    width: '300px',
    height: 'calc(100vh - 60px)',
    backgroundColor: '#fafafa',
    borderLeft: '1px solid #d9d9d9',
    padding: '16px',
    overflow: 'auto',
  },
  tabBarStyle: {
    padding: '0 16px',
    backgroundColor: '#fff',
    margin: 0,
    borderBottom: '1px solid #d9d9d9',
  },
  contentPadding: { padding: '16px' },
  infoBox: {
    marginBottom: '16px',
    padding: '12px',
    backgroundColor: '#f6ffed',
    border: '1px solid #b7eb8f',
    borderRadius: '6px',
  },
  section: {
    marginBottom: '16px',
    background: '#fff',
    borderRadius: 6,
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
    padding: 16,
  },
  sectionTitle: {
    fontWeight: 600,
    marginBottom: 8,
    fontSize: 15,
  },
  optionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
    padding: '8px',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px',
  },
  popoverContent: {
    width: '300px',
  },
} as const;

const SelectComponent: React.FC<SelectComponentProps> = React.memo(
  ({
    selectedComponent,
    selectedPath,
    variables,
    topLevelTab,
    setTopLevelTab,
    selectOptionsMode,
    setSelectOptionsMode,
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
    // 使用通用的组件名称编辑Hook
    const { componentNameInfo, handleNameChange } = useComponentName({
      selectedComponent,
      prefix: 'SelectStatic_',
      handleValueChange,
    });

    // 检查组件是否嵌套在表单中
    const isNestedInForm = useMemo(() => {
      if (!selectedPath) return false;

      // 表单内组件路径：['dsl', 'body', 'elements', formIndex, 'elements', componentIndex]
      if (
        selectedPath.length === 6 &&
        selectedPath[0] === 'dsl' &&
        selectedPath[1] === 'body' &&
        selectedPath[2] === 'elements' &&
        selectedPath[4] === 'elements'
      ) {
        return true;
      }

      // 表单内分栏容器内的组件路径：['dsl', 'body', 'elements', formIndex, 'elements', columnSetIndex, 'columns', columnIndex, 'elements', componentIndex]
      if (
        selectedPath.length === 10 &&
        selectedPath[0] === 'dsl' &&
        selectedPath[1] === 'body' &&
        selectedPath[2] === 'elements' &&
        selectedPath[4] === 'elements' &&
        selectedPath[6] === 'columns' &&
        selectedPath[8] === 'elements'
      ) {
        return true;
      }

      return false;
    }, [selectedPath]);
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

    // 记住指定模式下的选项内容
    const [savedSpecifyOptions, setSavedSpecifyOptions] =
      useState<any[]>(DEFAULT_OPTIONS);

    // 受保护的setRefreshKey函数
    const setRefreshKey = (updater: (prev: number) => number) => {
      if (
        isVariableModalVisible ||
        isAddingVariable ||
        isVariableOperatingRef.current
      ) {
        return;
      }
      setRefreshKeyInternal(updater);
    };

    // 手动刷新机制：只在组件ID变化时刷新
    useEffect(() => {
      setRefreshKey((prev) => prev + 1);
    }, [selectedComponent.id]);

    // 初始化时保存指定模式的选项内容
    useEffect(() => {
      const currentOptions = (selectedComponent as any).options;
      if (
        selectOptionsMode === 'specify' &&
        Array.isArray(currentOptions) &&
        currentOptions.length > 0
      ) {
        setSavedSpecifyOptions(currentOptions);
      }
    }, [selectedComponent.id, selectOptionsMode]);

    console.log('📝 渲染下拉单选组件编辑界面:', {
      componentId: selectedComponent.id,
      topLevelTab,
      variablesCount: variables.length,
    });

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
          : userEditedTextContent || textContent,
        value: isValueVariableMode
          ? userEditedValue || ''
          : userEditedValue || valueContent,
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

          // 如果当前是指定模式，更新保存的选项内容
          if (selectOptionsMode === 'specify') {
            setSavedSpecifyOptions(newOptions);

            // 同时保存到 selectComponentStateManager，用于变量清除时恢复
            const optionsForStateManager = newOptions.map((option) => ({
              label: option.text?.content || '',
              value: option.value || '',
            }));
            selectComponentStateManager.setUserEditedOptions(
              selectedComponent.id,
              optionsForStateManager,
            );

            console.log('📝 保存选项到状态管理器:', {
              componentId: selectedComponent.id,
              optionsForStateManager,
              timestamp: new Date().toISOString(),
            });
          }
        }
        setOptionPopoverVisible(false);
        setForcePopoverOpen(false);
        setEditingOptionIndex(null);
        optionForm.resetFields();

        // popover关闭后延迟刷新，确保选项列表显示更新
        setTimeout(() => {
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
        return DEFAULT_OPTIONS;
      }

      // 如果是数组格式，直接返回
      if (Array.isArray(options)) {
        return options;
      }

      // 其他情况返回默认选项
      return DEFAULT_OPTIONS;
    };

    // 解析变量值
    const resolveVariableValue = (content: string): string => {
      if (!content || !content.includes('${')) {
        return content;
      }

      const variableMatch = content.match(/\$\{([^}]+)\}/);
      if (!variableMatch || !variableMatch[1]) {
        return content;
      }

      const variableName = variableMatch[1];

      // 查找变量
      const variable = variables.find((v) => {
        if (typeof v === 'object' && v !== null) {
          const keys = Object.keys(v as Record<string, any>);

          // 检查两种变量格式：
          // 1. 画布格式: {var_123: '22222'}
          // 2. 属性面板格式: {name: 'var_123', type: 'text', value: '22222', ...}
          const hasVariableName = keys.includes(variableName);
          const isStandardFormat =
            keys.includes('name') && (v as any).name === variableName;

          return hasVariableName || isStandardFormat;
        }
        return false;
      });

      if (variable && typeof variable === 'object') {
        const keys = Object.keys(variable as Record<string, any>);

        if (keys.includes('name') && (variable as any).name === variableName) {
          // 标准格式: {name: 'var_123', value: '22222', ...}
          const variableValue = (variable as any).value;
          return variableValue !== undefined
            ? String(variableValue)
            : variableName;
        } else {
          // 画布格式: {var_123: '22222'}
          const variableValue = (variable as any)[variableName];
          return variableValue !== undefined
            ? String(variableValue)
            : variableName;
        }
      }

      // 如果找不到变量值，返回变量名（不带${}）
      return variableName;
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
                const oldMode = optionTextMode;
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
                  } else if (newMode === 'variable' && oldMode === 'specify') {
                    // 从指定模式切换到变量模式：保存当前输入的内容
                    const currentFormValues = optionForm.getFieldsValue();
                    if (currentFormValues.textContent) {
                      optionEditStateManager.setUserEditedTextContent(
                        selectedComponent.id,
                        editingOptionIndex,
                        currentFormValues.textContent,
                      );
                    }
                  }
                }
              }}
              options={[...CONTENT_MODES]}
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
                componentType="plain_text"
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
                    isVariableOperatingRef.current = true;

                    optionEditStateManager.setBoundTextVariableName(
                      selectedComponent.id,
                      editingOptionIndex,
                      value,
                    );

                    // 如果清除了变量，自动切换到指定模式并恢复之前的内容
                    if (!value) {
                      console.log('🔄 变量清除 - 选项文本:', {
                        componentId: selectedComponent.id,
                        editingOptionIndex,
                        step: '开始清除变量',
                        timestamp: new Date().toISOString(),
                      });

                      setOptionTextMode('specify');
                      const userEditedContent =
                        optionEditStateManager.getUserEditedTextContent(
                          selectedComponent.id,
                          editingOptionIndex,
                        );

                      console.log('🔄 变量清除 - 获取用户编辑内容:', {
                        componentId: selectedComponent.id,
                        editingOptionIndex,
                        userEditedContent,
                        hasContent: !!userEditedContent,
                        timestamp: new Date().toISOString(),
                      });

                      optionForm.setFieldsValue({
                        textContent: userEditedContent || '',
                      });

                      // 立即保存到组件数据中，确保画布正确显示
                      if (editingOptionIndex !== null && userEditedContent) {
                        const newOptions = [
                          ...((selectedComponent as any).options || []),
                        ];
                        if (newOptions[editingOptionIndex]) {
                          const oldOption = newOptions[editingOptionIndex];
                          newOptions[editingOptionIndex] = {
                            ...newOptions[editingOptionIndex],
                            text: {
                              content: userEditedContent,
                              i18n_content: {
                                'en-US': userEditedContent,
                              },
                            },
                          };

                          console.log('🔄 变量清除 - 保存到组件数据:', {
                            componentId: selectedComponent.id,
                            editingOptionIndex,
                            oldOption,
                            newOption: newOptions[editingOptionIndex],
                            userEditedContent,
                            timestamp: new Date().toISOString(),
                          });

                          handleValueChange('options', newOptions);
                        }
                      } else {
                        console.log('⚠️ 变量清除 - 未保存到组件数据:', {
                          componentId: selectedComponent.id,
                          editingOptionIndex,
                          userEditedContent,
                          hasUserEditedContent: !!userEditedContent,
                          reason: !userEditedContent
                            ? '无用户编辑内容'
                            : '编辑索引为空',
                          timestamp: new Date().toISOString(),
                        });
                      }
                    }

                    // 延迟刷新，避免闪烁
                    setTimeout(() => {
                      isVariableOperatingRef.current = false;

                      // 再次延迟，确保变量弹窗和popover状态稳定后再刷新
                      setTimeout(() => {
                        if (
                          !isVariableModalVisible &&
                          !isAddingVariable &&
                          !optionPopoverVisible
                        ) {
                          setRefreshKey((prev) => prev + 1);
                        } else if (
                          optionPopoverVisible &&
                          !isVariableModalVisible &&
                          !isAddingVariable
                        ) {
                          // 如果只是popover打开，进行局部刷新
                          setPopoverRefreshKey((prev) => prev + 1);
                        }
                      }, 100);
                    }, 50);
                  }
                }}
                getVariableDisplayName={getVariableDisplayName}
                getVariableKeys={getVariableKeys}
                onAddVariable={() => {
                  isVariableOperatingRef.current = true;
                  setIsAddingVariable(true);
                  handleAddVariableFromComponent('select_static_text');
                  // 添加变量后重置状态
                  setTimeout(() => {
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
                const oldMode = optionValueMode;
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
                  } else if (newMode === 'variable' && oldMode === 'specify') {
                    // 从指定模式切换到变量模式：保存当前输入的内容
                    const currentFormValues = optionForm.getFieldsValue();
                    if (currentFormValues.value) {
                      optionEditStateManager.setUserEditedValue(
                        selectedComponent.id,
                        editingOptionIndex,
                        currentFormValues.value,
                      );
                    }
                  }
                }
              }}
              options={[...CONTENT_MODES]}
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
                componentType="plain_text"
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
                    isVariableOperatingRef.current = true;

                    optionEditStateManager.setBoundValueVariableName(
                      selectedComponent.id,
                      editingOptionIndex,
                      value,
                    );

                    // 如果清除了变量，自动切换到指定模式并恢复之前的内容
                    if (!value) {
                      setOptionValueMode('specify');
                      const userEditedValue =
                        optionEditStateManager.getUserEditedValue(
                          selectedComponent.id,
                          editingOptionIndex,
                        );
                      optionForm.setFieldsValue({
                        value: userEditedValue || '',
                      });

                      // 立即保存到组件数据中，确保画布正确显示
                      if (editingOptionIndex !== null && userEditedValue) {
                        const newOptions = [
                          ...((selectedComponent as any).options || []),
                        ];
                        if (newOptions[editingOptionIndex]) {
                          newOptions[editingOptionIndex] = {
                            ...newOptions[editingOptionIndex],
                            value: userEditedValue,
                          };

                          handleValueChange('options', newOptions);
                        }
                      }
                    }

                    // 延迟刷新，避免闪烁
                    setTimeout(() => {
                      isVariableOperatingRef.current = false;

                      // 再次延迟，确保变量弹窗和popover状态稳定后再刷新
                      setTimeout(() => {
                        if (
                          !isVariableModalVisible &&
                          !isAddingVariable &&
                          !optionPopoverVisible
                        ) {
                          setRefreshKey((prev) => prev + 1);
                        } else if (
                          optionPopoverVisible &&
                          !isVariableModalVisible &&
                          !isAddingVariable
                        ) {
                          // 如果只是popover打开，进行局部刷新
                          setPopoverRefreshKey((prev) => prev + 1);
                        }
                      }, 100);
                    }, 50);
                  }
                }}
                getVariableDisplayName={getVariableDisplayName}
                getVariableKeys={getVariableKeys}
                onAddVariable={() => {
                  isVariableOperatingRef.current = true;
                  setIsAddingVariable(true);
                  handleAddVariableFromComponent('select_static_text');
                  // 添加变量后重置状态
                  setTimeout(() => {
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
      <div style={STYLES.container}>
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
          tabBarStyle={STYLES.tabBarStyle}
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

                  {/* 组件设置 - 始终显示 */}
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
                      style={{
                        fontWeight: 600,
                        marginBottom: 8,
                        fontSize: 15,
                      }}
                    >
                      🏷️ 组件设置
                    </div>
                    <Form form={form} layout="vertical">
                      <ComponentNameInput
                        prefix="SelectStatic_"
                        suffix={componentNameInfo.suffix}
                        onChange={handleNameChange}
                      />
                    </Form>
                  </div>

                  {/* 基础设置 - 只有在表单中才显示 */}
                  {isNestedInForm && (
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
                        style={{
                          fontWeight: 600,
                          marginBottom: 8,
                          fontSize: 15,
                        }}
                      >
                        ⚙️ 基础设置
                      </div>
                      <Form form={form} layout="vertical">
                        <Form.Item label="必填">
                          <Switch
                            checked={
                              (selectedComponent as any).required || false
                            }
                            onChange={(checked) => {
                              // 只有在表单中才更新 required 字段到全局数据
                              if (isNestedInForm) {
                                handleValueChange('required', checked);
                                console.log('✅ 下拉单选-更新 required 字段:', {
                                  checked,
                                  isNestedInForm,
                                });
                              } else {
                                console.log(
                                  '⚠️ 下拉单选-跳过更新 required 字段：组件不在表单中',
                                  { checked, isNestedInForm },
                                );
                              }
                            }}
                          />
                        </Form.Item>
                      </Form>
                    </div>
                  )}

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
                            const newMode = value as 'specify' | 'variable';
                            const currentOptions = (selectedComponent as any)
                              .options;

                            // 在切换模式前，保存当前模式的内容
                            if (
                              selectOptionsMode === 'specify' &&
                              Array.isArray(currentOptions)
                            ) {
                              // 从指定模式切换出去时，保存当前的选项内容
                              console.log(
                                '💾 保存指定模式选项:',
                                currentOptions,
                              );
                              setSavedSpecifyOptions(currentOptions);
                            }

                            setSelectOptionsMode(newMode);

                            // 处理模式切换时的数据转换
                            if (selectedComponent) {
                              if (newMode === 'variable') {
                                // 切换到绑定变量模式，检查是否有已绑定的变量
                                const boundVariable =
                                  selectComponentStateManager.getBoundVariableName(
                                    selectedComponent.id,
                                  );
                                const rememberedVariable =
                                  lastBoundVariables[selectedComponent.id];
                                const variableName =
                                  boundVariable || rememberedVariable;

                                if (variableName) {
                                  handleValueChange(
                                    'options',
                                    `\${${variableName}}`,
                                  );
                                }
                              } else if (newMode === 'specify') {
                                // 切换到指定模式，恢复之前保存的选项内容
                                if (typeof currentOptions === 'string') {
                                  // 如果当前是变量绑定格式，恢复保存的指定模式选项
                                  console.log(
                                    '🔄 恢复指定模式选项:',
                                    savedSpecifyOptions,
                                  );
                                  handleValueChange(
                                    'options',
                                    savedSpecifyOptions,
                                  );
                                }
                              }
                            }
                          }}
                          options={[
                            { label: '指定', value: 'specify' },
                            { label: '绑定变量', value: 'variable' },
                          ]}
                        />

                        {selectOptionsMode === 'specify' && (
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
                                      // 如果正在进行变量操作，完全忽略onOpenChange事件
                                      if (
                                        isVariableModalVisible ||
                                        isAddingVariable
                                      ) {
                                        return;
                                      }

                                      if (visible) {
                                        handleEditOption(index);
                                      } else {
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

                                      // 如果当前是指定模式，更新保存的选项内容
                                      if (selectOptionsMode === 'specify') {
                                        setSavedSpecifyOptions(newOptions);

                                        // 同时保存到 selectComponentStateManager
                                        const optionsForStateManager =
                                          newOptions.map((option) => ({
                                            label: option.text?.content || '',
                                            value: option.value || '',
                                          }));
                                        selectComponentStateManager.setUserEditedOptions(
                                          selectedComponent.id,
                                          optionsForStateManager,
                                        );
                                      }
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

                                // 如果当前是指定模式，更新保存的选项内容
                                if (selectOptionsMode === 'specify') {
                                  setSavedSpecifyOptions(newOptions);

                                  // 同时保存到 selectComponentStateManager
                                  const optionsForStateManager = newOptions.map(
                                    (option) => ({
                                      label: option.text?.content || '',
                                      value: option.value || '',
                                    }),
                                  );
                                  selectComponentStateManager.setUserEditedOptions(
                                    selectedComponent.id,
                                    optionsForStateManager,
                                  );
                                }
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
                              variables={getOptionArrayVariables()}
                              getFilteredVariables={() =>
                                getOptionArrayVariables()
                              }
                              value={(() => {
                                const rememberedVariable = selectedComponent
                                  ? lastBoundVariables[selectedComponent.id]
                                  : undefined;
                                const currentBoundVariable =
                                  selectComponentStateManager.getBoundVariableName(
                                    selectedComponent.id,
                                  );
                                return (
                                  rememberedVariable || currentBoundVariable
                                );
                              })()}
                              onChange={(value: string | undefined) => {
                                // 处理变量绑定逻辑
                                if (selectedComponent) {
                                  if (value) {
                                    // 设置状态管理
                                    setLastBoundVariables((prev) => ({
                                      ...prev,
                                      [selectedComponent.id]: value,
                                    }));
                                    selectComponentStateManager.setBoundVariableName(
                                      selectedComponent.id,
                                      value,
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
                                    selectComponentStateManager.setBoundVariableName(
                                      selectedComponent.id,
                                      '',
                                    );

                                    console.log('🔄 清除选项列表变量绑定:', {
                                      componentId: selectedComponent.id,
                                      savedSpecifyOptions,
                                      useDefault:
                                        savedSpecifyOptions.length === 0,
                                      timestamp: new Date().toISOString(),
                                    });

                                    // 尝试从状态管理器恢复用户编辑的选项内容
                                    const userEditedOptions =
                                      selectComponentStateManager.getUserEditedOptions(
                                        selectedComponent.id,
                                      );
                                    console.log(
                                      '🔄 从状态管理器获取用户编辑选项:',
                                      {
                                        componentId: selectedComponent.id,
                                        userEditedOptions,
                                        hasUserOptions:
                                          !!userEditedOptions &&
                                          userEditedOptions.length > 0,
                                        timestamp: new Date().toISOString(),
                                      },
                                    );

                                    let optionsToRestore;
                                    if (
                                      userEditedOptions &&
                                      userEditedOptions.length > 0
                                    ) {
                                      // 使用状态管理器中保存的用户编辑选项
                                      optionsToRestore = userEditedOptions.map(
                                        (option) => ({
                                          text: {
                                            content: option.label,
                                            i18n_content: {
                                              'en-US': option.label,
                                            },
                                          },
                                          value: option.value,
                                        }),
                                      );
                                    } else if (savedSpecifyOptions.length > 0) {
                                      // 使用组件内保存的指定选项
                                      optionsToRestore = savedSpecifyOptions;
                                    } else {
                                      // 使用默认选项
                                      optionsToRestore = DEFAULT_OPTIONS;
                                    }

                                    console.log('🔄 选择恢复的选项:', {
                                      componentId: selectedComponent.id,
                                      optionsToRestore,
                                      source:
                                        userEditedOptions?.length > 0
                                          ? 'stateManager'
                                          : savedSpecifyOptions.length > 0
                                          ? 'savedState'
                                          : 'default',
                                      timestamp: new Date().toISOString(),
                                    });

                                    handleValueChange(
                                      'options',
                                      optionsToRestore,
                                    );
                                  }
                                }
                              }}
                              getVariableDisplayName={getVariableDisplayName}
                              getVariableKeys={getVariableKeys}
                              onAddVariable={() =>
                                handleAddVariableFromComponent(
                                  'select_static_array',
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

SelectComponent.displayName = 'SelectComponent';

export default SelectComponent;
