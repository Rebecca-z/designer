// card-designer-property-panel-updated.tsx - 完整的修复表单容器数据结构问题的属性面板

import {
  BarsOutlined,
  BgColorsOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SettingOutlined,
  ThunderboltOutlined,
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
} from 'antd';
import React, { useMemo, useState } from 'react';
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
  cardVerticalSpacing,
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
      // 样式相关字段需要保存到style对象中
      const styleFields = [
        'fontSize',
        'textAlign',
        'numberOfLines',
        'text_color', // ✅ 新增text_color到样式字段
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
                    console.warn('value===', value);
                    const newValue = value;
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

    // 检查是否选中了文本组件
    const isTextComponent =
      selectedComponent &&
      (selectedComponent.tag === 'plain_text' ||
        selectedComponent.tag === 'rich_text');

    // 如果选中了文本组件，显示文本编辑界面
    if (isTextComponent) {
      const isPlainText = selectedComponent.tag === 'plain_text';
      const isRichText = selectedComponent.tag === 'rich_text';

      // 获取文本内容
      const getTextContent = () => {
        // 添加空值检查，防止删除组件时的报错
        if (!currentComponent) {
          return '';
        }

        if (isPlainText) {
          return (currentComponent as any).content || '';
        } else if (isRichText) {
          return (
            (currentComponent as any).content?.content?.[0]?.content?.[0]
              ?.text || ''
          );
        }
        return '';
      };

      // 更新文本内容
      const updateTextContent = (value: string) => {
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
          const newContent = {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: value,
                  },
                ],
              },
            ],
          };
          handleValueChange('content', newContent);
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
                        value={getTextContent()}
                        onChange={(e) => updateTextContent(e.target.value)}
                        placeholder="请输入文本内容"
                        rows={4}
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
                    {isPlainText && (
                      <>
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
                              (currentComponent as any).style?.text_color ||
                              '#000000'
                            }
                            onChange={(color: any) => {
                              const rgbaValue = color.toRgbString();
                              handleValueChange('text_color', rgbaValue);
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
                      </>
                    )}
                    {isRichText && (
                      <>
                        <Form.Item label="字色">
                          <ColorPicker
                            value={
                              (currentComponent as any).style?.text_color ||
                              '#000000'
                            }
                            onChange={(color: any) => {
                              const rgbaValue = color.toRgbString();
                              handleValueChange('text_color', rgbaValue);
                            }}
                            showText
                            format="rgb"
                            style={{ width: '100%' }}
                          />
                        </Form.Item>
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
                      </>
                    )}
                  </Form>
                ),
              },
            ]}
          />
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
            🎯 当前选中：{selectedComponent?.tag || '未知'}组件
          </Text>
        </div>
        <div style={{ color: '#999', fontSize: '12px' }}>
          该组件的属性配置功能正在开发中...
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
