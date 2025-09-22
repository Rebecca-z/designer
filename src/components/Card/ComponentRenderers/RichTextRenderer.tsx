import React from 'react';
import { resolveVariable } from '../../Card/utils';
import { DraggableWrapper } from '../Common/index';
import RichTextStyles from '../RichTextEditor/RichTextStyles';
import { convertJSONToHTML } from '../RichTextEditor/RichTextUtils';
import { replaceVariables } from '../utils';
import {
  textComponentStateManager,
  variableCacheManager,
} from '../Variable/utils/index';
import { BaseRendererProps } from './types';

const formatObjectToRichText = (obj: any): string => {
  if (Array.isArray(obj)) {
    // 数组格式化为列表
    const listItems = obj
      .map(
        (item) =>
          `<li>${
            typeof item === 'object'
              ? formatObjectToRichText(item)
              : String(item)
          }</li>`,
      )
      .join('');
    return `<ul style="margin: 0.5em 0; padding-left: 1.5em;">${listItems}</ul>`;
  } else if (typeof obj === 'object' && obj !== null) {
    // 对象格式化为定义列表或段落
    const entries = Object.entries(obj);
    if (entries.length === 0) {
      return '<p style="margin: 0.5em 0;">空对象</p>';
    }

    const items = entries
      .map(([key, value]) => {
        const formattedValue =
          typeof value === 'object'
            ? formatObjectToRichText(value)
            : String(value);
        return `<p style="margin: 0.3em 0;"><strong style="color: #1890ff;">${key}:</strong> <span style="margin-left: 0.5em;">${formattedValue}</span></p>`;
      })
      .join('');

    return `<div style="margin: 0.5em 0;">${items}</div>`;
  } else {
    return `<p style="margin: 0.5em 0;">${String(obj)}</p>`;
  }
};

// 格式化变量值为富文本内容
const formatVariableForRichText = (value: any): string => {
  if (typeof value === 'string') {
    // 如果字符串已经包含HTML标签，直接返回
    if (value.includes('<') && value.includes('>')) {
      return value;
    }

    // 尝试解析为富文本编辑器的JSON格式
    try {
      const parsed = JSON.parse(value);
      // 检查是否是富文本编辑器的数据格式
      if (
        parsed &&
        typeof parsed === 'object' &&
        (parsed.type === 'doc' || parsed.content)
      ) {
        // 使用convertJSONToHTML转换富文本JSON为HTML
        console.log('🔄 转换富文本JSON为HTML:', { parsed });
        const htmlResult = convertJSONToHTML(parsed);
        console.log('✅ 转换结果:', htmlResult);
        return htmlResult;
      } else {
        // 普通对象，格式化显示
        console.log('📝 普通对象格式化:', parsed);
        return formatObjectToRichText(parsed);
      }
    } catch {
      // 如果不是JSON，直接返回字符串包装为段落
      return `<p>${value}</p>`;
    }
  } else if (typeof value === 'object' && value !== null) {
    // 检查是否是富文本编辑器的数据格式
    if (value.type === 'doc' || value.content) {
      // 使用convertJSONToHTML转换富文本JSON为HTML
      console.log('🔄 对象转换富文本JSON为HTML:', { value });
      const htmlResult = convertJSONToHTML(value);
      console.log('✅ 对象转换结果:', htmlResult);
      return htmlResult;
    } else {
      // 普通对象，格式化显示
      console.log('📝 对象格式化显示:', value);
      return formatObjectToRichText(value);
    }
  } else {
    // 其他类型转为字符串并包装为段落
    return `<p>${String(value)}</p>`;
  }
};

