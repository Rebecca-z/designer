// ImgCombinationComponent 编辑界面 - 多图混排组件
import { BgColorsOutlined, SettingOutlined } from '@ant-design/icons';
import { Form, Input, Segmented, Space, Tabs, Typography } from 'antd';
import React, { useEffect } from 'react';
import ImageUpload from '../../../ImageUpload';
import AddVariableModal from '../../../Variable/AddVariableModal';
import VariableBinding from '../../../Variable/VariableList';
import { multiImageComponentStateManager } from '../../../Variable/utils/index';
import { getComponentRealPath } from '../../utils';
import ComponentNameInput from '../common/ComponentNameInput';
import { useComponentName } from '../hooks/useComponentName';
import { ImgCombinationComponentProps } from '../types';

const { Text } = Typography;

const DEFAULT_IMAGE_URL = 'demo.png';

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
    backgroundColor: '#f0f9ff',
    border: '1px solid #bae6fd',
    borderRadius: '6px',
  },
  section: {
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
  layoutGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '6px',
    marginBottom: '8px',
  },
  layoutItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    cursor: 'pointer',
  },
  inputCompact: {
    width: '100%',
  },
  uploadButton: {
    borderRadius: '0 6px 6px 0',
  },
} as const;

// 布局图标组件
const LayoutIcon: React.FC<{
  type:
    | 'double'
    | 'triple'
    | 'bisect_2'
    | 'bisect_4'
    | 'bisect_6'
    | 'trisect_3'
    | 'trisect_6'
    | 'trisect_9';
  isSelected?: boolean;
}> = ({ type, isSelected = false }) => {
  const iconStyle: React.CSSProperties = {
    width: '50px',
    height: '32px',
    border: `2px solid ${isSelected ? '#1890ff' : '#d9d9d9'}`,
    borderRadius: '4px',
    display: 'flex',
    padding: '3px',
    gap: '1px',
    backgroundColor: isSelected ? '#f0f8ff' : '#fafafa',
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  const cellStyle: React.CSSProperties = {
    backgroundColor: isSelected ? '#1890ff' : '#bfbfbf',
    borderRadius: '1px',
  };

  switch (type) {
    case 'double': // 左小右大
      return (
        <div style={iconStyle}>
          <div style={{ ...cellStyle, width: '40%', height: '100%' }} />
          <div style={{ ...cellStyle, width: '60%', height: '100%' }} />
        </div>
      );

    case 'triple': // 左1右2
      return (
        <div style={iconStyle}>
          <div style={{ ...cellStyle, width: '50%', height: '100%' }} />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '50%',
              gap: '1px',
            }}
          >
            <div style={{ ...cellStyle, height: '49%' }} />
            <div style={{ ...cellStyle, height: '49%' }} />
          </div>
        </div>
      );

    case 'bisect_2': // 双列一行 (2图)
      return (
        <div style={iconStyle}>
          <div style={{ ...cellStyle, width: '49%', height: '100%' }} />
          <div style={{ ...cellStyle, width: '50%', height: '100%' }} />
        </div>
      );

    case 'bisect_4': // 双列两行 (4图)
      return (
        <div style={{ ...iconStyle, flexDirection: 'column', gap: '1px' }}>
          <div
            style={{
              display: 'flex',
              width: '100%',
              height: '50%',
              gap: '1px',
            }}
          >
            <div style={{ ...cellStyle, width: '50%' }} />
            <div style={{ ...cellStyle, width: '50%' }} />
          </div>
          <div
            style={{
              display: 'flex',
              width: '100%',
              height: '50%',
              gap: '1px',
            }}
          >
            <div style={{ ...cellStyle, width: '50%' }} />
            <div style={{ ...cellStyle, width: '50%' }} />
          </div>
        </div>
      );

    case 'bisect_6': // 双列三行 (6图)
      return (
        <div style={{ ...iconStyle, flexDirection: 'column', gap: '1px' }}>
          <div
            style={{
              display: 'flex',
              width: '100%',
              height: 'calc(31.33% - 0.67px)',
              gap: '1px',
            }}
          >
            <div style={{ ...cellStyle, width: '50%' }} />
            <div style={{ ...cellStyle, width: '50%' }} />
          </div>
          <div
            style={{
              display: 'flex',
              width: '100%',
              height: 'calc(31.33% - 0.67px)',
              gap: '1px',
            }}
          >
            <div style={{ ...cellStyle, width: '50%' }} />
            <div style={{ ...cellStyle, width: '50%' }} />
          </div>
          <div
            style={{
              display: 'flex',
              width: '100%',
              height: 'calc(31.33% - 0.67px)',
              gap: '1px',
            }}
          >
            <div style={{ ...cellStyle, width: '50%' }} />
            <div style={{ ...cellStyle, width: '50%' }} />
          </div>
        </div>
      );

    case 'trisect_3': // 三列一行 (3图)
      return (
        <div style={iconStyle}>
          <div
            style={{
              ...cellStyle,
              width: 'calc(31.33% - 0.67px)',
              height: '100%',
            }}
          />
          <div
            style={{
              ...cellStyle,
              width: 'calc(31.33% - 0.67px)',
              height: '100%',
            }}
          />
          <div
            style={{
              ...cellStyle,
              width: 'calc(31.33% - 0.67px)',
              height: '100%',
            }}
          />
        </div>
      );

    case 'trisect_6': // 三列两行 (6图)
      return (
        <div style={{ ...iconStyle, flexDirection: 'column', gap: '1px' }}>
          <div
            style={{
              display: 'flex',
              width: '100%',
              height: '50%',
              gap: '1px',
            }}
          >
            <div style={{ ...cellStyle, width: 'calc(33.33% - 0.67px)' }} />
            <div style={{ ...cellStyle, width: 'calc(33.33% - 0.67px)' }} />
            <div style={{ ...cellStyle, width: 'calc(33.33% - 0.67px)' }} />
          </div>
          <div
            style={{
              display: 'flex',
              width: '100%',
              height: '50%',
              gap: '1px',
            }}
          >
            <div style={{ ...cellStyle, width: 'calc(33.33% - 0.67px)' }} />
            <div style={{ ...cellStyle, width: 'calc(33.33% - 0.67px)' }} />
            <div style={{ ...cellStyle, width: 'calc(33.33% - 0.67px)' }} />
          </div>
        </div>
      );

    case 'trisect_9': // 三列三行 (9图)
      return (
        <div style={{ ...iconStyle, flexDirection: 'column', gap: '1px' }}>
          <div
            style={{
              display: 'flex',
              width: '100%',
              height: 'calc(32.33% - 0.67px)',
              gap: '1px',
            }}
          >
            <div style={{ ...cellStyle, width: 'calc(33.33% - 0.67px)' }} />
            <div style={{ ...cellStyle, width: 'calc(33.33% - 0.67px)' }} />
            <div style={{ ...cellStyle, width: 'calc(33.33% - 0.67px)' }} />
          </div>
          <div
            style={{
              display: 'flex',
              width: '100%',
              height: 'calc(32.33% - 0.67px)',
              gap: '1px',
            }}
          >
            <div style={{ ...cellStyle, width: 'calc(33.33% - 0.67px)' }} />
            <div style={{ ...cellStyle, width: 'calc(33.33% - 0.67px)' }} />
            <div style={{ ...cellStyle, width: 'calc(33.33% - 0.67px)' }} />
          </div>
          <div
            style={{
              display: 'flex',
              width: '100%',
              height: 'calc(32.33% - 0.67px)',
              gap: '1px',
            }}
          >
            <div style={{ ...cellStyle, width: 'calc(33.33% - 0.67px)' }} />
            <div style={{ ...cellStyle, width: 'calc(33.33% - 0.67px)' }} />
            <div style={{ ...cellStyle, width: 'calc(33.33% - 0.67px)' }} />
          </div>
        </div>
      );

    default:
      return <div style={iconStyle} />;
  }
};

