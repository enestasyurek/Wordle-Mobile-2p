import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../utils/colors';
import { useGame } from '../contexts/GameContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function Scoreboard() {
  const { players, myId, singlePlayerMode, round } = useGame();
  const { getTranslation } = useLanguage();

  if (singlePlayerMode) {
    return (
      <View style={styles.container}>
        <Text style={styles.roundText}>
          {getTranslation('round')} {round}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.roundText}>
        {getTranslation('round')} {round}
      </Text>
      <View style={styles.scoresContainer}>
        {players.map((player) => (
          <View key={player.id} style={styles.playerScore}>
            <Text style={[
              styles.playerName,
              player.id === myId && styles.myName
            ]}>
              {player.name}
            </Text>
            <Text style={styles.score}>{player.score}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border.default,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  },
  playerName: {
    fontSize: 16,
    color: COLORS.text.primary,
    marginBottom: 6,
    fontWeight: '600',
  },
  myName: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  score: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text.primary,
  },
});