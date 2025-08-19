// 右侧属性面板 - 完整实现

import {
  BgColorsOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Button, Card, InputNumber, Tabs, Typography } from 'antd';
import React, { useState } from 'react';
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
import { getComponentRealPath, getVariableKeys } from '../utils';

// const { Option } = Select;
const { Text } = Typography;

// 类型定义
interface ComponentType {
  id: string;
  tag: string;
  [key: string]: any;
}

interface VariableItem {
  name: string;
  type: string;
  value?: any;
  [key: string]: any;
}

interface CardDesignData {
  [key: string]: any;
}

// 事件编辑弹窗组件
// 事件编辑弹窗组件（暂时未使用）
// const EventEditModal: React.FC<{
//   visible: boolean;
//   eventAction: EventAction;
//   variables: any[];
//   onOk: (action: EventAction) => void;
//   onCancel: () => void;
//   onChange: (field: string, value: any) => void;
//   onAddVariable: () => void;
// }> = ({ visible, eventAction, onOk, onCancel, onChange, onAddVariable }) => {
//   return (
//     <Modal
//       title="编辑动作"
//       open={visible}
//       onOk={() => onOk(eventAction)}
//       onCancel={onCancel}
//       okText="确定"
//       cancelText="取消"
//       width={500}
//     >
//       <Form layout="vertical">
//         <Form.Item label="动作" required>
//           <Select
//             value={eventAction.action}
//             onChange={(value) => onChange('action', value)}
//             style={{ width: '100%' }}
//           >
//             <Option value="callback">请求回调</Option>
//           </Select>
//         </Form.Item>

//         <Form.Item label="参数类型" required>
//           <Select
//             value={eventAction.paramType}
//             onChange={(value) => onChange('paramType', value)}
//             style={{ width: '100%' }}
//           >
//             <Option value="string">字符串</Option>
//             <Option value="object">对象</Option>
//           </Select>
//         </Form.Item>

//         <Form.Item label="参数值" required>
//           <Select
//             value={eventAction.paramValue}
//             onChange={(value) => onChange('paramValue', value)}
//             style={{ width: '100%' }}
//             placeholder="请选择参数值"
//             dropdownRender={(menu) => (
//               <div>
//                 {menu}
//                 <div
//                   style={{
//                     padding: '8px',
//                     borderTop: '1px solid #f0f0f0',
//                     cursor: 'pointer',
//                   }}
//                   onClick={onAddVariable}
//                 >
//                   + 新建变量
//                 </div>
//               </div>
//             )}
//           >
//             {/* 这里应该根据variables动态生成选项 */}
//           </Select>
//         </Form.Item>
//       </Form>
//     </Modal>
//   );
// };

