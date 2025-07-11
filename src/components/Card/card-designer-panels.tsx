// card-designer-panels.tsx - 更新的面板组件文件

import {
  AppstoreOutlined,
  BgColorsOutlined,
  DeleteOutlined,
  DragOutlined,
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
  Switch,
  Tabs,
  Typography,
} from 'antd';
import React, { useState } from 'react';
import { useDrag } from 'react-dnd';
import {
  COMPONENT_CATEGORIES,
  COMPONENT_TYPES,
} from './card-designer-constants';
import { ComponentType, DragItem, Variable } from './card-designer-types';

const { Option } = Select;
const { Text, Title } = Typography;
const { Panel } = Collapse;

// 拖拽项组件
const DragItemComp: React.FC<{ type: string; children: React.ReactNode }> = ({
  type,
  children,
}) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'component',
    item: { type, isNew: true } as DragItem,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move',
        padding: '8px',
        border: '1px solid #d9d9d9',
        borderRadius: '4px',
        marginBottom: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: '#fff',
        transition: 'all 0.2s ease',
      }}
    >
      <DragOutlined />
      {children}
    </div>
  );
};

// 左侧组件面板
export const ComponentPanel: React.FC = () => {
  return (
    <div
      style={{
        width: '250px',
        height: 'calc(100vh - 60px)',
        backgroundColor: '#fafafa',
        padding: '16px',
        overflow: 'auto',
        borderRight: '1px solid #d9d9d9',
      }}
    >
      <Title level={5} style={{ marginBottom: '16px', color: '#333' }}>
        🧩 组件库
      </Title>

      {COMPONENT_CATEGORIES.map((category) => (
        <Card
          key={category.key}
          size="small"
          style={{ marginBottom: '16px' }}
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: category.color,
                }}
              />
              {category.title}
            </div>
          }
        >
          {Object.entries(COMPONENT_TYPES)
            .filter(([, config]) => config.category === category.key)
            .map(([type, config]) => (
              <DragItemComp key={type} type={type}>
                <config.icon style={{ color: category.color }} />
                <span style={{ fontSize: '14px' }}>{config.name}</span>
              </DragItemComp>
            ))}
        </Card>
      ))}

      <Card
        size="small"
        title={<span>💡 使用说明</span>}
        style={{ marginTop: '16px' }}
      >
        <div style={{ fontSize: '12px', color: '#666', lineHeight: '1.6' }}>
          <p style={{ margin: '4px 0' }}>• 拖拽组件到画布中</p>
          <p style={{ margin: '4px 0' }}>• 点击组件进行选中</p>
          <p style={{ margin: '4px 0' }}>• 右侧配置组件属性</p>
          <p style={{ margin: '4px 0' }}>• 容器组件支持嵌套</p>
          <p style={{ margin: '4px 0' }}>• 支持快捷键操作</p>
        </div>
      </Card>
    </div>
  );
};

