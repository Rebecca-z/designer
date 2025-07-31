// card-designer-components.tsx - 修复表单容器嵌套显示的组件渲染器

import { CopyOutlined, DeleteOutlined, MoreOutlined } from '@ant-design/icons';
import { Button, Dropdown, message } from 'antd';
import React from 'react';
import ComponentRendererCore from './card-designer-renderer-core';
import {
  ComponentType,
  DesignData,
  DragItem,
  VariableItem,
} from './card-designer-types-updated';
import ErrorBoundary from './ErrorBoundary';

interface ComponentRendererProps {
  component: ComponentType;
  onSelect: (component: ComponentType, path: (string | number)[]) => void;
  isSelected: boolean;
  selectedComponent: ComponentType | null;
  selectedPath: (string | number)[] | null;
  hoveredPath: (string | number)[] | null;
  isHovered: boolean;
  onUpdate: (data: DesignData) => void;
  onDelete: (path: (string | number)[]) => void;
  onCopy: (component: ComponentType) => void;
  path: (string | number)[];
  isPreview?: boolean;
  onContainerDrop?: (
    draggedItem: DragItem,
    targetPath: (string | number)[],
    dropIndex?: number,
  ) => void;
  onComponentSort?: (
    draggedComponent: ComponentType,
    draggedPath: (string | number)[],
    targetPath: (string | number)[],
    dropIndex: number,
  ) => void;
  onUpdateComponent?: (
    componentPath: (string | number)[],
    updatedComponent: ComponentType,
  ) => void;
  onCanvasFocus?: () => void;
  // 新增：标题数据
  headerData?: {
    title?: { content: string };
    subtitle?: { content: string };
    style?: string; // 改为字符串类型
  };
  // 新增：变量数据
  variables?: VariableItem[];
}

// 检查组件是否为容器类型
// const isContainerComponent = (componentType: string): boolean => {
//   return componentType === 'form' || componentType === 'column_set';
// };

// // 检查是否可以在目标容器中放置指定类型的组件
// const canDropInContainer = (
//   draggedType: string,
//   targetPath: (string | number)[],
// ): boolean => {
//   // 容器组件不能嵌套到其他容器中
//   if (isContainerComponent(draggedType)) {
//     // 检查是否要放到容器内部（非根节点）
//     return !targetPath.some(
//       (segment) => segment === 'elements' || segment === 'columns',
//     );
//   }
//   return true;
// };

// // 获取容器类型（用于错误提示）
// const getContainerType = (path: (string | number)[]): string => {
//   if (path.includes('columns')) return '分栏容器';
//   if (path.includes('elements') && path.length > 2) return '表单容器';
//   return '画布';
// };

// 检查两个路径是否指向同一个组件
const isSamePath = (
  path1: (string | number)[] | null,
  path2: (string | number)[],
): boolean => {
  if (!path1) return false;
  return JSON.stringify(path1) === JSON.stringify(path2);
};

// 容器拖拽区域组件
// const ContainerDropZone: React.FC<{
//   targetPath: (string | number)[];
//   placeholder: string;
//   children?: React.ReactNode;
//   onContainerDrop?: (
//     draggedItem: DragItem,
//     targetPath: (string | number)[],
//     dropIndex?: number,
//   ) => void;
// }> = ({ targetPath, placeholder, children, onContainerDrop }) => {
//   const [{ isOver, canDrop }, drop] = useDrop({
//     accept: ['component', 'existing-component'],
//     canDrop: (item: DragItem) => {
//       // 检查是否可以在此容器中放置
//       if (item.isNew) {
//         return canDropInContainer(item.type, targetPath);
//       } else if (item.component) {
//         return canDropInContainer(item.component.tag, targetPath);
//       }
//       return false;
//     },
//     drop: (item: DragItem, monitor) => {
//       if (monitor.didDrop()) return;

//       // 检查拖拽限制
//       if (item.isNew && !canDropInContainer(item.type, targetPath)) {
//         message.warning(`容器组件不能嵌套到${getContainerType(targetPath)}中`);
//         return;
//       } else if (
//         item.component &&
//         !canDropInContainer(item.component.tag, targetPath)
//       ) {
//         message.warning(`容器组件不能嵌套到${getContainerType(targetPath)}中`);
//         return;
//       }

