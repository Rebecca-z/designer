// src/components/PropertyPanel.tsx
import type { CanvasNode } from '@/types';
import { Form, Input, InputNumber, Select, Switch, Tabs } from 'antd';
import React, { useMemo } from 'react';

type PropertyPanelProps = {
  selected: string | null;
  data: CanvasNode[];
  setData: (data: CanvasNode[]) => void;
};

const findNodeById = (
  nodes: CanvasNode[],
  id: string | null,
): CanvasNode | null => {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
};

const PropertyPanel: React.FC<PropertyPanelProps> = ({
  selected,
  data,
  setData,
}) => {
  const [form] = Form.useForm();

  // 获取当前选中节点
  const node = useMemo(() => findNodeById(data, selected), [data, selected]);

  // 属性表单项配置
  const getPropertyFields = (type: string) => {
    switch (type) {
      case 'text':
        return [
          { name: 'text', label: '文案', component: <Input /> },
          { name: 'color', label: '颜色', component: <Input type="color" /> },
          {
            name: 'fontSize',
            label: '字号',
            component: <InputNumber min={12} max={48} />,
          },
        ];
      case 'button':
        return [
          { name: 'text', label: '按钮文案', component: <Input /> },
          { name: 'color', label: '颜色', component: <Input type="color" /> },
          {
            name: 'background',
            label: '背景色',
            component: <Input type="color" />,
          },
        ];
      case 'input':
        return [
          { name: 'placeholder', label: '占位符', component: <Input /> },
          { name: 'disabled', label: '禁用', component: <Switch /> },
        ];
      // ... 其他类型
      default:
        return [];
    }
  };

  // 事件表单项配置
  const getEventFields = (type: string) => {
    switch (type) {
      case 'button':
        return [
          {
            name: 'onClick',
            label: '点击事件',
            component: (
              <Select>
                <Select.Option value="alert">弹窗</Select.Option>
                <Select.Option value="submit">提交</Select.Option>
              </Select>
            ),
          },
        ];
      case 'input':
        return [
          {
            name: 'onChange',
            label: '输入事件',
            component: (
              <Select>
                <Select.Option value="log">打印</Select.Option>
                <Select.Option value="validate">校验</Select.Option>
              </Select>
            ),
          },
        ];
      // ... 其他类型
      default:
        return [];
    }
  };

  // 更新属性
  const handleValuesChange = (changed: any, all: any) => {
    const updateNode = (nodes: CanvasNode[]): CanvasNode[] =>
      nodes.map((n) => {
        if (n.id === selected) {
          return { ...n, props: { ...n.props, ...all } };
        }
        if (n.children) {
          return { ...n, children: updateNode(n.children) };
        }
        return n;
      });
    setData(updateNode(data));
  };

  // 初始化表单
  React.useEffect(() => {
    if (node) {
      form.setFieldsValue(node.props);
    } else {
      form.resetFields();
    }
  }, [node, form]);

  if (!node) {
    return (
      <div style={{ padding: 24, color: '#bbb' }}>
        请选择画布中的组件进行属性设置
      </div>
    );
  }

  return (
    <Tabs defaultActiveKey="property">
      <Tabs.TabPane tab="属性" key="property">
        <Form
          form={form}
          layout="vertical"
          onValuesChange={handleValuesChange}
          initialValues={node.props}
        >
          {getPropertyFields(node.type).map((field) => (
            <Form.Item
              key={field.name}
              name={field.name}
              label={field.label}
              valuePropName={
                field.component.type === Switch ? 'checked' : 'value'
              }
            >
              {field.component}
            </Form.Item>
          ))}
        </Form>
      </Tabs.TabPane>
      <Tabs.TabPane tab="事件" key="event">
        <Form
          layout="vertical"
          onValuesChange={handleValuesChange}
          initialValues={node.props}
        >
          {getEventFields(node.type).map((field) => (
            <Form.Item key={field.name} name={field.name} label={field.label}>
              {field.component}
            </Form.Item>
          ))}
        </Form>
      </Tabs.TabPane>
    </Tabs>
  );
};

export default PropertyPanel;
