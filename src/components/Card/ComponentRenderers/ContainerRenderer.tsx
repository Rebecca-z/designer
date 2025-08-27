// 容器组件渲染器 - Form 和 ColumnSet
import { CopyOutlined, DeleteOutlined, MoreOutlined } from '@ant-design/icons';
import { Button, Dropdown, message } from 'antd';
import React, { useRef } from 'react';
import { useDrop } from 'react-dnd';
import { ComponentType, DragItem } from '../type';
import DraggableWrapper from './shared/DraggableWrapper';
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
  const [insertPosition, setInsertPosition] = React.useState<
    'before' | 'after' | 'inside' | null
  >(null);
  const [indicatorPosition, setIndicatorPosition] = React.useState<
    'top' | 'bottom' | null
  >(null);
  const [insertIndex, setInsertIndex] = React.useState<number>(0);

  const [{ isOver, canDrop, draggedItem }, drop] = useDrop({
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
      const containerHeight = hoverBoundingRect.height;

      // 根据鼠标位置设置指示线位置
      const hoverMiddleY = hoverBoundingRect.top + containerHeight / 2;
      if (clientOffset.y < hoverMiddleY) {
        setIndicatorPosition('top');
      } else {
        setIndicatorPosition('bottom');
      }

      // 确定插入位置
      let currentInsertPosition: 'before' | 'after' | 'inside' | null = null;
      let currentInsertIndex = 0;

      // 如果容器为空，直接插入到内部
      if (childElements.length === 0) {
        currentInsertPosition = 'inside';
        currentInsertIndex = 0;
      } else {
        // 检查是否在容器的边缘区域
        const edgeThreshold = 20;

        if (hoverClientY <= edgeThreshold) {
          currentInsertPosition = 'before';
          currentInsertIndex = 0;
        } else if (hoverClientY >= containerHeight - edgeThreshold) {
          currentInsertPosition = 'after';
          currentInsertIndex = childElements.length;
        } else {
          // 在容器内部，根据鼠标位置确定插入位置
          const childHeight = containerHeight / childElements.length;
          const targetChildIndex = Math.floor(hoverClientY / childHeight);

          if (targetChildIndex < childElements.length) {
            const childTop = targetChildIndex * childHeight;
            const childMiddle = childTop + childHeight / 2;

            if (hoverClientY < childMiddle) {
              currentInsertPosition = 'before';
              currentInsertIndex = targetChildIndex;
            } else {
              currentInsertPosition = 'after';
              currentInsertIndex = targetChildIndex + 1;
            }
          } else {
            currentInsertPosition = 'after';
            currentInsertIndex = childElements.length;
          }
        }
      }

      setInsertPosition(currentInsertPosition);
      setInsertIndex(currentInsertIndex);
    },
    drop: (item: DragItem, monitor) => {
      if (monitor.didDrop()) return;

      setIndicatorPosition(null);

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

      setInsertPosition(null);
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
      {/* 拖拽悬停时的指示线 */}
      {isOver && canDrop && indicatorPosition && (
        <div
          style={{
            position: 'absolute',
            top: indicatorPosition === 'top' ? '0' : '100%',
            left: '0',
            right: '0',
            height: '2px',
            backgroundColor: '#1890ff',
            borderRadius: '1px',
            zIndex: 1000,
            boxShadow: '0 0 4px rgba(24, 144, 255, 0.6)',
            transform:
              indicatorPosition === 'top'
                ? 'translateY(-50%)'
                : 'translateY(50%)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* 插入位置指示线 */}
      {isOver && canDrop && insertPosition === 'before' && (
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
            transition: 'opacity 0.1s ease',
          }}
        />
      )}

      {isOver && canDrop && insertPosition === 'after' && (
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
            transition: 'opacity 0.1s ease',
          }}
        />
      )}

      {/* 内容区域 */}
      {hasContent ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: containerType === 'form' ? '12px' : '8px',
            pointerEvents: 'none',
          }}
        >
          <div style={{ pointerEvents: 'auto' }}>{children}</div>
        </div>
      ) : (
        <div
          style={{ minHeight: containerType === 'form' ? '60px' : '60px' }}
        />
      )}

      {/* 拖拽悬停提示 */}
      {isOver && canDrop && containerType === 'form' && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(24, 144, 255, 0.9)',
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
          {draggedItem?.isChildComponent
            ? '释放以移动到表单'
            : '释放以添加到表单'}
        </div>
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

// 表单容器渲染器
export const FormRenderer: React.FC<BaseRendererProps> = (props) => {
  const {
    component,
    isPreview,
    enableDrag,
    renderChildren,
    path = [],
    selectedPath,
  } = props;
  const comp = component as any;
  const formElements = comp.elements || [];
  const formPath = [...path, 'elements'];

  // 检查当前表单容器是否被选中
  const isCurrentSelected = selectedPath && isSamePath(selectedPath, path);

  // 使用外部传入的渲染函数或内部函数
  const internalRenderChildren = (
    elements: ComponentType[],
    basePath: (string | number)[],
  ) => {
    return elements.map((element, elementIndex) => {
      const childPath = [...basePath, elementIndex];

      if (renderChildren) {
        return renderChildren([element], childPath)[0];
      }

      // 这里应该递归调用主渲染器，但为了避免循环依赖，我们先返回简单内容
      return <div key={elementIndex}>Component: {element.tag}</div>;
    });
  };

  const renderChildElements = renderChildren || internalRenderChildren;

  const formContent = (
    <div
      style={{
        // 使用单独的边框属性，避免与DraggableWrapper的borderColor冲突
        borderWidth: isCurrentSelected && !isPreview ? '2px' : '2px',
        borderStyle: 'solid',
        borderColor: isCurrentSelected && !isPreview ? '#1890ff' : '#e8e8e8',
        borderRadius: '6px',
        backgroundColor:
          isCurrentSelected && !isPreview
            ? 'rgba(24, 144, 255, 0.02)'
            : '#fafafa',
        transition: 'all 0.2s ease',
        position: 'relative',
        minHeight: '100px',
        padding: '8px',
        boxShadow:
          isCurrentSelected && !isPreview
            ? '0 0 8px rgba(24, 144, 255, 0.3)'
            : '0 1px 3px rgba(0, 0, 0, 0.1)',
      }}
      onClick={(e) => {
        // 点击表单容器本身时选中表单容器
        if (e.target === e.currentTarget && props.onSelect) {
          e.stopPropagation();
          props.onSelect(component, path);
        }
      }}
    >
      <SmartDropZone
        targetPath={formPath}
        containerType="form"
        onContainerDrop={props.onContainerDrop}
        onComponentMove={props.onComponentMove}
        childElements={formElements}
      >
        {formElements.length > 0 ? (
          renderChildElements(formElements, formPath)
        ) : (
          <div
            style={{
              textAlign: 'center',
              color: '#999',
              fontSize: '14px',
              padding: '20px',
              borderWidth: '1px',
              borderStyle: 'dashed',
              borderColor: '#d9d9d9',
              borderRadius: '4px',
              backgroundColor: '#fff',
            }}
          >
            拖拽组件到此处构建表单
          </div>
        )}
      </SmartDropZone>
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
    >
      {formContent}
    </DraggableWrapper>
  ) : (
    formContent
  );
};

// 分栏容器渲染器
export const ColumnSetRenderer: React.FC<BaseRendererProps> = (props) => {
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

  // 检查分栏组件是否在表单中
  const isInForm = path.length >= 6 && path[4] === 'elements';

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
        padding: '8px', // 添加内边距
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

        // 如果不包含提交按钮且被选中，显示操作菜单，样式与文本组件保持一致
        return (
          isCurrentSelected &&
          !isPreview && (
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
                    // 根节点分栏容器显示复制选项
                    ...(isInForm
                      ? []
                      : [
                          {
                            key: 'copy',
                            icon: <CopyOutlined />,
                            label: '复制组件',
                            onClick: () => {
                              if (props.onCopy) {
                                props.onCopy(component);
                              }
                            },
                          },
                        ]),
                    {
                      key: 'delete',
                      icon: <DeleteOutlined />,
                      label: isInForm ? '删除列' : '删除组件',
                      onClick: () => {
                        if (props.onDelete && path) {
                          props.onDelete(path);
                        }
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
          )
        );
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

            // 计算删除前的总权重
            const totalOriginalFlex = columns.reduce(
              (sum: number, col: any) => sum + (col.style?.flex || 1),
              0,
            );

            // 计算剩余列的原始权重总和
            const totalRemainingFlex = newColumns.reduce(
              (sum: number, col: any) => sum + (col.style?.flex || 1),
              0,
            );

            const redistributedColumns = newColumns.map((col: any) => {
              const originalFlex = col.style?.flex || 1;
              // 按比例重新分配：(原权重 / 剩余权重总和) * 删除前总权重
              const newFlex =
                (originalFlex / totalRemainingFlex) * totalOriginalFlex;

              return {
                ...col,
                style: {
                  ...col.style,
                  flex: Math.round(newFlex * 100) / 100, // 保留两位小数
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

          // 列操作菜单 - 只保留删除列功能，且不包含提交按钮的列才显示
          const columnContextMenu = {
            items:
              columns.length > 1 && !currentColumnHasSubmitButton
                ? [
                    {
                      key: 'delete',
                      icon: <DeleteOutlined />,
                      label: '删除列',
                      onClick: handleColumnDelete,
                      danger: true,
                    },
                  ]
                : [],
          };

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
                  // 使用单独的边框属性，避免与DraggableWrapper的borderColor冲突
                  borderWidth: isColumnSelected ? '2px' : '2px',
                  borderStyle: isColumnSelected ? 'solid' : 'dashed',
                  borderColor: isColumnSelected ? '#1890ff' : '#e8e8e8',
                  borderRadius: '4px',
                  backgroundColor: isColumnSelected
                    ? 'rgba(24, 144, 255, 0.02)'
                    : '#fff',
                  minHeight: '60px',
                  cursor: 'pointer',
                  padding: '8px',
                  boxSizing: 'border-box',
                  flex: 1,
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  boxShadow: isColumnSelected
                    ? '0 0 6px rgba(24, 144, 255, 0.2)'
                    : 'none',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  props.onSelect?.(component, columnSelectionPath);
                }}
              >
                {/* 列操作菜单 - 选中时显示，但如果列包含提交按钮则不显示 */}
                {(() => {
                  // 如果当前列包含提交按钮，不显示操作菜单
                  if (currentColumnHasSubmitButton) {
                    return null;
                  }

                  // 如果当前列不包含提交按钮且被选中，显示操作菜单
                  return (
                    isColumnSelected &&
                    !isPreview && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '-2px',
                          right: '-2px',
                          zIndex: 10,
                        }}
                      >
                        <Dropdown
                          menu={columnContextMenu}
                          trigger={['click']}
                          placement="bottomRight"
                        >
                          <Button
                            size="small"
                            type="primary"
                            icon={<MoreOutlined />}
                            style={{
                              borderRadius: '50%',
                              width: '20px',
                              height: '20px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '10px',
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </Dropdown>
                      </div>
                    )
                  );
                })()}

                {columnElements.length > 0 ? (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'flex-start',
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
    columnContent
  );
};
