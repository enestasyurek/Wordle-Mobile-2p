import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Animated,
  StyleSheet,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { commonStyles } from '../utils/styles';
import { COLORS } from '../utils/colors';
import { useLanguage } from '../contexts/LanguageContext';
import { useGame } from '../contexts/GameContext';
import soundManager from '../utils/soundManager';

const { width: screenWidth } = Dimensions.get('window');

export default function GameModeScreen() {
  const navigation = useNavigation();
  const { getTranslation } = useLanguage();
  const { setWordLength, startNewSinglePlayerRound, setGameState } = useGame();
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const buttonAnimations = useRef([3, 4, 5, 6].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Initial animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Stagger button animations
    const animations = buttonAnimations.map((anim, index) => 
      Animated.spring(anim, {
        toValue: 1,
        delay: index * 100,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      })
    );
    
    Animated.stagger(100, animations).start();
  }, []);

  const handleSelectWordLength = (length) => {
    soundManager.playHaptic('medium');
    soundManager.playSound('submit');
    
    const socket = global.socketInstance;
    if (!socket || !socket.connected) {
      console.error('Socket not available for single player game');
      return;
    }
    
    setWordLength(length);
    setGameState('game');
    navigation.navigate('Game');
    
    // Request single player game from server
    setTimeout(() => {
      if (socket && socket.connected) {
        socket.emit('createSinglePlayerGame', { wordLength: length }, (response) => {
          if (!response.success) {
            console.error('Failed to start single player game:', response.message);
          }
        });
      }
    }, 100);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={COLORS.background}
      />
      <LinearGradient
        colors={[COLORS.background, COLORS.darkBg]}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={commonStyles.safeArea}>
          <Animated.View 
            style={{
              flex: 1,
              opacity: fadeAnim,
            }}
          >
            <ScrollView 
              contentContainerStyle={{ flexGrow: 1 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={handleBack}
                  activeOpacity={0.7}
                >
                  <View style={styles.backButtonInner}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
                  </View>
                </TouchableOpacity>
              </View>

              <Animated.View 
                style={[
                  commonStyles.centerContainer,
                  {
                    transform: [{ translateY: slideAnim }],
                  }
                ]}
              >
                {/* Title with gradient effect */}
                <View style={styles.titleContainer}>
                  <Text style={[commonStyles.title, styles.title]}>
                    {getTranslation('selectWordLength')}
                  </Text>
                  <Text style={styles.subtitle}>
                    {getTranslation('chooseYourChallenge')}
                  </Text>
                </View>

                {/* Word length options */}
                <View style={styles.optionsContainer}>
                  {[3, 4, 5, 6].map((length, index) => (
                    <Animated.View
                      key={length}
                      style={{
                        transform: [
                          {
                            scale: buttonAnimations[index].interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.8, 1],
                            }),
                          },
                        ],
                        opacity: buttonAnimations[index],
                      }}
                    >
                      <TouchableOpacity
                        style={styles.optionButton}
                        onPress={() => handleSelectWordLength(length)}
                        activeOpacity={0.8}
                      >
                        <LinearGradient
                          colors={COLORS.gradient.primary}
                          style={styles.optionGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <View style={styles.optionContent}>
                            <Text style={styles.optionNumber}>{length}</Text>
                            <Text style={styles.optionText}>
                              {getTranslation(`${length}letters`)}
                            </Text>
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>
                    </Animated.View>
                  ))}
                </View>
              </Animated.View>
            </ScrollView>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    padding: 4,
  },
  backButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border.default,
  },
  titleContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  optionsContainer: {
    width: '100%',
    maxWidth: 320,
  },
  optionButton: {
    marginVertical: 10,
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
  optionGradient: {
    paddingVertical: 24,
    paddingHorizontal: 32,
    borderRadius: 16,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.text.dark,
    marginRight: 16,
  },
  optionText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.dark,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});