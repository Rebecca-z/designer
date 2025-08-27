// 会话卡片包装器组件

import { DeleteOutlined, MoreOutlined } from '@ant-design/icons';
import { Button, Dropdown, message } from 'antd';
import React, { useCallback, useMemo, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { ComponentType, DragItem, VariableItem } from '../type';
import { createDefaultComponent } from '../utils';
import ComponentRenderer from './Component';
import ErrorBoundary from './ErrorBoundary';

// 拖拽排序包装器组件
const DragSortableItem: React.FC<{
  component: ComponentType;
  index: number;
  path: (string | number)[];
  onMove: (dragIndex: number, hoverIndex: number) => void;
  children: React.ReactNode;
  onClearSelection?: () => void; // 新增：清除选中状态的回调
}> = React.memo(
  ({ component, index, path, onMove, children, onClearSelection }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [insertPosition, setInsertPosition] = React.useState<
      'before' | 'after' | null
    >(null);

    // 添加防抖和缓存机制
    const lastHoverState = useRef<{
      position: 'before' | 'after' | null;
      targetIndex: number;
      dragIndex: number;
      hoverIndex: number;
    } | null>(null);

    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [{ handlerId, isOver }, drop] = useDrop({
      accept: ['canvas-component'],
      collect(monitor) {
        return {
          handlerId: monitor.getHandlerId(),
          isOver: monitor.isOver(),
        };
      },
      drop() {
        // 清除插入位置状态
        setInsertPosition(null);
        lastHoverState.current = null; // 清理缓存状态
      },
      hover(item: any, monitor) {
        if (!ref.current) {
          return;
        }

        // 清除之前的防抖定时器
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
        }

        // 使用防抖机制，延迟处理hover事件
        hoverTimeoutRef.current = setTimeout(() => {
          const dragIndex = item.index;
          const hoverIndex = index;

          // 不要替换自己
          if (dragIndex === hoverIndex) {
            return;
          }

          // 获取hover元素的边界矩形
          const hoverBoundingRect = ref.current?.getBoundingClientRect();
          if (!hoverBoundingRect) return;

          // 获取垂直方向的中点
          const hoverMiddleY =
            (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

          // 确定鼠标位置
          const clientOffset = monitor.getClientOffset();
          if (!clientOffset) return;

          // 获取鼠标相对于hover元素的位置
          const hoverClientY = clientOffset.y - hoverBoundingRect.top;

          // 插入式拖拽逻辑：确定插入位置
          let currentInsertPosition: 'before' | 'after' | null = null;
          let targetIndex: number;

          if (hoverClientY < hoverMiddleY) {
            // 鼠标在上半部分 - 插入到当前元素之前
            currentInsertPosition = 'before';
            targetIndex = hoverIndex;
          } else {
            // 鼠标在下半部分 - 插入到当前元素之后
            currentInsertPosition = 'after';
            targetIndex = hoverIndex + 1;
          }

          // 检查是否与上次状态相同，避免不必要的更新
          const currentHoverState = {
            position: currentInsertPosition,
            targetIndex,
            dragIndex,
            hoverIndex,
          };

          if (
            lastHoverState.current &&
            lastHoverState.current.position === currentHoverState.position &&
            lastHoverState.current.targetIndex ===
              currentHoverState.targetIndex &&
            lastHoverState.current.dragIndex === currentHoverState.dragIndex &&
            lastHoverState.current.hoverIndex === currentHoverState.hoverIndex
          ) {
            return; // 状态没有变化，不更新
          }

          // 更新缓存状态
          lastHoverState.current = currentHoverState;

          // 获取组件信息用于后续检查和日志
          const draggedComponent = item.component;
          const hoverComponent = component;

          // 更新插入位置状态，用于显示指示线
          setInsertPosition(currentInsertPosition);

          // 避免无意义的移动
          // 检查是否是真正的移动操作
          if (currentInsertPosition === 'before') {
            // 插入到before位置：如果拖拽元素紧接在hover元素之前，则无意义
            if (dragIndex === hoverIndex - 1) {
              return;
            }
          } else {
            // 插入到after位置：如果拖拽元素紧接在hover元素之后，则无意义
            if (dragIndex === hoverIndex + 1) {
              return;
            }
          }

          // 不要拖拽到自己身上
          if (dragIndex === hoverIndex) {
            return;
          }

          // 1. 标题组件不能移动到非标题组件的位置
          if (
            draggedComponent.tag === 'title' &&
            hoverComponent.tag !== 'title'
          ) {
            return;
          }

          // 2. 非标题组件不能移动到标题组件的位置（第一位）
          if (
            draggedComponent.tag !== 'title' &&
            hoverComponent.tag === 'title'
          ) {
            return;
          }

          // 3. 不能将非标题组件插入到标题组件之前
          if (
            hoverComponent.tag === 'title' &&
            draggedComponent.tag !== 'title' &&
            currentInsertPosition === 'before'
          ) {
            return;
          }
          onMove(dragIndex, targetIndex);

          // 注意：这里我们修改了监视器项目，因为我们在移动时修改了索引
          // 一般来说，最好避免修改监视器项目，但这里是为了性能考虑
          // 对于插入式移动，需要调整索引
          const newIndex =
            targetIndex > dragIndex ? targetIndex - 1 : targetIndex;
          item.index = newIndex;

          // ✅ 修复：同时更新路径中的索引，确保路径与实际位置一致
          if (
            item.path &&
            item.path.length === 4 &&
            item.path[2] === 'elements'
          ) {
            item.path = [...item.path.slice(0, 3), newIndex];
          }
        }, 50); // 50ms防抖延迟
      },
    });

    // 清理定时器
    React.useEffect(() => {
      return () => {
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
        }
      };
    }, []);

    const [{ isDragging }, drag] = useDrag({
      type: 'canvas-component',
      item: () => {
        // 拖拽开始时清除选中状态
        if (onClearSelection) {
          onClearSelection();
        }

        return {
          type: component.tag,
          component,
          index,
          path,
          isNew: false,
        };
      },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
      canDrag: () => {
        const canDrag = component.tag !== 'title';
        return canDrag;
      },
    });

    const opacity = isDragging ? 0.4 : 1;
    drag(drop(ref));

    const handleDragSortableClick = (e: React.MouseEvent) => {
      // 阻止事件冒泡到卡片容器，避免触发卡片选中
      e.stopPropagation();
      e.preventDefault();
    };

    return (
      <div
        ref={ref}
        style={{
          opacity,
          position: 'relative',
          transition: 'all 0.15s ease',
          cursor: component.tag === 'title' ? 'default' : 'grab',
        }}
        data-handler-id={handlerId}
        onClick={handleDragSortableClick}
        data-drag-sortable-item="true"
      >
        {/* 插入位置指示线 */}
        {isOver && insertPosition === 'before' && (
          <div
            style={{
              position: 'absolute',
              top: '-2px',
              left: '0',
              right: '0',
              height: '3px',
              backgroundColor: '#1890ff',
              borderRadius: '1.5px',
              zIndex: 1000,
              boxShadow: '0 0 6px rgba(24, 144, 255, 0.6)',
              transition: 'opacity 0.1s ease', // 快速显示/隐藏
            }}
          />
        )}

        {isOver && insertPosition === 'after' && (
          <div
            style={{
              position: 'absolute',
              bottom: '-2px',
              left: '0',
              right: '0',
              height: '3px',
              backgroundColor: '#1890ff',
              borderRadius: '1.5px',
              zIndex: 1000,
              boxShadow: '0 0 6px rgba(24, 144, 255, 0.6)',
              transition: 'opacity 0.1s ease', // 快速显示/隐藏
            }}
          />
        )}
        {children}
      </div>
    );
  },
);

interface CardWrapperProps {
  elements: ComponentType[];
  verticalSpacing: number;
  selectedPath: (string | number)[] | null;
  hoveredPath: (string | number)[] | null;
  onElementsChange: (elements: ComponentType[]) => void;
  onSelectComponent: (
    component: ComponentType | null,
    path?: (string | number)[],
  ) => void;
  onDeleteComponent: (path: (string | number)[]) => void;
  onCopyComponent: (component: ComponentType) => void;
  onCanvasFocus: () => void;
  isCardSelected: boolean;
  onCardSelect: () => void;
  headerData?: {
    title?: { content: string };
    subtitle?: { content: string };
    style?: string;
  };
  onHeaderDataChange?: (headerData: {
    title?: { content: string };
    subtitle?: { content: string };
    style?: string;
  }) => void;
  layoutMode?: 'vertical' | 'flow';
  variables?: VariableItem[];
}

