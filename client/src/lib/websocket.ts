import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

interface UseWebSocketOptions {
  onMessage?: (data: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

export function useWebSocket(
  orderId: string,
  options: UseWebSocketOptions = {}
) {
  const {
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const attemptCountRef = useRef(0);
  const isIntentionalCloseRef = useRef(false);
  // Store handlers in refs to avoid re-creating connect/disconnect
  const onMessageRef = useRef<UseWebSocketOptions['onMessage']>();
  const onConnectRef = useRef<UseWebSocketOptions['onConnect']>();
  const onDisconnectRef = useRef<UseWebSocketOptions['onDisconnect']>();
  const onErrorRef = useRef<UseWebSocketOptions['onError']>();

  useEffect(() => {
    onMessageRef.current = onMessage;
    onConnectRef.current = onConnect;
    onDisconnectRef.current = onDisconnect;
    onErrorRef.current = onError;
  }, [onMessage, onConnect, onDisconnect, onError]);

  const connect = useCallback(() => {
    // Guard: do not create multiple sockets
    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED && wsRef.current.readyState !== WebSocket.CLOSING) return;

    setConnectionStatus('connecting');
    
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const token = localStorage.getItem('showpls-jwt') || '';
    const wsUrl = `${protocol}//${window.location.host}/ws?token=${encodeURIComponent(token)}&orderId=${encodeURIComponent(orderId)}`;
    
    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setConnectionStatus('connected');
        attemptCountRef.current = 0;
        
        onConnectRef.current?.();
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessageRef.current?.(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        setConnectionStatus('disconnected');
        wsRef.current = null;

        onDisconnectRef.current?.();

        // Attempt to reconnect if not intentional close
        if (!isIntentionalCloseRef.current && attemptCountRef.current < reconnectAttempts) {
          attemptCountRef.current++;
          console.log(`Attempting to reconnect... (${attemptCountRef.current}/${reconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
        onErrorRef.current?.(error);
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setConnectionStatus('error');
    }
  // Only depend on orderId and reconnect settings to avoid re-creation on every render
  }, [orderId, reconnectAttempts, reconnectInterval]);

  const disconnect = useCallback(() => {
    isIntentionalCloseRef.current = true;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Intentional disconnect');
      wsRef.current = null;
    }

    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, []);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    return new Promise<void>((resolve, reject) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.send(JSON.stringify(message));
          resolve();
        } catch (error) {
          console.error('Error sending WebSocket message:', error);
          reject(error);
        }
      } else {
        reject(new Error('WebSocket is not connected'));
      }
    });
  }, []);

  useEffect(() => {
    if (orderId) {
      isIntentionalCloseRef.current = false;
      connect();
    }
    return () => {
      disconnect();
    };
  }, [orderId]);

  return {
    isConnected,
    connectionStatus,
    sendMessage,
    connect,
    disconnect,
  };
}

// Helper function to get Telegram auth data
function getTelegramAuthData() {
  try {
    // Check if running in Telegram WebApp
    if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
      return window.Telegram.WebApp.initDataUnsafe.user;
    }
    
    // For development/testing, return mock data
    if (process.env.NODE_ENV === 'development') {
      return {
        id: 'demo_user_123',
        username: 'demo_user',
        first_name: 'Demo',
        language_code: 'en'
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting Telegram auth data:', error);
    return null;
  }
}
