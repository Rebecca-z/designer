// 主组件渲染器 - 整合所有组件类型的渲染器
import React from 'react';
import { BaseRendererProps } from './types';

// 导入各类型组件渲染器
import { DraggableWrapper } from '../Common/index';
import ButtonRenderer from './ButtonRenderer';
import ColumnSetRenderer from './ColumnSetRenderer';
import FormRenderer from './FormRenderer';
import HrRenderer from './HrRenderer';
import ImageCombinationRenderer from './ImageCombinationRenderer';
import ImageRenderer from './ImageRenderer';
import InputRenderer from './InputRenderer';
import MultiSelectRenderer from './MultiSelectRenderer';
import PlainTextRenderer from './PlainTextRenderer';
import RichTextRenderer from './RichTextRenderer';
import SelectRenderer from './SelectRenderer';
import TitleRenderer from './TitleRender';

interface ComponentRendererCoreProps extends BaseRendererProps {
  component: any;
}

const ComponentRendererCore: React.FC<ComponentRendererCoreProps> = (props) => {
  const {
    component,
    isPreview = false,
    onContainerDrop,
    onComponentMove,
    onUpdateComponent,
    onHeaderDataChange,
    path = [],
    index = 0,
    containerPath = [],
    enableDrag = true,
    enableSort = true,
    renderChildren,
    onSelect,
    selectedPath,
    onDelete,
    onCopy,
    onCanvasFocus,
    onClearSelection,
    headerData,
    variables = [],
    verticalSpacing = 8,
  } = props;

  // 安全检查
  if (!component || !component.tag) {
    console.warn('ComponentRendererCore: Invalid component:', component);
    return (
      <div
        style={{
          padding: '16px',
          border: '1px dashed #ff4d4f',
          borderRadius: '4px',
          textAlign: 'center',
          color: '#ff4d4f',
          backgroundColor: '#fff2f0',
        }}
      >
        ⚠️ 无效组件数据
      </div>
    );
  }

  // 内部渲染子组件的函数
  const internalRenderChildren = (
    elements: any[],
    basePath: (string | number)[],
  ): React.ReactNode[] => {
    return elements.map((element, elementIndex) => {
      if (!element || !element.tag) {
        console.warn('Invalid child element:', element);
        return null;
      }

      const childPath = [...basePath, elementIndex];

      // 递归调用主渲染器
      return (
        <ComponentRendererCore
          key={`${element.id || element.tag}-${elementIndex}`}
          component={element}
          isPreview={isPreview}
          onContainerDrop={onContainerDrop}
          onComponentMove={onComponentMove}
          onUpdateComponent={onUpdateComponent}
          path={childPath}
          index={elementIndex}
          containerPath={basePath}
          enableDrag={enableDrag}
          enableSort={enableSort}
          onSelect={onSelect}
          selectedPath={selectedPath}
          onDelete={onDelete}
          onCopy={onCopy}
          onCanvasFocus={onCanvasFocus}
          onClearSelection={onClearSelection}
          onHeaderDataChange={onHeaderDataChange}
          headerData={headerData}
          variables={variables}
          verticalSpacing={verticalSpacing}
        />
      );
    });
  };

  // 使用外部传入的渲染函数或内部函数
  const finalRenderChildren = renderChildren || internalRenderChildren;

  // 通用的渲染器属性
  const rendererProps: BaseRendererProps = {
    component,
    isPreview,
    onContainerDrop,
    onComponentMove,
    onUpdateComponent,
    path,
    index,
    containerPath,
    enableDrag,
    enableSort,
    renderChildren: finalRenderChildren,
    onSelect,
    selectedPath,
    onDelete,
    onCopy,
    onCanvasFocus,
    onClearSelection,
    headerData,
    variables,
    verticalSpacing,
  };

  // 根据组件类型分发到对应的渲染器
  switch (component.tag) {
    case 'form':
      return <FormRenderer {...rendererProps} />;

    case 'column_set':
      return <ColumnSetRenderer {...rendererProps} />;

    case 'plain_text':
      return <PlainTextRenderer {...rendererProps} />;

    case 'rich_text':
      return <RichTextRenderer {...rendererProps} />;

    case 'hr':
      return <HrRenderer {...rendererProps} />;

    case 'img':
      return <ImageRenderer {...rendererProps} />;

    case 'img_combination':
      return <ImageCombinationRenderer {...rendererProps} />;

    case 'input':
      return <InputRenderer {...rendererProps} />;

    case 'button':
      return <ButtonRenderer {...rendererProps} />;

    case 'select_static':
      return <SelectRenderer {...rendererProps} />;

    case 'multi_select_static':
      return <MultiSelectRenderer {...rendererProps} />;

    case 'title':
      return <TitleRenderer {...rendererProps} />;

    default: {
      const unknownContent = (
        <div
          style={{
            padding: '16px',
            border: '1px dashed #ccc',
            borderRadius: '4px',
            textAlign: 'center',
            color: '#999',
            backgroundColor: '#fafafa',
          }}
        >
          ❓ 未知组件类型: {component.tag}
        </div>
      );

      return enableDrag && !isPreview ? (
        <DraggableWrapper
          component={component}
          path={path}
          index={index}
          containerPath={containerPath}
          onComponentMove={onComponentMove}
          enableSort={enableSort}
          onSelect={onSelect}
          selectedPath={selectedPath}
          onCanvasFocus={onCanvasFocus}
          onClearSelection={onClearSelection}
          onDelete={props.onDelete}
          onCopy={props.onCopy}
        >
          {unknownContent}
        </DraggableWrapper>
      ) : (
        unknownContent
      );
    }
  }
};

export default ComponentRendererCore;
