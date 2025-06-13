import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  Animated,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { commonStyles } from '../utils/styles';
import { COLORS } from '../utils/colors';
import { useLanguage } from '../contexts/LanguageContext';
import { useGame } from '../contexts/GameContext';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';

const { width: screenWidth } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation();
  const { language, setLanguage, getTranslation } = useLanguage();
  const { playerName, setPlayerName, setSinglePlayerMode, setGameState, showNotification, roomCode, resetGameState } = useGame();
  const { isConnected } = useSocket();
  const { user, isAuthenticated } = useAuth();
  const [nameInput, setNameInput] = useState(playerName);
  const [isFocused, setIsFocused] = useState(false);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  
  // Set player name to username when logged in
  useEffect(() => {
    if (user && user.username) {
      setNameInput(user.username);
      setPlayerName(user.username);
    }
  }, [user, setPlayerName]);

  useEffect(() => {
    // Clean up any existing room connection when arriving at home screen
    const socket = global.socketInstance;
    if (socket && roomCode) {
      socket.emit('leaveRoom', { roomCode });
      resetGameState(true);
    }
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const animateButtonPress = (callback) => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => callback());
  };

  const handleSinglePlayer = () => {
    if (nameInput.trim()) {
      animateButtonPress(() => {
        setPlayerName(nameInput.trim());
        setSinglePlayerMode(true);
        setGameState('gameMode');
        navigation.navigate('GameMode');
      });
    }
  };

  const handleTwoPlayer = () => {
    if (nameInput.trim()) {
      if (!isConnected) {
        showNotification(getTranslation('connectionError'), 'error');
        return;
      }
      animateButtonPress(() => {
        setPlayerName(nameInput.trim());
        setSinglePlayerMode(false);
        setGameState('lobby');
        navigation.navigate('Lobby');
      });
    }
  };

  const handleHowToPlay = () => {
    animateButtonPress(() => {
      navigation.navigate('HowToPlay');
    });
  };

  const handleSettings = () => {
    animateButtonPress(() => {
      navigation.navigate('Settings');
    });
  };

  const toggleLanguage = () => {
    setLanguage(language === 'tr' ? 'en' : 'tr');
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <LinearGradient
        colors={[COLORS.background, COLORS.darkBg]}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={commonStyles.safeArea}>
          <KeyboardAvoidingView 
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView 
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={commonStyles.centerContainer}>
                {/* Top buttons */}
                <View style={styles.topButtons}>
                  <TouchableOpacity
                    style={styles.topButton}
                    onPress={handleSettings}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="settings-outline" size={24} color={COLORS.text.primary} />
                  </TouchableOpacity>
                  
                  <View style={styles.rightButtons}>
                    {isAuthenticated ? (
                      <TouchableOpacity
                        style={styles.topButton}
                        onPress={() => navigation.navigate('Profile')}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="person-outline" size={24} color={COLORS.primary} />
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.topButton}
                        onPress={() => navigation.navigate('Login')}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="log-in-outline" size={24} color={COLORS.primary} />
                      </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity
                      style={styles.topButton}
                      onPress={toggleLanguage}
                      activeOpacity={0.7}
                    >
                      <View style={styles.languageButtonContent}>
                        <Text style={styles.languageEmoji}>{language === 'tr' ? '🇹🇷' : '🇬🇧'}</Text>
                        <Ionicons name="language" size={20} color={COLORS.primary} />
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Logo & Title */}
                <Animated.View 
                  style={[
                    styles.logoContainer,
                    {
                      opacity: fadeAnim,
                      transform: [{ scale: scaleAnim }],
                    },
                  ]}
                >
                  <View style={styles.logoIcon}>
                    <Text style={styles.logoText}>W</Text>
                  </View>
                  <Text style={styles.title}>{getTranslation('appName')}</Text>
                  <Text style={styles.subtitle}>{getTranslation('tagline')}</Text>
                  {isAuthenticated && user && (
                    <View style={styles.userInfo}>
                      <Text style={styles.welcomeText}>
                        {language === 'tr' ? 'Merhaba,' : 'Hello,'} 
                        <Text style={styles.username}> {user.username}</Text>
                      </Text>
                    </View>
                  )}
                </Animated.View>

                {/* Name Input */}
                <Animated.View 
                  style={[
                    styles.inputContainer,
                    { opacity: fadeAnim },
                  ]}
                >
                  <TextInput
                    style={[
                      styles.input,
                      isFocused && styles.inputFocused,
                      isAuthenticated && styles.inputReadOnly,
                    ]}
                    placeholder={getTranslation('enterYourName')}
                    placeholderTextColor={COLORS.text.muted}
                    value={nameInput}
                    onChangeText={isAuthenticated ? undefined : setNameInput}
                    maxLength={20}
                    onFocus={() => !isAuthenticated && setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    autoCapitalize="words"
                    autoCorrect={false}
                    editable={!isAuthenticated}
                  />
                </Animated.View>

                {/* Game Mode Buttons */}
                <Animated.View 
                  style={[
                    styles.buttonsContainer,
                    { opacity: fadeAnim },
                  ]}
                >
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleSinglePlayer}
                    disabled={!nameInput.trim()}
                  >
                    <Animated.View
                      style={[
                        styles.primaryButton,
                        !nameInput.trim() && styles.buttonDisabled,
                        { transform: [{ scale: buttonScale }] },
                      ]}
                    >
                      <LinearGradient
                        colors={nameInput.trim() ? COLORS.gradient.primary : [COLORS.button.outline, COLORS.button.outline]}
                        style={styles.gradientButton}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Ionicons name="person" size={20} color={COLORS.text.dark} style={styles.buttonIcon} />
                        <Text style={styles.buttonText}>{getTranslation('singlePlayer')}</Text>
                      </LinearGradient>
                    </Animated.View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleTwoPlayer}
                    disabled={!nameInput.trim() || !isConnected}
                  >
                    <Animated.View
                      style={[
                        styles.secondaryButton,
                        (!nameInput.trim() || !isConnected) && styles.buttonDisabled,
                      ]}
                    >
                      <LinearGradient
                        colors={nameInput.trim() && isConnected ? COLORS.gradient.secondary : [COLORS.button.outline, COLORS.button.outline]}
                        style={styles.gradientButton}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Ionicons name="people" size={20} color={COLORS.text.light} style={styles.buttonIcon} />
                        <Text style={[styles.buttonText, { color: COLORS.text.light }]}>{getTranslation('twoPlayer')}</Text>
                      </LinearGradient>
                    </Animated.View>
                  </TouchableOpacity>

                  {!isConnected && (
                    <Animated.View style={[styles.connectionError, { opacity: fadeAnim }]}>
                      <Ionicons name="wifi-off" size={16} color={COLORS.error} />
                      <Text style={styles.connectionErrorText}>
                        {getTranslation('connectionError')}
                      </Text>
                    </Animated.View>
                  )}
                </Animated.View>

                {/* How to Play Button */}
                <Animated.View style={{ opacity: fadeAnim }}>
                  <TouchableOpacity
                    style={styles.helpButton}
                    onPress={handleHowToPlay}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="help-circle-outline" size={20} color={COLORS.text.primary} />
                    <Text style={styles.helpButtonText}>{getTranslation('howToPlay')}</Text>
                  </TouchableOpacity>
                </Animated.View>

                {/* Version Info */}
                <Animated.View style={[styles.versionContainer, { opacity: fadeAnim }]}>
                  <Text style={styles.versionText}>v1.0.0</Text>
                </Animated.View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
}

