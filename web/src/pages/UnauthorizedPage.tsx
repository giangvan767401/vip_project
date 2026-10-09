import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const UnauthorizedPage: React.FC = () => {
  const { user, getDefaultPathForRole } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div className="glass-card" style={{ maxWidth: '480px', padding: '40px 32px', textAlign: 'center' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '20px',
          background: 'rgba(239, 68, 68, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <ShieldAlert size={36} color="#ef4444" />
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '12px' }}>
          Không có quyền truy cập (403)
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '28px' }}>
          Tài khoản của bạn ({user?.role}) không được phép truy cập vào trang này. Vui lòng quay lại bảng điều khiển của vai trò được cấp.
        </p>

        <button
          onClick={() => navigate(getDefaultPathForRole(), { replace: true })}
          className="btn btn-primary"
          style={{ width: '100%', padding: '12px' }}
        >
          <ArrowLeft size={18} />
          <span>Về trang chủ của bạn</span>
        </button>
      </div>
    </div>
  );
};
