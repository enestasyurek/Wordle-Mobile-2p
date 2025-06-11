import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '../contexts/GameContext';
import { useLanguage } from '../contexts/LanguageContext';
import { COLORS } from '../utils/colors';
import soundManager from '../utils/soundManager';

const { width: screenWidth } = Dimensions.get('window');

export default function Notification() {
  const { notification } = useGame();
  const { getTranslation } = useLanguage();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (notification.message) {
      // Play sound based on notification type
      soundManager.playSound('notification');
      
      // Slide in with scale
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          speed: 14,
          bounciness: 10,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 60,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: -100,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.8,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      }, notification.duration || 3000);

      return () => clearTimeout(timer);
    }
  }, [notification.message, notification.id]);

  if (!notification.message) return null;

  // Handle translation if message is an array
  const displayMessage = Array.isArray(notification.message) 
    ? getTranslation(...notification.message)
    : getTranslation(notification.message);

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <Ionicons name="checkmark-circle" size={20} color={COLORS.text.light} />;
      case 'error':
        return <Ionicons name="close-circle" size={20} color={COLORS.text.light} />;
      case 'warning':
        return <Ionicons name="warning" size={20} color={COLORS.text.dark} />;
      default:
        return <Ionicons name="information-circle" size={20} color={COLORS.text.light} />;
    }
  };

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'success': return COLORS.success;
      case 'error': return COLORS.error;
      case 'warning': return COLORS.warning;
      default: return COLORS.info;
    }
  };

  const getTextColor = () => {
    return notification.type === 'warning' ? COLORS.text.dark : COLORS.text.light;
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + 10,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim }
          ],
          opacity: opacityAnim,
        },
      ]}
      pointerEvents="none"
    >
      <View style={[styles.notification, { backgroundColor: getBackgroundColor() }]}>
        <View style={styles.iconContainer}>
          {getIcon()}
        </View>
        <Text style={[styles.text, { color: getTextColor() }]}>
          {displayMessage}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 1000,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  
  notification: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    maxWidth: screenWidth - 32,
    minHeight: 56,
    borderWidth: Platform.OS === 'ios' ? 1 : 0,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    ...Platform.select({
      ios: {
        backgroundColor: 'transparent',
      },
    }),
  },
  
  iconContainer: {
    marginRight: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  text: {
    fontSize: screenWidth < 400 ? 14 : 15,
    fontWeight: '600',
    flex: 1,
    flexWrap: 'wrap',
    lineHeight: screenWidth < 400 ? 20 : 22,
  },
});