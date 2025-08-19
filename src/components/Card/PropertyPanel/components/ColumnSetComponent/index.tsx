// ColumnSetComponent 编辑界面 - 分栏组件
import { BgColorsOutlined, SettingOutlined } from '@ant-design/icons';
import { Form, InputNumber, Tabs, Typography } from 'antd';
import React from 'react';
import { BaseComponentProps } from '../types';

const { Text } = Typography;

const ColumnSetComponent: React.FC<BaseComponentProps> = ({
  selectedComponent,
  topLevelTab,
  setTopLevelTab,
  handleValueChange,
  VariableManagementPanel,
}) => {
  const [form] = Form.useForm();

  console.log('📝 渲染分栏组件编辑界面:', {
    componentId: selectedComponent.id,
    topLevelTab,
  });

  return (
    <div
      style={{
        width: '300px',
        height: 'calc(100vh - 60px)',
        backgroundColor: '#fafafa',
        borderLeft: '1px solid #d9d9d9',
        padding: '16px',
        overflow: 'auto',
      }}
    >
      <Tabs
        activeKey={topLevelTab}
        onChange={setTopLevelTab}
        style={{ height: '100%' }}
        tabBarStyle={{
          padding: '0 16px',
          backgroundColor: '#fff',
          margin: 0,
          borderBottom: '1px solid #d9d9d9',
        }}
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
            children: (
              <div style={{ padding: '16px' }}>
                <div
                  style={{
                    marginBottom: '16px',
                    padding: '12px',
                    backgroundColor: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    borderRadius: '6px',
                  }}
                >
                  <Text style={{ fontSize: '12px', color: '#0369a1' }}>
                    🎯 当前选中：分栏组件
                  </Text>
                </div>

                {/* 布局设置 */}
                <div
                  style={{
                    background: '#fff',
                    borderRadius: 6,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    padding: 16,
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{ fontWeight: 600, marginBottom: 8, fontSize: 15 }}
                  >
                    📐 布局设置
                  </div>
                  <Form form={form} layout="vertical">
                    <Form.Item label="分栏数量">
                      <InputNumber
                        value={(selectedComponent as any).columns?.length || 3}
                        onChange={(value) => {
                          const columnCount = value || 3;
                          const newColumns = Array.from(
                            { length: columnCount },
                            (_, index) => {
                              const existingColumn = (selectedComponent as any)
                                .columns?.[index];
                              return {
                                tag: 'column',
                                style: { flex: 1 }, // 移动到style.flex字段
                                elements: existingColumn?.elements || [],
                              };
                            },
                          );
                          handleValueChange('columns', newColumns);
                        }}
                        min={1}
                        max={6}
                        style={{ width: '100%' }}
                        placeholder="设置分栏数量"
                      />
                    </Form.Item>
                  </Form>
                </div>

                {/* 分栏宽度设置 */}
                {(selectedComponent as any).columns && (
                  <div
                    style={{
                      background: '#fff',
                      borderRadius: 6,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                      padding: 16,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        marginBottom: 12,
                        fontSize: 15,
                      }}
                    >
                      📏 列宽设置
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: '#666',
                        marginBottom: 16,
                        padding: 8,
                        backgroundColor: '#f8f9fa',
                        borderRadius: 4,
                      }}
                    >
                      💡 提示：设置每列的权重比例（1-5），列宽将按比例分配
                    </div>
                    {(selectedComponent as any).columns.map(
                      (column: any, index: number) => {
                        // 计算当前列的百分比宽度
                        const columns = (selectedComponent as any).columns;
                        const totalWeight = columns.reduce(
                          (sum: number, col: any) =>
                            sum + (col.style?.flex || 1),
                          0,
                        );
                        const currentWeight = column.style?.flex || 1;
                        const percentage = (
                          (currentWeight / totalWeight) *
                          100
                        ).toFixed(1);

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
                                    当前宽度: {percentage}%
                                  </span>
                                </div>
                              }
                            >
                              <InputNumber
                                value={column.style?.flex || 1}
                                onChange={(value) => {
                                  const newWeight = Math.max(
                                    1,
                                    Math.min(5, value || 1),
                                  );
                                  const newColumns = [
                                    ...(selectedComponent as any).columns,
                                  ];
                                  newColumns[index] = {
                                    ...column,
                                    style: {
                                      ...column.style,
                                      flex: newWeight, // 移动到style.flex字段
                                    },
                                  };
                                  handleValueChange('columns', newColumns);

                                  console.log('🔧 列宽权重更新:', {
                                    columnIndex: index,
                                    newWeight,
                                    columns: newColumns.map((col, idx) => ({
                                      index: idx,
                                      weight: col.style?.flex,
                                      percentage:
                                        (
                                          (col.style?.flex /
                                            newColumns.reduce(
                                              (sum, c) =>
                                                sum + (c.style?.flex || 1),
                                              0,
                                            )) *
                                          100
                                        ).toFixed(1) + '%',
                                    })),
                                  });
                                }}
                                min={1}
                                max={5}
                                step={1}
                                style={{ width: '100%' }}
                                placeholder="权重值"
                              />
                            </Form.Item>
                          </Form>
                        );
                      },
                    )}

                    {/* 权重预览 */}
                    <div
                      style={{
                        marginTop: 12,
                        padding: 8,
                        backgroundColor: '#f0f9ff',
                        borderRadius: 4,
                        border: '1px solid #bae6fd',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          marginBottom: 4,
                          color: '#0369a1',
                        }}
                      >
                        📊 宽度预览
                      </div>
                      <div style={{ display: 'flex', gap: 2 }}>
                        {(selectedComponent as any).columns.map(
                          (column: any, index: number) => {
                            const columns = (selectedComponent as any).columns;
                            const totalWeight = columns.reduce(
                              (sum: number, col: any) =>
                                sum + (col.style?.flex || 1),
                              0,
                            );
                            const currentWeight = column.style?.flex || 1;
                            const percentage =
                              (currentWeight / totalWeight) * 100;

                            return (
                              <div
                                key={index}
                                style={{
                                  flex: currentWeight,
                                  height: 20,
                                  backgroundColor: `hsl(${
                                    210 + index * 30
                                  }, 70%, 60%)`,
                                  borderRadius: 2,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 10,
                                  color: 'white',
                                  fontWeight: 600,
                                }}
                              >
                                {percentage.toFixed(0)}%
                              </div>
                            );
                          },
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ),
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
