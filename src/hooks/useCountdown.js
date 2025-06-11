import { useState, useEffect, useRef } from 'react';
import { AppState } from 'react-native';

export function useCountdown(targetTime) {
  const [timeLeft, setTimeLeft] = useState(0);
  const intervalRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);
  const backgroundTimeRef = useRef(null);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      subscription?.remove();
    };
  }, []);

  useEffect(() => {
    if (!targetTime) {
      setTimeLeft(0);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const calculateTimeLeft = () => {
      const now = Date.now();
      const difference = targetTime - now;
      return Math.max(0, Math.floor(difference / 1000));
    };

    setTimeLeft(calculateTimeLeft());

    intervalRef.current = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      
      if (newTimeLeft <= 0 && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [targetTime]);

  const handleAppStateChange = (nextAppState) => {
    if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
      // App has come to the foreground
      if (backgroundTimeRef.current && targetTime) {
        const timePassed = Date.now() - backgroundTimeRef.current;
        const adjustedTimeLeft = Math.max(0, Math.floor((targetTime - Date.now()) / 1000));
        setTimeLeft(adjustedTimeLeft);
      }
    } else if (nextAppState.match(/inactive|background/)) {
      // App is going to background
      backgroundTimeRef.current = Date.now();
    }
    
    appStateRef.current = nextAppState;
  };

  const formatTime = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return { timeLeft, formattedTime: formatTime() };
}