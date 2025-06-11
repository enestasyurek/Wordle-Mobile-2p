import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Animated,
  StyleSheet,
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

const { width: screenWidth } = Dimensions.get('window');

export default function GameOverScreen() {
  const navigation = useNavigation();
  const { getTranslation } = useLanguage();
  const {
    lastRoundResult,
    gameWinner,
    singlePlayerMode,
    currentWord,
    players,
    myId,
    resetGameState,
    setGameState,
    roomCode,
  } = useGame();
  
  const [showWord, setShowWord] = useState(false);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Main entrance animation
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

    // If winner, play confetti animation
    if (isWinner()) {
      Animated.sequence([
        Animated.delay(300),
        Animated.spring(confettiAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, []);

  const handlePlayAgain = () => {
    if (singlePlayerMode) {
      resetGameState();
      setGameState('gameMode');
      navigation.replace('GameMode');
    } else {
      const socket = global.socketInstance;
      if (socket && roomCode) {
        socket.emit('playAgain', { roomCode });
      }
      navigation.replace('Lobby');
    }
  };

  const handleNewGame = () => {
    const socket = global.socketInstance;
    if (socket && roomCode && !singlePlayerMode) {
      socket.emit('leaveRoom', { roomCode });
    }
    resetGameState();
    setGameState('home');
    navigation.replace('Home');
  };

  const isWinner = () => {
    if (singlePlayerMode) {
      return lastRoundResult?.winner;
    }
    return gameWinner?.id === myId;
  };

  const getResultMessage = () => {
    if (singlePlayerMode) {
      if (lastRoundResult?.winner) {
        return getTranslation('winner') + '!';
      } else if (lastRoundResult?.timedOut) {
        return getTranslation('timeout');
      } else {
        return getTranslation('tryAgain');
      }
    } else {
      if (gameWinner) {
        return `${gameWinner.name} ${getTranslation('wins')}`;
      }
      return getTranslation('gameOver');
    }
  };

  const getScoreDisplay = () => {
    if (singlePlayerMode) return null;
    
    return (
      <View style={[commonStyles.card, { marginTop: 20 }]}>
        <Text style={commonStyles.subtitle}>{getTranslation('finalScore')}</Text>
        {players.map((player) => (
          <View key={player.id} style={[commonStyles.row, { marginTop: 10 }]}>
            <Text style={[
              commonStyles.text,
              player.id === gameWinner?.id && { fontWeight: 'bold', color: COLORS.correct }
            ]}>
              {player.name}
            </Text>
            <Text style={[
              commonStyles.text,
              player.id === gameWinner?.id && { fontWeight: 'bold', color: COLORS.correct }
            ]}>
              {player.score} {getTranslation('points')}
            </Text>
          </View>
        ))}
      </View>
    );
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
          <ScrollView 
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View 
              style={[
                commonStyles.centerContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                }
              ]}
            >
              {/* Result Icon and Message */}
              <View style={styles.resultContainer}>
                <Animated.View
                  style={[
                    styles.iconContainer,
                    {
                      transform: [
                        {
                          scale: confettiAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 1.2],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <LinearGradient
                    colors={isWinner() ? COLORS.gradient.success : COLORS.gradient.danger}
                    style={styles.iconGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons 
                      name={isWinner() ? "trophy" : "refresh"} 
                      size={48} 
                      color={COLORS.text.dark} 
                    />
                  </LinearGradient>
                </Animated.View>
                
                <Text style={[
                  commonStyles.title,
                  styles.resultTitle,
                  { color: isWinner() ? COLORS.success : COLORS.text.primary }
                ]}>
                  {getResultMessage()}
                </Text>
              </View>

              {/* Word Reveal Card */}
              {(lastRoundResult?.correctWord || currentWord) && (
                <TouchableOpacity
                  style={styles.wordCard}
                  onPress={() => setShowWord(!showWord)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[COLORS.surface, COLORS.cardBg]}
                    style={styles.wordCardGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.wordCardTitle}>
                      {getTranslation('correctWord')}
                    </Text>
                    <View style={styles.wordContainer}>
                      <Text style={[
                        styles.wordText,
                        !showWord && styles.hiddenWord
                      ]}>
                        {showWord ? (lastRoundResult?.correctWord || currentWord) : '?????'}
                      </Text>
                    </View>
                    {!showWord && (
                      <View style={styles.tapHint}>
                        <Ionicons name="eye" size={16} color={COLORS.text.secondary} />
                        <Text style={styles.tapHintText}>
                          {getTranslation('tapToRevealWord')}
                        </Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              )}

              {/* Score Display */}
              {!singlePlayerMode && players.length > 0 && (
                <View style={styles.scoreCard}>
                  <Text style={styles.scoreTitle}>{getTranslation('finalScore')}</Text>
                  {players.map((player, index) => (
                    <View key={player.id} style={styles.scoreRow}>
                      <View style={styles.playerInfo}>
                        {player.id === gameWinner?.id && (
                          <Ionicons name="crown" size={20} color={COLORS.warning} style={styles.crownIcon} />
                        )}
                        <Text style={[
                          styles.playerName,
                          player.id === gameWinner?.id && styles.winnerText
                        ]}>
                          {player.name}
                        </Text>
                      </View>
                      <Text style={[
                        styles.playerScore,
                        player.id === gameWinner?.id && styles.winnerText
                      ]}>
                        {player.score} {getTranslation('points')}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handlePlayAgain}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={COLORS.gradient.primary}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="play" size={20} color={COLORS.text.dark} />
                    <Text style={styles.primaryButtonText}>
                      {getTranslation('playAgain')}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleNewGame}
                  activeOpacity={0.8}
                >
                  <Ionicons name="home-outline" size={20} color={COLORS.text.primary} />
                  <Text style={styles.secondaryButtonText}>
                    {getTranslation('newGame')}
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  resultContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  resultTitle: {
    fontSize: 32,
    marginBottom: 0,
  },
  wordCard: {
    width: '100%',
    maxWidth: 320,
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  wordCardGradient: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border.default,
  },
  wordCardTitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  wordContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
  },
  wordText: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text.primary,
    textAlign: 'center',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  hiddenWord: {
    color: COLORS.text.muted,
    letterSpacing: 4,
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapHintText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginLeft: 6,
  },
  scoreCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    width: '100%',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: COLORS.border.default,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.default,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  crownIcon: {
    marginRight: 8,
  },
  playerName: {
    fontSize: 16,
    color: COLORS.text.primary,
  },
  playerScore: {
    fontSize: 16,
    color: COLORS.text.secondary,
    fontWeight: '600',
  },
  winnerText: {
    color: COLORS.success,
    fontWeight: '700',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 320,
  },
  primaryButton: {
    marginBottom: 12,
    borderRadius: 12,
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
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.dark,
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border.default,
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});