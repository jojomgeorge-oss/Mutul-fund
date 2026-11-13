import React, { useEffect } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  FadeIn, FadeInDown, FadeInLeft, FadeInRight, FadeOut, FadeOutLeft, FadeOutRight, FadeOutUp,
  interpolate, useAnimatedStyle, useSharedValue, withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { Step, useFlow } from '../flow';
import { BANKS, cap, inr, LOGOS, maturity, PLANS } from '../data';
import { Back, Bars, ChevD, ChevR, Del, Pen, Shield } from '../icons';
import { AskBar, Check, LogoTile, Radio, T, Tap } from '../ui';
import { C, SPRING } from '../theme';

const LABEL: Partial<Record<Step, string>> = { amount: 'Continue', start: 'Start KYC', aadhaar: 'Proceed' };

export default function Booking() {
  const f = useFlow();
  const ins = useSafeAreaInsets();
  const step: Step = f.steps[f.steps.length - 1] || 'select';
  const isSelect = step === 'select';
  const sel = useSharedValue(isSelect ? 1 : 0);
  useEffect(() => { sel.value = withSpring(isSelect ? 1 : 0, SPRING); }, [isSelect]);
  const ctaSpace = ins.bottom + 92;
  // the one card stays put; it only grows to the bottom edge on "Select your plan", where there's no button
  const card = useAnimatedStyle(() => ({ bottom: interpolate(sel.value, [0, 1], [ctaSpace, -24]) }));
  const ctaSt = useAnimatedStyle(() => ({ opacity: 1 - sel.value, transform: [{ translateY: sel.value * 140 }] }));

  const panReady = f.pan.every(Boolean);
  const actions: Partial<Record<Step, () => void>> = {
    amount: () => f.goStep('start'),
    start: () => f.goStep('pan'),
    pan: () => panReady && f.goStep('aadhaar'),
    aadhaar: () => f.push('bankred'),
    nominee: () => f.goStep('acct'),
    addnom: f.stepBack,
    acct: () => f.goStep('review'),
    addacct: f.stepBack,
    review: () => f.goStep('pay'),
    pay: () => f.push('payapp'),
  };
  const label = isSelect ? '' : LABEL[step] || 'Confirm';
  const fwd = f.stepDir > 0;
  const enter = (fwd ? FadeInRight : FadeInLeft).springify().damping(24).stiffness(220);
  const exit = (fwd ? FadeOutLeft : FadeOutRight).duration(220);

  return (
    <View style={{ flex: 1, backgroundColor: '#fcfcfc' }}>
      <Animated.View style={[styles.card, { top: ins.top + 8 }, card]}>
        <View style={styles.head}>
          <Tap onPress={f.stepBack} accessibilityLabel="Back" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }} scaleTo={0.85}><Back size={22} /></Tap>
          <LogoTile k={f.sel.bank} size={33} r={10} />
          <View style={{ marginLeft: 10 }}>
            <T w="m" size={17} color="rgba(0,0,0,0.5)" style={{ letterSpacing: 0.85, textTransform: 'uppercase' }}>{BANKS[f.sel.bank].name}</T>
            <Tap onPress={() => f.push('bank')} scaleTo={0.95}><T size={13} color={C.purple} style={{ textDecorationLine: 'underline' }}>View details</T></Tap>
          </View>
        </View>
        <View style={{ flex: 1, overflow: 'hidden' }}>
          <Animated.View key={step} entering={enter} exiting={exit} style={StyleSheet.absoluteFill}>
            <StepBody step={step} />
          </Animated.View>
        </View>
      </Animated.View>

      <Animated.View style={[{ position: 'absolute', left: 23, right: 23, bottom: ins.bottom + 22 }, ctaSt]} pointerEvents={isSelect ? 'none' : 'auto'}>
        <Tap onPress={actions[step]} style={[styles.cta, step === 'pan' && !panReady && { opacity: 0.4 }]}>
          <Animated.View key={label} entering={FadeInDown.duration(260)} exiting={FadeOutUp.duration(180)} style={[StyleSheet.absoluteFill, styles.center]}>
            <T w="m" size={17} color="#fff">{label}</T>
          </Animated.View>
        </Tap>
      </Animated.View>

      {isSelect ? (
        <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)} style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <AskBar />
        </Animated.View>
      ) : null}
    </View>
  );
}

