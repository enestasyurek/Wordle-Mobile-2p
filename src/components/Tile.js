import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../utils/colors';
import { ANIMATION_DURATIONS } from '../utils/constants';
import soundManager from '../utils/soundManager';

const { width: screenWidth } = Dimensions.get('window');

export default function Tile({ letter, status, delay = 0, isRevealing, shake, bounce }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const popAnim = useRef(new Animated.Value(1)).current;

  // Pop animation when letter is entered
  useEffect(() => {
    if (letter && !status) {
      soundManager.playSound('keyPress');
      Animated.sequence([
        Animated.timing(popAnim, {
          toValue: 1.15,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(popAnim, {
          toValue: 1,
          friction: 4,
          tension: 50,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [letter]);

  // Reveal animation
  useEffect(() => {
    if (isRevealing && status) {
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(rotateAnim, {
            toValue: 0.5,
            duration: ANIMATION_DURATIONS.flip,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.9,
            duration: ANIMATION_DURATIONS.flip / 2,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: ANIMATION_DURATIONS.flip,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 4,
            tension: 50,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        if (status === 'correct') {
          soundManager.playSound('reveal');
        }
      });
    }
  }, [isRevealing, status, delay]);

  // Shake animation
  useEffect(() => {
    if (shake) {
      soundManager.playSound('wrong');
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 12, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -12, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 70, useNativeDriver: true }),
      ]).start();
    }
  }, [shake]);

  // Bounce animation
  useEffect(() => {
    if (bounce) {
      soundManager.playSound('correct');
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: -25, duration: 200, useNativeDriver: true }),
        Animated.spring(bounceAnim, {
          toValue: 0,
          friction: 2.5,
          tension: 60,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [bounce]);

  const getBackgroundColor = () => {
    switch (status) {
      case 'correct': return COLORS.correct;
      case 'present': return COLORS.present;
      case 'absent': return COLORS.absent;
      default: return COLORS.empty;
    }
  };

  const getBorderColor = () => {
    if (status) return getBackgroundColor();
    if (letter) return COLORS.border.focused;
    return COLORS.border.tile;
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '90deg', '0deg'],
  });

  const flipStyle = {
    transform: [
      { rotateX: rotateInterpolate },
      { translateX: shakeAnim },
      { translateY: bounceAnim },
      { scale: Animated.multiply(popAnim, scaleAnim) },
    ],
  };

  const getTileSize = () => {
    const availableWidth = screenWidth - 80; // padding and margins
    const maxTilesPerRow = 6; // Maximum word length
    const tileWithMargin = availableWidth / maxTilesPerRow;
    const tileSize = tileWithMargin - 6; // 6px for margins
    
    // Ensure minimum and maximum sizes
    return Math.max(Math.min(tileSize, 64), 45);
  };
  
  const tileSize = getTileSize();

  return (
    <Animated.View 
      style={[
        styles.tile,
        {
          width: tileSize,
          height: tileSize,
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: status ? 0 : 2,
        },
        flipStyle,
      ]}
    >
      <Text style={[
        styles.letter,
        { 
          color: status ? COLORS.text.light : COLORS.text.primary,
          fontSize: tileSize * 0.5,
        },
      ]}>
        {letter}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tile: {
    justifyContent: 'center',
    alignItems: 'center',
    margin: 3,
    borderRadius: screenWidth < 400 ? 4 : 6,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  
  letter: {
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});