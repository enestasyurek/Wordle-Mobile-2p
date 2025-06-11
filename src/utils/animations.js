import React from 'react';
import { Animated, Easing } from 'react-native';

export const animations = {
  // Shake animation for invalid input
  shake: (animatedValue, intensity = 10) => {
    return Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: intensity,
        duration: 50,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: -intensity,
        duration: 100,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: intensity,
        duration: 100,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 50,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ]);
  },

  // Bounce animation for correct guess
  bounce: (animatedValue, scale = 1.2) => {
    return Animated.sequence([
      Animated.spring(animatedValue, {
        toValue: scale,
        friction: 3,
        tension: 200,
        useNativeDriver: true,
      }),
      Animated.spring(animatedValue, {
        toValue: 1,
        friction: 3,
        tension: 200,
        useNativeDriver: true,
      }),
    ]);
  },

  // Flip animation for tile reveal
  flip: (animatedValue, duration = 300) => {
    return Animated.timing(animatedValue, {
      toValue: 1,
      duration,
      easing: Easing.linear,
      useNativeDriver: true,
    });
  },

  // Fade in animation
  fadeIn: (animatedValue, duration = 300, delay = 0) => {
    return Animated.timing(animatedValue, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.ease,
      useNativeDriver: true,
    });
  },

  // Fade out animation
  fadeOut: (animatedValue, duration = 300, delay = 0) => {
    return Animated.timing(animatedValue, {
      toValue: 0,
      duration,
      delay,
      easing: Easing.ease,
      useNativeDriver: true,
    });
  },

  // Slide in from bottom
  slideInUp: (animatedValue, distance = 50, duration = 300) => {
    return Animated.timing(animatedValue, {
      toValue: 0,
      duration,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });
  },

  // Slide out to bottom
  slideOutDown: (animatedValue, distance = 50, duration = 300) => {
    return Animated.timing(animatedValue, {
      toValue: distance,
      duration,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    });
  },

  // Scale animation
  scale: (animatedValue, toValue = 1, duration = 300) => {
    return Animated.timing(animatedValue, {
      toValue,
      duration,
      easing: Easing.ease,
      useNativeDriver: true,
    });
  },

  // Pulse animation
  pulse: (animatedValue, minScale = 0.95, maxScale = 1.05) => {
    return Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: maxScale,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: minScale,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
  },

  // Rotate animation
  rotate: (animatedValue, toValue = 1, duration = 300) => {
    return Animated.timing(animatedValue, {
      toValue,
      duration,
      easing: Easing.linear,
      useNativeDriver: true,
    });
  },

  // Spring animation
  spring: (animatedValue, toValue = 1, config = {}) => {
    return Animated.spring(animatedValue, {
      toValue,
      friction: 7,
      tension: 40,
      ...config,
      useNativeDriver: true,
    });
  },

  // Stagger animation for multiple elements
  stagger: (animations, delay = 100) => {
    return Animated.stagger(delay, animations);
  },

  // Parallel animations
  parallel: (animations) => {
    return Animated.parallel(animations);
  },

  // Sequence animations
  sequence: (animations) => {
    return Animated.sequence(animations);
  },
};

// Hook for managing animations
export const useAnimation = (initialValue = 0) => {
  const animatedValue = React.useRef(new Animated.Value(initialValue)).current;

  return {
    value: animatedValue,
    shake: (intensity) => animations.shake(animatedValue, intensity),
    bounce: (scale) => animations.bounce(animatedValue, scale),
    flip: (duration) => animations.flip(animatedValue, duration),
    fadeIn: (duration, delay) => animations.fadeIn(animatedValue, duration, delay),
    fadeOut: (duration, delay) => animations.fadeOut(animatedValue, duration, delay),
    scale: (toValue, duration) => animations.scale(animatedValue, toValue, duration),
    pulse: (minScale, maxScale) => animations.pulse(animatedValue, minScale, maxScale),
    rotate: (toValue, duration) => animations.rotate(animatedValue, toValue, duration),
    spring: (toValue, config) => animations.spring(animatedValue, toValue, config),
    reset: () => animatedValue.setValue(initialValue),
  };
};