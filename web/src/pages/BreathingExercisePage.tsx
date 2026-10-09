import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { RoleLayout } from '../components/layout/RoleLayout';
import {
  Wind,
  Play,
  Pause,
  RotateCcw,
  ArrowLeft,
  Sparkles,
  Heart,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';

type BreathingPhase = 'ready' | 'inhale' | 'hold' | 'exhale';

const PHASE_CONFIG: Record<BreathingPhase, { label: string; duration: number; tip: string; color: string; scale: number }> = {
  ready: {
    label: 'Chuẩn bị',
    duration: 3,
    tip: 'Ngồi thẳng lưng, thả lỏng vai và đặt tay lên bụng.',
    color: '#6366f1',
    scale: 1,
  },
  inhale: {
    label: 'Hít vào',
    duration: 4,
    tip: 'Hít sâu nhẹ nhàng bằng mũi, cảm nhận bụng căng lên.',
    color: '#06b6d4',
    scale: 1.45,
  },
  hold: {
    label: 'Giữ hơi',
    duration: 7,
    tip: 'Giữ không khí trong lồng ngực, giữ tâm trí tĩnh lặng.',
    color: '#a855f7',
    scale: 1.45,
  },
  exhale: {
    label: 'Thở ra',
    duration: 8,
    tip: 'Thở ra từ từ bằng miệng, đẩy hết căng thẳng ra ngoài.',
    color: '#10b981',
    scale: 1,
  },
};

export const BreathingExercisePage: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<BreathingPhase>('ready');
  const [timeLeft, setTimeLeft] = useState(PHASE_CONFIG.ready.duration);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (isActive) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Chuyển giai đoạn
            if (phase === 'ready') {
              setPhase('inhale');
              return PHASE_CONFIG.inhale.duration;
            } else if (phase === 'inhale') {
              setPhase('hold');
              return PHASE_CONFIG.hold.duration;
            } else if (phase === 'hold') {
              setPhase('exhale');
              return PHASE_CONFIG.exhale.duration;
            } else if (phase === 'exhale') {
              setCyclesCompleted((c) => c + 1);
              setPhase('inhale');
              return PHASE_CONFIG.inhale.duration;
            }
            return 4;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isActive, phase]);

  const handleStartPause = () => {
    if (!isActive && phase === 'ready') {
      setTimeLeft(PHASE_CONFIG.ready.duration);
    }
    setIsActive(!isActive);
  };

  const handleReset = () => {
    setIsActive(false);
    setPhase('ready');
    setTimeLeft(PHASE_CONFIG.ready.duration);
    setCyclesCompleted(0);
  };

  const currentConfig = PHASE_CONFIG[phase];

  return (
    <RoleLayout>
      <div style={{ maxWidth: '840px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link
            to="/student/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--text-muted)',
              fontSize: '0.9rem',
              fontWeight: 600,
            }}
          >
            <ArrowLeft size={16} /> Quay lại Dashboard
          </Link>

          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '9999px',
              background: 'rgba(6, 182, 212, 0.15)',
              color: '#06b6d4',
              fontSize: '0.82rem',
              fontWeight: 700,
            }}
          >
            <Wind size={14} /> Kỹ thuật thở 4-7-8
          </span>
        </div>

        {/* Breathing Circle Card */}
        <div
          className="glass-card"
          style={{
            padding: '48px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Animated Circle Container */}
          <div
            style={{
              position: 'relative',
              width: '260px',
              height: '260px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '20px 0 36px 0',
            }}
          >
            {/* Outer Glow Halo */}
            <div
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: currentConfig.color,
                opacity: isActive ? 0.25 : 0.08,
                filter: 'blur(30px)',
                transform: `scale(${currentConfig.scale * 1.1})`,
                transition: `all ${phase === 'inhale' ? 4 : phase === 'exhale' ? 8 : 1}s ease-in-out`,
              }}
            />

            {/* Ripple Border */}
            <div
              style={{
                position: 'absolute',
                width: '240px',
                height: '240px',
                borderRadius: '50%',
                border: `2px dashed ${currentConfig.color}`,
                opacity: 0.35,
                transform: `scale(${currentConfig.scale})`,
                transition: `all ${phase === 'inhale' ? 4 : phase === 'exhale' ? 8 : 1}s ease-in-out`,
              }}
            />

            {/* Main Animated Circle */}
            <div
              style={{
                width: '180px',
                height: '180px',
                borderRadius: '50%',
                background: `radial-gradient(circle at 35% 35%, ${currentConfig.color}40, ${currentConfig.color}15)`,
                border: `2px solid ${currentConfig.color}`,
                boxShadow: `0 0 30px ${currentConfig.color}50`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `scale(${currentConfig.scale})`,
                transition: `all ${phase === 'inhale' ? 4 : phase === 'exhale' ? 8 : 1}s ease-in-out`,
                zIndex: 2,
              }}
            >
              <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {currentConfig.label}
              </span>
              <span style={{ fontSize: '2.5rem', fontWeight: 900, color: currentConfig.color, lineHeight: 1.1, marginTop: '4px' }}>
                {timeLeft}s
              </span>
            </div>
          </div>

          {/* Phase Guidance text */}
          <p
            style={{
              fontSize: '1.05rem',
              fontWeight: 600,
              color: '#cbd5e1',
              maxWidth: '480px',
              minHeight: '48px',
              marginBottom: '24px',
              lineHeight: 1.5,
            }}
          >
            {currentConfig.tip}
          </p>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
            <button
              onClick={handleStartPause}
              className="btn btn-primary"
              style={{
                padding: '12px 28px',
                fontSize: '1rem',
                borderRadius: '9999px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {isActive ? <Pause size={18} /> : <Play size={18} />}
              {isActive ? 'Tạm dừng' : phase === 'ready' ? 'Bắt đầu bài tập' : 'Tiếp tục'}
            </button>

            <button
              onClick={handleReset}
              className="btn"
              style={{
                padding: '12px 20px',
                fontSize: '0.95rem',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '9999px',
                color: '#cbd5e1',
              }}
            >
              <RotateCcw size={16} /> Đặt lại
            </button>
          </div>

          {/* Cycles Counter */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.04)',
              padding: '8px 16px',
              borderRadius: '9999px',
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
            }}
          >
            <CheckCircle2 size={16} color="#10b981" />
            <span>Đã hoàn thành: <strong>{cyclesCompleted}</strong> chu kỳ (khuyến nghị 4–8 chu kỳ)</span>
          </div>
        </div>

        {/* Benefits & How to */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Heart size={18} color="#f43f5e" />
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Tác dụng sinh lý</h4>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              Kích hoạt hệ thần kinh phó giao cảm (Parasympathetic nervous system), làm chậm nhịp tim và đưa huyết áp về mức thư giãn tự nhiên.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Sparkles size={18} color="#fbbf24" />
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Thời điểm nên tập</h4>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              Bất cứ khi nào cảm thấy hồi hộp trước giờ thuyết trình, sau khi nhận kết quả bài thi căng thẳng, hoặc trước lúc đi ngủ.
            </p>
          </div>
        </div>

        {/* Medical Disclaimer */}
        <div
          className="glass-card"
          style={{
            padding: '16px 20px',
            borderLeft: '4px solid #f59e0b',
            background: 'rgba(245, 158, 11, 0.06)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}
        >
          <ShieldAlert size={20} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: '1.5' }}>
            <strong>Tuyên bố miễn trừ trách nhiệm y tế:</strong> Bài tập thở là phương pháp hỗ trợ chăm sóc tinh thần cá nhân, hoàn toàn không thay thế cho tư vấn y khoa hoặc điều trị bệnh lý tâm thần từ bác sĩ chuyên khoa.
          </div>
        </div>
      </div>
    </RoleLayout>
  );
};
export default BreathingExercisePage;