const styles = {
  topButtons: {
    position: 'absolute',
    top: 20,
    right: 20,
    left: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  
  rightButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  
  topButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border.default,
  },
  
  languageButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  languageEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  
  userInfo: {
    marginTop: 10,
  },
  
  welcomeText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  
  username: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  
  logoText: {
    fontSize: 48,
    fontWeight: '900',
    color: COLORS.text.dark,
  },
  
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.text.primary,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  
  subtitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
    letterSpacing: 0.5,
  },
  
  inputContainer: {
    width: '100%',
    maxWidth: 320,
    marginBottom: 30,
  },
  
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 18,
    fontSize: 16,
    color: COLORS.text.primary,
    borderWidth: 2,
    borderColor: COLORS.border.default,
    fontWeight: '500',
  },
  
  inputFocused: {
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  
  inputReadOnly: {
    backgroundColor: COLORS.border.default,
    opacity: 0.8,
  },
  
  buttonsContainer: {
    width: '100%',
    maxWidth: 320,
    marginBottom: 20,
  },
  
  primaryButton: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  
  secondaryButton: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  
  gradientButton: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  buttonIcon: {
    marginRight: 12,
  },
  
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text.dark,
    letterSpacing: 0.5,
  },
  
  buttonDisabled: {
    opacity: 0.5,
  },
  
  connectionError: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  
  connectionErrorText: {
    color: COLORS.error,
    fontSize: 14,
    marginLeft: 8,
  },
  
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 20,
  },
  
  helpButtonText: {
    color: COLORS.text.primary,
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '600',
  },
  
  versionContainer: {
    position: 'absolute',
    bottom: 20,
  },
  
  versionText: {
    color: COLORS.text.muted,
    fontSize: 12,
  },
};