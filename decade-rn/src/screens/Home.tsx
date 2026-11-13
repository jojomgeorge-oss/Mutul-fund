import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  interpolate, runOnJS, SharedValue, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming,
} from 'react-native-reanimated';
import { Directions, Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useFlow } from '../flow';
import { BANKS, CALC_T, inr, LIST_TITLES, REC, Sel } from '../data';
import { Back, CatIcons, Chev, ChevD, Mark, Search, X } from '../icons';
import { AskBar, AskChips, LogoTile, RoundBtn, T, Tap } from '../ui';
import { C, EASE_OUT, SPRING, SPRING_SOFT, shadow } from '../theme';

const CARD_H = 224;
// deck ranks: front, the one peeking under it, and one more tucked behind (scaled about the card's bottom edge)
const RANK = [
  { y: 0, s: 1, o: 1 },
  { y: 15 + (CARD_H * (1 - 0.894)) / 2, s: 0.894, o: 0.5 },
  { y: 28 + (CARD_H * (1 - 0.8)) / 2, s: 0.8, o: 0.22 },
];

export function MaroonBg() {
  return (
    <Svg style={StyleSheet.absoluteFill} preserveAspectRatio="none" viewBox="0 0 10 10">
      <Defs><LinearGradient id="m" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={C.maroonTop} /><Stop offset="1" stopColor={C.maroonBottom} /></LinearGradient></Defs>
      <Rect x={0} y={0} width={10} height={10} fill="url(#m)" />
    </Svg>
  );
}

export function RecCard({ sel, onStart, onPress }: { sel: Sel; onStart: () => void; onPress?: () => void }) {
  const b = BANKS[sel.bank];
  const Wrap: any = onPress ? Pressable : View;
  return (
    <Wrap onPress={onPress} style={styles.recCard}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 53, paddingHorizontal: 23, borderBottomWidth: 1, borderBottomColor: '#f0eeed' }}>
        <LogoTile k={sel.bank} size={25} r={7} />
        <T size={15} color={C.ink}>{b.name}</T>
      </View>
      <View style={{ flexDirection: 'row', paddingHorizontal: 23, paddingTop: 20 }}>
        <View style={{ flex: 1 }}>
          <T size={13} color={C.sub}>Invest</T>
          <T w="m" size={23} style={{ marginTop: 3 }}>₹5,00,000</T>
          <T size={13} color={C.sub} style={{ marginTop: 20 }}>Tenure</T>
          <T w="m" size={23} style={{ marginTop: 3 }}>{sel.ten}</T>
        </View>
        <View style={{ width: 130 }}>
          <T size={13} color={C.sub}>Interest rate</T>
          <T w="m" size={23} color={C.green} style={{ marginTop: 3 }}>{sel.rate.toFixed(2)}%</T>
          <Tap onPress={onStart} style={styles.startBtn}><T size={15} color="#fff">Start FD</T></Tap>
        </View>
      </View>
    </Wrap>
  );
}

function DeckCard({ i, y, s, o, z, children }: { i: number; y: SharedValue<number>; s: SharedValue<number>; o: SharedValue<number>; z: number; children: React.ReactNode }) {
  const st = useAnimatedStyle(() => ({ opacity: o.value, transform: [{ translateY: y.value }, { scale: s.value }] }));
  return <Animated.View pointerEvents={z === 3 ? 'auto' : 'none'} style={[styles.deckCard, { zIndex: z }, st]}>{children}</Animated.View>;
}

function useDeck() {
  const y0 = useSharedValue(RANK[0].y), y1 = useSharedValue(RANK[1].y), y2 = useSharedValue(RANK[2].y);
  const s0 = useSharedValue(RANK[0].s), s1 = useSharedValue(RANK[1].s), s2 = useSharedValue(RANK[2].s);
  const o0 = useSharedValue(1), o1 = useSharedValue(RANK[1].o), o2 = useSharedValue(RANK[2].o);
  return { y: [y0, y1, y2], s: [s0, s1, s2], o: [o0, o1, o2] };
}

