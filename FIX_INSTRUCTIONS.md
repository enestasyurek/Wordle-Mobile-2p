# Fix Instructions

The package versions have been updated to be compatible with Expo 53. To apply these fixes:

1. **Stop the current Expo server** (Ctrl+C)

2. **Clear the cache and reinstall packages**:
   ```bash
   cd wordle-mobile
   rm -rf node_modules
   npm cache clean --force
   npm install
   ```

3. **If you still get permission errors, try**:
   ```bash
   sudo rm -rf node_modules package-lock.json
   sudo npm install
   sudo chown -R $(whoami) node_modules
   ```

4. **Clear Expo cache and restart**:
   ```bash
   npx expo start -c
   ```

## What was fixed:

1. **Updated all packages to Expo 53 compatible versions**:
   - react-native-screens: ~3.30.1 → ~4.11.1
   - react-native-safe-area-context: 4.5.3 → 5.4.0
   - @react-native-async-storage/async-storage: 2.1.0 → 2.1.2
   - react-native-gesture-handler: ~2.20.2 → ~2.24.0
   - react-native-reanimated: ~3.16.3 → ~3.17.4
   - expo-font: ~13.0.2 → ~13.3.1
   - expo-splash-screen: ~0.29.15 → ~0.30.9
   - expo-haptics: ~14.0.0 → ~14.1.4
   - expo-clipboard: ~7.0.0 → ~7.1.4

2. **Fixed the "topInsetsChange" error** by:
   - Importing SafeAreaView from 'react-native-safe-area-context' instead of 'react-native'
   - Moving the onLayout callback to NavigationContainer's onReady prop

The app should now run without errors!