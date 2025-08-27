// 右侧属性面板 - 优化版本

import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Tooltip, Typography } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ComponentType as ImportedComponentType, Variable } from '../../type';

import {
  ButtonComponent,
  CardRootComponent,
  ColumnComponent,
  ColumnSetComponent,
  FormComponent,
  HrComponent,
  ImageComponent,
  ImgCombinationComponent,
  InputComponent,
  MultiSelectComponent,
  RichTextComponent,
  SelectComponent,
  TextComponent,
  TitleComponent,
} from '../components';
import {
  PropertyPanel as CommonPropertyPanel,
  ComponentContent,
} from '../components/common';
import { getComponentRealPath, getVariableKeys } from '../utils';

const { Text } = Typography;

// 类型定义
type ComponentType = ImportedComponentType;
type ContentMode = 'specify' | 'variable';

interface VariableItem {
  name: string;
  type: string;
  value?: any;
  [key: string]: any;
}

interface CardDesignData {
  [key: string]: any;
}

interface HeaderData {
  title?: { content: string };
  subtitle?: { content: string };
  style?: string;
}

// 常量定义
const STYLE_FIELDS = [
  'fontSize',
  'textAlign',
  'numberOfLines',
  'color',
  'width',
  'height',
  'backgroundColor',
  'borderColor',
  'borderRadius',
  'borderStyle',
  'padding',
  'margin',
  'type',
  'size',
  'crop_mode',
] as const;

const PANEL_STYLES = {
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
  emptyState: {
    padding: '20px',
    textAlign: 'center' as const,
    color: '#999',
  },
} as const;

interface PropertyPanelProps {
  selectedPath: (string | number)[] | null;
  onUpdateComponent: (component: ComponentType) => void;
  onUpdateCard: (updates: any) => void;
  variables: VariableItem[];
  onUpdateVariables: (variables: VariableItem[]) => void;
  cardVerticalSpacing: number;
  headerData?: HeaderData;
  cardData?: CardDesignData;
}

// 自定义Hook：处理组件选中和Tab切换逻辑
const useComponentSelection = (
  cardData: CardDesignData | undefined,
  selectedPath: (string | number)[] | null,
) => {
  const [topLevelTab, setTopLevelTab] = useState<string>('component');
  const [lastSelectedComponentId, setLastSelectedComponentId] = useState<
    string | null
  >(null);

  // 动态生成最新的选中组件数据
  const selectedComponent = useMemo((): ComponentType | null => {
    if (!cardData || !selectedPath) return null;
    const { component } = getComponentRealPath(cardData as any, selectedPath);
    return component;
  }, [cardData, selectedPath]);

  // 检查是否为卡片根节点
  const isCardRoot = useMemo(() => {
    return (
      selectedPath &&
      selectedPath.length === 2 &&
      selectedPath[0] === 'dsl' &&
      selectedPath[1] === 'body'
    );
  }, [selectedPath]);

  // Tab自动切换逻辑
  useEffect(() => {
    if (selectedComponent) {
      const isNewComponent = selectedComponent.id !== lastSelectedComponentId;

      if (!isCardRoot && isNewComponent) {
        setTopLevelTab('component');
      }

      setLastSelectedComponentId(selectedComponent.id);
    } else {
      setLastSelectedComponentId(null);
    }
  }, [
    selectedComponent,
    selectedPath,
    lastSelectedComponentId,
    topLevelTab,
    isCardRoot,
  ]);

  const handleTabChange = useCallback((activeKey: string) => {
    setTopLevelTab(activeKey);
  }, []);

  return {
    selectedComponent,
    isCardRoot,
    topLevelTab,
    handleTabChange,
  };
};

