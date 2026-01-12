import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { WS_URL, WS_EVENTS } from '../utils/constants';

export const WebSocketContext = createContext(null);

const WebSocketProvider = ({ children }) => {
  const [ws, setWs] = useState(null);
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const listenersRef = useRef({});
  const tokenRef = useRef(null);
  const wsRef = useRef(null); // ✅ Keep stable reference

  useEffect(() => {
    const token = localStorage.getItem('token');
    tokenRef.current = token;
    
    if (token) {
      connect();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []); // ✅ Only run once on mount

  const connect = useCallback(() => {
    const token = tokenRef.current || localStorage.getItem('token');
    if (!token) {
      console.error('❌ No token found, cannot connect to WebSocket');
      return;
    }

    console.log('🔌 Connecting to WebSocket:', WS_URL);
    const socket = new WebSocket(WS_URL);
    wsRef.current = socket;
    
    socket.onopen = () => {
      console.log('✅ WebSocket connected');
      setConnected(true);
      setReconnecting(false);
      reconnectAttemptsRef.current = 0;
      
      const authMessage = { 
        type: WS_EVENTS.AUTHENTICATE, 
        payload: { token } 
      };
      console.log('🔐 Sending authentication:', authMessage);
      socket.send(JSON.stringify(authMessage));
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('📨 WebSocket message received:', message);
      
      const listeners = listenersRef.current[message.type] || [];
      if (listeners.length === 0) {
        console.warn(`⚠️ No listeners for event type: ${message.type}`);
      }
      listeners.forEach(callback => callback(message.payload));
    };

    socket.onclose = () => {
      console.log('🔌 WebSocket disconnected');
      setConnected(false);
      setWs(null);
      wsRef.current = null;
      
      // ✅ Exponential backoff for reconnection
      const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
      reconnectAttemptsRef.current += 1;
      setReconnecting(true);
      
      console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})...`);
      
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, delay);
    };

    socket.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };

    setWs(socket);
  }, []);

  const send = useCallback((type, payload) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message = { type, payload };
      console.log('📤 Sending WebSocket message:', message);
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.error('❌ Cannot send message, WebSocket not connected. State:', 
        wsRef.current ? wsRef.current.readyState : 'null');
      console.log('Message that failed to send:', { type, payload });
    }
  }, []); // ✅ No dependencies needed since we use wsRef

  const subscribe = useCallback((eventType, callback) => {
    console.log(`👂 Subscribing to event: ${eventType}`);
    if (!listenersRef.current[eventType]) {
      listenersRef.current[eventType] = [];
    }
    listenersRef.current[eventType].push(callback);

    return () => {
      console.log(`🔇 Unsubscribing from event: ${eventType}`);
      listenersRef.current[eventType] = listenersRef.current[eventType].filter(
        cb => cb !== callback
      );
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ ws, connected, reconnecting, send, subscribe }}>
      {children}
    </WebSocketContext.Provider>
  );
};

// ✅ Make it a named export instead of default export
export { WebSocketProvider };