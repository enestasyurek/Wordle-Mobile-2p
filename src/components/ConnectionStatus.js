import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSocket } from '../contexts/SocketContext';
import { useLanguage } from '../contexts/LanguageContext';
import { COLORS } from '../utils/colors';
import { animations } from '../utils/animations';

export default function ConnectionStatus() {
  const { isConnected } = useSocket();
  const { getTranslation } = useLanguage();
  const insets = useSafeAreaInsets();
  
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const wasConnected = useRef(true);

  useEffect(() => {
    if (!isConnected && wasConnected.current) {
      // Show disconnection banner
      Animated.parallel([
        animations.slideInUp(slideAnim, -100),
        animations.fadeIn(opacityAnim),
      ]).start();
      
      // Start pulse animation
      animations.pulse(pulseAnim).start();
      
      wasConnected.current = false;
    } else if (isConnected && !wasConnected.current) {
      // Show reconnection success briefly
      Animated.sequence([
        animations.fadeIn(opacityAnim),
        Animated.delay(2000),
        Animated.parallel([
          animations.slideOutDown(slideAnim, -100),
          animations.fadeOut(opacityAnim),
        ]),
      ]).start();
      
      wasConnected.current = true;
    }
  }, [isConnected]);

  if (isConnected && wasConnected.current) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top,
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
      pointerEvents="box-none"
    >
      <Animated.View 
        style={[
          styles.banner,
          isConnected ? styles.connectedBanner : styles.disconnectedBanner,
          { transform: [{ scale: pulseAnim }] }
        ]}
      >
        <View style={styles.content}>
          <Ionicons
            name={isConnected ? 'wifi' : 'wifi-off'}
            size={20}
            color={COLORS.text.light}
            style={styles.icon}
          />
          <Text style={styles.text}>
            {isConnected 
              ? getTranslation('connectionRestored')
              : getTranslation('connectionLost')}
          </Text>
        </View>
        {!isConnected && (
          <View style={styles.subContent}>
            <Text style={styles.subText}>
              {getTranslation('reconnecting')}
            </Text>
          </View>
        )}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
  },
  
  banner: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 200,
    maxWidth: '100%',
  },
  
  disconnectedBanner: {
    backgroundColor: COLORS.error,
  },
  
  connectedBanner: {
    backgroundColor: COLORS.success,
  },
  
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  icon: {
    marginRight: 8,
  },
  
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.light,
  },
  
  subContent: {
    marginTop: 4,
    alignItems: 'center',
  },
  
  subText: {
    fontSize: 12,
    color: COLORS.text.light,
    opacity: 0.9,
  },
});