/* ---------------- the recommendation deck + its list overlay ---------------- */
function RecDeck({ paused, onOpen }: { paused: boolean; onOpen: (order: number[]) => void }) {
  const f = useFlow();
  const [order, setOrder] = useState([0, 1, 2]); // order[0] is in front
  const d = useDeck();
  const busy = useRef(false);

  const settle = useCallback((ord: number[], lifted: number) => {
    ord.forEach((card, rank) => {
      const r = RANK[rank];
      const delay = card === lifted ? 0 : rank === 0 ? 60 : 180;
      d.y[card].value = withDelay(delay, withSpring(r.y, SPRING_SOFT));
      d.s[card].value = withDelay(delay, withSpring(r.s, SPRING_SOFT));
      d.o[card].value = withDelay(delay, withTiming(r.o, { duration: 380 }));
    });
    setTimeout(() => { busy.current = false; }, 700);
  }, []);

  const rotate = useCallback(() => {
    setOrder((o) => {
      const n = o.slice(1).concat(o[0]);
      settle(n, o[0]);
      return n;
    });
  }, [settle]);

  // the front card lifts straight up, then tucks in behind as the next one slides forward
  const shuffle = useCallback(() => {
    if (busy.current) return;
    busy.current = true;
    const front = order[0];
    d.s[front].value = withTiming(0.97, { duration: 360, easing: EASE_OUT });
    d.y[front].value = withTiming(-56, { duration: 360, easing: EASE_OUT }, (fin) => { if (fin) runOnJS(rotate)(); });
  }, [order, rotate]);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(shuffle, 3400);
    return () => clearInterval(t);
  }, [paused, shuffle]);

  // flick the deck up to shuffle by hand; tap anywhere else on it to see every card
  const fling = Gesture.Fling().direction(Directions.UP).onEnd(() => { runOnJS(shuffle)(); });

  return (
    <GestureDetector gesture={fling}>
      <Pressable onPress={() => onOpen(order)} style={styles.banner}>
        <MaroonBg />
        <View style={{ height: 23 + CARD_H + 36 }}>
          {[0, 1, 2].map((i) => (
            <DeckCard key={i} i={i} y={d.y[i]} s={d.s[i]} o={d.o[i]} z={3 - order.indexOf(i)}>
              <RecCard sel={REC[i]} onStart={() => { f.setSel(REC[i]); f.openBooking('amount'); }} />
            </DeckCard>
          ))}
        </View>
        <RecCopy />
      </Pressable>
    </GestureDetector>
  );
}

function RecCopy({ onAsk }: { onAsk?: () => void }) {
  return (
    <View style={{ paddingHorizontal: 30 }}>
      <T size={17} color="#f7f2f2" style={{ opacity: 0.85, lineHeight: 23 }}>Hi Arunima, Decade suggests moving part of your savings to a fixed deposit, and we found a great option at Suryoday SF Bank.</T>
      <Tap onPress={onAsk} style={styles.askOutline}>
        <Mark size={17} color="#f7f2f2" />
        <T w="dm" size={17} color="#f7f2f2">Ask Decade</T>
        <Chev />
      </Tap>
    </View>
  );
}

