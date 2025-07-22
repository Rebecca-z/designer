// card-designer-property-panel-updated.tsx - 完整的修复表单容器数据结构问题的属性面板

import {
  AppstoreOutlined,
  BarsOutlined,
  BgColorsOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SettingOutlined,
  SkinOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Collapse,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Switch,
  Tabs,
  Tree,
  Typography,
} from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { useDrag } from 'react-dnd';
import {
  COMPONENT_CATEGORIES,
  COMPONENT_TYPES,
  DEFAULT_CARD_DATA,
} from './card-designer-constants-updated';
import PaddingEditor from './card-designer-padding-editor';
import {
  CardDesignData,
  CardPadding,
  ComponentType,
  Variable,
} from './card-designer-types-updated';

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
    <div style={{ padding: '16px' }}>
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

  if (selectedPath.length < 4) {
    return { component: null, realPath: null };
  }

  // 检查是否是卡片根元素路径：['dsl', 'body', 'elements', index]
  if (
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
        });
        return { component, realPath: selectedPath };
      }
    }
  }

  // 检查是否是分栏内的组件路径：['dsl', 'body', 'elements', columnSetIndex, 'columns', columnIndex, 'elements', componentIndex]
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
          console.log('📐 分栏内组件:', {
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
            {component.name && (
              <Text type="secondary" style={{ fontSize: '11px' }}>
                ({component.name})
              </Text>
            )}
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
                    📐 第{colIndex + 1}列 ({column.elements.length}个组件)
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
          <Text type="secondary" style={{ fontSize: '11px' }}>
            ({data.dsl.body.elements.length}个组件)
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
        width: '280px',
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

// 新增变量弹窗组件
const AddVariableModal: React.FC<{
  visible: boolean;
  newVariable: {
    name: string;
    type: 'text' | 'object';
    description: string;
    mockData: string;
  };
  onOk: () => void;
  onCancel: () => void;
  onChange: (field: string, value: any) => void;
}> = ({ visible, newVariable, onOk, onCancel, onChange }) => {
  return (
    <Modal
      title="新增变量"
      open={visible}
      onOk={onOk}
      onCancel={onCancel}
      okText="确定"
      cancelText="取消"
      width={500}
    >
      <Form layout="vertical">
        <Form.Item label="类型" required>
          <Select
            value={newVariable.type}
            onChange={(value) => onChange('type', value)}
            style={{ width: '100%' }}
          >
            <Option value="text">文本</Option>
            <Option value="object">数组对象</Option>
          </Select>
        </Form.Item>

        <Form.Item label="变量名称" required>
          <Input
            value={newVariable.name}
            onChange={(e) => onChange('name', e.target.value)}
            placeholder="请输入变量名称"
          />
        </Form.Item>

        <Form.Item label="变量描述">
          <Input.TextArea
            value={newVariable.description}
            onChange={(e) => onChange('description', e.target.value)}
            placeholder="请输入变量描述"
            rows={3}
          />
        </Form.Item>

        <Form.Item label="模拟数据" required>
          <Input.TextArea
            value={newVariable.mockData}
            onChange={(e) => onChange('mockData', e.target.value)}
            placeholder="请输入模拟数据"
            rows={3}
          />
        </Form.Item>
      </Form>
    </Modal>
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

// 右侧属性面板 - 修复数据更新逻辑
export const PropertyPanel: React.FC<{
  selectedComponent: ComponentType | null;
  selectedPath: (string | number)[] | null;
  onUpdateComponent: (component: ComponentType) => void;
  onUpdateCard: (updates: any) => void;
  variables: Variable[];
  onUpdateVariables: (variables: Variable[]) => void;
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
  cardVerticalSpacing,
  cardPadding,
  headerData,
  cardData,
}) => {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState<string>('properties');
  const [topLevelTab, setTopLevelTab] = useState<string>('component'); // 新增顶层Tab状态

  // 新增变量弹窗状态
  const [isAddVariableModalVisible, setIsAddVariableModalVisible] =
    useState(false);
  const [newVariable, setNewVariable] = useState<{
    name: string;
    type: 'text' | 'object';
    description: string;
    mockData: string;
  }>({
    name: '',
    type: 'text',
    description: '',
    mockData: '',
  });

  // 事件管理相关状态
  const [isEventEditModalVisible, setIsEventEditModalVisible] = useState(false);
  const [currentEventAction, setCurrentEventAction] = useState<EventAction>({
    id: '',
    type: 'callback',
    action: 'callback',
    paramType: 'string',
    paramValue: '',
    confirmDialog: false,
  });
  const [editingActionIndex, setEditingActionIndex] = useState<number>(-1);

  // 获取真实的组件和路径
  const { component: realComponent, realPath } = getComponentRealPath(
    cardData || DEFAULT_CARD_DATA,
    selectedPath,
  );

  // 检查是否选中了卡片本身
  const isCardSelected =
    selectedPath &&
    selectedPath.length === 2 &&
    selectedPath[0] === 'dsl' &&
    selectedPath[1] === 'body';

  // 总是使用从cardData中获取的真实组件数据
  const currentComponent = realComponent;

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

  // 当选中卡片时，自动切换到样式Tab
  useEffect(() => {
    if (isCardSelected && activeTab !== 'styles') {
      console.log('🎯 检测到卡片选中，自动切换到样式Tab');
      setActiveTab('styles');
    }
  }, [isCardSelected, activeTab]);

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
      // 样式相关字段需要保存到style对象中
      const styleFields = [
        'fontSize',
        'fontWeight',
        'textAlign',
        'textColor',
        'numberOfLines',
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
    const updatedCardData = {
      ...cardData,
      dsl: {
        ...cardData.dsl,
        header: {
          ...cardData.dsl.header,
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
    const updatedCardData = {
      ...cardData,
      dsl: {
        ...cardData.dsl,
        header: {
          ...cardData.dsl.header,
          [parentField]: {
            ...cardData.dsl.header[parentField],
            [field]: value,
          },
        },
      },
    };
    onUpdateCard({ cardData: updatedCardData });
  };

  const handleNestedValueChange = (
    parentField: string,
    field: string,
    value: any,
  ) => {
    if (currentComponent) {
      const updated = {
        ...currentComponent,
        [parentField]: {
          ...(currentComponent as any)[parentField],
          [field]: value,
        },
      };
      onUpdateComponent(updated);
    }
  };

  const handleAddVariable = () => {
    const newVariable: Variable = {
      name: `变量${variables.length + 1}`,
      value: '',
      type: 'text',
    };
    onUpdateVariables([...variables, newVariable]);
  };

  // 新增变量相关函数
  const handleAddVariableFromModal = () => {
    const variable: Variable = {
      name: newVariable.name,
      value: newVariable.mockData,
      type: newVariable.type,
    };

    onUpdateVariables([...variables, variable]);

    // 重置表单并关闭弹窗
    setNewVariable({
      name: '',
      type: 'text',
      description: '',
      mockData: '',
    });
    setIsAddVariableModalVisible(false);
  };

  const handleCancelAddVariableModal = () => {
    setNewVariable({
      name: '',
      type: 'text',
      description: '',
      mockData: '',
    });
    setIsAddVariableModalVisible(false);
  };

  const renderProperties = () => {
    // 如果选中了卡片本身，显示提示信息
    if (isCardSelected) {
      return (
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <SkinOutlined
            style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }}
          />
          <div style={{ color: '#999', marginBottom: '8px', fontSize: '16px' }}>
            已自动切换到样式配置
          </div>
          <div style={{ color: '#ccc', fontSize: '12px' }}>
            卡片级别的属性配置已移至样式Tab
          </div>
          <div
            style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '6px',
            }}
          >
            <Text style={{ fontSize: '12px', color: '#0369a1' }}>
              💡 提示：当前在样式Tab中，可以配置卡片的间距、内边距和样式
            </Text>
          </div>
        </div>
      );
    }

    // 如果没有选中组件，显示提示
    if (!currentComponent) {
      return (
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <AppstoreOutlined
            style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }}
          />
          <div style={{ color: '#999', marginBottom: '8px', fontSize: '16px' }}>
            请选择一个组件
          </div>
          <div style={{ color: '#ccc', fontSize: '12px' }}>
            点击画布中的组件或卡片开始配置属性
          </div>
          <div
            style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '6px',
            }}
          >
            <Text style={{ fontSize: '12px', color: '#0369a1' }}>
              💡 提示：点击卡片可以配置垂直间距和内边距
            </Text>
          </div>
        </div>
      );
    }

    const { tag } = currentComponent;
    const comp = currentComponent as any;

    switch (tag) {
      case 'form':
        return (
          <div style={{ padding: '16px' }}>
            <Collapse
              defaultActiveKey={['basic']}
              ghost
              items={[
                {
                  key: 'basic',
                  label: '⚙️ 基础设置',
                  children: (
                    <Form form={form} layout="vertical">
                      <Form.Item label="表单名称">
                        <Input
                          value={comp.name || ''}
                          onChange={(e) =>
                            handleValueChange('name', e.target.value)
                          }
                          placeholder="请输入表单名称"
                        />
                      </Form.Item>
                    </Form>
                  ),
                },
              ]}
            />

            {/* 显示表单内组件数量 */}
            <div
              style={{
                marginTop: '16px',
                padding: '12px',
                backgroundColor: '#f6ffed',
                border: '1px solid #b7eb8f',
                borderRadius: '6px',
              }}
            >
              <Text style={{ fontSize: '12px', color: '#52c41a' }}>
                📊 表单状态：包含 {comp.elements?.length || 0} 个组件
              </Text>
            </div>
          </div>
        );

      case 'column_set':
        return (
          <div style={{ padding: '16px' }}>
            <Collapse
              defaultActiveKey={['layout']}
              ghost
              items={[
                {
                  key: 'layout',
                  label: '🏗️ 布局设置',
                  children: (
                    <Form form={form} layout="vertical">
                      <Form.Item label="列数">
                        <InputNumber
                          value={comp.columns?.length || 2}
                          onChange={(value) => {
                            const newColumns = Array(value)
                              .fill(null)
                              .map((_, index) => ({
                                tag: 'column',
                                elements: comp.columns?.[index]?.elements || [],
                              }));
                            handleValueChange('columns', newColumns);
                          }}
                          min={1}
                          max={6}
                          style={{ width: '100%' }}
                        />
                      </Form.Item>
                      <Form.Item label="列间距">
                        <InputNumber
                          value={comp.gap || 8}
                          onChange={(value) =>
                            handleValueChange('gap', value || 8)
                          }
                          min={0}
                          max={50}
                          style={{ width: '100%' }}
                          addonAfter="px"
                        />
                      </Form.Item>
                    </Form>
                  ),
                },
              ]}
            />

            {/* 显示分栏状态 */}
            <div
              style={{
                marginTop: '16px',
                padding: '12px',
                backgroundColor: '#f0e6ff',
                border: '1px solid #d3adf7',
                borderRadius: '6px',
              }}
            >
              <Text style={{ fontSize: '12px', color: '#722ed1' }}>
                📊 分栏状态：{comp.columns?.length || 0} 列，共{' '}
                {comp.columns?.reduce(
                  (total: number, col: any) =>
                    total + (col.elements?.length || 0),
                  0,
                ) || 0}{' '}
                个组件
              </Text>
            </div>
          </div>
        );

      case 'plain_text':
        return (
          <div style={{ padding: '16px' }}>
            <Collapse
              defaultActiveKey={['content', 'style']}
              ghost
              items={[
                {
                  key: 'content',
                  label: '📝 内容设置',
                  children: (
                    <Form form={form} layout="vertical">
                      <Form.Item label="文本内容">
                        <Input.TextArea
                          value={comp.content || ''}
                          onChange={(e) =>
                            handleValueChange('content', e.target.value)
                          }
                          placeholder="请输入文本内容"
                          rows={3}
                          showCount
                          maxLength={500}
                        />
                      </Form.Item>
                      <Form.Item label="英文内容">
                        <Input.TextArea
                          value={comp.i18n_content?.['en-US'] || ''}
                          onChange={(e) => {
                            const updated = {
                              ...comp.i18n_content,
                              'en-US': e.target.value,
                            };
                            handleValueChange('i18n_content', updated);
                          }}
                          placeholder="请输入英文内容"
                          rows={2}
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
                      <Form.Item label="字体大小">
                        <Select
                          value={(comp as any).style?.fontSize || 14}
                          onChange={(value) =>
                            handleValueChange('fontSize', value)
                          }
                          style={{ width: '100%' }}
                        >
                          <Option value={14}>正文14px</Option>
                          <Option value={16}>标题16px</Option>
                          <Option value={12}>辅助信息12px</Option>
                        </Select>
                      </Form.Item>
                      <Form.Item label="文本对齐">
                        <Select
                          value={(comp as any).style?.textAlign || 'left'}
                          onChange={(value) =>
                            handleValueChange('textAlign', value)
                          }
                          style={{ width: '100%' }}
                        >
                          <Option value="left">左对齐</Option>
                          <Option value="center">居中</Option>
                          <Option value="right">右对齐</Option>
                        </Select>
                      </Form.Item>
                      <Form.Item label="最大显示行数">
                        <InputNumber
                          value={(comp as any).style?.numberOfLines || 1}
                          onChange={(value) =>
                            handleValueChange('numberOfLines', value || 1)
                          }
                          min={1}
                          max={10}
                          style={{ width: '100%' }}
                          addonAfter="行"
                        />
                      </Form.Item>
                    </Form>
                  ),
                },
              ]}
            />
          </div>
        );

      case 'input':
        return (
          <div style={{ padding: '16px' }}>
            <Collapse
              defaultActiveKey={['basic', 'validation']}
              ghost
              items={[
                {
                  key: 'basic',
                  label: '⚙️ 基础设置',
                  children: (
                    <Form form={form} layout="vertical">
                      <Form.Item label="字段名称">
                        <Input
                          value={comp.name || ''}
                          onChange={(e) =>
                            handleValueChange('name', e.target.value)
                          }
                          placeholder="请输入字段名称"
                        />
                      </Form.Item>
                      <Form.Item label="占位符">
                        <Input
                          value={comp.placeholder?.content || ''}
                          onChange={(e) => {
                            handleNestedValueChange(
                              'placeholder',
                              'content',
                              e.target.value,
                            );
                          }}
                          placeholder="请输入占位符文本"
                        />
                      </Form.Item>
                      <Form.Item label="默认值">
                        <Input
                          value={comp.default_value?.content || ''}
                          onChange={(e) => {
                            handleNestedValueChange(
                              'default_value',
                              'content',
                              e.target.value,
                            );
                          }}
                          placeholder="请输入默认值"
                        />
                      </Form.Item>
                      <Form.Item label="输入类型">
                        <Select
                          value={comp.inputType || 'text'}
                          onChange={(value) =>
                            handleValueChange('inputType', value)
                          }
                          style={{ width: '100%' }}
                        >
                          <Option value="text">文本</Option>
                          <Option value="password">密码</Option>
                          <Option value="number">数字</Option>
                          <Option value="email">邮箱</Option>
                          <Option value="tel">电话</Option>
                        </Select>
                      </Form.Item>
                    </Form>
                  ),
                },
                {
                  key: 'validation',
                  label: '✅ 验证设置',
                  children: (
                    <Form form={form} layout="vertical">
                      <Form.Item label="必填项">
                        <Switch
                          checked={comp.required || false}
                          onChange={(checked) =>
                            handleValueChange('required', checked)
                          }
                        />
                      </Form.Item>
                    </Form>
                  ),
                },
              ]}
            />
          </div>
        );

      case 'button':
        return (
          <div style={{ padding: '16px' }}>
            <Collapse
              defaultActiveKey={['basic', 'style']}
              ghost
              items={[
                {
                  key: 'basic',
                  label: '⚙️ 基础设置',
                  children: (
                    <Form form={form} layout="vertical">
                      <Form.Item label="按钮名称">
                        <Input
                          value={comp.name || ''}
                          onChange={(e) =>
                            handleValueChange('name', e.target.value)
                          }
                          placeholder="请输入按钮名称"
                        />
                      </Form.Item>
                      <Form.Item label="按钮文本">
                        <Input
                          value={comp.text?.content || ''}
                          onChange={(e) => {
                            handleNestedValueChange(
                              'text',
                              'content',
                              e.target.value,
                            );
                          }}
                          placeholder="请输入按钮文本"
                        />
                      </Form.Item>
                      <Form.Item label="表单操作类型">
                        <Select
                          value={comp.form_action_type || ''}
                          onChange={(value) =>
                            handleValueChange('form_action_type', value)
                          }
                          style={{ width: '100%' }}
                          allowClear
                          placeholder="选择表单操作类型"
                        >
                          <Option value="submit">提交</Option>
                          <Option value="reset">重置</Option>
                        </Select>
                      </Form.Item>
                    </Form>
                  ),
                },
                {
                  key: 'style',
                  label: '🎨 样式设置',
                  children: (
                    <Form form={form} layout="vertical">
                      <Form.Item label="按钮类型">
                        <Select
                          value={(comp as any).style?.type || 'primary'}
                          onChange={(value) => handleValueChange('type', value)}
                          style={{ width: '100%' }}
                        >
                          <Option value="primary">主要按钮</Option>
                          <Option value="default">默认按钮</Option>
                          <Option value="dashed">虚线按钮</Option>
                          <Option value="text">文本按钮</Option>
                          <Option value="link">链接按钮</Option>
                        </Select>
                      </Form.Item>
                      <Form.Item label="按钮尺寸">
                        <Select
                          value={(comp as any).style?.size || 'middle'}
                          onChange={(value) => handleValueChange('size', value)}
                          style={{ width: '100%' }}
                        >
                          <Option value="small">小号</Option>
                          <Option value="middle">中号</Option>
                          <Option value="large">大号</Option>
                        </Select>
                      </Form.Item>
                      <Form.Item label="危险按钮">
                        <Switch
                          checked={comp.danger || false}
                          onChange={(checked) =>
                            handleValueChange('danger', checked)
                          }
                        />
                      </Form.Item>
                    </Form>
                  ),
                },
              ]}
            />
          </div>
        );

      case 'select_static':
        return (
          <div style={{ padding: '16px' }}>
            <Collapse
              defaultActiveKey={['basic', 'options']}
              ghost
              items={[
                {
                  key: 'basic',
                  label: '⚙️ 基础设置',
                  children: (
                    <Form form={form} layout="vertical">
                      <Form.Item label="字段名称">
                        <Input
                          value={comp.name || ''}
                          onChange={(e) =>
                            handleValueChange('name', e.target.value)
                          }
                          placeholder="请输入字段名称"
                        />
                      </Form.Item>
                      <Form.Item label="必填项">
                        <Switch
                          checked={comp.required || false}
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
                  label: '📋 选项设置',
                  children: (
                    <div>
                      <div style={{ marginBottom: '12px' }}>
                        <Button
                          type="dashed"
                          onClick={() => {
                            const newOptions = [
                              ...(comp.options || []),
                              {
                                value: `option_${Date.now()}`,
                                text: { content: '新选项' },
                              },
                            ];
                            handleValueChange('options', newOptions);
                          }}
                          style={{ width: '100%' }}
                          size="small"
                        >
                          添加选项
                        </Button>
                      </div>
                      {(comp.options || []).map(
                        (option: any, index: number) => (
                          <Card
                            key={index}
                            size="small"
                            style={{ marginBottom: '8px' }}
                          >
                            <Row gutter={8}>
                              <Col span={10}>
                                <Input
                                  placeholder="选项值"
                                  value={option.value || ''}
                                  onChange={(e) => {
                                    const newOptions = [
                                      ...(comp.options || []),
                                    ];
                                    newOptions[index] = {
                                      ...option,
                                      value: e.target.value,
                                    };
                                    handleValueChange('options', newOptions);
                                  }}
                                  size="small"
                                />
                              </Col>
                              <Col span={10}>
                                <Input
                                  placeholder="选项文本"
                                  value={option.text?.content || ''}
                                  onChange={(e) => {
                                    const newOptions = [
                                      ...(comp.options || []),
                                    ];
                                    newOptions[index] = {
                                      ...option,
                                      text: { content: e.target.value },
                                    };
                                    handleValueChange('options', newOptions);
                                  }}
                                  size="small"
                                />
                              </Col>
                              <Col span={4}>
                                <Button
                                  type="text"
                                  danger
                                  size="small"
                                  onClick={() => {
                                    const newOptions = (
                                      comp.options || []
                                    ).filter(
                                      (_: any, i: number) => i !== index,
                                    );
                                    handleValueChange('options', newOptions);
                                  }}
                                >
                                  删除
                                </Button>
                              </Col>
                            </Row>
                          </Card>
                        ),
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </div>
        );

      case 'multi_select_static':
        return (
          <div style={{ padding: '16px' }}>
            <Collapse
              defaultActiveKey={['basic', 'options']}
              ghost
              items={[
                {
                  key: 'basic',
                  label: '⚙️ 基础设置',
                  children: (
                    <Form form={form} layout="vertical">
                      <Form.Item label="字段名称">
                        <Input
                          value={comp.name || ''}
                          onChange={(e) =>
                            handleValueChange('name', e.target.value)
                          }
                          placeholder="请输入字段名称"
                        />
                      </Form.Item>
                      <Form.Item label="必填项">
                        <Switch
                          checked={comp.required || false}
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
                  label: '📋 选项设置',
                  children: (
                    <div>
                      <div style={{ marginBottom: '12px' }}>
                        <Button
                          type="dashed"
                          onClick={() => {
                            const newOptions = [
                              ...(comp.options || []),
                              {
                                value: `option_${Date.now()}`,
                                text: { content: '新选项' },
                              },
                            ];
                            handleValueChange('options', newOptions);
                          }}
                          style={{ width: '100%' }}
                          size="small"
                        >
                          添加选项
                        </Button>
                      </div>
                      {(comp.options || []).map(
                        (option: any, index: number) => (
                          <Card
                            key={index}
                            size="small"
                            style={{ marginBottom: '8px' }}
                          >
                            <Row gutter={8}>
                              <Col span={10}>
                                <Input
                                  placeholder="选项值"
                                  value={option.value || ''}
                                  onChange={(e) => {
                                    const newOptions = [
                                      ...(comp.options || []),
                                    ];
                                    newOptions[index] = {
                                      ...option,
                                      value: e.target.value,
                                    };
                                    handleValueChange('options', newOptions);
                                  }}
                                  size="small"
                                />
                              </Col>
                              <Col span={10}>
                                <Input
                                  placeholder="选项文本"
                                  value={option.text?.content || ''}
                                  onChange={(e) => {
                                    const newOptions = [
                                      ...(comp.options || []),
                                    ];
                                    newOptions[index] = {
                                      ...option,
                                      text: { content: e.target.value },
                                    };
                                    handleValueChange('options', newOptions);
                                  }}
                                  size="small"
                                />
                              </Col>
                              <Col span={4}>
                                <Button
                                  type="text"
                                  danger
                                  size="small"
                                  onClick={() => {
                                    const newOptions = (
                                      comp.options || []
                                    ).filter(
                                      (_: any, i: number) => i !== index,
                                    );
                                    handleValueChange('options', newOptions);
                                  }}
                                >
                                  删除
                                </Button>
                              </Col>
                            </Row>
                          </Card>
                        ),
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </div>
        );

      case 'img':
        return (
          <div style={{ padding: '16px' }}>
            <Collapse
              defaultActiveKey={['basic', 'size']}
              ghost
              items={[
                {
                  key: 'basic',
                  label: '🖼️ 图片设置',
                  children: (
                    <Form form={form} layout="vertical">
                      <Form.Item label="图片来源">
                        <Select
                          value={comp.img_source || 'upload'}
                          onChange={(value) =>
                            handleValueChange('img_source', value)
                          }
                          style={{ width: '100%' }}
                        >
                          <Option value="upload">上传文件</Option>
                          <Option value="variable">绑定变量</Option>
                        </Select>
                      </Form.Item>

                      <Form.Item label="图片名称">
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <Input
                            value={comp.img_name || ''}
                            onChange={(e) =>
                              handleValueChange('img_name', e.target.value)
                            }
                            placeholder="请输入图片名称"
                            style={{ flex: 1 }}
                          />
                          <Button
                            type="default"
                            size="small"
                            onClick={() => {
                              // 触发文件上传
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = 'image/*';
                              input.onchange = (e) => {
                                const file = (e.target as HTMLInputElement)
                                  .files?.[0];
                                if (file) {
                                  // 创建文件预览URL
                                  const fileUrl = URL.createObjectURL(file);

                                  // 更新组件数据
                                  const updated = {
                                    ...comp,
                                    img_url: fileUrl,
                                    img_name: file.name,
                                    img_source: 'upload',
                                  };
                                  onUpdateComponent(updated);
                                }
                              };
                              input.click();
                            }}
                          >
                            上传
                          </Button>
                        </div>
                      </Form.Item>

                      {comp.img_source === 'variable' && (
                        <Form.Item label="变量名称">
                          <Select
                            value={comp.img_url || ''}
                            onChange={(value) =>
                              handleValueChange('img_url', value)
                            }
                            style={{ width: '100%' }}
                            placeholder="请选择变量"
                          >
                            {variables
                              .filter((v) => v.type === 'object')
                              .map((variable) => (
                                <Option
                                  key={variable.name}
                                  value={variable.name}
                                >
                                  {variable.name}
                                </Option>
                              ))}
                          </Select>
                        </Form.Item>
                      )}

                      {comp.img_source === 'upload' && (
                        <Form.Item label="图片地址">
                          <Input
                            value={comp.img_url || ''}
                            onChange={(e) =>
                              handleValueChange('img_url', e.target.value)
                            }
                            placeholder="请输入图片URL"
                          />
                        </Form.Item>
                      )}
                    </Form>
                  ),
                },
                {
                  key: 'size',
                  label: '📏 尺寸设置',
                  children: (
                    <Form form={form} layout="vertical">
                      <Form.Item label="宽度">
                        <InputNumber
                          value={(comp as any).style?.width}
                          onChange={(value) =>
                            handleValueChange('width', value)
                          }
                          style={{ width: '100%' }}
                          placeholder="自动"
                          addonAfter="px"
                        />
                      </Form.Item>
                      <Form.Item label="高度">
                        <InputNumber
                          value={(comp as any).style?.height}
                          onChange={(value) =>
                            handleValueChange('height', value)
                          }
                          style={{ width: '100%' }}
                          placeholder="自动"
                          addonAfter="px"
                        />
                      </Form.Item>
                    </Form>
                  ),
                },
              ]}
            />
          </div>
        );

      case 'img_combination':
        return (
          <div style={{ padding: '16px' }}>
            <Collapse
              defaultActiveKey={['layout', 'images']}
              ghost
              items={[
                {
                  key: 'layout',
                  label: '🏗️ 布局设置',
                  children: (
                    <Form form={form} layout="vertical">
                      <Form.Item label="组合模式">
                        <Select
                          value={comp.combination_mode || 'bisect'}
                          onChange={(value) =>
                            handleValueChange('combination_mode', value)
                          }
                          style={{ width: '100%' }}
                        >
                          <Option value="bisect">二分栏</Option>
                          <Option value="trisect">三分栏</Option>
                          <Option value="quad">四分栏</Option>
                        </Select>
                      </Form.Item>
                      <Form.Item label="透明效果">
                        <Switch
                          checked={comp.combination_transparent || false}
                          onChange={(checked) =>
                            handleValueChange(
                              'combination_transparent',
                              checked,
                            )
                          }
                        />
                      </Form.Item>
                    </Form>
                  ),
                },
                {
                  key: 'images',
                  label: '🖼️ 图片管理',
                  children: (
                    <div>
                      <div style={{ marginBottom: '12px' }}>
                        <Button
                          type="dashed"
                          onClick={() => {
                            const newImages = [
                              ...(comp.img_list || []),
                              { img_url: '' },
                            ];
                            handleValueChange('img_list', newImages);
                          }}
                          style={{ width: '100%' }}
                          size="small"
                        >
                          添加图片
                        </Button>
                      </div>
                      {(comp.img_list || []).map((img: any, index: number) => (
                        <Card
                          key={index}
                          size="small"
                          style={{ marginBottom: '8px' }}
                        >
                          <Row gutter={8}>
                            <Col span={20}>
                              <Input
                                placeholder="图片URL"
                                value={img.img_url || ''}
                                onChange={(e) => {
                                  const newImages = [...(comp.img_list || [])];
                                  newImages[index] = {
                                    ...img,
                                    img_url: e.target.value,
                                  };
                                  handleValueChange('img_list', newImages);
                                }}
                                size="small"
                              />
                            </Col>
                            <Col span={4}>
                              <Button
                                type="text"
                                danger
                                size="small"
                                onClick={() => {
                                  const newImages = (
                                    comp.img_list || []
                                  ).filter((_: any, i: number) => i !== index);
                                  handleValueChange('img_list', newImages);
                                }}
                              >
                                删除
                              </Button>
                            </Col>
                          </Row>
                        </Card>
                      ))}
                    </div>
                  ),
                },
              ]}
            />
          </div>
        );

      case 'rich_text':
        return (
          <div style={{ padding: '16px' }}>
            <Collapse
              defaultActiveKey={['content', 'style']}
              ghost
              items={[
                {
                  key: 'content',
                  label: '📝 内容设置',
                  children: (
                    <Form form={form} layout="vertical">
                      <Form.Item label="富文本内容">
                        <Input.TextArea
                          value={
                            comp.content?.content?.[0]?.content?.[0]?.text || ''
                          }
                          onChange={(e) => {
                            const newContent = {
                              type: 'doc',
                              content: [
                                {
                                  type: 'paragraph',
                                  content: [
                                    {
                                      type: 'text',
                                      text: e.target.value,
                                    },
                                  ],
                                },
                              ],
                            };
                            handleValueChange('content', newContent);
                          }}
                          placeholder="请输入富文本内容"
                          rows={4}
                          showCount
                          maxLength={1000}
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
                      <Form.Item label="字体大小">
                        <Select
                          value={(comp as any).style?.fontSize || 14}
                          onChange={(value) =>
                            handleValueChange('fontSize', value)
                          }
                          style={{ width: '100%' }}
                        >
                          <Option value={14}>正文14px</Option>
                          <Option value={16}>标题16px</Option>
                          <Option value={12}>辅助信息12px</Option>
                        </Select>
                      </Form.Item>
                      <Form.Item label="字体粗细">
                        <Select
                          value={(comp as any).style?.fontWeight || 'normal'}
                          onChange={(value) =>
                            handleValueChange('fontWeight', value)
                          }
                          style={{ width: '100%' }}
                        >
                          <Option value="normal">正常</Option>
                          <Option value="bold">粗体</Option>
                          <Option value="lighter">细体</Option>
                        </Select>
                      </Form.Item>
                      <Form.Item label="文本对齐">
                        <Select
                          value={(comp as any).style?.textAlign || 'left'}
                          onChange={(value) =>
                            handleValueChange('textAlign', value)
                          }
                          style={{ width: '100%' }}
                        >
                          <Option value="left">左对齐</Option>
                          <Option value="center">居中</Option>
                          <Option value="right">右对齐</Option>
                        </Select>
                      </Form.Item>
                      <Form.Item label="最大显示行数">
                        <InputNumber
                          value={(comp as any).style?.numberOfLines || 1}
                          onChange={(value) =>
                            handleValueChange('numberOfLines', value || 1)
                          }
                          min={1}
                          max={10}
                          style={{ width: '100%' }}
                          addonAfter="行"
                        />
                      </Form.Item>
                    </Form>
                  ),
                },
              ]}
            />
          </div>
        );

      case 'title':
        return (
          <div style={{ padding: '16px' }}>
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
                          onChange={(value) =>
                            handleHeaderChange('style', value)
                          }
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
                                    backgroundColor: '#0d9488',
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
                                    backgroundColor: '#52c41a',
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
                                    backgroundColor: '#faad14',
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
                                    backgroundColor: '#fa8c16',
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
                                    backgroundColor: '#ff4d4f',
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

      default:
        return (
          <div style={{ padding: '24px' }}>
            <Card>
              <div style={{ textAlign: 'center', color: '#666' }}>
                <SettingOutlined
                  style={{ fontSize: '32px', marginBottom: '16px' }}
                />
                <div style={{ fontSize: '16px', marginBottom: '8px' }}>
                  组件类型: {tag}
                </div>
                <div style={{ fontSize: '12px', color: '#999' }}>
                  暂无可配置属性
                </div>
              </div>
            </Card>
          </div>
        );
    }
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
              {variables.map((variable, index) => (
                <div
                  key={index}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '4px',
                    marginBottom: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, marginBottom: '4px' }}>
                      {variable.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      类型:{' '}
                      {variable.type === 'text'
                        ? '文本'
                        : variable.type === 'object'
                        ? '数组对象'
                        : variable.type}
                    </div>
                  </div>
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => {
                      const newVariables = variables.filter(
                        (_, i) => i !== index,
                      );
                      onUpdateVariables(newVariables);
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </Card>
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

  const renderStyles = () => {
    // 如果选中了卡片本身，显示卡片样式配置
    if (isCardSelected) {
      return (
        <div style={{ padding: '16px' }}>
          {/* 间距设置 */}
          <Card
            title="📏 间距设置"
            size="small"
            style={{ marginBottom: '12px' }}
          >
            <Form layout="vertical" size="small">
              <Form.Item
                label="垂直间距"
                help="组件之间的垂直间距，实时预览效果"
              >
                <InputNumber
                  value={cardVerticalSpacing}
                  onChange={(value) => {
                    const newValue = value || 8;
                    console.log('🎯 更新垂直间距:', {
                      oldValue: cardVerticalSpacing,
                      newValue,
                      timestamp: new Date().toISOString(),
                    });
                    onUpdateCard({ vertical_spacing: newValue });
                  }}
                  min={0}
                  max={50}
                  step={1}
                  style={{ width: '100%' }}
                  addonAfter="px"
                  placeholder="请输入间距值"
                />
              </Form.Item>

              {/* 快速预设按钮 */}
              <Form.Item label="快速设置">
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[4, 8, 12, 16, 20].map((preset) => (
                    <Button
                      key={preset}
                      size="small"
                      type={
                        cardVerticalSpacing === preset ? 'primary' : 'default'
                      }
                      onClick={() => onUpdateCard({ vertical_spacing: preset })}
                      style={{ minWidth: '40px' }}
                    >
                      {preset}px
                    </Button>
                  ))}
                </div>
              </Form.Item>
            </Form>
          </Card>

          {/* 内边距设置 */}
          <Card
            title="📦 内边距设置"
            size="small"
            style={{ marginBottom: '12px' }}
          >
            <PaddingEditor
              value={cardPadding}
              onChange={(padding) => onUpdateCard({ padding })}
            />
          </Card>
        </div>
      );
    }

    // 如果选中了组件，显示组件样式配置
    if (!currentComponent) {
      return (
        <div style={{ padding: '16px', textAlign: 'center', color: '#999' }}>
          请选择一个组件来配置样式
        </div>
      );
    }

    return <></>;
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
          tabBarStyle={{
            padding: '0 16px',
            backgroundColor: '#fff',
            margin: 0,
            borderBottom: '1px solid #d9d9d9',
          }}
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
              disabled: isCardSelected || false,
              children: (
                <div
                  style={{ height: 'calc(100vh - 180px)', overflow: 'auto' }}
                >
                  {renderProperties()}
                </div>
              ),
            },
            {
              key: 'styles',
              label: (
                <span
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  样式
                </span>
              ),
              children: (
                <div
                  style={{ height: 'calc(100vh - 180px)', overflow: 'auto' }}
                >
                  {renderStyles()}
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
              disabled: isCardSelected || !isInteractiveComponent,
              children: (
                <div
                  style={{ height: 'calc(100vh - 180px)', overflow: 'auto' }}
                >
                  {renderEvents()}
                </div>
              ),
            },
          ]}
          tabBarGutter={8}
          className="custom-tabs"
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
        newVariable={newVariable}
        onOk={handleAddVariableFromModal}
        onCancel={handleCancelAddVariableModal}
        onChange={(field, value) =>
          setNewVariable((prev) => ({ ...prev, [field]: value }))
        }
      />

      {/* 事件编辑弹窗 */}
      <EventEditModal
        visible={isEventEditModalVisible}
        eventAction={currentEventAction}
        variables={variables}
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
