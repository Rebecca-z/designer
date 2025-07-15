// 修复后的 ComponentRendererCore.tsx - 完整解决表单嵌套显示问题

import { CopyOutlined, DeleteOutlined, MoreOutlined } from '@ant-design/icons';
import { Button, Divider, Dropdown, Input, Select, Typography } from 'antd';
import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { ComponentType, DragItem } from './card-designer-types-updated';

const { Option } = Select;
const { Text } = Typography;

interface ComponentRendererCoreProps {
  component: ComponentType;
  isPreview?: boolean;
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
  path?: (string | number)[];
  index?: number;
  containerPath?: (string | number)[];
  enableDrag?: boolean;
  enableSort?: boolean;
  // 新增：用于直接渲染子组件
  renderChildren?: (
    elements: ComponentType[],
    basePath: (string | number)[],
  ) => React.ReactNode[];
  // 新增：用于支持组件选中和操作菜单
  onSelect?: (component: ComponentType, path: (string | number)[]) => void;
  selectedPath?: (string | number)[] | null;
  onDelete?: (path: (string | number)[]) => void;
  onCopy?: (component: ComponentType) => void;
  onCanvasFocus?: () => void;
}

// 检查组件是否为容器类型
const isContainerComponent = (componentType: string): boolean => {
  return componentType === 'form' || componentType === 'column_set';
};

// 检查是否可以在目标容器中放置指定类型的组件
const canDropInContainer = (
  draggedType: string,
  targetPath: (string | number)[],
): boolean => {
  // 容器组件不能嵌套到其他容器中
  if (isContainerComponent(draggedType)) {
    // 检查是否要放到容器内部（非根节点）
    return !targetPath.some(
      (segment) => segment === 'elements' || segment === 'columns',
    );
  }
  return true;
};

// 辅助函数：检查两个路径是否相同
const isSamePath = (
  path1: (string | number)[] | null,
  path2: (string | number)[],
): boolean => {
  if (!path1) return false;
  return JSON.stringify(path1) === JSON.stringify(path2);
};

// 检查是否是父子关系
const isParentChild = (
  parentPath: (string | number)[],
  childPath: (string | number)[],
): boolean => {
  if (parentPath.length >= childPath.length) return false;
  for (let i = 0; i < parentPath.length; i++) {
    if (parentPath[i] !== childPath[i]) return false;
  }
  return true;
};

