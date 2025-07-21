// card-designer-property-panel-updated.tsx - 完整的修复表单容器数据结构问题的属性面板

import {
  AppstoreOutlined,
  BarsOutlined,
  BgColorsOutlined,
  DeleteOutlined,
  FormatPainterOutlined,
  PlusOutlined,
  SettingOutlined,
  SkinOutlined,
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
  cardData: CardDesignData;
}> = ({
  selectedComponent,
  selectedPath,
  onUpdateComponent,
  onUpdateCard,
  variables,
  onUpdateVariables,
  cardVerticalSpacing,
  cardPadding,
  cardData,
}) => {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState<string>('properties');

  // 获取真实的组件和路径
  const { component: realComponent, realPath } = getComponentRealPath(
    cardData,
    selectedPath,
  );

  // 检查是否选中了卡片本身
  const isCardSelected =
    selectedPath &&
    selectedPath.length === 2 &&
    selectedPath[0] === 'dsl' &&
    selectedPath[1] === 'body';

  // 当选中卡片时，自动切换到样式Tab
  useEffect(() => {
    if (isCardSelected && activeTab !== 'styles') {
      console.log('🎯 检测到卡片选中，自动切换到样式Tab');
      setActiveTab('styles');
    }
  }, [isCardSelected, activeTab]);

  // 使用真实组件数据
  const currentComponent = realComponent || selectedComponent;

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
      const updated = { ...currentComponent, [field]: value };
      console.log('📝 更新组件属性:', {
        componentId: updated.id,
        field,
        value,
        realPath,
      });
      onUpdateComponent(updated);
    }
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
                        <InputNumber
                          value={comp.fontSize || 14}
                          onChange={(value) =>
                            handleValueChange('fontSize', value || 14)
                          }
                          min={12}
                          max={72}
                          style={{ width: '100%' }}
                          addonAfter="px"
                        />
                      </Form.Item>
                      <Form.Item label="字体粗细">
                        <Select
                          value={comp.fontWeight || 'normal'}
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
                          value={comp.textAlign || 'left'}
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
                          value={comp.type || 'primary'}
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
                          value={comp.size || 'middle'}
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
                      <Form.Item label="图片地址">
                        <Input
                          value={comp.img_url || ''}
                          onChange={(e) =>
                            handleValueChange('img_url', e.target.value)
                          }
                          placeholder="请输入图片URL"
                        />
                      </Form.Item>
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
                          value={comp.width}
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
                          value={comp.height}
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
              defaultActiveKey={['content']}
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
                          value={comp.title || ''}
                          onChange={(e) =>
                            handleValueChange('title', e.target.value)
                          }
                          placeholder="请输入主标题"
                        />
                      </Form.Item>
                      <Form.Item label="副标题">
                        <Input
                          value={comp.subtitle || ''}
                          onChange={(e) =>
                            handleValueChange('subtitle', e.target.value)
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
                          value={comp.style || 'blue'}
                          onChange={(value) =>
                            handleValueChange('style', value)
                          }
                          style={{ width: '100%' }}
                        >
                          <Option value="blue">蓝色主题</Option>
                          <Option value="green">绿色主题</Option>
                          <Option value="red">红色主题</Option>
                          <Option value="wethet">天气主题</Option>
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

  const renderEvents = () => {
    if (!currentComponent && !isCardSelected) {
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
                <Row style={{ marginTop: '4px' }}>
                  <Col span={8}>
                    <strong>根组件数:</strong>
                  </Col>
                  <Col span={16}>{cardData.dsl.body.elements.length}</Col>
                </Row>
              </>
            ) : currentComponent ? (
              <>
                <Row>
                  <Col span={8}>
                    <strong>组件类型:</strong>
                  </Col>
                  <Col span={16}>{currentComponent.tag}</Col>
                </Row>
                <Row style={{ marginTop: '4px' }}>
                  <Col span={8}>
                    <strong>组件ID:</strong>
                  </Col>
                  <Col span={16} style={{ wordBreak: 'break-all' }}>
                    {currentComponent.id}
                  </Col>
                </Row>
                {currentComponent.name && (
                  <Row style={{ marginTop: '4px' }}>
                    <Col span={8}>
                      <strong>组件名称:</strong>
                    </Col>
                    <Col span={16}>{currentComponent.name}</Col>
                  </Row>
                )}
                {realPath && (
                  <Row style={{ marginTop: '4px' }}>
                    <Col span={8}>
                      <strong>数据路径:</strong>
                    </Col>
                    <Col span={16} style={{ fontSize: '10px', color: '#666' }}>
                      {realPath.join(' → ')}
                    </Col>
                  </Row>
                )}
                {/* 显示组件在数据结构中的位置 */}
                {realPath &&
                  realPath.length >= 6 &&
                  realPath[4] === 'elements' && (
                    <Row style={{ marginTop: '4px' }}>
                      <Col span={8}>
                        <strong>容器位置:</strong>
                      </Col>
                      <Col
                        span={16}
                        style={{ fontSize: '11px', color: '#52c41a' }}
                      >
                        表单内第{(realPath[5] as number) + 1}个组件
                      </Col>
                    </Row>
                  )}
                {realPath &&
                  realPath.length >= 8 &&
                  realPath[6] === 'elements' && (
                    <Row style={{ marginTop: '4px' }}>
                      <Col span={8}>
                        <strong>容器位置:</strong>
                      </Col>
                      <Col
                        span={16}
                        style={{ fontSize: '11px', color: '#722ed1' }}
                      >
                        第{(realPath[5] as number) + 1}列第
                        {(realPath[7] as number) + 1}个组件
                      </Col>
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

        {/* 数据结构调试信息 */}
        {process.env.NODE_ENV === 'development' && (
          <Card
            title={<span>🐛 调试信息</span>}
            size="small"
            style={{ marginTop: '16px' }}
          >
            <div style={{ fontSize: '10px', color: '#666' }}>
              <div>
                <strong>选中路径:</strong> {selectedPath?.join(' → ') || '无'}
              </div>
              <div>
                <strong>真实路径:</strong> {realPath?.join(' → ') || '无'}
              </div>
              <div>
                <strong>是否卡片:</strong> {isCardSelected ? '是' : '否'}
              </div>
              <div>
                <strong>组件存在:</strong> {currentComponent ? '是' : '否'}
              </div>
            </div>
          </Card>
        )}
      </div>
    );
  };

  const renderStyles = () => {
    // 如果选中了卡片本身，显示卡片样式配置
    if (isCardSelected) {
      return (
        <div style={{ padding: '16px' }}>
          <Card
            title={
              <span
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <SkinOutlined />
                卡片样式配置
              </span>
            }
            size="small"
            style={{ marginBottom: '16px' }}
          >
            <div style={{ fontSize: '12px', color: '#666' }}>
              卡片: {cardData.name} ({cardData.id})
            </div>
          </Card>

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
                extra={
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#666',
                      marginTop: '4px',
                      padding: '8px',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '4px',
                      border: '1px solid #e8e8e8',
                    }}
                  >
                    💡 当前间距: <strong>{cardVerticalSpacing}px</strong>
                    <br />
                    📊 影响组件数: {cardData.dsl.body.elements.length} 个根组件
                  </div>
                }
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

          {/* 卡片背景样式 */}
          <Card title="背景样式" size="small" style={{ marginBottom: '12px' }}>
            <Form layout="vertical" size="small">
              <Row gutter={8}>
                <Col span={12}>
                  <Form.Item label="背景颜色">
                    <Input
                      value={cardData.dsl.body.styles?.backgroundColor || ''}
                      onChange={(e) => {
                        const updatedCardData = {
                          ...cardData,
                          dsl: {
                            ...cardData.dsl,
                            body: {
                              ...cardData.dsl.body,
                              styles: {
                                ...cardData.dsl.body.styles,
                                backgroundColor: e.target.value,
                              },
                            },
                          },
                        };
                        onUpdateCard({ cardData: updatedCardData });
                      }}
                      placeholder="transparent"
                      size="small"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="背景图片">
                    <Input
                      value={cardData.dsl.body.styles?.backgroundImage || ''}
                      onChange={(e) => {
                        const updatedCardData = {
                          ...cardData,
                          dsl: {
                            ...cardData.dsl,
                            body: {
                              ...cardData.dsl.body,
                              styles: {
                                ...cardData.dsl.body.styles,
                                backgroundImage: e.target.value,
                              },
                            },
                          },
                        };
                        onUpdateCard({ cardData: updatedCardData });
                      }}
                      placeholder="url()"
                      size="small"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Card>

          {/* 卡片边框样式 */}
          <Card title="边框样式" size="small" style={{ marginBottom: '12px' }}>
            <Form layout="vertical" size="small">
              <Row gutter={8}>
                <Col span={12}>
                  <Form.Item label="边框宽度">
                    <Input
                      value={cardData.dsl.body.styles?.borderWidth || ''}
                      onChange={(e) => {
                        const updatedCardData = {
                          ...cardData,
                          dsl: {
                            ...cardData.dsl,
                            body: {
                              ...cardData.dsl.body,
                              styles: {
                                ...cardData.dsl.body.styles,
                                borderWidth: e.target.value,
                              },
                            },
                          },
                        };
                        onUpdateCard({ cardData: updatedCardData });
                      }}
                      placeholder="0"
                      size="small"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="边框样式">
                    <Select
                      value={cardData.dsl.body.styles?.borderStyle || 'solid'}
                      onChange={(value) => {
                        const updatedCardData = {
                          ...cardData,
                          dsl: {
                            ...cardData.dsl,
                            body: {
                              ...cardData.dsl.body,
                              styles: {
                                ...cardData.dsl.body.styles,
                                borderStyle: value,
                              },
                            },
                          },
                        };
                        onUpdateCard({ cardData: updatedCardData });
                      }}
                      size="small"
                    >
                      <Option value="none">无</Option>
                      <Option value="solid">实线</Option>
                      <Option value="dashed">虚线</Option>
                      <Option value="dotted">点线</Option>
                      <Option value="double">双线</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={8}>
                <Col span={12}>
                  <Form.Item label="边框颜色">
                    <Input
                      value={cardData.dsl.body.styles?.borderColor || ''}
                      onChange={(e) => {
                        const updatedCardData = {
                          ...cardData,
                          dsl: {
                            ...cardData.dsl,
                            body: {
                              ...cardData.dsl.body,
                              styles: {
                                ...cardData.dsl.body.styles,
                                borderColor: e.target.value,
                              },
                            },
                          },
                        };
                        onUpdateCard({ cardData: updatedCardData });
                      }}
                      placeholder="#000000"
                      size="small"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="圆角">
                    <Input
                      value={cardData.dsl.body.styles?.borderRadius || ''}
                      onChange={(e) => {
                        const updatedCardData = {
                          ...cardData,
                          dsl: {
                            ...cardData.dsl,
                            body: {
                              ...cardData.dsl.body,
                              styles: {
                                ...cardData.dsl.body.styles,
                                borderRadius: e.target.value,
                              },
                            },
                          },
                        };
                        onUpdateCard({ cardData: updatedCardData });
                      }}
                      placeholder="0"
                      size="small"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Card>

          {/* 自定义CSS */}
          <Card title="自定义CSS" size="small">
            <Form layout="vertical" size="small">
              <Form.Item label="CSS代码">
                <Input.TextArea
                  value={cardData.dsl.body.styles?.customCSS || ''}
                  onChange={(e) => {
                    const updatedCardData = {
                      ...cardData,
                      dsl: {
                        ...cardData.dsl,
                        body: {
                          ...cardData.dsl.body,
                          styles: {
                            ...cardData.dsl.body.styles,
                            customCSS: e.target.value,
                          },
                        },
                      },
                    };
                    onUpdateCard({ cardData: updatedCardData });
                  }}
                  placeholder="/* 在这里输入自定义CSS代码 */"
                  rows={4}
                  size="small"
                />
              </Form.Item>
            </Form>
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

    // 初始化样式对象
    const styles = currentComponent.styles || {};

    const handleStyleChange = (field: string, value: any) => {
      const updatedComponent = {
        ...currentComponent,
        styles: {
          ...styles,
          [field]: value,
        },
      };
      onUpdateComponent(updatedComponent);
    };

    return (
      <div style={{ padding: '16px' }}>
        <Card
          title={
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SkinOutlined />
              组件样式配置
            </span>
          }
          size="small"
          style={{ marginBottom: '16px' }}
        >
          <div style={{ fontSize: '12px', color: '#666' }}>
            组件: {currentComponent.tag} ({currentComponent.id})
          </div>
        </Card>

        {/* 布局样式 */}
        <Card title="布局" size="small" style={{ marginBottom: '12px' }}>
          <Form layout="vertical" size="small">
            <Row gutter={8}>
              <Col span={12}>
                <Form.Item label="显示">
                  <Select
                    value={styles.display || 'block'}
                    onChange={(value) => handleStyleChange('display', value)}
                    size="small"
                  >
                    <Option value="block">块级</Option>
                    <Option value="inline">行内</Option>
                    <Option value="inline-block">行内块</Option>
                    <Option value="flex">弹性布局</Option>
                    <Option value="none">隐藏</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="定位">
                  <Select
                    value={styles.position || 'static'}
                    onChange={(value) => handleStyleChange('position', value)}
                    size="small"
                  >
                    <Option value="static">静态</Option>
                    <Option value="relative">相对</Option>
                    <Option value="absolute">绝对</Option>
                    <Option value="fixed">固定</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={8}>
              <Col span={12}>
                <Form.Item label="宽度">
                  <Input
                    value={styles.width || ''}
                    onChange={(e) => handleStyleChange('width', e.target.value)}
                    placeholder="auto"
                    size="small"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="高度">
                  <Input
                    value={styles.height || ''}
                    onChange={(e) =>
                      handleStyleChange('height', e.target.value)
                    }
                    placeholder="auto"
                    size="small"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={8}>
              <Col span={12}>
                <Form.Item label="最小宽度">
                  <Input
                    value={styles.minWidth || ''}
                    onChange={(e) =>
                      handleStyleChange('minWidth', e.target.value)
                    }
                    placeholder="0"
                    size="small"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="最小高度">
                  <Input
                    value={styles.minHeight || ''}
                    onChange={(e) =>
                      handleStyleChange('minHeight', e.target.value)
                    }
                    placeholder="0"
                    size="small"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>

        {/* 边距和内边距 */}
        <Card title="间距" size="small" style={{ marginBottom: '12px' }}>
          <Form layout="vertical" size="small">
            <Row gutter={8}>
              <Col span={12}>
                <Form.Item label="外边距">
                  <Input
                    value={styles.margin || ''}
                    onChange={(e) =>
                      handleStyleChange('margin', e.target.value)
                    }
                    placeholder="0"
                    size="small"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="内边距">
                  <Input
                    value={styles.padding || ''}
                    onChange={(e) =>
                      handleStyleChange('padding', e.target.value)
                    }
                    placeholder="0"
                    size="small"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>

        {/* 字体样式 */}
        <Card title="字体" size="small" style={{ marginBottom: '12px' }}>
          <Form layout="vertical" size="small">
            <Row gutter={8}>
              <Col span={12}>
                <Form.Item label="字体大小">
                  <Input
                    value={styles.fontSize || ''}
                    onChange={(e) =>
                      handleStyleChange('fontSize', e.target.value)
                    }
                    placeholder="14px"
                    size="small"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="字体粗细">
                  <Select
                    value={styles.fontWeight || 'normal'}
                    onChange={(value) => handleStyleChange('fontWeight', value)}
                    size="small"
                  >
                    <Option value="normal">正常</Option>
                    <Option value="bold">粗体</Option>
                    <Option value="lighter">细体</Option>
                    <Option value="100">100</Option>
                    <Option value="200">200</Option>
                    <Option value="300">300</Option>
                    <Option value="400">400</Option>
                    <Option value="500">500</Option>
                    <Option value="600">600</Option>
                    <Option value="700">700</Option>
                    <Option value="800">800</Option>
                    <Option value="900">900</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={8}>
              <Col span={12}>
                <Form.Item label="字体颜色">
                  <Input
                    value={styles.color || ''}
                    onChange={(e) => handleStyleChange('color', e.target.value)}
                    placeholder="#000000"
                    size="small"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="行高">
                  <Input
                    value={styles.lineHeight || ''}
                    onChange={(e) =>
                      handleStyleChange('lineHeight', e.target.value)
                    }
                    placeholder="1.5"
                    size="small"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={8}>
              <Col span={12}>
                <Form.Item label="文本对齐">
                  <Select
                    value={styles.textAlign || 'left'}
                    onChange={(value) => handleStyleChange('textAlign', value)}
                    size="small"
                  >
                    <Option value="left">左对齐</Option>
                    <Option value="center">居中</Option>
                    <Option value="right">右对齐</Option>
                    <Option value="justify">两端对齐</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="文本装饰">
                  <Select
                    value={styles.textDecoration || 'none'}
                    onChange={(value) =>
                      handleStyleChange('textDecoration', value)
                    }
                    size="small"
                  >
                    <Option value="none">无</Option>
                    <Option value="underline">下划线</Option>
                    <Option value="overline">上划线</Option>
                    <Option value="line-through">删除线</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>

        {/* 背景样式 */}
        <Card title="背景" size="small" style={{ marginBottom: '12px' }}>
          <Form layout="vertical" size="small">
            <Row gutter={8}>
              <Col span={12}>
                <Form.Item label="背景颜色">
                  <Input
                    value={styles.backgroundColor || ''}
                    onChange={(e) =>
                      handleStyleChange('backgroundColor', e.target.value)
                    }
                    placeholder="transparent"
                    size="small"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="背景图片">
                  <Input
                    value={styles.backgroundImage || ''}
                    onChange={(e) =>
                      handleStyleChange('backgroundImage', e.target.value)
                    }
                    placeholder="url()"
                    size="small"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={8}>
              <Col span={12}>
                <Form.Item label="背景重复">
                  <Select
                    value={styles.backgroundRepeat || 'repeat'}
                    onChange={(value) =>
                      handleStyleChange('backgroundRepeat', value)
                    }
                    size="small"
                  >
                    <Option value="repeat">重复</Option>
                    <Option value="no-repeat">不重复</Option>
                    <Option value="repeat-x">水平重复</Option>
                    <Option value="repeat-y">垂直重复</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="背景位置">
                  <Select
                    value={styles.backgroundPosition || 'left top'}
                    onChange={(value) =>
                      handleStyleChange('backgroundPosition', value)
                    }
                    size="small"
                  >
                    <Option value="left top">左上</Option>
                    <Option value="center top">中上</Option>
                    <Option value="right top">右上</Option>
                    <Option value="left center">左中</Option>
                    <Option value="center center">中心</Option>
                    <Option value="right center">右中</Option>
                    <Option value="left bottom">左下</Option>
                    <Option value="center bottom">中下</Option>
                    <Option value="right bottom">右下</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>

        {/* 边框样式 */}
        <Card title="边框" size="small" style={{ marginBottom: '12px' }}>
          <Form layout="vertical" size="small">
            <Row gutter={8}>
              <Col span={12}>
                <Form.Item label="边框宽度">
                  <Input
                    value={styles.borderWidth || ''}
                    onChange={(e) =>
                      handleStyleChange('borderWidth', e.target.value)
                    }
                    placeholder="0"
                    size="small"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="边框样式">
                  <Select
                    value={styles.borderStyle || 'solid'}
                    onChange={(value) =>
                      handleStyleChange('borderStyle', value)
                    }
                    size="small"
                  >
                    <Option value="none">无</Option>
                    <Option value="solid">实线</Option>
                    <Option value="dashed">虚线</Option>
                    <Option value="dotted">点线</Option>
                    <Option value="double">双线</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={8}>
              <Col span={12}>
                <Form.Item label="边框颜色">
                  <Input
                    value={styles.borderColor || ''}
                    onChange={(e) =>
                      handleStyleChange('borderColor', e.target.value)
                    }
                    placeholder="#000000"
                    size="small"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="圆角">
                  <Input
                    value={styles.borderRadius || ''}
                    onChange={(e) =>
                      handleStyleChange('borderRadius', e.target.value)
                    }
                    placeholder="0"
                    size="small"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>

        {/* 阴影效果 */}
        <Card title="阴影" size="small" style={{ marginBottom: '12px' }}>
          <Form layout="vertical" size="small">
            <Row gutter={8}>
              <Col span={12}>
                <Form.Item label="盒子阴影">
                  <Input
                    value={styles.boxShadow || ''}
                    onChange={(e) =>
                      handleStyleChange('boxShadow', e.target.value)
                    }
                    placeholder="0 0 0 0 rgba(0,0,0,0)"
                    size="small"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="文本阴影">
                  <Input
                    value={styles.textShadow || ''}
                    onChange={(e) =>
                      handleStyleChange('textShadow', e.target.value)
                    }
                    placeholder="0 0 0 rgba(0,0,0,0)"
                    size="small"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>

        {/* 自定义CSS */}
        <Card title="自定义CSS" size="small">
          <Form layout="vertical" size="small">
            <Form.Item label="CSS代码">
              <Input.TextArea
                value={styles.customCSS || ''}
                onChange={(e) => handleStyleChange('customCSS', e.target.value)}
                placeholder="/* 在这里输入自定义CSS代码 */"
                rows={4}
                size="small"
              />
            </Form.Item>
          </Form>
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
      disabled: isCardSelected || false,
      children: (
        <div style={{ height: 'calc(100vh - 120px)', overflow: 'auto' }}>
          {renderProperties()}
        </div>
      ),
    },
    {
      key: 'styles',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <SkinOutlined />
          样式
        </span>
      ),
      children: (
        <div style={{ height: 'calc(100vh - 120px)', overflow: 'auto' }}>
          {renderStyles()}
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
      disabled: isCardSelected || false,
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
