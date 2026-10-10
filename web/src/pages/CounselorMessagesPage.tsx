import React, { useState, useEffect, useRef } from 'react';
import { RoleLayout } from '../components/layout/RoleLayout';
import { api } from '../services/api';
import { Conversation, Message } from '../types/conversation';
import { useAuth } from '../context/AuthContext';
import { useChatSocket } from '../hooks/use-chat-socket';
import {
  Send,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  X,
  Info,
  CheckCheck,
  Check,
} from 'lucide-react';

export const CounselorMessagesPage: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Socket.IO hook
  const { markAsRead } = useChatSocket({
    conversationId: selectedConv?.id,
    onNewMessage: (msg) => {
      if (selectedConv && msg.conversationId === selectedConv.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        scrollToBottom();

        if (msg.senderId !== user?.id) {
          markAsRead(selectedConv.id);
        }
      }

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === msg.conversationId) {
            return {
              ...c,
              lastMessage: msg,
              unreadCount:
                selectedConv?.id === c.id || msg.senderId === user?.id
                  ? c.unreadCount
                  : (c.unreadCount || 0) + 1,
            };
          }
          return c;
        }),
      );
    },
    onStatusChanged: (data) => {
      setConversations((prev) =>
        prev.map((c) => (c.id === data.conversationId ? { ...c, status: data.status as any } : c)),
      );
      if (selectedConv?.id === data.conversationId) {
        setSelectedConv((prev) => (prev ? { ...prev, status: data.status as any } : null));
      }
    },
    onMessageRead: (data) => {
      if (selectedConv?.id === data.conversationId) {
        setMessages((prev) =>
          prev.map((m) => (m.readAt ? m : { ...m, readAt: data.readAt })),
        );
      }
    },
  });

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      const data = await api.getConversations();
      setConversations(data);
      if (data.length > 0 && !selectedConv) {
        setSelectedConv(data[0]);
      } else if (selectedConv) {
        const updated = data.find((c) => c.id === selectedConv.id);
        if (updated) setSelectedConv(updated);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể tải danh sách cuộc trò chuyện');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (!selectedConv) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      setIsLoadingMessages(true);
      try {
        const res = await api.getConversationMessages(selectedConv.id);
        setMessages(res.messages);
        scrollToBottom();

        await api.markConversationAsRead(selectedConv.id);
        markAsRead(selectedConv.id);

        setConversations((prev) =>
          prev.map((c) => (c.id === selectedConv.id ? { ...c, unreadCount: 0 } : c)),
        );
      } catch (err: any) {
        setErrorMessage(err.message || 'Không thể tải tin nhắn');
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [selectedConv?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Counselor chấp nhận yêu cầu (PENDING -> ACTIVE)
  const handleAcceptConversation = async (convId: string) => {
    try {
      setIsUpdatingStatus(true);
      setErrorMessage(null);
      const updated = await api.updateConversationStatus(convId, 'ACTIVE');
      setActionSuccess('Đã chấp nhận yêu cầu trò chuyện từ sinh viên!');
      setSelectedConv(updated);
      setConversations((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c)),
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể chấp nhận yêu cầu');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Đóng cuộc trò chuyện (ACTIVE -> CLOSED)
  const handleCloseConversation = async (convId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn kết thúc cuộc trò chuyện này?')) return;
    try {
      setIsUpdatingStatus(true);
      setErrorMessage(null);
      const updated = await api.updateConversationStatus(convId, 'CLOSED');
      setActionSuccess('Đã đóng cuộc trò chuyện.');
      setSelectedConv(updated);
      setConversations((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c)),
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể đóng cuộc trò chuyện');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Gửi tin nhắn
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedConv || !newMessageText.trim() || isSending) return;

    if (selectedConv.status !== 'ACTIVE') {
      setErrorMessage('Cuộc trò chuyện này chưa được kích hoạt hoặc đã đóng.');
      return;
    }

    const text = newMessageText.trim();
    setIsSending(true);
    setErrorMessage(null);

    try {
      const sent = await api.sendMessage(selectedConv.id, text);
      setMessages((prev) => {
        if (prev.some((m) => m.id === sent.id)) return prev;
        return [...prev, sent];
      });
      setNewMessageText('');
      scrollToBottom();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gửi tin nhắn thất bại');
    } finally {
      setIsSending(false);
    }
  };

  // Lọc cuộc trò chuyện theo trạng thái
  const filteredConversations = conversations.filter((c) => {
    if (filterStatus === 'ALL') return true;
    return c.status === filterStatus;
  });

  const pendingCount = conversations.filter((c) => c.status === 'PENDING').length;

  return (
    <RoleLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: 'calc(100vh - 130px)' }}>
        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare className="text-primary" size={24} />
              Hộp thư Tư vấn Tâm lý
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Quản lý các yêu cầu tư vấn và trò chuyện trực tiếp với sinh viên
            </p>
          </div>

          {pendingCount > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '999px',
                backgroundColor: 'rgba(234, 179, 8, 0.15)',
                border: '1px solid rgba(234, 179, 8, 0.3)',
                color: '#facc15',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              <Clock size={16} />
              <span>Có {pendingCount} yêu cầu đang chờ bạn duyệt</span>
            </div>
          )}
        </div>

        {/* ── Privacy Reminder Banner ── */}
        <div
          style={{
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '0.82rem',
            color: '#c7d2fe',
          }}
        >
          <ShieldCheck size={18} color="#818cf8" style={{ flexShrink: 0 }} />
          <div>
            <strong>Quy định bảo mật & Đạo đức tư vấn:</strong> Nhắn tin là kênh hỗ trợ độc lập và <strong>không tự động chia sẻ dữ liệu cảm xúc</strong> của sinh viên.
            Bạn chỉ có thể xem xu hướng cảm xúc khi sinh viên đã chủ động cấp quyền chia sẻ (ConsentShare) còn hiệu lực.
          </div>
        </div>

        {/* Thông báo Alert */}
        {errorMessage && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md)',
              color: '#fca5a5',
              fontSize: '0.85rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>{errorMessage}</span>
            <X size={16} style={{ cursor: 'pointer' }} onClick={() => setErrorMessage(null)} />
          </div>
        )}

        {actionSuccess && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(34, 197, 94, 0.15)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: 'var(--radius-md)',
              color: '#86efac',
              fontSize: '0.85rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>{actionSuccess}</span>
            <X size={16} style={{ cursor: 'pointer' }} onClick={() => setActionSuccess(null)} />
          </div>
        )}

        {/* ── Main Chat Area ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '340px 1fr',
            gap: '16px',
            flex: 1,
            minHeight: 0,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-glass)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
          }}
        >
          {/* CỘT TRÁI: Bộ lọc & Danh sách cuộc trò chuyện */}
          <div
            style={{
              borderRight: '1px solid var(--border-glass)',
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(15, 23, 42, 0.3)',
            }}
          >
            {/* Thanh Tab / Filter */}
            <div
              style={{
                padding: '10px 12px',
                borderBottom: '1px solid var(--border-glass)',
                display: 'flex',
                gap: '6px',
              }}
            >
              {[
                { key: 'ALL', label: 'Tất cả' },
                { key: 'PENDING', label: `Chờ duyệt${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
                { key: 'ACTIVE', label: 'Đang mở' },
                { key: 'CLOSED', label: 'Đã đóng' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilterStatus(tab.key)}
                  style={{
                    flex: 1,
                    padding: '6px 4px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor:
                      filterStatus === tab.key ? 'var(--primary, #6366f1)' : 'transparent',
                    color: filterStatus === tab.key ? '#fff' : 'var(--text-muted)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
              {isLoading ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Đang tải danh sách...
                </div>
              ) : filteredConversations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <MessageSquare size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                  <div>Không có cuộc trò chuyện nào trong mục này.</div>
                </div>
              ) : (
                filteredConversations.map((c) => {
                  const isSelected = selectedConv?.id === c.id;
                  const isPending = c.status === 'PENDING';
                  const isActive = c.status === 'ACTIVE';

                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedConv(c)}
                      style={{
                        padding: '12px',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '6px',
                        cursor: 'pointer',
                        backgroundColor: isSelected
                          ? 'rgba(99, 102, 241, 0.15)'
                          : 'transparent',
                        border: isSelected
                          ? '1px solid rgba(99, 102, 241, 0.3)'
                          : '1px solid transparent',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff' }}>
                          {c.user?.fullName || 'Sinh viên'}
                        </div>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontWeight: 600,
                            backgroundColor: isPending
                              ? 'rgba(234, 179, 8, 0.15)'
                              : isActive
                              ? 'rgba(34, 197, 94, 0.15)'
                              : 'rgba(148, 163, 184, 0.15)',
                            color: isPending
                              ? '#facc15'
                              : isActive
                              ? '#4ade80'
                              : '#94a3b8',
                          }}
                        >
                          {isPending ? 'Chờ duyệt' : isActive ? 'Hoạt động' : 'Đã đóng'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div
                          style={{
                            fontSize: '0.78rem',
                            color: 'var(--text-muted)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '200px',
                          }}
                        >
                          {c.lastMessage ? c.lastMessage.content : 'Chưa có tin nhắn'}
                        </div>

                        {Boolean(c.unreadCount && c.unreadCount > 0) && (
                          <span
                            style={{
                              backgroundColor: '#ef4444',
                              color: '#fff',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              borderRadius: '999px',
                              padding: '2px 6px',
                              minWidth: '18px',
                              textAlign: 'center',
                            }}
                          >
                            {c.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* CỘT PHẢI: Khung Chat */}
          {selectedConv ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
              {/* Header khung chat */}
              <div
                style={{
                  padding: '12px 20px',
                  borderBottom: '1px solid var(--border-glass)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(15, 23, 42, 0.2)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>
                      {selectedConv.user?.fullName}
                    </span>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        backgroundColor:
                          selectedConv.status === 'PENDING'
                            ? 'rgba(234, 179, 8, 0.15)'
                            : selectedConv.status === 'ACTIVE'
                            ? 'rgba(34, 197, 94, 0.15)'
                            : 'rgba(148, 163, 184, 0.15)',
                        color:
                          selectedConv.status === 'PENDING'
                            ? '#facc15'
                            : selectedConv.status === 'ACTIVE'
                            ? '#4ade80'
                            : '#94a3b8',
                        fontWeight: 600,
                      }}
                    >
                      {selectedConv.status === 'PENDING'
                        ? 'Chờ bạn phê duyệt'
                        : selectedConv.status === 'ACTIVE'
                        ? 'Đang trò chuyện'
                        : 'Đã đóng'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {selectedConv.user?.email}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {selectedConv.status === 'PENDING' && (
                    <button
                      onClick={() => handleAcceptConversation(selectedConv.id)}
                      disabled={isUpdatingStatus}
                      className="btn btn-primary"
                      style={{ fontSize: '0.8rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <CheckCircle size={15} />
                      Chấp nhận yêu cầu
                    </button>
                  )}

                  {selectedConv.status === 'ACTIVE' && (
                    <button
                      onClick={() => handleCloseConversation(selectedConv.id)}
                      disabled={isUpdatingStatus}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.8rem', padding: '6px 12px', color: '#f87171' }}
                    >
                      Đóng cuộc trò chuyện
                    </button>
                  )}
                </div>
              </div>

              {/* Vùng hiển thị tin nhắn */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '16px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {isLoadingMessages ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Đang tải tin nhắn...
                  </div>
                ) : selectedConv.status === 'PENDING' ? (
                  <div
                    style={{
                      textAlign: 'center',
                      margin: 'auto',
                      padding: '24px',
                      maxWidth: '450px',
                      background: 'rgba(234, 179, 8, 0.08)',
                      border: '1px solid rgba(234, 179, 8, 0.25)',
                      borderRadius: 'var(--radius-md)',
                      color: '#fef08a',
                    }}
                  >
                    <Clock size={36} color="#eab308" style={{ margin: '0 auto 12px' }} />
                    <h4 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 700 }}>
                      Yêu cầu trò chuyện đang chờ duyệt
                    </h4>
                    <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: '#cbd5e1' }}>
                      Sinh viên <strong>{selectedConv.user?.fullName}</strong> đã gửi yêu cầu kết nối với bạn.
                      Hãy bấm "Chấp nhận yêu cầu" ở trên để bắt đầu phiên tư vấn.
                    </p>
                    <button
                      onClick={() => handleAcceptConversation(selectedConv.id)}
                      className="btn btn-primary"
                      style={{ fontSize: '0.85rem', padding: '8px 18px' }}
                    >
                      Chấp nhận ngay
                    </button>
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <Info size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                    Chưa có tin nhắn nào trong cuộc trò chuyện này. Hãy gửi tin nhắn chào mừng sinh viên!
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMine = m.senderId === user?.id;
                    const dateFormatted = new Date(m.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div
                        key={m.id}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isMine ? 'flex-end' : 'flex-start',
                        }}
                      >
                        <div
                          style={{
                            maxWidth: '70%',
                            padding: '10px 14px',
                            borderRadius: '12px',
                            backgroundColor: isMine
                              ? 'var(--primary, #6366f1)'
                              : 'rgba(30, 41, 59, 0.8)',
                            color: '#ffffff',
                            wordBreak: 'break-word',
                            fontSize: '0.9rem',
                            lineHeight: 1.45,
                            borderBottomRightRadius: isMine ? '2px' : '12px',
                            borderBottomLeftRadius: !isMine ? '2px' : '12px',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                          }}
                        >
                          {m.content}
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.7rem',
                            color: 'var(--text-muted)',
                            marginTop: '3px',
                          }}
                        >
                          <span>{dateFormatted}</span>
                          {isMine && (
                            <span>
                              {m.readAt ? (
                                <span title="Đã xem"><CheckCheck size={13} color="#60a5fa" /></span>
                              ) : (
                                <span title="Đã gửi"><Check size={13} color="#94a3b8" /></span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Thanh nhập tin nhắn */}
              <div
                style={{
                  padding: '12px 20px',
                  borderTop: '1px solid var(--border-glass)',
                  background: 'rgba(15, 23, 42, 0.4)',
                }}
              >
                {selectedConv.status === 'PENDING' ? (
                  <div
                    style={{
                      padding: '10px',
                      backgroundColor: 'rgba(234, 179, 8, 0.1)',
                      border: '1px dashed rgba(234, 179, 8, 0.3)',
                      borderRadius: 'var(--radius-md)',
                      color: '#fef08a',
                      fontSize: '0.85rem',
                      textAlign: 'center',
                    }}
                  >
                    Vui lòng bấm <strong>"Chấp nhận yêu cầu"</strong> ở trên để có thể gửi tin nhắn.
                  </div>
                ) : selectedConv.status === 'CLOSED' ? (
                  <div
                    style={{
                      padding: '10px',
                      backgroundColor: 'rgba(148, 163, 184, 0.1)',
                      border: '1px dashed rgba(148, 163, 184, 0.3)',
                      borderRadius: 'var(--radius-md)',
                      color: '#cbd5e1',
                      fontSize: '0.85rem',
                      textAlign: 'center',
                    }}
                  >
                    <XCircle size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                    Cuộc trò chuyện này đã kết thúc.
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="input"
                      placeholder="Nhập phản hồi tư vấn cho sinh viên (tối đa 2000 ký tự)..."
                      value={newMessageText}
                      maxLength={2000}
                      onChange={(e) => setNewMessageText(e.target.value)}
                      disabled={isSending}
                      style={{ flex: 1, padding: '10px 14px', fontSize: '0.9rem' }}
                    />
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isSending || !newMessageText.trim()}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px' }}
                    >
                      <Send size={16} />
                      <span>{isSending ? 'Đang gửi...' : 'Gửi'}</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                color: 'var(--text-muted)',
              }}
            >
              <MessageSquare size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <div style={{ fontSize: '1rem', fontWeight: 600 }}>Chọn một sinh viên để xem tin nhắn</div>
              <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>Các yêu cầu mới sẽ xuất hiện ở cột bên trái</div>
            </div>
          )}
        </div>
      </div>
    </RoleLayout>
  );
};
