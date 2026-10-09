export type ConsentStatus = 'ACTIVE' | 'REVOKED';

export interface Counselor {
  id: string;
  fullName: string;
  email: string;
}

export interface ConsentShare {
  id: string;
  userId: string;
  counselorId: string;
  status: ConsentStatus;
  grantedAt: string;
  revokedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  counselor?: Counselor;
}

export interface ExportDataResponse {
  exportedAt: string;
  source: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    createdAt: string;
  };
  totalEmotionLogs: number;
  totalJournalEntries: number;
  totalConsents: number;
  emotionLogs: unknown[];
  journalEntries: unknown[];
  consents: ConsentShare[];
}
