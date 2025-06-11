import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LanguageContext = createContext();

const translations = {
  tr: {
    appName: 'Kelime Savaşı',
    singlePlayer: 'Tek Kişilik',
    twoPlayer: '2 Kişilik',
    howToPlay: 'Nasıl Oynanır?',
    blog: 'Blog',
    createRoom: 'Oda Oluştur',
    joinRoom: 'Odaya Katıl',
    enterRoomCode: 'Oda kodunu girin',
    join: 'Katıl',
    back: 'Geri',
    yourName: 'Adınız',
    enterYourName: 'Adınızı girin',
    waitingForOpponent: 'Rakip bekleniyor...',
    roomCode: 'Oda Kodu',
    shareRoomCode: 'Bu kodu arkadaşınızla paylaşın',
    players: 'Oyuncular',
    startGame: 'Oyunu Başlat',
    round: 'Tur',
    timeLeft: 'Kalan Süre',
    submit: 'Gönder',
    winner: 'Kazanan',
    correctWord: 'Doğru Kelime',
    timeout: 'Süre Doldu!',
    gameOver: 'Oyun Bitti!',
    playAgain: 'Tekrar Oyna',
    newGame: 'Yeni Oyun',
    points: 'puan',
    wins: 'kazandı!',
    notEnoughLetters: 'Yetersiz harf',
    notInWordList: 'Kelime listesinde yok',
    alreadyGuessed: 'Bu kelimeyi zaten denediniz',
    wrongLength: 'Kelime uzunluğu {{ expected }} harf olmalı',
    opponent: 'Rakip',
    opponentLeft: 'Rakip oyundan ayrıldı',
    connectionError: 'Bağlantı hatası',
    roomNotFound: 'Oda bulunamadı',
    roomFull: 'Oda dolu',
    invalidRoomCode: 'Geçersiz oda kodu',
    copyRoomCode: 'Oda kodunu kopyala',
    copiedToClipboard: 'Panoya kopyalandı!',
    selectWordLength: 'Kelime uzunluğu seçin',
    letters: 'harf',
    '3letters': '3 Harf',
    '4letters': '4 Harf',
    '5letters': '5 Harf',
    '6letters': '6 Harf',
    mode: 'Mod',
    easy: 'Kolay',
    medium: 'Orta',
    hard: 'Zor',
    tryAgain: 'Tekrar Dene',
    or: 'veya',
    you: 'Siz',
    finalScore: 'Final Skor',
    joined: 'katıldı',
    waitingForOpponentToStart: 'Rakibin oyunu başlatması bekleniyor...',
    gameStartingSoon: 'Oyun başlıyor...',
    // How to play
    howToPlayTitle: 'Nasıl Oynanır?',
    guessTheWord: 'Kelimeyi tahmin edin',
    youHave6Tries: '{{ tries }} deneme hakkınız var',
    afterEachGuess: 'Her tahminden sonra harflerin rengi değişir',
    greenExplanation: 'Harf doğru yerde',
    yellowExplanation: 'Harf kelimede var ama yanlış yerde',
    grayExplanation: 'Harf kelimede yok',
    exampleWord: 'KALEM',
    example: 'Örnek',
    inSinglePlayer: 'Tek kişilik modda',
    inTwoPlayer: '2 kişilik modda',
    singlePlayerRules: 'İstediğiniz süre boyunca kelime tahmin edin',
    twoPlayerRules: 'İlk 5 puana ulaşan kazanır. Her tur 2 dakikadır',
    understood: 'Anladım',
    tapToRevealWord: 'Kelimeyi görmek için dokun',
    hiddenWord: '???',
  },
  en: {
    appName: 'Word Battle',
    singlePlayer: 'Single Player',
    twoPlayer: '2 Players',
    howToPlay: 'How to Play?',
    blog: 'Blog',
    createRoom: 'Create Room',
    joinRoom: 'Join Room',
    enterRoomCode: 'Enter room code',
    join: 'Join',
    back: 'Back',
    yourName: 'Your Name',
    enterYourName: 'Enter your name',
    waitingForOpponent: 'Waiting for opponent...',
    roomCode: 'Room Code',
    shareRoomCode: 'Share this code with your friend',
    players: 'Players',
    startGame: 'Start Game',
    round: 'Round',
    timeLeft: 'Time Left',
    submit: 'Submit',
    winner: 'Winner',
    correctWord: 'Correct Word',
    timeout: 'Time\'s Up!',
    gameOver: 'Game Over!',
    playAgain: 'Play Again',
    newGame: 'New Game',
    points: 'points',
    wins: 'wins!',
    notEnoughLetters: 'Not enough letters',
    notInWordList: 'Not in word list',
    alreadyGuessed: 'You already tried this word',
    wrongLength: 'Word must be {{ expected }} letters',
    opponent: 'Opponent',
    opponentLeft: 'Opponent left the game',
    connectionError: 'Connection error',
    roomNotFound: 'Room not found',
    roomFull: 'Room is full',
    invalidRoomCode: 'Invalid room code',
    copyRoomCode: 'Copy room code',
    copiedToClipboard: 'Copied to clipboard!',
    selectWordLength: 'Select word length',
    letters: 'letters',
    '3letters': '3 Letters',
    '4letters': '4 Letters',
    '5letters': '5 Letters',
    '6letters': '6 Letters',
    mode: 'Mode',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    tryAgain: 'Try Again',
    or: 'or',
    you: 'You',
    finalScore: 'Final Score',
    joined: 'joined',
    waitingForOpponentToStart: 'Waiting for opponent to start...',
    gameStartingSoon: 'Game starting...',
    // How to play
    howToPlayTitle: 'How to Play?',
    guessTheWord: 'Guess the word',
    youHave6Tries: 'You have {{ tries }} tries',
    afterEachGuess: 'After each guess, the color of the tiles will change',
    greenExplanation: 'Letter is in the correct spot',
    yellowExplanation: 'Letter is in the word but wrong spot',
    grayExplanation: 'Letter is not in the word',
    exampleWord: 'WORLD',
    example: 'Example',
    inSinglePlayer: 'In single player mode',
    inTwoPlayer: 'In 2 player mode',
    singlePlayerRules: 'Guess words for as long as you want',
    twoPlayerRules: 'First to reach 5 points wins. Each round is 2 minutes',
    understood: 'Got it',
    tapToRevealWord: 'Tap to reveal word',
    hiddenWord: '???',
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState('tr');

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('language');
      if (savedLanguage && translations[savedLanguage]) {
        setLanguageState(savedLanguage);
      }
    } catch (error) {
      console.error('Error loading language:', error);
    }
  };

  const setLanguage = async (newLanguage) => {
    if (translations[newLanguage]) {
      setLanguageState(newLanguage);
      try {
        await AsyncStorage.setItem('language', newLanguage);
      } catch (error) {
        console.error('Error saving language:', error);
      }
    }
  };

  const getTranslation = (key, ...args) => {
    let translation = translations[language][key] || key;
    
    // Handle placeholder replacement
    if (args.length > 0 && typeof args[0] === 'object') {
      const replacements = args[0];
      Object.keys(replacements).forEach(placeholder => {
        translation = translation.replace(
          new RegExp(`{{\\s*${placeholder}\\s*}}`, 'g'),
          replacements[placeholder]
        );
      });
    }
    
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, getTranslation }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}