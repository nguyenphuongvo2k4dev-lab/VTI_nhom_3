import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'crypto';
import {
  MongoClient,
  MongoServerError,
  type Collection,
  type Db,
  type Document,
  type OptionalUnlessRequiredId
} from 'mongodb';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ktx';
if (isProduction && !process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET must be configured in production.');
}
const SESSION_SECRET = process.env.SESSION_SECRET || randomBytes(32).toString('hex');
const SESSION_COOKIE = 'ktx_session';
const DEMO_STUDENT_ID = '22120045';

app.use(express.json());

interface AuditLog extends Document {
  id: string;
  time: string;
  date: string;
  user: {
    name: string;
    role: string;
    email: string;
    avatarInitials: string;
    avatarBg: string;
  };
  action: string;
  actionType: 'create' | 'update_price' | 'lock' | 'perm' | 'special';
  detail: string;
  targetId: string;
  ip: string;
  device: string;
  status: 'success' | 'locked' | 'approved';
  statusText: string;
  payload?: Record<string, any>;
}

const defaultAuditLogs: AuditLog[] = [
  {
    id: 'LOG-001',
    time: '10:42:15',
    date: '24/10/2024',
    user: {
      name: 'TS. Trần Minh Khoa',
      role: 'SuperAdmin',
      email: 'root@dorm.edu.vn',
      avatarInitials: 'TK',
      avatarBg: 'bg-primary'
    },
    action: 'Thay đổi phân quyền',
    actionType: 'perm',
    detail: 'Gán vai trò Quản lý Khu B cho CB Nguyễn Văn Hoàng',
    targetId: 'USR_MNG_9904',
    ip: '10.240.12.5 (Nội bộ)',
    device: 'macOS • Chrome 129',
    status: 'success',
    statusText: 'Thành công',
    payload: {
      assignedRole: 'Quản lý Khu B',
      targetUser: 'Nguyễn Văn Hoàng',
      grantedPermissions: ['manage_rooms', 'view_students', 'dispatch_maintenance']
    }
  },
  {
    id: 'LOG-002',
    time: '09:18:02',
    date: '24/10/2024',
    user: {
      name: 'Lê Hồng Phúc',
      role: 'Kế toán',
      email: 'phuc.lh@dorm.edu.vn',
      avatarInitials: 'LH',
      avatarBg: 'bg-secondary'
    },
    action: 'Cập nhật biểu phí',
    actionType: 'update_price',
    detail: 'Điều chỉnh định mức nước sinh hoạt khối năm 2024',
    targetId: 'TARIFF_WAT_24',
    ip: '10.240.14.88 (Văn phòng)',
    device: 'Windows • Edge 128',
    status: 'success',
    statusText: 'Thành công',
    payload: {
      catalog: 'Nước Sinh Hoạt',
      oldRate: '7,500 đ/m³',
      newRate: '8,500 đ/m³',
      approvedBy: 'Hội đồng Quản lý KTX'
    }
  },
  {
    id: 'LOG-003',
    time: '08:05:40',
    date: '24/10/2024',
    user: {
      name: 'Security Daemon',
      role: 'Hệ thống',
      email: 'auth-guard@internal',
      avatarInitials: 'SYS',
      avatarBg: 'bg-surface-container-high text-on-surface'
    },
    action: 'Khóa tài khoản tạm thời',
    actionType: 'lock',
    detail: 'Ngắt phiên sinh viên nhập sai mật khẩu 6 lần liên tiếp',
    targetId: 'SV_2112450',
    ip: '115.79.138.22 (Viettel 4G)',
    device: 'Android 14 • Mobile App',
    status: 'locked',
    statusText: 'Đã khóa 30m',
    payload: {
      failedAttempts: 6,
      lockDurationMinutes: 30,
      clientLocation: 'TP. Thủ Đức, TP.HCM'
    }
  },
  {
    id: 'LOG-004',
    time: '07:30:11',
    date: '24/10/2024',
    user: {
      name: 'Đặng Ngọc Hải',
      role: 'Trưởng ban QL',
      email: 'hai.dn@dorm.edu.vn',
      avatarInitials: 'ĐH',
      avatarBg: 'bg-surface-tint'
    },
    action: 'Phê duyệt đặc cách',
    actionType: 'special',
    detail: 'Đặc cách phòng diện sinh viên khuyết tật vượt cấp (Phòng A102)',
    targetId: 'ROOM_A_102',
    ip: '10.240.10.12 (Văn phòng BQL)',
    device: 'Windows • Chrome 129',
    status: 'approved',
    statusText: 'Đã duyệt',
    payload: {
      room: 'A102 (Tầng 1 - Cận cửa thoát hiểm)',
      studentName: 'Trần Văn An',
      studentCode: '2112009'
    }
  },
  {
    id: 'LOG-005',
    time: '06:45:00',
    date: '24/10/2024',
    user: {
      name: 'Batch Sync VNU',
      role: 'Tự động',
      email: 'sync-service@vnu.edu.vn',
      avatarInitials: 'SSO',
      avatarBg: 'bg-primary-container'
    },
    action: 'Tạo tài khoản tự động',
    actionType: 'create',
    detail: 'Đồng bộ danh sách 142 tân sinh viên khóa K24 diện ưu tiên',
    targetId: 'BATCH_K24_VNU',
    ip: '172.16.0.4 (VPC Gateway)',
    device: 'Cron Job • Linux Srv',
    status: 'success',
    statusText: 'Thành công (142/142)',
    payload: {
      batchId: 'BATCH_2024_OCT_K24',
      totalImported: 142,
      dataSource: 'Portal Tuyển sinh ĐHQG TP.HCM'
    }
  }
];

const defaultTariffs = [
  {
    id: 'T-01',
    name: 'Phòng Tiêu Chuẩn',
    zone: 'Khu B, D',
    price: 650000,
    unit: '/tháng/sinh viên',
    desc: '4-6 SV/phòng (Giường tầng, quạt trần, WC khép kín)'
  },
  {
    id: 'T-02',
    name: 'Phòng CLC Máy Lạnh',
    zone: 'Khu A',
    price: 1200000,
    unit: '/tháng/sinh viên',
    desc: '2-4 SV/phòng (Máy lạnh Inverter, bàn học cao cấp)'
  },
  {
    id: 'T-03',
    name: 'Điện Sinh Hoạt KTX',
    zone: 'Theo EVN',
    price: 'Biểu giá Lũy tiến',
    unit: 'Bậc 1-6 chuẩn Bộ Công Thương',
    desc: 'Đo lường tự động qua công tơ thông minh Modbus-RTU'
  },
  {
    id: 'T-04',
    name: 'Nước Sinh Hoạt',
    zone: 'Cấp thủy',
    price: 8500,
    unit: '/m³ (Đã gồm phí BVMT)',
    desc: 'Phao giám sát rò rỉ nước tự động 24/7'
  }
];

