// ColumnSetComponent 编辑界面 - 分栏组件
import { Form, InputNumber } from 'antd';
import React, { useCallback, useMemo } from 'react';
import { ComponentContent, PropertyPanel, SettingSection } from '../common';
import { BaseComponentProps } from '../types';
import { COLUMN_CONFIG } from './constans';
import type { ColumnItem, ColumnSetData } from './type';

const ColumnSetComponent: React.FC<BaseComponentProps> = ({
  selectedComponent,
  topLevelTab,
  setTopLevelTab,
  handleValueChange,
  isVariableModalVisible,
  handleVariableModalOk,
  handleVariableModalCancel,
  editingVariable,
  isVariableModalFromVariablesTab,
  modalComponentType,
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
      <SettingSection title="📐 布局设置" form={form}>
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
      </SettingSection>
    ),
    [form, columnData.columnCount, handleColumnCountChange],
  );

  // 渲染列宽设置内容 - 使用useMemo优化
  const columnWidthContent = useMemo(() => {
    if (!columnData.columns.length) return null;

    return (
      <SettingSection title="📏 列宽设置" useForm={false}>
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
      </SettingSection>
    );
  }, [columnData.columns, weightInfo, handleColumnWeightChange]);

  // 渲染组件属性Tab内容 - 使用useMemo优化
  const componentTabContent = useMemo(
    () => (
      <>
        {layoutSettingsContent}
        {columnWidthContent}
      </>
    ),
    [layoutSettingsContent, columnWidthContent],
  );

  return (
    <PropertyPanel
      activeTab={topLevelTab}
      onTabChange={setTopLevelTab}
      componentContent={
        <ComponentContent componentName="分栏布局">
          {componentTabContent}
        </ComponentContent>
      }
      variableManagementComponent={<VariableManagementPanel />}
      isVariableModalVisible={isVariableModalVisible}
      handleVariableModalOk={handleVariableModalOk || (() => {})}
      handleVariableModalCancel={handleVariableModalCancel || (() => {})}
      editingVariable={editingVariable}
      isVariableModalFromVariablesTab={isVariableModalFromVariablesTab}
      modalComponentType={modalComponentType}
      selectedComponentTag={selectedComponent?.tag}
    />
  );
};

export default ColumnSetComponent;
