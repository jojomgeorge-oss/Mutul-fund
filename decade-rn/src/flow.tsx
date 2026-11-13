import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions, View, BackHandler } from 'react-native';
import Animated, { interpolate, runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { BankKey, CALC_T, Sel } from './data';
import { C, SPRING } from './theme';

export type ScreenKey = 'home' | 'list' | 'amt' | 'bank' | 'book' | 'bankred' | 'payapp' | 'success' | 'vkyc' | 'started';
export type Step = 'select' | 'amount' | 'start' | 'pan' | 'aadhaar' | 'nominee' | 'addnom' | 'acct' | 'addacct' | 'review' | 'pay';

type Flow = {
  stack: ScreenKey[];
  push: (k: ScreenKey) => void;
  back: () => void;
  replaceTop: (k: ScreenKey) => void;
  reset: () => void;
  steps: Step[];
  stepDir: number;
  goStep: (s: Step) => void;
  stepBack: () => void;
  openBooking: (first: Step) => void;
  sel: Sel; setSel: (s: Sel) => void;
  amt: number; setAmt: (n: number) => void;
  fresh: boolean; setFresh: (b: boolean) => void;
  hasAmt: boolean; setHasAmt: (b: boolean) => void;
  listTitle: string; setListTitle: (s: string) => void;
  calcT: number; setCalcT: (n: number) => void;
  sheet: null | 'calc' | 'plan'; setSheet: (s: null | 'calc' | 'plan') => void;
  pan: boolean[]; setPan: (p: boolean[]) => void;
  nom: number; setNom: (n: number) => void;
  acc: number; setAcc: (n: number) => void;
  pm: number; setPm: (n: number) => void;
  reinv: boolean; setReinv: (b: boolean) => void;
  calc: { label: string; yrs: number; long: string };
};

const Ctx = createContext<Flow>(null as any);
export const useFlow = () => useContext(Ctx);

const AUTO: Partial<Record<ScreenKey, [ScreenKey | 'nominee', number]>> = { bankred: ['nominee', 1700], payapp: ['success', 1600], vkyc: ['started', 1800] };

export function FlowProvider({ children }: { children: React.ReactNode }) {
  const [stack, setStack] = useState<ScreenKey[]>(['home']);
  const [steps, setSteps] = useState<Step[]>([]);
  const [stepDir, setStepDir] = useState(1);
  const [sel, setSel] = useState<Sel>({ bank: 'sur', ten: '5 years', yrs: 5, rate: 8.25 });
  const [amt, setAmt] = useState(50000);
  const [fresh, setFresh] = useState(true);
  const [hasAmt, setHasAmt] = useState(false);
  const [listTitle, setListTitle] = useState('All FD’s');
  const [calcT, setCalcT] = useState(4);
  const [sheet, setSheet] = useState<null | 'calc' | 'plan'>(null);
  const [pan, setPan] = useState([true, false, false]);
  const [nom, setNom] = useState(0);
  const [acc, setAcc] = useState(0);
  const [pm, setPm] = useState(1);
  const [reinv, setReinv] = useState(false);
  const timer = useRef<any>(null);

  const push = useCallback((k: ScreenKey) => {
    setSheet(null);
    setStack((s) => { const i = s.indexOf(k); return i >= 0 ? s.slice(0, i + 1) : s.concat(k); });
  }, []);
  const back = useCallback(() => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)), []);
  const replaceTop = useCallback((k: ScreenKey) => setStack((s) => s.slice(0, -1).concat(k)), []);
  const reset = useCallback(() => {
    clearTimeout(timer.current);
    setStack(['home']); setSteps([]); setSheet(null); setPan([true, false, false]);
  }, []);
  const goStep = useCallback((st: Step) => {
    setStepDir(1);
    setSteps((s) => { const i = s.indexOf(st); return i >= 0 ? s.slice(0, i + 1) : s.concat(st); });
  }, []);
  const openBooking = useCallback((first: Step) => {
    setStepDir(1); setSteps([first]); setFresh(true); setSheet(null);
    setStack((s) => { const i = s.indexOf('book'); return i >= 0 ? s.slice(0, i + 1) : s.concat('book'); });
  }, []);
  const stepBack = useCallback(() => {
    setStepDir(-1);
    setSteps((s) => {
      if (s.length > 1) return s.slice(0, -1);
      setStack((st) => st.slice(0, -1));
      return s;
    });
  }, []);

  // placeholder screens move on by themselves
  const top = stack[stack.length - 1];
  useEffect(() => {
    const a = AUTO[top];
    clearTimeout(timer.current);
    if (!a) return;
    timer.current = setTimeout(() => {
      if (a[0] === 'nominee') { setStack((s) => s.slice(0, -1)); setStepDir(1); setSteps((s) => s.concat('nominee')); }
      else setStack((s) => s.slice(0, -1).concat(a[0] as ScreenKey));
    }, a[1]);
    return () => clearTimeout(timer.current);
  }, [top]);

  const c = CALC_T[calcT];
  const value = useMemo<Flow>(() => ({
    stack, push, back, replaceTop, reset, steps, stepDir, goStep, stepBack, openBooking,
    sel, setSel, amt, setAmt, fresh, setFresh, hasAmt, setHasAmt, listTitle, setListTitle, calcT, setCalcT, sheet, setSheet,
    pan, setPan, nom, setNom, acc, setAcc, pm, setPm, reinv, setReinv,
    calc: { label: c[0], yrs: c[1], long: c[2] },
  }), [stack, steps, stepDir, sel, amt, fresh, hasAmt, listTitle, calcT, sheet, pan, nom, acc, pm, reinv]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/* ---------------- navigator: native-feeling push / pop with swipe back ---------------- */
const SWIPE_OFF: ScreenKey[] = ['home', 'book', 'bankred', 'payapp', 'vkyc', 'success', 'started'];

function Layer({ k, isTop, covered, leaving, first, onGone, onSwipeBack, children }: any) {
  const { width } = useWindowDimensions();
  const x = useSharedValue(first ? 0 : width);
  useEffect(() => {
    if (leaving) x.value = withSpring(width, { ...SPRING, overshootClamping: true }, (f) => { if (f) runOnJS(onGone)(k); });
    else if (covered) x.value = withSpring(-width * 0.26, { ...SPRING, overshootClamping: true });
    else x.value = withSpring(0, { ...SPRING, overshootClamping: true });
  }, [leaving, covered]);
  const pan = Gesture.Pan()
    .enabled(isTop && !leaving && !SWIPE_OFF.includes(k))
    .activeOffsetX(18)
    .failOffsetY([-14, 14])
    .onUpdate((e) => { x.value = Math.max(0, e.translationX); })
    .onEnd((e) => {
      if (e.translationX > width * 0.33 || e.velocityX > 800) runOnJS(onSwipeBack)();
      else x.value = withSpring(0, { ...SPRING, overshootClamping: true });
    });
  const st = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const dim = useAnimatedStyle(() => ({ opacity: interpolate(x.value, [-width * 0.26, 0], [0.1, 0], 'clamp') }));
  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: C.bg }, st, !first && styles.edge]}>
        {children}
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }, dim]} />
      </Animated.View>
    </GestureDetector>
  );
}

