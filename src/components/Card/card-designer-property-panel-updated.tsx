// card-designer-property-panel-updated.tsx - 更新的属性面板和组件面板

import {
  AppstoreOutlined,
  BarsOutlined,
  BgColorsOutlined,
  DeleteOutlined,
  FormatPainterOutlined,
  PlusOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Collapse,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Tabs,
  Tree,
  Typography,
} from 'antd';
import React, { useMemo, useState } from 'react';
import { useDrag } from 'react-dnd';
import {
  COMPONENT_CATEGORIES,
  COMPONENT_TYPES,
} from './card-designer-constants-updated';
import PaddingEditor from './card-designer-padding-editor';
import {
  CardPadding,
  ComponentType,
  DesignData,
  Variable,
} from './card-designer-types-updated';

const { Option } = Select;
const { Text } = Typography;
const { Panel } = Collapse;

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
      <div
        style={{
          marginBottom: '16px',
          padding: '8px 12px',
          backgroundColor: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '6px',
        }}
      >
        <Text style={{ fontSize: '12px', color: '#0369a1' }}>
          💡 拖拽组件到右侧画布中使用
        </Text>
      </div>

      <Collapse defaultActiveKey={categories.map((cat) => cat.key)} ghost>
        {categories.map((category) => (
          <Panel
            header={
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
            }
            key={category.key}
          >
            {category.components.map(([type, config]) => (
              <DraggableComponent key={type} type={type} config={config} />
            ))}
          </Panel>
        ))}
      </Collapse>

      <div
        style={{
          marginTop: '20px',
          padding: '12px',
          backgroundColor: '#f6ffed',
          border: '1px solid #b7eb8f',
          borderRadius: '6px',
        }}
      >
        <Text style={{ fontSize: '12px', color: '#52c41a' }}>
          <strong>使用说明：</strong>
          <br />• 容器组件：可以包含其他组件
          <br />• 展示组件：用于内容展示
          <br />• 交互组件：用于用户交互
          <br />• 容器组件不能嵌套到其他容器中
        </Text>
      </div>
    </div>
  );
};