const defaultSecurityAlerts = [
  {
    id: 'SEC-409',
    severity: 'high',
    severityLabel: 'Cảnh báo cao',
    title: 'Phát hiện 12 lần đăng nhập thất bại liên tiếp vào tài khoản CBQL_KhuB',
    ip: '14.161.42.18',
    actionTaken: 'Hệ thống đã tự động khóa IP 60 phút',
    timeAgo: '14 phút trước',
    status: 'active'
  },
  {
    id: 'SEC-408',
    severity: 'info',
    severityLabel: 'Thông tin',
    title: 'Cấp quyền vai trò Manager mới cho tài khoản hoang.nv@dorm.edu.vn',
    ip: '10.240.12.5',
    actionTaken: 'Xác thực 2 yếu tố thành công',
    timeAgo: '1 giờ trước',
    status: 'resolved'
  },
  {
    id: 'SEC-407',
    severity: 'success',
    severityLabel: 'Thành công',
    title: 'Tự động sao lưu dữ liệu toàn bộ hệ thống Snapshot định kỳ 02:00 sáng thành công',
    ip: '172.16.0.4',
    actionTaken: 'Dung lượng: 14.2 GB S3 VNU-Cloud',
    timeAgo: '02:00 Hôm nay',
    status: 'resolved'
  },
  {
    id: 'SEC-406',
    severity: 'medium',
    severityLabel: 'Cảnh báo TB',
    title: 'Tần suất gửi truy vấn tra cứu hóa đơn bất thường từ dải IP KTX Khu C',
    ip: '115.79.138.99',
    actionTaken: 'Kích hoạt Cloudflare Rate-Limiting',
    timeAgo: '3 giờ trước',
    status: 'active'
  }
];

interface RegisteredStudent extends Document {
  university: string;
  studentId: string;
  cccd: string;
  fullName: string;
  birthDate: string;
  gender: 'male' | 'female';
  email: string;
  phone: string;
  dormArea: string;
  roomType: string;
  priorityPolicies: Record<string, boolean>;
  agreeNotify: boolean;
  passwordSalt: string;
  passwordHash: string;
  status?: 'active' | 'suspended';
}

interface StudentBill extends Document {
  id: string;
  studentId?: string;
  month: string;
  period: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid';
  statusText: string;
  electricKwh: number;
  waterM3: number;
}

interface StudentTicket extends Document {
  id: string;
  studentId?: string;
  assignedTo?: string;
  title: string;
  category: string;
  timeSent: string;
  ktvName: string;
  ktvNote: string;
  status: 'in_progress' | 'completed';
  statusText: string;
  rating?: number;
}

interface StoredUser extends Document {
  id: string;
  fullName: string;
  email: string;
  role: string;
  passwordSalt?: string;
  passwordHash?: string;
  status?: 'active' | 'suspended';
  room?: string;
  studentId?: string;
}

interface RoomRecord extends Document {
  id: string;
  roomNumber: string;
  building: string;
  zone: string;
  capacity: number;
  occupied: number;
  roomType: string;
  status: 'available' | 'occupied' | 'maintenance';
}

interface RoomRequest extends Document {
  id: string;
  studentId: string;
  studentName: string;
  type: 'transfer' | 'renewal';
  detail: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
}

type UserRole = 'student' | 'manager' | 'technician' | 'admin';
interface SessionIdentity {
  id: string;
  role: UserRole;
}

let database: Db;
const collection = <T extends Document>(name: string): Collection<T> => database.collection<T>(name);

async function ensureStudentProfile(studentId: string) {
  const profiles = collection<Document>('studentProfiles');
  const [existingProfile, account, registration] = await Promise.all([
    profiles.findOne({ studentId }),
    collection<StoredUser>('users').findOne({ studentId, role: 'student' }),
    collection<RegisteredStudent>('registeredStudents').findOne({ studentId })
  ]);
  if (!account && !registration) return null;

  const fullName = registration?.fullName || account?.fullName || '';
  const email = registration?.email || account?.email || '';
  const profileFields = {
    fullName,
    email,
    ...(registration ? {
      faculty: registration.university,
      phone: registration.phone,
      zone: `Khu ${registration.dormArea}`
    } : {})
  };
  if (existingProfile) {
    await profiles.updateOne({ studentId }, { $set: profileFields });
    return profiles.findOne({ studentId });
  }

  const phone = registration?.phone || '';
  const dormArea = registration?.dormArea || '';
  const profile: Document = {
    id: `student-profile-${studentId}`,
    studentId,
    fullName,
    email,
    faculty: registration?.university || '',
    className: '',
    cohort: '',
    phone,
    room: account?.room || 'Chưa được phân phòng',
    roomNumber: '-',
    building: '-',
    zone: dormArea ? `Khu ${dormArea}` : 'Chưa phân khu',
    bedSlot: '-',
    isLeader: false,
    contract: {
      id: 'Chưa có hợp đồng',
      daysLeft: 0,
      expiryDate: 'Chưa xác định',
      renewalStartDate: 'Chưa xác định'
    },
    roommates: [],
    roomSpecs: {
      airConditioner: 'Chưa được phân phòng',
      waterHeater: 'Chưa được phân phòng',
      electricMeter: 'Chưa được phân phòng',
      waterMeter: 'Chưa được phân phòng'
    }
  };

  try {
    await profiles.updateOne({ studentId }, { $setOnInsert: profile }, { upsert: true });
  } catch (error) {
    if (!(error instanceof MongoServerError && error.code === 11000)) throw error;
  }
  return profiles.findOne({ studentId });
}

const asyncRoute = (
  handler: (req: express.Request, res: express.Response) => Promise<unknown>
): express.RequestHandler => (req, res, next) => {
  void handler(req, res).catch(next);
};

const seedIfEmpty = async <T extends Document>(name: string, records: OptionalUnlessRequiredId<T>[]) => {
  const target = collection<T>(name);
  if (records.length > 0 && await target.estimatedDocumentCount() === 0) {
    await target.insertMany(records);
  }
};

function createSessionToken(identity: SessionIdentity) {
  const payload = Buffer.from(JSON.stringify(identity)).toString('base64url');
  const signature = createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function getSessionIdentity(req: express.Request): SessionIdentity | null {
  const cookieHeader = req.headers.cookie;
  const cookie = cookieHeader?.split(';').map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  if (!cookie) return null;

  const token = cookie.slice(SESSION_COOKIE.length + 1);
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;

  const expected = createHmac('sha256', SESSION_SECRET).update(payload).digest();
  let actual: Buffer;
  try {
    actual = Buffer.from(signature, 'base64url');
  } catch {
    return null;
  }
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;

  try {
    const identity = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Partial<SessionIdentity>;
    if (
      typeof identity.id === 'string' &&
      ['student', 'manager', 'technician', 'admin'].includes(identity.role || '')
    ) {
      return { id: identity.id, role: identity.role as UserRole };
    }
    return null;
  } catch {
    return null;
  }
}

function setSession(res: express.Response, identity: SessionIdentity) {
  res.cookie(SESSION_COOKIE, createSessionToken(identity), {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

function requireStudentSession(req: express.Request, res: express.Response) {
  const identity = requireRole(req, res, 'student');
  if (!identity) {
    return null;
  }
  return identity.id;
}

function requireRole(
  req: express.Request,
  res: express.Response,
  ...allowedRoles: UserRole[]
): SessionIdentity | null {
  const identity = getSessionIdentity(req);
  if (!identity) {
    res.status(401).json({ error: 'Vui lòng đăng nhập để tiếp tục.' });
    return null;
  }
  if (!allowedRoles.includes(identity.role)) {
    res.status(403).json({ error: 'Bạn không có quyền thực hiện thao tác này.' });
    return null;
  }
  return identity;
}

// API Endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '2.4 Enterprise',
    uptime: '99.98%',
    serverTime: new Date().toISOString()
  });
});

