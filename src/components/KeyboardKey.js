import React, { useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/colors';
import { useLanguage } from '../contexts/LanguageContext';
import soundManager from '../utils/soundManager';

const { width: screenWidth } = Dimensions.get('window');

export default function KeyboardKey({ letter, status, onPress, isWide = false }) {
  const { getTranslation } = useLanguage();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.85,
      useNativeDriver: true,
      speed: 60,
      bounciness: 2,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const getBackgroundColor = () => {
    switch (status) {
      case 'correct': return COLORS.keyboard.keyCorrect;
      case 'present': return COLORS.keyboard.keyPresent;
      case 'absent': return COLORS.keyboard.keyAbsent;
      default: return COLORS.keyboard.key;
    }
  };

  const getTextColor = () => {
    return status && status !== 'unused' ? COLORS.text.light : COLORS.keyboard.keyText;
  };

  const renderContent = () => {
    if (letter === 'ENTER') {
      return <Ionicons name="return-down-back" size={20} color={getTextColor()} />;
    } else if (letter === 'BACKSPACE') {
      return <Ionicons name="backspace-outline" size={22} color={getTextColor()} />;
    } else {
      return <Text style={[styles.text, { color: getTextColor() }]}>{letter}</Text>;
    }
  };

  const getKeyWidth = () => {
    const padding = 32; // Total horizontal padding
    const gaps = 30; // Approximate gaps between keys
    const availableWidth = screenWidth - padding - gaps;
    const baseWidth = availableWidth / 11;
    
    if (isWide) {
      return Math.min(baseWidth * 1.6, 80);
    }
    return Math.max(baseWidth, 32);
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.key,
          {
            backgroundColor: getBackgroundColor(),
            width: getKeyWidth(),
          },
        ]}
        onPress={() => {
          soundManager.playHaptic('light');
          onPress(letter);
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
      >
        {renderContent()}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: screenWidth < 400 ? 2 : 3,
  },
  
  key: {
    height: screenWidth < 400 ? 48 : 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  
  text: {
    fontSize: screenWidth < 400 ? 16 : 18,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  specialText: {
    fontSize: screenWidth < 400 ? 12 : 14,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});