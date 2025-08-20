// ButtonComponent 编辑界面 - 按钮组件
import {
  BgColorsOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SettingOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { Button, Form, Input, Popover, Select, Tabs, Typography } from 'antd';
import React, { useRef, useState } from 'react';
import { BaseComponentProps } from '../types';

const { Text } = Typography;

const ButtonComponent: React.FC<BaseComponentProps> = ({
  selectedComponent,
  topLevelTab,
  setTopLevelTab,
  handleValueChange,
  VariableManagementPanel,
}) => {
  const [form] = Form.useForm();

  // 事件相关状态
  const [events, setEvents] = useState<any[]>([]); // 存储事件列表
  const [popoverVisible, setPopoverVisible] = useState(false);
  const [currentActionType, setCurrentActionType] = useState('callback'); // 当前选择的动作类型
  const [parameters, setParameters] = useState<any[]>([
    { id: 1, param1: '', param2: '' },
  ]); // 参数列表
  const [currentEventId, setCurrentEventId] = useState<number | null>(null); // 当前编辑的事件ID
  const popoverAnchorRef = useRef<HTMLDivElement>(null); // Popover锚点引用

  // 表单数据状态
  const [formData, setFormData] = useState({
    pcUrl: '',
    mobileUrl: '',
    paramType: 'object', // 默认为对象
  });

  // 回显事件数据的公共函数
  const loadEventData = (event: any) => {
    // 安全检查：确保event存在，behavior可以为null（新创建的事件）
    if (!event) {
      console.warn('⚠️ loadEventData: event不存在');
      return;
    }

    // 如果behavior为null或undefined，说明是新创建的事件，使用默认值
    if (!event.behavior) {
      console.log('📝 loadEventData: 新创建的事件，使用默认配置');
      setCurrentActionType('callback');
      setFormData({
        pcUrl: '',
        mobileUrl: '',
        paramType: 'object',
      });
      setParameters([{ id: 1, param1: '', param2: '' }]);
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
      setParameters([{ id: 1, param1: '', param2: '' }]);
    } else if (behavior.type === 'callback') {
      setCurrentActionType('callback');
      setFormData({
        pcUrl: '',
        mobileUrl: '',
        paramType: 'object',
      });

      // 回显callback参数
      const callbackParams = behavior.callback || {};
      const paramEntries = Object.entries(callbackParams);
      if (paramEntries.length > 0) {
        const newParameters = paramEntries.map(([key, value], index) => ({
          id: index + 1,
          param1: key,
          param2: value as string,
        }));
        setParameters(newParameters);
      } else {
        setParameters([{ id: 1, param1: '', param2: '' }]);
      }
    } else {
      // 处理未知类型，设置默认值
      console.warn('⚠️ loadEventData: 未知的behavior类型:', behavior.type);
      setCurrentActionType('callback');
      setFormData({
        pcUrl: '',
        mobileUrl: '',
        paramType: 'object',
      });
      setParameters([{ id: 1, param1: '', param2: '' }]);
    }
  };

  console.log('📝 渲染按钮组件编辑界面:', {
    componentId: selectedComponent.id,
    topLevelTab,
  });

  // 创建事件处理函数
  const handleCreateEvent = () => {
    const newEvent = {
      id: Date.now(),
      actionType: 'callback',
      actionText: '请选择动作',
      behavior: null, // 初始化为null，表示尚未配置
    };
    setEvents([...events, newEvent]);
  };

  // 删除事件处理函数
  const handleDeleteEvent = (eventId: number) => {
    const updatedEvents = events.filter((event) => event.id !== eventId);
    setEvents(updatedEvents);

    // 更新全局数据 - 移除对应的behavior
    const updatedBehaviors = updatedEvents
      .map((event) => event.behavior)
      .filter(Boolean);

    handleValueChange('behaviors', updatedBehaviors);
    setPopoverVisible(false);
  };

  // 添加参数区块
  const handleAddParameter = () => {
    const newParam = {
      id: Date.now(),
      param1: '',
      param2: '',
    };
    setParameters([...parameters, newParam]);
  };

  // 删除参数区块
  const handleDeleteParameter = (paramId: number) => {
    setParameters(parameters.filter((param) => param.id !== paramId));
  };

  // 更新参数值
  const handleParameterChange = (
    paramId: number,
    field: string,
    value: string,
  ) => {
    setParameters(
      parameters.map((param) =>
        param.id === paramId ? { ...param, [field]: value } : param,
      ),
    );
  };

  // 保存事件配置
  const handleSaveEvent = () => {
    if (currentEventId === null) return;

    let behaviorObject;
    let actionText;

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
      const callbackParams = {};
      parameters.forEach((param) => {
        if (param.param1 && param.param2) {
          callbackParams[param.param1] = param.param2;
        }
      });

      behaviorObject = {
        type: 'callback',
        callback: callbackParams, // 直接使用参数对象，不包含action、params、paramType
      };
      actionText = `请求回调: ${paramString}`;
    }

    // 更新事件列表
    const updatedEvents = events.map((event) =>
      event.id === currentEventId
        ? { ...event, actionText, behavior: behaviorObject }
        : event,
    );

    setEvents(updatedEvents);

    // 更新全局数据 - 构建完整的behaviors数组
    const updatedBehaviors = updatedEvents
      .map((event) => event.behavior)
      .filter(Boolean);

    handleValueChange('behaviors', updatedBehaviors);

    // 关闭弹窗
    setPopoverVisible(false);
    setCurrentEventId(null);
  };

  // Popover内容
  const getPopoverContent = () => (
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
  );

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
                    🎯 当前选中：按钮组件
                  </Text>
                </div>

                {/* 内容设置 */}
                <div
                  style={{
                    marginBottom: '16px',
                    background: '#fff',
                    borderRadius: 6,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    padding: 16,
                  }}
                >
                  <div
                    style={{ fontWeight: 600, marginBottom: 8, fontSize: 15 }}
                  >
                    📝 内容设置
                  </div>
                  <Form form={form} layout="vertical">
                    <Form.Item label="按钮文案">
                      <Input
                        value={
                          (selectedComponent as any).text?.content || '按钮'
                        }
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
                  </Form>
                </div>

                {/* 样式设置 */}
                <div
                  style={{
                    background: '#fff',
                    borderRadius: 6,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    padding: 16,
                  }}
                >
                  <div
                    style={{ fontWeight: 600, marginBottom: 8, fontSize: 15 }}
                  >
                    🎨 样式设置
                  </div>
                  <Form form={form} layout="vertical">
                    <Form.Item label="按钮颜色">
                      <Select
                        value={
                          (selectedComponent as any).style?.color || 'blue'
                        }
                        onChange={(value) => handleValueChange('color', value)}
                        style={{ width: '100%' }}
                      >
                        <Select.Option value="black">
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
                                backgroundColor: '#000000',
                                border: '1px solid #d9d9d9',
                                borderRadius: '2px',
                              }}
                            />
                            黑色
                          </div>
                        </Select.Option>
                        <Select.Option value="blue">
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
                                backgroundColor: '#1890ff',
                                border: '1px solid #d9d9d9',
                                borderRadius: '2px',
                              }}
                            />
                            蓝色
                          </div>
                        </Select.Option>
                        <Select.Option value="red">
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
                                backgroundColor: '#ff4d4f',
                                border: '1px solid #d9d9d9',
                                borderRadius: '2px',
                              }}
                            />
                            红色
                          </div>
                        </Select.Option>
                      </Select>
                    </Form.Item>
                  </Form>
                </div>
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
          {
            key: 'events',
            label: (
              <span
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <ThunderboltOutlined />
                事件
              </span>
            ),
            children: (
              <div style={{ padding: '16px', position: 'relative' }}>
                {/* 创建事件按钮 - 永存 */}
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
                {events.map((event) => (
                  <div
                    key={event.id}
                    id={`event-${event.id}`}
                    style={{
                      border: '1px solid #d9d9d9',
                      borderRadius: '6px',
                      padding: '12px',
                      backgroundColor: '#fafafa',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                    }}
                    onClick={() => {
                      setCurrentEventId(event.id);
                      loadEventData(event); // 使用公共函数回显数据
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
                ))}

                {/* 统一的Popover - 只有一个 */}
                {popoverVisible && currentEventId !== null && (
                  <Popover
                    content={getPopoverContent()}
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
          },
        ]}
      />
    </div>
  );
};

export default ButtonComponent;
