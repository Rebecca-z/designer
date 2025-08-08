import { Button, Input, message } from 'antd';
import React, { useRef, useState } from 'react';
import JSONEditor, { JSONEditorRef } from './index';

const TestUserEditingValidation: React.FC = () => {
  const jsonEditorRef = useRef<JSONEditorRef>(null);
  const [results, setResults] = useState<string[]>([]);
  const [testJson, setTestJson] = useState<string>(
    '[\n    {\n        "text": {\n            "content": "选项 1",,\n            "i18n_content": {\n                "en-US": "Option 1"\n            }\n        },\n        "value": "1"\n    }\n]',
  );

  const addLog = (message: string) => {
    setResults((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const testUserEditingValidation = async () => {
    addLog('=== 测试用户编辑时的验证 ===');

    if (!jsonEditorRef.current) {
      addLog('❌ JSONEditor ref 不存在');
      return;
    }

    const { formatJSON, validateJSON, getFormattedJSON } =
      jsonEditorRef.current;

    // 1. 先验证原始内容，不进行格式化
    addLog('步骤1: 验证用户输入的原始JSON内容');
    const { isValid: originalValid, errors: originalErrors } = validateJSON();
    addLog(`原始JSON验证结果: isValid=${originalValid}`);
    if (!originalValid) {
      addLog(`原始JSON验证错误: ${JSON.stringify(originalErrors)}`);
      message.error('JSON格式错误，请检查输入内容');
      return;
    }

    // 2. 原始内容有效，进行格式化
    addLog('步骤2: 格式化JSON');
    await formatJSON();
    const { isValid, errors } = validateJSON();
    addLog(`格式化后JSON验证结果: isValid=${isValid}`);

    if (isValid) {
      // 3. 获取格式化后的JSON
      addLog('步骤3: 获取格式化后的JSON');
      const result = getFormattedJSON();
      addLog(`getFormattedJSON结果: success=${result.success}`);

      if (result.success && result.data) {
        addLog('✅ 完整流程成功！');
        addLog(`格式化后的JSON: ${result.data}`);

        try {
          const parsed = JSON.parse(result.data);
          addLog(
            `✅ JSON解析成功，类型: ${
              Array.isArray(parsed) ? 'array' : 'object'
            }`,
          );
          if (Array.isArray(parsed)) {
            addLog(`✅ 数组包含 ${parsed.length} 个元素`);
          }
        } catch (error) {
          addLog(`❌ JSON解析失败: ${error}`);
        }
      } else {
        addLog(`❌ 获取格式化JSON失败: ${result.error}`);
        message.error('JSON格式化失败');
      }
    } else {
      addLog(`❌ 格式化后JSON验证失败: ${JSON.stringify(errors)}`);
      message.error('JSON格式化后验证失败');
    }
  };

  const testInvalidJSONRejection = async () => {
    addLog('=== 测试无效JSON拒绝 ===');

    if (!jsonEditorRef.current) {
      addLog('❌ JSONEditor ref 不存在');
      return;
    }

    const { validateJSON } = jsonEditorRef.current;

    // 直接验证，不进行格式化
    addLog('步骤1: 验证无效JSON');
    const { isValid, errors } = validateJSON();
    addLog(`无效JSON验证结果: isValid=${isValid}`);

    if (!isValid) {
      addLog(`✅ 正确拒绝无效JSON: ${JSON.stringify(errors)}`);
      message.error('JSON格式错误，请检查输入内容');
    } else {
      addLog('❌ 错误：无效JSON被接受了');
    }
  };

  const testUserEditingState = async () => {
    addLog('=== 测试用户编辑状态 ===');

    if (!jsonEditorRef.current) {
      addLog('❌ JSONEditor ref 不存在');
      return;
    }

    const { validateJSON, getFormattedJSON } = jsonEditorRef.current;

    // 测试用户编辑状态下的验证
    addLog('步骤1: 测试用户编辑状态下的验证');
    const { isValid, errors } = validateJSON();
    addLog(`用户编辑状态验证结果: isValid=${isValid}`);

    if (!isValid) {
      addLog(`✅ 用户编辑状态下正确拒绝无效JSON: ${JSON.stringify(errors)}`);

      // 测试 getFormattedJSON
      const result = getFormattedJSON();
      addLog(`用户编辑状态getFormattedJSON: success=${result.success}`);

      if (!result.success) {
        addLog(`✅ 用户编辑状态下正确拒绝无效JSON: ${result.error}`);
      } else {
        addLog('❌ 错误：用户编辑状态下无效JSON被接受了');
      }
    } else {
      addLog('❌ 错误：用户编辑状态下无效JSON被接受了');
    }
  };

  const updateTestJSON = (value: string) => {
    setTestJson(value);
    addLog(`更新测试JSON: ${value}`);
  };

  const clearLogs = () => {
    setResults([]);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>用户编辑状态验证测试</h2>

      <div style={{ marginBottom: '20px' }}>
        <Button onClick={testUserEditingValidation} type="primary">
          测试用户编辑验证流程
        </Button>
        <Button
          onClick={testInvalidJSONRejection}
          style={{ marginLeft: '10px' }}
        >
          测试无效JSON拒绝
        </Button>
        <Button onClick={testUserEditingState} style={{ marginLeft: '10px' }}>
          测试用户编辑状态
        </Button>
        <Button onClick={clearLogs} style={{ marginLeft: '10px' }}>
          清除日志
        </Button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4>测试JSON内容:</h4>
        <Input.TextArea
          value={testJson}
          onChange={(e) => updateTestJSON(e.target.value)}
          rows={6}
          style={{ fontFamily: 'monospace' }}
        />
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ flex: 1 }}>
          <h3>JSONEditor</h3>
          <JSONEditor
            ref={jsonEditorRef}
            parsedJSON={JSON.parse(
              testJson.replace(/[，,]+/g, ',').replace(/[，,]+/g, ','),
            )}
          />
        </div>

        <div style={{ flex: 1 }}>
          <h3>测试日志</h3>
          <div
            style={{
              border: '1px solid #d9d9d9',
              padding: '10px',
              height: '400px',
              overflowY: 'auto',
              backgroundColor: '#f5f5f5',
              fontFamily: 'monospace',
              fontSize: '12px',
            }}
          >
            {results.map((log, index) => (
              <div key={index} style={{ marginBottom: '5px' }}>
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestUserEditingValidation;
