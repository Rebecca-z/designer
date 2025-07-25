import React from 'react';

interface RichTextStylesProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

// 富文本统一样式组件
const RichTextStyles: React.FC<RichTextStylesProps> = ({
  children,
  className = '',
  style = {},
}) => {
  return (
    <div className={`rich-text-content ${className}`} style={style}>
      {children}
      <style>{`
        .rich-text-content {
          font-size: 14px;
          line-height: 1.6;
          color: #333;
        }
        
        .rich-text-content h1 {
          font-size: 2em;
          font-weight: bold;
          margin: 0.67em 0;
          color: #333;
        }
        
        .rich-text-content h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 0.75em 0;
          color: #333;
        }
        
        .rich-text-content h3 {
          font-size: 1.17em;
          font-weight: bold;
          margin: 0.83em 0;
          color: #333;
        }
        
        .rich-text-content h4 {
          font-size: 1em;
          font-weight: bold;
          margin: 1.12em 0;
          color: #333;
        }
        
        .rich-text-content h5 {
          font-size: 0.83em;
          font-weight: bold;
          margin: 1.5em 0;
          color: #333;
        }
        
        .rich-text-content h6 {
          font-size: 0.75em;
          font-weight: bold;
          margin: 1.67em 0;
          color: #333;
        }
        
        .rich-text-content p {
          margin: 0.5em 0;
        }
        
        .rich-text-content ul,
        .rich-text-content ol {
          padding-left: 1.5em;
          margin: 0.5em 0;
        }
        
        .rich-text-content li {
          margin: 0.25em 0;
        }
        
        /* 文本格式样式 */
        .rich-text-content strong {
          font-weight: bold;
        }
        
        .rich-text-content em {
          font-style: italic;
        }
        
        .rich-text-content u {
          text-decoration: underline;
        }
        
        .rich-text-content s,
        .rich-text-content del {
          text-decoration: line-through;
        }
        
        /* 支持自定义颜色 - 使用行内样式优先级 */
        .rich-text-content span[style*="color"] {
          /* 保持行内样式的颜色 */
        }
        
        /* 支持自定义字体大小 */
        .rich-text-content span[style*="font-size"] {
          /* 保持行内样式的字体大小 */
        }
        
        /* 支持文本对齐方式 */
        .rich-text-content p[style*="text-align"],
        .rich-text-content h1[style*="text-align"],
        .rich-text-content h2[style*="text-align"],
        .rich-text-content h3[style*="text-align"],
        .rich-text-content h4[style*="text-align"],
        .rich-text-content h5[style*="text-align"],
        .rich-text-content h6[style*="text-align"] {
          /* 保持行内样式的对齐方式 */
        }
        
        /* 默认文字颜色 - 只在没有其他颜色设置时生效 */
        .rich-text-content {
          color: #333;
        }
        
        .rich-text-content h1,
        .rich-text-content h2,
        .rich-text-content h3,
        .rich-text-content h4,
        .rich-text-content h5,
        .rich-text-content h6 {
          color: inherit; /* 继承父元素颜色，优先使用自定义颜色 */
        }
        
        .rich-text-content a {
          color: #1890ff;
          text-decoration: underline;
        }
        
        .rich-text-content a:hover {
          color: #40a9ff;
        }
        
        .rich-text-content blockquote {
          border-left: 4px solid #ccc;
          margin: 1em 0;
          padding-left: 1em;
          font-style: italic;
          color: #666;
        }
        
        .rich-text-content code {
          background-color: #f1f1f1;
          padding: 2px 4px;
          border-radius: 3px;
          font-family: 'Courier New', monospace;
          font-size: 0.9em;
        }
        
        .rich-text-content pre {
          background-color: #f5f5f5;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 1em;
          overflow: auto;
          margin: 1em 0;
        }
        
        .rich-text-content pre code {
          background: none;
          padding: 0;
        }
        
        .rich-text-content img {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
        }
        
        /* 确保最后一个元素没有下边距 */
        .rich-text-content > :last-child {
          margin-bottom: 0;
        }
        
        /* 确保第一个元素没有上边距 */
        .rich-text-content > :first-child {
          margin-top: 0;
        }
      `}</style>
    </div>
  );
};

export default RichTextStyles;
