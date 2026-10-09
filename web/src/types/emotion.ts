export interface EmotionScores {
  Angry: number;
  Disgust: number;
  Fear: number;
  Happy: number;
  Sad: number;
  Surprise: number;
  Neutral: number;
  [key: string]: number;
}

export interface EmotionDetection {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  emotion: string;
  scores: Record<string, number>;
  color: string;
}

export interface EmotionWSResult {
  type: 'result';
  emotion: string;
  scores: EmotionScores;
  fps?: number;
  detections?: EmotionDetection[];
  frame_width?: number;
  frame_height?: number;
}

export interface CreateEmotionLogPayload {
  emotion: string;
  positiveScore: number;
  negativeScore: number;
  startedAt: string;
  endedAt: string;
  scores?: Record<string, number>;
  note?: string;
}

export interface EmotionLog {
  id: string;
  userId: string;
  emotion: string;
  positiveScore: number;
  negativeScore: number;
  scores?: Record<string, number>;
  startedAt: string;
  endedAt: string;
  note?: string | null;
  createdAt: string;
}

export interface EmotionTrendItem {
  label: string;
  date: string;
  avgPositive: number;
  avgNegative: number;
  dominantEmotion: string;
  count: number;
}

export interface EmotionDistributionItem {
  emotion: string;
  count: number;
  percentage: number;
}

export interface EmotionDayComparison {
  dayName: string;
  dateLabel: string;
  thisWeekPositive: number;
  lastWeekPositive: number;
  thisWeekNegative: number;
  lastWeekNegative: number;
}

export interface EmotionSummaryData {
  range: 'day' | 'week';
  summary: {
    dominantEmotion: string;
    avgPositiveScore: number;
    avgNegativeScore: number;
    totalCheckIns: number;
  };
  trend: EmotionTrendItem[];
  distribution: EmotionDistributionItem[];
  comparison: {
    thisWeek: {
      avgPositiveScore: number;
      avgNegativeScore: number;
      totalCheckIns: number;
      dominantEmotion: string;
    };
    previousWeek: {
      avgPositiveScore: number;
      avgNegativeScore: number;
      totalCheckIns: number;
      dominantEmotion: string;
    };
    positiveDiff: number;
    negativeDiff: number;
    byDay: EmotionDayComparison[];
  };
}