//       onContainerDrop?.(item, targetPath);
//     },
//     collect: (monitor) => ({
//       isOver: monitor.isOver({ shallow: true }),
//       canDrop: monitor.canDrop(),
//     }),
//   });

//   const dropZoneStyle = {
//     minHeight: children ? 'auto' : '60px',
//     border: isOver && canDrop ? '2px dashed #1890ff' : '2px dashed #d9d9d9',
//     borderRadius: '4px',
//     padding: '8px',
//     backgroundColor: isOver && canDrop ? 'rgba(24, 144, 255, 0.05)' : '#fafafa',
//     position: 'relative' as const,
//     transition: 'all 0.2s ease',
//   };

//   return (
//     <div ref={drop} style={dropZoneStyle}>
//       {children || (
//         <div
//           style={{
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'center',
//             height: '60px',
//             color: '#999',
//             fontSize: '12px',
//             textAlign: 'center',
//           }}
//         >
//           <PlusOutlined style={{ marginRight: '4px' }} />
//           {placeholder}
//         </div>
//       )}

//       {isOver && canDrop && (
//         <div
//           style={{
//             position: 'absolute',
//             top: '50%',
//             left: '50%',
//             transform: 'translate(-50%, -50%)',
//             backgroundColor: 'rgba(24, 144, 255, 0.9)',
//             color: 'white',
//             padding: '4px 8px',
//             borderRadius: '4px',
//             fontSize: '12px',
//             fontWeight: 'bold',
//             pointerEvents: 'none',
//             zIndex: 1000,
//           }}
//         >
//           释放以添加组件
//         </div>
//       )}

//       {isOver && !canDrop && (
//         <div
//           style={{
//             position: 'absolute',
//             top: '50%',
//             left: '50%',
//             transform: 'translate(-50%, -50%)',
//             backgroundColor: 'rgba(255, 77, 79, 0.9)',
//             color: 'white',
//             padding: '4px 8px',
//             borderRadius: '4px',
//             fontSize: '12px',
//             fontWeight: 'bold',
//             pointerEvents: 'none',
//             zIndex: 1000,
//           }}
//         >
//           ❌ 容器组件不能嵌套
//         </div>
//       )}
//     </div>
//   );
// };