export const PropertyPanel: React.FC<PropertyPanelProps> = ({
  selectedPath,
  onUpdateComponent,
  onUpdateCard,
  variables,
  onUpdateVariables,
  cardVerticalSpacing,
  cardData,
}) => {
  const { selectedComponent, isCardRoot, topLevelTab, handleTabChange } =
    useComponentSelection(cardData, selectedPath);

  // 统一的内容模式状态管理
  const [contentModes, setContentModes] = useState<Record<string, ContentMode>>(
    {
      text: 'specify',
      image: 'specify',
      multiImage: 'specify',
      inputPlaceholder: 'specify',
      inputDefaultValue: 'specify',
      selectOptions: 'specify',
      multiSelectOptions: 'specify',
    },
  );

  const [lastBoundVariables, setLastBoundVariables] = useState<
    Record<string, string>
  >({});
  const [initializedComponents] = useState<Set<string>>(new Set());

  // 内容模式更新函数
  const updateContentMode = useCallback((key: string, mode: ContentMode) => {
    setContentModes((prev) => ({ ...prev, [key]: mode }));
  }, []);

  // 兼容性别名（为了保持与子组件的兼容性）
  const textContentMode = contentModes.text;
  const setTextContentMode = useCallback(
    (mode: ContentMode) => updateContentMode('text', mode),
    [updateContentMode],
  );
  const imageContentMode = contentModes.image;
  const setImageContentMode = useCallback(
    (mode: ContentMode) => updateContentMode('image', mode),
    [updateContentMode],
  );
  const multiImageContentMode = contentModes.multiImage;
  const setMultiImageContentMode = useCallback(
    (mode: ContentMode) => updateContentMode('multiImage', mode),
    [updateContentMode],
  );
  const inputPlaceholderMode = contentModes.inputPlaceholder;
  const setInputPlaceholderMode = useCallback(
    (mode: ContentMode) => updateContentMode('inputPlaceholder', mode),
    [updateContentMode],
  );
  const inputDefaultValueMode = contentModes.inputDefaultValue;
  const setInputDefaultValueMode = useCallback(
    (mode: ContentMode) => updateContentMode('inputDefaultValue', mode),
    [updateContentMode],
  );
  const selectOptionsMode = contentModes.selectOptions;
  const setSelectOptionsMode = useCallback(
    (mode: ContentMode) => updateContentMode('selectOptions', mode),
    [updateContentMode],
  );
  const multiSelectOptionsMode = contentModes.multiSelectOptions;
  const setMultiSelectOptionsMode = useCallback(
    (mode: ContentMode) => updateContentMode('multiSelectOptions', mode),
    [updateContentMode],
  );

  // 模态框状态
  const [isVariableModalVisible, setIsVariableModalVisible] = useState(false);
  const [isVariableModalFromVariablesTab, setIsVariableModalFromVariablesTab] =
    useState(true);
  const [modalComponentType, setModalComponentType] = useState<
    string | undefined
  >(undefined);
  const [editingVariable, setEditingVariable] = useState<Variable | undefined>(
    undefined,
  );
  const [editingVariableIndex, setEditingVariableIndex] = useState<number>(-1);

  const getVariableType = (type: string) => {
    const displayName =
      type === 'text'
        ? '文本'
        : type === 'number'
        ? '整数'
        : type === 'image'
        ? '图片'
        : type === 'imageArray'
        ? '图片数组'
        : type === 'array'
        ? '选项数组'
        : type === 'richtext'
        ? '富文本'
        : type;
    return displayName;
  };

  // 处理组件值变化
  const handleValueChange = useCallback(
    (key: string, value: any) => {
      // 处理卡片链接配置
      if (key === 'card_link.multi_url') {
        if (!cardData) {
          console.warn('⚠️ cardData为空，无法更新卡片链接');
          return;
        }

        const updatedCardData = {
          ...cardData,
          dsl: {
            ...cardData.dsl,
            card_link: {
              ...cardData.dsl.card_link,
              multi_url: value,
            },
          },
        };

        onUpdateCard({ cardData: updatedCardData });
        return;
      }

      if (selectedComponent) {
        let updatedComponent;

        // 处理嵌套字段（如 style.color）
        if (key.includes('.')) {
          const [parentKey, childKey] = key.split('.');
          updatedComponent = {
            ...selectedComponent,
            [parentKey]: {
              ...((selectedComponent as any)[parentKey] || {}),
              [childKey]: value,
            },
          };
        } else if (STYLE_FIELDS.includes(key as any)) {
          // 样式属性：保存到style对象中
          updatedComponent = {
            ...selectedComponent,
            style: {
              ...((selectedComponent as any).style || {}),
              [key]: value,
            },
          } as ComponentType;
        } else if (
          key === 'text.content' &&
          selectedComponent.tag === 'button'
        ) {
          // 特殊处理按钮文案：同时更新 text.content 和 text.i18n_content['en-US']
          updatedComponent = {
            ...selectedComponent,
            text: {
              ...((selectedComponent as any).text || {}),
              content: value,
              i18n_content: {
                ...((selectedComponent as any).text?.i18n_content || {}),
                'en-US': value,
              },
            },
          };
        } else {
          // 非样式属性：直接设置到组件根级
          updatedComponent = {
            ...selectedComponent,
            [key]: value,
          };

          // 特殊处理：当按钮设置为重置类型时，清除behaviors字段
          if (
            key === 'form_action_type' &&
            value === 'reset' &&
            selectedComponent.tag === 'button'
          ) {
            // 删除behaviors字段
            delete (updatedComponent as any).behaviors;
          }

          // 特殊处理：当behaviors被设置为undefined时，删除该字段
          if (key === 'behaviors' && value === undefined) {
            delete (updatedComponent as any).behaviors;
          }
        }

        onUpdateComponent(updatedComponent);
      }
    },
    [selectedComponent, cardData, onUpdateComponent, onUpdateCard],
  );

  // 统一的变量创建处理函数
  const handleAddVariableFromComponent = useCallback(
    (componentType: string) => {
      setIsVariableModalFromVariablesTab(false);
      setModalComponentType(componentType);
      setEditingVariable(undefined);
      setEditingVariableIndex(-1);

      // 直接设置为可见，不需要先设置为false再延时设置为true
      setIsVariableModalVisible(true);
    },
    [isVariableModalVisible],
  );

  // 变量类型映射常量
  const VARIABLE_TYPE_MAPPING: Record<string, string[]> = useMemo(
    () => ({
      plain_text: ['text', 'string'],
      rich_text: ['richtext', 'object'],
      img: ['image', 'string'],
      img_combination: ['imageArray', 'image_array'],
      input: ['text', 'string', 'number', 'integer'],
      select_static: ['array', 'string_array'],
      multi_select_static: ['array', 'string_array'],
    }),
    [],
  );

  // 获取过滤后的变量列表
  const getFilteredVariables = useCallback(
    (componentType?: string) => {
      if (!componentType) return variables;
      const allowedTypes = VARIABLE_TYPE_MAPPING[componentType] || [];
      const filteredVariables = variables.filter((variable) => {
        const variableType = variable.originalType || variable.type || 'string';
        const isAllowed = allowedTypes.includes(variableType);
        return isAllowed;
      });
      return filteredVariables;
    },
    [variables, VARIABLE_TYPE_MAPPING],
  );

  // 获取变量显示名称
  const getVariableDisplayName = useCallback((variable: any): string => {
    if (typeof variable === 'object' && variable !== null) {
      // 检查是否是标准Variable对象格式（包含name, type, value等属性）
      if (
        variable.name &&
        (variable.type !== undefined || variable.value !== undefined)
      ) {
        return variable.name;
      } else {
        // 键值对格式：获取变量的实际键名作为显示名称
        const keys = getVariableKeys(variable);
        if (keys.length > 0) {
          const variableName = keys[0];
          return variableName;
        }
      }
      // 降级到使用其他属性
      return variable.key || 'Unknown Variable';
    }
    return String(variable);
  }, []);

  // 变量模态框确认处理
  const handleVariableModalOk = useCallback(
    (variable: VariableItem) => {
      if (editingVariable !== null && editingVariable !== undefined) {
        const newVariables = [...variables];
        newVariables[editingVariableIndex] = variable;
        onUpdateVariables(newVariables);
      } else {
        const newVariables = [...variables, variable];
        onUpdateVariables(newVariables);
      }
      setIsVariableModalVisible(false);
      setEditingVariable(undefined);
      setEditingVariableIndex(-1);
      setIsVariableModalFromVariablesTab(true);
      setModalComponentType(undefined);
    },
    [editingVariable, editingVariableIndex, variables, onUpdateVariables],
  );

  // 变量模态框取消处理
  const handleVariableModalCancel = useCallback(() => {
    setIsVariableModalVisible(false);
    setEditingVariable(undefined);
    setEditingVariableIndex(-1);
    setIsVariableModalFromVariablesTab(true);
    setModalComponentType(undefined);
  }, []);

  // 变量列表操作函数
  const handleNewVariable = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setEditingVariable(undefined);
    setEditingVariableIndex(-1);
    setIsVariableModalFromVariablesTab(true);
    setModalComponentType(undefined);
    setIsVariableModalVisible(true);
  }, []);

  const handleEditVariable = useCallback(
    (variable: VariableItem, index: number) => (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setIsVariableModalVisible(false);
      setEditingVariable(undefined);
      setEditingVariableIndex(-1);
      setIsVariableModalFromVariablesTab(false);
      setModalComponentType(undefined);
      setTimeout(() => {
        setEditingVariable(variable as Variable);
        setEditingVariableIndex(index);
        setIsVariableModalFromVariablesTab(true);
        setIsVariableModalVisible(true);
      }, 100);
    },
    [],
  );

  const handleDeleteVariable = useCallback(
    (index: number) => (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const newVariables = variables.filter((_: any, i: number) => i !== index);
      onUpdateVariables(newVariables);
    },
    [variables, onUpdateVariables],
  );

  // 创建变量管理面板组件
  const VariableManagementPanel = useCallback(
    () => (
      <div>
        <div
          style={{
            background: '#fff',
            borderRadius: 6,
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            padding: 16,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <Text strong>变量列表</Text>
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={handleNewVariable}
            >
              新建变量
            </Button>
          </div>

          {variables.length > 0 ? (
            <div>
              {variables.map((variable: any, index: number) => (
                <Card
                  key={variable.name || `variable-${index}`}
                  size="small"
                  style={{ marginBottom: 8 }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <Text strong>{getVariableDisplayName(variable)}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {getVariableType(variable.type)}
                      </Text>
                    </div>
                    <div>
                      <Tooltip title="编辑">
                        <Button
                          type="text"
                          size="small"
                          icon={<EditOutlined />}
                          onClick={handleEditVariable(variable, index)}
                        />
                      </Tooltip>
                      <Tooltip title="删除">
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={handleDeleteVariable(index)}
                        />
                      </Tooltip>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div
              style={{
                textAlign: 'center',
                color: '#999',
                padding: '20px',
              }}
            >
              <Text>暂无变量</Text>
            </div>
          )}
        </div>
      </div>
    ),
    [
      variables,
      getVariableDisplayName,
      handleNewVariable,
      handleEditVariable,
      handleDeleteVariable,
    ],
  );

  // 组件类型检查 - 使用useMemo优化
  const componentTypeChecks = useMemo(
    () => ({
      isPlainTextComponent: selectedComponent?.tag === 'plain_text',
      isRichTextComponent: selectedComponent?.tag === 'rich_text',
      isImageComponent: selectedComponent?.tag === 'img',
      isImgCombinationComponent: selectedComponent?.tag === 'img_combination',
      isInputComponent: selectedComponent?.tag === 'input',
      isSelectComponent: selectedComponent?.tag === 'select_static',
      isMultiSelectComponent: selectedComponent?.tag === 'multi_select_static',
      isButtonComponent: selectedComponent?.tag === 'button',
      isColumnComponent: selectedComponent?.tag === ('column' as any),
      isColumnSetComponent: selectedComponent?.tag === 'column_set',
      isFormComponent: selectedComponent?.tag === 'form',
      isHrComponent: selectedComponent?.tag === 'hr',
      isTitleComponent: selectedComponent?.tag === 'title',
    }),
    [selectedComponent?.tag],
  );

  // 统一的组件Props
  const commonComponentProps = useMemo(
    () => ({
      selectedComponent,
      selectedPath,
      variables,
      topLevelTab,
      setTopLevelTab: handleTabChange,
      lastBoundVariables,
      setLastBoundVariables,
      initializedComponents,
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
    }),
    [
      selectedComponent,
      selectedPath,
      variables,
      topLevelTab,
      handleTabChange,
      lastBoundVariables,
      setLastBoundVariables,
      initializedComponents,
      onUpdateComponent,
      handleValueChange,
      getFilteredVariables,
      getVariableDisplayName,
      handleAddVariableFromComponent,
      isVariableModalVisible,
      handleVariableModalOk,
      handleVariableModalCancel,
      editingVariable,
      isVariableModalFromVariablesTab,
      modalComponentType,
      VariableManagementPanel,
    ],
  );

  // 组件渲染器
  const renderComponentEditor = useCallback(() => {
    // 如果选中的是卡片根节点，使用CardRootComponent
    if (isCardRoot) {
      return (
        <CardRootComponent
          topLevelTab={topLevelTab}
          setTopLevelTab={handleTabChange}
          cardVerticalSpacing={cardVerticalSpacing}
          onUpdateCard={onUpdateCard}
          cardData={cardData}
          handleValueChange={handleValueChange}
          VariableManagementPanel={VariableManagementPanel}
          isVariableModalVisible={isVariableModalVisible}
          handleVariableModalOk={handleVariableModalOk}
          handleVariableModalCancel={handleVariableModalCancel}
          editingVariable={editingVariable}
          isVariableModalFromVariablesTab={isVariableModalFromVariablesTab}
          modalComponentType={modalComponentType}
        />
      );
    }

    if (!selectedComponent) return null;

    const {
      isPlainTextComponent,
      isRichTextComponent,
      isImageComponent,
      isImgCombinationComponent,
      isInputComponent,
      isSelectComponent,
      isMultiSelectComponent,
      isButtonComponent,
      isColumnComponent,
      isColumnSetComponent,
      isFormComponent,
      isHrComponent,
      isTitleComponent,
    } = componentTypeChecks;

    // 创建安全的 props，确保 selectedComponent 不为 null
    const safeProps = {
      ...commonComponentProps,
      selectedComponent: selectedComponent as ComponentType,
      VariableManagementPanel,
    };

    if (isPlainTextComponent) {
      return (
        <TextComponent
          {...safeProps}
          textContentMode={textContentMode}
          setTextContentMode={setTextContentMode}
        />
      );
    }

    if (isRichTextComponent) {
      return (
        <RichTextComponent
          {...safeProps}
          textContentMode={textContentMode}
          setTextContentMode={setTextContentMode}
        />
      );
    }

    if (isImageComponent) {
      return (
        <ImageComponent
          {...safeProps}
          imageContentMode={imageContentMode}
          setImageContentMode={setImageContentMode}
        />
      );
    }

    if (isImgCombinationComponent) {
      return (
        <ImgCombinationComponent
          {...safeProps}
          cardData={cardData}
          multiImageContentMode={multiImageContentMode}
          setMultiImageContentMode={setMultiImageContentMode}
        />
      );
    }

    if (isInputComponent) {
      return (
        <InputComponent
          {...safeProps}
          inputPlaceholderMode={inputPlaceholderMode}
          setInputPlaceholderMode={setInputPlaceholderMode}
          inputDefaultValueMode={inputDefaultValueMode}
          setInputDefaultValueMode={setInputDefaultValueMode}
        />
      );
    }

    if (isSelectComponent) {
      return (
        <SelectComponent
          {...safeProps}
          selectOptionsMode={selectOptionsMode}
          setSelectOptionsMode={setSelectOptionsMode}
        />
      );
    }

    if (isMultiSelectComponent) {
      return (
        <MultiSelectComponent
          {...safeProps}
          multiSelectOptionsMode={multiSelectOptionsMode}
          setMultiSelectOptionsMode={setMultiSelectOptionsMode}
        />
      );
    }

    if (isButtonComponent) {
      return <ButtonComponent {...safeProps} />;
    }

    if (isColumnComponent) {
      return <ColumnComponent {...safeProps} />;
    }

    if (isColumnSetComponent) {
      return <ColumnSetComponent {...safeProps} />;
    }

    if (isFormComponent) {
      return <FormComponent {...safeProps} />;
    }

    if (isHrComponent) {
      return <HrComponent {...safeProps} />;
    }

    if (isTitleComponent) {
      return <TitleComponent {...safeProps} />;
    }

    return null;
  }, [
    selectedComponent,
    componentTypeChecks,
    commonComponentProps,
    VariableManagementPanel,
    cardData,
    textContentMode,
    setTextContentMode,
    imageContentMode,
    setImageContentMode,
    multiImageContentMode,
    setMultiImageContentMode,
    inputPlaceholderMode,
    setInputPlaceholderMode,
    inputDefaultValueMode,
    setInputDefaultValueMode,
    selectOptionsMode,
    setSelectOptionsMode,
    multiSelectOptionsMode,
    setMultiSelectOptionsMode,
  ]);

  // 默认组件内容 - 必须在条件语句之前定义
  const defaultComponentContent = useMemo(
    () => (
      <div style={PANEL_STYLES.emptyState}>
        <Text>请选择一个组件来编辑其属性</Text>
      </div>
    ),
    [],
  );

  // 渲染组件编辑器
  const componentEditor = renderComponentEditor();
  if (componentEditor) {
    return componentEditor;
  }

  return (
    <CommonPropertyPanel
      activeTab={topLevelTab}
      onTabChange={handleTabChange}
      componentContent={
        <ComponentContent componentName="属性面板">
          {defaultComponentContent}
        </ComponentContent>
      }
      showEventTab={false}
      variableManagementComponent={<VariableManagementPanel />}
      isVariableModalVisible={isVariableModalVisible}
      handleVariableModalOk={handleVariableModalOk}
      handleVariableModalCancel={handleVariableModalCancel}
      editingVariable={editingVariable}
      isVariableModalFromVariablesTab={isVariableModalFromVariablesTab}
      modalComponentType={modalComponentType}
    />
  );
};
