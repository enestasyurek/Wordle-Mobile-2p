import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

// Server URL - in production, this should be your deployed server URL
const SERVER_URL = 'https://twopwordle-server.onrender.com';

// Log the server URL and environment for debugging
console.log('=== Socket Configuration ===');
console.log('Server URL:', SERVER_URL);
console.log('Environment:', __DEV__ ? 'Development' : 'Production');
console.log('=========================');

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const socketRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const { user } = useAuth();

  useEffect(() => {
    connectSocket();

    // Handle app state changes for connection management
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      subscription?.remove();
    };
  }, []);

  // Reconnect socket when user authentication changes
  useEffect(() => {
    if (socketRef.current) {
      console.log('User auth changed, reconnecting socket...');
      socketRef.current.disconnect();
      setTimeout(() => {
        connectSocket();
      }, 100);
    }
  }, [user]);

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

  const connectSocket = async () => {
    try {
      if (socketRef.current?.connected) {
        return;
      }

      setConnectionError(null);
      
      // Get auth token if available
      const token = await AsyncStorage.getItem('accessToken');

      console.log('Creating socket with options:', {
        url: SERVER_URL,
        hasToken: !!token,
        transports: ['polling', 'websocket']
      });
      
      const newSocket = io(SERVER_URL, {
        transports: ['polling', 'websocket'], // Start with polling first
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        autoConnect: true,
        upgrade: true, // Allow upgrading from polling to websocket
        rememberUpgrade: true,
        ...(token && { auth: { token } })
      });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setIsConnected(true);
      setConnectionError(null);
      reconnectAttemptsRef.current = 0;
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('=== Socket Connection Error ===');
      console.error('Message:', error.message);
      console.error('Type:', error.type);
      console.error('Stack:', error.stack);
      console.error('=============================');
      
      setIsConnected(false);
      
      let errorMessage = 'Connection failed';
      
      if (error.message.includes('websocket error')) {
        errorMessage = 'WebSocket error - retrying with polling';
        // Force polling only on next attempt
        newSocket.io.opts.transports = ['polling'];
      } else if (error.message.includes('CORS')) {
        errorMessage = 'Server connection blocked (CORS)';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Connection timeout';
      } else if (error.message.includes('xhr poll error')) {
        errorMessage = 'Network error - check internet connection';
      }
      
      setConnectionError(errorMessage);
      
      // Don't auto-reconnect if it's a persistent error
      if (!error.message.includes('CORS')) {
        // Implement exponential backoff for reconnection
        reconnectAttemptsRef.current++;
        if (reconnectAttemptsRef.current < 5) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          console.log(`Will retry connection in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connectSocket();
          }, delay);
        } else {
          setConnectionError('Unable to connect to server');
        }
      }
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
      setConnectionError(null);
    });
    
    // Add transport-specific event handlers
    newSocket.io.on('upgrade', (transport) => {
      console.log('Transport upgraded to:', transport.name);
    });
    
    newSocket.io.on('packet', (packet) => {
      if (packet.type === 'pong') {
        console.log('Received pong from server');
      }
    });

      socketRef.current = newSocket;
      setSocket(newSocket);
      
      // Make socket globally available for GameContext
      global.socketInstance = newSocket;
    } catch (error) {
      console.error('Error creating socket:', error);
      setConnectionError('Failed to initialize connection');
    }
  };

  const reconnectSocket = async () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    await connectSocket();
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, connectionError, reconnectSocket }}>
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