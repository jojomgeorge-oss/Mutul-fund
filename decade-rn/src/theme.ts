import { Easing } from 'react-native-reanimated';

export const C = {
  bg: '#fafaf9',
  page: '#f6f6f6',
  white: '#ffffff',
  ink: '#282424',
  ink2: '#212121',
  sub: '#645f5f',
  mute: '#787373',
  line: '#ebe9e8',
  green: '#037600',
  greenUi: '#00a800',
  dark: '#1f1513',
  maroonTop: '#4d1c14',
  maroonBottom: '#7e3125',
  purple: '#8d6197',
  plum: '#421a4a',
  receipt: '#223959',
  mark: '#6c4126',
};

export const F = {
  sans: 'Walsheim',
  sansMd: 'Walsheim-Medium',
  disp: 'Reckless',
  dispMd: 'Reckless-Medium',
};

// one feel for every motion in the app
export const SPRING = { damping: 28, stiffness: 260, mass: 1 };
export const SPRING_SOFT = { damping: 24, stiffness: 170, mass: 1 };
export const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);

export const shadow = {
  shadowColor: '#000',
  shadowOpacity: 0.06,
  shadowRadius: 24,
  shadowOffset: { width: 0, height: 6 },
  elevation: 3,
};