// 可拖拽的组件包装器
const DraggableWrapper: React.FC<{
  component: ComponentType;
  path: (string | number)[];
  index: number;
  containerPath: (string | number)[];
  children: React.ReactNode;
  onComponentMove?: (
    draggedComponent: ComponentType,
    draggedPath: (string | number)[],
    targetPath: (string | number)[],
    dropIndex: number,
  ) => void;
  enableSort?: boolean;
}> = ({
  component,
  path,
  index,
  containerPath,
  children,
  onComponentMove,
  enableSort = true,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  // 拖拽源配置
  const [{ isDragging }, drag] = useDrag({
    type: 'existing-component',
    item: {
      type: component.tag,
      component,
      path,
      isNew: false,
    } as DragItem,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // 拖拽目标配置（用于排序）
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ['component', 'existing-component'],
    canDrop: (item: DragItem) => {
      if (!enableSort) return false;

      // 不能拖拽到自己身上
      if (!item.isNew && item.path && isSamePath(item.path, path)) {
        return false;
      }

      // 不能拖拽到自己的子元素上
      if (!item.isNew && item.path && isParentChild(item.path, path)) {
        return false;
      }

      // 检查容器嵌套限制
      if (item.isNew) {
        return canDropInContainer(item.type, containerPath);
      } else if (item.component) {
        return canDropInContainer(item.component.tag, containerPath);
      }

      return true;
    },
    hover: (item: DragItem, monitor) => {
      if (!ref.current || !enableSort) return;

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;

      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      // 只处理现有组件的排序
      if (!item.isNew && item.path && item.component && onComponentMove) {
        const draggedPath = item.path;

        // 检查是否在同一容器内
        const draggedContainerPath = draggedPath.slice(0, -1);
        const targetContainerPath = containerPath;

        if (isSamePath(draggedContainerPath, targetContainerPath)) {
          const draggedIndex = draggedPath[draggedPath.length - 1] as number;
          let targetIndex = index;

          // 根据鼠标位置决定插入位置
          if (hoverClientY > hoverMiddleY) {
            targetIndex = index + 1;
          }

          // 避免无意义的移动
          if (
            draggedIndex === targetIndex ||
            draggedIndex === targetIndex - 1
          ) {
            return;
          }

          // 安全检查：确保路径有效
          if (
            draggedPath.length >= 4 &&
            path.length >= 4 &&
            draggedPath[0] === 'dsl' &&
            draggedPath[1] === 'body' &&
            path[0] === 'dsl' &&
            path[1] === 'body'
          ) {
            console.log('🔄 执行同容器排序:', {
              draggedComponent: {
                id: item.component.id,
                tag: item.component.tag,
              },
              draggedPath,
              targetPath: path,
              targetIndex,
            });

            // 执行排序
            onComponentMove(item.component, draggedPath, path, targetIndex);
          } else {
            console.warn('⚠️ 跳过无效的排序操作:', {
              draggedPath,
              targetPath: path,
              reason: '路径格式不正确',
            });
          }
        }
      }
    },
    drop: (item: DragItem, monitor) => {
      if (monitor.didDrop() || !enableSort) return;

      // 处理跨容器移动
      if (!item.isNew && item.path && item.component && onComponentMove) {
        const draggedPath = item.path;
        const draggedContainerPath = draggedPath.slice(0, -1);
        const targetContainerPath = containerPath;

        // 只处理跨容器移动
        if (!isSamePath(draggedContainerPath, targetContainerPath)) {
          // 确定插入位置
          const rect = ref.current?.getBoundingClientRect();
          const clientOffset = monitor.getClientOffset();
          let insertIndex = index;

          if (rect && clientOffset) {
            const hoverMiddleY = rect.top + rect.height / 2;
            if (clientOffset.y > hoverMiddleY) {
              insertIndex = index + 1;
            }
          }

          // 检查拖拽限制
          if (!canDropInContainer(item.component.tag, targetContainerPath)) {
            console.warn('容器组件不能嵌套到其他容器中');
            return;
          }

          // 安全检查：确保路径有效
          if (
            draggedPath.length >= 4 &&
            path.length >= 4 &&
            draggedPath[0] === 'dsl' &&
            draggedPath[1] === 'body' &&
            path[0] === 'dsl' &&
            path[1] === 'body'
          ) {
            console.log('🔄 执行跨容器移动:', {
              draggedComponent: {
                id: item.component.id,
                tag: item.component.tag,
              },
              draggedPath,
              targetPath: path,
              insertIndex,
            });

            onComponentMove(item.component, draggedPath, path, insertIndex);
          } else {
            console.warn('⚠️ 跳过无效的跨容器移动:', {
              draggedPath,
              targetPath: path,
              reason: '路径格式不正确',
            });
          }
        }
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  });

  // 合并拖拽引用
  drag(drop(ref));

  // 样式
  const wrapperStyle: React.CSSProperties = {
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
    position: 'relative',
    transition: 'all 0.2s ease',
  };

  // 拖拽悬停样式
  if (isOver && canDrop && enableSort) {
    wrapperStyle.transform = 'translateY(-2px)';
    wrapperStyle.boxShadow = '0 4px 12px rgba(24, 144, 255, 0.3)';
  }

  return (
    <div ref={ref} style={wrapperStyle}>
      {/* 拖拽排序提示线 - 顶部 */}
      {isOver && canDrop && enableSort && (
        <div
          style={{
            position: 'absolute',
            top: '-2px',
            left: '0',
            right: '0',
            height: '2px',
            backgroundColor: '#1890ff',
            borderRadius: '1px',
            zIndex: 1000,
            boxShadow: '0 0 4px rgba(24, 144, 255, 0.5)',
          }}
        />
      )}

      {children}

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
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
            pointerEvents: 'none',
            zIndex: 1000,
            boxShadow: '0 2px 8px rgba(255, 77, 79, 0.3)',
          }}
        >
          ❌ 不能移动到这里
        </div>
      )}

      {/* 拖拽成功提示 */}
      {isOver && canDrop && enableSort && (
        <div
          style={{
            position: 'absolute',
            top: '-8px',
            right: '8px',
            backgroundColor: 'rgba(24, 144, 255, 0.9)',
            color: 'white',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: 'bold',
            pointerEvents: 'none',
            zIndex: 1001,
            boxShadow: '0 2px 8px rgba(24, 144, 255, 0.3)',
          }}
        >
          ↕️ 排序
        </div>
      )}
    </div>
  );
};