const ComponentRenderer: React.FC<ComponentRendererProps> = ({
  component,
  onSelect,
  // isSelected,
  // selectedComponent,
  selectedPath,
  // hoveredPath,
  // isHovered,
  // onUpdate,
  onDelete,
  onCopy,
  path,
  isPreview = false,
  onContainerDrop,
  onComponentSort,
  onUpdateComponent,
  onCanvasFocus,
  headerData,
  variables = [],
}) => {
  // 安全检查 - 防止组件为 undefined 或 null
  if (!component) {
    console.warn('ComponentRenderer: component is null or undefined', { path });
    return (
      <div
        style={{
          padding: '16px',
          border: '1px dashed #ff4d4f',
          borderRadius: '4px',
          textAlign: 'center',
          color: '#ff4d4f',
          backgroundColor: '#fff2f0',
          margin: '4px',
        }}
      >
        ⚠️ 组件数据丢失 (路径: {path.join(' > ')})
      </div>
    );
  }

  // 检查组件是否有基本属性
  if (!component.tag || !component.id) {
    console.warn('ComponentRenderer: component missing required properties', {
      component,
      path,
    });
    return (
      <div
        style={{
          padding: '16px',
          border: '1px dashed #faad14',
          borderRadius: '4px',
          textAlign: 'center',
          color: '#faad14',
          backgroundColor: '#fffbe6',
          margin: '4px',
        }}
      >
        ⚠️ 组件数据不完整 (ID: {component.id || '无'}, Tag:{' '}
        {component.tag || '无'})
      </div>
    );
  }

  // 检查当前组件是否被选中
  const isCurrentSelected = isSamePath(selectedPath || null, path);

  const handleClick = (e: React.MouseEvent) => {
    if (isPreview) return;

    console.log('🎯 组件点击处理:', {
      componentId: component.id,
      componentTag: component.tag,
      path,
      targetTag: (e.target as HTMLElement)?.tagName,
      targetClass: (e.target as HTMLElement)?.className,
    });

    // 立即阻止事件冒泡，防止触发卡片选中
    e.stopPropagation();
    e.preventDefault();

    console.log('✅ 处理组件选中:', {
      componentId: component.id,
      componentTag: component.tag,
      path,
    });

    // 直接处理组件选中
    onSelect(component, path);
    onCanvasFocus?.(); // 通知画布获得焦点
  };

  const handleDelete = (e: any) => {
    if (isPreview) return;
    // Ant Design Menu.Item onClick doesn't provide stopPropagation
    // Only call stopPropagation if it's available (for regular React events)
    if (e?.stopPropagation && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    onDelete(path);
    message.success('组件已删除');
  };

  const handleCopy = (e: any) => {
    if (isPreview) return;
    // Ant Design Menu.Item onClick doesn't provide stopPropagation
    // Only call stopPropagation if it's available (for regular React events)
    if (e?.stopPropagation && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    onCopy(component);
    message.success('组件已复制');
  };

  // 检查是否为表单容器下的分栏容器（包含提交和取消按钮的父容器）
  const isFormColumnSet =
    component.tag === 'column_set' &&
    path.length >= 6 &&
    path[0] === 'dsl' &&
    path[1] === 'body' &&
    path[2] === 'elements' &&
    path[4] === 'elements';

  // 调试信息
  if (component.tag === 'column_set' && isCurrentSelected) {
    console.log('🔍 分栏容器选中状态检查:', {
      componentId: component.id,
      path,
      pathLength: path.length,
      isFormColumnSet,
      isCurrentSelected,
      isPreview,
      shouldShowOperationIcon:
        isCurrentSelected && !isPreview && !isFormColumnSet,
      pathDetails: {
        isDsl: path[0] === 'dsl',
        isBody: path[1] === 'body',
        isElements: path[2] === 'elements',
        hasElementsSegment: path[4] === 'elements',
      },
    });
  }

  const contextMenu = {
    items: [
      // 标题组件和表单组件不显示复制选项
      ...(component.tag !== 'title' && component.tag !== 'form'
        ? [
            {
              key: 'copy',
              icon: <CopyOutlined />,
              label: '复制组件1',
              onClick: handleCopy,
            },
          ]
        : []),
      // 表单容器下的分栏容器不显示删除选项
      ...(!isFormColumnSet
        ? [
            {
              key: 'delete',
              icon: <DeleteOutlined />,
              label: '删除组件1',
              onClick: handleDelete,
              danger: true,
            },
          ]
        : []),
    ],
  };

  // 统一的选中样式配置
  const getSelectedStyle = (isSelected: boolean) => ({
    border:
      isSelected && !isPreview ? '2px solid #1890ff' : '2px solid #d9d9d9',
    boxShadow:
      isSelected && !isPreview
        ? '0 0 8px rgba(24, 144, 255, 0.3)'
        : '0 2px 4px rgba(0,0,0,0.1)',
  });

  // 如果是容器组件，直接使用 ComponentRendererCore 渲染
  if (component.tag === 'form' || component.tag === 'column_set') {
    console.log(`🎯 渲染容器组件 ${component.tag}:`, {
      componentId: component.id,
      path,
      isPreview,
      hasContainerDrop: !!onContainerDrop,
      hasComponentSort: !!onComponentSort,
    });

    return (
      <ErrorBoundary
        fallback={
          <div
            style={{
              padding: '16px',
              border: '1px solid #ff4d4f',
              borderRadius: '4px',
              textAlign: 'center',
              color: '#ff4d4f',
              backgroundColor: '#fff2f0',
              margin: '4px',
            }}
          >
            🚫 容器组件渲染失败
            <br />
            <small>组件类型: {component.tag}</small>
            <br />
            <small>组件ID: {component.id}</small>
          </div>
        }
      >
        <div
          style={{
            ...getSelectedStyle(isCurrentSelected),
            borderRadius: '8px',
            // padding: '4px',
            padding: '0',
            margin: '0',
            // margin: '4px 0',
            position: 'relative',
            cursor: isPreview ? 'default' : 'pointer',
            transition: 'all 0.2s ease',
          }}
          onClick={handleClick}
          data-component-wrapper="true"
          data-component-id={component.id}
        >
          {/* 操作按钮 - 表单容器下的分栏容器不显示 */}
          {isCurrentSelected && !isPreview && !isFormColumnSet && (
            <div
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                zIndex: 10,
              }}
            >
              <Dropdown
                menu={contextMenu}
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
          {isCurrentSelected && !isPreview && (
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
          {/* 使用 ComponentRendererCore 渲染容器组件 */}
          <ComponentRendererCore
            component={component}
            isPreview={isPreview}
            onContainerDrop={onContainerDrop}
            onComponentMove={onComponentSort}
            onUpdateComponent={onUpdateComponent}
            path={path}
            index={0}
            containerPath={path.slice(0, -1)}
            enableDrag={
              !isPreview &&
              !(
                path.length === 4 &&
                path[0] === 'dsl' &&
                path[1] === 'body' &&
                path[2] === 'elements' &&
                // 只有非容器组件才禁用内部拖拽
                !(component.tag === 'form' || component.tag === 'column_set')
              )
            } // 根级别非容器组件禁用内部拖拽，让DragSortableItem处理
            enableSort={!isPreview}
            onSelect={onSelect}
            selectedPath={selectedPath}
            onDelete={onDelete}
            onCopy={onCopy}
            onCanvasFocus={onCanvasFocus}
            headerData={headerData}
            variables={variables}
          />
          {/* 选中状态标签 */}
          {isCurrentSelected && !isPreview && (
            <div
              style={{
                position: 'absolute',
                bottom: '-20px',
                left: '0',
                backgroundColor: '#1890ff',
                color: 'white',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '10px',
                whiteSpace: 'nowrap',
                zIndex: 10,
              }}
            >
              {component.tag} {component.name && `(${component.name})`}
            </div>
          )}
        </div>
      </ErrorBoundary>
    );
  }

  // 普通组件渲染 - 统一选中样式
  const containerStyle: React.CSSProperties = {
    // border:
    //   isCurrentSelected && !isPreview
    //     ? '2px solid #1890ff'
    //     : '1px solid transparent',
    // padding: '4px',
    // margin: '2px',
    borderRadius: '4px',
    cursor: isPreview ? 'default' : 'pointer',
    // minHeight: '30px',
    position: 'relative',
    transition: 'all 0.2s ease',
    // backgroundColor:
    //   isCurrentSelected && !isPreview
    //     ? 'rgba(24, 144, 255, 0.05)'
    //     : 'transparent',
    // boxShadow:
    //   isCurrentSelected && !isPreview
    //     ? '0 0 4px rgba(24, 144, 255, 0.3)'
    //     : 'none',
  };

  return (
    <ErrorBoundary
      fallback={
        <div
          style={{
            padding: '16px',
            border: '1px solid #ff4d4f',
            borderRadius: '4px',
            textAlign: 'center',
            color: '#ff4d4f',
            backgroundColor: '#fff2f0',
            margin: '4px',
          }}
        >
          🚫 组件渲染失败
          <br />
          <small>组件类型: {component.tag}</small>
          <br />
          <small>组件ID: {component.id}</small>
        </div>
      }
    >
      <div
        style={containerStyle}
        onClick={handleClick}
        data-component-wrapper="true"
        data-component-id={component.id}
      >
        {/* 组件操作按钮 - 表单容器下的分栏容器不显示 */}
        {isCurrentSelected && !isPreview && !isFormColumnSet && (
          <div
            style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              zIndex: 10,
            }}
          >
            <Dropdown
              menu={contextMenu}
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
        {isCurrentSelected && !isPreview && (
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
        {/* 组件内容渲染 - 使用 ComponentRendererCore */}
        <ComponentRendererCore
          component={component}
          isPreview={isPreview}
          onUpdateComponent={onUpdateComponent}
          path={path}
          index={0}
          containerPath={path.slice(0, -1)}
          enableDrag={
            !isPreview &&
            !(
              path.length === 4 &&
              path[0] === 'dsl' &&
              path[1] === 'body' &&
              path[2] === 'elements'
            )
          } // 根级别组件禁用内部拖拽，让DragSortableItem处理
          enableSort={!isPreview}
          onSelect={onSelect}
          selectedPath={selectedPath}
          onDelete={onDelete}
          onCopy={onCopy}
          onCanvasFocus={onCanvasFocus}
          headerData={headerData}
          variables={variables}
        />
        {/* 组件标签 */}
        {isCurrentSelected && !isPreview && (
          <div
            style={{
              position: 'absolute',
              bottom: '-20px',
              left: '0',
              backgroundColor: '#1890ff',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              whiteSpace: 'nowrap',
              zIndex: 10,
            }}
          >
            {component.tag} {component.name && `(${component.name})`}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default ComponentRenderer;