// 获取所有可用的布局选项（不受图片数量限制）
const getAvailableLayouts = () => {
  const layouts = [
    // 固定布局模式
    { key: 'double', label: '双图模式（左小右大）', type: 'double' as const },
    { key: 'triple', label: '三图模式（左1右2）', type: 'triple' as const },

    // 等分双列模式
    { key: 'bisect_2', label: '双列一行（2图）', type: 'bisect_2' as const },
    { key: 'bisect_4', label: '双列两行（4图）', type: 'bisect_4' as const },
    { key: 'bisect_6', label: '双列三行（6图）', type: 'bisect_6' as const },

    // 等分三列模式
    { key: 'trisect_3', label: '三列一行（3图）', type: 'trisect_3' as const },
    { key: 'trisect_6', label: '三列两行（6图）', type: 'trisect_6' as const },
    { key: 'trisect_9', label: '三列三行（9图）', type: 'trisect_9' as const },
  ];

  return layouts;
};

// 将布局类型映射到 combination_mode（简化版本）
const layoutToCombinationMode = (layoutType: string) => {
  switch (layoutType) {
    case 'double':
      return 'double';
    case 'triple':
      return 'triple';
    case 'bisect_2':
    case 'bisect_4':
    case 'bisect_6':
      return 'bisect'; // 双列模式统一为 bisect
    case 'trisect_3':
    case 'trisect_6':
    case 'trisect_9':
      return 'trisect'; // 三列模式统一为 trisect
    default:
      return 'double';
  }
};

// 根据 combination_mode 和图片数量推断具体的布局类型
const getLayoutTypeFromModeAndCount = (
  combinationMode: string,
  imageCount: number,
): string => {
  // 如果 combination_mode 本身就是详细的布局类型，直接返回
  const detailedModes = [
    'bisect_2',
    'bisect_4',
    'bisect_6',
    'trisect_3',
    'trisect_6',
    'trisect_9',
  ];
  if (detailedModes.includes(combinationMode)) {
    return combinationMode;
  }

  switch (combinationMode) {
    case 'double':
      return 'double';
    case 'triple':
      return 'triple';
    case 'bisect':
      // 根据图片数量精确推断双列布局类型
      if (imageCount === 2) return 'bisect_2';
      if (imageCount === 4) return 'bisect_4';
      if (imageCount === 6) return 'bisect_6';
      // 如果是其他数量，根据最接近的布局推断
      if (imageCount < 3) return 'bisect_2';
      if (imageCount < 5) return 'bisect_4';
      return 'bisect_6';
    case 'trisect':
      // 根据图片数量精确推断三列布局类型
      if (imageCount === 3) return 'trisect_3';
      if (imageCount === 6) return 'trisect_6';
      if (imageCount === 9) return 'trisect_9';
      // 如果是其他数量，根据最接近的布局推断
      if (imageCount < 5) return 'trisect_3';
      if (imageCount < 8) return 'trisect_6';
      return 'trisect_9';
    default:
      return 'double';
  }
};

