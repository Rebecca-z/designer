import { ColumnWidthOutlined, DeleteOutlined } from '@ant-design/icons';
import { Button, message, Tooltip } from 'antd';
import React, { useRef } from 'react';
import { useDrop } from 'react-dnd';
import { DraggableWrapper } from '../Common/index';
import { ComponentType, DragItem } from '../type';
import { BaseRendererProps } from './types';
import { canDropInContainer, isContainerComponent, isSamePath } from './utils';

// 检查是否是父子关系
const isParentChild = (
  parentPath: (string | number)[],
  childPath: (string | number)[],
): boolean => {
  if (parentPath.length >= childPath.length) return false;
  return parentPath.every((segment, index) => segment === childPath[index]);
};

// 智能拖拽区域组件
interface SmartDropZoneProps {
  targetPath: (string | number)[];
  containerType: 'form' | 'column';
  columnIndex?: number;
  children?: React.ReactNode;
  onContainerDrop?: (
    draggedItem: DragItem,
    targetPath: (string | number)[],
    dropIndex?: number,
  ) => void;
  onComponentMove?: (
    draggedComponent: ComponentType,
    draggedPath: (string | number)[],
    targetPath: (string | number)[],
    dropIndex: number,
  ) => void;
  childElements?: ComponentType[];
  onColumnSelect?: () => void;
  flexValue?: number;
}

