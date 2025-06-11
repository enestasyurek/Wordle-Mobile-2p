import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import io from 'socket.io-client';

const SocketContext = createContext();

// Server URL - in production, this should be your deployed server URL
const SERVER_URL = __DEV__ ? 'https://twopwordle-server.onrender.com' : 'https://twopwordle-server.onrender.com';

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    connectSocket();

    // Handle app state changes for connection management
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      subscription?.remove();
    };
  }, []);

  const handleAppStateChange = (nextAppState) => {
    if (
      appStateRef.current.match(/inactive|background/) &&
      nextAppState === 'active' &&
      socketRef.current &&
      !socketRef.current.connected
    ) {
      // App has come to the foreground and socket is disconnected
      connectSocket();
    }
    appStateRef.current = nextAppState;
  };

  const connectSocket = () => {
    if (socketRef.current?.connected) {
      return;
    }

    const newSocket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 10000,
      withCredentials: true,
      forceNew: true,
    });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      console.error('Full error:', error);
      setIsConnected(false);
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);
    
    // Make socket globally available for GameContext
    global.socketInstance = newSocket;
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}