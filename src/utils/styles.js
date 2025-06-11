import { StyleSheet, Platform, Dimensions } from 'react-native';
import { COLORS } from './colors';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive font sizes
const responsiveFontSize = (size) => {
  const scale = screenWidth / 375; // Based on iPhone 11 Pro
  const newSize = size * scale;
  return Math.round(newSize);
};

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  
  screenContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 0 : 10,
  },
  
  // Typography
  title: {
    fontSize: responsiveFontSize(36),
    fontWeight: '800',
    color: COLORS.text.primary,
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: -0.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  
  subtitle: {
    fontSize: responsiveFontSize(24),
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  
  text: {
    fontSize: responsiveFontSize(16),
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  
  textSmall: {
    fontSize: responsiveFontSize(14),
    color: COLORS.text.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  textLarge: {
    fontSize: responsiveFontSize(18),
    color: COLORS.text.primary,
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: '500',
  },
  
  // Buttons
  button: {
    backgroundColor: COLORS.button.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginVertical: 8,
    minWidth: 200,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  
  buttonPressed: {
    backgroundColor: COLORS.button.primaryHover,
    transform: [{ scale: 0.98 }],
  },
  
  buttonSecondary: {
    backgroundColor: COLORS.button.secondary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginVertical: 8,
    minWidth: 200,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  
  buttonOutline: {
    backgroundColor: 'transparent',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginVertical: 8,
    minWidth: 200,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.button.outline,
  },
  
  buttonSmall: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    minWidth: 100,
  },
  
  buttonText: {
    color: COLORS.text.dark,
    fontSize: responsiveFontSize(16),
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  
  buttonTextOutline: {
    color: COLORS.text.primary,
    fontSize: responsiveFontSize(16),
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  
  // Input
  input: {
    borderWidth: 2,
    borderColor: COLORS.border.default,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: responsiveFontSize(16),
    backgroundColor: COLORS.surface,
    marginVertical: 10,
    minWidth: 200,
    color: COLORS.text.primary,
    fontWeight: '500',
  },
  
  inputFocused: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  
  // Cards
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 24,
    marginVertical: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: COLORS.border.default,
  },
  
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  // Layout
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  column: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  
  divider: {
    height: 1,
    backgroundColor: COLORS.border.default,
    marginVertical: 20,
    opacity: 0.5,
  },
  
  // Modal
  modal: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    maxWidth: '90%',
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: COLORS.border.default,
  },
  
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  modalTitle: {
    fontSize: responsiveFontSize(24),
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  
  modalContent: {
    flex: 1,
    paddingVertical: 10,
  },
  
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.default,
  },
  
  // Game specific
  gameContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 10,
  },
  
  boardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  
  keyboardContainer: {
    paddingHorizontal: 8,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    backgroundColor: COLORS.background,
  },
  
  // Status bar
  statusBar: {
    backgroundColor: COLORS.darkBg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.default,
  },
  
  // Animations
  animatedPressable: {
    transform: [{ scale: 1 }],
  },
  
  // Badges
  badge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  badgeText: {
    color: COLORS.text.dark,
    fontSize: responsiveFontSize(12),
    fontWeight: '700',
  },
  
  // Icon buttons
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border.default,
  },
  
  iconButtonPressed: {
    backgroundColor: COLORS.border.default,
    transform: [{ scale: 0.95 }],
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  
  // Error
  errorContainer: {
    backgroundColor: COLORS.error,
    padding: 16,
    borderRadius: 12,
    marginVertical: 10,
  },
  
  errorText: {
    color: COLORS.text.light,
    fontSize: responsiveFontSize(14),
    textAlign: 'center',
  },
  
  // Success
  successContainer: {
    backgroundColor: COLORS.success,
    padding: 16,
    borderRadius: 12,
    marginVertical: 10,
  },
  
  successText: {
    color: COLORS.text.dark,
    fontSize: responsiveFontSize(14),
    textAlign: 'center',
    fontWeight: '600',
  },
});

// Component specific styles
export const gameStyles = StyleSheet.create({
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border.default,
  },
  
  scoreItem: {
    alignItems: 'center',
  },
  
  scoreLabel: {
    fontSize: responsiveFontSize(12),
    color: COLORS.text.muted,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  scoreValue: {
    fontSize: responsiveFontSize(24),
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  
  timerContainer: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    alignSelf: 'center',
    marginVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border.default,
  },
  
  timerText: {
    fontSize: responsiveFontSize(18),
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  
  timerTextWarning: {
    color: COLORS.timer.warning,
  },
  
  timerTextCritical: {
    color: COLORS.timer.critical,
  },
});