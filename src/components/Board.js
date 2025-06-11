import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import BoardRow from './BoardRow';
import { useGame } from '../contexts/GameContext';
import { BOARD_SIZES } from '../utils/constants';
import { COLORS } from '../utils/colors';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function Board() {
  const {
    guesses,
    currentGuess,
    wordLength,
    shakeRowIndex,
    bounceRowIndex,
    revealingRow,
  } = useGame();

  const rows = [];
  
  for (let i = 0; i < BOARD_SIZES.maxGuesses; i++) {
    if (i < guesses.length) {
      rows.push(
        <BoardRow
          key={i}
          guess={guesses[i].guess}
          feedback={guesses[i].feedback}
          isShaking={shakeRowIndex === i}
          isBouncing={bounceRowIndex === i}
          isRevealing={revealingRow === i}
          wordLength={wordLength}
        />
      );
    } else if (i === guesses.length) {
      rows.push(
        <BoardRow
          key={i}
          currentGuess={currentGuess}
          isCurrentRow={true}
          isShaking={shakeRowIndex === i}
          wordLength={wordLength}
        />
      );
    } else {
      rows.push(
        <BoardRow
          key={i}
          wordLength={wordLength}
        />
      );
    }
  }

  return <View style={styles.board}>{rows}</View>;
}

const styles = StyleSheet.create({
  board: {
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: screenHeight * 0.4,
  },
});