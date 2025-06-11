import React from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { COLORS } from '../utils/colors';

export default function Spinner({ size = 'large', color = COLORS.button.primary }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator 
        size={Platform.OS === 'android' ? 'large' : size} 
        color={color}
        animating={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});