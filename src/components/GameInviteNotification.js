import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../utils/colors';
import { useLanguage } from '../contexts/LanguageContext';
import { useSocket } from '../contexts/SocketContext';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';

export default function GameInviteNotification() {
  const navigation = useNavigation();
  const { getTranslation } = useLanguage();
  const { socket } = useSocket();
  const { setGameState, resetGameState } = useGame();
  const { isAuthenticated } = useAuth();
  
  const [invite, setInvite] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-100));

  useEffect(() => {
    if (socket && isAuthenticated) {
      socket.on('game-invite-received', handleGameInviteReceived);
      
      return () => {
        socket.off('game-invite-received');
      };
    }
  }, [socket, isAuthenticated]);

  useEffect(() => {
    if (invite) {
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-hide after 30 seconds
      const timer = setTimeout(() => {
        handleDecline();
      }, 30000);

      return () => clearTimeout(timer);
    }
  }, [invite]);

  const handleGameInviteReceived = (data) => {
    setInvite(data.invite);
  };

  const handleAccept = () => {
    if (socket && invite) {
      socket.emit('accept-game-invite', { inviteId: invite.id });
      
      // Animate out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        resetGameState();
        setGameState('lobby');
        navigation.navigate('Lobby', { roomCode: invite.roomCode });
        setInvite(null);
      });
    }
  };

  const handleDecline = () => {
    if (socket && invite) {
      socket.emit('decline-game-invite', { inviteId: invite.id });
    }
    
    // Animate out
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setInvite(null);
    });
  };

  if (!invite || !isAuthenticated) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={[COLORS.primaryDark, COLORS.primary]}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Ionicons name="game-controller" size={24} color={COLORS.text.light} />
            <Text style={styles.title}>{getTranslation('gameInvite')}</Text>
            <TouchableOpacity onPress={handleDecline} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={COLORS.text.light} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.message}>
            <Text style={styles.username}>{invite.sender.username}</Text>
            {' '}{getTranslation('invitesToPlay')}
          </Text>
          
          {invite.message && (
            <Text style={styles.customMessage}>"{invite.message}"</Text>
          )}
          
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.declineButton]}
              onPress={handleDecline}
            >
              <Text style={styles.declineText}>{getTranslation('decline')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.acceptButton]}
              onPress={handleAccept}
            >
              <LinearGradient
                colors={[COLORS.success, '#4ade80']}
                style={styles.acceptGradient}
              >
                <Text style={styles.acceptText}>{getTranslation('accept')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 1000,
    elevation: 10,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradient: {
    padding: 2,
  },
  content: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginLeft: 10,
  },
  closeButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    fontSize: 15,
    color: COLORS.text.secondary,
    marginBottom: 8,
  },
  username: {
    fontWeight: '600',
    color: COLORS.primary,
  },
  customMessage: {
    fontSize: 14,
    color: COLORS.text.muted,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButton: {
    backgroundColor: COLORS.border.default,
  },
  declineText: {
    color: COLORS.text.secondary,
    fontWeight: '600',
  },
  acceptButton: {
    overflow: 'hidden',
  },
  acceptGradient: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptText: {
    color: COLORS.text.light,
    fontWeight: '700',
  },
});