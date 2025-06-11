import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '../contexts/GameContext';
import { COLORS } from '../utils/colors';

const { width: screenWidth } = Dimensions.get('window');

export default function Notification() {
  const { notification } = useGame();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (notification.message) {
      // Slide in
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          speed: 12,
          bounciness: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
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
        ]).start();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [notification.message, notification.id]);

  if (!notification.message) return null;

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
          transform: [{ translateY: slideAnim }],
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
          {notification.message}
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
  },
  
  notification: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    maxWidth: screenWidth - 32,
    minHeight: 56,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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