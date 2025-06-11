import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import * as Application from 'expo-application';
import { commonStyles } from '../utils/styles';
import { COLORS } from '../utils/colors';
import { useLanguage } from '../contexts/LanguageContext';
import soundManager from '../utils/soundManager';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { getTranslation, language, setLanguage } = useLanguage();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setSoundEnabled(soundManager.getSoundEnabled());
    setHapticEnabled(soundManager.getHapticEnabled());
    
    const notifSetting = await AsyncStorage.getItem('notificationsEnabled');
    setNotificationsEnabled(notifSetting !== 'false');
  };

  const handleSoundToggle = async (value) => {
    setSoundEnabled(value);
    await soundManager.setSoundEnabled(value);
    if (value) {
      soundManager.playSound('keyPress');
    }
  };

  const handleHapticToggle = async (value) => {
    setHapticEnabled(value);
    await soundManager.setHapticEnabled(value);
    if (value) {
      soundManager.playHaptic('medium');
    }
  };

  const handleNotificationsToggle = async (value) => {
    setNotificationsEnabled(value);
    await AsyncStorage.setItem('notificationsEnabled', value.toString());
  };

  const handleClearData = () => {
    Alert.alert(
      getTranslation('clearDataTitle'),
      getTranslation('clearDataMessage'),
      [
        {
          text: getTranslation('cancel'),
          style: 'cancel',
        },
        {
          text: getTranslation('clear'),
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            soundManager.playSound('notification');
            Alert.alert(
              getTranslation('success'),
              getTranslation('dataCleared'),
              [{ text: getTranslation('ok') }]
            );
          },
        },
      ]
    );
  };

  const handleRateApp = async () => {
    if (await StoreReview.hasAction()) {
      StoreReview.requestReview();
    } else {
      // Fallback to store URL
      const storeUrl = Platform.select({
        ios: 'https://apps.apple.com/app/id[YOUR_APP_ID]',
        android: 'https://play.google.com/store/apps/details?id=com.yourcompany.kelimesavasi',
      });
      Linking.openURL(storeUrl);
    }
  };

  const handleShare = () => {
    const message = getTranslation('shareMessage');
    const url = Platform.select({
      ios: 'https://apps.apple.com/app/id[YOUR_APP_ID]',
      android: 'https://play.google.com/store/apps/details?id=com.yourcompany.kelimesavasi',
    });
    
    if (Platform.OS === 'ios') {
      Linking.openURL(`sms:&body=${message} ${url}`);
    } else {
      Linking.openURL(`sms:?body=${message} ${url}`);
    }
  };

  const settingGroups = [
    {
      title: getTranslation('preferences'),
      settings: [
        {
          icon: 'language',
          title: getTranslation('language'),
          value: language === 'tr' ? 'Türkçe' : 'English',
          onPress: () => setLanguage(language === 'tr' ? 'en' : 'tr'),
        },
        {
          icon: 'volume-high',
          title: getTranslation('soundEffects'),
          value: soundEnabled,
          isSwitch: true,
          onValueChange: handleSoundToggle,
        },
        {
          icon: 'phone-portrait',
          title: getTranslation('hapticFeedback'),
          value: hapticEnabled,
          isSwitch: true,
          onValueChange: handleHapticToggle,
        },
        {
          icon: 'notifications',
          title: getTranslation('notifications'),
          value: notificationsEnabled,
          isSwitch: true,
          onValueChange: handleNotificationsToggle,
        },
      ],
    },
    {
      title: getTranslation('about'),
      settings: [
        {
          icon: 'star',
          title: getTranslation('rateApp'),
          onPress: handleRateApp,
        },
        {
          icon: 'share-social',
          title: getTranslation('shareApp'),
          onPress: handleShare,
        },
        {
          icon: 'document-text',
          title: getTranslation('privacyPolicy'),
          onPress: () => Linking.openURL('https://example.com/privacy'),
        },
        {
          icon: 'shield-checkmark',
          title: getTranslation('termsOfService'),
          onPress: () => Linking.openURL('https://example.com/terms'),
        },
      ],
    },
    {
      title: getTranslation('data'),
      settings: [
        {
          icon: 'trash',
          title: getTranslation('clearData'),
          onPress: handleClearData,
          isDestructive: true,
        },
      ],
    },
  ];

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
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{getTranslation('settings')}</Text>
            <View style={{ width: 44 }} />
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {settingGroups.map((group, groupIndex) => (
              <View key={groupIndex} style={styles.settingGroup}>
                <Text style={styles.groupTitle}>{group.title}</Text>
                <View style={styles.settingsCard}>
                  {group.settings.map((setting, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.settingItem,
                        index < group.settings.length - 1 && styles.settingItemBorder,
                      ]}
                      onPress={setting.onPress}
                      activeOpacity={setting.isSwitch ? 1 : 0.7}
                      disabled={setting.isSwitch}
                    >
                      <View style={styles.settingLeft}>
                        <View style={[
                          styles.iconContainer,
                          setting.isDestructive && styles.destructiveIcon,
                        ]}>
                          <Ionicons
                            name={setting.icon}
                            size={20}
                            color={setting.isDestructive ? COLORS.error : COLORS.primary}
                          />
                        </View>
                        <Text style={[
                          styles.settingTitle,
                          setting.isDestructive && styles.destructiveText,
                        ]}>
                          {setting.title}
                        </Text>
                      </View>
                      <View style={styles.settingRight}>
                        {setting.isSwitch ? (
                          <Switch
                            value={setting.value}
                            onValueChange={setting.onValueChange}
                            trackColor={{
                              false: COLORS.border.default,
                              true: COLORS.primary,
                            }}
                            thumbColor={Platform.OS === 'ios' ? undefined : COLORS.text.light}
                            ios_backgroundColor={COLORS.border.default}
                          />
                        ) : (
                          <>
                            {setting.value && (
                              <Text style={styles.settingValue}>{setting.value}</Text>
                            )}
                            <Ionicons
                              name="chevron-forward"
                              size={20}
                              color={COLORS.text.muted}
                            />
                          </>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}

            <View style={styles.footer}>
              <Text style={styles.version}>
                {getTranslation('version')} {Application.nativeApplicationVersion || '1.0.0'}
              </Text>
              <Text style={styles.buildNumber}>
                {getTranslation('build')} {Application.nativeBuildVersion || '1'}
              </Text>
            </View>
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
  
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  
  settingGroup: {
    marginBottom: 24,
  },
  
  groupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.muted,
    marginBottom: 12,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  settingsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border.default,
    overflow: 'hidden',
  },
  
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 56,
  },
  
  settingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.default,
  },
  
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  
  destructiveIcon: {
    backgroundColor: COLORS.error + '15',
  },
  
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  
  destructiveText: {
    color: COLORS.error,
  },
  
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  settingValue: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginRight: 8,
  },
  
  footer: {
    alignItems: 'center',
    marginTop: 32,
  },
  
  version: {
    fontSize: 14,
    color: COLORS.text.muted,
    marginBottom: 4,
  },
  
  buildNumber: {
    fontSize: 12,
    color: COLORS.text.muted,
  },
};