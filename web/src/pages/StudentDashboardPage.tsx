import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RoleLayout } from '../components/layout/RoleLayout';
import { api } from '../services/api';
import { EmotionSummaryData } from '../types/emotion';
import { UserAlert } from '../types/alert';
import { ResourceItem } from '../types/resource';
import {
  Camera,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  Smile,
  Frown,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Sparkles,
  BarChart3,
  PieChart as PieChartIcon,
  Wind,
  PhoneCall,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';

const EMOTION_CONFIG: Record<string, { label: string; color: string; emoji: string }> = {
  Happy: { label: 'Vui vẻ', color: '#10b981', emoji: '😄' },
  Neutral: { label: 'Bình thường', color: '#38bdf8', emoji: '😐' },
  Sad: { label: 'Buồn bã', color: '#6366f1', emoji: '😢' },
  Angry: { label: 'Tức giận / Căng thẳng', color: '#ef4444', emoji: '😠' },
  Fear: { label: 'Lo lắng / Sợ hãi', color: '#a855f7', emoji: '😨' },
  Surprise: { label: 'Bất ngờ', color: '#f59e0b', emoji: '😮' },
  Disgust: { label: 'Khó chịu', color: '#f97316', emoji: '😣' },
  None: { label: 'Chưa xác định', color: '#94a3b8', emoji: '⚪' },
};

export const StudentDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [range, setRange] = useState<'week' | 'day'>('week');
  const [summaryData, setSummaryData] = useState<EmotionSummaryData | null>(null);
  const [alertData, setAlertData] = useState<UserAlert | null>(null);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (selectedRange: 'week' | 'day') => {
    try {
      setIsLoading(true);
      setError(null);
      const [sum, alertRes] = await Promise.all([
        api.getEmotionSummary(selectedRange),
        api.getAlert(),
      ]);
      setSummaryData(sum);
      setAlertData(alertRes);

      // Lấy tài nguyên phù hợp với level cảnh báo
      const resItems = await api.getResources(alertRes.level);
      setResources(resItems);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải dữ liệu thống kê');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(range);
  }, [range]);

  const dominantInfo = summaryData?.summary?.dominantEmotion
    ? EMOTION_CONFIG[summaryData.summary.dominantEmotion] || {
        label: summaryData.summary.dominantEmotion,
        color: '#38bdf8',
        emoji: '🙂',
      }
    : null;

  const positiveDiff = summaryData?.comparison?.positiveDiff ?? 0;
  const negativeDiff = summaryData?.comparison?.negativeDiff ?? 0;

  // Custom tooltip cho LineChart xu hướng
  const CustomTrendTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataItem = payload[0].payload;
      const emoConfig = EMOTION_CONFIG[dataItem.dominantEmotion] || {
        label: dataItem.dominantEmotion,
        emoji: '',
      };
      return (
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(148, 163, 184, 0.25)',
            padding: '12px 16px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            color: '#f8fafc',
            fontSize: '0.85rem',
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: '6px', color: '#cbd5e1' }}>
            📅 {label} ({dataItem.date || ''})
          </div>
          <div style={{ color: '#34d399', marginBottom: '3px', display: 'flex', gap: '8px' }}>
            <span>● Tích cực:</span>
            <strong>{payload[0].value}%</strong>
          </div>
          <div style={{ color: '#f87171', marginBottom: '6px', display: 'flex', gap: '8px' }}>
            <span>● Tiêu cực:</span>
            <strong>{payload[1].value}%</strong>
          </div>
          {dataItem.dominantEmotion && dataItem.dominantEmotion !== '-' && (
            <div style={{ paddingTop: '6px', borderTop: '1px solid rgba(148,163,184,0.2)', fontSize: '0.8rem' }}>
              Cảm xúc chủ đạo: <strong>{emoConfig.emoji} {emoConfig.label}</strong> ({dataItem.count} lần)
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <RoleLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Welcome Banner */}
        <div
          className="glass-card"
          style={{
            padding: '28px 32px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(30, 41, 59, 0.8) 100%)',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '20px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span className="badge badge-user">Sinh viên</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Hôm nay: {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
              </span>
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '6px' }}>
              Xin chào, {user?.fullName}! 👋
            </h1>
            <p style={{ color: 'var(--text-sub)', maxWidth: '650px', fontSize: '0.92rem' }}>
              Dưới đây là bức tranh tổng quan về cảm xúc và sức khỏe tâm lý của bạn dựa trên các lần check-in webcam.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link to="/student/checkin" className="btn btn-primary" style={{ padding: '10px 18px', fontSize: '0.9rem' }}>
              <Camera size={18} />
              Check-in ngay
            </Link>
            <Link
              to="/student/breathing"
              className="btn"
              style={{
                padding: '10px 18px',
                fontSize: '0.9rem',
                background: 'rgba(6, 182, 212, 0.15)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                color: '#06b6d4',
              }}
            >
              <Wind size={18} />
              Tập thở 4-7-8
            </Link>
            <Link
              to="/student/journal"
              className="btn btn-secondary"
              style={{
                padding: '10px 18px',
                fontSize: '0.9rem',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#fff',
              }}
            >
              <BookOpen size={18} />
              Viết nhật ký
            </Link>
          </div>
        </div>

        {/* --- MODULE 7.3: BANNER CẢNH BÁO THEO MỨC ĐỘ --- */}
        {alertData && alertData.level !== 'binh_thuong' && (
          <div
            className="glass-card"
            style={{
              padding: '24px 28px',
              borderLeft: `5px solid ${alertData.level === 'keo_dai' ? '#ef4444' : alertData.level === 'vua' ? '#f59e0b' : '#38bdf8'}`,
              background:
                alertData.level === 'keo_dai'
                  ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(30, 41, 59, 0.85) 100%)'
                  : alertData.level === 'vua'
                  ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(30, 41, 59, 0.85) 100%)'
                  : 'linear-gradient(135deg, rgba(56, 189, 248, 0.12) 0%, rgba(30, 41, 59, 0.85) 100%)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: alertData.level === 'keo_dai' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <AlertTriangle size={24} color={alertData.level === 'keo_dai' ? '#ef4444' : '#f59e0b'} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: '9999px',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        background: alertData.level === 'keo_dai' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)',
                        color: alertData.level === 'keo_dai' ? '#fca5a5' : '#fde68a',
                      }}
                    >
                      {alertData.activeRuleName}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Chuỗi: {alertData.consecutiveNegativeDays} ngày liên tiếp ({alertData.totalNegativeDays}/7 ngày)
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', marginBottom: '6px' }}>
                    {alertData.message}
                  </h3>
                  <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.5', maxWidth: '780px' }}>
                    {alertData.recommendation}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignSelf: 'center' }}>
                <Link
                  to="/student/breathing"
                  className="btn btn-primary"
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  <Wind size={15} /> Thử bài tập thở 4-7-8
                </Link>
                <Link
                  to="/student/journal"
                  className="btn"
                  style={{
                    padding: '8px 16px',
                    fontSize: '0.85rem',
                    background: 'rgba(255,255,255,0.08)',
                    color: '#fff',
                  }}
                >
                  <BookOpen size={15} /> Viết chia sẻ
                </Link>
              </div>
            </div>

            {/* Chi tiết 7 ngày */}
            {alertData.details && alertData.details.length > 0 && (
              <div
                style={{
                  marginTop: '16px',
                  paddingTop: '14px',
                  borderTop: '1px solid rgba(148, 163, 184, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: '6px' }}>
                  Diễn biến 7 ngày:
                </span>
                {alertData.details.map((d, idx) => (
                  <div
                    key={idx}
                    title={`${d.date}: ${d.avgNegative}% tiêu cực`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      background: d.isNegative ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.15)',
                      border: `1px solid ${d.isNegative ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.3)'}`,
                      color: d.isNegative ? '#fca5a5' : '#6ee7b7',
                    }}
                  >
                    <span>{d.label}</span>
                    <span>{d.isNegative ? '⚠️' : '✓'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Range Controls & Status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={20} color="#6366f1" />
              Thống kê cảm xúc
            </h2>
            {isLoading && (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <RefreshCw size={13} className="spin" /> Đang cập nhật...
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', background: 'rgba(15, 23, 42, 0.6)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
            <button
              onClick={() => setRange('week')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                background: range === 'week' ? '#6366f1' : 'transparent',
                color: range === 'week' ? '#fff' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              7 ngày qua
            </button>
            <button
              onClick={() => setRange('day')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                background: range === 'day' ? '#6366f1' : 'transparent',
                color: range === 'day' ? '#fff' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Hôm nay (24h)
            </button>
            <button
              onClick={() => fetchData(range)}
              title="Làm mới"
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                border: 'none',
                background: 'transparent',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {error && (
          <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid #ef4444', color: '#f87171' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* 4 Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {/* Card 1: Dominant Emotion */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Cảm xúc chủ đạo</span>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(99, 102, 241, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                }}
              >
                {dominantInfo?.emoji || '😐'}
              </div>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: dominantInfo?.color || '#fff', marginBottom: '4px' }}>
              {dominantInfo?.label || 'Chưa có'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Dựa trên {summaryData?.summary?.totalCheckIns ?? 0} lần ghi nhận
            </div>
          </div>

          {/* Card 2: Positive Score */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Điểm tích cực TB</span>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Smile size={20} color="#10b981" />
              </div>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399', marginBottom: '4px' }}>
              {summaryData?.summary?.avgPositiveScore ?? 0}%
            </div>
            <div style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {positiveDiff >= 0 ? (
                <span style={{ color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}>
                  <TrendingUp size={14} /> +{positiveDiff}%
                </span>
              ) : (
                <span style={{ color: '#f43f5e', display: 'inline-flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}>
                  <TrendingDown size={14} /> {positiveDiff}%
                </span>
              )}
              <span style={{ color: 'var(--text-muted)' }}>so với tuần trước</span>
            </div>
          </div>

          {/* Card 3: Negative Score */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Điểm tiêu cực TB</span>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Frown size={20} color="#ef4444" />
              </div>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: (summaryData?.summary?.avgNegativeScore ?? 0) > 40 ? '#f87171' : '#cbd5e1', marginBottom: '4px' }}>
              {summaryData?.summary?.avgNegativeScore ?? 0}%
            </div>
            <div style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {negativeDiff <= 0 ? (
                <span style={{ color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}>
                  <TrendingDown size={14} /> {negativeDiff}%
                </span>
              ) : (
                <span style={{ color: '#f43f5e', display: 'inline-flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}>
                  <TrendingUp size={14} /> +{negativeDiff}%
                </span>
              )}
              <span style={{ color: 'var(--text-muted)' }}>so với tuần trước</span>
            </div>
          </div>

          {/* Card 4: Total Check-ins */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Tổng lượt Check-in</span>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(6, 182, 212, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Calendar size={20} color="#06b6d4" />
              </div>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', marginBottom: '4px' }}>
              {summaryData?.summary?.totalCheckIns ?? 0}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Tuần trước: {summaryData?.comparison?.previousWeek?.totalCheckIns ?? 0} phiên
            </div>
          </div>
        </div>

        {/* Charts Row 1: LineChart Trend & PieChart Distribution */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>
          {/* Chart 1: Trend Over Time */}
          <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={18} color="#10b981" />
                  Xu hướng cảm xúc ({range === 'week' ? '7 ngày gần nhất' : 'Theo phiên hôm nay'})
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Biểu diễn điểm tích cực (%) và tiêu cực (%) theo thời gian
                </p>
              </div>
            </div>

            <div style={{ width: '100%', height: '280px', marginTop: 'auto' }}>
              {summaryData?.trend && summaryData.trend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={summaryData.trend} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                    <XAxis dataKey="label" stroke="#64748b" fontSize={12} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} domain={[0, 100]} tickLine={false} unit="%" />
                    <Tooltip content={<CustomTrendTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '0.82rem', paddingTop: '10px' }} />
                    <Line
                      type="monotone"
                      dataKey="avgPositive"
                      name="Tích cực (%)"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#10b981' }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="avgNegative"
                      name="Tiêu cực (%)"
                      stroke="#f43f5e"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#f43f5e' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Chưa có dữ liệu cho chu kỳ này
                </div>
              )}
            </div>
          </div>

          {/* Chart 2: Emotion Distribution */}
          <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PieChartIcon size={18} color="#a855f7" />
                Phân bố cảm xúc ghi nhận
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Tỷ lệ xuất hiện của các trạng thái cảm xúc
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '20px', margin: 'auto 0' }}>
              <div style={{ width: '200px', height: '220px', margin: '0 auto' }}>
                {summaryData?.distribution && summaryData.distribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={summaryData.distribution}
                        dataKey="count"
                        nameKey="emotion"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                      >
                        {summaryData.distribution.map((entry, index) => {
                          const config = EMOTION_CONFIG[entry.emotion] || { color: '#94a3b8' };
                          return <Cell key={`cell-${index}`} fill={config.color} />;
                        })}
                      </Pie>
                      <Tooltip
                        formatter={(value: any, name: any) => {
                          const conf = EMOTION_CONFIG[name] || { label: name, emoji: '' };
                          return [`${value} lần`, `${conf.emoji} ${conf.label}`];
                        }}
                        contentStyle={{
                          background: 'rgba(15, 23, 42, 0.95)',
                          border: '1px solid rgba(148, 163, 184, 0.25)',
                          borderRadius: '8px',
                          fontSize: '0.85rem',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Chưa có dữ liệu
                  </div>
                )}
              </div>

              {/* Legend List */}
              <div style={{ flex: '1', minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {summaryData?.distribution && summaryData.distribution.length > 0 ? (
                  summaryData.distribution.map((item) => {
                    const conf = EMOTION_CONFIG[item.emotion] || { label: item.emotion, color: '#94a3b8', emoji: '⚪' };
                    return (
                      <div
                        key={item.emotion}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          borderRadius: '8px',
                          fontSize: '0.85rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: conf.color }} />
                          <span>{conf.emoji} {conf.label}</span>
                        </div>
                        <span style={{ fontWeight: 700, color: '#f8fafc' }}>{item.percentage}%</span>
                      </div>
                    );
                  })
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Chưa có phân bố</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row 2: So sánh tuần này vs tuần trước */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart3 size={18} color="#06b6d4" />
                So sánh với tuần trước (7 ngày tương ứng)
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Đối chiếu điểm số tích cực và tiêu cực giữa tuần hiện tại và tuần trước đó
              </p>
            </div>

            <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#10b981' }} />
                <span style={{ color: '#cbd5e1' }}>Tuần này (Tích cực)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#38bdf8' }} />
                <span style={{ color: '#cbd5e1' }}>Tuần trước (Tích cực)</span>
              </div>
            </div>
          </div>

          <div style={{ width: '100%', height: '260px' }}>
            {summaryData?.comparison?.byDay && summaryData.comparison.byDay.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summaryData.comparison.byDay} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                  <XAxis dataKey="dayName" stroke="#64748b" fontSize={12} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} domain={[0, 100]} tickLine={false} unit="%" />
                  <Tooltip
                    formatter={(value: any, name: any) => [`${value}%`, name]}
                    contentStyle={{
                      background: 'rgba(15, 23, 42, 0.95)',
                      border: '1px solid rgba(148, 163, 184, 0.25)',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                    }}
                  />
                  <Bar dataKey="thisWeekPositive" name="Tuần này (Tích cực)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="lastWeekPositive" name="Tuần trước (Tích cực)" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                Chưa có dữ liệu so sánh
              </div>
            )}
          </div>
        </div>

        {/* --- MODULE 7.2: GỢI Ý TÀI NGUYÊN / BÀI TẬP THEO MỨC ĐỘ --- */}
        {resources.length > 0 && (
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} color="#fbbf24" />
                  Gợi ý hỗ trợ & bài tập dành cho bạn
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Được hệ thống đề xuất dựa trên mức độ cảm xúc hiện tại của bạn
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {resources.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(148, 163, 184, 0.15)',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background:
                            item.type === 'EXERCISE'
                              ? 'rgba(6, 182, 212, 0.15)'
                              : item.type === 'HOTLINE'
                              ? 'rgba(239, 68, 68, 0.15)'
                              : 'rgba(168, 85, 247, 0.15)',
                          color:
                            item.type === 'EXERCISE'
                              ? '#06b6d4'
                              : item.type === 'HOTLINE'
                              ? '#f87171'
                              : '#c084fc',
                        }}
                      >
                        {item.type === 'EXERCISE' ? 'Bài tập' : item.type === 'HOTLINE' ? 'Đường dây nóng' : 'Tài liệu'}
                      </span>
                      {item.durationMinutes && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          ⏱ {item.durationMinutes} phút
                        </span>
                      )}
                    </div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '6px', color: '#f8fafc' }}>
                      {item.title}
                    </h4>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '12px' }}>
                      {item.description}
                    </p>
                  </div>

                  {item.url ? (
                    <Link
                      to={item.url}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        color: '#6366f1',
                      }}
                    >
                      Bắt đầu ngay <ArrowRight size={13} />
                    </Link>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      {item.content}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- MODULE 7.4: MỤC "CẦN GIÚP NGAY" (HOTLINES) & DISCLAIMER Y TẾ --- */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {/* Card: Cần giúp ngay */}
          <div
            className="glass-card"
            style={{
              padding: '22px',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(30, 41, 59, 0.8) 100%)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PhoneCall size={18} color="#ef4444" />
              </div>
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fca5a5' }}>Cần giúp ngay</h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Đường dây nóng hỗ trợ tâm lý khẩn cấp 24/7</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
              <div style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', fontSize: '0.85rem' }}>
                <div style={{ fontWeight: 700, color: '#f8fafc' }}>Tổng đài Quốc gia 111</div>
                <div style={{ color: '#38bdf8', fontSize: '0.8rem' }}>Miễn cước gọi 24/7 (Bảo vệ tâm lý thanh thiếu niên)</div>
              </div>
              <div style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', fontSize: '0.85rem' }}>
                <div style={{ fontWeight: 700, color: '#f8fafc' }}>Đường dây nóng Ngày Mai</div>
                <div style={{ color: '#38bdf8', fontSize: '0.8rem' }}>096 306 1414 (13:00 - 20:30 hàng ngày, hỗ trợ trầm cảm)</div>
              </div>
              <div style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', fontSize: '0.85rem' }}>
                <div style={{ fontWeight: 700, color: '#f8fafc' }}>Phòng Tham vấn Tâm lý Học đường</div>
                <div style={{ color: '#38bdf8', fontSize: '0.8rem' }}>1900 1234 (8:00 - 17:30 Thứ 2 - Thứ 6)</div>
              </div>
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              Mọi cuộc gọi đều được giữ kín thông tin và tiếp nhận bởi chuyên gia tư vấn. Bạn không bao giờ phải chịu đựng một mình.
            </p>
          </div>

          {/* Card: Disclaimer Y tế & Cam kết bảo mật */}
          <div className="glass-card" style={{ padding: '22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <ShieldAlert size={20} color="#f59e0b" />
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#fcd34d' }}>Tuyên bố miễn trừ trách nhiệm y tế</h4>
              </div>
              <p style={{ fontSize: '0.84rem', color: '#cbd5e1', lineHeight: '1.6', marginBottom: '14px' }}>
                MindLog là ứng dụng hỗ trợ tự theo dõi cảm xúc và rèn luyện tâm lý dựa trên nhận diện webcam cá nhân. <strong>Hệ thống không cung cấp dịch vụ chẩn đoán bệnh lý, điều trị hoặc thay thế ý kiến chuyên môn của bác sĩ tâm thần / chuyên gia y tế.</strong>
              </p>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                Nếu bạn cảm thấy suy kiệt tinh thần hoặc có suy nghĩ tiêu cực kéo dài, xin hãy chủ động liên hệ người thân hoặc cơ sở y tế gần nhất.
              </p>
            </div>

            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(148, 163, 184, 0.15)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#10b981' }}>
              <CheckCircle2 size={15} />
              <span>Dữ liệu khuôn mặt không bao giờ được lưu trữ hay ghi lại</span>
            </div>
          </div>
        </div>
      </div>
    </RoleLayout>
  );
};
export default StudentDashboardPage;
