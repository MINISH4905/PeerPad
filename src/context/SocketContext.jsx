import { createContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    if (user) {
      socketRef.current = io('/', {
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
      });

      socketRef.current.on('connect', () => {
        console.log('Connected to Socket.IO server:', socketRef.current.id);
      });

      socketRef.current.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      return () => {
        // socketRef.current.disconnect(); 
      };
    }
  }, [user?.id]);

  const emit = (event, data) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  };

  const on = (event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  };

  const off = (event) => {
    if (socketRef.current) {
      socketRef.current.off(event);
    }
  };

  return (
    <SocketContext.Provider value={{ emit, on, off }}>
      {children}
    </SocketContext.Provider>
  );
};
