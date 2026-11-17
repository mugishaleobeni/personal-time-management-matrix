/**
 * Chronos API Client Service
 * Connects frontend state seamlessly to the FastAPI backend.
 */

const API_BASE = import.meta.env.VITE_API_URL || (
  import.meta.env.DEV ? '/api' : 'https://personal-time-management-matrix.onrender.com/api'
);

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  timezone: string;
  timeFormat: string;
  avatar: string;
  bgImage: string;
  emailDigest: boolean;
  emailTime: string;
  reportFrequency: string;
  createdAt?: string;
}

export interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  dueDate: string;
  startTime: string;
  endTime: string;
  timeSpentSeconds: number;
  subtasks: Subtask[];
  userId?: string;
  createdAt?: string;
}

export interface Routine {
  id: string;
  period: string;
  title: string;
  time: string;
  duration: number;
  completed: boolean;
  streak: number;
  days: number[];
  userId?: string;
}

export interface Note {
  id: string;
  title: string;
  category: string;
  pinned: boolean;
  tags: string[];
  updatedAt: string;
  content: string;
  userId?: string;
}

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('chronos_token');
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('chronos_token', token);
    } else {
      localStorage.removeItem('chronos_token');
    }
  }

  public getToken(): string | null {
    return this.token || localStorage.getItem('chronos_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (!res.ok) {
      let errorMsg = `API Error ${res.status}: ${res.statusText}`;
      try {
        const errorData = await res.json();
        if (errorData.detail) errorMsg = errorData.detail;
      } catch (e) {
        // Fallback to text
      }
      throw new Error(errorMsg);
    }

    // Handle empty or attachment responses
    if (res.status === 204) {
      return {} as T;
    }

    return res.json();
  }

  // Auth & Profile
  async login(email: string, password: string): Promise<{ access_token: string; user: User }> {
    const res = await this.request<{ access_token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.access_token);
    return res;
  }

  async register(name: string, email: string, password: string): Promise<{ access_token: string; user: User }> {
    const res = await this.request<{ access_token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    this.setToken(res.access_token);
    return res;
  }

  async forgotPassword(email: string): Promise<{ status: string; message: string; code?: string }> {
    return this.request<{ status: string; message: string; code?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(email: string, code: string, new_password: string): Promise<{ status: string; message: string }> {
    return this.request<{ status: string; message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, code, new_password }),
    });
  }

  async getMe(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  async uploadAvatar(avatarData: string): Promise<{ status: string; avatar: string }> {
    return this.request<{ status: string; avatar: string }>('/auth/upload-avatar', {
      method: 'POST',
      body: JSON.stringify({ avatar: avatarData }),
    });
  }

  async updateProfile(updates: Partial<User>): Promise<User> {
    return this.request<User>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async exportBackup(): Promise<any> {
    return this.request<any>('/auth/export-backup');
  }

  async resetData(): Promise<any> {
    return this.request<any>('/auth/reset-data', { method: 'POST' });
  }

  // Tasks
  async getTasks(params?: { category?: string; priority?: string; status?: string; search?: string }): Promise<Task[]> {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'All') query.append('category', params.category);
    if (params?.priority && params.priority !== 'All') query.append('priority', params.priority);
    if (params?.status && params.status !== 'All') query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    
    const qs = query.toString();
    return this.request<Task[]>(`/tasks${qs ? `?${qs}` : ''}`);
  }

  async createTask(task: Partial<Task>): Promise<Task> {
    return this.request<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    return this.request<Task>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteTask(id: string): Promise<{ status: string }> {
    return this.request<{ status: string }>(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  async toggleTask(id: string): Promise<Task> {
    return this.request<Task>(`/tasks/${id}/toggle`, {
      method: 'POST',
    });
  }

  async accumulateTaskTime(id: string, seconds: number = 1): Promise<Task> {
    return this.request<Task>(`/tasks/${id}/time`, {
      method: 'POST',
      body: JSON.stringify({ seconds }),
    });
  }

  // Routines
  async getRoutines(period?: string): Promise<Routine[]> {
    const qs = period && period !== 'All' ? `?period=${encodeURIComponent(period)}` : '';
    return this.request<Routine[]>(`/routines${qs}`);
  }

  async createRoutine(routine: Partial<Routine>): Promise<Routine> {
    return this.request<Routine>('/routines', {
      method: 'POST',
      body: JSON.stringify(routine),
    });
  }

  async updateRoutine(id: string, updates: Partial<Routine>): Promise<Routine> {
    return this.request<Routine>(`/routines/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteRoutine(id: string): Promise<{ status: string }> {
    return this.request<{ status: string }>(`/routines/${id}`, {
      method: 'DELETE',
    });
  }

  async toggleRoutine(id: string): Promise<Routine> {
    return this.request<Routine>(`/routines/${id}/toggle`, {
      method: 'POST',
    });
  }

  // Notes
  async getNotes(params?: { category?: string; search?: string }): Promise<Note[]> {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'All') query.append('category', params.category);
    if (params?.search) query.append('search', params.search);
    
    const qs = query.toString();
    return this.request<Note[]>(`/notes${qs ? `?${qs}` : ''}`);
  }

  async getNote(id: string): Promise<Note> {
    return this.request<Note>(`/notes/${id}`);
  }

  async createNote(note: Partial<Note>): Promise<Note> {
    return this.request<Note>('/notes', {
      method: 'POST',
      body: JSON.stringify(note),
    });
  }

  async updateNote(id: string, updates: Partial<Note>): Promise<Note> {
    return this.request<Note>(`/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteNote(id: string): Promise<{ status: string }> {
    return this.request<{ status: string }>(`/notes/${id}`, {
      method: 'DELETE',
    });
  }

  // Analytics
  async getAnalyticsSummary(): Promise<any> {
    return this.request<any>('/analytics/summary');
  }

  async downloadAnalyticsPdf(): Promise<Blob> {
    const token = this.getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/analytics/export-pdf`, { headers });
    if (!res.ok) throw new Error('Failed to generate PDF');
    return res.blob();
  }

  // Notifications
  async getNotificationSettings(): Promise<any> {
    return this.request<any>('/notifications/settings');
  }

  async updateNotificationSettings(settings: any): Promise<any> {
    return this.request<any>('/notifications/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async sendDigest(): Promise<any> {
    return this.request<any>('/notifications/send-digest', {
      method: 'POST',
    });
  }

  // System
  async getSystemHealth(): Promise<any> {
    return this.request<any>('/system/health');
  }

  async getDbStatus(): Promise<any> {
    return this.request<any>('/system/db-status');
  }
}

export const api = new ApiService();
