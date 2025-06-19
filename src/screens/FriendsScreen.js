import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  StyleSheet,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../utils/colors';
import { commonStyles } from '../utils/styles';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import { useSocket } from '../contexts/SocketContext';

const API_URL = __DEV__ ? 'https://twopwordle-server.onrender.com' : 'https://twopwordle-server.onrender.com';

export default function FriendsScreen() {
  const navigation = useNavigation();
  const { language, getTranslation } = useLanguage();
  const { user, token } = useAuth();
  const { setGameState, showNotification, resetGameState } = useGame();
  const { socket, isConnected } = useSocket();
  
  const [activeTab, setActiveTab] = useState('friends'); // friends, search, requests
  const [friends, setFriends] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [pendingRequests, setPendingRequests] = useState({ incoming: [], outgoing: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchFriends();
      fetchPendingRequests();
    }
  }, [user]);

  useEffect(() => {
    if (socket) {
      // Listen for friend status updates
      socket.on('friend-status-changed', handleFriendStatusChange);
      socket.on('friend-request-received', handleFriendRequestReceived);
      socket.on('friend-request-accepted', handleFriendRequestAccepted);
      socket.on('game-invite-received', handleGameInviteReceived);
      
      return () => {
        socket.off('friend-status-changed');
        socket.off('friend-request-received');
        socket.off('friend-request-accepted');
        socket.off('game-invite-received');
      };
    }
  }, [socket]);

  const handleFriendStatusChange = (data) => {
    setFriends(prev => prev.map(friend => 
      friend.id === data.friendId 
        ? { ...friend, isOnline: data.isOnline, lastSeen: data.lastSeen }
        : friend
    ));
  };

  const handleFriendRequestReceived = (data) => {
    setPendingRequests(prev => ({
      ...prev,
      incoming: [...prev.incoming, data]
    }));
    showNotification(`${data.requester.username} ${getTranslation('friendSentRequest')}`, 'info');
  };

  const handleFriendRequestAccepted = (data) => {
    showNotification(`${data.acceptor.username} ${getTranslation('friendAcceptedRequest')}`, 'success');
    fetchFriends();
    fetchPendingRequests();
  };

  const handleGameInviteReceived = (data) => {
    Alert.alert(
      getTranslation('gameInvite'),
      `${data.invite.sender.username} ${getTranslation('invitesToPlay')}`,
      [
        {
          text: getTranslation('cancel'),
          style: 'cancel',
          onPress: () => socket.emit('decline-game-invite', { inviteId: data.invite.id })
        },
        {
          text: getTranslation('accept'),
          onPress: () => acceptGameInvite(data.invite.id, data.invite.roomCode)
        }
      ]
    );
  };

  const acceptGameInvite = (inviteId, roomCode) => {
    socket.emit('accept-game-invite', { inviteId });
    resetGameState();
    setGameState('lobby');
    navigation.navigate('Lobby', { roomCode });
  };

  const fetchFriends = async () => {
    try {
      setLoading(true);
      // Get fresh token from AsyncStorage
      const currentToken = token || await AsyncStorage.getItem('accessToken');
      
      if (!currentToken) {
        console.error('No token available for fetching friends');
        return;
      }
      
      const response = await axios.get(`${API_URL}/api/friends`, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      
      if (response.data.success) {
        setFriends(response.data.data.friends);
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
      if (error.response?.status !== 401) {
        showNotification(getTranslation('failedToLoadFriends'), 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      // Get fresh token from AsyncStorage
      const currentToken = token || await AsyncStorage.getItem('accessToken');
      
      if (!currentToken) {
        console.error('No token available for fetching requests');
        return;
      }
      
      const response = await axios.get(`${API_URL}/api/friends/requests/pending`, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      
      if (response.data.success) {
        setPendingRequests(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const searchUsers = async () => {
    if (searchQuery.length < 2) return;
    
    try {
      setLoading(true);
      // Get fresh token from AsyncStorage
      const currentToken = token || await AsyncStorage.getItem('accessToken');
      
      if (!currentToken) {
        console.error('No token available for searching users');
        return;
      }
      
      const response = await axios.get(`${API_URL}/api/friends/search`, {
        params: { q: searchQuery },
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      
      if (response.data.success) {
        setSearchResults(response.data.data.users);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      showNotification(getTranslation('searchFailed'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (recipientId) => {
    try {
      // Get fresh token from AsyncStorage
      const currentToken = token || await AsyncStorage.getItem('accessToken');
      
      if (!currentToken) {
        console.error('No token available for sending friend request');
        return;
      }
      
      const response = await axios.post(
        `${API_URL}/api/friends/request`,
        { recipientId },
        { headers: { Authorization: `Bearer ${currentToken}` } }
      );
      
      if (response.data.success) {
        showNotification(getTranslation('friendRequestSent'), 'success');
        // Update search results
        setSearchResults(prev => prev.map(user => 
          user.id === recipientId ? { ...user, friendshipStatus: 'pending' } : user
        ));
        
        // Notify via socket
        socket.emit('send-friend-request', { recipientId });
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      showNotification(
        error.response?.data?.error || getTranslation('failedToSendRequest'),
        'error'
      );
    }
  };

  const acceptFriendRequest = async (requestId, requesterId) => {
    try {
      // Get fresh token from AsyncStorage
      const currentToken = token || await AsyncStorage.getItem('accessToken');
      
      if (!currentToken) {
        console.error('No token available for accepting friend request');
        return;
      }
      
      const response = await axios.post(
        `${API_URL}/api/friends/request/${requestId}/accept`,
        {},
        { headers: { Authorization: `Bearer ${currentToken}` } }
      );
      
      if (response.data.success) {
        showNotification(getTranslation('friendRequestAccepted'), 'success');
        fetchFriends();
        fetchPendingRequests();
        
        // Notify via socket
        socket.emit('friend-request-accepted', { requesterId });
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      showNotification(getTranslation('operationFailed'), 'error');
    }
  };

  const declineFriendRequest = async (requestId) => {
    try {
      // Get fresh token from AsyncStorage
      const currentToken = token || await AsyncStorage.getItem('accessToken');
      
      if (!currentToken) {
        console.error('No token available for declining friend request');
        return;
      }
      
      await axios.post(
        `${API_URL}/api/friends/request/${requestId}/decline`,
        {},
        { headers: { Authorization: `Bearer ${currentToken}` } }
      );
      
      showNotification(getTranslation('friendRequestDeclined'), 'info');
      fetchPendingRequests();
    } catch (error) {
      console.error('Error declining request:', error);
    }
  };

  const removeFriend = async (friendId) => {
    Alert.alert(
      getTranslation('removeFriend'),
      getTranslation('removeFriendConfirm'),
      [
        { text: getTranslation('cancel'), style: 'cancel' },
        {
          text: getTranslation('remove'),
          style: 'destructive',
          onPress: async () => {
            try {
              const currentToken = token || await AsyncStorage.getItem('accessToken');
              if (!currentToken) {
                console.error('No token available for removing friend');
                return;
              }
              
              await axios.delete(`${API_URL}/api/friends/${friendId}`, {
                headers: { Authorization: `Bearer ${currentToken}` }
              });
              
              showNotification(getTranslation('friendRemoved'), 'info');
              fetchFriends();
            } catch (error) {
              console.error('Error removing friend:', error);
              showNotification(getTranslation('operationFailed'), 'error');
            }
          }
        }
      ]
    );
  };

  const sendGameInvite = (friendId) => {
    if (!isConnected) {
      showNotification(getTranslation('noConnection'), 'error');
      return;
    }
    
    // Create a room and send invite
    socket.emit('create-room', { 
      playerName: user.username,
      wordLength: 5 // Default to 5 letters
    });
    
    // Listen for room creation response
    socket.once('room-created', (response) => {
      if (response.roomCode) {
        socket.emit('send-game-invite', {
          recipientId: friendId,
          roomCode: response.roomCode,
          message: getTranslation('letsPlay')
        });
        
        setGameState('lobby');
        navigation.navigate('Lobby', { roomCode: response.roomCode });
      }
    });
  };

  const renderFriendItem = ({ item }) => (
    <View style={styles.friendItem}>
      <View style={styles.friendInfo}>
        <View style={styles.friendHeader}>
          <Text style={styles.friendName}>{item.username}</Text>
          <View style={[styles.statusDot, { backgroundColor: item.isOnline ? COLORS.success : COLORS.text.muted }]} />
        </View>
        {item.stats && (
          <Text style={styles.friendStats}>
            {getTranslation('wins').replace('!', ':')} {item.stats.totalWins} | 
            {getTranslation('rate')}:{' '}{Math.round(item.stats.winRate * 100)}%
          </Text>
        )}
      </View>
      <View style={styles.friendActions}>
        {item.isOnline && (
          <TouchableOpacity
            style={styles.inviteButton}
            onPress={() => sendGameInvite(item.id)}
          >
            <Ionicons name="game-controller" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeFriend(item.id)}
        >
          <Ionicons name="person-remove" size={20} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSearchItem = ({ item }) => (
    <View style={styles.searchItem}>
      <Text style={styles.searchUsername}>{item.username}</Text>
      <TouchableOpacity
        style={[
          styles.addButton,
          item.friendshipStatus !== 'none' && styles.addButtonDisabled
        ]}
        onPress={() => sendFriendRequest(item.id)}
        disabled={item.friendshipStatus !== 'none'}
      >
        <Text style={styles.addButtonText}>
          {item.friendshipStatus === 'pending' 
            ? getTranslation('pending')
            : item.friendshipStatus === 'accepted'
            ? getTranslation('friends')
            : getTranslation('add')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderRequestItem = ({ item, type }) => (
    <View style={styles.requestItem}>
      <Text style={styles.requestUsername}>
        {type === 'incoming' ? item.requester.username : item.recipient.username}
      </Text>
      {type === 'incoming' ? (
        <View style={styles.requestActions}>
          <TouchableOpacity
            style={[styles.requestButton, styles.acceptButton]}
            onPress={() => acceptFriendRequest(item.id, item.requester.id)}
          >
            <Ionicons name="checkmark" size={20} color={COLORS.text.light} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.requestButton, styles.declineButton]}
            onPress={() => declineFriendRequest(item.id)}
          >
            <Ionicons name="close" size={20} color={COLORS.text.light} />
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.pendingText}>
          {getTranslation('pending')}
        </Text>
      )}
    </View>
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchFriends(), fetchPendingRequests()]);
    setRefreshing(false);
  }, []);

  if (!user) {
    return (
      <SafeAreaView style={commonStyles.safeArea}>
        <View style={styles.loginPrompt}>
          <Text style={styles.loginPromptText}>
            {getTranslation('loginToSeeFriends')}
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginButtonText}>
              {getTranslation('login') || (language === 'tr' ? 'Giriş Yap' : 'Login')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
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
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
              </TouchableOpacity>
              <Text style={styles.title}>
                {getTranslation('friends')}
              </Text>
              <TouchableOpacity
                style={styles.leaderboardButton}
                onPress={() => navigation.navigate('Leaderboard')}
              >
                <Ionicons name="trophy" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
                onPress={() => setActiveTab('friends')}
              >
                <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
                  {getTranslation('myFriends')} ({friends.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'search' && styles.activeTab]}
                onPress={() => setActiveTab('search')}
              >
                <Text style={[styles.tabText, activeTab === 'search' && styles.activeTabText]}>
                  {getTranslation('search')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
                onPress={() => setActiveTab('requests')}
              >
                <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
                  {getTranslation('requests')} 
                  {pendingRequests.incoming.length > 0 && ` (${pendingRequests.incoming.length})`}
                </Text>
              </TouchableOpacity>
            </View>

            {activeTab === 'friends' && (
              <FlatList
                data={friends}
                renderItem={renderFriendItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>
                    {getTranslation('noFriendsYet')}
                  </Text>
                }
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
              />
            )}

            {activeTab === 'search' && (
              <View style={{ flex: 1 }}>
                <View style={styles.searchContainer}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder={getTranslation('searchUsername')}
                    placeholderTextColor={COLORS.text.muted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={searchUsers}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.searchButton}
                    onPress={searchUsers}
                  >
                    <Ionicons name="search" size={24} color={COLORS.text.primary} />
                  </TouchableOpacity>
                </View>
                
                {loading ? (
                  <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
                ) : (
                  <FlatList
                    data={searchResults}
                    renderItem={renderSearchItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={
                      searchQuery.length >= 2 && (
                        <Text style={styles.emptyText}>
                          {getTranslation('noUsersFound')}
                        </Text>
                      )
                    }
                  />
                )}
              </View>
            )}

            {activeTab === 'requests' && (
              <ScrollView contentContainerStyle={styles.requestsContainer}>
                {pendingRequests.incoming.length > 0 && (
                  <View style={styles.requestSection}>
                    <Text style={styles.requestSectionTitle}>
                      {getTranslation('incomingRequests')}
                    </Text>
                    {pendingRequests.incoming.map(request => (
                      <View key={request.id}>
                        {renderRequestItem({ item: request, type: 'incoming' })}
                      </View>
                    ))}
                  </View>
                )}
                
                {pendingRequests.outgoing.length > 0 && (
                  <View style={styles.requestSection}>
                    <Text style={styles.requestSectionTitle}>
                      {getTranslation('sentRequests')}
                    </Text>
                    {pendingRequests.outgoing.map(request => (
                      <View key={request.id}>
                        {renderRequestItem({ item: request, type: 'outgoing' })}
                      </View>
                    ))}
                  </View>
                )}
                
                {pendingRequests.incoming.length === 0 && pendingRequests.outgoing.length === 0 && (
                  <Text style={styles.emptyText}>
                    {getTranslation('noPendingRequests')}
                  </Text>
                )}
              </ScrollView>
            )}
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  leaderboardButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontWeight: '600',
  },
  activeTabText: {
    color: COLORS.primary,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border.default,
  },
  friendInfo: {
    flex: 1,
  },
  friendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  friendStats: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 4,
  },
  friendActions: {
    flexDirection: 'row',
    gap: 10,
  },
  inviteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text.primary,
    borderWidth: 1,
    borderColor: COLORS.border.default,
  },
  searchButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border.default,
  },
  searchUsername: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  addButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
  },
  addButtonDisabled: {
    backgroundColor: COLORS.text.muted,
  },
  addButtonText: {
    color: COLORS.text.light,
    fontWeight: '600',
    fontSize: 14,
  },
  requestsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  requestSection: {
    marginBottom: 20,
  },
  requestSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginBottom: 10,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border.default,
  },
  requestUsername: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 10,
  },
  requestButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    backgroundColor: COLORS.success,
  },
  declineButton: {
    backgroundColor: COLORS.error,
  },
  pendingText: {
    color: COLORS.text.muted,
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.text.secondary,
    fontSize: 16,
    marginTop: 40,
  },
  loginPrompt: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loginPromptText: {
    fontSize: 18,
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  loginButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
  },
  loginButtonText: {
    color: COLORS.text.light,
    fontSize: 16,
    fontWeight: '600',
  },
});