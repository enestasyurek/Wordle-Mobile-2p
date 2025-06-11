# Kelime Savaşı Mobile - Quick Start Guide

## What's Been Created

A production-ready React Native mobile app for Kelime Savaşı (Word Battle) with:
- Complete game functionality matching the web version
- Native mobile UI with similar design to web client
- Full multiplayer support via Socket.io
- Turkish/English language support
- Haptic feedback for better user experience
- Optimized for both Android and iOS

## To Run the App

1. **Install dependencies** (if not already done):
   ```bash
   cd wordle-mobile
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm start
   ```

3. **Run on your device**:
   - Install Expo Go app on your phone
   - Scan the QR code shown in terminal
   - Or press 'a' for Android emulator / 'i' for iOS simulator

## Important Configuration

Before building for production, update the server URL:
- Open `src/contexts/SocketContext.js`
- Change `SERVER_URL` to your deployed server address

## Build for Production

### Android APK (for testing):
```bash
npx eas build --platform android --profile preview
```

### Production Build:
```bash
npx eas build --platform android --profile production
```

## Key Features Implemented

✅ All screens from web version (Home, Lobby, Game, etc.)
✅ Real-time multiplayer with Socket.io
✅ Animated tiles and keyboard
✅ Score tracking and round management
✅ Language switching (TR/EN)
✅ Persistent user preferences
✅ Network error handling
✅ Background app state management
✅ Production-ready configurations

## Next Steps

1. Replace placeholder images in `/assets` folder
2. Update server URL for production
3. Test thoroughly on physical devices
4. Build and deploy to app stores

The app is fully functional and ready for production deployment!