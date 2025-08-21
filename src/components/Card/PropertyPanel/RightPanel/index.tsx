// 右侧属性面板 - 完整实现

import {
  BgColorsOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Button, Card, Tabs, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import {
  ComponentType as ImportedComponentType,
  Variable,
} from '../../card-designer-types-updated';
import AddVariableModal from '../../Variable/AddVariableModal';
import {
  ButtonComponent,
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
import CardRootComponent from '../components/CardRootComponent';
import { getComponentRealPath, getVariableKeys } from '../utils';

const { Text } = Typography;

type ComponentType = ImportedComponentType;

interface VariableItem {
  name: string;
  type: string;
  value?: any;
  [key: string]: any;
}

interface CardDesignData {
  [key: string]: any;
}

export const PropertyPanel: React.FC<{
  selectedPath: (string | number)[] | null;
  onUpdateComponent: (component: ComponentType) => void;
  onUpdateCard: (updates: any) => void;
  variables: VariableItem[];
  onUpdateVariables: (variables: VariableItem[]) => void;
  cardVerticalSpacing: number;
  headerData?: {
    title?: { content: string };
    subtitle?: { content: string };
    style?: string;
  };
  cardData?: CardDesignData;
}> = ({
  selectedPath,
  onUpdateComponent,
  onUpdateCard,
  variables,
  onUpdateVariables,
  cardVerticalSpacing,
  cardData,
}) => {
  const [topLevelTab, setTopLevelTab] = useState<string>('component');
  const [lastSelectedComponentId, setLastSelectedComponentId] = useState<
    string | null
  >(null);

  // 动态生成最新的选中组件数据
  const getLatestSelectedComponent = (): ComponentType | null => {
    if (!cardData || !selectedPath) return null;
    const { component } = getComponentRealPath(cardData as any, selectedPath);
    return component;
  };

  // 使用最新的组件数据
  const selectedComponent = getLatestSelectedComponent() as ComponentType;

  // 🎯 当选中组件时自动切换到组件属性Tab
  useEffect(() => {
    console.log('🔄 Tab自动切换逻辑执行:', {
      hasSelectedComponent: !!selectedComponent,
      componentId: selectedComponent?.id,
      componentTag: selectedComponent?.tag,
      selectedPath,
      lastSelectedComponentId,
      currentTab: topLevelTab,
    });

    if (selectedComponent) {
      // 只有当选中的是具体组件（不是卡片根节点）时才切换到组件属性Tab
      const isCardRoot =
        selectedPath &&
        selectedPath.length === 2 &&
        selectedPath[0] === 'dsl' &&
        selectedPath[1] === 'body';

      // 检查是否是新选中的组件
      const isNewComponent = selectedComponent.id !== lastSelectedComponentId;

      if (!isCardRoot && isNewComponent) {
        console.log('🎯 检测到新组件选中，自动切换到组件属性Tab:', {
          componentId: selectedComponent.id,
          componentTag: selectedComponent.tag,
          selectedPath,
          currentTab: topLevelTab,
          lastSelectedComponentId,
          isNewComponent,
          isCardRoot,
          timestamp: new Date().toISOString(),
        });
        setTopLevelTab('component');
      }

      // 更新最后选中的组件ID
      setLastSelectedComponentId(selectedComponent.id);
    } else {
      // 如果没有选中组件，清除状态
      setLastSelectedComponentId(null);
    }
  }, [selectedComponent, selectedPath, lastSelectedComponentId, topLevelTab]);

  // 创建一个包装的setTopLevelTab函数来跟踪手动切换
  const handleTabChange = (activeKey: string) => {
    setTopLevelTab(activeKey);
  };

  // 状态管理
  const [textContentMode, setTextContentMode] = useState<
    'specify' | 'variable'
  >('specify');
  const [imageContentMode, setImageContentMode] = useState<
    'specify' | 'variable'
  >('specify');
  const [multiImageContentMode, setMultiImageContentMode] = useState<
    'specify' | 'variable'
  >('specify');
  const [inputPlaceholderMode, setInputPlaceholderMode] = useState<
    'specify' | 'variable'
  >('specify');
  const [inputDefaultValueMode, setInputDefaultValueMode] = useState<
    'specify' | 'variable'
  >('specify');
  const [selectOptionsMode, setSelectOptionsMode] = useState<
    'specify' | 'variable'
  >('specify');
  const [multiSelectOptionsMode, setMultiSelectOptionsMode] = useState<
    'specify' | 'variable'
  >('specify');
  const [lastBoundVariables, setLastBoundVariables] = useState<
    Record<string, string>
  >({});
  const [initializedComponents] = useState<Set<string>>(new Set());

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

  // 处理组件值变化
  const handleValueChange = (key: string, value: any) => {
    // 处理卡片链接配置
    if (key === 'card_link.multi_url') {
      if (!cardData) {
        console.warn('⚠️ cardData为空，无法更新卡片链接');
        return;
      }

      // 更新卡片数据中的 card_link.multi_url
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

      // 使用正确的格式传递完整的卡片数据
      onUpdateCard({ cardData: updatedCardData });
      return;
    }

    if (selectedComponent) {
      // 样式相关字段需要保存到style对象中
      const styleFields = [
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
      ];

      let updatedComponent;

      if (styleFields.includes(key)) {
        // 样式属性：保存到style对象中
        updatedComponent = {
          ...selectedComponent,
          styles: {
            ...((selectedComponent as any).style || {}),
            [key]: value,
          },
        };
      } else if (key === 'text.content' && selectedComponent.tag === 'button') {
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
      }

      onUpdateComponent(updatedComponent);
    }
  };

  // 统一的变量创建处理函数
  const handleAddVariableFromComponent = (componentType: string) => {
    setIsVariableModalFromVariablesTab(false);
    setModalComponentType(componentType);
    setIsVariableModalVisible(false);
    setEditingVariable(undefined);
    setEditingVariableIndex(-1);
    setTimeout(() => {
      setIsVariableModalVisible(true);
    }, 100);
  };

  // 获取过滤后的变量列表
  const getFilteredVariables = (componentType?: string) => {
    if (!componentType) return variables;
    const typeMapping: Record<string, string[]> = {
      plain_text: ['text', 'string'],
      rich_text: ['richtext', 'object'], // 富文本变量：支持 originalType='richtext' 或旧的 type='object'
      img: ['image', 'string'],
      img_combination: ['imageArray', 'image_array'], // 图片数组变量：支持新旧格式
      input: ['text', 'string', 'number', 'integer'],
      select_static: ['array', 'string_array'],
      multi_select_static: ['array', 'string_array'],
    };
    const allowedTypes = typeMapping[componentType] || [];

    return variables.filter((variable) => {
      // 优先检查 originalType（新格式），再检查 type（旧格式或存储格式）
      const variableType = variable.originalType || variable.type || 'string';
      const isTypeMatch = allowedTypes.includes(variableType);
      return isTypeMatch;
    });
  };

  // 获取变量显示名称
  const getVariableDisplayName = (variable: any): string => {
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
  };

  // 变量模态框确认处理
  const handleVariableModalOk = (variable: VariableItem) => {
    if (editingVariable !== null) {
      const newVariables = [...variables];
      newVariables[editingVariableIndex] = variable;
      onUpdateVariables(newVariables);
    } else {
      onUpdateVariables([...variables, variable]);
    }
    setIsVariableModalVisible(false);
    setEditingVariable(undefined);
    setEditingVariableIndex(-1);
    setIsVariableModalFromVariablesTab(true);
    setModalComponentType(undefined);
  };

  // 变量模态框取消处理
  const handleVariableModalCancel = () => {
    setIsVariableModalVisible(false);
    setEditingVariable(undefined);
    setEditingVariableIndex(-1);
    setIsVariableModalFromVariablesTab(true);
    setModalComponentType(undefined);
  };

  // 创建变量管理面板组件
  const VariableManagementPanel = () => (
    <div style={{ padding: '16px' }}>
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
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setIsVariableModalVisible(false);
              setEditingVariable(undefined);
              setEditingVariableIndex(-1);
              setIsVariableModalFromVariablesTab(false);
              setModalComponentType(undefined);
              setTimeout(() => {
                setIsVariableModalFromVariablesTab(true);
                setIsVariableModalVisible(true);
              }, 100);
            }}
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
                      {variable.type}
                    </Text>
                  </div>
                  <div>
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setIsVariableModalVisible(false);
                        setEditingVariable(undefined);
                        setEditingVariableIndex(-1);
                        setIsVariableModalFromVariablesTab(false);
                        setModalComponentType(undefined);
                        setTimeout(() => {
                          setEditingVariable(variable);
                          setEditingVariableIndex(index);
                          setIsVariableModalFromVariablesTab(true);
                          setIsVariableModalVisible(true);
                        }, 100);
                      }}
                    />
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => {
                        const newVariables = variables.filter(
                          (_, i) => i !== index,
                        );
                        onUpdateVariables(newVariables);
                      }}
                    />
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
  );

  // 检查是否选中了普通文本组件
  const isPlainTextComponent =
    selectedComponent && selectedComponent.tag === 'plain_text';

  // 如果选中了普通文本组件，显示普通文本编辑界面
  if (isPlainTextComponent) {
    return (
      <TextComponent
        selectedComponent={selectedComponent}
        selectedPath={selectedPath}
        variables={variables}
        topLevelTab={topLevelTab}
        setTopLevelTab={setTopLevelTab}
        textContentMode={textContentMode}
        setTextContentMode={setTextContentMode}
        lastBoundVariables={lastBoundVariables}
        setLastBoundVariables={setLastBoundVariables}
        initializedComponents={initializedComponents}
        onUpdateComponent={onUpdateComponent}
        handleValueChange={handleValueChange}
        getFilteredVariables={getFilteredVariables}
        getVariableDisplayName={getVariableDisplayName}
        getVariableKeys={getVariableKeys}
        handleAddVariableFromComponent={handleAddVariableFromComponent}
        isVariableModalVisible={isVariableModalVisible}
        handleVariableModalOk={handleVariableModalOk}
        handleVariableModalCancel={handleVariableModalCancel}
        editingVariable={editingVariable}
        isVariableModalFromVariablesTab={isVariableModalFromVariablesTab}
        modalComponentType={modalComponentType}
        VariableManagementPanel={VariableManagementPanel}
      />
    );
  }

  // 检查是否选中了富文本组件
  const isRichTextComponent =
    selectedComponent && selectedComponent.tag === 'rich_text';

  // 如果选中了富文本组件，显示富文本编辑界面
  if (isRichTextComponent) {
    return (
      <RichTextComponent
        selectedComponent={selectedComponent}
        selectedPath={selectedPath}
        variables={variables}
        topLevelTab={topLevelTab}
        setTopLevelTab={setTopLevelTab}
        textContentMode={textContentMode}
        setTextContentMode={setTextContentMode}
        lastBoundVariables={lastBoundVariables}
        setLastBoundVariables={setLastBoundVariables}
        initializedComponents={initializedComponents}
        onUpdateComponent={onUpdateComponent}
        handleValueChange={handleValueChange}
        getFilteredVariables={getFilteredVariables}
        getVariableDisplayName={getVariableDisplayName}
        getVariableKeys={getVariableKeys}
        handleAddVariableFromComponent={handleAddVariableFromComponent}
        isVariableModalVisible={isVariableModalVisible}
        handleVariableModalOk={handleVariableModalOk}
        handleVariableModalCancel={handleVariableModalCancel}
        editingVariable={editingVariable}
        isVariableModalFromVariablesTab={isVariableModalFromVariablesTab}
        modalComponentType={modalComponentType}
        VariableManagementPanel={VariableManagementPanel}
      />
    );
  }

  // 检查是否选中了输入框组件
  const isInputComponent =
    selectedComponent && selectedComponent.tag === 'input';

  // 如果选中了输入框组件，显示输入框编辑界面
  if (isInputComponent) {
    return (
      <InputComponent
        selectedComponent={selectedComponent}
        selectedPath={selectedPath}
        variables={variables}
        topLevelTab={topLevelTab}
        setTopLevelTab={setTopLevelTab}
        inputPlaceholderMode={inputPlaceholderMode}
        setInputPlaceholderMode={setInputPlaceholderMode}
        inputDefaultValueMode={inputDefaultValueMode}
        setInputDefaultValueMode={setInputDefaultValueMode}
        lastBoundVariables={lastBoundVariables}
        setLastBoundVariables={setLastBoundVariables}
        initializedComponents={initializedComponents}
        onUpdateComponent={onUpdateComponent}
        handleValueChange={handleValueChange}
        getFilteredVariables={getFilteredVariables}
        getVariableDisplayName={getVariableDisplayName}
        getVariableKeys={getVariableKeys}
        handleAddVariableFromComponent={handleAddVariableFromComponent}
        isVariableModalVisible={isVariableModalVisible}
        handleVariableModalOk={handleVariableModalOk}
        handleVariableModalCancel={handleVariableModalCancel}
        editingVariable={editingVariable}
        isVariableModalFromVariablesTab={isVariableModalFromVariablesTab}
        modalComponentType={modalComponentType}
        VariableManagementPanel={VariableManagementPanel}
      />
    );
  }

  // 检查是否选中了分割线组件
  const isHrComponent = selectedComponent && selectedComponent.tag === 'hr';

  // 如果选中了分割线组件，显示分割线编辑界面
  if (isHrComponent) {
    return (
      <HrComponent
        selectedComponent={selectedComponent}
        selectedPath={selectedPath}
        variables={variables}
        topLevelTab={topLevelTab}
        setTopLevelTab={setTopLevelTab}
        lastBoundVariables={lastBoundVariables}
        setLastBoundVariables={setLastBoundVariables}
        initializedComponents={initializedComponents}
        onUpdateComponent={onUpdateComponent}
        handleValueChange={handleValueChange}
        getFilteredVariables={getFilteredVariables}
        getVariableDisplayName={getVariableDisplayName}
        getVariableKeys={getVariableKeys}
        handleAddVariableFromComponent={handleAddVariableFromComponent}
        isVariableModalVisible={isVariableModalVisible}
        handleVariableModalOk={handleVariableModalOk}
        handleVariableModalCancel={handleVariableModalCancel}
        editingVariable={editingVariable}
        isVariableModalFromVariablesTab={isVariableModalFromVariablesTab}
        modalComponentType={modalComponentType}
        VariableManagementPanel={VariableManagementPanel}
      />
    );
  }

  // 检查是否选中了图片组合组件
  const isImgCombinationComponent =
    selectedComponent && selectedComponent.tag === 'img_combination';

  // 如果选中了图片组合组件，显示图片组合编辑界面
  if (isImgCombinationComponent) {
    return (
      <ImgCombinationComponent
        selectedComponent={selectedComponent}
        selectedPath={selectedPath}
        cardData={cardData}
        variables={variables}
        topLevelTab={topLevelTab}
        setTopLevelTab={setTopLevelTab}
        multiImageContentMode={multiImageContentMode}
        setMultiImageContentMode={setMultiImageContentMode}
        lastBoundVariables={lastBoundVariables}
        setLastBoundVariables={setLastBoundVariables}
        initializedComponents={initializedComponents}
        onUpdateComponent={onUpdateComponent}
        handleValueChange={handleValueChange}
        getFilteredVariables={getFilteredVariables}
        getVariableDisplayName={getVariableDisplayName}
        getVariableKeys={getVariableKeys}
        handleAddVariableFromComponent={handleAddVariableFromComponent}
        isVariableModalVisible={isVariableModalVisible}
        handleVariableModalOk={handleVariableModalOk}
        handleVariableModalCancel={handleVariableModalCancel}
        editingVariable={editingVariable}
        isVariableModalFromVariablesTab={isVariableModalFromVariablesTab}
        modalComponentType={modalComponentType}
        VariableManagementPanel={VariableManagementPanel}
      />
    );
  }

  // 检查是否选中了列集组件
  const isColumnSetComponent =
    selectedComponent && selectedComponent.tag === 'column_set';

  // 如果选中了列集组件，显示列集编辑界面
  if (isColumnSetComponent) {
    return (
      <ColumnSetComponent
        selectedComponent={selectedComponent}
        selectedPath={selectedPath}
        variables={variables}
        topLevelTab={topLevelTab}
        setTopLevelTab={setTopLevelTab}
        lastBoundVariables={lastBoundVariables}
        setLastBoundVariables={setLastBoundVariables}
        initializedComponents={initializedComponents}
        onUpdateComponent={onUpdateComponent}
        handleValueChange={handleValueChange}
        getFilteredVariables={getFilteredVariables}
        getVariableDisplayName={getVariableDisplayName}
        getVariableKeys={getVariableKeys}
        handleAddVariableFromComponent={handleAddVariableFromComponent}
        isVariableModalVisible={isVariableModalVisible}
        handleVariableModalOk={handleVariableModalOk}
        handleVariableModalCancel={handleVariableModalCancel}
        editingVariable={editingVariable}
        isVariableModalFromVariablesTab={isVariableModalFromVariablesTab}
        modalComponentType={modalComponentType}
        VariableManagementPanel={VariableManagementPanel}
      />
    );
  }

  // 检查是否选中了图片组件
  const isImageComponent = selectedComponent && selectedComponent.tag === 'img';

  // 如果选中了图片组件，显示图片编辑界面
  if (isImageComponent) {
    return (
      <ImageComponent
        selectedComponent={selectedComponent}
        selectedPath={selectedPath}
        variables={variables}
        topLevelTab={topLevelTab}
        setTopLevelTab={setTopLevelTab}
        imageContentMode={imageContentMode}
        setImageContentMode={setImageContentMode}
        lastBoundVariables={lastBoundVariables}
        setLastBoundVariables={setLastBoundVariables}
        initializedComponents={initializedComponents}
        onUpdateComponent={onUpdateComponent}
        handleValueChange={handleValueChange}
        getFilteredVariables={getFilteredVariables}
        getVariableDisplayName={getVariableDisplayName}
        getVariableKeys={getVariableKeys}
        handleAddVariableFromComponent={handleAddVariableFromComponent}
        isVariableModalVisible={isVariableModalVisible}
        handleVariableModalOk={handleVariableModalOk}
        handleVariableModalCancel={handleVariableModalCancel}
        editingVariable={editingVariable}
        isVariableModalFromVariablesTab={isVariableModalFromVariablesTab}
        modalComponentType={modalComponentType}
        VariableManagementPanel={VariableManagementPanel}
      />
    );
  }

  // 检查是否选中了下拉选择组件
  const isSelectComponent =
    selectedComponent && selectedComponent.tag === 'select_static';

  // 如果选中了下拉选择组件，显示选择编辑界面
  if (isSelectComponent) {
    return (
      <SelectComponent
        selectedComponent={selectedComponent}
        selectedPath={selectedPath}
        variables={variables}
        topLevelTab={topLevelTab}
        setTopLevelTab={setTopLevelTab}
        selectOptionsMode={selectOptionsMode}
        setSelectOptionsMode={setSelectOptionsMode}
        lastBoundVariables={lastBoundVariables}
        setLastBoundVariables={setLastBoundVariables}
        initializedComponents={initializedComponents}
        onUpdateComponent={onUpdateComponent}
        handleValueChange={handleValueChange}
        getFilteredVariables={getFilteredVariables}
        getVariableDisplayName={getVariableDisplayName}
        getVariableKeys={getVariableKeys}
        handleAddVariableFromComponent={handleAddVariableFromComponent}
        isVariableModalVisible={isVariableModalVisible}
        handleVariableModalOk={handleVariableModalOk}
        handleVariableModalCancel={handleVariableModalCancel}
        editingVariable={editingVariable}
        isVariableModalFromVariablesTab={isVariableModalFromVariablesTab}
        modalComponentType={modalComponentType}
        VariableManagementPanel={VariableManagementPanel}
      />
    );
  }

  // 检查是否选中了多选组件
  const isMultiSelectComponent =
    selectedComponent && selectedComponent.tag === 'multi_select_static';

  // 如果选中了多选组件，显示多选编辑界面
  if (isMultiSelectComponent) {
    return (
      <MultiSelectComponent
        selectedComponent={selectedComponent}
        selectedPath={selectedPath}
        variables={variables}
        topLevelTab={topLevelTab}
        setTopLevelTab={setTopLevelTab}
        multiSelectOptionsMode={multiSelectOptionsMode}
        setMultiSelectOptionsMode={setMultiSelectOptionsMode}
        lastBoundVariables={lastBoundVariables}
        setLastBoundVariables={setLastBoundVariables}
        initializedComponents={initializedComponents}
        onUpdateComponent={onUpdateComponent}
        handleValueChange={handleValueChange}
        getFilteredVariables={getFilteredVariables}
        getVariableDisplayName={getVariableDisplayName}
        getVariableKeys={getVariableKeys}
        handleAddVariableFromComponent={handleAddVariableFromComponent}
        isVariableModalVisible={isVariableModalVisible}
        handleVariableModalOk={handleVariableModalOk}
        handleVariableModalCancel={handleVariableModalCancel}
        editingVariable={editingVariable}
        isVariableModalFromVariablesTab={isVariableModalFromVariablesTab}
        modalComponentType={modalComponentType}
        VariableManagementPanel={VariableManagementPanel}
      />
    );
  }

  // 检查是否选中了按钮组件
  const isButtonComponent =
    selectedComponent && selectedComponent.tag === 'button';

  // 如果选中了按钮组件，显示按钮编辑界面
  if (isButtonComponent) {
    return (
      <ButtonComponent
        selectedComponent={selectedComponent}
        selectedPath={selectedPath}
        variables={variables}
        topLevelTab={topLevelTab}
        setTopLevelTab={setTopLevelTab}
        lastBoundVariables={lastBoundVariables}
        setLastBoundVariables={setLastBoundVariables}
        initializedComponents={initializedComponents}
        onUpdateComponent={onUpdateComponent}
        handleValueChange={handleValueChange}
        getFilteredVariables={getFilteredVariables}
        getVariableDisplayName={getVariableDisplayName}
        getVariableKeys={getVariableKeys}
        handleAddVariableFromComponent={handleAddVariableFromComponent}
        isVariableModalVisible={isVariableModalVisible}
        handleVariableModalOk={handleVariableModalOk}
        handleVariableModalCancel={handleVariableModalCancel}
        editingVariable={editingVariable}
        isVariableModalFromVariablesTab={isVariableModalFromVariablesTab}
        modalComponentType={modalComponentType}
        VariableManagementPanel={VariableManagementPanel}
      />
    );
  }

  // 检查是否选中了表单组件
  const isFormComponent = selectedComponent && selectedComponent.tag === 'form';

  console.log('🔍 RightPanel 表单组件检查:', {
    selectedComponent: selectedComponent
      ? {
          id: selectedComponent.id,
          tag: selectedComponent.tag,
        }
      : null,
    isFormComponent,
    selectedPath,
  });

  // 如果选中了表单组件，显示表单编辑界面
  if (isFormComponent) {
    return (
      <FormComponent
        selectedComponent={selectedComponent}
        selectedPath={selectedPath}
        variables={variables}
        topLevelTab={topLevelTab}
        setTopLevelTab={setTopLevelTab}
        lastBoundVariables={lastBoundVariables}
        setLastBoundVariables={setLastBoundVariables}
        initializedComponents={initializedComponents}
        onUpdateComponent={onUpdateComponent}
        handleValueChange={handleValueChange}
        getFilteredVariables={getFilteredVariables}
        getVariableDisplayName={getVariableDisplayName}
        getVariableKeys={getVariableKeys}
        handleAddVariableFromComponent={handleAddVariableFromComponent}
        isVariableModalVisible={isVariableModalVisible}
        editingVariable={editingVariable}
        isVariableModalFromVariablesTab={isVariableModalFromVariablesTab}
        modalComponentType={modalComponentType}
        VariableManagementPanel={VariableManagementPanel}
      />
    );
  }

  // 检查是否选中了列组件
  const isColumnComponent =
    selectedComponent && selectedComponent?.tag === 'column';

  // 如果选中了列组件，显示列编辑界面
  if (isColumnComponent) {
    return (
      <ColumnComponent
        selectedComponent={selectedComponent}
        selectedPath={selectedPath}
        variables={variables}
        topLevelTab={topLevelTab}
        setTopLevelTab={setTopLevelTab}
        lastBoundVariables={lastBoundVariables}
        setLastBoundVariables={setLastBoundVariables}
        initializedComponents={initializedComponents}
        onUpdateComponent={onUpdateComponent}
        handleValueChange={handleValueChange}
        getFilteredVariables={getFilteredVariables}
        getVariableDisplayName={getVariableDisplayName}
        getVariableKeys={getVariableKeys}
        handleAddVariableFromComponent={handleAddVariableFromComponent}
        isVariableModalVisible={isVariableModalVisible}
        editingVariable={editingVariable}
        isVariableModalFromVariablesTab={isVariableModalFromVariablesTab}
        modalComponentType={modalComponentType}
        VariableManagementPanel={VariableManagementPanel}
      />
    );
  }

  // 检查是否选中了标题组件
  const isTitleComponent =
    selectedComponent && selectedComponent.tag === 'title';

  // 如果选中了标题组件，显示标题编辑界面
  if (isTitleComponent) {
    return (
      <TitleComponent
        selectedComponent={selectedComponent}
        selectedPath={selectedPath}
        variables={variables}
        topLevelTab={topLevelTab}
        setTopLevelTab={setTopLevelTab}
        lastBoundVariables={lastBoundVariables}
        setLastBoundVariables={setLastBoundVariables}
        initializedComponents={initializedComponents}
        onUpdateComponent={onUpdateComponent}
        handleValueChange={handleValueChange}
        getFilteredVariables={getFilteredVariables}
        getVariableDisplayName={getVariableDisplayName}
        getVariableKeys={getVariableKeys}
        handleAddVariableFromComponent={handleAddVariableFromComponent}
        isVariableModalVisible={isVariableModalVisible}
        handleVariableModalOk={handleVariableModalOk}
        handleVariableModalCancel={handleVariableModalCancel}
        editingVariable={editingVariable}
        isVariableModalFromVariablesTab={isVariableModalFromVariablesTab}
        modalComponentType={modalComponentType}
        VariableManagementPanel={VariableManagementPanel}
      />
    );
  }

  // 检查是否选中了卡片根节点
  const isCardRootSelected =
    selectedPath &&
    selectedPath.length === 2 &&
    selectedPath[0] === 'dsl' &&
    selectedPath[1] === 'body';

  // 如果没有选中任何组件或选中了卡片，显示默认界面
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
      <Tabs
        activeKey={topLevelTab}
        onChange={handleTabChange}
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
            children: isCardRootSelected ? (
              <CardRootComponent
                cardVerticalSpacing={cardVerticalSpacing}
                onUpdateCard={onUpdateCard}
                cardData={cardData}
                handleValueChange={handleValueChange}
              />
            ) : (
              <div
                style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: '#999',
                }}
              >
                <Text type="secondary">请选择卡片或组件以查看属性设置</Text>
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
    </div>
  );
};
