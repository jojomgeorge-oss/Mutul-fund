import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn, FadeInDown, FadeOut, interpolate, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFlow } from '../flow';
import { BANKS, inr, maturity } from '../data';
import { BigTick, Download, Expand, Share, X } from '../icons';
import { AskChips, CTA, LogoTile, Receipt, RoundBtn, T, Tap } from '../ui';
import { C, EASE_OUT, SPRING, SPRING_SOFT, shadow } from '../theme';

const GREEN = '#0e7a3a';

/* stand-in for screens that live outside Decade (bank KYC page, UPI app, VKYC call) */
export function Placeholder({ title, sub }: { title: string; sub: string }) {
  const ins = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: '#f4f3f1', alignItems: 'center', justifyContent: 'center', paddingTop: ins.top }}>
      <Animated.View entering={FadeInDown.springify().damping(22)} style={{ alignItems: 'center', paddingHorizontal: 40 }}>
        <ActivityIndicator size="large" color={C.purple} />
        <T w="m" size={23} style={{ marginTop: 24 }}>{title}</T>
        <T size={15} color={C.mute} style={{ marginTop: 8, textAlign: 'center', lineHeight: 22 }}>{sub}</T>
      </Animated.View>
    </View>
  );
}

/* payment done: tick pops, then the green page lifts into a card with the next step */
export function Success() {
  const f = useFlow();
  const ins = useSafeAreaInsets();
  const tick = useSharedValue(0);
  const m = useSharedValue(0);
  useEffect(() => {
    tick.value = withSpring(1, { damping: 12, stiffness: 180 });
    m.value = withDelay(1200, withSpring(1, SPRING_SOFT));
  }, []);
  const tickSt = useAnimatedStyle(() => ({
    transform: [{ scale: tick.value }, { translateY: interpolate(m.value, [0, 1], [0, -150]) }],
  }));
  const headSt = useAnimatedStyle(() => ({ transform: [{ translateY: interpolate(m.value, [0, 1], [0, -150]) }] }));
  const cardSt = useAnimatedStyle(() => ({ opacity: m.value, transform: [{ translateY: interpolate(m.value, [0, 1], [420, 0]) }] }));
  return (
    <View style={{ flex: 1, backgroundColor: GREEN }}>
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
        <Animated.View style={[styles.tick, tickSt]}><BigTick /></Animated.View>
        <Animated.View style={[{ alignItems: 'center', marginTop: 22 }, headSt]}>
          <T w="m" size={27} color="#fff">Payment successful</T>
          <T size={15} color="rgba(255,255,255,0.75)" style={{ marginTop: 6 }}>{inr(f.amt)} paid to {BANKS[f.sel.bank].name}</T>
        </Animated.View>
      </View>
      <View style={[styles.hdr, { top: ins.top + 10 }]}>
        <View />
        <RoundBtn label="Close" onPress={f.reset}><X /></RoundBtn>
      </View>
      <Animated.View style={[styles.sheet, { paddingBottom: ins.bottom + 22 }, cardSt]}>
        <T w="m" size={23}>One last step</T>
        <T size={15} color={C.sub} style={{ marginTop: 8, lineHeight: 22 }}>Complete a 2 minute video KYC with the bank to activate your fixed deposit.</T>
        <View style={styles.steps}>
          {[['Payment received', true], ['Video KYC', false], ['FD activated', false]].map(([t, done], i) => (
            <View key={t as string} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, height: 44 }}>
              <View style={[styles.dot, done ? { backgroundColor: '#1fa81f', borderColor: '#1fa81f' } : null]}>
                <T w="m" size={12} color={done ? '#fff' : C.mute}>{done ? '✓' : i + 1}</T>
              </View>
              <T w={done ? 'm' : 'r'} size={15} color={done ? C.ink : C.mute}>{t as string}</T>
            </View>
          ))}
        </View>
        <CTA label="Start VKYC" onPress={() => f.push('vkyc')} />
      </Animated.View>
    </View>
  );
}

