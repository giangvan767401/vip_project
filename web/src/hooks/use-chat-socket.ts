import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Message } from '../types/conversation';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface UseChatSocketOptions {
  conversationId?: string | null;
  onNewMessage?: (message: Message) => void;
  onStatusChanged?: (data: { conversationId: string; status: string }) => void;
  onMessageRead?: (data: { conversationId: string; readBy: string; readAt: string }) => void;
}

export const useChatSocket = (options: UseChatSocketOptions) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { conversationId, onNewMessage, onStatusChanged, onMessageRead } = options;

  useEffect(() => {
    const token = localStorage.getItem('mindlog_token');
    if (!token) return;

    const socket = io(API_BASE_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      if (conversationId) {
        socket.emit('conversation:join', { conversationId });
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('message:new', (msg: Message) => {
      if (onNewMessage) {
        onNewMessage(msg);
      }
    });

    socket.on('conversation:status_changed', (data: { conversationId: string; status: string }) => {
      if (onStatusChanged) {
        onStatusChanged(data);
      }
    });

    socket.on('message:read', (data: { conversationId: string; readBy: string; readAt: string }) => {
      if (onMessageRead) {
        onMessageRead(data);
      }
    });

    return () => {
      if (conversationId) {
        socket.emit('conversation:leave', { conversationId });
      }
      socket.disconnect();
      socketRef.current = null;
    };
  }, [conversationId]);

  const joinConversation = useCallback((convId: string) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('conversation:join', { conversationId: convId });
    }
  }, []);

  const leaveConversation = useCallback((convId: string) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('conversation:leave', { conversationId: convId });
    }
  }, []);

  const markAsRead = useCallback((convId: string) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('message:read', { conversationId: convId });
    }
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    joinConversation,
    leaveConversation,
    markAsRead,
  };
};
