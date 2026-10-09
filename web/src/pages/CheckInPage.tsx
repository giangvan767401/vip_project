import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RoleLayout } from '../components/layout/RoleLayout';
import { useAuth } from '../context/AuthContext';
import { useEmotionWS } from '../hooks/use-emotion-ws';
import { useEmotionAggregator } from '../hooks/use-emotion-aggregator';
import { EmotionLog, EmotionWSResult } from '../types/emotion';
import { api } from '../services/api';
import {
  Camera,
  CameraOff,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Info,
  Clock,
  Activity,
} from 'lucide-react';

const EMOTION_MAP: Record<string, { label: string; emoji: string; color: string }> = {
  Happy: { label: 'Vui vẻ', emoji: '😄', color: '#ffd600' },
  Neutral: { label: 'Bình thản', emoji: '😐', color: '#9e9e9e' },
  Sad: { label: 'Buồn bã', emoji: '😢', color: '#42a5f5' },
  Angry: { label: 'Tức giận', emoji: '😠', color: '#ff4444' },
  Fear: { label: 'Lo lắng / Sợ hãi', emoji: '😨', color: '#ab47bc' },
  Surprise: { label: 'Ngạc nhiên', emoji: '😲', color: '#ff7043' },
  Disgust: { label: 'Khó chịu', emoji: '🤢', color: '#66bb6a' },
};

