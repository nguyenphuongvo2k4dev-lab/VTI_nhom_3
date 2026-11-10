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
import {
  DEMO_STUDENT,
  createPendingStudentInfo,
  createApprovedStudentInfo,
  createInitialStudentBill
} from './studentDefaults';

export type UserRole = 'student' | 'manager' | 'technician' | 'admin';

export interface RegisteredUser {
  fullName: string;
  studentId: string;
  email: string;
  phone: string;
  university?: string;
  dormArea?: string;
  roomType?: string;
  password?: string;
  createdAt?: string;
}

interface StoreState {
  // Auth & Session
  isAuthenticated: boolean;
  currentRole: UserRole;
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

  // Actions
  login: (role: UserRole, identifier?: string, password?: string) => boolean;
  registerStudent: (data: RegisteredUser) => boolean;
  setStudentInfo: (info: Partial<StudentInfo>) => void;
  approveStudentRoom: () => void;
  logout: () => void;
  setRole: (role: UserRole) => void;
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
  setTariffs: (tariffs: TariffItem[]) => void;

  // Async data actions
  loadAllData: () => Promise<void>;
  toggleLock: (logId: string) => Promise<void>;
  blockIp: (alertId: string, ip: string) => Promise<void>;
  payStudentBill: (billId: string, method?: string) => Promise<void>;
  createStudentTicket: (category: string, description: string) => Promise<void>;
}

const getInitialSession = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('smartdorm_current_user');
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return null;
};

const initialSession = getInitialSession();

const createStudentInfoForUser = (user: RegisteredUser, baseInfo: StudentInfo): StudentInfo => {
  const isApproved = typeof window !== 'undefined' && localStorage.getItem(`smartdorm_user_approved_${user.studentId}`) === 'true';
  const pending = createPendingStudentInfo(user, baseInfo);
  return isApproved ? createApprovedStudentInfo(pending) : pending;
};

