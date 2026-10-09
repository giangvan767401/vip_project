import { useCallback, useEffect, useRef, useState } from 'react';
import { EmotionLog, EmotionScores, EmotionWSResult } from '../types/emotion';
import { api } from '../services/api';

interface UseEmotionAggregatorOptions {
  windowSeconds?: number; // 5-10s, default 8s
  onLogSaved?: (log: EmotionLog) => void;
  onError?: (err: Error) => void;
}

interface EmotionSample {
  emotion: string;
  scores: EmotionScores;
  timestamp: number;
}

export const useEmotionAggregator = ({
  windowSeconds = 8,
  onLogSaved,
  onError,
}: UseEmotionAggregatorOptions = {}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [cycleProgress, setCycleProgress] = useState(0);
  const [savedLogs, setSavedLogs] = useState<EmotionLog[]>([]);

  const samplesRef = useRef<EmotionSample[]>([]);
  const windowStartRef = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const calculateDominantAndScores = (samples: EmotionSample[]) => {
    const counts: Record<string, number> = {};
    const sumScores: Record<string, number> = {
      Angry: 0,
      Disgust: 0,
      Fear: 0,
      Happy: 0,
      Sad: 0,
      Surprise: 0,
      Neutral: 0,
    };

    samples.forEach((s) => {
      counts[s.emotion] = (counts[s.emotion] || 0) + 1;
      if (s.scores) {
        Object.entries(s.scores).forEach(([k, v]) => {
          sumScores[k] = (sumScores[k] || 0) + (typeof v === 'number' ? v : 0);
        });
      }
    });

    let dominantEmotion = 'Neutral';
    let maxCount = -1;
    Object.entries(counts).forEach(([emo, count]) => {
      if (count > maxCount) {
        maxCount = count;
        dominantEmotion = emo;
      }
    });

    const avgScores: Record<string, number> = {};
    Object.entries(sumScores).forEach(([k, sum]) => {
      avgScores[k] = Math.round((sum / samples.length) * 10) / 10;
    });

    const positiveScore = Math.min(100, Math.max(0, avgScores.Happy || 0));
    const negativeScore = Math.min(
      100,
      Math.max(
        0,
        Math.round(
          ((avgScores.Angry || 0) +
            (avgScores.Disgust || 0) +
            (avgScores.Fear || 0) +
            (avgScores.Sad || 0)) *
            10
        ) / 10
      )
    );

    return { dominantEmotion, avgScores, positiveScore, negativeScore };
  };

  const flush = useCallback(async () => {
    const currentSamples = [...samplesRef.current];
    const windowStart = windowStartRef.current;
    const windowEnd = Date.now();

    // Reset buffer for next cycle
    samplesRef.current = [];
    windowStartRef.current = Date.now();
    setCycleProgress(0);

    if (currentSamples.length < 2) {
      return null;
    }

    try {
      setIsSaving(true);
      const { dominantEmotion, avgScores, positiveScore, negativeScore } =
        calculateDominantAndScores(currentSamples);

      const saved = await api.createEmotionLog({
        emotion: dominantEmotion,
        positiveScore,
        negativeScore,
        scores: avgScores,
        startedAt: new Date(windowStart).toISOString(),
        endedAt: new Date(windowEnd).toISOString(),
      });

      setSavedLogs((prev) => [saved, ...prev]);
      if (onLogSaved) {
        onLogSaved(saved);
      }
      return saved;
    } catch (err: any) {
      if (onError) onError(err);
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [onLogSaved, onError]);

  const addSample = useCallback(
    (result: EmotionWSResult) => {
      if (!result.emotion) return;
      samplesRef.current.push({
        emotion: result.emotion,
        scores: result.scores,
        timestamp: Date.now(),
      });
    },
    []
  );

  // Interval check to progress cycle and trigger flush every windowSeconds
  useEffect(() => {
    const intervalMs = 200;
    const totalMs = windowSeconds * 1000;

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - windowStartRef.current;
      const progress = Math.min(100, Math.round((elapsed / totalMs) * 100));
      setCycleProgress(progress);

      if (elapsed >= totalMs) {
        flush();
      }
    }, intervalMs);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [windowSeconds, flush]);

  return {
    addSample,
    flush,
    isSaving,
    cycleProgress,
    savedLogs,
    setSavedLogs,
  };
};