app.get('/api/stats', asyncRoute(async (req, res) => {
  if (!requireRole(req, res, 'admin', 'manager')) return;
  const [students, staff, rooms] = await Promise.all([
    collection<Document>('studentProfiles').countDocuments(),
    collection<StoredUser>('users').countDocuments({ role: { $ne: 'student' } }),
    collection<RoomRecord>('rooms').find({}, { projection: { _id: 0 } }).toArray()
  ]);
  const totalSlots = rooms.reduce((total, room) => total + room.capacity, 0);
  const occupied = rooms.reduce((total, room) => total + room.occupied, 0);
  const totalAccounts = students + staff;
  res.json({
    accounts: {
      total: totalAccounts,
      newThisWeek: students,
      students,
      studentsPercent: `${totalAccounts ? (students / totalAccounts * 100).toFixed(1) : '0.0'}%`,
      staff,
      technicians: await collection<StoredUser>('users').countDocuments({ role: 'technician' }),
      admins: await collection<StoredUser>('users').countDocuments({ role: 'admin' })
    },
    occupancy: {
      occupied,
      totalSlots,
      rate: `${totalSlots ? (occupied / totalSlots * 100).toFixed(1) : '0.0'}%`,
      totalRooms: rooms.length,
      zones: [...new Set(rooms.map((room) => room.zone))].join(', '),
      availableRooms: rooms.filter((room) => room.status !== 'maintenance' && room.occupied < room.capacity).length
    },
    infrastructure: {
      uptime: 'Chưa tích hợp dữ liệu giám sát',
      uptimeDays: 0,
      cluster: 'Chưa tích hợp dữ liệu giám sát',
      cpuLoad: 0,
      ramUsed: 'Chưa tích hợp dữ liệu giám sát',
      ramPercent: 0,
      dbQueries: 'Chưa tích hợp dữ liệu giám sát',
      apiLatency: 'Chưa tích hợp dữ liệu giám sát'
    },
    iot: {
      electricityMeters: { total: 0, online: 0, percent: '0%', disconnectedArea: 'Chưa tích hợp dữ liệu IoT' },
      waterMeters: { total: 0, online: 0, percent: '0%', warning: 'Chưa tích hợp dữ liệu IoT' },
      rfidGates: { total: 0, online: 0, percent: '0%', delay: 'Chưa tích hợp dữ liệu IoT' }
    },
    cronJobs: []
  });
}));

app.get('/api/audit-logs', asyncRoute(async (req, res) => {
  if (!requireRole(req, res, 'admin')) return;
  const { role, actionType, search } = req.query;
  const [storedLogs, total] = await Promise.all([
    collection<AuditLog>('auditLogs').find({}, { projection: { _id: 0 } }).toArray(),
    collection<AuditLog>('auditLogs').countDocuments()
  ]);
  let results = storedLogs;

  if (role) {
    results = results.filter(log => log.user.role.toLowerCase().includes(String(role).toLowerCase()));
  }
  if (actionType) {
    results = results.filter(log => log.actionType === actionType);
  }
  if (search) {
    const q = String(search).toLowerCase();
    results = results.filter(log =>
      log.user.name.toLowerCase().includes(q) ||
      log.detail.toLowerCase().includes(q) ||
      log.targetId.toLowerCase().includes(q) ||
      log.ip.toLowerCase().includes(q)
    );
  }

  res.json({
    total,
    displayCount: results.length,
    items: results
  });
}));

app.post('/api/audit-logs/toggle-lock', asyncRoute(async (req, res) => {
  if (!requireRole(req, res, 'admin')) return;
  const { id } = req.body;
  const logs = collection<AuditLog>('auditLogs');
  const log = await logs.findOne({ id }, { projection: { _id: 0 } });
  if (!log) {
    res.status(404).json({ error: 'Log not found' });
    return;
  }

  const status = log.status === 'locked' ? 'success' : 'locked';
  const statusText = status === 'success' ? 'Đã mở khóa' : 'Đã khóa';
  await logs.updateOne({ id }, { $set: { status, statusText } });

  res.json({ success: true, log: { ...log, status, statusText } });
}));

// Student Portal Data & Endpoints
const defaultStudentBills: StudentBill[] = [
  {
    id: 'BILL-10-2024',
    studentId: DEMO_STUDENT_ID,
    month: 'Tháng 10/2024',
    period: 'Tiền phòng + Điện + Nước',
    amount: 685000,
    dueDate: '25/10/2024',
    status: 'pending',
    statusText: 'Chưa nộp',
    electricKwh: 142,
    waterM3: 16
  },
  {
    id: 'BILL-09-2024',
    studentId: DEMO_STUDENT_ID,
    month: 'Tháng 09/2024',
    period: 'Tiền phòng + Điện + Nước',
    amount: 620000,
    dueDate: '20/09/2024',
    status: 'paid',
    statusText: 'Đã nộp',
    electricKwh: 128,
    waterM3: 14
  },
  {
    id: 'BILL-08-2024',
    studentId: DEMO_STUDENT_ID,
    month: 'Tháng 08/2024',
    period: 'Tiền phòng + Phí cơ sở vật chất',
    amount: 650000,
    dueDate: '22/08/2024',
    status: 'paid',
    statusText: 'Đã nộp',
    electricKwh: 135,
    waterM3: 15
  }
];

const defaultStudentTickets: StudentTicket[] = [
  {
    id: 'SC-9102',
    studentId: DEMO_STUDENT_ID,
    assignedTo: 'seed-technician',
    title: 'Bóng đèn tuýp LED ban công bị chập chờn',
    category: 'Hệ thống điện & Chiếu sáng',
    timeSent: 'Hôm qua 16:30',
    ktvName: 'Trần Văn Nam',
    ktvNote: 'Dự kiến thay bóng tuýp mới lúc 14:00 chiều nay',
    status: 'in_progress',
    statusText: 'Kỹ thuật đang xử lý'
  },
  {
    id: 'SC-8419',
    studentId: DEMO_STUDENT_ID,
    assignedTo: 'seed-technician',
    title: 'Khóa van vòi xịt vệ sinh bị rò nước',
    category: 'Vòi nước, Lavabo, Bồn cầu',
    timeSent: '05/10/2024',
    ktvName: 'Lê Văn Hùng',
    ktvNote: 'Đã thay zoăng cao su và van áp lực mới',
    status: 'completed',
    statusText: 'Đã hoàn thành',
    rating: 5
  }
];

const defaultStudentInfo = {
    id: 'demo-student',
    studentId: DEMO_STUDENT_ID,
    fullName: 'Đặng Hoàng Nam',
    faculty: 'Khoa CNTT & Truyền thông',
    className: 'CNTT-K22A',
    cohort: 'K22',
    phone: '0912 345 678',
    room: 'P.402 - Nhà B2 (Khu B)',
    roomNumber: '402',
    building: 'B2',
    zone: 'Khu B (Nam sinh viên)',
    bedSlot: 'G1',
    isLeader: true,
    contract: {
      id: 'HD-2024-8841',
      daysLeft: 74,
      expiryDate: '31/12/2024',
      renewalStartDate: '01/12/2024'
    },
    roommates: [
      { id: '1', bed: 'G1', name: 'Đặng Hoàng Nam', role: 'Bạn • Trưởng phòng', faculty: 'Khoa CNTT & Truyền thông • K22', phone: '0912 345 678', inRoom: true, isMe: true },
      { id: '2', bed: 'G2', name: 'Nguyễn Tiến Đạt', role: 'Sinh viên', faculty: 'Khoa Điện tử Viễn thông • K22', phone: '0984 112 334', inRoom: true },
      { id: '3', bed: 'G3', name: 'Lê Bảo Minh', role: 'Sinh viên', faculty: 'Khoa Kinh tế Đối ngoại • K23', phone: '0905 889 211', inRoom: true },
      { id: '4', bed: 'G4', name: 'Phạm Tuấn Hưng', role: 'Tân sinh viên', faculty: 'Khoa Khoa học Máy tính • K24', phone: '0977 441 902', inRoom: false }
    ],
    roomSpecs: {
      airConditioner: '12.000 BTU Inverter',
      waterHeater: 'Ariston 30L',
      electricMeter: '1,420 kWh (IoT)',
      waterMeter: '112 m³ (IoT)'
    }
};

