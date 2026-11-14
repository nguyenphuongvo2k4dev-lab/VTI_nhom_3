import { create } from 'zustand';
import {
  AuditLog,
  SecurityAlert,
  SystemStats,
  TariffItem,
  StudentInfo,
  StudentBill,
  StudentTicket
} from '../core/types';
import { api } from '../core/api';

export type UserRole = 'student' | 'manager' | 'technician' | 'admin';

interface StoreState {
  // Auth & Session
  isAuthReady: boolean;
  isAuthenticated: boolean;
  currentRole: UserRole;
  currentStudentId: string | null;
  userName: string;
  userEmail: string;
  lang: 'VIE' | 'ENG';

  // Global Modals
  commandPaletteOpen: boolean;
  notificationDrawerOpen: boolean;
  toastMessage: string | null;

  // Student Modals & Floating
  aiChatOpen: boolean;
  reportFaultOpen: boolean;
  paymentOpen: boolean;
  rulesOpen: boolean;
  meterOpen: boolean;
  leaveOpen: boolean;

  // Admin Modals
  addUserOpen: boolean;
  backupOpen: boolean;
  tariffModalOpen: boolean;
  quickConfigOpen: boolean;
  ticketModalOpen: boolean;
  selectedAuditLog: AuditLog | null;
  selectedBillId: string | null;

  // Mobile navigation drawer
  mobileMenuOpen: boolean;

  // Data
  stats: SystemStats;
  auditLogs: AuditLog[];
  tariffs: TariffItem[];
  securityAlerts: SecurityAlert[];
  studentInfo: StudentInfo;
  studentBills: StudentBill[];
  studentTickets: StudentTicket[];
  studentRoomRequests: Awaited<ReturnType<typeof api.getStudentRoomRequests>>;
  managedRooms: Awaited<ReturnType<typeof api.getManagerRooms>>;
  technicians: Awaited<ReturnType<typeof api.getManagerTechnicians>>;
  managedStudents: Array<Record<string, unknown>>;
  roomRequests: Awaited<ReturnType<typeof api.getManagerRoomRequests>>;
  managedTickets: StudentTicket[];
  technicianTickets: StudentTicket[];

  // Actions
  login: (role: UserRole, account?: { studentId: string; fullName: string; email: string }) => void;
  restoreSession: () => Promise<void>;
  logout: () => void;
  setLang: (lang: 'VIE' | 'ENG') => void;
  showToast: (msg: string) => void;
  hideToast: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setNotificationDrawerOpen: (open: boolean) => void;
  setAiChatOpen: (open: boolean) => void;
  setReportFaultOpen: (open: boolean) => void;
  setPaymentOpen: (open: boolean) => void;
  setRulesOpen: (open: boolean) => void;
  setMeterOpen: (open: boolean) => void;
  setLeaveOpen: (open: boolean) => void;
  setAddUserOpen: (open: boolean) => void;
  setBackupOpen: (open: boolean) => void;
  setTariffModalOpen: (open: boolean) => void;
  setQuickConfigOpen: (open: boolean) => void;
  setTicketModalOpen: (open: boolean) => void;
  setSelectedAuditLog: (log: AuditLog | null) => void;
  setSelectedBillId: (id: string | null) => void;
  setTariffs: (tariffs: TariffItem[]) => void;

  // Async data actions
  loadAllData: () => Promise<void>;
  toggleLock: (logId: string) => Promise<void>;
  blockIp: (alertId: string, ip: string) => Promise<void>;
  payStudentBill: (billId: string, method?: string) => Promise<void>;
  updateStudentProfile: (profile: Pick<StudentInfo, 'fullName' | 'phone'> & { email: string }) => Promise<void>;
  createStudentTicket: (category: string, description: string) => Promise<void>;
  createStudentRoomRequest: (type: 'transfer' | 'renewal', detail: string) => Promise<void>;
}

