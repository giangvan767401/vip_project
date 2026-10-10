import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { RoleLayout } from '../components/layout/RoleLayout';
import { api } from '../services/api';
import { Appointment } from '../types/appointment';
import {
  SectionsConfig,
  BriefPreviewResponse,
} from '../types/brief';
import {
  FileText,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Eye,
  Lock,
  Sparkles,
  HelpCircle,
  TrendingUp,
  Activity,
  BookOpen,
  Send,
  Download,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

const PROMPT_QUESTIONS = [
  'Điều gì đang khiến bạn bận tâm hoặc căng thẳng nhất gần đây?',
  'Bạn mong muốn chuyên viên hỗ trợ điều gì trong buổi tư vấn này?',
  'Có chủ đề nào bạn cảm thấy khó mở lời hoặc cần lưu ý trước không?',
];

export const SessionBriefPreparePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const preselectedApptId = searchParams.get('appointmentId') || '';

  // Current Step: 1 = Chọn phạm vi, 2 = Bật/tắt mục, 3 = Viết ghi chú, 4 = Xác nhận
  const [step, setStep] = useState<number>(1);

  // Appointments of student
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedApptId, setSelectedApptId] = useState<string>(preselectedApptId);
  const [loadingAppts, setLoadingAppts] = useState<boolean>(true);

  // Configuration
  const [rangeDays, setRangeDays] = useState<number>(14);
  const [sections, setSections] = useState<SectionsConfig>({
    includeTrend: true,
    includeNegativeDays: true,
    includeDifficultHours: true,
    includeActivities: true,
    includeJournalNotes: true,
  });
  const [userNote, setUserNote] = useState<string>('');

  // Preview data
  const [previewData, setPreviewData] = useState<BriefPreviewResponse | null>(null);
  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Submitting
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdBriefId, setCreatedBriefId] = useState<string | null>(null);

  // Fetch appointments on mount
  useEffect(() => {
    const loadAppointments = async () => {
      try {
        setLoadingAppts(true);
        const list = await api.getMyAppointments();
        // Lọc các lịch hẹn chưa bị hủy và chưa có brief
        const validList = list.filter((a) => a.status !== 'CANCELLED');
        setAppointments(validList);
        if (preselectedApptId && validList.some((a) => a.id === preselectedApptId)) {
          setSelectedApptId(preselectedApptId);
        } else if (validList.length > 0 && !selectedApptId) {
          setSelectedApptId(validList[0].id);
        }
      } catch (err) {
        console.error('Lỗi khi tải lịch hẹn:', err);
      } finally {
        setLoadingAppts(false);
      }
    };
    loadAppointments();
  }, [preselectedApptId]);

  // Fetch preview when rangeDays or sections change
  const fetchPreview = async () => {
    try {
      setLoadingPreview(true);
      setPreviewError(null);
      const res = await api.previewBrief({
        rangeDays,
        sections,
        userNote: userNote.trim() || undefined,
      });
      setPreviewData(res);
    } catch (err: any) {
      console.error('Lỗi khi tải bản nháp:', err);
      setPreviewError(err?.message || 'Không thể tạo bản nháp');
      setPreviewData(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  useEffect(() => {
    fetchPreview();
  }, [rangeDays, sections]);

  // Toggle individual section
  const handleToggleSection = (key: keyof SectionsConfig) => {
    setSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Insert prompt question into textarea
  const handleInsertPrompt = (question: string) => {
    const formatted = userNote ? `${userNote}\n\n• ${question}\nTrả lời: ` : `• ${question}\nTrả lời: `;
    setUserNote(formatted);
  };

  // Submit and bind brief to appointment
  const handleSubmitBrief = async () => {
    if (!selectedApptId) {
      setSubmitError('Vui lòng chọn một lịch hẹn hợp lệ để gắn bản tóm tắt');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);
      const brief = await api.createBrief({
        appointmentId: selectedApptId,
        rangeDays,
        sections,
        userNote: userNote.trim() || undefined,
      });

      // Lưu vào localStorage để trang lịch hẹn hiển thị
      try {
        const stored = JSON.parse(localStorage.getItem('mindlog_user_briefs') || '{}');
        stored[selectedApptId] = brief;
        localStorage.setItem('mindlog_user_briefs', JSON.stringify(stored));
      } catch (e) {
        console.error('Lỗi lưu brief vào local storage:', e);
      }

      setCreatedBriefId(brief.id);
      setStep(5); // Bước hoàn thành
    } catch (err: any) {
      console.error('Lỗi khi gắn tóm tắt:', err);
      setSubmitError(err?.message || 'Không thể tạo tóm tắt buổi tư vấn');
    } finally {
      setSubmitting(false);
    }
  };

  // Download PDF
  const handleDownloadPdf = async () => {
    if (!createdBriefId) return;
    try {
      await api.downloadBriefPdf(createdBriefId);
    } catch (err: any) {
      alert(err?.message || 'Không thể tải PDF');
    }
  };

  const selectedAppointment = appointments.find((a) => a.id === selectedApptId);

  return (
    <RoleLayout>
      <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Banner tiêu đề */}
        <div className="card" style={{ padding: '24px 28px', background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: 'rgba(99, 102, 241, 0.15)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#818cf8',
                }}
              >
                <FileText size={26} />
              </div>
              <div>
                <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0 0 4px 0', color: '#f8fafc' }}>
                  Chuẩn bị buổi tư vấn (Session Brief)
                </h1>
                <p style={{ margin: 0, fontSize: '0.88rem', color: '#94a3b8' }}>
                  Tự động tổng hợp xu hướng cảm xúc từ nhật ký cá nhân để bạn và chuyên viên có một buổi trao đổi hiệu quả nhất.
                </p>
              </div>
            </div>

            <Link to="/student/appointments" className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '0.82rem' }}>
              ← Quay lại Lịch hẹn
            </Link>
          </div>

          {/* Stepper Wizard Indicator */}
          {step <= 4 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '24px', paddingTop: '18px', borderTop: '1px solid var(--border-glass)', flexWrap: 'wrap', gap: '10px' }}>
              {[
                { num: 1, label: '1. Khoảng thời gian' },
                { num: 2, label: '2. Tùy chỉnh mục' },
                { num: 3, label: '3. Điều muốn nói' },
                { num: 4, label: '4. Xác nhận & Gắn' },
              ].map((s) => {
                const isActive = step === s.num;
                const isPassed = step > s.num;
                return (
                  <div
                    key={s.num}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.86rem',
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? '#818cf8' : isPassed ? '#34d399' : 'var(--text-muted)',
                      cursor: isPassed && !previewError ? 'pointer' : 'default',
                    }}
                    onClick={() => {
                      if (isPassed && !previewError) setStep(s.num);
                    }}
                  >
                    <span
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: isActive ? 'var(--primary)' : isPassed ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255,255,255,0.06)',
                        color: isActive ? '#fff' : isPassed ? '#34d399' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                      }}
                    >
                      {isPassed ? '✓' : s.num}
                    </span>
                    <span>{s.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── BƯỚC 1: CHỌN PHẠM VI DỮ LIỆU & XEM NHÁP ── */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card" style={{ padding: '24px 28px' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={18} color="#818cf8" />
                <span>Bước 1: Chọn khoảng thời gian theo dõi</span>
              </h2>
              <p style={{ color: '#cbd5e1', fontSize: '0.88rem', marginBottom: '16px' }}>
                Hệ thống sẽ lấy dữ liệu check-in webcam, hoạt động nhỏ và nhật ký trong khoảng thời gian bạn chọn:
              </p>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
                {[
                  { days: 7, label: '7 ngày gần nhất', desc: 'Thích hợp khi bạn vừa gặp vấn đề phát sinh gần đây' },
                  { days: 14, label: '14 ngày gần nhất (Khuyên dùng)', desc: 'Phản ánh xu hướng 2 tuần, đủ rõ nét' },
                  { days: 28, label: '28 ngày gần nhất', desc: 'Toàn diện cả tháng, thấy rõ sự thay đổi tâm trạng' },
                ].map((item) => (
                  <button
                    key={item.days}
                    type="button"
                    onClick={() => setRangeDays(item.days)}
                    style={{
                      flex: '1 1 200px',
                      padding: '16px',
                      borderRadius: 'var(--radius-md)',
                      background: rangeDays === item.days ? 'rgba(99, 102, 241, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                      border: `1.5px solid ${rangeDays === item.days ? '#818cf8' : 'var(--border-glass)'}`,
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: rangeDays === item.days ? '#a5b4fc' : '#f8fafc', marginBottom: '4px' }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      {item.desc}
                    </div>
                  </button>
                ))}
              </div>

              {/* Thông báo lỗi khi < 7 ngày */}
              {previewError && (
                <div
                  style={{
                    padding: '16px 20px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#fca5a5',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    marginBottom: '16px',
                  }}
                >
                  <AlertCircle size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: '4px' }}>Chưa đủ dữ liệu để tạo tóm tắt</div>
                    <div>{previewError}</div>
                    <div style={{ marginTop: '8px', fontSize: '0.82rem', color: '#cbd5e1' }}>
                      Gợi ý: Hãy tiếp tục check-in cảm xúc qua webcam mỗi ngày tại{' '}
                      <Link to="/student/checkin" style={{ color: '#93c5fd', textDecoration: 'underline' }}>
                        Trang Check-in
                      </Link>{' '}
                      để tích lũy đủ 7 ngày dữ liệu nhé.
                    </div>
                  </div>
                </div>
              )}

              {/* Xem trước bản nháp tổng quan */}
              {loadingPreview ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                  <div>Đang tính toán thống kê bản nháp...</div>
                </div>
              ) : previewData && (
                <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '18px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#34d399', fontSize: '0.88rem', fontWeight: 700 }}>
                    <CheckCircle2 size={16} />
                    <span>Dữ liệu hợp lệ ({previewData.snapshot.rangeDays} ngày từ {previewData.snapshot.dateFrom} đến {previewData.snapshot.dateTo})</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                    {previewData.snapshot.trend && (
                      <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Cảm xúc chủ đạo</div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
                          {previewData.snapshot.trend.dominantEmotion} ({previewData.snapshot.trend.totalCheckIns} check-in)
                        </div>
                      </div>
                    )}
                    {previewData.snapshot.negativeDays && (
                      <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Ngày tiêu cực</div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fca5a5', marginTop: '2px' }}>
                          {previewData.snapshot.negativeDays.negativeDaysCount}/{previewData.snapshot.negativeDays.totalEvaluatedDays} ngày ({previewData.snapshot.negativeDays.negativeRatioPercent}%)
                        </div>
                      </div>
                    )}
                    {previewData.snapshot.difficultHours && (
                      <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Khung giờ căng thẳng nhất</div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fde68a', marginTop: '2px' }}>
                          {previewData.snapshot.difficultHours.mostDifficultSlot}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button
                  type="button"
                  disabled={!!previewError || loadingPreview}
                  onClick={() => setStep(2)}
                  className="btn btn-primary"
                  style={{ padding: '10px 22px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <span>Tiếp tục sang Tùy chỉnh mục</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── BƯỚC 2: TÙY CHỈNH CÁC MỤC (BẬT / TẮT) ── */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card" style={{ padding: '24px 28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Eye size={18} color="#818cf8" />
                  <span>Bước 2: Tùy chỉnh nội dung bạn muốn chia sẻ</span>
                </h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Mục bạn tắt sẽ không xuất hiện trong bản tóm tắt lẫn file PDF
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
                {[
                  {
                    key: 'includeTrend' as const,
                    title: 'Xu hướng cảm xúc theo ngày',
                    desc: 'Điểm tích cực / tiêu cực trung bình và cảm xúc xuất hiện nhiều nhất.',
                    icon: <TrendingUp size={18} color="#38bdf8" />,
                  },
                  {
                    key: 'includeNegativeDays' as const,
                    title: 'Số ngày tâm trạng tiêu cực / quá tải',
                    desc: 'Tỷ lệ số ngày điểm tiêu cực vượt ngưỡng trung bình trong giai đoạn.',
                    icon: <AlertTriangle size={18} color="#f59e0b" />,
                  },
                  {
                    key: 'includeDifficultHours' as const,
                    title: 'Khung giờ dễ căng thẳng nhất trong ngày',
                    desc: 'Xác định thời điểm (Sáng, Chiều, Tối, Đêm muộn) bạn hay cảm thấy lo âu hoặc mệt mỏi nhất.',
                    icon: <Clock size={18} color="#a855f7" />,
                  },
                  {
                    key: 'includeActivities' as const,
                    title: 'Hoạt động & bài tập tự chăm sóc đã hoàn thành',
                    desc: 'Danh sách các bài tập thở, đi dạo, kết nối bạn bè bạn đã làm.',
                    icon: <Activity size={18} color="#34d399" />,
                  },
                  {
                    key: 'includeJournalNotes' as const,
                    title: 'Trích đoạn nhật ký cá nhân ngắn',
                    desc: 'Tâm trạng và vài dòng tóm tắt nhật ký bạn đã tự viết.',
                    icon: <BookOpen size={18} color="#ec4899" />,
                  },
                ].map((item) => {
                  const isChecked = sections[item.key];
                  return (
                    <div
                      key={item.key}
                      onClick={() => handleToggleSection(item.key)}
                      style={{
                        padding: '16px 20px',
                        borderRadius: 'var(--radius-md)',
                        background: isChecked ? 'rgba(99, 102, 241, 0.08)' : 'rgba(15, 23, 42, 0.4)',
                        border: `1.5px solid ${isChecked ? 'rgba(99, 102, 241, 0.35)' : 'rgba(148, 163, 184, 0.15)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {item.icon}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.92rem', color: isChecked ? '#f8fafc' : '#94a3b8' }}>
                            {item.title}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                            {item.desc}
                          </div>
                        </div>
                      </div>

                      {/* Custom Switch Toggle */}
                      <div
                        style={{
                          width: '46px',
                          height: '24px',
                          borderRadius: '12px',
                          background: isChecked ? '#6366f1' : '#334155',
                          position: 'relative',
                          transition: 'background 0.2s',
                          flexShrink: 0,
                        }}
                      >
                        <div
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            background: '#ffffff',
                            position: 'absolute',
                            top: '3px',
                            left: isChecked ? '24px' : '4px',
                            transition: 'left 0.2s',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn btn-secondary"
                  style={{ padding: '10px 18px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <ArrowLeft size={16} /> Quay lại
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="btn btn-primary"
                  style={{ padding: '10px 22px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <span>Tiếp tục: Viết điều muốn nói</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── BƯỚC 3: ĐIỀU MÌNH MUỐN NÓI (3 CÂU HỎI GỢI Ý) ── */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card" style={{ padding: '24px 28px' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="#818cf8" />
                <span>Bước 3: Điều bạn muốn chia sẻ trước với chuyên viên</span>
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginBottom: '16px' }}>
                Bạn có thể ghi chú ngắn gọn để chuyên viên nắm được mong đợi hoặc bối cảnh của bạn. Bạn có thể nhấn vào các câu hỏi gợi ý bên dưới để chèn nhanh:
              </p>

              {/* 3 câu hỏi gợi ý */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <HelpCircle size={14} color="#818cf8" />
                  <span>3 Câu hỏi gợi ý (bấm vào để chèn nội dung):</span>
                </div>
                {PROMPT_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleInsertPrompt(q)}
                    style={{
                      textAlign: 'left',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(99, 102, 241, 0.08)',
                      border: '1px dashed rgba(99, 102, 241, 0.3)',
                      color: '#c7d2fe',
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(99, 102, 241, 0.18)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)')}
                  >
                    + {q}
                  </button>
                ))}
              </div>

              {/* Textarea nhập ghi chú */}
              <div>
                <textarea
                  rows={6}
                  value={userNote}
                  onChange={(e) => setUserNote(e.target.value)}
                  placeholder="Viết suy nghĩ, nỗi lo hoặc mong muốn của bạn tại đây... (Ví dụ: Em cảm thấy kiệt sức vì bài tập lớn và mất ngủ, em muốn xin lời khuyên về cách điều hòa tâm trạng)"
                  className="input"
                  style={{
                    width: '100%',
                    padding: '14px',
                    fontSize: '0.9rem',
                    lineHeight: '1.6',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '6px', textAlign: 'right' }}>
                  {userNote.length} ký tự
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn btn-secondary"
                  style={{ padding: '10px 18px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <ArrowLeft size={16} /> Quay lại
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="btn btn-primary"
                  style={{ padding: '10px 22px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <span>Tiếp tục: Xác nhận & Gắn lịch</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── BƯỚC 4: XÁC NHẬN & GẮN VÀO LỊCH HẸN ── */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card" style={{ padding: '24px 28px' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} color="#10b981" />
                <span>Bước 4: Xác nhận thông tin và gắn vào lịch hẹn</span>
              </h2>

              {/* 1. Chọn lịch hẹn */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '8px', color: '#cbd5e1' }}>
                  Chọn lịch hẹn tham vấn của bạn:
                </label>
                {loadingAppts ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Đang tải lịch hẹn...</div>
                ) : appointments.length === 0 ? (
                  <div style={{ padding: '14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', fontSize: '0.88rem' }}>
                    Bạn chưa có lịch hẹn nào hợp lệ. Vui lòng{' '}
                    <Link to="/student/appointments" style={{ color: '#93c5fd', textDecoration: 'underline' }}>
                      đặt một lịch hẹn mới
                    </Link>{' '}
                    trước khi gắn tóm tắt.
                  </div>
                ) : (
                  <select
                    value={selectedApptId}
                    onChange={(e) => setSelectedApptId(e.target.value)}
                    className="input"
                    style={{ width: '100%', padding: '10px 14px', fontSize: '0.9rem' }}
                  >
                    {appointments.map((a) => (
                      <option key={a.id} value={a.id}>
                        {new Date(a.startAt).toLocaleDateString('vi-VN')} {new Date(a.startAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - Chuyên viên: {a.counselor?.fullName} ({a.status})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* 2. Minh bạch quyền riêng tư (Ai xem được? Hết hạn khi nào?) */}
              <div
                style={{
                  padding: '18px 20px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(15, 23, 42, 0.65)',
                  border: '1px solid var(--border-glass)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lock size={16} color="#818cf8" />
                  <span>Bảo mật & Quyền riêng tư của bạn:</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', fontSize: '0.86rem' }}>
                  <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                    <div style={{ color: '#94a3b8' }}>Người xem được:</div>
                    <div style={{ fontWeight: 600, color: '#f8fafc', marginTop: '2px' }}>
                      {selectedAppointment?.counselor?.fullName ? `${selectedAppointment.counselor.fullName} (${selectedAppointment.counselor.email})` : 'Chuyên viên của lịch hẹn đã chọn'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                      Chuyên viên khác, sinh viên khác và Quản trị viên (Admin) hoàn toàn KHÔNG THỂ XEM.
                    </div>
                  </div>

                  <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                    <div style={{ color: '#94a3b8' }}>Thời hạn truy cập:</div>
                    <div style={{ fontWeight: 600, color: '#38bdf8', marginTop: '2px' }}>
                      Tự động khóa sau 7 ngày kể từ giờ kết thúc hẹn
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                      Bạn có quyền bấm &quot;Thu hồi&quot; bất kỳ lúc nào để vô hiệu hóa quyền xem ngay lập tức.
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.8rem', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
                  <strong>Miễn trừ trách nhiệm y tế:</strong> Dữ liệu tổng hợp từ hoạt động tự ghi nhận của bạn nhằm hỗ trợ trao đổi thuận tiện, không có giá trị chẩn đoán hay kết luận y khoa.
                </div>
              </div>

              {/* Lỗi submit nếu có */}
              {submitError && (
                <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', fontSize: '0.85rem', marginBottom: '16px' }}>
                  {submitError}
                </div>
              )}

              {/* Nút hành động */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="btn btn-secondary"
                  style={{ padding: '10px 18px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <ArrowLeft size={16} /> Quay lại
                </button>
                <button
                  type="button"
                  disabled={submitting || !selectedApptId || appointments.length === 0}
                  onClick={handleSubmitBrief}
                  className="btn btn-primary"
                  style={{ padding: '12px 26px', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Send size={18} />
                  <span>{submitting ? 'Đang tạo & gắn tóm tắt...' : 'Xác nhận & Gắn vào Lịch hẹn'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── BƯỚC 5: HOÀN THÀNH THÀNH CÔNG ── */}
        {step === 5 && (
          <div className="card" style={{ padding: '40px 30px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(52, 211, 153, 0.15)',
                color: '#34d399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
              Đã tạo và gắn Bản tóm tắt tư vấn thành công!
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: '560px', margin: 0 }}>
              Bản tóm tắt đã được gắn vào lịch hẹn của bạn. Chuyên viên sẽ có thể xem bản đóng băng này trước buổi hẹn để chuẩn bị tốt nhất.
            </p>

            <div style={{ display: 'flex', gap: '14px', marginTop: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="btn btn-primary"
                style={{ padding: '10px 20px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Download size={18} />
                <span>Tải file PDF tóm tắt</span>
              </button>

              <Link
                to="/student/appointments"
                className="btn btn-secondary"
                style={{ padding: '10px 20px', fontSize: '0.9rem' }}
              >
                Quản lý lịch hẹn & Thu hồi
              </Link>
            </div>
          </div>
        )}

      </div>
    </RoleLayout>
  );
};
export default SessionBriefPreparePage;
