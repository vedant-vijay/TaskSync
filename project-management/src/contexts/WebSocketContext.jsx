// ============================================
// FIXED: WebSocketContext.jsx
// ============================================
import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { WS_URL, WS_EVENTS } from '../utils/constants';

export const WebSocketContext = createContext(null);

const WebSocketProvider = ({ children }) => {
  const [ws, setWs] = useState(null);
  const [connected, setConnected] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const listenersRef = useRef({});
  const wsRef = useRef(null);
  const isConnectingRef = useRef(false); // ✅ NEW: Prevent concurrent connections

  const connect = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ No token found, cannot connect to WebSocket');
      window.WebSocketReady = false;
      return;
    }

    // ✅ Prevent multiple simultaneous connections
    if (isConnectingRef.current) {
      console.log('⚠️ Connection already in progress');
      return;
    }

    // Don't reconnect if already connected
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log('⚠️ Already connected, skipping reconnect');
      return;
    }

    // ✅ Close any existing socket in CONNECTING state
    if (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING) {
      console.log('🔌 Closing pending connection');
      wsRef.current.close();
      wsRef.current = null;
    }

    isConnectingRef.current = true; // ✅ Mark as connecting
    console.log('🔌 Connecting to WebSocket:', WS_URL);
    window.WebSocketReady = false;
    
    const socket = new WebSocket(WS_URL);
    wsRef.current = socket;
    
    socket.onopen = () => {
      console.log('✅ WebSocket connected');
      setConnected(true);
      setReconnecting(false);
      reconnectAttemptsRef.current = 0;
      isConnectingRef.current = false; // ✅ Connection complete
      
      const authMessage = { 
        type: WS_EVENTS.AUTHENTICATE, 
        payload: { token } 
      };
      console.log('🔐 Sending authentication');
      socket.send(JSON.stringify(authMessage));
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('📨 WebSocket message received:', message.type);
      
      if (message.type === 'AUTHENTICATED') {
        console.log('✅ WebSocket authenticated successfully');
        setAuthenticated(true);
        window.WebSocketReady = true;
        console.log('🎉 WebSocket is now ready for use');
      }
      
      const listeners = listenersRef.current[message.type] || [];
      if (listeners.length === 0 && message.type !== 'AUTHENTICATED' && message.type !== 'CONNECTION_ESTABLISHED') {
        console.warn(`⚠️ No listeners for event type: ${message.type}`);
      }
      listeners.forEach(callback => callback(message.payload));
    };

    socket.onclose = () => {
      console.log('🔌 WebSocket disconnected');
      setConnected(false);
      setAuthenticated(false);
      setWs(null);
      wsRef.current = null;
      window.WebSocketReady = false;
      isConnectingRef.current = false; // ✅ Reset connecting flag
      
      const currentToken = localStorage.getItem('token');
      if (currentToken && !reconnecting) { // ✅ Check reconnecting state
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
        reconnectAttemptsRef.current += 1;
        setReconnecting(true);
        
        console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})...`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      }
    };

    socket.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      window.WebSocketReady = false;
      isConnectingRef.current = false; // ✅ Reset on error
    };

    setWs(socket);
  }, []); // ✅ EMPTY DEPS - connect doesn't need dependencies

  // ✅ FIXED: Separate effect for token polling
  useEffect(() => {
    let intervalId;
    let mounted = true;
    
    const checkAndConnect = () => {
      if (!mounted) return; // ✅ Guard against unmounted component
      
      const token = localStorage.getItem('token');
      const isConnected = wsRef.current?.readyState === WebSocket.OPEN;
      const isConnecting = isConnectingRef.current;
      
      console.log('🔍 WebSocket check:', { 
        hasToken: !!token, 
        isConnected,
        isConnecting,
        authenticated,
        reconnecting
      });
      
      // ✅ Only connect if: has token, not connected, not connecting, not reconnecting
      if (token && !isConnected && !isConnecting && !reconnecting) {
        console.log('✅ Token detected, connecting WebSocket...');
        connect();
      } else if (!token && wsRef.current) {
        console.log('❌ No token, disconnecting...');
        wsRef.current.close();
        setConnected(false);
        setAuthenticated(false);
        setReconnecting(false);
      }
    };
    
    // Check immediately
    checkAndConnect();
    
    // ✅ Poll every 2 seconds (reduced from 500ms)
    intervalId = setInterval(checkAndConnect, 2000);

    return () => {
      mounted = false; // ✅ Mark as unmounted
      clearInterval(intervalId);
      console.log('🧹 Cleaning up WebSocket');
      window.WebSocketReady = false;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      
      isConnectingRef.current = false;
    };
  }, [connect, reconnecting]); // ✅ Only depend on reconnecting, not authenticated

  const send = useCallback((type, payload) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message = { type, payload };
      console.log('📤 Sending WebSocket message:', message.type);
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.error('❌ Cannot send message, WebSocket not connected. State:', 
        wsRef.current ? wsRef.current.readyState : 'null');
    }
  }, []);

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
    <WebSocketContext.Provider value={{ ws, connected, authenticated, reconnecting, send, subscribe }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export { WebSocketProvider };