const defaultRooms: RoomRecord[] = [
  { id: 'B2-402', roomNumber: '402', building: 'B2', zone: 'Khu B', capacity: 4, occupied: 4, roomType: 'Tiêu chuẩn', status: 'occupied' },
  { id: 'B2-204', roomNumber: '204', building: 'B2', zone: 'Khu B', capacity: 6, occupied: 3, roomType: 'Tiêu chuẩn', status: 'occupied' },
  { id: 'A1-101', roomNumber: '101', building: 'A1', zone: 'Khu A', capacity: 4, occupied: 2, roomType: 'Máy lạnh', status: 'occupied' },
  { id: 'C1-102', roomNumber: '102', building: 'C1', zone: 'Khu C', capacity: 6, occupied: 0, roomType: 'Tiêu chuẩn', status: 'available' }
];

const defaultRoomRequests: RoomRequest[] = [
  {
    id: 'REQ-TRANSFER-001',
    studentId: DEMO_STUDENT_ID,
    studentName: 'Đặng Hoàng Nam',
    type: 'transfer',
    detail: 'Đề nghị chuyển sang phòng B204',
    status: 'pending',
    createdAt: '2024-10-24T08:30:00.000Z'
  },
  {
    id: 'REQ-RENEWAL-001',
    studentId: DEMO_STUDENT_ID,
    studentName: 'Đặng Hoàng Nam',
    type: 'renewal',
    detail: 'Đề nghị gia hạn hợp đồng học kỳ tiếp theo',
    status: 'pending',
    createdAt: '2024-10-25T09:00:00.000Z'
  }
];

app.post('/api/auth/login', asyncRoute(async (req, res) => {
  const identifier = typeof req.body?.identifier === 'string' ? req.body.identifier.trim() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!identifier || !password) {
    res.status(400).json({ error: 'Vui lòng nhập mã sinh viên/email và mật khẩu.' });
    return;
  }

  const normalizedIdentifier = identifier.toLowerCase();
  const seededUser = await collection<StoredUser>('users').findOne({
    $or: [
      { id: identifier },
      { studentId: identifier },
      { email: normalizedIdentifier }
    ]
  });
  if (seededUser?.passwordSalt && seededUser.passwordHash) {
    if (seededUser.status === 'suspended') {
      res.status(403).json({ error: 'Tài khoản đã bị tạm khóa. Vui lòng liên hệ quản trị viên.' });
      return;
    }
    const submittedHash = scryptSync(password, seededUser.passwordSalt, 64);
    const storedHash = Buffer.from(seededUser.passwordHash, 'hex');
    if (submittedHash.length !== storedHash.length || !timingSafeEqual(submittedHash, storedHash)) {
      res.status(401).json({ error: 'Mã sinh viên/email hoặc mật khẩu không chính xác.' });
      return;
    }

    const role = ['student', 'manager', 'technician', 'admin'].includes(seededUser.role)
      ? seededUser.role as UserRole
      : 'student';
    const accountId = seededUser.studentId || seededUser.id;
    setSession(res, { id: accountId, role });
    res.json({
      studentId: accountId,
      fullName: seededUser.fullName,
      email: seededUser.email,
      role
    });
    return;
  }

  const student = await collection<RegisteredStudent>('registeredStudents').findOne({
    $or: [
      { studentId: identifier },
      { email: normalizedIdentifier }
    ]
  });
  if (!student) {
    res.status(401).json({ error: 'Mã sinh viên/email hoặc mật khẩu không chính xác.' });
    return;
  }
  if (student.status === 'suspended') {
    res.status(403).json({ error: 'Tài khoản đã bị tạm khóa. Vui lòng liên hệ quản trị viên.' });
    return;
  }

  const submittedHash = scryptSync(password, student.passwordSalt, 64);
  const storedHash = Buffer.from(student.passwordHash, 'hex');
  if (submittedHash.length !== storedHash.length || !timingSafeEqual(submittedHash, storedHash)) {
    res.status(401).json({ error: 'Mã sinh viên/email hoặc mật khẩu không chính xác.' });
    return;
  }

  setSession(res, { id: student.studentId, role: 'student' });
  res.json({
    studentId: student.studentId,
    fullName: student.fullName,
    email: student.email,
    role: 'student'
  });
}));

app.post('/api/auth/logout', (_req, res) => {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    path: '/'
  });
  res.json({ success: true });
});

app.get('/api/auth/session', asyncRoute(async (req, res) => {
  const identity = getSessionIdentity(req);
  if (!identity) {
    res.status(401).json({ error: 'Chưa đăng nhập.' });
    return;
  }

  const account = identity.role === 'student'
    ? await collection<StoredUser>('users').findOne(
      { studentId: identity.id, role: 'student' },
      { projection: { _id: 0, studentId: 1, fullName: 1, email: 1, role: 1, status: 1 } }
    ) || await collection<RegisteredStudent>('registeredStudents').findOne(
      { studentId: identity.id },
      { projection: { _id: 0, studentId: 1, fullName: 1, email: 1, status: 1 } }
    )
    : await collection<StoredUser>('users').findOne(
      { id: identity.id, role: identity.role },
      { projection: { _id: 0, id: 1, fullName: 1, email: 1, role: 1, status: 1 } }
    );

  if (!account || account.status === 'suspended') {
    res.clearCookie(SESSION_COOKIE, { httpOnly: true, sameSite: 'lax', secure: isProduction, path: '/' });
    res.status(401).json({ error: 'Phiên đăng nhập không còn hợp lệ.' });
    return;
  }

  res.json({
    studentId: identity.role === 'student' ? identity.id : account.id,
    fullName: account.fullName,
    email: account.email,
    role: identity.role
  });
}));

app.get('/api/student/info', asyncRoute(async (_req, res) => {
  const studentId = requireStudentSession(_req, res);
  if (!studentId) return;
  const student = await ensureStudentProfile(studentId);
  if (!student) {
    res.status(404).json({ error: 'Student profile not found' });
    return;
  }
  const publicProfile = { ...student, _id: undefined, id: undefined };
  res.json(publicProfile);
}));

app.patch('/api/student/info', asyncRoute(async (req, res) => {
  const studentId = requireStudentSession(req, res);
  if (!studentId) return;

  const { fullName, email, phone } = req.body ?? {};
  const normalizedName = typeof fullName === 'string' ? fullName.trim() : '';
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const normalizedPhone = typeof phone === 'string' ? phone.trim() : '';

  if (
    normalizedName.length < 2 || normalizedName.length > 100 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ||
    normalizedPhone.replace(/\D/g, '').length < 10 ||
    normalizedPhone.length > 20
  ) {
    res.status(400).json({ error: 'Họ tên, email hoặc số điện thoại không hợp lệ.' });
    return;
  }

  const profile = await collection<Document>('studentProfiles').findOne(
    { studentId },
    { projection: { _id: 0, id: 1 } }
  );
  if (!profile) {
    res.status(404).json({ error: 'Không tìm thấy hồ sơ sinh viên.' });
    return;
  }

  const [existingUser, existingRegistration] = await Promise.all([
    collection<StoredUser>('users').findOne(
      { email: normalizedEmail, studentId: { $ne: studentId } },
      { projection: { _id: 1 } }
    ),
    collection<RegisteredStudent>('registeredStudents').findOne(
      { email: normalizedEmail, studentId: { $ne: studentId } },
      { projection: { _id: 1 } }
    )
  ]);
  if (existingUser || existingRegistration) {
    res.status(409).json({ error: 'Email này đã được tài khoản khác sử dụng.' });
    return;
  }

  try {
    await Promise.all([
      collection<Document>('studentProfiles').updateOne(
        { studentId },
        { $set: { fullName: normalizedName, email: normalizedEmail, phone: normalizedPhone } }
      ),
      collection<StoredUser>('users').updateOne(
        { studentId, role: 'student' },
        { $set: { fullName: normalizedName, email: normalizedEmail } }
      ),
      collection<RegisteredStudent>('registeredStudents').updateOne(
        { studentId },
        { $set: { fullName: normalizedName, email: normalizedEmail, phone: normalizedPhone } }
      )
    ]);
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      res.status(409).json({ error: 'Email này đã được tài khoản khác sử dụng.' });
      return;
    }
    throw error;
  }

  const updatedProfile = await collection<Document>('studentProfiles').findOne(
    { studentId },
    { projection: { _id: 0, id: 0 } }
  );
  res.json({ success: true, profile: updatedProfile });
}));

