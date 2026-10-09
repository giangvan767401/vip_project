export interface AlertDayDetail {
  date: string;
  label: string;
  avgNegative: number;
  isNegative: boolean;
}

export interface UserAlert {
  level: 'binh_thuong' | 'nhe' | 'vua' | 'keo_dai';
  totalNegativeDays: number;
  consecutiveNegativeDays: number;
  timeWindowDays: number;
  thresholdApplied: number;
  activeRuleName: string;
  message: string;
  recommendation: string;
  disclaimer: string;
  details: AlertDayDetail[];
}
