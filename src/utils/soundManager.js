import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

class SoundManager {
  constructor() {
    this.sounds = {};
    this.soundEnabled = true;
    this.hapticEnabled = true;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    try {
      // Load settings from storage
      const [soundSetting, hapticSetting] = await Promise.all([
        AsyncStorage.getItem('soundEnabled'),
        AsyncStorage.getItem('hapticEnabled'),
      ]);

      this.soundEnabled = soundSetting !== 'false';
      this.hapticEnabled = hapticSetting !== 'false';

      // Configure audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize sound manager:', error);
    }
  }

  async playSound(soundName) {
    if (!this.soundEnabled) return;

    try {
      // For now, we'll use system sounds via haptics
      // In a production app, you'd load actual sound files here
      switch (soundName) {
        case 'keyPress':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'submit':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'correct':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'wrong':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        case 'win':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          await this.playPattern([100, 100, 100]);
          break;
        case 'lose':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        case 'reveal':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'notification':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        default:
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error('Failed to play sound:', soundName, error);
    }
  }

  async playHaptic(type = 'light') {
    if (!this.hapticEnabled) return;

    try {
      switch (type) {
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'warning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'error':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        case 'selection':
          await Haptics.selectionAsync();
          break;
        default:
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error('Failed to play haptic:', type, error);
    }
  }

  async playPattern(pattern) {
    if (!this.hapticEnabled) return;

    try {
      for (let i = 0; i < pattern.length; i++) {
        if (i % 2 === 0) {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        await new Promise(resolve => setTimeout(resolve, pattern[i]));
      }
    } catch (error) {
      console.error('Failed to play haptic pattern:', error);
    }
  }

  async setSoundEnabled(enabled) {
    this.soundEnabled = enabled;
    await AsyncStorage.setItem('soundEnabled', enabled.toString());
  }

  async setHapticEnabled(enabled) {
    this.hapticEnabled = enabled;
    await AsyncStorage.setItem('hapticEnabled', enabled.toString());
  }

  getSoundEnabled() {
    return this.soundEnabled;
  }

  getHapticEnabled() {
    return this.hapticEnabled;
  }
}

export default new SoundManager();