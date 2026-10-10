import React, { useState, useEffect, useRef } from 'react';
import { RoleLayout } from '../components/layout/RoleLayout';
import { api } from '../services/api';
import { Conversation, Message } from '../types/conversation';
import { Counselor } from '../types/privacy';
import { useAuth } from '../context/AuthContext';
import { useChatSocket } from '../hooks/use-chat-socket';
import {
  Send,
  AlertTriangle,
  PhoneCall,
  PlusCircle,
  Clock,
  XCircle,
  MessageSquare,
  CheckCheck,
  Check,
  RefreshCw,
  X,
  Info,
} from 'lucide-react';

export const StudentMessagesPage: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showCounselorModal, setShowCounselorModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Cuộn xuống tin nhắn mới nhất
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

        // Nếu người khác gửi, đánh dấu đã đọc
        if (msg.senderId !== user?.id) {
          markAsRead(selectedConv.id);
        }
      }

      // Cập nhật danh sách conversation
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

  // Tải danh sách cuộc trò chuyện
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

  // Tải danh sách tư vấn viên
  const fetchCounselors = async () => {
    try {
      const data = await api.getCounselors();
      setCounselors(data);
    } catch {
      // bỏ qua lỗi tải danh sách tư vấn viên
    }
  };

  useEffect(() => {
    fetchConversations();
    fetchCounselors();
  }, []);

  // Tải tin nhắn khi đổi cuộc trò chuyện
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

        // Đánh dấu đã đọc trên server
        await api.markConversationAsRead(selectedConv.id);
        markAsRead(selectedConv.id);

        // Giảm badge unread trong danh sách
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

  // Gửi tin nhắn mới
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedConv || !newMessageText.trim() || isSending) return;

    if (selectedConv.status !== 'ACTIVE') {
      setErrorMessage('Cuộc trò chuyện chưa ở trạng thái hoạt động.');
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

  // Tạo cuộc trò chuyện mới
  const handleCreateConversation = async (counselorId: string) => {
    try {
      setErrorMessage(null);
      const conv = await api.createConversation(counselorId);
      setShowCounselorModal(false);
      setActionSuccess('Đã gửi yêu cầu kết nối thành công! Đang chờ tư vấn viên chấp nhận.');
      await fetchConversations();
      setSelectedConv(conv);
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể gửi yêu cầu');
    }
  };

  // Đóng cuộc trò chuyện
  const handleCloseConversation = async () => {
    if (!selectedConv) return;
    if (!window.confirm('Bạn có chắc chắn muốn đóng cuộc trò chuyện này không? Sau khi đóng sẽ không thể gửi thêm tin nhắn.')) {
      return;
    }

    try {
      const updated = await api.updateConversationStatus(selectedConv.id, 'CLOSED');
      setSelectedConv(updated);
      setConversations((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c)),
      );
      setActionSuccess('Đã đóng cuộc trò chuyện.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể đóng cuộc trò chuyện');
    }
  };

  return (
    <RoleLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: 'calc(100vh - 130px)' }}>
        {/* ── Header & Emergency Bar ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare className="text-primary" size={24} />
              Nhắn tin với Chuyên viên Tư vấn
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Kênh trao đổi riêng tư và bảo mật giữa bạn và chuyên viên tâm lý nhà trường
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setShowEmergencyModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              <PhoneCall size={16} />
              Cần giúp ngay
            </button>

            <button
              onClick={() => setShowCounselorModal(true)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '0.85rem' }}
            >
              <PlusCircle size={16} />
              Yêu cầu tư vấn mới
            </button>
          </div>
        </div>

        {/* ── Disclaimer Banner ── */}
        <div
          style={{
            background: 'rgba(234, 179, 8, 0.08)',
            border: '1px solid rgba(234, 179, 8, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '0.82rem',
            color: '#fef08a',
          }}
        >
          <AlertTriangle size={18} color="#eab308" style={{ flexShrink: 0 }} />
          <div>
            <strong>Lưu ý quan trọng:</strong> Hệ thống nhắn tin này <strong>không phục vụ các tình huống khẩn cấp hoặc nguy cấp tính mạng</strong>.
            Nếu bạn đang gặp khủng hoảng tinh thần nghiêm trọng, hãy bấm vào nút <strong>"Cần giúp ngay"</strong> hoặc liên hệ hotline 24/7 để được hỗ trợ tức thì.
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

        {/* ── Main Chat Container ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '320px 1fr',
            gap: '16px',
            flex: 1,
            minHeight: 0,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-glass)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
          }}
        >
          {/* CỘT TRÁI: Danh sách cuộc trò chuyện */}
          <div
            style={{
              borderRight: '1px solid var(--border-glass)',
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(15, 23, 42, 0.3)',
            }}
          >
            <div
              style={{
                padding: '14px 16px',
                borderBottom: '1px solid var(--border-glass)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Hộp thư ({conversations.length})
              </span>
              <button
                onClick={fetchConversations}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                title="Tải lại"
              >
                <RefreshCw size={14} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
              {isLoading ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Đang tải danh sách...
                </div>
              ) : conversations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <MessageSquare size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                  <div>Chưa có cuộc trò chuyện nào.</div>
                  <button
                    onClick={() => setShowCounselorModal(true)}
                    className="btn btn-secondary"
                    style={{ marginTop: '12px', fontSize: '0.8rem', padding: '6px 12px' }}
                  >
                    Gửi yêu cầu ngay
                  </button>
                </div>
              ) : (
                conversations.map((c) => {
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
                          {c.counselor?.fullName || 'Chuyên viên tư vấn'}
                        </div>
                        {/* Status Badge */}
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
                            maxWidth: '180px',
                          }}
                        >
                          {c.lastMessage ? c.lastMessage.content : 'Chưa có tin nhắn'}
                        </div>

                        {/* Unread Badge */}
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
                      {selectedConv.counselor?.fullName}
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
                        ? 'Đang chờ duyệt'
                        : selectedConv.status === 'ACTIVE'
                        ? 'Đang kết nối'
                        : 'Đã đóng'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {selectedConv.counselor?.email}
                  </div>
                </div>

                {selectedConv.status !== 'CLOSED' && (
                  <button
                    onClick={handleCloseConversation}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '6px 12px', color: '#f87171' }}
                  >
                    Kết thúc cuộc trò chuyện
                  </button>
                )}
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
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <Info size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                    {selectedConv.status === 'PENDING'
                      ? 'Yêu cầu của bạn đang chờ chuyên viên chấp nhận.'
                      : 'Chưa có tin nhắn nào. Hãy gửi lời chào đầu tiên!'}
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

              {/* Thanh nhập tin nhắn hoặc Thông báo trạng thái */}
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
                    <Clock size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                    Yêu cầu kết nối đang chờ tư vấn viên phê duyệt. Bạn sẽ có thể trò chuyện ngay khi được chấp nhận.
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
                    Cuộc trò chuyện này đã kết thúc. Bạn có thể gửi yêu cầu tư vấn mới nếu cần tiếp tục hỗ trợ.
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="input"
                      placeholder="Nhập tin nhắn (tối đa 2000 ký tự)..."
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
              <div style={{ fontSize: '1rem', fontWeight: 600 }}>Chọn một cuộc trò chuyện để bắt đầu</div>
              <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>Hoặc tạo yêu cầu kết nối với chuyên viên tư vấn</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal: Chọn tư vấn viên để gửi yêu cầu ── */}
      {showCounselorModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div
            style={{
              background: 'var(--bg-card, #1e293b)',
              border: '1px solid var(--border-glass)',
              borderRadius: 'var(--radius-lg)',
              width: '90%',
              maxWidth: '500px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                Chọn Chuyên viên Tư vấn
              </h3>
              <button
                onClick={() => setShowCounselorModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Vui lòng chọn chuyên viên tư vấn tâm lý mà bạn muốn kết nối trò chuyện:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
              {counselors.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Hiện chưa có danh sách chuyên viên tư vấn.
                </div>
              ) : (
                counselors.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(15, 23, 42, 0.4)',
                      border: '1px solid var(--border-glass)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.fullName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.email}</div>
                    </div>
                    <button
                      onClick={() => handleCreateConversation(c.id)}
                      className="btn btn-primary"
                      style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                    >
                      Kết nối
                    </button>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setShowCounselorModal(false)}
              className="btn btn-secondary"
              style={{ marginTop: '8px' }}
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* ── Modal: Cần giúp ngay (Emergency) ── */}
      {showEmergencyModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div
            style={{
              background: '#0f172a',
              border: '2px solid #ef4444',
              borderRadius: 'var(--radius-lg)',
              width: '90%',
              maxWidth: '520px',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <PhoneCall size={24} color="#ef4444" />
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#f87171' }}>
                  HỖ TRỢ KHẨN CẤP 24/7
                </h3>
              </div>
              <button
                onClick={() => setShowEmergencyModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ margin: 0, fontSize: '0.88rem', color: '#e2e8f0', lineHeight: 1.5 }}>
              Nếu bạn đang cảm thấy bế tắc, khủng hoảng tâm lý hoặc có ý nghĩ gây tổn hại cho bản thân,
              hãy gọi ngay cho các đường dây nóng dưới đây. Bạn không đơn độc, luôn có người sẵn sàng lắng nghe bạn:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.15)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                <div style={{ fontWeight: 700, color: '#fca5a5', fontSize: '0.95rem' }}>📞 Đường dây nóng Ngày Mai (Hỗ trợ trầm cảm)</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>096 306 1414</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Miễn phí cước cuộc gọi, trực từ 13h00 - 20h30 hàng ngày</div>
              </div>

              <div style={{ padding: '12px 16px', background: 'rgba(59, 130, 246, 0.15)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                <div style={{ fontWeight: 700, color: '#93c5fd', fontSize: '0.95rem' }}>📞 Tổng đài Quốc gia Bảo vệ Trẻ em & Sinh viên</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>111</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Trực 24/24 tất cả các ngày trong tuần, hoàn toàn miễn phí</div>
              </div>

              <div style={{ padding: '12px 16px', background: 'rgba(168, 85, 247, 0.15)', borderRadius: '8px', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                <div style={{ fontWeight: 700, color: '#d8b4fe', fontSize: '0.95rem' }}>📞 Cấp cứu y tế & hỗ trợ nguy cấp</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>115</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cấp cứu khẩn cấp tính mạng</div>
              </div>
            </div>

            <button
              onClick={() => setShowEmergencyModal(false)}
              className="btn btn-secondary"
              style={{ marginTop: '8px' }}
            >
              Tôi đã hiểu & quay lại
            </button>
          </div>
        </div>
      )}
    </RoleLayout>
  );
};
