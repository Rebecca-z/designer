import { cloneDeep } from 'lodash';
import { useCallback, useState } from 'react';
import { DesignData } from '../type';

// 历史管理Hook
export const useHistory = (initialData: DesignData) => {
  // 确保初始数据也是深拷贝的，避免外部修改影响历史记录
  const initialCopy = cloneDeep(initialData);
  const [data, setData] = useState<DesignData>(initialCopy);
  const [history, setHistory] = useState<DesignData[]>([
    cloneDeep(initialCopy),
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const updateData = useCallback(
    (newData: DesignData) => {
      // 使用深拷贝确保数据完全独立，避免引用问题
      const deepCopiedData = cloneDeep(newData);
      setData(deepCopiedData);
      // 历史记录也需要深拷贝，确保每个历史状态都是独立的
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(cloneDeep(deepCopiedData));
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    },
    [history, historyIndex],
  );

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      const deepCopiedData = cloneDeep(history[historyIndex - 1]);
      setData(deepCopiedData);
      return true;
    }
    return false;
  }, [historyIndex, history]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      const deepCopiedData = cloneDeep(history[historyIndex + 1]);
      setData(deepCopiedData);
      return true;
    }
    return false;
  }, [historyIndex, history]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return {
    data,
    updateData,
    undo,
    redo,
    canUndo,
    canRedo,
    historyLength: history.length,
  };
};
