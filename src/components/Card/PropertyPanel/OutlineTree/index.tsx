// 大纲树面板 - 修复数据结构展示

import { BarsOutlined } from '@ant-design/icons';
import { Space, Tree, Typography } from 'antd';
import React, { useMemo } from 'react';
import { COMPONENT_TYPES } from '../../constants';
import { OutlineTreeProps } from '../types';

const { Text } = Typography;

const OutlineTree: React.FC<OutlineTreeProps> = ({
  data,
  selectedPath,
  onOutlineHover,
  onOutlineSelect,
}) => {
  // 构建树形数据 - 正确反映卡片数据结构
  const treeData = useMemo(() => {
    // 添加空值检查，防止访问 undefined 的属性
    if (!data || !data.dsl || !data.dsl.body) {
      console.warn('⚠️ OutlineTree: 数据结构不完整，返回空树', {
        data,
        hasData: !!data,
        hasDsl: !!data?.dsl,
        hasBody: !!data?.dsl?.body,
        hasElements: !!data?.dsl?.body?.elements,
      });
      return [];
    }

    // 确保 elements 数组存在，如果不存在则初始化为空数组
    if (!data.dsl.body.elements) {
      console.log('⚠️ OutlineTree: elements 不存在，初始化为空数组');
      data.dsl.body.elements = [];
    }

    const buildTreeNode = (
      component: any,
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
            (child: any, childIndex: number) =>
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
                  (child: any, childIndex: number) =>
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

    // 创建节点数组
    const nodes: any[] = [];

    // 如果存在标题数据，添加标题节点
    if (
      data.dsl?.header &&
      (data.dsl.header.title?.content || data.dsl.header.subtitle?.content)
    ) {
      const titleNode: any = {
        title: (
          <Space size={4}>
            <Text
              style={{ fontSize: '14px', fontWeight: 'bold', color: '#722ed1' }}
            >
              👑 标题
            </Text>
          </Space>
        ),
        key: 'dsl-header',
        path: ['dsl', 'header'],
        component: {
          id: 'title-component',
          tag: 'title',
          style: data.dsl.header?.style || 'blue',
        },
      };
      nodes.push(titleNode);
    }

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
    nodes.push(cardNode);

    return nodes;
  }, [data]);

  // 早期返回，如果数据为空
  if (!data) {
    console.warn('⚠️ OutlineTree: data 为空，显示空状态');
    return (
      <div style={{ padding: '16px' }}>
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
          <div style={{ fontSize: '14px', marginBottom: '8px' }}>
            数据加载中
          </div>
          <div style={{ fontSize: '12px' }}>请稍等数据加载完成</div>
        </div>
      </div>
    );
  }

  const handleSelect = (selectedKeys: React.Key[], info: any) => {
    if (info.node?.path) {
      // 如果是卡片节点，传递null作为组件，路径为['dsl', 'body']
      if (
        info.node.path.length === 2 &&
        info.node.path[0] === 'dsl' &&
        info.node.path[1] === 'body'
      ) {
        onOutlineSelect(null, info.node.path);
      } else if (info.node.component) {
        onOutlineSelect(info.node.component, info.node.path);
      } else if (info.node.path && info.node.path.length > 0) {
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
            📊 卡片包含 {data?.dsl?.body?.elements?.length || 0} 个组件
          </Text>
        </div>

        {treeData.length > 0 ? (
          <>
            <div
              style={{ marginBottom: '8px', fontSize: '11px', color: '#666' }}
            >
              调试信息: 找到 {treeData.length} 个节点
            </div>
            <Tree
              treeData={treeData}
              selectedKeys={selectedKeys}
              onSelect={handleSelect}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              showIcon={false}
              blockNode
              defaultExpandAll
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
              padding: '20px',
              border: '2px dashed #d9d9d9',
              borderRadius: '8px',
              backgroundColor: '#fafafa',
            }}
          >
            <BarsOutlined style={{ fontSize: '24px', marginBottom: '8px' }} />
            <div style={{ fontSize: '12px', marginBottom: '4px' }}>
              暂无组件
            </div>
            <div style={{ fontSize: '11px' }}>从组件库拖拽组件到画布中</div>
            <div style={{ fontSize: '10px', marginTop: '8px', color: '#999' }}>
              调试: treeData.length = {treeData.length}
            </div>
          </div>
        )}
      </>
    </div>
  );
};

export default OutlineTree;