// 根据布局类型获取所需的图片数量
const getImageCountForLayout = (layoutType: string): number => {
  switch (layoutType) {
    case 'double':
      return 2; // 双图模式
    case 'triple':
      return 3; // 三图模式
    case 'bisect_2':
      return 2; // 双列一行（2图）
    case 'bisect_4':
      return 4; // 双列两行（4图）
    case 'bisect_6':
      return 6; // 双列三行（6图）
    case 'trisect_3':
      return 3; // 三列一行（3图）
    case 'trisect_6':
      return 6; // 三列两行（6图）
    case 'trisect_9':
      return 9; // 三列三行（9图）
    default:
      return 2;
  }
};

// 全局状态管理 - 记录用户选择的布局类型（不保存到全局数据）
// 这个状态在页面刷新时会重置，但在用户操作期间会保持
class LayoutChoiceManager {
  private static instance: LayoutChoiceManager;
  private choices = new Map<string, string>();

  static getInstance(): LayoutChoiceManager {
    if (!LayoutChoiceManager.instance) {
      LayoutChoiceManager.instance = new LayoutChoiceManager();
    }
    return LayoutChoiceManager.instance;
  }

  setChoice(componentId: string, layoutType: string) {
    this.choices.set(componentId, layoutType);
  }

  getChoice(componentId: string): string | undefined {
    return this.choices.get(componentId);
  }

  clearChoice(componentId: string) {
    this.choices.delete(componentId);
  }
}

const layoutChoiceManager = LayoutChoiceManager.getInstance();

// 导出函数供渲染器使用
export const getComponentLayoutChoice = (
  componentId: string,
): string | undefined => {
  return layoutChoiceManager.getChoice(componentId);
};