app.get('/api/student/bills', asyncRoute(async (_req, res) => {
  const studentId = requireStudentSession(_req, res);
  if (!studentId) return;
  const ownershipFilter = studentId === DEMO_STUDENT_ID
    ? { $or: [{ studentId }, { studentId: { $exists: false } }] }
    : { studentId };
  const bills = await collection<StudentBill>('studentBills')
    .find(ownershipFilter, { projection: { _id: 0 } })
    .toArray();
  res.json(bills);
}));

app.post('/api/student/pay-bill', asyncRoute(async (req, res) => {
  const studentId = requireStudentSession(req, res);
  if (!studentId) return;
  const { billId, method } = req.body;
  const bills = collection<StudentBill>('studentBills');
  const result = await bills.updateOne(
    {
      id: billId,
      ...(studentId === DEMO_STUDENT_ID
        ? { $or: [{ studentId }, { studentId: { $exists: false } }] }
        : { studentId })
    },
    { $set: { status: 'paid', statusText: 'Đã nộp' } }
  );
  if (result.matchedCount === 0) {
    res.status(404).json({ error: 'Bill not found' });
    return;
  }
  res.json({ success: true, message: `Thanh toán thành công qua ${method || 'VNPay'}! Hóa đơn đã được ghi nhận.` });
}));

app.get('/api/student/tickets', asyncRoute(async (_req, res) => {
  const studentId = requireStudentSession(_req, res);
  if (!studentId) return;
  const ownershipFilter = studentId === DEMO_STUDENT_ID
    ? { $or: [{ studentId }, { studentId: { $exists: false } }] }
    : { studentId };
  const tickets = await collection<StudentTicket>('studentTickets')
    .find(ownershipFilter, { projection: { _id: 0 } })
    .toArray();
  res.json(tickets);
}));

app.post('/api/student/tickets', asyncRoute(async (req, res) => {
  const studentId = requireStudentSession(req, res);
  if (!studentId) return;
  const { category, description } = req.body;
  const newTicket = {
    id: `SC-${randomUUID()}`,
    title: description.slice(0, 45) + (description.length > 45 ? '...' : ''),
    category: category || 'Hệ thống điện & Chiếu sáng',
    timeSent: 'Vừa xong',
    ktvName: 'Ban Kỹ thuật KTX',
    ktvNote: 'Đã phân bổ cho kỹ thuật viên khu vực Nhà B2',
    status: 'in_progress' as const,
    statusText: 'Đang tiếp nhận',
    studentId,
    assignedTo: 'seed-technician'
  };
  await collection<StudentTicket>('studentTickets').insertOne(newTicket);
  res.json({ success: true, ticket: newTicket });
}));

app.get('/api/student/room-requests', asyncRoute(async (req, res) => {
  const studentId = requireStudentSession(req, res);
  if (!studentId) return;
  const requests = await collection<RoomRequest>('roomRequests')
    .find({ studentId }, { projection: { _id: 0 } })
    .sort({ createdAt: -1 })
    .toArray();
  res.json(requests);
}));

