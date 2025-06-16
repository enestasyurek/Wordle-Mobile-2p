// Import colors from separate file
export { COLORS } from './colors';

// API URL - should match the server URL in SocketContext
export const API_URL = __DEV__ ? 'https://twopwordle-server.onrender.com' : 'https://twopwordle-server.onrender.com';

export const ANIMATION_DURATIONS = {
  shake: 600,
  bounce: 1000,
  flip: 300,
  reveal: 300,
};

export const BOARD_SIZES = {
  maxGuesses: 6,
  tileSize: 58,
  gap: 5,
};

export const KEYBOARD_CONFIG = {
  keyHeight: 58,
  keyWidth: {
    regular: 31,
    wide: 65,
  },
  gap: 6,
};