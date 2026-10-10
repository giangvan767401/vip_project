export interface ActivityTemplate {
  id: string;
  title: string;
  description: string;
  category: 'PHYSICAL' | 'MINDFUL' | 'SOCIAL' | 'CREATIVE' | 'SELF_CARE' | string;
  level: string;
  durationMin: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DailyActivity {
  id: string;
  userId: string;
  templateId: string;
  date: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  template: ActivityTemplate;
}

export interface TodayActivitiesResponse {
  today: string;
  alertLevel: string;
  swapsRemaining: number;
  activities: DailyActivity[];
}

export interface HistoryDay {
  date: string;
  total: number;
  completed: number;
  isSuccess: boolean;
}

export interface ActivityStreakResponse {
  currentStreak: number;
  maxStreak: number;
  isTodayCompleted: boolean;
  totalCompletedAllTime: number;
  recentHistory: HistoryDay[];
}
