import { useCallback, useEffect } from 'react';
import { ComponentType } from '../type';
import { isInPropertyPanel, isInputElement } from '../utils';

// 快捷键Hook
export const useKeyboardShortcuts = (handlers: {
  undo: () => boolean;
  redo: () => boolean;
  copyComponent: (component: ComponentType) => void;
  pasteComponent: () => void;
  smartDeleteComponent: (path: (string | number)[]) => boolean;
  selectedComponent: ComponentType | null;
  selectedPath: (string | number)[] | null;
  clipboard: ComponentType | null;
  canvasRef: any;
}) => {
  const {
    undo,
    redo,
    copyComponent,
    pasteComponent,
    smartDeleteComponent,
    selectedComponent,
    selectedPath,
    clipboard,
    canvasRef,
  } = handlers;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputFocused = isInputElement(activeElement);
      const isInPropertyPanelArea = isInPropertyPanel(activeElement);

      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            e.preventDefault();
            undo();
            break;
          case 'y':
            e.preventDefault();
            redo();
            break;
          case 'c':
            if (selectedComponent && canvasRef.current) {
              e.preventDefault();
              copyComponent(selectedComponent);
            }
            break;
          case 'v':
            if (clipboard && canvasRef.current) {
              e.preventDefault();
              pasteComponent();
            }
            break;
        }
      }

      // 智能删除逻辑
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedComponent && selectedPath) {
          if (isInputFocused && isInPropertyPanelArea) {
            return; // 允许正常的输入框删除行为
          }

          if (!canvasRef.current) {
            return;
          }

          e.preventDefault();
          smartDeleteComponent(selectedPath);
        }
      }
    },
    [
      selectedComponent,
      selectedPath,
      clipboard,
      undo,
      redo,
      copyComponent,
      pasteComponent,
      smartDeleteComponent,
      canvasRef,
    ],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};
