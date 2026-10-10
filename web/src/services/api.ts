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

  // ==========================================
  // Module 13: Conversation & Messaging Endpoints
  // ==========================================
  async createConversation(counselorId: string): Promise<import('../types/conversation').Conversation> {
    const res = await fetch(`${API_BASE_URL}/conversations`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ counselorId }),
    });
    return this.handleResponse<import('../types/conversation').Conversation>(res);
  }

  async getConversations(): Promise<import('../types/conversation').Conversation[]> {
    const res = await fetch(`${API_BASE_URL}/conversations`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<import('../types/conversation').Conversation[]>(res);
  }

  async updateConversationStatus(
    id: string,
    status: import('../types/conversation').ConversationStatus,
  ): Promise<import('../types/conversation').Conversation> {
    const res = await fetch(`${API_BASE_URL}/conversations/${id}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ status }),
    });
    return this.handleResponse<import('../types/conversation').Conversation>(res);
  }

  async getConversationMessages(
    id: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<import('../types/conversation').MessagesResponse> {
    const res = await fetch(`${API_BASE_URL}/conversations/${id}/messages?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<import('../types/conversation').MessagesResponse>(res);
  }

  async sendMessage(id: string, content: string): Promise<import('../types/conversation').Message> {
    const res = await fetch(`${API_BASE_URL}/conversations/${id}/messages`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ content }),
    });
    return this.handleResponse<import('../types/conversation').Message>(res);
  }

  async markConversationAsRead(id: string): Promise<{ success: boolean; readAt: string }> {
    const res = await fetch(`${API_BASE_URL}/conversations/${id}/read`, {
      method: 'PATCH',
      headers: this.getHeaders(),
    });
    return this.handleResponse<{ success: boolean; readAt: string }>(res);
  }

  // --- Activities (Module 14) ---
  async getTodayActivities(): Promise<import('../types/activity').TodayActivitiesResponse> {
    const res = await fetch(`${API_BASE_URL}/activities/today`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<import('../types/activity').TodayActivitiesResponse>(res);
  }

  async getActivitiesStreak(): Promise<import('../types/activity').ActivityStreakResponse> {
    const res = await fetch(`${API_BASE_URL}/activities/streak`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<import('../types/activity').ActivityStreakResponse>(res);
  }

  async completeActivity(id: string): Promise<import('../types/activity').DailyActivity> {
    const res = await fetch(`${API_BASE_URL}/activities/${id}/complete`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    return this.handleResponse<import('../types/activity').DailyActivity>(res);
  }

  async uncompleteActivity(id: string): Promise<import('../types/activity').DailyActivity> {
    const res = await fetch(`${API_BASE_URL}/activities/${id}/complete`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse<import('../types/activity').DailyActivity>(res);
  }

  async swapActivity(id: string): Promise<{ activity: import('../types/activity').DailyActivity; swapsRemaining: number }> {
    const res = await fetch(`${API_BASE_URL}/activities/${id}/swap`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    return this.handleResponse<{ activity: import('../types/activity').DailyActivity; swapsRemaining: number }>(res);
  }

  // ==========================================
  // Module 15: Session Briefs Endpoints
  // ==========================================
  async previewBrief(payload: import('../types/brief').CreateBriefPreviewPayload): Promise<import('../types/brief').BriefPreviewResponse> {
    const res = await fetch(`${API_BASE_URL}/briefs/preview`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    return this.handleResponse<import('../types/brief').BriefPreviewResponse>(res);
  }

  async createBrief(payload: import('../types/brief').CreateBriefPayload): Promise<import('../types/brief').SessionBrief> {
    const res = await fetch(`${API_BASE_URL}/briefs`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    return this.handleResponse<import('../types/brief').SessionBrief>(res);
  }

  async revokeBrief(id: string): Promise<import('../types/brief').SessionBrief> {
    const res = await fetch(`${API_BASE_URL}/briefs/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse<import('../types/brief').SessionBrief>(res);
  }

  async downloadBriefPdf(id: string): Promise<void> {
    const activeToken = localStorage.getItem('mindlog_token');
    const res = await fetch(`${API_BASE_URL}/briefs/${id}/pdf`, {
      method: 'GET',
      headers: {
        ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
      },
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.message || 'Không thể tải file PDF');
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mindlog-session-brief-${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  async getAppointmentBrief(appointmentId: string): Promise<import('../types/brief').CounselorBriefResponse> {
    const res = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/brief`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<import('../types/brief').CounselorBriefResponse>(res);
  }
}

export const api = new ApiClient();




