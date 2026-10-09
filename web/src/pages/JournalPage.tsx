import React, { useEffect, useState } from 'react';
import { RoleLayout } from '../components/layout/RoleLayout';
import { api } from '../services/api';
import { JournalEntry } from '../types/journal';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Edit3,
  Plus,
  Trash2,
  X,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

const MOODS = [
  { value: 1, emoji: '😫', label: 'Rất tệ', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
  { value: 2, emoji: '🙁', label: 'Không tốt', color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)' },
  { value: 3, emoji: '😐', label: 'Bình thường', color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)' },
  { value: 4, emoji: '🙂', label: 'Tốt', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
  { value: 5, emoji: '😄', label: 'Rất tốt', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
];

export const JournalPage: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form create state
  const [mood, setMood] = useState(3);
  const [note, setNote] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Edit modal state
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [editMood, setEditMood] = useState(3);
  const [editNote, setEditNote] = useState('');
  const [editDate, setEditDate] = useState('');

  // Delete modal state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchEntries = async () => {
    try {
      setIsLoading(true);
      const data = await api.getJournalEntries();
      setEntries(data);
    } catch (err: any) {
      setMessage({ text: err?.message || 'Không thể tải danh sách nhật ký', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) {
      showNotification('Vui lòng nhập nội dung nhật ký', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const newEntry = await api.createJournalEntry({
        mood,
        note: note.trim(),
        date: new Date(date).toISOString(),
      });
      setEntries((prev) => [newEntry, ...prev]);
      setNote('');
      setMood(3);
      showNotification('Đã lưu nhật ký mới thành công!');
    } catch (err: any) {
      showNotification(err?.message || 'Không thể tạo nhật ký', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setEditMood(entry.mood);
    setEditNote(entry.note);
    setEditDate(new Date(entry.date).toISOString().split('T')[0]);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;
    if (!editNote.trim()) {
      showNotification('Nội dung không được để trống', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const updated = await api.updateJournalEntry(editingEntry.id, {
        mood: editMood,
        note: editNote.trim(),
        date: new Date(editDate).toISOString(),
      });
      setEntries((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setEditingEntry(null);
      showNotification('Cập nhật nhật ký thành công!');
    } catch (err: any) {
      showNotification(err?.message || 'Không thể cập nhật', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      setIsSubmitting(true);
      await api.deleteJournalEntry(deletingId);
      setEntries((prev) => prev.filter((item) => item.id !== deletingId));
      setDeletingId(null);
      showNotification('Đã xóa bản ghi nhật ký');
    } catch (err: any) {
      showNotification(err?.message || 'Không thể xóa nhật ký', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMoodMeta = (m: number) => {
    return MOODS.find((item) => item.value === m) || MOODS[2];
  };

  return (
    <RoleLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header */}
        <div className="glass-card" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span className="badge badge-user">Sinh viên</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Bảo mật dữ liệu cá nhân</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '6px' }}>
            Nhật ký Cảm xúc & Suy nghĩ
          </h1>
          <p style={{ color: 'var(--text-sub)', fontSize: '0.95rem' }}>
            Ghi lại tâm trạng và những sự kiện diễn ra trong ngày. Chỉ bạn mới có quyền xem, sửa hoặc xóa nhật ký này.
          </p>
        </div>

        {/* Notification Toast */}
        {message && (
          <div
            className="glass-card"
            style={{
              padding: '14px 20px',
              borderColor: message.type === 'success' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)',
              background: message.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: message.type === 'success' ? '#34d399' : '#f87171',
              fontWeight: 600,
            }}
          >
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Main Grid: Form Tạo Mới & Danh Sách */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 420px) 1fr', gap: '24px' }}>
          {/* Form Tạo Mới */}
          <div className="glass-card" style={{ padding: '24px', height: 'fit-content' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={18} color="var(--primary)" />
              Viết nhật ký hôm nay
            </h3>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Chọn Tâm Trạng 1-5 */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Tâm trạng của bạn thế nào?
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                  {MOODS.map((m) => {
                    const isSelected = mood === m.value;
                    return (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => setMood(m.value)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '10px 4px',
                          borderRadius: 'var(--radius-md)',
                          background: isSelected ? m.bg : 'rgba(255, 255, 255, 0.03)',
                          border: isSelected ? `2px solid ${m.color}` : '1px solid var(--border-glass)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <span style={{ fontSize: '1.4rem' }}>{m.emoji}</span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: isSelected ? m.color : 'var(--text-muted)' }}>
                          {m.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ngày */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Ngày ghi nhận
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid var(--border-glass)',
                      color: 'var(--text-main)',
                      fontFamily: 'inherit',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Ghi chú */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Bạn muốn chia sẻ điều gì?
                </label>
                <textarea
                  rows={5}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Hôm nay có điều gì khiến bạn vui, lo lắng hoặc suy nghĩ?..."
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--border-glass)',
                    color: 'var(--text-main)',
                    fontFamily: 'inherit',
                    fontSize: '0.9rem',
                    resize: 'vertical',
                    outline: 'none',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !note.trim()}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px' }}
              >
                <Sparkles size={18} />
                <span>{isSubmitting ? 'Đang lưu...' : 'Lưu nhật ký'}</span>
              </button>
            </form>
          </div>

          {/* Danh Sách Nhật Ký */}
          <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={18} color="#a855f7" />
                Dòng thời gian nhật ký ({entries.length})
              </h3>
            </div>

            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                Đang tải dữ liệu nhật ký...
              </div>
            ) : entries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
                <BookOpen size={44} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                <p style={{ fontWeight: 600, marginBottom: '6px' }}>Chưa có bài viết nhật ký nào</p>
                <p style={{ fontSize: '0.85rem' }}>Hãy viết lại cảm nghĩ đầu tiên của bạn ở form bên cạnh.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {entries.map((entry) => {
                  const moodMeta = getMoodMeta(entry.mood);
                  const formattedDate = new Date(entry.date).toLocaleDateString('vi-VN', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  });

                  return (
                    <div
                      key={entry.id}
                      style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-glass)',
                        borderRadius: 'var(--radius-md)',
                        padding: '18px 20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '4px 12px',
                              borderRadius: '999px',
                              background: moodMeta.bg,
                              border: `1px solid ${moodMeta.color}55`,
                              color: moodMeta.color,
                              fontSize: '0.85rem',
                              fontWeight: 700,
                            }}
                          >
                            <span style={{ fontSize: '1.1rem' }}>{moodMeta.emoji}</span>
                            <span>{moodMeta.label} ({entry.mood}/5)</span>
                          </span>

                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            <Calendar size={14} />
                            <span>{formattedDate}</span>
                          </span>
                        </div>

                        {/* Actions: Edit & Delete */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(entry)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                            title="Sửa"
                          >
                            <Edit3 size={14} />
                            <span>Sửa</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingId(entry.id)}
                            className="btn btn-danger"
                            style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                            title="Xóa"
                          >
                            <Trash2 size={14} />
                            <span>Xóa</span>
                          </button>
                        </div>
                      </div>

                      {/* Note Content */}
                      <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                        {entry.note}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <Clock size={12} />
                        <span>Đã lưu lúc: {new Date(entry.createdAt).toLocaleTimeString('vi-VN')}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Chỉnh Sửa */}
        {editingEntry && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '20px',
            }}
          >
            <div className="glass-card" style={{ maxWidth: '540px', width: '100%', padding: '28px', background: 'rgba(30, 41, 59, 0.98)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Chỉnh sửa Nhật ký</h3>
                <button
                  type="button"
                  onClick={() => setEditingEntry(null)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Tâm trạng
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                    {MOODS.map((m) => {
                      const isSelected = editMood === m.value;
                      return (
                        <button
                          key={m.value}
                          type="button"
                          onClick={() => setEditMood(m.value)}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '8px 4px',
                            borderRadius: 'var(--radius-md)',
                            background: isSelected ? m.bg : 'rgba(255, 255, 255, 0.03)',
                            border: isSelected ? `2px solid ${m.color}` : '1px solid var(--border-glass)',
                            cursor: 'pointer',
                          }}
                        >
                          <span style={{ fontSize: '1.2rem' }}>{m.emoji}</span>
                          <span style={{ fontSize: '0.7rem', color: isSelected ? m.color : 'var(--text-muted)' }}>{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Ngày ghi nhận
                  </label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid var(--border-glass)',
                      color: 'var(--text-main)',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Nội dung
                  </label>
                  <textarea
                    rows={5}
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid var(--border-glass)',
                      color: 'var(--text-main)',
                      outline: 'none',
                      resize: 'vertical',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                  <button type="button" onClick={() => setEditingEntry(null)} className="btn btn-secondary">
                    Hủy
                  </button>
                  <button type="submit" disabled={isSubmitting || !editNote.trim()} className="btn btn-primary">
                    {isSubmitting ? 'Đang lưu...' : 'Cập nhật'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Xác Nhận Xóa */}
        {deletingId && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '20px',
            }}
          >
            <div className="glass-card" style={{ maxWidth: '420px', width: '100%', padding: '24px', background: 'rgba(30, 41, 59, 0.98)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px', color: '#f87171' }}>
                <Trash2 size={24} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Xác nhận xóa nhật ký</h3>
              </div>
              <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: '1.5' }}>
                Bạn có chắc chắn muốn xóa bài viết nhật ký này? Thao tác này sẽ không thể khôi phục lại.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setDeletingId(null)} className="btn btn-secondary">
                  Hủy
                </button>
                <button type="button" onClick={handleDelete} disabled={isSubmitting} className="btn btn-danger">
                  {isSubmitting ? 'Đang xóa...' : 'Xóa bài viết'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleLayout>
  );
};