const SmartDropZone: React.FC<SmartDropZoneProps> = ({
  targetPath,
  containerType,
  children,
  onContainerDrop,
  onComponentMove,
  childElements = [],
  onColumnSelect,
  flexValue,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [insertIndex, setInsertIndex] = React.useState<number>(0);
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ['component', 'existing-component', 'canvas-component'],
    canDrop: (item: DragItem) => {
      // 特殊处理标题组件 - 标题组件不能拖拽到容器中
      if (
        item.type === 'title' ||
        (item.component && item.component.tag === 'title')
      ) {
        return false;
      }

      // 子组件拖拽时的特殊处理
      if (item.isChildComponent) {
        if (item.path && isParentChild(item.path, targetPath)) {
          return false;
        }
        return canDropInContainer(item.component?.tag || item.type, targetPath);
      }

      // 检查是否可以在此容器中放置
      if (item.isNew) {
        return canDropInContainer(item.type, targetPath);
      } else if (item.component && item.path) {
        // 不能拖拽到自己的父容器中
        if (isParentChild(item.path, targetPath)) {
          return false;
        }

        // 检查是否是根节点组件拖拽到容器
        const isRootComponent =
          item.path.length === 4 &&
          item.path[0] === 'dsl' &&
          item.path[1] === 'body' &&
          item.path[2] === 'elements';

        if (
          !isRootComponent &&
          (containerType === 'column' || containerType === 'form')
        ) {
          // 分栏列和表单容器允许接受任何非容器组件的拖拽
          if (isContainerComponent(item.component?.tag || item.type)) {
            return false;
          }
          return true;
        } else if (!isRootComponent) {
          return false;
        }

        return canDropInContainer(item.component.tag, targetPath);
      }
      return false;
    },
    hover: (item: DragItem, monitor) => {
      if (!ref.current) return;
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      // 获取鼠标相对于容器的位置
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      // 确定插入位置
      let currentInsertIndex = 0;

      // 如果容器为空，直接插入到内部
      if (childElements.length === 0) {
        currentInsertIndex = 0;
      } else {
        // 因为子组件可能嵌套在多层div中
        const childDOMElements = Array.from(
          ref.current.querySelectorAll('[data-component-index]'),
        ) as HTMLElement[];

        if (childDOMElements.length === 0) {
          // 如果没有找到子组件元素，使用原来的逻辑作为后备
          const containerHeight = hoverBoundingRect.height;
          const edgeThreshold = 20;

          if (hoverClientY <= edgeThreshold) {
            currentInsertIndex = 0;
          } else if (hoverClientY >= containerHeight - edgeThreshold) {
            currentInsertIndex = childElements.length;
          } else {
            currentInsertIndex = Math.floor(
              (hoverClientY / containerHeight) * childElements.length,
            );
          }
        } else {
          // 基于组件实际位置进行替换插入
          let insertIndex = 0;

          // 获取被拖拽组件的索引
          let draggedComponentIndex = -1;
          if (item.component && item.path) {
            const draggedPath = item.path;
            if (draggedPath.length > 0) {
              draggedComponentIndex = draggedPath[
                draggedPath.length - 1
              ] as number;
            }
          }

          // 创建一个包含索引和位置的数组
          const childPositions: Array<{
            index: number;
            top: number;
            bottom: number;
            element: HTMLElement;
          }> = [];

          for (let i = 0; i < childDOMElements.length; i++) {
            const childElement = childDOMElements[i] as HTMLElement;
            const childRect = childElement.getBoundingClientRect();
            const childTop = childRect.top - hoverBoundingRect.top;
            const childBottom = childRect.bottom - hoverBoundingRect.top;

            // 获取组件的实际索引
            const componentIndex = parseInt(
              childElement.getAttribute('data-component-index') || '0',
            );

            childPositions.push({
              index: componentIndex,
              top: childTop,
              bottom: childBottom,
              element: childElement,
            });
          }

          // 按索引排序，确保顺序正确
          childPositions.sort((a, b) => a.index - b.index);

          // 找到鼠标位置对应的插入点
          let foundInsertionPoint = false;

          for (let i = 0; i < childPositions.length; i++) {
            const child = childPositions[i];

            // 跳过被拖拽的组件
            if (child.index === draggedComponentIndex) {
              console.log('跳过被拖拽的组件:', child.index);
              continue;
            }

            // 检查鼠标是否在当前组件上方（插入到当前组件之前）
            if (hoverClientY < child.top) {
              insertIndex = child.index;
              foundInsertionPoint = true;
              console.log('鼠标在组件上方，插入到索引:', insertIndex);
              break;
            }

            // 检查鼠标是否在当前组件内部（插入到当前组件之后）
            if (hoverClientY >= child.top && hoverClientY <= child.bottom) {
              // 如果鼠标在组件上半部分，插入到当前组件之前
              if (hoverClientY < child.top + (child.bottom - child.top) / 2) {
                insertIndex = child.index;
                console.log('鼠标在组件上半部分，插入到索引:', insertIndex);
              } else {
                // 如果鼠标在组件下半部分，插入到当前组件之后
                insertIndex = child.index + 1;
                console.log('鼠标在组件下半部分，插入到索引:', insertIndex);
              }
              foundInsertionPoint = true;
              break;
            }
          }

          // 如果没有找到插入点，说明要插入到最后
          if (!foundInsertionPoint) {
            insertIndex = childElements.length;
            console.log('没有找到插入点，插入到最后:', insertIndex);
          }

          // 如果拖拽的是现有组件，需要调整插入索引
          if (draggedComponentIndex >= 0) {
            // 如果插入位置在被拖拽组件之后，需要减1
            if (insertIndex > draggedComponentIndex) {
              insertIndex = insertIndex - 1;
            }
            // 确保插入索引不小于0
            insertIndex = Math.max(insertIndex, 0);
            console.log('调整拖拽组件插入索引:', insertIndex);
          }

          // 确保插入索引在有效范围内
          currentInsertIndex = Math.min(
            Math.max(insertIndex, 0),
            childElements.length,
          );
        }
      }
      setInsertIndex(currentInsertIndex);
    },
    drop: (item: DragItem, monitor) => {
      if (monitor.didDrop()) return;

      if (item.isNew) {
        onContainerDrop?.(item, targetPath, insertIndex);
      } else if (item.component && item.path) {
        const draggedContainerPath = item.path.slice(0, -1);

        if (!isSamePath(draggedContainerPath, targetPath)) {
          if (!canDropInContainer(item.component.tag, targetPath)) {
            return;
          }

          const isRootComponent =
            item.path.length === 4 &&
            item.path[0] === 'dsl' &&
            item.path[1] === 'body' &&
            item.path[2] === 'elements';

          if (isRootComponent) {
            onContainerDrop?.(item, targetPath, insertIndex);
            return;
          }

          onComponentMove?.(item.component, item.path, targetPath, insertIndex);
        } else {
          if (!canDropInContainer(item.component.tag, targetPath)) {
            return;
          }
          onComponentMove?.(item.component, item.path, targetPath, insertIndex);
        }
      }

      setInsertIndex(0);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
      draggedItem: monitor.getItem(),
    }),
  });

  const hasContent = children && React.Children.count(children) > 0;

  const dropZoneStyle: React.CSSProperties = {
    minHeight: hasContent ? 'auto' : containerType === 'form' ? '60px' : '50px',
    borderRadius: '0',
    position: 'relative',
    transition: 'all 0.15s ease',
    flex: containerType === 'column' ? flexValue || 1 : 'none',
    pointerEvents: 'auto',
    boxShadow: isOver && canDrop ? '0 0 8px rgba(24, 144, 255, 0.4)' : 'none',
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    if (containerType === 'column') {
      if (onColumnSelect) {
        onColumnSelect();
      }
      return;
    }

    if (e.target === e.currentTarget) {
      e.stopPropagation();
    }
  };

  return (
    <div ref={drop} style={dropZoneStyle} onClick={handleContainerClick}>
      {/* 内容区域 */}
      {hasContent ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: containerType === 'form' ? '12px' : '8px',
            pointerEvents: 'none',
            height: '100%',
          }}
        >
          <div
            style={{ pointerEvents: 'auto', width: '100%', height: '100%' }}
            ref={ref}
          >
            {children}
          </div>
        </div>
      ) : (
        <div
          style={{ minHeight: containerType === 'form' ? '60px' : '60px' }}
        />
      )}

      {/* 拖拽限制提示 */}
      {isOver && !canDrop && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(255, 77, 79, 0.9)',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
            pointerEvents: 'none',
            zIndex: 1000,
            transition: 'opacity 0.1s ease',
          }}
        >
          ❌ 不能移动到这里
        </div>
      )}
    </div>
  );
};