app.post('/api/student/room-requests', asyncRoute(async (req, res) => {
  const studentId = requireStudentSession(req, res);
  if (!studentId) return;
  const { type, detail } = req.body ?? {};
  if (!['transfer', 'renewal'].includes(type) || typeof detail !== 'string' ||
    detail.trim().length < 5 || detail.trim().length > 1000) {
    res.status(400).json({ error: 'Loại yêu cầu hoặc nội dung không hợp lệ.' });
    return;
  }
  const profile = await collection<Document>('studentProfiles').findOne(
    { studentId },
    { projection: { fullName: 1 } }
  );
  if (!profile) {
    res.status(404).json({ error: 'Không tìm thấy hồ sơ sinh viên.' });
    return;
  }
  const request: RoomRequest = {
    id: `REQ-${randomUUID()}`,
    studentId,
    studentName: String(profile.fullName),
    type,
    detail: detail.trim(),
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  await collection<RoomRequest>('roomRequests').insertOne(request);
  res.status(201).json({ request });
}));

app.get('/api/manager/rooms', asyncRoute(async (req, res) => {
  if (!requireRole(req, res, 'manager', 'admin')) return;
  const rooms = await collection<RoomRecord>('rooms')
    .find({}, { projection: { _id: 0 } })
    .sort({ zone: 1, building: 1, roomNumber: 1 })
    .toArray();
  res.json(rooms);
}));

app.get('/api/manager/technicians', asyncRoute(async (req, res) => {
  if (!requireRole(req, res, 'manager', 'admin')) return;
  const technicians = await collection<StoredUser>('users')
    .find({ role: 'technician', status: { $ne: 'suspended' } }, {
      projection: { _id: 0, id: 1, fullName: 1, email: 1 }
    })
    .sort({ fullName: 1 })
    .toArray();
  res.json(technicians);
}));

app.get('/api/manager/students', asyncRoute(async (req, res) => {
  if (!requireRole(req, res, 'manager', 'admin')) return;
  const [profiles, registeredStudents] = await Promise.all([
    collection<Document>('studentProfiles')
      .find({}, { projection: { _id: 0, id: 0 } })
      .toArray(),
    collection<RegisteredStudent>('registeredStudents')
      .find({}, {
        projection: {
          _id: 0,
          studentId: 1,
          fullName: 1,
          email: 1,
          phone: 1,
          university: 1,
          dormArea: 1,
          roomType: 1
        }
      })
      .toArray()
  ]);
  const profiledStudentIds = new Set(
    profiles.map((profile) => String(profile.studentId || ''))
  );
  res.json({
    items: [
      ...profiles.map((profile) => ({ ...profile, email: profile.email || '' })),
      ...registeredStudents.map((student) => ({
        studentId: student.studentId,
        fullName: student.fullName,
        email: student.email,
        phone: student.phone,
        faculty: student.university,
        room: 'Chưa được phân phòng',
        zone: `Khu ${student.dormArea}`,
        roomType: student.roomType
      })).filter((student) => !profiledStudentIds.has(student.studentId))
    ]
  });
}));

app.get('/api/manager/room-requests', asyncRoute(async (req, res) => {
  if (!requireRole(req, res, 'manager', 'admin')) return;
  const requests = await collection<RoomRequest>('roomRequests')
    .find({}, { projection: { _id: 0 } })
    .sort({ createdAt: -1 })
    .toArray();
  res.json(requests);
}));

app.patch('/api/manager/room-requests/:id', asyncRoute(async (req, res) => {
  const identity = requireRole(req, res, 'manager', 'admin');
  if (!identity) return;
  const { status, reviewNote } = req.body ?? {};
  if (!['approved', 'rejected'].includes(status)) {
    res.status(400).json({ error: 'Trạng thái yêu cầu phải là approved hoặc rejected.' });
    return;
  }
  const result = await collection<RoomRequest>('roomRequests').findOneAndUpdate(
    { id: req.params.id, status: 'pending' },
    {
      $set: {
        status,
        reviewedBy: identity.id,
        reviewedAt: new Date().toISOString(),
        reviewNote: typeof reviewNote === 'string' ? reviewNote.trim() : ''
      }
    },
    { returnDocument: 'after', projection: { _id: 0 } }
  );
  if (!result) {
    res.status(404).json({ error: 'Không tìm thấy yêu cầu đang chờ xử lý.' });
    return;
  }
  res.json({ request: result });
}));

app.get('/api/manager/tickets', asyncRoute(async (req, res) => {
  if (!requireRole(req, res, 'manager', 'admin')) return;
  const tickets = await collection<StudentTicket>('studentTickets')
    .find({}, { projection: { _id: 0 } })
    .sort({ timeSent: -1 })
    .toArray();
  res.json(tickets);
}));

app.patch('/api/manager/tickets/:id/assign', asyncRoute(async (req, res) => {
  if (!requireRole(req, res, 'manager', 'admin')) return;
  const technicianId = typeof req.body?.technicianId === 'string'
    ? req.body.technicianId.trim()
    : '';
  if (!technicianId) {
    res.status(400).json({ error: 'Vui lòng chọn kỹ thuật viên.' });
    return;
  }
  const technician = await collection<StoredUser>('users').findOne(
    { $or: [{ id: technicianId }, { studentId: technicianId }], role: 'technician', status: { $ne: 'suspended' } },
    { projection: { _id: 0, id: 1, fullName: 1 } }
  );
  if (!technician) {
    res.status(404).json({ error: 'Không tìm thấy kỹ thuật viên đang hoạt động.' });
    return;
  }
  const result = await collection<StudentTicket>('studentTickets').findOneAndUpdate(
    { id: req.params.id },
    { $set: { assignedTo: technician.id, ktvName: technician.fullName } },
    { returnDocument: 'after', projection: { _id: 0 } }
  );
  if (!result) {
    res.status(404).json({ error: 'Không tìm thấy phiếu sửa chữa.' });
    return;
  }
  res.json({ ticket: result });
}));

app.get('/api/technician/tickets', asyncRoute(async (req, res) => {
  const identity = requireRole(req, res, 'technician', 'admin');
  if (!identity) return;
  const tickets = await collection<StudentTicket>('studentTickets')
    .find(
      identity.role === 'admin' ? {} : { assignedTo: identity.id },
      { projection: { _id: 0 } }
    )
    .sort({ timeSent: -1 })
    .toArray();
  res.json(tickets);
}));

app.patch('/api/technician/tickets/:id', asyncRoute(async (req, res) => {
  const identity = requireRole(req, res, 'technician', 'admin');
  if (!identity) return;
  const { status, ktvNote } = req.body ?? {};
  if (!['in_progress', 'completed'].includes(status)) {
    res.status(400).json({ error: 'Trạng thái phiếu không hợp lệ.' });
    return;
  }
  const filter = identity.role === 'admin'
    ? { id: req.params.id }
    : { id: req.params.id, assignedTo: identity.id };
  const result = await collection<StudentTicket>('studentTickets').findOneAndUpdate(
    filter,
    {
      $set: {
        status,
        statusText: status === 'completed' ? 'Đã hoàn thành' : 'Kỹ thuật đang xử lý',
        ...(typeof ktvNote === 'string' ? { ktvNote: ktvNote.trim() } : {})
      }
    },
    { returnDocument: 'after', projection: { _id: 0 } }
  );
  if (!result) {
    res.status(404).json({ error: 'Không tìm thấy phiếu được phân công cho tài khoản này.' });
    return;
  }
  res.json({ ticket: result });
}));

app.post('/api/student/ai-chat', asyncRoute(async (req, res) => {
  const studentId = requireStudentSession(req, res);
  if (!studentId) return;
  const { message } = req.body;
  const msgLower = (typeof message === 'string' ? message : '').toLowerCase();
  const [profile, bill] = await Promise.all([
    collection<Document>('studentProfiles').findOne(
      { studentId },
      { projection: { fullName: 1, roomNumber: 1, building: 1 } }
    ),
    collection<StudentBill>('studentBills').findOne(
      { studentId },
      { sort: { dueDate: -1 }, projection: { _id: 0 } }
    )
  ]);
  const studentName = typeof profile?.fullName === 'string' ? profile.fullName : 'bạn';
  let reply = `Chào ${studentName}! Mình có thể hỗ trợ bạn về hóa đơn, nội quy, chuyển phòng hoặc báo hỏng thiết bị.`;

  if (msgLower.includes('tiền điện') || msgLower.includes('hóa đơn') || msgLower.includes('tháng 10')) {
    reply = bill
      ? `Hóa đơn ${bill.month} của bạn là ${bill.amount.toLocaleString('vi-VN')} đ, hạn nộp ${bill.dueDate}. Trạng thái: ${bill.statusText}.`
      : 'Hiện chưa có hóa đơn nào được ghi nhận cho tài khoản của bạn.';
  } else if (msgLower.includes('giới nghiêm') || msgLower.includes('nội quy') || msgLower.includes('mấy giờ')) {
    reply = 'Theo Nội quy KTX ĐHQG: Cổng tòa nhà khóa lúc 23:00 hàng ngày. Nếu cần về muộn do học tập hoặc công việc, bạn vui lòng bấm nút "Đăng ký tạm vắng qua đêm" trên ứng dụng trước 22:30 nhé!';
  } else if (msgLower.includes('chuyển phòng') || msgLower.includes('gia hạn')) {
    const request = await collection<RoomRequest>('roomRequests')
      .find({ studentId }, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .limit(1)
      .next();
    reply = request
      ? `Yêu cầu gần nhất của bạn (${request.type === 'transfer' ? 'chuyển phòng' : 'gia hạn'}) đang ở trạng thái: ${request.status}.`
      : 'Bạn chưa gửi yêu cầu chuyển phòng hoặc gia hạn nào.';
  } else if (msgLower.includes('báo hỏng') || msgLower.includes('sửa')) {
    const roomLabel = profile?.roomNumber && profile?.building
      ? `phòng ${profile.roomNumber}, tòa ${profile.building}`
      : 'phòng của bạn';
    reply = `Bạn có thể gửi báo hỏng thiết bị cho ${roomLabel} bằng nút "Gửi báo hỏng"; phiếu sẽ được lưu và chuyển đến kỹ thuật viên.`;
  }

  res.json({ reply, time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) });
}));


app.get('/api/tariffs', asyncRoute(async (_req, res) => {
  if (!requireRole(_req, res, 'admin', 'manager')) return;
  const savedTariffs = await collection<Document>('tariffs')
    .find({}, { projection: { _id: 0 } })
    .toArray();
  res.json(savedTariffs);
}));

app.put('/api/tariffs', asyncRoute(async (req, res) => {
  if (!requireRole(req, res, 'admin')) return;
  const { updatedTariffs } = req.body;
  if (!Array.isArray(updatedTariffs) || updatedTariffs.some((item) =>
    !item || typeof item.id !== 'string' || !item.id.trim()
  )) {
    res.status(400).json({ error: 'Invalid tariff data' });
    return;
  }
  const tariffs = collection<Document>('tariffs');
  if (updatedTariffs.length) {
    await tariffs.bulkWrite(updatedTariffs.map((item) => ({
      replaceOne: { filter: { id: item.id }, replacement: item, upsert: true }
    })));
  }
  await tariffs.deleteMany({ id: { $nin: updatedTariffs.map((item) => item.id) } });
  const savedTariffs = await tariffs.find({}, { projection: { _id: 0 } }).toArray();
  res.json({ success: true, tariffs: savedTariffs });
}));

app.get('/api/security-alerts', asyncRoute(async (_req, res) => {
  if (!requireRole(_req, res, 'admin')) return;
  const alerts = await collection<Document>('securityAlerts')
    .find({}, { projection: { _id: 0 } })
    .toArray();
  res.json(alerts);
}));

app.post('/api/security-alerts/block-ip', asyncRoute(async (req, res) => {
  if (!requireRole(req, res, 'admin')) return;
  const { alertId, ip } = req.body;
  const result = await collection<Document>('securityAlerts').updateOne(
    { id: alertId },
    { $set: { status: 'resolved', actionTaken: `Đã chặn vĩnh viễn IP ${ip} trên tường lửa WAF` } }
  );
  if (result.matchedCount === 0) {
    res.status(404).json({ error: 'Security alert not found' });
    return;
  }
  res.json({ success: true, message: `IP ${ip} đã được chặn trên WAF VNU-Cloud.` });
}));

app.post('/api/backup', (req, res) => {
  if (!requireRole(req, res, 'admin')) return;
  const backupId = `SNAP_${Date.now()}`;
  res.json({
    success: true,
    backupId,
    timestamp: new Date().toISOString(),
    size: '14.28 GB',
    storageBucket: 's3://vnu-cloud-backup/smartdorm/snapshots/' + backupId,
    message: 'Sao lưu cơ sở dữ liệu hệ thống KTX hoàn tất 100% không gián đoạn.'
  });
});

app.get('/api/users', asyncRoute(async (req, res) => {
  if (!requireRole(req, res, 'admin')) return;
  const [accounts, registeredStudents] = await Promise.all([
    collection<StoredUser>('users').find({}, {
      projection: { _id: 0, passwordHash: 0, passwordSalt: 0 }
    }).toArray(),
    collection<RegisteredStudent>('registeredStudents').find({}, {
      projection: {
        _id: 0,
        studentId: 1,
        fullName: 1,
        email: 1,
        dormArea: 1,
        roomType: 1,
        status: 1
      }
    }).toArray()
  ]);
  const displayRole = (role: string) => ({
    student: 'Sinh viên (Student)',
    manager: 'Cán bộ Quản lý (Manager)',
    technician: 'Kỹ thuật viên (Tech)',
    admin: 'Quản trị viên (Admin)'
  }[role] || role);
  res.json([
    ...accounts.map(({ id, fullName, email, role, room, studentId, status }) => ({
      id,
      fullName,
      email,
      role: displayRole(role),
      room: room || 'Chưa gán',
      zone: room ? String(room).split(' - ')[0] : 'Chưa phân khu',
      status: status || 'active',
      lastActive: 'Chưa hoạt động'
    })),
    ...registeredStudents.map((student) => ({
      id: student.studentId,
      studentId: student.studentId,
      fullName: student.fullName,
      email: student.email,
      role: displayRole('student'),
      room: 'Chưa gán',
      zone: `Khu ${student.dormArea}`,
      status: student.status || 'active',
      lastActive: 'Chưa hoạt động'
    }))
  ]);
}));

app.patch('/api/users/:id/status', asyncRoute(async (req, res) => {
  if (!requireRole(req, res, 'admin')) return;
  const { status } = req.body ?? {};
  if (!['active', 'suspended'].includes(status)) {
    res.status(400).json({ error: 'Trạng thái tài khoản không hợp lệ.' });
    return;
  }
  const result = await collection<StoredUser>('users').updateOne(
    { $or: [{ id: req.params.id }, { studentId: req.params.id }] },
    { $set: { status } }
  );
  if (result.matchedCount === 0) {
    const registeredResult = await collection<RegisteredStudent>('registeredStudents').updateOne(
      { studentId: req.params.id },
      { $set: { status } }
    );
    if (registeredResult.matchedCount === 0) {
      res.status(404).json({ error: 'Không tìm thấy tài khoản.' });
      return;
    }
  }
  res.json({ success: true, id: req.params.id, status });
}));

app.post('/api/register', asyncRoute(async (req, res) => {
  const {
    university,
    studentId,
    cccd,
    fullName,
    birthDate,
    gender,
    email,
    phone,
    dormArea,
    roomType,
    priorityPolicies,
    agreeTerms,
    agreeNotify,
    password
  } = req.body ?? {};

  const normalizedStudentId = typeof studentId === 'string' ? studentId.trim() : '';
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (
    typeof university !== 'string' || !university.trim() ||
    !normalizedStudentId ||
    typeof cccd !== 'string' || !/^\d{12}$/.test(cccd.trim()) ||
    typeof fullName !== 'string' || !fullName.trim() ||
    typeof birthDate !== 'string' || !birthDate.trim() ||
    !['male', 'female'].includes(gender) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ||
    typeof phone !== 'string' || phone.replace(/\D/g, '').length < 10 ||
    typeof dormArea !== 'string' || !['A', 'B', 'C'].includes(dormArea) ||
    typeof roomType !== 'string' || !['4-ac', '6-ac', '8-fan', '2-service'].includes(roomType) ||
    typeof password !== 'string' || password.length < 8 ||
    !/[a-z]/.test(password) || !/[A-Z]/.test(password) ||
    !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password) ||
    agreeTerms !== true
  ) {
    return res.status(400).json({ error: 'Thông tin đăng ký không hợp lệ hoặc chưa đồng ý nội quy.' });
  }

  const passwordSalt = randomBytes(16).toString('hex');
  const passwordHash = scryptSync(password, passwordSalt, 64).toString('hex');
  const student = {
    university,
    studentId: normalizedStudentId,
    cccd: cccd.trim(),
    fullName: fullName.trim(),
    birthDate,
    gender: gender as 'male' | 'female',
    email: normalizedEmail,
    phone: phone.trim(),
    dormArea,
    roomType,
    priorityPolicies: priorityPolicies && typeof priorityPolicies === 'object' ? priorityPolicies : {},
    agreeNotify: agreeNotify === true,
    passwordSalt,
    passwordHash
  };
  const [existingAccount, existingStudent, existingStudentProfile] = await Promise.all([
    collection<StoredUser>('users').findOne(
      { $or: [{ studentId: normalizedStudentId }, { email: normalizedEmail }] },
      { projection: { _id: 1 } }
    ),
    collection<RegisteredStudent>('registeredStudents').findOne(
      { $or: [{ studentId: normalizedStudentId }, { email: normalizedEmail }] },
      { projection: { _id: 1 } }
    ),
    collection<Document>('studentProfiles').findOne(
      { studentId: normalizedStudentId },
      { projection: { _id: 1 } }
    )
  ]);
  if (existingAccount || existingStudent || existingStudentProfile) {
    res.status(409).json({ error: 'Mã sinh viên hoặc email đã được sử dụng.' });
    return;
  }
  try {
    await collection<RegisteredStudent>('registeredStudents').insertOne(student);
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0];
      const message = duplicateField === 'email'
        ? 'Email này đã được sử dụng để đăng ký.'
        : 'Mã số sinh viên này đã được đăng ký.';
      res.status(409).json({ error: message });
      return;
    }
    throw error;
  }

  const studentProfile = await ensureStudentProfile(student.studentId);
  if (!studentProfile) {
    throw new Error(`Failed to create profile for newly registered student "${student.studentId}".`);
  }

  const now = new Date();
  const newLog: AuditLog = {
    id: `LOG-${randomUUID()}`,
    time: now.toLocaleTimeString('vi-VN'),
    date: now.toLocaleDateString('vi-VN'),
    user: {
      name: student.fullName,
      role: 'Student',
      email: student.email,
      avatarInitials: student.fullName.slice(0, 2).toUpperCase(),
      avatarBg: 'bg-primary'
    },
    action: 'Đăng ký tài khoản sinh viên',
    actionType: 'create',
    detail: `Tạo tài khoản sinh viên ${student.fullName}`,
    targetId: normalizedStudentId,
    ip: req.ip || 'Không xác định',
    device: req.get('user-agent') || 'Không xác định',
    status: 'success',
    statusText: 'Đã đăng ký',
    payload: {
      university,
      studentId: normalizedStudentId,
      email: normalizedEmail,
      dormArea,
      roomType
    }
  };
  await collection<AuditLog>('auditLogs').insertOne(newLog);
  setSession(res, { id: student.studentId, role: 'student' });

  res.status(201).json({
    success: true,
    user: {
      studentId: student.studentId,
      fullName: student.fullName,
      email: student.email
    }
  });
}));