// 大纲树面板
const OutlineTree: React.FC<{
  data: DesignData;
  selectedPath: (string | number)[] | null;
  onOutlineHover: (path: (string | number)[] | null) => void;
  onOutlineSelect: (
    component: ComponentType,
    path: (string | number)[],
  ) => void;
}> = ({ data, selectedPath, onOutlineHover, onOutlineSelect }) => {
  // 构建树形数据
  const treeData = useMemo(() => {
    const buildTreeNode = (
      component: ComponentType,
      index: number,
      basePath: (string | number)[],
    ): any => {
      const path = [...basePath, index];
      const config = COMPONENT_TYPES[component.tag];

      const node = {
        title: (
          <Space size={4}>
            {config?.icon && (
              <config.icon
                style={{
                  fontSize: '12px',
                  color: config
                    ? COMPONENT_CATEGORIES.find(
                        (cat) => cat.key === config.category,
                      )?.color
                    : '#999',
                }}
              />
            )}
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
              column.elements.forEach(
                (child: ComponentType, childIndex: number) => {
                  node.children.push(
                    buildTreeNode(child, childIndex, [
                      ...path,
                      'columns',
                      colIndex,
                      'elements',
                    ]),
                  );
                },
              );
            }
          });
        }
      }

      return node;
    };

    return data.elements.map((component, index) =>
      buildTreeNode(component, index, ['elements']),
    );
  }, [data.elements]);

  const handleSelect = (selectedKeys: React.Key[], info: any) => {
    if (info.node?.component && info.node?.path) {
      onOutlineSelect(info.node.component, info.node.path);
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
              📊 当前有 {data.elements.length} 个组件
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
  data: DesignData;
  selectedPath: (string | number)[] | null;
  onOutlineHover: (path: (string | number)[] | null) => void;
  onOutlineSelect: (
    component: ComponentType,
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

// 右侧属性面板
export const PropertyPanel: React.FC<{
  selectedComponent: ComponentType | null;
  selectedPath: (string | number)[] | null;
  onUpdateComponent: (component: ComponentType) => void;
  onUpdateCard: (updates: any) => void;
  variables: Variable[];
  onUpdateVariables: (variables: Variable[]) => void;
  cardVerticalSpacing: number;
  cardPadding: CardPadding;
}> = ({
  selectedComponent,
  selectedPath,
  onUpdateComponent,
  onUpdateCard,
  variables,
  onUpdateVariables,
  cardVerticalSpacing,
  cardPadding,
}) => {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState<string>('properties');

  // 检查是否选中了卡片本身
  const isCardSelected =
    selectedPath &&
    selectedPath.length === 2 &&
    selectedPath[0] === 'dsl' &&
    selectedPath[1] === 'body';

  const handleValueChange = (field: string, value: any) => {
    if (selectedComponent) {
      const updated = { ...selectedComponent, [field]: value };
      onUpdateComponent(updated);
    }
  };

  // const handleNestedValueChange = (
  //   parentField: string,
  //   field: string,
  //   value: any,
  // ) => {
  //   if (selectedComponent) {
  //     const updated = {
  //       ...selectedComponent,
  //       [parentField]: {
  //         ...(selectedComponent as any)[parentField],
  //         [field]: value,
  //       },
  //     };
  //     onUpdateComponent(updated);
  //   }
  // };

  const handleAddVariable = () => {
    const newVariable: Variable = {
      name: `var_${Date.now()}`,
      value: '',
      type: 'text',
    };
    onUpdateVariables([...variables, newVariable]);
  };

  const handleUpdateVariable = (
    index: number,
    field: keyof Variable,
    value: any,
  ) => {
    const updated = variables.map((v, i) =>
      i === index ? { ...v, [field]: value } : v,
    );
    onUpdateVariables(updated);
  };

  const handleDeleteVariable = (index: number) => {
    const updated = variables.filter((_, i) => i !== index);
    onUpdateVariables(updated);
  };

  const renderCardProperties = () => {
    return (
      <div style={{ padding: '16px' }}>
        <Collapse defaultActiveKey={['spacing', 'padding']} ghost>
          <Panel header="📏 间距设置" key="spacing">
            <Form form={form} layout="vertical">
              <Form.Item label="垂直间距" help="组件之间的垂直间距">
                <InputNumber
                  value={cardVerticalSpacing}
                  onChange={(value) =>
                    onUpdateCard({ vertical_spacing: value || 8 })
                  }
                  min={0}
                  max={50}
                  style={{ width: '100%' }}
                  addonAfter="px"
                />
              </Form.Item>
            </Form>
          </Panel>

          <Panel header="📦 内边距设置" key="padding">
            <PaddingEditor
              value={cardPadding}
              onChange={(padding) => onUpdateCard({ padding })}
            />
          </Panel>
        </Collapse>
      </div>
    );
  };

  const renderProperties = () => {
    // 如果选中了卡片本身，显示卡片属性
    if (isCardSelected) {
      return renderCardProperties();
    }

    // 如果没有选中组件，显示提示
    if (!selectedComponent) {
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

    const { tag } = selectedComponent;
    const comp = selectedComponent as any;

    switch (tag) {
      case 'form':
        return (
          <div style={{ padding: '16px' }}>
            <Collapse defaultActiveKey={['basic']} ghost>
              <Panel header="⚙️ 基础设置" key="basic">
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
              </Panel>
            </Collapse>
          </div>
        );

      case 'column_set':
        return (
          <div style={{ padding: '16px' }}>
            <Collapse defaultActiveKey={['layout']} ghost>
              <Panel header="🏗️ 布局设置" key="layout">
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
                </Form>
              </Panel>
            </Collapse>
          </div>
        );

      case 'plain_text':
        return (
          <div style={{ padding: '16px' }}>
            <Collapse defaultActiveKey={['content']} ghost>
              <Panel header="📝 内容设置" key="content">
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
              </Panel>
            </Collapse>
          </div>
        );

      // 其他组件类型的配置...
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

  const renderEvents = () => {
    if (!selectedComponent && !isCardSelected) {
      return (
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <BgColorsOutlined
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
              添加变量
            </Button>
          </div>

          {variables.map((variable, index) => (
            <Card key={index} size="small" style={{ marginBottom: '8px' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Row gutter={8}>
                  <Col span={16}>
                    <Input
                      placeholder="变量名称"
                      value={variable.name || ''}
                      onChange={(e) =>
                        handleUpdateVariable(index, 'name', e.target.value)
                      }
                      size="small"
                    />
                  </Col>
                  <Col span={8}>
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteVariable(index)}
                      style={{ width: '100%' }}
                      size="small"
                    />
                  </Col>
                </Row>
                <Row gutter={8}>
                  <Col span={24}>
                    <Select
                      placeholder="变量类型"
                      value={variable.type || 'text'}
                      onChange={(value) =>
                        handleUpdateVariable(index, 'type', value)
                      }
                      style={{ width: '100%' }}
                      size="small"
                    >
                      <Option value="text">文本</Option>
                      <Option value="number">数字</Option>
                      <Option value="boolean">布尔值</Option>
                      <Option value="object">对象</Option>
                    </Select>
                  </Col>
                </Row>
                <Row gutter={8}>
                  <Col span={24}>
                    <Input.TextArea
                      placeholder="模拟数据"
                      value={variable.value || ''}
                      onChange={(e) =>
                        handleUpdateVariable(index, 'value', e.target.value)
                      }
                      rows={2}
                      size="small"
                    />
                  </Col>
                </Row>
              </Space>
            </Card>
          ))}

          {variables.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                color: '#999',
                padding: '20px',
                border: '1px dashed #d9d9d9',
                borderRadius: '6px',
                backgroundColor: '#fafafa',
              }}
            >
              <Text type="secondary">暂无变量，点击上方按钮添加</Text>
            </div>
          )}
        </Card>

        <Card
          title={<span>📊 {isCardSelected ? '卡片信息' : '组件信息'}</span>}
          size="small"
        >
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            {isCardSelected ? (
              <>
                <Row>
                  <Col span={8}>
                    <strong>类型:</strong>
                  </Col>
                  <Col span={16}>卡片容器</Col>
                </Row>
                <Row style={{ marginTop: '4px' }}>
                  <Col span={8}>
                    <strong>垂直间距:</strong>
                  </Col>
                  <Col span={16}>{cardVerticalSpacing}px</Col>
                </Row>
                <Row style={{ marginTop: '4px' }}>
                  <Col span={8}>
                    <strong>内边距:</strong>
                  </Col>
                  <Col span={16}>
                    {cardPadding.top}px {cardPadding.right}px{' '}
                    {cardPadding.bottom}px {cardPadding.left}px
                  </Col>
                </Row>
              </>
            ) : selectedComponent ? (
              <>
                <Row>
                  <Col span={8}>
                    <strong>组件类型:</strong>
                  </Col>
                  <Col span={16}>{selectedComponent.tag}</Col>
                </Row>
                <Row style={{ marginTop: '4px' }}>
                  <Col span={8}>
                    <strong>组件ID:</strong>
                  </Col>
                  <Col span={16} style={{ wordBreak: 'break-all' }}>
                    {selectedComponent.id}
                  </Col>
                </Row>
                {selectedComponent.name && (
                  <Row style={{ marginTop: '4px' }}>
                    <Col span={8}>
                      <strong>组件名称:</strong>
                    </Col>
                    <Col span={16}>{selectedComponent.name}</Col>
                  </Row>
                )}
              </>
            ) : null}
            <Row style={{ marginTop: '4px' }}>
              <Col span={8}>
                <strong>创建时间:</strong>
              </Col>
              <Col span={16}>{new Date().toLocaleString()}</Col>
            </Row>
          </div>
        </Card>
      </div>
    );
  };

  const TabItems = [
    {
      key: 'properties',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <FormatPainterOutlined />
          属性配置
        </span>
      ),
      children: (
        <div style={{ height: 'calc(100vh - 120px)', overflow: 'auto' }}>
          {renderProperties()}
        </div>
      ),
    },
    {
      key: 'events',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <BgColorsOutlined />
          事件管理
        </span>
      ),
      children: (
        <div style={{ height: 'calc(100vh - 120px)', overflow: 'auto' }}>
          {renderEvents()}
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
        items={TabItems}
      ></Tabs>
    </div>
  );
};
