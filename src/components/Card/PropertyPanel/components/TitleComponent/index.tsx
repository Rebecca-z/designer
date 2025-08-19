import { Card } from 'antd';
import React from 'react';
import { TitleComponentProps } from '../types';

// const { Title } = Typography;

interface TitleComponentPropsLocal extends TitleComponentProps {
  selectedComponent: any;
  handleValueChange: (key: string, value: any) => void;
  VariableManagementPanel: React.ComponentType;
  // 标题组件特有的props
}

const TitleComponent: React.FC<TitleComponentPropsLocal> = ({
  selectedComponent,
  // selectedPath: _selectedPath,
  // variables: _variables,
  // topLevelTab,
  // setTopLevelTab,
  // lastBoundVariables: _lastBoundVariables,
  // setLastBoundVariables: _setLastBoundVariables,
  // initializedComponents: _initializedComponents,
  // onUpdateComponent: _onUpdateComponent,
  handleValueChange,
  // getFilteredVariables: _getFilteredVariables,
  // getVariableDisplayName: _getVariableDisplayName,
  // getVariableKeys: _getVariableKeys,
  // handleAddVariableFromComponent: _handleAddVariableFromComponent,
  // isVariableModalVisible: _isVariableModalVisible,
  // handleVariableModalOk: _handleVariableModalOk,
  // handleVariableModalCancel: _handleVariableModalCancel,
  // editingVariable: _editingVariable,
  // isVariableModalFromVariablesTab: _isVariableModalFromVariablesTab,
  // modalComponentType: _modalComponentType,
  VariableManagementPanel,
}) => {
  return (
    <div
      style={{
        padding: '16px',
        height: '100%',
        overflowY: 'auto',
      }}
    >
      <Card
        title="标题组件属性"
        style={{
          marginBottom: '16px',
        }}
      >
        <div style={{ marginBottom: '12px' }}>
          <label
            style={{
              fontWeight: 'bold',
              marginBottom: '4px',
              display: 'block',
            }}
          >
            标题文本:
          </label>
          <input
            type="text"
            value={selectedComponent?.content || ''}
            onChange={(e) => handleValueChange('content', e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #d9d9d9',
              borderRadius: '6px',
            }}
            placeholder="请输入标题文本"
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label
            style={{
              fontWeight: 'bold',
              marginBottom: '4px',
              display: 'block',
            }}
          >
            标题级别:
          </label>
          <select
            value={selectedComponent?.level || 1}
            onChange={(e) =>
              handleValueChange('level', parseInt(e.target.value))
            }
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #d9d9d9',
              borderRadius: '6px',
            }}
          >
            <option value={1}>H1</option>
            <option value={2}>H2</option>
            <option value={3}>H3</option>
            <option value={4}>H4</option>
            <option value={5}>H5</option>
            <option value={6}>H6</option>
          </select>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label
            style={{
              fontWeight: 'bold',
              marginBottom: '4px',
              display: 'block',
            }}
          >
            文本颜色:
          </label>
          <input
            type="color"
            value={selectedComponent?.color || '#000000'}
            onChange={(e) => handleValueChange('color', e.target.value)}
            style={{
              width: '100%',
              height: '40px',
              border: '1px solid #d9d9d9',
              borderRadius: '6px',
            }}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label
            style={{
              fontWeight: 'bold',
              marginBottom: '4px',
              display: 'block',
            }}
          >
            字体大小:
          </label>
          <input
            type="number"
            value={selectedComponent?.fontSize || 16}
            onChange={(e) =>
              handleValueChange('fontSize', parseInt(e.target.value))
            }
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #d9d9d9',
              borderRadius: '6px',
            }}
            placeholder="字体大小 (px)"
            min="12"
            max="72"
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label
            style={{
              fontWeight: 'bold',
              marginBottom: '4px',
              display: 'block',
            }}
          >
            文本对齐:
          </label>
          <select
            value={selectedComponent?.textAlign || 'left'}
            onChange={(e) => handleValueChange('textAlign', e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #d9d9d9',
              borderRadius: '6px',
            }}
          >
            <option value="left">左对齐</option>
            <option value="center">居中对齐</option>
            <option value="right">右对齐</option>
          </select>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label
            style={{
              fontWeight: 'bold',
              marginBottom: '4px',
              display: 'block',
            }}
          >
            字体粗细:
          </label>
          <select
            value={selectedComponent?.fontWeight || 'normal'}
            onChange={(e) => handleValueChange('fontWeight', e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #d9d9d9',
              borderRadius: '6px',
            }}
          >
            <option value="normal">正常</option>
            <option value="bold">粗体</option>
            <option value="lighter">细体</option>
          </select>
        </div>
      </Card>

      {/* 变量Tab内容在其他地方处理 */}
      {topLevelTab === 'variables' && <VariableManagementPanel />}
    </div>
  );
};

export default TitleComponent;
