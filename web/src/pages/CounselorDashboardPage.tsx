import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { RoleLayout } from '../components/layout/RoleLayout';
import { api } from '../services/api';
import { CounselorClient, CounselorClientSummary, CounselorStats, RealtimeAlert } from '../types/counselor';
import { Appointment } from '../types/appointment';
import { ResourceItem, CreateResourcePayload } from '../types/resource';
import { io, Socket } from 'socket.io-client';
import {
  Bell,
  Users,
  ShieldAlert,
  Activity,
  AlertTriangle,
  RefreshCw,
  Eye,
  Lock,
  X,
  Radio,
  HeartHandshake,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  PlusCircle,
  Trash2,
  Edit3
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const EMOTION_COLORS: Record<string, string> = {
  Happy: '#22c55e',
  Neutral: '#94a3b8',
  Sad: '#3b82f6',
  Fear: '#a855f7',
  Angry: '#ef4444',
  Surprise: '#f59e0b',
  Disgust: '#10b981',
};

export const CounselorDashboardPage: React.FC = () => {
  const { user } = useAuth();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'clients' | 'appointments' | 'resources'>('clients');

  // State: Clients & Stats
  const [clients, setClients] = useState<CounselorClient[]>([]);
  const [stats, setStats] = useState<CounselorStats | null>(null);
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);

  // State: Appointments
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [appointmentActionBusy, setAppointmentActionBusy] = useState<string | null>(null);

  // State: Resources
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);
  const [resourceFormData, setResourceFormData] = useState<CreateResourcePayload>({
    title: '',
    description: '',
    type: 'EXERCISE',
    level: 'all',
    content: '',
    durationMinutes: 10,
  });
  const [resourceSubmitting, setResourceSubmitting] = useState(false);
  const [resourceError, setResourceError] = useState<string | null>(null);

  // Selected student summary modal
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [clientSummary, setClientSummary] = useState<CounselorClientSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Real-time alerts via Socket.IO
  const [realtimeAlerts, setRealtimeAlerts] = useState<RealtimeAlert[]>([]);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // 1. Fetch Clients
  const fetchClients = async () => {
    try {
      setLoadingClients(true);
      const data = await api.getCounselorClients();
      setClients(data);
    } catch (err: unknown) {
      console.error('Lỗi khi tải danh sách sinh viên:', err);
    } finally {
      setLoadingClients(false);
    }
  };

  // 2. Fetch Stats
  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const data = await api.getCounselorStats();
      setStats(data);
    } catch (err: unknown) {
      console.error('Lỗi khi tải thống kê ẩn danh:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  // 3. Fetch Appointments
  const fetchAppointments = async () => {
    try {
      setLoadingAppointments(true);
      const data = await api.getCounselorAppointments();
      setAppointments(data);
    } catch (err: unknown) {
      console.error('Lỗi khi tải lịch hẹn:', err);
    } finally {
      setLoadingAppointments(false);
    }
  };

  // 4. Fetch Resources
  const fetchResources = async () => {
    try {
      setLoadingResources(true);
      const data = await api.getResources('all');
      setResources(data);
    } catch (err: unknown) {
      console.error('Lỗi khi tải tài liệu:', err);
    } finally {
      setLoadingResources(false);
    }
  };

  // Socket.IO Real-time Gateway
  useEffect(() => {
    const token = localStorage.getItem('mindlog_token');
    if (!token) return;

    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const socket = io(socketUrl, { auth: { token } });
    socketRef.current = socket;

    socket.on('connect', () => setIsSocketConnected(true));
    socket.on('disconnect', () => setIsSocketConnected(false));
    socket.on('alert:prolonged', (newAlert: RealtimeAlert) => {
      setRealtimeAlerts((prev) => [newAlert, ...prev]);
      fetchClients();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    fetchClients();
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'appointments') {
      fetchAppointments();
    } else if (activeTab === 'resources') {
      fetchResources();
    }
  }, [activeTab]);

  // Appointment actions
  const handleUpdateAppointment = async (id: string, status: 'CONFIRMED' | 'CANCELLED') => {
    try {
      setAppointmentActionBusy(id);
      await api.updateAppointmentStatus(id, status);
      await fetchAppointments();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi cập nhật lịch hẹn';
      alert(msg);
    } finally {
      setAppointmentActionBusy(null);
    }
  };

  // Resource actions
  const handleSaveResource = async (e: React.FormEvent) => {
    e.preventDefault();
    setResourceError(null);
    try {
      setResourceSubmitting(true);
      if (editingResourceId) {
        await api.updateResource(editingResourceId, resourceFormData);
      } else {
        await api.createResource(resourceFormData);
      }
      setShowResourceModal(false);
      setEditingResourceId(null);
      setResourceFormData({
        title: '',
        description: '',
        type: 'EXERCISE',
        level: 'all',
        content: '',
        durationMinutes: 10,
      });
      await fetchResources();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi lưu tài liệu';
      setResourceError(msg);
    } finally {
      setResourceSubmitting(false);
    }
  };

  const handleDeleteResource = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài liệu này?')) return;
    try {
      await api.deleteResource(id);
      await fetchResources();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi xóa tài liệu';
      alert(msg);
    }
  };

  // Open student detail modal
  const handleOpenStudentDetail = async (studentId: string) => {
    setSelectedStudentId(studentId);
    setSummaryLoading(true);
    setSummaryError(null);
    setClientSummary(null);

    try {
      const data = await api.getCounselorClientSummary(studentId, 'week');
      setClientSummary(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể xem dữ liệu sinh viên';
      setSummaryError(msg);
      fetchClients();
    } finally {
      setSummaryLoading(false);
    }
  };

  const getAlertBadge = (level: string) => {
    switch (level) {
      case 'keo_dai':
        return (
          <span style={{ padding: '4px 10px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)', fontWeight: 700, fontSize: '0.78rem' }}>
            🚨 Nguy cơ kéo dài
          </span>
        );
      case 'vua':
        return (
          <span style={{ padding: '4px 10px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.4)', fontWeight: 700, fontSize: '0.78rem' }}>
            ⚠️ Mức vừa (≥4 ngày)
          </span>
        );
      case 'nhe':
        return (
          <span style={{ padding: '4px 10px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.4)', fontWeight: 600, fontSize: '0.78rem' }}>
            Nhẹ (≥2 ngày)
          </span>
        );
      case 'binh_thuong':
      default:
        return (
          <span style={{ padding: '4px 10px', borderRadius: '12px', background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', border: '1px solid rgba(34, 197, 94, 0.4)', fontWeight: 600, fontSize: '0.78rem' }}>
            Ổn định
          </span>
        );
    }
  };

  return (
    <RoleLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Header Chào Mừng & Tabs */}
        <div
          className="card"
          style={{
            padding: '24px 30px',
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(30, 41, 59, 0.6) 100%)',
            border: '1px solid rgba(168, 85, 247, 0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '18px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <span className="badge badge-counselor">Chuyên viên tư vấn</span>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.8rem',
                    color: isSocketConnected ? '#4ade80' : '#f87171',
                    background: isSocketConnected ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                    padding: '3px 10px',
                    borderRadius: '12px',
                  }}
                >
                  <Radio size={13} className={isSocketConnected ? 'animate-pulse' : ''} />
                  <span>{isSocketConnected ? 'Realtime Gateway đã kết nối' : 'Đang kết nối lại Gateway...'}</span>
                </div>
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>
                Không gian Quản lý Tham vấn – {user?.fullName}
              </h1>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  if (activeTab === 'clients') { fetchClients(); fetchStats(); }
                  else if (activeTab === 'appointments') { fetchAppointments(); }
                  else { fetchResources(); }
                }}
                className="btn btn-secondary"
                style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
              >
                <RefreshCw size={14} className={loadingClients || loadingAppointments || loadingResources ? 'animate-spin' : ''} />
                <span>Làm mới</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px' }}>
            <button
              onClick={() => setActiveTab('clients')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                background: activeTab === 'clients' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'clients' ? '#ffffff' : 'var(--text-muted)',
              }}
            >
              <Users size={16} />
              <span>Sinh viên đồng hành ({clients.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('appointments')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                background: activeTab === 'appointments' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'appointments' ? '#ffffff' : 'var(--text-muted)',
              }}
            >
              <Calendar size={16} />
              <span>Lịch hẹn tham vấn ({appointments.filter(a => a.status === 'PENDING').length} chờ duyệt)</span>
            </button>

            <button
              onClick={() => setActiveTab('resources')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                background: activeTab === 'resources' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'resources' ? '#ffffff' : 'var(--text-muted)',
              }}
            >
              <FileText size={16} />
              <span>Quản lý Tài liệu & Bài tập ({resources.length})</span>
            </button>
          </div>
        </div>

        {/* Thông báo Real-time nhận được trong phiên */}
        {realtimeAlerts.length > 0 && (
          <div
            style={{
              padding: '16px 20px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', fontWeight: 700 }}>
                <Bell size={18} className="animate-bounce" />
                <span>CẢNH BÁO NGUY CƠ KÉO DÀI MỚI NHẬN ĐƯỢC ({realtimeAlerts.length})</span>
              </div>
              <button
                onClick={() => setRealtimeAlerts([])}
                style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', fontSize: '0.8rem' }}
              >
                Đóng thông báo
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {realtimeAlerts.map((alert, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(15, 23, 42, 0.6)',
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                  }}
                >
                  <span>
                    Sinh viên <strong>{alert.studentName}</strong> ({alert.studentEmail}) xuất hiện cảm xúc tiêu cực kéo dài nguy cơ cao.
                  </span>
                  <button
                    onClick={() => handleOpenStudentDetail(alert.studentId)}
                    className="btn btn-primary"
                    style={{ padding: '3px 10px', fontSize: '0.78rem' }}
                  >
                    Xem chi tiết
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 1: SINH VIÊN ĐỒNG HÀNH & THỐNG KÊ ── */}
        {activeTab === 'clients' && (
          <>
            {/* DANH SÁCH SINH VIÊN ĐỒNG Ý CHIA SẺ */}
            <div className="card" style={{ padding: '26px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Users size={22} color="#a855f7" />
                    <span>Sinh viên đang đồng ý chia sẻ dữ liệu ({clients.length})</span>
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginTop: '4px', margin: 0 }}>
                    Chỉ hiển thị sinh viên có bản ghi `ConsentShare` ACTIVE. Quyền truy cập chấm dứt lập tức nếu sinh viên thu hồi.
                  </p>
                </div>
              </div>

              {loadingClients ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px' }} />
                  <div>Đang tải danh sách sinh viên...</div>
                </div>
              ) : clients.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(15, 23, 42, 0.4)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }}>
                  <HeartHandshake size={36} color="#64748b" style={{ margin: '0 auto 12px' }} />
                  <div style={{ fontWeight: 600, color: '#e2e8f0', marginBottom: '4px' }}>Chưa có sinh viên nào cấp quyền chia sẻ dữ liệu</div>
                  <p style={{ fontSize: '0.85rem', maxWidth: '500px', margin: '0 auto' }}>
                    Khi sinh viên vào trang Quyền riêng tư và chọn &quot;Cho phép chia sẻ&quot; với bạn, thông tin sẽ hiển thị tại đây.
                  </p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)', fontSize: '0.82rem', textTransform: 'uppercase' }}>
                        <th style={{ padding: '12px 16px' }}>Sinh viên</th>
                        <th style={{ padding: '12px 16px' }}>Mức cảnh báo</th>
                        <th style={{ padding: '12px 16px' }}>Chuỗi tiêu cực</th>
                        <th style={{ padding: '12px 16px' }}>Check-in gần nhất</th>
                        <th style={{ padding: '12px 16px' }}>Ngày cấp quyền</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right' }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clients.map((c) => (
                        <tr key={c.consentId} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <td style={{ padding: '16px' }}>
                            <div style={{ fontWeight: 700, color: '#ffffff' }}>{c.student.fullName}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.student.email}</div>
                          </td>
                          <td style={{ padding: '16px' }}>{getAlertBadge(c.alertLevel)}</td>
                          <td style={{ padding: '16px' }}>
                            <span style={{ fontWeight: 700, color: c.consecutiveNegativeDays >= 4 ? '#f87171' : '#cbd5e1' }}>
                              {c.consecutiveNegativeDays} ngày
                            </span>
                          </td>
                          <td style={{ padding: '16px' }}>
                            {c.lastCheckIn ? (
                              <div>
                                <div style={{ fontSize: '0.86rem' }}>{new Date(c.lastCheckIn).toLocaleDateString('vi-VN')}</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Cảm xúc: <strong>{c.lastEmotion}</strong></div>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Chưa có</span>
                            )}
                          </td>
                          <td style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                            {new Date(c.grantedAt).toLocaleDateString('vi-VN')}
                          </td>
                          <td style={{ padding: '16px', textAlign: 'right' }}>
                            <button
                              onClick={() => handleOpenStudentDetail(c.student.id)}
                              className="btn btn-secondary"
                              style={{ padding: '7px 14px', fontSize: '0.84rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            >
                              <Eye size={15} />
                              <span>Xem xu hướng</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* THỐNG KÊ ẨN DANH TOÀN TRƯỜNG */}
            <div className="card" style={{ padding: '26px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Activity size={22} color="#60a5fa" />
                    <span>Thống kê phân bố cảm xúc ẩn danh toàn trường</span>
                  </h2>
                </div>
              </div>

              {loadingStats ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
                  <RefreshCw size={22} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                  <div>Đang tổng hợp dữ liệu ẩn danh...</div>
                </div>
              ) : !stats?.hasEnoughData ? (
                <div style={{ padding: '20px 24px', borderRadius: 'var(--radius-md)', background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(148, 163, 184, 0.2)', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <Lock size={24} color="#eab308" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <h4 style={{ fontWeight: 700, fontSize: '1rem', margin: '0 0 6px 0', color: '#fef08a' }}>
                      Chính sách bảo mật dữ liệu nhóm nhỏ (k-Anonymity)
                    </h4>
                    <p style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.5, margin: '0 0 8px 0' }}>
                      {stats?.message}
                    </p>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Số sinh viên có dữ liệu hiện tại: <strong>{stats?.currentCount ?? 0}</strong> / Yêu cầu tối thiểu: <strong>{stats?.minimumRequired ?? 5} người</strong>.
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
                      <div style={{ padding: '14px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tổng lượt check-in</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '4px' }}>{stats.totalCheckIns}</div>
                      </div>
                      <div style={{ padding: '14px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sinh viên ghi nhận</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '4px' }}>{stats.totalStudents}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ height: '220px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.distribution || []}
                          dataKey="count"
                          nameKey="emotion"
                          cx="50%"
                          cy="50%"
                          outerRadius={75}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {(stats.distribution || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={EMOTION_COLORS[entry.emotion] || '#818cf8'} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── TAB 2: XỬ LÝ LỊCH HẸN THAM VẤN ── */}
        {activeTab === 'appointments' && (
          <div className="card" style={{ padding: '26px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Calendar size={22} color="#818cf8" />
                  <span>Danh sách lịch hẹn sinh viên đăng ký ({appointments.length})</span>
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginTop: '4px', margin: 0 }}>
                  Xác nhận hoặc từ chối các phiên tham vấn trực tiếp với sinh viên.
                </p>
              </div>
            </div>

            {loadingAppointments ? (
              <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px' }} />
                <div>Đang tải danh sách lịch hẹn...</div>
              </div>
            ) : appointments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                Hiện chưa có sinh viên nào đăng ký lịch hẹn với bạn.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {appointments.map((appt) => {
                  const isBusy = appointmentActionBusy === appt.id;
                  const apptDate = new Date(appt.startAt);

                  return (
                    <div
                      key={appt.id}
                      style={{
                        padding: '18px 22px',
                        background: 'rgba(15, 23, 42, 0.55)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-glass)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '16px',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#ffffff' }}>
                            {appt.user?.fullName}
                          </span>
                          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            ({appt.user?.email})
                          </span>
                          {appt.status === 'CONFIRMED' ? (
                            <span style={{ padding: '3px 9px', borderRadius: '12px', background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', fontSize: '0.78rem', fontWeight: 700 }}>
                              Đã xác nhận
                            </span>
                          ) : appt.status === 'CANCELLED' ? (
                            <span style={{ padding: '3px 9px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', fontSize: '0.78rem', fontWeight: 600 }}>
                              Đã từ chối / Hủy
                            </span>
                          ) : (
                            <span style={{ padding: '3px 9px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', fontSize: '0.78rem', fontWeight: 600 }}>
                              Chờ xử lý
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '6px', fontSize: '0.86rem', color: '#cbd5e1' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Calendar size={15} color="#818cf8" />
                            {apptDate.toLocaleDateString('vi-VN')}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Clock size={15} color="#818cf8" />
                            {apptDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {appt.note && (
                          <div style={{ fontSize: '0.84rem', color: '#cbd5e1', fontStyle: 'italic', marginTop: '8px' }}>
                            Ghi chú từ sinh viên: &quot;{appt.note}&quot;
                          </div>
                        )}
                      </div>

                      {appt.status === 'PENDING' && (
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            onClick={() => handleUpdateAppointment(appt.id, 'CONFIRMED')}
                            disabled={isBusy}
                            className="btn btn-primary"
                            style={{ padding: '8px 16px', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            <CheckCircle2 size={16} /> Xác nhận
                          </button>
                          <button
                            onClick={() => handleUpdateAppointment(appt.id, 'CANCELLED')}
                            disabled={isBusy}
                            className="btn"
                            style={{ padding: '8px 16px', fontSize: '0.84rem', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)', display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            <XCircle size={16} /> Từ chối
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: QUẢN LÝ TÀI NGUYÊN & BÀI TẬP ── */}
        {activeTab === 'resources' && (
          <div className="card" style={{ padding: '26px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileText size={22} color="#10b981" />
                  <span>Quản lý Tài liệu & Bài tập hỗ trợ ({resources.length})</span>
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginTop: '4px', margin: 0 }}>
                  Chuyên viên có thể thêm bài tập mới hoặc chỉnh sửa/xóa các tài liệu do chính mình tạo ra.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingResourceId(null);
                  setResourceFormData({
                    title: '',
                    description: '',
                    type: 'EXERCISE',
                    level: 'all',
                    content: '',
                    durationMinutes: 10,
                  });
                  setResourceError(null);
                  setShowResourceModal(true);
                }}
                className="btn btn-primary"
                style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <PlusCircle size={16} />
                <span>Thêm tài liệu mới</span>
              </button>
            </div>

            {loadingResources ? (
              <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px' }} />
                <div>Đang tải tài nguyên...</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
                {resources.map((res) => {
                  const isMyResource = res.creatorId === user?.id;

                  return (
                    <div
                      key={res.id}
                      style={{
                        padding: '20px',
                        background: 'rgba(15, 23, 42, 0.55)',
                        borderRadius: 'var(--radius-md)',
                        border: isMyResource ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid var(--border-glass)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc' }}>
                            {res.type}
                          </span>
                          {isMyResource ? (
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
                              Do bạn tạo
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Hệ thống
                            </span>
                          )}
                        </div>

                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 6px 0', color: '#ffffff' }}>
                          {res.title}
                        </h3>

                        {res.description && (
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: '0 0 10px 0' }}>
                            {res.description}
                          </p>
                        )}

                        {res.content && (
                          <div style={{ fontSize: '0.82rem', color: '#cbd5e1', background: 'rgba(0,0,0,0.25)', padding: '10px', borderRadius: '4px', marginBottom: '12px' }}>
                            {res.content}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '12px' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          Áp dụng: <strong>{res.level}</strong>
                        </span>

                        {isMyResource ? (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => {
                                setEditingResourceId(res.id);
                                setResourceFormData({
                                  title: res.title,
                                  description: res.description ?? '',
                                  type: res.type,
                                  level: res.level,
                                  content: res.content ?? '',
                                  durationMinutes: res.durationMinutes ?? 10,
                                });
                                setResourceError(null);
                                setShowResourceModal(true);
                              }}
                              className="btn btn-secondary"
                              style={{ padding: '5px 10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Edit3 size={13} /> Sửa
                            </button>
                            <button
                              onClick={() => handleDeleteResource(res.id)}
                              className="btn"
                              style={{ padding: '5px 10px', fontSize: '0.78rem', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Trash2 size={13} /> Xóa
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            Chỉ đọc
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── MODAL THÊM / SỬA TÀI LIỆU ── */}
        {showResourceModal && (
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
                maxWidth: '560px',
                padding: '28px',
                background: '#0f172a',
                border: '1px solid var(--border-glass)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                  {editingResourceId ? 'Chỉnh sửa tài liệu' : 'Thêm tài liệu / bài tập mới'}
                </h3>
                <button onClick={() => setShowResourceModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveResource} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '5px', color: '#cbd5e1' }}>
                    Tiêu đề tài liệu / bài tập
                  </label>
                  <input
                    type="text"
                    value={resourceFormData.title}
                    onChange={(e) => setResourceFormData({ ...resourceFormData, title: e.target.value })}
                    required
                    placeholder="VD: Bài tập hít thở thư giãn 5 phút"
                    className="input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '5px', color: '#cbd5e1' }}>
                      Phân loại
                    </label>
                    <select
                      value={resourceFormData.type}
                      onChange={(e) => setResourceFormData({ ...resourceFormData, type: e.target.value })}
                      className="input"
                      style={{ width: '100%' }}
                    >
                      <option value="EXERCISE">Bài tập thực hành (EXERCISE)</option>
                      <option value="ARTICLE">Bài viết / Cẩm nang (ARTICLE)</option>
                      <option value="HOTLINE">Đường dây nóng (HOTLINE)</option>
                      <option value="TIP">Mẹo tâm lý (TIP)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '5px', color: '#cbd5e1' }}>
                      Mức cảnh báo áp dụng
                    </label>
                    <select
                      value={resourceFormData.level}
                      onChange={(e) => setResourceFormData({ ...resourceFormData, level: e.target.value })}
                      className="input"
                      style={{ width: '100%' }}
                    >
                      <option value="all">Tất cả mức độ (all)</option>
                      <option value="nhe">Mức nhẹ (nhe)</option>
                      <option value="vua">Mức vừa (vua)</option>
                      <option value="keo_dai">Nguy cơ kéo dài (keo_dai)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '5px', color: '#cbd5e1' }}>
                    Mô tả tóm tắt
                  </label>
                  <input
                    type="text"
                    value={resourceFormData.description}
                    onChange={(e) => setResourceFormData({ ...resourceFormData, description: e.target.value })}
                    placeholder="Tóm tắt công dụng hoặc nội dung bài viết..."
                    className="input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '5px', color: '#cbd5e1' }}>
                    Nội dung hướng dẫn chi tiết
                  </label>
                  <textarea
                    value={resourceFormData.content}
                    onChange={(e) => setResourceFormData({ ...resourceFormData, content: e.target.value })}
                    rows={4}
                    placeholder="Các bước thực hiện bài tập hoặc lời khuyên tâm lý..."
                    className="input"
                    style={{ width: '100%', resize: 'none' }}
                  />
                </div>

                {resourceError && (
                  <div style={{ padding: '10px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', fontSize: '0.84rem' }}>
                    {resourceError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  <button type="button" onClick={() => setShowResourceModal(false)} className="btn btn-secondary" style={{ flex: 1, padding: '10px' }}>
                    Hủy
                  </button>
                  <button type="submit" disabled={resourceSubmitting} className="btn btn-primary" style={{ flex: 1, padding: '10px', fontWeight: 600 }}>
                    {resourceSubmitting ? 'Đang lưu...' : 'Lưu tài liệu'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── MODAL CHI TIẾT XU HƯỚNG CẢM XÚC SINH VIÊN ── */}
        {selectedStudentId && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 100,
              background: 'rgba(0, 0, 0, 0.8)',
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
                maxWidth: '960px',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '32px',
                background: '#0f172a',
                border: '1px solid var(--border-glass)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>
                    Hồ sơ Cảm xúc Sinh viên: {clientSummary?.student?.fullName || 'Đang tải...'}
                  </h3>
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {clientSummary?.student?.email}
                  </div>
                </div>
                <button onClick={() => setSelectedStudentId(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={24} />
                </button>
              </div>

              {summaryLoading ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                  <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px' }} />
                  <div>Đang nạp dữ liệu chi tiết từ cơ sở dữ liệu...</div>
                </div>
              ) : summaryError ? (
                <div style={{ padding: '24px', borderRadius: 'var(--radius-md)', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#f87171', textAlign: 'center' }}>
                  <ShieldAlert size={40} style={{ margin: '0 auto 12px', color: '#ef4444' }} />
                  <h4 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 8px 0' }}>
                    Quyền truy cập bị từ chối (403 Forbidden)
                  </h4>
                  <p style={{ fontSize: '0.92rem', color: '#fca5a5', maxWidth: '580px', margin: '0 auto 16px auto' }}>
                    {summaryError}
                  </p>
                  <button onClick={() => setSelectedStudentId(null)} className="btn btn-secondary" style={{ padding: '8px 20px' }}>
                    Đóng cửa sổ
                  </button>
                </div>
              ) : clientSummary ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ padding: '16px 20px', borderRadius: 'var(--radius-md)', background: clientSummary.alert.level === 'keo_dai' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <AlertTriangle size={18} color="#ef4444" />
                      <strong>{clientSummary.alert.activeRuleName}</strong>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.88rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                      {clientSummary.alert.message}
                    </p>
                  </div>

                  <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '20px', borderRadius: 'var(--radius-md)' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 16px 0' }}>
                      Xu hướng điểm cảm xúc trong 7 ngày gần nhất
                    </h4>
                    <div style={{ height: '260px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={clientSummary.summary.trend}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" />
                          <XAxis dataKey="label" stroke="#64748b" />
                          <YAxis domain={[0, 100]} stroke="#64748b" />
                          <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                          <Line type="monotone" dataKey="avgPositive" name="Tích cực (%)" stroke="#4ade80" strokeWidth={2.5} dot={{ r: 4 }} />
                          <Line type="monotone" dataKey="avgNegative" name="Tiêu cực (%)" stroke="#f87171" strokeWidth={2.5} dot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

      </div>
    </RoleLayout>
  );
};
