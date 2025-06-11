import React, { useEffect, useRef } from 'react';
import { 
  View, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  StatusBar,
  Animated,
  Dimensions,
  Alert,
  BackHandler
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { commonStyles } from '../utils/styles';
import { COLORS } from '../utils/colors';
import { useLanguage } from '../contexts/LanguageContext';
import { useGame } from '../contexts/GameContext';
import soundManager from '../utils/soundManager';
import Board from '../components/Board';
import Keyboard from '../components/Keyboard';
import Scoreboard from '../components/Scoreboard';
import TimerDisplay from '../components/TimerDisplay';
import Notification from '../components/Notification';

const { height: screenHeight } = Dimensions.get('window');

export default function GameScreen() {
  const navigation = useNavigation();
  const { getTranslation } = useLanguage();
  const socket = global.socketInstance;
  const {
    currentGuess,
    setCurrentGuess,
    guesses,
    wordLength,
    isMyInputActive,
    singlePlayerMode,
    submitSinglePlayerGuess,
    showNotification,
    triggerShakeAnimation,
    handleGuessResult,
    processRoundResult,
    setRoundEndTime,
    gameState,
    setGameState,
    roomCode,
    setRound,
    setWordLength,
    resetGameState,
    setGameWinner,
  } = useGame();
  
  const scrollViewRef = useRef(null);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Handle back button press
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        Alert.alert(
          getTranslation('confirmExit') || 'Çıkmak istiyor musunuz?',
          getTranslation('confirmExitMessage') || 'Ana menüye dönmek istediğinizden emin misiniz?',
          [
            {
              text: getTranslation('cancel') || 'İptal',
              style: 'cancel'
            },
            {
              text: getTranslation('yes') || 'Evet',
              onPress: () => {
                // Leave the room if in multiplayer mode
                if (!singlePlayerMode && roomCode && socket) {
                  socket.emit('leaveRoom', { roomCode });
                }
                // Reset game state
                resetGameState();
                // Navigate to home
                navigation.navigate('Home');
              }
            }
          ]
        );
        return true; // Prevent default back behavior
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => backHandler.remove();
    }, [navigation, singlePlayerMode, roomCode, socket, resetGameState, getTranslation])
  );

  const handleKeyPress = (key) => {
    if (!isMyInputActive) return;

    if (key === 'ENTER') {
      handleSubmit();
    } else if (key === 'BACKSPACE') {
      if (currentGuess.length > 0) {
        soundManager.playSound('keyPress');
        setCurrentGuess(currentGuess.slice(0, -1));
      }
    } else if (currentGuess.length < wordLength) {
      setCurrentGuess(currentGuess + key);
    } else {
      // Word is full - shake to indicate
      triggerShakeAnimation(guesses.length);
    }
  };

  const handleSubmit = () => {
    if (currentGuess.length !== wordLength) {
      showNotification(getTranslation('notEnoughLetters'), 'error');
      triggerShakeAnimation(guesses.length);
      return;
    }

    soundManager.playSound('submit');

    if (singlePlayerMode) {
      submitSinglePlayerGuess(currentGuess);
    } else {
      const socket = global.socketInstance;
      if (socket) {
        socket.emit('submitGuess', { 
          roomCode, 
          guess: currentGuess 
        }, (response) => {
          if (!response.success) {
            console.error('Guess submission failed:', response);
            showNotification(response.message || 'guessNotSent', 'error');
            triggerShakeAnimation(guesses.length);
          }
        });
      } else {
        showNotification(getTranslation('connectionError'), 'error');
      }
    }
    
    // Don't clear guess here - it's handled by handleGuessResult
  };

  return (
    <>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={COLORS.background}
      />
      <LinearGradient
        colors={[COLORS.background, COLORS.darkBg]}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={commonStyles.safeArea}>
          <Animated.View 
            style={{
              flex: 1,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            <Notification />
            
            {/* Game Header */}
            <View style={{
              paddingHorizontal: 8,
              paddingTop: 8,
              paddingBottom: 4,
            }}>
              <Scoreboard />
              <TimerDisplay />
            </View>
            
            <KeyboardAvoidingView 
              style={{ flex: 1 }}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
              <ScrollView
                ref={scrollViewRef}
                contentContainerStyle={{ 
                  flexGrow: 1,
                  paddingHorizontal: 8,
                  justifyContent: 'center',
                }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View style={{ 
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 16,
                  minHeight: screenHeight * 0.5,
                }}>
                  <Board />
                </View>
              </ScrollView>
              
              {/* Keyboard with enhanced styling */}
              <LinearGradient
                colors={[COLORS.surface + 'CC', COLORS.surface]}
                style={{
                  borderTopWidth: 1,
                  borderTopColor: COLORS.border.default,
                  paddingTop: 12,
                  paddingBottom: Platform.OS === 'ios' ? 30 : 12,
                  ...Platform.select({
                    ios: {
                      shadowColor: COLORS.shadow,
                      shadowOffset: {
                        width: 0,
                        height: -4,
                      },
                      shadowOpacity: 0.15,
                      shadowRadius: 8,
                    },
                    android: {
                      elevation: 10,
                    },
                  }),
                }}
              >
                <Keyboard 
                  onKeyPress={handleKeyPress} 
                  disabled={!isMyInputActive || guesses.length >= 6}
                />
              </LinearGradient>
            </KeyboardAvoidingView>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
}