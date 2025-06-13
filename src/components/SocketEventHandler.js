import { useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useGame } from '../contexts/GameContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SocketEventHandler() {
  const { socket, isConnected } = useSocket();
  const { setLanguage } = useLanguage();
  const navigation = useNavigation();
  
  const {
    gameState, setGameState,
    myId, setMyId,
    playerName, setPlayerName,
    roomCode, setRoomCode,
    players, setPlayers,
    round, setRound,
    wordLength, setWordLength,
    roundEndTime, setRoundEndTime,
    guesses, setGuesses,
    currentGuess, setCurrentGuess,
    isMyInputActive, setIsMyInputActive,
    lastRoundResult, setLastRoundResult,
    gameWinner, setGameWinner,
    keyboardStatuses, setKeyboardStatuses,
    notification, showNotification,
    startRevealAnimation, triggerBounceAnimation, triggerShakeAnimation,
    singlePlayerMode, setSinglePlayerMode,
    resetGameState,
    updateKeyboardStatuses,
    initialKeyboardStatuses,
    MAX_GUESSES,
    WIN_SCORE,
  } = useGame();

  const handleGuessResult = useCallback((guess, feedback, isCorrect, guessCount) => {
    const currentRowIndex = guessCount - 1;
    if (currentRowIndex < 0 || currentRowIndex >= MAX_GUESSES) return;

    setCurrentGuess('');

    setGuesses(prev => {
      const newGuesses = [...prev];
      if (newGuesses[currentRowIndex]) {
        newGuesses[currentRowIndex] = { guess, feedback, revealing: true };
      } else {
        while (newGuesses.length <= currentRowIndex) {
          newGuesses.push({ guess: '', feedback: Array(wordLength).fill('') });
        }
        newGuesses[currentRowIndex] = { guess, feedback, revealing: true };
      }
      return newGuesses;
    });

    updateKeyboardStatuses(guess, feedback);
    startRevealAnimation(currentRowIndex);

    const totalRevealTime = wordLength * 100 + 500;
    setTimeout(() => {
      setGuesses(prev => prev.map((g, idx) => idx === currentRowIndex ? {...g, revealing: false} : g));
      if (isCorrect) {
        triggerBounceAnimation(currentRowIndex);
        setIsMyInputActive(false);
        showNotification('greatCorrectGuess', 'success', 2000);
      } else if (guessCount >= MAX_GUESSES) {
        setIsMyInputActive(false);
        showNotification('noMoreGuesses', 'warning', 2000);
      }
    }, totalRevealTime);
  }, [setGuesses, updateKeyboardStatuses, startRevealAnimation, wordLength, triggerBounceAnimation, setIsMyInputActive, showNotification, setCurrentGuess, MAX_GUESSES]);

  useEffect(() => {
    if (!socket) return;

    console.log('Setting up socket event listeners...');

    const handleConnect = () => {
      console.log('Socket connected:', socket.id);
      setMyId(socket.id);
      
      // Try to restore session
      AsyncStorage.getItem('wordleGameState').then(storedData => {
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          const { name, code, singlePlayerMode: isSinglePlayer, score, round: savedRound } = parsedData;
          
          if (isSinglePlayer && gameState === 'home') {
            if (score >= WIN_SCORE) {
              console.warn('Previous game completed, clearing storage');
              AsyncStorage.removeItem('wordleGameState');
              return;
            }
            
            setSinglePlayerMode(true);
            setPlayerName(name);
            setRoomCode(socket.id);
            setPlayers([{ id: socket.id, name: name, score: score || 0 }]);
            setMyId(socket.id);
            setRound(savedRound || 0);
            setGameState('game');
            
            setTimeout(() => {
              if (socket && socket.connected) {
                socket.emit('requestNextSinglePlayerRound', { roomCode: socket.id }, (response) => {
                  if (response && !response.success) {
                    console.error('Failed to start restored single player game:', response.message);
                    showNotification(response.message || 'gameCannotContinue', 'error');
                  }
                });
              }
            }, 500);
            
            showNotification('singlePlayerGameResumed', 'success');
            return;
          }
          
          if (name && code && gameState === 'home' && !isSinglePlayer) {
            console.log('Attempting to rejoin room from session storage...');
            socket.emit('joinRoom', { roomCode: code, playerName: name }, (response) => {
              if (response && response.success) {
                setRoomCode(response.roomCode);
                setPlayers(response.players);
                setMyId(socket.id);
                
                const serverGameState = response.gameState;
                if (serverGameState?.isRoundActive) {
                  setGameState('game');
                  setRound(serverGameState.round);
                  setWordLength(serverGameState.currentWord?.length || 5);
                  setRoundEndTime(serverGameState.roundEndTime);
                  setIsMyInputActive(!serverGameState.playersFinished?.includes(socket.id));
                  navigation.navigate('Game');
                } else if (serverGameState?.gameOver) {
                  setGameState('gameOver');
                  setGameWinner(serverGameState.winner);
                  navigation.navigate('GameOver');
                } else {
                  setGameState('lobby');
                  navigation.navigate('Lobby');
                }
                showNotification(['roomRejoined', response.roomCode], 'success');
              } else {
                showNotification(response?.message || 'roomRejoinFailed', 'error');
                AsyncStorage.removeItem('wordleGameState');
                resetGameState(true);
              }
            });
          }
        }
      });
    };

    const handleRoomUpdate = ({ players: updatedPlayers }) => setPlayers(updatedPlayers);

    const handleNewRound = ({ round: newRound, wordLength: len, roundEndTime: endTime, players: currentPlayers, language: serverLanguage }) => {
      console.log('Event: newRound', { newRound });
      
      if (serverLanguage) {
        setLanguage(serverLanguage);
      }
      
      setRound(newRound);
      setWordLength(len || 5);
      setRoundEndTime(endTime);
      setPlayers(currentPlayers);
      setGuesses([]);
      setCurrentGuess('');
      setKeyboardStatuses(initialKeyboardStatuses(serverLanguage || 'tr'));
      setIsMyInputActive(true);
      setLastRoundResult(null);
      setGameState('game');
      showNotification(['roundStarted', newRound], 'success', 2000);
      
      // Navigate to game screen if not already there
      if (navigation.getState().routes[navigation.getState().index].name !== 'Game') {
        navigation.navigate('Game');
      }
    };

    const handleGuessResultEvent = ({ guess, feedback, isCorrect, guessCount, correctWord }) => {
      if (correctWord && (!isCorrect && guessCount >= MAX_GUESSES)) {
        setLastRoundResult(prev => ({
          ...prev,
          correctWord,
          showCorrectWord: true
        }));
      }
      handleGuessResult(guess, feedback, isCorrect, guessCount);
    };

    const handleOpponentFinishedTurn = ({ playerId, playerName: opponentName, reason, correctWord }) => {
      if (reason === 'no_more_guesses') {
        showNotification(['opponentUsedAllGuesses', opponentName || 'opponent'], 'info', 3000);
      } else if (reason === 'correct' && correctWord) {
        showNotification(['opponentGuessedCorrectly', opponentName || 'opponent', correctWord], 'info', 3000);
        setLastRoundResult(prev => ({
          ...prev,
          correctWord,
          showCorrectWord: true
        }));
      } else {
        const messageKey = reason === 'correct' ? 'opponentCompletedTurnCorrect' : 'opponentCompletedTurnNoGuesses';
        showNotification([messageKey, opponentName || 'opponent'], 'info', 3000);
      }
    };

    const handleRoundEndEvent = ({ winnerId, correctWord, players: finalPlayers, timedOut }) => {
      console.log('Round end event received:', { winnerId, correctWord, timedOut });
      setPlayers(finalPlayers || []);
      
      let notificationMessageKey = '';
      let notificationParams = [];

      if (timedOut && correctWord) {
        notificationMessageKey = 'timeUpCorrectWord';
        notificationParams = [correctWord];
      } else if (winnerId && winnerId === myId) {
        notificationMessageKey = 'youGuessedCorrectlyWord';
        notificationParams = [correctWord];
      } else if (winnerId) {
        notificationMessageKey = 'opponentGuessedCorrectlyWord';
        notificationParams = [correctWord];
      } else if (correctWord) {
        notificationMessageKey = 'roundOverCorrectWord';
        notificationParams = [correctWord];
      }
      
      if (notificationMessageKey) {
        showNotification([notificationMessageKey, ...notificationParams], 'info', 3000);
      }
      
      setLastRoundResult({
        winnerId,
        correctWord,
        timedOut,
        showCorrectWord: true
      });
      
      setIsMyInputActive(false);
      setGameState('roundResult');
    };

    const handleGameOverEvent = ({ winner, players: finalPlayers, correctWord, message, winByDisconnect, remainingPlayerId }) => {
      console.log('Game over event received:', { winner, winByDisconnect, remainingPlayerId, myId });
      
      setPlayers(finalPlayers || []);
      
      const isWinnerByDisconnect = winByDisconnect && 
        ((winner && winner.id === myId) || (remainingPlayerId && remainingPlayerId === myId));
      
      if (isWinnerByDisconnect && (!winner || winner.id !== myId)) {
        const me = players.find(p => p.id === myId);
        if (me) {
          console.log('Setting myself as winner after disconnect');
          setGameWinner(me);
        } else {
          setGameWinner(winner);
        }
      } else {
        setGameWinner(winner);
      }
      
      if (message) {
        showNotification(message, isWinnerByDisconnect ? 'success' : 'info', 5000);
      }
      
      if (correctWord && lastRoundResult && !lastRoundResult.winnerId) {
        setLastRoundResult(prev => ({
          ...prev,
          correctWord,
          showCorrectWord: true
        }));
      }
      
      setGameState('gameOver');
      navigation.navigate('GameOver');
    };

    const handlePlayerLeftEvent = ({ disconnectedPlayerName, winnerName, message, remainingPlayerId }) => {
      console.log('Player left event received:', { disconnectedPlayerName, winnerName, message, remainingPlayerId, myId });
      
      showNotification(message || ['playerLeft', disconnectedPlayerName], 'warning', 5000);
      
      const isMe = (winnerName && playerName === winnerName) || (remainingPlayerId && myId === remainingPlayerId);
      
      if (isMe) {
        console.log("I'm the remaining player! Transitioning to game over state...");
        
        const me = players.find(p => p.id === myId);
        if (me) {
          setGameWinner(me);
          setGameState('gameOver');
          showNotification('opponentLeftYouWon', 'success', 5000);
          navigation.navigate('GameOver');
        }
      }
    };

    const handleServerError = (errorData) => {
      showNotification(errorData.message || 'serverError', 'error', 5000);
    };

    const handleSinglePlayerRoundStart = (data) => {
      console.log('Single player round start received:', data);
      const { round: newRound, wordLength: len, roundEndTime: endTime, players: updatedPlayers, isNewGame, language: serverLanguage } = data;
      
      setSinglePlayerMode(true);
      if (socket) {
        setRoomCode(socket.id);
        setMyId(socket.id);
      }

      if (serverLanguage) {
        setLanguage(serverLanguage);
      }

      setRound(newRound);
      setWordLength(len);
      setRoundEndTime(endTime);
      
      if (updatedPlayers && updatedPlayers.length > 0 && socket) {
        setPlayers([{...updatedPlayers[0], id: socket.id}]);
      } else if (socket) {
        setPlayers([{ id: socket.id, name: playerName, score: 0 }]);
      }
      
      setIsMyInputActive(true);
      setGuesses([]);
      setCurrentGuess('');
      setKeyboardStatuses(initialKeyboardStatuses(serverLanguage || 'tr'));
      setLastRoundResult(null);
      setGameState('game');
      
      if (isNewGame) {
        showNotification('newSinglePlayerGameStarted', 'info', 3000);
      }
    };

    const handleSinglePlayerGuessResult = (data) => {
      console.log('Single player guess result received:', data);
      const { guess, feedback, isCorrect, guessCount, roundOver, correctWord, gameOver, gameWinner: winner } = data;
      
      handleGuessResult(guess, feedback, isCorrect, guessCount);
      
      if (roundOver) {
        console.log('Single player round is over:', data);
        
        if (!isCorrect && correctWord) {
          setTimeout(() => {
            showNotification(['correctWordWas', correctWord], 'warning', 3000);
          }, wordLength * 100 + 500);
        }
        
        setLastRoundResult({
          winnerId: isCorrect ? myId : null,
          correctWord,
          timedOut: false,
          showCorrectWord: !isCorrect
        });
        
        if (isCorrect) {
          setPlayers(prevPlayers => {
            return prevPlayers.map(p => {
              if (p.id === myId) {
                return { ...p, score: (p.score || 0) + 1 };
              }
              return p;
            });
          });
        }
        
        if (gameOver && winner) {
          console.log('Single player game is over! Winner:', winner);
          setGameWinner(winner);
          setGameState('gameOver');
          showNotification('congratsYouWon', 'success', 5000);
          AsyncStorage.removeItem('wordleGameState');
          navigation.navigate('GameOver');
        } else {
          setGameState('roundResult');
        }
      }
    };
    
    // Handle game invites (for future friend system implementation)
    const handleGameInviteReceived = (data) => {
      console.log('Game invite received:', data);
      // TODO: Show notification when friend system is implemented
    };
    
    const handleJoinRoom = (data) => {
      const { roomCode: inviteRoomCode } = data;
      if (inviteRoomCode && playerName.trim()) {
        socket.emit('joinRoom', { roomCode: inviteRoomCode, playerName: playerName.trim() }, (response) => {
          if (response.success) {
            setRoomCode(response.roomCode);
            setPlayers(response.players);
            setMyId(socket.id);
            setGameState('lobby');
            if (response.wordLength) {
              setWordLength(response.wordLength);
            }
            showNotification(['roomJoined', response.roomCode], 'success');
            navigation.navigate('Lobby');
            
            // Automatically start the game after joining from invite
            setTimeout(() => {
              socket.emit('startGame', { roomCode: response.roomCode }, (startResponse) => {
                if (!startResponse.success) {
                  showNotification(startResponse.message || 'gameStartFailed', 'error');
                }
              });
            }, 1000);
          } else {
            showNotification(response.message || 'roomJoinFailed', 'error');
          }
        });
      }
    };

    // Register all event listeners
    socket.on('connect', handleConnect);
    socket.on('roomUpdate', handleRoomUpdate);
    socket.on('newRound', handleNewRound);
    socket.on('guessResult', handleGuessResultEvent);
    socket.on('opponentFinishedTurn', handleOpponentFinishedTurn);
    socket.on('roundEnd', handleRoundEndEvent);
    socket.on('gameOver', handleGameOverEvent);
    socket.on('playerLeft', handlePlayerLeftEvent);
    socket.on('serverError', handleServerError);
    socket.on('error', handleServerError);
    socket.on('singlePlayerRoundStart', handleSinglePlayerRoundStart);
    socket.on('singlePlayerGuessResult', handleSinglePlayerGuessResult);
    socket.on('game-invite-received', handleGameInviteReceived);
    socket.on('join-room', handleJoinRoom);

    // Cleanup function
    return () => {
      console.log('Cleaning up socket event listeners...');
      socket.off('connect', handleConnect);
      socket.off('roomUpdate', handleRoomUpdate);
      socket.off('newRound', handleNewRound);
      socket.off('guessResult', handleGuessResultEvent);
      socket.off('opponentFinishedTurn', handleOpponentFinishedTurn);
      socket.off('roundEnd', handleRoundEndEvent);
      socket.off('gameOver', handleGameOverEvent);
      socket.off('playerLeft', handlePlayerLeftEvent);
      socket.off('serverError', handleServerError);
      socket.off('error', handleServerError);
      socket.off('singlePlayerRoundStart', handleSinglePlayerRoundStart);
      socket.off('singlePlayerGuessResult', handleSinglePlayerGuessResult);
      socket.off('game-invite-received', handleGameInviteReceived);
      socket.off('join-room', handleJoinRoom);
    };
  }, [socket]);

  return null;
}