function StepBody({ step }: { step: Step }) {
  switch (step) {
    case 'select': return <SelectStep />;
    case 'amount': return <AmountStep />;
    case 'start': return <StartStep />;
    case 'pan': return <PanStep />;
    case 'aadhaar': return <AadhaarStep />;
    case 'nominee': return <NomineeStep />;
    case 'addnom': return <AddNomStep />;
    case 'acct': return <AcctStep />;
    case 'addacct': return <AddAcctStep />;
    case 'review': return <ReviewStep />;
    case 'pay': return <PayStep />;
  }
  return null;
}

const Title = ({ t, center }: { t: string; center?: boolean }) => (
  <T w="m" size={center ? 27 : 23} style={{ marginTop: center ? 18 : 22, marginBottom: 20, textAlign: center ? 'center' : 'left', paddingHorizontal: center ? 0 : 23, lineHeight: center ? 33 : 29 }}>{t}</T>
);

function Rows({ rows, rh = 65 }: { rows: [string, string, any?][]; rh?: number }) {
  return (
    <View style={styles.rows}>
      {rows.map(([l, v, vs], i) => (
        <View key={l} style={[{ height: rh, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22 }, i > 0 && { borderTopWidth: 1, borderTopColor: C.line }]}>
          <T size={15} color={C.mute}>{l}</T>
          <T w="m" size={17} style={vs}>{v}</T>
        </View>
      ))}
    </View>
  );
}

