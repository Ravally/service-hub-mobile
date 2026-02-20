import React from 'react';
import Svg, { Line, Path, Circle } from 'react-native-svg';

export default function ClampIcon({ size = 16, color = '#F59E0B' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Cross tubes */}
      <Line x1="1" y1="12" x2="23" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <Line x1="12" y1="1" x2="12" y2="23" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      {/* Right jaw */}
      <Path d="M16.5 7 A6.5 6.5 0 0 1 16.5 17" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* Left jaw */}
      <Path d="M7.5 17 A6.5 6.5 0 0 1 7.5 7" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* Center bolt */}
      <Circle cx="12" cy="12" r="2.5" stroke={color} strokeWidth="1.5" fill="none" />
      <Circle cx="12" cy="12" r="1" fill={color} />
    </Svg>
  );
}
