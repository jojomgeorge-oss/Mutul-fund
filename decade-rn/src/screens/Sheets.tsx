import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { interpolate, interpolateColor, runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFlow } from '../flow';
import { BANKS, cap, inr, maturity, PLANS } from '../data';
import { Back, Bars, ChevD, ChevR, X } from '../icons';
import { Features, LogoTile, RoundBtn, T, Tap } from '../ui';
import { C, SPRING } from '../theme';
import { CalcCard } from './Home';

const clamp = (v: number, a: number, b: number) => { 'worklet'; return Math.min(b, Math.max(a, v)); };

/* ---------------- calculator: a dark card that rises from the bottom ---------------- */
export function CalcSheet() {
  const f = useFlow();
  const ins = useSafeAreaInsets();
  const { height: H } = useWindowDimensions();
  const visible = f.sheet === 'calc';
  const [mounted, setMounted] = useState(false);
  const v = useSharedValue(0);
  useEffect(() => {
    if (visible) { setMounted(true); v.value = withSpring(1, SPRING); }
    else if (mounted) v.value = withSpring(0, { ...SPRING, overshootClamping: true }, (fin) => { if (fin) runOnJS(setMounted)(false); });
  }, [visible]);
  const drag = Gesture.Pan().onUpdate((e) => { v.value = clamp(1 - Math.max(0, e.translationY) / 500, 0, 1); }).onEnd((e) => {
    if (e.translationY > 140 || e.velocityY > 900) runOnJS(f.setSheet)(null); else v.value = withSpring(1, SPRING);
  });
  const bd = useAnimatedStyle(() => ({ opacity: v.value }));
  const card = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - v.value) * H }] }));
  if (!mounted) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={visible ? 'auto' : 'none'}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.75)' }, bd]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => f.setSheet(null)} />
      </Animated.View>
      <GestureDetector gesture={drag}>
        <Animated.View style={[{ position: 'absolute', left: 21, right: 21, bottom: ins.bottom + 20, alignItems: 'center' }, card]}>
          <RoundBtn dark label="Close" onPress={() => f.setSheet(null)} style={{ marginBottom: 17 }}><X color="#fff" /></RoundBtn>
          <CalcCard wide />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

