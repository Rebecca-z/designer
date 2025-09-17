import { message } from 'antd';
import { useCallback, useState } from 'react';

import {
  convertToTargetFormat,
  ensureComponentIds,
  generateId,
  importFromJSON,
  normalizeCombinationModes,
} from '../utils';

// 配置管理Hook
export const useConfigManagement = () => {
  const [exportModalVisible, setExportModalVisible] = useState<boolean>(false);
  const [importModalVisible, setImportModalVisible] = useState<boolean>(false);
  const [exportData, setExportData] = useState<string>('');

  const exportConfig = useCallback((data: any) => {
    try {
      const targetFormat = convertToTargetFormat(data);
      const exportJson = JSON.stringify(targetFormat, null, 2);
      setExportData(exportJson);
      setExportModalVisible(true);
    } catch (error) {
      message.error('导出配置失败');
      console.error('Export error:', error);
    }
  }, []);

  const downloadConfig = useCallback(() => {
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `card-config-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('配置已下载');
  }, [exportData]);

  const importConfig = useCallback(() => {
    setImportModalVisible(true);
  }, []);

  // 导入JSON
  const handleFileUpload = useCallback((file: File, updateData: any) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonString = e.target?.result as string;
        const parsed = JSON.parse(jsonString);

        // 检查是否是新格式的完整卡片数据
        if (
          parsed &&
          parsed.dsl &&
          parsed.dsl.body &&
          Array.isArray(parsed.dsl.body.elements)
        ) {
          // 创建新的卡片数据，保留原始的header信息
          const newCardData: any = {
            id: generateId(),
            name: parsed.name || '导入的卡片',
            dsl: {
              schema: parsed.dsl.schema || 0.1,
              config: parsed.dsl.config || {},
              card_link: parsed.dsl.card_link || {
                multi_url: {
                  url: '',
                  android_url: '',
                  ios_url: '',
                  pc_url: '',
                },
              },
              body: {
                direction: parsed.dsl.body.direction || 'vertical',
                vertical_spacing: parsed.dsl.body.vertical_spacing || 8,
                elements: parsed.dsl.body.elements || [],
              },
            },
            variables: parsed.variables || {},
          };

          // 如果原始数据包含header，则保留header
          if (parsed.dsl.header) {
            console.log('✅ 保留原始header数据:', parsed.dsl.header);
            newCardData.dsl.header = parsed.dsl.header;
          } else {
            console.log('❌ 原始数据无header，不创建header');
          }

          // 确保所有组件都有ID
          newCardData.dsl.body.elements = ensureComponentIds(
            newCardData.dsl.body.elements,
          );

          // 处理多图混排组件的combination_mode
          newCardData.dsl.body.elements = normalizeCombinationModes(
            newCardData.dsl.body.elements,
          );

          updateData(newCardData);
          setImportModalVisible(false);
          message.success('配置导入成功');
          return;
        }

        // 处理旧格式数据
        const jsonData = importFromJSON(jsonString);
        if (jsonData) {
          // 检查原始数据是否包含header信息
          const jsonAny = jsonData as any;
          const hasHeaderData =
            jsonAny.header ||
            jsonAny.title ||
            jsonAny.subtitle ||
            (jsonAny.dsl && jsonAny.dsl.header);

          // 将旧格式数据转换为新格式的卡片数据
          const newCardData: any = {
            id: generateId(),
            name: '导入的卡片',
            dsl: {
              schema: 0.1,
              config: {},
              card_link: {
                multi_url: {
                  url: '',
                  android_url: '',
                  ios_url: '',
                  pc_url: '',
                },
              },
              body: {
                direction: jsonData.direction || 'vertical',
                vertical_spacing: jsonData.vertical_spacing || 8,
                padding: {
                  top: 16,
                  right: 16,
                  bottom: 16,
                  left: 16,
                },
                elements: jsonData.elements || [],
              },
            },
            variables: {},
          };

          // 只有当原始数据包含header信息时才创建header
          if (hasHeaderData) {
            newCardData.dsl.header = {
              style: 'blue', // 直接存储主题样式字符串
              title: {
                content: '标题',
                i18n_content: {
                  'en-US': 'Title',
                },
              },
              subtitle: {
                content: '副标题',
                i18n_content: {
                  'en-US': 'Subtitle',
                },
              },
            };
          } else {
            console.log('❌ 未检测到旧格式header数据，不创建header对象');
          }

          updateData(newCardData);
          setImportModalVisible(false);
          message.success('配置导入成功');
        } else {
          message.error('配置文件格式错误');
        }
      } catch (error) {
        message.error('配置文件解析失败');
        console.error('Import error:', error);
      }
    };
    reader.readAsText(file);
    return false; // 阻止自动上传
  }, []);

  return {
    exportModalVisible,
    setExportModalVisible,
    importModalVisible,
    setImportModalVisible,
    exportData,
    exportConfig,
    downloadConfig,
    importConfig,
    handleFileUpload,
  };
};
