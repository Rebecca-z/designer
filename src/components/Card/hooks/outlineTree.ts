import { useCallback, useState } from 'react';

// 大纲树Hook
export const useOutlineTree = () => {
  const [hoveredPath, setHoveredPath] = useState<(string | number)[] | null>(
    null,
  );

  const handleOutlineHover = useCallback((path: (string | number)[] | null) => {
    setHoveredPath(path);
  }, []);

  return {
    hoveredPath,
    handleOutlineHover,
  };
};
