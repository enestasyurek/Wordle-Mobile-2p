# Kelime Savaşı Mobile - APK Build Instructions

## Option 1: Using EAS Build (Recommended)

1. **Create an Expo account** (if you don't have one):
   - Go to https://expo.dev/signup
   - Create a free account

2. **Login to EAS**:
   ```bash
   eas login
   ```

3. **Build the APK**:
   ```bash
   cd wordle-mobile
   eas build --platform android --profile preview
   ```

   This will:
   - Build in the cloud
   - Generate a signed APK
   - Provide a download link when complete

## Option 2: Local Build with Expo

1. **Install dependencies**:
   ```bash
   cd wordle-mobile
   npm install
   ```

2. **Run Expo prebuild** (creates native Android project):
   ```bash
   npx expo prebuild --platform android
   ```

3. **Build APK locally**:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

   The APK will be in: `android/app/build/outputs/apk/release/`

## Option 3: Quick Development APK

1. **Start Expo development server**:
   ```bash
   cd wordle-mobile
   npx expo start
   ```

2. **Use Expo Go app** on Android to test

## Important Notes

- The app is configured for production builds
- Package name: `com.kelimesavasi.app`
- Current version: 1.0.0
- Make sure the server URL is correctly set in `src/contexts/SocketContext.js`

## Build Configuration

The app uses these build profiles (defined in eas.json):
- **preview**: Generates APK for testing
- **production**: Generates AAB for Google Play Store

## Troubleshooting

If you encounter icon-related errors during prebuild:
1. Ensure all icon files in `/assets` are valid PNG files
2. Icon dimensions should be: 1024x1024px for icon.png
3. Adaptive icon should be 1024x1024px with safe zone

## Server Configuration

Before building, update the server URL in `src/contexts/SocketContext.js`:
```javascript
const SERVER_URL = 'https://your-production-server.com';
```