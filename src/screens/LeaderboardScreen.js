import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
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

const API_URL = __DEV__ ? 'https://twopwordle-server.onrender.com' : 'https://twopwordle-server.onrender.com';

export default function LeaderboardScreen() {
  const navigation = useNavigation();
  const { language, getTranslation } = useLanguage();
  const { user, token } = useAuth();
  
  const [activeTab, setActiveTab] = useState('global'); // global, friends
  const [period, setPeriod] = useState('all'); // all, daily, weekly, monthly
  const [globalLeaderboard, setGlobalLeaderboard] = useState([]);
  const [friendsLeaderboard, setFriendsLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
  }, [activeTab, period]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'global') {
        const response = await axios.get(`${API_URL}/api/leaderboard/global`, {
          params: { period, limit: 100 }
        });
        
        if (response.data.success) {
          setGlobalLeaderboard(response.data.data.leaderboard);
          
          // Find user's rank if logged in
          if (user) {
            const userEntry = response.data.data.leaderboard.find(
              entry => entry.userId === user.id
            );
            setUserRank(userEntry?.rank || null);
          }
        }
      } else if (activeTab === 'friends' && (token || user)) {
        // Get fresh token from AsyncStorage
        const currentToken = token || await AsyncStorage.getItem('accessToken');
        
        if (!currentToken) {
          console.error('No token available for fetching friends leaderboard');
          return;
        }
        
        const response = await axios.get(`${API_URL}/api/leaderboard/friends`, {
          params: { period },
          headers: { Authorization: `Bearer ${currentToken}` }
        });
        
        if (response.data.success) {
          setFriendsLeaderboard(response.data.data.leaderboard);
          setUserRank(response.data.data.userRank);
        }
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLeaderboard();
    setRefreshing(false);
  }, [activeTab, period]);

  const renderLeaderboardItem = ({ item, index }) => {
    const isCurrentUser = user && item.userId === user.id;
    
    return (
      <View style={[
        styles.leaderboardItem,
        isCurrentUser && styles.currentUserItem,
        index < 3 && styles.topThreeItem
      ]}>
        <View style={styles.rankContainer}>
          {index < 3 ? (
            <View style={[styles.medal, styles[`medal${index + 1}`]]}>
              <Ionicons 
                name="medal" 
                size={24} 
                color={index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32'} 
              />
            </View>
          ) : (
            <Text style={styles.rankText}>{item.rank}</Text>
          )}
        </View>
        
        <View style={styles.playerInfo}>
          <Text style={[styles.playerName, isCurrentUser && styles.currentUserName]}>
            {item.username}
            {isCurrentUser && ` (${getTranslation('you')})`}
          </Text>
          <View style={styles.statsRow}>
            <Text style={styles.statText}>
              {getTranslation('wins').replace('!', ':')} {item.totalWins}
            </Text>
            <Text style={styles.statText}>
              {getTranslation('rate')}:{' '}{Math.round(item.winRate * 100)}%
            </Text>
            {item.currentStreak > 0 && (
              <Text style={styles.statText}>
                🔥 {item.currentStreak}
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>{Math.round(item.score)}</Text>
          <Text style={styles.scoreLabel}>{getTranslation('points')}</Text>
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.periodContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {['all', 'daily', 'weekly', 'monthly'].map(p => (
          <TouchableOpacity
            key={p}
            style={[styles.periodButton, period === p && styles.activePeriodButton]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodText, period === p && styles.activePeriodText]}>
              {p === 'all' ? getTranslation('allTime')
                : p === 'daily' ? getTranslation('daily')
                : p === 'weekly' ? getTranslation('weekly')
                : getTranslation('monthly')}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const data = activeTab === 'global' ? globalLeaderboard : friendsLeaderboard;

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <LinearGradient
        colors={[COLORS.background, COLORS.darkBg]}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={commonStyles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
            </TouchableOpacity>
            <Text style={styles.title}>
              {getTranslation('leaderboard')}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'global' && styles.activeTab]}
              onPress={() => setActiveTab('global')}
            >
              <Text style={[styles.tabText, activeTab === 'global' && styles.activeTabText]}>
                {getTranslation('global')}
              </Text>
            </TouchableOpacity>
            {user && (
              <TouchableOpacity
                style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
                onPress={() => setActiveTab('friends')}
              >
                <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
                  {getTranslation('friends')}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {loading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            <FlatList
              data={data}
              renderItem={renderLeaderboardItem}
              keyExtractor={item => item.userId}
              ListHeaderComponent={renderHeader}
              contentContainerStyle={styles.listContainer}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  {activeTab === 'friends' && !user
                    ? getTranslation('loginToSeeFriendsLeaderboard')
                    : getTranslation('noDataYet')}
                </Text>
              }
              ListFooterComponent={
                userRank && activeTab === 'global' && userRank > 100 && (
                  <View style={styles.userRankFooter}>
                    <Text style={styles.userRankText}>
                      {getTranslation('yourRank')}: {userRank}
                    </Text>
                  </View>
                )
              }
            />
          )}
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
  periodContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.border.default,
  },
  activePeriodButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  periodText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontWeight: '600',
  },
  activePeriodText: {
    color: COLORS.text.light,
  },
  listContainer: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    marginVertical: 5,
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border.default,
  },
  currentUserItem: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  topThreeItem: {
    backgroundColor: COLORS.surface,
  },
  rankContainer: {
    width: 50,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.secondary,
  },
  medal: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerInfo: {
    flex: 1,
    marginLeft: 15,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  currentUserName: {
    color: COLORS.primary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statText: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  scoreLabel: {
    fontSize: 10,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.text.secondary,
    fontSize: 16,
    marginTop: 40,
  },
  userRankFooter: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    marginTop: 10,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  userRankText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
});