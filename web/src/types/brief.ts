export interface SectionsConfig {
  includeTrend: boolean;
  includeNegativeDays: boolean;
  includeDifficultHours: boolean;
  includeActivities: boolean;
  includeJournalNotes: boolean;
}

export interface DailyStatItem {
  date: string;
  avgPositive: number;
  avgNegative: number;
  dominantEmotion: string;
  checkInCount: number;
}

export interface SlotStatItem {
  slotName: string;
  timeRange: string;
  checkInCount: number;
  avgNegativeScore: number;
  negativeCount: number;
}

export interface ActivityItem {
  title: string;
  category: string;
  completedDate: string;
}

export interface JournalNoteSnippet {
  date: string;
  mood: number;
  noteSnippet: string;
}

export interface SnapshotData {
  rangeDays: number;
  dateFrom: string;
  dateTo: string;
  generatedAt: string;
  disclaimer: string;
  userNote?: string;
  trend?: {
    avgPositiveScore: number;
    avgNegativeScore: number;
    dominantEmotion: string;
    totalCheckIns: number;
    dailyStats: DailyStatItem[];
  };
  negativeDays?: {
    totalEvaluatedDays: number;
    negativeDaysCount: number;
    negativeRatioPercent: number;
    description: string;
  };
  difficultHours?: {
    slots: SlotStatItem[];
    mostDifficultSlot: string;
    recommendation: string;
  };
  activities?: {
    totalCompleted: number;
    items: ActivityItem[];
  };
  journalNotes?: JournalNoteSnippet[];
}

export interface BriefPreviewResponse {
  rangeDays: number;
  sections: Partial<SectionsConfig>;
  userNote: string | null;
  snapshot: SnapshotData;
}

export interface SessionBrief {
  id: string;
  userId: string;
  appointmentId: string;
  rangeDays: number;
  sections: SectionsConfig;
  userNote?: string | null;
  snapshot: SnapshotData;
  expiresAt: string;
  revokedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  appointment?: {
    id: string;
    startAt: string;
    status: string;
    counselor?: {
      id: string;
      fullName: string;
      email: string;
    };
  };
}

export interface CounselorBriefResponse {
  id: string;
  appointmentId: string;
  student: {
    id: string;
    fullName: string;
    email: string;
  };
  startAt: string;
  rangeDays: number;
  userNote?: string | null;
  snapshot: SnapshotData;
  expiresAt: string;
  createdAt: string;
  disclaimer: string;
}

export interface CreateBriefPreviewPayload {
  rangeDays?: number;
  sections?: Partial<SectionsConfig>;
  userNote?: string;
}

export interface CreateBriefPayload {
  appointmentId: string;
  rangeDays?: number;
  sections?: Partial<SectionsConfig>;
  userNote?: string;
}