// 富文本组件渲染器
const RichTextRenderer: React.FC<BaseRendererProps> = (props) => {
  const {
    component,
    isPreview,
    enableDrag,
    variables = [],
    verticalSpacing = 8,
  } = props;
  const comp = component as any;

  // 获取富文本内容
  const getRichTextContent = () => {
    try {
      // 检查是否有绑定的变量
      const boundVariableName = textComponentStateManager.getBoundVariableName(
        comp.id,
      );
      if (boundVariableName) {
        // 尝试从缓存获取变量值
        const cachedValue = variableCacheManager.getVariable(boundVariableName);
        if (cachedValue !== undefined) {
          return cachedValue;
        }

        // 从变量列表中获取值
        let variable = variables.find((v) => v.name === boundVariableName);

        if (variable) {
          let value;

          // 处理标准Variable格式
          if (
            variable.name &&
            (variable.value !== undefined || variable.type !== undefined)
          ) {
            value = variable.value;
          }

          if (value !== undefined) {
            // 对于富文本组件，格式化对象为富文本内容
            const formattedValue = formatVariableForRichText(value);
            variableCacheManager.setVariable(boundVariableName, formattedValue);
            return formattedValue;
          }
        }

        // 变量不存在时，返回用户编辑的内容或默认内容
        const userEditedContent =
          textComponentStateManager.getUserEditedContent(comp.id);
        if (userEditedContent !== undefined) {
          return userEditedContent;
        }
      }

      // 优先使用状态管理器中的内容（指定模式下的内容）
      const userEditedContent = textComponentStateManager.getUserEditedContent(
        comp.id,
      );
      if (userEditedContent !== undefined) {
        return userEditedContent;
      }

      // 使用组件原始内容
      const originalContent = comp.text?.content || comp.content;

      // 初始化时发现有变量
      if (variables?.length && originalContent) {
        const res = resolveVariable(originalContent, variables);
        if (res) {
          const formattedValue = formatVariableForRichText(res?.value);
          variableCacheManager.setVariable(res?.name, formattedValue);
          return formattedValue;
        }
      }

      if (!originalContent) {
        return '';
      }

      // 如果是字符串，尝试解析为JSON
      if (typeof originalContent === 'string') {
        try {
          const parsed = JSON.parse(originalContent);
          return parsed;
        } catch {
          // 如果解析失败，作为普通文本处理
          return replaceVariables(originalContent, variables);
        }
      }

      return originalContent;
    } catch (error) {
      console.error('获取富文本内容时出错:', error);
      return '';
    }
  };

  const richTextContent = getRichTextContent();

  // 转换富文本内容为HTML
  const getDisplayHTML = () => {
    // 检查是否有绑定的变量
    const boundVariableName = textComponentStateManager.getBoundVariableName(
      comp.id,
    );

    if (boundVariableName) {
      // 如果有绑定变量，richTextContent 已经是格式化的HTML字符串
      if (typeof richTextContent === 'string') {
        return richTextContent;
      }
    }

    // 非变量绑定模式的处理
    if (typeof richTextContent === 'string') {
      // 如果是字符串，检查是否包含HTML标签
      if (richTextContent.includes('<') && richTextContent.includes('>')) {
        return richTextContent;
      }
      // 否则作为纯文本处理
      return `<p>${richTextContent}</p>`;
    }

    // 如果是JSON格式，转换为HTML
    try {
      const result = convertJSONToHTML(richTextContent);

      // 检查是否包含列表
      const hasLists =
        result.includes('<ul>') ||
        result.includes('<ol>') ||
        result.includes('<li>');
      if (hasLists) {
      }

      return result;
    } catch (error) {
      console.error('转换富文本内容时出错:', error);
      return '';
    }
  };

  const displayHTML = getDisplayHTML();

  // 获取富文本样式设置
  const getRichTextStyles = () => {
    const style = comp.text?.style || comp.style || {};

    return {
      padding: `${verticalSpacing / 2}px 0`,
      wordWrap: 'break-word' as const,
      fontSize: style.fontSize ? `${style.fontSize}px` : '14px',
      color: style.color || '#333',
      textAlign: style.textAlign || 'left',
      minHeight: '34px',
      width: '100%',
      // 处理最大行数
      ...(style.numberOfLines && style.numberOfLines > 0
        ? {
            display: '-webkit-box',
            WebkitLineClamp: style.numberOfLines,
            WebkitBoxOrient: 'vertical' as const,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }
        : {}),
    };
  };

  const richTextElement = (
    <div style={getRichTextStyles()}>
      <RichTextStyles>
        <div
          className="rich-text-content"
          dangerouslySetInnerHTML={{ __html: displayHTML }}
        />
      </RichTextStyles>
    </div>
  );

  return enableDrag && !isPreview ? (
    <DraggableWrapper
      component={component}
      path={props.path || []}
      index={props.index || 0}
      containerPath={props.containerPath || []}
      onComponentMove={props.onComponentMove}
      enableSort={props.enableSort}
      onSelect={props.onSelect}
      selectedPath={props.selectedPath}
      onCanvasFocus={props.onCanvasFocus}
      onClearSelection={props.onClearSelection}
      onDelete={props.onDelete}
      onCopy={props.onCopy}
    >
      {richTextElement}
    </DraggableWrapper>
  ) : (
    richTextElement
  );
};

export default RichTextRenderer;
