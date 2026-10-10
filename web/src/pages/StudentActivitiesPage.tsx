import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Circle,
  Flame,
  RotateCcw,
  Sparkles,
  Trophy,
  Calendar,
  Clock,
  Heart,
  ChevronRight,
  Smile,
  Info,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api';
import { DailyActivity, ActivityStreakResponse } from '../types/activity';

const CATEGORY_MAP: Record<string, { label: string; color: string; bg: string }> = {
  PHYSICAL: { label: 'Vận động & Cơ thể', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)' },
  MINDFUL: { label: 'Tâm trí & Thư giãn', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.12)' },
  SOCIAL: { label: 'Kết nối bạn bè', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.12)' },
  CREATIVE: { label: 'Sáng tạo & Học tập', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  SELF_CARE: { label: 'Chăm sóc bản thân', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
};

const LEVEL_LABELS: Record<string, string> = {
  binh_thuong: 'Duy trì năng lượng tích cực',
  nhe: 'Thư giãn & Tái nạp năng lượng',
  vua: 'Việc siêu nhỏ - Giảm tải áp lực',
  keo_dai: 'Tối giản - Nghỉ ngơi & Bảo bọc',
};

export const StudentActivitiesPage: React.FC = () => {
  const [activities, setActivities] = useState<DailyActivity[]>([]);
  const [streakData, setStreakData] = useState<ActivityStreakResponse | null>(null);
  const [alertLevel, setAlertLevel] = useState<string>('binh_thuong');
  const [swapsRemaining, setSwapsRemaining] = useState<number>(2);
  const [calendarView, setCalendarView] = useState<'7' | '30'>('7');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [actRes, streakRes] = await Promise.all([
        api.getTodayActivities(),
        api.getActivitiesStreak(),
      ]);
      setActivities(actRes.activities);
      setAlertLevel(actRes.alertLevel);
      setSwapsRemaining(actRes.swapsRemaining);
      setStreakData(streakRes);
    } catch (err: any) {
      console.error('Lỗi khi tải hoạt động nhỏ:', err);
      setMessage({ type: 'error', text: err?.message || 'Không thể tải danh sách hoạt động' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleComplete = async (activity: DailyActivity) => {
    const isCompleted = !!activity.completedAt;
    setActionLoadingId(activity.id);
    setMessage(null);

    // Optimistic UI update
    setActivities((prev) =>
      prev.map((a) =>
        a.id === activity.id
          ? { ...a, completedAt: isCompleted ? null : new Date().toISOString() }
          : a,
      ),
    );

    try {
      if (isCompleted) {
        await api.uncompleteActivity(activity.id);
      } else {
        await api.completeActivity(activity.id);
      }
      // Re-fetch streak to update currentStreak and history
      const newStreak = await api.getActivitiesStreak();
      setStreakData(newStreak);
    } catch (err: any) {
      console.error('Lỗi khi cập nhật hoàn thành:', err);
      // Revert
      setActivities((prev) =>
        prev.map((a) => (a.id === activity.id ? activity : a)),
      );
      setMessage({ type: 'error', text: err?.message || 'Không thể cập nhật trạng thái' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSwap = async (activityId: string) => {
    if (swapsRemaining <= 0) {
      setMessage({ type: 'error', text: 'Bạn đã dùng hết 2 lượt đổi trong hôm nay.' });
      return;
    }

    setActionLoadingId(activityId);
    setMessage(null);

    try {
      const res = await api.swapActivity(activityId);
      setActivities((prev) =>
        prev.map((a) => (a.id === activityId ? res.activity : a)),
      );
      setSwapsRemaining(res.swapsRemaining);
      setMessage({
        type: 'success',
        text: `Đã đổi sang: "${res.activity.template.title}" (Còn ${res.swapsRemaining} lượt đổi)`,
      });
    } catch (err: any) {
      console.error('Lỗi khi đổi việc:', err);
      setMessage({ type: 'error', text: err?.message || 'Không thể đổi việc' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const completedCount = activities.filter((a) => !!a.completedAt).length;
  const totalCount = activities.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Encouraging quote based on streak and completion
  const getEncouragementText = () => {
    if (!streakData) return '';
    if (streakData.isTodayCompleted) {
      return '✨ Xuất sắc! Bạn đã hoàn thành việc nhỏ hôm nay và giữ vững thói quen yêu thương bản thân.';
    }
    if (streakData.currentStreak > 0) {
      return `🌱 Bạn đang có chuỗi ${streakData.currentStreak} ngày! Hôm nay chỉ cần 1 việc nhỏ để tiếp tục nhé.`;
    }
    return '🌟 Mỗi ngày là một trang sách mới tinh. Hãy chọn một việc thật nhẹ nhàng để bắt đầu nhé, không có áp lực nào ở đây cả!';
  };

  const displayedHistory = streakData?.recentHistory
    ? calendarView === '7'
      ? streakData.recentHistory.slice(-7)
      : streakData.recentHistory
    : [];

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '9999px',
                background: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                color: '#818cf8',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
            >
              <Sparkles size={14} /> Từng bước nhỏ mỗi ngày
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '9999px',
                background: 'rgba(148, 163, 184, 0.1)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                color: 'var(--text-muted)',
                fontSize: '0.8rem',
              }}
            >
              {LEVEL_LABELS[alertLevel] || 'Cân bằng'}
            </span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>
            Hoạt động nhỏ mỗi ngày
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '6px', fontSize: '0.95rem' }}>
            Những việc siêu nhỏ từ 1–15 phút, không tốn sức, được gợi ý riêng cho trạng thái cảm xúc của bạn.
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={isLoading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderRadius: '10px',
            background: 'rgba(30, 41, 59, 0.8)',
            border: '1px solid var(--border-glass)',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 600,
          }}
        >
          <RefreshCw size={15} className={isLoading ? 'spin' : ''} />
          Làm mới
        </button>
      </div>

      {/* Alert / Notification banner */}
      {message && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: '12px',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: message.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            color: message.type === 'success' ? '#6ee7b7' : '#fca5a5',
          }}
        >
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.1rem' }}
          >
            ×
          </button>
        </div>
      )}

      {/* ── Streak & Today Momentum Hero ── */}
      <div
        className="glass-card"
        style={{
          padding: '28px 32px',
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.85) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '28px',
          alignItems: 'center',
        }}
      >
        {/* Left: Streak Counter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '24px',
              background: streakData && streakData.currentStreak > 0
                ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.25) 0%, rgba(239, 68, 68, 0.3) 100%)'
                : 'rgba(148, 163, 184, 0.1)',
              border: `1px solid ${streakData && streakData.currentStreak > 0 ? 'rgba(249, 115, 22, 0.4)' : 'rgba(148, 163, 184, 0.2)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: streakData && streakData.currentStreak > 0 ? '0 8px 24px rgba(249, 115, 22, 0.2)' : 'none',
              flexShrink: 0,
            }}
          >
            <Flame
              size={42}
              color={streakData && streakData.currentStreak > 0 ? '#f97316' : '#94a3b8'}
            />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '2.6rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                {streakData?.currentStreak || 0}
              </span>
              <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                ngày liên tiếp
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '6px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', color: '#f59e0b' }}>
                <Trophy size={14} /> Kỷ lục: {streakData?.maxStreak || 0} ngày
              </span>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                • Đã hoàn thành: {streakData?.totalCompletedAllTime || 0} việc
              </span>
            </div>
          </div>
        </div>

        {/* Right: Today Progress & Encouragement */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>
              Tiến độ hôm nay ({completedCount}/{totalCount})
            </span>
            <span
              style={{
                fontSize: '0.82rem',
                fontWeight: 700,
                color: progressPercent === 100 ? '#10b981' : '#818cf8',
              }}
            >
              {progressPercent}%
            </span>
          </div>

          {/* Progress bar */}
          <div
            style={{
              height: '8px',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.08)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progressPercent}%`,
                background: progressPercent === 100
                  ? 'linear-gradient(90deg, #10b981, #34d399)'
                  : 'linear-gradient(90deg, #6366f1, #a855f7)',
                borderRadius: '9999px',
                transition: 'width 0.4s ease',
              }}
            />
          </div>

          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
            {getEncouragementText()}
          </p>
        </div>
      </div>

      {/* ── Today's 3 Activities ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={20} color="#10b981" />
            Việc nhỏ của hôm nay
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '0.8rem',
                padding: '4px 10px',
                borderRadius: '8px',
                background: swapsRemaining > 0 ? 'rgba(56, 189, 248, 0.12)' : 'rgba(148, 163, 184, 0.1)',
                color: swapsRemaining > 0 ? '#38bdf8' : 'var(--text-muted)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              🔄 Còn {swapsRemaining} lượt đổi hôm nay
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="glass-card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} className="spin" style={{ marginBottom: '12px' }} />
            <div>Đang chuẩn bị việc nhỏ hôm nay cho bạn...</div>
          </div>
        ) : activities.length === 0 ? (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Chưa có hoạt động nào được tạo. Vui lòng bấm "Làm mới" ở trên.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {activities.map((act) => {
              const isCompleted = !!act.completedAt;
              const catInfo = CATEGORY_MAP[act.template.category] || {
                label: act.template.category,
                color: '#94a3b8',
                bg: 'rgba(148, 163, 184, 0.12)',
              };
              const isBusy = actionLoadingId === act.id;

              return (
                <div
                  key={act.id}
                  className="glass-card"
                  style={{
                    padding: '24px',
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '18px',
                    border: isCompleted
                      ? '1px solid rgba(16, 185, 129, 0.35)'
                      : '1px solid var(--border-glass)',
                    background: isCompleted
                      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.8) 100%)'
                      : 'rgba(30, 41, 59, 0.6)',
                    transition: 'all 0.25s ease',
                  }}
                >
                  {/* Top: badges & swap button */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span
                          style={{
                            padding: '3px 9px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: catInfo.color,
                            background: catInfo.bg,
                          }}
                        >
                          {catInfo.label}
                        </span>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            background: 'rgba(255, 255, 255, 0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Clock size={12} /> {act.template.durationMin} phút
                        </span>
                      </div>

                      {/* Swap button (only for today & if not completed) */}
                      {!isCompleted && (
                        <button
                          onClick={() => handleSwap(act.id)}
                          disabled={swapsRemaining <= 0 || isBusy}
                          title={swapsRemaining > 0 ? 'Đổi việc khác phù hợp hơn' : 'Hết lượt đổi hôm nay'}
                          style={{
                            background: 'none',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            padding: '4px 8px',
                            color: swapsRemaining > 0 ? 'var(--text-muted)' : 'rgba(255,255,255,0.2)',
                            cursor: swapsRemaining > 0 ? 'pointer' : 'not-allowed',
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <RotateCcw size={12} /> Đổi việc
                        </button>
                      )}
                    </div>

                    {/* Title */}
                    <h3
                      style={{
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        color: isCompleted ? '#94a3b8' : '#fff',
                        textDecoration: isCompleted ? 'line-through' : 'none',
                        margin: '0 0 8px 0',
                        lineHeight: 1.35,
                      }}
                    >
                      {act.template.title}
                    </h3>

                    {/* Description */}
                    <p
                      style={{
                        fontSize: '0.88rem',
                        color: isCompleted ? 'rgba(148, 163, 184, 0.7)' : 'var(--text-muted)',
                        margin: 0,
                        lineHeight: 1.5,
                      }}
                    >
                      {act.template.description}
                    </p>
                  </div>

                  {/* Bottom: Complete / Uncomplete toggle */}
                  <button
                    onClick={() => handleToggleComplete(act)}
                    disabled={isBusy}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      background: isCompleted
                        ? 'rgba(16, 185, 129, 0.2)'
                        : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                      color: isCompleted ? '#34d399' : '#fff',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {isCompleted ? (
                      <>
                        <CheckCircle2 size={18} /> Đã hoàn thành (Bấm để hủy)
                      </>
                    ) : (
                      <>
                        <Circle size={18} /> Đánh dấu đã xong
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 7 / 30 Days Streak Calendar View ── */}
      <div className="glass-card" style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="#6366f1" />
              Lịch sử thói quen
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Mỗi ngày hoàn thành ít nhất 1 việc nhỏ đều được ghi nhận vào chuỗi.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '6px', background: 'rgba(15, 23, 42, 0.6)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
            <button
              onClick={() => setCalendarView('7')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                background: calendarView === '7' ? '#6366f1' : 'transparent',
                color: calendarView === '7' ? '#fff' : 'var(--text-muted)',
              }}
            >
              7 ngày
            </button>
            <button
              onClick={() => setCalendarView('30')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                background: calendarView === '30' ? '#6366f1' : 'transparent',
                color: calendarView === '30' ? '#fff' : 'var(--text-muted)',
              }}
            >
              30 ngày
            </button>
          </div>
        </div>

        {/* Days grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: calendarView === '7' ? 'repeat(7, 1fr)' : 'repeat(auto-fill, minmax(68px, 1fr))',
            gap: '10px',
          }}
        >
          {displayedHistory.map((day) => {
            const dateObj = new Date(day.date);
            const isToday = day.date === (activities[0]?.date ? new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(activities[0].date)) : '');
            const dayLabel = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;

            return (
              <div
                key={day.date}
                title={`${day.date}: ${day.completed}/${day.total} việc hoàn thành`}
                style={{
                  padding: '12px 6px',
                  borderRadius: '12px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  background: day.isSuccess
                    ? 'rgba(16, 185, 129, 0.15)'
                    : 'rgba(255, 255, 255, 0.03)',
                  border: isToday
                    ? '2px solid #818cf8'
                    : day.isSuccess
                    ? '1px solid rgba(16, 185, 129, 0.3)'
                    : '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <span style={{ fontSize: '0.75rem', color: isToday ? '#818cf8' : 'var(--text-muted)', fontWeight: isToday ? 700 : 500 }}>
                  {isToday ? 'Hôm nay' : dayLabel}
                </span>
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: day.isSuccess ? '#10b981' : 'rgba(148, 163, 184, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '0.75rem',
                  }}
                >
                  {day.isSuccess ? '✓' : '·'}
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {day.completed > 0 ? `${day.completed} việc` : '—'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Kind reminder footnote */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            borderRadius: '10px',
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.15)',
            fontSize: '0.82rem',
            color: 'var(--text-muted)',
          }}
        >
          <Info size={16} color="#818cf8" style={{ flexShrink: 0 }} />
          <span>
            <b>Tâm sự nhỏ:</b> Bạn không cần phải giữ chuỗi liên tục mọi ngày. Nếu một ngày bạn quá mệt, cho phép bản thân nghỉ ngơi cũng là một cách chăm sóc bản thân đúng đắn. Ngày mai luôn có thể bắt đầu lại!
          </span>
        </div>
      </div>

      {/* ── Quick Mental Care Links ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        <Link
          to="/student/breathing"
          className="glass-card"
          style={{
            padding: '20px',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            color: '#fff',
            border: '1px solid var(--border-glass)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8',
              }}
            >
              <Smile size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Tập thở 4-7-8</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Giải tỏa căng thẳng tức thì trong 3 phút</div>
            </div>
          </div>
          <ChevronRight size={18} color="var(--text-muted)" />
        </Link>

        <Link
          to="/student/journal"
          className="glass-card"
          style={{
            padding: '20px',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            color: '#fff',
            border: '1px solid var(--border-glass)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(168, 85, 247, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#a855f7',
              }}
            >
              <Heart size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Nhật ký cảm xúc</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Trút bớt nỗi lòng và suy nghĩ riêng</div>
            </div>
          </div>
          <ChevronRight size={18} color="var(--text-muted)" />
        </Link>

        <Link
          to="/student/messages"
          className="glass-card"
          style={{
            padding: '20px',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            color: '#fff',
            border: '1px solid var(--border-glass)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981',
              }}
            >
              <ArrowRight size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Nhắn tin tư vấn viên</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Chia sẻ an toàn và bảo mật</div>
            </div>
          </div>
          <ChevronRight size={18} color="var(--text-muted)" />
        </Link>
      </div>
    </div>
  );
};
