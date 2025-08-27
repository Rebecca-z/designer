import React from 'react';

const LayoutItem: React.FC<
  React.PropsWithChildren<{ style?: React.CSSProperties; title: string }>
> = ({ title, style, children }) => {
  return (
    <div
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <span style={{ fontSize: '14px', fontWeight: '500' }}>{title}</span>
      {children}
    </div>
  );
};

export default LayoutItem;
