// card-designer-property-panel-updated.tsx - 完整的修复表单容器数据结构问题的属性面板

import {
  BarsOutlined,
  BgColorsOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  ColorPicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Segmented,
  Select,
  Space,
  Switch,
  Tabs,
  Tooltip,
  Tree,
  Typography,
} from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { useDrag } from 'react-dnd';
import {
  COMPONENT_CATEGORIES,
  COMPONENT_TYPES,
  DEFAULT_CARD_DATA,
} from './card-designer-constants';
import {
  CardDesignData,
  CardPadding,
  ComponentType,
  Variable,
  VariableItem,
  VariableObject,
} from './card-designer-types-updated';
import ImageUpload from './ImageUpload';
import RichTextEditor from './RichTextEditor/RichTextEditor';
import AddVariableModal from './Variable/AddVariableModal';
import {
  imageComponentStateManager,
  textComponentStateManager,
} from './Variable/utils/index';
import VariableBinding from './Variable/VariableList';

const { Option } = Select;
const { Text } = Typography;
const { TextArea } = Input;

// 可拖拽的组件项
const DraggableComponent: React.FC<{
  type: string;
  config: any;
}> = ({ type, config }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'component',
    item: { type, isNew: true },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      style={{
        border: '1px solid #d9d9d9',
        borderRadius: '6px',
        cursor: 'grab',
        transition: 'all 0.2s ease',
        backgroundColor: isDragging ? '#f0f9ff' : '#fff',
        opacity: isDragging ? 0.5 : 1,
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        minHeight: '38px',
        justifyContent: 'center',
        boxShadow: isDragging
          ? '0 4px 12px rgba(24, 144, 255, 0.3)'
          : '0 1px 3px rgba(0,0,0,0.1)',
      }}
      onMouseEnter={(e) => {
        if (!isDragging) {
          e.currentTarget.style.borderColor = '#1890ff';
          e.currentTarget.style.backgroundColor = '#f0f9ff';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragging) {
          e.currentTarget.style.borderColor = '#d9d9d9';
          e.currentTarget.style.backgroundColor = '#fff';
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      <config.icon
        style={{
          fontSize: '18px',
          color: isDragging ? '#1890ff' : '#666',
        }}
      />
      <span
        style={{
          fontSize: '11px',
          color: isDragging ? '#1890ff' : '#333',
          fontWeight: isDragging ? 'bold' : 'normal',
          textAlign: 'center',
          lineHeight: '1.2',
        }}
      >
        {config.name}
      </span>
    </div>
  );
};

// 组件库面板
const ComponentLibrary: React.FC = () => {
  const categories = COMPONENT_CATEGORIES.map((category) => ({
    ...category,
    components: Object.entries(COMPONENT_TYPES).filter(
      ([, config]) => config.category === category.key,
    ),
  }));

  return (
    <div style={{ padding: '12px 8px' }}>
      {categories.map((category) => (
        <div key={category.key} style={{ marginBottom: '24px' }}>
          {/* 分类标题 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              backgroundColor: '#f8f9fa',
              borderRadius: '6px',
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: category.color,
              }}
            />
            <Text strong style={{ fontSize: '14px', color: '#333' }}>
              {category.title}
            </Text>
          </div>

          {/* 子组件网格布局 - 一行两列 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
            }}
          >
            {category.components.map(([type, config]) => (
              <DraggableComponent key={type} type={type} config={config} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// 获取组件在数据结构中的实际路径
const getComponentRealPath = (
  data: CardDesignData,
  selectedPath: (string | number)[] | null,
): {
  component: ComponentType | null;
  realPath: (string | number)[] | null;
} => {
  if (!selectedPath) {
    return { component: null, realPath: null };
  }

  // 检查是否是卡片选中状态：['dsl', 'body']
  if (
    selectedPath.length === 2 &&
    selectedPath[0] === 'dsl' &&
    selectedPath[1] === 'body'
  ) {
    return { component: null, realPath: selectedPath };
  }

  // 检查是否是标题组件选中状态：['dsl', 'header']
  if (
    selectedPath &&
    selectedPath.length === 2 &&
    selectedPath[0] === 'dsl' &&
    selectedPath[1] === 'header'
  ) {
    // 创建一个虚拟的标题组件用于属性编辑
    const titleComponent: ComponentType = {
      id: 'title-component',
      tag: 'title',
      style: (data.dsl.header?.style || 'blue') as
        | 'blue'
        | 'wathet'
        | 'turquoise'
        | 'green'
        | 'yellow'
        | 'orange'
        | 'red',
    };
    return { component: titleComponent, realPath: selectedPath };
  }

  if (selectedPath.length < 4) {
    return { component: null, realPath: null };
  }

  // 检查是否是卡片根元素路径：['dsl', 'body', 'elements', index] (长度必须为4)
  if (
    selectedPath.length === 4 &&
    selectedPath[0] === 'dsl' &&
    selectedPath[1] === 'body' &&
    selectedPath[2] === 'elements'
  ) {
    const index = selectedPath[3] as number;
    const component = data.dsl.body.elements[index];

    if (component) {
      return { component, realPath: selectedPath };
    }
  }

  // 检查是否是表单内的组件路径：['dsl', 'body', 'elements', formIndex, 'elements', componentIndex]
  if (
    selectedPath.length === 6 &&
    selectedPath[0] === 'dsl' &&
    selectedPath[1] === 'body' &&
    selectedPath[2] === 'elements' &&
    selectedPath[4] === 'elements'
  ) {
    const formIndex = selectedPath[3] as number;
    const componentIndex = selectedPath[5] as number;
    const formComponent = data.dsl.body.elements[formIndex];

    if (formComponent && formComponent.tag === 'form') {
      const formElements = (formComponent as any).elements || [];
      const component = formElements[componentIndex];

      if (component) {
        console.log('📋 路径命中 - 表单内组件:', {
          selectedPath,
          componentTag: component.tag,
          componentId: component.id,
          formIndex,
          componentIndex,
        });
        return { component, realPath: selectedPath };
      } else {
        console.warn('⚠️ 表单内组件索引无效:', {
          formIndex,
          componentIndex,
          formElementsLength: formElements.length,
          formComponent: formComponent,
        });
      }
    }
  }

  // 检查是否是表单内分栏容器内的组件路径：['dsl', 'body', 'elements', formIndex, 'elements', columnSetIndex, 'columns', columnIndex, 'elements', componentIndex]
  if (
    selectedPath.length === 10 &&
    selectedPath[0] === 'dsl' &&
    selectedPath[1] === 'body' &&
    selectedPath[2] === 'elements' &&
    selectedPath[4] === 'elements' &&
    selectedPath[6] === 'columns' &&
    selectedPath[8] === 'elements'
  ) {
    const formIndex = selectedPath[3] as number;
    const columnSetIndex = selectedPath[5] as number;
    const columnIndex = selectedPath[7] as number;
    const componentIndex = selectedPath[9] as number;
    const formComponent = data.dsl.body.elements[formIndex];

    if (formComponent && formComponent.tag === 'form') {
      const formElements = (formComponent as any).elements || [];
      const columnSetComponent = formElements[columnSetIndex];

      if (columnSetComponent && columnSetComponent.tag === 'column_set') {
        const columns = (columnSetComponent as any).columns || [];
        const column = columns[columnIndex];

        if (column && column.elements) {
          const component = column.elements[componentIndex];

          if (component) {
            console.log('🎯 表单内分栏容器内的组件:', {
              componentId: component.id,
              componentTag: component.tag,
              formIndex,
              columnSetIndex,
              columnIndex,
              componentIndex,
              selectedPath,
              realPath: selectedPath,
            });
            return { component, realPath: selectedPath };
          } else {
            console.warn('⚠️ 表单内分栏容器内的组件索引无效:', {
              formIndex,
              columnSetIndex,
              columnIndex,
              componentIndex,
              columnElementsLength: column.elements?.length || 0,
            });
          }
        } else {
          console.warn('⚠️ 表单内分栏容器的列无效:', {
            formIndex,
            columnSetIndex,
            columnIndex,
            columnsLength: columns.length,
          });
        }
      } else {
        console.warn('⚠️ 表单内分栏容器无效:', {
          formIndex,
          columnSetIndex,
          columnSetComponent,
        });
      }
    }
  }

  // 检查是否是根级别分栏列选中路径：['dsl', 'body', 'elements', columnSetIndex, 'columns', columnIndex]
  if (
    selectedPath.length === 6 &&
    selectedPath[0] === 'dsl' &&
    selectedPath[1] === 'body' &&
    selectedPath[2] === 'elements' &&
    selectedPath[4] === 'columns'
  ) {
    const columnSetIndex = selectedPath[3] as number;
    const columnIndex = selectedPath[5] as number;
    const columnSetComponent = data.dsl.body.elements[columnSetIndex];

    if (columnSetComponent && columnSetComponent.tag === 'column_set') {
      const columns = (columnSetComponent as any).columns || [];
      const column = columns[columnIndex];

      if (column) {
        // 创建一个虚拟的分栏列组件用于属性编辑
        const columnComponent: ComponentType = {
          id: `${columnSetComponent.id}_column_${columnIndex}`,
          tag: 'column',
          ...column,
        };

        console.log('📐 路径命中 - 根级别分栏列选中:', {
          selectedPath,
          componentTag: columnComponent.tag,
          componentId: columnComponent.id,
          columnSetIndex,
          columnIndex,
        });
        return { component: columnComponent, realPath: selectedPath };
      }
    }
  }

  // 检查是否是表单内分栏列选中路径：['dsl', 'body', 'elements', formIndex, 'elements', columnSetIndex, 'columns', columnIndex]
  if (
    selectedPath.length === 8 &&
    selectedPath[0] === 'dsl' &&
    selectedPath[1] === 'body' &&
    selectedPath[2] === 'elements' &&
    selectedPath[4] === 'elements' &&
    selectedPath[6] === 'columns'
  ) {
    const formIndex = selectedPath[3] as number;
    const columnSetIndex = selectedPath[5] as number;
    const columnIndex = selectedPath[7] as number;

    const formComponent = data.dsl.body.elements[formIndex];
    if (formComponent && formComponent.tag === 'form') {
      const formElements = (formComponent as any).elements || [];
      const columnSetComponent = formElements[columnSetIndex];

      if (columnSetComponent && columnSetComponent.tag === 'column_set') {
        const columns = (columnSetComponent as any).columns || [];
        const column = columns[columnIndex];

        if (column) {
          // 创建一个虚拟的分栏列组件用于属性编辑
          const columnComponent: ComponentType = {
            id: `${columnSetComponent.id}_column_${columnIndex}`,
            tag: 'column',
            ...column,
          };

          console.log('📐 路径命中 - 表单内分栏列选中:', {
            selectedPath,
            componentTag: columnComponent.tag,
            componentId: columnComponent.id,
            formIndex,
            columnSetIndex,
            columnIndex,
          });
          return { component: columnComponent, realPath: selectedPath };
        }
      }
    }
  }

  // 检查是否是表单内分栏内的组件路径：['dsl', 'body', 'elements', formIndex, 'elements', columnSetIndex, 'columns', columnIndex, 'elements', componentIndex]
  if (
    selectedPath.length === 10 &&
    selectedPath[0] === 'dsl' &&
    selectedPath[1] === 'body' &&
    selectedPath[2] === 'elements' &&
    selectedPath[4] === 'elements' &&
    selectedPath[6] === 'columns' &&
    selectedPath[8] === 'elements'
  ) {
    const formIndex = selectedPath[3] as number;
    const columnSetIndex = selectedPath[5] as number;
    const columnIndex = selectedPath[7] as number;
    const componentIndex = selectedPath[9] as number;

    const formComponent = data.dsl.body.elements[formIndex];
    if (formComponent && formComponent.tag === 'form') {
      const formElements = (formComponent as any).elements || [];
      const columnSetComponent = formElements[columnSetIndex];

      if (columnSetComponent && columnSetComponent.tag === 'column_set') {
        const columns = (columnSetComponent as any).columns || [];
        const column = columns[columnIndex];

        if (column && column.elements) {
          const component = column.elements[componentIndex];

          if (component) {
            console.log('🎯 路径命中 - 表单内分栏内的组件:', {
              selectedPath,
              componentTag: component.tag,
              componentId: component.id,
              formIndex,
              columnSetIndex,
              columnIndex,
              componentIndex,
            });
            return { component, realPath: selectedPath };
          }
        }
      }
    }
  }

  // 检查是否是根级别分栏内的组件路径：['dsl', 'body', 'elements', columnSetIndex, 'columns', columnIndex, 'elements', componentIndex]
  if (
    selectedPath.length >= 8 &&
    selectedPath[0] === 'dsl' &&
    selectedPath[1] === 'body' &&
    selectedPath[2] === 'elements' &&
    selectedPath[4] === 'columns' &&
    selectedPath[6] === 'elements'
  ) {
    const columnSetIndex = selectedPath[3] as number;
    const columnIndex = selectedPath[5] as number;
    const componentIndex = selectedPath[7] as number;
    const columnSetComponent = data.dsl.body.elements[columnSetIndex];

    if (columnSetComponent && columnSetComponent.tag === 'column_set') {
      const columns = (columnSetComponent as any).columns || [];
      const column = columns[columnIndex];

      if (column && column.elements) {
        const component = column.elements[componentIndex];

        if (component) {
          // console.log('📐 根级别分栏内组件:', {
          //   componentId: component.id,
          //   componentTag: component.tag,
          //   columnSetIndex,
          //   columnIndex,
          //   componentIndex,
          //   selectedPath,
          //   realPath: selectedPath,
          // });
          return { component, realPath: selectedPath };
        }
      }
    }
  }

  console.warn('⚠️ 无法解析组件路径:', selectedPath);
  return { component: null, realPath: null };
};

// 大纲树面板 - 修复数据结构展示
const OutlineTree: React.FC<{
  data: CardDesignData;
  selectedPath: (string | number)[] | null;
  onOutlineHover: (path: (string | number)[] | null) => void;
  onOutlineSelect: (
    component: ComponentType | null,
    path: (string | number)[],
  ) => void;
}> = ({ data, selectedPath, onOutlineHover, onOutlineSelect }) => {
  // 构建树形数据 - 正确反映卡片数据结构
  const treeData = useMemo(() => {
    const buildTreeNode = (
      component: ComponentType,
      index: number,
      basePath: (string | number)[],
    ): any => {
      const path = [...basePath, index];
      const config = COMPONENT_TYPES[component.tag];

      const node: any = {
        title: (
          <Space size={4}>
            {config?.icon && <config.icon />}
            <Text style={{ fontSize: '12px' }}>
              {config?.name || component.tag}
            </Text>
          </Space>
        ),
        key: path.join('-'),
        path,
        component,
        children: [],
      };

      // 处理容器组件的子元素
      if (component.tag === 'form') {
        const formComp = component as any;
        if (formComp.elements && Array.isArray(formComp.elements)) {
          node.children = formComp.elements.map(
            (child: ComponentType, childIndex: number) =>
              buildTreeNode(child, childIndex, [...path, 'elements']),
          );
        }
      } else if (component.tag === 'column_set') {
        const colComp = component as any;
        if (colComp.columns && Array.isArray(colComp.columns)) {
          colComp.columns.forEach((column: any, colIndex: number) => {
            if (column.elements && Array.isArray(column.elements)) {
              // 为每个分栏创建一个中间节点
              const columnNode = {
                title: (
                  <Text style={{ fontSize: '11px', color: '#666' }}>
                    第{colIndex + 1}列
                  </Text>
                ),
                key: [...path, 'columns', colIndex].join('-'),
                path: [...path, 'columns', colIndex],
                component: null,
                children: column.elements.map(
                  (child: ComponentType, childIndex: number) =>
                    buildTreeNode(child, childIndex, [
                      ...path,
                      'columns',
                      colIndex,
                      'elements',
                    ]),
                ),
              };
              node.children.push(columnNode);
            }
          });
        }
      }

      return node;
    };

    // 创建卡片节点作为一级节点
    const cardNode: any = {
      title: (
        <Space size={4}>
          <Text
            style={{ fontSize: '14px', fontWeight: 'bold', color: '#1890ff' }}
          >
            📄 正文
          </Text>
        </Space>
      ),
      key: 'dsl-body',
      path: ['dsl', 'body'],
      component: null, // 卡片本身不是组件，所以为null
      children: data.dsl.body.elements.map((component, index) =>
        buildTreeNode(component, index, ['dsl', 'body', 'elements']),
      ),
    };

    return [cardNode];
  }, [data.dsl.body.elements]);

  const handleSelect = (selectedKeys: React.Key[], info: any) => {
    if (info.node?.path) {
      // 如果是卡片节点，传递null作为组件，路径为['dsl', 'body']
      if (
        info.node.path.length === 2 &&
        info.node.path[0] === 'dsl' &&
        info.node.path[1] === 'body'
      ) {
        console.log('🎯 调用卡片选择: onOutlineSelect(null, ["dsl", "body"])');
        onOutlineSelect(null, info.node.path);
      } else if (info.node.component) {
        console.log('🎯 调用组件选择: onOutlineSelect(component, path)');
        onOutlineSelect(info.node.component, info.node.path);
      } else if (info.node.path && info.node.path.length > 0) {
        // 处理分栏列节点等没有component但有path的节点
        console.log('🎯 调用路径选择: onOutlineSelect(null, path)');
        onOutlineSelect(null, info.node.path);
      } else {
        console.log('⚠️ 未找到有效的组件或卡片节点');
      }
    } else {
      console.log('⚠️ 大纲树选择事件中没有找到有效的节点路径');
    }
  };

  const handleMouseEnter = (info: any) => {
    if (info.node?.path) {
      onOutlineHover(info.node.path);
    }
  };

  const handleMouseLeave = () => {
    onOutlineHover(null);
  };

  const selectedKeys = selectedPath ? [selectedPath.join('-')] : [];

  return (
    <div style={{ padding: '16px' }}>
      {treeData.length > 0 ? (
        <>
          <div
            style={{
              marginBottom: '12px',
              padding: '8px 12px',
              backgroundColor: '#e6f7ff',
              border: '1px solid #91d5ff',
              borderRadius: '6px',
            }}
          >
            <Text style={{ fontSize: '12px', color: '#0958d9' }}>
              📊 卡片包含 {data.dsl.body.elements.length} 个组件
            </Text>
          </div>

          <Tree
            treeData={treeData}
            selectedKeys={selectedKeys}
            onSelect={handleSelect}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            showIcon={false}
            blockNode
            style={{
              backgroundColor: 'transparent',
              fontSize: '12px',
            }}
            titleRender={(nodeData: any) => (
              <div
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  transition: 'all 0.2s ease',
                }}
              >
                {nodeData.title}
              </div>
            )}
          />
        </>
      ) : (
        <div
          style={{
            textAlign: 'center',
            color: '#999',
            padding: '40px 20px',
            border: '2px dashed #d9d9d9',
            borderRadius: '8px',
            backgroundColor: '#fafafa',
          }}
        >
          <BarsOutlined style={{ fontSize: '32px', marginBottom: '12px' }} />
          <div style={{ fontSize: '14px', marginBottom: '8px' }}>暂无组件</div>
          <div style={{ fontSize: '12px' }}>从组件库拖拽组件到画布中</div>
        </div>
      )}
    </div>
  );
};

// 左侧组件面板
export const ComponentPanel: React.FC<{
  data: CardDesignData;
  selectedPath: (string | number)[] | null;
  onOutlineHover: (path: (string | number)[] | null) => void;
  onOutlineSelect: (
    component: ComponentType | null,
    path: (string | number)[],
  ) => void;
}> = ({ data, selectedPath, onOutlineHover, onOutlineSelect }) => {
  return (
    <div
      style={{
        width: '300px',
        height: 'calc(100vh - 60px)',
        backgroundColor: '#fafafa',
        borderRight: '1px solid #d9d9d9',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Tabs
        defaultActiveKey="components"
        style={{ flex: 1 }}
        tabBarStyle={{
          padding: '0 16px',
          backgroundColor: '#fff',
          margin: 0,
          borderBottom: '1px solid #d9d9d9',
        }}
        size="small"
        items={[
          {
            key: 'components',
            label: (
              <span
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <PlusOutlined />
                组件库
              </span>
            ),
            children: (
              <div style={{ height: 'calc(100vh - 120px)', overflow: 'auto' }}>
                <ComponentLibrary />
              </div>
            ),
          },
          {
            key: 'outline',
            label: (
              <span
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <BarsOutlined />
                大纲树
              </span>
            ),
            children: (
              <div style={{ height: 'calc(100vh - 120px)', overflow: 'auto' }}>
                <OutlineTree
                  data={data}
                  selectedPath={selectedPath}
                  onOutlineHover={onOutlineHover}
                  onOutlineSelect={onOutlineSelect}
                />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};

// 事件管理相关类型定义
interface EventAction {
  id: string;
  type: 'callback';
  action: string;
  paramType: 'string' | 'object';
  paramValue: string;
  confirmDialog: boolean;
}

// 事件编辑弹窗组件
const EventEditModal: React.FC<{
  visible: boolean;
  eventAction: EventAction;
  variables: Variable[];
  onOk: (action: EventAction) => void;
  onCancel: () => void;
  onChange: (field: string, value: any) => void;
  onAddVariable: () => void;
}> = ({ visible, eventAction, onOk, onCancel, onChange, onAddVariable }) => {
  return (
    <Modal
      title="编辑动作"
      open={visible}
      onOk={() => onOk(eventAction)}
      onCancel={onCancel}
      okText="确定"
      cancelText="取消"
      width={500}
    >
      <Form layout="vertical">
        <Form.Item label="动作" required>
          <Select
            value={eventAction.action}
            onChange={(value) => onChange('action', value)}
            style={{ width: '100%' }}
          >
            <Option value="callback">请求回调</Option>
          </Select>
        </Form.Item>

        <Form.Item label="参数类型" required>
          <Select
            value={eventAction.paramType}
            onChange={(value) => onChange('paramType', value)}
            style={{ width: '100%' }}
          >
            <Option value="string">字符串</Option>
            <Option value="object">对象</Option>
          </Select>
        </Form.Item>

        <Form.Item label="输入参数" required>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Input
              value={eventAction.paramValue}
              onChange={(e) => onChange('paramValue', e.target.value)}
              placeholder="请输入参数"
              style={{ flex: 1 }}
            />
            <Button type="default" onClick={onAddVariable} size="small">
              变量
            </Button>
          </div>
        </Form.Item>

        <Form.Item label="二次确认弹窗">
          <Switch
            checked={eventAction.confirmDialog}
            onChange={(checked) => onChange('confirmDialog', checked)}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

// 添加组合模式处理工具函数
const getStorageCombinationMode = (mode: string): string => {
  if (mode.startsWith('bisect_')) {
    return 'bisect';
  }
  if (mode.startsWith('trisect_')) {
    return 'trisect';
  }
  return mode;
};

const getDisplayCombinationMode = (
  storageMode: string,
  imageCount: number,
): string => {
  if (storageMode === 'bisect') {
    switch (imageCount) {
      case 2:
        return 'bisect_2';
      case 4:
        return 'bisect_4';
      case 6:
        return 'bisect_6';
      default:
        return 'bisect_2'; // 默认双列2图
    }
  }
  if (storageMode === 'trisect') {
    switch (imageCount) {
      case 3:
        return 'trisect_3';
      case 6:
        return 'trisect_6';
      case 9:
        return 'trisect_9';
      default:
        return 'trisect_3'; // 默认三列3图
    }
  }
  return storageMode;
};

// 右侧属性面板 - 修复数据更新逻辑
// 辅助函数：获取变量对象的实际变量名（过滤掉内部属性）
const getVariableKeys = (variable: any): string[] => {
  if (typeof variable === 'object' && variable !== null) {
    return Object.keys(variable as Record<string, any>).filter(
      (key) => !(key.startsWith('__') && key.endsWith('_originalType')),
    );
  }
  return [];
};

export const PropertyPanel: React.FC<{
  selectedComponent: ComponentType | null;
  selectedPath: (string | number)[] | null;
  onUpdateComponent: (component: ComponentType) => void;
  onUpdateCard: (updates: any) => void;
  variables: VariableItem[];
  onUpdateVariables: (variables: VariableItem[]) => void;
  cardVerticalSpacing: number;
  cardPadding: CardPadding;
  // 新增：标题数据
  headerData?: {
    title?: { content: string };
    subtitle?: { content: string };
    style?: string; // 改为字符串类型
  };
  // 新增：卡片数据（用于样式设置）
  cardData?: CardDesignData;
}> = ({
  // selectedComponent,
  selectedPath,
  onUpdateComponent,
  onUpdateCard,
  variables,
  onUpdateVariables,
  cardVerticalSpacing,
  // cardPadding,
  headerData,
  cardData,
}) => {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState<string>('properties');
  const [topLevelTab, setTopLevelTab] = useState<string>('component'); // 新增顶层Tab状态

  // 文本内容模式状态管理
  const [textContentMode, setTextContentMode] = useState<
    'specify' | 'variable'
  >('specify');

  // 图片内容模式状态管理
  const [imageContentMode, setImageContentMode] = useState<
    'specify' | 'variable'
  >('specify');

  // 记住每个组件上次绑定的变量
  const [lastBoundVariables, setLastBoundVariables] = useState<
    Record<string, string>
  >({});

  // 跟踪已初始化的组件，避免重复设置模式
  const [initializedComponents, setInitializedComponents] = useState<
    Set<string>
  >(new Set());

  // 跟踪已初始化的图片组件，避免重复设置模式
  const [initializedImageComponents, setInitializedImageComponents] = useState<
    Set<string>
  >(new Set());

  // 变量管理相关状态
  const [isAddVariableModalVisible, setIsAddVariableModalVisible] =
    useState(false);
  const [editingVariable, setEditingVariable] = useState<Variable | null>(null);
  const [isVariableModalFromVariablesTab, setIsVariableModalFromVariablesTab] =
    useState(false); // 新增：标识变量弹窗是否来自变量Tab

  // 事件管理相关状态
  const [isEventEditModalVisible, setIsEventEditModalVisible] = useState(false);
  const [currentEventAction, setCurrentEventAction] = useState<EventAction>({
    id: '',
    type: 'callback',
    action: '',
    paramType: 'string',
    paramValue: '',
    confirmDialog: false,
  });
  const [editingActionIndex, setEditingActionIndex] = useState(-1);

  // 添加强制重新渲染状态
  const [, forceUpdate] = useState(0);

  // 获取真实的组件和路径
  const { component: realComponent, realPath } = getComponentRealPath(
    cardData || DEFAULT_CARD_DATA,
    selectedPath,
  );

  // 监听选中组件变化，同步文本内容模式
  useEffect(() => {
    if (
      realComponent &&
      (realComponent.tag === 'plain_text' || realComponent.tag === 'rich_text')
    ) {
      const boundVariableName = textComponentStateManager.getBoundVariableName(
        realComponent.id,
      );

      // 只在组件首次选中时设置模式，不要在变量绑定变化时重新设置
      if (!initializedComponents.has(realComponent.id)) {
        // 默认显示"指定"模式，除非当前组件有绑定变量且没有用户编辑的内容
        const userEditedContent =
          textComponentStateManager.getUserEditedContent(realComponent.id);
        const expectedMode =
          boundVariableName && !userEditedContent ? 'variable' : 'specify';
        setTextContentMode(expectedMode);

        // 标记该组件已初始化，避免后续重复设置
        setInitializedComponents((prev) => new Set(prev).add(realComponent.id));

        console.log('🔄 初始化文本内容模式 (首次选中组件):', {
          componentId: realComponent.id,
          componentTag: realComponent.tag,
          boundVariableName,
          userEditedContent: !!userEditedContent,
          expectedMode,
        });
      }

      // 如果当前组件有绑定变量，记住它（但不覆盖已有的记忆）
      if (boundVariableName && !lastBoundVariables[realComponent.id]) {
        setLastBoundVariables((prev) => ({
          ...prev,
          [realComponent.id]: boundVariableName,
        }));

        console.log('💾 记住现有变量绑定:', {
          componentId: realComponent.id,
          boundVariableName,
        });
      }
    }
  }, [realComponent]);

  // 图片组件模式同步 - 根据组件状态初始化模式
  useEffect(() => {
    if (realComponent && realComponent.tag === 'img') {
      // 检查是否有变量绑定
      const hasVariableBinding =
        realComponent.img_url && realComponent.img_url.includes('${');

      // 只在组件首次选中时设置模式，不要在变量绑定变化时重新设置
      if (!initializedImageComponents.has(realComponent.id)) {
        // 如果当前URL不是变量占位符，保存为用户编辑的URL
        if (realComponent.img_url && !hasVariableBinding) {
          imageComponentStateManager.setUserEditedUrl(
            realComponent.id,
            realComponent.img_url,
          );
        }

        // 默认显示"指定"模式，除非当前组件有绑定变量
        const expectedMode = hasVariableBinding ? 'variable' : 'specify';
        setImageContentMode(expectedMode);

        // 标记该组件已初始化，避免后续重复设置
        setInitializedImageComponents((prev) =>
          new Set(prev).add(realComponent.id),
        );

        console.log('🔄 初始化图片内容模式 (首次选中组件):', {
          componentId: realComponent.id,
          componentTag: realComponent.tag,
          hasVariableBinding,
          imgUrl: realComponent.img_url,
          expectedMode,
          savedUserUrl: !hasVariableBinding ? realComponent.img_url : undefined,
        });
      }

      // 如果当前组件有绑定变量，记住它（但不覆盖已有的记忆）
      if (hasVariableBinding && !lastBoundVariables[realComponent.id]) {
        const variableMatch = realComponent.img_url.match(/\$\{([^}]+)\}/);
        if (variableMatch && variableMatch[1]) {
          const variableName = variableMatch[1];
          setLastBoundVariables((prev) => ({
            ...prev,
            [realComponent.id]: variableName,
          }));

          // 同时设置到图片状态管理器中
          imageComponentStateManager.setBoundVariableName(
            realComponent.id,
            variableName,
          );

          console.log('💾 记住现有图片变量绑定:', {
            componentId: realComponent.id,
            variableName,
          });
        }
      }
    }
  }, [realComponent]);

  // 检查是否选中了卡片本身
  const isCardSelected =
    selectedPath &&
    selectedPath.length === 2 &&
    selectedPath[0] === 'dsl' &&
    selectedPath[1] === 'body';

  // 总是使用从cardData中获取的真实组件数据
  const currentComponent = realComponent;

  // 监听currentComponent变化，强制重新渲染
  useEffect(() => {
    if (currentComponent && currentComponent.tag === 'img') {
      forceUpdate((prev) => prev + 1);
    }
  }, [currentComponent?.id, (currentComponent as any)?.variable_name]);

  // 监听AddVariableModal相关状态变化
  useEffect(() => {
    if (isAddVariableModalVisible) {
      console.log('🔍 AddVariableModal 状态变化:', {
        isAddVariableModalVisible,
        isVariableModalFromVariablesTab,
        currentComponent: currentComponent?.tag,
        componentType: isVariableModalFromVariablesTab
          ? undefined
          : currentComponent?.tag,
      });
    }
  }, [
    isAddVariableModalVisible,
    isVariableModalFromVariablesTab,
    currentComponent,
  ]);

  // 检查是否为交互组件
  const isInteractiveComponent = useMemo(() => {
    if (!currentComponent) return false;
    const interactiveTypes = [
      'input',
      'button',
      'select-single',
      'select-multi',
    ];
    return interactiveTypes.includes(currentComponent.tag);
  }, [currentComponent]);

  // 获取组件的事件配置
  const getComponentEvents = () => {
    if (!currentComponent) return [];
    return (currentComponent as any).events || [];
  };

  // 更新组件事件
  const updateComponentEvents = (events: any[]) => {
    if (currentComponent) {
      const updated = { ...currentComponent, events };
      onUpdateComponent(updated);
    }
  };

  // 创建新事件
  const createNewEvent = () => {
    const newEvent = {
      id: `event_${Date.now()}`,
      type: 'click',
      actions: [],
    };
    const currentEvents = getComponentEvents();
    updateComponentEvents([...currentEvents, newEvent]);
  };

  // 添加动作到事件
  const addActionToEvent = (eventId: string) => {
    const newAction: EventAction = {
      id: `action_${Date.now()}`,
      type: 'callback',
      action: 'callback',
      paramType: 'string',
      paramValue: '',
      confirmDialog: false,
    };

    const currentEvents = getComponentEvents();
    const updatedEvents = currentEvents.map((event: any) => {
      if (event.id === eventId) {
        return {
          ...event,
          actions: [...(event.actions || []), newAction],
        };
      }
      return event;
    });
    updateComponentEvents(updatedEvents);
  };

  // 编辑动作
  const editAction = (eventId: string, actionIndex: number) => {
    const currentEvents = getComponentEvents();
    const event = currentEvents.find((e: any) => e.id === eventId);
    if (event && event.actions && event.actions[actionIndex]) {
      setCurrentEventAction(event.actions[actionIndex]);
      setEditingActionIndex(actionIndex);
      setIsEventEditModalVisible(true);
    }
  };

  // 删除动作
  const deleteAction = (eventId: string, actionIndex: number) => {
    const currentEvents = getComponentEvents();
    const updatedEvents = currentEvents.map((event: any) => {
      if (event.id === eventId) {
        const newActions = [...(event.actions || [])];
        newActions.splice(actionIndex, 1);
        return { ...event, actions: newActions };
      }
      return event;
    });
    updateComponentEvents(updatedEvents);
  };

  // 保存动作编辑
  const saveActionEdit = (updatedAction: EventAction) => {
    const currentEvents = getComponentEvents();
    const updatedEvents = currentEvents.map((event: any) => {
      if (event.actions && editingActionIndex >= 0) {
        const newActions = [...event.actions];
        newActions[editingActionIndex] = updatedAction;
        return { ...event, actions: newActions };
      }
      return event;
    });
    updateComponentEvents(updatedEvents);
    setIsEventEditModalVisible(false);
    setEditingActionIndex(-1);
  };

  const handleValueChange = (field: string, value: any) => {
    console.log('🔄 handleValueChange 被调用:', {
      field,
      value,
      currentComponent: currentComponent
        ? {
            id: currentComponent.id,
            tag: currentComponent.tag,
            img_url: (currentComponent as any).img_url,
            variable_name: (currentComponent as any).variable_name,
          }
        : null,
    });
    if (currentComponent) {
      // 检查是否是错误的表单组件选中（应该选中表单内的子组件）
      if (
        currentComponent.tag === 'form' &&
        selectedPath &&
        selectedPath.length >= 6
      ) {
        console.error('❌ 阻止对嵌套表单组件的属性修改:', {
          componentId: currentComponent.id,
          componentTag: currentComponent.tag,
          selectedPath,
          field,
          value,
        });
        console.log('💡 建议: 请重新选择正确的子组件，而非表单容器本身');
        return; // 阻止更新
      }
      // 样式相关字段需要保存到style对象中
      const styleFields = [
        'fontSize',
        'textAlign',
        'numberOfLines',
        'color', // ✅ 将text_color改为color
        'width',
        'height',
        'backgroundColor',
        'borderColor',
        'borderRadius',
        'padding',
        'margin',
        'type',
        'size',
        'crop_mode', // 图片裁剪方式放在style中
      ];
      if (styleFields.includes(field)) {
        const updatedComponent = {
          ...currentComponent,
          style: {
            ...((currentComponent as any).style || {}),
            [field]: value,
          },
        };
        // console.log('📝 更新组件样式属性:', {
        //   componentId: (updatedComponent as any).id,
        //   field,
        //   value,
        //   newStyle: (updatedComponent as any).style,
        //   realPath,
        // });
        onUpdateComponent(updatedComponent);
      } else {
        // 特殊处理img_url字段，同时更新i18n_img_url
        if (field === 'img_url') {
          const updatedComponent = {
            ...currentComponent,
            [field]: value,
            i18n_img_url: {
              'en-US': value,
            },
          };
          console.log('📝 更新组件属性 (img_url):', {
            componentId: (updatedComponent as any).id,
            field,
            value,
            realPath,
          });
          onUpdateComponent(updatedComponent);
        }
        // 特殊处理variable_name字段，当绑定变量时更新图片URL和DSL结构
        else if (field === 'variable_name' && currentComponent.tag === 'img') {
          console.log('🎯 检测到图片组件变量绑定操作:', {
            field,
            value,
            componentId: currentComponent.id,
            componentTag: currentComponent.tag,
            currentImgUrl: currentComponent.img_url,
          });
          if (value) {
            // 选择了变量，需要获取变量中的图片URL并更新组件
            const selectedVariable = variables.find((v) => {
              if (typeof v === 'object' && v !== null) {
                const keys = getVariableKeys(v);
                return keys.length > 0 && keys[0] === value;
              }
              return false;
            });

            if (selectedVariable) {
              const variableValue = (selectedVariable as Record<string, any>)[
                value
              ];
              let imageUrl = '';

              // 解析变量值获取图片URL
              if (typeof variableValue === 'string') {
                // 新的字符串格式图片变量
                imageUrl = variableValue;
              } else if (
                typeof variableValue === 'object' &&
                variableValue !== null
              ) {
                if (variableValue.img_url) {
                  imageUrl = variableValue.img_url;
                } else if (
                  Array.isArray(variableValue) &&
                  variableValue.length > 0 &&
                  variableValue[0].img_url
                ) {
                  imageUrl = variableValue[0].img_url; // 取数组第一个图片
                }
              }

              // 更新组件：设置img_url为变量占位符，删除不需要的字段
              const updatedComponent = {
                ...currentComponent,
                img_url: `\${${value}}`, // DSL数据中使用变量占位符格式
                i18n_img_url: {
                  'en-US': `\${${value}}`,
                },
              };

              // 明确删除不需要的字段
              delete (updatedComponent as any).original_img_url;
              delete (updatedComponent as any).variable_name;

              console.log('📝 更新图片组件变量绑定:', {
                componentId: (updatedComponent as any).id,
                selectedVariable: value,
                imageUrl,
                variableValue,
                originalImgUrl: currentComponent.img_url,
                newImgUrl: (updatedComponent as any).img_url,
                variableName: (updatedComponent as any).variable_name,
                updatedComponent,
              });

              console.log(
                '🔄 调用onUpdateComponent，更新前组件:',
                currentComponent,
              );
              console.log(
                '🔄 调用onUpdateComponent，更新后组件:',
                updatedComponent,
              );
              onUpdateComponent(updatedComponent);
              console.log('✅ onUpdateComponent调用完成');
            }
          } else {
            // 清除变量绑定，恢复为普通图片组件
            const updatedComponent = {
              ...currentComponent,
              img_url: '/demo.png', // 恢复默认图片
              i18n_img_url: {
                'en-US': '/demo.png',
              },
            };

            // 删除变量相关属性
            delete (updatedComponent as any).variable_name;
            delete (updatedComponent as any).original_img_url;

            console.log('📝 清除图片组件变量绑定:', {
              componentId: (updatedComponent as any).id,
              updatedComponent,
            });

            onUpdateComponent(updatedComponent);
          }
        } else {
          const updatedComponent = {
            ...currentComponent,
            [field]: value,
          };
          console.log('📝 更新组件属性:', {
            componentId: (updatedComponent as any).id,
            field,
            value,
            realPath,
            updatedComponent: updatedComponent,
          });
          onUpdateComponent(updatedComponent);
        }
      }
    } else {
      console.warn('⚠️ 无法更新组件，currentComponent为空:', {
        selectedPath,
        realPath,
        cardDataExists: !!cardData,
      });
    }
  };

  // 新增：处理CardHeader更新
  const handleHeaderChange = (field: string, value: any) => {
    if (!cardData) return;

    // 确保header存在
    const currentHeader = cardData.dsl?.header || {};

    const updatedCardData = {
      ...cardData,
      dsl: {
        ...cardData.dsl,
        header: {
          ...currentHeader,
          [field]: value,
        },
      },
    };
    onUpdateCard({ cardData: updatedCardData });
  };

  // 新增：处理CardHeader嵌套字段更新
  const handleHeaderNestedChange = (
    parentField: string,
    field: string,
    value: any,
  ) => {
    if (!cardData) return;

    // console.log('🎯 处理标题嵌套字段更新:', {
    //   parentField,
    //   field,
    //   value,
    //   currentHeader: cardData.dsl?.header,
    //   currentParentField: cardData.dsl?.header?.[parentField],
    // });

    // 确保header存在
    const currentHeader = cardData.dsl?.header || {};
    const currentParentField = (currentHeader as any)[parentField] || {};

    const updatedCardData = {
      ...cardData,
      dsl: {
        ...cardData.dsl,
        header: {
          ...currentHeader,
          [parentField]: {
            ...currentParentField,
            [field]: value,
          },
        },
      },
    };

    // console.log('💾 更新标题数据:', {
    //   newHeader: updatedCardData.dsl.header,
    //   titleContent: (updatedCardData.dsl.header as any)?.title?.content,
    //   subtitleContent: (updatedCardData.dsl.header as any)?.subtitle?.content,
    //   style: (updatedCardData.dsl.header as any)?.style,
    // });

    onUpdateCard({ cardData: updatedCardData });
  };

  // 处理添加变量（来自变量Tab）
  const handleAddVariable = () => {
    console.log('🔧 变量Tab: 点击添加自定义变量按钮');
    setEditingVariable(null); // 清空编辑状态
    setIsVariableModalFromVariablesTab(true); // 设置标识：来自变量Tab
    setIsAddVariableModalVisible(true);
    console.log('✅ 变量Tab: 设置标志完成', {
      isVariableModalFromVariablesTab: true,
      isAddVariableModalVisible: true,
    });
  };

  // 处理从组件属性添加变量（保持组件类型过滤）
  const handleAddVariableFromComponent = (componentType?: string) => {
    console.log('🔧 组件属性: 点击添加变量按钮', {
      componentType,
      currentComponentType: currentComponent?.tag,
    });
    setEditingVariable(null); // 清空编辑状态
    setIsVariableModalFromVariablesTab(false); // 设置标识：来自组件属性
    setIsAddVariableModalVisible(true);

    // 如果指定了组件类型，临时设置以影响AddVariableModal的类型过滤
    if (componentType) {
      // 可以通过state或其他方式传递组件类型给AddVariableModal
      console.log('🎯 指定组件类型用于变量创建:', componentType);
    }

    console.log('✅ 组件属性: 设置标志完成', {
      isVariableModalFromVariablesTab: false,
      isAddVariableModalVisible: true,
      currentComponentType: currentComponent?.tag,
      specifiedComponentType: componentType,
    });
  };

  // 处理编辑变量
  const handleEditVariable = (variable: Variable) => {
    setEditingVariable(variable);
    setIsAddVariableModalVisible(true);
  };

  // 根据变量名称查找变量在数组中的索引
  const findVariableIndexByName = (variableName: string): number => {
    return variables.findIndex((v) => {
      if (typeof v === 'object' && v !== null) {
        const keys = getVariableKeys(v);
        return keys.length > 0 && keys[0] === variableName;
      }
      return false;
    });
  };

  // 获取变量的原始类型
  const getVariableOriginalType = (
    variable: any,
    variableName: string,
  ): string | null => {
    const originalTypeKey = `__${variableName}_originalType`;
    return (variable as any)[originalTypeKey] || null;
  };

  // 检查变量是否在DSL数据中被使用
  const isVariableInUse = (variableName: string): boolean => {
    if (!cardData?.dsl?.body?.elements) {
      return false;
    }

    // 将DSL数据转换为JSON字符串进行搜索
    const dslJson = JSON.stringify(cardData.dsl.body.elements);

    // 检查变量占位符是否存在于DSL中
    const variablePlaceholder = `\${${variableName}}`;

    console.log('🔍 检查变量是否被使用:', {
      variableName,
      variablePlaceholder,
      isInUse: dslJson.includes(variablePlaceholder),
      dslElementsCount: cardData.dsl.body.elements.length,
    });

    return dslJson.includes(variablePlaceholder);
  };

  // 获取变量显示名称
  const getVariableDisplayName = (variable: VariableItem): string => {
    if (typeof variable === 'object' && variable !== null) {
      const keys = getVariableKeys(variable);
      if (keys.length > 0) {
        const variableName = keys[0];
        return variableName;
      }
    }
    return '未知变量';
  };

  // 根据组件类型过滤变量 - 统一使用 originalType 匹配
  const getFilteredVariables = (componentType: string) => {
    return variables.filter((variable) => {
      if (typeof variable === 'object' && variable !== null) {
        const keys = getVariableKeys(variable);
        if (keys.length > 0) {
          const variableName = keys[0];
          const originalType = getVariableOriginalType(variable, variableName);

          // 统一的类型匹配逻辑
          switch (componentType) {
            case 'plain_text':
              return originalType === 'text';

            case 'rich_text':
              return originalType === 'richtext';

            case 'img':
              return originalType === 'image';

            case 'img_combination':
              return originalType === 'imageArray';

            case 'input':
              return originalType === 'text' || originalType === 'number';

            case 'select_static':
            case 'multi_select_static':
              return originalType === 'array';

            case 'button':
              return originalType === 'text';

            default:
              return false; // 严格模式：未定义的组件类型不显示任何变量
          }
        }
      }
      return false;
    });
  };

  // 处理删除变量
  const handleDeleteVariable = (index: number) => {
    const newVariables = variables.filter((_, i) => i !== index);
    onUpdateVariables(newVariables);
  };

  // 处理从弹窗添加/编辑变量
  const handleAddVariableFromModal = (variable: Variable) => {
    console.warn('🔍 接收到的变量数据:', {
      variable,
      name: variable.name,
      type: variable.type,
      originalType: variable.originalType,
      value: variable.value,
      valueType: typeof variable.value,
    });
    // 解析模拟数据值
    let parsedValue: any;
    try {
      // 尝试解析JSON格式的数据
      if (
        variable.type === 'object' ||
        variable.value.startsWith('{') ||
        variable.value.startsWith('[')
      ) {
        parsedValue = JSON.parse(variable.value);
      } else if (variable.type === 'number') {
        // 对于数字类型，转换为数字
        parsedValue = Number(variable.value);
        if (isNaN(parsedValue)) {
          parsedValue = variable.value; // 如果转换失败，保持原值
        }
      } else {
        // 对于文本和其他类型，直接使用字符串值
        parsedValue = variable.value;
      }
    } catch (error) {
      // 如果解析失败，使用原始字符串值
      parsedValue = variable.value;
    }

    // 创建{变量名:模拟数据值}格式的对象，同时保留originalType信息用于显示
    const variableObject = {
      [variable.name]: parsedValue,
      // 如果有originalType，保存在特殊的属性中
      ...(variable.originalType && {
        [`__${variable.name}_originalType`]: variable.originalType,
      }),
    };

    console.log('💾 保存变量对象:', {
      variableObject,
      originalType: variable.originalType,
      parsedValue,
      parsedValueType: typeof parsedValue,
    });

    if (editingVariable) {
      // 编辑模式：检查变量名称是否发生变化
      const oldVariableName = editingVariable.name;
      const newVariableName = variable.name;

      if (oldVariableName === newVariableName) {
        // 变量名称没有变化，直接更新
        const variableIndex = findVariableIndexByName(oldVariableName);
        if (variableIndex !== -1) {
          const newVariables = [...variables];
          newVariables[variableIndex] = variableObject;
          onUpdateVariables(newVariables);
        }
      } else {
        // 变量名称发生变化，删除旧变量并添加新变量
        const newVariables = variables.filter((v) => {
          if (typeof v === 'object' && v !== null) {
            const keys = getVariableKeys(v);
            return keys.length > 0 && keys[0] !== oldVariableName;
          }
          return true;
        });
        newVariables.push(variableObject);
        onUpdateVariables(newVariables);
      }
    } else {
      // 新增模式：添加新变量
      const newVariables = [...variables, variableObject];
      onUpdateVariables(newVariables);
    }
    setIsAddVariableModalVisible(false);
    setEditingVariable(null);
    setIsVariableModalFromVariablesTab(false); // 重置标识
  };

  // 处理取消添加变量
  const handleCancelAddVariableModal = () => {
    setIsAddVariableModalVisible(false);
    setEditingVariable(null);
    setIsVariableModalFromVariablesTab(false); // 重置标识
  };

  // 将VariableItem[]转换为Variable[]用于EventEditModal
  const convertToVariableArray = (
    variableItems: VariableItem[],
  ): Variable[] => {
    return variableItems.map((item) => {
      if (typeof item === 'object' && item !== null) {
        // 新的格式：{变量名: 模拟数据值}
        const keys = Object.keys(item as VariableObject);
        if (keys.length > 0) {
          const variableName = keys[0];
          const variableValue = (item as VariableObject)[variableName];

          // 推断类型
          let variableType: 'text' | 'number' | 'boolean' | 'object';
          if (typeof variableValue === 'string') {
            variableType = 'text';
          } else if (typeof variableValue === 'number') {
            variableType = 'number';
          } else if (typeof variableValue === 'boolean') {
            variableType = 'boolean';
          } else {
            variableType = 'object';
          }

          return {
            name: variableName,
            value:
              typeof variableValue === 'object'
                ? JSON.stringify(variableValue)
                : String(variableValue),
            type: variableType,
          };
        }
      }

      // 兼容旧的Variable格式
      return item as Variable;
    });
  };

  // 获取类型标签
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'text':
        return '文本';
      case 'number':
        return '整数';
      case 'image':
        return '图片';
      case 'array':
        return '选项数组';
      case 'imageArray':
        return '图片数组';
      case 'richtext':
        return '富文本';
      case 'boolean':
        return '布尔';
      case 'object':
        // 尝试判断是图片还是数组
        return '对象';
      default:
        return type;
    }
  };

  // 映射Variable类型到AddVariableModal的初始类型
  const mapVariableTypeToInitialType = (
    type: string,
    originalType?: string,
  ): 'text' | 'number' | 'image' | 'array' | 'imageArray' | 'richtext' => {
    // 优先使用原始类型信息
    if (
      originalType &&
      ['text', 'number', 'image', 'array', 'imageArray', 'richtext'].includes(
        originalType,
      )
    ) {
      return originalType as
        | 'text'
        | 'number'
        | 'image'
        | 'array'
        | 'imageArray'
        | 'richtext';
    }

    switch (type) {
      case 'text':
        return 'text';
      case 'number':
        return 'number';
      case 'object':
        return 'array'; // 默认映射为array
      default:
        return 'text';
    }
  };

  const renderProperties = () => {
    // 如果选中了卡片本身，显示提示信息
    if (isCardSelected) {
      return (
        <div>
          {/* 布局方式设置 */}
          <Card
            title="📐 布局方式"
            size="small"
            style={{ marginBottom: '12px' }}
          >
            <Form layout="vertical" size="small">
              <Form.Item
                label="布局模式"
                help="选择卡片的布局方式，影响组件的排列方式"
              >
                <Select
                  value={cardData?.dsl?.body?.direction || 'vertical'}
                  onChange={(value) => onUpdateCard({ direction: value })}
                  disabled={true} // 选中卡片时禁用布局模式
                  style={{ width: '100%' }}
                >
                  <Option value="vertical">
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <div
                        style={{
                          width: '16px',
                          height: '16px',
                          backgroundColor: '#1890ff',
                          borderRadius: '2px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          padding: '2px',
                        }}
                      >
                        <div
                          style={{
                            width: '100%',
                            height: '2px',
                            backgroundColor: 'white',
                          }}
                        ></div>
                        <div
                          style={{
                            width: '100%',
                            height: '2px',
                            backgroundColor: 'white',
                          }}
                        ></div>
                        <div
                          style={{
                            width: '100%',
                            height: '2px',
                            backgroundColor: 'white',
                          }}
                        ></div>
                      </div>
                      <span>垂直布局</span>
                    </div>
                  </Option>
                  <Option value="flow">
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <div
                        style={{
                          width: '16px',
                          height: '16px',
                          backgroundColor: '#52c41a',
                          borderRadius: '2px',
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '1px',
                          padding: '1px',
                        }}
                      >
                        <div
                          style={{
                            width: '6px',
                            height: '6px',
                            backgroundColor: 'white',
                          }}
                        ></div>
                        <div
                          style={{
                            width: '6px',
                            height: '6px',
                            backgroundColor: 'white',
                          }}
                        ></div>
                        <div
                          style={{
                            width: '6px',
                            height: '6px',
                            backgroundColor: 'white',
                          }}
                        ></div>
                        <div
                          style={{
                            width: '6px',
                            height: '6px',
                            backgroundColor: 'white',
                          }}
                        ></div>
                      </div>
                      <span>流式布局</span>
                    </div>
                  </Option>
                </Select>
              </Form.Item>

              {/* 布局预览 */}
              <Form.Item label="布局预览">
                <div
                  style={{
                    padding: '12px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '6px',
                    border: '1px solid #d9d9d9',
                  }}
                >
                  {(cardData?.dsl?.body?.direction || 'vertical') ===
                  'vertical' ? (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                        minHeight: '60px',
                      }}
                    >
                      <div
                        style={{
                          height: '12px',
                          backgroundColor: '#1890ff',
                          borderRadius: '2px',
                          opacity: 0.7,
                        }}
                      ></div>
                      <div
                        style={{
                          height: '12px',
                          backgroundColor: '#1890ff',
                          borderRadius: '2px',
                          opacity: 0.7,
                        }}
                      ></div>
                      <div
                        style={{
                          height: '12px',
                          backgroundColor: '#1890ff',
                          borderRadius: '2px',
                          opacity: 0.7,
                        }}
                      ></div>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '4px',
                        minHeight: '60px',
                      }}
                    >
                      <div
                        style={{
                          width: '30px',
                          height: '20px',
                          backgroundColor: '#52c41a',
                          borderRadius: '2px',
                          opacity: 0.7,
                        }}
                      ></div>
                      <div
                        style={{
                          width: '40px',
                          height: '20px',
                          backgroundColor: '#52c41a',
                          borderRadius: '2px',
                          opacity: 0.7,
                        }}
                      ></div>
                      <div
                        style={{
                          width: '25px',
                          height: '20px',
                          backgroundColor: '#52c41a',
                          borderRadius: '2px',
                          opacity: 0.7,
                        }}
                      ></div>
                      <div
                        style={{
                          width: '35px',
                          height: '20px',
                          backgroundColor: '#52c41a',
                          borderRadius: '2px',
                          opacity: 0.7,
                        }}
                      ></div>
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          backgroundColor: '#52c41a',
                          borderRadius: '2px',
                          opacity: 0.7,
                        }}
                      ></div>
                      <div
                        style={{
                          width: '45px',
                          height: '20px',
                          backgroundColor: '#52c41a',
                          borderRadius: '2px',
                          opacity: 0.7,
                        }}
                      ></div>
                    </div>
                  )}
                </div>
              </Form.Item>
            </Form>
          </Card>

          {/* 间距设置 */}
          <Card
            title="📏 间距设置"
            size="small"
            style={{ marginBottom: '12px' }}
          >
            <Form layout="vertical" size="small">
              <Form.Item label="垂直间距" help="组件之间的垂直间距，可调整">
                <InputNumber
                  value={
                    cardVerticalSpacing !== undefined ? cardVerticalSpacing : 8
                  }
                  onChange={(value) => {
                    onUpdateCard({ vertical_spacing: value });
                  }}
                  min={0}
                  max={50}
                  style={{ width: '100%' }}
                  addonAfter="px"
                  placeholder="设置间距"
                />
              </Form.Item>
            </Form>
          </Card>
        </div>
      );
    }

    // 检查是否选中了标题组件（标题组件存储在headerData中）
    const isTitleSelected =
      selectedPath &&
      selectedPath.length === 2 &&
      selectedPath[0] === 'dsl' &&
      selectedPath[1] === 'header';

    // 如果选中了标题组件，显示标题编辑界面
    if (isTitleSelected) {
      return (
        <div>
          <div
            style={{
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: '#f6ffed',
              border: '1px solid #b7eb8f',
              borderRadius: '6px',
            }}
          >
            <Text style={{ fontSize: '12px', color: '#389e0d' }}>
              🎯 当前选中：标题组件
            </Text>
          </div>
          {/* 内容设置 */}
          <div
            style={{
              marginBottom: '16px',
              background: '#fff',
              borderRadius: 6,
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              padding: 16,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 15 }}>
              📝 内容设置
            </div>
            <Form form={form} layout="vertical">
              <Form.Item label="主标题">
                <Input
                  value={headerData?.title?.content || ''}
                  onChange={(e) =>
                    handleHeaderNestedChange('title', 'content', e.target.value)
                  }
                  placeholder="请输入主标题"
                />
              </Form.Item>
              <Form.Item label="副标题">
                <Input
                  value={headerData?.subtitle?.content || ''}
                  onChange={(e) =>
                    handleHeaderNestedChange(
                      'subtitle',
                      'content',
                      e.target.value,
                    )
                  }
                  placeholder="请输入副标题"
                />
              </Form.Item>
            </Form>
          </div>
          {/* 样式设置 */}
          <div
            style={{
              background: '#fff',
              borderRadius: 6,
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              padding: 16,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 15 }}>
              🎨 样式设置
            </div>
            <Form form={form} layout="vertical">
              <Form.Item label="主题样式">
                <Select
                  value={headerData?.style || 'blue'}
                  onChange={(value) => handleHeaderChange('style', value)}
                  style={{ width: '100%' }}
                  optionLabelProp="label"
                >
                  <Option value="blue" label="blue">
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            backgroundColor: '#1890ff',
                            borderRadius: '3px',
                            marginRight: '8px',
                            border: '1px solid #d9d9d9',
                          }}
                        ></div>
                        <span>blue</span>
                      </div>
                      {headerData?.style === 'blue' && (
                        <span style={{ color: '#52c41a' }}>✅</span>
                      )}
                    </div>
                  </Option>
                  <Option value="wathet" label="wathet">
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            backgroundColor: '#0369a1',
                            borderRadius: '3px',
                            marginRight: '8px',
                            border: '1px solid #d9d9d9',
                          }}
                        ></div>
                        <span>wathet</span>
                      </div>
                      {headerData?.style === 'wathet' && (
                        <span style={{ color: '#52c41a' }}>✅</span>
                      )}
                    </div>
                  </Option>
                  <Option value="turquoise" label="turquoise">
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            backgroundColor: '#14b8a6',
                            borderRadius: '3px',
                            marginRight: '8px',
                            border: '1px solid #d9d9d9',
                          }}
                        ></div>
                        <span>turquoise</span>
                      </div>
                      {headerData?.style === 'turquoise' && (
                        <span style={{ color: '#52c41a' }}>✅</span>
                      )}
                    </div>
                  </Option>
                  <Option value="green" label="green">
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            backgroundColor: '#22c55e',
                            borderRadius: '3px',
                            marginRight: '8px',
                            border: '1px solid #d9d9d9',
                          }}
                        ></div>
                        <span>green</span>
                      </div>
                      {headerData?.style === 'green' && (
                        <span style={{ color: '#52c41a' }}>✅</span>
                      )}
                    </div>
                  </Option>
                  <Option value="yellow" label="yellow">
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            backgroundColor: '#eab308',
                            borderRadius: '3px',
                            marginRight: '8px',
                            border: '1px solid #d9d9d9',
                          }}
                        ></div>
                        <span>yellow</span>
                      </div>
                      {headerData?.style === 'yellow' && (
                        <span style={{ color: '#52c41a' }}>✅</span>
                      )}
                    </div>
                  </Option>
                  <Option value="orange" label="orange">
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            backgroundColor: '#f97316',
                            borderRadius: '3px',
                            marginRight: '8px',
                            border: '1px solid #d9d9d9',
                          }}
                        ></div>
                        <span>orange</span>
                      </div>
                      {headerData?.style === 'orange' && (
                        <span style={{ color: '#52c41a' }}>✅</span>
                      )}
                    </div>
                  </Option>
                  <Option value="red" label="red">
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            backgroundColor: '#ef4444',
                            borderRadius: '3px',
                            marginRight: '8px',
                            border: '1px solid #d9d9d9',
                          }}
                        ></div>
                        <span>red</span>
                      </div>
                      {headerData?.style === 'red' && (
                        <span style={{ color: '#52c41a' }}>✅</span>
                      )}
                    </div>
                  </Option>
                </Select>
              </Form.Item>
            </Form>
          </div>
        </div>
      );
    }

    // 检查是否选中了文本组件 - 使用currentComponent而不是selectedComponent
    const isTextComponent =
      currentComponent &&
      (currentComponent.tag === 'plain_text' ||
        currentComponent.tag === 'rich_text');

    // 检查是否选中了输入框组件 - 使用currentComponent而不是selectedComponent
    const isInputComponent =
      currentComponent && currentComponent.tag === 'input';

    // 检查是否选中了分割线组件 - 使用currentComponent而不是selectedComponent
    const isHrComponent = currentComponent && currentComponent.tag === 'hr';

    // 检查是否选中了多图混排组件 - 使用currentComponent而不是selectedComponent
    const isImgCombinationComponent =
      currentComponent && currentComponent.tag === 'img_combination';

    // 检查是否选中了分栏组件 - 使用currentComponent而不是selectedComponent
    const isColumnSetComponent =
      currentComponent && currentComponent.tag === 'column_set';

    // 检查是否选中了按钮组件 - 使用currentComponent而不是selectedComponent
    const isButtonComponent =
      currentComponent && currentComponent.tag === 'button';

    // 如果选中了按钮组件，显示按钮编辑界面
    if (isButtonComponent) {
      return (
        <div>
          <div
            style={{
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '6px',
            }}
          >
            <Text style={{ fontSize: '12px', color: '#0369a1' }}>
              🎯 当前选中：按钮组件
            </Text>
          </div>
          {/* 内容设置 */}
          <div
            style={{
              marginBottom: '16px',
              background: '#fff',
              borderRadius: 6,
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              padding: 16,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 15 }}>
              📝 内容设置
            </div>
            <Form form={form} layout="vertical">
              <Form.Item
                label="按钮文案"
                help="设置按钮显示的文本内容，最多8个字符"
              >
                <Input
                  value={(currentComponent as any).text?.content || '按钮'}
                  onChange={(e) => {
                    const newText = {
                      content: e.target.value,
                      i18n_content: {
                        'en-US': e.target.value || 'Button',
                      },
                    };
                    handleValueChange('text', newText);
                  }}
                  placeholder="请输入按钮文案"
                  maxLength={8}
                  showCount
                />
              </Form.Item>
            </Form>
          </div>
          {/* 样式设置 */}
          <div
            style={{
              background: '#fff',
              borderRadius: 6,
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              padding: 16,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 15 }}>
              🎨 样式设置
            </div>
            <Form form={form} layout="vertical">
              <Form.Item label="按钮颜色" help="选择按钮的颜色主题">
                <Select
                  value={(currentComponent as any).style?.color || '#1890ff'}
                  onChange={(value) => {
                    // 更新按钮样式
                    const updatedComponent = {
                      ...currentComponent,
                      style: {
                        ...((currentComponent as any).style || {}),
                        color: value,
                      },
                    };
                    onUpdateComponent(updatedComponent);
                  }}
                  placeholder="请选择按钮颜色"
                >
                  <Option value="#000000" label="black">
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            backgroundColor: '#1f2329',
                            borderRadius: '3px',
                            marginRight: '8px',
                            border: '1px solid #d9d9d9',
                          }}
                        ></div>
                        <span>黑色</span>
                      </div>
                      {(currentComponent as any).style?.color === '#000000' && (
                        <span style={{ color: '#52c41a' }}>✅</span>
                      )}
                    </div>
                  </Option>
                  <Option value="#1890ff" label="blue">
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            backgroundColor: '#1890ff',
                            borderRadius: '3px',
                            marginRight: '8px',
                            border: '1px solid #d9d9d9',
                          }}
                        ></div>
                        <span>蓝色</span>
                      </div>
                      {(currentComponent as any).style?.color === '#1890ff' && (
                        <span style={{ color: '#52c41a' }}>✅</span>
                      )}
                    </div>
                  </Option>
                  <Option value="#ff4d4f" label="red">
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            backgroundColor: '#ff4d4f',
                            borderRadius: '3px',
                            marginRight: '8px',
                            border: '1px solid #d9d9d9',
                          }}
                        ></div>
                        <span>红色</span>
                      </div>
                      {(currentComponent as any).style?.color === '#ff4d4f' && (
                        <span style={{ color: '#52c41a' }}>✅</span>
                      )}
                    </div>
                  </Option>
                </Select>
              </Form.Item>
            </Form>
          </div>
        </div>
      );
    }

    // 新增：如果选中了下拉单选组件，显示下拉单选属性面板
    const isSelectSingleComponent =
      currentComponent && (currentComponent as any).tag === 'select-single';
    if (isSelectSingleComponent) {
      const options = (currentComponent as any).options || [];
      return (
        <div>
          <div
            style={{
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: '#f6ffed',
              border: '1px solid #b7eb8f',
              borderRadius: '6px',
            }}
          >
            <Text style={{ fontSize: '12px', color: '#52c41a' }}>
              🎯 当前选中：下拉单选组件
            </Text>
          </div>
          <div
            style={{
              background: '#fff',
              borderRadius: 6,
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              padding: 16,
            }}
          >
            <Form form={form} layout="vertical">
              <Form.Item label="选项">
                {options.map((opt: any, idx: number) => (
                  <div
                    key={idx}
                    style={{ display: 'flex', gap: 8, marginBottom: 8 }}
                  >
                    <Input
                      value={opt.label}
                      onChange={(e) => {
                        const newOptions = [...options];
                        newOptions[idx].label = e.target.value;
                        handleValueChange('options', newOptions);
                      }}
                      placeholder="选项名称"
                      style={{ flex: 1 }}
                    />
                    <Button
                      danger
                      size="small"
                      onClick={() => {
                        const newOptions = options.filter(
                          (_: any, i: number) => i !== idx,
                        );
                        handleValueChange('options', newOptions);
                      }}
                    >
                      删除
                    </Button>
                  </div>
                ))}
                <Button
                  type="dashed"
                  block
                  onClick={() => {
                    handleValueChange('options', [
                      ...options,
                      { label: '', value: '' },
                    ]);
                  }}
                >
                  添加选项
                </Button>
              </Form.Item>
              <Form.Item label="默认值">
                <Select
                  value={(currentComponent as any).default_value}
                  onChange={(val) => handleValueChange('default_value', val)}
                  style={{ width: '100%' }}
                >
                  {options.map((opt: any, idx: number) => (
                    <Option key={idx} value={opt.value || opt.label}>
                      {opt.label || `选项${idx + 1}`}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item label="是否必填">
                <Switch
                  checked={(currentComponent as any).required || false}
                  onChange={(checked) => handleValueChange('required', checked)}
                />
              </Form.Item>
            </Form>
          </div>
        </div>
      );
    }

    // 如果选中了分栏组件，显示分栏编辑界面
    if (isColumnSetComponent) {
      const columnSetComp = currentComponent as any;
      const columns = columnSetComp.columns || [];

      // 列数选项生成函数
      const generateColumnOptions = () => {
        return Array.from({ length: 6 }, (_, i) => ({
          value: i + 1,
          label: `${i + 1}列`,
        }));
      };

      // 更新列数的函数
      const handleColumnCountChange = (count: number) => {
        const newColumns = [...columns];

        if (count > columns.length) {
          // 增加列
          for (let i = columns.length; i < count; i++) {
            newColumns.push({
              tag: 'column',
              elements: [],
              flex: 1, // 默认flex为1
            });
          }
        } else if (count < columns.length) {
          // 减少列
          newColumns.splice(count);
        }

        const updatedComponent = {
          ...currentComponent,
          columns: newColumns,
        };
        onUpdateComponent(updatedComponent);
      };

      // 检查列中是否包含取消按钮
      const hasCancelButton = (column: any): boolean => {
        if (!column.elements || !Array.isArray(column.elements)) {
          return false;
        }
        return column.elements.some(
          (element: any) =>
            element.tag === 'button' && element.form_action_type === 'reset',
        );
      };

      // 删除单个列的函数
      const handleDeleteColumn = (columnIndex: number) => {
        const targetColumn = columns[columnIndex];

        // 检查列中是否包含取消按钮
        if (hasCancelButton(targetColumn)) {
          console.log('⚠️ 该列包含取消按钮，不能删除');
          return;
        }

        const newColumns = [...columns];
        newColumns.splice(columnIndex, 1);

        // 如果删除后没有列了，删除整个分栏容器
        if (newColumns.length === 0) {
          // 这里需要通知父组件删除整个分栏容器
          console.log('🗑️ 删除最后一个列，需要删除整个分栏容器');
          return;
        }

        // 重新计算剩余列的宽度，保持总宽度不变
        const totalFlex = newColumns.reduce(
          (sum: number, col: any) => sum + (col.flex || 1),
          0,
        );

        // 如果总宽度为0，给所有列设置默认flex为1
        if (totalFlex === 0) {
          newColumns.forEach((col: any) => {
            col.flex = 1;
          });
        }

        const updatedComponent = {
          ...currentComponent,
          columns: newColumns,
        };
        onUpdateComponent(updatedComponent);
      };

      // 更新单个列宽的函数
      const handleColumnWidthChange = (columnIndex: number, flex: number) => {
        const newColumns = columns.map((col: any, index: number) => {
          if (index === columnIndex) {
            return { ...col, flex };
          }
          return col;
        });

        const updatedComponent = {
          ...currentComponent,
          columns: newColumns,
        };
        onUpdateComponent(updatedComponent);
      };

      // 计算列宽百分比
      const calculateColumnWidths = () => {
        const totalWidth = columns.reduce(
          (sum: number, col: any) => sum + (col.flex || 1),
          0,
        );
        return columns.map((col: any) => {
          const flex = col.flex || 1;
          return Math.round((flex / totalWidth) * 100);
        });
      };

      const columnWidths = calculateColumnWidths();

      return (
        <div style={{ padding: '16px' }}>
          <div
            style={{
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: '#f6ffed',
              border: '1px solid #b7eb8f',
              borderRadius: '6px',
            }}
          >
            <Text style={{ fontSize: '12px', color: '#52c41a' }}>
              📐 当前选中：分栏组件 ({columns.length}列)
            </Text>
          </div>
          {/* 基础设置 */}
          <div
            style={{
              marginBottom: '16px',
              background: '#fff',
              borderRadius: 6,
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              padding: 16,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 15 }}>
              🔧 基础设置
            </div>
            <Form form={form} layout="vertical">
              <Form.Item label="列数">
                <Select
                  value={columns.length}
                  onChange={handleColumnCountChange}
                  style={{ width: '100%' }}
                  options={generateColumnOptions()}
                />
              </Form.Item>
            </Form>
          </div>
          {/* 列宽设置 */}
          <div
            style={{
              background: '#fff',
              borderRadius: 6,
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              padding: 16,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 15 }}>
              📏 列宽设置
            </div>
            <div>
              <div style={{ marginBottom: '12px' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  调整各列宽度比例，总宽度按比例分配
                </Text>
              </div>
              {columns.map((column: any, index: number) => (
                <div key={index} style={{ marginBottom: '12px' }}>
                  <Form.Item
                    label={`第${index + 1}列宽度 (${columnWidths[index]}%)`}
                    style={{ marginBottom: '8px' }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <InputNumber
                        value={column.flex || 1}
                        onChange={(value) =>
                          handleColumnWidthChange(index, value || 1)
                        }
                        min={1}
                        max={5}
                        step={1}
                        style={{ width: '80px' }}
                      />
                      <div
                        style={{
                          flex: 1,
                          height: '8px',
                          backgroundColor: '#f0f0f0',
                          borderRadius: '4px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            backgroundColor: '#1890ff',
                            width: `${columnWidths[index]}%`,
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                      <Text
                        style={{
                          fontSize: '12px',
                          color: '#666',
                          minWidth: '35px',
                        }}
                      >
                        {columnWidths[index]}%
                      </Text>
                      {/* 删除列按钮 - 包含取消按钮的列不显示删除按钮 */}
                      {!hasCancelButton(column) && (
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleDeleteColumn(index)}
                          style={{
                            padding: '4px 8px',
                            height: '24px',
                            fontSize: '12px',
                          }}
                          title="删除此列"
                        />
                      )}
                      {/* 包含取消按钮的列的保护标识 */}
                      {hasCancelButton(column) && (
                        <div
                          style={{
                            padding: '4px 8px',
                            height: '24px',
                            fontSize: '12px',
                            color: '#52c41a',
                            backgroundColor: '#f6ffed',
                            border: '1px solid #b7eb8f',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          保护
                        </div>
                      )}
                    </div>
                  </Form.Item>
                </div>
              ))}
              <div
                style={{
                  marginTop: '16px',
                  padding: '8px',
                  backgroundColor: '#fafafa',
                  borderRadius: '4px',
                }}
              >
                <Text style={{ fontSize: '11px', color: '#666' }}>
                  💡 列宽值范围：1-5，数值越大占用宽度越大。例如：1:2:1
                  的比例会产生 25%:50%:25% 的列宽分配。
                </Text>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 如果选中了输入框组件，显示输入框编辑界面
    if (isInputComponent) {
      return (
        <div>
          <div
            style={{
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: '#f6ffed',
              border: '1px solid #b7eb8f',
              borderRadius: '6px',
            }}
          >
            <Text style={{ fontSize: '12px', color: '#52c41a' }}>
              🎯 当前选中：输入框组件
            </Text>
          </div>
          {/* 基础设置 */}
          <div
            style={{
              marginBottom: '16px',
              background: '#fff',
              borderRadius: 6,
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              padding: 16,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 15 }}>
              🔧 基础设置
            </div>
            <Form form={form} layout="vertical">
              <Form.Item label="是否必填">
                <Switch
                  checked={(currentComponent as any).required || false}
                  onChange={(checked) => handleValueChange('required', checked)}
                />
              </Form.Item>
            </Form>
          </div>
          {/* 内容设置 */}
          <div
            style={{
              background: '#fff',
              borderRadius: 6,
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              padding: 16,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 15 }}>
              📝 内容设置
            </div>
            <Form form={form} layout="vertical">
              <Form.Item label="占位文本">
                <Input
                  value={(currentComponent as any).placeholder?.content || ''}
                  onChange={(e) => {
                    const newPlaceholder = {
                      content: e.target.value,
                      i18n_content: {
                        'en-US': 'English placeholder',
                      },
                    };
                    handleValueChange('placeholder', newPlaceholder);
                  }}
                  placeholder="请输入占位文本"
                  maxLength={100}
                />
                {/* 占位文本变量绑定 */}
                <div style={{ marginTop: 8 }}>
                  <VariableBinding
                    value={(() => {
                      // 从占位文本中解析变量名
                      const placeholderContent = (currentComponent as any)
                        .placeholder?.content;
                      if (
                        placeholderContent &&
                        placeholderContent.includes('${')
                      ) {
                        const variableMatch =
                          placeholderContent.match(/\$\{([^}]+)\}/);
                        return variableMatch?.[1];
                      }
                      return undefined;
                    })()}
                    onChange={(variableName: string | undefined) => {
                      if (variableName) {
                        // 绑定变量
                        const newPlaceholder = {
                          content: `\${${variableName}}`,
                          i18n_content: {
                            'en-US': `\${${variableName}}`,
                          },
                        };
                        handleValueChange('placeholder', newPlaceholder);
                        console.log('✅ 输入框占位文本绑定变量:', {
                          componentId: currentComponent?.id,
                          variableName,
                          newPlaceholder,
                        });
                      } else {
                        // 清除变量绑定
                        const newPlaceholder = {
                          content: '',
                          i18n_content: {
                            'en-US': 'English placeholder',
                          },
                        };
                        handleValueChange('placeholder', newPlaceholder);
                        console.log('✅ 输入框占位文本清除变量绑定:', {
                          componentId: currentComponent?.id,
                        });
                      }
                    }}
                    componentType="input"
                    variables={variables}
                    getFilteredVariables={() => {
                      // 输入框占位文本支持文本和整数类型变量
                      return variables.filter((variable: any) => {
                        if (typeof variable === 'object' && variable !== null) {
                          const keys = getVariableKeys(variable);
                          if (keys.length > 0) {
                            const variableName = keys[0];
                            const originalType = getVariableOriginalType(
                              variable,
                              variableName,
                            );

                            return (
                              originalType === 'text' ||
                              originalType === 'number'
                            );
                          }
                        }
                        return false;
                      });
                    }}
                    getVariableDisplayName={getVariableDisplayName}
                    getVariableKeys={getVariableKeys}
                    onAddVariable={() =>
                      handleAddVariableFromComponent('input')
                    }
                    placeholder="选择占位文本变量"
                    label="绑定变量 (可选)"
                    addVariableText="+新建变量"
                  />
                </div>
              </Form.Item>
              <Form.Item label="默认文本">
                <Input
                  value={(currentComponent as any).default_value?.content || ''}
                  onChange={(e) => {
                    const newDefaultValue = {
                      content: e.target.value,
                      i18n_content: {
                        'en-US': 'English default value',
                      },
                    };
                    handleValueChange('default_value', newDefaultValue);
                  }}
                  placeholder="请输入默认文本"
                  maxLength={100}
                />
                {/* 默认文本变量绑定 */}
                <div style={{ marginTop: 8 }}>
                  <VariableBinding
                    value={(() => {
                      // 从默认文本中解析变量名
                      const defaultContent = (currentComponent as any)
                        .default_value?.content;
                      if (defaultContent && defaultContent.includes('${')) {
                        const variableMatch =
                          defaultContent.match(/\$\{([^}]+)\}/);
                        return variableMatch?.[1];
                      }
                      return undefined;
                    })()}
                    onChange={(variableName: string | undefined) => {
                      if (variableName) {
                        // 绑定变量
                        const newDefaultValue = {
                          content: `\${${variableName}}`,
                          i18n_content: {
                            'en-US': `\${${variableName}}`,
                          },
                        };
                        handleValueChange('default_value', newDefaultValue);
                        console.log('✅ 输入框默认文本绑定变量:', {
                          componentId: currentComponent?.id,
                          variableName,
                          newDefaultValue,
                        });
                      } else {
                        // 清除变量绑定
                        const newDefaultValue = {
                          content: '',
                          i18n_content: {
                            'en-US': 'English default value',
                          },
                        };
                        handleValueChange('default_value', newDefaultValue);
                        console.log('✅ 输入框默认文本清除变量绑定:', {
                          componentId: currentComponent?.id,
                        });
                      }
                    }}
                    componentType="input"
                    variables={variables}
                    getFilteredVariables={() => {
                      // 输入框默认文本支持文本和整数类型变量
                      return variables.filter((variable: any) => {
                        if (typeof variable === 'object' && variable !== null) {
                          const keys = getVariableKeys(variable);
                          if (keys.length > 0) {
                            const variableName = keys[0];
                            const originalType = getVariableOriginalType(
                              variable,
                              variableName,
                            );

                            return (
                              originalType === 'text' ||
                              originalType === 'number'
                            );
                          }
                        }
                        return false;
                      });
                    }}
                    getVariableDisplayName={getVariableDisplayName}
                    getVariableKeys={getVariableKeys}
                    onAddVariable={() =>
                      handleAddVariableFromComponent('input')
                    }
                    placeholder="选择默认文本变量"
                    label="绑定变量 (可选)"
                    addVariableText="+新建变量"
                  />
                </div>
              </Form.Item>
            </Form>
          </div>
        </div>
      );
    }

    // 如果选中了文本组件，显示文本编辑界面
    if (isTextComponent) {
      const isPlainText = currentComponent.tag === 'plain_text';
      const isRichText = currentComponent.tag === 'rich_text';

      // 获取绑定的变量名
      const getBoundVariableName = () => {
        const boundVariableName =
          textComponentStateManager.getBoundVariableName(currentComponent.id) ||
          '';
        return boundVariableName;
      };

      // 获取文本内容 - 根据当前模式显示不同内容
      const getTextContent = () => {
        if (!currentComponent) return '';

        if (textContentMode === 'specify') {
          // 指定模式：显示用户编辑的内容
          const userEditedContent =
            textComponentStateManager.getUserEditedContent(currentComponent.id);

          if (userEditedContent !== undefined) {
            return userEditedContent;
          }

          // 如果没有用户编辑的内容，使用组件原始内容
          if (isPlainText) {
            return (currentComponent as any).content || '';
          } else if (isRichText) {
            const content = (currentComponent as any).content;
            const defaultContent = {
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: '请输入富文本内容',
                    },
                  ],
                },
              ],
            };
            return content || defaultContent;
          }
        } else if (textContentMode === 'variable') {
          // 绑定变量模式：显示变量的实际值
          const boundVariableName = getBoundVariableName();
          const rememberedVariable = lastBoundVariables[currentComponent.id];
          const variableName = rememberedVariable || boundVariableName;

          if (variableName) {
            // 查找变量并获取其值
            const variable = variables.find((v: any) => {
              if (typeof v === 'object' && v !== null) {
                const keys = getVariableKeys(v);
                return keys.length > 0 && keys[0] === variableName;
              }
              return false;
            });

            if (variable) {
              const variableValue = (variable as any)[variableName];
              console.log('🔍 获取变量内容用于显示:', {
                componentId: currentComponent.id,
                variableName,
                variableValue,
                mode: textContentMode,
              });

              if (isRichText) {
                // 富文本：如果变量值是字符串，转换为富文本格式
                if (typeof variableValue === 'string') {
                  return {
                    type: 'doc',
                    content: [
                      {
                        type: 'paragraph',
                        content: [
                          {
                            type: 'text',
                            text: variableValue,
                          },
                        ],
                      },
                    ],
                  };
                } else if (typeof variableValue === 'object') {
                  return variableValue;
                }
              } else {
                // 普通文本：直接返回字符串值
                return String(variableValue);
              }
            }
          }

          // 如果没有找到变量，显示提示信息
          if (isRichText) {
            return {
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: '请选择要绑定的变量',
                    },
                  ],
                },
              ],
            };
          } else {
            return '请选择要绑定的变量';
          }
        }

        return '';
      };

      // 更新文本内容 - 保存用户编辑的内容
      const updateTextContent = (value: any) => {
        console.log('📝 用户编辑文本内容:', {
          componentId: currentComponent?.id,
          value: value,
          textContentMode,
          timestamp: new Date().toISOString(),
        });

        // 保存用户编辑的内容到状态管理器
        textComponentStateManager.setUserEditedContent(
          currentComponent.id,
          value,
        );

        // 创建更新的组件对象
        const updatedComponent = { ...currentComponent };

        // 在"指定"模式下，立即更新DSL数据以反映到画布
        if (textContentMode === 'specify') {
          if (isPlainText) {
            (updatedComponent as any).content = value;
            (updatedComponent as any).i18n_content = {
              'en-US': value,
            };
          } else if (isRichText) {
            (updatedComponent as any).content = value;
          }

          console.log('📝 指定模式：立即更新DSL数据到画布:', {
            componentId: currentComponent.id,
            updatedContent: value,
          });
        } else {
          // 在"绑定变量"模式下，不更新DSL，只保存用户编辑内容到状态管理器
          console.log('📝 绑定变量模式：仅保存用户编辑内容到状态管理器');
        }

        // 更新组件
        onUpdateComponent(updatedComponent);
      };

      // 更新绑定的变量名
      const updateBoundVariableName = (variableName: string) => {
        // 在更新前保存当前的用户编辑内容
        const currentUserEditedContent =
          textComponentStateManager.getUserEditedContent(currentComponent.id);

        // 创建完整的更新组件对象
        const updatedComponent = { ...currentComponent };

        if (variableName) {
          // 如果选择了变量，设置绑定变量名到状态管理器
          textComponentStateManager.setBoundVariableName(
            currentComponent.id,
            variableName,
          );

          // 如果用户还没有编辑过文本，将组件的原始内容保存为用户编辑内容
          if (currentUserEditedContent === undefined) {
            let originalContent;
            if (isRichText) {
              // 富文本组件：保存完整的JSON结构
              originalContent = (currentComponent as any).content || {
                type: 'doc',
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: '请输入富文本内容',
                      },
                    ],
                  },
                ],
              };
            } else {
              // 普通文本组件：保存字符串内容
              originalContent = (currentComponent as any).content || '';
            }

            textComponentStateManager.setUserEditedContent(
              currentComponent.id,
              originalContent,
            );
            console.log('📝 保存组件原始内容为用户编辑内容:', {
              componentId: currentComponent.id,
              originalContent: originalContent,
              isRichText: isRichText,
              isPlainText: isPlainText,
            });
          } else {
            // 确保用户编辑的内容不被清除
            textComponentStateManager.setUserEditedContent(
              currentComponent.id,
              currentUserEditedContent,
            );
          }

          // 更新全局数据中的content和i18n_content为变量占位符格式
          const variablePlaceholder = `\${${variableName}}`;

          if (isRichText) {
            // 富文本组件：将变量占位符格式保存到DSL
            (updatedComponent as any).content = variablePlaceholder;
            (updatedComponent as any).i18n_content = {
              'en-US': variablePlaceholder,
            };
          } else {
            // 普通文本组件
            (updatedComponent as any).content = variablePlaceholder;
            (updatedComponent as any).i18n_content = {
              'en-US': variablePlaceholder,
            };
          }

          console.log('✅ 文本组件变量绑定完成 (更新全局数据):', {
            componentId: updatedComponent?.id,
            variableName: variableName,
            content: variablePlaceholder,
            i18n_content: (updatedComponent as any).i18n_content,
            userEditedContent: textComponentStateManager.getUserEditedContent(
              currentComponent.id,
            ),
            updatedComponent: updatedComponent,
          });

          // 更新组件但不触发文本输入框重新渲染
          onUpdateComponent(updatedComponent);
        } else {
          // 如果清除了变量绑定，使用文本输入框中的内容作为最终文本
          const userEditedContent =
            textComponentStateManager.getUserEditedContent(currentComponent.id);

          if (userEditedContent !== undefined) {
            // 使用用户编辑的内容作为最终文本
            (updatedComponent as any).content = userEditedContent;
            if (isPlainText) {
              (updatedComponent as any).i18n_content = {
                'en-US': userEditedContent,
              };
            } else if (isRichText) {
              // 富文本组件不需要i18n_content，因为富文本内容已经是完整的JSON格式
              (updatedComponent as any).i18n_content = {
                'en-US': userEditedContent,
              };
            }
          } else {
            // 如果没有用户编辑的内容，使用默认内容
            const defaultContent = isPlainText
              ? '请输入文本内容'
              : {
                  type: 'doc',
                  content: [
                    {
                      type: 'paragraph',
                      content: [
                        {
                          type: 'text',
                          text: '请输入富文本内容',
                        },
                      ],
                    },
                  ],
                };

            (updatedComponent as any).content = defaultContent;
            if (isPlainText) {
              (updatedComponent as any).i18n_content = {
                'en-US': 'Enter text content',
              };
            } else if (isRichText) {
              // 富文本组件的默认i18n_content
              (updatedComponent as any).i18n_content = {
                'en-US': defaultContent,
              };
            }
          }

          // 清除绑定变量
          textComponentStateManager.setBoundVariableName(
            currentComponent.id,
            undefined,
          );

          console.log('✅ 文本组件变量绑定清除 (使用文本输入框内容):', {
            componentId: updatedComponent?.id,
            userEditedContent: userEditedContent,
            content: (updatedComponent as any).content,
            updatedComponent: updatedComponent,
          });

          // 更新组件
          onUpdateComponent(updatedComponent);
        }
      };

      // 使用提取到组件级别的 getFilteredVariables 函数

      return (
        <div>
          <div
            style={{
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '6px',
            }}
          >
            <Text style={{ fontSize: '12px', color: '#0369a1' }}>
              🎯 当前选中：{isPlainText ? '普通文本' : '富文本'}组件
            </Text>
          </div>
          {/* 内容设置 */}
          <div
            style={{
              marginBottom: '16px',
              background: '#fff',
              borderRadius: 6,
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              padding: 16,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 15 }}>
              📝 内容设置
            </div>
            <Form form={form} layout="vertical">
              <Form.Item label="文本内容">
                {/* 内容模式切换 */}
                <Segmented
                  value={textContentMode}
                  style={{ marginBottom: 16 }}
                  onChange={(value) => {
                    const newMode = value as 'specify' | 'variable';
                    setTextContentMode(newMode);

                    // 切换模式时，立即更新DSL数据以反映到画布
                    if (currentComponent) {
                      const updatedComponent = { ...currentComponent };

                      if (newMode === 'specify') {
                        // 切换到指定模式：使用用户编辑的内容，并清除变量绑定
                        const userEditedContent =
                          textComponentStateManager.getUserEditedContent(
                            currentComponent.id,
                          );

                        if (userEditedContent !== undefined) {
                          (updatedComponent as any).content = userEditedContent;
                          if (isPlainText) {
                            (updatedComponent as any).i18n_content = {
                              'en-US': userEditedContent,
                            };
                          }
                        }

                        // 清除变量绑定状态，确保画布不再显示变量内容
                        textComponentStateManager.setBoundVariableName(
                          currentComponent.id,
                          '',
                        );

                        console.log(
                          '🔄 切换到指定模式，更新DSL为用户内容并清除变量绑定:',
                          {
                            componentId: currentComponent.id,
                            userEditedContent,
                            updatedContent: (updatedComponent as any).content,
                            action: '清除变量绑定状态',
                          },
                        );
                      } else if (newMode === 'variable') {
                        // 切换到绑定变量模式：使用变量占位符
                        const boundVariableName = getBoundVariableName();
                        const rememberedVariable =
                          lastBoundVariables[currentComponent.id];
                        const variableName =
                          rememberedVariable || boundVariableName;

                        if (variableName) {
                          const variablePlaceholder = `\${${variableName}}`;
                          (updatedComponent as any).content =
                            variablePlaceholder;
                          (updatedComponent as any).i18n_content = {
                            'en-US': variablePlaceholder,
                          };

                          // 设置变量绑定状态，确保画布显示变量内容
                          textComponentStateManager.setBoundVariableName(
                            currentComponent.id,
                            variableName,
                          );

                          console.log(
                            '🔄 切换到绑定变量模式，更新DSL为变量占位符并设置绑定状态:',
                            {
                              componentId: currentComponent.id,
                              variableName,
                              variablePlaceholder,
                              updatedContent: (updatedComponent as any).content,
                              action: '设置变量绑定状态',
                            },
                          );
                        }
                      }

                      // 立即更新组件，触发画布重新渲染
                      onUpdateComponent(updatedComponent);
                    }

                    console.log('🔄 文本内容模式切换完成:', {
                      componentId: currentComponent?.id,
                      newMode: newMode,
                      previousMode: textContentMode,
                      note: '已更新DSL数据和画布',
                    });
                  }}
                  options={[
                    { label: '指定', value: 'specify' },
                    { label: '绑定变量', value: 'variable' },
                  ]}
                />

                {/* 文本内容显示区域 - 仅在指定模式下显示 */}
                {textContentMode === 'specify' && (
                  <div style={{ marginBottom: 16 }}>
                    {isRichText ? (
                      <RichTextEditor
                        key={`rich-text-${
                          currentComponent?.id
                        }-${selectedPath?.join('-')}-${textContentMode}`}
                        value={getTextContent()}
                        onChange={updateTextContent}
                        placeholder="请输入富文本内容..."
                        height={300}
                        showToolbar={true}
                      />
                    ) : (
                      <TextArea
                        value={getTextContent()}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          updateTextContent(e.target.value)
                        }
                        placeholder="请输入文本内容"
                        rows={4}
                        style={{
                          width: '100%',
                        }}
                      />
                    )}
                  </div>
                )}

                {/* 绑定变量模式：显示变量选择器 */}
                {textContentMode === 'variable' && (
                  <div>
                    <VariableBinding
                      value={(() => {
                        // 在绑定变量模式下，优先显示记住的变量
                        const rememberedVariable = currentComponent
                          ? lastBoundVariables[currentComponent.id]
                          : undefined;
                        const currentBoundVariable = getBoundVariableName();

                        // 如果有记住的变量，使用记住的变量；否则使用当前绑定的变量
                        const displayValue =
                          rememberedVariable || currentBoundVariable;

                        console.log('🔍 VariableBinding显示值:', {
                          componentId: currentComponent?.id,
                          rememberedVariable,
                          currentBoundVariable,
                          displayValue,
                        });

                        return displayValue;
                      })()}
                      onChange={(value: string | undefined) => {
                        // 立即更新DSL中的变量绑定
                        updateBoundVariableName(value || '');

                        // 同时记住这个选择，用于UI显示
                        if (currentComponent) {
                          if (value) {
                            setLastBoundVariables((prev) => ({
                              ...prev,
                              [currentComponent.id]: value,
                            }));

                            // 立即更新DSL数据为变量占位符，确保画布实时更新
                            const updatedComponent = { ...currentComponent };
                            const variablePlaceholder = `\${${value}}`;
                            (updatedComponent as any).content =
                              variablePlaceholder;
                            (updatedComponent as any).i18n_content = {
                              'en-US': variablePlaceholder,
                            };

                            // 设置变量绑定状态，确保画布显示变量内容
                            textComponentStateManager.setBoundVariableName(
                              currentComponent.id,
                              value,
                            );

                            onUpdateComponent(updatedComponent);

                            console.log('💾 选择变量并立即更新DSL和绑定状态:', {
                              componentId: currentComponent.id,
                              selectedVariable: value,
                              variablePlaceholder,
                              action: '立即生效并记住，设置绑定状态',
                            });
                          } else {
                            // 清除变量时，也清除记忆，并恢复用户编辑的内容
                            setLastBoundVariables((prev) => {
                              const newState = { ...prev };
                              delete newState[currentComponent.id];
                              return newState;
                            });

                            // 清除变量绑定状态
                            textComponentStateManager.setBoundVariableName(
                              currentComponent.id,
                              '',
                            );

                            // 恢复用户编辑的内容到DSL
                            const userEditedContent =
                              textComponentStateManager.getUserEditedContent(
                                currentComponent.id,
                              );
                            if (userEditedContent !== undefined) {
                              const updatedComponent = { ...currentComponent };
                              (updatedComponent as any).content =
                                userEditedContent;
                              if (isPlainText) {
                                (updatedComponent as any).i18n_content = {
                                  'en-US': userEditedContent,
                                };
                              }
                              onUpdateComponent(updatedComponent);
                            }

                            console.log('🗑️ 清除变量绑定状态并恢复用户内容:', {
                              componentId: currentComponent.id,
                              userEditedContent,
                              action: '清除绑定状态',
                            });
                          }
                        }
                      }}
                      componentType={isRichText ? 'rich_text' : 'plain_text'}
                      variables={variables}
                      getFilteredVariables={getFilteredVariables}
                      getVariableDisplayName={getVariableDisplayName}
                      getVariableKeys={getVariableKeys}
                      onAddVariable={() =>
                        handleAddVariableFromComponent(
                          isRichText ? 'rich_text' : 'plain_text',
                        )
                      }
                      placeholder="请选择要绑定的变量"
                      label="绑定变量"
                      addVariableText={
                        isRichText ? '+新建富文本变量' : '+新建变量'
                      }
                    />
                  </div>
                )}
              </Form.Item>
            </Form>
          </div>
          {/* 样式设置（仅普通文本） */}
          {isPlainText && (
            <div
              style={{
                background: '#fff',
                borderRadius: 6,
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                padding: 16,
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 15 }}>
                🎨 样式设置
              </div>
              <Form form={form} layout="vertical">
                <Form.Item label="字体大小">
                  <Select
                    value={
                      (currentComponent as any).style?.fontSize ||
                      (currentComponent as any).fontSize ||
                      14
                    }
                    onChange={(value) => handleValueChange('fontSize', value)}
                    style={{ width: '100%' }}
                  >
                    <Option value={14}>正文 14px</Option>
                    <Option value={16}>标题 16px</Option>
                    <Option value={12}>辅助信息 12px</Option>
                  </Select>
                </Form.Item>
                <Form.Item label="字色">
                  <ColorPicker
                    value={(currentComponent as any).style?.color || '#000000'}
                    onChange={(color: any) => {
                      const rgbaValue = color.toRgbString();
                      handleValueChange('color', rgbaValue);
                    }}
                    showText
                    format="rgb"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                <Form.Item label="对齐方式">
                  <Select
                    value={
                      (currentComponent as any).style?.textAlign ||
                      (currentComponent as any).textAlign ||
                      'left'
                    }
                    onChange={(value) => handleValueChange('textAlign', value)}
                    style={{ width: '100%' }}
                  >
                    <Option value="left">左对齐</Option>
                    <Option value="center">居中对齐</Option>
                    <Option value="right">右对齐</Option>
                  </Select>
                </Form.Item>
                <Form.Item label="最大显示行数">
                  <InputNumber
                    value={
                      (currentComponent as any).style?.numberOfLines ||
                      (currentComponent as any).numberOfLines ||
                      1
                    }
                    onChange={(value) =>
                      handleValueChange('numberOfLines', value)
                    }
                    min={1}
                    max={10}
                    style={{ width: '100%' }}
                    placeholder="设置最大显示行数"
                  />
                </Form.Item>
              </Form>
            </div>
          )}
        </div>
      );
    }

    // 如果选中了分割线组件，显示分割线编辑界面
    if (isHrComponent) {
      const hrComponent = currentComponent as any;

      return (
        <div style={{ padding: '16px' }}>
          <div
            style={{
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '6px',
            }}
          >
            <Text style={{ fontSize: '12px', color: '#0369a1' }}>
              📏 当前选中：分割线组件
            </Text>
          </div>
          {/* 样式设置 */}
          <div
            style={{
              background: '#fff',
              borderRadius: 6,
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              padding: 16,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 15 }}>
              🎨 样式设置
            </div>
            <Form form={form} layout="vertical">
              <Form.Item label="边框样式">
                <Select
                  value={hrComponent.style?.borderStyle || 'solid'}
                  onChange={(value) => {
                    const updatedStyle = {
                      ...hrComponent.style,
                      borderStyle: value,
                    };
                    const updatedComponent = {
                      ...currentComponent,
                      style: updatedStyle,
                    };
                    onUpdateComponent(updatedComponent);
                  }}
                  style={{ width: '100%' }}
                >
                  <Option value="solid">
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <div
                        style={{
                          width: '20px',
                          height: '2px',
                          backgroundColor: '#333',
                          borderStyle: 'solid',
                        }}
                      />
                      实线
                    </div>
                  </Option>
                  <Option value="dashed">
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <div
                        style={{
                          width: '20px',
                          height: '2px',
                          borderTop: '2px dashed #333',
                          backgroundColor: 'transparent',
                        }}
                      />
                      虚线
                    </div>
                  </Option>
                  <Option value="dotted">
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <div
                        style={{
                          width: '20px',
                          height: '2px',
                          borderTop: '2px dotted #333',
                          backgroundColor: 'transparent',
                        }}
                      />
                      点线
                    </div>
                  </Option>
                </Select>
              </Form.Item>
            </Form>
          </div>
        </div>
      );
    }

    // 如果选中了多图混排组件，显示多图混排编辑界面
    if (isImgCombinationComponent) {
      const imgCombComponent = currentComponent as any;

      // 混排方式选项，按照新的设计分组，包含对应的图标
      const combinationModes = [
        // 双图模式
        {
          value: 'double',
          label: '双图模式',
          description: '左小右大',
          category: 'double',
          icon: (
            <div
              style={{
                display: 'flex',
                gap: '2px',
                height: '20px',
                alignItems: 'flex-end',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '16px',
                  backgroundColor: '#d9d9d9',
                  borderRadius: '2px',
                }}
              ></div>
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  backgroundColor: '#d9d9d9',
                  borderRadius: '2px',
                }}
              ></div>
            </div>
          ),
        },
        // 三图模式
        {
          value: 'triple',
          label: '三图模式',
          description: '左1右2',
          category: 'triple',
          icon: (
            <div
              style={{
                display: 'flex',
                gap: '2px',
                height: '20px',
                alignItems: 'flex-end',
              }}
            >
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  backgroundColor: '#d9d9d9',
                  borderRadius: '2px',
                }}
              ></div>
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}
              >
                <div
                  style={{
                    width: '12px',
                    height: '7px',
                    backgroundColor: '#d9d9d9',
                    borderRadius: '2px',
                  }}
                ></div>
                <div
                  style={{
                    width: '12px',
                    height: '7px',
                    backgroundColor: '#d9d9d9',
                    borderRadius: '2px',
                  }}
                ></div>
              </div>
            </div>
          ),
        },
        // 等分双列模式
        {
          value: 'bisect_2',
          label: '双列-2图',
          description: '1行2列',
          category: 'bisect',
          icon: (
            <div
              style={{
                display: 'flex',
                gap: '2px',
                height: '20px',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  backgroundColor: '#d9d9d9',
                  borderRadius: '2px',
                }}
              ></div>
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  backgroundColor: '#d9d9d9',
                  borderRadius: '2px',
                }}
              ></div>
            </div>
          ),
        },
        {
          value: 'bisect_4',
          label: '双列-4图',
          description: '2行2列',
          category: 'bisect',
          icon: (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                height: '20px',
              }}
            >
              <div style={{ display: 'flex', gap: '2px' }}>
                <div
                  style={{
                    width: '10px',
                    height: '9px',
                    backgroundColor: '#d9d9d9',
                    borderRadius: '2px',
                  }}
                ></div>
                <div
                  style={{
                    width: '10px',
                    height: '9px',
                    backgroundColor: '#d9d9d9',
                    borderRadius: '2px',
                  }}
                ></div>
              </div>
              <div style={{ display: 'flex', gap: '2px' }}>
                <div
                  style={{
                    width: '10px',
                    height: '9px',
                    backgroundColor: '#d9d9d9',
                    borderRadius: '2px',
                  }}
                ></div>
                <div
                  style={{
                    width: '10px',
                    height: '9px',
                    backgroundColor: '#d9d9d9',
                    borderRadius: '2px',
                  }}
                ></div>
              </div>
            </div>
          ),
        },
        {
          value: 'bisect_6',
          label: '双列-6图',
          description: '3行2列',
          category: 'bisect',
          icon: (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                height: '20px',
              }}
            >
              <div style={{ display: 'flex', gap: '2px' }}>
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    backgroundColor: '#d9d9d9',
                    borderRadius: '2px',
                  }}
                ></div>
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    backgroundColor: '#d9d9d9',
                    borderRadius: '2px',
                  }}
                ></div>
              </div>
              <div style={{ display: 'flex', gap: '2px' }}>
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    backgroundColor: '#d9d9d9',
                    borderRadius: '2px',
                  }}
                ></div>
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    backgroundColor: '#d9d9d9',
                    borderRadius: '2px',
                  }}
                ></div>
              </div>
              <div style={{ display: 'flex', gap: '2px' }}>
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    backgroundColor: '#d9d9d9',
                    borderRadius: '2px',
                  }}
                ></div>
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    backgroundColor: '#d9d9d9',
                    borderRadius: '2px',
                  }}
                ></div>
              </div>
            </div>
          ),
        },
        // 等分三列模式
        {
          value: 'trisect_3',
          label: '三列-3图',
          description: '1行3列',
          category: 'trisect',
          icon: (
            <div style={{ display: 'flex', gap: '2px', height: '20px' }}>
              <div
                style={{
                  width: '6px',
                  height: '20px',
                  backgroundColor: '#d9d9d9',
                  borderRadius: '2px',
                }}
              ></div>
              <div
                style={{
                  width: '6px',
                  height: '20px',
                  backgroundColor: '#d9d9d9',
                  borderRadius: '2px',
                }}
              ></div>
              <div
                style={{
                  width: '6px',
                  height: '20px',
                  backgroundColor: '#d9d9d9',
                  borderRadius: '2px',
                }}
              ></div>
            </div>
          ),
        },
        {
          value: 'trisect_6',
          label: '三列-6图',
          description: '2行3列',
          category: 'trisect',
          icon: (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                height: '20px',
              }}
            >
              <div style={{ display: 'flex', gap: '2px' }}>
                <div
                  style={{
                    width: '6px',
                    height: '9px',
                    backgroundColor: '#d9d9d9',
                    borderRadius: '2px',
                  }}
                ></div>
                <div
                  style={{
                    width: '6px',
                    height: '9px',
                    backgroundColor: '#d9d9d9',
                    borderRadius: '2px',
                  }}
                ></div>
                <div
                  style={{
                    width: '6px',
                    height: '9px',
                    backgroundColor: '#d9d9d9',
                    borderRadius: '2px',
                  }}
                ></div>
              </div>
              <div style={{ display: 'flex', gap: '2px' }}>
                <div
                  style={{
                    width: '6px',
                    height: '9px',
                    backgroundColor: '#d9d9d9',
                    borderRadius: '2px',
                  }}
                ></div>
                <div
                  style={{
                    width: '6px',
                    height: '9px',
                    backgroundColor: '#d9d9d9',
                    borderRadius: '2px',
                  }}
                ></div>
                <div
                  style={{
                    width: '6px',
                    height: '9px',
                    backgroundColor: '#d9d9d9',
                    borderRadius: '2px',
                  }}
                ></div>
              </div>
            </div>
          ),
        },
        {
          value: 'trisect_9',
          label: '三列-9图',
          description: '3行3列',
          category: 'trisect',
          icon: (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                height: '20px',
              }}
            >
              <div style={{ display: 'flex', gap: '2px' }}>
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    backgroundColor: '#d9d9d9',
                    borderRadius: '2px',
                  }}
                ></div>
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    backgroundColor: '#d9d9d9',
                    borderRadius: '2px',
                  }}
                ></div>
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    backgroundColor: '#d9d9d9',
                    borderRadius: '2px',
                  }}
                ></div>
              </div>
              <div style={{ display: 'flex', gap: '2px' }}>
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    backgroundColor: '#d9d9d9',
                    borderRadius: '2px',
                  }}
                ></div>
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    backgroundColor: '#d9d9d9',
                    borderRadius: '2px',
                  }}
                ></div>
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    backgroundColor: '#d9d9d9',
                    borderRadius: '2px',
                  }}
                ></div>
              </div>
              <div style={{ display: 'flex', gap: '2px' }}>
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    backgroundColor: '#d9d9d9',
                    borderRadius: '2px',
                  }}
                ></div>
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    backgroundColor: '#d9d9d9',
                    borderRadius: '2px',
                  }}
                ></div>
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    backgroundColor: '#d9d9d9',
                    borderRadius: '2px',
                  }}
                ></div>
              </div>
            </div>
          ),
        },
      ];

      return (
        <div style={{ padding: '16px' }}>
          <div
            style={{
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '6px',
            }}
          >
            <Text style={{ fontSize: '12px', color: '#0369a1' }}>
              🖼️ 当前选中：多图混排组件
            </Text>
          </div>
          {/* 混排方式 */}
          <div
            style={{
              marginBottom: '24px',
              background: '#fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 15 }}>
              📐 混排方式
            </div>
            <div>
              <div style={{ marginBottom: '16px' }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '4px',
                    marginTop: '8px',
                  }}
                >
                  {combinationModes.map((mode) => (
                    <div
                      key={mode.value}
                      style={{
                        border:
                          getDisplayCombinationMode(
                            imgCombComponent.combination_mode,
                            imgCombComponent.img_list?.length || 0,
                          ) === mode.value
                            ? '1px solid #1890ff'
                            : '1px solid #d9d9d9',
                        borderRadius: '4px',
                        padding: '4px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        backgroundColor:
                          getDisplayCombinationMode(
                            imgCombComponent.combination_mode,
                            imgCombComponent.img_list?.length || 0,
                          ) === mode.value
                            ? '#f0f9ff'
                            : '#ffffff',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onClick={() => {
                        // 根据选择的模式确定所需的图片数量
                        const getRequiredImageCount = (mode: string) => {
                          switch (mode) {
                            case 'double':
                              return 2;
                            case 'triple':
                              return 3;
                            case 'bisect_2':
                              return 2;
                            case 'bisect_4':
                              return 4;
                            case 'bisect_6':
                              return 6;
                            case 'trisect_3':
                              return 3;
                            case 'trisect_6':
                              return 6;
                            case 'trisect_9':
                              return 9;
                            default:
                              return 2;
                          }
                        };

                        const requiredCount = getRequiredImageCount(mode.value);

                        // 切换混排方式时，重置所有图片为默认图片
                        let newImageList = [];

                        // 根据新的混排方式创建对应数量的默认图片
                        for (let i = 0; i < requiredCount; i++) {
                          newImageList.push({
                            img_url: 'demo.png', // 所有图片都重置为默认图片
                            i18n_img_url: {
                              'en-US': 'demo.png',
                            },
                          });
                        }

                        // 更新组件
                        const updatedComponent = {
                          ...currentComponent,
                          combination_mode: getStorageCombinationMode(
                            mode.value,
                          ) as any,
                          img_list: newImageList,
                        };
                        onUpdateComponent(updatedComponent);
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'center',
                        }}
                      >
                        {mode.icon}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* 图片设置 */}
          <div
            style={{
              background: '#fff',
              borderRadius: 6,
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 15 }}>
              🖼️ 图片设置
            </div>

            {/* 变量绑定选项 */}
            <VariableBinding
              value={(() => {
                // 检查img_list是否是变量占位符格式
                if (
                  typeof imgCombComponent.img_list === 'string' &&
                  imgCombComponent.img_list.includes('${')
                ) {
                  const variableMatch =
                    imgCombComponent.img_list.match(/\$\{([^}]+)\}/);
                  return variableMatch?.[1];
                }
                return undefined;
              })()}
              onChange={(value) => {
                console.log('🎯 多图混排变量绑定操作:', {
                  field: 'img_list_variable',
                  value,
                  componentId: imgCombComponent.id,
                  componentTag: imgCombComponent.tag,
                  currentImgList: imgCombComponent.img_list,
                });

                if (value) {
                  // 绑定变量：将img_list设置为变量占位符
                  const updatedComponent = {
                    ...currentComponent,
                    img_list: `\${${value}}`, // DSL数据中使用变量占位符格式
                  };

                  console.log('📝 更新多图混排变量绑定:', {
                    componentId: imgCombComponent.id,
                    selectedVariable: value,
                    newImgList: updatedComponent.img_list,
                  });

                  onUpdateComponent(updatedComponent);
                } else {
                  // 清除变量绑定：恢复为默认图片数组
                  const getDefaultImageList = (combinationMode: string) => {
                    // 根据混排模式确定默认图片数量
                    const getRequiredImageCount = (mode: string) => {
                      switch (mode) {
                        case 'double':
                          return 2;
                        case 'triple':
                          return 3;
                        case 'bisect_2':
                          return 2;
                        case 'bisect_4':
                          return 4;
                        case 'bisect_6':
                          return 6;
                        case 'trisect_3':
                          return 3;
                        case 'trisect_6':
                          return 6;
                        case 'trisect_9':
                          return 9;
                        default:
                          return 2;
                      }
                    };

                    const requiredCount =
                      getRequiredImageCount(combinationMode);
                    const defaultImageList = [];

                    // 创建默认图片数组
                    for (let i = 0; i < requiredCount; i++) {
                      defaultImageList.push({
                        img_url: '/demo.png', // 使用默认图片
                        i18n_img_url: {
                          'en-US': '/demo.png',
                        },
                      });
                    }

                    return defaultImageList;
                  };

                  const updatedComponent = {
                    ...currentComponent,
                    img_list: getDefaultImageList(
                      imgCombComponent.combination_mode,
                    ),
                  };

                  console.log('📝 清除多图混排变量绑定:', {
                    componentId: imgCombComponent.id,
                    combinationMode: imgCombComponent.combination_mode,
                    restoredImgList: updatedComponent.img_list,
                  });

                  onUpdateComponent(updatedComponent);
                }
              }}
              componentType="img_combination"
              variables={variables}
              getFilteredVariables={getFilteredVariables}
              getVariableDisplayName={getVariableDisplayName}
              getVariableKeys={getVariableKeys}
              onAddVariable={() =>
                handleAddVariableFromComponent('img_combination')
              }
              placeholder="请选择图片数组变量"
            />

            <div>
              {(() => {
                // 如果绑定了变量，显示变量信息而不是单独的图片输入框
                const isVariableBound =
                  typeof imgCombComponent.img_list === 'string' &&
                  imgCombComponent.img_list.includes('${');

                if (isVariableBound) {
                  const variableMatch =
                    imgCombComponent.img_list.match(/\$\{([^}]+)\}/);
                  const variableName = variableMatch?.[1];

                  return (
                    <div
                      style={{
                        padding: '12px',
                        backgroundColor: '#f6ffed',
                        border: '1px solid #b7eb8f',
                        borderRadius: '6px',
                        marginBottom: '16px',
                      }}
                    >
                      <Text style={{ fontSize: '12px', color: '#52c41a' }}>
                        🔗 已绑定图片数组变量: {variableName}
                      </Text>
                      <div
                        style={{
                          fontSize: '11px',
                          color: '#999',
                          marginTop: '4px',
                        }}
                      >
                        图片将自动从变量数据中获取，无需手动设置
                      </div>
                    </div>
                  );
                }

                // 未绑定变量时显示原有的图片输入框
                return (imgCombComponent.img_list || []).map(
                  (img: any, index: number) => (
                    <div key={index}>
                      <Form.Item
                        label={`图片${index + 1}`}
                        style={{ marginBottom: '12px' }}
                      >
                        <Input
                          style={{ width: '200px' }}
                          value={img.img_url || ''}
                          onChange={(e) => {
                            const newImgList = [
                              ...(imgCombComponent.img_list || []),
                            ];
                            newImgList[index] = {
                              ...newImgList[index],
                              img_url: e.target.value,
                              i18n_img_url: {
                                'en-US': e.target.value,
                              },
                            };
                            const updatedComponent = {
                              ...currentComponent,
                              img_list: newImgList,
                            };
                            onUpdateComponent(updatedComponent);
                          }}
                          placeholder="请输入图片的路径"
                        />
                        <ImageUpload
                          onUploadSuccess={(imageUrl) => {
                            console.log('📁 多图混排上传成功，更新组件:', {
                              componentId: imgCombComponent.id,
                              imageIndex: index,
                              imageUrlLength: imageUrl.length,
                            });

                            const newImgList = [
                              ...(imgCombComponent.img_list || []),
                            ];
                            newImgList[index] = {
                              ...newImgList[index],
                              img_url: imageUrl,
                              i18n_img_url: {
                                'en-US': imageUrl,
                              },
                            };
                            const updatedComponent = {
                              ...currentComponent,
                              img_list: newImgList,
                            };
                            onUpdateComponent(updatedComponent);
                          }}
                          buttonProps={{
                            type: 'default',
                            icon: <UploadOutlined />,
                            title: '上传图片',
                          }}
                        />
                      </Form.Item>
                    </div>
                  ),
                );
              })()}
            </div>
          </div>
        </div>
      );
    }

    // 检查是否选中了选择器组件 - 使用currentComponent而不是selectedComponent
    if (
      currentComponent &&
      (currentComponent.tag === 'select_static' ||
        currentComponent.tag === 'multi_select_static')
    ) {
      const selectComponent = currentComponent as any;
      const options = selectComponent.options || [];

      // 添加选项
      const handleAddOption = () => {
        const newOption = {
          text: {
            content: `选项${options.length + 1}`,
            i18n_content: {
              'en-US': `Option${options.length + 1}`,
            },
          },
          value: `option_${options.length + 1}`,
        };
        const newOptions = [...options, newOption];
        const updatedComponent = {
          ...currentComponent,
          options: newOptions,
        };
        onUpdateComponent(updatedComponent);
      };

      // 更新选项
      const handleUpdateOption = (index: number, field: string, value: any) => {
        const newOptions = [...options];
        if (field === 'content') {
          newOptions[index] = {
            ...newOptions[index],
            text: {
              ...newOptions[index].text,
              content: value,
            },
          };
        } else if (field === 'value') {
          newOptions[index] = {
            ...newOptions[index],
            value: value,
          };
        }
        const updatedComponent = {
          ...currentComponent,
          options: newOptions,
        };
        onUpdateComponent(updatedComponent);
      };

      // 删除选项
      const handleDeleteOption = (index: number) => {
        const newOptions = options.filter((_: any, i: number) => i !== index);
        const updatedComponent = {
          ...currentComponent,
          options: newOptions,
        };
        onUpdateComponent(updatedComponent);
      };

      return (
        <div>
          <div
            style={{
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '6px',
            }}
          >
            <Text style={{ fontSize: '12px', color: '#0369a1' }}>
              🎯 当前选中：
              {currentComponent.tag === 'multi_select_static'
                ? '下拉多选组件'
                : '下拉单选组件'}
            </Text>
          </div>
          {/* 基础设置 */}
          <div
            style={{
              marginBottom: '16px',
              background: '#fff',
              borderRadius: 6,
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              padding: 16,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 15 }}>
              🔧 基础设置
            </div>
            <Form form={form} layout="vertical">
              <Form.Item label="是否必填">
                <Switch
                  checked={selectComponent.required || false}
                  onChange={(checked) => handleValueChange('required', checked)}
                />
              </Form.Item>
            </Form>
          </div>
          {/* 选项设置 */}
          <div
            style={{
              background: '#fff',
              borderRadius: 6,
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              padding: 16,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 15 }}>
              📝 选项设置
            </div>
            {options.map((opt: any, idx: number) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  gap: 8,
                  marginBottom: 8,
                  alignItems: 'center',
                }}
              >
                <Input
                  value={opt.text?.content || ''}
                  onChange={(e) =>
                    handleUpdateOption(idx, 'content', e.target.value)
                  }
                  placeholder={`选项${idx + 1}名称`}
                  style={{ flex: 2 }}
                />
                <Input
                  value={opt.value || ''}
                  onChange={(e) =>
                    handleUpdateOption(idx, 'value', e.target.value)
                  }
                  placeholder={`选项${idx + 1}值`}
                  style={{ flex: 2 }}
                />
                <Button
                  danger
                  size="small"
                  onClick={() => handleDeleteOption(idx)}
                >
                  删除
                </Button>
              </div>
            ))}
            <Button type="dashed" block onClick={handleAddOption}>
              添加选项
            </Button>
          </div>
        </div>
      );
    }

    // 检查是否选中了图片组件 - 使用currentComponent而不是selectedComponent
    const isImageComponent = currentComponent && currentComponent.tag === 'img';

    // 如果选中了图片组件，显示图片编辑界面
    if (isImageComponent) {
      const imageComponent = currentComponent as any;

      // 添加空值检查，防止删除组件时的报错
      if (!imageComponent) {
        console.warn('⚠️ 图片组件数据为空，可能已被删除');
        return (
          <div style={{ padding: '16px', textAlign: 'center', color: '#999' }}>
            <div style={{ fontSize: '14px', marginBottom: '8px' }}>
              🔄 组件数据正在更新...
            </div>
            <div style={{ fontSize: '12px' }}>请重新选择组件</div>
          </div>
        );
      }

      const cropMode = imageComponent.style?.crop_mode || 'default';

      // 获取图片URL的显示值（用于属性面板输入框）
      const getDisplayImageUrl = () => {
        if (imageContentMode === 'specify') {
          // 指定模式：显示用户编辑的URL
          const userEditedUrl = imageComponentStateManager.getUserEditedUrl(
            imageComponent.id,
          );
          if (userEditedUrl !== undefined) {
            return userEditedUrl;
          }
          // 如果没有用户编辑的URL，使用组件原始URL（但排除变量占位符）
          if (
            imageComponent.img_url &&
            !imageComponent.img_url.includes('${')
          ) {
            return imageComponent.img_url;
          }
          return '';
        } else {
          // 绑定变量模式：显示变量占位符（如果有的话）
          return imageComponent.img_url || '';
        }
      };

      // 获取当前绑定的变量名（用于下拉选择器）
      const getBoundVariableName = () => {
        // 从 img_url 中解析变量名
        if (imageComponent.img_url && imageComponent.img_url.includes('${')) {
          const variableMatch = imageComponent.img_url.match(/\$\{([^}]+)\}/);
          if (variableMatch && variableMatch[1]) {
            return variableMatch[1];
          }
        }
        return undefined;
      };

      return (
        <div>
          <div
            style={{
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: '#f6ffed',
              border: '1px solid #b7eb8f',
              borderRadius: '6px',
            }}
          >
            <Text style={{ fontSize: '12px', color: '#52c41a' }}>
              🎯 当前选中：图片组件
            </Text>
          </div>
          {/* 图片来源 */}
          <div
            style={{
              marginBottom: '24px',
              background: '#fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 15 }}>
              📁 图片设置
            </div>
            <div>
              <Form form={form} layout="vertical">
                <Form.Item label="图片设置">
                  {/* 内容模式切换 */}
                  <Segmented
                    value={imageContentMode}
                    style={{ marginBottom: 16 }}
                    onChange={(value) => {
                      const newMode = value as 'specify' | 'variable';
                      setImageContentMode(newMode);

                      // 切换模式时，立即更新DSL数据以反映到画布
                      if (imageComponent) {
                        const updatedComponent = { ...imageComponent };

                        if (newMode === 'specify') {
                          // 切换到指定模式：清除变量绑定，恢复用户编辑的URL
                          const userEditedUrl =
                            imageComponentStateManager.getUserEditedUrl(
                              imageComponent.id,
                            );

                          if (userEditedUrl !== undefined) {
                            (updatedComponent as any).img_url = userEditedUrl;
                          } else {
                            // 如果没有用户编辑的URL，清空
                            (updatedComponent as any).img_url = '';
                          }

                          // 清除变量绑定状态
                          imageComponentStateManager.setBoundVariableName(
                            imageComponent.id,
                            '',
                          );

                          console.log(
                            '🔄 切换到指定模式，恢复用户编辑的URL并清除变量绑定:',
                            {
                              componentId: imageComponent.id,
                              userEditedUrl,
                              updatedUrl: (updatedComponent as any).img_url,
                              action: '恢复用户URL并清除变量绑定',
                            },
                          );
                        } else if (newMode === 'variable') {
                          // 切换到绑定变量模式：使用记住的变量或当前绑定的变量
                          const rememberedVariable =
                            lastBoundVariables[imageComponent.id];
                          const currentBoundVariable = getBoundVariableName();
                          const variableName =
                            rememberedVariable || currentBoundVariable;

                          if (variableName) {
                            const variablePlaceholder = `\${${variableName}}`;
                            (updatedComponent as any).img_url =
                              variablePlaceholder;
                            (updatedComponent as any).i18n_img_url = {
                              'en-US': variablePlaceholder,
                            };

                            // 设置变量绑定状态
                            imageComponentStateManager.setBoundVariableName(
                              imageComponent.id,
                              variableName,
                            );

                            console.log(
                              '🔄 切换到绑定变量模式，设置图片变量占位符并设置绑定状态:',
                              {
                                componentId: imageComponent.id,
                                variableName,
                                variablePlaceholder,
                                action: '设置变量绑定状态',
                              },
                            );
                          }
                        }

                        // 立即更新组件，触发画布重新渲染
                        onUpdateComponent(updatedComponent);
                      }

                      console.log('🔄 图片内容模式切换完成:', {
                        componentId: imageComponent?.id,
                        newMode: newMode,
                        previousMode: imageContentMode,
                        note: '已更新DSL数据和画布',
                      });
                    }}
                    options={[
                      { label: '指定', value: 'specify' },
                      { label: '绑定变量', value: 'variable' },
                    ]}
                  />

                  {/* 图片URL输入区域 - 仅在指定模式下显示 */}
                  {imageContentMode === 'specify' && (
                    <div style={{ marginBottom: 16 }}>
                      <Space.Compact style={{ width: '100%' }}>
                        <Input
                          style={{ width: 'calc(100% - 40px)' }}
                          value={getDisplayImageUrl()}
                          onChange={(e) => {
                            const newUrl = e.target.value;
                            // 保存用户编辑的URL到状态管理器
                            imageComponentStateManager.setUserEditedUrl(
                              imageComponent.id,
                              newUrl,
                            );
                            // 同时更新DSL
                            handleValueChange('img_url', newUrl);
                          }}
                          placeholder="请输入图片URL"
                        />
                        <ImageUpload
                          onUploadSuccess={(imageUrl) => {
                            console.log('📁 图片组件上传成功，更新组件:', {
                              componentId: imageComponent.id,
                              imageUrlLength: imageUrl.length,
                            });
                            // 保存用户上传的URL到状态管理器
                            imageComponentStateManager.setUserEditedUrl(
                              imageComponent.id,
                              imageUrl,
                            );
                            // 直接更新图片URL
                            handleValueChange('img_url', imageUrl);
                          }}
                          style={{
                            width: '40px',
                            height: '32px',
                            padding: 0,
                            borderRadius: '0 6px 6px 0',
                          }}
                          buttonProps={{
                            type: 'primary',
                            icon: <UploadOutlined />,
                            title: '上传图片',
                          }}
                        />
                      </Space.Compact>
                    </div>
                  )}

                  {/* 绑定变量模式：显示变量选择器 */}
                  {imageContentMode === 'variable' && (
                    <div>
                      <VariableBinding
                        value={(() => {
                          // 在绑定变量模式下，优先显示记住的变量
                          const rememberedVariable = imageComponent
                            ? lastBoundVariables[imageComponent.id]
                            : undefined;
                          const currentBoundVariable = getBoundVariableName();

                          // 如果有记住的变量，使用记住的变量；否则使用当前绑定的变量
                          const displayValue =
                            rememberedVariable || currentBoundVariable;

                          console.log('🔍 图片VariableBinding显示值:', {
                            componentId: imageComponent?.id,
                            rememberedVariable,
                            currentBoundVariable,
                            displayValue,
                          });

                          return displayValue;
                        })()}
                        onChange={(value: string | undefined) => {
                          // 立即更新DSL中的变量绑定
                          if (imageComponent) {
                            if (value) {
                              setLastBoundVariables((prev) => ({
                                ...prev,
                                [imageComponent.id]: value,
                              }));

                              // 立即更新DSL数据为变量占位符，确保画布实时更新
                              const updatedComponent = { ...imageComponent };
                              const variablePlaceholder = `\${${value}}`;
                              (updatedComponent as any).img_url =
                                variablePlaceholder;
                              (updatedComponent as any).i18n_img_url = {
                                'en-US': variablePlaceholder,
                              };

                              // 设置变量绑定状态
                              imageComponentStateManager.setBoundVariableName(
                                imageComponent.id,
                                value,
                              );

                              onUpdateComponent(updatedComponent);

                              console.log(
                                '💾 选择图片变量并立即更新DSL和绑定状态:',
                                {
                                  componentId: imageComponent.id,
                                  selectedVariable: value,
                                  variablePlaceholder,
                                  action: '立即生效并记住，设置绑定状态',
                                },
                              );
                            } else {
                              // 清除变量时，也清除记忆，并恢复用户编辑的URL
                              setLastBoundVariables((prev) => {
                                const newState = { ...prev };
                                delete newState[imageComponent.id];
                                return newState;
                              });

                              // 清除变量绑定状态
                              imageComponentStateManager.setBoundVariableName(
                                imageComponent.id,
                                '',
                              );

                              // 恢复用户编辑的URL到DSL
                              const userEditedUrl =
                                imageComponentStateManager.getUserEditedUrl(
                                  imageComponent.id,
                                );
                              const updatedComponent = { ...imageComponent };
                              (updatedComponent as any).img_url =
                                userEditedUrl || '';
                              onUpdateComponent(updatedComponent);

                              console.log(
                                '🗑️ 清除图片变量绑定状态并恢复用户URL:',
                                {
                                  componentId: imageComponent.id,
                                  userEditedUrl,
                                  action: '清除绑定状态并恢复用户URL',
                                },
                              );
                            }
                          }
                        }}
                        componentType="img"
                        variables={variables}
                        getFilteredVariables={getFilteredVariables}
                        getVariableDisplayName={getVariableDisplayName}
                        getVariableKeys={getVariableKeys}
                        onAddVariable={() =>
                          handleAddVariableFromComponent('img')
                        }
                        placeholder="请选择要绑定的变量"
                        label="绑定变量"
                        addVariableText="+新建变量"
                      />
                    </div>
                  )}
                </Form.Item>
              </Form>
            </div>
          </div>
          {/* 显示设置 */}
          <div
            style={{
              background: '#fff',
              borderRadius: 6,
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 15 }}>
              🎨 显示设置
            </div>
            <div>
              <Form form={form} layout="vertical">
                <Form.Item label="裁剪方式">
                  <Select
                    value={cropMode}
                    onChange={(value) => {
                      handleValueChange('crop_mode', value);
                    }}
                    style={{ width: '100%' }}
                  >
                    <Option value="default">
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <span>📐</span>
                        <div>
                          <div>完整展示</div>
                          <div style={{ fontSize: '12px', color: '#999' }}>
                            根据图片比例完整展示内容
                          </div>
                        </div>
                      </div>
                    </Option>
                    <Option value="top">
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <span>⬆️</span>
                        <div>
                          <div>顶部裁剪</div>
                          <div style={{ fontSize: '12px', color: '#999' }}>
                            4:3比例，显示图片顶部
                          </div>
                        </div>
                      </div>
                    </Option>
                    <Option value="center">
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <span>🎯</span>
                        <div>
                          <div>居中裁剪</div>
                          <div style={{ fontSize: '12px', color: '#999' }}>
                            4:3比例，显示图片中心
                          </div>
                        </div>
                      </div>
                    </Option>
                  </Select>
                </Form.Item>
              </Form>
            </div>
          </div>
        </div>
      );
    }

    // 如果没有选中的组件，显示提示信息
    if (!currentComponent) {
      return (
        <div style={{ padding: '16px' }}>
          <div
            style={{
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: '#f5f5f5',
              border: '1px solid #d9d9d9',
              borderRadius: '6px',
              textAlign: 'center',
            }}
          >
            <Text style={{ fontSize: '12px', color: '#999' }}>
              🎯 请选择一个组件进行配置
            </Text>
          </div>
        </div>
      );
    }

    // 默认显示组件基本信息
    return (
      <div>
        <div
          style={{
            marginBottom: '16px',
            padding: '12px',
            backgroundColor: '#fff7e6',
            border: '1px solid #ffd591',
            borderRadius: '6px',
          }}
        >
          <Text style={{ fontSize: '12px', color: '#d46b08' }}>
            🎯 当前选中：{currentComponent?.tag || '未知'}
          </Text>
        </div>
      </div>
    );
  };

  const renderVariables = () => {
    return (
      <div style={{ padding: '16px' }}>
        <Card title={<span>🔧 变量管理</span>} style={{ marginBottom: '16px' }}>
          <div style={{ marginBottom: '16px' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddVariable}
              style={{ width: '100%' }}
              size="small"
            >
              添加自定义变量
            </Button>
          </div>

          {variables.length === 0 ? (
            <div
              style={{ textAlign: 'center', color: '#999', padding: '20px 0' }}
            >
              暂无变量
            </div>
          ) : (
            <div>
              {variables.map((variable, index) => {
                // 处理新的变量格式 {变量名: 模拟数据值}
                let variableName: string;
                let variableValue: any;
                let variableType: string;

                if (typeof variable === 'object' && variable !== null) {
                  // 新的格式：{变量名: 模拟数据值}
                  const keys = getVariableKeys(variable);
                  if (keys.length > 0) {
                    variableName = keys[0];
                    variableValue = (variable as VariableObject)[variableName];

                    // 优化的类型推断：优先使用 originalType，回退到数据类型推断
                    const originalType = getVariableOriginalType(
                      variable,
                      variableName,
                    );

                    if (originalType) {
                      // 直接使用保存的原始类型
                      variableType = originalType;
                    } else {
                      // 回退到基于数据的类型推断
                      if (typeof variableValue === 'string') {
                        variableType = 'text';
                      } else if (typeof variableValue === 'number') {
                        variableType = 'number';
                      } else if (Array.isArray(variableValue)) {
                        // 检查是否为图片数组
                        const isImageArray =
                          variableValue.length > 0 &&
                          variableValue.every(
                            (item) =>
                              typeof item === 'object' &&
                              item !== null &&
                              item.img_url &&
                              typeof item.img_url === 'string',
                          );
                        variableType = isImageArray ? 'imageArray' : 'array';
                      } else if (
                        typeof variableValue === 'object' &&
                        variableValue !== null
                      ) {
                        if (variableValue.type === 'doc') {
                          variableType = 'richtext';
                        } else {
                          variableType = 'object';
                        }
                      } else {
                        variableType = 'text';
                      }
                    }

                    console.log('✅ 类型推断完成2222:', {
                      variableName,
                      variableValue,
                      variableType,
                      originalTypeKey: `__${variableName}_originalType`,
                      originalType: (variable as any)[
                        `__${variableName}_originalType`
                      ],
                    });
                  } else {
                    // 空对象，使用默认值
                    variableName = '未命名变量';
                    variableValue = '';
                    variableType = 'text';
                  }
                } else {
                  // 兼容旧的Variable格式
                  const varAsVariable = variable as Variable;
                  variableName = varAsVariable.name || '未命名变量';
                  variableValue = varAsVariable.value || '';
                  // 优先使用原始类型信息，如果没有则推断类型
                  if (varAsVariable.originalType) {
                    variableType = varAsVariable.originalType;
                  } else {
                    variableType = varAsVariable.type || 'text';
                  }
                }

                return (
                  <div
                    key={`${variableName}-${index}`}
                    className="variable-item"
                    style={{
                      padding: '12px',
                      border: '1px solid #f0f0f0',
                      borderRadius: '8px',
                      marginBottom: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: '#fff',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#d9d9d9';
                      e.currentTarget.style.boxShadow =
                        '0 2px 8px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#f0f0f0';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* 左侧：变量信息 */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 500,
                          marginBottom: '4px',
                          fontSize: '14px',
                          color: '#262626',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={variableName}
                      >
                        {variableName}{' '}
                        <span style={{ color: '#999', fontSize: '12px' }}>
                          ({getTypeLabel(variableType)})
                        </span>
                      </div>
                    </div>

                    {/* 右侧：操作按钮 */}
                    <div
                      style={{
                        display: 'flex',
                        gap: '4px',
                        opacity: 0,
                        transition: 'opacity 0.2s ease',
                      }}
                      className="variable-actions"
                    >
                      <Tooltip title="编辑">
                        <Button
                          type="text"
                          size="small"
                          icon={<EditOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            // 创建兼容的Variable对象用于编辑
                            console.warn(
                              'variableValue for edit:',
                              variableValue,
                            );
                            // 查找并获取保存的原始类型
                            const originalTypeKey = `__${variableName}_originalType`;
                            const savedOriginalType = variables.find((v) => {
                              if (typeof v === 'object' && v !== null) {
                                return (
                                  (v as Record<string, any>)[
                                    originalTypeKey
                                  ] !== undefined
                                );
                              }
                              return false;
                            });

                            const actualOriginalType = savedOriginalType
                              ? (savedOriginalType as Record<string, any>)[
                                  originalTypeKey
                                ]
                              : variableType; // 回退到推断类型

                            console.log('🔍 编辑变量时获取原始类型:', {
                              variableName,
                              originalTypeKey,
                              savedOriginalType,
                              actualOriginalType,
                              fallbackType: variableType,
                            });

                            const editVariable: Variable = {
                              name: variableName,
                              value:
                                typeof variableValue === 'object'
                                  ? JSON.stringify(variableValue)
                                  : String(variableValue),
                              type: variableType as
                                | 'text'
                                | 'number'
                                | 'boolean'
                                | 'object',
                              originalType: actualOriginalType as
                                | 'text'
                                | 'number'
                                | 'image'
                                | 'array',
                            };
                            handleEditVariable(editVariable);
                          }}
                          style={{
                            padding: '4px 8px',
                            height: '24px',
                            minWidth: '24px',
                          }}
                        />
                      </Tooltip>
                      {(() => {
                        const isInUse = isVariableInUse(variableName);
                        const tooltipTitle = isInUse
                          ? '该变量已被绑定，请解绑后再尝试删除'
                          : '删除';

                        return (
                          <Tooltip title={tooltipTitle}>
                            <Button
                              type="text"
                              size="small"
                              danger={!isInUse} // 当变量被使用时，取消危险样式
                              disabled={isInUse} // 当变量被使用时，禁用按钮
                              icon={<DeleteOutlined />}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isInUse) {
                                  handleDeleteVariable(index);
                                }
                              }}
                              style={{
                                padding: '4px 8px',
                                height: '24px',
                                minWidth: '24px',
                              }}
                            />
                          </Tooltip>
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    );
  };

  // 渲染卡片链接事件配置
  const renderCardLinkEvents = () => {
    // 获取当前卡片链接数据，使用类型断言避免类型错误
    const cardLink = (cardData as any)?.dsl?.card_link || {};
    const multiUrl = cardLink.multi_url || {};

    // 更新卡片链接数据的函数
    const updateCardLink = (field: string, value: string) => {
      if (!cardData) {
        console.warn('⚠️ cardData不存在，无法更新卡片链接');
        return;
      }
      const updatedCardData = {
        ...cardData,
        dsl: {
          ...(cardData as any).dsl,
          card_link: {
            ...cardLink,
            multi_url: {
              ...multiUrl,
              [field]: value,
            },
          },
        },
      };

      onUpdateCard({ cardData: updatedCardData });
    };

    return (
      <div style={{ padding: '16px' }}>
        <Form layout="vertical">
          <Form.Item label="url">
            <Input
              value={multiUrl.url || ''}
              onChange={(e) => updateCardLink('url', e.target.value)}
              placeholder="请输入通用链接"
            />
          </Form.Item>

          <Form.Item label="android_url">
            <Input
              value={multiUrl.android_url || ''}
              onChange={(e) => updateCardLink('android_url', e.target.value)}
              placeholder="请输入Android链接"
            />
          </Form.Item>

          <Form.Item label="ios_url">
            <Input
              value={multiUrl.ios_url || ''}
              onChange={(e) => updateCardLink('ios_url', e.target.value)}
              placeholder="请输入iOS链接"
            />
          </Form.Item>

          <Form.Item label="pc_url">
            <Input
              value={multiUrl.pc_url || ''}
              onChange={(e) => updateCardLink('pc_url', e.target.value)}
              placeholder="请输入PC链接"
            />
          </Form.Item>
        </Form>
      </div>
    );
  };

  const renderEvents = () => {
    if (!currentComponent && !isCardSelected) {
      return (
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <ThunderboltOutlined
            style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }}
          />
          <div style={{ color: '#999', marginBottom: '8px', fontSize: '16px' }}>
            请选择一个组件
          </div>
          <div style={{ color: '#ccc', fontSize: '12px' }}>
            点击画布中的组件开始配置事件
          </div>
        </div>
      );
    }

    // 如果选中了卡片，显示卡片链接配置
    if (isCardSelected) {
      return renderCardLinkEvents();
    }

    // 如果不是交互组件，显示禁用状态
    if (!isInteractiveComponent) {
      return (
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <ThunderboltOutlined
            style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }}
          />
          <div style={{ color: '#999', marginBottom: '8px', fontSize: '16px' }}>
            当前组件不支持事件管理
          </div>
          <div style={{ color: '#ccc', fontSize: '12px' }}>
            只有交互组件（按钮、输入框等）支持事件配置
          </div>
        </div>
      );
    }

    const events = getComponentEvents();

    return (
      <div style={{ padding: '16px' }}>
        <Card title={<span>⚡ 事件管理</span>} style={{ marginBottom: '16px' }}>
          <div style={{ marginBottom: '16px' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={createNewEvent}
              style={{ width: '100%' }}
              size="small"
            >
              创建事件
            </Button>
          </div>

          {events.length === 0 ? (
            <div
              style={{ textAlign: 'center', color: '#999', padding: '20px 0' }}
            >
              暂无事件配置
            </div>
          ) : (
            events.map((event: any, eventIndex: number) => (
              <div key={event.id} style={{ marginBottom: '16px' }}>
                <div
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px',
                    marginBottom: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontWeight: 500 }}>点击时</span>
                  <Button
                    type="text"
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => {
                      const newEvents = events.filter(
                        (e: any, i: number) => i !== eventIndex,
                      );
                      updateComponentEvents(newEvents);
                    }}
                  />
                </div>

                {event.actions && event.actions.length > 0 ? (
                  event.actions.map(
                    (action: EventAction, actionIndex: number) => (
                      <div
                        key={action.id}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #d9d9d9',
                          borderRadius: '4px',
                          marginBottom: '8px',
                          position: 'relative',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => {
                          const target = e.currentTarget;
                          const editBtn = target.querySelector(
                            '.action-edit-btn',
                          ) as HTMLElement;
                          const deleteBtn = target.querySelector(
                            '.action-delete-btn',
                          ) as HTMLElement;
                          if (editBtn) editBtn.style.display = 'inline-block';
                          if (deleteBtn)
                            deleteBtn.style.display = 'inline-block';
                        }}
                        onMouseLeave={(e) => {
                          const target = e.currentTarget;
                          const editBtn = target.querySelector(
                            '.action-edit-btn',
                          ) as HTMLElement;
                          const deleteBtn = target.querySelector(
                            '.action-delete-btn',
                          ) as HTMLElement;
                          if (editBtn) editBtn.style.display = 'none';
                          if (deleteBtn) deleteBtn.style.display = 'none';
                        }}
                        onClick={() => editAction(event.id, actionIndex)}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <span>请选择动作</span>
                          <div style={{ display: 'none' }}>
                            <Button
                              className="action-edit-btn"
                              type="text"
                              size="small"
                              icon={<EditOutlined />}
                              style={{ display: 'none', marginRight: '4px' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                editAction(event.id, actionIndex);
                              }}
                            >
                              编辑
                            </Button>
                            <Button
                              className="action-delete-btn"
                              type="text"
                              size="small"
                              danger
                              icon={<DeleteOutlined />}
                              style={{ display: 'none' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteAction(event.id, actionIndex);
                              }}
                            >
                              删除
                            </Button>
                          </div>
                        </div>
                      </div>
                    ),
                  )
                ) : (
                  <Button
                    type="dashed"
                    size="small"
                    onClick={() => addActionToEvent(event.id)}
                    style={{ width: '100%' }}
                  >
                    请选择动作
                  </Button>
                )}
              </div>
            ))
          )}
        </Card>
      </div>
    );
  };

  const TabItems = [
    {
      key: 'component',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <SettingOutlined />
          组件配置
        </span>
      ),
      children: (
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          style={{ flex: 1 }}
          size="small"
          items={[
            {
              key: 'properties',
              label: (
                <span
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  属性
                </span>
              ),
              disabled: false,
              children: (
                <div
                  style={{ height: 'calc(100vh - 180px)', overflow: 'auto' }}
                >
                  {renderProperties()}
                </div>
              ),
            },
            {
              key: 'events',
              label: (
                <span
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  事件
                </span>
              ),
              disabled: !isInteractiveComponent && !isCardSelected, // 修改：卡片选中时允许访问事件配置
              children: (
                <div
                  style={{ height: 'calc(100vh - 180px)', overflow: 'auto' }}
                >
                  {renderEvents()}
                </div>
              ),
            },
          ]}
          className="component-config-tabs"
        />
      ),
    },
    {
      key: 'variables',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <BgColorsOutlined />
          变量
        </span>
      ),
      children: (
        <div style={{ height: 'calc(100vh - 120px)', overflow: 'auto' }}>
          {renderVariables()}
        </div>
      ),
    },
  ];

  return (
    <div
      style={{
        width: '300px',
        height: 'calc(100vh - 60px)',
        backgroundColor: '#fafafa',
        borderLeft: '1px solid #d9d9d9',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <style>
        {`
          .custom-tabs .ant-tabs-nav {
            padding: 0 !important;
            background: #f2f3f5 !important;
          }
          .custom-tabs .ant-tabs-ink-bar {
            display: none;
          }
          .custom-tabs .ant-tabs-nav-list {
            background: #f2f3f5;
          }
          .custom-tabs .ant-tabs-tab {
            // background-color: #f2f3f5 !important;
            color: #1f2329 !important;
            border: none !important;
            border-radius: 6px !important;
            padding: 8px 16px !important;
            transition: all 0.2s ease !important;
            margin: 2px !important;
          }

          .custom-tabs .ant-tabs-tab.ant-tabs-tab-active {
            background-color: #fff !important;
          }
          
          .custom-tabs .ant-tabs-tab.ant-tabs-tab-disabled {
            // background-color: #f5f5f5 !important;
            color: #bbbfc4 !important;
            cursor: not-allowed !important;
          }
          
          .custom-tabs .ant-tabs-tab.ant-tabs-tab-disabled:hover {
            background-color: #f5f5f5 !important;
            color: #bbbfc4 !important;
          }
          
          .custom-tabs .ant-tabs-nav::before {
            border-bottom: none !important;
          }
          
          .custom-tabs .ant-tabs-tab-btn {
            color: inherit !important;
          }
          
          .custom-tabs .ant-tabs-tab-btn:focus {
            color: inherit !important;
          }

          /* 组件配置下的嵌套Tab样式优化 */
          .component-config-tabs .ant-tabs-nav {
            padding: 8px 12px 0 12px !important;
            background: #fafafa !important;
            border-bottom: 1px solid #f0f0f0 !important;
            margin-bottom: 0 !important;
          }
          
          .component-config-tabs .ant-tabs-nav::before {
            border-bottom: none !important;
          }
          
          .component-config-tabs .ant-tabs-ink-bar {
            display: none !important;
          }
          
          .component-config-tabs .ant-tabs-tab {
            background: transparent !important;
            border: none !important;
            border-radius: 8px 8px 0 0 !important;
            padding: 10px 20px !important;
            margin: 0 4px 0 0 !important;
            transition: all 0.3s ease !important;
            position: relative !important;
            color: #666 !important;
            font-weight: 500 !important;
          }
          
          .component-config-tabs .ant-tabs-tab:hover {
            background: rgba(24, 144, 255, 0.05) !important;
            color: #1890ff !important;
          }
          
          .component-config-tabs .ant-tabs-tab.ant-tabs-tab-active {
            background: #fff !important;
            color: #1890ff !important;
            box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.06) !important;
          }
          
          .component-config-tabs .ant-tabs-tab.ant-tabs-tab-active::after {
            content: '' !important;
            position: absolute !important;
            bottom: -1px !important;
            left: 0 !important;
            right: 0 !important;
            height: 2px !important;
            background: #1890ff !important;
            border-radius: 1px !important;
          }
          
          .component-config-tabs .ant-tabs-tab.ant-tabs-tab-disabled {
            color: #ccc !important;
            cursor: not-allowed !important;
            background: transparent !important;
          }
          
          .component-config-tabs .ant-tabs-tab.ant-tabs-tab-disabled:hover {
            background: transparent !important;
            color: #ccc !important;
          }
          
          .component-config-tabs .ant-tabs-content-holder {
            background: #fff !important;
            border-radius: 0 0 8px 8px !important;
          }
          
          .component-config-tabs .ant-tabs-tabpane {
            padding: 16px !important;
          }

          /* 变量列表hover效果 */
          .variable-item:hover .variable-actions {
            opacity: 1 !important;
          }
        `}
      </style>
      <Tabs
        activeKey={topLevelTab}
        onChange={setTopLevelTab}
        style={{ flex: 1 }}
        tabBarStyle={{
          padding: '0 16px',
          backgroundColor: '#fff',
          margin: 0,
          borderBottom: '1px solid #d9d9d9',
        }}
        size="small"
        items={TabItems}
      ></Tabs>
      {/* 新增变量弹窗 */}
      <AddVariableModal
        visible={isAddVariableModalVisible}
        onOk={handleAddVariableFromModal}
        onCancel={handleCancelAddVariableModal}
        initialType={
          editingVariable
            ? mapVariableTypeToInitialType(
                editingVariable.type,
                editingVariable.originalType,
              )
            : undefined
        }
        editingVariable={editingVariable}
        componentType={
          isVariableModalFromVariablesTab
            ? undefined // 来自变量Tab时不传递组件类型，显示全部类型
            : currentComponent?.tag // 来自组件属性时传递组件类型，进行过滤
        }
      />
      {/* 事件编辑弹窗 */}
      <EventEditModal
        visible={isEventEditModalVisible}
        eventAction={currentEventAction}
        variables={convertToVariableArray(variables)}
        onOk={saveActionEdit}
        onCancel={() => {
          setIsEventEditModalVisible(false);
          setEditingActionIndex(-1);
        }}
        onChange={(field, value) =>
          setCurrentEventAction((prev) => ({ ...prev, [field]: value }))
        }
        onAddVariable={() => {
          setIsEventEditModalVisible(false);
          setIsVariableModalFromVariablesTab(false); // 确保不来自变量Tab
          setIsAddVariableModalVisible(true);
        }}
      />
    </div>
  );
};