/* ---------------- FD plan: a sheet you can pull (or tap "View all") up into the full All plans page ---------------- */
export function PlanSheet() {
  const f = useFlow();
  const ins = useSafeAreaInsets();
  const { height: H } = useWindowDimensions();
  const visible = f.sheet === 'plan';
  const [mounted, setMounted] = useState(false);
  const [full, setFull] = useState(false);
  const scroll = useRef<ScrollView>(null);
  const d = useSharedValue(1);   // 1 = below the screen, 0 = shown
  const p = useSharedValue(0);   // 0 = sheet, 1 = full page
  const gone = useSharedValue(1);
  const sheetH = useSharedValue(560);
  const start = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true); setFull(false);
      p.value = 0; gone.value = 1; d.value = 1;
      d.value = withSpring(0, SPRING);
    } else if (mounted) {
      if (p.value > 0.5) gone.value = withTiming(0, { duration: 260 }, (fin) => { if (fin) runOnJS(setMounted)(false); });
      else d.value = withSpring(1, { ...SPRING, overshootClamping: true }, (fin) => { if (fin) runOnJS(setMounted)(false); });
    }
  }, [visible]);

  const settle = (to: number) => {
    'worklet';
    p.value = withSpring(to, SPRING, (fin) => { if (fin) runOnJS(setFull)(to === 1); });
  };
  const expand = () => settle(1);
  const collapse = () => { scroll.current?.scrollTo({ y: 0, animated: false }); setFull(false); settle(0); };
  const close = () => f.setSheet(null);

  const pan = Gesture.Pan()
    .onBegin(() => { start.value = p.value; })
    .onUpdate((e) => {
      const travel = Math.max(1, H - sheetH.value);
      if (start.value < 0.5) {
        if (e.translationY < 0) { p.value = clamp(-e.translationY / travel, 0, 1); d.value = 0; }
        else { p.value = 0; d.value = clamp(e.translationY / (sheetH.value + 60), 0, 1); }
      } else p.value = clamp(1 - Math.max(0, e.translationY) / travel, 0, 1);
    })
    .onEnd((e) => {
      if (start.value < 0.5 && e.translationY > 0) {
        if (e.translationY > 120 || e.velocityY > 900) runOnJS(close)();
        else d.value = withSpring(0, SPRING);
        return;
      }
      const to = e.velocityY < -600 ? 1 : e.velocityY > 600 ? 0 : p.value > 0.4 ? 1 : 0;
      settle(to);
    });

  const box = useAnimatedStyle(() => {
    const topC = H - sheetH.value;
    return {
      top: interpolate(p.value, [0, 1], [topC, 0]) + d.value * (sheetH.value + 60),
      borderTopLeftRadius: 24 * (1 - p.value),
      borderTopRightRadius: 24 * (1 - p.value),
      backgroundColor: interpolateColor(p.value, [0, 1], ['#f2f1f0', C.page]),
      opacity: gone.value,
    };
  });
  const bd = useAnimatedStyle(() => ({ opacity: (1 - d.value) * gone.value }));
  const page = useAnimatedStyle(() => ({ opacity: p.value * gone.value }));
  const spacer = useAnimatedStyle(() => ({ height: interpolate(p.value, [0, 1], [11, ins.top + 62]) }));
  const handle = useAnimatedStyle(() => ({ opacity: 1 - p.value }));
  const link = useAnimatedStyle(() => ({ height: interpolate(p.value, [0, 1], [60, 0], 'clamp'), opacity: clamp(1 - p.value * 2.5, 0, 1) }));
  const all = useAnimatedStyle(() => ({ opacity: clamp(p.value * 1.4 - 0.2, 0, 1), transform: [{ translateY: (1 - p.value) * 160 }] }));
  const backBtn = useAnimatedStyle(() => ({ opacity: p.value, transform: [{ translateX: (1 - p.value) * -20 }] }));
  const lStart = useAnimatedStyle(() => ({ opacity: clamp(1 - p.value * 2, 0, 1) }));
  const lConfirm = useAnimatedStyle(() => ({ opacity: clamp(p.value * 2 - 1, 0, 1) }));

  if (!mounted) return null;
  const b = BANKS[f.sel.bank];
  const mat = maturity(f.amt, f.sel.rate, f.sel.yrs);
  const primary = () => (full ? f.openBooking('amount') : f.openBooking(f.hasAmt ? 'start' : 'amount'));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={visible ? 'auto' : 'none'}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.72)' }, bd]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => !full && close()} />
      </Animated.View>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: C.page }, page]} />
      <Animated.View style={[{ position: 'absolute', left: 0, right: 0, bottom: 0, overflow: 'hidden' }, box]}>
        <Animated.View style={[styles.handle, handle]} />
        <ScrollView ref={scroll} scrollEnabled={full} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 11, paddingBottom: ins.bottom + 30 }}>
          <Animated.View style={spacer} />
          <View onLayout={(e) => { if (!full && p.value === 0) sheetH.value = e.nativeEvent.layout.height + 11 + ins.bottom + 8; }}>
            <GestureDetector gesture={pan}>
              <View style={styles.topCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <T w="m" size={21} style={{ width: 230, lineHeight: 29 }}>{b.long}</T>
                  <LogoTile k={f.sel.bank} size={51} r={15} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
                  <T size={17} color={C.mute}>{b.sub}</T>
                  <Tap onPress={() => f.push('bank')}><T size={17} color={C.purple} style={{ textDecorationLine: 'underline' }}>View details</T></Tap>
                </View>
              </View>
            </GestureDetector>
            <View style={styles.planCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <View><T w="m" size={23} color="#000">{cap(f.sel.ten)}</T><T size={11} color="#4a4a4a">Tenure</T></View>
                <View style={{ alignItems: 'flex-end' }}><T w="m" size={23} color={C.green}>{f.sel.rate.toFixed(2)}%</T><T size={11} color="#4a4a4a">Interest rate</T></View>
              </View>
              {f.hasAmt ? (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, marginHorizontal: -23, paddingHorizontal: 23, paddingTop: 20, borderTopWidth: 1, borderTopColor: C.line }}>
                  <View><T w="m" size={17} color="#000">{inr(f.amt)}</T><T size={11} color="#4a4a4a">Investing amount</T></View>
                  <View style={{ alignItems: 'flex-end' }}><T w="m" size={17} color="#000">{inr(mat)}</T><T size={11} color="#4a4a4a">At maturity</T></View>
                </View>
              ) : null}
              <Features style={{ marginTop: 22 }} />
              <Tap onPress={primary} style={styles.btn}>
                <Animated.View style={[StyleSheet.absoluteFill, styles.center, lStart]}><T size={15} color="#fff">Start FD</T></Animated.View>
                <Animated.View style={[StyleSheet.absoluteFill, styles.center, lConfirm]}><T size={15} color="#fff">Confirm &amp; continue</T></Animated.View>
              </Tap>
            </View>
            <Animated.View style={[{ overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }, link]}>
              <Tap onPress={expand} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <T size={17} color={C.purple} style={{ textDecorationLine: 'underline' }}>View all FD options</T><ChevD />
              </Tap>
            </Animated.View>
          </View>
          <Animated.View style={[styles.allCard, all]}>
            <T w="m" size={23} color="#000" style={{ marginBottom: 18 }}>All plans</T>
            {PLANS.map((g) => (
              <View key={g.title} style={{ marginBottom: 26 }}>
                <T w="m" size={17} color={C.ink2} style={{ marginLeft: 6, marginBottom: 12 }}>{g.title}</T>
                {g.items.map(([lab, yrs, rate]) => {
                  const on = f.sel.ten === lab && f.sel.rate === rate;
                  return (
                    <Tap key={g.title + lab} onPress={() => f.setSel({ ...f.sel, ten: lab, yrs, rate })} style={[styles.planRow, on && { borderColor: '#cfe6cf', backgroundColor: '#fbfffb' }]}>
                      <Bars color={g.color} />
                      <T size={17} color="#000" style={{ flex: 1 }}>{lab}</T>
                      <T w="m" size={19} color={C.greenUi} style={{ letterSpacing: 1.5 }}>{rate.toFixed(2)}%</T>
                      <ChevR />
                    </Tap>
                  );
                })}
              </View>
            ))}
          </Animated.View>
        </ScrollView>
      </Animated.View>
      <Animated.View style={[{ position: 'absolute', top: ins.top + 10, left: 21 }, backBtn]} pointerEvents={full ? 'auto' : 'none'}>
        <RoundBtn label="Back to plan" onPress={collapse}><Back /></RoundBtn>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  handle: { position: 'absolute', top: 6, alignSelf: 'center', width: 42, height: 5, borderRadius: 3, backgroundColor: '#d6d3d1', zIndex: 2 },
  topCard: { borderRadius: 23, backgroundColor: '#fff', padding: 23, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  planCard: { marginTop: 8, borderRadius: 23, backgroundColor: '#fff', padding: 23, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  btn: { height: 51, borderRadius: 26, backgroundColor: C.dark, marginTop: 22, overflow: 'hidden' },
  center: { alignItems: 'center', justifyContent: 'center' },
  allCard: { marginTop: 11, borderRadius: 23, backgroundColor: '#fff', padding: 15, paddingTop: 26 },
  planRow: { height: 75, borderRadius: 23, borderWidth: 1, borderColor: C.line, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', gap: 15, paddingLeft: 17, paddingRight: 22, marginBottom: 5 },
});