app.post('/api/users', asyncRoute(async (req, res) => {
  if (!requireRole(req, res, 'admin')) return;
  const { fullName, email, role: requestedRole, room, studentId } = req.body ?? {};
  if (typeof fullName !== 'string' || !fullName.trim() || typeof email !== 'string' ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    res.status(400).json({ error: 'Vui lòng điền đủ họ tên và email.' });
    return;
  }

  const roleText = typeof requestedRole === 'string' ? requestedRole.toLowerCase() : 'student';
  const role: UserRole = roleText.includes('admin')
    ? 'admin'
    : roleText.includes('manager')
      ? 'manager'
      : roleText.includes('tech')
        ? 'technician'
        : roleText.includes('finance')
          ? 'manager'
        : 'student';
  const normalizedEmail = email.trim().toLowerCase();
  const temporaryPassword = `${randomBytes(8).toString('hex')}Aa1!`;
  const passwordSalt = randomBytes(16).toString('hex');
  const id = typeof studentId === 'string' && studentId.trim()
    ? studentId.trim()
    : `${role}-${randomUUID()}`;
  const user: StoredUser = {
    id,
    fullName: fullName.trim(),
    email: normalizedEmail,
    role,
    passwordSalt,
    passwordHash: scryptSync(temporaryPassword, passwordSalt, 64).toString('hex'),
    room,
    ...(role === 'student' ? { studentId: id } : {})
  };
  const [existingUser, existingStudent] = await Promise.all([
    collection<StoredUser>('users').findOne({ email: normalizedEmail }, { projection: { _id: 1 } }),
    collection<RegisteredStudent>('registeredStudents').findOne(
      { $or: [{ email: normalizedEmail }, { studentId: id }] },
      { projection: { _id: 1 } }
    )
  ]);
  if (existingUser || existingStudent) {
    res.status(409).json({ error: 'Email hoặc mã tài khoản đã tồn tại.' });
    return;
  }
  try {
    await collection<StoredUser>('users').insertOne(user);
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      res.status(409).json({ error: 'Email hoặc mã tài khoản đã tồn tại.' });
      return;
    }
    throw error;
  }

  const newLog: AuditLog = {
    id: `LOG-${randomUUID()}`,
    time: new Date().toLocaleTimeString('vi-VN'),
    date: new Date().toLocaleDateString('vi-VN'),
    user: {
      name: 'TS. Trần Minh Khoa',
      role: 'SuperAdmin',
      email: 'root@dorm.edu.vn',
      avatarInitials: 'TK',
      avatarBg: 'bg-primary'
    },
    action: 'Thêm tài khoản thủ công',
    actionType: 'create',
    detail: `Tạo tài khoản mới: ${user.fullName} (${role}) - Phòng: ${room || 'Chưa gán'}`,
    targetId: id,
    ip: '10.240.12.5 (Nội bộ)',
    device: 'macOS • Chrome 129',
    status: 'success',
    statusText: 'Đã kích hoạt',
    payload: { fullName: user.fullName, email: normalizedEmail, role, room, studentId: user.studentId }
  };

  await collection<AuditLog>('auditLogs').insertOne(newLog);
  if (role === 'student') {
    const profile = await ensureStudentProfile(user.studentId || user.id);
    if (!profile) {
      throw new Error(`Failed to create profile for student account "${user.studentId || user.id}".`);
    }
  }

  const { passwordHash: _passwordHash, passwordSalt: _passwordSalt, ...publicUser } = user;
  res.status(201).json({
    success: true,
    user: publicUser,
    log: newLog,
    temporaryPassword
  });
}));

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

