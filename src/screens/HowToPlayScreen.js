import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { commonStyles } from '../utils/styles';
import { COLORS } from '../utils/colors';
import { useLanguage } from '../contexts/LanguageContext';
import Tile from '../components/Tile';

export default function HowToPlayScreen() {
  const navigation = useNavigation();
  const { getTranslation, language } = useLanguage();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
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
  }, []);

  const exampleWord = language === 'tr' ? 'KALEM' : 'WORLD';
  const exampleFeedback = ['correct', 'absent', 'present', 'absent', 'absent'];

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
              transform: [{ translateY: slideAnim }],
            }}
          >
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingTop: 10,
              paddingBottom: 20,
            }}>
              <TouchableOpacity
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: COLORS.surface,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: COLORS.border.default,
                }}
                onPress={handleBack}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
              </TouchableOpacity>
              <Text style={{
                fontSize: 20,
                fontWeight: '700',
                color: COLORS.text.primary,
              }}>
                {getTranslation('howToPlay')}
              </Text>
              <View style={{ width: 44 }} />
            </View>
            
            <ScrollView 
              contentContainerStyle={{ padding: 20, paddingTop: 0 }}
              showsVerticalScrollIndicator={false}
            >

        <Text style={[commonStyles.title, { marginTop: 20, textAlign: 'center' }]}>
          {getTranslation('howToPlayTitle')}
        </Text>

        <View style={{
          backgroundColor: COLORS.surface,
          borderRadius: 16,
          padding: 20,
          marginTop: 20,
          borderWidth: 1,
          borderColor: COLORS.border.default,
        }}>
          <Text style={[commonStyles.subtitle, { marginBottom: 12 }]}>{getTranslation('guessTheWord')}</Text>
          <Text style={[commonStyles.text, { color: COLORS.text.secondary }]}>
            {getTranslation('youHave6Tries', { tries: 6 })}
          </Text>
        </View>

        <View style={{
          backgroundColor: COLORS.surface,
          borderRadius: 16,
          padding: 20,
          marginTop: 20,
          borderWidth: 1,
          borderColor: COLORS.border.default,
        }}>
          <Text style={[commonStyles.subtitle, { marginBottom: 16, textAlign: 'center' }]}>{getTranslation('afterEachGuess')}</Text>
          
          <View style={{ marginTop: 10 }}>
            <Text style={[commonStyles.text, { marginBottom: 16, textAlign: 'center', color: COLORS.text.secondary }]}>
              {getTranslation('example')}:
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 20 }}>
              {exampleWord.split('').map((letter, index) => (
                <Tile
                  key={index}
                  letter={letter}
                  status={exampleFeedback[index]}
                  isRevealing={false}
                />
              ))}
            </View>
          </View>

          <View>
            <View style={[commonStyles.row, { marginVertical: 12, alignItems: 'center' }]}>
              <View style={{
                width: 32,
                height: 32,
                backgroundColor: COLORS.correct,
                marginRight: 16,
                borderRadius: 6,
                shadowColor: COLORS.shadow,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 3,
              }} />
              <Text style={[commonStyles.text, { flex: 1, color: COLORS.text.secondary }]}>{getTranslation('greenExplanation')}</Text>
            </View>

            <View style={[commonStyles.row, { marginVertical: 12, alignItems: 'center' }]}>
              <View style={{
                width: 32,
                height: 32,
                backgroundColor: COLORS.present,
                marginRight: 16,
                borderRadius: 6,
                shadowColor: COLORS.shadow,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 3,
              }} />
              <Text style={[commonStyles.text, { flex: 1, color: COLORS.text.secondary }]}>{getTranslation('yellowExplanation')}</Text>
            </View>

            <View style={[commonStyles.row, { marginVertical: 12, alignItems: 'center' }]}>
              <View style={{
                width: 32,
                height: 32,
                backgroundColor: COLORS.absent,
                marginRight: 16,
                borderRadius: 6,
                shadowColor: COLORS.shadow,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 3,
              }} />
              <Text style={[commonStyles.text, { flex: 1, color: COLORS.text.secondary }]}>{getTranslation('grayExplanation')}</Text>
            </View>
          </View>
        </View>

        <View style={{
          backgroundColor: COLORS.surface,
          borderRadius: 16,
          padding: 20,
          marginTop: 20,
          borderWidth: 1,
          borderColor: COLORS.border.default,
        }}>
          <Text style={[commonStyles.subtitle, { marginBottom: 12 }]}>{getTranslation('inSinglePlayer')}</Text>
          <Text style={[commonStyles.text, { color: COLORS.text.secondary }]}>
            {getTranslation('singlePlayerRules')}
          </Text>
        </View>

        <View style={{
          backgroundColor: COLORS.surface,
          borderRadius: 16,
          padding: 20,
          marginTop: 16,
          borderWidth: 1,
          borderColor: COLORS.border.default,
        }}>
          <Text style={[commonStyles.subtitle, { marginBottom: 12 }]}>{getTranslation('inTwoPlayer')}</Text>
          <Text style={[commonStyles.text, { color: COLORS.text.secondary }]}>
            {getTranslation('twoPlayerRules')}
          </Text>
        </View>

        <TouchableOpacity
          style={{
            marginTop: 30,
            marginBottom: 20,
            borderRadius: 12,
            overflow: 'hidden',
            shadowColor: COLORS.shadow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
          onPress={handleBack}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={COLORS.gradient.primary}
            style={{
              paddingVertical: 16,
              paddingHorizontal: 32,
              alignItems: 'center',
            }}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={{
              fontSize: 16,
              fontWeight: '700',
              color: COLORS.text.dark,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}>
              {getTranslation('understood')}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
}