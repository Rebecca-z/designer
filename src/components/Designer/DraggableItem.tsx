// src/components/DraggableItem.tsx
import React from 'react';
import { useDrag } from 'react-dnd';

export type DraggableItemProps = {
  type: 'component' | 'layout';
  componentType: string; // 例如 'text' | 'button' | 'layout-2' 等
  label: string;
  children?: React.ReactNode;
};

const DraggableItem: React.FC<DraggableItemProps> = (props) => {
  const [{ isDragging }, drag] = useDrag({
    type: props.type,
    item: {
      type: props.type,
      componentType: props.componentType,
      label: props.label,
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      style={{
        opacity: isDragging ? 0.5 : 1,
        border: '1px dashed #ccc',
        padding: 8,
        marginBottom: 8,
        cursor: 'move',
        background: '#fff',
        userSelect: 'none',
      }}
    >
      {props.children || props.label}
    </div>
  );
};

export default DraggableItem;