export const PropertyPanel: React.FC<{
  selectedComponent: ComponentType | null;
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
  selectedComponent: _selectedComponent, // 重命名，避免直接使用
  selectedPath,
  onUpdateComponent,
  onUpdateCard,
  variables,
  onUpdateVariables,
  cardVerticalSpacing,
  cardData,
  // cardPadding: _cardPadding,
  // headerData: _headerData,
}) => {
  const [topLevelTab, setTopLevelTab] = useState<string>('component');

  // 动态生成最新的选中组件数据
  const getLatestSelectedComponent = (): ComponentType | null => {
    if (!cardData || !selectedPath) return null;

    const { component } = getComponentRealPath(cardData as any, selectedPath);
    return component;
  };

  // 使用最新的组件数据
  const selectedComponent = getLatestSelectedComponent();

  // 调试日志：对比新旧组件数据
  console.log('🔄 RightPanel 组件数据对比:', {
    oldComponent: _selectedComponent,
    newComponent: selectedComponent,
    selectedPath,
    cardDataExists: !!cardData,
    timestamp: new Date().toISOString(),
  });

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
  // 下拉选择相关状态（已移动到各自的组件中）
  // const [optionPopoverVisible, setOptionPopoverVisible] = useState(false);
  // const [editingOptionIndex, setEditingOptionIndex] = useState<number>(-1);
  // const [optionTextMode, setOptionTextMode] = useState<'specify' | 'variable'>('specify');
  // const [optionValueMode, setOptionValueMode] = useState<'specify' | 'variable'>('specify');
  // const [optionSpecifyValues, setOptionSpecifyValues] = useState<Record<string, { text: string; value: string }>>({});
  const [lastBoundVariables, setLastBoundVariables] = useState<
    Record<string, string>
  >({});
  const [initializedComponents] = useState<Set<string>>(new Set());
  // const [initializedMultiImageComponents, setInitializedMultiImageComponents] =
  //   useState<Set<string>>(new Set());
  // 其他初始化状态已移动到各自的组件中
  // const [setInitializedComponents] = useState<Set<string>>(new Set());
  // const [initializedImageComponents, setInitializedImageComponents] = useState<Set<string>>(new Set());
  // const [initializedMultiImageComponents, setInitializedMultiImageComponents] = useState<Set<string>>(new Set());
  // const [initializedInputComponents, setInitializedInputComponents] = useState<Set<string>>(new Set());
  // const [initializedSelectComponents, setInitializedSelectComponents] = useState<Set<string>>(new Set());
  // const [initializedMultiSelectComponents, setInitializedMultiSelectComponents] = useState<Set<string>>(new Set());

  // 模态框状态
  const [isVariableModalVisible, setIsVariableModalVisible] = useState(false);
  const [isVariableModalFromVariablesTab, setIsVariableModalFromVariablesTab] =
    useState(true);
  const [modalComponentType, setModalComponentType] = useState<
    string | undefined
  >(undefined);
  const [editingVariable, setEditingVariable] = useState<VariableItem | null>(
    null,
  );
  const [editingVariableIndex, setEditingVariableIndex] = useState<number>(-1);
  // 事件相关状态（暂时未使用）
  // const [isEventModalVisible, setIsEventModalVisible] = useState(false);
  // const [currentEventAction, setCurrentEventAction] = useState<EventAction | null>(null);

  // 处理组件值变化
  const handleValueChange = (key: string, value: any) => {
    if (selectedComponent) {
      console.log('🔄 RightPanel handleValueChange:', {
        componentTag: selectedComponent.tag,
        selectedPath,
        key,
        value,
        currentComponent: selectedComponent,
      });

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
          style: {
            ...((selectedComponent as any).style || {}),
            [key]: value,
          },
        };
        console.log('🎨 样式属性更新到style对象:', {
          field: key,
          value,
          updatedStyle: updatedComponent.style,
        });
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
    setEditingVariable(null);
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

      console.log('🔍 变量类型过滤:', {
        componentType,
        variableName: variable.name || 'unknown',
        variableType: variable.type,
        originalType: variable.originalType,
        finalType: variableType,
        allowedTypes,
        isMatch: isTypeMatch,
      });

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
        // 标准Variable对象：直接使用name属性作为变量名
        console.log('🏷️ 获取标准Variable对象显示名称:', {
          variableName: variable.name,
          variable,
          timestamp: new Date().toISOString(),
        });
        return variable.name;
      } else {
        // 键值对格式：获取变量的实际键名作为显示名称
        const keys = getVariableKeys(variable);
        if (keys.length > 0) {
          const variableName = keys[0];
          console.log('🏷️ 获取键值对变量显示名称:', {
            variableName,
            variable,
            keys,
            timestamp: new Date().toISOString(),
          });
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
    setEditingVariable(null);
    setEditingVariableIndex(-1);
    setIsVariableModalFromVariablesTab(true);
    setModalComponentType(undefined);
  };

  // 变量模态框取消处理
  const handleVariableModalCancel = () => {
    setIsVariableModalVisible(false);
    setEditingVariable(null);
    setEditingVariableIndex(-1);
    setIsVariableModalFromVariablesTab(true);
    setModalComponentType(undefined);
  };

  // 交互式组件和事件相关函数（暂时未使用）
  // const isInteractiveComponent = useMemo(() => {
  //   return (
  //     selectedComponent &&
  //     ['input', 'button', 'select_static', 'multi_select_static'].includes(
  //       selectedComponent.tag,
  //     )
  //   );
  // }, [selectedComponent]);

  // const getComponentEvents = (): EventAction[] => {
  //   if (!selectedComponent) return [];
  //   return (selectedComponent as any).events || [];
  // };

  // const updateComponentEvents = (events: EventAction[]) => {
  //   if (selectedComponent) {
  //     handleValueChange('events', events);
  //   }
  // };

  // 创建变量管理面板组件
  const VariableManagementPanel = () => (
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
        <Text style={{ fontSize: '12px', color: '#389e0d' }}>🔗 变量管理</Text>
      </div>

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
              setEditingVariable(null);
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
                      {typeof variable === 'object'
                        ? JSON.stringify(variable).substring(0, 50) + '...'
                        : String(variable)}
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
                        setEditingVariable(null);
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
        setIsVariableModalVisible={setIsVariableModalVisible}
        editingVariable={editingVariable}
        setEditingVariable={setEditingVariable}
        isVariableModalFromVariablesTab={isVariableModalFromVariablesTab}
        modalComponentType={modalComponentType}
        VariableManagementPanel={VariableManagementPanel}
      />
    );
  }

  // 检查是否选中了列组件
  const isColumnComponent =
    selectedComponent && selectedComponent.tag === 'column';

  console.log('🔍 RightPanel 列组件检查:', {
    selectedComponent: selectedComponent
      ? {
          id: selectedComponent.id,
          tag: selectedComponent.tag,
        }
      : null,
    isColumnComponent,
    selectedPath,
  });

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
        setIsVariableModalVisible={setIsVariableModalVisible}
        editingVariable={editingVariable}
        setEditingVariable={setEditingVariable}
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
        onChange={setTopLevelTab}
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
              <div>
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
                    🎯 当前选中：卡片
                  </Text>
                </div>

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
                      fontWeight: 600,
                      marginBottom: 8,
                      fontSize: 15,
                    }}
                  >
                    ⚙️ 卡片属性
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontWeight: 500,
                        color: '#333',
                      }}
                    >
                      垂直间距
                    </label>
                    <InputNumber
                      value={cardVerticalSpacing || 8}
                      onChange={(value) => {
                        console.log('垂直间距输入变化:', value);
                        onUpdateCard({ vertical_spacing: value || 0 });
                      }}
                      min={0}
                      max={100}
                      step={1}
                      style={{ width: '100%' }}
                      addonAfter="px"
                      placeholder="设置垂直间距"
                    />
                  </div>
                </div>
              </div>
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
