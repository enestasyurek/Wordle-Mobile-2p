import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';

// Providers
import { LanguageProvider } from './src/contexts/LanguageContext';
import { SocketProvider } from './src/contexts/SocketContext';
import { GameProvider } from './src/contexts/GameContext';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import GameModeScreen from './src/screens/GameModeScreen';
import LobbyScreen from './src/screens/LobbyScreen';
import GameScreen from './src/screens/GameScreen';
import GameOverScreen from './src/screens/GameOverScreen';
import HowToPlayScreen from './src/screens/HowToPlayScreen';

// Components
import SocketEventHandler from './src/components/SocketEventHandler';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const Stack = createStackNavigator();

function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#fff' },
        animationEnabled: true,
        animationTypeForReplace: 'push',
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="GameMode" component={GameModeScreen} />
      <Stack.Screen name="Lobby" component={LobbyScreen} />
      <Stack.Screen name="Game" component={GameScreen} />
      <Stack.Screen name="GameOver" component={GameOverScreen} />
      <Stack.Screen name="HowToPlay" component={HowToPlayScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  const [appIsReady, setAppIsReady] = React.useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts if needed
        await Font.loadAsync({
          // Add custom fonts here if needed
        });
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = React.useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <SocketProvider>
          <GameProvider>
            <NavigationContainer onReady={onLayoutRootView}>
              <StatusBar style="dark" backgroundColor="#fff" />
              <AppNavigator />
              <SocketEventHandler />
            </NavigationContainer>
          </GameProvider>
        </SocketProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}