export function Navigator({ render }: { render: (k: ScreenKey) => React.ReactNode }) {
  const f = useFlow();
  const [leaving, setLeaving] = useState<ScreenKey[]>([]);
  const prev = useRef<ScreenKey[]>(f.stack);
  // screens that just left the stack stay mounted (same instance) until their slide-out finishes
  const gone = prev.current.filter((k) => !f.stack.includes(k));
  const allLeaving = Array.from(new Set(leaving.filter((k) => !f.stack.includes(k)).concat(gone)));
  useEffect(() => {
    setLeaving(allLeaving);
    prev.current = f.stack;
  }, [f.stack]);
  const onGone = useCallback((k: ScreenKey) => setLeaving((l) => l.filter((x) => x !== k)), []);
  const top = f.stack[f.stack.length - 1];
  const swipeBack = useCallback(() => (top === 'book' ? f.stepBack() : f.back()), [top, f.stepBack, f.back]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (f.sheet) { f.setSheet(null); return true; }
      if (top === 'book') { f.stepBack(); return true; }
      if (f.stack.length > 1) { f.back(); return true; }
      return false;
    });
    return () => sub.remove();
  }, [top, f.sheet, f.stack.length]);

  return (
    <View style={StyleSheet.absoluteFill}>
      {f.stack.concat(allLeaving).map((k, i) => {
        const inStack = i < f.stack.length;
        return (
          <Layer key={k} k={k} first={k === 'home'} isTop={i === f.stack.length - 1} covered={inStack && i < f.stack.length - 1} leaving={!inStack} onGone={onGone} onSwipeBack={swipeBack}>
            {render(k)}
          </Layer>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  edge: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: -4, height: 0 }, elevation: 8 },
});
