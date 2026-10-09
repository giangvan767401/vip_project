import { useCallback, useEffect, useRef, useState } from 'react';
import { EmotionWSResult } from '../types/emotion';

interface UseEmotionWSOptions {
  token: string | null;
  onResult?: (result: EmotionWSResult) => void;
  onError?: (err: Event | string) => void;
}

export type WSConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error' | 'disconnected';

export const useEmotionWS = ({ token, onResult, onError }: UseEmotionWSOptions) => {
  const [status, setStatus] = useState<WSConnectionStatus>('idle');
  const [lastResult, setLastResult] = useState<EmotionWSResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const shouldReconnectRef = useRef(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setStatus('disconnected');
  }, []);

  const connect = useCallback(() => {
    if (!token) {
      setErrorMsg('Thiếu token xác thực để kết nối AI WebSocket');
      setStatus('error');
      return;
    }

    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    shouldReconnectRef.current = true;
    setStatus('connecting');
    setErrorMsg(null);

    const baseUrl = import.meta.env.VITE_AI_WS_URL || 'ws://localhost:8000/ws';
    const wsUrl = `${baseUrl}?token=${encodeURIComponent(token)}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus('connected');
        setErrorMsg(null);
      };

      ws.onmessage = (event) => {
        try {
          const parsed: EmotionWSResult = JSON.parse(event.data);
          if (parsed.type === 'result') {
            setLastResult(parsed);
            if (onResultRef.current) {
              onResultRef.current(parsed);
            }
          }
        } catch {
          // ignore malformed message
        }
      };

      ws.onerror = (e) => {
        setStatus('error');
        setErrorMsg('Lỗi kết nối WebSocket tới AI service');
        if (onError) onError(e);
      };

      ws.onclose = (event) => {
        wsRef.current = null;
        if (event.code === 1008) {
          setErrorMsg('Từ chối truy cập WebSocket: Token không hợp lệ hoặc đã hết hạn');
          setStatus('error');
          shouldReconnectRef.current = false;
          return;
        }

        if (shouldReconnectRef.current) {
          setStatus('connecting');
          reconnectTimeoutRef.current = setTimeout(() => {
            if (shouldReconnectRef.current) {
              connect();
            }
          }, 3000);
        } else {
          setStatus('disconnected');
        }
      };
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err?.message || 'Không thể khởi tạo WebSocket');
    }
  }, [token, onError]);

  const sendFrame = useCallback((base64Data: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'frame',
          data: base64Data,
        })
      );
    }
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    status,
    isConnected: status === 'connected',
    errorMsg,
    lastResult,
    connect,
    disconnect,
    sendFrame,
  };
};
