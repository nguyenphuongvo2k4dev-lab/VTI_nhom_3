import 'dotenv/config';
import { randomBytes, scryptSync } from 'crypto';
import { MongoClient, type Document } from 'mongodb';

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ktx';
const demoStudentId = '22120045';

const auditLogs: Document[] = [
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

const tariffs: Document[] = [
  { id: 'T-01', name: 'Phòng Tiêu Chuẩn', zone: 'Khu B, D', price: 650000, unit: '/tháng/sinh viên', desc: '4-6 SV/phòng (Giường tầng, quạt trần, WC khép kín)' },
  { id: 'T-02', name: 'Phòng CLC Máy Lạnh', zone: 'Khu A', price: 1200000, unit: '/tháng/sinh viên', desc: '2-4 SV/phòng (Máy lạnh Inverter, bàn học cao cấp)' },
  { id: 'T-03', name: 'Điện Sinh Hoạt KTX', zone: 'Theo EVN', price: 'Biểu giá Lũy tiến', unit: 'Bậc 1-6 chuẩn Bộ Công Thương', desc: 'Đo lường tự động qua công tơ thông minh Modbus-RTU' },
  { id: 'T-04', name: 'Nước Sinh Hoạt', zone: 'Cấp thủy', price: 8500, unit: '/m³ (Đã gồm phí BVMT)', desc: 'Phao giám sát rò rỉ nước tự động 24/7' }
];

const securityAlerts: Document[] = [
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

const roomDefinitions = [
  ...[402, 403, 404, 405, 406, 407].map((roomNumber) => ({ building: 'B2', roomNumber })),
  ...[201, 202, 203, 204, 205, 206].map((roomNumber) => ({ building: 'A1', roomNumber })),
  ...[201, 202, 203, 204, 205, 206].map((roomNumber) => ({ building: 'C1', roomNumber })),
  ...[201, 202, 203, 204, 205, 206, 207].map((roomNumber) => ({ building: 'D1', roomNumber }))
];

const rooms: Document[] = roomDefinitions.map(({ building, roomNumber }) => ({
  id: `${building}-${roomNumber}`,
  roomNumber: String(roomNumber),
  building,
  zone: `Khu ${building[0]}`,
  capacity: 4,
  occupied: 4,
  roomType: building === 'A1' ? 'Máy lạnh' : 'Tiêu chuẩn',
  status: 'occupied'
}));

const studentNames: string[] = [];
const surnames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng'];
const middleNames = ['Minh', 'Hoàng', 'Gia', 'Quốc', 'Thanh', 'Ngọc', 'Tuấn', 'Bảo', 'Đức', 'Anh'];
const givenNames = ['An', 'Bình', 'Duy', 'Hải', 'Khang', 'Long', 'Nam', 'Phúc', 'Quân', 'Tú'];
for (const surname of surnames) {
  for (const middleName of middleNames) {
    for (const givenName of givenNames) {
      const fullName = `${surname} ${middleName} ${givenName}`;
      if (fullName !== 'Đặng Hoàng Nam') studentNames.push(fullName);
    }
  }
}

const faculties = [
  'Khoa CNTT & Truyền thông',
  'Khoa Điện tử Viễn thông',
  'Khoa Kinh tế Đối ngoại',
  'Khoa Khoa học Máy tính',
  'Khoa Môi trường',
  'Khoa Toán - Tin học'
];

const studentRoster = Array.from({ length: 100 }, (_, index) => {
  const studentId = String(Number(demoStudentId) + index);
  const roomIndex = Math.floor(index / 4);
  const room = rooms[roomIndex];
  return {
    index,
    studentId,
    fullName: index === 0 ? 'Đặng Hoàng Nam' : studentNames[index - 1],
    email: index === 0
      ? 'nam.dh@student.vnu.edu.vn'
      : `sv${studentId}@student.vnu.edu.vn`,
    phone: index === 0 ? '0912 345 678' : `09${String(10000000 + index * 7919).slice(-8)}`,
    faculty: faculties[index % faculties.length],
    cohort: `K${22 + (index % 4)}`,
    className: `CNTT-K${22 + (index % 4)}${String.fromCharCode(65 + (index % 3))}`,
    room,
    bedSlot: `G${(index % 4) + 1}`
  };
});

const studentProfiles: Document[] = studentRoster.map((student) => {
  const roommates = studentRoster
    .filter((roommate) => roommate.room.id === student.room.id)
    .map((roommate) => ({
      id: roommate.studentId,
      bed: roommate.bedSlot,
      name: roommate.fullName,
      role: roommate.studentId === student.studentId && student.index === 0
        ? 'Bạn • Trưởng phòng'
        : 'Sinh viên',
      faculty: `${roommate.faculty} • ${roommate.cohort}`,
      phone: roommate.phone,
      inRoom: true,
      ...(roommate.studentId === student.studentId ? { isMe: true } : {})
    }));

  return {
    id: student.index === 0 ? 'demo-student' : `seed-profile-${student.studentId}`,
    studentId: student.studentId,
    fullName: student.fullName,
    email: student.email,
    faculty: student.faculty,
    className: student.className,
    cohort: student.cohort,
    phone: student.phone,
    room: `P.${student.room.roomNumber} - Nhà ${student.room.building} (${student.room.zone})`,
    roomNumber: student.room.roomNumber,
    building: student.room.building,
    zone: student.index === 0 ? 'Khu B (Nam sinh viên)' : student.room.zone,
    bedSlot: student.bedSlot,
    isLeader: student.bedSlot === 'G1',
    contract: {
      id: `HD-${student.studentId}`,
      daysLeft: Math.ceil((new Date('2027-12-31').getTime() - Date.now()) / 86400000),
      expiryDate: '31/12/2027',
      renewalStartDate: '01/12/2027'
    },
    roommates,
    roomSpecs: {
      airConditioner: student.room.building === 'A1' ? '12.000 BTU Inverter' : 'Không lắp đặt',
      waterHeater: 'Ariston 30L',
      electricMeter: `${1200 + student.index} kWh (IoT)`,
      waterMeter: `${100 + student.index} m³ (IoT)`
    }
  };
});

const demoBills: Document[] = [
  {
    id: 'BILL-10-2024',
    studentId: demoStudentId,
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
    studentId: demoStudentId,
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
    studentId: demoStudentId,
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

const studentBills: Document[] = [
  ...demoBills,
  ...studentRoster.flatMap((student) => [
    {
      id: `BILL-${student.studentId}-2026-11`,
      studentId: student.studentId,
      month: 'Tháng 11/2026',
      period: 'Tiền phòng + Điện + Nước',
      amount: 650000 + (student.index % 5) * 25000,
      dueDate: '25/11/2026',
      status: student.index % 3 === 0 ? 'pending' : 'paid',
      statusText: student.index % 3 === 0 ? 'Chưa nộp' : 'Đã nộp',
      electricKwh: 120 + student.index % 80,
      waterM3: 10 + student.index % 12
    },
    {
      id: `BILL-${student.studentId}-2026-10`,
      studentId: student.studentId,
      month: 'Tháng 10/2026',
      period: 'Tiền phòng + Điện + Nước',
      amount: 630000 + (student.index % 5) * 25000,
      dueDate: '25/10/2026',
      status: 'paid',
      statusText: 'Đã nộp',
      electricKwh: 110 + student.index % 80,
      waterM3: 9 + student.index % 12
    }
  ])
];

const technicianAccounts = [
  { id: 'seed-technician', fullName: 'Nguyễn Văn Hùng', email: 'hung.nv@tech.dorm.edu.vn', password: 'Tech@2024' },
  { id: 'seed-technician-2', fullName: 'Trần Văn Nam', email: 'nam.tv@tech.dorm.edu.vn', password: 'Tech@2024' },
  { id: 'seed-technician-3', fullName: 'Lê Văn Bình', email: 'binh.lv@tech.dorm.edu.vn', password: 'Tech@2024' }
];

const studentTickets: Document[] = [
  {
    id: 'SC-9102',
    studentId: demoStudentId,
    assignedTo: 'seed-technician',
    title: 'Bóng đèn tuýp LED ban công bị chập chờn',
    category: 'Hệ thống điện & Chiếu sáng',
    timeSent: 'Hôm qua 16:30',
    ktvName: 'Nguyễn Văn Hùng',
    ktvNote: 'Dự kiến thay bóng tuýp mới lúc 14:00 chiều nay',
    status: 'in_progress',
    statusText: 'Kỹ thuật đang xử lý'
  },
  {
    id: 'SC-8419',
    studentId: demoStudentId,
    assignedTo: 'seed-technician',
    title: 'Khóa van vòi xịt vệ sinh bị rò nước',
    category: 'Vòi nước, Lavabo, Bồn cầu',
    timeSent: '05/10/2024',
    ktvName: 'Nguyễn Văn Hùng',
    ktvNote: 'Đã thay zoăng cao su và van áp lực mới',
    status: 'completed',
    statusText: 'Đã hoàn thành',
    rating: 5
  },
  ...studentRoster.map((student) => {
    const technician = technicianAccounts[student.index % technicianAccounts.length];
    const completed = student.index % 2 === 0;
    return {
      id: `SC-SEED-${student.studentId}`,
      studentId: student.studentId,
      assignedTo: technician.id,
      title: student.index % 2 === 0
        ? 'Kiểm tra thiết bị điện trong phòng'
        : 'Kiểm tra vòi nước và thiết bị vệ sinh',
      category: student.index % 2 === 0
        ? 'Hệ thống điện & Chiếu sáng'
        : 'Vòi nước, Lavabo, Bồn cầu',
      timeSent: '14/11/2026',
      ktvName: technician.fullName,
      ktvNote: completed ? 'Đã kiểm tra và xử lý xong.' : 'Đã tiếp nhận, đang lên lịch kiểm tra.',
      status: completed ? 'completed' : 'in_progress',
      statusText: completed ? 'Đã hoàn thành' : 'Kỹ thuật đang xử lý',
      ...(completed ? { rating: 5 } : {})
    };
  })
];

const seededAccounts = [
  ...studentRoster.map((student) => ({
    id: student.index === 0 ? 'seed-student-22120045' : `seed-student-${student.studentId}`,
    studentId: student.studentId,
    fullName: student.fullName,
    email: student.email,
    role: 'student',
    status: 'active',
    room: `P.${student.room.roomNumber} - Nhà ${student.room.building}`,
    password: student.index === 0 ? 'smartdorm@2024' : 'Student@2024'
  })),
  {
    id: 'seed-admin',
    fullName: 'TS. Trần Minh Khoa',
    email: 'root@dorm.edu.vn',
    role: 'admin',
    status: 'active',
    password: 'Admin@2024'
  },
  {
    id: 'seed-admin-2',
    fullName: 'Đặng Ngọc Hải',
    email: 'hai.dn@dorm.edu.vn',
    role: 'admin',
    status: 'active',
    password: 'Admin@2024'
  },
  {
    id: 'seed-manager',
    fullName: 'Nguyễn Văn Hoàng',
    email: 'hoang.nv@dorm.edu.vn',
    role: 'manager',
    status: 'active',
    room: 'Khu B',
    password: 'Manager@2024'
  },
  {
    id: 'seed-manager-2',
    fullName: 'Đặng Ngọc Hải',
    email: 'hai.manager@dorm.edu.vn',
    role: 'manager',
    status: 'active',
    room: 'Khu A',
    password: 'Manager@2024'
  },
  ...technicianAccounts.map((technician) => ({
    ...technician,
    role: 'technician',
    status: 'active',
    password: technician.password
  }))
].map(({ password, ...account }) => {
  const passwordSalt = randomBytes(16).toString('hex');
  return {
    ...account,
    passwordSalt,
    passwordHash: scryptSync(password, passwordSalt, 64).toString('hex')
  };
});

const roomRequests: Document[] = [
  {
    id: 'REQ-TRANSFER-001',
    studentId: demoStudentId,
    studentName: 'Đặng Hoàng Nam',
    type: 'transfer',
    detail: 'Đề nghị chuyển sang phòng B204',
    status: 'pending',
    createdAt: '2024-10-24T08:30:00.000Z'
  },
  {
    id: 'REQ-RENEWAL-001',
    studentId: demoStudentId,
    studentName: 'Đặng Hoàng Nam',
    type: 'renewal',
    detail: 'Đề nghị gia hạn hợp đồng học kỳ tiếp theo',
    status: 'pending',
    createdAt: '2024-10-25T09:00:00.000Z'
  },
  ...studentRoster.map((student) => ({
    id: `REQ-SEED-${student.studentId}`,
    studentId: student.studentId,
    studentName: student.fullName,
    type: student.index % 2 === 0 ? 'renewal' : 'transfer',
    detail: student.index % 2 === 0
      ? 'Đề nghị gia hạn hợp đồng lưu trú học kỳ tiếp theo'
      : 'Đề nghị xem xét chuyển phòng trong cùng khu',
    status: student.index % 3 === 0 ? 'pending' : student.index % 3 === 1 ? 'approved' : 'rejected',
    createdAt: new Date(Date.UTC(2026, 10, 1 + (student.index % 14))).toISOString(),
    ...(student.index % 3 === 0 ? {} : {
      reviewedBy: 'seed-manager',
      reviewedAt: new Date(Date.UTC(2026, 10, 15 + (student.index % 10))).toISOString(),
      reviewNote: student.index % 3 === 1 ? 'Đã duyệt yêu cầu.' : 'Chưa thể đáp ứng yêu cầu ở thời điểm này.'
    })
  }))
];

const seedCollections: Array<{ name: string; records: Document[] }> = [
  { name: 'auditLogs', records: auditLogs },
  { name: 'tariffs', records: tariffs },
  { name: 'securityAlerts', records: securityAlerts },
  { name: 'studentBills', records: studentBills },
  { name: 'studentTickets', records: studentTickets },
  { name: 'studentProfiles', records: studentProfiles },
  { name: 'rooms', records: rooms },
  { name: 'roomRequests', records: roomRequests }
];

async function seed() {
  const client = new MongoClient(mongoUri);
  try {
    const expectedStudentIds = studentRoster.map((student) => student.studentId);
    if (new Set(expectedStudentIds).size !== 100) {
      throw new Error('Student seed roster must contain exactly 100 unique student IDs.');
    }

    await client.connect();
    const database = client.db();

    for (const { name, records } of seedCollections) {
      const target = database.collection<Document>(name);
      if (records.length > 0) {
        await target.createIndex({ id: 1 }, { unique: true });
        const results = await target.bulkWrite(records.map((record) => ({
          updateOne: {
            filter: { id: record.id },
            update: { $setOnInsert: record },
            upsert: true
          }
        })));
        console.log(`${name}: ${results.upsertedCount} added, ${records.length - results.upsertedCount} already existed`);
      }
    }
    const users = database.collection<Document>('users');
    await users.createIndex({ id: 1 }, { unique: true });
    await users.createIndex({ email: 1 }, { unique: true });
    const accountsResult = await users.bulkWrite(seededAccounts.map((account) => ({
      updateOne: {
        filter: 'studentId' in account && typeof account.studentId === 'string'
          ? { studentId: account.studentId }
          : { id: account.id },
        update: { $setOnInsert: account },
        upsert: true
      }
    })));
    console.log(`users: ${accountsResult.upsertedCount} added, ${seededAccounts.length - accountsResult.upsertedCount} already existed`);

    const seededStudents = await users.find(
      { role: 'student', studentId: { $in: expectedStudentIds } },
      { projection: { _id: 0, studentId: 1 } }
    ).toArray();
    const seededStudentIds = new Set(seededStudents.map((student) => student.studentId));
    if (seededStudents.length !== 100 || seededStudentIds.size !== 100) {
      throw new Error(
        `Expected 100 unique seeded student accounts, found ${seededStudents.length} records and ${seededStudentIds.size} unique student IDs.`
      );
    }
    console.log(`student accounts: ${seededStudents.length} verified`);
    console.log(`Seed completed for MongoDB database "${database.databaseName}".`);
  } finally {
    await client.close();
  }
}

seed().catch((error: unknown) => {
  console.error('MongoDB seed failed:', error);
  process.exitCode = 1;
});
