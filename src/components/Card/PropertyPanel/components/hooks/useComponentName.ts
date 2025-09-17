// 通用的组件名称编辑Hook
import { useCallback, useMemo } from 'react';

interface UseComponentNameProps {
  selectedComponent: any;
  prefix: string; // 组件类型前缀，如 'Text_', 'Input_' 等
  handleValueChange: (field: string, value: any) => void;
}

interface ComponentNameInfo {
  name: string;
  suffix: string;
}

export const useComponentName = ({
  selectedComponent,
  prefix,
  handleValueChange,
}: UseComponentNameProps) => {
  // 获取组件名称信息 - 使用useMemo优化
  const componentNameInfo = useMemo((): ComponentNameInfo => {
    const fullName = selectedComponent?.name || `${prefix}`;

    // 提取前缀后面的内容
    const suffix = fullName.startsWith(prefix)
      ? fullName.substring(prefix.length)
      : fullName;

    // console.log(`🔍 ${prefix}组件名称解析:`, {
    //   fullName,
    //   suffix,
    //   componentId: selectedComponent?.id,
    //   prefix,
    // });

    return {
      name: fullName,
      suffix: suffix,
    };
  }, [selectedComponent, prefix]);

  // 处理组件名称变化 - 使用useCallback优化
  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const userInput = e.target.value;
      // 拼接前缀和用户输入的内容
      const fullName = `${prefix}${userInput}`;

      console.log(`🔧 ${prefix}组件名称变更:`, {
        userInput,
        fullName,
        componentId: selectedComponent?.id,
        prefix,
      });

      handleValueChange('name', fullName);
    },
    [handleValueChange, selectedComponent?.id, prefix],
  );

  return {
    componentNameInfo,
    handleNameChange,
  };
};
