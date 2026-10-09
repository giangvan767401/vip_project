import { EmotionLog, EmotionSummaryData } from './emotion';
import { UserAlert } from './alert';

export interface CounselorClient {
  consentId: string;
  grantedAt: string;
  student: {
    id: string;
    fullName: string;
    email: string;
    createdAt?: string;
  };
  alertLevel: 'binh_thuong' | 'nhe' | 'vua' | 'keo_dai';
  activeRuleName: string;
  consecutiveNegativeDays: number;
  lastCheckIn: string | null;
  lastEmotion: string | null;
}

export interface CounselorClientSummary {
  student: {
    id: string;
    fullName: string;
    email: string;
    createdAt?: string;
  };
  consent: {
    id: string;
    grantedAt: string;
  };
  summary: EmotionSummaryData;
  alert: UserAlert;
  recentLogs: EmotionLog[];
}

export interface CounselorStats {
  hasEnoughData: boolean;
  minimumRequired?: number;
  currentCount?: number;
  message?: string;
  totalStudents?: number;
  totalCheckIns?: number;
  avgPositiveScore?: number;
  avgNegativeScore?: number;
  distribution?: { emotion: string; count: number; percentage: number }[];
}

export interface RealtimeAlert {
  studentId: string;
  studentName: string;
  studentEmail: string;
  level: string;
  timestamp: string;
  alert?: Record<string, unknown>;
}
