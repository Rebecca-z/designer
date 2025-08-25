// ButtonComponent 编辑界面 - 按钮组件
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, Popover, Select, Switch, Typography } from 'antd';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ComponentContent,
  ComponentNameInput,
  PropertyPanel,
  SettingSection,
} from '../common';
import { BaseComponentProps } from '../types';
import {
  BUTTON_COLORS,
  DEFAULT_FORM_DATA,
  DEFAULT_PARAMETER,
} from './constans';

import type { EventItem, FormData, Parameter } from './type';
const { Text } = Typography;

const ButtonComponent: React.FC<BaseComponentProps> = ({
  selectedComponent,
  selectedPath,
  topLevelTab,
  setTopLevelTab,
  handleValueChange,
  onUpdateComponent,
  isVariableModalVisible,
  handleVariableModalOk,
  handleVariableModalCancel,
  editingVariable,
  isVariableModalFromVariablesTab,
  modalComponentType,
  VariableManagementPanel,
}) => {
  const [form] = Form.useForm();

  // 事件相关状态
  const [events, setEvents] = useState<EventItem[]>([]);
  const [popoverVisible, setPopoverVisible] = useState<boolean>(false);
  const [currentActionType, setCurrentActionType] = useState<
    'callback' | 'link'
  >('callback');
  const [parameters, setParameters] = useState<Parameter[]>([
    DEFAULT_PARAMETER,
  ]);
  const [currentEventId, setCurrentEventId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA);
  const popoverAnchorRef = useRef<HTMLDivElement>(null);

  // 检查按钮是否在表单内
  const isInForm = useMemo(() => {
    if (!selectedPath) return false;
    // 检查是否在表单内（至少需要6个路径段）
    if (selectedPath.length >= 6) {
      // 简单表单内：['dsl', 'body', 'elements', formIndex, 'elements', buttonIndex]
      if (selectedPath.length === 6) {
        return (
          selectedPath[0] === 'dsl' &&
          selectedPath[1] === 'body' &&
          selectedPath[2] === 'elements' &&
          selectedPath[4] === 'elements'
        );
      }

      // 表单内分栏中：['dsl', 'body', 'elements', formIndex, 'elements', columnSetIndex, 'columns', columnIndex, 'elements', buttonIndex]
      if (selectedPath.length === 10) {
        return (
          selectedPath[0] === 'dsl' &&
          selectedPath[1] === 'body' &&
          selectedPath[2] === 'elements' &&
          selectedPath[4] === 'elements' &&
          selectedPath[6] === 'columns' &&
          selectedPath[8] === 'elements'
        );
      }
    }

    return false;
  }, [selectedPath, selectedComponent.id, selectedComponent.tag]);

  // 获取按钮名称信息
  const buttonNameInfo = useMemo(() => {
    const fullName = (selectedComponent as any).name || 'Button_';
    // 提取各种前缀后面的内容，优先处理Button_前缀
    let suffix = '';
    if (fullName.startsWith('Button_')) {
      suffix = fullName.substring(7); // Button_
    } else if (fullName.startsWith('SubmitButton_')) {
      suffix = fullName.substring(13); // SubmitButton_
    } else if (fullName.startsWith('CancelButton_')) {
      suffix = fullName.substring(13); // CancelButton_
    } else {
      suffix = fullName; // 没有识别的前缀，使用全名作为后缀
    }
    return {
      name: fullName,
      suffix: suffix,
    };
  }, [selectedComponent]);

  // 处理按钮名称变化 - 使用useCallback优化
  const handleButtonNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleValueChange('name', `Button_${e.target.value}`);
    },
    [handleValueChange, selectedComponent.id],
  );

  // 回显事件数据的公共函数
  const loadEventData = useCallback((event: EventItem) => {
    // 安全检查：确保event存在，behavior可以为null（新创建的事件）
    if (!event) {
      console.warn('⚠️ loadEventData: event不存在');
      return;
    }

    // 如果behavior为null或undefined，说明是新创建的事件，使用默认值
    if (!event.behavior) {
      setCurrentActionType('callback');
      setFormData(DEFAULT_FORM_DATA);
      setParameters([DEFAULT_PARAMETER]);
      return;
    }

    const behavior = event.behavior;

    if (behavior.type === 'open_url') {
      setCurrentActionType('link');
      setFormData({
        pcUrl: behavior.open_url?.multi_url?.pc_url || '',
        mobileUrl: behavior.open_url?.multi_url?.android_url || '',
        paramType: 'object',
      });
      setParameters([DEFAULT_PARAMETER]);
    } else if (behavior.type === 'callback') {
      setCurrentActionType('callback');
      setFormData(DEFAULT_FORM_DATA);

      // 回显callback参数
      const callbackParams = behavior.callback || {};
      const paramEntries = Object.entries(callbackParams);
      if (paramEntries.length > 0) {
        const newParameters: Parameter[] = paramEntries.map(
          ([key, value], index) => ({
            id: index + 1,
            param1: key,
            param2: value as string,
          }),
        );
        setParameters(newParameters);
      } else {
        setParameters([DEFAULT_PARAMETER]);
      }
    } else {
      // 处理未知类型，设置默认值
      console.warn('⚠️ loadEventData: 未知的behavior类型:', behavior.type);
      setCurrentActionType('callback');
      setFormData(DEFAULT_FORM_DATA);
      setParameters([DEFAULT_PARAMETER]);
    }
  }, []);

  // 创建事件处理函数
  const handleCreateEvent = useCallback(() => {
    const newEvent: EventItem = {
      id: Date.now(),
      actionType: 'callback',
      actionText: '请选择动作',
      behavior: null, // 初始化为null，表示尚未配置
    };
    setEvents((prev) => {
      const updatedEvents = [...prev, newEvent];
      return updatedEvents;
    });
  }, []);

  // 删除事件处理函数
  const handleDeleteEvent = useCallback(
    (eventId: number) => {
      setEvents((prev) => {
        const updatedEvents = prev.filter((event) => event.id !== eventId);

        // 更新全局数据 - 移除对应的behavior
        const updatedBehaviors = updatedEvents
          .map((event) => event.behavior)
          .filter(Boolean);

        handleValueChange('behaviors', updatedBehaviors);
        return updatedEvents;
      });

      setPopoverVisible(false);
    },
    [handleValueChange],
  );

  // 添加参数区块
  const handleAddParameter = useCallback(() => {
    const newParam: Parameter = {
      id: Date.now(),
      param1: '',
      param2: '',
    };
    setParameters((prev) => [...prev, newParam]);
  }, []);

  // 删除参数区块
  const handleDeleteParameter = useCallback((paramId: number) => {
    setParameters((prev) => prev.filter((param) => param.id !== paramId));
  }, []);

  // 更新参数值
  const handleParameterChange = useCallback(
    (paramId: number, field: keyof Parameter, value: string) => {
      setParameters((prev) =>
        prev.map((param) =>
          param.id === paramId ? { ...param, [field]: value } : param,
        ),
      );
    },
    [],
  );

  // 保存事件配置
  const handleSaveEvent = useCallback(() => {
    if (currentEventId === null) return;

    let behaviorObject: any;
    let actionText: string;

    if (currentActionType === 'link') {
      // 链接跳转配置
      behaviorObject = {
        type: 'open_url',
        open_url: {
          multi_url: {
            url: formData.pcUrl,
            android_url: formData.mobileUrl,
            ios_url: formData.mobileUrl,
            pc_url: formData.pcUrl,
          },
        },
      };
      actionText = `打开链接: ${formData.pcUrl || '未设置'}`;
    } else {
      // 请求回调配置
      const paramString =
        parameters
          .map((param) => `${param.param1}=${param.param2}`)
          .filter((param) => param !== '=')
          .join(', ') || '无参数';

      // 构建callback对象，直接使用param1:value1的结构
      const callbackParams: Record<string, string> = {};
      parameters.forEach((param) => {
        if (param.param1 && param.param2) {
          callbackParams[param.param1] = param.param2;
        }
      });

      behaviorObject = {
        type: 'callback',
        callback: callbackParams,
      };
      actionText = `请求回调: ${paramString}`;
    }

    // 更新事件列表
    setEvents((prev) => {
      const updatedEvents = prev.map((event) =>
        event.id === currentEventId
          ? { ...event, actionText, behavior: behaviorObject }
          : event,
      );

      // 更新全局数据 - 构建完整的behaviors数组
      const updatedBehaviors = updatedEvents
        .map((event) => event.behavior)
        .filter(Boolean);

      // 检查当前按钮是否为重置按钮，如果是则不保存behaviors字段
      const isResetButton =
        (selectedComponent as any)?.form_action_type === 'reset';

      if (!isResetButton) {
        // 只有非重置按钮且有behaviors时才保存
        if (updatedBehaviors.length > 0) {
          handleValueChange('behaviors', updatedBehaviors);
        } else {
          // 如果没有behaviors，删除该字段
          handleValueChange('behaviors', undefined);
        }
      } else {
        // 重置按钮不保存behaviors字段
        console.log('⚠️ 重置按钮不保存behaviors字段');
        handleValueChange('behaviors', undefined);
      }

      return updatedEvents;
    });

    // 关闭弹窗
    setPopoverVisible(false);
    setCurrentEventId(null);
  }, [
    currentEventId,
    currentActionType,
    formData,
    parameters,
    handleValueChange,
  ]);

  // Popover内容
  const popoverContent = useMemo(
    () => (
      <div style={{ width: '300px', padding: '16px' }}>
        <Text strong>事件配置</Text>
        <Form layout="vertical" style={{ marginTop: '16px' }}>
          <Form.Item label="动作类型">
            <Select
              value={currentActionType}
              onChange={setCurrentActionType}
              style={{ width: '100%' }}
            >
              <Select.Option value="callback">请求回调</Select.Option>
              <Select.Option value="link">链接跳转</Select.Option>
            </Select>
          </Form.Item>

          {/* 链接跳转配置 */}
          {currentActionType === 'link' && (
            <>
              <Form.Item label="桌面端链接">
                <Input
                  placeholder="请输入桌面端链接"
                  style={{ width: '100%' }}
                  value={formData.pcUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, pcUrl: e.target.value })
                  }
                />
              </Form.Item>
              <Form.Item label="移动端链接">
                <Input
                  placeholder="请输入移动端链接"
                  style={{ width: '100%' }}
                  value={formData.mobileUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, mobileUrl: e.target.value })
                  }
                />
              </Form.Item>
            </>
          )}

          {/* 请求回调配置 */}
          {currentActionType === 'callback' && (
            <>
              <Form.Item
                label={
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>输入参数</span>
                    <PlusOutlined
                      style={{
                        fontSize: '14px',
                        color: '#1890ff',
                        cursor: 'pointer',
                        marginLeft: '8px',
                      }}
                      onClick={handleAddParameter}
                    />
                  </div>
                }
              >
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {parameters.map((param, index) => (
                    <div
                      key={param.id}
                      style={{
                        border: '1px solid #d9d9d9',
                        borderRadius: '6px',
                        padding: '12px',
                        marginBottom: '8px',
                        backgroundColor: '#fafafa',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '8px',
                        }}
                      >
                        <Text strong style={{ fontSize: '12px' }}>
                          参数{index + 1}
                        </Text>
                        {parameters.length > 1 && (
                          <DeleteOutlined
                            style={{
                              fontSize: '12px',
                              color: '#ff4d4f',
                              cursor: 'pointer',
                            }}
                            onClick={() => handleDeleteParameter(param.id)}
                          />
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Input
                          placeholder="输入框1"
                          value={param.param1}
                          onChange={(e) =>
                            handleParameterChange(
                              param.id,
                              'param1',
                              e.target.value,
                            )
                          }
                          style={{ flex: 1 }}
                          size="small"
                        />
                        <Input
                          placeholder="输入框2"
                          value={param.param2}
                          onChange={(e) =>
                            handleParameterChange(
                              param.id,
                              'param2',
                              e.target.value,
                            )
                          }
                          style={{ flex: 1 }}
                          size="small"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Form.Item>
            </>
          )}

          <div style={{ textAlign: 'right', marginTop: '16px' }}>
            <Button
              size="small"
              onClick={() => setPopoverVisible(false)}
              style={{ marginRight: '8px' }}
            >
              取消
            </Button>
            <Button size="small" type="primary" onClick={handleSaveEvent}>
              确定
            </Button>
          </div>
        </Form>
      </div>
    ),
    [
      currentActionType,
      formData,
      parameters,
      handleSaveEvent,
      handleParameterChange,
      handleDeleteParameter,
      handleAddParameter,
    ],
  );

  // 组件属性内容
  const componentContent = useMemo(
    () => (
      <>
        <SettingSection title="📝 内容设置" form={form}>
          <ComponentNameInput
            prefix="Button_"
            suffix={buttonNameInfo.suffix}
            onChange={handleButtonNameChange}
          />

          <Form.Item label="按钮文案">
            <Input
              value={(selectedComponent as any).text?.content || '按钮'}
              onChange={(e) => {
                const value = e.target.value;
                // 限制最多8个字符
                if (value.length <= 8) {
                  handleValueChange('text.content', value);
                }
              }}
              placeholder="按钮"
              maxLength={8}
              showCount
              style={{ width: '100%' }}
            />
          </Form.Item>
        </SettingSection>

        <SettingSection title="🎨 样式设置" form={form}>
          <Form.Item label="按钮颜色">
            <Select
              value={(selectedComponent as any).style?.color || 'blue'}
              onChange={(value) => handleValueChange('style.color', value)}
              style={{ width: '100%' }}
            >
              {BUTTON_COLORS.map(({ value, label, color }) => (
                <Select.Option key={value} value={value}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <div
                      style={{
                        width: '16px',
                        height: '16px',
                        backgroundColor: color,
                        border: '1px solid #d9d9d9',
                        borderRadius: '2px',
                      }}
                    />
                    {label}
                  </div>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </SettingSection>

        <SettingSection title="📋 表单按钮设置" form={form} visible={isInForm}>
          <Form.Item>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {/* 提交按钮开关 */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0',
                }}
              >
                <Text>设置为&quot;提交&quot;按钮</Text>
                <Switch
                  checked={
                    (selectedComponent as any)?.form_action_type === 'submit'
                  }
                  onChange={(checked) => {
                    console.log('🔧 提交按钮开关变更:', {
                      checked,
                      currentActionType: (selectedComponent as any)
                        .form_action_type,
                      componentId: selectedComponent.id,
                    });

                    if (checked) {
                      // 设置为提交按钮，需要初始化behaviors字段
                      const updatedComponent = {
                        ...selectedComponent,
                      };
                      (updatedComponent as any).form_action_type = 'submit';

                      // 如果当前没有behaviors字段，初始化为空数组
                      if (!(updatedComponent as any).behaviors) {
                        (updatedComponent as any).behaviors = [];
                      }

                      console.log('🔧 设置提交按钮，初始化behaviors字段:', {
                        componentId: selectedComponent.id,
                        formActionType: 'submit',
                        hasBehaviors: !!(updatedComponent as any).behaviors,
                      });

                      onUpdateComponent(updatedComponent);
                    } else {
                      // 如果关闭提交按钮，清除form_action_type，但保留behaviors字段（如果有的话）
                      const updatedComponent = {
                        ...selectedComponent,
                      };
                      delete (updatedComponent as any).form_action_type;

                      // 如果当前没有behaviors字段，初始化为空数组（普通按钮也可以有事件）
                      if (!(updatedComponent as any).behaviors) {
                        (updatedComponent as any).behaviors = [];
                      }

                      console.log('🔧 关闭提交按钮，转为普通按钮:', {
                        componentId: selectedComponent.id,
                        hasBehaviors: !!(updatedComponent as any).behaviors,
                      });

                      onUpdateComponent(updatedComponent);
                    }
                  }}
                />
              </div>

              {/* 重置按钮开关 */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0',
                }}
              >
                <Text>设置为&quot;重置&quot;按钮</Text>
                <Switch
                  checked={
                    (selectedComponent as any)?.form_action_type === 'reset'
                  }
                  onChange={(checked) => {
                    console.log('🔧 重置按钮开关变更:', {
                      checked,
                      currentActionType: (selectedComponent as any)
                        .form_action_type,
                      componentId: selectedComponent.id,
                    });

                    if (checked) {
                      // 重置按钮不需要behaviors字段，通过onUpdateComponent直接删除
                      const updatedComponent = {
                        ...selectedComponent,
                      };
                      delete (updatedComponent as any).behaviors;
                      (updatedComponent as any).form_action_type = 'reset';
                      onUpdateComponent(updatedComponent);
                    } else {
                      // 如果关闭重置按钮，清除form_action_type
                      handleValueChange('form_action_type', undefined);
                    }
                  }}
                />
              </div>
            </div>
          </Form.Item>
        </SettingSection>
      </>
    ),
    [
      form,
      buttonNameInfo.suffix,
      handleButtonNameChange,
      selectedComponent,
      handleValueChange,
      isInForm,
      onUpdateComponent,
    ],
  );

  // 事件内容
  const eventContent = useMemo(
    () => (
      <div style={{ padding: '16px' }}>
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={handleCreateEvent}
          style={{
            width: '100%',
            height: '40px',
            marginBottom: '16px',
          }}
        >
          创建事件
        </Button>

        {/* 事件列表 */}
        {(() => {
          console.log('🔧 事件数组长度:', events.length, '事件数组:', events);
          return null;
        })()}
        {events.length === 0 && (
          <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
            暂无事件，点击上方按钮创建
          </div>
        )}
        {events.map((event) => {
          console.log('🔧 渲染事件:', event);
          return (
            <div
              key={event.id}
              id={`event-${event.id}`}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                marginBottom: '8px',
                backgroundColor: '#f8f9fa',
                border: '1px solid #e9ecef',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onClick={() => {
                setCurrentEventId(event.id);
                loadEventData(event);
                setPopoverVisible(true);
              }}
            >
              <Button type="text" style={{ padding: 0, height: 'auto' }}>
                {event.actionText}
              </Button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <EditOutlined
                  style={{
                    fontSize: '14px',
                    color: '#1890ff',
                    cursor: 'pointer',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentEventId(event.id);
                    loadEventData(event); // 使用公共函数回显数据
                    setPopoverVisible(true);
                  }}
                />
                <DeleteOutlined
                  style={{
                    fontSize: '14px',
                    color: '#ff4d4f',
                    cursor: 'pointer',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteEvent(event.id);
                  }}
                />
              </div>
            </div>
          );
        })}

        {/* 统一的Popover - 只有一个 */}
        {popoverVisible && currentEventId !== null && (
          <Popover
            content={popoverContent}
            title={null}
            trigger="click"
            placement="leftTop"
            open={popoverVisible}
            onOpenChange={(visible) => {
              setPopoverVisible(visible);
              if (!visible) {
                setCurrentEventId(null);
              }
            }}
          >
            {/* 隐藏的触发元素 */}
            <div
              ref={popoverAnchorRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 0,
                height: 0,
              }}
            />
          </Popover>
        )}
      </div>
    ),
    [
      events,
      handleCreateEvent,
      currentEventId,
      loadEventData,
      setPopoverVisible,
      setCurrentEventId,
      handleDeleteEvent,
      popoverVisible,
      popoverContent,
      popoverAnchorRef,
    ],
  );

  return (
    <PropertyPanel
      activeTab={topLevelTab}
      onTabChange={setTopLevelTab}
      componentContent={
        <ComponentContent componentName="按钮组件">
          {componentContent}
        </ComponentContent>
      }
      eventContent={eventContent}
      showEventTab={true}
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

export default ButtonComponent;