// 智能拖拽区域组件 - 支持表单和分栏
const SmartDropZone: React.FC<{
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
}> = ({
  targetPath,
  containerType,
  columnIndex,
  children,
  onContainerDrop,
  onComponentMove,
  childElements = [],
}) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ['component', 'existing-component'],
    canDrop: (item: DragItem) => {
      // 特殊处理标题组件 - 标题组件不能拖拽到容器中
      if (
        item.type === 'title' ||
        (item.component && item.component.tag === 'title')
      ) {
        return false;
      }

      // 检查是否可以在此容器中放置
      if (item.isNew) {
        return canDropInContainer(item.type, targetPath);
      } else if (item.component && item.path) {
        // 不能拖拽到自己的父容器中
        if (isParentChild(item.path, targetPath)) {
          return false;
        }
        return canDropInContainer(item.component.tag, targetPath);
      }
      return false;
    },
    drop: (item: DragItem, monitor) => {
      if (monitor.didDrop()) return;

      console.log('🎯 SmartDropZone 拖拽处理:', {
        containerType,
        targetPath,
        item: {
          type: item.type,
          isNew: item.isNew,
          hasComponent: !!item.component,
          hasPath: !!item.path,
        },
        childElementsCount: childElements.length,
        columnIndex,
      });

      if (item.isNew) {
        // 新组件添加到末尾
        console.log('✅ 新组件拖拽到容器:', {
          itemType: item.type,
          targetPath,
          insertIndex: childElements.length,
        });
        onContainerDrop?.(item, targetPath, childElements.length);
      } else if (item.component && item.path) {
        // 现有组件移动
        const draggedContainerPath = item.path.slice(0, -1);

        // 检查是否是跨容器移动
        if (!isSamePath(draggedContainerPath, targetPath)) {
          // 检查拖拽限制
          if (!canDropInContainer(item.component.tag, targetPath)) {
            console.warn(
              `容器组件不能嵌套到${
                containerType === 'form' ? '表单' : '分栏'
              }中`,
            );
            return;
          }
          // 移动到末尾
          onComponentMove?.(
            item.component,
            item.path,
            [...targetPath, childElements.length],
            childElements.length,
          );
        }
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  });

  // 确保children存在且有内容时不显示空状态
  const hasContent = children && React.Children.count(children) > 0;

  const dropZoneStyle: React.CSSProperties = {
    minHeight: hasContent
      ? 'auto'
      : containerType === 'form'
      ? '100px'
      : '80px',
    padding: '8px',
    border: isOver && canDrop ? '2px dashed #1890ff' : '1px dashed #ccc',
    borderRadius: '4px',
    backgroundColor: isOver && canDrop ? 'rgba(24, 144, 255, 0.05)' : '#fafafa',
    position: 'relative',
    transition: 'all 0.2s ease',
    flex: containerType === 'column' ? 1 : 'none',
  };

  // 拖拽悬停效果
  if (isOver && canDrop) {
    dropZoneStyle.transform = 'scale(1.02)';
    dropZoneStyle.boxShadow = '0 4px 12px rgba(24, 144, 255, 0.2)';
  }

  // 拖拽限制效果
  if (isOver && !canDrop) {
    dropZoneStyle.border = '2px dashed #ff4d4f';
    dropZoneStyle.backgroundColor = 'rgba(255, 77, 79, 0.05)';
    dropZoneStyle.transform = 'scale(0.98)';
  }

  const emptyStateMessage =
    containerType === 'form'
      ? '拖拽组件到表单中'
      : `拖拽组件到第${(columnIndex ?? 0) + 1}列`;

  const dropMessage =
    containerType === 'form'
      ? '释放以添加到表单'
      : `释放以添加到第${(columnIndex ?? 0) + 1}列`;

  return (
    <div ref={drop} style={dropZoneStyle}>
      {/* 分栏标题 */}
      {containerType === 'column' && (
        <div
          style={{
            fontSize: '12px',
            color: '#666',
            marginBottom: hasContent ? '8px' : '8px',
            textAlign: 'center',
            fontWeight: 'bold',
            padding: '4px',
            backgroundColor: '#f0f0f0',
            borderRadius: '4px',
          }}
        >
          📐 第{(columnIndex ?? 0) + 1}列
        </div>
      )}

      {/* 内容区域 */}
      {hasContent ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: containerType === 'form' ? '12px' : '8px',
          }}
        >
          {children}
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: containerType === 'form' ? '80px' : '60px',
            color: '#999',
            fontSize: '12px',
            textAlign: 'center',
            border: '1px dashed #d9d9d9',
            borderRadius: '4px',
            backgroundColor: '#fafafa',
          }}
        >
          {emptyStateMessage}
        </div>
      )}

      {/* 拖拽悬停提示 */}
      {isOver && canDrop && (
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
          }}
        >
          {dropMessage}
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
          }}
        >
          ❌ 不能移动到这里
        </div>
      )}
    </div>
  );
};

