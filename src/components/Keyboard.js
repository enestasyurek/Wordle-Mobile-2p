import React from 'react';
import { View, StyleSheet } from 'react-native';
import KeyboardKey from './KeyboardKey';
import { useGame } from '../contexts/GameContext';
import { useLanguage } from '../contexts/LanguageContext';
import { COLORS } from '../utils/colors';

const keyboardLayouts = {
  tr: [
    ['E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'Ğ', 'Ü'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ş', 'İ'],
    ['ENTER', 'Z', 'C', 'V', 'B', 'N', 'M', 'Ö', 'Ç', 'BACKSPACE'],
  ],
  en: [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE'],
  ],
};

export default function Keyboard({ onKeyPress, disabled = false }) {
  const { keyboardStatuses } = useGame();
  const { language } = useLanguage();
  
  const layout = keyboardLayouts[language] || keyboardLayouts.en;

  return (
    <View style={styles.keyboard}>
      {layout.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {rowIndex === 1 && <View style={styles.halfKeySpace} />}
          {row.map((key) => (
            <KeyboardKey
              key={key}
              letter={key}
              status={keyboardStatuses.get(key)}
              onPress={disabled ? () => {} : onKeyPress}
              isWide={key === 'ENTER' || key === 'BACKSPACE'}
            />
          ))}
          {rowIndex === 1 && <View style={styles.halfKeySpace} />}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    backgroundColor: COLORS.background,
    paddingVertical: 10,
  },
  
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  halfKeySpace: {
    width: 10,
  },
});