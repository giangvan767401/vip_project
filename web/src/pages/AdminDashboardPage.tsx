import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { RoleLayout } from '../components/layout/RoleLayout';
import { api } from '../services/api';
import {
  AdminUser,
  AdminAlertRule,
  AdminStats,
  AdminResource,
} from '../types/admin';
import { Role } from '../types/auth';
import {
  Users,
  Sliders,
  BarChart3,
  BookOpen,
  Lock,
  Unlock,
  ShieldCheck,
  PlusCircle,
  Eye,
  EyeOff,
  Trash2,
  Edit2,
  RefreshCw,
  Search,
  CheckCircle,
  AlertTriangle,
  Heart,
  Calendar,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { user: currentAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'rules' | 'stats' | 'resources'>('users');
  const [loading, setLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Data states
  const [usersList, setUsersList] = useState<AdminUser[]>([]);
  const [rulesList, setRulesList] = useState<AdminAlertRule[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [resourcesList, setResourcesList] = useState<AdminResource[]>([]);

  // Filters & Search
  const [searchUser, setSearchUser] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | Role>('ALL');

  // Modals
  const [showAddCounselorModal, setShowAddCounselorModal] = useState(false);
  const [counselorForm, setCounselorForm] = useState({ email: '', fullName: '', password: '' });

  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleForm, setRuleForm] = useState({
    name: '',
    negativeThreshold: 50,
    consecutiveDays: 4,
    timeWindowDays: 7,
    level: 'vua',
    isActive: true,
  });

  const showToast = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [uData, rData, sData, resData] = await Promise.all([
        api.getAdminUsers(),
        api.getAdminAlertRules(),
        api.getAdminStats(),
        api.getAdminResources(),
      ]);
      setUsersList(uData.users);
      setRulesList(rData);
      setStats(sData);
      setResourcesList(resData);
    } catch (err: any) {
      showToast(err.message || 'Không thể tải dữ liệu quản trị', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 11.1: Quản lý người dùng
  const handleToggleUserStatus = async (targetUser: AdminUser) => {
    if (targetUser.id === currentAdmin?.id) {
      showToast('Không thể tự khóa tài khoản của chính mình', 'error');
      return;
    }
    const newStatus = !targetUser.isActive;
    try {
      await api.updateAdminUserStatus(targetUser.id, newStatus);
      setUsersList((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, isActive: newStatus } : u))
      );
      showToast(`Đã ${newStatus ? 'mở khóa' : 'khóa'} tài khoản ${targetUser.email}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Thao tác trạng thái thất bại', 'error');
    }
  };

  const handleChangeRole = async (targetUserId: string, newRole: Role) => {
    try {
      await api.updateAdminUserRole(targetUserId, newRole);
      setUsersList((prev) =>
        prev.map((u) => (u.id === targetUserId ? { ...u, role: newRole } : u))
      );
      showToast('Đã cập nhật vai trò người dùng thành công', 'success');
    } catch (err: any) {
      showToast(err.message || 'Cập nhật vai trò thất bại', 'error');
    }
  };

  const handleCreateCounselor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!counselorForm.email || !counselorForm.fullName || !counselorForm.password) {
      showToast('Vui lòng điền đầy đủ thông tin chuyên viên', 'error');
      return;
    }
    try {
      const created = await api.createAdminCounselor(counselorForm);
      setUsersList((prev) => [created, ...prev]);
      setShowAddCounselorModal(false);
      setCounselorForm({ email: '', fullName: '', password: '' });
      showToast(`Tạo thành công tài khoản Chuyên viên: ${created.fullName}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Tạo tài khoản thất bại', 'error');
    }
  };

  // 11.2: Quản lý Alert Rules
  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRuleId) {
        const updated = await api.updateAdminAlertRule(editingRuleId, ruleForm);
        setRulesList((prev) => prev.map((r) => (r.id === editingRuleId ? updated : r)));
        showToast('Cập nhật quy tắc cảnh báo thành công', 'success');
      } else {
        const created = await api.createAdminAlertRule(ruleForm);
        setRulesList((prev) => [...prev, created]);
        showToast('Tạo quy tắc cảnh báo mới thành công', 'success');
      }
      setShowRuleModal(false);
      setEditingRuleId(null);
    } catch (err: any) {
      showToast(err.message || 'Lưu quy tắc thất bại', 'error');
    }
  };

  const handleEditRule = (rule: AdminAlertRule) => {
    setEditingRuleId(rule.id);
    setRuleForm({
      name: rule.name,
      negativeThreshold: rule.negativeThreshold,
      consecutiveDays: rule.consecutiveDays,
      timeWindowDays: rule.timeWindowDays,
      level: rule.level,
      isActive: rule.isActive,
    });
    setShowRuleModal(true);
  };

  const handleDeleteRule = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa quy tắc cảnh báo này?')) return;
    try {
      await api.deleteAdminAlertRule(id);
      setRulesList((prev) => prev.filter((r) => r.id !== id));
      showToast('Đã xóa quy tắc cảnh báo', 'success');
    } catch (err: any) {
      showToast(err.message || 'Xóa quy tắc thất bại', 'error');
    }
  };

  // 11.3: Quản lý kiểm duyệt nội dung
  const handleToggleResourceVisibility = async (res: AdminResource) => {
    const nextStatus = !res.isPublished;
    try {
      await api.updateAdminResourceVisibility(res.id, nextStatus);
      setResourcesList((prev) =>
        prev.map((item) => (item.id === res.id ? { ...item, isPublished: nextStatus } : item))
      );
      showToast(`Đã ${nextStatus ? 'công khai' : 'ẩn'} tài liệu "${res.title}"`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Cập nhật trạng thái hiển thị thất bại', 'error');
    }
  };

  const handleDeleteResource = async (id: string, title: string) => {
    if (!window.confirm(`Xác nhận xóa tài liệu "${title}" khỏi hệ thống?`)) return;
    try {
      await api.deleteAdminResource(id);
      setResourcesList((prev) => prev.filter((item) => item.id !== id));
      showToast('Đã xóa tài liệu vi phạm thành công', 'success');
    } catch (err: any) {
      showToast(err.message || 'Xóa tài liệu thất bại', 'error');
    }
  };

  // Filtered users
  const filteredUsers = usersList.filter((u) => {
    const matchSearch =
      u.fullName.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.email.toLowerCase().includes(searchUser.toLowerCase());
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <RoleLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Toast Notification */}
        {notification && (
          <div
            style={{
              padding: '14px 20px',
              borderRadius: '12px',
              backgroundColor: notification.type === 'success' ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontWeight: 600,
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              position: 'fixed',
              top: '24px',
              right: '24px',
              zIndex: 9999,
              animation: 'fadeIn 0.3s ease',
            }}
          >
            {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Header Hero */}
        <div
          className="glass-card"
          style={{
            padding: '30px',
            background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.16) 0%, rgba(30, 41, 59, 0.75) 100%)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span className="badge badge-admin">Quản trị viên Hệ thống</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>MindLog Administration Portal</span>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '6px' }}>
              Bảng điều khiển Quản trị – {currentAdmin?.fullName} 🛡️
            </h1>
            <p style={{ color: 'var(--text-sub)', fontSize: '0.92rem', maxWidth: '750px' }}>
              Quản trị người dùng, tùy biến ngưỡng cảnh báo tâm lý tự động, kiểm duyệt tài nguyên và theo dõi chỉ số vĩ mô.
            </p>
          </div>

          <button
            onClick={fetchData}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Làm mới
          </button>
        </div>

        {/* Privacy Barrier Notice */}
        <div
          className="glass-card"
          style={{
            padding: '16px 20px',
            borderLeft: '4px solid #f43f5e',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            background: 'rgba(244, 63, 94, 0.06)',
          }}
        >
          <ShieldCheck size={28} color="#f43f5e" />
          <div>
            <h4 style={{ fontWeight: 700, fontSize: '0.92rem', color: '#fca5a5' }}>
              Nguyên tắc Bất khả xâm phạm Quyền riêng tư (Privacy-by-Design)
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>
              Hệ thống tuyệt đối <strong>không cho phép Admin truy cập nội dung nhật ký cá nhân hoặc cảm xúc chi tiết</strong> của từng sinh viên. Chỉ số hiển thị chỉ bao gồm số lượng phiên tổng hợp.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('users')}
            className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Users size={18} />
            Tài khoản & Phân quyền ({usersList.length})
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={`btn ${activeTab === 'rules' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Sliders size={18} />
            Ngưỡng cảnh báo ({rulesList.length})
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`btn ${activeTab === 'stats' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <BarChart3 size={18} />
            Thống kê hệ thống
          </button>

          <button
            onClick={() => setActiveTab('resources')}
            className={`btn ${activeTab === 'resources' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <BookOpen size={18} />
            Kiểm duyệt tài liệu ({resourcesList.length})
          </button>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: QUẢN LÝ TÀI KHOẢN & PHÂN QUYỀN                    */}
        {/* ========================================================= */}
        {activeTab === 'users' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
                <div style={{ position: 'relative', minWidth: '260px' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Tìm theo tên hoặc email..."
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                    className="input-field"
                    style={{ paddingLeft: '38px', width: '100%' }}
                  />
                </div>

                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as any)}
                  className="input-field"
                  style={{ width: '160px' }}
                >
                  <option value="ALL">Tất cả vai trò</option>
                  <option value="USER">Sinh viên (USER)</option>
                  <option value="COUNSELOR">Tư vấn viên (COUNSELOR)</option>
                  <option value="ADMIN">Quản trị viên (ADMIN)</option>
                </select>
              </div>

              <button
                onClick={() => setShowAddCounselorModal(true)}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <PlusCircle size={18} />
                Thêm Chuyên viên Tư vấn
              </button>
            </div>

            {/* Users Table */}
            <div className="glass-card" style={{ padding: '0px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255, 255, 255, 0.02)' }}>
                    <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>NGƯỜI DÙNG</th>
                    <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>VAI TRÒ</th>
                    <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>HOẠT ĐỘNG (TỔNG HỢP)</th>
                    <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>TRẠNG THÁI</th>
                    <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'right' }}>HÀNH ĐỘNG</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Không tìm thấy người dùng nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{u.fullName}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{u.email}</div>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <select
                            value={u.role}
                            onChange={(e) => handleChangeRole(u.id, e.target.value as Role)}
                            className="input-field"
                            style={{ padding: '6px 10px', fontSize: '0.82rem', width: '140px' }}
                            disabled={u.id === currentAdmin?.id}
                          >
                            <option value="USER">USER (Sinh viên)</option>
                            <option value="COUNSELOR">COUNSELOR</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        </td>
                        <td style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          <div style={{ display: 'flex', gap: '12px' }}>
                            <span title="Số phiên check-in cảm xúc">📷 {u._count?.emotionLogs ?? 0}</span>
                            <span title="Số bài nhật ký">✍️ {u._count?.journalEntries ?? 0}</span>
                            <span title="Lịch hẹn">📅 {(u._count?.appointmentsStudent ?? 0) + (u._count?.appointmentsCounselor ?? 0)}</span>
                          </div>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <span
                            className="badge"
                            style={{
                              background: u.isActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                              color: u.isActive ? '#6ee7b7' : '#fca5a5',
                            }}
                          >
                            {u.isActive ? 'Hoạt động' : 'Đã khóa'}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          {u.id !== currentAdmin?.id ? (
                            <button
                              onClick={() => handleToggleUserStatus(u)}
                              className={`btn ${u.isActive ? 'btn-secondary' : 'btn-primary'}`}
                              style={{
                                padding: '6px 12px',
                                fontSize: '0.82rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                            >
                              {u.isActive ? (
                                <>
                                  <Lock size={14} color="#fca5a5" /> Khóa
                                </>
                              ) : (
                                <>
                                  <Unlock size={14} color="#6ee7b7" /> Mở khóa
                                </>
                              )}
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Bạn</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: QUẢN LÝ NGƯỠNG CẢNH BÁO (ALERT RULES)              */}
        {/* ========================================================= */}
        {activeTab === 'rules' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Quy tắc & Ngưỡng đánh giá Tâm lý</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  Cấu hình ngưỡng tiêu cực % và số ngày liên tiếp để phân loại mức độ (Nhẹ, Vừa, Kéo dài).
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingRuleId(null);
                  setRuleForm({
                    name: '',
                    negativeThreshold: 50,
                    consecutiveDays: 4,
                    timeWindowDays: 7,
                    level: 'vua',
                    isActive: true,
                  });
                  setShowRuleModal(true);
                }}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <PlusCircle size={18} />
                Thêm Quy tắc mới
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              {rulesList.map((rule) => {
                const isProlonged = rule.level === 'keo_dai';
                const isModerate = rule.level === 'vua';
                const badgeColor = isProlonged ? '#f43f5e' : isModerate ? '#f59e0b' : '#3b82f6';

                return (
                  <div
                    key={rule.id}
                    className="glass-card"
                    style={{
                      padding: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                      borderLeft: `4px solid ${badgeColor}`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span
                          className="badge"
                          style={{
                            background: `${badgeColor}22`,
                            color: badgeColor,
                            marginBottom: '8px',
                          }}
                        >
                          Mức {rule.level.toUpperCase()}
                        </span>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{rule.name}</h4>
                      </div>
                      <span
                        className="badge"
                        style={{
                          background: rule.isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                          color: rule.isActive ? '#6ee7b7' : '#94a3b8',
                        }}
                      >
                        {rule.isActive ? 'Đang kích hoạt' : 'Tạm tắt'}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '8px' }}>
                      <div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>NGƯỠNG TIÊU CỰC</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: badgeColor }}>
                          ≥ {rule.negativeThreshold}%
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>SỐ NGÀY XÉT</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                          ≥ {rule.consecutiveDays}/{rule.timeWindowDays} ngày
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <button
                        onClick={() => handleEditRule(rule)}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Edit2 size={14} /> Chỉnh sửa
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.82rem', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Trash2 size={14} /> Xóa
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: THỐNG KÊ HỆ THỐNG                                 */}
        {/* ========================================================= */}
        {activeTab === 'stats' && stats && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Overview Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
              <div className="glass-card" style={{ padding: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <Users size={24} color="#6366f1" />
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Tổng người dùng</span>
                </div>
                <div style={{ fontSize: '2.1rem', fontWeight: 800 }}>{stats.users.total}</div>
                <div style={{ marginTop: '8px', fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', gap: '10px' }}>
                  <span>🎓 {stats.users.students} SV</span>
                  <span>🧑‍⚕️ {stats.users.counselors} Tư vấn</span>
                  <span>🛡️ {stats.users.admins} Admin</span>
                </div>
              </div>

              <div className="glass-card" style={{ padding: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <Heart size={24} color="#ec4899" />
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Phiên Check-in Cảm xúc</span>
                </div>
                <div style={{ fontSize: '2.1rem', fontWeight: 800 }}>{stats.activities.totalEmotionLogs}</div>
                <div style={{ marginTop: '8px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Ghi nhận qua Webcam & AI Service
                </div>
              </div>

              <div className="glass-card" style={{ padding: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <Calendar size={24} color="#06b6d4" />
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Lịch hẹn Tham vấn</span>
                </div>
                <div style={{ fontSize: '2.1rem', fontWeight: 800 }}>{stats.appointments.total}</div>
                <div style={{ marginTop: '8px', fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', gap: '10px' }}>
                  <span style={{ color: '#6ee7b7' }}>✓ {stats.appointments.confirmed} xác nhận</span>
                  <span style={{ color: '#fde047' }}>⏳ {stats.appointments.pending} chờ</span>
                  <span style={{ color: '#fca5a5' }}>✕ {stats.appointments.cancelled} hủy</span>
                </div>
              </div>

              <div className="glass-card" style={{ padding: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <BookOpen size={24} color="#10b981" />
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Kho Tài liệu & Bài tập</span>
                </div>
                <div style={{ fontSize: '2.1rem', fontWeight: 800 }}>{stats.resources.total}</div>
                <div style={{ marginTop: '8px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Bài tập thở, cẩm nang & hotline
                </div>
              </div>
            </div>

            {/* Additional aggregates */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>
                Chỉ số An toàn & Cam kết Bảo mật Tổng thể
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '10px' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Chia sẻ dữ liệu tự nguyện (Active Consents)</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#38bdf8', marginTop: '4px' }}>
                    {stats.activities.totalActiveConsents} sinh viên
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Chỉ những sinh viên này mới được chuyên viên tâm lý hỗ trợ xem xu hướng.
                  </p>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '10px' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Tổng bài viết Nhật ký (Journal Entries)</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#a78bfa', marginTop: '4px' }}>
                    {stats.activities.totalJournalEntries} bài viết
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Lưu trữ mã hóa, hoàn toàn không hiển thị nội dung cho bất kỳ quản trị viên nào.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: KIỂM DUYỆT TÀI LIỆU (RESOURCES)                    */}
        {/* ========================================================= */}
        {activeTab === 'resources' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Kiểm duyệt Tài nguyên & Hướng dẫn</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                Quản trị viên có quyền kiểm tra, ẩn các tài liệu chưa phù hợp hoặc xóa tài liệu vi phạm quy chế.
              </p>
            </div>

            <div className="glass-card" style={{ padding: '0px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255, 255, 255, 0.02)' }}>
                    <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>TIÊU ĐỀ & LOẠI</th>
                    <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>MỨC GỢI Ý</th>
                    <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>NGƯỜI TẠO</th>
                    <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>HIỂN THỊ</th>
                    <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'right' }}>HÀNH ĐỘNG</th>
                  </tr>
                </thead>
                <tbody>
                  {resourcesList.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Chưa có tài liệu nào trong hệ thống.
                      </td>
                    </tr>
                  ) : (
                    resourcesList.map((res) => (
                      <tr key={res.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ fontWeight: 600 }}>{res.title}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                            {res.type} {res.durationMinutes ? `• ${res.durationMinutes} phút` : ''}
                          </div>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <span className="badge">{res.level}</span>
                        </td>
                        <td style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          {res.creator ? `${res.creator.fullName} (${res.creator.role})` : 'Hệ thống'}
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <span
                            className="badge"
                            style={{
                              background: res.isPublished ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                              color: res.isPublished ? '#6ee7b7' : '#fca5a5',
                            }}
                          >
                            {res.isPublished ? 'Công khai' : 'Đang ẩn'}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            <button
                              onClick={() => handleToggleResourceVisibility(res)}
                              className="btn btn-secondary"
                              style={{ padding: '6px 12px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                              title={res.isPublished ? 'Ẩn tài liệu' : 'Công khai tài liệu'}
                            >
                              {res.isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
                              {res.isPublished ? 'Ẩn' : 'Hiện'}
                            </button>
                            <button
                              onClick={() => handleDeleteResource(res.id, res.title)}
                              className="btn btn-secondary"
                              style={{ padding: '6px 12px', fontSize: '0.82rem', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '6px' }}
                              title="Xóa tài liệu"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODAL 1: THÊM COUNSELOR */}
        {showAddCounselorModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
          >
            <div className="glass-card" style={{ width: '480px', padding: '28px', maxWidth: '90vw' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px' }}>
                Tạo tài khoản Chuyên viên Tư vấn
              </h3>
              <form onSubmit={handleCreateCounselor} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: TS. Nguyễn Thị Hoa"
                    value={counselorForm.fullName}
                    onChange={(e) => setCounselorForm({ ...counselorForm, fullName: e.target.value })}
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="VD: hoa.nguyen@mindlog.edu.vn"
                    value={counselorForm.email}
                    onChange={(e) => setCounselorForm({ ...counselorForm, email: e.target.value })}
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                    Mật khẩu khởi tạo
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Tối thiểu 6 ký tự"
                    value={counselorForm.password}
                    onChange={(e) => setCounselorForm({ ...counselorForm, password: e.target.value })}
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setShowAddCounselorModal(false)}
                    className="btn btn-secondary"
                  >
                    Hủy bỏ
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Tạo tài khoản
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: THÊM / SỬA ALERT RULE */}
        {showRuleModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
          >
            <div className="glass-card" style={{ width: '520px', padding: '28px', maxWidth: '90vw' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px' }}>
                {editingRuleId ? 'Cập nhật Quy tắc Cảnh báo' : 'Thêm Quy tắc Cảnh báo Mới'}
              </h3>
              <form onSubmit={handleSaveRule} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                    Tên quy tắc
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Cảnh báo mức vừa (≥4/7 ngày tiêu cực)"
                    value={ruleForm.name}
                    onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                      Ngưỡng tiêu cực (%)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={100}
                      value={ruleForm.negativeThreshold}
                      onChange={(e) => setRuleForm({ ...ruleForm, negativeThreshold: Number(e.target.value) })}
                      className="input-field"
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                      Mức gợi ý (Level)
                    </label>
                    <select
                      value={ruleForm.level}
                      onChange={(e) => setRuleForm({ ...ruleForm, level: e.target.value })}
                      className="input-field"
                      style={{ width: '100%' }}
                    >
                      <option value="nhe">Nhẹ (nhe)</option>
                      <option value="vua">Vừa (vua)</option>
                      <option value="keo_dai">Kéo dài (keo_dai)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                      Số ngày liên tiếp vượt ngưỡng
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={30}
                      value={ruleForm.consecutiveDays}
                      onChange={(e) => setRuleForm({ ...ruleForm, consecutiveDays: Number(e.target.value) })}
                      className="input-field"
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                      Cửa sổ xét (ngày)
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={60}
                      value={ruleForm.timeWindowDays}
                      onChange={(e) => setRuleForm({ ...ruleForm, timeWindowDays: Number(e.target.value) })}
                      className="input-field"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                  <input
                    type="checkbox"
                    id="ruleActive"
                    checked={ruleForm.isActive}
                    onChange={(e) => setRuleForm({ ...ruleForm, isActive: e.target.checked })}
                  />
                  <label htmlFor="ruleActive" style={{ fontSize: '0.88rem' }}>
                    Kích hoạt quy tắc này ngay lập tức
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setShowRuleModal(false)}
                    className="btn btn-secondary"
                  >
                    Hủy bỏ
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Lưu quy tắc
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
