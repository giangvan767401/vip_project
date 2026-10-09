import { Role } from './auth';

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    emotionLogs: number;
    journalEntries: number;
    appointmentsStudent: number;
    appointmentsCounselor: number;
  };
}

export interface AdminAlertRule {
  id: string;
  name: string;
  negativeThreshold: number;
  consecutiveDays: number;
  timeWindowDays: number;
  level: string; // nhe, vua, keo_dai
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminStats {
  users: {
    total: number;
    students: number;
    counselors: number;
    admins: number;
  };
  activities: {
    totalEmotionLogs: number;
    totalJournalEntries: number;
    totalActiveConsents: number;
  };
  appointments: {
    total: number;
    confirmed: number;
    pending: number;
    cancelled: number;
  };
  resources: {
    total: number;
  };
}

export interface AdminResource {
  id: string;
  creatorId?: string | null;
  title: string;
  description?: string | null;
  type: string;
  level: string;
  content?: string | null;
  url?: string | null;
  durationMinutes?: number | null;
  isPublished: boolean;
  createdAt: string;
  creator?: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  } | null;
}
