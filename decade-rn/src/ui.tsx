import React, { useEffect, useRef, useState } from 'react';
import { Image, Keyboard, Platform, Pressable, StyleSheet, Text, TextInput, TextProps, View, ViewStyle } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, Path, Text as SvgText, TextPath, G } from 'react-native-svg';
import { BankKey, BANKS, FULL_LOGO, LOGOS } from './data';
import { Bolt, Chev, Mark, Send, Shield, Sun } from './icons';
import { C, F, SPRING, shadow } from './theme';

/* ---------- text ---------- */
export function T({ w = 'r', size = 15, color = C.ink, style, ...p }: TextProps & { w?: 'r' | 'm' | 'd' | 'dm'; size?: number; color?: string }) {
  const fam = w === 'm' ? F.sansMd : w === 'd' ? F.disp : w === 'dm' ? F.dispMd : F.sans;
  return <Text allowFontScaling={false} {...p} style={[{ fontFamily: fam, fontSize: size, color, lineHeight: Math.round(size * 1.3) }, style]} />;
}

/* ---------- tactile press: everything tappable gives a little ---------- */
const AP = Animated.createAnimatedComponent(Pressable);
export function Tap({ onPress, style, children, scaleTo = 0.97, disabled, hitSlop, accessibilityLabel }: any) {
  const s = useSharedValue(1);
  const st = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <AP
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      hitSlop={hitSlop}
      onPressIn={() => { s.value = withSpring(scaleTo, { damping: 20, stiffness: 400 }); }}
      onPressOut={() => { s.value = withSpring(1, { damping: 16, stiffness: 300 }); }}
      onPress={onPress}
      style={[style, st]}
    >
      {children}
    </AP>
  );
}

export function RoundBtn({ onPress, children, style, label, dark }: any) {
  return (
    <Tap onPress={onPress} accessibilityLabel={label} style={[styles.round, dark && { backgroundColor: '#000' }, style]} scaleTo={0.92}>
      {children}
    </Tap>
  );
}

export function LogoTile({ k, size = 47, r = 13 }: { k: BankKey | string; size?: number; r?: number }) {
  const full = FULL_LOGO.has(k);
  return (
    <View style={{ width: size, height: size, borderRadius: r, overflow: 'hidden', backgroundColor: '#fff', borderWidth: full ? 0 : 1, borderColor: '#ededed', alignItems: 'center', justifyContent: 'center' }}>
      <Image source={LOGOS[k]} style={full ? { width: size, height: size } : { width: size * 0.62, height: size * 0.62 }} resizeMode="contain" />
    </View>
  );
}

export function CTA({ label, onPress, disabled, style }: { label: string; onPress: () => void; disabled?: boolean; style?: ViewStyle }) {
  return (
    <Tap onPress={disabled ? undefined : onPress} style={[styles.cta, disabled && { opacity: 0.4 }, style]}>
      <T w="m" size={17} color="#fff">{label}</T>
    </Tap>
  );
}

export function Features({ style }: { style?: ViewStyle }) {
  const rows: [React.ReactNode, string][] = [[<Bolt key="b" />, 'Instant withdrawal available'], [<Sun key="s" />, 'No penalty for 1Y withdrawal'], [<Shield key="h" />, 'DICGC insures up to ₹5 lakh']];
  return (
    <View style={[{ borderWidth: 1, borderColor: C.line, borderRadius: 15 }, style]}>
      {rows.map(([ic, t], i) => (
        <View key={t} style={[{ height: 56, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16 }, i < 2 && { borderBottomWidth: 1, borderBottomColor: C.line }]}>
          {ic}
          <T size={16} color={C.sub}>{t}</T>
        </View>
      ))}
    </View>
  );
}

export function Radio({ on }: { on: boolean }) {
  const v = useSharedValue(on ? 1 : 0);
  useEffect(() => { v.value = withSpring(on ? 1 : 0, { damping: 14, stiffness: 300 }); }, [on]);
  const dot = useAnimatedStyle(() => ({ transform: [{ scale: v.value }] }));
  return (
    <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: on ? '#1fa81f' : '#cfcfcf', alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{ width: 11, height: 11, borderRadius: 6, backgroundColor: '#1fa81f' }, dot]} />
    </View>
  );
}

export function Check({ on }: { on: boolean }) {
  return (
    <View style={{ width: 21, height: 21, borderRadius: 5, backgroundColor: on ? '#1fa81f' : '#d9d9d9', alignItems: 'center', justifyContent: 'center' }}>
      {on ? <TickSmall /> : null}
    </View>
  );
}
const TickSmall = () => (
  <Svg width={13} height={10} viewBox="0 0 13 10" fill="none"><Path d="M1.5 5l3.5 3.5 6.5-7" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></Svg>
);