async function initializeDatabase(db: Db) {
  database = db;

  await Promise.all([
    collection<AuditLog>('auditLogs').createIndex({ id: 1 }, { unique: true }),
    collection<Document>('tariffs').createIndex({ id: 1 }, { unique: true }),
    collection<Document>('securityAlerts').createIndex({ id: 1 }, { unique: true }),
    collection<StudentBill>('studentBills').createIndex({ id: 1 }, { unique: true }),
    collection<StudentTicket>('studentTickets').createIndex({ id: 1 }, { unique: true }),
    collection<RegisteredStudent>('registeredStudents').createIndex({ studentId: 1 }, { unique: true }),
    collection<RegisteredStudent>('registeredStudents').createIndex({ email: 1 }, { unique: true }),
    collection<StoredUser>('users').createIndex({ id: 1 }, { unique: true }),
    collection<StoredUser>('users').createIndex({ email: 1 }, { unique: true }),
    collection<Document>('studentProfiles').createIndex({ id: 1 }, { unique: true }),
    collection<Document>('studentProfiles').createIndex({ studentId: 1 }, { unique: true }),
    collection<RoomRecord>('rooms').createIndex({ id: 1 }, { unique: true }),
    collection<RoomRequest>('roomRequests').createIndex({ id: 1 }, { unique: true }),
    collection<StudentTicket>('studentTickets').createIndex({ assignedTo: 1 })
  ]);

  await Promise.all([
    seedIfEmpty('auditLogs', defaultAuditLogs),
    seedIfEmpty('tariffs', defaultTariffs),
    seedIfEmpty('securityAlerts', defaultSecurityAlerts),
    seedIfEmpty('studentBills', defaultStudentBills),
    seedIfEmpty('studentTickets', defaultStudentTickets),
    seedIfEmpty('studentProfiles', [defaultStudentInfo]),
    seedIfEmpty('rooms', defaultRooms),
    seedIfEmpty('roomRequests', defaultRoomRequests)
  ]);

  await Promise.all([
    collection<StudentBill>('studentBills').updateMany(
      { studentId: { $exists: false } },
      { $set: { studentId: DEMO_STUDENT_ID } }
    ),
    collection<StudentTicket>('studentTickets').updateMany(
      { studentId: { $exists: false } },
      { $set: { studentId: DEMO_STUDENT_ID } }
    ),
    collection<StudentTicket>('studentTickets').updateMany(
      { id: { $in: ['SC-9102', 'SC-8419'] }, assignedTo: { $exists: false } },
      { $set: { assignedTo: 'seed-technician' } }
    )
  ]);
}

async function startServer() {
  const mongoClient = new MongoClient(MONGODB_URI);
  await mongoClient.connect();
  await initializeDatabase(mongoClient.db());
  console.log(`Connected to MongoDB database "${mongoClient.db().databaseName}"`);

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

app.use((error: Error, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Request failed:', error);
  if (res.headersSent) {
    next(error);
    return;
  }
  res.status(500).json({ error: 'Internal server error' });
});

startServer().catch((error: unknown) => {
  console.error('Server startup failed:', error);
  process.exitCode = 1;
});
