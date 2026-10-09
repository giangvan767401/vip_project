import React from 'react';
import { useAuth } from '../context/AuthContext';
import { RoleLayout } from '../components/layout/RoleLayout';
import { Server, Lock, UserCog, Activity } from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <RoleLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {/* Welcome Header */}
        <div className="glass-card" style={{ padding: '32px', background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.15) 0%, rgba(30, 41, 59, 0.7) 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <span className="badge badge-admin">Quản trị viên</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Hệ thống quản trị MindLog</span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '8px' }}>
            Quản trị hệ thống – {user?.fullName} 🛡️
          </h1>
          <p style={{ color: 'var(--text-sub)', maxWidth: '750px', fontSize: '0.95rem' }}>
            Quản trị tài khoản, kiểm soát quyền truy cập RBAC và giám sát hoạt động của các dịch vụ Backend & AI service.
          </p>
        </div>

        {/* Strict Privacy Notice for Admin */}
        <div className="glass-card" style={{
          padding: '20px 24px',
          borderLeft: '4px solid #fb7185',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}>
          <Lock size={28} color="#fb7185" />
          <div>
            <h4 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Cam kết bảo mật dữ liệu cá nhân</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Theo quy chuẩn kiến trúc: Tài khoản Admin quản trị phân quyền nhưng <strong>không được xem cảm xúc và nhật ký cá nhân</strong> của sinh viên.
            </p>
          </div>
        </div>

        {/* System Monitoring Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <Server size={22} color="#6366f1" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Dịch vụ Backend (NestJS)</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '12px' }}>
              Cổng `3001` – MySQL 8 (utf8mb4) & Prisma ORM.
            </p>
            <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7' }}>Hoạt động bình thường</span>
          </div>

          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <Activity size={22} color="#06b6d4" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Dịch vụ AI (FastAPI WS)</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '12px' }}>
              Cổng `8000` – Xác thực WebSocket bằng JWT Bearer/Query param.
            </p>
            <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7' }}>Hoạt động bình thường</span>
          </div>

          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <UserCog size={22} color="#f43f5e" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Quản lý người dùng</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '12px' }}>
              Phân quyền theo các vai trò: USER, COUNSELOR, ADMIN.
            </p>
            <span className="badge badge-admin">RBAC Guards</span>
          </div>
        </div>
      </div>
    </RoleLayout>
  );
};
