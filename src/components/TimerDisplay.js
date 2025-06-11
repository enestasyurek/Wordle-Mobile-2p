import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/colors';
import { useCountdown } from '../hooks/useCountdown';
import { useGame } from '../contexts/GameContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function TimerDisplay() {
  const { roundEndTime, singlePlayerMode } = useGame();
  const { getTranslation } = useLanguage();
  const { formattedTime, timeLeft } = useCountdown(roundEndTime);

  if (singlePlayerMode || !roundEndTime) {
    return null;
  }

  const isLowTime = timeLeft <= 30;
  const isCriticalTime = timeLeft <= 10;

  return (
    <View style={styles.container}>
      <Ionicons 
        name="time-outline" 
        size={20} 
        color={isCriticalTime ? COLORS.button.danger : isLowTime ? COLORS.present : COLORS.text.secondary} 
      />
      <Text 
        style={[
          styles.text,
          { color: isCriticalTime ? COLORS.button.danger : isLowTime ? COLORS.present : COLORS.text.primary }
        ]}
      >
        {getTranslation('timeLeft')}: {formattedTime}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border.default,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});