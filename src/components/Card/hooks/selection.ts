import { ComponentType } from '../type';

import { useCallback, useEffect, useState } from 'react';
// 组件选择Hook
export const useComponentSelection = () => {
  const [selectedComponent, setSelectedComponent] =
    useState<ComponentType | null>(null);
  const [selectedPath, setSelectedPath] = useState<(string | number)[] | null>(
    null,
  );

  const selectComponent = useCallback(
    (component: ComponentType | null, path?: (string | number)[]) => {
      setSelectedComponent(component);
      setSelectedPath(path || null);
    },
    [],
  );

  const clearSelection = useCallback(() => {
    setSelectedComponent(null);
    setSelectedPath(null);
  }, []);

  useEffect(() => {
    return () => {
      setSelectedComponent(null);
      setSelectedPath(null);
    };
  }, []);

  return {
    selectedComponent,
    selectedPath,
    selectComponent,
    clearSelection,
  };
};
