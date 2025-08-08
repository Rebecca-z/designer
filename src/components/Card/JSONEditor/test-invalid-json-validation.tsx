import { Button, Input } from 'antd';
import React, { useRef, useState } from 'react';
import JSONEditor, { JSONEditorRef } from './index';

const TestInvalidJSONValidation: React.FC = () => {
  const jsonEditorRef = useRef<JSONEditorRef>(null);
  const [results, setResults] = useState<string[]>([]);
  const [testJson, setTestJson] = useState<string>(
    '{\n    "img_url": "img_v2_9dd98485-2900-4d65-ada9-e31d1408dcfg"，，\n}',
  );

  const addLog = (message: string) => {
    setResults((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const testInvalidJSONValidation = async () => {
    addLog('=== 测试无效JSON验证 ===');

    if (!jsonEditorRef.current) {
      addLog('❌ JSONEditor ref 不存在');
      return;
    }

    const { formatJSON, validateJSON, getFormattedJSON } =
      jsonEditorRef.current;

    // 1. 测试无效JSON的验证
    addLog('步骤1: 测试无效JSON验证');
    const invalidValidation = validateJSON();
    addLog(`无效JSON验证结果: isValid=${invalidValidation.isValid}`);
    if (!invalidValidation.isValid) {
      addLog(`验证错误: ${JSON.stringify(invalidValidation.errors)}`);
    }

    // 2. 测试无效JSON的getFormattedJSON
    addLog('步骤2: 测试无效JSON的getFormattedJSON');
    const invalidFormatted = getFormattedJSON();
    addLog(`无效JSON getFormattedJSON: success=${invalidFormatted.success}`);
    if (!invalidFormatted.success) {
      addLog(`获取错误: ${invalidFormatted.error}`);
    }

    // 3. 尝试格式化
    addLog('步骤3: 尝试格式化');
    try {
      await formatJSON();
      addLog('✅ 格式化成功');
    } catch (error) {
      addLog(`❌ 格式化失败: ${error}`);
    }

    // 4. 格式化后的验证
    addLog('步骤4: 格式化后的验证');
    const afterFormatValidation = validateJSON();
    const afterFormatFormatted = getFormattedJSON();
    addLog(`格式化后验证: isValid=${afterFormatValidation.isValid}`);
    addLog(`格式化后getFormattedJSON: success=${afterFormatFormatted.success}`);

    if (afterFormatValidation.isValid && afterFormatFormatted.success) {
      addLog('✅ 格式化后验证通过');
      addLog(`格式化后的JSON: ${afterFormatFormatted.data}`);
    } else {
      addLog('❌ 格式化后验证失败');
    }
  };

  const testValidJSONValidation = async () => {
    addLog('=== 测试有效JSON验证 ===');

    if (!jsonEditorRef.current) {
      addLog('❌ JSONEditor ref 不存在');
      return;
    }

    const { validateJSON, getFormattedJSON } = jsonEditorRef.current;

    // 1. 测试有效JSON的验证
    addLog('步骤1: 测试有效JSON验证');
    const validValidation = validateJSON();
    addLog(`有效JSON验证结果: isValid=${validValidation.isValid}`);

    // 2. 测试有效JSON的getFormattedJSON
    addLog('步骤2: 测试有效JSON的getFormattedJSON');
    const validFormatted = getFormattedJSON();
    addLog(`有效JSON getFormattedJSON: success=${validFormatted.success}`);

    if (validValidation.isValid && validFormatted.success) {
      addLog('✅ 有效JSON验证通过');
      addLog(`格式化后的JSON: ${validFormatted.data}`);
    } else {
      addLog('❌ 有效JSON验证失败');
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
      <h2>无效JSON验证测试</h2>

      <div style={{ marginBottom: '20px' }}>
        <Button onClick={testInvalidJSONValidation} type="primary">
          测试无效JSON
        </Button>
        <Button
          onClick={testValidJSONValidation}
          style={{ marginLeft: '10px' }}
        >
          测试有效JSON
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
          rows={4}
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

export default TestInvalidJSONValidation;
