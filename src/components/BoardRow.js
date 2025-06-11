import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Tile from './Tile';
import { ANIMATION_DURATIONS } from '../utils/constants';

export default function BoardRow({ 
  guess = '', 
  feedback = [], 
  currentGuess = '', 
  isCurrentRow = false,
  isShaking = false,
  isBouncing = false,
  isRevealing = false,
  wordLength = 5 
}) {
  const shakeAnim = React.useRef(new Animated.Value(0)).current;
  const bounceAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (isShaking) {
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isShaking]);

  React.useEffect(() => {
    if (isBouncing) {
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -10,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(bounceAnim, {
          toValue: 0,
          friction: 3,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isBouncing]);

  const letters = isCurrentRow ? currentGuess.split('') : guess.split('');
  const tiles = [];

  for (let i = 0; i < wordLength; i++) {
    tiles.push(
      <Tile
        key={i}
        letter={letters[i] || ''}
        status={feedback[i]}
        isRevealing={isRevealing}
        delay={i * ANIMATION_DURATIONS.reveal}
      />
    );
  }

  const animatedStyle = {
    transform: [
      { translateX: shakeAnim },
      { translateY: bounceAnim },
    ],
  };

  return (
    <Animated.View style={[styles.row, animatedStyle]}>
      {tiles}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
});