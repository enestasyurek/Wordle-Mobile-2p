import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { COLORS } from '../utils/colors';

const ProfileScreen = ({ navigation }) => {
  const { user, logout, getStats } = useAuth();
  const { language } = useLanguage();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Helper function to get translations
  const t = (key) => translations[language][key] || key;

  const translations = {
    tr: {
      profile: 'Profil',
      statistics: 'İstatistikler',
      totalGames: 'Toplam Oyun',
      wins: 'Kazanma',
      losses: 'Kayıp',
      winRate: 'Kazanma Oranı',
      currentStreak: 'Mevcut Seri',
      bestStreak: 'En İyi Seri',
      avgGuesses: 'Ortalama Tahmin',
      guessDistribution: 'Tahmin Dağılımı',
      wordLengthStats: 'Kelime Uzunluğu İstatistikleri',
      gameModeStats: 'Oyun Modu İstatistikleri',
      singlePlayer: 'Tek Kişilik',
      multiPlayer: 'Çok Oyunculu',
      letters: 'harf',
      games: 'oyun',
      logout: 'Çıkış Yap',
      back: 'Geri',
      noStats: 'Henüz oyun istatistiği yok',
      errorLoadingStats: 'İstatistikler yüklenirken hata oluştu',
      logoutConfirm: 'Çıkış yapmak istediğinizden emin misiniz?',
      cancel: 'İptal'
    },
    en: {
      profile: 'Profile',
      statistics: 'Statistics',
      totalGames: 'Total Games',
      wins: 'Wins',
      losses: 'Losses',
      winRate: 'Win Rate',
      currentStreak: 'Current Streak',
      bestStreak: 'Best Streak',
      avgGuesses: 'Average Guesses',
      guessDistribution: 'Guess Distribution',
      wordLengthStats: 'Word Length Statistics',
      gameModeStats: 'Game Mode Statistics',
      singlePlayer: 'Single Player',
      multiPlayer: 'Multiplayer',
      letters: 'letters',
      games: 'games',
      logout: 'Logout',
      back: 'Back',
      noStats: 'No game statistics yet',
      errorLoadingStats: 'Error loading statistics',
      logoutConfirm: 'Are you sure you want to logout?',
      cancel: 'Cancel'
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const statsData = await getStats();
        setStats(statsData);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user, getStats]);

  const handleLogout = () => {
    Alert.alert(
      t('logout'),
      t('logoutConfirm'),
      [
        {
          text: t('cancel'),
          style: 'cancel'
        },
        {
          text: t('logout'),
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          }
        }
      ]
    );
  };

  const renderGuessDistribution = () => {
    if (!stats || stats.totalGames === 0) return null;

    const maxCount = Math.max(...Object.values(stats.guessDistribution));
    
    return (
      <View style={styles.distributionContainer}>
        {[1, 2, 3, 4, 5, 6].map(num => {
          const count = stats.guessDistribution[num] || 0;
          const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
          
          return (
            <View key={num} style={styles.distributionRow}>
              <Text style={styles.distributionNumber}>{num}</Text>
              <View style={styles.distributionBarContainer}>
                <View
                  style={[
                    styles.distributionBar,
                    { width: `${percentage}%` }
                  ]}
                >
                  {count > 0 && (
                    <Text style={styles.distributionCount}>{count}</Text>
                  )}
                </View>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderWordLengthStats = () => {
    if (!stats) return null;

    return (
      <View style={styles.gridContainer}>
        {[3, 4, 5, 6].map(length => {
          const lengthStats = stats.wordLengthStats[length];
          const winRate = lengthStats.games > 0 
            ? ((lengthStats.wins / lengthStats.games) * 100).toFixed(0)
            : 0;
          
          return (
            <View key={length} style={styles.gridItem}>
              <Text style={styles.gridItemNumber}>{length}</Text>
              <Text style={styles.gridItemLabel}>{t('letters')}</Text>
              <View style={styles.gridItemStats}>
                <Text style={styles.gridItemStat}>
                  {lengthStats.games} {t('games')}
                </Text>
                <Text style={[styles.gridItemStat, styles.gridItemWinRate]}>
                  {winRate}% {t('winRate')}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>{t('back')}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t('profile')}</Text>
          <TouchableOpacity onPress={handleLogout}>
            <Text style={styles.logoutButton}>{t('logout')}</Text>
          </TouchableOpacity>
        </View>

        {/* User Info */}
        <View style={styles.userInfo}>
          <Text style={styles.username}>{user?.username}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {/* Statistics */}
        {stats && stats.totalGames > 0 ? (
          <>
            {/* Main Stats */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('statistics')}</Text>
              
              <View style={styles.mainStatsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.totalGames}</Text>
                  <Text style={styles.statLabel}>{t('totalGames')}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, styles.winRateValue]}>
                    {stats.winPercentage}%
                  </Text>
                  <Text style={styles.statLabel}>{t('winRate')}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, styles.streakValue]}>
                    {stats.currentStreak}
                  </Text>
                  <Text style={styles.statLabel}>{t('currentStreak')}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, styles.bestStreakValue]}>
                    {stats.maxStreak}
                  </Text>
                  <Text style={styles.statLabel}>{t('bestStreak')}</Text>
                </View>
              </View>

              {/* Win/Loss Stats */}
              <View style={styles.winLossContainer}>
                <View style={styles.winLossItem}>
                  <Text style={[styles.winLossValue, styles.winsValue]}>
                    {stats.wins}
                  </Text>
                  <Text style={styles.winLossLabel}>{t('wins')}</Text>
                </View>
                <View style={styles.winLossItem}>
                  <Text style={[styles.winLossValue, styles.lossesValue]}>
                    {stats.losses}
                  </Text>
                  <Text style={styles.winLossLabel}>{t('losses')}</Text>
                </View>
                <View style={styles.winLossItem}>
                  <Text style={[styles.winLossValue, styles.avgValue]}>
                    {stats.averageGuesses}
                  </Text>
                  <Text style={styles.winLossLabel}>{t('avgGuesses')}</Text>
                </View>
              </View>
            </View>

            {/* Guess Distribution */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('guessDistribution')}</Text>
              {renderGuessDistribution()}
            </View>

            {/* Word Length Stats */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('wordLengthStats')}</Text>
              {renderWordLengthStats()}
            </View>

            {/* Game Mode Stats */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('gameModeStats')}</Text>
              <View style={styles.gameModeContainer}>
                <View style={styles.gameModeItem}>
                  <Text style={styles.gameModeTitle}>{t('singlePlayer')}</Text>
                  <Text style={styles.gameModeGames}>
                    {stats.singlePlayerStats.games} {t('games')}
                  </Text>
                  <Text style={styles.gameModeWinRate}>
                    {stats.singlePlayerStats.games > 0 
                      ? ((stats.singlePlayerStats.wins / stats.singlePlayerStats.games) * 100).toFixed(0)
                      : 0}% {t('winRate')}
                  </Text>
                </View>
                
                <View style={styles.gameModeItem}>
                  <Text style={styles.gameModeTitle}>{t('multiPlayer')}</Text>
                  <Text style={styles.gameModeGames}>
                    {stats.multiPlayerStats.games} {t('games')}
                  </Text>
                  <Text style={styles.gameModeWinRate}>
                    {stats.multiPlayerStats.games > 0 
                      ? ((stats.multiPlayerStats.wins / stats.multiPlayerStats.games) * 100).toFixed(0)
                      : 0}% {t('winRate')}
                  </Text>
                </View>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.noStatsContainer}>
            <Text style={styles.noStatsText}>{t('noStats')}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    color: COLORS.text.secondary,
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  logoutButton: {
    color: COLORS.error,
    fontSize: 16,
  },
  userInfo: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.default,
  },
  username: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.default,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  mainStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
    marginBottom: 16,
  },
  statItem: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 4,
  },
  winRateValue: {
    color: COLORS.correct,
  },
  streakValue: {
    color: COLORS.primary,
  },
  bestStreakValue: {
    color: '#A78BFA',
  },
  winLossContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  winLossItem: {
    alignItems: 'center',
  },
  winLossValue: {
    fontSize: 24,
    fontWeight: '600',
  },
  winLossLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 4,
  },
  winsValue: {
    color: COLORS.correct,
  },
  lossesValue: {
    color: COLORS.error,
  },
  avgValue: {
    color: COLORS.primary,
  },
  distributionContainer: {
    marginTop: 8,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  distributionNumber: {
    width: 20,
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  distributionBarContainer: {
    flex: 1,
    height: 24,
    backgroundColor: COLORS.empty,
    borderRadius: 4,
    marginLeft: 8,
    overflow: 'hidden',
  },
  distributionBar: {
    height: '100%',
    backgroundColor: COLORS.correct,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  distributionCount: {
    fontSize: 12,
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  gridItem: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  gridItemNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
  },
  gridItemLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  gridItemStats: {
    backgroundColor: COLORS.empty,
    borderRadius: 8,
    padding: 12,
  },
  gridItemStat: {
    fontSize: 12,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  gridItemWinRate: {
    color: COLORS.correct,
    fontWeight: '600',
    marginTop: 4,
  },
  gameModeContainer: {
    flexDirection: 'row',
    marginHorizontal: -8,
  },
  gameModeItem: {
    flex: 1,
    paddingHorizontal: 8,
    backgroundColor: COLORS.empty,
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 4,
  },
  gameModeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  gameModeGames: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  gameModeWinRate: {
    fontSize: 14,
    color: COLORS.correct,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  noStatsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  noStatsText: {
    fontSize: 16,
    color: COLORS.text.secondary,
  },
});

export default ProfileScreen;