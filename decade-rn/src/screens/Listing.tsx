import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFlow } from '../flow';
import { AMT_BANKS, BANKS, BankKey, inr, LIST_BANKS, maturity } from '../data';
import { Back, Calc, Filter, Pen } from '../icons';
import { AskBar, AskChips, LogoTile, RoundBtn, T, Tap } from '../ui';
import { C, shadow } from '../theme';

const Badge = () => (
  <View style={styles.badge}><T w="m" size={12} color="#fff">1</T></View>
);

function Header({ calcBadge }: { calcBadge?: boolean }) {
  const f = useFlow();
  const ins = useSafeAreaInsets();
  return (
    <View style={[styles.hdr, { top: ins.top + 10 }]}>
      <RoundBtn label="Back" onPress={f.back}><Back /></RoundBtn>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        <RoundBtn label="Calculator" onPress={() => f.setSheet('calc')}><Calc />{calcBadge ? <Badge /> : null}</RoundBtn>
        <RoundBtn label="Filter"><Filter /><Badge /></RoundBtn>
      </View>
    </View>
  );
}

function useFade() {
  const y = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => { y.value = e.contentOffset.y; });
  const fade = useAnimatedStyle(() => ({ opacity: interpolate(y.value, [0, 40], [0.6, 1], 'clamp') }));
  return { onScroll, fade };
}

export function List() {
  const f = useFlow();
  const ins = useSafeAreaInsets();
  const { onScroll, fade } = useFade();
  const pick = (k: BankKey) => { f.setSel({ bank: k, ten: '1Y 6M 12D', yrs: 1.53, rate: 8.25 }); f.setHasAmt(false); f.setSheet('plan'); };
  return (
    <View style={{ flex: 1, backgroundColor: '#f9f9f9' }}>
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: ins.top + 80, paddingBottom: ins.bottom + 120 }}>
        <T w="m" size={23} color={C.ink2} style={{ textAlign: 'center', marginBottom: 22 }}>{f.listTitle}</T>
        <View style={styles.card}>
          {LIST_BANKS.map((k) => (
            <Tap key={k} onPress={() => pick(k)} style={styles.row}>
              <LogoTile k={k} size={47} />
              <View style={{ flex: 1 }}>
                <T size={17} color="#000">{BANKS[k].name}</T>
                <T size={13} color="#983091" style={{ marginTop: 4 }}>{BANKS[k].tag}</T>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <T w="m" size={19} color={C.green}>8.25%</T>
                <T size={13} color="#8d8888" style={{ marginTop: 4 }}>1Y 6M 12D</T>
              </View>
            </Tap>
          ))}
        </View>
        <View style={{ marginTop: 40 }}><AskChips /></View>
      </Animated.ScrollView>
      <Animated.View pointerEvents="none" style={[styles.fade, { height: ins.top + 70 }, fade]} />
      <Header />
      <AskBar />
    </View>
  );
}

export function Amt() {
  const f = useFlow();
  const ins = useSafeAreaInsets();
  const { onScroll, fade } = useFade();
  const m = maturity(f.amt, 8.25, f.calc.yrs);
  const pick = (k: BankKey) => { f.setSel({ bank: k, ten: f.calc.long, yrs: f.calc.yrs, rate: 8.25 }); f.setHasAmt(true); f.setSheet('plan'); };
  const box = (l: string, v: string) => (
    <View style={styles.amtBox}>
      <T size={13} color="#8d8888">{l}</T>
      <T w="m" size={17} color={C.ink2} style={{ marginTop: 4 }}>{v}</T>
    </View>
  );
  return (
    <View style={{ flex: 1, backgroundColor: '#f9f9f9' }}>
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: ins.top + 84, paddingBottom: ins.bottom + 120 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginLeft: 27, marginBottom: 20 }}>
          <T w="m" size={23} color={C.ink2}>Invest {inr(f.amt)} for {f.calc.label}</T>
          <Tap onPress={() => f.setSheet('calc')} style={styles.pen} scaleTo={0.9}><Pen /></Tap>
        </View>
        <View style={styles.card}>
          {AMT_BANKS.map((k) => (
            <Tap key={k} onPress={() => pick(k)} style={[styles.row, { height: 172, flexDirection: 'column', alignItems: 'stretch', justifyContent: 'space-between', paddingVertical: 15 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                <LogoTile k={k} size={47} />
                <View style={{ flex: 1 }}>
                  <T size={17} color="#000">{BANKS[k].name}</T>
                  <T size={13} color="#983091" style={{ marginTop: 4 }}>{BANKS[k].tag}</T>
                </View>
                <T w="m" size={19} color={C.green}>8.25%</T>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {box('Investing', inr(f.amt))}
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <T size={13} color="#8d8888">{f.calc.label}</T>
                  <View style={{ alignSelf: 'stretch', borderTopWidth: 1, borderStyle: 'dashed', borderColor: '#dcdcdc', marginTop: 6 }} />
                </View>
                {box('At maturity', inr(m))}
              </View>
            </Tap>
          ))}
        </View>
        <View style={{ marginTop: 40 }}><AskChips /></View>
      </Animated.ScrollView>
      <Animated.View pointerEvents="none" style={[styles.fade, { height: ins.top + 70 }, fade]} />
      <Header calcBadge />
      <AskBar />
    </View>
  );
}

const styles = StyleSheet.create({
  hdr: { position: 'absolute', left: 21, right: 21, flexDirection: 'row', justifyContent: 'space-between' },
  badge: { position: 'absolute', right: -2, top: -8, width: 20, height: 20, borderRadius: 10, backgroundColor: '#e05252', alignItems: 'center', justifyContent: 'center' },
  card: { marginHorizontal: 11, borderRadius: 27, backgroundColor: '#fff', padding: 13, gap: 6, ...shadow },
  row: { minHeight: 88, borderRadius: 23, borderWidth: 1, borderColor: C.line, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', gap: 15, paddingHorizontal: 17 },
  amtBox: { width: 106, height: 64, borderWidth: 1, borderColor: C.line, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  pen: { width: 34, height: 24, borderRadius: 12, borderWidth: 1, borderColor: '#e4e4e4', backgroundColor: '#f2f2f2', alignItems: 'center', justifyContent: 'center' },
  fade: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: 'rgba(249,249,249,0.94)' },
});