export const useStore = create<StoreState>((set, get) => ({
  // Defaults
  isAuthReady: false,
  isAuthenticated: false,
  currentRole: 'student',
  currentStudentId: null,
  userName: '',
  userEmail: '',
  lang: 'VIE',

  commandPaletteOpen: false,
  notificationDrawerOpen: false,
  toastMessage: null,

  aiChatOpen: false,
  reportFaultOpen: false,
  paymentOpen: false,
  rulesOpen: false,
  meterOpen: false,
  leaveOpen: false,

  addUserOpen: false,
  backupOpen: false,
  tariffModalOpen: false,
  quickConfigOpen: false,
  ticketModalOpen: false,
  selectedAuditLog: null,
  selectedBillId: null,

  mobileMenuOpen: false,

  stats: {
    accounts: { total: 0, newThisWeek: 0, students: 0, studentsPercent: '0%', staff: 0, technicians: 0, admins: 0 },
    occupancy: { occupied: 0, totalSlots: 0, rate: '0%', totalRooms: 0, zones: 'Chưa có dữ liệu', availableRooms: 0 },
    infrastructure: { uptime: 'Chưa có dữ liệu', uptimeDays: 0, cluster: 'Chưa có dữ liệu', cpuLoad: 0, ramUsed: 'Chưa có dữ liệu', ramPercent: 0, dbQueries: 'Chưa có dữ liệu', apiLatency: 'Chưa có dữ liệu' },
    iot: {
      electricityMeters: { total: 0, online: 0, percent: '0%', disconnectedArea: 'Chưa có dữ liệu' },
      waterMeters: { total: 0, online: 0, percent: '0%', warning: 'Chưa có dữ liệu' },
      rfidGates: { total: 0, online: 0, percent: '0%', delay: 'Chưa có dữ liệu' }
    },
    cronJobs: []
  },
  auditLogs: [],
  tariffs: [],
  securityAlerts: [],

  studentInfo: {
    fullName: '',
    studentId: '',
    faculty: '',
    className: '',
    cohort: '',
    phone: '',
    room: 'Chưa có dữ liệu',
    roomNumber: '-',
    building: '-',
    zone: 'Chưa có dữ liệu',
    bedSlot: '-',
    isLeader: false,
    contract: {
      id: 'Chưa có dữ liệu',
      daysLeft: 0,
      expiryDate: '',
      renewalStartDate: ''
    },
    roommates: [],
    roomSpecs: {
      airConditioner: 'Chưa có dữ liệu',
      waterHeater: 'Chưa có dữ liệu',
      electricMeter: 'Chưa có dữ liệu',
      waterMeter: 'Chưa có dữ liệu'
    }
  },
  studentBills: [],
  studentTickets: [],
  studentRoomRequests: [],
  managedRooms: [],
  technicians: [],
  managedStudents: [],
  roomRequests: [],
  managedTickets: [],
  technicianTickets: [],

  login: (role, account) => {
    set({
      isAuthenticated: true,
      isAuthReady: true,
      currentRole: role,
      currentStudentId: role === 'student' ? account?.studentId || null : null,
      userName: account?.fullName || '',
      userEmail: account?.email || ''
    });
    get().showToast(`Đăng nhập thành công với vai trò ${role.toUpperCase()}!`);
  },

  restoreSession: async () => {
    try {
      const account = await api.getSession();
      if (!account) {
        if (!get().isAuthenticated) set({ isAuthenticated: false });
        return;
      }
      if (get().isAuthenticated) return;
      set({
        isAuthenticated: true,
        currentRole: account.role,
        currentStudentId: account.role === 'student' ? account.studentId : null,
        userName: account.fullName,
        userEmail: account.email
      });
      await get().loadAllData();
    } catch (error) {
      console.error('Session restore failed', error);
      if (!get().isAuthenticated) {
        set({ isAuthenticated: false });
        get().showToast(error instanceof Error ? error.message : 'Không thể khôi phục phiên đăng nhập.');
      }
    } finally {
      set({ isAuthReady: true });
    }
  },

  logout: () => {
    void api.logout().catch((error: unknown) => {
      console.error('Logout request failed', error);
    });
    set({
      isAuthenticated: false,
      isAuthReady: true,
      currentRole: 'student',
      currentStudentId: null,
      userName: '',
      userEmail: ''
    });
    get().showToast('Đã đăng xuất khỏi hệ thống SmartDorm.');
  },

  setLang: (lang) => {
    set({ lang });
  },

  showToast: (msg) => {
    set({ toastMessage: msg });
    setTimeout(() => {
      if (get().toastMessage === msg) {
        set({ toastMessage: null });
      }
    }, 3500);
  },

  hideToast: () => set({ toastMessage: null }),

  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setNotificationDrawerOpen: (open) => set({ notificationDrawerOpen: open }),
  setAiChatOpen: (open) => set({ aiChatOpen: open }),
  setReportFaultOpen: (open) => set({ reportFaultOpen: open }),
  setPaymentOpen: (open) => set({ paymentOpen: open }),
  setRulesOpen: (open) => set({ rulesOpen: open }),
  setMeterOpen: (open) => set({ meterOpen: open }),
  setLeaveOpen: (open) => set({ leaveOpen: open }),
  setAddUserOpen: (open) => set({ addUserOpen: open }),
  setBackupOpen: (open) => set({ backupOpen: open }),
  setTariffModalOpen: (open) => set({ tariffModalOpen: open }),
  setQuickConfigOpen: (open) => set({ quickConfigOpen: open }),
  setTicketModalOpen: (open) => set({ ticketModalOpen: open }),
  setSelectedAuditLog: (log) => set({ selectedAuditLog: log }),
  setSelectedBillId: (id) => set({ selectedBillId: id }),
  setTariffs: (tariffs) => set({ tariffs }),

  loadAllData: async () => {
    const role = get().currentRole;
    if (!get().isAuthenticated) return;
    try {
      const studentId = get().currentStudentId;
      const [s, l, t, a, sInfo, sBills, sTickets, studentRequests, rooms, technicians, students, requests, managerTickets, techTickets] = await Promise.all([
        role === 'admin' || role === 'manager' ? api.getStats() : Promise.resolve(get().stats),
        role === 'admin' ? api.getAuditLogs() : Promise.resolve({ total: 0, displayCount: 0, items: get().auditLogs }),
        role === 'admin' || role === 'manager' ? api.getTariffs() : Promise.resolve(get().tariffs),
        role === 'admin' ? api.getSecurityAlerts() : Promise.resolve(get().securityAlerts),
        role === 'student' && studentId ? api.getStudentInfo() : Promise.resolve(get().studentInfo),
        role === 'student' && studentId ? api.getStudentBills() : Promise.resolve(get().studentBills),
        role === 'student' && studentId ? api.getStudentTickets() : Promise.resolve(get().studentTickets),
        role === 'student' && studentId ? api.getStudentRoomRequests() : Promise.resolve(get().studentRoomRequests),
        role === 'admin' || role === 'manager' ? api.getManagerRooms() : Promise.resolve(get().managedRooms),
        role === 'admin' || role === 'manager' ? api.getManagerTechnicians() : Promise.resolve(get().technicians),
        role === 'admin' || role === 'manager' ? api.getManagerStudents() : Promise.resolve({ items: get().managedStudents }),
        role === 'admin' || role === 'manager' ? api.getManagerRoomRequests() : Promise.resolve(get().roomRequests),
        role === 'admin' || role === 'manager' ? api.getManagerTickets() : Promise.resolve(get().managedTickets),
        role === 'admin' || role === 'technician' ? api.getTechnicianTickets() : Promise.resolve(get().technicianTickets)
      ]);
      set({
        stats: s || get().stats,
        auditLogs: l?.items || get().auditLogs,
        tariffs: t || get().tariffs,
        securityAlerts: a || get().securityAlerts,
        studentInfo: sInfo || get().studentInfo,
        studentBills: sBills || get().studentBills,
        studentTickets: sTickets || get().studentTickets,
        studentRoomRequests: studentRequests || get().studentRoomRequests,
        managedRooms: rooms || get().managedRooms,
        technicians: technicians || get().technicians,
        managedStudents: students.items || get().managedStudents,
        roomRequests: requests || get().roomRequests,
        managedTickets: managerTickets || get().managedTickets,
        technicianTickets: techTickets || get().technicianTickets
      });
    } catch (e) {
      console.error('Zustand loadAllData error', e);
      get().showToast('Không tải được dữ liệu từ máy chủ. Vui lòng kiểm tra kết nối MongoDB.');
    }
  },

  toggleLock: async (logId: string) => {
    await api.toggleLock(logId);
    await get().loadAllData();
    get().showToast('Đã cập nhật trạng thái khóa tài khoản!');
  },

  blockIp: async (alertId: string, ip: string) => {
    await api.blockIp(alertId, ip);
    set((state) => ({
      securityAlerts: state.securityAlerts.map((a) =>
        a.id === alertId ? { ...a, status: 'resolved', actionTaken: `Đã chặn IP ${ip} trên WAF` } : a
      )
    }));
    get().showToast(`Đã chặn vĩnh viễn IP ${ip} trên tường lửa WAF!`);
  },

  payStudentBill: async (billId: string, method: string = 'VNPay') => {
    await api.payBill(billId, method);
    set((state) => ({
      studentBills: state.studentBills.map((b) =>
        b.id === billId ? { ...b, status: 'paid', statusText: 'Đã nộp' } : b
      )
    }));
    get().showToast(`Thanh toán hóa đơn thành công qua ${method}!`);
  },

  updateStudentProfile: async (profile) => {
    const updatedProfile = await api.updateStudentProfile(profile);
    set({
      studentInfo: updatedProfile,
      userName: updatedProfile.fullName,
      userEmail: updatedProfile.email || get().userEmail
    });
    get().showToast('Đã lưu thông tin hồ sơ sinh viên.');
  },

  createStudentTicket: async (category: string, description: string) => {
    const res = await api.createStudentTicket(category, description);
    if (res?.ticket) {
      set((state) => ({
        studentTickets: [res.ticket, ...state.studentTickets]
      }));
    }
    get().showToast('Đã gửi báo hỏng thiết bị tới kỹ thuật viên KTX!');
  },

  createStudentRoomRequest: async (type, detail) => {
    await api.createStudentRoomRequest(type, detail);
    await get().loadAllData();
    get().showToast('Đã gửi yêu cầu đến Ban Quản lý KTX.');
  }
}));
