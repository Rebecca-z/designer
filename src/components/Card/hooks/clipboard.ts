import { useCallback, useState } from 'react';
import { ComponentType, DesignData } from '../type';
import { generateId } from '../utils';

// 剪贴板Hook
export const useClipboard = () => {
  const [clipboard, setClipboard] = useState<ComponentType | null>(null);

  const copyComponent = useCallback((component: ComponentType) => {
    const copied = { ...component, id: generateId() };
    setClipboard(copied);
  }, []);

  const pasteComponent = useCallback(
    (data: DesignData, updateData: any) => {
      if (clipboard) {
        const newClipboard = { ...clipboard, id: generateId() };
        const newData = {
          ...data,
          elements: [...data.elements, newClipboard],
        };
        updateData(newData);
      }
    },
    [clipboard],
  );

  return {
    clipboard,
    copyComponent,
    pasteComponent,
  };
};
