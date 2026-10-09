export interface JournalEntry {
  id: string;
  userId: string;
  mood: number; // 1 to 5
  note: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJournalEntryInput {
  mood: number;
  note: string;
  date?: string;
}

export interface UpdateJournalEntryInput {
  mood?: number;
  note?: string;
  date?: string;
}
