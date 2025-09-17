// 组件渲染器共享工具函数
import { ComponentType } from '../type';

// 检查组件是否为容器类型
export const isContainerComponent = (componentType: string): boolean => {
  return (
    componentType === 'form' ||
    componentType === 'column_set' ||
    componentType === 'form-container' ||
    componentType === 'layout-columns'
  );
};

// 检查是否可以在目标容器中放置指定类型的组件
export const canDropInContainer = (
  draggedType: string,
  targetPath: (string | number)[],
): boolean => {
  // 特殊规则：分栏容器可以拖拽到表单容器内，但不能拖拽到表单容器下的分栏容器的列中
  if (draggedType === 'column_set') {
    // 检查目标路径是否指向表单容器的 elements
    const isTargetingFormElements =
      targetPath.length >= 5 &&
      targetPath[0] === 'dsl' &&
      targetPath[1] === 'body' &&
      targetPath[2] === 'elements' &&
      targetPath[4] === 'elements';

    // 检查是否要拖拽到表单容器下的分栏容器的列中
    const isTargetingFormColumnElements =
      targetPath.length >= 9 &&
      targetPath[0] === 'dsl' &&
      targetPath[1] === 'body' &&
      targetPath[2] === 'elements' &&
      targetPath[4] === 'elements' &&
      targetPath[6] === 'columns' &&
      targetPath[8] === 'elements';

    return isTargetingFormElements && !isTargetingFormColumnElements;
  }

  return true;
};

// 检查两个路径是否相同
export const isSamePath = (
  path1: (string | number)[] | null,
  path2: (string | number)[] | null,
): boolean => {
  if (!path1 || !path2) return false;
  if (path1.length !== path2.length) return false;
  return path1.every((segment, index) => segment === path2[index]);
};

// 获取组件的显示名称
export const getComponentDisplayName = (component: ComponentType): string => {
  const comp = component as any;
  switch (component.tag) {
    case 'form':
      return '表单容器';
    case 'column_set':
      return '分栏容器';
    case 'plain_text':
      return '文本';
    case 'rich_text':
      return '富文本';
    case 'hr':
      return '分割线';
    case 'img':
      return '图片';
    case 'img_combination':
      return '多图混排';
    case 'input':
      return '输入框';
    case 'button':
      return '按钮';
    case 'select_static':
      return '下拉单选';
    case 'multi_select_static':
      return '下拉多选';
    case 'title':
      return '标题';
    default:
      return comp.tag || '未知组件';
  }
};

// 合并样式对象
export const mergeStyles = (
  ...styles: (React.CSSProperties | undefined)[]
): React.CSSProperties => {
  const mergedStyles: React.CSSProperties = {};

  styles.forEach((style) => {
    if (style && typeof style === 'object') {
      Object.keys(style).forEach((key) => {
        const styleKey = key as keyof React.CSSProperties;
        if (style[styleKey] !== undefined) {
          (mergedStyles as any)[styleKey] = style[styleKey];
        }
      });
    }
  });

  return mergedStyles;
};

// 获取组件的基础样式
export const getBaseComponentStyle = (
  isSelected: boolean,
  isPreview: boolean,
): React.CSSProperties => ({
  border:
    isSelected && !isPreview ? '1px solid #1890ff' : '1px solid transparent',
  borderRadius: '4px',
  backgroundColor:
    isSelected && !isPreview ? 'rgba(24, 144, 255, 0.02)' : 'transparent',
  boxShadow:
    isSelected && !isPreview ? '0 0 8px rgba(24, 144, 255, 0.3)' : 'none',
  transition: 'all 0.2s ease',
  position: 'relative',
});