const CardWrapper: React.FC<CardWrapperProps> = ({
  elements,
  verticalSpacing,
  selectedPath,
  hoveredPath,
  onElementsChange,
  onSelectComponent,
  onDeleteComponent,
  onCopyComponent,
  onCanvasFocus,
  isCardSelected,
  onCardSelect,
  headerData,
  onHeaderDataChange,
  layoutMode = 'vertical',
  variables = [],
}) => {
  // 工具函数：检查画布中是否已存在标题组件
  const hasExistingTitle = useCallback((elements: ComponentType[]): boolean => {
    return elements.some((component) => component.tag === 'title');
  }, []);

  // 工具函数：检查画布中是否已存在表单组件
  const hasExistingForm = useCallback((elements: ComponentType[]): boolean => {
    return elements.some((component) => component.tag === 'form');
  }, []);

  // 验证并修正路径，确保索引在有效范围内
  const validateAndCorrectPath = useCallback(
    (
      elements: ComponentType[],
      path: (string | number)[],
    ): (string | number)[] => {
      const newPath = [...path];

      // 验证路径前缀
      if (
        newPath.length < 3 ||
        newPath[0] !== 'dsl' ||
        newPath[1] !== 'body' ||
        newPath[2] !== 'elements'
      ) {
        console.warn('⚠️ 路径前缀无效，返回原始路径');
        return path;
      }

      // 检查根级别索引
      if (newPath.length >= 4 && typeof newPath[3] === 'number') {
        const rootIndex = newPath[3] as number;
        if (rootIndex >= elements.length) {
          newPath[3] = Math.max(0, elements.length - 1);
        }
      }

      // 检查分栏索引
      if (
        newPath.length >= 6 &&
        newPath[4] === 'columns' &&
        typeof newPath[5] === 'number'
      ) {
        const rootIndex = newPath[3] as number;
        const columnIndex = newPath[5] as number;

        if (rootIndex < elements.length) {
          const rootComponent = elements[rootIndex];
          if (
            rootComponent &&
            rootComponent.tag === 'column_set' &&
            rootComponent.columns
          ) {
            const columns = rootComponent.columns;
            if (columnIndex >= columns.length) {
              newPath[5] = Math.max(0, columns.length - 1);
            }
          }
        }
      }

      return newPath;
    },
    [],
  );

  // 检查路径是否指向同一个组件
  const isSamePath = useCallback(
    (
      path1: (string | number)[] | null,
      path2: (string | number)[],
    ): boolean => {
      if (!path1) return false;
      return JSON.stringify(path1) === JSON.stringify(path2);
    },
    [],
  );

  // 根据路径获取elements数组的辅助函数
  const getElementsArrayByPath = useCallback(
    (
      elements: ComponentType[],
      path: (string | number)[],
    ): ComponentType[] | null => {
      let current: any = elements;

      // 检查路径是否以 ['dsl', 'body', 'elements'] 开头
      const isStandardPath =
        path.length >= 3 &&
        path[0] === 'dsl' &&
        path[1] === 'body' &&
        path[2] === 'elements';

      // 根据路径格式决定起始索引
      const startIndex = isStandardPath ? 3 : 0;

      for (let i = startIndex; i < path.length; i++) {
        const key = path[i];
        const nextKey = path[i + 1];

        if (key === 'elements') {
          // 1. 如果已经到达最后，直接返回
          if (i === path.length - 1) {
            if (Array.isArray(current)) return current;
            if (current && Array.isArray(current.elements))
              return current.elements;
            return null;
          }
          // 2. 如果下一个key不是数字，说明已经到达目标数组
          if (typeof nextKey !== 'number') {
            if (Array.isArray(current)) return current;
            if (current && Array.isArray(current.elements))
              return current.elements;
            return null;
          }
          // 3. 否则继续导航
          if (Array.isArray(current) && current[nextKey]) {
            current = current[nextKey];
            i++;
            continue;
          }
          if (
            current &&
            Array.isArray(current.elements) &&
            current.elements[nextKey]
          ) {
            current = current.elements[nextKey];
            i++;
            continue;
          }

          return null;
        } else if (key === 'columns') {
          const columnIndex = path[i + 1] as number;
          if (
            current &&
            current.tag === 'column_set' &&
            current.columns &&
            Array.isArray(current.columns) &&
            current.columns[columnIndex] &&
            current.columns[columnIndex].elements
          ) {
            current = current.columns[columnIndex].elements;
            i += 2; // 跳过下两个索引
          } else {
            return null;
          }
        } else if (typeof key === 'number') {
          if (current && Array.isArray(current) && current[key]) {
            current = current[key];
          } else {
            return null;
          }
        } else {
          if (current && current[key] !== undefined) {
            current = current[key];
          } else {
            return null;
          }
        }
      }
      return null;
    },
    [],
  );

  // 工具函数：根据目标位置清理组件的required字段
  const cleanRequiredFieldBasedOnTarget = useCallback(
    (
      component: ComponentType,
      targetPath: (string | number)[],
    ): ComponentType => {
      // 需要处理required字段的组件类型
      const componentsWithRequired = [
        'input',
        'select_static',
        'multi_select_static',
      ];

      if (!componentsWithRequired.includes(component.tag)) {
        return component;
      }

      // 检查目标位置是否在画布根节点
      const isTargetInRoot =
        targetPath.length === 3 &&
        targetPath[0] === 'dsl' &&
        targetPath[1] === 'body' &&
        targetPath[2] === 'elements';

      const cleanedComponent = { ...component };

      if (isTargetInRoot) {
        if ((cleanedComponent as any).required !== undefined) {
          delete (cleanedComponent as any).required;
        }
      }

      return cleanedComponent;
    },
    [],
  );

  // 根据路径添加组件到指定位置
  const addComponentByPath = useCallback(
    (
      elements: ComponentType[],
      path: (string | number)[],
      newComponent: ComponentType,
      insertIndex?: number,
    ): ComponentType[] => {
      const newElements = [...elements];

      // 根据目标位置清理组件的required字段
      const cleanedComponent = cleanRequiredFieldBasedOnTarget(
        newComponent,
        path,
      );

      // 如果是根级别（直接添加到卡片）
      if (path.length === 3 && path[2] === 'elements') {
        if (insertIndex !== undefined) {
          newElements.splice(insertIndex, 0, cleanedComponent);
        } else {
          newElements.push(cleanedComponent);
        }
        return newElements;
      }

      // 使用递归函数来正确导航路径
      const navigateAndAdd = (
        target: any,
        remainingPath: (string | number)[],
        depth: number = 0,
        rootElements?: ComponentType[],
        originalTargetPath?: (string | number)[],
        componentToAdd?: ComponentType,
      ): boolean => {
        if (!target) {
          console.error('❌ 路径导航失败：目标为空', {
            target: 'null',
            remainingPath,
            depth,
          });
          return false;
        }

        // 如果路径为空，说明已经到达目标位置，直接添加组件
        if (remainingPath.length === 0) {
          // 如果目标是数组，直接添加组件
          if (Array.isArray(target) && componentToAdd) {
            if (insertIndex !== undefined) {
              target.splice(insertIndex, 0, componentToAdd);
            } else {
              target.push(componentToAdd);
            }

            return true;
          }

          // 如果目标是对象，尝试添加到elements数组
          if (
            target.elements &&
            Array.isArray(target.elements) &&
            componentToAdd
          ) {
            if (insertIndex !== undefined) {
              target.elements.splice(insertIndex, 0, componentToAdd);
            } else {
              target.elements.push(componentToAdd);
            }

            return true;
          }
          return false;
        }

        const key = remainingPath[0];
        const nextPath = remainingPath.slice(1);

        // 处理 'columns' 路径段
        if (key === 'columns') {
          // 检查当前对象是否是分栏容器
          if (
            target &&
            target.tag === 'column_set' &&
            target.columns &&
            Array.isArray(target.columns)
          ) {
            const columnIndex = nextPath[0] as number;

            if (
              typeof columnIndex === 'number' &&
              columnIndex >= 0 &&
              columnIndex < target.columns.length
            ) {
              const targetColumn = target.columns[columnIndex];

              // 检查目标列是否有elements数组
              if (
                !targetColumn.elements ||
                !Array.isArray(targetColumn.elements)
              ) {
                targetColumn.elements = [];
              }

              // 继续导航到列的elements数组
              return navigateAndAdd(
                targetColumn.elements,
                nextPath.slice(1),
                depth + 1,
                rootElements,
                originalTargetPath,
                componentToAdd,
              );
            } else {
              console.error('❌ 分栏索引无效:', {
                columnIndex,
                columnsLength: target.columns.length,
                depth,
              });
              return false;
            }
          } else {
            // 如果当前目标是数组（根elements），尝试查找分栏容器
            if (Array.isArray(target)) {
              const columnSetIndex = target.findIndex(
                (comp) => comp && comp.tag === 'column_set',
              );

              if (columnSetIndex !== -1) {
                // 重新构建路径：先导航到分栏容器，然后处理columns
                const correctedPath = [columnSetIndex, 'columns', ...nextPath];
                return navigateAndAdd(
                  target,
                  correctedPath,
                  depth,
                  rootElements,
                  originalTargetPath,
                  componentToAdd,
                );
              } else {
                console.error('❌ 在根elements中未找到分栏容器');
                return false;
              }
            }

            // ✅ 修复：如果当前目标是组件对象，使用rootElements进行全局查找
            if (target && typeof target === 'object' && target.tag) {
              if (target.tag === 'form') {
                console.warn('⚠️ 路径指向了表单容器，但期望分栏容器');

                // 使用rootElements在全局查找分栏容器
                if (rootElements && Array.isArray(rootElements)) {
                  const columnSetIndex = rootElements.findIndex(
                    (comp) => comp && comp.tag === 'column_set',
                  );

                  if (columnSetIndex !== -1) {
                    // 重新构建路径：先导航到分栏容器，然后处理columns
                    const correctedPath = [
                      columnSetIndex,
                      'columns',
                      ...nextPath,
                    ];
                    return navigateAndAdd(
                      rootElements,
                      correctedPath,
                      depth,
                      rootElements,
                      originalTargetPath,
                      componentToAdd,
                    );
                  } else {
                    console.error('❌ 在全局elements中未找到分栏容器');
                    return false;
                  }
                } else {
                  console.error('❌ rootElements不可用，无法进行全局查找');
                  return false;
                }
              }
            }

            console.error('❌ 无法修正路径，目标不是分栏容器');
            return false;
          }
        }

        // 处理 'elements' 路径段
        if (key === 'elements') {
          // 如果这是最后一个路径段，直接在这里添加组件
          if (nextPath.length === 0) {
            if (Array.isArray(target)) {
              // target本身就是elements数组
              if (insertIndex !== undefined) {
                target.splice(insertIndex, 0, componentToAdd);
              } else {
                target.push(componentToAdd);
              }
              return true;
            } else if (
              target &&
              target.elements &&
              Array.isArray(target.elements)
            ) {
              // target是组件对象，需要访问其elements属性
              if (insertIndex !== undefined) {
                target.elements.splice(insertIndex, 0, componentToAdd);
              } else {
                target.elements.push(componentToAdd);
              }
              return true;
            } else {
              // 自动创建elements数组
              if (
                target &&
                (target.tag === 'form' || target.tag === 'column_set')
              ) {
                if (!target.elements || !Array.isArray(target.elements)) {
                  target.elements = [];
                }

                if (insertIndex !== undefined) {
                  target.elements.splice(insertIndex, 0, componentToAdd);
                } else {
                  target.elements.push(componentToAdd);
                }

                return true;
              }

              console.error('❌ 无法找到或创建elements数组:', {
                target: target ? 'exists' : 'null',
                targetTag: target ? target.tag : 'undefined',
                depth,
              });
              return false;
            }
          } else {
            // 继续导航
            const nextKey = nextPath[0];

            if (typeof nextKey === 'number') {
              // 下一个是数组索引
              if (
                Array.isArray(target) &&
                nextKey >= 0 &&
                nextKey < target.length
              ) {
                return navigateAndAdd(
                  target[nextKey],
                  nextPath.slice(1),
                  depth + 1,
                  rootElements,
                  originalTargetPath,
                  componentToAdd,
                );
              } else {
                // ✅ 修复：当数组为空时，直接添加组件
                if (Array.isArray(target) && target.length === 0) {
                  if (insertIndex !== undefined) {
                    target.splice(insertIndex, 0, componentToAdd);
                  } else {
                    target.push(componentToAdd);
                  }

                  return true;
                }

                // ✅ 修复：当目标不是数组时，尝试智能处理
                if (!Array.isArray(target) && target && target.tag === 'form') {
                  // 如果表单有elements数组，尝试访问指定索引
                  if (target.elements && Array.isArray(target.elements)) {
                    // ✅ 修复：如果索引超出范围，尝试智能修正
                    let correctedIndex = nextKey;
                    if (nextKey >= target.elements.length) {
                      correctedIndex = 0;
                    }

                    if (
                      correctedIndex >= 0 &&
                      correctedIndex < target.elements.length
                    ) {
                      return navigateAndAdd(
                        target.elements[correctedIndex],
                        nextPath.slice(1),
                        depth + 1,
                        rootElements,
                        originalTargetPath,
                        componentToAdd,
                      );
                    } else {
                      console.error('❌ 表单elements数组索引无效:', {
                        nextKey,
                        correctedIndex,
                        elementsLength: target.elements.length,
                        availableIndices: target.elements.map(
                          (_: any, idx: number) => idx,
                        ),
                        depth,
                      });
                      return false;
                    }
                  } else {
                    return false;
                  }
                }
                return false;
              }
            } else if (nextKey === 'elements') {
              // 下一个也是elements，说明这是表单容器的结构
              if (target && target.elements && Array.isArray(target.elements)) {
                return navigateAndAdd(
                  target.elements,
                  nextPath.slice(1),
                  depth + 1,
                  rootElements,
                  originalTargetPath,
                  componentToAdd,
                );
              } else {
                // ✅ 修复：智能修正表单容器路径
                if (target && target.tag === 'form') {
                  if (!target.elements || !Array.isArray(target.elements)) {
                    target.elements = [];
                  }

                  return navigateAndAdd(
                    target.elements,
                    nextPath.slice(1),
                    depth + 1,
                    rootElements,
                    originalTargetPath,
                    componentToAdd,
                  );
                } else {
                  // 如果当前目标是数组，说明我们已经到达了elements数组，直接在这里添加组件
                  if (Array.isArray(target)) {
                    if (insertIndex !== undefined) {
                      target.splice(insertIndex, 0, componentToAdd);
                    } else {
                      target.push(componentToAdd);
                    }
                    return true;
                  }

                  // ✅ 修复：如果当前目标是表单组件，但elements数组为空，需要创建分栏容器
                  if (
                    target &&
                    target.tag === 'form' &&
                    (!target.elements || target.elements.length === 0)
                  ) {
                    // 创建分栏容器（2列布局，第一列用于表单按钮，第二列用于其他元素）
                    const columnSetComponent = {
                      id: `column_set_${Date.now()}_${Math.random()
                        .toString(36)
                        .substr(2, 9)}`,
                      tag: 'column_set',
                      name: 'ColumnSet',
                      columns: [
                        {
                          id: `column_${Date.now()}_${Math.random()
                            .toString(36)
                            .substr(2, 9)}`,
                          tag: 'column',
                          name: 'Column',
                          style: { flex: 1 }, // 第一列：表单按钮列
                          elements: [],
                        },
                        {
                          id: `column_${Date.now()}_${Math.random()
                            .toString(36)
                            .substr(2, 9)}`,
                          tag: 'column',
                          name: 'Column',
                          style: { flex: 2 }, // 第二列：其他表单元素，宽度更大
                          elements: [],
                        },
                      ],
                    };

                    // 将分栏容器添加到表单的elements数组中
                    if (!target.elements) {
                      target.elements = [];
                    }
                    target.elements.push(columnSetComponent);

                    // 继续导航到分栏容器的第一列
                    return navigateAndAdd(
                      columnSetComponent.columns[0],
                      ['elements'],
                      depth + 1,
                      rootElements,
                      originalTargetPath,
                    );
                  }

                  // 如果当前目标是组件对象，使用rootElements进行全局查找
                  if (target && typeof target === 'object' && target.tag) {
                    // 根据原始目标路径判断应该查找什么类型的容器
                    const isTargetingForm =
                      originalTargetPath &&
                      originalTargetPath.length === 5 &&
                      originalTargetPath[0] === 'dsl' &&
                      originalTargetPath[1] === 'body' &&
                      originalTargetPath[2] === 'elements' &&
                      originalTargetPath[4] === 'elements';

                    const isTargetingColumn =
                      originalTargetPath &&
                      originalTargetPath.length === 7 &&
                      originalTargetPath[0] === 'dsl' &&
                      originalTargetPath[1] === 'body' &&
                      originalTargetPath[2] === 'elements' &&
                      originalTargetPath[4] === 'columns' &&
                      originalTargetPath[6] === 'elements';

                    if (isTargetingForm && target.tag !== 'form') {
                      // 使用rootElements在全局查找表单容器
                      if (rootElements && Array.isArray(rootElements)) {
                        const formIndex = rootElements.findIndex(
                          (comp) => comp && comp.tag === 'form',
                        );

                        if (formIndex !== -1) {
                          // 重新构建路径：先导航到表单容器，然后处理elements
                          const correctedPath = [
                            formIndex,
                            'elements',
                            ...nextPath.slice(1),
                          ];
                          return navigateAndAdd(
                            rootElements,
                            correctedPath,
                            depth,
                            rootElements,
                            originalTargetPath,
                          );
                        } else {
                          console.error('❌ 在全局elements中未找到表单容器');
                          return false;
                        }
                      } else {
                        console.error(
                          '❌ rootElements不可用，无法进行全局查找',
                        );
                        return false;
                      }
                    } else if (
                      isTargetingColumn &&
                      target.tag !== 'column_set'
                    ) {
                      // 使用rootElements在全局查找分栏容器
                      if (rootElements && Array.isArray(rootElements)) {
                        const columnIndex = rootElements.findIndex(
                          (comp) => comp && comp.tag === 'column_set',
                        );

                        if (columnIndex !== -1) {
                          // 重新构建路径：先导航到分栏容器，然后处理columns和elements
                          const correctedPath = [
                            columnIndex,
                            'columns',
                            ...nextPath.slice(1),
                          ];
                          return navigateAndAdd(
                            rootElements,
                            correctedPath,
                            depth,
                            rootElements,
                            originalTargetPath,
                          );
                        } else {
                          console.error('❌ 在全局elements中未找到分栏容器');
                          return false;
                        }
                      } else {
                        console.error(
                          '❌ rootElements不可用，无法进行全局查找',
                        );
                        return false;
                      }
                    }
                  }

                  console.error('❌ 无法修正路径，目标不是期望的容器类型');
                  return false;
                }
              }
            } else {
              // 其他情况，直接访问elements属性
              if (target && target.elements && Array.isArray(target.elements)) {
                return navigateAndAdd(
                  target.elements,
                  nextPath,
                  depth + 1,
                  rootElements,
                  originalTargetPath,
                );
              } else {
                console.error('❌ 无法访问elements属性:', {
                  target: target ? 'exists' : 'null',
                  targetTag: target ? target.tag : 'undefined',
                  depth,
                });
                return false;
              }
            }
          }
        }

        // 处理数字索引
        if (typeof key === 'number') {
          const nextTarget = Array.isArray(target) ? target[key] : undefined;
          if (
            nextPath[0] === 'elements' &&
            nextTarget &&
            rootElements &&
            Array.isArray(rootElements)
          ) {
            // 检查目标路径是否指向表单容器
            const isTargetingForm =
              originalTargetPath &&
              originalTargetPath.length === 5 &&
              originalTargetPath[0] === 'dsl' &&
              originalTargetPath[1] === 'body' &&
              originalTargetPath[2] === 'elements' &&
              originalTargetPath[4] === 'elements';

            // 检查目标路径是否指向分栏容器
            const isTargetingColumn =
              originalTargetPath &&
              originalTargetPath.length === 7 &&
              originalTargetPath[0] === 'dsl' &&
              originalTargetPath[1] === 'body' &&
              originalTargetPath[2] === 'elements' &&
              originalTargetPath[4] === 'columns' &&
              originalTargetPath[6] === 'elements';

            // 拖拽到表单容器但实际不是
            if (isTargetingForm && nextTarget.tag !== 'form') {
              const formIndex = rootElements.findIndex(
                (c) => c && c.tag === 'form',
              );
              if (formIndex !== -1) {
                // 修复：直接导航到修正后的目标，跳过当前数字索引处理
                const correctedTarget = rootElements[formIndex];
                return navigateAndAdd(
                  correctedTarget,
                  nextPath,
                  depth + 1,
                  rootElements,
                  originalTargetPath,
                );
              }
            }
            // 拖拽到分栏容器但实际不是
            if (isTargetingColumn && nextTarget.tag !== 'column_set') {
              const colIndex = rootElements.findIndex(
                (c) => c && c.tag === 'column_set',
              );
              if (colIndex !== -1) {
                // 修复：直接导航到修正后的目标，跳过当前数字索引处理
                const correctedTarget = rootElements[colIndex];
                return navigateAndAdd(
                  correctedTarget,
                  nextPath,
                  depth + 1,
                  rootElements,
                  originalTargetPath,
                  componentToAdd,
                );
              }
            }
          }

          if (Array.isArray(target) && key >= 0 && key < target.length) {
            return navigateAndAdd(
              target[key],
              nextPath,
              depth + 1,
              rootElements,
              originalTargetPath,
              componentToAdd,
            );
          } else {
            console.error('❌ 数组索引无效:', {
              key,
              targetLength: Array.isArray(target) ? target.length : 'N/A',
              depth,
            });
            return false;
          }
        }

        // 处理其他属性
        if (target && target[key] !== undefined) {
          return navigateAndAdd(
            target[key],
            nextPath,
            depth + 1,
            rootElements,
            originalTargetPath,
            componentToAdd,
          );
        } else {
          console.error('❌ 属性路径无效:', {
            key,
            target: target ? 'exists' : 'null',
            availableKeys:
              target && typeof target === 'object'
                ? Object.keys(target)
                : 'N/A',
            depth,
          });
          return false;
        }
      };

      // 验证路径的有效性
      if (path.length < 3) {
        console.error('❌ 路径长度不足:', {
          path,
          pathLength: path.length,
          expectedMinLength: 3,
        });
        return elements;
      }

      const success = navigateAndAdd(
        newElements,
        path.slice(3),
        0,
        newElements,
        path,
        cleanedComponent,
      );

      if (success) {
        return newElements;
      } else {
        console.error('❌ 路径导航失败，返回原始数组');
        return elements;
      }
    },
    [cleanRequiredFieldBasedOnTarget],
  );

  // 根据路径移除组件
  const removeComponentByPath = useCallback(
    (elements: ComponentType[], path: (string | number)[]): ComponentType[] => {
      const newElements = [...elements];

      // 根级别组件移除
      if (path.length === 4 && path[2] === 'elements') {
        const index = path[3] as number;

        if (index >= 0 && index < newElements.length) {
          newElements.splice(index, 1);
        } else {
          console.error('❌ 根级别组件移除失败：索引无效', {
            index,
            arrayLength: newElements.length,
          });
        }

        return newElements;
      }

      // 表单容器内组件移除 (路径长度为6)
      if (
        path.length === 6 &&
        path[2] === 'elements' &&
        path[4] === 'elements'
      ) {
        const formIndex = path[3] as number;
        const componentIndex = path[5] as number;

        // 检查表单索引是否有效
        if (formIndex >= 0 && formIndex < newElements.length) {
          const formComponent = newElements[formIndex];

          // 检查是否是表单组件且有elements数组
          if (
            formComponent &&
            formComponent.tag === 'form' &&
            Array.isArray((formComponent as any).elements)
          ) {
            const formElements = (formComponent as any).elements;

            // 检查组件索引是否有效
            if (componentIndex >= 0 && componentIndex < formElements.length) {
              formElements.splice(componentIndex, 1);
            } else {
              console.error('❌ 表单容器内组件移除失败：组件索引无效', {
                componentIndex,
                formElementsLength: formElements.length,
              });
            }
          } else {
            console.error('❌ 表单容器内组件移除失败：不是有效的表单组件', {
              formComponent: formComponent
                ? {
                    id: formComponent.id,
                    tag: formComponent.tag,
                    hasElements: (formComponent as any).elements !== undefined,
                    elementsIsArray: Array.isArray(
                      (formComponent as any).elements,
                    ),
                  }
                : 'null',
            });
          }
        } else {
          console.error('❌ 表单容器内组件移除失败：表单索引无效', {
            formIndex,
            elementsLength: newElements.length,
          });
        }
        return newElements;
      }

      // 分栏列删除 (路径长度为6，格式：['dsl', 'body', 'elements', columnSetIndex, 'columns', columnIndex])
      if (
        path.length === 6 &&
        path[2] === 'elements' &&
        path[4] === 'columns'
      ) {
        const columnSetIndex = path[3] as number;
        const columnIndex = path[5] as number;

        // 检查分栏容器索引是否有效
        if (columnSetIndex >= 0 && columnSetIndex < newElements.length) {
          const columnSetComponent = newElements[columnSetIndex];

          // 检查是否是分栏容器组件且有columns数组
          if (
            columnSetComponent &&
            columnSetComponent.tag === 'column_set' &&
            Array.isArray((columnSetComponent as any).columns)
          ) {
            const columns = (columnSetComponent as any).columns;

            // 检查列索引是否有效
            if (columnIndex >= 0 && columnIndex < columns.length) {
              columns.splice(columnIndex, 1);

              // 如果删除后没有列了，删除整个分栏容器
              if (columns.length === 0) {
                newElements.splice(columnSetIndex, 1);
              }
            } else {
              console.error('❌ 分栏列删除失败：列索引无效', {
                columnIndex,
                columnsLength: columns.length,
              });
            }
          } else {
            console.error('❌ 分栏列删除失败：不是有效的分栏容器组件', {
              columnSetComponent: columnSetComponent
                ? {
                    id: columnSetComponent.id,
                    tag: columnSetComponent.tag,
                    hasColumns:
                      (columnSetComponent as any).columns !== undefined,
                    columnsIsArray: Array.isArray(
                      (columnSetComponent as any).columns,
                    ),
                  }
                : 'null',
            });
          }
        } else {
          console.error('❌ 分栏列删除失败：分栏容器索引无效', {
            columnSetIndex,
            elementsLength: newElements.length,
          });
        }
        return newElements;
      }

      // 表单内分栏列删除 (路径长度为8，格式：['dsl', 'body', 'elements', formIndex, 'elements', columnSetIndex, 'columns', columnIndex])
      if (
        path.length === 8 &&
        path[2] === 'elements' &&
        path[4] === 'elements' &&
        path[6] === 'columns'
      ) {
        const formIndex = path[3] as number;
        const columnSetIndex = path[5] as number;
        const columnIndex = path[7] as number;

        // 检查表单索引是否有效
        if (formIndex >= 0 && formIndex < newElements.length) {
          const formComponent = newElements[formIndex];

          // 检查是否是表单组件且有elements数组
          if (
            formComponent &&
            formComponent.tag === 'form' &&
            Array.isArray((formComponent as any).elements)
          ) {
            const formElements = (formComponent as any).elements;

            // 检查分栏容器索引是否有效
            if (columnSetIndex >= 0 && columnSetIndex < formElements.length) {
              const columnSetComponent = formElements[columnSetIndex];

              // 检查是否是分栏容器组件且有columns数组
              if (
                columnSetComponent &&
                columnSetComponent.tag === 'column_set' &&
                Array.isArray((columnSetComponent as any).columns)
              ) {
                const columns = (columnSetComponent as any).columns;

                // 检查列索引是否有效
                if (columnIndex >= 0 && columnIndex < columns.length) {
                  columns.splice(columnIndex, 1);

                  // 如果删除后没有列了，删除整个分栏容器
                  if (columns.length === 0) {
                    formElements.splice(columnSetIndex, 1);
                  }
                } else {
                  console.error('❌ 表单内分栏列删除失败：列索引无效', {
                    columnIndex,
                    columnsLength: columns.length,
                  });
                }
              } else {
                console.error(
                  '❌ 表单内分栏列删除失败：不是有效的分栏容器组件',
                  {
                    columnSetComponent: columnSetComponent
                      ? {
                          id: columnSetComponent.id,
                          tag: columnSetComponent.tag,
                          hasColumns:
                            (columnSetComponent as any).columns !== undefined,
                          columnsIsArray: Array.isArray(
                            (columnSetComponent as any).columns,
                          ),
                        }
                      : 'null',
                  },
                );
              }
            } else {
              console.error('❌ 表单内分栏列删除失败：分栏容器索引无效', {
                columnSetIndex,
                formElementsLength: formElements.length,
              });
            }
          } else {
            console.error('❌ 表单内分栏列删除失败：不是有效的表单组件', {
              formComponent: formComponent
                ? {
                    id: formComponent.id,
                    tag: formComponent.tag,
                    hasElements: (formComponent as any).elements !== undefined,
                    elementsIsArray: Array.isArray(
                      (formComponent as any).elements,
                    ),
                  }
                : 'null',
            });
          }
        } else {
          console.error('❌ 表单内分栏列删除失败：表单索引无效', {
            formIndex,
            elementsLength: newElements.length,
          });
        }
        return newElements;
      }

      // 递归辅助函数，支持 columns 嵌套
      function recursiveRemove(
        target: any,
        p: (string | number)[],
        depth: number,
      ): boolean {
        if (!target || p.length === 0) return false;
        if (
          p.length === 1 &&
          typeof p[0] === 'number' &&
          Array.isArray(target)
        ) {
          // 到达目标数组
          const idx = p[0] as number;
          if (idx >= 0 && idx < target.length) {
            target.splice(idx, 1);
            return true;
          } else {
            return false;
          }
        }
        // 递归进入
        const key = p[0];

        if (key === 'elements' && Array.isArray(target.elements)) {
          return recursiveRemove(target.elements, p.slice(1), depth + 1);
        }
        if (key === 'columns' && Array.isArray(target.columns)) {
          const colIdx = p[1] as number;
          if (colIdx >= 0 && colIdx < target.columns.length) {
            return recursiveRemove(
              target.columns[colIdx],
              p.slice(2),
              depth + 1,
            );
          } else {
            return false;
          }
        }
        if (typeof key === 'number' && Array.isArray(target)) {
          return recursiveRemove(target[key], p.slice(1), depth + 1);
        }
        // 兜底
        if (target[key] !== undefined) {
          return recursiveRemove(target[key], p.slice(1), depth + 1);
        }

        return false;
      }

      const ok = recursiveRemove(newElements, path.slice(3), 0);
      if (!ok) {
        console.error('❌ removeComponentByPath 递归移除失败', { path });
      }
      return newElements;
    },
    [],
  );

  // 处理容器拖拽
  const handleContainerDrop = useCallback(
    (
      draggedItem: DragItem,
      targetPath: (string | number)[],
      dropIndex?: number,
    ) => {
      // 特殊处理标题组件
      if (
        draggedItem.type === 'title' ||
        (draggedItem.component && draggedItem.component.tag === 'title')
      ) {
        // 标题组件不添加到elements中，而是直接更新header数据
        if (draggedItem.isNew) {
          // 新标题组件，使用默认标题数据
          const defaultHeaderData = {
            title: { content: '主标题' },
            subtitle: { content: '副标题' },
            style: 'blue',
          };

          if (onHeaderDataChange) {
            onHeaderDataChange(defaultHeaderData);
            message.success('标题组件已添加到卡片头部');
          } else {
            console.error('❌ 缺少onHeaderDataChange回调函数');
            message.warning('无法添加标题数据，缺少回调函数');
          }
        } else if (draggedItem.component) {
          // 现有标题组件，从表单或其他位置移动到header
          const titleComponent = draggedItem.component as any;
          const headerData = {
            title: { content: titleComponent.title || '主标题' },
            subtitle: { content: titleComponent.subtitle || '副标题' },
            style: titleComponent.style || 'blue',
          };

          if (onHeaderDataChange) {
            onHeaderDataChange(headerData);
            message.success('标题组件已更新到卡片头部');
          } else {
            console.error('❌ 缺少onHeaderDataChange回调函数');
            message.warning('无法更新标题数据，缺少回调函数');
          }
        }
        return; // 标题组件处理完毕，直接返回
      }

      if (draggedItem.isNew) {
        // 检查表单组件限制（只在拖拽到根级别时检查）
        const isRootLevel =
          targetPath.length === 3 && targetPath[2] === 'elements';
        if (
          draggedItem.type === 'form' &&
          isRootLevel &&
          hasExistingForm(elements)
        ) {
          message.warning('画布中已存在表单容器，每个画布只能有一个表单容器');
          return;
        }

        // 新组件
        const newComponent = createDefaultComponent(draggedItem.type);

        const newElements = addComponentByPath(
          elements,
          targetPath,
          newComponent,
          dropIndex,
        );
        onElementsChange(newElements);
      } else if (draggedItem.component && draggedItem.path) {
        // 现有组件移动
        const draggedComponent = draggedItem.component;
        const draggedPath = draggedItem.path;

        // 检查表单组件限制（只在移动到根级别时检查，且不是自身移动）
        const isRootLevel =
          targetPath.length === 3 && targetPath[2] === 'elements';
        const isMovingFormToRoot =
          draggedComponent.tag === 'form' && isRootLevel;
        const isFormAlreadyAtRoot =
          draggedPath.length === 4 && draggedPath[2] === 'elements';

        if (
          isMovingFormToRoot &&
          !isFormAlreadyAtRoot &&
          hasExistingForm(elements)
        ) {
          message.warning('画布中已存在表单容器，每个画布只能有一个表单容器');
          return;
        }

        let newElements = removeComponentByPath(elements, draggedPath);

        let componentRemovedFromOriginalPosition = false;

        if (draggedPath.length === 4 && draggedPath[2] === 'elements') {
          // 根级别组件：检查原始索引位置是否还有这个组件
          const originalIndex = draggedPath[3] as number;
          componentRemovedFromOriginalPosition =
            originalIndex >= newElements.length ||
            newElements[originalIndex]?.id !== draggedComponent.id;
        } else if (draggedPath.length === 6 && draggedPath[4] === 'elements') {
          // 表单内组件：检查表单的elements数组
          const formIndex = draggedPath[3] as number;
          const componentIndex = draggedPath[5] as number;
          const formComponent = newElements[formIndex];
          if (formComponent && formComponent.tag === 'form') {
            const formElements = (formComponent as any).elements || [];
            componentRemovedFromOriginalPosition =
              componentIndex >= formElements.length ||
              formElements[componentIndex]?.id !== draggedComponent.id;
          }
        } else if (
          draggedPath.length === 8 &&
          draggedPath[4] === 'columns' &&
          draggedPath[6] === 'elements'
        ) {
          // 分栏内组件：检查分栏的elements数组
          const columnSetIndex = draggedPath[3] as number;
          const columnIndex = draggedPath[5] as number;
          const componentIndex = draggedPath[7] as number;
          const columnSetComponent = newElements[columnSetIndex];
          if (columnSetComponent && columnSetComponent.tag === 'column_set') {
            const columns = (columnSetComponent as any).columns || [];
            if (columnIndex < columns.length && columns[columnIndex].elements) {
              const columnElements = columns[columnIndex].elements;
              componentRemovedFromOriginalPosition =
                componentIndex >= columnElements.length ||
                columnElements[componentIndex]?.id !== draggedComponent.id;
            }
          }
        } else if (
          draggedPath.length === 10 &&
          draggedPath[4] === 'elements' &&
          draggedPath[6] === 'columns' &&
          draggedPath[8] === 'elements'
        ) {
          // 分栏容器内普通组件：检查分栏的elements数组
          // 路径格式：['dsl', 'body', 'elements', formIndex, 'elements', columnSetIndex, 'columns', columnIndex, 'elements', componentIndex]
          const formIndex = draggedPath[3] as number;
          const columnSetIndex = draggedPath[5] as number;
          const columnIndex = draggedPath[7] as number;
          const componentIndex = draggedPath[9] as number;
          const formComponent = newElements[formIndex];

          if (formComponent && formComponent.tag === 'form') {
            const formElements = (formComponent as any).elements || [];
            const columnSetComponent = formElements[columnSetIndex];

            if (columnSetComponent && columnSetComponent.tag === 'column_set') {
              const columns = (columnSetComponent as any).columns || [];

              if (
                columnIndex < columns.length &&
                columns[columnIndex].elements
              ) {
                const columnElements = columns[columnIndex].elements;

                componentRemovedFromOriginalPosition =
                  componentIndex >= columnElements.length ||
                  columnElements[componentIndex]?.id !== draggedComponent.id;
              }
            }
          }
        }

        if (!componentRemovedFromOriginalPosition) {
          console.error('❌ 组件移除失败，组件仍然在原始位置:', {
            componentId: draggedComponent.id,
            originalPath: draggedPath,
          });
          message.error('组件移动失败：无法从原位置移除组件');
          return;
        }

        // 修复目标路径：当移除组件后，需要调整目标路径中的索引
        let adjustedTargetPath = [...targetPath];

        // 如果是根级别移动（从根级别到容器），需要调整目标容器的索引
        if (
          draggedPath.length === 4 &&
          draggedPath[2] === 'elements' &&
          targetPath.length >= 4 &&
          targetPath[2] === 'elements'
        ) {
          const draggedIndex = draggedPath[3] as number;
          const targetContainerIndex = targetPath[3] as number;

          // 如果目标容器在被拖拽组件之后，索引需要减1
          if (targetContainerIndex > draggedIndex) {
            adjustedTargetPath[3] = targetContainerIndex - 1;
          }
        }

        newElements = addComponentByPath(
          newElements,
          adjustedTargetPath,
          draggedComponent,
          dropIndex,
        );

        onElementsChange(newElements);
      }
    },
    [
      elements,
      onElementsChange,
      onHeaderDataChange,
      hasExistingTitle,
      hasExistingForm,
      cleanRequiredFieldBasedOnTarget,
      addComponentByPath,
    ],
  );

  // 处理画布组件排序（专门用于DragSortableItem） - 插入式排序
  const handleCanvasComponentSort = useCallback(
    (dragIndex: number, insertIndex: number) => {
      const draggedComponent = elements[dragIndex];

      if (!draggedComponent) {
        console.warn('无效的拖拽组件索引:', dragIndex);
        return;
      }

      // 防止无意义的移动
      // 插入式移动中，只有当拖拽元素就在插入位置时才是无意义的
      if (
        dragIndex === insertIndex ||
        (insertIndex > 0 && dragIndex === insertIndex - 1)
      ) {
        return;
      }

      // 确保插入索引有效
      if (insertIndex < 0 || insertIndex > elements.length) {
        console.warn('无效的插入索引:', insertIndex);
        return;
      }

      // 严格的标题组件限制
      if (draggedComponent.tag === 'title') {
        // 标题组件只能插入到第一位
        if (insertIndex !== 0) {
          message.info('标题组件只能在画布的最上方');
          return;
        }
      } else {
        // 非标题组件不能插入到标题组件的位置
        const targetComponent = elements[insertIndex];
        if (targetComponent && targetComponent.tag === 'title') {
          return;
        }

        // 如果第一位是标题组件，非标题组件不能插入到第一位
        if (insertIndex === 0 && elements[0]?.tag === 'title') {
          message.info('标题组件必须保持在画布顶部');
          return;
        }
      }

      let finalInsertIndex = insertIndex;

      // 特殊处理：确保标题组件始终在第一位
      if (finalInsertIndex === 0 && draggedComponent.tag !== 'title') {
        const hasTitle = elements.some((comp) => comp.tag === 'title');
        if (hasTitle) {
          finalInsertIndex = 1; // 调整到标题后面
          message.info('已调整位置，标题组件保持在顶部');
        }
      }

      // 确保索引有效
      if (
        dragIndex < 0 ||
        dragIndex >= elements.length ||
        finalInsertIndex < 0 ||
        finalInsertIndex > elements.length
      ) {
        console.warn('索引超出范围');
        return;
      }

      const newElements = [...elements];

      // 执行插入式移动：先移除，后插入
      const [movedComponent] = newElements.splice(dragIndex, 1);

      // 调整插入索引（如果插入位置在拖拽位置之后，需要减1）
      const adjustedInsertIndex =
        finalInsertIndex > dragIndex ? finalInsertIndex - 1 : finalInsertIndex;

      // 插入到新位置
      newElements.splice(adjustedInsertIndex, 0, movedComponent);

      onElementsChange(newElements);
    },
    [elements, onElementsChange],
  );

  // 处理组件排序
  const handleComponentSort = useCallback(
    (
      draggedComponent: ComponentType,
      draggedPath: (string | number)[],
      targetPath: (string | number)[],
      dropIndex: number,
    ) => {
      // 保持原始拖拽路径，不要错误地修正为根级别路径
      let finalDraggedPath = draggedPath;

      // ✅ 修复：检查并修正目标路径
      let finalTargetPath = targetPath;

      // 分析路径结构
      const draggedContainerPath = finalDraggedPath.slice(0, -1);
      const targetContainerPath = finalTargetPath.slice(0, -1);
      const draggedIndex = finalDraggedPath[
        finalDraggedPath.length - 1
      ] as number;

      // 检查是否在同一容器内移动
      const isSameContainer =
        JSON.stringify(draggedContainerPath) ===
        JSON.stringify(targetContainerPath);

      if (isSameContainer) {
        // 如果是根级别容器（画布），使用专门的排序函数
        if (
          draggedContainerPath.length === 3 &&
          draggedContainerPath[0] === 'dsl' &&
          draggedContainerPath[1] === 'body' &&
          draggedContainerPath[2] === 'elements'
        ) {
          handleCanvasComponentSort(draggedIndex, dropIndex);
          return;
        }

        // 对于其他容器，实现类似的位置交换逻辑
        let newElements = [...elements];

        // 使用路径找到目标容器
        let containerTargetPath = [...targetContainerPath, 'elements'];

        // 检查目标路径是否已经包含'elements'
        if (finalTargetPath[finalTargetPath.length - 1] === 'elements') {
          containerTargetPath = finalTargetPath;
        }

        // 获取目标容器的elements数组
        const targetContainer = getElementsArrayByPath(
          newElements,
          containerTargetPath,
        );

        if (targetContainer && Array.isArray(targetContainer)) {
          // 执行插入式移动：先移除，后插入（与根级别逻辑保持一致）
          const draggedItem = targetContainer[draggedIndex];

          // 移除原位置的组件
          targetContainer.splice(draggedIndex, 1);

          // 调整插入索引（如果插入位置在拖拽位置之后，需要减1）
          const adjustedTargetIndex =
            dropIndex > draggedIndex ? dropIndex - 1 : dropIndex;

          // 插入到新位置
          targetContainer.splice(adjustedTargetIndex, 0, draggedItem);

          onElementsChange(newElements);
        } else {
          console.error('❌ 无法找到目标容器');
        }
      } else {
        // 先移除原位置的组件
        let newElements = removeComponentByPath(elements, finalDraggedPath);

        // 计算目标容器路径
        const targetElementsPath = [...targetContainerPath, 'elements'];

        // ✅ 修复：避免重复添加'elements'
        let containerTargetPath = targetElementsPath;

        // 检查目标路径是否已经包含'elements'
        if (finalTargetPath[finalTargetPath.length - 1] === 'elements') {
          // 如果目标路径已经以'elements'结尾，直接使用
          containerTargetPath = finalTargetPath;
        }

        // 计算实际的插入位置
        let actualDropIndex = dropIndex;

        // 如果目标是根节点（画布），需要考虑标题组件的影响
        if (
          containerTargetPath.length === 3 &&
          containerTargetPath[0] === 'dsl' &&
          containerTargetPath[1] === 'body' &&
          containerTargetPath[2] === 'elements'
        ) {
          // 检查是否有标题组件
          const titleIndex = newElements.findIndex(
            (comp) => comp.tag === 'title',
          );

          // 如果有标题组件，并且被拖拽的不是标题组件，确保不插入到标题组件之前
          if (
            titleIndex !== -1 &&
            draggedComponent.tag !== 'title' &&
            actualDropIndex <= titleIndex
          ) {
            actualDropIndex = titleIndex + 1;
          }
        }

        // 验证并修正目标路径
        const validatedPath = validateAndCorrectPath(
          newElements,
          containerTargetPath,
        );

        // 添加到新位置
        newElements = addComponentByPath(
          newElements,
          validatedPath,
          draggedComponent,
          actualDropIndex,
        );

        onElementsChange(newElements);
      }
    },
    [
      elements,
      onElementsChange,
      removeComponentByPath,
      addComponentByPath,
      validateAndCorrectPath,
    ],
  );

  // 拖拽处理
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ['component', 'existing-component'],
    canDrop: (item: DragItem) => {
      // 如果是标题组件，检查是否已存在
      if (item.type === 'title' && hasExistingTitle(elements)) {
        return false;
      }
      // 如果是表单组件，检查是否已存在
      if (item.type === 'form' && hasExistingForm(elements)) {
        return false;
      }
      return true;
    },
    drop: (item: DragItem, monitor) => {
      if (monitor.didDrop()) return;

      // 如果是标题组件且已存在，显示提示
      if (item.type === 'title' && hasExistingTitle(elements)) {
        message.warning('画布中已存在标题组件，每个画布只能有一个标题组件');
        return;
      }

      // 如果是表单组件且已存在，显示提示
      if (item.type === 'form' && hasExistingForm(elements)) {
        message.warning('画布中已存在表单容器，每个画布只能有一个表单容器');
        return;
      }
      // 特殊处理标题组件
      if (item.type === 'title') {
        handleContainerDrop(item, ['dsl', 'body', 'elements']);
        return;
      }

      if (item.isNew) {
        // 新组件
        const newComponent = createDefaultComponent(item.type);

        // 清理组件：如果是拖拽到画布根节点，移除 required 字段
        const cleanedComponent = cleanRequiredFieldBasedOnTarget(newComponent, [
          'dsl',
          'body',
          'elements',
        ]);

        // 其他组件添加到末尾
        onElementsChange([...elements, cleanedComponent]);
      } else if (item.component && item.path) {
        // 检查是否是从容器中移动到根级别
        if (item.path.length > 4) {
          // 从容器移动到根级别
          handleContainerDrop(item, ['dsl', 'body', 'elements']);
        }
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  });

  // 处理组件更新
  const handleUpdateComponent = useCallback(
    (componentPath: (string | number)[], updatedComponent: ComponentType) => {
      const updateComponentByPath = (
        elements: ComponentType[],
        path: (string | number)[],
        newComponent: ComponentType,
      ): ComponentType[] => {
        const newElements = [...elements];

        // 如果是根级别组件
        if (path.length === 4 && path[2] === 'elements') {
          const index = path[3] as number;
          if (index >= 0 && index < newElements.length) {
            newElements[index] = newComponent;
            return newElements;
          }
        }

        // 递归更新深层组件
        const navigateAndUpdate = (
          target: any,
          remainingPath: (string | number)[],
        ): boolean => {
          if (!target || remainingPath.length === 0) {
            return false;
          }

          const key = remainingPath[0];
          const nextPath = remainingPath.slice(1);

          // 如果是最后一个路径段，执行更新
          if (nextPath.length === 0) {
            if (Array.isArray(target) && typeof key === 'number') {
              if (key >= 0 && key < target.length) {
                target[key] = newComponent;
                return true;
              }
            } else if (target[key]) {
              target[key] = newComponent;
              return true;
            }
            return false;
          }

          // 继续导航
          if (target[key]) {
            return navigateAndUpdate(target[key], nextPath);
          }

          return false;
        };

        // 从根级别开始导航
        const rootIndex = path[3] as number;
        if (rootIndex >= 0 && rootIndex < newElements.length) {
          const success = navigateAndUpdate(
            newElements[rootIndex],
            path.slice(4),
          );
          if (success) {
            console.log('✅ 深层组件更新成功');
          } else {
            console.error('❌ 深层组件更新失败');
          }
        }

        return newElements;
      };

      try {
        const updatedElements = updateComponentByPath(
          elements,
          componentPath,
          updatedComponent,
        );
        onElementsChange(updatedElements);
      } catch (error) {
        console.error('❌ 组件更新失败:', error);
      }
    },
    [elements, onElementsChange],
  );

  const handleCardClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;

      // 立即阻止事件冒泡，防止触发画布点击事件
      e.stopPropagation();

      // 如果卡片已经被选中，不再重复处理选中事件
      if (isCardSelected) {
        return;
      }

      // 检查是否点击了组件包装器
      const componentWrapper = target.closest('[data-component-wrapper]');
      if (componentWrapper) {
        return;
      }

      // 检查是否点击了拖拽排序项
      const dragSortableItem = target.closest('[data-drag-sortable-item]');
      if (dragSortableItem) {
        return;
      }

      onCardSelect();
    },
    [onCardSelect],
  );

  const cardStyle: React.CSSProperties = useMemo(() => {
    const baseStyle = {
      backgroundColor: '#fff',
      borderRadius: '4px',
      border: isCardSelected ? '2px solid #1890ff' : '2px solid transparent',
      boxShadow: isCardSelected
        ? '0 0 8px rgba(24, 144, 255, 0.3)'
        : '0 2px 8px rgba(0, 0, 0, 0.1)',
      padding: '4px',
      minHeight: '200px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      position: 'relative' as const,
    };

    // 拖拽悬停样式
    if (isOver && canDrop) {
      return {
        ...baseStyle,
        border: '2px dashed #1890ff',
        backgroundColor: 'rgba(24, 144, 255, 0.05)',
      };
    }

    return baseStyle;
  }, [isCardSelected, isOver, canDrop]);

  // Memoize the rendered elements list
  const renderedElements = useMemo(() => {
    if (elements.length === 0) return null;

    return elements.map((component, index) => {
      if (!component) {
        return (
          <ErrorBoundary key={`error-${index}`}>
            <div
              style={{
                padding: '16px',
                border: '1px dashed #ff4d4f',
                borderRadius: '4px',
                textAlign: 'center',
                color: '#ff4d4f',
                backgroundColor: '#fff2f0',
              }}
            >
              ⚠️ 组件数据异常
            </div>
          </ErrorBoundary>
        );
      }

      const componentPath = ['dsl', 'body', 'elements', index];
      const isSelected = isSamePath(selectedPath || null, componentPath);
      const isHovered = isSamePath(hoveredPath, componentPath);

      return (
        <DragSortableItem
          key={`${component.id}-${index}-${componentPath.join('-')}`}
          component={component}
          index={index}
          path={componentPath}
          onMove={handleCanvasComponentSort}
          onClearSelection={() => onSelectComponent(null)}
        >
          <ErrorBoundary>
            <div
              style={{
                display: layoutMode === 'flow' ? 'inline-block' : 'block',
                marginBottom: '0',
                marginRight: layoutMode === 'flow' ? '8px' : '0',
              }}
            >
              <ComponentRenderer
                component={component}
                onSelect={onSelectComponent}
                isSelected={isSelected}
                selectedComponent={null}
                selectedPath={selectedPath}
                onUpdate={() => {}}
                onDelete={onDeleteComponent}
                onCopy={onCopyComponent}
                path={componentPath}
                onCanvasFocus={onCanvasFocus}
                hoveredPath={hoveredPath}
                isHovered={isHovered}
                onContainerDrop={handleContainerDrop}
                onComponentSort={handleComponentSort}
                onUpdateComponent={handleUpdateComponent}
                isPreview={false}
                headerData={headerData}
                variables={variables}
              />
            </div>
          </ErrorBoundary>
        </DragSortableItem>
      );
    });
  }, [
    elements,
    selectedPath,
    hoveredPath,
    layoutMode,
    isSamePath,
    handleCanvasComponentSort,
    onSelectComponent,
    handleContainerDrop,
    handleComponentSort,
    headerData,
    variables,
    onCanvasFocus,
    onDeleteComponent,
    onCopyComponent,
  ]);

  return (
    <div
      ref={drop}
      style={cardStyle}
      onClick={handleCardClick}
      data-card-container="true"
    >
      {/* 选中状态指示器 */}
      {isCardSelected && (
        <div
          style={{
            position: 'absolute',
            top: '-2px',
            left: '-2px',
            width: '8px',
            height: '8px',
            backgroundColor: '#1890ff',
            borderRadius: '50%',
            zIndex: 10,
          }}
        />
      )}
      {/* 拖拽提示 */}
      {isOver && canDrop && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(24, 144, 255, 0.9)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 'bold',
            pointerEvents: 'none',
            zIndex: 1000,
          }}
        >
          释放以添加组件到卡片
        </div>
      )}
      {/* 卡片内容 */}
      <div
        style={{
          display: layoutMode === 'flow' ? 'flex' : 'flex',
          flexDirection: layoutMode === 'flow' ? 'row' : 'column',
          flexWrap: layoutMode === 'flow' ? 'wrap' : 'nowrap',
          gap: layoutMode === 'flow' ? '8px' : `${verticalSpacing}px`,
          position: 'relative',
        }}
      >
        {/* 标题显示区域 - 独立于elements显示 */}
        {(() => {
          return (
            headerData &&
            (headerData.title?.content || headerData.subtitle?.content)
          );
        })() && (
          <div
            style={{
              borderBottom: '1px solid #f0f0f0',
              position: 'relative',
            }}
            data-component-wrapper="true"
            data-component-id="title-component"
            onMouseDown={(e) => {
              e.stopPropagation();
              // 创建一个虚拟的标题组件用于选中，包含完整的标题数据
              const titleComponent = {
                id: 'title-component',
                tag: 'title' as const,
                title: headerData?.title?.content || '主标题',
                subtitle: headerData?.subtitle?.content || '副标题',
                style: {
                  theme: (headerData?.style || 'blue') as
                    | 'blue'
                    | 'wathet'
                    | 'turquoise'
                    | 'green'
                    | 'yellow'
                    | 'orange'
                    | 'red',
                },
              };
              onSelectComponent(titleComponent, ['dsl', 'header']);
              onCanvasFocus();
            }}
            onClick={(e) => {
              e.stopPropagation();
              // 创建一个虚拟的标题组件用于选中，包含完整的标题数据
              const titleComponent = {
                id: 'title-component',
                tag: 'title' as const,
                title: headerData?.title?.content || '主标题',
                subtitle: headerData?.subtitle?.content || '副标题',
                style: {
                  theme: (headerData?.style || 'blue') as
                    | 'blue'
                    | 'wathet'
                    | 'turquoise'
                    | 'green'
                    | 'yellow'
                    | 'orange'
                    | 'red',
                },
              };
              onSelectComponent(titleComponent, ['dsl', 'header']);
              onCanvasFocus();
            }}
          >
            {/* 标题内容区域 */}
            <div
              style={{
                padding: '16px',
                borderWidth: isSamePath(selectedPath || null, ['dsl', 'header'])
                  ? '2px'
                  : '2px',
                borderStyle: 'solid',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                // 应用主题样式
                ...(() => {
                  const themeStyle = headerData?.style || 'blue';
                  const getThemeStyles = (theme: string) => {
                    switch (theme) {
                      case 'blue':
                        return {
                          backgroundColor: '#e6f7ff',
                          borderColor: '#91d5ff',
                          titleColor: '#1890ff',
                          subtitleColor: '#096dd9',
                        };
                      case 'wathet':
                        return {
                          backgroundColor: '#f0f9ff',
                          borderColor: '#7dd3fc',
                          titleColor: '#0ea5e9',
                          subtitleColor: '#0284c7',
                        };
                      case 'turquoise':
                        return {
                          backgroundColor: '#f0fdfa',
                          borderColor: '#5eead4',
                          titleColor: '#14b8a6',
                          subtitleColor: '#0f766e',
                        };
                      case 'green':
                        return {
                          backgroundColor: '#f0fdf4',
                          borderColor: '#86efac',
                          titleColor: '#22c55e',
                          subtitleColor: '#15803d',
                        };
                      case 'yellow':
                        return {
                          backgroundColor: '#fefce8',
                          borderColor: '#fde047',
                          titleColor: '#eab308',
                          subtitleColor: '#a16207',
                        };
                      case 'orange':
                        return {
                          backgroundColor: '#fff7ed',
                          borderColor: '#fdba74',
                          titleColor: '#f97316',
                          subtitleColor: '#ea580c',
                        };
                      case 'red':
                        return {
                          backgroundColor: '#fef2f2',
                          borderColor: '#fca5a5',
                          titleColor: '#ef4444',
                          subtitleColor: '#dc2626',
                        };
                      default:
                        return {
                          backgroundColor: '#e6f7ff',
                          borderColor: '#91d5ff',
                          titleColor: '#1890ff',
                          subtitleColor: '#096dd9',
                        };
                    }
                  };
                  const styles = getThemeStyles(themeStyle);
                  return {
                    backgroundColor: isSamePath(selectedPath || null, [
                      'dsl',
                      'header',
                    ])
                      ? 'rgba(24, 144, 255, 0.05)'
                      : styles.backgroundColor,
                    borderColor: isSamePath(selectedPath || null, [
                      'dsl',
                      'header',
                    ])
                      ? '#1890ff'
                      : styles.borderColor,
                    boxShadow: isSamePath(selectedPath || null, [
                      'dsl',
                      'header',
                    ])
                      ? '0 0 8px rgba(24, 144, 255, 0.3)'
                      : 'none',
                  };
                })(),
              }}
            >
              {/* 操作菜单 - 只在标题被选中时显示 */}
              {isSamePath(selectedPath || null, ['dsl', 'header']) && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    zIndex: 10,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Dropdown
                    menu={{
                      items: [
                        {
                          key: 'delete',
                          icon: <DeleteOutlined />,
                          label: '删除组件',
                          onClick: () => {
                            onSelectComponent(null);
                            if (onHeaderDataChange) {
                              onHeaderDataChange({
                                title: { content: '' },
                                subtitle: { content: '' },
                                style: 'blue',
                              });
                            }
                            message.success('标题组件已删除');
                          },
                          danger: true,
                        },
                      ],
                    }}
                    trigger={['click']}
                    placement="bottomRight"
                  >
                    <Button
                      size="small"
                      type="primary"
                      icon={<MoreOutlined />}
                      style={{
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Dropdown>
                </div>
              )}

              {headerData?.title?.content && (
                <div
                  style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    marginBottom: headerData.subtitle?.content ? '8px' : '0',
                    // 应用主题样式的主标题颜色
                    color: (() => {
                      const themeStyle = headerData?.style || 'blue';
                      const getThemeStyles = (theme: string) => {
                        switch (theme) {
                          case 'blue':
                            return '#1890ff';
                          case 'wathet':
                            return '#0369a1';
                          case 'turquoise':
                            return '#0d9488';
                          case 'green':
                            return '#52c41a';
                          case 'yellow':
                            return '#faad14';
                          case 'orange':
                            return '#fa8c16';
                          case 'red':
                            return '#ff4d4f';
                          default:
                            return '#333';
                        }
                      };
                      return getThemeStyles(themeStyle);
                    })(),
                  }}
                >
                  {headerData.title.content}
                </div>
              )}
              {headerData?.subtitle?.content && (
                <div
                  style={{
                    fontSize: '14px',
                    // 应用主题样式的副标题颜色
                    color: (() => {
                      const themeStyle = headerData?.style || 'blue';
                      const getThemeStyles = (theme: string) => {
                        switch (theme) {
                          case 'blue':
                            return '#096dd9';
                          case 'wathet':
                            return '#0c4a6e';
                          case 'turquoise':
                            return '#0f766e';
                          case 'green':
                            return '#389e0d';
                          case 'yellow':
                            return '#d48806';
                          case 'orange':
                            return '#d46b08';
                          case 'red':
                            return '#cf1322';
                          default:
                            return '#666';
                        }
                      };
                      return getThemeStyles(themeStyle);
                    })(),
                  }}
                >
                  {headerData.subtitle.content}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 其他组件区域 */}
        {renderedElements ? (
          <>{renderedElements}</>
        ) : (
          // 空状态提示
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '200px',
              color: '#999',
              border: '1px dashed #d9d9d9',
              borderRadius: '8px',
              backgroundColor: '#fafafa',
            }}
          >
            <div style={{ fontSize: '16px', marginBottom: '8px' }}>
              拖拽组件到这里
            </div>
          </div>
        )}
      </div>
      {/* 卡片标签 */}
      {isCardSelected && (
        <div
          style={{
            position: 'absolute',
            bottom: '-20px',
            left: '0',
            backgroundColor: '#1890ff',
            color: 'white',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            whiteSpace: 'nowrap',
            zIndex: 10,
          }}
        >
          卡片容器
        </div>
      )}
    </div>
  );
};

export default CardWrapper;
