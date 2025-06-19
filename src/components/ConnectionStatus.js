import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useSocket } from '../contexts/SocketContext';
import { COLORS } from '../utils/colors';

const ConnectionStatus = () => {
  const { isConnected, connectionError } = useSocket();

  // Don't show anything if connected and no error
  if (isConnected && !connectionError) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {!isConnected && !connectionError && (
          <>
            <ActivityIndicator size="small" color={COLORS.warning} />
            <Text style={styles.text}>Connecting...</Text>
          </>
        )}
        
        {!isConnected && connectionError && (
          <>
            <View style={styles.errorDot} />
            <Text style={styles.errorText}>{connectionError}</Text>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    zIndex: 1000,
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border.default,
  },
  text: {
    color: COLORS.warning,
    fontSize: 14,
    marginLeft: 8,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    marginLeft: 8,
  },
  errorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
  },
});

export default ConnectionStatus;