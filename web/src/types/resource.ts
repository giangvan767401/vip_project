export interface ResourceItem {
  id: string;
  title: string;
  description?: string | null;
  type: 'EXERCISE' | 'ARTICLE' | 'HOTLINE' | 'TIP' | string;
  level: string;
  content?: string | null;
  url?: string | null;
  durationMinutes?: number | null;
  createdAt: string;
  updatedAt: string;
}
