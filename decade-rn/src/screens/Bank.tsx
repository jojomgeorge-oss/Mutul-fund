import React from 'react';
import { Image, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFlow } from '../flow';
import { REC } from '../data';
import { Back, ChevD, Dots } from '../icons';
import { AskChips, BankAskBar, Features, LogoTile, Receipt, RoundBtn, T } from '../ui';
import { C, shadow } from '../theme';
import { MaroonBg, RecCard } from './Home';

const BARS: [string, number, string, string][] = [['6.30%', 78, '#d9dee6', 'HDFC\nSAVINGS'], ['7.56%', 121, '#d9dee6', 'HDFC\nFD'], ['8.32%', 176, '#7ce469', 'SURYODAY\nFD']];

export default function Bank() {
  const f = useFlow();
  const ins = useSafeAreaInsets();
  const { width: W } = useWindowDimensions();
  const y = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => { y.value = e.contentOffset.y; });
  const fade = useAnimatedStyle(() => ({ opacity: interpolate(y.value, [300, 360], [0, 1], 'clamp') }));
  // the hero drifts slower than the page and stretches when pulled down
  const hero = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value < 0 ? y.value : y.value * 0.45 }, { scale: y.value < 0 ? 1 - y.value / 470 : 1 }],
  }));
  const heroH = (W * 469) / 390;
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: ins.bottom + 120 }}>
        <Animated.Image source={require('../../assets/img/hero.jpg')} style={[{ width: W, height: heroH, position: 'absolute', top: 0 }, hero]} resizeMode="cover" />
        <View style={[styles.card, { marginTop: heroH * 0.667 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <T w="dm" size={35} style={{ width: 254, lineHeight: 43 }}>Suryoday Small Finance Bank</T>
            <View style={{ marginTop: 18 }}><LogoTile k="sur" size={51} r={15} /></View>
          </View>
          <T size={17} color={C.mute} style={{ marginTop: 10 }}>Since 2008 • Public bank</T>
          <Features style={{ marginTop: 20 }} />
        </View>

        <T w="m" size={23} color={C.ink2} style={styles.h2}>Recommendations</T>
        <View style={[styles.maroon]}>
          <MaroonBg />
          <View style={{ margin: 23 }}><View style={{ ...shadow }}><RecCard sel={REC[0]} onStart={() => f.openBooking('select')} /></View></View>
          <T size={17} color="#f7f2f2" style={{ opacity: 0.85, marginHorizontal: 30, lineHeight: 23 }}>Hi Arunima, Decade suggests moving part of your savings to a fixed deposit, and we found a great option at Suryoday SF Bank.</T>
        </View>

        <T w="m" size={23} color={C.ink2} style={styles.h2}>Fixed deposit protection</T>
        <View style={[styles.white, { flexDirection: 'row', flexWrap: 'wrap', gap: 11, padding: 23 }]}>
          {[['#ffd77c', 'Insured by DICGC'], ['#dcf3a5', 'Get monthly payouts'], ['#f0d2f7', 'Get instant receipt'], ['#d9dee6', 'Instant withdrawals']].map(([c, t]) => (
            <View key={t} style={[styles.tile, { backgroundColor: c }]}><T w="m" size={19} style={{ textAlign: 'center', lineHeight: 25 }}>{t}</T></View>
          ))}
        </View>

        <T w="m" size={23} color={C.ink2} style={styles.h2}>Compare interest rates</T>
        <View style={[styles.white, { padding: 27 }]}>
          <View style={styles.dropdown}>
            <View style={{ width: 45, height: 45, borderWidth: 1, borderColor: '#e6e6e6', borderRadius: 5, alignItems: 'center', justifyContent: 'center' }}><Image source={require('../../assets/img/hdfc.png')} style={{ width: 26, height: 26 }} /></View>
            <View style={{ flex: 1, marginLeft: 11 }}><T size={13} color="#8d8888">HDFC BANK SAVINGS</T><T size={15} color={C.ink2}>7.86%</T></View>
            <View style={{ width: 1, alignSelf: 'stretch', backgroundColor: '#e6e6e6', marginRight: 18 }} />
            <ChevD color="#a2a2a2" />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 220, marginTop: 20, borderBottomWidth: 1, borderColor: '#eee' }}>
            {BARS.map(([v, h, c]) => (
              <View key={v} style={{ alignItems: 'center' }}>
                <T w="m" size={17} color={C.ink2} style={{ marginBottom: 6 }}>{v}</T>
                <View style={{ width: 43, height: h, backgroundColor: c }} />
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 }}>
            {BARS.map(([v, , , l]) => <T key={v} size={12} color="rgba(0,0,0,0.7)" style={{ textAlign: 'center', letterSpacing: 1, width: 90 }}>{l}</T>)}
          </View>
        </View>

        <T w="m" size={23} color={C.ink2} style={styles.h2}>Leadership</T>
        <View style={{ marginHorizontal: 11 }}>
          <View style={{ marginHorizontal: 23, height: 331, borderRadius: 23, backgroundColor: '#ffe4a7', alignItems: 'center', overflow: 'hidden' }}>
            <Image source={require('../../assets/img/photo.jpg')} style={{ width: 153, height: 170 }} />
          </View>
          <View style={[styles.white, { marginHorizontal: 0, marginTop: -179, padding: 23 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <T w="m" size={27} style={{ width: 210, lineHeight: 39 }}>Baskar Babu Ramachandran</T>
              <View style={{ marginTop: 14 }}><LogoTile k="sur" size={51} r={15} /></View>
            </View>
            <T size={13} color={C.sub} style={{ marginTop: 4 }}>MD & CEO, Suryoday Bank</T>
            <T size={17} color="rgba(52,52,52,0.7)" style={{ marginTop: 18, lineHeight: 23 }}>With a mission to make banking accessible to the entire country, Baskar Babu Ramachandran, with 25+ years experience, led Suryoday SF Bank to 13260+ crores in AUM</T>
          </View>
        </View>

        <T w="m" size={23} color={C.ink2} style={styles.h2}>Get instant receipt</T>
        <View style={{ marginHorizontal: 34 }}><Receipt bank="Suryoday SF bank" amount="₹1,00,000" rate="8.75%" tenure="5 Years" /></View>
        <T size={13} color="rgba(0,0,0,0.39)" style={{ textAlign: 'center', marginTop: 17, marginBottom: 34 }}>For illustration only, actual receipt may vary</T>
        <AskChips />
      </Animated.ScrollView>

      <Animated.View pointerEvents="none" style={[styles.fade, { height: ins.top + 70 }, fade]} />
      <View style={[styles.hdr, { top: ins.top + 10 }]}>
        <RoundBtn label="Back" onPress={f.back}><Back /></RoundBtn>
        <RoundBtn label="More options"><Dots /></RoundBtn>
      </View>
      <BankAskBar onPlans={() => f.openBooking('select')} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 11, borderRadius: 23, backgroundColor: '#fff', padding: 23, ...shadow },
  h2: { textAlign: 'center', marginTop: 36, marginBottom: 22 },
  maroon: { marginHorizontal: 11, borderRadius: 23, overflow: 'hidden', paddingBottom: 30 },
  white: { marginHorizontal: 11, borderRadius: 23, backgroundColor: '#fff', ...shadow },
  tile: { width: '48.4%', height: 165, borderRadius: 17, justifyContent: 'flex-end', alignItems: 'center', paddingHorizontal: 18, paddingBottom: 24 },
  dropdown: { height: 67, borderWidth: 1, borderColor: '#e6e6e6', borderRadius: 11, flexDirection: 'row', alignItems: 'center', paddingLeft: 10, paddingRight: 18 },
  fade: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: 'rgba(250,250,249,0.96)' },
  hdr: { position: 'absolute', left: 21, right: 21, flexDirection: 'row', justifyContent: 'space-between' },
});
