import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { COLORS } from '../utils/colors';

const LoginScreen = ({ navigation }) => {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, register } = useAuth();
  const { language, getTranslation } = useLanguage();

  const translations = {
    tr: {
      login: 'Giriş Yap',
      register: 'Kayıt Ol',
      username: 'Kullanıcı Adı',
      email: 'E-posta',
      password: 'Şifre',
      confirmPassword: 'Şifre Tekrar',
      noAccount: 'Hesabınız yok mu?',
      hasAccount: 'Zaten hesabınız var mı?',
      loginButton: 'Giriş Yap',
      registerButton: 'Kayıt Ol',
      loading: 'Yükleniyor...',
      usernameRequired: 'Kullanıcı adı gereklidir',
      emailRequired: 'E-posta gereklidir',
      passwordRequired: 'Şifre gereklidir',
      passwordMismatch: 'Şifreler eşleşmiyor',
      invalidEmail: 'Geçerli bir e-posta adresi girin',
      passwordTooShort: 'Şifre en az 6 karakter olmalıdır',
      usernameTooShort: 'Kullanıcı adı en az 3 karakter olmalıdır',
      usernameInvalid: 'Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir',
      continueAsGuest: 'Misafir olarak devam et',
      skip: 'Atla'
    },
    en: {
      login: 'Login',
      register: 'Register',
      username: 'Username',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      noAccount: "Don't have an account?",
      hasAccount: 'Already have an account?',
      loginButton: 'Login',
      registerButton: 'Register',
      loading: 'Loading...',
      usernameRequired: 'Username is required',
      emailRequired: 'Email is required',
      passwordRequired: 'Password is required',
      passwordMismatch: 'Passwords do not match',
      invalidEmail: 'Please enter a valid email',
      passwordTooShort: 'Password must be at least 6 characters',
      usernameTooShort: 'Username must be at least 3 characters',
      usernameInvalid: 'Username can only contain letters, numbers, and underscores',
      continueAsGuest: 'Continue as guest',
      skip: 'Skip'
    }
  };

  // Helper function to get translations from local translations object
  const t = (key, translationsObj = translations) => {
    return translationsObj[language]?.[key] || translationsObj['en']?.[key] || key;
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = t('usernameRequired');
    } else if (formData.username.length < 3) {
      newErrors.username = t('usernameTooShort');
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = t('usernameInvalid');
    }
    
    if (mode === 'register') {
      if (!formData.email.trim()) {
        newErrors.email = t('emailRequired');
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = t('invalidEmail');
      }
    }
    
    if (!formData.password) {
      newErrors.password = t('passwordRequired');
    } else if (formData.password.length < 6) {
      newErrors.password = t('passwordTooShort');
    }
    
    if (mode === 'register' && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('passwordMismatch');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    
    setIsLoading(true);
    
    try {
      let result;
      if (mode === 'login') {
        result = await login(formData.username, formData.password);
      } else {
        result = await register(formData.username, formData.email, formData.password);
      }
      
      if (result.success) {
        // Add a small delay to ensure socket reconnects with the new token
        setTimeout(() => {
          navigation.navigate('Home');
        }, 100);
      } else {
        Alert.alert(
          mode === 'login' ? 'Login Failed' : 'Registration Failed',
          result.error
        );
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setErrors({});
  };

  const continueAsGuest = () => {
    navigation.navigate('Home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>{t(mode)}</Text>
            <TouchableOpacity onPress={continueAsGuest} style={styles.skipButton}>
              <Text style={styles.skipText}>{t('skip')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            {errors.general && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errors.general}</Text>
              </View>
            )}
            
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, errors.username && styles.inputError]}
                placeholder={t('username')}
                placeholderTextColor={COLORS.text.secondary}
                value={formData.username}
                onChangeText={(value) => handleInputChange('username', value)}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              {errors.username && (
                <Text style={styles.errorText}>{errors.username}</Text>
              )}
            </View>
            
            {mode === 'register' && (
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder={t('email')}
                  placeholderTextColor={COLORS.text.secondary}
                  value={formData.email}
                  onChangeText={(value) => handleInputChange('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                {errors.email && (
                  <Text style={styles.errorText}>{errors.email}</Text>
                )}
              </View>
            )}
            
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, errors.password && styles.inputError]}
                placeholder={t('password')}
                placeholderTextColor={COLORS.text.secondary}
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>
            
            {mode === 'register' && (
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, errors.confirmPassword && styles.inputError]}
                  placeholder={t('confirmPassword')}
                  placeholderTextColor={COLORS.text.secondary}
                  value={formData.confirmPassword}
                  onChangeText={(value) => handleInputChange('confirmPassword', value)}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                {errors.confirmPassword && (
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                )}
              </View>
            )}
            
            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.background} />
              ) : (
                <Text style={styles.submitButtonText}>
                  {t(`${mode}Button`)}
                </Text>
              )}
            </TouchableOpacity>
            
            <View style={styles.footer}>
              <TouchableOpacity onPress={switchMode}>
                <Text style={styles.switchText}>
                  {mode === 'login' ? t('noAccount') : t('hasAccount')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={continueAsGuest} style={styles.guestButton}>
                <Text style={styles.guestText}>{t('continueAsGuest')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  skipButton: {
    padding: 10,
  },
  skipText: {
    color: COLORS.primary,
    fontSize: 16,
  },
  form: {
    width: '100%',
  },
  errorContainer: {
    backgroundColor: COLORS.error + '20',
    borderColor: COLORS.error,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: COLORS.empty,
    borderColor: COLORS.border.default,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text.primary,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: COLORS.background,
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
  },
  switchText: {
    color: COLORS.primary,
    fontSize: 14,
    marginBottom: 16,
  },
  guestButton: {
    marginTop: 8,
  },
  guestText: {
    color: COLORS.text.secondary,
    fontSize: 14,
  },
});

export default LoginScreen;