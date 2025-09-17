import { useCallback, useEffect, useRef, useState } from 'react';

// 焦点管理Hook
export const useFocusManagement = () => {
  const [canvasFocused, setCanvasFocused] = useState<boolean>(false);
  const canvasRef = useRef<boolean>(false);

  const handleCanvasFocus = useCallback(() => {
    setCanvasFocused(true);
    canvasRef.current = true;
  }, []);

  const handleCanvasBlur = useCallback(() => {
    setCanvasFocused(false);
    canvasRef.current = false;
  }, []);

  // 监听全局点击事件
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as Element;
      const canvasElement = document.querySelector('[data-canvas="true"]');
      const isCanvasClick = canvasElement?.contains(target);

      if (!isCanvasClick) {
        handleCanvasBlur();
      }
    };

    document.addEventListener('click', handleGlobalClick);
    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [handleCanvasBlur]);

  return {
    canvasFocused,
    canvasRef,
    handleCanvasFocus,
    handleCanvasBlur,
  };
};
