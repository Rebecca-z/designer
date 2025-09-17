// 图片
const ImgRenderer: React.FC<{ item: any; style?: React.CSSProperties }> = (
  props,
) => {
  const item = props.item || {};
  const hasValidImage = item.img_url && item.img_url.trim() !== '';
  const isPlaceholder = item.isPlaceholder || !hasValidImage;

  return (
    <>
      {hasValidImage && !isPlaceholder ? (
        <img
          src={item.img_url}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '6px',
            ...props.style,
          }}
          alt={item.alt || '图片'}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#f8f9fa',
            border: '2px dashed #dee2e6',
            borderRadius: '6px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6c757d',
            fontSize: '12px',
            gap: '4px',
            ...props.style,
          }}
        >
          <div style={{ fontSize: '16px' }}>🖼️</div>
          <div>{isPlaceholder ? '占位图片' : '图片'}</div>
        </div>
      )}
    </>
  );
};

export default ImgRenderer;