export function Chip({ t }: { t: string }) {
  return (
    <Tap style={styles.chip}>
      <T size={15} color="#000">{t}</T>
      <Chev color="#929292" size={8} />
    </Tap>
  );
}

export function AskChips() {
  return (
    <View style={{ borderTopWidth: 1, borderStyle: 'dashed', borderColor: '#d4d4d4', paddingTop: 30, paddingHorizontal: 22 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginRight: 8 }}>
          <Mark size={17} />
          <T w="dm" size={19} color="#000">Ask Decade</T>
        </View>
        {['Best FD for me', 'Tax applies to withdrawals', 'Why FD?', 'Is it safe to invest in FD', 'FD vs savings'].map((t) => <Chip key={t} t={t} />)}
      </View>
    </View>
  );
}

/* ---------- Ask Decade: a real text field; the bar rides up with the keyboard ---------- */
function useKeyboardLift() {
  const lift = useSharedValue(0);
  useEffect(() => {
    if (Platform.OS !== 'ios') return; // Android resizes the window itself
    const a = Keyboard.addListener('keyboardWillShow', (e) => { lift.value = withTiming(e.endCoordinates.height - 20, { duration: e.duration || 250 }); });
    const b = Keyboard.addListener('keyboardWillHide', (e) => { lift.value = withTiming(0, { duration: e.duration || 250 }); });
    return () => { a.remove(); b.remove(); };
  }, []);
  return lift;
}

export function AskBar({ bottomGap = 18 }: { bottomGap?: number }) {
  const ins = useSafeAreaInsets();
  const lift = useKeyboardLift();
  const [txt, setTxt] = useState('');
  const input = useRef<TextInput>(null);
  const st = useAnimatedStyle(() => ({ transform: [{ translateY: -lift.value }] }));
  return (
    <Animated.View style={[styles.askWrap, { bottom: ins.bottom + bottomGap }, st]}>
      <Pressable onPress={() => input.current?.focus()} style={styles.askField}>
        <Mark size={19} color="#9a9a9a" />
        <TextInput ref={input} value={txt} onChangeText={setTxt} placeholder="Ask Decade" placeholderTextColor="#9a9a9a" style={styles.askInput} returnKeyType="send" onSubmitEditing={() => { setTxt(''); Keyboard.dismiss(); }} />
        <Tap onPress={() => { setTxt(''); Keyboard.dismiss(); }} style={styles.send} scaleTo={0.9}><Send /></Tap>
      </Pressable>
    </Animated.View>
  );
}

/** Bank page bar: [Ask Decade | View plans] → tap the field: field on top, View plans under it → tap again: keyboard */
export function BankAskBar({ onPlans }: { onPlans: () => void }) {
  const ins = useSafeAreaInsets();
  const lift = useKeyboardLift();
  const [open, setOpen] = useState(false);
  const [txt, setTxt] = useState('');
  const input = useRef<TextInput>(null);
  const p = useSharedValue(0);
  useEffect(() => { p.value = withSpring(open ? 1 : 0, SPRING); }, [open]);
  const wrap = useAnimatedStyle(() => ({ height: interpolate(p.value, [0, 1], [69, 132]), borderRadius: interpolate(p.value, [0, 1], [35, 32]), transform: [{ translateY: -lift.value }] }));
  const field = useAnimatedStyle(() => ({ right: interpolate(p.value, [0, 1], [186, 7]) }));
  const plans = useAnimatedStyle(() => ({
    left: interpolate(p.value, [0, 1], [186, 10]),
    top: interpolate(p.value, [0, 1], [7, 70]),
  }));
  const send = useAnimatedStyle(() => ({ opacity: p.value, transform: [{ scale: 0.6 + 0.4 * p.value }] }));
  useEffect(() => {
    const h = Keyboard.addListener('keyboardDidHide', () => input.current?.blur());
    return () => h.remove();
  }, []);
  return (
    <>
      {open ? <Pressable style={StyleSheet.absoluteFill} onPress={() => { Keyboard.dismiss(); setOpen(false); }} /> : null}
      <Animated.View style={[styles.askWrap, { bottom: ins.bottom + 10 }, wrap]}>
        <Animated.View style={[styles.askFieldAbs, field]}>
          <Pressable style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }} onPress={() => (open ? input.current?.focus() : setOpen(true))}>
            <Mark size={19} color={open ? '#9a9a9a' : C.maroonTop} />
            <TextInput ref={input} editable={open} pointerEvents={open ? 'auto' : 'none'} value={txt} onChangeText={setTxt} placeholder="Ask Decade" placeholderTextColor="#9a9a9a" style={styles.askInput} />
          </Pressable>
          <Animated.View style={send} pointerEvents={open ? 'auto' : 'none'}>
            <Tap onPress={() => { setTxt(''); Keyboard.dismiss(); setOpen(false); }} style={styles.send} scaleTo={0.9}><Send /></Tap>
          </Animated.View>
        </Animated.View>
        <Animated.View style={[styles.plansBtn, plans]}>
          <Tap onPress={onPlans} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <T w="m" size={17} color="#fff">View plans</T>
            <Chev />
          </Tap>
        </Animated.View>
      </Animated.View>
    </>
  );
}

