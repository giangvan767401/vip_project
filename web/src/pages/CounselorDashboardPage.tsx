import React from 'react';
import { useAuth } from '../context/AuthContext';
import { RoleLayout } from '../components/layout/RoleLayout';
import { Bell, Users, ShieldAlert } from 'lucide-react';

export const CounselorDashboardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <RoleLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {/* Welcome Header */}
        <div className="glass-card" style={{ padding: '32px', background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(30, 41, 59, 0.7) 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <span className="badge badge-counselor">Chuyên viên tư vấn</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Phòng tham vấn tâm lý sinh viên</span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '8px' }}>
            Bảng điều khiển tham vấn – {user?.fullName} 🩺
          </h1>
          <p style={{ color: 'var(--text-sub)', maxWidth: '750px', fontSize: '0.95rem' }}>
            Quản lý và hỗ trợ các sinh viên đã ký văn bản đồng ý chia sẻ dữ liệu (ConsentShare). Hệ thống sẽ cảnh báo khi điểm cảm xúc tiêu cực vượt ngưỡng liên tục.
          </p>
        </div>

        {/* Privacy Banner */}
        <div className="glass-card" style={{
          padding: '20px 24px',
          borderLeft: '4px solid #c084fc',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}>
          <ShieldAlert size={28} color="#c084fc" />
          <div>
            <h4 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Quy tắc bảo mật quyền riêng tư</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Theo chính sách MindLog: Counselor chỉ có quyền xem dữ liệu của sinh viên có bản ghi ConsentShare đang hiệu lực. Không lưu trữ ảnh hoặc video webcam.
            </p>
          </div>
        </div>

        {/* Feature Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Bell size={22} color="#f87171" />
              </div>
              <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5' }}>Realtime</span>
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '6px' }}>Cảnh báo mức độ rủi ro</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Quy tắc phát hiện: ≥4/7 ngày điểm tiêu cực (Buồn, Sợ hãi, Giận dữ) vượt ngưỡng cảnh báo.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Users size={22} color="#818cf8" />
              </div>
              <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc' }}>Consent</span>
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '6px' }}>Sinh viên đang đồng hành</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Danh sách sinh viên chủ động kết nối để được lắng nghe và tư vấn cải thiện sức khỏe tinh thần.
            </p>
          </div>
        </div>
      </div>
    </RoleLayout>
  );
};
