import React, { useEffect, useState } from 'react';
import { RoleLayout } from '../components/layout/RoleLayout';
import { api } from '../services/api';
import { Appointment } from '../types/appointment';
import { Counselor } from '../types/privacy';
import { ResourceItem } from '../types/resource';
import {
  Calendar,
  Clock,
  User,
  PlusCircle,
  XCircle,
  CheckCircle2,
  AlertCircle,
  PhoneCall,
  RefreshCw,
  ShieldAlert,
  Wind
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const StudentAppointmentsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'appointments' | 'resources'>('appointments');

  // Appointments state
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);

  // Booking Form fields
  const [selectedCounselorId, setSelectedCounselorId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('09:00');
  const [bookingNote, setBookingNote] = useState('');

  // Resources state
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loadingResources, setLoadingResources] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<string>('all');

  const fetchAppointmentsData = async () => {
    try {
      setLoadingAppointments(true);
      const [appts, cList] = await Promise.all([
        api.getMyAppointments(),
        api.getCounselors(),
      ]);
      setAppointments(appts);
      setCounselors(cList);
      if (cList.length > 0 && !selectedCounselorId) {
        setSelectedCounselorId(cList[0].id);
      }
    } catch (err: unknown) {
      console.error('Lỗi khi tải lịch hẹn:', err);
    } finally {
      setLoadingAppointments(false);
    }
  };

  const fetchResourcesData = async (level: string) => {
    try {
      setLoadingResources(true);
      const data = await api.getResources(level);
      setResources(data);
    } catch (err: unknown) {
      console.error('Lỗi khi tải tài liệu:', err);
    } finally {
      setLoadingResources(false);
    }
  };

  useEffect(() => {
    fetchAppointmentsData();
    // Default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setAppointmentDate(tomorrow.toISOString().slice(0, 10));
  }, []);

  useEffect(() => {
    if (activeTab === 'resources') {
      fetchResourcesData(selectedLevel);
    }
  }, [activeTab, selectedLevel]);

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);
    setBookingSuccess(null);

    if (!selectedCounselorId || !appointmentDate || !appointmentTime) {
      setBookingError('Vui lòng điền đầy đủ ngày giờ và chọn chuyên viên tư vấn');
      return;
    }

    const startAtIso = new Date(`${appointmentDate}T${appointmentTime}:00`).toISOString();

    try {
      setBookingLoading(true);
      await api.createAppointment({
        counselorId: selectedCounselorId,
        startAt: startAtIso,
        note: bookingNote.trim() || undefined,
      });

      setBookingSuccess('Đã gửi yêu cầu đặt lịch thành công! Chuyên viên tư vấn sẽ xem xét và phản hồi.');
      setBookingNote('');
      await fetchAppointmentsData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi đặt lịch hẹn';
      setBookingError(msg);
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancelAppointment = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy lịch hẹn này?')) return;
    try {
      await api.cancelAppointment(id);
      await fetchAppointmentsData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi hủy lịch hẹn';
      alert(msg);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '12px', background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', fontSize: '0.8rem', fontWeight: 700 }}>
            <CheckCircle2 size={14} /> Đã xác nhận
          </span>
        );
      case 'CANCELLED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', fontSize: '0.8rem', fontWeight: 600 }}>
            <XCircle size={14} /> Đã hủy
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', fontSize: '0.8rem', fontWeight: 600 }}>
            <Clock size={14} /> Chờ duyệt
          </span>
        );
    }
  };

  return (
    <RoleLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Calendar size={30} color="#818cf8" />
              <span>Lịch hẹn Tham vấn & Thư viện Tài liệu</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '6px', fontSize: '0.95rem' }}>
              Đặt lịch trao đổi trực tiếp với chuyên viên tâm lý và khám phá các bài tập, cẩm nang thư giãn khoa học.
            </p>
          </div>

          {/* Tab Selector */}
          <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.7)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
            <button
              onClick={() => setActiveTab('appointments')}
              style={{
                padding: '8px 18px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
                background: activeTab === 'appointments' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'appointments' ? '#ffffff' : 'var(--text-muted)',
                transition: 'all 0.2s',
              }}
            >
              Lịch hẹn của tôi
            </button>
            <button
              onClick={() => setActiveTab('resources')}
              style={{
                padding: '8px 18px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
                background: activeTab === 'resources' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'resources' ? '#ffffff' : 'var(--text-muted)',
                transition: 'all 0.2s',
              }}
            >
              Thư viện tài liệu & bài tập
            </button>
          </div>
        </div>

        {/* ── TAB 1: LỊCH HẸN ── */}
        {activeTab === 'appointments' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Banner bảo mật: Đặt lịch không tự động chia sẻ cảm xúc */}
            <div
              style={{
                padding: '14px 20px',
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                fontSize: '0.88rem',
                color: '#c7d2fe',
              }}
            >
              <ShieldAlert size={22} color="#818cf8" style={{ flexShrink: 0 }} />
              <div>
                <strong>Bảo mật quyền riêng tư:</strong> Đặt lịch hẹn hoàn toàn độc lập với việc chia sẻ dữ liệu. Chuyên viên sẽ <strong>không thể xem</strong> nhật ký hay lịch sử cảm xúc webcam của bạn trừ khi bạn chủ động cấp quyền tại trang <Link to="/student/privacy" style={{ color: '#a5b4fc', textDecoration: 'underline' }}>Quyền riêng tư</Link>.
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
              
              {/* Form Đặt lịch mới */}
              <div className="card" style={{ padding: '24px 28px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <PlusCircle size={20} color="#818cf8" />
                  <span>Đặt lịch hẹn tham vấn mới</span>
                </h3>

                <form onSubmit={handleBookAppointment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: '#cbd5e1' }}>
                      Chọn Chuyên viên tư vấn
                    </label>
                    <select
                      value={selectedCounselorId}
                      onChange={(e) => setSelectedCounselorId(e.target.value)}
                      required
                      className="input"
                      style={{ width: '100%' }}
                    >
                      {counselors.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.fullName} ({c.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: '#cbd5e1' }}>
                        Ngày hẹn
                      </label>
                      <input
                        type="date"
                        value={appointmentDate}
                        onChange={(e) => setAppointmentDate(e.target.value)}
                        required
                        className="input"
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: '#cbd5e1' }}>
                        Khung giờ
                      </label>
                      <select
                        value={appointmentTime}
                        onChange={(e) => setAppointmentTime(e.target.value)}
                        className="input"
                        style={{ width: '100%' }}
                      >
                        <option value="08:30">08:30 - 09:15</option>
                        <option value="09:30">09:30 - 10:15</option>
                        <option value="10:30">10:30 - 11:15</option>
                        <option value="14:00">14:00 - 14:45</option>
                        <option value="15:00">15:00 - 15:45</option>
                        <option value="16:00">16:00 - 16:45</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: '#cbd5e1' }}>
                      Nội dung bạn muốn trao đổi (tùy chọn)
                    </label>
                    <textarea
                      value={bookingNote}
                      onChange={(e) => setBookingNote(e.target.value)}
                      rows={3}
                      placeholder="Mô tả ngắn gọn về vấn đề bạn đang gặp phải (stress đồ án, mất ngủ, khó tập trung...)"
                      className="input"
                      style={{ width: '100%', resize: 'none' }}
                    />
                  </div>

                  {bookingError && (
                    <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', fontSize: '0.84rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                      <AlertCircle size={15} style={{ display: 'inline', marginRight: '6px' }} />
                      {bookingError}
                    </div>
                  )}

                  {bookingSuccess && (
                    <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', fontSize: '0.84rem', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                      <CheckCircle2 size={15} style={{ display: 'inline', marginRight: '6px' }} />
                      {bookingSuccess}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className="btn btn-primary"
                    style={{ padding: '10px', marginTop: '4px', fontWeight: 600 }}
                  >
                    {bookingLoading ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu đặt lịch hẹn'}
                  </button>
                </form>
              </div>

              {/* Danh sách lịch hẹn của tôi */}
              <div className="card" style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={20} color="#a855f7" />
                    <span>Lịch hẹn của bạn ({appointments.length})</span>
                  </h3>
                  <button
                    onClick={fetchAppointmentsData}
                    className="btn btn-secondary"
                    style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                  >
                    <RefreshCw size={14} className={loadingAppointments ? 'animate-spin' : ''} />
                  </button>
                </div>

                {loadingAppointments ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                    <RefreshCw size={22} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                    <div>Đang tải lịch hẹn...</div>
                  </div>
                ) : appointments.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                    Bạn chưa có lịch hẹn nào. Hãy gửi yêu cầu ở biểu mẫu bên cạnh khi cần hỗ trợ nhé.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '420px' }}>
                    {appointments.map((appt) => {
                      const apptDate = new Date(appt.startAt);
                      const isUpcoming = apptDate.getTime() > Date.now();

                      return (
                        <div
                          key={appt.id}
                          style={{
                            padding: '16px 18px',
                            background: 'rgba(15, 23, 42, 0.55)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-glass)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.95rem' }}>
                              <User size={16} color="#818cf8" />
                              <span>{appt.counselor?.fullName}</span>
                            </div>
                            {getStatusBadge(appt.status)}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.85rem', color: '#cbd5e1' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <Calendar size={14} color="#a855f7" />
                              {apptDate.toLocaleDateString('vi-VN')}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <Clock size={14} color="#a855f7" />
                              {apptDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          {appt.note && (
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic', background: 'rgba(0,0,0,0.2)', padding: '6px 10px', borderRadius: '4px' }}>
                              &quot;{appt.note}&quot;
                            </div>
                          )}

                          {appt.status !== 'CANCELLED' && isUpcoming && (
                            <div style={{ textAlign: 'right', marginTop: '4px' }}>
                              <button
                                onClick={() => handleCancelAppointment(appt.id)}
                                style={{ background: 'none', border: 'none', color: '#f87171', fontSize: '0.8rem', cursor: 'pointer', padding: 0 }}
                              >
                                Hủy lịch hẹn này
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ── TAB 2: THƯ VIỆN TÀI LIỆU & BÀI TẬP ── */}
        {activeTab === 'resources' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Bộ lọc mức độ */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-muted)' }}>Lọc theo mức độ cần hỗ trợ:</span>
              {[
                { key: 'all', label: 'Tất cả tài nguyên' },
                { key: 'nhe', label: 'Mức nhẹ (Thư giãn hàng ngày)' },
                { key: 'vua', label: 'Mức vừa (Giải tỏa căng thẳng)' },
                { key: 'keo_dai', label: 'Mức kéo dài (Hỗ trợ khẩn cấp)' },
              ].map((lvl) => (
                <button
                  key={lvl.key}
                  onClick={() => setSelectedLevel(lvl.key)}
                  className={`btn ${selectedLevel === lvl.key ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                >
                  {lvl.label}
                </button>
              ))}
            </div>

            {loadingResources ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px' }} />
                <div>Đang tải danh mục tài liệu...</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                {resources.map((item) => (
                  <div
                    key={item.id}
                    className="card"
                    style={{
                      padding: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      border: item.type === 'HOTLINE' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-glass)',
                      background: item.type === 'HOTLINE' ? 'rgba(239, 68, 68, 0.06)' : 'rgba(30, 41, 59, 0.5)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: item.type === 'HOTLINE' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                            color: item.type === 'HOTLINE' ? '#f87171' : '#a5b4fc',
                          }}
                        >
                          {item.type}
                        </span>
                        {item.durationMinutes && (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} /> {item.durationMinutes} phút
                          </span>
                        )}
                      </div>

                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 8px 0', color: item.type === 'HOTLINE' ? '#fca5a5' : '#ffffff' }}>
                        {item.title}
                      </h3>

                      {item.description && (
                        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: '0 0 12px 0' }}>
                          {item.description}
                        </p>
                      )}

                      {item.content && (
                        <div style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5, background: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: 'var(--radius-sm)', marginBottom: '16px' }}>
                          {item.content}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {item.creator ? `Biên soạn: ${item.creator.fullName}` : 'Tài nguyên MindLog'}
                      </div>

                      {item.url === '/student/breathing' ? (
                        <Link to="/student/breathing" className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Wind size={14} /> Tập thở ngay
                        </Link>
                      ) : item.type === 'HOTLINE' ? (
                        <span style={{ color: '#f87171', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <PhoneCall size={14} /> Miễn phí 24/7
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

      </div>
    </RoleLayout>
  );
};
