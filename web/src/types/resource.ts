export interface ResourceItem {
  id: string;
  creatorId?: string | null;
  title: string;
  description?: string | null;
  type: 'EXERCISE' | 'ARTICLE' | 'HOTLINE' | 'TIP' | string;
  level: string;
  content?: string | null;
  url?: string | null;
  durationMinutes?: number | null;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    fullName: string;
    email: string;
  } | null;
}

export interface CreateResourcePayload {
  title: string;
  description?: string;
  type: string;
  level?: string;
  content?: string;
  url?: string;
  durationMinutes?: number;
}

export interface UpdateResourcePayload extends Partial<CreateResourcePayload> {}
