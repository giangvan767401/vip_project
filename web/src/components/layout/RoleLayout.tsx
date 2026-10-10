import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LogOut,
  Smile,
  ShieldCheck,
  UserCheck,
  LayoutDashboard,
  Camera,
  BookOpen,
  Users,
  Bell,
  Settings,
  Calendar,
  MessageSquare,
  CheckCircle2,
} from 'lucide-react';

interface RoleLayoutProps {
  children: React.ReactNode;
}

export const RoleLayout: React.FC<RoleLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadge = () => {
    switch (user?.role) {
      case 'ADMIN':
        return <span className="badge badge-admin"><ShieldCheck size={13} /> Quản trị viên</span>;
      case 'COUNSELOR':
        return <span className="badge badge-counselor"><UserCheck size={13} /> Chuyên viên tư vấn</span>;
      case 'USER':
      default:
        return <span className="badge badge-user"><Smile size={13} /> Sinh viên</span>;
    }
  };

  const getNavLinks = () => {
    switch (user?.role) {
      case 'ADMIN':
        return [
          { to: '/admin/dashboard', label: 'Tổng quan hệ thống', icon: LayoutDashboard },
          { to: '/admin/users', label: 'Quản lý người dùng', icon: Users },
          { to: '/admin/settings', label: 'Cấu hình bảo mật', icon: Settings },
        ];
      case 'COUNSELOR':
        return [
          { to: '/counselor/dashboard', label: 'Bảng điều khiển', icon: LayoutDashboard },
          { to: '/counselor/messages', label: 'Hộp thư tư vấn', icon: MessageSquare },
          { to: '/counselor/students', label: 'Sinh viên đồng ý chia sẻ', icon: Users },
          { to: '/counselor/alerts', label: 'Cảnh báo cảm xúc', icon: Bell },
        ];
      case 'USER':
      default:
        return [
          { to: '/student/dashboard', label: 'Tổng quan cảm xúc', icon: LayoutDashboard },
          { to: '/student/activities', label: 'Hoạt động nhỏ', icon: CheckCircle2 },
          { to: '/student/checkin', label: 'Nhận diện Webcam', icon: Camera },
          { to: '/student/journal', label: 'Nhật ký cá nhân', icon: BookOpen },
          { to: '/student/messages', label: 'Tin nhắn tư vấn', icon: MessageSquare },
          { to: '/student/appointments', label: 'Lịch hẹn & Tài liệu', icon: Calendar },
          { to: '/student/privacy', label: 'Quyền riêng tư', icon: ShieldCheck },
        ];
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ── Top Navigation Bar ── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(16px)',
        background: 'rgba(15, 23, 42, 0.8)',
        borderBottom: '1px solid var(--border-glass)',
        padding: '0 24px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: 800,
            fontSize: '1.25rem',
            background: 'linear-gradient(135deg, #a5b4fc 0%, #818cf8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            <Smile size={26} color="#818cf8" />
            <span>MindLog</span>
          </div>
          {getRoleBadge()}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ textAlign: 'right', display: 'none', md: 'block' } as any}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{user?.fullName}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.email}</div>
          </div>

          <button
            onClick={handleLogout}
            className="btn btn-secondary"
            style={{ padding: '8px 14px', fontSize: '0.85rem' }}
            title="Đăng xuất"
          >
            <LogOut size={16} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </header>

      {/* ── Main Layout Body ── */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <aside style={{
          width: '260px',
          background: 'rgba(15, 23, 42, 0.5)',
          borderRight: '1px solid var(--border-glass)',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          <div style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            padding: '0 12px 8px',
          }}>
            Menu điều hướng
          </div>

          {getNavLinks().map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: isActive ? '#ffffff' : 'var(--text-muted)',
                  background: isActive ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(139, 92, 246, 0.15) 100%)' : 'transparent',
                  border: isActive ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                  transition: 'all 0.2s ease',
                })}
              >
                <Icon size={18} />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </aside>

        {/* Content Area */}
        <main style={{ flex: 1, padding: '32px 40px', maxWidth: '1400px' }}>
          {children}
        </main>
      </div>
    </div>
  );
};