function RecOverlay({ from, order, onClosed }: { from: { y: number }; order: number[]; onClosed: () => void }) {
  const f = useFlow();
  const ins = useSafeAreaInsets();
  const { height: H } = useWindowDimensions();
  const o = useSharedValue(0);
  const [open, setOpen] = useState(false);
  const top1 = ins.top + 52;
  const h1 = H - top1 - ins.bottom - 14;
  useEffect(() => { o.value = withSpring(1, SPRING, (fin) => { if (fin) runOnJS(setOpen)(true); }); }, []);
  const close = () => { setOpen(false); o.value = withSpring(0, SPRING, (fin) => { if (fin) runOnJS(onClosed)(); }); };
  const box = useAnimatedStyle(() => ({ top: interpolate(o.value, [0, 1], [from.y, top1]), height: interpolate(o.value, [0, 1], [460, h1]) }));
  const bd = useAnimatedStyle(() => ({ opacity: o.value }));
  const xb = useAnimatedStyle(() => ({ opacity: o.value, transform: [{ translateY: interpolate(o.value, [0, 1], [-14, 0]) }] }));
  const copy = useAnimatedStyle(() => ({ transform: [{ translateY: interpolate(o.value, [0, 1], [0, 3 * 240 - (CARD_H + 36) + 12]) }] }));
  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(20,12,10,0.6)' }, bd]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
      </Animated.View>
      <Animated.View style={[styles.banner, { position: 'absolute', left: 11, right: 11, marginHorizontal: 0, marginTop: 0, paddingBottom: 0 }, box]}>
        <MaroonBg />
        <ScrollView scrollEnabled={open} showsVerticalScrollIndicator={false} contentContainerStyle={{ height: 23 + 3 * 240 + 190 }}>
          {order.map((card, rank) => <OverlayCard key={card} rank={rank} o={o} sel={REC[card]} onStart={() => { f.setSel(REC[card]); f.openBooking('amount'); }} onPick={() => { f.setSel(REC[card]); f.setHasAmt(false); f.setSheet('plan'); }} />)}
          <Animated.View style={[{ position: 'absolute', left: 0, right: 0, top: 23 + CARD_H + 36 }, copy]}><RecCopy /></Animated.View>
        </ScrollView>
      </Animated.View>
      <Animated.View style={[{ position: 'absolute', top: ins.top + 4, alignSelf: 'center' }, xb]}>
        <RoundBtn dark label="Close recommendations" onPress={close}><X color="#fff" /></RoundBtn>
      </Animated.View>
    </View>
  );
}

function OverlayCard({ rank, o, sel, onStart, onPick }: any) {
  const r = RANK[rank];
  const st = useAnimatedStyle(() => {
    const p = Math.min(1, Math.max(0, o.value * 1.15 - rank * 0.08));
    return {
      opacity: interpolate(p, [0, 1], [r.o, 1]),
      transform: [{ translateY: interpolate(p, [0, 1], [r.y, rank * 240]) }, { scale: interpolate(p, [0, 1], [r.s, 1]) }],
    };
  });
  return <Animated.View style={[styles.deckCard, { zIndex: 3 - rank }, st]}><RecCard sel={sel} onStart={onStart} onPress={onPick} /></Animated.View>;
}