/* ---------- steps ---------- */
function SelectStep() {
  const f = useFlow();
  const ins = useSafeAreaInsets();
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: ins.bottom + 130 }}>
      <T w="m" size={27} style={{ marginTop: 18, marginLeft: 8 }}>Select your plan</T>
      <View style={{ flexDirection: 'row', marginTop: 22, marginBottom: 24 }}>
        <View style={[styles.tab, { borderColor: '#d2cecc', backgroundColor: '#fff' }]}><T w="m" size={15} color="#000">One time deposit</T></View>
        <View style={styles.tab}><T size={15} color="rgba(0,0,0,0.67)">Recurring deposit</T></View>
      </View>
      {PLANS.map((g) => (
        <View key={g.title} style={{ marginBottom: 28 }}>
          <T w="m" size={17} color={C.ink2} style={{ marginLeft: 6, marginBottom: 12 }}>{g.title}</T>
          {g.items.map(([lab, yrs, rate]) => (
            <Tap key={g.title + lab} onPress={() => { f.setSel({ bank: f.sel.bank, ten: lab, yrs, rate }); f.setFresh(true); f.goStep('amount'); }} style={styles.planRow}>
              <Bars color={g.color} />
              <T size={17} color="#000" style={{ flex: 1 }}>{lab}</T>
              <T w="m" size={19} color={C.greenUi} style={{ letterSpacing: 1.5 }}>{rate.toFixed(2)}%</T>
              <ChevR />
            </Tap>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

function AmountStep() {
  const f = useFlow();
  const key = (d: number) => { const cur = f.fresh ? 0 : f.amt; const n = cur * 10 + d; if (n <= 99999999) { f.setAmt(n); f.setFresh(false); } };
  const del = () => { f.setAmt(Math.floor(f.amt / 10)); f.setFresh(false); };
  const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9, -1, 0, -2];
  return (
    <View style={{ flex: 1, paddingHorizontal: 11, paddingTop: 12 }}>
      <View style={styles.box}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14, gap: 13 }}>
          <Bars color="#c43960" size={51} r={15} />
          <View style={{ flex: 1 }}>
            <T w="m" size={17}>{cap(f.sel.ten).replace('years', 'Years').replace('year', 'Year')}</T>
            <T size={13} color="rgba(0,0,0,0.5)">{BANKS[f.sel.bank].name}</T>
          </View>
          <T w="m" size={19} color={C.greenUi} style={{ letterSpacing: 1.5 }}>{f.sel.rate.toFixed(2)}%</T>
        </View>
        <View style={{ height: 1, backgroundColor: C.line }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, height: 56 }}>
          <T size={15}>Interest payout</T>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <T w="m" size={17}>On maturity</T>
            <View style={styles.penChip}><Pen /></View>
          </View>
        </View>
      </View>
      <View style={[styles.box, { marginTop: 24, alignItems: 'center' }]}>
        <T w="m" size={53} style={{ lineHeight: 66, marginTop: 18 }}>{inr(f.amt)}</T>
        <View style={{ height: 1, backgroundColor: C.line, alignSelf: 'stretch', marginTop: 10 }} />
        <T size={13} color={C.greenUi} style={{ marginVertical: 12 }}>Your FD at maturity will be {inr(maturity(f.amt, f.sel.rate, f.sel.yrs))}</T>
      </View>
      <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignContent: 'center' }}>
        {keys.map((k, i) => (
          <View key={i} style={{ width: '33.33%', height: 60, alignItems: 'center', justifyContent: 'center' }}>
            {k >= 0 ? (
              <Tap onPress={() => key(k)} scaleTo={0.85} style={styles.key}><T w="m" size={34} color={C.sub} style={{ lineHeight: 40 }}>{k}</T></Tap>
            ) : k === -2 ? (
              <Tap onPress={del} scaleTo={0.85} accessibilityLabel="Delete" style={styles.key}><Del /></Tap>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

function StartStep() {
  const f = useFlow();
  const m = maturity(f.amt, f.sel.rate, f.sel.yrs);
  return (
    <View style={{ paddingHorizontal: 11 }}>
      <Title t="Start your fixed deposit" center />
      <Rows rows={[['Deposit amount', inr(f.amt), { fontSize: 23, lineHeight: 30 }], ['At maturity', inr(m), { color: C.greenUi, fontSize: 19 }]]} />
      <View style={{ height: 15 }} />
      <Rows rows={[['Tenure', f.sel.ten], ['Interest rate', f.sel.rate.toFixed(2) + '%']]} />
    </View>
  );
}

function PanStep() {
  const f = useFlow();
  const consents = ['I authorize Decade and its partner to verify my PAN details.', 'I consent to processing my KYC information for verification.', 'I confirm the PAN details are accurate and mine.'];
  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
      <Title t="Confirm your PAN details" center />
      <View style={{ borderRadius: 20, overflow: 'hidden', padding: 6, paddingTop: 0 }}>
        <Svg style={StyleSheet.absoluteFill} preserveAspectRatio="none" viewBox="0 0 10 10">
          <Defs><LinearGradient id="p" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#e6d9ff" /><Stop offset="0.55" stopColor="#c9d6ff" /><Stop offset="1" stopColor="#9ec0ff" /></LinearGradient></Defs>
          <Rect x={0} y={0} width={10} height={10} fill="url(#p)" />
        </Svg>
        <Image source={require('../../assets/img/pan.png')} style={{ width: 272, height: 43, alignSelf: 'center', marginVertical: 14 }} resizeMode="contain" />
        <View style={{ backgroundColor: '#fff', borderRadius: 14 }}>
          {[['Name', 'Vangipurappu Venkata'], ['PAN number', 'ABCDE234K'], ['Date of birth', '15/08/1999']].map(([l, v], i) => (
            <View key={l} style={[{ height: 55, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 23 }, i > 0 && { borderTopWidth: 1, borderTopColor: C.line }]}>
              <T size={15} color={C.mute}>{l}</T><T w="m" size={17}>{v}</T>
            </View>
          ))}
        </View>
      </View>
      <View style={[styles.rows, { marginTop: 40 }]}>
        {consents.map((c, i) => (
          <Pressable key={c} onPress={() => { const p = f.pan.slice(); p[i] = !p[i]; f.setPan(p); }} style={[{ flexDirection: 'row', gap: 16, padding: 17, alignItems: 'center' }, i > 0 && { borderTopWidth: 1, borderTopColor: C.line }]}>
            <Check on={f.pan[i]} />
            <T size={13} color="#3a3a3a" style={{ flex: 1, lineHeight: 21 }}>{c}</T>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

function AadhaarStep() {
  return (
    <View style={{ flex: 1, paddingHorizontal: 15 }}>
      <Title t="Confirm your Aadhaar" center />
      <T size={15} color={C.mute} style={{ textAlign: 'center', marginTop: -8, paddingHorizontal: 20, lineHeight: 22 }}>You will be redirected to the bank page, enter your Aadhaar number and confirm with OTP</T>
      <View style={[styles.rows, { marginTop: 30, alignItems: 'center', paddingTop: 30 }]}>
        <Image source={require('../../assets/img/aadhaar.png')} style={{ width: 276, height: 166 }} resizeMode="contain" />
        <View style={{ height: 1, backgroundColor: C.line, alignSelf: 'stretch', marginTop: 26 }} />
        <T w="m" size={15} color="#000" style={{ marginVertical: 22 }}>Keep your Aadhaar number handy</T>
      </View>
      <View style={{ flex: 1 }} />
      <View style={{ flexDirection: 'row', alignSelf: 'center', alignItems: 'center', gap: 6, marginBottom: 26 }}>
        <Shield color={C.green} size={16} /><T size={15} color={C.green}>Shared directly with the bank KYC</T>
      </View>
    </View>
  );
}

function PersonCard({ name, rel, dob, on, onPress }: any) {
  return (
    <Tap onPress={onPress} scaleTo={0.98} style={[styles.person, on && { borderColor: '#cfe6cf' }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><T w="m" size={19}>{name}</T><Radio on={on} /></View>
      <T size={15} color={C.sub} style={{ marginTop: 16 }}>{rel}</T>
      <T size={15} color={C.sub} style={{ marginTop: 4 }}>DOB : {dob}</T>
    </Tap>
  );
}
const AddNew = ({ onPress }: { onPress: () => void }) => (
  <Tap onPress={onPress} style={styles.addNew}><T size={17} color={C.purple}>Add new +</T></Tap>
);

function NomineeStep() {
  const f = useFlow();
  return (
    <View style={{ paddingHorizontal: 23 }}>
      <T w="m" size={23} style={{ marginTop: 22, marginBottom: 22 }}>Choose your nominee</T>
      <PersonCard name="Jojo Maria George" rel="Husband" dob="14/10/1991" on={f.nom === 0} onPress={() => f.setNom(0)} />
      <PersonCard name="Roshni Singh" rel="Sister" dob="22/06/1995" on={f.nom === 1} onPress={() => f.setNom(1)} />
      <AddNew onPress={() => f.goStep('addnom')} />
    </View>
  );
}

function Field({ label, value, ph, caret, chev }: any) {
  return (
    <View style={styles.field}>
      <T size={13} color={C.sub}>{label}</T>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
        <T w={ph ? 'r' : 'm'} size={19} color={ph ? '#a6a6a6' : C.ink}>{value}</T>
        {caret ? <View style={{ width: 1.5, height: 22, backgroundColor: C.ink, marginLeft: 4 }} /> : null}
        {chev ? <ChevD color="#a6a6a6" /> : null}
      </View>
    </View>
  );
}

function AddNomStep() {
  return (
    <View style={{ paddingHorizontal: 23 }}>
      <T w="m" size={23} style={{ marginTop: 22, marginBottom: 22 }}>Add nominee details</T>
      <Field label="Name" value="Jojo Maria George" caret />
      <Field label="Relationship" value="Select one" ph chev />
      <Field label="Date of birth" value="DD/MM/YYYY" ph />
    </View>
  );
}

function AcctStep() {
  const f = useFlow();
  return (
    <View style={{ paddingHorizontal: 23 }}>
      <T w="m" size={23} style={{ marginTop: 22 }}>Choose your bank account</T>
      <T size={15} color={C.sub} style={{ marginTop: 8, marginBottom: 22, lineHeight: 21 }}>This account will pay and receive money from your fixed deposit</T>
      {['3456', '8821', '1047'].map((n, i) => (
        <Tap key={n} onPress={() => f.setAcc(i)} scaleTo={0.98} style={[styles.acct, f.acc === i && { borderColor: '#cfe6cf' }]}>
          <View style={styles.logoBox}><Image source={LOGOS.hdfc} style={{ width: 26, height: 26 }} /></View>
          <View style={{ flex: 1 }}><T size={19}>HDFC bank savings</T><T w="m" size={17} color={C.sub} style={{ letterSpacing: 0.6 }}>•••• {n}</T></View>
          <Radio on={f.acc === i} />
        </Tap>
      ))}
      <AddNew onPress={() => f.goStep('addacct')} />
    </View>
  );
}

function AddAcctStep() {
  return (
    <View style={{ paddingHorizontal: 23 }}>
      <T w="m" size={23} style={{ marginTop: 22, marginBottom: 22 }}>Add bank details</T>
      <Field label="Account number" value="1234 1134 5677" caret />
      <Field label="Bank name" value="Select one" ph />
      <Field label="Name on account" value="Enter name" ph />
    </View>
  );
}

function Toggle({ on, onPress }: { on: boolean; onPress: () => void }) {
  const v = useSharedValue(on ? 1 : 0);
  useEffect(() => { v.value = withSpring(on ? 1 : 0, { damping: 18, stiffness: 260 }); }, [on]);
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: v.value * 20 }] }));
  return (
    <Pressable onPress={onPress} accessibilityRole="switch" accessibilityState={{ checked: on }} style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: on ? '#1fa81f' : '#e7e7e7', padding: 3 }}>
      <Animated.View style={[{ width: 18, height: 18, borderRadius: 9, backgroundColor: '#fff' }, knob]} />
    </Pressable>
  );
}

function ReviewStep() {
  const f = useFlow();
  const m = maturity(f.amt, f.sel.rate, f.sel.yrs);
  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 11, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, marginTop: 22, marginBottom: 20 }}>
        <T w="m" size={23}>Review your FD</T>
        <Tap onPress={() => f.goStep('amount')}><T size={15} color="#a872b3" style={{ textDecorationLine: 'underline' }}>Edit</T></Tap>
      </View>
      <View style={styles.rows}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 23, paddingBottom: 18 }}>
          <T size={17} color={C.mute}>Amount</T><T w="m" size={27}>{inr(f.amt)}</T>
        </View>
        <View style={{ height: 1, backgroundColor: C.line }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 23, paddingTop: 16 }}>
          <View><T size={13} color="#857c8e">Maturity amount</T><T w="m" size={19} color="#000" style={{ marginTop: 4 }}>{inr(m)}</T></View>
          <View style={{ alignItems: 'flex-end' }}><T size={13} color="#857c8e">Interest gain</T><T w="m" size={19} color="#01b405" style={{ marginTop: 4 }}>+{inr(m - f.amt)}</T></View>
        </View>
      </View>
      <View style={{ height: 50 }} />
      <View style={styles.rows}>
        {[['Tenure', f.sel.ten], ['Interest rate', f.sel.rate.toFixed(2) + '%'], ['Interest payout', 'At maturity'], ['Nominee', f.nom === 0 ? 'Jojo Maria George' : 'Roshni Singh']].map(([l, v], i) => (
          <View key={l} style={[styles.rowLine, i > 0 && { borderTopWidth: 1, borderTopColor: C.line }]}><T size={15} color={C.mute}>{l}</T><T w="m" size={17}>{v}</T></View>
        ))}
        <View style={[styles.rowLine, { borderTopWidth: 1, borderTopColor: C.line }]}><T w="m" size={17}>Reinvest on maturity</T><Toggle on={f.reinv} onPress={() => f.setReinv(!f.reinv)} /></View>
      </View>
    </ScrollView>
  );
}

