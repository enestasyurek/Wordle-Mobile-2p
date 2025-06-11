import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../utils/colors';
import { useGame } from '../contexts/GameContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function Scoreboard() {
  const { players, myId, singlePlayerMode, round, WIN_SCORE } = useGame();
  const { getTranslation } = useLanguage();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    // Animate on score change
    if (players.length > 0) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 50,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [players.map(p => p.score).join(',')]);

  if (singlePlayerMode) {
    const player = players[0];
    const progress = player ? (player.score / WIN_SCORE) * 100 : 0;
    
    return (
      <Animated.View style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }
      ]}>
        <View style={styles.singlePlayerHeader}>
          <Text style={styles.roundText}>
            {getTranslation('round')} {round}
          </Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View 
                style={[
                  styles.progressFill,
                  { width: `${progress}%` }
                ]}
              />
            </View>
            <Text style={styles.scoreText}>
              {player?.score || 0} / {WIN_SCORE}
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[
      styles.container,
      {
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
      }
    ]}>
      <Text style={styles.roundText}>
        {getTranslation('round')} {round}
      </Text>
      <View style={styles.scoresContainer}>
        {players.map((player) => {
          const isMe = player.id === myId;
          const isWinning = player.score === Math.max(...players.map(p => p.score));
          
          return (
            <View key={player.id} style={styles.playerScore}>
              {isWinning && player.score > 0 && (
                <View style={styles.crownContainer}>
                  <Text style={styles.crown}>👑</Text>
                </View>
              )}
              <View style={[
                styles.playerCard,
                isMe && styles.myCard,
                isWinning && styles.winningCard
              ]}>
                <Text style={[
                  styles.playerName,
                  isMe && styles.myName
                ]}>
                  {player.name}
                </Text>
                <Text style={[
                  styles.score,
                  isWinning && styles.winningScore
                ]}>
                  {player.score}
                </Text>
                <View style={styles.scoreProgress}>
                  <View 
                    style={[
                      styles.scoreProgressBar,
                      { width: `${(player.score / WIN_SCORE) * 100}%` },
                      isMe && styles.myProgressBar
                    ]}
                  />
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border.default,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  roundText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scoresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  playerScore: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  crownContainer: {
    position: 'absolute',
    top: -20,
    zIndex: 10,
  },
  crown: {
    fontSize: 20,
  },
  playerCard: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    width: '100%',
  },
  myCard: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  winningCard: {
    backgroundColor: COLORS.primary + '10',
  },
  playerName: {
    fontSize: 14,
    color: COLORS.text.primary,
    marginBottom: 4,
    fontWeight: '600',
  },
  myName: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  score: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text.primary,
  },
  winningScore: {
    color: COLORS.primary,
  },
  scoreProgress: {
    width: '100%',
    height: 4,
    backgroundColor: COLORS.border.default,
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  scoreProgressBar: {
    height: '100%',
    backgroundColor: COLORS.text.secondary,
    borderRadius: 2,
  },
  myProgressBar: {
    backgroundColor: COLORS.primary,
  },
  singlePlayerHeader: {
    width: '100%',
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: COLORS.border.default,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
});