import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

const MARK_D = 'M17 8.5C17 10.8477 16.0383 12.9727 14.4828 14.5103C12.9282 16.0488 10.7797 17 8.40605 17H2.11658V14.9074L8.59484 8.5L7.6438 7.55935L4.43968 10.7276H2.11658V2.09256L0 0H8.40605C13.1524 0 17 3.80554 17 8.5Z';

export const Mark = ({ size = 17, color = C_MARK }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 17 17"><Path d={MARK_D} fill={color} /></Svg>
);
const C_MARK = '#6c4126';

export const Back = ({ color = '#1c1c1c', size = 20 }) => (
  <Svg width={size * 0.6} height={size} viewBox="0 0 12 20" fill="none"><Path d="M10 2L2 10l8 8" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" /></Svg>
);
export const Chev = ({ color = '#ffffff', size = 9 }) => (
  <Svg width={size * 0.6} height={size} viewBox="0 0 6 10" fill="none"><Path d="M1 1l4 4-4 4" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" /></Svg>
);
export const ChevR = ({ color = '#292929' }) => (
  <Svg width={8} height={13} viewBox="0 0 8 13" fill="none"><Path d="M1.5 1.5l5 5-5 5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></Svg>
);
export const ChevD = ({ color = '#8d6197' }) => (
  <Svg width={10} height={6} viewBox="0 0 10 6" fill="none"><Path d="M1 1l4 4 4-4" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" /></Svg>
);
export const Send = () => (
  <Svg width={14} height={19} viewBox="0 0 13 18"><Path d="M1.78 17.79L12.13 10.72c1.14-.78 1.14-2.68 0-3.46L1.78.19C.84-.45-.3.62.07 1.81L2 8.02l3.71.97L2 9.96.07 16.17c-.37 1.2.76 2.27 1.71 1.62z" fill="#ffffff" /></Svg>
);
export const Search = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Circle cx={11} cy={11} r={6.5} stroke="#292929" strokeWidth={2} /><Path d="M16 16l4 4" stroke="#292929" strokeWidth={2} strokeLinecap="round" /></Svg>
);
export const Calc = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Rect x={5} y={3} width={14} height={18} rx={2} stroke="#292929" strokeWidth={2} /><Path d="M8 7h8M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01M8.5 15h.01M12 15h.01M15.5 15h.01M8.5 18h.01M12 18h.01M15.5 18h.01" stroke="#292929" strokeWidth={2} strokeLinecap="round" /></Svg>
);
export const Filter = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M4 7h16M7 12h10M10 17h4" stroke="#292929" strokeWidth={2} strokeLinecap="round" /></Svg>
);
export const Dots = () => (
  <Svg width={18} height={4} viewBox="0 0 18 4"><Circle cx={2} cy={2} r={2} fill="#000" /><Circle cx={9} cy={2} r={2} fill="#000" /><Circle cx={16} cy={2} r={2} fill="#000" /></Svg>
);
export const X = ({ color = '#292929' }) => (
  <Svg width={16} height={16} viewBox="0 0 16 16" fill="none"><Path d="M3 3l10 10M13 3L3 13" stroke={color} strokeWidth={2} strokeLinecap="round" /></Svg>
);
export const Pen = () => (
  <Svg width={14} height={14} viewBox="0 0 16 16" fill="none"><Path d="M10.5 2.5l3 3L6 13H3v-3z M3 14.5h10" stroke="#292929" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" /></Svg>
);
export const Bolt = () => (
  <Svg width={17} height={17} viewBox="0 0 17 17" fill="none"><Path d="M4.75 10.41L9.71 1.91v5.67h3.54l-4.96 8.5v-5.67H4.75z" stroke="#292929" strokeWidth={1.4} strokeLinejoin="round" /></Svg>
);
export const Sun = () => (
  <Svg width={17} height={17} viewBox="0 0 17 17" fill="none"><Circle cx={9} cy={9} r={2.83} stroke="#292929" strokeWidth={1.4} /><Path d="M14.67 9h.7M2.63 9h.7M9 14.66v.71M9 2.63v.7M13 13l.5.5M4.5 4.5l.5.5M5 13l-.5.5M13.5 4.5l-.5.5" stroke="#292929" strokeWidth={1.4} strokeLinecap="round" /></Svg>
);
export const Shield = ({ color = '#292929', size = 17 }) => (
  <Svg width={size} height={size} viewBox="0 0 17 17" fill="none"><Path d="M4.47 4.57L9 2.63l4.53 1.94c.26.11.43.37.43.65v4.86c0 1.53-.82 2.93-2.14 3.69L9 15.38l-2.82-1.61a4.24 4.24 0 0 1-2.14-3.69V5.22c0-.28.17-.54.43-.65z" stroke={color} strokeWidth={1.4} strokeLinejoin="round" /><Path d="M11.13 7.59L8.29 10.42 6.88 9" stroke={color} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" /></Svg>
);
export const Tick = ({ size = 13 }) => (
  <Svg width={size} height={size * 0.77} viewBox="0 0 13 10" fill="none"><Path d="M1.5 5l3.5 3.5 6.5-7" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></Svg>
);
export const BigTick = () => (
  <Svg width={30} height={24} viewBox="0 0 30 24" fill="none"><Path d="M3 12.5l8 8L27 4" stroke="#fff" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" /></Svg>
);
export const Expand = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M4 9V5a1 1 0 0 1 1-1h4M15 4h4a1 1 0 0 1 1 1v4M20 15v4a1 1 0 0 1-1 1h-4M9 20H5a1 1 0 0 1-1-1v-4" stroke="#fff" strokeWidth={2} strokeLinecap="round" /></Svg>
);
export const Download = () => (
  <Svg width={26} height={26} viewBox="0 0 24 24" fill="none"><Path d="M12 4v11M7 10.5l5 5 5-5M5 20h14" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></Svg>
);
export const Share = () => (
  <Svg width={26} height={26} viewBox="0 0 24 24" fill="none"><Circle cx={17.5} cy={5.5} r={2.5} stroke="#fff" strokeWidth={1.8} /><Circle cx={6.5} cy={12} r={2.5} stroke="#fff" strokeWidth={1.8} /><Circle cx={17.5} cy={18.5} r={2.5} stroke="#fff" strokeWidth={1.8} /><Path d="M8.7 10.8l6.6-4M8.7 13.2l6.6 4" stroke="#fff" strokeWidth={1.8} /></Svg>
);
export const Del = () => (
  <Svg width={30} height={22} viewBox="0 0 24 18" fill="none"><Path d="M7.5 1.5h13a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-13L1.5 9z" stroke="#645f5f" strokeWidth={1.6} strokeLinejoin="round" /><Path d="M11 5.5l7 7m0-7l-7 7" stroke="#645f5f" strokeWidth={1.6} strokeLinecap="round" /></Svg>
);
export const Bars = ({ color, size = 39, r = 12 }: { color: string; size?: number; r?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 39 39">
    <Rect x={0} y={0} width={39} height={39} rx={r} fill={color} />
    <Rect x={10.5} y={21.5} width={3} height={4} rx={1.5} fill="#fff" opacity={0.75} />
    <Rect x={15.5} y={19.5} width={3} height={6} rx={1.5} fill="#fff" opacity={0.85} />
    <Rect x={20.5} y={16.5} width={3} height={9} rx={1.5} fill="#fff" />
    <Rect x={25.5} y={13.5} width={3} height={12} rx={1.5} fill="#fff" />
  </Svg>
);
const cat = (d: string, c: string) => () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none"><Path d={d} stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></Svg>
);
export const CatIcons: Record<string, () => React.ReactElement> = {
  high: cat('M3 17l6-6 4 4 8-8M15 7h6v6', '#c27c12'),
  monthly: cat('M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM4 10h16M8 3v4M16 3v4', '#3d7bd9'),
  instant: cat('M7 4h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3zM12 8v8M8.5 12.5L12 16l3.5-3.5', '#1f9d55'),
  nopen: cat('M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3zM9 12l2 2 4-4', '#8f5cbf'),
};
