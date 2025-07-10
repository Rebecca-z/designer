import { Button, Input, Popover } from 'antd';
import React, { useEffect, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import type { CanvasNode } from '../../types';

type CanvasProps = {
  data: CanvasNode[];
  setData: (data: CanvasNode[]) => void;
  selected: string | null;
  setSelected: (id: string | null) => void;
  device: string;
};

const genId = () => Math.random().toString(36).slice(2, 10);

const moveNode = (list: CanvasNode[], from: number, to: number) => {
  const arr = [...list];
  const [removed] = arr.splice(from, 1);
  arr.splice(to, 0, removed);
  return arr;
};

// 空分栏时，整个区域可drop
const DropColAll: React.FC<{
  node: CanvasNode;
  colIdx: number;
  setData: (data: CanvasNode[]) => void;
  data: CanvasNode[];
}> = ({ node, colIdx, setData, data }) => {
  const [, drop] = useDrop({
    accept: ['component', 'layout'],
    canDrop: (item: any) => item.componentType !== 'layout-columns',
    drop: (item: any) => {
      if (!node.children) node.children = [];
      // 计算插入到children的哪个位置
      let insertIdx = 0;
      for (let i = 0; i < node.children.length; i++) {
        if (i % 2 === colIdx) insertIdx++;
      }
      const newNode: CanvasNode = {
        id: genId(),
        type: item.componentType,
        props: {},
        children: item.type === 'layout' ? [] : undefined,
      };
      // 插入到children的合适位置
      let realIdx = 0;
      for (let i = 0, cnt = 0; i < node.children.length + 1; i++) {
        if (i === node.children.length || i % 2 === colIdx) {
          if (cnt === insertIdx) {
            realIdx = i;
            break;
          }
          cnt++;
        }
      }
      node.children.splice(realIdx, 0, newNode);
      setData([...data]);
    },
  });
  return (
    <div
      ref={drop}
      style={{
        minHeight: 48,
        background: '#f0f0f0',
        border: '1px dashed #bbb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#bbb',
      }}
    >
      拖拽组件到此处
    </div>
  );
};

// 分栏有内容时，子元素前后都可drop
const DropColPos: React.FC<{
  node: CanvasNode;
  colIdx: number;
  pos: number;
  setData: (data: CanvasNode[]) => void;
  data: CanvasNode[];
}> = ({ node, colIdx, pos, setData, data }) => {
  const [, drop] = useDrop({
    accept: ['component', 'layout'],
    canDrop: (item: any) => item.componentType !== 'layout-columns',
    drop: (item: any) => {
      if (!node.children) node.children = [];
      // 计算插入到children的哪个位置
      let insertIdx = 0;
      let cnt = 0;
      for (let i = 0; i < node.children.length + 1; i++) {
        if (i === node.children.length || i % 2 === colIdx) {
          if (cnt === pos) {
            insertIdx = i;
            break;
          }
          cnt++;
        }
      }
      const newNode: CanvasNode = {
        id: genId(),
        type: item.componentType,
        props: {},
        children: item.type === 'layout' ? [] : undefined,
      };
      node.children.splice(insertIdx, 0, newNode);
      setData([...data]);
    },
  });
  return <div ref={drop} style={{ minHeight: 8, background: '#f0f0f0' }} />;
};

const Canvas: React.FC<CanvasProps> = ({
  data,
  setData,
  selected,
  setSelected,
  device,
}) => {
  const canvasRef = useRef<HTMLDivElement | null>(null);

  // 画布顶层排序和拖入
  const moveChild = (from: number, to: number, parent: CanvasNode[]) => {
    if (parent === data) {
      setData(moveNode(data, from, to));
    } else {
      const newArr = moveNode(parent, from, to);
      const update = (nodes: CanvasNode[]): CanvasNode[] =>
        nodes.map((n) => {
          if (n.children === parent) {
            return { ...n, children: newArr };
          } else if (n.children) {
            return { ...n, children: update(n.children) };
          }
          return n;
        });
      setData(update(data));
    }
  };

  const addChild = (node: CanvasNode, to: number, parent: CanvasNode[]) => {
    if (parent === data) {
      const arr = [...data];
      arr.splice(to, 0, node);
      setData(arr);
    } else {
      const arr = [...parent];
      arr.splice(to, 0, node);
      const update = (nodes: CanvasNode[]): CanvasNode[] =>
        nodes.map((n) => {
          if (n.children === parent) {
            return { ...n, children: arr };
          } else if (n.children) {
            return { ...n, children: update(n.children) };
          }
          return n;
        });
      setData(update(data));
    }
  };

  // 画布顶层拖拽排序和左侧拖入
  // const [{ isOver: isOverTop }, dropTop] = useDrop({
  const [, dropTop] = useDrop({
    accept: ['canvas-node', 'component', 'layout'],
    drop: (item: any) => {
      // 拖拽到最顶部
      if (
        item.type === 'canvas-node' &&
        item.parent === data &&
        item.index !== 0
      ) {
        moveChild(item.index, 0, data);
      }
      if (item.type === 'component' || item.type === 'layout') {
        if (item.componentType === 'layout-columns') {
          setData([
            { id: genId(), type: 'layout-columns', props: {}, children: [] },
            ...data,
          ]);
        } else {
          setData([
            { id: genId(), type: item.componentType, props: {} },
            ...data,
          ]);
        }
      }
    },
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  });

  // 画布 drop 区（仅处理左侧组件拖入，且只在空白处释放时才添加）
  const [, dropCanvas] = useDrop({
    accept: ['component', 'layout'],
    drop: (item: any, monitor) => {
      // 只在画布空白处（shallow）释放且未被子区域处理时才添加
      if (monitor.didDrop()) return;
      if (!monitor.isOver({ shallow: true })) return;
      const newNode: CanvasNode = {
        id: genId(),
        type: item.componentType,
        props: {},
        children: item.type === 'layout' ? [] : undefined,
      };
      setData([...data, newNode]);
    },
  });

  // 复制节点
  const handleCopy = (id: string) => {
    const findAndCopy = (nodes: CanvasNode[]): CanvasNode[] => {
      return nodes.flatMap((node) => {
        if (node.id === id) {
          const copy = JSON.parse(JSON.stringify(node));
          copy.id = genId();
          return [node, copy];
        }
        if (node.children) {
          node.children = findAndCopy(node.children);
        }
        return [node];
      });
    };
    setData(findAndCopy(data));
  };

  // 删除节点
  const handleDelete = (id: string) => {
    const remove = (nodes: CanvasNode[]): CanvasNode[] =>
      nodes.filter((node) => {
        if (node.id === id) return false;
        if (node.children) node.children = remove(node.children);
        return true;
      });
    setData(remove(data));
    setSelected(null);
  };

  // delete键快捷删除
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selected) {
        handleDelete(selected);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selected, data]);

  const deviceWidth = { web: 800, phone: 375, pad: 600 }[device] || 800;

  useEffect(() => {
    if (canvasRef.current) {
      dropTop(canvasRef.current);
    }
  }, [canvasRef.current]);

  // 渲染节点
  const RenderNode: React.FC<{
    node: CanvasNode;
    onSelect: (id: string) => void;
    selected: string | null;
    onCopy: (id: string) => void;
    onDelete: (id: string) => void;
    setData: (data: CanvasNode[]) => void;
    parent: CanvasNode[];
    parentType?: string;
    index: number;
    moveChild: (from: number, to: number, parent: CanvasNode[]) => void;
    addChild: (node: CanvasNode, to: number, parent: CanvasNode[]) => void;
  }> = ({
    node,
    onSelect,
    selected,
    onCopy,
    onDelete,
    setData,
    parent,
    parentType,
    index,
    moveChild,
    addChild,
  }) => {
    // 拖拽排序
    const [{ isDragging }, drag] = useDrag({
      type: 'canvas-node',
      item: {
        id: node.id,
        index,
        parent,
        parentType,
        nodeType: node.type,
        node,
      },
      collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    });

    // 上方drop区
    // const [{ isOver: isOverTop }, dropTop] = useDrop({
    const [] = useDrop({
      accept: ['canvas-node', 'component', 'layout'],
      // canDrop: (item: any) => {
      //   if (
      //     node.type === 'layout-columns' &&
      //     (item.nodeType === 'layout-columns' ||
      //       item.componentType === 'layout-columns')
      //   )
      //     return false;
      //   if (parentType === 'layout-columns' && node.type === 'layout-columns')
      //     return false;
      //   if (
      //     (item.nodeType === 'layout-columns' ||
      //       item.componentType === 'layout-columns') &&
      //     parentType === 'layout-columns'
      //   )
      //     return false;
      //   return true;
      // },
      drop: (item: any, monitor: any) => {
        if (monitor.didDrop()) return;

        // 拖拽排序（画布内）
        if (
          item.type === 'canvas-node' &&
          item.parent === parent &&
          item.index !== index
        ) {
          moveChild(item.index, index, parent);
        }
        // 左侧拖入
        if (item.type === 'component' || item.type === 'layout') {
          if (
            node.type === 'layout-columns' &&
            item.componentType === 'layout-columns'
          )
            return;
          if (
            parentType === 'layout-columns' &&
            item.componentType === 'layout-columns'
          )
            return;
          if (
            item.componentType === 'layout-columns' &&
            parentType === 'layout-columns'
          )
            return;
          const newNode: CanvasNode = {
            id: genId(),
            type: item.componentType,
            props: {},
            children: item.type === 'layout' ? [] : undefined,
          };
          addChild(newNode, index, parent);
        }
      },
      collect: (monitor) => ({ isOver: monitor.isOver() }),
    });

    // 下方drop区
    const [, dropBottom] = useDrop({
      accept: ['canvas-node', 'component', 'layout'],
      canDrop: (item: any) => {
        if (
          node.type === 'layout-columns' &&
          (item.nodeType === 'layout-columns' ||
            item.componentType === 'layout-columns')
        )
          return false;
        if (parentType === 'layout-columns' && node.type === 'layout-columns')
          return false;
        if (
          (item.nodeType === 'layout-columns' ||
            item.componentType === 'layout-columns') &&
          parentType === 'layout-columns'
        )
          return false;
        return true;
      },
      drop: (item: any) => {
        // 拖拽排序（画布内）
        if (
          item.type === 'canvas-node' &&
          item.parent === parent &&
          item.index !== index
        ) {
          moveChild(item.index, index + 1, parent);
        }
        // 左侧拖入
        if (item.type === 'component' || item.type === 'layout') {
          if (
            node.type === 'layout-columns' &&
            item.componentType === 'layout-columns'
          )
            return;
          if (
            parentType === 'layout-columns' &&
            item.componentType === 'layout-columns'
          )
            return;
          if (
            item.componentType === 'layout-columns' &&
            parentType === 'layout-columns'
          )
            return;
          const newNode: CanvasNode = {
            id: genId(),
            type: item.componentType,
            props: {},
            children: item.type === 'layout' ? [] : undefined,
          };
          addChild(newNode, index + 1, parent);
        }
      },
    });

    const actions = (
      <div>
        <Button
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onCopy(node.id);
          }}
        >
          复制
        </Button>
        <Button
          size="small"
          danger
          style={{ marginLeft: 8 }}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(node.id);
          }}
        >
          删除
        </Button>
      </div>
    );

    let content: React.ReactNode = null;
    switch (node.type) {
      case 'input':
        content = (
          <Input
            placeholder={node.props.placeholder || '请输入'}
            disabled={node.props.disabled}
            style={{ width: 200 }}
          />
        );
        break;
      case 'button':
        content = <Button>{node.props.text || '按钮'}</Button>;
        break;
      case 'layout-columns':
        content = (
          <div
            style={{
              display: 'flex',
              gap: 8,
              minHeight: 60,
              background: '#fafafa',
              padding: 8,
            }}
          >
            {[0, 1].map((colIdx) => {
              // 该分栏的children
              const colChildren =
                node.children?.filter((_, i) => i % 2 === colIdx) || [];
              return (
                <div
                  key={colIdx}
                  style={{
                    flex: 1,
                    minHeight: 60,
                    border: '1px dashed #bbb',
                    background: '#fff',
                    padding: 8,
                    position: 'relative',
                  }}
                >
                  {colChildren.length === 0 ? (
                    // 空分栏时，整个区域可drop
                    <DropColAll
                      node={node}
                      colIdx={colIdx}
                      setData={setData}
                      data={data}
                    />
                  ) : (
                    colChildren
                      .map((child, idx) => (
                        <React.Fragment key={child.id}>
                          {/* 上方drop区 */}
                          <DropColPos
                            node={node}
                            colIdx={colIdx}
                            pos={idx}
                            setData={setData}
                            data={data}
                          />
                          <RenderNode
                            node={child}
                            onSelect={onSelect}
                            selected={selected}
                            onCopy={onCopy}
                            onDelete={onDelete}
                            setData={setData}
                            parent={node.children!}
                            parentType={node.type}
                            index={node.children!.findIndex(
                              (c) => c.id === child.id,
                            )}
                            moveChild={moveChild}
                            addChild={addChild}
                          />
                        </React.Fragment>
                      ))
                      .concat([
                        // 末尾drop区
                        <DropColPos
                          key="end"
                          node={node}
                          colIdx={colIdx}
                          pos={colChildren.length}
                          setData={setData}
                          data={data}
                        />,
                      ])
                  )}
                </div>
              );
            })}
          </div>
        );
        break;
      default:
        content = <span>{node.props.text || node.type}</span>;
    }

    return (
      <Popover
        content={actions}
        trigger="click"
        open={selected === node.id}
        placement="topRight"
      >
        <div>
          <div
            ref={(el) => {
              drag(el);
              dropBottom(el);
            }}
            style={{
              border:
                selected === node.id ? '2px solid #1890ff' : '1px solid #eee',
              margin: 8,
              padding: 8,
              background: '#fafafa',
              position: 'relative',
              minWidth: 60,
              minHeight: 32,
              cursor: 'pointer',
              opacity: isDragging ? 0.5 : 1,
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(node.id);
            }}
          >
            {content}
          </div>
        </div>
      </Popover>
    );
  };

  return (
    <div
      ref={dropCanvas}
      style={{
        minHeight: 400,
        background: '#f5f5f5',
        border: '1px solid #ddd',
        width: deviceWidth,
        margin: '0 auto',
        padding: 16,
      }}
      onClick={() => setSelected(null)}
      tabIndex={0}
    >
      {data.length === 0 ? (
        <div style={{ color: '#bbb', textAlign: 'center', marginTop: 100 }}>
          拖拽组件或布局到此处
        </div>
      ) : (
        data.map((node, idx) => (
          <RenderNode
            key={node.id}
            node={node}
            onSelect={setSelected}
            selected={selected}
            onCopy={handleCopy}
            onDelete={handleDelete}
            setData={setData}
            parent={data}
            parentType={undefined}
            index={idx}
            moveChild={moveChild}
            addChild={addChild}
          />
        ))
      )}
    </div>
  );
};

export default Canvas;