function PayOpt({ i, logo, letters, title, sub }: { i: number; logo?: any; letters?: string; title: string; sub?: string }) {
  const f = useFlow();
  const on = f.pm === i;
  return (
    <Tap onPress={() => f.setPm(i)} scaleTo={0.98} style={[styles.payOpt, on && { borderColor: '#cfe6cf' }]}>
      <View style={styles.logoBox}>
        {logo ? <Image source={logo} style={{ width: 30, height: 30 }} resizeMode="contain" /> : <View style={styles.letters}><T w="m" size={13} color="#3b3b3b">{letters}</T></View>}
      </View>
      <View style={{ flex: 1 }}>
        <T w="m" size={sub ? 15 : 19}>{title}</T>
        {sub ? <T size={15} color={C.sub} style={{ letterSpacing: 0.6 }}>{sub}</T> : null}
      </View>
      <Radio on={on} />
    </Tap>
  );
}

function PayStep() {
  const f = useFlow();
  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 11, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
      <T w="m" size={23} style={{ marginTop: 22, marginBottom: 20, marginLeft: 12 }}>Pay for your FD</T>
      <Rows rh={59} rows={[['Deposit amount', inr(f.amt), { fontSize: 23, lineHeight: 30 }], ['Tenure', f.sel.ten]]} />
      <T w="m" size={15} style={{ marginTop: 30, marginBottom: 14, marginLeft: 14 }}>Net banking</T>
      <PayOpt i={0} logo={LOGOS.hdfc} title="HDFC bank savings" sub="•••• 3456" />
      <T w="m" size={15} style={{ marginTop: 26, marginBottom: 14, marginLeft: 14 }}>Pay with UPI</T>
      <PayOpt i={1} logo={LOGOS.gpay} title="Google pay" />
      {f.pm === 1 ? <Animated.View entering={FadeInDown.duration(220)}><T size={15} color={C.green} style={{ textAlign: 'center', marginTop: -2, marginBottom: 12 }}>Pay using HDFC •••• 3456</T></Animated.View> : null}
      <PayOpt i={2} logo={LOGOS.phonepe} title="PhonePe" />
      <PayOpt i={3} letters="CR" title="CRED" />
      <PayOpt i={4} letters="PT" title="Paytm" />
      <PayOpt i={5} letters="+" title="Pay with any app" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: { position: 'absolute', left: 13, right: 13, borderRadius: 27, backgroundColor: '#fff', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 30, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  head: { flexDirection: 'row', alignItems: 'center', paddingLeft: 13, paddingTop: 13, paddingBottom: 4 },
  cta: { height: 51, borderRadius: 26, backgroundColor: C.dark, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  center: { alignItems: 'center', justifyContent: 'center' },
  rows: { borderWidth: 1, borderColor: C.line, borderRadius: 23, backgroundColor: '#fff', overflow: 'hidden' },
  rowLine: { height: 65, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22 },
  tab: { width: 165, height: 47, borderRadius: 24, borderWidth: 1, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  planRow: { height: 75, borderRadius: 23, borderWidth: 1, borderColor: C.line, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', gap: 15, paddingLeft: 17, paddingRight: 22, marginBottom: 5 },
  box: { borderWidth: 1, borderColor: C.line, borderRadius: 20 },
  penChip: { width: 35, height: 25, borderRadius: 13, borderWidth: 1, borderColor: '#e4e4e4', backgroundColor: '#f2f2f2', alignItems: 'center', justifyContent: 'center' },
  key: { width: 90, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  person: { borderWidth: 1, borderColor: C.line, borderRadius: 17, padding: 18, marginBottom: 16 },
  addNew: { alignSelf: 'center', height: 44, paddingHorizontal: 18, borderRadius: 22, borderWidth: 1, borderColor: C.purple, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  field: { borderWidth: 1, borderColor: C.line, borderRadius: 17, paddingHorizontal: 18, paddingVertical: 16, marginBottom: 16 },
  acct: { height: 94, borderWidth: 1, borderColor: C.line, borderRadius: 17, flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 14, paddingRight: 18, marginBottom: 12 },
  logoBox: { width: 47, height: 47, borderWidth: 1, borderColor: '#e6e6e6', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  letters: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#f1f0ee', alignItems: 'center', justifyContent: 'center' },
  payOpt: { minHeight: 80, borderWidth: 1, borderColor: C.line, borderRadius: 17, flexDirection: 'row', alignItems: 'center', gap: 18, paddingHorizontal: 16, paddingRight: 20, marginBottom: 12, backgroundColor: '#fff' },
});
