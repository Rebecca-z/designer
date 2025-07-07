import { Radio } from 'antd';
import React from 'react';

const DeviceSelector: React.FC<{
  value: string;
  onChange: (v: any) => void;
  style?: React.CSSProperties;
}> = ({ value, onChange, style }) => (
  <Radio.Group
    value={value}
    onChange={(e) => onChange(e.target.value)}
    style={style}
  >
    <Radio.Button value="web">Web</Radio.Button>
    <Radio.Button value="phone">Phone</Radio.Button>
    <Radio.Button value="pad">Pad</Radio.Button>
  </Radio.Group>
);

export default DeviceSelector;
