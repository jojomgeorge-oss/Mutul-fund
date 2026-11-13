import React from 'react';
import { View } from 'react-native';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FlowProvider, Navigator, ScreenKey } from './src/flow';
import Home from './src/screens/Home';
import { List, Amt } from './src/screens/Listing';
import Bank from './src/screens/Bank';
import Booking from './src/screens/Booking';
import { Placeholder, Success, Started } from './src/screens/Done';
import { CalcSheet, PlanSheet } from './src/screens/Sheets';
import { C } from './src/theme';

const render = (k: ScreenKey) => {
  switch (k) {
    case 'home': return <Home />;
    case 'list': return <List />;
    case 'amt': return <Amt />;
    case 'bank': return <Bank />;
    case 'book': return <Booking />;
    case 'bankred': return <Placeholder title="Bank page" sub="Redirecting you to the bank to verify Aadhaar…" />;
    case 'payapp': return <Placeholder title="Payment app" sub="Opening Google Pay…" />;
    case 'vkyc': return <Placeholder title="VKYC" sub="Connecting you to a bank agent…" />;
    case 'success': return <Success />;
    case 'started': return <Started />;
  }
  return null;
};

export default function App() {
  const [loaded] = useFonts({
    Walsheim: require('./assets/fonts/Walsheim-Regular.otf'),
    'Walsheim-Medium': require('./assets/fonts/Walsheim-Medium.otf'),
    Reckless: require('./assets/fonts/Reckless-Regular.ttf'),
    'Reckless-Medium': require('./assets/fonts/Reckless-Medium.ttf'),
  });
  if (!loaded) return <View style={{ flex: 1, backgroundColor: C.bg }} />;
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: C.bg }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <FlowProvider>
          <Navigator render={render} />
          <PlanSheet />
          <CalcSheet />
        </FlowProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
