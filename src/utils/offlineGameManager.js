import AsyncStorage from '@react-native-async-storage/async-storage';

class OfflineGameManager {
  constructor() {
    this.words = {
      tr: {
        3: [],
        4: [],
        5: [],
        6: [],
      },
      en: {
        3: [],
        4: [],
        5: [],
        6: [],
      },
    };
    this.initialized = false;
    this.currentGame = null;
  }

  async init() {
    if (this.initialized) return;

    try {
      // Load cached words
      await this.loadCachedWords();
      
      // Load current game state
      await this.loadGameState();
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize offline game manager:', error);
    }
  }

  async loadCachedWords() {
    try {
      const cachedWords = await AsyncStorage.getItem('offlineWords');
      if (cachedWords) {
        this.words = JSON.parse(cachedWords);
      } else {
        // Load default words
        await this.loadDefaultWords();
      }
    } catch (error) {
      console.error('Failed to load cached words:', error);
    }
  }

  async loadDefaultWords() {
    // In a real app, these would be bundled with the app
    const defaultWords = {
      tr: {
        3: ['ALT', 'ÜST', 'SAĞ', 'SOL', 'İLK', 'SON', 'YOL', 'GÜN', 'YIL', 'ARA'],
        4: ['KALE', 'MASA', 'KARA', 'AÇIK', 'UZUN', 'KISA', 'BÜYÜ', 'KÜÇÜ', 'HAVA', 'SUDA'],
        5: ['KALEM', 'ARABA', 'OKULU', 'EVLER', 'GÜZEL', 'BÜYÜK', 'KÜÇÜK', 'HIZLI', 'YAVAŞ', 'SICAK'],
        6: ['PENCERE', 'BILGISA', 'TELEFON', 'ARKADAŞ', 'ÖĞRENCI', 'ÖĞRETME', 'HASTANE', 'DOKTORU', 'MÜHENDI', 'AVUKATA'],
      },
      en: {
        3: ['CAT', 'DOG', 'RUN', 'FUN', 'SUN', 'TOP', 'HAT', 'BAT', 'RAT', 'MAT'],
        4: ['GAME', 'PLAY', 'WORD', 'TIME', 'GOOD', 'BEST', 'FAST', 'SLOW', 'HIGH', 'LOVE'],
        5: ['HOUSE', 'GAMES', 'WORLD', 'HAPPY', 'SMALL', 'LARGE', 'QUICK', 'BROWN', 'JUMPS', 'FOXES'],
        6: ['PLAYER', 'GAMING', 'WORLDS', 'BETTER', 'BIGGER', 'FASTER', 'SLOWER', 'JUMPED', 'PLAYED', 'WORKED'],
      },
    };

    this.words = defaultWords;
    await AsyncStorage.setItem('offlineWords', JSON.stringify(defaultWords));
  }

  async cacheWordsFromServer(language, wordLength, words) {
    try {
      if (!this.words[language]) {
        this.words[language] = {};
      }
      
      this.words[language][wordLength] = words;
      await AsyncStorage.setItem('offlineWords', JSON.stringify(this.words));
    } catch (error) {
      console.error('Failed to cache words:', error);
    }
  }

  getRandomWord(language, wordLength) {
    const wordList = this.words[language]?.[wordLength] || [];
    if (wordList.length === 0) {
      // Fallback to a default word
      return language === 'tr' ? 'KALEM' : 'WORLD';
    }
    
    const randomIndex = Math.floor(Math.random() * wordList.length);
    return wordList[randomIndex].toUpperCase();
  }

  async startOfflineGame(language, wordLength) {
    const word = this.getRandomWord(language, wordLength);
    
    this.currentGame = {
      id: Date.now().toString(),
      language,
      wordLength,
      word,
      guesses: [],
      startTime: Date.now(),
      status: 'active',
    };

    await this.saveGameState();
    return this.currentGame;
  }

  validateWord(word, language, wordLength) {
    const wordList = this.words[language]?.[wordLength] || [];
    return wordList.some(w => w.toUpperCase() === word.toUpperCase());
  }

  submitGuess(guess) {
    if (!this.currentGame || this.currentGame.status !== 'active') {
      return { success: false, error: 'No active game' };
    }

    const normalizedGuess = guess.toUpperCase();
    const feedback = this.calculateFeedback(normalizedGuess, this.currentGame.word);
    const isCorrect = normalizedGuess === this.currentGame.word;

    this.currentGame.guesses.push({
      guess: normalizedGuess,
      feedback,
      timestamp: Date.now(),
    });

    if (isCorrect || this.currentGame.guesses.length >= 6) {
      this.currentGame.status = isCorrect ? 'won' : 'lost';
      this.currentGame.endTime = Date.now();
    }

    this.saveGameState();

    return {
      success: true,
      feedback,
      isCorrect,
      guessCount: this.currentGame.guesses.length,
      gameOver: this.currentGame.status !== 'active',
      correctWord: this.currentGame.status !== 'active' ? this.currentGame.word : null,
    };
  }

  calculateFeedback(guess, word) {
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
  }

  async saveGameState() {
    try {
      await AsyncStorage.setItem('offlineGameState', JSON.stringify(this.currentGame));
    } catch (error) {
      console.error('Failed to save game state:', error);
    }
  }

  async loadGameState() {
    try {
      const savedGame = await AsyncStorage.getItem('offlineGameState');
      if (savedGame) {
        this.currentGame = JSON.parse(savedGame);
      }
    } catch (error) {
      console.error('Failed to load game state:', error);
    }
  }

  async getStatistics() {
    try {
      const stats = await AsyncStorage.getItem('offlineStats');
      return stats ? JSON.parse(stats) : {
        gamesPlayed: 0,
        gamesWon: 0,
        currentStreak: 0,
        maxStreak: 0,
        guessDistribution: [0, 0, 0, 0, 0, 0],
      };
    } catch (error) {
      console.error('Failed to load statistics:', error);
      return null;
    }
  }

  async updateStatistics(won, guessCount) {
    try {
      const stats = await this.getStatistics();
      
      stats.gamesPlayed++;
      
      if (won) {
        stats.gamesWon++;
        stats.currentStreak++;
        stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
        if (guessCount <= 6) {
          stats.guessDistribution[guessCount - 1]++;
        }
      } else {
        stats.currentStreak = 0;
      }

      await AsyncStorage.setItem('offlineStats', JSON.stringify(stats));
      return stats;
    } catch (error) {
      console.error('Failed to update statistics:', error);
    }
  }

  getCurrentGame() {
    return this.currentGame;
  }

  async resetCurrentGame() {
    this.currentGame = null;
    await AsyncStorage.removeItem('offlineGameState');
  }
}

export default new OfflineGameManager();