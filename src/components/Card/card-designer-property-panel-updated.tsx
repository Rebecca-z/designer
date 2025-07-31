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
  Collapse,
  ColorPicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Switch,
  Tabs,
  Tree,
  Typography,
  Upload,
  message,
} from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { useDrag } from 'react-dnd';
import AddVariableModal from './AddVariableModal';
import {
  COMPONENT_CATEGORIES,
  COMPONENT_TYPES,
  DEFAULT_CARD_DATA,
} from './card-designer-constants-updated';
import {
  CardDesignData,
  CardPadding,
  ComponentType,
  Variable,
  VariableItem,
  VariableObject,
} from './card-designer-types-updated';
import RichTextEditor from './RichTextEditor';
import VariableTextEditor from './VariableTextEditor';

const { Option } = Select;
const { Text } = Typography;

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
        padding: '12px',
        border: '1px solid #d9d9d9',
        borderRadius: '6px',
        cursor: 'grab',
        transition: 'all 0.2s ease',
        backgroundColor: isDragging ? '#f0f9ff' : '#fff',
        opacity: isDragging ? 0.5 : 1,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '8px',
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
          fontSize: '16px',
          color: isDragging ? '#1890ff' : '#666',
        }}
      />
      <span
        style={{
          fontSize: '13px',
          color: isDragging ? '#1890ff' : '#333',
          fontWeight: isDragging ? 'bold' : 'normal',
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
    <div style={{ padding: '8px' }}>
      <Collapse
        defaultActiveKey={categories.map((cat) => cat.key)}
        ghost
        items={categories.map((category) => ({
          key: category.key,
          label: (
            <Space>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: category.color,
                }}
              />
              <Text strong style={{ fontSize: '14px' }}>
                {category.title}
              </Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                ({category.components.length})
              </Text>
            </Space>
          ),
          children: category.components.map(([type, config]) => (
            <DraggableComponent key={type} type={type} config={config} />
          )),
        }))}
      />
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
    console.log('🎯 卡片选中状态:', {
      selectedPath,
      realPath: selectedPath,
    });
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
    console.log('🎯 标题组件选中状态:', {
      componentId: titleComponent.id,
      componentTag: titleComponent.tag,
      selectedPath,
      realPath: selectedPath,
    });
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
      console.log('🎯 根元素组件:', {
        componentId: component.id,
        componentTag: component.tag,
        selectedPath,
        realPath: selectedPath,
      });
      return { component, realPath: selectedPath };
    }
  }

  // 检查是否是表单内的组件路径：['dsl', 'body', 'elements', formIndex, 'elements', componentIndex]
  if (
    selectedPath.length >= 6 &&
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
        console.log('📋 表单内组件:', {
          componentId: component.id,
          componentTag: component.tag,
          formIndex,
          componentIndex,
          selectedPath,
          realPath: selectedPath,
          formComponentId: formComponent.id,
          formComponentTag: formComponent.tag,
          formElementsLength: formElements.length,
          targetComponent: component,
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

        console.log('📐 根级别分栏列选中:', {
          componentId: columnComponent.id,
          componentTag: columnComponent.tag,
          columnSetIndex,
          columnIndex,
          selectedPath,
          realPath: selectedPath,
          columnSetComponentId: columnSetComponent.id,
          columnData: column,
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

          console.log('📐 表单内分栏列选中:', {
            componentId: columnComponent.id,
            componentTag: columnComponent.tag,
            formIndex,
            columnSetIndex,
            columnIndex,
            selectedPath,
            realPath: selectedPath,
            formComponentId: formComponent.id,
            columnSetComponentId: columnSetComponent.id,
            columnData: column,
          });
          return { component: columnComponent, realPath: selectedPath };
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
          console.log('📐 根级别分栏内组件:', {
            componentId: component.id,
            componentTag: component.tag,
            columnSetIndex,
            columnIndex,
            componentIndex,
            selectedPath,
            realPath: selectedPath,
          });
          return { component, realPath: selectedPath };
        }
      }
    }
  }

  // 检查是否是表单内分栏内的组件路径：['dsl', 'body', 'elements', formIndex, 'elements', columnSetIndex, 'columns', columnIndex, 'elements', componentIndex]
  if (
    selectedPath.length >= 10 &&
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
            console.log('📐 表单内分栏内组件:', {
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
          }
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
    console.log('🌳 大纲树选择事件触发:', {
      selectedKeys,
      nodePath: info.node?.path,
      nodeComponent: info.node?.component,
      nodeKey: info.node?.key,
    });

    if (info.node?.path) {
      console.log('🌳 大纲树选择:', {
        componentId: info.node.component?.id,
        componentTag: info.node.component?.tag,
        path: info.node.path,
        isCard:
          info.node.path.length === 2 &&
          info.node.path[0] === 'dsl' &&
          info.node.path[1] === 'body',
      });

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
  selectedComponent,
  selectedPath,
  onUpdateComponent,
  onUpdateCard,
  variables,
  onUpdateVariables,

  // cardPadding,
  headerData,
  cardData,
}) => {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState<string>('properties');
  const [topLevelTab, setTopLevelTab] = useState<string>('component'); // 新增顶层Tab状态

  // 变量管理相关状态
  const [isAddVariableModalVisible, setIsAddVariableModalVisible] =
    useState(false);
  const [editingVariable, setEditingVariable] = useState<Variable | null>(null);

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

  // 添加详细调试信息
  console.log('🔍 属性面板组件解析:', {
    selectedPath,
    realPath,
    realComponentId: realComponent?.id,
    realComponentTag: realComponent?.tag,
    cardDataExists: !!cardData,
    selectedPathLength: selectedPath?.length,
  });

  // 特别检查表单内组件的解析
  if (
    selectedPath &&
    selectedPath.length === 6 &&
    selectedPath[4] === 'elements'
  ) {
    const formIndex = selectedPath[3] as number;
    const componentIndex = selectedPath[5] as number;
    console.log('🔍 表单内组件详细调试:', {
      selectedPath,
      formIndex,
      componentIndex,
      cardDataElementsLength: cardData?.dsl?.body?.elements?.length,
      formComponent: cardData?.dsl?.body?.elements?.[formIndex],
      formElementsLength: (cardData?.dsl?.body?.elements?.[formIndex] as any)
        ?.elements?.length,
      targetComponent: (cardData?.dsl?.body?.elements?.[formIndex] as any)
        ?.elements?.[componentIndex],
      realComponentFromPath: realComponent,
      isRealComponentForm: realComponent?.tag === 'form',
    });
  }

  // 验证数据结构是否存在嵌套问题
  if (selectedPath && selectedPath.length >= 6 && cardData) {
    const formIndex = selectedPath[3] as number;
    const componentIndex = selectedPath[5] as number;
    const formComponent = cardData.dsl.body.elements[formIndex];

    if (formComponent && formComponent.tag === 'form') {
      const formElements = (formComponent as any).elements || [];
      const targetElement = formElements[componentIndex];

      console.log('🔍 验证表单内数据结构:', {
        formIndex,
        componentIndex,
        formComponent: {
          id: formComponent.id,
          tag: formComponent.tag,
          elementsCount: formElements.length,
        },
        targetElement: {
          id: targetElement?.id,
          tag: targetElement?.tag,
        },
        isNestedForm: targetElement?.tag === 'form',
        fullFormData: formComponent,
        fullTargetData: targetElement,
      });

      if (targetElement?.tag === 'form') {
        console.error('❌ 发现数据中存在嵌套表单结构!', {
          parentForm: formComponent,
          childForm: targetElement,
        });

        // 提示用户需要修复数据结构
        console.log('⚠️ 数据结构存在问题，建议重新导入正确的数据或手动修复');

        // 显示修复建议
        const nestedForm = targetElement as any;
        if (nestedForm.elements && nestedForm.elements.length > 0) {
          const actualComponent = nestedForm.elements[0];
          console.log('💡 修复建议: 实际目标组件可能是:', {
            componentId: actualComponent?.id,
            componentTag: actualComponent?.tag,
          });
        }
      }
    }
  }

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
      console.log('🖼️ 图片组件数据变化，强制更新UI:', {
        componentId: (currentComponent as any).id,
        img_source: (currentComponent as any).img_source,
        img_name: (currentComponent as any).img_name,
        variable_name: (currentComponent as any).variable_name,
      });
      forceUpdate((prev) => prev + 1);
    }
  }, [
    currentComponent?.id,
    (currentComponent as any)?.img_source,
    (currentComponent as any)?.img_name,
    (currentComponent as any)?.variable_name,
  ]);

  // 添加调试日志
  console.log('🎯 属性面板数据检查:', {
    selectedPath,
    cardDataExists: !!cardData,
    cardDataElementsCount: cardData?.dsl?.body?.elements?.length,
    realComponentExists: !!realComponent,
    realComponentId: realComponent?.id,
    realComponentTag: realComponent?.tag,
    realComponentContent: (realComponent as any)?.content,
    isCardSelected,
    timestamp: new Date().toISOString(),
  });

  // 如果没有找到真实组件，记录警告
  if (selectedPath && selectedPath.length >= 4 && !currentComponent) {
    console.warn('⚠️ 无法找到组件:', {
      selectedPath,
      cardDataElements: cardData?.dsl?.body?.elements?.length,
    });
  }

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

  console.log('🎨 属性面板状态:', {
    selectedPath,
    realPath,
    isCardSelected,
    hasSelectedComponent: !!currentComponent,
    componentTag: currentComponent?.tag,
    componentId: currentComponent?.id,
    selectedComponentFromProps: selectedComponent,
    selectedPathFromProps: selectedPath,
  });

  const handleValueChange = (field: string, value: any) => {
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
      ];

      console.log('🔧 开始处理组件更新:', {
        componentId: (currentComponent as any).id,
        componentTag: currentComponent.tag,
        field,
        value,
        isStyleField: styleFields.includes(field),
        currentStyle: (currentComponent as any).style,
        realPath,
      });

      if (styleFields.includes(field)) {
        const updatedComponent = {
          ...currentComponent,
          style: {
            ...((currentComponent as any).style || {}),
            [field]: value,
          },
        };
        console.log('📝 更新组件样式属性:', {
          componentId: (updatedComponent as any).id,
          field,
          value,
          newStyle: (updatedComponent as any).style,
          realPath,
        });
        onUpdateComponent(updatedComponent);
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
        });
        onUpdateComponent(updatedComponent);
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

    console.log('🎯 处理标题嵌套字段更新:', {
      parentField,
      field,
      value,
      currentHeader: cardData.dsl?.header,
      currentParentField: cardData.dsl?.header?.[parentField],
    });

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

    console.log('💾 更新标题数据:', {
      newHeader: updatedCardData.dsl.header,
      titleContent: (updatedCardData.dsl.header as any)?.title?.content,
      subtitleContent: (updatedCardData.dsl.header as any)?.subtitle?.content,
      style: (updatedCardData.dsl.header as any)?.style,
    });

    onUpdateCard({ cardData: updatedCardData });
  };

  // 处理添加变量
  const handleAddVariable = () => {
    setEditingVariable(null); // 清空编辑状态
    setIsAddVariableModalVisible(true);
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
        const keys = Object.keys(v as VariableObject);
        return keys.length > 0 && keys[0] === variableName;
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
      } else {
        // 对于文本和数字类型，直接使用字符串值
        parsedValue = variable.value;
      }
    } catch (error) {
      // 如果解析失败，使用原始字符串值
      parsedValue = variable.value;
    }

    // 创建{变量名:模拟数据值}格式的对象
    const variableObject = {
      [variable.name]: parsedValue,
    };

    if (editingVariable) {
      // 编辑模式：通过变量名称查找并更新现有变量
      const variableIndex = findVariableIndexByName(editingVariable.name);

      if (variableIndex !== -1) {
        // 找到变量，更新它
        const newVariables = [...variables];
        newVariables[variableIndex] = variableObject;
        onUpdateVariables(newVariables);

        console.log('🔄 更新变量:', {
          variableName: editingVariable.name,
          variableIndex,
          oldVariable: variables[variableIndex],
          newVariable: variableObject,
          allVariables: newVariables,
        });
      } else {
        // 没找到变量，作为新变量添加
        const newVariables = [...variables, variableObject];
        onUpdateVariables(newVariables);
        console.log('⚠️ 未找到要编辑的变量，作为新变量添加:', {
          variableName: editingVariable.name,
          newVariable: variableObject,
          allVariables: newVariables,
        });
      }
    } else {
      // 新增模式：添加新变量
      const newVariables = [...variables, variableObject];
      onUpdateVariables(newVariables);
      console.log('➕ 添加新变量:', {
        newVariable: variableObject,
        allVariables: newVariables,
      });
    }
    setIsAddVariableModalVisible(false);
    setEditingVariable(null);
  };

  // 处理取消添加变量
  const handleCancelAddVariableModal = () => {
    setIsAddVariableModalVisible(false);
    setEditingVariable(null);
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
        return '数字';
      case 'boolean':
        return '布尔';
      case 'object':
        return '对象';
      default:
        return type;
    }
  };

  // 获取类型颜色
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'text':
        return { bg: '#e6f7ff', text: '#1890ff' };
      case 'number':
        return { bg: '#f6ffed', text: '#52c41a' };
      case 'boolean':
        return { bg: '#fff7e6', text: '#fa8c16' };
      case 'object':
        return { bg: '#f9f0ff', text: '#722ed1' };
      default:
        return { bg: '#f5f5f5', text: '#8c8c8c' };
    }
  };

  // 映射Variable类型到AddVariableModal的初始类型
  const mapVariableTypeToInitialType = (
    type: string,
  ): 'text' | 'number' | 'image' | 'array' => {
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
        <div style={{ padding: '16px' }}>
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
                  onChange={(value) => {
                    console.log('🎯 更新布局方式:', {
                      oldValue: cardData?.dsl?.body?.direction,
                      newValue: value,
                      timestamp: new Date().toISOString(),
                    });
                    onUpdateCard({ direction: value });
                  }}
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
              <Form.Item label="垂直间距" help="组件之间的垂直间距，固定为8px">
                <InputNumber
                  value={8}
                  disabled={true}
                  style={{ width: '100%' }}
                  addonAfter="px"
                  placeholder="固定间距"
                />
              </Form.Item>
            </Form>
          </Card>

          {/* 内边距设置 */}
          {/* <Card
            title="📦 内边距设置"
            size="small"
            style={{ marginBottom: '12px' }}
          >
                <PaddingEditor
                  value={cardPadding}
                  onChange={(padding) => onUpdateCard({ padding })}
                />
          </Card> */}
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
            <Text style={{ fontSize: '12px', color: '#389e0d' }}>
              🎯 当前选中：标题组件
            </Text>
          </div>
          <Collapse
            defaultActiveKey={['content', 'style']}
            ghost
            items={[
              {
                key: 'content',
                label: '📝 内容设置',
                children: (
                  <Form form={form} layout="vertical">
                    <Form.Item label="主标题">
                      <Input
                        value={headerData?.title?.content || ''}
                        onChange={(e) =>
                          handleHeaderNestedChange(
                            'title',
                            'content',
                            e.target.value,
                          )
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
                ),
              },
              {
                key: 'style',
                label: '🎨 样式设置',
                children: (
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
                ),
              },
            ]}
          />
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
        const isDefaultColumnSet = columnSetComp.isDefault === true;

        if (count > columns.length) {
          // 增加列
          for (let i = columns.length; i < count; i++) {
            newColumns.push({
              tag: 'column',
              elements: [],
              width: 1, // 默认宽度为1
            });
          }
        } else if (count < columns.length) {
          // 减少列 - 对于默认分栏容器，保护第一列的按钮
          if (isDefaultColumnSet && count < 1) {
            // 不允许减少到少于1列，因为按钮需要保持在第一列
            console.log('⚠️ 默认分栏容器至少需要1列来容纳按钮');
            return;
          }

          // 对于默认分栏容器，只删除非第一列的列
          if (isDefaultColumnSet) {
            // 保留第一列，只删除后面的列
            const firstColumn = newColumns[0];
            newColumns.splice(1, newColumns.length - count);
            // 确保第一列存在
            if (newColumns.length === 0) {
              newColumns.push(firstColumn);
            }
          } else {
            // 非默认分栏容器，正常删除
            newColumns.splice(count);
          }
        }

        const updatedComponent = {
          ...currentComponent,
          columns: newColumns,
        };
        onUpdateComponent(updatedComponent);
      };

      // 删除单个列的函数
      const handleDeleteColumn = (columnIndex: number) => {
        const isDefaultColumnSet = columnSetComp.isDefault === true;

        // 对于默认分栏容器，不允许删除第一列
        if (isDefaultColumnSet && columnIndex === 0) {
          console.log('⚠️ 默认分栏容器的第一列不能删除，因为包含按钮');
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
        const totalWidth = newColumns.reduce(
          (sum: number, col: any) => sum + (col.width || 1),
          0,
        );

        // 如果总宽度为0，给所有列设置默认宽度1
        if (totalWidth === 0) {
          newColumns.forEach((col: any) => {
            col.width = 1;
          });
        }

        const updatedComponent = {
          ...currentComponent,
          columns: newColumns,
        };
        onUpdateComponent(updatedComponent);
      };

      // 更新单个列宽的函数
      const handleColumnWidthChange = (columnIndex: number, width: number) => {
        const newColumns = columns.map((col: any, index: number) => {
          if (index === columnIndex) {
            return { ...col, width };
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
          (sum: number, col: any) => sum + (col.width || 1),
          0,
        );
        return columns.map((col: any) => {
          const width = col.width || 1;
          return Math.round((width / totalWidth) * 100);
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
          <Collapse
            defaultActiveKey={['basic', 'layout']}
            ghost
            items={[
              {
                key: 'basic',
                label: '🔧 基础设置',
                children: (
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
                ),
              },
              {
                key: 'layout',
                label: '📏 列宽设置',
                children: (
                  <div>
                    <div style={{ marginBottom: '12px' }}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        调整各列宽度比例，总宽度按比例分配
                      </Text>
                    </div>
                    {columns.map((column: any, index: number) => (
                      <div key={index} style={{ marginBottom: '12px' }}>
                        <Form.Item
                          label={`第${index + 1}列宽度 (${
                            columnWidths[index]
                          }%)`}
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
                              value={column.width || 1}
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
                            {/* 删除列按钮 - 默认分栏容器的第一列不显示删除按钮 */}
                            {!(
                              columnSetComp.isDefault === true && index === 0
                            ) && (
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
                            {/* 默认分栏容器第一列的保护标识 */}
                            {columnSetComp.isDefault === true &&
                              index === 0 && (
                                <div
                                  style={{
                                    padding: '4px 8px',
                                    height: '24px',
                                    fontSize: '12px',
                                    color: '#faad14',
                                    backgroundColor: '#fff7e6',
                                    border: '1px solid #ffd591',
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
                ),
              },
            ]}
          />
        </div>
      );
    }

    // 如果选中了输入框组件，显示输入框编辑界面
    if (isInputComponent) {
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
              🎯 当前选中：输入框组件
            </Text>
          </div>
          <Collapse
            defaultActiveKey={['basic', 'content']}
            ghost
            items={[
              {
                key: 'basic',
                label: '🔧 基础设置',
                children: (
                  <Form form={form} layout="vertical">
                    <Form.Item label="是否必填">
                      <Switch
                        checked={(currentComponent as any).required || false}
                        onChange={(checked) =>
                          handleValueChange('required', checked)
                        }
                      />
                    </Form.Item>
                  </Form>
                ),
              },
              {
                key: 'content',
                label: '📝 内容设置',
                children: (
                  <Form form={form} layout="vertical">
                    <Form.Item label="占位文本">
                      <Input
                        value={
                          (currentComponent as any).placeholder?.content || ''
                        }
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
                    </Form.Item>
                    <Form.Item label="默认文本">
                      <Input
                        value={
                          (currentComponent as any).default_value?.content || ''
                        }
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
                    </Form.Item>
                  </Form>
                ),
              },
            ]}
          />
        </div>
      );
    }

    // 如果选中了文本组件，显示文本编辑界面
    if (isTextComponent) {
      const isPlainText = currentComponent.tag === 'plain_text';
      const isRichText = currentComponent.tag === 'rich_text';

      // 获取文本内容
      const getTextContent = () => {
        // 添加空值检查，防止删除组件时的报错
        if (!currentComponent) {
          console.log('⚠️ getTextContent: 当前组件为空');
          return '';
        }

        if (isPlainText) {
          const content = (currentComponent as any).content || '';
          console.log('📝 getTextContent (plain_text):', {
            componentId: currentComponent.id,
            content,
          });
          return content;
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
          const finalContent = content || defaultContent;

          console.log('📝 getTextContent (rich_text):', {
            componentId: currentComponent.id,
            rawContent: content,
            finalContent,
            hasContent: !!content,
            contentType: typeof content,
            timestamp: new Date().toISOString(),
          });

          return finalContent;
        }
        return '';
      };

      // 更新文本内容
      const updateTextContent = (value: any) => {
        console.log('📝 更新文本内容:', {
          componentId: currentComponent?.id,
          componentTag: currentComponent?.tag,
          value,
          isPlainText,
          isRichText,
        });

        if (isPlainText) {
          handleValueChange('content', value);
        } else if (isRichText) {
          // 富文本直接保存JSON格式
          handleValueChange('content', value);
        }
      };

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
              🎯 当前选中：{isPlainText ? '普通文本' : '富文本'}组件
            </Text>
          </div>
          <Collapse
            defaultActiveKey={isRichText ? ['content'] : ['content', 'style']}
            ghost
            items={[
              {
                key: 'content',
                label: '📝 内容设置',
                children: (
                  <Form form={form} layout="vertical">
                    <Form.Item label="文本内容">
                      {(() => {
                        console.log('🎯 文本编辑器渲染检查:', {
                          componentId: currentComponent?.id,
                          componentTag: currentComponent?.tag,
                          textContent: getTextContent(),
                          isRichText,
                          variablesCount: variables.length,
                          timestamp: new Date().toISOString(),
                        });

                        if (isRichText) {
                          return (
                            <RichTextEditor
                              key={`rich-text-${
                                currentComponent?.id
                              }-${selectedPath?.join('-')}`} // ✅ 修复：添加key确保组件重新渲染
                              value={getTextContent()}
                              onChange={updateTextContent}
                              placeholder="请输入富文本内容..."
                              height={300}
                              showToolbar={true}
                            />
                          );
                        }

                        return (
                          <VariableTextEditor
                            value={getTextContent()}
                            onChange={updateTextContent}
                            variables={variables}
                            onAddVariable={() => {
                              setIsAddVariableModalVisible(true);
                            }}
                            onEditVariable={(variableName) => {
                              // 查找并编辑指定的变量
                              const variable = variables.find((v) => {
                                if (typeof v === 'object' && v !== null) {
                                  const keys = Object.keys(
                                    v as Record<string, any>,
                                  );
                                  return (
                                    keys.length > 0 && keys[0] === variableName
                                  );
                                }
                                return false;
                              });

                              if (variable) {
                                // 转换为Variable格式用于编辑
                                const keys = Object.keys(
                                  variable as Record<string, any>,
                                );
                                const variableValue = (
                                  variable as Record<string, any>
                                )[keys[0]];
                                const editingVariable = {
                                  name: variableName,
                                  type: 'text' as const,
                                  value: String(variableValue),
                                };
                                setEditingVariable(editingVariable);
                                setIsAddVariableModalVisible(true);
                              }
                            }}
                            placeholder="请输入文本内容"
                            rows={4}
                          />
                        );
                      })()}
                    </Form.Item>
                  </Form>
                ),
              },
              // 只有普通文本才显示样式设置
              ...(isPlainText
                ? [
                    {
                      key: 'style',
                      label: '🎨 样式设置',
                      children: (
                        <Form form={form} layout="vertical">
                          <Form.Item label="字体大小">
                            <Select
                              value={
                                (currentComponent as any).style?.fontSize ||
                                (currentComponent as any).fontSize ||
                                14
                              }
                              onChange={(value) =>
                                handleValueChange('fontSize', value)
                              }
                              style={{ width: '100%' }}
                            >
                              <Option value={14}>正文 14px</Option>
                              <Option value={16}>标题 16px</Option>
                              <Option value={12}>辅助信息 12px</Option>
                            </Select>
                          </Form.Item>
                          <Form.Item label="字色">
                            <ColorPicker
                              value={
                                (currentComponent as any).style?.color ||
                                '#000000'
                              }
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
                              onChange={(value) =>
                                handleValueChange('textAlign', value)
                              }
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
                                (currentComponent as any).style
                                  ?.numberOfLines ||
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
                      ),
                    },
                  ]
                : []),
            ]}
          />
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
          <Collapse
            defaultActiveKey={['style']}
            ghost
            items={[
              {
                key: 'style',
                label: '🎨 样式设置',
                children: (
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
                ),
              },
            ]}
          />
        </div>
      );
    }

    // 如果选中了多图混排组件，显示多图混排编辑界面
    if (isImgCombinationComponent) {
      const imgCombComponent = currentComponent as any;

      // 混排方式选项，按照新的设计分组
      const combinationModes = [
        // 双图模式
        {
          value: 'double',
          label: '双图模式',
          description: '左小右大',
          category: 'double',
        },
        // 三图模式
        {
          value: 'triple',
          label: '三图模式',
          description: '左1右2',
          category: 'triple',
        },
        // 等分双列模式
        {
          value: 'bisect_2',
          label: '双列-2图',
          description: '1行2列',
          category: 'bisect',
        },
        {
          value: 'bisect_4',
          label: '双列-4图',
          description: '2行2列',
          category: 'bisect',
        },
        {
          value: 'bisect_6',
          label: '双列-6图',
          description: '3行2列',
          category: 'bisect',
        },
        // 等分三列模式
        {
          value: 'trisect_3',
          label: '三列-3图',
          description: '1行3列',
          category: 'trisect',
        },
        {
          value: 'trisect_6',
          label: '三列-6图',
          description: '2行3列',
          category: 'trisect',
        },
        {
          value: 'trisect_9',
          label: '三列-9图',
          description: '3行3列',
          category: 'trisect',
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
          <Collapse
            defaultActiveKey={['layout', 'images']}
            ghost
            items={[
              {
                key: 'layout',
                label: '📐 混排方式',
                children: (
                  <div>
                    <div style={{ marginBottom: '16px' }}>
                      <Text
                        style={{
                          fontSize: '12px',
                          color: '#666',
                          marginBottom: '8px',
                          display: 'block',
                        }}
                      >
                        选择图片排列方式：
                      </Text>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(4, 1fr)',
                          gap: '8px',
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
                                  ? '2px solid #1890ff'
                                  : '1px solid #d9d9d9',
                              borderRadius: '4px',
                              padding: '8px',
                              textAlign: 'center',
                              cursor: 'pointer',
                              backgroundColor:
                                getDisplayCombinationMode(
                                  imgCombComponent.combination_mode,
                                  imgCombComponent.img_list?.length || 0,
                                ) === mode.value
                                  ? '#f0f9ff'
                                  : '#fafafa',
                              transition: 'all 0.2s ease',
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

                              const requiredCount = getRequiredImageCount(
                                mode.value,
                              );
                              const currentImages =
                                imgCombComponent.img_list || [];

                              // 调整图片列表数量
                              let newImageList = [...currentImages];

                              if (newImageList.length < requiredCount) {
                                // 需要添加图片
                                for (
                                  let i = newImageList.length;
                                  i < requiredCount;
                                  i++
                                ) {
                                  newImageList.push({
                                    img_url: 'demo.png',
                                    i18n_img_url: {
                                      'en-US': 'demo.png',
                                    },
                                  });
                                }
                              } else if (newImageList.length > requiredCount) {
                                // 需要移除多余图片
                                newImageList = newImageList.slice(
                                  0,
                                  requiredCount,
                                );
                              }

                              const updatedComponent = {
                                ...currentComponent,
                                combination_mode: getStorageCombinationMode(
                                  mode.value,
                                ) as any,
                                img_list: newImageList,
                              };

                              console.log('🖼️ 切换混排方式:', {
                                mode: mode.value,
                                requiredCount,
                                oldCount: currentImages.length,
                                newCount: newImageList.length,
                                component: updatedComponent,
                              });

                              onUpdateComponent(updatedComponent);
                            }}
                          >
                            {/* 混排方式图标预览 */}
                            {(() => {
                              const renderModeIcon = (mode: string) => {
                                switch (mode) {
                                  case 'double':
                                    return (
                                      <div
                                        style={{
                                          width: '24px',
                                          height: '16px',
                                          display: 'flex',
                                          gap: '1px',
                                          margin: '0 auto 4px',
                                        }}
                                      >
                                        <div
                                          style={{
                                            width: '8px',
                                            height: '16px',
                                            backgroundColor: '#1890ff',
                                            borderRadius: '1px',
                                          }}
                                        />
                                        <div
                                          style={{
                                            width: '15px',
                                            height: '16px',
                                            backgroundColor: '#1890ff',
                                            borderRadius: '1px',
                                          }}
                                        />
                                      </div>
                                    );
                                  case 'triple':
                                    return (
                                      <div
                                        style={{
                                          width: '24px',
                                          height: '16px',
                                          display: 'flex',
                                          gap: '1px',
                                          margin: '0 auto 4px',
                                        }}
                                      >
                                        <div
                                          style={{
                                            width: '16px',
                                            height: '16px',
                                            backgroundColor: '#1890ff',
                                            borderRadius: '1px',
                                          }}
                                        />
                                        <div
                                          style={{
                                            width: '7px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '1px',
                                          }}
                                        >
                                          <div
                                            style={{
                                              width: '7px',
                                              height: '7.5px',
                                              backgroundColor: '#1890ff',
                                              borderRadius: '1px',
                                            }}
                                          />
                                          <div
                                            style={{
                                              width: '7px',
                                              height: '7.5px',
                                              backgroundColor: '#1890ff',
                                              borderRadius: '1px',
                                            }}
                                          />
                                        </div>
                                      </div>
                                    );
                                  case 'bisect_2':
                                    return (
                                      <div
                                        style={{
                                          width: '24px',
                                          height: '12px',
                                          display: 'flex',
                                          gap: '1px',
                                          margin: '0 auto 4px',
                                        }}
                                      >
                                        <div
                                          style={{
                                            width: '11.5px',
                                            height: '12px',
                                            backgroundColor: '#1890ff',
                                            borderRadius: '1px',
                                          }}
                                        />
                                        <div
                                          style={{
                                            width: '11.5px',
                                            height: '12px',
                                            backgroundColor: '#1890ff',
                                            borderRadius: '1px',
                                          }}
                                        />
                                      </div>
                                    );
                                  case 'bisect_4':
                                    return (
                                      <div
                                        style={{
                                          width: '20px',
                                          height: '20px',
                                          display: 'flex',
                                          flexDirection: 'column',
                                          gap: '1px',
                                          margin: '0 auto 4px',
                                        }}
                                      >
                                        <div
                                          style={{
                                            display: 'flex',
                                            gap: '1px',
                                            height: '9.5px',
                                          }}
                                        >
                                          <div
                                            style={{
                                              width: '9.5px',
                                              height: '9.5px',
                                              backgroundColor: '#1890ff',
                                              borderRadius: '1px',
                                            }}
                                          />
                                          <div
                                            style={{
                                              width: '9.5px',
                                              height: '9.5px',
                                              backgroundColor: '#1890ff',
                                              borderRadius: '1px',
                                            }}
                                          />
                                        </div>
                                        <div
                                          style={{
                                            display: 'flex',
                                            gap: '1px',
                                            height: '9.5px',
                                          }}
                                        >
                                          <div
                                            style={{
                                              width: '9.5px',
                                              height: '9.5px',
                                              backgroundColor: '#1890ff',
                                              borderRadius: '1px',
                                            }}
                                          />
                                          <div
                                            style={{
                                              width: '9.5px',
                                              height: '9.5px',
                                              backgroundColor: '#1890ff',
                                              borderRadius: '1px',
                                            }}
                                          />
                                        </div>
                                      </div>
                                    );
                                  case 'bisect_6':
                                    return (
                                      <div
                                        style={{
                                          width: '16px',
                                          height: '24px',
                                          display: 'flex',
                                          flexDirection: 'column',
                                          gap: '1px',
                                          margin: '0 auto 4px',
                                        }}
                                      >
                                        <div
                                          style={{
                                            display: 'flex',
                                            gap: '1px',
                                            height: '7.33px',
                                          }}
                                        >
                                          <div
                                            style={{
                                              width: '7.5px',
                                              height: '7.33px',
                                              backgroundColor: '#1890ff',
                                              borderRadius: '1px',
                                            }}
                                          />
                                          <div
                                            style={{
                                              width: '7.5px',
                                              height: '7.33px',
                                              backgroundColor: '#1890ff',
                                              borderRadius: '1px',
                                            }}
                                          />
                                        </div>
                                        <div
                                          style={{
                                            display: 'flex',
                                            gap: '1px',
                                            height: '7.33px',
                                          }}
                                        >
                                          <div
                                            style={{
                                              width: '7.5px',
                                              height: '7.33px',
                                              backgroundColor: '#1890ff',
                                              borderRadius: '1px',
                                            }}
                                          />
                                          <div
                                            style={{
                                              width: '7.5px',
                                              height: '7.33px',
                                              backgroundColor: '#1890ff',
                                              borderRadius: '1px',
                                            }}
                                          />
                                        </div>
                                        <div
                                          style={{
                                            display: 'flex',
                                            gap: '1px',
                                            height: '7.33px',
                                          }}
                                        >
                                          <div
                                            style={{
                                              width: '7.5px',
                                              height: '7.33px',
                                              backgroundColor: '#1890ff',
                                              borderRadius: '1px',
                                            }}
                                          />
                                          <div
                                            style={{
                                              width: '7.5px',
                                              height: '7.33px',
                                              backgroundColor: '#1890ff',
                                              borderRadius: '1px',
                                            }}
                                          />
                                        </div>
                                      </div>
                                    );
                                  case 'trisect_3':
                                    return (
                                      <div
                                        style={{
                                          width: '24px',
                                          height: '8px',
                                          display: 'flex',
                                          gap: '1px',
                                          margin: '0 auto 4px',
                                        }}
                                      >
                                        <div
                                          style={{
                                            width: '7.33px',
                                            height: '8px',
                                            backgroundColor: '#1890ff',
                                            borderRadius: '1px',
                                          }}
                                        />
                                        <div
                                          style={{
                                            width: '7.33px',
                                            height: '8px',
                                            backgroundColor: '#1890ff',
                                            borderRadius: '1px',
                                          }}
                                        />
                                        <div
                                          style={{
                                            width: '7.33px',
                                            height: '8px',
                                            backgroundColor: '#1890ff',
                                            borderRadius: '1px',
                                          }}
                                        />
                                      </div>
                                    );
                                  case 'trisect_6':
                                    return (
                                      <div
                                        style={{
                                          width: '24px',
                                          height: '16px',
                                          display: 'flex',
                                          flexDirection: 'column',
                                          gap: '1px',
                                          margin: '0 auto 4px',
                                        }}
                                      >
                                        <div
                                          style={{
                                            display: 'flex',
                                            gap: '1px',
                                            height: '7.5px',
                                          }}
                                        >
                                          <div
                                            style={{
                                              width: '7.33px',
                                              height: '7.5px',
                                              backgroundColor: '#1890ff',
                                              borderRadius: '1px',
                                            }}
                                          />
                                          <div
                                            style={{
                                              width: '7.33px',
                                              height: '7.5px',
                                              backgroundColor: '#1890ff',
                                              borderRadius: '1px',
                                            }}
                                          />
                                          <div
                                            style={{
                                              width: '7.33px',
                                              height: '7.5px',
                                              backgroundColor: '#1890ff',
                                              borderRadius: '1px',
                                            }}
                                          />
                                        </div>
                                        <div
                                          style={{
                                            display: 'flex',
                                            gap: '1px',
                                            height: '7.5px',
                                          }}
                                        >
                                          <div
                                            style={{
                                              width: '7.33px',
                                              height: '7.5px',
                                              backgroundColor: '#1890ff',
                                              borderRadius: '1px',
                                            }}
                                          />
                                          <div
                                            style={{
                                              width: '7.33px',
                                              height: '7.5px',
                                              backgroundColor: '#1890ff',
                                              borderRadius: '1px',
                                            }}
                                          />
                                          <div
                                            style={{
                                              width: '7.33px',
                                              height: '7.5px',
                                              backgroundColor: '#1890ff',
                                              borderRadius: '1px',
                                            }}
                                          />
                                        </div>
                                      </div>
                                    );
                                  case 'trisect_9':
                                    return (
                                      <div
                                        style={{
                                          width: '18px',
                                          height: '18px',
                                          display: 'flex',
                                          flexDirection: 'column',
                                          gap: '1px',
                                          margin: '0 auto 4px',
                                        }}
                                      >
                                        <div
                                          style={{
                                            display: 'flex',
                                            gap: '1px',
                                            height: '5.33px',
                                          }}
                                        >
                                          <div
                                            style={{
                                              width: '5.33px',
                                              height: '5.33px',
                                              backgroundColor: '#1890ff',
                                              borderRadius: '1px',
                                            }}
                                          />
                                          <div
                                            style={{
                                              width: '5.33px',
                                              height: '5.33px',
                                              backgroundColor: '#1890ff',
                                              borderRadius: '1px',
                                            }}
                                          />
                                          <div
                                            style={{
                                              width: '5.33px',
                                              height: '5.33px',
                                              backgroundColor: '#1890ff',
                                              borderRadius: '1px',
                                            }}
                                          />
                                        </div>
                                        <div
                                          style={{
                                            display: 'flex',
                                            gap: '1px',
                                            height: '5.33px',
                                          }}
                                        >
                                          <div
                                            style={{
                                              width: '5.33px',
                                              height: '5.33px',
                                              backgroundColor: '#1890ff',
                                              borderRadius: '1px',
                                            }}
                                          />
                                          <div
                                            style={{
                                              width: '5.33px',
                                              height: '5.33px',
                                              backgroundColor: '#1890ff',
                                              borderRadius: '1px',
                                            }}
                                          />
                                          <div
                                            style={{
                                              width: '5.33px',
                                              height: '5.33px',
                                              backgroundColor: '#1890ff',
                                              borderRadius: '1px',
                                            }}
                                          />
                                        </div>
                                        <div
                                          style={{
                                            display: 'flex',
                                            gap: '1px',
                                            height: '5.33px',
                                          }}
                                        >
                                          <div
                                            style={{
                                              width: '5.33px',
                                              height: '5.33px',
                                              backgroundColor: '#1890ff',
                                              borderRadius: '1px',
                                            }}
                                          />
                                          <div
                                            style={{
                                              width: '5.33px',
                                              height: '5.33px',
                                              backgroundColor: '#1890ff',
                                              borderRadius: '1px',
                                            }}
                                          />
                                          <div
                                            style={{
                                              width: '5.33px',
                                              height: '5.33px',
                                              backgroundColor: '#1890ff',
                                              borderRadius: '1px',
                                            }}
                                          />
                                        </div>
                                      </div>
                                    );
                                  default:
                                    return (
                                      <div
                                        style={{
                                          width: '24px',
                                          height: '16px',
                                          backgroundColor: '#d9d9d9',
                                          borderRadius: '2px',
                                          margin: '0 auto 4px',
                                        }}
                                      />
                                    );
                                }
                              };
                              return renderModeIcon(mode.value);
                            })()}
                            <div
                              style={{
                                fontSize: '10px',
                                color: '#666',
                                lineHeight: '1.2',
                              }}
                            >
                              {mode.label}
                            </div>
                            <div
                              style={{
                                fontSize: '9px',
                                color: '#999',
                                marginTop: '2px',
                              }}
                            >
                              {mode.description}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                key: 'images',
                label: '🖼️ 图片管理',
                children: (
                  <div>
                    <div style={{ marginBottom: '12px' }}>
                      <Text
                        style={{
                          fontSize: '12px',
                          color: '#666',
                          marginBottom: '8px',
                          display: 'block',
                        }}
                      >
                        当前混排方式:{' '}
                        <strong>
                          {(() => {
                            const displayMode = getDisplayCombinationMode(
                              imgCombComponent.combination_mode,
                              imgCombComponent.img_list?.length || 0,
                            );
                            const modeLabels = {
                              double: '双图模式（左小右大）',
                              triple: '三图模式（左1右2）',
                              bisect_2: '双列-2图（1行2列）',
                              bisect_4: '双列-4图（2行2列）',
                              bisect_6: '双列-6图（3行2列）',
                              trisect_3: '三列-3图（1行3列）',
                              trisect_6: '三列-6图（2行3列）',
                              trisect_9: '三列-9图（3行3列）',
                            };
                            return (
                              modeLabels[
                                displayMode as keyof typeof modeLabels
                              ] || displayMode
                            );
                          })()}
                        </strong>
                      </Text>
                      <Text
                        style={{
                          fontSize: '12px',
                          color: '#52c41a',
                          marginBottom: '8px',
                          display: 'block',
                        }}
                      >
                        图片数量:{' '}
                        <strong>
                          {(imgCombComponent.img_list || []).length}
                        </strong>{' '}
                        张
                      </Text>
                    </div>
                    {/* 所有混排模式都显示详细的图片管理界面 */}
                    {true ? (
                      // 所有混排模式 - 详细的图片管理
                      <div style={{ marginTop: '12px' }}>
                        {(imgCombComponent.img_list || []).map(
                          (img: any, index: number) => (
                            <div
                              key={index}
                              style={{
                                marginBottom: '16px',
                                padding: '12px',
                                backgroundColor: '#fafafa',
                                borderRadius: '6px',
                                border: '1px solid #f0f0f0',
                              }}
                            >
                              <div
                                style={{
                                  marginBottom: '8px',
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  color: '#333',
                                }}
                              >
                                图片{index + 1}
                              </div>

                              {/* 图片路径输入框 */}
                              <div style={{ marginBottom: '8px' }}>
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                >
                                  <Input
                                    value={img.img_url || ''}
                                    disabled={[
                                      'double',
                                      'triple',
                                      'bisect_2',
                                      'trisect_3',
                                    ].includes(
                                      getDisplayCombinationMode(
                                        imgCombComponent.combination_mode,
                                        imgCombComponent.img_list?.length || 0,
                                      ),
                                    )}
                                    onChange={(e) => {
                                      const newImgList = [
                                        ...(imgCombComponent.img_list || []),
                                      ];
                                      const newValue = e.target.value.trim();
                                      newImgList[index] = {
                                        ...newImgList[index],
                                        img_url: newValue || '',
                                        i18n_img_url: {
                                          ...newImgList[index]?.i18n_img_url,
                                          'en-US': newValue || '',
                                        },
                                      };
                                      const updatedComponent = {
                                        ...currentComponent,
                                        img_list: newImgList,
                                      };
                                      onUpdateComponent(updatedComponent);
                                    }}
                                    placeholder={
                                      [
                                        'double',
                                        'triple',
                                        'bisect_2',
                                        'trisect_3',
                                      ].includes(
                                        getDisplayCombinationMode(
                                          imgCombComponent.combination_mode,
                                          imgCombComponent.img_list?.length ||
                                            0,
                                        ),
                                      )
                                        ? '只能通过上传替换图片'
                                        : `请输入图片${index + 1}路径`
                                    }
                                    style={{ fontSize: '12px', flex: 1 }}
                                  />

                                  {/* 上传图标按钮 */}
                                  <Upload
                                    showUploadList={false}
                                    beforeUpload={(file) => {
                                      const reader = new FileReader();
                                      reader.onload = (e) => {
                                        const imageUrl = e.target
                                          ?.result as string;
                                        if (imageUrl) {
                                          // 更新指定索引的图片
                                          const newImgList = [
                                            ...(imgCombComponent.img_list ||
                                              []),
                                          ];
                                          newImgList[index] = {
                                            ...newImgList[index],
                                            img_url: imageUrl,
                                            i18n_img_url: {
                                              'en-US': imageUrl,
                                              ...(newImgList[index]
                                                ?.i18n_img_url || {}),
                                            },
                                          };

                                          const updatedComponent = {
                                            ...currentComponent,
                                            img_list: newImgList,
                                          };

                                          console.log(
                                            `🖼️ 上传图片${index + 1}:`,
                                            {
                                              fileName: file.name,
                                              imageUrl:
                                                imageUrl.substring(0, 50) +
                                                '...',
                                              component: updatedComponent,
                                            },
                                          );

                                          onUpdateComponent(updatedComponent);
                                          message.success(
                                            `图片${index + 1}上传成功`,
                                          );
                                        }
                                      };
                                      reader.readAsDataURL(file);
                                      return false; // 阻止默认上传行为
                                    }}
                                    accept="image/*"
                                  >
                                    <Button
                                      type="text"
                                      icon={<UploadOutlined />}
                                      size="small"
                                      style={{
                                        color: '#666',
                                        border: 'none',
                                        boxShadow: 'none',
                                        padding: '4px',
                                        minWidth: 'auto',
                                        height: 'auto',
                                      }}
                                      title="上传图片"
                                    />
                                  </Upload>
                                </div>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    ) : null}
                  </div>
                ),
              },
            ]}
          />
        </div>
      );
    }

    // 检查是否选中了下拉组件 - 使用currentComponent而不是selectedComponent
    const isSelectComponent =
      currentComponent &&
      (currentComponent.tag === 'select_static' ||
        currentComponent.tag === 'multi_select_static');

    // 如果选中了下拉组件，显示下拉编辑界面
    if (isSelectComponent) {
      const selectComponent = currentComponent as any;
      const options = selectComponent?.options || [];

      const handleAddOption = () => {
        const newOption = {
          value: `option_${Date.now()}`,
          text: {
            content: `选项${options.length + 1}`,
            i18n_content: {
              'en-US': `选项${options.length + 1}`,
            },
          },
        };
        const updatedOptions = [...options, newOption];
        handleValueChange('options', updatedOptions);
      };

      const handleUpdateOption = (index: number, field: string, value: any) => {
        const updatedOptions = [...options];
        if (field === 'content') {
          updatedOptions[index] = {
            ...updatedOptions[index],
            text: {
              ...updatedOptions[index].text,
              content: value,
              // 为单选和多选组件都同步更新国际化内容与content保持一致
              i18n_content: {
                'en-US': value,
              },
            },
          };
        } else if (field === 'value') {
          updatedOptions[index] = {
            ...updatedOptions[index],
            value: value,
          };
        }
        handleValueChange('options', updatedOptions);
      };

      const handleDeleteOption = (index: number) => {
        const updatedOptions = options.filter(
          (_: any, i: number) => i !== index,
        );
        handleValueChange('options', updatedOptions);
      };

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
              🎯 当前选中：
              {currentComponent.tag === 'multi_select_static'
                ? '下拉多选组件'
                : '下拉单选组件'}
            </Text>
          </div>
          <Collapse
            defaultActiveKey={['basic', 'options']}
            ghost
            items={[
              {
                key: 'basic',
                label: '🔧 基础设置',
                children: (
                  <Form form={form} layout="vertical">
                    <Form.Item label="是否必填">
                      <Switch
                        checked={selectComponent.required || false}
                        onChange={(checked) =>
                          handleValueChange('required', checked)
                        }
                      />
                    </Form.Item>
                  </Form>
                ),
              },
              {
                key: 'options',
                label: '📝 选项设置',
                children: (
                  <div>
                    <div style={{ marginBottom: '12px' }}>
                      <Button
                        type="dashed"
                        icon={<PlusOutlined />}
                        onClick={handleAddOption}
                        style={{ width: '100%' }}
                        size="small"
                      >
                        添加选项
                      </Button>
                    </div>
                    {options.length === 0 && (
                      <div
                        style={{
                          textAlign: 'center',
                          color: '#999',
                          padding: '20px 0',
                        }}
                      >
                        暂无选项，请点击上方按钮添加
                      </div>
                    )}
                    {options.map((option: any, index: number) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px',
                          border: '1px solid #d9d9d9',
                          borderRadius: '4px',
                          marginBottom: '8px',
                          backgroundColor: '#fafafa',
                        }}
                      >
                        <div
                          style={{
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#1890ff',
                            color: 'white',
                            borderRadius: '50%',
                            fontSize: '12px',
                            fontWeight: 'bold',
                          }}
                        >
                          {index + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <Input
                            placeholder="选项文本"
                            value={option.text?.content || ''}
                            onChange={(e) =>
                              handleUpdateOption(
                                index,
                                'content',
                                e.target.value,
                              )
                            }
                            style={{ marginBottom: '4px' }}
                            size="small"
                          />
                          <Input
                            placeholder="选项值"
                            value={option.value || ''}
                            onChange={(e) =>
                              handleUpdateOption(index, 'value', e.target.value)
                            }
                            size="small"
                          />
                        </div>
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleDeleteOption(index)}
                          size="small"
                        />
                      </div>
                    ))}
                  </div>
                ),
              },
            ]}
          />
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

      const imgSource = imageComponent.img_source || 'upload';
      const cropMode = imageComponent.crop_mode || 'default';

      // 添加调试信息
      console.log('🖼️ 图片组件属性面板数据:', {
        componentId: imageComponent.id,
        imgSource,
        img_name: imageComponent.img_name,
        variable_name: imageComponent.variable_name,
        cropMode,
        fullComponent: imageComponent,
      });

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
              🎯 当前选中：图片组件 (来源: {imgSource})
            </Text>
          </div>
          <Collapse
            defaultActiveKey={['source', 'display']}
            ghost
            items={[
              {
                key: 'source',
                label: '📁 图片来源',
                children: (
                  <Form form={form} layout="vertical">
                    <Form.Item label="图片来源">
                      <Switch
                        checked={imgSource === 'variable'}
                        onChange={(checked) => {
                          console.log('🔄 切换图片来源:', {
                            checked,
                            currentSource: imgSource,
                            newSource: checked ? 'variable' : 'upload',
                            componentId: imageComponent.id,
                          });

                          const newSource = checked ? 'variable' : 'upload';

                          // 创建更新后的组件
                          const updatedComponent = {
                            ...currentComponent,
                            img_source: newSource,
                            // 清除相关字段
                            ...(checked
                              ? { img_name: undefined }
                              : { variable_name: undefined }),
                          } as any;

                          console.log('🔄 Switch更新组件:', {
                            componentId: (updatedComponent as any).id,
                            newSource,
                            updatedFields: checked
                              ? { img_source: newSource, img_name: undefined }
                              : {
                                  img_source: newSource,
                                  variable_name: undefined,
                                },
                          });

                          onUpdateComponent(updatedComponent);

                          // 强制UI更新
                          setTimeout(() => {
                            forceUpdate((prev) => prev + 1);
                          }, 50);
                        }}
                        checkedChildren="绑定变量"
                        unCheckedChildren="文件"
                      />
                      {/* 显示当前状态调试信息 */}
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#666',
                          marginTop: '4px',
                        }}
                      >
                        当前模式:{' '}
                        {imgSource === 'variable'
                          ? '🔗 变量绑定'
                          : '📁 文件上传'}
                      </div>
                    </Form.Item>

                    {imgSource === 'upload' && (
                      <>
                        <Form.Item label="图片Key">
                          <Input
                            value={imageComponent.img_name || ''}
                            onChange={(e) => {
                              handleValueChange('img_name', e.target.value);
                            }}
                            placeholder="请输入图片Key名称"
                            addonAfter={
                              <Upload
                                accept="image/*"
                                showUploadList={false}
                                beforeUpload={(file) => {
                                  console.log('📤 开始上传图片:', {
                                    fileName: file.name,
                                    fileSize: file.size,
                                    fileType: file.type,
                                    componentId: imageComponent.id,
                                  });

                                  // 处理文件上传逻辑
                                  const reader = new FileReader();
                                  reader.onload = (e) => {
                                    const dataUrl = e.target?.result as string;
                                    console.log('📷 图片读取完成:', {
                                      fileName: file.name,
                                      dataUrlLength: dataUrl.length,
                                      componentId: imageComponent.id,
                                    });

                                    // 批量更新图片属性
                                    const updatedComponent = {
                                      ...currentComponent,
                                      img_url: dataUrl,
                                      img_name: file.name,
                                    } as any;

                                    console.log('🔄 批量更新图片组件:', {
                                      componentId: (updatedComponent as any).id,
                                      img_url: dataUrl.substring(0, 50) + '...',
                                      img_name: file.name,
                                      oldImgUrl:
                                        imageComponent.img_url?.substring(
                                          0,
                                          50,
                                        ) + '...',
                                      oldImgName: imageComponent.img_name,
                                    });

                                    onUpdateComponent(updatedComponent);

                                    // 强制UI更新
                                    setTimeout(() => {
                                      forceUpdate((prev) => prev + 1);
                                    }, 100);
                                  };

                                  reader.onerror = (error) => {
                                    console.error('❌ 图片读取失败:', error);
                                    message.error('图片读取失败，请重试');
                                  };

                                  reader.readAsDataURL(file);
                                  return false; // 阻止自动上传
                                }}
                              >
                                <Button size="small" type="primary">
                                  上传
                                </Button>
                              </Upload>
                            }
                          />
                        </Form.Item>
                      </>
                    )}

                    {imgSource === 'variable' && (
                      <Form.Item label="绑定变量">
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <Select
                            style={{ flex: 1 }}
                            value={imageComponent.variable_name}
                            onChange={(value) => {
                              handleValueChange('variable_name', value);
                              // 从变量中获取图片URL
                              const selectedVariable = variables.find((v) => {
                                if (typeof v === 'object' && v !== null) {
                                  return Object.keys(v as any).includes(value);
                                }
                                return (v as any).name === value;
                              });
                              if (selectedVariable) {
                                let imgUrl = '';
                                if (
                                  typeof selectedVariable === 'object' &&
                                  selectedVariable !== null
                                ) {
                                  imgUrl = (selectedVariable as any)[value];
                                } else {
                                  imgUrl = (selectedVariable as any).value;
                                }
                                if (imgUrl) {
                                  handleValueChange('img_url', imgUrl);
                                }
                              }
                            }}
                            placeholder="请选择变量"
                            allowClear
                          >
                            {variables.map((variable, index) => {
                              let variableName = '';
                              if (
                                typeof variable === 'object' &&
                                variable !== null
                              ) {
                                const keys = Object.keys(variable as any);
                                variableName =
                                  keys.length > 0 ? keys[0] : '未命名变量';
                              } else {
                                variableName =
                                  (variable as any).name || '未命名变量';
                              }
                              return (
                                <Option
                                  key={`${variableName}-${index}`}
                                  value={variableName}
                                >
                                  {variableName}
                                </Option>
                              );
                            })}
                          </Select>
                          <Button
                            type="dashed"
                            onClick={() => {
                              setIsAddVariableModalVisible(true);
                            }}
                          >
                            新增
                          </Button>
                        </div>
                      </Form.Item>
                    )}
                  </Form>
                ),
              },
              {
                key: 'display',
                label: '🎨 显示设置',
                children: (
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

                    <Form.Item label="尺寸设置">
                      <div
                        style={{
                          display: 'flex',
                          gap: '8px',
                          alignItems: 'center',
                        }}
                      >
                        <Input
                          placeholder="宽度"
                          value={imageComponent.width || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            handleValueChange(
                              'width',
                              value ? parseInt(value) : undefined,
                            );
                          }}
                          addonAfter="px"
                          type="number"
                        />
                        <span>×</span>
                        <Input
                          placeholder="高度"
                          value={imageComponent.height || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            handleValueChange(
                              'height',
                              value ? parseInt(value) : undefined,
                            );
                          }}
                          addonAfter="px"
                          type="number"
                        />
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#999',
                          marginTop: '4px',
                        }}
                      >
                        留空则使用默认尺寸
                      </div>
                    </Form.Item>
                  </Form>
                ),
              },
            ]}
          />
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
      <div style={{ padding: '16px' }}>
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
            🎯 当前选中：{currentComponent?.tag || '未知'}组件
          </Text>
        </div>
        {/* 通用组件属性配置 */}
        <Collapse
          defaultActiveKey={['basic', 'style']}
          ghost
          items={[
            {
              key: 'basic',
              label: '🔧 基础设置',
              children: (
                <Form form={form} layout="vertical">
                  <Form.Item label="组件名称">
                    <Input
                      value={(currentComponent as any)?.name || ''}
                      onChange={(e) =>
                        handleValueChange('name', e.target.value)
                      }
                      placeholder="请输入组件名称"
                      maxLength={50}
                    />
                  </Form.Item>
                  {(currentComponent as any)?.content !== undefined && (
                    <Form.Item label="内容">
                      <Input.TextArea
                        value={(currentComponent as any)?.content || ''}
                        onChange={(e) =>
                          handleValueChange('content', e.target.value)
                        }
                        placeholder="请输入内容"
                        maxLength={500}
                        rows={4}
                      />
                    </Form.Item>
                  )}
                </Form>
              ),
            },
            {
              key: 'style',
              label: '🎨 样式设置',
              children: (
                <Form form={form} layout="vertical">
                  <Form.Item label="字体大小">
                    <InputNumber
                      value={
                        (currentComponent as any)?.style?.fontSize ||
                        (currentComponent as any)?.fontSize ||
                        14
                      }
                      onChange={(value) => handleValueChange('fontSize', value)}
                      min={8}
                      max={72}
                      addonAfter="px"
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                  <Form.Item label="文字颜色">
                    <ColorPicker
                      value={
                        (currentComponent as any)?.style?.color ||
                        (currentComponent as any)?.color ||
                        '#000000'
                      }
                      onChange={(color) => {
                        const colorString =
                          typeof color === 'string'
                            ? color
                            : color.toHexString();
                        handleValueChange('color', colorString);
                      }}
                      showText
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                  <Form.Item label="文字对齐">
                    <Select
                      value={
                        (currentComponent as any)?.style?.textAlign ||
                        (currentComponent as any)?.textAlign ||
                        'left'
                      }
                      onChange={(value) =>
                        handleValueChange('textAlign', value)
                      }
                      style={{ width: '100%' }}
                    >
                      <Option value="left">
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <div style={{ fontSize: '16px' }}>⬅️</div>
                          <span>左对齐</span>
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
                          <div style={{ fontSize: '16px' }}>⬆️</div>
                          <span>居中对齐</span>
                        </div>
                      </Option>
                      <Option value="right">
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <div style={{ fontSize: '16px' }}>➡️</div>
                          <span>右对齐</span>
                        </div>
                      </Option>
                    </Select>
                  </Form.Item>
                </Form>
              ),
            },
          ]}
        />
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
                  const keys = Object.keys(variable as VariableObject);
                  if (keys.length > 0) {
                    variableName = keys[0];
                    variableValue = (variable as VariableObject)[variableName];

                    // 根据值的类型推断变量类型
                    if (typeof variableValue === 'string') {
                      variableType = 'text';
                    } else if (typeof variableValue === 'number') {
                      variableType = 'number';
                    } else if (typeof variableValue === 'boolean') {
                      variableType = 'boolean';
                    } else if (Array.isArray(variableValue)) {
                      variableType = 'array';
                    } else if (typeof variableValue === 'object') {
                      variableType = 'object';
                    } else {
                      variableType = 'text';
                    }
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
                  variableType = varAsVariable.type || 'text';
                }

                return (
                  <div
                    key={`${variableName}-${index}`}
                    className="variable-item"
                    style={{
                      padding: '12px 16px',
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
                        {variableName}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#8c8c8c',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={
                          typeof variableValue === 'object'
                            ? JSON.stringify(variableValue)
                            : String(variableValue)
                        }
                      >
                        {typeof variableValue === 'object'
                          ? JSON.stringify(variableValue)
                          : String(variableValue) || '暂无描述'}
                      </div>
                    </div>

                    {/* 中间：变量类型 */}
                    <div style={{ margin: '0 12px' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 500,
                          backgroundColor: getTypeColor(variableType).bg,
                          color: getTypeColor(variableType).text,
                        }}
                      >
                        {getTypeLabel(variableType)}
                      </span>
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
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          // 创建兼容的Variable对象用于编辑
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
                          };
                          handleEditVariable(editVariable);
                        }}
                        style={{
                          padding: '4px 8px',
                          height: '24px',
                          minWidth: '24px',
                        }}
                      />
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteVariable(index);
                        }}
                        style={{
                          padding: '4px 8px',
                          height: '24px',
                          minWidth: '24px',
                        }}
                      />
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

    console.log('🔗 卡片链接配置渲染:', {
      cardData: cardData,
      cardLink: cardLink,
      multiUrl: multiUrl,
      hasCardData: !!cardData,
    });

    // 更新卡片链接数据的函数
    const updateCardLink = (field: string, value: string) => {
      if (!cardData) {
        console.warn('⚠️ cardData不存在，无法更新卡片链接');
        return;
      }

      console.log('🔄 更新卡片链接:', {
        field,
        value,
        oldValue: multiUrl[field],
        currentCardLink: cardLink,
        currentMultiUrl: multiUrl,
      });

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

      console.log('📝 更新后的卡片数据:', {
        field,
        value,
        updatedCardLink: updatedCardData.dsl.card_link,
        updatedMultiUrl: updatedCardData.dsl.card_link.multi_url,
      });

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
            ? mapVariableTypeToInitialType(editingVariable.type)
            : undefined
        }
        editingVariable={editingVariable}
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
          setIsAddVariableModalVisible(true);
        }}
      />
    </div>
  );
};
