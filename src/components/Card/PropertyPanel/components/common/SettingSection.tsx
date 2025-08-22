// SettingSection - 可复用的设置区块组件
import { Form } from 'antd';
import React from 'react';

// 样式常量
const STYLES = {
  section: {
    marginBottom: '16px',
    background: '#fff',
    borderRadius: 6,
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
    padding: 16,
  },
  sectionTitle: {
    fontWeight: 600,
    marginBottom: 8,
    fontSize: 15,
  },
} as const;

// 设置区块Props接口
export interface SettingSectionProps {
  // 标题
  title: string;

  // 内容
  children: React.ReactNode;

  // 是否使用Form布局
  useForm?: boolean;

  // Form实例（如果使用Form）
  form?: any;

  // 自定义样式
  style?: React.CSSProperties;

  // 自定义标题样式
  titleStyle?: React.CSSProperties;

  // 是否显示（条件渲染）
  visible?: boolean;
}

const SettingSection: React.FC<SettingSectionProps> = ({
  title,
  children,
  useForm = true,
  form,
  style,
  titleStyle,
  visible = true,
}) => {
  if (!visible) {
    return null;
  }

  const content =
    useForm && form ? (
      <Form form={form} layout="vertical">
        {children}
      </Form>
    ) : (
      children
    );

  return (
    <div style={{ ...STYLES.section, ...style }}>
      <div style={{ ...STYLES.sectionTitle, ...titleStyle }}>{title}</div>
      {content}
    </div>
  );
};

export default SettingSection;
