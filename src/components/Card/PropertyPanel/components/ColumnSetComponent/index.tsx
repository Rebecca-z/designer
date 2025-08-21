// ColumnSetComponent 编辑界面 - 分栏组件
import { BgColorsOutlined, SettingOutlined } from '@ant-design/icons';
import { Form, InputNumber, Tabs, Typography } from 'antd';
import React, { useCallback, useMemo } from 'react';
import { BaseComponentProps } from '../types';

const { Text } = Typography;

// 类型定义
interface ColumnItem {
  tag: string;
  style: {
    flex: number;
  };
  elements: any[];
}

interface ColumnSetData {
  columns?: ColumnItem[];
}

// 常量定义
const COLUMN_CONFIG = {
  min: 1,
  max: 6,
  defaultCount: 3,
  flexMin: 1,
  flexMax: 5,
  flexStep: 1,
  defaultFlex: 1,
} as const;

// 样式常量
const STYLES = {
  container: {
    width: '300px',
    height: 'calc(100vh - 60px)',
    backgroundColor: '#fafafa',
    borderLeft: '1px solid #d9d9d9',
    padding: '16px',
    overflow: 'auto',
  },
  tabBarStyle: {
    padding: '0 16px',
    backgroundColor: '#fff',
    margin: 0,
    borderBottom: '1px solid #d9d9d9',
  },
  contentPadding: { padding: '16px' },
  infoBox: {
    marginBottom: '16px',
    padding: '12px',
    backgroundColor: '#f0f9ff',
    border: '1px solid #bae6fd',
    borderRadius: '6px',
  },
  section: {
    background: '#fff',
    borderRadius: 6,
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: 600,
    marginBottom: 8,
    fontSize: 15,
  },
  tip: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
  },
  previewBox: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#f0f9ff',
    borderRadius: 4,
    border: '1px solid #bae6fd',
  },
  previewTitle: {
    fontSize: 12,
    fontWeight: 600,
    marginBottom: 4,
    color: '#0369a1',
  },
} as const;

const ColumnSetComponent: React.FC<BaseComponentProps> = ({
  selectedComponent,
  topLevelTab,
  setTopLevelTab,
  handleValueChange,
  VariableManagementPanel,
}) => {
  const [form] = Form.useForm();

  // 获取列数据 - 使用useMemo优化
  const columnData = useMemo(() => {
    const component = selectedComponent as any as ColumnSetData;
    return {
      columns: component.columns || [],
      columnCount: component.columns?.length || COLUMN_CONFIG.defaultCount,
    };
  }, [selectedComponent]);

  // 计算权重信息 - 使用useMemo优化
  const weightInfo = useMemo(() => {
    const totalWeight = columnData.columns.reduce(
      (sum, col) => sum + (col.style?.flex || COLUMN_CONFIG.defaultFlex),
      0,
    );

    return columnData.columns.map((column, index) => {
      const currentWeight = column.style?.flex || COLUMN_CONFIG.defaultFlex;
      const percentage =
        totalWeight > 0 ? (currentWeight / totalWeight) * 100 : 0;
      return {
        index,
        weight: currentWeight,
        percentage: percentage.toFixed(1),
      };
    });
  }, [columnData.columns]);

  // 处理列数量变化 - 使用useCallback优化
  const handleColumnCountChange = useCallback(
    (value: number | null) => {
      const columnCount = value || COLUMN_CONFIG.defaultCount;
      const newColumns: ColumnItem[] = Array.from(
        { length: columnCount },
        (_, index) => {
          const existingColumn = columnData.columns[index];
          return {
            tag: 'column',
            style: { flex: COLUMN_CONFIG.defaultFlex },
            elements: existingColumn?.elements || [],
          };
        },
      );
      handleValueChange('columns', newColumns);
    },
    [columnData.columns, handleValueChange],
  );

  // 处理列权重变化 - 使用useCallback优化
  const handleColumnWeightChange = useCallback(
    (columnIndex: number, value: number | null) => {
      const newWeight = Math.max(
        COLUMN_CONFIG.flexMin,
        Math.min(COLUMN_CONFIG.flexMax, value || COLUMN_CONFIG.defaultFlex),
      );

      const newColumns = [...columnData.columns];
      newColumns[columnIndex] = {
        ...newColumns[columnIndex],
        style: {
          ...newColumns[columnIndex].style,
          flex: newWeight,
        },
      };

      handleValueChange('columns', newColumns);
    },
    [columnData.columns, handleValueChange],
  );

  // 渲染布局设置内容 - 使用useMemo优化
  const layoutSettingsContent = useMemo(
    () => (
      <div style={STYLES.section}>
        <div style={STYLES.sectionTitle}>📐 布局设置</div>
        <Form form={form} layout="vertical">
          <Form.Item label="分栏数量">
            <InputNumber
              value={columnData.columnCount}
              onChange={handleColumnCountChange}
              min={COLUMN_CONFIG.min}
              max={COLUMN_CONFIG.max}
              style={{ width: '100%' }}
              placeholder="设置分栏数量"
            />
          </Form.Item>
        </Form>
      </div>
    ),
    [form, columnData.columnCount, handleColumnCountChange],
  );

  // 渲染列宽设置内容 - 使用useMemo优化
  const columnWidthContent = useMemo(() => {
    if (!columnData.columns.length) return null;

    return (
      <div style={STYLES.section}>
        <div style={STYLES.sectionTitle}>📏 列宽设置</div>
        {columnData.columns.map((column, index) => {
          const weightData = weightInfo[index];
          return (
            <Form key={index} layout="vertical">
              <Form.Item
                label={
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span>第 {index + 1} 列权重</span>
                    <span style={{ fontSize: 11, color: '#999' }}>
                      当前宽度: {weightData.percentage}%
                    </span>
                  </div>
                }
              >
                <InputNumber
                  value={column.style?.flex || COLUMN_CONFIG.defaultFlex}
                  onChange={(value) => handleColumnWeightChange(index, value)}
                  min={COLUMN_CONFIG.flexMin}
                  max={COLUMN_CONFIG.flexMax}
                  step={COLUMN_CONFIG.flexStep}
                  style={{ width: '100%' }}
                  placeholder="权重值"
                />
              </Form.Item>
            </Form>
          );
        })}
      </div>
    );
  }, [columnData.columns, weightInfo, handleColumnWeightChange]);

  // 渲染组件属性Tab内容 - 使用useMemo优化
  const componentTabContent = useMemo(
    () => (
      <div style={STYLES.contentPadding}>
        <div style={STYLES.infoBox}>
          <Text style={{ fontSize: '12px', color: '#0369a1' }}>
            🎯 当前选中：分栏组件
          </Text>
        </div>
        {layoutSettingsContent}
        {columnWidthContent}
      </div>
    ),
    [layoutSettingsContent, columnWidthContent],
  );

  return (
    <div style={STYLES.container}>
      <Tabs
        activeKey={topLevelTab}
        onChange={setTopLevelTab}
        style={{ height: '100%' }}
        tabBarStyle={STYLES.tabBarStyle}
        size="small"
        items={[
          {
            key: 'component',
            label: (
              <span
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <SettingOutlined />
                组件属性
              </span>
            ),
            children: componentTabContent,
          },
          {
            key: 'variables',
            label: (
              <span
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <BgColorsOutlined />
                变量
              </span>
            ),
            children: <VariableManagementPanel />,
          },
        ]}
      />
    </div>
  );
};

export default ColumnSetComponent;
