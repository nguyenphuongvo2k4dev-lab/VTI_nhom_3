import { StudentInfo, StudentBill, Roommate } from '../core/types';

export const DEMO_STUDENT: StudentInfo = {
  fullName: 'Đặng Hoàng Nam',
  studentId: '22120045',
  faculty: 'Khoa CNTT & Truyền thông',
  className: 'CNTT-K22A',
  cohort: 'K22',
  phone: '0912 345 678',
  status: 'active',
  room: 'P.402 - Nhà B2 (Khu B)',
  roomNumber: '402',
  building: 'B2',
  zone: 'Khu B (Nam sinh viên)',
  bedSlot: 'G1',
  isLeader: true,
  preferredArea: 'B',
  preferredRoomType: '4-ac',
  contract: {
    id: 'HD-2024-8841',
    daysLeft: 74,
    expiryDate: '31/12/2024',
    renewalStartDate: '01/12/2024',
    status: 'active'
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

export const createAssignedRoommates = (fullName: string, university?: string, phone?: string): Roommate[] => [
  {
    id: '1',
    bed: 'G1',
    name: fullName,
    role: 'Bạn • Tân sinh viên',
    faculty: `${university || 'ĐHQG TP.HCM'} • K24`,
    phone: phone || '0912 345 678',
    inRoom: true,
    isMe: true
  },
  {
    id: '2',
    bed: 'G2',
    name: 'Nguyễn Tiến Đạt',
    role: 'Sinh viên',
    faculty: 'Khoa Điện tử Viễn thông • K24',
    phone: '0984 112 334',
    inRoom: true,
    isMe: false
  },
  {
    id: '3',
    bed: 'G3',
    name: 'Lê Bảo Minh',
    role: 'Sinh viên',
    faculty: 'Khoa Kinh tế Đối ngoại • K24',
    phone: '0905 889 211',
    inRoom: true,
    isMe: false
  },
  {
    id: '4',
    bed: 'G4',
    name: 'Phạm Tuấn Hưng',
    role: 'Tân sinh viên',
    faculty: 'Khoa Khoa học Máy tính • K24',
    phone: '0977 441 902',
    inRoom: false,
    isMe: false
  }
];

export const createInitialStudentBill = (studentId: string): StudentBill => ({
  id: `BILL-NEW-${studentId.slice(-4) || '2401'}`,
  month: 'Kỳ 1 (2024-2025)',
  period: 'Lưu trú KTX 5 tháng + Đặt cọc tài sản',
  amount: 1450000,
  dueDate: '15/11/2024',
  status: 'pending',
  statusText: 'Chưa nộp',
  electricKwh: 0,
  waterM3: 0
});

export interface UserRegistrationData {
  fullName: string;
  studentId: string;
  email: string;
  phone?: string;
  university?: string;
  dormArea?: string;
  roomType?: string;
}

export const createPendingStudentInfo = (user: UserRegistrationData, baseInfo?: Partial<StudentInfo>): StudentInfo => {
  const zoneName = user.dormArea ? `Khu ${user.dormArea}` : 'Khu B';

  return {
    ...baseInfo,
    fullName: user.fullName,
    studentId: user.studentId,
    email: user.email,
    phone: user.phone || '0912 345 678',
    faculty: user.university || 'Trường Đại học Bách Khoa (HCMUT)',
    className: `K24-${user.studentId.slice(-4) || 'CNTT'}`,
    cohort: 'K24',
    status: 'pending',
    room: 'Chưa phân bổ phòng',
    roomNumber: '',
    building: '',
    zone: `Nguyện vọng: ${zoneName}`,
    bedSlot: 'Chờ phân bổ',
    isLeader: false,
    preferredArea: user.dormArea || 'B',
    preferredRoomType: user.roomType || '4-ac',
    registrationDate: new Date().toLocaleDateString('vi-VN'),
    contract: {
      id: `DK-2024-${user.studentId.slice(-4) || '2401'}`,
      daysLeft: 0,
      expiryDate: 'Đang thẩm định hồ sơ',
      renewalStartDate: '—',
      status: 'pending'
    },
    roommates: [],
    roomSpecs: {
      airConditioner: 'Theo tiêu chuẩn phòng đăng ký',
      waterHeater: 'Theo tiêu chuẩn phòng đăng ký',
      electricMeter: 'Chưa kích hoạt',
      waterMeter: 'Chưa kích hoạt'
    }
  };
};

export const createApprovedStudentInfo = (info: StudentInfo): StudentInfo => {
  const zoneName = info.preferredArea ? `Khu ${info.preferredArea}` : 'Khu B';
  const buildingName = info.preferredArea ? `${info.preferredArea}2` : 'B2';
  const roomNum = '302';

  return {
    ...info,
    status: 'active',
    room: `P.${roomNum} - Nhà ${buildingName} (${zoneName})`,
    roomNumber: roomNum,
    building: buildingName,
    zone: `${zoneName} (Sinh viên K24)`,
    bedSlot: 'G1',
    isLeader: false,
    contract: {
      id: `HD-2024-${info.studentId.slice(-4) || '3021'}`,
      daysLeft: 120,
      expiryDate: '31/07/2025',
      renewalStartDate: '01/07/2025',
      status: 'active'
    },
    roommates: createAssignedRoommates(info.fullName, info.faculty, info.phone),
    roomSpecs: {
      airConditioner: '12.000 BTU Inverter',
      waterHeater: 'Ariston 30L',
      electricMeter: '180 kWh (IoT)',
      waterMeter: '14 m³ (IoT)'
    }
  };
};
