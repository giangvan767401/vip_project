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

  async getCounselors(): Promise<import('../types/privacy').Counselor[]> {
    const res = await fetch(`${API_BASE_URL}/counselors`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<import('../types/privacy').Counselor[]>(res);
  }

  async getMyConsents(): Promise<import('../types/privacy').ConsentShare[]> {
    const res = await fetch(`${API_BASE_URL}/consents/me`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<import('../types/privacy').ConsentShare[]>(res);
  }

  async grantConsent(counselorId: string): Promise<import('../types/privacy').ConsentShare> {
    const res = await fetch(`${API_BASE_URL}/consents`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ counselorId }),
    });
    return this.handleResponse<import('../types/privacy').ConsentShare>(res);
  }

  async revokeConsent(id: string): Promise<import('../types/privacy').ConsentShare> {
    const res = await fetch(`${API_BASE_URL}/consents/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse<import('../types/privacy').ConsentShare>(res);
  }

  async exportMyData(): Promise<import('../types/privacy').ExportDataResponse> {
    const res = await fetch(`${API_BASE_URL}/me/export`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<import('../types/privacy').ExportDataResponse>(res);
  }

  async deleteMyData(password: string): Promise<{ message: string; deletedCounts?: Record<string, number> }> {
    const res = await fetch(`${API_BASE_URL}/me/data`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      body: JSON.stringify({ password }),
    });
    return this.handleResponse<{ message: string; deletedCounts?: Record<string, number> }>(res);
  }

  async getCounselorClients(): Promise<import('../types/counselor').CounselorClient[]> {
    const res = await fetch(`${API_BASE_URL}/counselor/clients`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<import('../types/counselor').CounselorClient[]>(res);
  }

  async getCounselorClientSummary(
    studentId: string,
    range: 'day' | 'week' = 'week',
  ): Promise<import('../types/counselor').CounselorClientSummary> {
    const res = await fetch(`${API_BASE_URL}/counselor/clients/${studentId}/summary?range=${range}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<import('../types/counselor').CounselorClientSummary>(res);
  }

  async getCounselorStats(): Promise<import('../types/counselor').CounselorStats> {
    const res = await fetch(`${API_BASE_URL}/counselor/stats`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<import('../types/counselor').CounselorStats>(res);
  }

  // 10.1 & 10.3: Lịch hẹn
  async createAppointment(payload: import('../types/appointment').CreateAppointmentPayload): Promise<import('../types/appointment').Appointment> {
    const res = await fetch(`${API_BASE_URL}/appointments`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    return this.handleResponse<import('../types/appointment').Appointment>(res);
  }

  async getMyAppointments(): Promise<import('../types/appointment').Appointment[]> {
    const res = await fetch(`${API_BASE_URL}/appointments/me`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<import('../types/appointment').Appointment[]>(res);
  }

  async cancelAppointment(id: string): Promise<import('../types/appointment').Appointment> {
    const res = await fetch(`${API_BASE_URL}/appointments/${id}/cancel`, {
      method: 'PATCH',
      headers: this.getHeaders(),
    });
    return this.handleResponse<import('../types/appointment').Appointment>(res);
  }

  async getCounselorAppointments(): Promise<import('../types/appointment').Appointment[]> {
    const res = await fetch(`${API_BASE_URL}/counselor/appointments`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<import('../types/appointment').Appointment[]>(res);
  }

  async updateAppointmentStatus(
    id: string,
    status: 'CONFIRMED' | 'CANCELLED',
  ): Promise<import('../types/appointment').Appointment> {
    const res = await fetch(`${API_BASE_URL}/counselor/appointments/${id}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ status }),
    });
    return this.handleResponse<import('../types/appointment').Appointment>(res);
  }

  // 10.2 & 10.4: Quản lý tài nguyên cho Counselor
  async createResource(payload: import('../types/resource').CreateResourcePayload): Promise<import('../types/resource').ResourceItem> {
    const res = await fetch(`${API_BASE_URL}/resources`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    return this.handleResponse<import('../types/resource').ResourceItem>(res);
  }

  async updateResource(
    id: string,
    payload: import('../types/resource').UpdateResourcePayload,
  ): Promise<import('../types/resource').ResourceItem> {
    const res = await fetch(`${API_BASE_URL}/resources/${id}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    return this.handleResponse<import('../types/resource').ResourceItem>(res);
  }

  async deleteResource(id: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE_URL}/resources/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse<{ message: string }>(res);
  }

  // ==========================================
  // Module 11: Admin Endpoints
  // ==========================================
  async getAdminUsers(): Promise<{ total: number; users: import('../types/admin').AdminUser[] }> {
    const res = await fetch(`${API_BASE_URL}/admin/users`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<{ total: number; users: import('../types/admin').AdminUser[] }>(res);
  }

  async createAdminCounselor(payload: { email: string; fullName: string; password: string }): Promise<import('../types/admin').AdminUser> {
    const res = await fetch(`${API_BASE_URL}/admin/counselors`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    return this.handleResponse<import('../types/admin').AdminUser>(res);
  }

  async updateAdminUserRole(id: string, role: import('../types/auth').Role): Promise<import('../types/admin').AdminUser> {
    const res = await fetch(`${API_BASE_URL}/admin/users/${id}/role`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ role }),
    });
    return this.handleResponse<import('../types/admin').AdminUser>(res);
  }

  async updateAdminUserStatus(id: string, isActive: boolean): Promise<import('../types/admin').AdminUser> {
    const res = await fetch(`${API_BASE_URL}/admin/users/${id}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ isActive }),
    });
    return this.handleResponse<import('../types/admin').AdminUser>(res);
  }

  async getAdminAlertRules(): Promise<import('../types/admin').AdminAlertRule[]> {
    const res = await fetch(`${API_BASE_URL}/admin/alert-rules`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<import('../types/admin').AdminAlertRule[]>(res);
  }

  async createAdminAlertRule(payload: {
    name: string;
    negativeThreshold: number;
    consecutiveDays: number;
    timeWindowDays: number;
    level: string;
    isActive?: boolean;
  }): Promise<import('../types/admin').AdminAlertRule> {
    const res = await fetch(`${API_BASE_URL}/admin/alert-rules`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    return this.handleResponse<import('../types/admin').AdminAlertRule>(res);
  }

  async updateAdminAlertRule(
    id: string,
    payload: Partial<import('../types/admin').AdminAlertRule>,
  ): Promise<import('../types/admin').AdminAlertRule> {
    const res = await fetch(`${API_BASE_URL}/admin/alert-rules/${id}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    return this.handleResponse<import('../types/admin').AdminAlertRule>(res);
  }

  async deleteAdminAlertRule(id: string): Promise<{ message: string; id: string }> {
    const res = await fetch(`${API_BASE_URL}/admin/alert-rules/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse<{ message: string; id: string }>(res);
  }

  async getAdminStats(): Promise<import('../types/admin').AdminStats> {
    const res = await fetch(`${API_BASE_URL}/admin/stats`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<import('../types/admin').AdminStats>(res);
  }

  async getAdminResources(): Promise<import('../types/admin').AdminResource[]> {
    const res = await fetch(`${API_BASE_URL}/admin/resources`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<import('../types/admin').AdminResource[]>(res);
  }

  async updateAdminResourceVisibility(id: string, isPublished: boolean): Promise<import('../types/admin').AdminResource> {
    const res = await fetch(`${API_BASE_URL}/admin/resources/${id}/visibility`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ isPublished }),
    });
    return this.handleResponse<import('../types/admin').AdminResource>(res);
  }

  async deleteAdminResource(id: string): Promise<{ message: string; id: string }> {
    const res = await fetch(`${API_BASE_URL}/admin/resources/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse<{ message: string; id: string }>(res);
  }
}

export const api = new ApiClient();