const ComponentRendererCore: React.FC<ComponentRendererCoreProps> = ({
  component,
  isPreview = false,
  onContainerDrop,
  onComponentMove,
  path = [],
  index = 0,
  containerPath = [],
  enableDrag = true,
  enableSort = true,
  renderChildren,
  onSelect,
  selectedPath,
  onDelete,
  onCopy,
  onCanvasFocus,
}) => {
  // 安全检查
  if (!component || !component.tag) {
    console.warn('ComponentRendererCore: Invalid component:', component);
    return (
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
        ⚠️ 无效组件数据
      </div>
    );
  }

  const comp = component as any;

  // 内部渲染子组件的函数
  const internalRenderChildren = (
    elements: ComponentType[],
    basePath: (string | number)[],
  ): React.ReactNode[] => {
    if (!elements || !Array.isArray(elements) || elements.length === 0) {
      return [];
    }

    console.log('🔄 内部渲染子组件:', {
      elementsCount: elements.length,
      basePath,
      elements: elements.map((el) => ({ id: el?.id, tag: el?.tag })),
    });

    return elements.map((element, elementIndex) => {
      if (!element || !element.id) {
        console.warn('⚠️ 无效的子组件:', elementIndex, element);
        return (
          <div
            key={`invalid-${elementIndex}`}
            style={{
              padding: '8px',
              border: '1px dashed #ff4d4f',
              borderRadius: '4px',
              color: '#ff4d4f',
              fontSize: '12px',
              textAlign: 'center',
              margin: '4px 0',
            }}
          >
            ⚠️ 无效组件数据 (索引: {elementIndex})
          </div>
        );
      }

      const childPath = [...basePath, elementIndex];
      const isSelected = isSamePath(selectedPath || null, childPath);

      console.log(`✅ 渲染子组件 ${elementIndex}:`, {
        elementId: element.id,
        elementTag: element.tag,
        childPath,
        isSelected,
        enableDrag,
        isPreview,
      });

      // 组件选中和操作处理
      const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect?.(element, childPath);
        onCanvasFocus?.();
      };

      const handleDelete = () => {
        onDelete?.(childPath);
      };

      const handleCopy = () => {
        onCopy?.(element);
      };

      // 组件内容
      const componentContent = (
        <ComponentRendererCore
          component={element}
          isPreview={isPreview}
          onContainerDrop={onContainerDrop}
          onComponentMove={onComponentMove}
          path={childPath}
          index={elementIndex}
          containerPath={basePath}
          enableDrag={enableDrag}
          enableSort={enableSort}
          onSelect={onSelect}
          selectedPath={selectedPath}
          onDelete={onDelete}
          onCopy={onCopy}
          onCanvasFocus={onCanvasFocus}
        />
      );

      // 包装器样式
      const wrapperStyle: React.CSSProperties = {
        position: 'relative',
        border:
          isSelected && !isPreview
            ? '2px solid #1890ff'
            : '1px solid transparent',
        borderRadius: '4px',
        padding: '4px',
        margin: '2px 0',
        backgroundColor:
          isSelected && !isPreview ? 'rgba(24, 144, 255, 0.05)' : 'transparent',
        cursor: isPreview ? 'default' : 'pointer',
        transition: 'all 0.2s ease',
      };

      const selectableWrapper = (
        <div style={wrapperStyle} onClick={handleClick}>
          {/* 操作按钮 */}
          {isSelected && !isPreview && onDelete && onCopy && (
            <div
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                zIndex: 10,
              }}
            >
              <Dropdown
                menu={{
                  items: [
                    // 标题组件不显示复制选项
                    ...(element.tag !== 'title'
                      ? [
                          {
                            key: 'copy',
                            icon: <CopyOutlined />,
                            label: '复制组件',
                            onClick: handleCopy,
                          },
                        ]
                      : []),
                    {
                      key: 'delete',
                      icon: <DeleteOutlined />,
                      label: '删除组件',
                      onClick: handleDelete,
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

          {/* 选中状态指示器 */}
          {isSelected && !isPreview && (
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

          {componentContent}
        </div>
      );

      if (enableDrag && !isPreview) {
        return (
          <DraggableWrapper
            key={`${element.id}-${elementIndex}-${childPath.join('-')}`}
            component={element}
            path={childPath}
            index={elementIndex}
            containerPath={basePath}
            onComponentMove={onComponentMove}
            enableSort={enableSort}
          >
            {selectableWrapper}
          </DraggableWrapper>
        );
      } else {
        return (
          <div
            key={`${element.id}-${elementIndex}-${childPath.join('-')}`}
            style={{ marginBottom: '8px' }}
          >
            {selectableWrapper}
          </div>
        );
      }
    });
  };

  // 使用外部传入的渲染函数或内部函数
  const renderChildElements = renderChildren || internalRenderChildren;

  switch (component.tag) {
    case 'form': {
      console.warn('form====', comp);
      const formElements = comp.elements || [];
      const formPath = [...path, 'elements'];

      console.log('📋 渲染表单容器:', {
        formName: comp.name,
        elementsCount: formElements.length,
        formPath,
        elements: formElements.map((el: any) => ({ id: el?.id, tag: el?.tag })),
      });

      const formContent = (
        <div
          style={{
            border: '2px solid #e6f7ff',
            padding: '16px',
            minHeight: '120px',
            borderRadius: '8px',
            backgroundColor: '#f6ffed',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          {/* 表单标题 */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              padding: '8px 12px',
              backgroundColor: '#fff',
              borderRadius: '6px',
              border: '1px solid #e8e8e8',
            }}
          >
            <Text
              style={{ fontSize: '14px', fontWeight: 'bold', color: '#52c41a' }}
            >
              📋 表单容器 {comp.name && `(${comp.name})`}
            </Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {formElements.length} 个组件
            </Text>
          </div>

          {/* 表单拖拽区域 */}
          <SmartDropZone
            targetPath={formPath}
            containerType="form"
            onContainerDrop={onContainerDrop}
            onComponentMove={onComponentMove}
            childElements={formElements}
          >
            {formElements.length > 0
              ? renderChildElements(formElements, formPath)
              : null}
            {formElements.length}
          </SmartDropZone>
        </div>
      );

      return enableDrag && !isPreview ? (
        <DraggableWrapper
          component={component}
          path={path}
          index={index}
          containerPath={containerPath}
          onComponentMove={onComponentMove}
          enableSort={enableSort}
        >
          {formContent}
        </DraggableWrapper>
      ) : (
        formContent
      );
    }

    case 'column_set': {
      const columns = comp.columns || [];

      console.log('📐 渲染分栏容器:', {
        columnsCount: columns.length,
        columns: columns.map((col: any, idx: number) => ({
          columnIndex: idx,
          elementsCount: col.elements?.length || 0,
          elements:
            col.elements?.map((el: any) => ({ id: el?.id, tag: el?.tag })) ||
            [],
        })),
      });

      const columnContent = (
        <div
          style={{
            border: '2px solid #f0e6ff',
            padding: '16px',
            borderRadius: '8px',
            backgroundColor: '#fafafa',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          {/* 分栏标题 */}
          <div
            style={{
              marginBottom: '16px',
              padding: '8px 12px',
              backgroundColor: '#fff',
              borderRadius: '6px',
              border: '1px solid #e8e8e8',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text
              style={{ fontSize: '14px', fontWeight: 'bold', color: '#722ed1' }}
            >
              📐 分栏容器 ({columns.length}列)
            </Text>
          </div>

          {/* 分栏内容区域 */}
          <div
            style={{
              display: 'flex',
              gap: `${comp.gap || 16}px`,
              minHeight: '100px',
            }}
          >
            {columns.map((column: any, columnIndex: number) => {
              const columnElements = column.elements || [];
              const columnPath = [...path, 'columns', columnIndex, 'elements'];

              console.log(`📐 渲染第${columnIndex + 1}列:`, {
                columnIndex,
                elementsCount: columnElements.length,
                columnPath,
                elements: columnElements.map((el: any) => ({
                  id: el?.id,
                  tag: el?.tag,
                })),
              });

              return (
                <SmartDropZone
                  key={`column-${columnIndex}-${columnPath.join('-')}`}
                  targetPath={columnPath}
                  containerType="column"
                  columnIndex={columnIndex}
                  onContainerDrop={onContainerDrop}
                  onComponentMove={onComponentMove}
                  childElements={columnElements}
                >
                  {columnElements.length > 0
                    ? renderChildElements(columnElements, columnPath)
                    : null}
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
          index={index}
          containerPath={containerPath}
          onComponentMove={onComponentMove}
          enableSort={enableSort}
        >
          {columnContent}
        </DraggableWrapper>
      ) : (
        columnContent
      );
    }

    // 所有其他组件类型的渲染逻辑保持不变...
    case 'plain_text': {
      const textContent = (
        <div
          style={{
            color: comp.textColor || '#000000',
            fontSize: `${comp.fontSize || 14}px`,
            fontWeight: comp.fontWeight || 'normal',
            textAlign: comp.textAlign || 'left',
            lineHeight: 1.5,
            padding: '8px 12px',
            backgroundColor: '#fff',
            border: '1px solid #f0f0f0',
            borderRadius: '4px',
          }}
        >
          {comp.content || '文本内容'}
        </div>
      );

      return enableDrag && !isPreview ? (
        <DraggableWrapper
          component={component}
          path={path}
          index={index}
          containerPath={containerPath}
          onComponentMove={onComponentMove}
          enableSort={enableSort}
        >
          {textContent}
        </DraggableWrapper>
      ) : (
        textContent
      );
    }

    case 'rich_text': {
      const richTextContent = (
        <div
          style={{
            padding: '12px',
            border: '1px solid #f0f0f0',
            borderRadius: '4px',
            backgroundColor: '#fff7e6',
            position: 'relative',
          }}
        >
          {!isPreview && (
            <div
              style={{
                position: 'absolute',
                top: '4px',
                right: '8px',
                fontSize: '10px',
                color: '#fa8c16',
                backgroundColor: '#fff2e8',
                padding: '2px 6px',
                borderRadius: '4px',
                border: '1px solid #ffbb96',
              }}
            >
              📝 富文本
            </div>
          )}
          <div style={{ marginTop: isPreview ? '0' : '4px' }}>
            {comp.content?.content?.[0]?.content?.[0]?.text || '富文本内容'}
          </div>
        </div>
      );

      return enableDrag && !isPreview ? (
        <DraggableWrapper
          component={component}
          path={path}
          index={index}
          containerPath={containerPath}
          onComponentMove={onComponentMove}
          enableSort={enableSort}
        >
          {richTextContent}
        </DraggableWrapper>
      ) : (
        richTextContent
      );
    }

    case 'hr': {
      const hrContent = (
        <div style={{ margin: '12px 0' }}>
          <Divider
            style={{
              margin: '0',
              borderColor: '#d9d9d9',
              borderWidth: '2px',
            }}
          />
        </div>
      );

      return enableDrag && !isPreview ? (
        <DraggableWrapper
          component={component}
          path={path}
          index={index}
          containerPath={containerPath}
          onComponentMove={onComponentMove}
          enableSort={enableSort}
        >
          {hrContent}
        </DraggableWrapper>
      ) : (
        hrContent
      );
    }

    case 'img': {
      const imgContent = (
        <div
          style={{
            textAlign: 'center',
            padding: '12px',
            backgroundColor: '#fff',
            border: '1px solid #f0f0f0',
            borderRadius: '4px',
          }}
        >
          <img
            src={
              comp.img_url || 'https://via.placeholder.com/300x200?text=图片'
            }
            alt="图片"
            style={{
              maxWidth: '100%',
              height: 'auto',
              width: comp.width ? `${comp.width}px` : 'auto',
              maxHeight: comp.height ? `${comp.height}px` : '200px',
              objectFit: 'cover',
              borderRadius: '4px',
              border: '1px solid #f0f0f0',
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://via.placeholder.com/300x200?text=图片加载失败';
            }}
          />
        </div>
      );

      return enableDrag && !isPreview ? (
        <DraggableWrapper
          component={component}
          path={path}
          index={index}
          containerPath={containerPath}
          onComponentMove={onComponentMove}
          enableSort={enableSort}
        >
          {imgContent}
        </DraggableWrapper>
      ) : (
        imgContent
      );
    }

    case 'input': {
      const inputContent = (
        <div style={{ marginBottom: '12px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '6px',
              fontWeight: 500,
              color: '#333',
              fontSize: '14px',
            }}
          >
            {comp.name || 'Input'}{' '}
            {comp.required ? <span style={{ color: '#ff4d4f' }}>*</span> : ''}
          </label>
          <Input
            placeholder={comp.placeholder?.content || '请输入'}
            defaultValue={comp.default_value?.content || ''}
            type={comp.inputType || 'text'}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d9d9d9',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: 'white',
            }}
            disabled={isPreview}
          />
        </div>
      );

      return enableDrag && !isPreview ? (
        <DraggableWrapper
          component={component}
          path={path}
          index={index}
          containerPath={containerPath}
          onComponentMove={onComponentMove}
          enableSort={enableSort}
        >
          {inputContent}
        </DraggableWrapper>
      ) : (
        inputContent
      );
    }

    case 'button': {
      const buttonContent = (
        <div style={{ marginBottom: '12px' }}>
          <Button
            type={comp.type || 'primary'}
            size={comp.size || 'middle'}
            danger={comp.danger || false}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 500,
            }}
            disabled={isPreview}
          >
            {comp.text?.content || '按钮'}
            {comp.form_action_type && ` (${comp.form_action_type})`}
          </Button>
        </div>
      );

      return enableDrag && !isPreview ? (
        <DraggableWrapper
          component={component}
          path={path}
          index={index}
          containerPath={containerPath}
          onComponentMove={onComponentMove}
          enableSort={enableSort}
        >
          {buttonContent}
        </DraggableWrapper>
      ) : (
        buttonContent
      );
    }

    case 'select_static': {
      const selectContent = (
        <div style={{ marginBottom: '12px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '6px',
              fontWeight: 500,
              color: '#333',
              fontSize: '14px',
            }}
          >
            {comp.name || 'Select'}{' '}
            {comp.required ? <span style={{ color: '#ff4d4f' }}>*</span> : ''}
          </label>
          <Select
            placeholder="请选择"
            style={{
              width: '100%',
              fontSize: '14px',
            }}
            disabled={isPreview}
          >
            {(comp.options || []).map((option: any, optionIndex: number) => (
              <Option
                key={option.value || optionIndex}
                value={option.value || ''}
              >
                {option.text?.content || `选项${optionIndex + 1}`}
              </Option>
            ))}
          </Select>
        </div>
      );

      return enableDrag && !isPreview ? (
        <DraggableWrapper
          component={component}
          path={path}
          index={index}
          containerPath={containerPath}
          onComponentMove={onComponentMove}
          enableSort={enableSort}
        >
          {selectContent}
        </DraggableWrapper>
      ) : (
        selectContent
      );
    }

    case 'multi_select_static': {
      const multiSelectContent = (
        <div style={{ marginBottom: '12px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '6px',
              fontWeight: 500,
              color: '#333',
              fontSize: '14px',
            }}
          >
            {comp.name || 'MultiSelect'} (多选){' '}
            {comp.required ? <span style={{ color: '#ff4d4f' }}>*</span> : ''}
          </label>
          <Select
            mode="multiple"
            placeholder="请选择"
            style={{
              width: '100%',
              fontSize: '14px',
            }}
            disabled={isPreview}
          >
            {(comp.options || []).map((option: any, optionIndex: number) => (
              <Option
                key={option.value || optionIndex}
                value={option.value || ''}
              >
                {option.text?.content || `选项${optionIndex + 1}`}
              </Option>
            ))}
          </Select>
          <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
            按住 Ctrl/Cmd 键可多选
          </div>
        </div>
      );

      return enableDrag && !isPreview ? (
        <DraggableWrapper
          component={component}
          path={path}
          index={index}
          containerPath={containerPath}
          onComponentMove={onComponentMove}
          enableSort={enableSort}
        >
          {multiSelectContent}
        </DraggableWrapper>
      ) : (
        multiSelectContent
      );
    }

    case 'img_combination': {
      const imgCombContent = (
        <div
          style={{
            padding: '12px',
            backgroundColor: '#fff',
            border: '1px solid #f0f0f0',
            borderRadius: '4px',
          }}
        >
          <div
            style={{
              marginBottom: '12px',
              fontWeight: 'bold',
              color: '#495057',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            🖼️ 多图混排 ({comp.combination_mode})
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${
                comp.combination_mode === 'trisect'
                  ? 3
                  : comp.combination_mode === 'bisect'
                  ? 2
                  : 2
              }, 1fr)`,
              gap: '8px',
            }}
          >
            {(comp.img_list || []).length > 0 ? (
              (comp.img_list || []).map((img: any, imgIndex: number) => (
                <img
                  key={`img-${component.id}-${imgIndex}`}
                  src={
                    img.img_url ||
                    'https://via.placeholder.com/150x150?text=图片'
                  }
                  alt={`图片${imgIndex + 1}`}
                  style={{
                    width: '100%',
                    height: '100px',
                    objectFit: 'cover',
                    borderRadius: '4px',
                    border: '1px solid #f0f0f0',
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://via.placeholder.com/150x150?text=加载失败';
                  }}
                />
              ))
            ) : (
              <div
                style={{
                  gridColumn: `span ${
                    comp.combination_mode === 'trisect'
                      ? 3
                      : comp.combination_mode === 'bisect'
                      ? 2
                      : 2
                  }`,
                  textAlign: 'center',
                  color: '#999',
                  padding: '20px',
                  border: '1px dashed #d9d9d9',
                  borderRadius: '4px',
                }}
              >
                📷 图片组合
              </div>
            )}
          </div>
        </div>
      );

      return enableDrag && !isPreview ? (
        <DraggableWrapper
          component={component}
          path={path}
          index={index}
          containerPath={containerPath}
          onComponentMove={onComponentMove}
          enableSort={enableSort}
        >
          {imgCombContent}
        </DraggableWrapper>
      ) : (
        imgCombContent
      );
    }

    case 'title': {
      const titleContent = (
        <div
          style={{
            padding: '16px',
            backgroundColor: '#fff',
            border: '1px solid #f0f0f0',
            borderRadius: '4px',
            textAlign: 'center',
          }}
        >
          <h1 style={{ margin: '0 0 8px 0', fontSize: '24px', color: '#333' }}>
            {comp.title || '主标题'}
          </h1>
          <h2 style={{ margin: '0', fontSize: '16px', color: '#666' }}>
            {comp.subtitle || '副标题'}
          </h2>
        </div>
      );

      return enableDrag && !isPreview ? (
        <DraggableWrapper
          component={component}
          path={path}
          index={index}
          containerPath={containerPath}
          onComponentMove={onComponentMove}
          enableSort={enableSort}
        >
          {titleContent}
        </DraggableWrapper>
      ) : (
        titleContent
      );
    }

    default: {
      const unknownContent = (
        <div
          style={{
            padding: '16px',
            border: '1px dashed #ccc',
            borderRadius: '4px',
            textAlign: 'center',
            color: '#999',
            backgroundColor: '#fafafa',
          }}
        >
          ❓ 未知组件类型: {(component as any).tag}
        </div>
      );

      return enableDrag && !isPreview ? (
        <DraggableWrapper
          component={component}
          path={path}
          index={index}
          containerPath={containerPath}
          onComponentMove={onComponentMove}
          enableSort={enableSort}
        >
          {unknownContent}
        </DraggableWrapper>
      ) : (
        unknownContent
      );
    }
  }
};

export default ComponentRendererCore;