/* ---------- FD receipt (navy) ---------- */
export function Receipt({ bank, amount, rate, tenure, scale = 1 }: { bank: string; amount: string; rate: string; tenure: string; scale?: number }) {
  const s = (v: number) => v * scale;
  const kv = (l: string, v: string, right?: boolean) => (
    <View style={{ alignItems: right ? 'flex-end' : 'flex-start' }}>
      <T size={s(13)} color="rgba(255,255,255,0.7)">{l}</T>
      <T w="m" size={s(17)} color="#fff" style={{ marginTop: s(3) }}>{v}</T>
    </View>
  );
  return (
    <View style={{ backgroundColor: C.receipt, borderRadius: 23, paddingHorizontal: s(20), paddingTop: s(30), paddingBottom: s(26), ...shadow }}>
      <View style={{ alignItems: 'center' }}>
        <Svg width={s(90)} height={s(90)} viewBox="0 0 90 90">
          <Defs><Path id="ring" d="M45 45 m-37 0 a37 37 0 1 1 74 0 a37 37 0 1 1 -74 0" /></Defs>
          <SvgText fill="rgba(255,255,255,0.4)" fontSize={11.4} letterSpacing={0.7}><TextPath href="#ring">Fixed deposit started 19 July 2026 • </TextPath></SvgText>
          <G transform="translate(28 28) scale(2)"><Path d="M17 8.5C17 10.8477 16.0383 12.9727 14.4828 14.5103C12.9282 16.0488 10.7797 17 8.40605 17H2.11658V14.9074L8.59484 8.5L7.6438 7.55935L4.43968 10.7276H2.11658V2.09256L0 0H8.40605C13.1524 0 17 3.80554 17 8.5Z" fill="rgba(255,255,255,0.7)" /></G>
        </Svg>
        <T w="d" size={s(27)} color="#fff" style={{ marginTop: s(14), lineHeight: s(36) }}>Fixed deposit receipt</T>
        <T size={s(13)} color="rgba(255,255,255,0.7)" style={{ textAlign: 'center', marginTop: s(6), lineHeight: s(20) }}>Arunima Chandra, your deposit of {amount} on Decade was successful on 25 June 2026</T>
        <T size={s(17)} color="#fff" style={{ marginTop: s(18) }}>{bank}</T>
      </View>
      <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.25)', marginTop: s(12) }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: s(12) }}>{kv('Start date', '25 June 2026')}{kv('Tenure', tenure, true)}</View>
      <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.25)' }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: s(12) }}>{kv('Interest', rate)}{kv('Principal', amount, true)}</View>
    </View>
  );
}

export const bankName = (k: BankKey) => BANKS[k].name;

const styles = StyleSheet.create({
  round: { width: 52, height: 43, borderRadius: 28, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  cta: { height: 51, borderRadius: 26, backgroundColor: C.dark, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  chip: { height: 33, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, borderRadius: 17, borderWidth: 1, borderColor: '#f3c2b0', backgroundColor: 'rgba(0,0,0,0.06)' },
  askWrap: { position: 'absolute', left: 13, right: 13, height: 69, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.75)', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: 2 }, elevation: 10 },
  askField: { position: 'absolute', left: 7, right: 7, top: 7, height: 55, borderRadius: 28, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e2e2', flexDirection: 'row', alignItems: 'center', paddingLeft: 18, paddingRight: 4, gap: 10 },
  askFieldAbs: { position: 'absolute', left: 7, top: 7, height: 55, borderRadius: 28, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e2e2', flexDirection: 'row', alignItems: 'center', paddingLeft: 18, paddingRight: 4, gap: 10, overflow: 'hidden' },
  askInput: { flex: 1, fontFamily: F.sans, fontSize: 18, color: C.dark, paddingVertical: 0 },
  send: { width: 52, height: 45, borderRadius: 23, backgroundColor: C.maroonTop, alignItems: 'center', justifyContent: 'center' },
  plansBtn: { position: 'absolute', right: 7, height: 55, borderRadius: 28, backgroundColor: C.dark },
});