// 右侧属性面板
export const PropertyPanel: React.FC<{
  selectedComponent: ComponentType | null;
  onUpdateComponent: (component: ComponentType) => void;
  variables: Variable[];
  onUpdateVariables: (variables: Variable[]) => void;
}> = ({
  selectedComponent,
  onUpdateComponent,
  variables,
  onUpdateVariables,
}) => {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState<string>('properties');

  const handleValueChange = (field: string, value: any) => {
    if (selectedComponent) {
      const updated = { ...selectedComponent, [field]: value };
      onUpdateComponent(updated);
    }
  };

  const handleNestedValueChange = (
    parentField: string,
    field: string,
    value: any,
  ) => {
    if (selectedComponent) {
      const updated = {
        ...selectedComponent,
        [parentField]: {
          ...(selectedComponent as any)[parentField],
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
            点击画布中的组件开始配置属性
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

      case 'rich_text':
        return (
          <div style={{ padding: '16px' }}>
            <Collapse defaultActiveKey={['content']} ghost>
              <Panel header="📝 富文本设置" key="content">
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
              </Panel>
            </Collapse>
          </div>
        );

      case 'img':
        return (
          <div style={{ padding: '16px' }}>
            <Collapse defaultActiveKey={['content']} ghost>
              <Panel header="🖼️ 图片设置" key="content">
                <Form form={form} layout="vertical">
                  <Form.Item label="图片地址">
                    <Input
                      value={comp.img_url || ''}
                      onChange={(e) =>
                        handleValueChange('img_url', e.target.value)
                      }
                      placeholder="请输入图片地址"
                    />
                  </Form.Item>
                  <Form.Item label="英文图片地址">
                    <Input
                      value={comp.i18n_img_url?.['en-US'] || ''}
                      onChange={(e) => {
                        const updated = {
                          ...comp.i18n_img_url,
                          'en-US': e.target.value,
                        };
                        handleValueChange('i18n_img_url', updated);
                      }}
                      placeholder="请输入英文图片地址"
                    />
                  </Form.Item>
                </Form>
              </Panel>
            </Collapse>
          </div>
        );

      case 'img_combination':
        return (
          <div style={{ padding: '16px' }}>
            <Collapse defaultActiveKey={['layout', 'images']} ghost>
              <Panel header="🏗️ 布局设置" key="layout">
                <Form form={form} layout="vertical">
                  <Form.Item label="组合模式">
                    <Select
                      value={comp.combination_mode || 'trisect'}
                      onChange={(value) =>
                        handleValueChange('combination_mode', value)
                      }
                      style={{ width: '100%' }}
                    >
                      <Option value="bisect">二分组合</Option>
                      <Option value="trisect">三分组合</Option>
                      <Option value="quad">四分组合</Option>
                    </Select>
                  </Form.Item>
                  <Form.Item label="透明背景">
                    <Switch
                      checked={comp.combination_transparent || false}
                      onChange={(checked) =>
                        handleValueChange('combination_transparent', checked)
                      }
                      checkedChildren="透明"
                      unCheckedChildren="不透明"
                    />
                  </Form.Item>
                </Form>
              </Panel>
              <Panel header="🖼️ 图片设置" key="images">
                <div>
                  {comp.img_list?.map((img: any, index: number) => (
                    <Card
                      key={index}
                      size="small"
                      style={{ marginBottom: '8px' }}
                    >
                      <Row gutter={8}>
                        <Col span={20}>
                          <Input
                            placeholder="图片地址"
                            value={img.img_url || ''}
                            onChange={(e) => {
                              const newImgList = [...(comp.img_list || [])];
                              newImgList[index] = {
                                ...newImgList[index],
                                img_url: e.target.value,
                              };
                              handleValueChange('img_list', newImgList);
                            }}
                            size="small"
                          />
                        </Col>
                        <Col span={4}>
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            size="small"
                            onClick={() => {
                              const newImgList = (comp.img_list || []).filter(
                                (_: any, i: number) => i !== index,
                              );
                              handleValueChange('img_list', newImgList);
                            }}
                          />
                        </Col>
                      </Row>
                    </Card>
                  ))}
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      const newImgList = [
                        ...(comp.img_list || []),
                        {
                          img_url:
                            'img_v2_9dd98485-2900-4d65-ada9-e31d1408dcfg',
                          i18n_img_url: {
                            'en-US':
                              'img_v2_9dd98485-2900-4d65-ada9-e31d1408dcfg',
                          },
                        },
                      ];
                      handleValueChange('img_list', newImgList);
                    }}
                    style={{ width: '100%' }}
                    size="small"
                  >
                    添加图片
                  </Button>
                </div>
              </Panel>
            </Collapse>
          </div>
        );

      case 'input':
        return (
          <div style={{ padding: '16px' }}>
            <Collapse defaultActiveKey={['basic', 'validation']} ghost>
              <Panel header="⚙️ 基础设置" key="basic">
                <Form form={form} layout="vertical">
                  <Form.Item label="组件名称">
                    <Input
                      value={comp.name || ''}
                      onChange={(e) =>
                        handleValueChange('name', e.target.value)
                      }
                      placeholder="请输入组件名称"
                    />
                  </Form.Item>
                  <Form.Item label="占位符">
                    <Input
                      value={comp.placeholder?.content || ''}
                      onChange={(e) =>
                        handleNestedValueChange(
                          'placeholder',
                          'content',
                          e.target.value,
                        )
                      }
                      placeholder="请输入占位符"
                    />
                  </Form.Item>
                  <Form.Item label="占位符(英文)">
                    <Input
                      value={comp.placeholder?.i18n_content?.['en-US'] || ''}
                      onChange={(e) => {
                        const updated = {
                          ...comp.placeholder,
                          i18n_content: {
                            ...comp.placeholder?.i18n_content,
                            'en-US': e.target.value,
                          },
                        };
                        handleValueChange('placeholder', updated);
                      }}
                      placeholder="请输入英文占位符"
                    />
                  </Form.Item>
                  <Form.Item label="默认值">
                    <Input
                      value={comp.default_value?.content || ''}
                      onChange={(e) =>
                        handleNestedValueChange(
                          'default_value',
                          'content',
                          e.target.value,
                        )
                      }
                      placeholder="请输入默认值"
                    />
                  </Form.Item>
                  <Form.Item label="默认值(英文)">
                    <Input
                      value={comp.default_value?.i18n_content?.['en-US'] || ''}
                      onChange={(e) => {
                        const updated = {
                          ...comp.default_value,
                          i18n_content: {
                            ...comp.default_value?.i18n_content,
                            'en-US': e.target.value,
                          },
                        };
                        handleValueChange('default_value', updated);
                      }}
                      placeholder="请输入英文默认值"
                    />
                  </Form.Item>
                </Form>
              </Panel>
              <Panel header="✅ 验证设置" key="validation">
                <Form form={form} layout="vertical">
                  <Form.Item label="是否必填">
                    <Switch
                      checked={comp.required || false}
                      onChange={(checked) =>
                        handleValueChange('required', checked)
                      }
                      checkedChildren="必填"
                      unCheckedChildren="可选"
                    />
                  </Form.Item>
                </Form>
              </Panel>
            </Collapse>
          </div>
        );

      case 'button':
        return (
          <div style={{ padding: '16px' }}>
            <Collapse defaultActiveKey={['content', 'behavior']} ghost>
              <Panel header="📝 内容设置" key="content">
                <Form form={form} layout="vertical">
                  <Form.Item label="组件名称">
                    <Input
                      value={comp.name || ''}
                      onChange={(e) =>
                        handleValueChange('name', e.target.value)
                      }
                      placeholder="请输入组件名称"
                    />
                  </Form.Item>
                  <Form.Item label="按钮文本">
                    <Input
                      value={comp.text?.content || ''}
                      onChange={(e) => {
                        const updated = {
                          ...comp.text,
                          content: e.target.value,
                        };
                        handleValueChange('text', updated);
                      }}
                      placeholder="请输入按钮文本"
                    />
                  </Form.Item>
                  <Form.Item label="按钮文本(英文)">
                    <Input
                      value={comp.text?.i18n_content?.['en-US'] || ''}
                      onChange={(e) => {
                        const updated = {
                          ...comp.text,
                          i18n_content: {
                            ...comp.text?.i18n_content,
                            'en-US': e.target.value,
                          },
                        };
                        handleValueChange('text', updated);
                      }}
                      placeholder="请输入英文按钮文本"
                    />
                  </Form.Item>
                </Form>
              </Panel>
              <Panel header="⚡ 行为设置" key="behavior">
                <Form form={form} layout="vertical">
                  <Form.Item label="表单行为类型">
                    <Select
                      value={comp.form_action_type || ''}
                      onChange={(value) => {
                        if (value) {
                          handleValueChange('form_action_type', value);
                          // 如果设置了表单行为，清除 behaviors
                          if (comp.behaviors) {
                            const updated = { ...comp };
                            delete updated.behaviors;
                            onUpdateComponent(updated);
                          }
                        } else {
                          const updated = { ...comp };
                          delete updated.form_action_type;
                          onUpdateComponent(updated);
                        }
                      }}
                      style={{ width: '100%' }}
                      placeholder="请选择表单行为类型"
                      allowClear
                    >
                      <Option value="submit">提交表单</Option>
                      <Option value="reset">重置表单</Option>
                    </Select>
                  </Form.Item>

                  {!comp.form_action_type && (
                    <Form.Item label="自定义行为">
                      <div style={{ marginBottom: '8px' }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          当前行为类型: {comp.behaviors?.[0]?.type || '无'}
                        </Text>
                      </div>
                      <Select
                        value={comp.behaviors?.[0]?.type || ''}
                        onChange={(value) => {
                          if (value === 'callback') {
                            handleValueChange('behaviors', [
                              {
                                type: 'callback',
                                callback: {
                                  action: 'click',
                                },
                              },
                            ]);
                          } else if (value === 'open_url') {
                            handleValueChange('behaviors', [
                              {
                                type: 'open_url',
                                open_url: {
                                  multi_url: {
                                    url: 'http://www.example.com',
                                    android_url: '',
                                    ios_url: '',
                                    pc_url: '',
                                  },
                                },
                              },
                            ]);
                          }
                        }}
                        style={{ width: '100%' }}
                        placeholder="请选择行为类型"
                        allowClear
                      >
                        <Option value="callback">回调</Option>
                        <Option value="open_url">打开链接</Option>
                      </Select>
                    </Form.Item>
                  )}

                  {comp.behaviors?.[0]?.type === 'open_url' && (
                    <div>
                      <Form.Item label="默认链接">
                        <Input
                          value={
                            comp.behaviors[0].open_url?.multi_url?.url || ''
                          }
                          onChange={(e) => {
                            const updated = [...(comp.behaviors || [])];
                            updated[0] = {
                              ...updated[0],
                              open_url: {
                                ...updated[0].open_url,
                                multi_url: {
                                  ...updated[0].open_url?.multi_url,
                                  url: e.target.value,
                                },
                              },
                            };
                            handleValueChange('behaviors', updated);
                          }}
                          placeholder="请输入默认链接"
                        />
                      </Form.Item>
                    </div>
                  )}
                </Form>
              </Panel>
            </Collapse>
          </div>
        );

      case 'select_static':
      case 'multi_select_static':
        return (
          <div style={{ padding: '16px' }}>
            <Collapse defaultActiveKey={['basic', 'options']} ghost>
              <Panel header="⚙️ 基础设置" key="basic">
                <Form form={form} layout="vertical">
                  <Form.Item label="组件名称">
                    <Input
                      value={comp.name || ''}
                      onChange={(e) =>
                        handleValueChange('name', e.target.value)
                      }
                      placeholder="请输入组件名称"
                    />
                  </Form.Item>
                  <Form.Item label="是否必填">
                    <Switch
                      checked={comp.required || false}
                      onChange={(checked) =>
                        handleValueChange('required', checked)
                      }
                      checkedChildren="必填"
                      unCheckedChildren="可选"
                    />
                  </Form.Item>
                </Form>
              </Panel>
              <Panel header="📋 选项配置" key="options">
                <div>
                  {comp.options?.map((option: any, index: number) => (
                    <Card
                      key={index}
                      size="small"
                      style={{ marginBottom: '8px' }}
                    >
                      <Row gutter={8}>
                        <Col span={8}>
                          <Input
                            placeholder="选项值"
                            value={option.value || ''}
                            onChange={(e) => {
                              const newOptions = [...(comp.options || [])];
                              newOptions[index] = {
                                ...newOptions[index],
                                value: e.target.value,
                              };
                              handleValueChange('options', newOptions);
                            }}
                            size="small"
                          />
                        </Col>
                        <Col span={12}>
                          <Input
                            placeholder="选项文本"
                            value={option.text?.content || ''}
                            onChange={(e) => {
                              const newOptions = [...(comp.options || [])];
                              newOptions[index] = {
                                ...newOptions[index],
                                text: {
                                  ...newOptions[index].text,
                                  content: e.target.value,
                                },
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
                            icon={<DeleteOutlined />}
                            size="small"
                            onClick={() => {
                              const newOptions = (comp.options || []).filter(
                                (_: any, i: number) => i !== index,
                              );
                              handleValueChange('options', newOptions);
                            }}
                          />
                        </Col>
                      </Row>
                      <Row gutter={8} style={{ marginTop: '4px' }}>
                        <Col span={20}>
                          <Input
                            placeholder="英文选项文本"
                            value={option.text?.i18n_content?.['en-US'] || ''}
                            onChange={(e) => {
                              const newOptions = [...(comp.options || [])];
                              newOptions[index] = {
                                ...newOptions[index],
                                text: {
                                  ...newOptions[index].text,
                                  i18n_content: {
                                    ...newOptions[index].text?.i18n_content,
                                    'en-US': e.target.value,
                                  },
                                },
                              };
                              handleValueChange('options', newOptions);
                            }}
                            size="small"
                          />
                        </Col>
                      </Row>
                    </Card>
                  ))}
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      const newOptions = [
                        ...(comp.options || []),
                        {
                          value: '',
                          text: {
                            content: '',
                            i18n_content: { 'en-US': '' },
                          },
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
              </Panel>
            </Collapse>
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
    if (!selectedComponent) {
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

        <Card title={<span>📊 组件信息</span>} size="small">
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
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