// 分栏容器渲染器
const ColumnSetRenderer: React.FC<BaseRendererProps> = (props) => {
  const {
    component,
    isPreview,
    enableDrag,
    renderChildren,
    path = [],
    selectedPath,
  } = props;
  const comp = component as any;
  const columns = comp.columns || [];

  // 检查当前组件是否被选中
  const isCurrentSelected = isSamePath(selectedPath || null, path);

  // 检查是否有分栏列被选中
  let selectedColumnIndex = -1;

  // 检查根级别分栏列选中
  if (
    selectedPath &&
    selectedPath.length === 6 &&
    selectedPath[0] === 'dsl' &&
    selectedPath[1] === 'body' &&
    selectedPath[2] === 'elements' &&
    selectedPath[4] === 'columns' &&
    selectedPath[3] === path[3]
  ) {
    selectedColumnIndex = selectedPath[5] as number;
  }

  // 检查表单内分栏列选中
  if (
    selectedPath &&
    selectedPath.length === 8 &&
    selectedPath[0] === 'dsl' &&
    selectedPath[1] === 'body' &&
    selectedPath[2] === 'elements' &&
    selectedPath[4] === 'elements' &&
    selectedPath[6] === 'columns' &&
    selectedPath[3] === path[3] &&
    selectedPath[5] === path[5]
  ) {
    selectedColumnIndex = selectedPath[7] as number;
  }

  const columnContent = (
    <div
      style={{
        // 使用单独的边框属性，避免与DraggableWrapper的borderColor冲突
        borderWidth: isCurrentSelected && !isPreview ? '2px' : '2px',
        borderStyle: 'solid',
        borderColor: isCurrentSelected && !isPreview ? '#1890ff' : '#d9d9d9',
        borderRadius: '4px',
        backgroundColor:
          isCurrentSelected && !isPreview
            ? 'rgba(24, 144, 255, 0.02)'
            : 'transparent',
        boxShadow:
          isCurrentSelected && !isPreview
            ? '0 0 8px rgba(24, 144, 255, 0.3)'
            : 'none',
        transition: 'all 0.2s ease',
        position: 'relative',
        minHeight: '60px',
        padding: '2px', // 添加内边距
        width: '100%', // 确保容器有明确宽度
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && props.onSelect) {
          e.stopPropagation();
          props.onSelect(component, path);
        }
      }}
    >
      {(() => {
        // 检查分栏容器中是否包含提交按钮
        const hasSubmitButton = columns.some((column: any) => {
          const columnElements = column.elements || [];
          return columnElements.some(
            (element: any) =>
              element.tag === 'button' && element.form_action_type === 'submit',
          );
        });

        // 如果包含提交按钮，不显示操作菜单
        if (hasSubmitButton) {
          return null;
        }
      })()}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'nowrap',
          alignItems: 'stretch',
          gap: '2px',
          padding: '0',
          minHeight: '60px',
          width: '100%',
        }}
      >
        {columns.map((column: any, columnIndex: number) => {
          const columnElements = column.elements || [];
          const columnPath = [...path, 'columns', columnIndex, 'elements'];
          const columnSelectionPath = [...path, 'columns', columnIndex];
          const isColumnSelected = selectedColumnIndex === columnIndex;

          // 计算列宽比例
          const columnFlex = column.style?.flex || 1;
          const totalFlex = columns.reduce(
            (sum: number, col: any) => sum + (col.style?.flex || 1),
            0,
          );
          const flexValue = columnFlex / totalFlex;

          const internalRenderChildren = (
            elements: ComponentType[],
            basePath: (string | number)[],
          ) => {
            return elements.map((element, elementIndex) => {
              const childPath = [...basePath, elementIndex];

              if (renderChildren) {
                return renderChildren([element], childPath)[0];
              }

              return <div key={elementIndex}>Component: {element.tag}</div>;
            });
          };

          const renderChildElements = renderChildren || internalRenderChildren;

          // 处理列删除
          const handleColumnDelete = (e: any) => {
            if (isPreview) return;
            if (e?.stopPropagation && typeof e.stopPropagation === 'function') {
              e.stopPropagation();
            }

            // 如果只有一列，不允许删除
            if (columns.length <= 1) {
              message.warning('至少需要保留一列');
              return;
            }

            // 删除当前列并重新计算宽度
            const newColumns = columns.filter(
              (_: any, index: number) => index !== columnIndex,
            );

            const redistributedColumns = newColumns.map((col: any) => {
              return {
                ...col,
                style: {
                  ...col.style,
                },
              };
            });

            // 更新组件 - 确保完全重新创建对象以触发重新渲染
            const updatedComponent = {
              ...component,
              columns: redistributedColumns,
              // 添加时间戳确保对象引用发生变化
              _lastUpdated: Date.now(),
            };

            if (props.onUpdateComponent) {
              // 确保使用正确的路径更新分栏容器
              props.onUpdateComponent(path, updatedComponent);
            } else {
              console.error('❌ onUpdateComponent 回调函数不存在');
            }
          };

          // 检查当前列是否包含提交按钮
          const currentColumnHasSubmitButton = columnElements.some(
            (element: any) =>
              element.tag === 'button' && element.form_action_type === 'submit',
          );

          return (
            <SmartDropZone
              key={`column-dropzone-${column.id || columnIndex}-${columnFlex}`}
              containerType="column"
              columnIndex={columnIndex}
              targetPath={columnPath}
              onContainerDrop={props.onContainerDrop}
              onComponentMove={props.onComponentMove}
              childElements={columnElements}
              flexValue={flexValue}
              onColumnSelect={() =>
                props.onSelect?.(component, columnSelectionPath)
              }
            >
              <div
                style={{
                  borderWidth: '2px',
                  borderStyle: isColumnSelected ? 'solid' : 'dashed',
                  borderColor: isColumnSelected ? '#1890ff' : '#e8e8e8',
                  borderRadius: '4px',
                  backgroundColor: isColumnSelected
                    ? 'rgba(24, 144, 255, 0.02)'
                    : '#fff',
                  minHeight: '60px',
                  height: '100%',
                  cursor: 'pointer',
                  padding: '4px',
                  boxSizing: 'border-box',
                  flex: 1,
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  width: '100%',
                  boxShadow: isColumnSelected
                    ? '0 0 6px rgba(24, 144, 255, 0.2)'
                    : 'none',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  props.onSelect?.(component, columnSelectionPath);
                }}
              >
                {/* 选中状态指示器 */}
                {isColumnSelected && !isPreview && (
                  <>
                    {/* 组件工具栏 */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '-24px',
                        left: '0',
                        right: '0',
                        height: '24px',
                        width: '100px',
                        backgroundColor: '#1890ff',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 8px',
                        zIndex: 100,
                      }}
                    >
                      {/* 组件类型显示 */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          flex: 1,
                        }}
                      >
                        {/* 组件图标 */}

                        <div>
                          <ColumnWidthOutlined
                            style={{
                              fontSize: '14px',
                              color: '#fff',
                            }}
                          />
                        </div>

                        {/* 组件类型名称 */}
                        <span
                          style={{
                            color: '#fff',
                            fontSize: '12px',
                            fontWeight: 500,
                          }}
                        >
                          列
                        </span>
                      </div>

                      {/* 操作按钮区域 */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                        }}
                      >
                        {/* 删除列按钮 - 只有多列且不包含提交按钮时才显示 */}
                        {columns.length > 1 &&
                          !currentColumnHasSubmitButton && (
                            <Tooltip title="删除">
                              <Button
                                size="small"
                                type="text"
                                icon={<DeleteOutlined />}
                                style={{
                                  color: '#fff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                                onClick={handleColumnDelete}
                              />
                            </Tooltip>
                          )}
                      </div>
                    </div>
                  </>
                )}

                {columnElements.length > 0 ? (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'flex-start',
                      width: '100%',
                    }}
                  >
                    {renderChildElements(columnElements, columnPath)}
                  </div>
                ) : null}
              </div>
            </SmartDropZone>
          );
        })}
      </div>
    </div>
  );

  return enableDrag && !isPreview ? (
    <DraggableWrapper
      component={component}
      path={path}
      index={props.index || 0}
      containerPath={props.containerPath || []}
      onComponentMove={props.onComponentMove}
      enableSort={props.enableSort}
      onSelect={props.onSelect}
      selectedPath={props.selectedPath}
      onCanvasFocus={props.onCanvasFocus}
      onClearSelection={props.onClearSelection}
      isPreview={isPreview}
      onDelete={props.onDelete}
      onCopy={props.onCopy}
    >
      {columnContent}
    </DraggableWrapper>
  ) : (
    <>{columnContent}</>
  );
};

export default ColumnSetRenderer;