const ImgCombinationComponent: React.FC<ImgCombinationComponentProps> = ({
  selectedComponent,
  selectedPath,
  cardData,
  variables,
  topLevelTab,
  setTopLevelTab,
  multiImageContentMode,
  setMultiImageContentMode,
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
}) => {
  const [form] = Form.useForm();
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

  // 使用通用的组件名称编辑Hook
  const { componentNameInfo, handleNameChange } = useComponentName({
    selectedComponent,
    prefix: 'ImgCombination_',
    handleValueChange,
  });

  // 获取最新的组件数据
  const getLatestSelectedComponent = (): any => {
    if (!cardData || !selectedPath) {
      return selectedComponent;
    }
    try {
      const result = getComponentRealPath(cardData, selectedPath);
      if (!result) {
        console.warn('🔍 getComponentRealPath返回空结果');
        return selectedComponent;
      }

      const { component } = result;
      if (!component) {
        return selectedComponent;
      }

      return component;
    } catch (error) {
      console.warn('❌ 获取最新组件数据失败，使用fallback:', error);
      return selectedComponent;
    }
  };

  // 多图混排组件模式同步 - 根据组件状态初始化模式
  useEffect(() => {
    if (selectedComponent && selectedComponent.tag === 'img_combination') {
      // 检查是否有变量绑定
      const hasVariableBinding =
        typeof selectedComponent.img_list === 'string' &&
        selectedComponent.img_list.includes('${');

      // 只在组件首次选中时设置模式，不要在变量绑定变化时重新设置
      if (!initializedComponents.has(selectedComponent.id)) {
        // 如果当前img_list不是变量占位符，保存为用户编辑的图片列表
        if (Array.isArray(selectedComponent.img_list) && !hasVariableBinding) {
          multiImageComponentStateManager.setUserEditedImageList(
            selectedComponent.id,
            selectedComponent.img_list,
          );
        }

        // 默认显示"指定"模式，除非当前组件有绑定变量
        const expectedMode = hasVariableBinding ? 'variable' : 'specify';
        setMultiImageContentMode(expectedMode);

        // 标记该组件已初始化，避免后续重复设置
        initializedComponents.add(selectedComponent.id);
      }

      // 如果当前组件有绑定变量，记住它（但不覆盖已有的记忆）
      if (
        hasVariableBinding &&
        typeof selectedComponent.img_list === 'string'
      ) {
        const variableMatch = selectedComponent.img_list.match(/\$\{([^}]+)\}/);
        if (variableMatch && variableMatch[1]) {
          const variableName = variableMatch[1];
          if (!lastBoundVariables[selectedComponent.id]) {
            setLastBoundVariables((prev) => ({
              ...prev,
              [selectedComponent.id]: variableName,
            }));
            console.log('🔗 记住多图混排变量绑定:', {
              componentId: selectedComponent.id,
              variableName,
            });
          }
        }
      }
    }
  }, [selectedComponent]);

  // 监听布局模式变化，自动调整图片数量（仅在指定模式下）
  useEffect(() => {
    if (
      selectedComponent &&
      selectedComponent.tag === 'img_combination' &&
      multiImageContentMode === 'specify'
    ) {
      // 获取最新组件数据
      const latestComponent = getLatestSelectedComponent();

      // 安全检查：确保获取到了有效的组件数据
      if (!latestComponent) {
        console.warn('⚠️ useEffect中无法获取最新组件数据，跳过处理');
        return;
      }

      const currentCombinationMode =
        (latestComponent as any).combination_mode || 'double';

      const currentImageList = Array.isArray(
        (selectedComponent as any).img_list,
      )
        ? (selectedComponent as any).img_list
        : [];

      // 注意：latestComponent 已经在上面定义过了，这里不需要重新声明

      // 根据 combination_mode 和图片数量推断当前布局类型（不再使用保存的layoutType）
      const currentLayoutType = getLayoutTypeFromModeAndCount(
        currentCombinationMode,
        currentImageList.length,
      );
      const requiredImageCount = getImageCountForLayout(currentLayoutType);

      // 只有当图片数量不匹配时才调整
      if (currentImageList.length !== requiredImageCount) {
        // 切换布局时不保留之前的图片，统一使用默认值 demo.png
        const newImageList = [];
        for (let i = 0; i < requiredImageCount; i++) {
          newImageList.push({
            img_url: 'demo.png',
            i18n_img_url: { 'en-US': 'demo.png' },
          });
        }

        // 保存到状态管理器
        multiImageComponentStateManager.setUserEditedImageList(
          selectedComponent.id,
          newImageList,
        );

        // 更新组件数据
        const updatedComponent = { ...selectedComponent };
        (updatedComponent as any).img_list = newImageList;

        console.log('🔄 useEffect-多图混排-调整图片数量:', {
          componentId: selectedComponent.id,
          combinationMode: currentCombinationMode,
          currentLayoutType,
          requiredImageCount,
          oldListLength: currentImageList.length,
          newImageList,
          trigger: 'useEffect',
          note: '切换布局时使用默认图片，不保留缓存',
        });

        // 延迟更新避免状态冲突
        setTimeout(() => {
          onUpdateComponent(updatedComponent);
        }, 0);
      }
    }
  }, [
    selectedComponent?.id,
    (selectedComponent as any)?.combination_mode,
    (selectedComponent as any)?.layoutType,
    multiImageContentMode,
  ]);

  return (
    <div style={STYLES.container}>
      <AddVariableModal
        visible={isVariableModalVisible}
        onOk={handleVariableModalOk || (() => {})}
        onCancel={handleVariableModalCancel || (() => {})}
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
              <div style={STYLES.contentPadding}>
                <div style={STYLES.infoBox}>
                  <Text style={{ fontSize: '12px', color: '#0369a1' }}>
                    🎯 当前选中：多图混排组件
                  </Text>
                </div>

                {/* 布局设置 */}
                <div style={STYLES.section}>
                  <div style={STYLES.sectionTitle}>📐 布局设置</div>
                  <Form form={form} layout="vertical">
                    <ComponentNameInput
                      prefix="ImgCombination_"
                      suffix={componentNameInfo.suffix}
                      onChange={handleNameChange}
                    />

                    <Form.Item label="布局模式">
                      {(() => {
                        // 获取当前图片数量
                        let imageCount = 0;
                        let currentImageList = [];

                        if (multiImageContentMode === 'specify') {
                          // 指定模式：从图片数组获取数量
                          currentImageList = Array.isArray(
                            (selectedComponent as any).img_list,
                          )
                            ? (selectedComponent as any).img_list
                            : [];
                          imageCount = currentImageList.length;
                        } else if (multiImageContentMode === 'variable') {
                          // 变量模式：从 combination_mode 和变量图片数量动态推断布局类型
                          const currentCombinationMode =
                            (selectedComponent as any).combination_mode ||
                            'double';

                          // 获取变量中的实际图片数量
                          // 需要重新解析变量获取图片列表
                          let actualImageCount = 0;
                          if (
                            typeof (selectedComponent as any).img_list ===
                              'string' &&
                            (selectedComponent as any).img_list.includes('${')
                          ) {
                            const variableMatch = (
                              selectedComponent as any
                            ).img_list.match(/\$\{([^}]+)\}/);
                            if (variableMatch && variableMatch[1]) {
                              const variableName = variableMatch[1];
                              const variable = variables.find((v) => {
                                if (typeof v === 'object' && v !== null) {
                                  const keys = Object.keys(
                                    v as Record<string, any>,
                                  );
                                  return (
                                    keys.length > 0 && keys[0] === variableName
                                  );
                                }
                                return false;
                              });
                              if (variable) {
                                const variableValue = (
                                  variable as Record<string, any>
                                )[variableName];
                                if (Array.isArray(variableValue)) {
                                  actualImageCount = variableValue.length;
                                }
                              }
                            }
                          }

                          let currentLayoutType;

                          // 根据 combination_mode 和实际图片数量动态推断布局类型
                          const detailedModes = [
                            'bisect_2',
                            'bisect_4',
                            'bisect_6',
                            'trisect_3',
                            'trisect_6',
                            'trisect_9',
                            'double',
                            'triple',
                          ];

                          if (detailedModes.includes(currentCombinationMode)) {
                            // 如果是具体的布局类型，直接使用
                            currentLayoutType = currentCombinationMode;
                          } else {
                            // 对于简化的模式，根据实际图片数量智能推断
                            switch (currentCombinationMode) {
                              case 'bisect':
                                if (actualImageCount <= 2)
                                  currentLayoutType = 'bisect_2';
                                else if (actualImageCount <= 4)
                                  currentLayoutType = 'bisect_4';
                                else currentLayoutType = 'bisect_6';
                                break;
                              case 'trisect':
                                if (actualImageCount <= 3)
                                  currentLayoutType = 'trisect_3';
                                else if (actualImageCount <= 6)
                                  currentLayoutType = 'trisect_6';
                                else currentLayoutType = 'trisect_9';
                                break;
                              default:
                                currentLayoutType = 'double';
                            }
                          }

                          imageCount =
                            getImageCountForLayout(currentLayoutType);
                        }

                        // 获取可用的布局选项
                        const availableLayouts = getAvailableLayouts();

                        // 获取最新的组件数据
                        const latestComponent = getLatestSelectedComponent();

                        // 安全检查：确保获取到了有效的组件数据
                        if (!latestComponent) {
                          // 使用fallback数据
                          const fallbackCombinationMode =
                            (selectedComponent as any).combination_mode ||
                            'double';

                          // 完全基于 combination_mode 和图片数量动态推断布局类型
                          let fallbackCurrentLayoutType;
                          if (multiImageContentMode === 'variable') {
                            // 变量模式：根据 combination_mode 和实际图片数量推断
                            // 需要重新解析变量获取图片列表
                            let actualImageCount = 0;
                            if (
                              typeof (selectedComponent as any).img_list ===
                                'string' &&
                              (selectedComponent as any).img_list.includes('${')
                            ) {
                              const variableMatch = (
                                selectedComponent as any
                              ).img_list.match(/\$\{([^}]+)\}/);
                              if (variableMatch && variableMatch[1]) {
                                const variableName = variableMatch[1];
                                const variable = variables.find((v) => {
                                  if (typeof v === 'object' && v !== null) {
                                    const keys = Object.keys(
                                      v as Record<string, any>,
                                    );
                                    return (
                                      keys.length > 0 &&
                                      keys[0] === variableName
                                    );
                                  }
                                  return false;
                                });
                                if (variable) {
                                  const variableValue = (
                                    variable as Record<string, any>
                                  )[variableName];
                                  if (Array.isArray(variableValue)) {
                                    actualImageCount = variableValue.length;
                                  }
                                }
                              }
                            }
                            fallbackCurrentLayoutType =
                              getLayoutTypeFromModeAndCount(
                                fallbackCombinationMode,
                                actualImageCount,
                              );
                          } else {
                            // 指定模式：从 combination_mode 和图片数量推断
                            fallbackCurrentLayoutType =
                              getLayoutTypeFromModeAndCount(
                                fallbackCombinationMode,
                                imageCount,
                              );
                          }

                          return (
                            <div>
                              <div
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(4, 1fr)',
                                  gap: '8px',
                                }}
                              >
                                {availableLayouts.map((layout) => (
                                  <div
                                    key={layout.key}
                                    onClick={() => {
                                      const newCombinationMode =
                                        layoutToCombinationMode(layout.type);
                                      const requiredImageCount =
                                        getImageCountForLayout(layout.type);

                                      // 记录用户选择的具体布局类型（仅用于UI显示）
                                      layoutChoiceManager.setChoice(
                                        selectedComponent.id,
                                        layout.type,
                                      );

                                      console.log('🎯 用户选择布局:', {
                                        componentId: selectedComponent.id,
                                        selectedLayoutType: layout.type,
                                        newCombinationMode,
                                        requiredImageCount,
                                        currentMode: multiImageContentMode,
                                        timestamp: new Date().toISOString(),
                                      });

                                      handleValueChange(
                                        'combination_mode',
                                        newCombinationMode,
                                      );
                                      setTimeout(() => {
                                        forceUpdate();
                                      }, 50);

                                      // 根据当前模式处理图片列表
                                      if (multiImageContentMode === 'specify') {
                                        multiImageComponentStateManager.setUserEditedImageList(
                                          selectedComponent.id,
                                          [],
                                        );
                                        const newImageList = [];
                                        for (
                                          let i = 0;
                                          i < requiredImageCount;
                                          i++
                                        ) {
                                          newImageList.push({
                                            img_url: DEFAULT_IMAGE_URL,
                                            i18n_img_url: {
                                              'en-US': DEFAULT_IMAGE_URL,
                                            },
                                          });
                                        }
                                        handleValueChange(
                                          'img_list',
                                          newImageList,
                                        );
                                      } else if (
                                        multiImageContentMode === 'variable'
                                      ) {
                                        // 变量模式：只更新布局模式，不修改图片列表
                                        console.log(
                                          '🔗 变量绑定模式下切换布局 (fallback):',
                                          {
                                            componentId: selectedComponent.id,
                                            newCombinationMode,
                                            layoutType: layout.type,
                                            note: '变量模式下不更新img_list',
                                          },
                                        );
                                        // 在变量模式下，不需要更新 img_list
                                      }
                                    }}
                                  >
                                    <LayoutIcon
                                      type={layout.type}
                                      isSelected={(() => {
                                        const currentCombinationMode = (
                                          selectedComponent as any
                                        ).combination_mode;
                                        const userChosenLayout =
                                          layoutChoiceManager.getChoice(
                                            selectedComponent.id,
                                          );

                                        // 如果有用户选择的记录，优先使用
                                        if (userChosenLayout) {
                                          return (
                                            userChosenLayout === layout.type
                                          );
                                        }

                                        // 如果是精确匹配，直接选中
                                        if (
                                          currentCombinationMode === layout.type
                                        ) {
                                          return true;
                                        }

                                        // 如果是简化模式，根据图片数量智能推断
                                        const layoutCombinationMode =
                                          layoutToCombinationMode(layout.type);
                                        if (
                                          currentCombinationMode ===
                                          layoutCombinationMode
                                        ) {
                                          // 推断最可能的布局类型
                                          const inferredLayoutType =
                                            fallbackCurrentLayoutType;
                                          return (
                                            inferredLayoutType === layout.type
                                          );
                                        }
                                        return false;
                                      })()}
                                    />
                                    <Text
                                      style={{
                                        fontSize: '12px',
                                        textAlign: 'center',
                                        display: 'block',
                                        marginTop: '4px',
                                      }}
                                    >
                                      {layout.label}
                                    </Text>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }

                        // 获取当前选中的布局模式
                        const currentCombinationMode =
                          (latestComponent as any).combination_mode || 'double';

                        // 完全基于 combination_mode 和图片数量动态推断布局类型
                        let currentLayoutType;
                        if (multiImageContentMode === 'variable') {
                          // 变量模式：根据 combination_mode 和实际图片数量推断
                          // 需要重新解析变量获取图片列表
                          let actualImageCount = 0;
                          if (
                            typeof (selectedComponent as any).img_list ===
                              'string' &&
                            (selectedComponent as any).img_list.includes('${')
                          ) {
                            const variableMatch = (
                              selectedComponent as any
                            ).img_list.match(/\$\{([^}]+)\}/);
                            if (variableMatch && variableMatch[1]) {
                              const variableName = variableMatch[1];
                              const variable = variables.find((v) => {
                                if (typeof v === 'object' && v !== null) {
                                  const keys = Object.keys(
                                    v as Record<string, any>,
                                  );
                                  return (
                                    keys.length > 0 && keys[0] === variableName
                                  );
                                }
                                return false;
                              });
                              if (variable) {
                                const variableValue = (
                                  variable as Record<string, any>
                                )[variableName];
                                if (Array.isArray(variableValue)) {
                                  actualImageCount = variableValue.length;
                                }
                              }
                            }
                          }
                          currentLayoutType = getLayoutTypeFromModeAndCount(
                            currentCombinationMode,
                            actualImageCount,
                          );
                        } else {
                          // 指定模式：从 combination_mode 和图片数量推断
                          currentLayoutType = getLayoutTypeFromModeAndCount(
                            currentCombinationMode,
                            imageCount,
                          );
                        }

                        return (
                          <div>
                            <div style={STYLES.layoutGrid}>
                              {availableLayouts.map((layout) => (
                                <div
                                  key={layout.key}
                                  onClick={() => {
                                    const newCombinationMode =
                                      layoutToCombinationMode(layout.type);
                                    const requiredImageCount =
                                      getImageCountForLayout(layout.type);

                                    // 记录用户选择的具体布局类型（仅用于UI显示）
                                    layoutChoiceManager.setChoice(
                                      selectedComponent.id,
                                      layout.type,
                                    );

                                    // 创建更新后的组件数据
                                    let updatedComponent = {
                                      ...latestComponent,
                                      combination_mode: newCombinationMode,
                                    };

                                    // 根据当前模式处理图片列表
                                    if (multiImageContentMode === 'specify') {
                                      // 指定模式：清除缓存并创建匹配布局的图片列表
                                      multiImageComponentStateManager.setUserEditedImageList(
                                        selectedComponent.id,
                                        [], // 清空缓存
                                      );

                                      // 创建匹配布局的图片列表
                                      const newImageList = [];
                                      for (
                                        let i = 0;
                                        i < requiredImageCount;
                                        i++
                                      ) {
                                        newImageList.push({
                                          img_url: DEFAULT_IMAGE_URL,
                                          i18n_img_url: {
                                            'en-US': DEFAULT_IMAGE_URL,
                                          },
                                        });
                                      }

                                      updatedComponent = {
                                        ...updatedComponent,
                                        img_list: newImageList,
                                      };
                                    } else if (
                                      multiImageContentMode === 'variable'
                                    ) {
                                      // 变量模式：保持变量占位符不变，只更新布局模式
                                      console.log(
                                        '🔗 变量绑定模式下切换布局:',
                                        {
                                          componentId: selectedComponent.id,
                                          newCombinationMode,
                                          layoutType: layout.type,
                                          currentImgList: (
                                            updatedComponent as any
                                          ).img_list,
                                          note: '变量模式下保持img_list为变量占位符',
                                        },
                                      );
                                      // 在变量模式下，img_list 应该保持为变量占位符字符串
                                      // 不需要修改 img_list，只更新 combination_mode
                                    }

                                    // 一次性调用组件更新
                                    onUpdateComponent(updatedComponent);

                                    // 强制重新渲染以确保UI更新
                                    setTimeout(() => {
                                      forceUpdate();
                                    }, 50);
                                  }}
                                  style={STYLES.layoutItem}
                                >
                                  <LayoutIcon
                                    type={layout.type}
                                    isSelected={(() => {
                                      const currentCombinationMode = (
                                        latestComponent as any
                                      ).combination_mode;
                                      const userChosenLayout =
                                        layoutChoiceManager.getChoice(
                                          selectedComponent.id,
                                        );

                                      // 如果有用户选择的记录，优先使用
                                      if (userChosenLayout) {
                                        return userChosenLayout === layout.type;
                                      }

                                      // 如果是精确匹配，直接选中
                                      if (
                                        currentCombinationMode === layout.type
                                      ) {
                                        return true;
                                      }

                                      // 如果是简化模式，根据图片数量智能推断
                                      const layoutCombinationMode =
                                        layoutToCombinationMode(layout.type);
                                      if (
                                        currentCombinationMode ===
                                        layoutCombinationMode
                                      ) {
                                        // 推断最可能的布局类型
                                        const inferredLayoutType =
                                          getLayoutTypeFromModeAndCount(
                                            currentCombinationMode,
                                            imageCount,
                                          );
                                        return (
                                          inferredLayoutType === layout.type
                                        );
                                      }
                                      return false;
                                    })()}
                                  />
                                  <Text
                                    style={{
                                      fontSize: '11px',
                                      textAlign: 'center',
                                      color:
                                        currentLayoutType === layout.type
                                          ? '#1890ff'
                                          : '#666',
                                      fontWeight:
                                        currentLayoutType === layout.type
                                          ? 600
                                          : 400,
                                    }}
                                  >
                                    {layout.label}
                                  </Text>
                                </div>
                              ))}
                            </div>

                            <div style={{ marginTop: '8px' }}>
                              <div>
                                <Text
                                  type="secondary"
                                  style={{ fontSize: '12px' }}
                                >
                                  当前图片数量：{imageCount} 张
                                </Text>
                                <br />
                                <Text
                                  type="secondary"
                                  style={{ fontSize: '11px' }}
                                >
                                  当前模式：{currentCombinationMode} (
                                  {currentLayoutType})
                                </Text>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </Form.Item>
                  </Form>
                </div>

                {/* 图片设置 */}
                <div style={STYLES.section}>
                  <div style={STYLES.sectionTitle}>🖼️ 图片设置</div>
                  <Form form={form} layout="vertical">
                    <Form.Item label="图片来源">
                      <Segmented
                        value={multiImageContentMode}
                        style={{ marginBottom: 16 }}
                        onChange={(value) => {
                          const newMode = value as 'specify' | 'variable';
                          setMultiImageContentMode(newMode);

                          // 处理模式切换时的图片显示逻辑（与图片组件保持一致）
                          const updatedComponent = { ...selectedComponent };

                          if (newMode === 'specify') {
                            // 切换到指定模式：恢复用户编辑的图片列表
                            const userEditedImageList =
                              multiImageComponentStateManager.getUserEditedImageList(
                                selectedComponent.id,
                              );
                            (updatedComponent as any).img_list =
                              userEditedImageList || [];
                          } else {
                            // 切换到变量模式：检查是否有绑定的变量
                            const boundVariable =
                              multiImageComponentStateManager.getBoundVariableName(
                                selectedComponent.id,
                              );
                            const rememberedVariable =
                              lastBoundVariables[selectedComponent.id];

                            if (boundVariable || rememberedVariable) {
                              // 如果有绑定变量，显示变量占位符
                              const variableName =
                                boundVariable || rememberedVariable;
                              (
                                updatedComponent as any
                              ).img_list = `\${${variableName}}`;
                            } else {
                              // 如果没有绑定变量，保持当前指定的图片列表
                              const currentImageList = Array.isArray(
                                (selectedComponent as any).img_list,
                              )
                                ? (selectedComponent as any).img_list
                                : [];

                              // 保存当前图片列表到状态管理器
                              multiImageComponentStateManager.setUserEditedImageList(
                                selectedComponent.id,
                                currentImageList,
                              );
                            }
                          }

                          onUpdateComponent(updatedComponent);
                        }}
                        options={[
                          { label: '指定', value: 'specify' },
                          { label: '绑定变量', value: 'variable' },
                        ]}
                      />

                      {multiImageContentMode === 'specify' && (
                        <div style={{ marginBottom: 16 }}>
                          {(() => {
                            // 获取当前组件的图片列表
                            let currentImageList = Array.isArray(
                              (selectedComponent as any).img_list,
                            )
                              ? (selectedComponent as any).img_list
                              : [];

                            return currentImageList.map(
                              (image: any, index: number) => (
                                <div
                                  key={`image-${index}`}
                                  style={{
                                    marginBottom: 16,
                                  }}
                                >
                                  <Text
                                    strong
                                    style={{
                                      display: 'block',
                                      marginBottom: 8,
                                      color: '#1976d2',
                                    }}
                                  >
                                    图片 {index + 1}
                                  </Text>
                                  <Space.Compact style={STYLES.inputCompact}>
                                    <Input
                                      value={image.img_url || ''}
                                      onChange={(e) => {
                                        const newImageList = [
                                          ...currentImageList,
                                        ];
                                        newImageList[index] = {
                                          ...newImageList[index],
                                          img_url: e.target.value,
                                          i18n_img_url: {
                                            'en-US': e.target.value,
                                          },
                                        };

                                        // 保存用户编辑的图片列表到状态管理器（缓存策略）
                                        multiImageComponentStateManager.setUserEditedImageList(
                                          selectedComponent.id,
                                          newImageList,
                                        );
                                        handleValueChange(
                                          'img_list',
                                          newImageList,
                                        );
                                      }}
                                      placeholder="请输入图片路径或选择上传"
                                      style={{ flex: 1 }}
                                    />
                                    <ImageUpload
                                      onUploadSuccess={(imageUrl) => {
                                        const newImageList = [
                                          ...currentImageList,
                                        ];
                                        newImageList[index] = {
                                          ...newImageList[index],
                                          img_url: imageUrl,
                                          i18n_img_url: {
                                            'en-US': imageUrl,
                                          },
                                        };

                                        // 保存用户上传的图片列表到状态管理器（缓存策略）
                                        multiImageComponentStateManager.setUserEditedImageList(
                                          selectedComponent.id,
                                          newImageList,
                                        );
                                        handleValueChange(
                                          'img_list',
                                          newImageList,
                                        );
                                      }}
                                      style={STYLES.uploadButton}
                                      buttonProps={{
                                        type: 'primary',
                                        children: '上传',
                                        title: '上传图片',
                                      }}
                                    />
                                  </Space.Compact>
                                </div>
                              ),
                            );
                          })()}
                        </div>
                      )}

                      {multiImageContentMode === 'variable' && (
                        <div>
                          <VariableBinding
                            componentType="img_combination"
                            variables={variables}
                            getFilteredVariables={getFilteredVariables}
                            value={(() => {
                              const rememberedVariable = selectedComponent
                                ? lastBoundVariables[selectedComponent.id]
                                : undefined;
                              const currentBoundVariable =
                                multiImageComponentStateManager.getBoundVariableName(
                                  selectedComponent.id,
                                );
                              return rememberedVariable || currentBoundVariable;
                            })()}
                            onChange={(value: string | undefined) => {
                              if (selectedComponent) {
                                if (value) {
                                  // 绑定变量时
                                  setLastBoundVariables((prev) => ({
                                    ...prev,
                                    [selectedComponent.id]: value,
                                  }));

                                  multiImageComponentStateManager.setBoundVariableName(
                                    selectedComponent.id,
                                    value,
                                  );

                                  const updatedComponent = {
                                    ...selectedComponent,
                                  };
                                  const variablePlaceholder = `\${${value}}`;
                                  (updatedComponent as any).img_list =
                                    variablePlaceholder;

                                  onUpdateComponent(updatedComponent);
                                } else {
                                  // 清除变量绑定时
                                  setLastBoundVariables((prev) => {
                                    const newState = { ...prev };
                                    delete newState[selectedComponent.id];
                                    return newState;
                                  });

                                  multiImageComponentStateManager.setBoundVariableName(
                                    selectedComponent.id,
                                    '',
                                  );

                                  // 清除绑定变量后，根据当前模式决定显示的图片
                                  const updatedComponent = {
                                    ...selectedComponent,
                                  };

                                  if (multiImageContentMode === 'variable') {
                                    // 在变量模式下清除绑定，显示指定图片列表（如果有的话）
                                    const userEditedImageList =
                                      multiImageComponentStateManager.getUserEditedImageList(
                                        selectedComponent.id,
                                      );
                                    (updatedComponent as any).img_list =
                                      userEditedImageList || [];
                                  } else {
                                    // 在指定模式下（理论上不会发生）
                                    (updatedComponent as any).img_list = [];
                                  }

                                  onUpdateComponent(updatedComponent);
                                }
                              }
                            }}
                            getVariableDisplayName={getVariableDisplayName}
                            getVariableKeys={getVariableKeys}
                            onAddVariable={() =>
                              handleAddVariableFromComponent('img_combination')
                            }
                            placeholder="请选择要绑定的变量"
                            label="绑定变量"
                            addVariableText="新建图片数组变量"
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

export default ImgCombinationComponent;
