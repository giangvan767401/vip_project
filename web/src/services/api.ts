import { AuthResponse, User } from '../types/auth';
import { CreateEmotionLogPayload, EmotionLog } from '../types/emotion';
import { CreateJournalEntryInput, JournalEntry, UpdateJournalEntryInput } from '../types/journal';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiClient {
  private getHeaders(token?: string | null): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    const activeToken = token || localStorage.getItem('mindlog_token');
    if (activeToken) {
      headers['Authorization'] = `Bearer ${activeToken}`;
    }
    return headers;
  }

  private async handleResponse<T>(res: Response): Promise<T> {
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const errorMessage = data?.message || `Lỗi hệ thống (${res.status})`;
      throw new Error(errorMessage);
    }
    return data as T;
  }

  async register(body: { email: string; password: string; fullName: string; role?: string }): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    return this.handleResponse<AuthResponse>(res);
  }

  async login(body: { email: string; password: string }): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    return this.handleResponse<AuthResponse>(res);
  }

  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<User>(res);
  }

  async createEmotionLog(body: CreateEmotionLogPayload): Promise<EmotionLog> {
    const res = await fetch(`${API_BASE_URL}/emotion-logs`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    return this.handleResponse<EmotionLog>(res);
  }

  async getEmotionLogs(): Promise<EmotionLog[]> {
    const res = await fetch(`${API_BASE_URL}/emotion-logs`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<EmotionLog[]>(res);
  }

  async getEmotionSummary(range: 'day' | 'week' = 'week'): Promise<import('../types/emotion').EmotionSummaryData> {
    const res = await fetch(`${API_BASE_URL}/emotion-logs/summary?range=${range}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<import('../types/emotion').EmotionSummaryData>(res);
  }

  async getJournalEntries(): Promise<JournalEntry[]> {
    const res = await fetch(`${API_BASE_URL}/journal-entries`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<JournalEntry[]>(res);
  }

  async createJournalEntry(body: CreateJournalEntryInput): Promise<JournalEntry> {
    const res = await fetch(`${API_BASE_URL}/journal-entries`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    return this.handleResponse<JournalEntry>(res);
  }

  async updateJournalEntry(id: string, body: UpdateJournalEntryInput): Promise<JournalEntry> {
    const res = await fetch(`${API_BASE_URL}/journal-entries/${id}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    return this.handleResponse<JournalEntry>(res);
  }

  async deleteJournalEntry(id: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE_URL}/journal-entries/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse<{ message: string }>(res);
  }

  async getAlert(): Promise<import('../types/alert').UserAlert> {
    const res = await fetch(`${API_BASE_URL}/alerts/me`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<import('../types/alert').UserAlert>(res);
  }

  async getResources(level?: string): Promise<import('../types/resource').ResourceItem[]> {
    const query = level ? `?level=${encodeURIComponent(level)}` : '';
    const res = await fetch(`${API_BASE_URL}/resources${query}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<import('../types/resource').ResourceItem[]>(res);
  }
}

export const api = new ApiClient();

