# Kelime Savaşı Mobile App

Production-ready React Native mobile application for Kelime Savaşı (Word Battle) - a multiplayer Turkish/English word game.

## Features

- 🎮 Single-player and real-time multiplayer modes
- 🌍 Turkish and English language support
- 📱 Native mobile experience with haptic feedback
- 🎯 Multiple word lengths (3-6 letters)
- 🏆 Score tracking and game statistics
- 🔄 Automatic reconnection handling
- 💾 Persistent user preferences

## Prerequisites

- Node.js 16+ and npm
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI for building (`npm install -g eas-cli`)
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

## Installation

1. Install dependencies:
```bash
cd wordle-mobile
npm install
```

2. Configure server URL:
   - Open `src/contexts/SocketContext.js`
   - Update `SERVER_URL` with your production server URL

## Development

Start the development server:
```bash
npm start
```

Run on specific platform:
```bash
npm run android  # Android
npm run ios      # iOS
```

## Building for Production

### Android APK (for testing)
```bash
eas build --platform android --profile preview
```

### Android App Bundle (for Play Store)
```bash
eas build --platform android --profile production
```

### iOS Build (for App Store)
```bash
eas build --platform ios --profile production
```

## Configuration

### Server Connection
Update the server URL in `src/contexts/SocketContext.js`:
```javascript
const SERVER_URL = __DEV__ ? 'http://localhost:3001' : 'https://your-server.com';
```

### App Configuration
Edit `app.json` to update:
- App name and slug
- Bundle identifiers
- Version numbers
- Icon and splash screen

### Assets
Replace placeholder images in `/assets`:
- `icon.png` - 1024x1024px app icon
- `splash.png` - 1284x2778px splash screen
- `adaptive-icon.png` - 1024x1024px for Android adaptive icon

## Project Structure

```
src/
├── components/     # Reusable UI components
├── contexts/       # React Context providers
├── hooks/          # Custom React hooks
├── screens/        # Screen components
└── utils/          # Utility functions and constants
```

## Key Components

- **GameContext**: Manages game state and logic
- **SocketContext**: Handles real-time server communication
- **LanguageContext**: Provides internationalization support
- **Board/Keyboard**: Core game UI components
- **Navigation**: Stack-based navigation between screens

## Deployment

1. Build the app using EAS Build
2. Submit to app stores using EAS Submit:
   ```bash
   eas submit --platform android
   eas submit --platform ios
   ```

## Performance Optimizations

- Efficient re-renders with React.memo
- Optimized animations using native driver
- Background app state handling
- Automatic reconnection for network issues

## Testing

Test on physical devices for best results:
- Use Expo Go app for development testing
- Build preview APKs for broader testing
- Test network disconnections and reconnections
- Verify haptic feedback on different devices

## Troubleshooting

- **Connection issues**: Ensure server URL is correct and accessible
- **Build failures**: Clear cache with `expo start -c`
- **Performance issues**: Check for excessive re-renders in components

## License

Same as parent project