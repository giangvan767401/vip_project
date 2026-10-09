import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RoleLayout } from '../components/layout/RoleLayout';
import { Camera, BookOpen, TrendingUp, ArrowRight } from 'lucide-react';

export const StudentDashboardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <RoleLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {/* Welcome Header */}
        <div className="glass-card" style={{ padding: '32px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(30, 41, 59, 0.7) 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <span className="badge badge-user">Sinh viên</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Trạng thái: Hoạt động</span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '8px' }}>
            Xin chào, {user?.fullName}! 👋
          </h1>
          <p style={{ color: 'var(--text-sub)', maxWidth: '700px', fontSize: '0.95rem' }}>
            Chào mừng bạn đến với MindLog. Hãy kiểm tra cảm xúc hôm nay để theo dõi sức khỏe tinh thần và nhận những gợi ý chăm sóc bản thân tốt nhất.
          </p>
        </div>

        {/* Quick Action Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <Link to="/student/checkin" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="glass-card" style={{ padding: '24px', cursor: 'pointer', height: '100%' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(6, 182, 212, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}>
                <Camera size={24} color="#06b6d4" />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px' }}>Check-in Webcam</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
                Bật webcam để hệ thống nhận diện cảm xúc theo thời gian thực và ghi nhận dữ liệu.
              </p>
              <span style={{ fontSize: '0.85rem', color: '#06b6d4', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                Bắt đầu check-in ngay <ArrowRight size={14} />
              </span>
            </div>
          </Link>

          <Link to="/student/journal" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="glass-card" style={{ padding: '24px', cursor: 'pointer', height: '100%' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(168, 85, 247, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}>
                <BookOpen size={24} color="#a855f7" />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px' }}>Nhật ký cảm xúc</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
                Ghi lại những suy nghĩ, câu chuyện và tâm trạng diễn ra trong ngày của bạn.
              </p>
              <span style={{ fontSize: '0.85rem', color: '#a855f7', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                Viết nhật ký ngay <ArrowRight size={14} />
              </span>
            </div>
          </Link>

          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}>
              <TrendingUp size={24} color="#10b981" />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px' }}>Xu hướng tâm lý</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
              Biểu đồ trực quan hóa diễn biến cảm xúc trong tuần, tháng.
            </p>
            <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>Tích hợp Recharts</span>
          </div>
        </div>
      </div>
    </RoleLayout>
  );
};
