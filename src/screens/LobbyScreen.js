import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  StatusBar,
  ScrollView,
  Platform,
  Animated,
  Share
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { commonStyles } from '../utils/styles';
import { COLORS } from '../utils/colors';
import { useLanguage } from '../contexts/LanguageContext';
import { useGame } from '../contexts/GameContext';
import Spinner from '../components/Spinner';

export default function LobbyScreen() {
  const navigation = useNavigation();
  const { getTranslation } = useLanguage();
  const {
    playerName,
    roomCode,
    setRoomCode,
    players,
    setPlayers,
    myId,
    setMyId,
    setWordLength,
    setRound,
    resetGameState,
    showNotification,
    setGameState,
    setIsLoading,
    isLoading,
  } = useGame();
  
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [inputRoomCode, setInputRoomCode] = useState('');
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    const socket = global.socketInstance;
    
    if (socket) {
      console.log('LobbyScreen: Setting up socket listeners');
      
      // Create handler functions inside useEffect to avoid dependencies
      const onRoomUpdate = (data) => {
        console.log('LobbyScreen: Received roomUpdate:', data);
        handleRoomUpdate(data);
      };
      
      const onGameStarting = (data) => {
        console.log('LobbyScreen: Received gameStarting:', data);
        handleGameStarting(data);
      };
      
      // Only handle lobby-specific events here
      socket.on('roomUpdate', onRoomUpdate);
      socket.on('gameStarting', onGameStarting);
      
      // Log all events for debugging
      socket.onAny((event, ...args) => {
        console.log('LobbyScreen: Socket event:', event, args);
      });
      
      setMyId(socket.id);
    } else {
      console.error('Socket not available');
      setIsLoading(false);
      showNotification(getTranslation('connectionError'), 'error');
    }

    return () => {
      if (socket) {
        socket.off('roomUpdate');
        socket.off('gameStarting');
        socket.offAny();
      }
    };
  }, []);
  
  // Separate effect for leaving room on unmount
  useEffect(() => {
    return () => {
      const socket = global.socketInstance;
      if (socket && roomCode) {
        socket.emit('leaveRoom', { roomCode });
      }
    };
  }, [roomCode]);

  const handleRoomUpdate = (data) => {
    console.log('Room update handler:', data);
    if (data.players) {
      setPlayers(data.players);
      
      // Check if we have 2 players and show waiting message
      if (data.players.length === 2) {
        console.log('Two players in room, game will start automatically');
      }
    }
  };

  // Player joined is handled via roomUpdate

  // Player left is now handled in SocketEventHandler

  const handleGameStarting = (data) => {
    console.log('Game starting handler:', data);
    // Game is starting automatically, navigate to game screen
    setTimeout(() => {
      setGameState('game');
      navigation.navigate('Game');
    }, data.delay || 0);
  };

  // Error handling is in SocketEventHandler

  // Join room success is handled via roomUpdate

  const createRoom = () => {
    console.log('Creating room...');
    setIsLoading(true);
    resetGameState();
    const socket = global.socketInstance;
    if (socket && socket.connected) {
      console.log('Emitting create-room with playerName:', playerName);
      socket.emit('createRoom', { playerName }, (response) => {
        console.log('Create room response:', response);
        if (response && response.success) {
          console.log('Room created successfully with roomCode:', response.roomCode);
          // Immediately update state from callback
          setRoomCode(response.roomCode);
          setIsCreatingRoom(true);
          setIsLoading(false);
          // Also create initial player
          setPlayers([{ id: socket.id, name: playerName, score: 0 }]);
        } else {
          console.error('Room creation failed:', response);
          setIsLoading(false);
          showNotification(response?.message || getTranslation('error'), 'error');
        }
      });
      
      // Timeout after 10 seconds
      setTimeout(() => {
        if (isLoading) {
          setIsLoading(false);
          showNotification(getTranslation('connectionError'), 'error');
        }
      }, 10000);
    } else {
      console.error('Socket not connected');
      setIsLoading(false);
      showNotification(getTranslation('connectionError'), 'error');
    }
  };

  const joinRoom = () => {
    if (inputRoomCode.length !== 5) {
      showNotification(getTranslation('invalidRoomCode'), 'error');
      return;
    }
    
    console.log('Joining room...');
    setIsLoading(true);
    resetGameState();
    const socket = global.socketInstance;
    if (socket && socket.connected) {
      console.log('Emitting join-room with roomCode:', inputRoomCode.toUpperCase(), 'playerName:', playerName);
      socket.emit('joinRoom', { 
        roomCode: inputRoomCode.toUpperCase(), 
        playerName 
      }, (response) => {
        console.log('Join room response:', response);
        if (response && response.success) {
          console.log('Joined room successfully:', response.roomCode);
          // Immediately update state from callback
          setRoomCode(response.roomCode);
          setPlayers(response.players || []);
          setIsCreatingRoom(false);
          setIsLoading(false);
        } else {
          console.error('Join room failed:', response);
          setIsLoading(false);
          showNotification(response?.message || getTranslation('error'), 'error');
        }
      });
      
      // Timeout after 10 seconds
      setTimeout(() => {
        if (isLoading) {
          setIsLoading(false);
          showNotification(getTranslation('connectionError'), 'error');
        }
      }, 10000);
    } else {
      console.error('Socket not connected');
      setIsLoading(false);
      showNotification(getTranslation('connectionError'), 'error');
    }
  };

  const copyRoomCode = async () => {
    await Clipboard.setStringAsync(roomCode);
    showNotification(getTranslation('roomCodeCopied'), 'success');
  };

  const shareRoomCode = async () => {
    try {
      await Share.share({
        message: `${getTranslation('joinMyGame')} ${roomCode}`,
        title: getTranslation('appName'),
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  if (isLoading) {
    return (
      <LinearGradient
        colors={[COLORS.background, COLORS.darkBg]}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={commonStyles.safeArea}>
          <View style={commonStyles.loadingContainer}>
            <Spinner size="large" color={COLORS.primary} />
            <Text style={[commonStyles.text, { marginTop: 20 }]}>
              {isCreatingRoom ? getTranslation('creatingRoom') : getTranslation('joiningRoom')}
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <LinearGradient
        colors={[COLORS.background, COLORS.darkBg]}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={commonStyles.safeArea}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View 
              style={[
                commonStyles.screenContainer,
                { opacity: fadeAnim }
              ]}
            >
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={handleBack}
                  activeOpacity={0.7}
                >
                  <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{getTranslation('lobby')}</Text>
                <View style={{ width: 44 }} />
              </View>

              <View style={commonStyles.centerContainer}>
                {!roomCode ? (
                  // Create or Join Room
                  <View style={styles.optionsContainer}>
                    <TouchableOpacity
                      style={styles.optionCard}
                      onPress={createRoom}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={COLORS.gradient.primary}
                        style={styles.gradientCard}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Ionicons name="add-circle-outline" size={48} color={COLORS.text.dark} />
                        <Text style={styles.optionTitle}>{getTranslation('createRoom')}</Text>
                        <Text style={styles.optionDescription}>{getTranslation('createRoomDesc')}</Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <View style={styles.dividerContainer}>
                      <View style={styles.dividerLine} />
                      <Text style={styles.dividerText}>{getTranslation('or')}</Text>
                      <View style={styles.dividerLine} />
                    </View>

                    <View style={styles.joinContainer}>
                      <TextInput
                        style={styles.roomCodeInput}
                        placeholder={getTranslation('enterRoomCode')}
                        placeholderTextColor={COLORS.text.muted}
                        value={inputRoomCode}
                        onChangeText={(text) => setInputRoomCode(text.toUpperCase())}
                        maxLength={5}
                        autoCapitalize="characters"
                        autoCorrect={false}
                      />
                      <TouchableOpacity
                        style={[
                          styles.joinButton,
                          inputRoomCode.length !== 5 && styles.buttonDisabled
                        ]}
                        onPress={joinRoom}
                        disabled={inputRoomCode.length !== 5}
                        activeOpacity={0.8}
                      >
                        <LinearGradient
                          colors={inputRoomCode.length === 5 ? COLORS.gradient.secondary : [COLORS.button.outline, COLORS.button.outline]}
                          style={styles.gradientButton}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <Text style={styles.joinButtonText}>{getTranslation('joinRoom')}</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  // Room Info
                  <View style={styles.roomContainer}>
                    <View style={styles.roomCard}>
                      <Text style={styles.roomLabel}>{getTranslation('roomCode')}</Text>
                      <View style={styles.roomCodeContainer}>
                        <Text style={styles.roomCode}>{roomCode}</Text>
                        <View style={styles.roomActions}>
                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={copyRoomCode}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="copy-outline" size={24} color={COLORS.primary} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={shareRoomCode}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="share-social-outline" size={24} color={COLORS.primary} />
                          </TouchableOpacity>
                        </View>
                      </View>
                      <Text style={styles.shareHint}>{getTranslation('shareRoomCode')}</Text>
                    </View>

                    <View style={styles.playersCard}>
                      <Text style={styles.playersTitle}>{getTranslation('players')}</Text>
                      {players.map((player, index) => (
                        <View key={player.id} style={styles.playerItem}>
                          <View style={styles.playerInfo}>
                            <View style={[styles.playerAvatar, { backgroundColor: index === 0 ? COLORS.primary : COLORS.secondary }]}>
                              <Text style={styles.playerAvatarText}>{player.name.charAt(0).toUpperCase()}</Text>
                            </View>
                            <Text style={styles.playerName}>{player.name}</Text>
                            {player.id === myId && (
                              <View style={styles.youBadge}>
                                <Text style={styles.youBadgeText}>{getTranslation('you')}</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      ))}
                      
                      {players.length === 1 && (
                        <View style={styles.waitingContainer}>
                          <Spinner size="small" color={COLORS.primary} />
                          <Text style={styles.waitingText}>{getTranslation('waitingForOpponent')}</Text>
                        </View>
                      )}
                      
                      {players.length === 2 && (
                        <View style={styles.startingContainer}>
                          <Ionicons name="checkmark-circle" size={32} color={COLORS.success} />
                          <Text style={styles.startingText}>{getTranslation('gameStartingSoon')}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}
              </View>
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
}

const styles = {
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  
  optionsContainer: {
    width: '100%',
    maxWidth: 400,
  },
  
  optionCard: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  
  gradientCard: {
    padding: 32,
    alignItems: 'center',
  },
  
  optionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text.dark,
    marginTop: 16,
    marginBottom: 8,
  },
  
  optionDescription: {
    fontSize: 14,
    color: COLORS.text.dark,
    opacity: 0.8,
    textAlign: 'center',
  },
  
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border.default,
  },
  
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: COLORS.text.muted,
    fontWeight: '600',
  },
  
  joinContainer: {
    alignItems: 'center',
  },
  
  roomCodeInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 18,
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text.primary,
    borderWidth: 2,
    borderColor: COLORS.border.default,
    width: '100%',
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 16,
  },
  
  joinButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  
  gradientButton: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  
  joinButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text.light,
    letterSpacing: 0.5,
  },
  
  buttonDisabled: {
    opacity: 0.5,
  },
  
  roomContainer: {
    width: '100%',
    maxWidth: 400,
  },
  
  roomCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border.default,
  },
  
  roomLabel: {
    fontSize: 14,
    color: COLORS.text.muted,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  roomCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  roomCode: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 8,
    marginRight: 16,
  },
  
  roomActions: {
    flexDirection: 'row',
    gap: 8,
  },
  
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  
  shareHint: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  
  playersCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border.default,
  },
  
  playersTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 20,
  },
  
  playerItem: {
    marginBottom: 16,
  },
  
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  
  playerAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.dark,
  },
  
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    flex: 1,
  },
  
  youBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  
  youBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text.dark,
  },
  
  waitingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  
  waitingText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: 12,
  },
  
  startingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  
  startingText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.success,
    marginTop: 8,
  },
};