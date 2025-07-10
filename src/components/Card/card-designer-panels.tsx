// Panels.tsx - 面板组件文件

import {
  AppstoreOutlined,
  BgColorsOutlined,
  DeleteOutlined,
  DragOutlined,
  FormatPainterOutlined,
  PlusOutlined,
  SettingOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Collapse,
  ColorPicker,
  Divider,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Switch,
  Tabs,
  Typography,
  Upload,
} from 'antd';
import type { Color } from 'antd/es/color-picker';
import React, { useState } from 'react';
import { useDrag } from 'react-dnd';
import {
  COMPONENT_CATEGORIES,
  COMPONENT_TYPES,
} from './card-designer-constants';
import { ComponentType, DragItem, Variable } from './card-designer-types';

const { TabPane } = Tabs;
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
          // headStyle={{
          //   backgroundColor: category.color,
          //   color: 'white',
          //   borderRadius: '6px 6px 0 0',
          // }}
          // bodyStyle={{ padding: '12px' }}
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: 'white',
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
      case 'plain_text':
        return (
          <div style={{ padding: '16px' }}>
            <Collapse defaultActiveKey={['content', 'style']} ghost>
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
                </Form>
              </Panel>
              <Panel header="🎨 样式设置" key="style">
                <Form form={form} layout="vertical">
                  <Form.Item label="文本颜色">
                    <ColorPicker
                      value={comp.textColor || '#000000'}
                      onChange={(color: Color) =>
                        handleValueChange('textColor', color.toHexString())
                      }
                      showText
                      size="small"
                    />
                  </Form.Item>
                  <Form.Item label="字体大小">
                    <InputNumber
                      value={comp.fontSize || 14}
                      onChange={(value) => handleValueChange('fontSize', value)}
                      min={12}
                      max={48}
                      addonAfter="px"
                      style={{ width: '100%' }}
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
                      <Option value="lighter">较细</Option>
                      <Option value="normal">正常</Option>
                      <Option value="bold">加粗</Option>
                      <Option value="bolder">更粗</Option>
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
                      <Option value="justify">两端对齐</Option>
                    </Select>
                  </Form.Item>
                </Form>
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
                        handleValueChange('placeholder', {
                          ...comp.placeholder,
                          content: e.target.value,
                        })
                      }
                      placeholder="请输入占位符"
                    />
                  </Form.Item>
                  <Form.Item label="默认值">
                    <Input
                      value={comp.default_value?.content || ''}
                      onChange={(e) =>
                        handleValueChange('default_value', {
                          ...comp.default_value,
                          content: e.target.value,
                        })
                      }
                      placeholder="请输入默认值"
                    />
                  </Form.Item>
                  <Form.Item label="输入框类型">
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
                      <Option value="url">网址</Option>
                      <Option value="search">搜索</Option>
                    </Select>
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
            <Collapse defaultActiveKey={['content', 'style', 'behavior']} ghost>
              <Panel header="📝 内容设置" key="content">
                <Form form={form} layout="vertical">
                  <Form.Item label="按钮文本">
                    <Input
                      value={comp.text?.content || ''}
                      onChange={(e) =>
                        handleValueChange('text', {
                          ...comp.text,
                          content: e.target.value,
                        })
                      }
                      placeholder="请输入按钮文本"
                    />
                  </Form.Item>
                </Form>
              </Panel>
              <Panel header="🎨 样式设置" key="style">
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
                      <Option value="small">小尺寸</Option>
                      <Option value="middle">中尺寸</Option>
                      <Option value="large">大尺寸</Option>
                    </Select>
                  </Form.Item>
                  <Form.Item label="危险按钮">
                    <Switch
                      checked={comp.danger || false}
                      onChange={(checked) =>
                        handleValueChange('danger', checked)
                      }
                      checkedChildren="危险"
                      unCheckedChildren="普通"
                    />
                  </Form.Item>
                </Form>
              </Panel>
              <Panel header="⚡ 行为设置" key="behavior">
                <Form form={form} layout="vertical">
                  <Form.Item label="表单行为类型">
                    <Select
                      value={comp.form_action_type || ''}
                      onChange={(value) =>
                        handleValueChange('form_action_type', value)
                      }
                      style={{ width: '100%' }}
                      placeholder="请选择表单行为类型"
                      allowClear
                    >
                      <Option value="submit">提交表单</Option>
                      <Option value="reset">重置表单</Option>
                    </Select>
                  </Form.Item>
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

      case 'img':
        return (
          <div style={{ padding: '16px' }}>
            <Collapse defaultActiveKey={['content', 'style']} ghost>
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
                  <Form.Item label="上传图片">
                    <Upload
                      showUploadList={false}
                      beforeUpload={() => false}
                      onChange={(info) => {
                        const file = info.file;
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (e) => {
                            handleValueChange('img_url', e.target?.result);
                          };
                          reader.readAsDataURL(file as any);
                        }
                      }}
                    >
                      <Button icon={<UploadOutlined />} size="small">
                        选择图片
                      </Button>
                    </Upload>
                  </Form.Item>
                </Form>
              </Panel>
              <Panel header="📐 尺寸设置" key="style">
                <Form form={form} layout="vertical">
                  <Form.Item label="图片宽度">
                    <InputNumber
                      value={comp.width || 300}
                      onChange={(value) => handleValueChange('width', value)}
                      min={50}
                      max={1000}
                      addonAfter="px"
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                  <Form.Item label="图片高度">
                    <InputNumber
                      value={comp.height || 200}
                      onChange={(value) => handleValueChange('height', value)}
                      min={50}
                      max={1000}
                      addonAfter="px"
                      style={{ width: '100%' }}
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
                          img_url: 'https://via.placeholder.com/150x150',
                          i18n_img_url: {
                            'en-US': 'https://via.placeholder.com/150x150',
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
                  <Form.Item label="列间距">
                    <InputNumber
                      value={comp.gap || 8}
                      onChange={(value) => handleValueChange('gap', value)}
                      min={0}
                      max={50}
                      addonAfter="px"
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Form>
              </Panel>
            </Collapse>
          </div>
        );

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
                  <Form.Item label="表单说明">
                    <Input.TextArea
                      value={comp.description || ''}
                      onChange={(e) =>
                        handleValueChange('description', e.target.value)
                      }
                      placeholder="请输入表单说明"
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
              <Panel header="📝 内容设置" key="content">
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

        <Card title={<span>⚡ 事件配置</span>} style={{ marginBottom: '16px' }}>
          <Collapse ghost>
            <Panel header="🖱️ 点击事件" key="click">
              <div
                style={{ color: '#666', fontSize: '12px', lineHeight: '1.6' }}
              >
                <p style={{ margin: '4px 0' }}>• 按钮点击事件</p>
                <p style={{ margin: '4px 0' }}>• 表单提交事件</p>
                <p style={{ margin: '4px 0' }}>• 自定义回调事件</p>
                <p style={{ margin: '4px 0' }}>• 页面跳转事件</p>
              </div>
            </Panel>
            <Panel header="📝 数据变化事件" key="change">
              <div
                style={{ color: '#666', fontSize: '12px', lineHeight: '1.6' }}
              >
                <p style={{ margin: '4px 0' }}>• 输入框值变化</p>
                <p style={{ margin: '4px 0' }}>• 选择器选项变化</p>
                <p style={{ margin: '4px 0' }}>• 表单数据变化</p>
                <p style={{ margin: '4px 0' }}>• 文件上传事件</p>
              </div>
            </Panel>
            <Panel header="🔄 生命周期事件" key="lifecycle">
              <div
                style={{ color: '#666', fontSize: '12px', lineHeight: '1.6' }}
              >
                <p style={{ margin: '4px 0' }}>• 组件加载完成</p>
                <p style={{ margin: '4px 0' }}>• 组件卸载前</p>
                <p style={{ margin: '4px 0' }}>• 数据更新后</p>
                <p style={{ margin: '4px 0' }}>• 错误处理事件</p>
              </div>
            </Panel>
            <Panel header="🌐 网络事件" key="network">
              <div
                style={{ color: '#666', fontSize: '12px', lineHeight: '1.6' }}
              >
                <p style={{ margin: '4px 0' }}>• API 请求事件</p>
                <p style={{ margin: '4px 0' }}>• 数据提交事件</p>
                <p style={{ margin: '4px 0' }}>• 文件下载事件</p>
                <p style={{ margin: '4px 0' }}>• WebSocket 连接</p>
              </div>
            </Panel>
          </Collapse>
          <Divider />
          <div
            style={{
              textAlign: 'center',
              padding: '16px',
              backgroundColor: '#f9f9f9',
              borderRadius: '6px',
            }}
          >
            <Text type="secondary" style={{ fontSize: '12px' }}>
              🚧 事件配置功能正在开发中，敬请期待...
            </Text>
          </div>
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
      >
        <TabPane
          tab={
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FormatPainterOutlined />
              属性配置
            </span>
          }
          key="properties"
        >
          <div style={{ height: 'calc(100vh - 120px)', overflow: 'auto' }}>
            {renderProperties()}
          </div>
        </TabPane>
        <TabPane
          tab={
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <BgColorsOutlined />
              事件管理
            </span>
          }
          key="events"
        >
          <div style={{ height: 'calc(100vh - 120px)', overflow: 'auto' }}>
            {renderEvents()}
          </div>
        </TabPane>
      </Tabs>
    </div>
  );
};
