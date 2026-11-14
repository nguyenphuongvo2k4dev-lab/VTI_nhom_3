import {
  AuditLog,
  SecurityAlert,
  StudentBill,
  StudentInfo,
  StudentTicket,
  SystemStats,
  TariffItem
} from '../types';

export async function parseJsonResponse<T>(response: Response): Promise<T> {
  const body = await response.text();
  if (!body.trim()) {
    throw new Error(`Máy chủ trả về phản hồi rỗng (HTTP ${response.status}).`);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    const contentType = response.headers.get('content-type') || 'không xác định';
    throw new Error(`Máy chủ trả dữ liệu không phải JSON (HTTP ${response.status}, ${contentType}).`);
  }

  if (!response.ok) {
    const error = payload && typeof payload === 'object' && 'error' in payload
      ? String(payload.error)
      : `Yêu cầu thất bại (HTTP ${response.status}).`;
    throw new Error(error);
  }
  return payload as T;
}

async function requestJson<T>(url: string, options?: RequestInit): Promise<T> {
  return parseJsonResponse<T>(await fetch(url, options));
}

export const api = {
  async login(identifier: string, password: string): Promise<{
    studentId: string;
    fullName: string;
    email: string;
    role: 'student' | 'manager' | 'technician' | 'admin';
  }> {
    return requestJson('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });
  },

  async logout(): Promise<void> {
    await requestJson('/api/auth/logout', { method: 'POST' });
  },

  async getSession(): Promise<{
    studentId: string;
    fullName: string;
    email: string;
    role: 'student' | 'manager' | 'technician' | 'admin';
  } | null> {
    const response = await fetch('/api/auth/session');
    if (response.status === 401) return null;
    return parseJsonResponse(response);
  },

  async getStats(): Promise<SystemStats> {
    return requestJson('/api/stats');
  },

  async getAuditLogs(params?: { role?: string; actionType?: string; search?: string }): Promise<{ total: number; displayCount: number; items: AuditLog[] }> {
    const query = new URLSearchParams();
    if (params?.role) query.set('role', params.role);
    if (params?.actionType) query.set('actionType', params.actionType);
    if (params?.search) query.set('search', params.search);
    return requestJson(`/api/audit-logs?${query.toString()}`);
  },

  async getUsers(): Promise<Array<{
    id: string;
    studentId?: string;
    fullName: string;
    email: string;
    role: string;
    room: string;
    zone: string;
    status: 'active' | 'suspended' | 'pending';
    lastActive: string;
  }>> {
    return requestJson('/api/users');
  },

  async setUserStatus(id: string, status: 'active' | 'suspended'): Promise<{ success: boolean }> {
    return requestJson(`/api/users/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
  },

  async getManagerRooms(): Promise<Array<{
    id: string;
    roomNumber: string;
    building: string;
    zone: string;
    capacity: number;
    occupied: number;
    roomType: string;
    status: 'available' | 'occupied' | 'maintenance';
  }>> {
    return requestJson('/api/manager/rooms');
  },

  async getManagerTechnicians(): Promise<Array<{ id: string; fullName: string; email: string }>> {
    return requestJson('/api/manager/technicians');
  },

  async getManagerStudents(): Promise<{ items: Array<Record<string, unknown>> }> {
    return requestJson('/api/manager/students');
  },

  async getManagerRoomRequests(): Promise<Array<{
    id: string;
    studentId: string;
    studentName: string;
    type: 'transfer' | 'renewal';
    detail: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
    reviewNote?: string;
  }>> {
    return requestJson('/api/manager/room-requests');
  },

  async reviewRoomRequest(id: string, status: 'approved' | 'rejected', reviewNote?: string): Promise<{ request: Record<string, unknown> }> {
    return requestJson(`/api/manager/room-requests/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reviewNote })
    });
  },

  async getManagerTickets(): Promise<StudentTicket[]> {
    return requestJson('/api/manager/tickets');
  },

  async assignManagerTicket(id: string, technicianId: string): Promise<{ ticket: StudentTicket }> {
    return requestJson(`/api/manager/tickets/${encodeURIComponent(id)}/assign`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ technicianId })
    });
  },

  async getTechnicianTickets(): Promise<StudentTicket[]> {
    return requestJson('/api/technician/tickets');
  },

  async updateTechnicianTicket(id: string, status: StudentTicket['status'], ktvNote?: string): Promise<{ ticket: StudentTicket }> {
    return requestJson(`/api/technician/tickets/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, ktvNote })
    });
  },

  async toggleLock(logId: string): Promise<{ success: boolean; log: AuditLog }> {
    return requestJson('/api/audit-logs/toggle-lock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: logId })
    });
  },

  async getTariffs(): Promise<TariffItem[]> {
    return requestJson('/api/tariffs');
  },

  async updateTariffs(tariffs: TariffItem[]): Promise<{ success: boolean; tariffs: TariffItem[] }> {
    return requestJson('/api/tariffs', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updatedTariffs: tariffs })
    });
  },

  async getSecurityAlerts(): Promise<SecurityAlert[]> {
    return requestJson('/api/security-alerts');
  },

  async blockIp(alertId: string, ip: string): Promise<{ success: boolean; message: string }> {
    return requestJson('/api/security-alerts/block-ip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alertId, ip })
    });
  },

  async triggerBackup(): Promise<{ success: boolean; backupId: string; timestamp: string; size: string; storageBucket: string; message: string }> {
    return requestJson('/api/backup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
  },

  async createUser(userData: { fullName: string; email: string; role: string; room?: string; studentId?: string }): Promise<{
    success: boolean;
    error?: string;
    user: { id: string; fullName: string; email: string; role: string; room?: string; studentId?: string };
    log: AuditLog;
    temporaryPassword: string;
  }> {
    return requestJson('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
  },

  async getStudentInfo(): Promise<StudentInfo> {
    return requestJson('/api/student/info');
  },

  async updateStudentProfile(profile: Pick<StudentInfo, 'fullName' | 'phone'> & { email: string }): Promise<StudentInfo> {
    const result = await requestJson<{ success: boolean; profile: StudentInfo }>('/api/student/info', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });
    return result.profile;
  },

  async getStudentBills(): Promise<StudentBill[]> {
    return requestJson('/api/student/bills');
  },

  async payBill(billId: string, method: string = 'VNPay'): Promise<{ success: boolean; message: string }> {
    return requestJson('/api/student/pay-bill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ billId, method })
    });
  },

  async getStudentTickets(): Promise<StudentTicket[]> {
    return requestJson('/api/student/tickets');
  },

  async getStudentRoomRequests(): Promise<Array<{
    id: string;
    studentId: string;
    studentName: string;
    type: 'transfer' | 'renewal';
    detail: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
  }>> {
    return requestJson('/api/student/room-requests');
  },

  async createStudentRoomRequest(type: 'transfer' | 'renewal', detail: string): Promise<{
    request: { id: string; status: 'pending' };
  }> {
    return requestJson('/api/student/room-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, detail })
    });
  },

  async createStudentTicket(category: string, description: string): Promise<{ success: boolean; ticket: StudentTicket }> {
    return requestJson('/api/student/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, description })
    });
  },

  async sendStudentAiChat(message: string): Promise<{ reply: string; time: string }> {
    return requestJson('/api/student/ai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
  }
};
