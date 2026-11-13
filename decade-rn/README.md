# Decade FD — React Native (Expo)

Native port of the Fixed Deposit prototype: home deck shuffle, recommendation overlay,
FD listings, plan sheet → full page morph, bank landing page, the single-card booking flow
(select → amount → KYC → nominee → account → review → pay) and the success / FD-started screens.
All motion runs on the UI thread with Reanimated springs; drags use Gesture Handler.

## Run on your phone (Expo Go)

```bash
cd decade-rn
npm install
npm run setup        # pins every native package to the Expo SDK version
npx expo start       # scan the QR code with Expo Go (Android) or the Camera app (iOS)
```

Gestures to try: swipe from the left edge to go back, flick the recommendation deck up,
drag the plan sheet's top card up to open all plans, drag sheets down to close.

## Build an installable APK (optional)

```bash
npx eas build -p android --profile preview
```

Fonts in `assets/fonts` are trial fonts for internal prototyping only.
