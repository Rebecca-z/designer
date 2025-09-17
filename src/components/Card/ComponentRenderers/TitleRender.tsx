import React, { useCallback, useMemo } from 'react';
import { THEME_CONFIG } from '../CanvasWrapper/constants';
import { variableCacheManager } from '../Variable/utils/variable-cache';
import { BaseRendererProps } from './types';

// 标题组件渲染器
const TitleRenderer: React.FC<BaseRendererProps> = (props) => {
  const { onSelect, onCanvasFocus, headerData, variables = [] } = props;

  const setTitleComponent = (e: React.MouseEvent) => {
    e.stopPropagation();
    // 创建一个虚拟的标题组件用于选中，包含完整的标题数据
    const titleComponent = {
      id: headerData?.id || 'title-componen',
      tag: 'title' as const,
      title: {
        content: headerData?.title?.content || '主标题',
      },
      subtitle: {
        content: headerData?.subtitle?.content || '副标题',
      },
      style: (headerData?.style || 'blue') as
        | 'blue'
        | 'wathet'
        | 'turquoise'
        | 'green'
        | 'yellow'
        | 'orange'
        | 'red',
    };
    if (onSelect) {
      onSelect(titleComponent, ['dsl', 'header']);
    }
    if (onCanvasFocus) {
      onCanvasFocus();
    }
  };

  const getThemeStyles = useCallback(() => {
    const themeStyle = (headerData?.style ||
      'blue') as keyof typeof THEME_CONFIG;
    return THEME_CONFIG[themeStyle] || {};
  }, [headerData?.style]);

  // 获取显示的主标题内容
  const displayTitle = useMemo(() => {
    const titleContent = headerData?.title?.content || '主标题';
    // 直接在useMemo中处理变量解析，避免循环依赖
    let result = titleContent;
    if (
      titleContent &&
      titleContent.startsWith('${') &&
      titleContent.endsWith('}')
    ) {
      const variableName = titleContent.slice(2, -1);

      // 首先尝试从缓存获取
      let variableValue = variableCacheManager.getVariable(variableName);

      // 如果缓存中没有，尝试从变量列表中获取
      if (variableValue === undefined) {
        const variable = variables.find((v) => {
          if (typeof v === 'object' && v !== null) {
            const varRecord = v as any;
            return varRecord.name === variableName;
          }
          return false;
        });

        if (variable) {
          const varRecord = variable as any;
          variableValue = varRecord.value;

          // 将值存入缓存
          if (variableValue !== undefined) {
            variableCacheManager.setVariable(variableName, variableValue);
          }
        }
      }

      result =
        variableValue !== undefined ? String(variableValue) : titleContent;
    }

    return result;
  }, [headerData?.title?.content, variables]);

  // 获取显示的副标题内容
  const displaySubtitle = useMemo(() => {
    const subtitleContent = headerData?.subtitle?.content || '副标题';

    // 直接在useMemo中处理变量解析，避免循环依赖
    let result = subtitleContent;
    if (
      subtitleContent &&
      subtitleContent.startsWith('${') &&
      subtitleContent.endsWith('}')
    ) {
      const variableName = subtitleContent.slice(2, -1);
      // 首先尝试从缓存获取
      let variableValue = variableCacheManager.getVariable(variableName);
      // 如果缓存中没有，尝试从变量列表中获取
      if (variableValue === undefined) {
        const variable = variables.find((v) => {
          if (typeof v === 'object' && v !== null) {
            const varRecord = v as any;
            return varRecord.name === variableName;
          }
          return false;
        });

        if (variable) {
          const varRecord = variable as any;
          variableValue = varRecord.value;

          // 将值存入缓存
          if (variableValue !== undefined) {
            variableCacheManager.setVariable(variableName, variableValue);
          }
        }
      }

      result =
        variableValue !== undefined ? String(variableValue) : subtitleContent;
    }

    return result;
  }, [headerData?.subtitle?.content, variables]);

  const headerComponent = (
    <div
      style={{
        borderBottom: '1px solid #f0f0f0',
        position: 'relative',
      }}
      data-component-wrapper="true"
      data-component-id="title-component"
      onMouseDown={setTitleComponent}
      onClick={setTitleComponent}
    >
      {/* 标题内容区域 */}
      <div
        style={{
          padding: '16px',
          borderWidth: '2px',
          borderStyle: 'solid',
          borderRadius: '4px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          position: 'relative',
          // 应用主题样式
          ...(() => {
            return {
              backgroundColor: getThemeStyles()?.backgroundColor,
              borderColor: getThemeStyles()?.borderColor,
            };
          })(),
        }}
      >
        {displayTitle && (
          <div
            style={{
              fontSize: '18px',
              fontWeight: 'bold',
              marginBottom: displaySubtitle ? '8px' : '0',
              color: getThemeStyles()?.titleColor,
            }}
          >
            {(() => {
              return displayTitle;
            })()}
          </div>
        )}
        {displaySubtitle && (
          <div
            style={{
              fontSize: '14px',
              color: getThemeStyles()?.subtitleColor,
            }}
          >
            {displaySubtitle}
          </div>
        )}
      </div>
    </div>
  );
  return headerComponent;
};

export default TitleRenderer;
