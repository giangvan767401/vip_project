export type ConversationStatus = 'PENDING' | 'ACTIVE' | 'CLOSED';

export interface MessageSender {
  id: string;
  fullName: string;
  role: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  readAt: string | null;
  sender?: MessageSender;
}

export interface ConversationParticipant {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

export interface Conversation {
  id: string;
  userId: string;
  counselorId: string;
  status: ConversationStatus;
  createdAt: string;
  updatedAt: string;
  user: ConversationParticipant;
  counselor: ConversationParticipant;
  lastMessage?: Message | null;
  unreadCount?: number;
}

export interface MessagesResponse {
  messages: Message[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