/* ---------------- the page ---------------- */
export default function Home() {
  const f = useFlow();
  const ins = useSafeAreaInsets();
  const { width: W } = useWindowDimensions();
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => { scrollY.value = e.contentOffset.y; });
  const fade = useAnimatedStyle(() => ({ opacity: interpolate(scrollY.value, [300, 380], [0, 1], 'clamp') }));
  const [ov, setOv] = useState<null | { y: number; order: number[] }>(null);
  const bannerRef = useRef<View>(null);
  const isTop = f.stack[f.stack.length - 1] === 'home' && !f.sheet;
  const openList = (k: string) => { f.setListTitle(LIST_TITLES[k]); f.push('list'); };
  const openOverlay = (order: number[]) => bannerRef.current?.measureInWindow((x, y) => setOv({ y, order }));

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: ins.bottom + 120 }}>
        <Svg width={W} height={560} style={{ position: 'absolute', top: 0, left: 0 }}>
          <Defs>
            <RadialGradient id="a" cx="15%" cy="6%" rx="70%" ry="55%"><Stop offset="0" stopColor="#b8938e" stopOpacity={0.75} /><Stop offset="1" stopColor="#b8938e" stopOpacity={0} /></RadialGradient>
            <RadialGradient id="b" cx="88%" cy="40%" rx="60%" ry="50%"><Stop offset="0" stopColor="#f6f5df" stopOpacity={0.9} /><Stop offset="1" stopColor="#f6f5df" stopOpacity={0} /></RadialGradient>
          </Defs>
          <Rect x={0} y={0} width={W} height={560} fill="url(#a)" />
          <Rect x={0} y={0} width={W} height={560} fill="url(#b)" />
        </Svg>
        <T w="dm" size={47} color={C.plum} style={{ marginTop: ins.top + 82, marginLeft: 21, lineHeight: 56 }}>Fixed deposit</T>
        <View ref={bannerRef} collapsable={false} style={{ opacity: ov ? 0 : 1 }}>
          <RecDeck paused={!isTop || !!ov} onOpen={openOverlay} />
        </View>

        <T w="m" size={23} color={C.ink2} style={styles.h2}>FD Categories</T>
        <View style={styles.grid}>
          {([['high', 'High returns', 'Up to 8.30% a year'], ['monthly', 'Monthly payouts', 'Interest paid monthly'], ['instant', 'Instant withdraw', 'Break it anytime'], ['nopen', 'No penalty withdrawals', 'Exit early at no charge']] as const).map(([k, t, s]) => {
            const Ic = CatIcons[k];
            return (
              <Tap key={k} onPress={() => openList(k)} style={styles.cat}>
                <Ic />
                <View>
                  <T w="m" size={19} color={C.ink2} style={{ lineHeight: 23 }}>{t}</T>
                  <T size={13} color="rgba(0,0,0,0.4)" style={{ marginTop: 3 }}>{s}</T>
                </View>
              </Tap>
            );
          })}
        </View>

        <T w="m" size={23} color={C.ink2} style={styles.h2}>Fixed deposit protection</T>
        <View style={[styles.whiteCard, { flexDirection: 'row', flexWrap: 'wrap', gap: 11, padding: 23 }]}>
          {[['#ffd77c', 'Withdraw anytime'], ['#dcf3a5', 'Get monthly payouts'], ['#f0d2f7', 'Get instant receipt'], ['#d9dee6', 'Insured by DICGC']].map(([c, t]) => (
            <View key={t} style={[styles.tile, { backgroundColor: c }]}><T w="m" size={19} style={{ textAlign: 'center', lineHeight: 25 }}>{t}</T></View>
          ))}
        </View>

        <T w="m" size={23} color={C.ink2} style={styles.h2}>Banks</T>
        <View style={[styles.whiteCard, { padding: 23 }]}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 11 }}>
            {(['unity', 'shiv', 'jana', 'shri'] as const).map((k) => (
              <Tap key={k} onPress={() => f.push('bank')} style={styles.bankTile}>
                <LogoTile k={k} size={55} r={15} />
                <T size={15} color={C.ink2} style={{ marginTop: 16 }}>{BANKS[k].name}</T>
                <T size={13} color="#983091" style={{ marginTop: 4 }}>{BANKS[k].tag}</T>
              </Tap>
            ))}
          </View>
          <Tap onPress={() => openList('all')} style={{ flexDirection: 'row', alignSelf: 'center', alignItems: 'center', gap: 6, marginTop: 24 }}>
            <T size={17} color="#5b56ca" style={{ textDecorationLine: 'underline' }}>View all</T><ChevD color="#5b56ca" />
          </Tap>
        </View>

        <View style={{ backgroundColor: '#ddddca', marginTop: 36, paddingVertical: 41, alignItems: 'center' }}>
          <CalcCard />
        </View>
        <View style={{ marginTop: 26 }}><AskChips /></View>
      </Animated.ScrollView>

      <Animated.View pointerEvents="none" style={[styles.fade, { height: ins.top + 70 }, fade]} />
      <View style={[styles.hdr, { top: ins.top + 10 }]}>
        <RoundBtn label="Menu"><Back /></RoundBtn>
        <RoundBtn label="Search"><Search /></RoundBtn>
      </View>
      <AskBar />
      {ov ? <RecOverlay from={{ y: ov.y }} order={ov.order} onClosed={() => setOv(null)} /> : null}
    </View>
  );
}

