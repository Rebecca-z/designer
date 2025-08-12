import React from 'react';
import { useDrag } from 'react-dnd';
import { DragItem } from '../../../types';

interface DraggableItemProps {
  type: 'component' | 'layout';
  componentType: string;
  label: string;
  children: React.ReactNode;
}

const DraggableItem: React.FC<DraggableItemProps> = ({
  componentType,
  label,
  children,
}) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'component',
    item: {
      type: componentType,
      isNew: true,
      componentType,
      label,
    } as DragItem,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      style={{
        padding: '8px 12px',
        margin: '4px 8px',
        border: '1px solid #d9d9d9',
        borderRadius: '6px',
        cursor: 'grab',
        transition: 'all 0.2s ease',
        backgroundColor: isDragging ? '#f0f9ff' : '#fff',
        opacity: isDragging ? 0.5 : 1,
        boxShadow: isDragging
          ? '0 4px 12px rgba(24, 144, 255, 0.3)'
          : '0 1px 3px rgba(0,0,0,0.1)',
        transform: isDragging ? 'scale(1.02)' : 'scale(1)',
      }}
      onMouseEnter={(e) => {
        if (!isDragging) {
          e.currentTarget.style.borderColor = '#1890ff';
          e.currentTarget.style.backgroundColor = '#f0f9ff';
          e.currentTarget.style.transform = 'translateY(-1px) scale(1.01)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragging) {
          e.currentTarget.style.borderColor = '#d9d9d9';
          e.currentTarget.style.backgroundColor = '#fff';
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
        }
      }}
    >
      {children}
    </div>
  );
};

export default DraggableItem;