/* FD started: receipt + summary */
export function Started() {
  const f = useFlow();
  const ins = useSafeAreaInsets();
  const [full, setFull] = useState(false);
  const mat = maturity(f.amt, f.sel.rate, f.sel.yrs);
  const name = BANKS[f.sel.bank].name;
  const rc = { bank: name, amount: inr(f.amt), rate: f.sel.rate.toFixed(2) + '%', tenure: f.sel.ten };
  return (
    <View style={{ flex: 1, backgroundColor: GREEN }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: ins.top + 76, paddingBottom: ins.bottom + 40 }}>
        <Animated.View entering={FadeInDown.delay(80).springify().damping(22)} style={{ alignItems: 'center', paddingHorizontal: 30 }}>
          <T w="dm" size={35} color="#fff" style={{ textAlign: 'center', lineHeight: 43 }}>Your FD has started</T>
          <T size={15} color="rgba(255,255,255,0.75)" style={{ marginTop: 8, textAlign: 'center' }}>Your money is now growing at {f.sel.rate.toFixed(2)}%</T>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(220).springify().damping(20)} style={{ marginHorizontal: 34, marginTop: 30 }}>
          <Pressable onPress={() => setFull(true)}>
            <Receipt {...rc} />
            <View style={styles.expand}><Expand /></View>
          </Pressable>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(340).springify().damping(22)} style={styles.fd}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
            <LogoTile k={f.sel.bank} size={47} />
            <View style={{ flex: 1 }}><T w="m" size={17}>{name}</T><T size={13} color={C.mute}>Fixed deposit · {f.sel.ten}</T></View>
            <T w="m" size={19} color={C.greenUi}>{f.sel.rate.toFixed(2)}%</T>
          </View>
          <View style={{ height: 1, backgroundColor: C.line, marginVertical: 16 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View><T size={13} color={C.mute}>Invested</T><T w="m" size={19} style={{ marginTop: 4 }}>{inr(f.amt)}</T></View>
            <View style={{ alignItems: 'flex-end' }}><T size={13} color={C.mute}>At maturity</T><T w="m" size={19} color={C.greenUi} style={{ marginTop: 4 }}>{inr(mat)}</T></View>
          </View>
        </Animated.View>
        <View style={{ marginTop: 30 }}><AskChips /></View>
      </ScrollView>
      <View style={[styles.hdr, { top: ins.top + 10 }]}>
        <View />
        <RoundBtn label="Close" onPress={f.reset}><X /></RoundBtn>
      </View>
      <Modal visible={full} transparent animationType="none" onRequestClose={() => setFull(false)}>
        <ReceiptOverlay rc={rc} onClose={() => setFull(false)} />
      </Modal>
    </View>
  );
}

function ReceiptOverlay({ rc, onClose }: { rc: any; onClose: () => void }) {
  const ins = useSafeAreaInsets();
  const v = useSharedValue(0);
  useEffect(() => { v.value = withSpring(1, SPRING); }, []);
  const close = () => { v.value = withTiming(0, { duration: 200, easing: EASE_OUT }); setTimeout(onClose, 200); };
  const bd = useAnimatedStyle(() => ({ opacity: v.value }));
  const card = useAnimatedStyle(() => ({ opacity: v.value, transform: [{ scale: interpolate(v.value, [0, 1], [0.85, 1]) }] }));
  return (
    <View style={{ flex: 1 }}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.82)' }, bd]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
      </Animated.View>
      <View style={[styles.hdr, { top: ins.top + 10 }]}>
        <View />
        <RoundBtn label="Close receipt" onPress={close}><X /></RoundBtn>
      </View>
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 22 }} pointerEvents="box-none">
        <Animated.View style={card}><Receipt {...rc} scale={1.15} /></Animated.View>
        <Animated.View style={[{ flexDirection: 'row', justifyContent: 'center', gap: 14, marginTop: 30 }, bd]}>
          <Tap style={styles.pill}><Download /><T w="m" size={15} color="#fff">Download</T></Tap>
          <Tap style={styles.pill}><Share /><T w="m" size={15} color="#fff">Share</T></Tap>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tick: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  hdr: { position: 'absolute', left: 21, right: 21, flexDirection: 'row', justifyContent: 'space-between' },
  sheet: { position: 'absolute', left: 11, right: 11, bottom: 11, borderRadius: 27, backgroundColor: '#fff', padding: 24, ...shadow },
  steps: { marginVertical: 18, borderWidth: 1, borderColor: C.line, borderRadius: 17, paddingHorizontal: 16, paddingVertical: 6 },
  dot: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  expand: { position: 'absolute', right: 14, top: 14, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  fd: { marginHorizontal: 11, marginTop: 30, borderRadius: 23, backgroundColor: '#fff', padding: 20, ...shadow },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, paddingHorizontal: 18, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.16)' },
});
