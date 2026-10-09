import React, { useEffect, useState } from 'react';
import { RoleLayout } from '../components/layout/RoleLayout';
import { api } from '../services/api';
import { Counselor, ConsentShare, ExportDataResponse } from '../types/privacy';
import {
  ShieldCheck,
  Eye,
  Lock,
  Download,
  Trash2,
  AlertTriangle,
  UserCheck,
  UserX,
  Info,
  CheckCircle2,
  RefreshCw,
  FileText,
  Activity,
  Calendar,
  KeyRound,
  X
} from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [consents, setConsents] = useState<ConsentShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Export State
  const [isExporting, setIsExporting] = useState(false);

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [counselorList, consentList] = await Promise.all([
        api.getCounselors(),
        api.getMyConsents(),
      ]);
      setCounselors(counselorList);
      setConsents(consentList);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải thông tin quyền riêng tư';
      setNotification({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGrantConsent = async (counselorId: string) => {
    try {
      setActionLoading(counselorId);
      await api.grantConsent(counselorId);
      setNotification({
        type: 'success',
        message: 'Đã cấp quyền chia sẻ dữ liệu cảm xúc thành công cho chuyên viên tư vấn.',
      });
      await fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi cấp quyền chia sẻ';
      setNotification({ type: 'error', message: msg });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevokeConsent = async (consentId: string, counselorId: string) => {
    try {
      setActionLoading(counselorId);
      await api.revokeConsent(consentId);
      setNotification({
        type: 'success',
        message: 'Đã thu hồi quyền chia sẻ dữ liệu thành công. Chuyên viên sẽ không thể xem dữ liệu của bạn nữa.',
      });
      await fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi thu hồi quyền chia sẻ';
      setNotification({ type: 'error', message: msg });
    } finally {
      setActionLoading(null);
    }
  };

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      const data: ExportDataResponse = await api.exportMyData();
      
      // Tạo file JSON và tải về
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fileName = `mindlog-export-${new Date().toISOString().slice(0, 10)}.json`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setNotification({
        type: 'success',
        message: `Đã xuất toàn bộ dữ liệu thành công (${data.totalEmotionLogs} lượt check-in, ${data.totalJournalEntries} nhật ký).`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi xuất dữ liệu';
      setNotification({ type: 'error', message: msg });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmPassword.trim()) {
      setDeleteError('Vui lòng nhập mật khẩu tài khoản');
      return;
    }

    try {
      setIsDeleting(true);
      setDeleteError(null);
      const res = await api.deleteMyData(confirmPassword);
      setShowDeleteModal(false);
      setConfirmPassword('');
      setNotification({
        type: 'success',
        message: res.message || 'Đã xóa toàn bộ dữ liệu cảm xúc, bài viết và chia sẻ thành công.',
      });
      await fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Mật khẩu không chính xác hoặc lỗi hệ thống';
      setDeleteError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <RoleLayout>
      <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={32} color="#818cf8" />
              <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0 }}>
                Quản lý Quyền riêng tư & Dữ liệu
              </h1>
            </div>
            <p style={{ color: 'var(--text-muted)', marginTop: '6px', fontSize: '0.95rem' }}>
              Kiểm soát minh bạch dữ liệu cá nhân, quyền xem của chuyên viên tư vấn và xuất/xóa dữ liệu.
            </p>
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="btn btn-secondary"
            style={{ padding: '8px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Làm mới</span>
          </button>
        </div>

        {/* Thông báo Alert */}
        {notification && (
          <div
            style={{
              padding: '14px 20px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: notification.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${notification.type === 'success' ? 'rgba(34, 197, 94, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
              color: notification.type === 'success' ? '#4ade80' : '#f87171',
              fontSize: '0.92rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex' }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* ── BẢNG MINH BẠCH QUYỀN TRUY CẬP (Ai xem được gì) ── */}
        <div className="card" style={{ padding: '24px 28px', background: 'rgba(30, 41, 59, 0.45)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <Info size={22} color="#60a5fa" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
              Chính sách minh bạch: Ai có quyền xem dữ liệu của bạn?
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {/* Sinh viên */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              borderRadius: 'var(--radius-md)',
              padding: '18px 20px',
              border: '1px solid rgba(99, 102, 241, 0.25)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#a5b4fc', fontWeight: 700, marginBottom: '8px' }}>
                <Eye size={18} />
                <span>Sinh viên (Bạn)</span>
              </div>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                Bạn có <strong>toàn quyền sở hữu</strong> dữ liệu: xem lịch sử webcam, bài viết nhật ký, xuất báo cáo JSON hoặc xóa vĩnh viễn dữ liệu bất kỳ lúc nào.
              </p>
            </div>

            {/* Chuyên viên tư vấn */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              borderRadius: 'var(--radius-md)',
              padding: '18px 20px',
              border: '1px solid rgba(16, 185, 129, 0.25)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#34d399', fontWeight: 700, marginBottom: '8px' }}>
                <UserCheck size={18} />
                <span>Chuyên viên tư vấn</span>
              </div>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                <strong>Mặc định KHÔNG THỂ xem</strong>. Chuyên viên chỉ có thể theo dõi xu hướng cảm xúc khi bạn chủ động cấp quyền chia sẻ (bên dưới) và bạn có thể thu hồi bất cứ lúc nào.
              </p>
            </div>

            {/* Quản trị viên */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              borderRadius: 'var(--radius-md)',
              padding: '18px 20px',
              border: '1px solid rgba(239, 68, 68, 0.25)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f87171', fontWeight: 700, marginBottom: '8px' }}>
                <Lock size={18} />
                <span>Quản trị viên (Admin)</span>
              </div>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                Admin chỉ quản lý tài khoản và số liệu tổng hợp ẩn danh. <strong>Tuyệt đối không thể truy cập</strong> cảm xúc hay nội dung nhật ký riêng tư của bạn.
              </p>
            </div>
          </div>

          <div style={{
            marginTop: '16px',
            padding: '12px 16px',
            background: 'rgba(99, 102, 241, 0.08)',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '3px solid #818cf8',
            fontSize: '0.84rem',
            color: '#c7d2fe',
          }}>
            🔒 <strong>Cam kết bảo mật Webcam:</strong> Hệ thống MindLog hoàn toàn <strong>không lưu trữ hình ảnh hoặc video webcam</strong> vào máy chủ. Khung hình chỉ phân tích realtime trong bộ nhớ tạm rồi hủy ngay lập tức.
          </div>
        </div>

        {/* ── QUẢN LÝ CHIA SẺ VỚI CHUYÊN VIÊN TƯ VẤN ── */}
        <div className="card" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <UserCheck size={22} color="#10b981" />
                <span>Chia sẻ dữ liệu với Chuyên viên tư vấn</span>
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px', margin: 0 }}>
                Cho phép chuyên viên tâm lý nhà trường theo dõi xu hướng cảm xúc của bạn để hỗ trợ kịp thời khi có dấu hiệu căng thẳng kéo dài.
              </p>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
              <div>Đang tải danh sách tư vấn viên...</div>
            </div>
          ) : counselors.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
              Hiện chưa có chuyên viên tư vấn nào trong hệ thống.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {counselors.map((counselor) => {
                const userConsent = consents.find((c) => c.counselorId === counselor.id);
                const isActive = userConsent?.status === 'ACTIVE';
                const isActionBusy = actionLoading === counselor.id;

                return (
                  <div
                    key={counselor.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '18px 22px',
                      background: 'rgba(15, 23, 42, 0.55)',
                      borderRadius: 'var(--radius-md)',
                      border: isActive
                        ? '1px solid rgba(16, 185, 129, 0.4)'
                        : '1px solid var(--border-glass)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '50%',
                          background: isActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isActive ? '#34d399' : 'var(--text-muted)',
                        }}
                      >
                        <UserCheck size={22} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontWeight: 700, fontSize: '1rem', color: '#ffffff' }}>
                            {counselor.fullName}
                          </span>
                          {isActive ? (
                            <span
                              style={{
                                fontSize: '0.75rem',
                                padding: '3px 9px',
                                borderRadius: '12px',
                                background: 'rgba(34, 197, 94, 0.2)',
                                color: '#4ade80',
                                fontWeight: 700,
                                border: '1px solid rgba(34, 197, 94, 0.35)',
                              }}
                            >
                              Đang chia sẻ
                            </span>
                          ) : userConsent?.status === 'REVOKED' ? (
                            <span
                              style={{
                                fontSize: '0.75rem',
                                padding: '3px 9px',
                                borderRadius: '12px',
                                background: 'rgba(239, 68, 68, 0.15)',
                                color: '#f87171',
                                fontWeight: 600,
                              }}
                            >
                              Đã thu hồi
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: '0.75rem',
                                padding: '3px 9px',
                                borderRadius: '12px',
                                background: 'rgba(148, 163, 184, 0.12)',
                                color: 'var(--text-muted)',
                              }}
                            >
                              Chưa cấp quyền
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                          {counselor.email}
                        </div>
                        {userConsent && (
                          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>
                            {isActive
                              ? `Cấp quyền từ: ${new Date(userConsent.grantedAt).toLocaleString('vi-VN')}`
                              : userConsent.revokedAt
                              ? `Thu hồi lúc: ${new Date(userConsent.revokedAt).toLocaleString('vi-VN')}`
                              : ''}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      {isActive ? (
                        <button
                          onClick={() => handleRevokeConsent(userConsent.id, counselor.id)}
                          disabled={isActionBusy}
                          className="btn"
                          style={{
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: '#f87171',
                            border: '1px solid rgba(239, 68, 68, 0.35)',
                            padding: '8px 16px',
                            fontSize: '0.88rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          {isActionBusy ? <RefreshCw size={15} className="animate-spin" /> : <UserX size={16} />}
                          <span>Thu hồi quyền</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleGrantConsent(counselor.id)}
                          disabled={isActionBusy}
                          className="btn btn-primary"
                          style={{
                            padding: '8px 16px',
                            fontSize: '0.88rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          {isActionBusy ? <RefreshCw size={15} className="animate-spin" /> : <UserCheck size={16} />}
                          <span>Cho phép chia sẻ</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── XUẤT VÀ XÓA DỮ LIỆU CÁ NHÂN ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          
          {/* Card: Xuất dữ liệu */}
          <div className="card" style={{ padding: '24px 26px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <Download size={22} color="#818cf8" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                  Xuất dữ liệu cá nhân (JSON)
                </h3>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                Tải xuống toàn bộ hồ sơ lưu trữ của bạn tại MindLog: tất cả các phiên check-in cảm xúc, bài viết nhật ký cá nhân và lịch sử chia sẻ dưới định dạng tệp chuẩn JSON.
              </p>

              <div style={{ display: 'flex', gap: '16px', marginTop: '18px', fontSize: '0.82rem', color: '#94a3b8' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Activity size={15} color="#818cf8" />
                  <span>Cảm xúc Webcam</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={15} color="#818cf8" />
                  <span>Bài viết Nhật ký</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={15} color="#818cf8" />
                  <span>Mốc thời gian</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '24px' }}>
              <button
                onClick={handleExportData}
                disabled={isExporting}
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  padding: '10px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontWeight: 600,
                }}
              >
                {isExporting ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
                <span>{isExporting ? 'Đang xuất dữ liệu...' : 'Tải xuống tệp dữ liệu (JSON)'}</span>
              </button>
            </div>
          </div>

          {/* Card: Khu vực nguy hiểm (Xóa dữ liệu) */}
          <div
            className="card"
            style={{
              padding: '24px 26px',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              background: 'rgba(239, 68, 68, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <Trash2 size={22} color="#f87171" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#f87171' }}>
                  Vùng nguy hiểm: Xóa dữ liệu
                </h3>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                Hành động này sẽ <strong>xóa vĩnh viễn</strong> toàn bộ lịch sử check-in cảm xúc, bài viết nhật ký và bản ghi chia sẻ khỏi cơ sở dữ liệu. Tài khoản của bạn vẫn được giữ nguyên.
              </p>

              <div style={{
                marginTop: '16px',
                padding: '10px 14px',
                background: 'rgba(239, 68, 68, 0.12)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                color: '#fca5a5',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <AlertTriangle size={16} />
                <span>Thao tác này không thể hoàn tác sau khi xác nhận.</span>
              </div>
            </div>

            <div style={{ marginTop: '24px' }}>
              <button
                onClick={() => {
                  setShowDeleteModal(true);
                  setDeleteError(null);
                  setConfirmPassword('');
                }}
                className="btn"
                style={{
                  width: '100%',
                  padding: '10px 18px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#f87171',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontWeight: 600,
                }}
              >
                <Trash2 size={16} />
                <span>Xóa toàn bộ dữ liệu của tôi</span>
              </button>
            </div>
          </div>

        </div>

        {/* ── MODAL XÁC NHẬN MẬT KHẨU ĐỂ XÓA DỮ LIỆU ── */}
        {showDeleteModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 100,
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
          >
            <div
              className="card"
              style={{
                width: '100%',
                maxWidth: '480px',
                padding: '28px',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                background: '#0f172a',
                boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f87171' }}>
                  <AlertTriangle size={24} />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                    Xác nhận xóa toàn bộ dữ liệu
                  </h3>
                </div>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Bạn sắp xóa toàn bộ lịch sử check-in cảm xúc, bài nhật ký và quyền chia sẻ. Để đảm bảo an toàn, vui lòng nhập lại mật khẩu tài khoản của bạn.
              </p>

              <form onSubmit={handleDeleteData} style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: '#cbd5e1' }}>
                    Mật khẩu hiện tại của bạn
                  </label>
                  <div style={{ position: 'relative' }}>
                    <KeyRound
                      size={16}
                      style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                    />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập mật khẩu..."
                      required
                      className="input"
                      style={{ width: '100%', paddingLeft: '38px' }}
                    />
                  </div>
                </div>

                {deleteError && (
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(239, 68, 68, 0.15)',
                      color: '#f87171',
                      fontSize: '0.85rem',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                    }}
                  >
                    {deleteError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '10px' }}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isDeleting}
                    className="btn"
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: '#ef4444',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    {isDeleting ? <RefreshCw size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    <span>{isDeleting ? 'Đang xóa...' : 'Xóa vĩnh viễn'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </RoleLayout>
  );
};