export const useStore = create<StoreState>((set, get) => ({
  // Defaults
  isAuthenticated: true,
  currentRole: 'student',
  userName: initialSession?.userName || 'Đặng Hoàng Nam',
  userEmail: initialSession?.userEmail || 'nam.dh@student.vnu.edu.vn',
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

  mobileMenuOpen: false,

  stats: {
    accounts: { total: 4120, newThisWeek: 142, students: 3450, studentsPercent: '83.7%', staff: 48, technicians: 22, admins: 4 },
    occupancy: { occupied: 3450, totalSlots: 3640, rate: '94.8%', totalRooms: 406, zones: 'Khu A, B, C, D', availableRooms: 21 },
    infrastructure: { uptime: '99.98%', uptimeDays: 30, cluster: 'Cụm Kubernetes ĐHQG TPHCM', cpuLoad: 18, ramUsed: '6.8 / 16G', ramPercent: 42.5, dbQueries: '420 req/s', apiLatency: '28 ms' },
    iot: {
      electricityMeters: { total: 406, online: 403, percent: '99.2%', disconnectedArea: '3 công tơ mất kết nối (Khu C)' },
      waterMeters: { total: 406, online: 401, percent: '98.8%', warning: '5 đồng hồ pin yếu (<10%)' },
      rfidGates: { total: 32, online: 32, percent: '100%', delay: '0 trễ lệch dữ liệu' }
    },
    cronJobs: [
      { name: 'Tính cước điện nước IoT (Batch)', progress: 78, note: 'Kỳ tháng 10/2024: 316 / 406 phòng hoàn tất', status: 'Đang chạy' },
      { name: 'Cổng gửi SMS / Email thông báo', progress: 99.9, note: 'Queue: 14 tin nhắn đang đợi chuyển', status: '99.9% Delivered' },
      { name: 'Bộ nhớ đệm Redis Cache', progress: 52.5, note: 'Hit rate: 94.2% - Không xảy ra nghẽn I/O', status: '2.1 GB / 4.0 GB' }
    ]
  },
  auditLogs: [],
  tariffs: [],
  securityAlerts: [],

  studentInfo: initialSession?.studentInfo || DEMO_STUDENT,
  studentBills: [],
  studentTickets: [],

  login: (role, identifier, password) => {
    if (typeof window !== 'undefined' && identifier) {
      const savedUsersStr = localStorage.getItem('smartdorm_users');
      if (savedUsersStr) {
        try {
          const users: RegisteredUser[] = JSON.parse(savedUsersStr);
          const found = users.find(u => 
            (u.studentId && u.studentId.toLowerCase() === identifier.toLowerCase().trim()) ||
            (u.email && u.email.toLowerCase() === identifier.toLowerCase().trim())
          );
          if (found) {
            if (password && found.password && found.password !== password) {
              get().showToast('Mật khẩu không chính xác. Vui lòng thử lại!');
              return false;
            }
            const updatedInfo = createStudentInfoForUser(found, get().studentInfo);
            const isApproved = updatedInfo.status === 'active';
            const userBills: StudentBill[] = isApproved ? [createInitialStudentBill(found.studentId)] : [];

            set({
              isAuthenticated: true,
              currentRole: 'student',
              userName: found.fullName,
              userEmail: found.email,
              studentInfo: updatedInfo,
              studentBills: userBills,
              studentTickets: []
            });

            localStorage.setItem('smartdorm_current_user', JSON.stringify({
              userName: found.fullName,
              userEmail: found.email,
              studentInfo: updatedInfo
            }));

            get().showToast(`Đăng nhập thành công! Chào mừng ${found.fullName}`);
            return true;
          }
        } catch (e) {
          console.error(e);
        }
      }
    }

    let name = 'Đặng Hoàng Nam';
    let email = 'nam.dh@student.vnu.edu.vn';
    if (role === 'admin') {
      name = 'TS. Trần Minh Khoa';
      email = 'root@dorm.edu.vn';
    } else if (role === 'manager') {
      name = 'Nguyễn Văn Hoàng';
      email = 'hoang.nv@dorm.edu.vn';
    } else if (role === 'technician') {
      name = 'Nguyễn Văn Hùng';
      email = 'hung.nv@tech.dorm.edu.vn';
    } else if (identifier) {
      name = identifier.includes('@') ? identifier.split('@')[0] : identifier;
    }

    set({
      isAuthenticated: true,
      currentRole: role,
      userName: name,
      userEmail: email
    });
    get().showToast(`Đăng nhập thành công với vai trò ${role.toUpperCase()}!`);
    return true;
  },

  registerStudent: (data) => {
    try {
      if (typeof window !== 'undefined') {
        const savedUsersStr = localStorage.getItem('smartdorm_users');
        let users: RegisteredUser[] = [];
        if (savedUsersStr) {
          try {
            users = JSON.parse(savedUsersStr);
          } catch {
            users = [];
          }
        }
        users = users.filter(u => u.studentId !== data.studentId && u.email !== data.email);
        users.unshift(data);
        localStorage.setItem('smartdorm_users', JSON.stringify(users));
      }

      const updatedInfo = createStudentInfoForUser(data, get().studentInfo);

      set({
        isAuthenticated: true,
        currentRole: 'student',
        userName: data.fullName,
        userEmail: data.email,
        studentInfo: updatedInfo,
        studentBills: [],
        studentTickets: []
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem('smartdorm_current_user', JSON.stringify({
          userName: data.fullName,
          userEmail: data.email,
          studentInfo: updatedInfo
        }));
        localStorage.setItem('smartdorm_last_registered', JSON.stringify({
          identifier: data.studentId,
          password: data.password
        }));
      }

      get().showToast(`Đăng ký tài khoản thành công! Chào mừng ${data.fullName}`);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  setStudentInfo: (info) => {
    const updated = { ...get().studentInfo, ...info };
    set({ studentInfo: updated });
    if (typeof window !== 'undefined') {
      localStorage.setItem('smartdorm_current_user', JSON.stringify({
        userName: get().userName,
        userEmail: get().userEmail,
        studentInfo: updated
      }));
    }
  },

  approveStudentRoom: async () => {
    const cur = get().studentInfo;
    const approvedInfo = createApprovedStudentInfo(cur);
    const initialBills = [createInitialStudentBill(cur.studentId)];

    set({
      studentInfo: approvedInfo,
      studentBills: initialBills
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem(`smartdorm_user_approved_${cur.studentId}`, 'true');
      localStorage.setItem('smartdorm_current_user', JSON.stringify({
        userName: get().userName,
        userEmail: get().userEmail,
        studentInfo: approvedInfo
      }));
    }

    try {
      await api.approveStudentRoom();
    } catch {
      // offline fallback
    }

    get().showToast(`🎉 Ban Quản lý đã duyệt hồ sơ! Đã xếp bạn vào Phòng ${approvedInfo.roomNumber} - Nhà ${approvedInfo.building}`);
  },

  logout: () => {
    set({ isAuthenticated: false });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('smartdorm_current_user');
    }
    get().showToast('Đã đăng xuất khỏi hệ thống SmartDorm.');
  },

  setRole: (role) => {
    set({ currentRole: role });
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
  setTariffs: (tariffs) => set({ tariffs }),

  loadAllData: async () => {
    try {
      const [s, l, t, a, sInfo, sBills, sTickets] = await Promise.all([
        api.getStats(),
        api.getAuditLogs(),
        api.getTariffs(),
        api.getSecurityAlerts(),
        api.getStudentInfo(),
        api.getStudentBills(),
        api.getStudentTickets()
      ]);

      let savedStudentInfo = null;
      let savedUserName = null;
      let savedUserEmail = null;
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('smartdorm_current_user');
          if (raw) {
            const parsed = JSON.parse(raw);
            savedStudentInfo = parsed.studentInfo;
            savedUserName = parsed.userName;
            savedUserEmail = parsed.userEmail;
          }
        } catch {}
      }

      const activeInfo = savedStudentInfo || sInfo || get().studentInfo;
      const isPending = activeInfo?.status === 'pending' || !activeInfo?.roomNumber;

      set({
        stats: s || get().stats,
        auditLogs: l?.items || get().auditLogs,
        tariffs: t || get().tariffs,
        securityAlerts: a || get().securityAlerts,
        studentInfo: activeInfo,
        studentBills: isPending ? [] : (sBills || get().studentBills),
        studentTickets: isPending ? [] : (sTickets || get().studentTickets),
        userName: savedUserName || get().userName,
        userEmail: savedUserEmail || get().userEmail
      });
    } catch (e) {
      console.warn('Zustand loadAllData error', e);
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

  createStudentTicket: async (category: string, description: string) => {
    const res = await api.createStudentTicket(category, description);
    if (res?.ticket) {
      set((state) => ({
        studentTickets: [res.ticket, ...state.studentTickets]
      }));
    }
    get().showToast('Đã gửi báo hỏng thiết bị tới kỹ thuật viên KTX!');
  }
}));