export function CalcCard({ wide }: { wide?: boolean }) {
  const f = useFlow();
  return (
    <View style={[styles.calc, wide && { width: '100%', paddingVertical: 40 }]}>
      <T w="d" size={19} color="#fff" style={{ textAlign: 'center', lineHeight: 23 }}>Calculate Fixed{'\n'}Deposit Returns</T>
      <View style={styles.calcBox}>
        <T w="m" size={36} color="#eaeaea" style={{ lineHeight: 44 }}>{inr(f.amt)}</T>
        <View style={{ height: 1, backgroundColor: '#c2c2c2', alignSelf: 'stretch', marginVertical: 10 }} />
        <T size={17} color="rgba(255,255,255,0.83)">Investment amount</T>
      </View>
      <View style={{ flexDirection: 'row', gap: 11, marginTop: wide ? 40 : 30 }}>
        {CALC_T.map(([l], i) => {
          const on = i === f.calcT;
          return (
            <Tap key={l} onPress={() => f.setCalcT(i)} scaleTo={0.9} style={[styles.chipT, on && { backgroundColor: 'rgba(255,255,255,0.5)', borderColor: '#fff' }]}>
              <T size={15} color={on ? '#000' : 'rgba(255,255,255,0.75)'}>{l}</T>
            </Tap>
          );
        })}
        <View style={[styles.chipT, { opacity: 0.7 }]}><T size={18} color="#fff">+</T></View>
      </View>
      <Tap onPress={() => { f.setHasAmt(true); f.setSheet(null); f.push('amt'); }} style={styles.calcBtn}><T w="m" size={17} color="#fff">Calculate</T></Tap>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { marginTop: 22, marginHorizontal: 11, borderRadius: 23, overflow: 'hidden', paddingBottom: 26, ...shadow },
  recCard: { height: CARD_H, borderRadius: 15, backgroundColor: '#fff', overflow: 'hidden' },
  deckCard: { position: 'absolute', left: 23, right: 23, top: 23, borderRadius: 15, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 18, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  startBtn: { marginTop: 24, width: 107, height: 38, borderRadius: 19, backgroundColor: '#2f1d1d', alignItems: 'center', justifyContent: 'center' },
  askOutline: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', height: 44, paddingHorizontal: 16, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(247,242,242,0.7)', marginTop: 22 },
  h2: { textAlign: 'center', marginTop: 36, marginBottom: 22 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 11, paddingHorizontal: 11 },
  cat: { width: '48.5%', height: 139, borderRadius: 23, backgroundColor: '#fdfcfc', padding: 17, justifyContent: 'space-between', ...shadow },
  whiteCard: { marginHorizontal: 11, borderRadius: 23, backgroundColor: '#fff', ...shadow },
  tile: { width: '48.4%', height: 165, borderRadius: 17, justifyContent: 'flex-end', alignItems: 'center', paddingHorizontal: 18, paddingBottom: 24 },
  bankTile: { width: '48.4%', height: 152, borderRadius: 15, borderWidth: 1, borderColor: '#ededed', alignItems: 'center', paddingTop: 15 },
  calc: { width: '82%', borderRadius: 23, backgroundColor: '#271b1e', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)', alignItems: 'center', paddingVertical: 30, ...shadow },
  calcBox: { width: 245, borderWidth: 1, borderColor: '#c2c2c2', borderRadius: 17, alignItems: 'center', paddingTop: 12, paddingBottom: 14, marginTop: 24 },
  chipT: { width: 36, height: 45, borderRadius: 20, borderWidth: 1, borderColor: '#efefef', alignItems: 'center', justifyContent: 'center' },
  calcBtn: { width: 158, height: 45, borderRadius: 22, borderWidth: 1, borderColor: '#efefef', alignItems: 'center', justifyContent: 'center', marginTop: 32 },
  fade: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: 'rgba(250,250,249,0.96)' },
  hdr: { position: 'absolute', left: 21, right: 21, flexDirection: 'row', justifyContent: 'space-between' },
});