export const CheckInPage: React.FC = () => {
  const { token } = useAuth();

  // State
  const [isCheckInActive, setIsCheckInActive] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentAgreed, setConsentAgreed] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Video refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Emotion Aggregator (8-second window)
  const { addSample, flush, cycleProgress, savedLogs, setSavedLogs } = useEmotionAggregator({
    windowSeconds: 8,
    onLogSaved: (savedLog) => {
      setSaveSuccessMsg(
        `Đã lưu bản ghi: ${EMOTION_MAP[savedLog.emotion]?.label || savedLog.emotion} (${savedLog.positiveScore}% tích cực)`
      );
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    },
  });

  // Handle WS emotion result
  const handleWSResult = useCallback(
    (result: EmotionWSResult) => {
      addSample(result);
    },
    [addSample]
  );

  // WebSocket hook
  const { status: wsStatus, isConnected: isWSConnected, errorMsg: wsError, lastResult, connect, disconnect, sendFrame } =
    useEmotionWS({
      token,
      onResult: handleWSResult,
    });

  // Load past logs on mount
  useEffect(() => {
    api.getEmotionLogs()
      .then((logs) => setSavedLogs(logs))
      .catch(() => {});
  }, [setSavedLogs]);

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Stop check-in session
  const handleStopCheckIn = useCallback(async () => {
    stopCamera();
    disconnect();
    setIsCheckInActive(false);
    // Flush any pending samples from the current window
    await flush();
  }, [stopCamera, disconnect, flush]);

  // Frame sender loop (approx ~3 fps = 330ms)
  const startFrameCapture = useCallback(() => {
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);

    frameIntervalRef.current = setInterval(() => {
      if (!videoRef.current || !canvasRef.current || videoRef.current.readyState < 2) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw downscaled frame (320x240) for high performance
      canvas.width = 320;
      canvas.height = 240;
      ctx.drawImage(video, 0, 0, 320, 240);

      const base64Data = canvas.toDataURL('image/jpeg', 0.65);
      sendFrame(base64Data);
    }, 330);
  }, [sendFrame]);

  // Start camera after consent
  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Connect WebSocket & start frame capture
      connect();
      startFrameCapture();
      setIsCheckInActive(true);
      setShowConsentModal(false);
    } catch (err: any) {
      setCameraError(
        err?.message?.includes('Permission')
          ? 'Quyền truy cập webcam bị từ chối trong trình duyệt. Vui lòng cho phép quyền máy ảnh.'
          : 'Không thể khởi động webcam. Vui lòng kiểm tra thiết bị của bạn.'
      );
      stopCamera();
    }
  };

  const handleStartClicked = () => {
    if (!consentAgreed) {
      setShowConsentModal(true);
    } else {
      startCamera();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      disconnect();
    };
  }, [stopCamera, disconnect]);

  const primaryEmotion = lastResult?.emotion || 'Neutral';
  const emotionMeta = EMOTION_MAP[primaryEmotion] || { label: primaryEmotion, emoji: '✨', color: '#9e9e9e' };

  return (
    <RoleLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header */}
        <div className="glass-card" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span className="badge badge-user">Check-in Webcam</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Mã hóa & bảo mật dữ liệu</span>
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '6px' }}>
                Nhận diện Cảm xúc Thời gian thực
              </h1>
              <p style={{ color: 'var(--text-sub)', fontSize: '0.95rem' }}>
                Hệ thống gửi frame webcam tới AI để phân tích và tự động ghi nhận nhật ký cảm xúc mỗi 8 giây.
              </p>
            </div>

            <div>
              {!isCheckInActive ? (
                <button
                  id="btn-start-checkin"
                  onClick={handleStartClicked}
                  className="btn btn-primary"
                  style={{ padding: '12px 24px', fontSize: '1rem' }}
                >
                  <Camera size={18} />
                  <span>Bắt đầu Check-in</span>
                </button>
              ) : (
                <button
                  id="btn-stop-checkin"
                  onClick={handleStopCheckIn}
                  className="btn btn-danger"
                  style={{ padding: '12px 24px', fontSize: '1rem' }}
                >
                  <CameraOff size={18} />
                  <span>Dừng Check-in</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Status Alerts */}
        {cameraError && (
          <div className="glass-card" style={{ padding: '16px 20px', borderColor: 'rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f87171' }}>
              <ShieldAlert size={20} />
              <span style={{ fontWeight: 600 }}>{cameraError}</span>
            </div>
          </div>
        )}

        {wsError && (
          <div className="glass-card" style={{ padding: '16px 20px', borderColor: 'rgba(245, 158, 11, 0.4)', background: 'rgba(245, 158, 11, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fbbf24' }}>
              <RefreshCw size={20} className="animate-spin" />
              <span>{wsError}</span>
            </div>
          </div>
        )}

        {saveSuccessMsg && (
          <div className="glass-card" style={{ padding: '14px 20px', borderColor: 'rgba(16, 185, 129, 0.4)', background: 'rgba(16, 185, 129, 0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#34d399', fontWeight: 600 }}>
              <CheckCircle2 size={18} />
              <span>{saveSuccessMsg}</span>
            </div>
          </div>
        )}

        {/* Main Content Grid: Webcam stream & Realtime metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
          {/* Webcam Box */}
          <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Camera size={18} color="var(--primary)" />
                Khung hình Webcam
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: isWSConnected ? '#10b981' : '#f59e0b',
                  }}
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  WS: {wsStatus === 'connected' ? 'Đã kết nối' : wsStatus === 'connecting' ? 'Đang kết nối' : 'Chưa bật'}
                </span>
              </div>
            </div>

            {/* Video container */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '4/3',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid var(--border-glass)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <video
                ref={videoRef}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: 'scaleX(-1)', // Mirror effect
                  display: isCheckInActive ? 'block' : 'none',
                }}
                playsInline
                muted
              />

              {!isCheckInActive && (
                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  <CameraOff size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                  <p style={{ fontWeight: 600, marginBottom: '6px' }}>Webcam chưa được kích hoạt</p>
                  <p style={{ fontSize: '0.85rem', maxWidth: '320px' }}>
                    Nhấn nút "Bắt đầu Check-in" ở trên để cấp quyền và mở luồng nhận diện cảm xúc.
                  </p>
                </div>
              )}

              {/* Realtime Floating Badge */}
              {isCheckInActive && (
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    background: 'rgba(15, 23, 42, 0.75)',
                    backdropFilter: 'blur(8px)',
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-full)',
                    border: `1px solid ${emotionMeta.color}88`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>{emotionMeta.emoji}</span>
                  <span style={{ fontWeight: 700, color: emotionMeta.color, fontSize: '0.95rem' }}>
                    {emotionMeta.label}
                  </span>
                </div>
              )}
            </div>

            {/* Hidden canvas for grabbing frames */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* Aggregation Progress Bar */}
            {isCheckInActive && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Activity size={14} color="#6366f1" />
                    Đang gom dữ liệu phiên (chu kỳ 8 giây)
                  </span>
                  <span>{cycleProgress}%</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${cycleProgress}%`,
                      background: 'linear-gradient(90deg, #6366f1, #06b6d4)',
                      transition: 'width 0.2s linear',
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Realtime Scores & Breakdown */}
          <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="#ffd600" />
              Chỉ số Cảm xúc Phân tích
            </h3>

            {/* Primary Emotion Highlight */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 'var(--radius-md)',
                padding: '20px',
                border: '1px solid var(--border-glass)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '8px' }}>{emotionMeta.emoji}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: emotionMeta.color }}>
                {emotionMeta.label}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                {isCheckInActive ? 'Nhận diện theo thời gian thực' : 'Sẵn sàng khi bắt đầu'}
              </div>
            </div>

            {/* Scores Breakdown Bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                TỶ LỆ PHÂN BỐ CẢM XÚC (%)
              </div>
              {Object.entries(EMOTION_MAP).map(([key, meta]) => {
                const score = lastResult?.scores?.[key] || 0;
                return (
                  <div key={key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{meta.emoji}</span>
                        <span>{meta.label}</span>
                      </span>
                      <span style={{ fontWeight: 600, color: meta.color }}>{score}%</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.min(100, Math.max(0, score))}%`,
                          background: meta.color,
                          borderRadius: '999px',
                          transition: 'width 0.25s ease',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* History of Saved Emotion Logs in MySQL */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Clock size={18} color="var(--primary)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Các phiên check-in đã lưu vào MySQL</h3>
          </div>

          {savedLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Chưa có bản ghi cảm xúc nào. Bật webcam để hoàn thành phiên check-in đầu tiên.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px' }}>Thời gian</th>
                    <th style={{ padding: '12px' }}>Cảm xúc chủ đạo</th>
                    <th style={{ padding: '12px' }}>Điểm tích cực</th>
                    <th style={{ padding: '12px' }}>Điểm tiêu cực</th>
                    <th style={{ padding: '12px' }}>Thời lượng gom</th>
                  </tr>
                </thead>
                <tbody>
                  {savedLogs.map((log: EmotionLog) => {
                    const meta = EMOTION_MAP[log.emotion] || { label: log.emotion, emoji: '✨', color: '#fff' };
                    const durationSec = Math.round(
                      (new Date(log.endedAt).getTime() - new Date(log.startedAt).getTime()) / 1000
                    );
                    return (
                      <tr key={log.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '12px', color: 'var(--text-sub)' }}>
                          {new Date(log.createdAt).toLocaleTimeString('vi-VN')} {new Date(log.createdAt).toLocaleDateString('vi-VN')}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '4px 10px',
                              borderRadius: '999px',
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: `1px solid ${meta.color}55`,
                              color: meta.color,
                              fontWeight: 600,
                            }}
                          >
                            <span>{meta.emoji}</span>
                            <span>{meta.label}</span>
                          </span>
                        </td>
                        <td style={{ padding: '12px', color: '#10b981', fontWeight: 600 }}>
                          {log.positiveScore}%
                        </td>
                        <td style={{ padding: '12px', color: '#ef4444', fontWeight: 600 }}>
                          {log.negativeScore}%
                        </td>
                        <td style={{ padding: '12px', color: 'var(--text-muted)' }}>
                          {durationSec > 0 ? `${durationSec} giây` : '8 giây'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Consent Modal Dialog */}
        {showConsentModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '20px',
            }}
          >
            <div
              className="glass-card"
              style={{
                maxWidth: '520px',
                width: '100%',
                padding: '32px',
                background: 'rgba(30, 41, 59, 0.95)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'rgba(99, 102, 241, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ShieldCheck size={24} color="#6366f1" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Xác nhận Quyền riêng tư Webcam</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Chính sách bảo mật người dùng MindLog</p>
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  marginBottom: '20px',
                  fontSize: '0.9rem',
                  color: 'var(--text-sub)',
                  lineHeight: '1.6',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                  <Info size={18} color="#06b6d4" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>
                    <strong>Không lưu trữ hình ảnh hoặc video:</strong> Dữ liệu khung hình webcam chỉ được gửi trực tiếp qua kết nối WebSocket tới mô hình AI để nhận diện cảm xúc theo thời gian thực.
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>
                    Hệ thống chỉ lưu trữ tên cảm xúc (ví dụ: Vui vẻ, Buồn bã) và điểm số tổng hợp vào cơ sở dữ liệu để phục vụ theo dõi xu hướng tâm lý.
                  </span>
                </div>
              </div>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '24px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                }}
              >
                <input
                  type="checkbox"
                  id="consent-checkbox"
                  checked={consentAgreed}
                  onChange={(e) => setConsentAgreed(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#6366f1', cursor: 'pointer' }}
                />
                <span>Tôi đồng ý bật webcam cho phiên check-in này</span>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowConsentModal(false)}
                  className="btn btn-secondary"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  id="btn-confirm-consent"
                  disabled={!consentAgreed}
                  onClick={startCamera}
                  className="btn btn-primary"
                >
                  Đồng ý & Bật máy ảnh
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleLayout>
  );
};
