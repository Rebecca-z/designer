// ImgCombinationComponent 编辑界面 - 多图混排组件
import { Form, Input, Segmented, Space, Typography } from 'antd';
import React, { useEffect } from 'react';
import ImageUpload from '../../../ImageUpload';
import VariableBinding from '../../../Variable/VariableList';
import { multiImageComponentStateManager } from '../../../Variable/utils/index';
import { defaultImg } from '../../../utils';
import { getComponentRealPath } from '../../utils';
import { PropertyPanel, SettingSection } from '../common';
import ComponentNameInput from '../common/ComponentNameInput';
import { useComponentName } from '../hooks/useComponentName';
import { ImgCombinationComponentProps } from '../types';
import styles from './index.less';

const { Text } = Typography;
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
    border: `2px solid ${isSelected ? '#1890ff' : '#d9d9d9'}`,
    backgroundColor: isSelected ? '#f0f8ff' : '#fafafa',
  };

  const cellStyle: React.CSSProperties = {
    backgroundColor: isSelected ? '#1890ff' : '#bfbfbf',
    borderRadius: '1px',
  };

  switch (type) {
    case 'double': // 左小右大
      return (
        <div className={styles.iconLayout} style={iconStyle}>
          <div style={{ ...cellStyle, width: '40%', height: '100%' }} />
          <div style={{ ...cellStyle, width: '60%', height: '100%' }} />
        </div>
      );

    case 'triple': // 左1右2
      return (
        <div className={styles.iconLayout} style={iconStyle}>
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
        <div className={styles.iconLayout} style={iconStyle}>
          <div style={{ ...cellStyle, width: '49%', height: '100%' }} />
          <div style={{ ...cellStyle, width: '49%', height: '100%' }} />
        </div>
      );

    case 'bisect_4': // 双列两行 (4图)
      return (
        <div
          className={styles.iconLayout}
          style={{ ...iconStyle, flexDirection: 'column', gap: '1px' }}
        >
          {[1, 2].map((row) => (
            <div
              key={row}
              style={{
                display: 'flex',
                width: '100%',
                height: '49%',
                gap: '1px',
              }}
            >
              <div style={{ ...cellStyle, width: '50%' }} />
              <div style={{ ...cellStyle, width: '50%' }} />
            </div>
          ))}
        </div>
      );

    case 'bisect_6': // 双列三行 (6图)
      return (
        <div
          className={styles.iconLayout}
          style={{
            ...iconStyle,
            flexDirection: 'column',
            gap: '1px',
            justifyContent: 'space-between',
          }}
        >
          {[1, 2, 3].map((row) => (
            <div
              key={row}
              style={{
                display: 'flex',
                width: '100%',
                height: 'calc(30.33% - 0.67px)',
                gap: '1px',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ ...cellStyle, width: '50%' }} />
              <div style={{ ...cellStyle, width: '50%' }} />
            </div>
          ))}
        </div>
      );

    case 'trisect_3': // 三列一行 (3图)
      return (
        <div className={styles.iconLayout} style={iconStyle}>
          {[1, 2, 3].map((col) => (
            <div
              key={col}
              style={{
                ...cellStyle,
                width: 'calc(31.33% - 0.67px)',
                height: '100%',
              }}
            />
          ))}
        </div>
      );

    case 'trisect_6': // 三列两行 (6图)
      return (
        <div
          className={styles.iconLayout}
          style={{ ...iconStyle, flexDirection: 'column', gap: '1px' }}
        >
          {[1, 2].map((row) => (
            <div
              key={row}
              style={{
                display: 'flex',
                width: '100%',
                height: '50%',
                gap: '1px',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ ...cellStyle, width: 'calc(30.33% - 0.67px)' }} />
              <div style={{ ...cellStyle, width: 'calc(30.33% - 0.67px)' }} />
              <div style={{ ...cellStyle, width: 'calc(30.33% - 0.67px)' }} />
            </div>
          ))}
        </div>
      );

    case 'trisect_9': // 三列三行 (9图)
      return (
        <div
          className={styles.iconLayout}
          style={{
            ...iconStyle,
            flexDirection: 'column',
            gap: '1px',
            justifyContent: 'space-between',
          }}
        >
          {[1, 2, 3].map((row) => (
            <div
              key={row}
              style={{
                display: 'flex',
                width: '100%',
                height: 'calc(32.33% - 0.67px)',
                gap: '1px',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ ...cellStyle, width: 'calc(31.33% - 0.67px)' }} />
              <div style={{ ...cellStyle, width: 'calc(31.33% - 0.67px)' }} />
              <div style={{ ...cellStyle, width: 'calc(31.33% - 0.67px)' }} />
            </div>
          ))}
        </div>
      );

    default:
      return <div className={styles.iconLayout} style={iconStyle} />;
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

// 将layoutChoiceManager暴露到全局，供MediaRenderer使用
if (typeof window !== 'undefined') {
  (window as any).layoutChoiceManager = layoutChoiceManager;
}

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

  const toggleMode = (type: string) => {
    const newCombinationMode = layoutToCombinationMode(type);
    const requiredImageCount = getImageCountForLayout(type);
    const latestComponent = getLatestSelectedComponent();
    layoutChoiceManager.setChoice(selectedComponent.id, type);

    let updatedComponent = {
      ...latestComponent,
      combination_mode: newCombinationMode,
    };

    // 根据当前模式处理图片列表
    if (multiImageContentMode === 'specify') {
      // 指定模式：调整图片列表数量来匹配布局要求，并填充空缺位置
      const currentImageList = Array.isArray((latestComponent as any).img_list)
        ? (latestComponent as any).img_list
        : [];

      // 创建匹配布局要求数量的图片列表
      const newImageList = [];
      for (let i = 0; i < requiredImageCount; i++) {
        if (i < currentImageList.length && currentImageList[i]) {
          // 检查现有图片是否有效
          const existingImg = currentImageList[i];
          const hasValidUrl =
            existingImg.img_url && existingImg.img_url.trim() !== '';
          newImageList.push(hasValidUrl ? existingImg : defaultImg);
        } else {
          newImageList.push(defaultImg);
        }
      }

      // 保存到状态管理器
      multiImageComponentStateManager.setUserEditedImageList(
        selectedComponent.id,
        newImageList,
      );

      updatedComponent = {
        ...updatedComponent,
        img_list: newImageList,
      };
    }
    // 一次性调用组件更新
    onUpdateComponent(updatedComponent);

    // 强制重新渲染以确保UI更新
    setTimeout(() => {
      forceUpdate();
    }, 50);
  };

  const handleMutiImageChange = (newMode: 'specify' | 'variable') => {
    setMultiImageContentMode(newMode);
    // 处理模式切换时的图片显示逻辑
    const updatedComponent = { ...selectedComponent };
    if (newMode === 'specify') {
      // 切换到指定模式：恢复用户编辑的图片列表
      let userEditedImageList =
        multiImageComponentStateManager.getUserEditedImageList(
          selectedComponent.id,
        );

      // 如果没有缓存的图片列表，根据当前布局设置生成对应数量的图片输入框
      if (!userEditedImageList || userEditedImageList.length === 0) {
        const userChosenLayout = layoutChoiceManager.getChoice(
          selectedComponent.id,
        );
        let requiredImageCount = 0;

        if (userChosenLayout) {
          requiredImageCount = getImageCountForLayout(userChosenLayout);
        } else {
          // 根据当前的combination_mode推断
          const currentCombinationMode =
            (selectedComponent as any).combination_mode || 'double';
          const layoutType = getLayoutTypeFromModeAndCount(
            currentCombinationMode,
            0,
          );
          requiredImageCount = getImageCountForLayout(layoutType);

          // 记录推断的布局选择
          layoutChoiceManager.setChoice(selectedComponent.id, layoutType);
        }

        if (requiredImageCount > 0) {
          userEditedImageList = Array.from(
            { length: requiredImageCount },
            () => defaultImg,
          );
          multiImageComponentStateManager.setUserEditedImageList(
            selectedComponent.id,
            userEditedImageList,
          );
        }
      }

      // 使用生成的图片列表
      (updatedComponent as any).img_list = userEditedImageList || [];
    } else {
      // 切换到变量模式：先保存当前的指定图片列表，然后检查是否有绑定的变量
      const currentImageList = Array.isArray(
        (selectedComponent as any).img_list,
      )
        ? (selectedComponent as any).img_list
        : [];
      // 保存当前图片列表到状态管理器（缓存策略）
      if (currentImageList.length > 0) {
        multiImageComponentStateManager.setUserEditedImageList(
          selectedComponent.id,
          currentImageList,
        );
      }
      const boundVariable =
        multiImageComponentStateManager.getBoundVariableName(
          selectedComponent.id,
        );
      const rememberedVariable = lastBoundVariables[selectedComponent.id];

      if (boundVariable || rememberedVariable) {
        // 如果有绑定变量，显示变量占位符
        const variableName = boundVariable || rememberedVariable;
        (updatedComponent as any).img_list = `\${${variableName}}`;
      } else {
        // 如果没有绑定变量，显示当前的图片列表作为预览
        (updatedComponent as any).img_list = currentImageList;
      }
    }

    onUpdateComponent(updatedComponent);
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
        } else if (hasVariableBinding) {
          // 初始化为变量时，需要根据布局设置生成对应数量的图片输入框
          const userChosenLayout = layoutChoiceManager.getChoice(
            selectedComponent.id,
          );
          let requiredImageCount = 0;

          if (userChosenLayout) {
            // 如果用户已经选择了布局，使用该布局的图片数量
            requiredImageCount = getImageCountForLayout(userChosenLayout);
          } else {
            // 如果用户没有选择布局，根据当前的combination_mode推断
            const currentCombinationMode =
              (selectedComponent as any).combination_mode || 'double';
            const layoutType = getLayoutTypeFromModeAndCount(
              currentCombinationMode,
              0,
            );
            requiredImageCount = getImageCountForLayout(layoutType);

            // 记录推断的布局选择
            layoutChoiceManager.setChoice(selectedComponent.id, layoutType);
          }

          // 生成对应数量的默认图片用于指定模式预览
          if (requiredImageCount > 0) {
            multiImageComponentStateManager.setUserEditedImageList(
              selectedComponent.id,
              Array.from({ length: requiredImageCount }, () => defaultImg),
            );
          }
        }

        // 默认显示"指定"模式，除非当前组件有绑定变量
        const expectedMode = hasVariableBinding ? 'variable' : 'specify';
        setMultiImageContentMode(expectedMode);

        // 标记该组件已初始化，避免后续重复设置
        initializedComponents.add(selectedComponent.id);
      }

      // 如果当前组件有绑定变量，记住它（但不覆盖已有的记忆）
      if (hasVariableBinding) {
        const variableMatch =
          selectedComponent?.img_list.match(/\$\{([^}]+)\}/);
        if (variableMatch && variableMatch[1]) {
          const variableName = variableMatch[1];
          if (!lastBoundVariables[selectedComponent.id]) {
            setLastBoundVariables((prev) => ({
              ...prev,
              [selectedComponent.id]: variableName,
            }));
          }
        }
      }
    }
  }, [selectedComponent]);

  // 渲染组件设置内容
  const componentSettingsContent = React.useMemo(
    () => (
      <SettingSection title="🏷️ 组件设置" form={form}>
        <ComponentNameInput
          prefix="ImgCombination_"
          suffix={componentNameInfo.suffix}
          onChange={handleNameChange}
        />
      </SettingSection>
    ),
    [componentNameInfo.suffix, handleNameChange],
  );

  // 渲染布局设置内容（保持原有复杂逻辑）
  const layoutSettingsContent = React.useMemo(() => {
    return (
      <SettingSection title="📐 布局设置" form={form}>
        <Form.Item label="布局模式">
          {(() => {
            // 获取当前图片数量
            let imageCount = 0;

            if (multiImageContentMode === 'specify') {
              // 指定模式：从图片数组获取数量
              const currentImageList = Array.isArray(
                (selectedComponent as any).img_list,
              )
                ? (selectedComponent as any).img_list
                : [];
              imageCount = currentImageList.length;
            } else if (multiImageContentMode === 'variable') {
              // 变量模式：优先使用用户选择的布局类型，如果没有则根据 combination_mode 推断
              const currentCombinationMode =
                (selectedComponent as any).combination_mode || 'double';

              // 首先检查是否有用户选择的布局类型
              const userChosenLayout = layoutChoiceManager.getChoice(
                selectedComponent.id,
              );
              let currentLayoutType: string;

              if (userChosenLayout) {
                // 如果有用户选择的布局，直接使用
                currentLayoutType = userChosenLayout;
              } else {
                // 如果没有用户选择，尝试从变量中获取图片数量进行推断
                let actualImageCount = 0;
                if (
                  typeof (selectedComponent as any).img_list === 'string' &&
                  (selectedComponent as any).img_list.includes('${')
                ) {
                  const variableMatch = (
                    selectedComponent as any
                  ).img_list.match(/\$\{([^}]+)\}/);
                  if (variableMatch && variableMatch[1]) {
                    const variableName = variableMatch[1];
                    const variable = variables.find((v) => {
                      if (typeof v === 'object' && v !== null) {
                        const keys = Object.keys(v as Record<string, any>);
                        return keys.length > 0 && keys[0] === variableName;
                      }
                      return false;
                    });
                    if (variable) {
                      const variableValue = (variable as Record<string, any>)[
                        variableName
                      ];
                      if (Array.isArray(variableValue)) {
                        actualImageCount = variableValue.length;
                      }
                    }
                  }
                }

                // 根据图片数量推断布局类型
                currentLayoutType = getLayoutTypeFromModeAndCount(
                  currentCombinationMode,
                  actualImageCount,
                );
              }

              imageCount = getImageCountForLayout(currentLayoutType);
            }

            // 获取可用的布局选项
            const availableLayouts = getAvailableLayouts();

            // 获取最新的组件数据
            const latestComponent = getLatestSelectedComponent();

            if (!latestComponent) {
              return <div>无法获取组件数据</div>;
            }

            // 获取当前选中的布局模式
            const currentCombinationMode =
              (latestComponent as any).combination_mode || 'double';

            // 推断当前布局类型
            let currentLayoutType: string;

            // 优先使用用户选择的布局类型（两种模式都适用）
            const userChosenLayout = layoutChoiceManager.getChoice(
              selectedComponent.id,
            );
            if (userChosenLayout) {
              currentLayoutType = userChosenLayout;
            } else {
              // 如果没有用户选择，根据 combination_mode 和图片数量推断
              currentLayoutType = getLayoutTypeFromModeAndCount(
                currentCombinationMode,
                imageCount,
              );
            }

            return (
              <div className={styles.layoutSettings}>
                <div className={styles.layoutGrid}>
                  {availableLayouts.map((layout) => {
                    // 提取 isSelected 逻辑，供图标和文字复用
                    const isSelected = (() => {
                      const userChosenLayout = layoutChoiceManager.getChoice(
                        selectedComponent.id,
                      );

                      // 如果有用户选择的记录，优先使用
                      if (userChosenLayout) {
                        return userChosenLayout === layout.type;
                      }

                      // 如果是精确匹配，直接选中
                      if (currentCombinationMode === layout.type) {
                        return true;
                      }

                      // 如果是简化模式，根据当前布局类型智能推断
                      const layoutCombinationMode = layoutToCombinationMode(
                        layout.type,
                      );
                      if (currentCombinationMode === layoutCombinationMode) {
                        // 使用已经计算好的 currentLayoutType 进行比较
                        return currentLayoutType === layout.type;
                      }
                      return false;
                    })();

                    return (
                      <div
                        key={layout.key}
                        onClick={() => toggleMode(layout.type)}
                        className={styles.layoutItem}
                      >
                        <LayoutIcon
                          type={layout.type}
                          isSelected={isSelected}
                        />
                        <Text
                          style={{
                            fontSize: '11px',
                            textAlign: 'center',
                            color: isSelected ? '#1890ff' : '#666',
                            fontWeight: 500,
                          }}
                        >
                          {layout.label}
                        </Text>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </Form.Item>
      </SettingSection>
    );
  }, [
    form,
    multiImageContentMode,
    selectedComponent,
    variables,
    getLatestSelectedComponent,
    handleValueChange,
    forceUpdate,
    onUpdateComponent,
  ]);

  // 渲染图片设置内容
  const imageSettingsContent = React.useMemo(() => {
    return (
      <SettingSection title="🖼️ 图片设置" form={form}>
        <Form.Item label="图片来源">
          <Segmented
            value={multiImageContentMode}
            style={{ marginBottom: 16 }}
            onChange={handleMutiImageChange}
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

                return currentImageList.map((image: any, index: number) => (
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
                    <Space.Compact style={{ width: '100%' }}>
                      <Input
                        value={image.img_url || ''}
                        onChange={(e) => {
                          const newImageList = [...currentImageList];
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
                          handleValueChange('img_list', newImageList);
                        }}
                        placeholder="请输入图片路径或选择上传"
                        style={{ flex: 1 }}
                      />
                      <ImageUpload
                        onUploadSuccess={(imageUrl) => {
                          const newImageList = [...currentImageList];
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
                          handleValueChange('img_list', newImageList);
                        }}
                        style={{ borderRadius: '0 6px 6px 0' }}
                        buttonProps={{
                          type: 'primary',
                          // children: '上传',
                          title: '上传图片',
                        }}
                      />
                    </Space.Compact>
                  </div>
                ));
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
                      (updatedComponent as any).img_list = variablePlaceholder;

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

                      // 清除绑定变量后，保持在变量模式，显示默认占位图片
                      const updatedComponent = {
                        ...selectedComponent,
                      };

                      if (multiImageContentMode === 'variable') {
                        // 在变量模式下清除绑定，获取用户之前编辑的图片列表作为默认预览
                        const userEditedImageList =
                          multiImageComponentStateManager.getUserEditedImageList(
                            selectedComponent.id,
                          );

                        // 如果有用户编辑的图片列表，显示它们；否则显示空数组
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
              />
            </div>
          )}
        </Form.Item>
      </SettingSection>
    );
  }, [
    form,
    multiImageContentMode,
    setMultiImageContentMode,
    selectedComponent,
    lastBoundVariables,
    setLastBoundVariables,
    onUpdateComponent,
    handleValueChange,
    variables,
    getFilteredVariables,
    getVariableDisplayName,
    getVariableKeys,
    handleAddVariableFromComponent,
  ]);

  // 组合组件内容
  const componentContent = React.useMemo(
    () => (
      <>
        {componentSettingsContent}
        {layoutSettingsContent}
        {imageSettingsContent}
      </>
    ),
    [componentSettingsContent, layoutSettingsContent, imageSettingsContent],
  );

  // 创建变量管理面板
  const VariableManagementComponent = React.useCallback(() => {
    return <VariableManagementPanel />;
  }, [VariableManagementPanel]);

  return (
    <PropertyPanel
      activeTab={topLevelTab}
      onTabChange={setTopLevelTab}
      componentContent={componentContent}
      eventTabDisabled={true}
      variableManagementComponent={<VariableManagementComponent />}
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

export default ImgCombinationComponent;
