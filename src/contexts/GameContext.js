import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useLanguage } from './LanguageContext';

const GameContext = createContext();

const STORAGE_KEYS = {
  PLAYER_NAME: 'wordlePlayerName',
  GAME_STATE: 'wordleGameState',
  SINGLE_PLAYER_STATS: 'singlePlayerStats',
};

export const MAX_GUESSES = 6;
export const DEFAULT_WORD_LENGTH = 5;
export const WIN_SCORE = 5;
export const ALLOWED_WORD_LENGTHS = [3, 4, 5, 6];

const alphabet = {
  tr: 'ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ',
  en: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
};

export const initialKeyboardStatuses = (language = 'tr') => {
  const keys = language === 'en' 
    ? "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('')
    : "ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ".split('');
  
  const statuses = new Map();
  keys.forEach(key => statuses.set(key, 'unused'));
  return statuses;
};

export function GameProvider({ children }) {
  const { language, getTranslation } = useLanguage();
  
  // Game state
  const [gameState, setGameState] = useState('home');
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [players, setPlayers] = useState([]);
  const [myId, setMyId] = useState('');
  const [round, setRound] = useState(1);
  const [wordLength, setWordLength] = useState(5);
  const [roundEndTime, setRoundEndTime] = useState(null);
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [keyboardStatuses, setKeyboardStatuses] = useState(new Map());
  const [isMyInputActive, setIsMyInputActive] = useState(true);
  const [lastRoundResult, setLastRoundResult] = useState(null);
  const [gameWinner, setGameWinner] = useState(null);
  const [notification, setNotification] = useState({ message: '', type: 'info', duration: 3000 });
  const [isLoading, setIsLoading] = useState(false);
  const [singlePlayerMode, setSinglePlayerMode] = useState(false);
  const [currentWord, setCurrentWord] = useState('');

  // Animation states
  const [shakeRowIndex, setShakeRowIndex] = useState(-1);
  const [bounceRowIndex, setBounceRowIndex] = useState(-1);
  const [revealingRow, setRevealingRow] = useState(-1);
  
  // Refs
  const timerRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  // Initialize keyboard with current language
  useEffect(() => {
    setKeyboardStatuses(initialKeyboardStatuses(language));
  }, [language]);

  // Load saved data on mount
  useEffect(() => {
    loadSavedData();
  }, []);
  
  // Save game state when it changes
  useEffect(() => {
    if (gameState === 'game' || gameState === 'roundResult' || gameState === 'lobby') {
      const gameData = {
        name: playerName,
        code: roomCode,
        singlePlayerMode,
        score: players.find(p => p.id === myId)?.score || 0,
        round
      };
      AsyncStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify(gameData));
    } else if (gameState === 'home' || gameState === 'gameOver') {
      AsyncStorage.removeItem(STORAGE_KEYS.GAME_STATE);
    }
  }, [gameState, playerName, roomCode, myId, singlePlayerMode, players, round]);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  const handleAppStateChange = (nextAppState) => {
    if (
      appStateRef.current.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      // App has come to the foreground
      if (gameState === 'game' && roundEndTime) {
        checkTimeExpiry();
      }
    }
    appStateRef.current = nextAppState;
  };

  const loadSavedData = async () => {
    try {
      const savedName = await AsyncStorage.getItem(STORAGE_KEYS.PLAYER_NAME);
      if (savedName) {
        setPlayerName(savedName);
      }
      
      const savedGameState = await AsyncStorage.getItem(STORAGE_KEYS.GAME_STATE);
      if (savedGameState) {
        const parsedState = JSON.parse(savedGameState);
        console.log('Found saved game state:', parsedState);
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  };

  const savePlayerName = async (name) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PLAYER_NAME, name);
    } catch (error) {
      console.error('Error saving player name:', error);
    }
  };

  const showNotification = (message, type = 'info', duration = 3000) => {
    setNotification({ message, type, duration });
    // Vibrate on error notifications
    if (type === 'error') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    setTimeout(() => {
      setNotification({ message: '', type: 'info', duration: 3000 });
    }, duration);
  };

  const triggerShakeAnimation = (rowIndex) => {
    setShakeRowIndex(rowIndex);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setTimeout(() => setShakeRowIndex(-1), 600);
  };

  const triggerBounceAnimation = (rowIndex) => {
    setBounceRowIndex(rowIndex);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setBounceRowIndex(-1), 1000);
  };

  const startRevealAnimation = (rowIndex, callback) => {
    setRevealingRow(rowIndex);
    const animationDuration = wordLength * 300 + 300;
    setTimeout(() => {
      setRevealingRow(-1);
      if (callback) callback();
    }, animationDuration);
  };

  const updateKeyboardStatuses = (guess, feedback) => {
    const newStatuses = new Map(keyboardStatuses);
    const letters = guess.split('');
    
    letters.forEach((letter, index) => {
      const status = feedback[index];
      const currentStatus = newStatuses.get(letter);
      
      // Priority: correct > present > absent > unused
      if (status === 'correct' || 
          (status === 'present' && currentStatus !== 'correct') ||
          (status === 'absent' && currentStatus === 'unused')) {
        newStatuses.set(letter, status);
      }
    });
    
    setKeyboardStatuses(newStatuses);
  };

  const resetGameState = (fullReset = false) => {
    setGuesses([]);
    setCurrentGuess('');
    setKeyboardStatuses(initialKeyboardStatuses(language));
    setIsMyInputActive(true);
    setRoundEndTime(null);
    setLastRoundResult(null);
    setCurrentWord('');
    setShakeRowIndex(-1);
    setBounceRowIndex(-1);
    setRevealingRow(-1);
    
    if (fullReset) {
      setGameState('home');
      setRoomCode('');
      setPlayers([]);
      setMyId('');
      setRound(1);
      setWordLength(5);
      setGameWinner(null);
      setSinglePlayerMode(false);
      AsyncStorage.removeItem(STORAGE_KEYS.GAME_STATE);
    }
  };

  const handleGuessResult = (data) => {
    const { feedback, isCorrect, playerGuess, wordWasCorrect, currentPlayerName } = data;
    
    const newGuess = {
      guess: playerGuess.toUpperCase(),
      feedback,
      isRevealing: true,
      playerName: currentPlayerName
    };
    
    setGuesses(prev => [...prev, newGuess]);
    const currentRowIndex = guesses.length;
    
    startRevealAnimation(currentRowIndex, () => {
      setGuesses(prev => 
        prev.map((g, i) => 
          i === currentRowIndex ? { ...g, isRevealing: false } : g
        )
      );
      
      updateKeyboardStatuses(playerGuess.toUpperCase(), feedback);
      
      if (isCorrect) {
        triggerBounceAnimation(currentRowIndex);
      }
      
      if (wordWasCorrect || guesses.length + 1 >= 6) {
        setIsMyInputActive(false);
      }
    });
  };

  const processRoundResult = (data) => {
    const { winner, correctWord, timedOut, players: updatedPlayers } = data;
    
    setLastRoundResult({ winner, correctWord, timedOut });
    setPlayers(updatedPlayers);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setTimeout(() => {
      setGameState('roundResult');
    }, 2000);
  };

  const submitSinglePlayerGuess = (guess) => {
    if (guess.length !== wordLength) {
      showNotification(getTranslation('wrongLength', { expected: wordLength }), 'error');
      triggerShakeAnimation(guesses.length);
      return;
    }

    const socket = global.socketInstance;
    if (!socket || !socket.connected) {
      console.error('Socket not available for single player guess');
      showNotification('connectionErrorGuessNotSent', 'error');
      return;
    }

    // Use socket.id as room code for single player
    const roomCode = socket.id;
    
    socket.emit('submitSinglePlayerGuess', { 
      roomCode, 
      guess 
    }, (response) => {
      if (!response.success) {
        console.error('Single player guess submission failed:', response);
        showNotification(response.message || 'guessNotSent', 'error');
        triggerShakeAnimation(guesses.length);
      }
    });
  };

  const calculateFeedback = (guess, word) => {
    const feedback = new Array(word.length).fill('absent');
    const wordArray = word.split('');
    const guessArray = guess.split('');
    
    // First pass: mark correct letters
    guessArray.forEach((letter, index) => {
      if (letter === wordArray[index]) {
        feedback[index] = 'correct';
        wordArray[index] = null;
      }
    });
    
    // Second pass: mark present letters
    guessArray.forEach((letter, index) => {
      if (feedback[index] === 'absent') {
        const wordIndex = wordArray.indexOf(letter);
        if (wordIndex !== -1) {
          feedback[index] = 'present';
          wordArray[wordIndex] = null;
        }
      }
    });
    
    return feedback;
  };

  const startNewSinglePlayerRound = () => {
    // This function is kept for compatibility but the actual round start
    // is handled by the server through socket events
    resetGameState();
  };

  const checkTimeExpiry = () => {
    if (!roundEndTime || singlePlayerMode) return;
    
    const now = Date.now();
    if (now >= roundEndTime) {
      processRoundResult({
        winner: null,
        correctWord: currentWord,
        timedOut: true,
        players
      });
    }
  };

  // Timer management
  useEffect(() => {
    if (gameState === 'game' && roundEndTime && !singlePlayerMode) {
      timerRef.current = setInterval(checkTimeExpiry, 1000);
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [gameState, roundEndTime, singlePlayerMode]);

  const value = {
    // State
    gameState,
    setGameState,
    playerName,
    setPlayerName: (name) => {
      setPlayerName(name);
      savePlayerName(name);
    },
    roomCode,
    setRoomCode,
    players,
    setPlayers,
    myId,
    setMyId,
    round,
    setRound,
    wordLength,
    setWordLength,
    roundEndTime,
    setRoundEndTime,
    guesses,
    setGuesses,
    currentGuess,
    setCurrentGuess,
    keyboardStatuses,
    setKeyboardStatuses,
    isMyInputActive,
    setIsMyInputActive,
    lastRoundResult,
    setLastRoundResult,
    gameWinner,
    setGameWinner,
    notification,
    isLoading,
    setIsLoading,
    singlePlayerMode,
    setSinglePlayerMode,
    currentWord,
    setCurrentWord,
    
    // Animation states
    shakeRowIndex,
    bounceRowIndex,
    revealingRow,
    
    // Functions
    showNotification,
    triggerShakeAnimation,
    triggerBounceAnimation,
    startRevealAnimation,
    updateKeyboardStatuses,
    resetGameState,
    handleGuessResult,
    processRoundResult,
    submitSinglePlayerGuess,
    startNewSinglePlayerRound,
    
    // Constants
    MAX_GUESSES,
    DEFAULT_WORD_LENGTH,
    WIN_SCORE,
    ALLOWED_WORD_LENGTHS,
    initialKeyboardStatuses,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}