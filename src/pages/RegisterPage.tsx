import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { api } from '../core/api';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { registerStudent, lang, setLang, showToast } = useStore();

  // Form states - clean and empty by default for normal user registration
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [university, setUniversity] = useState('Trường Đại học Bách Khoa (HCMUT)');
  const [dormArea, setDormArea] = useState<'A' | 'B' | 'C'>('B');
  const [roomType, setRoomType] = useState('4-ac');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Status states
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Password strength calculation
  const getPasswordStrength = () => {
    if (!password) return { level: 0, text: 'Chưa nhập', color: 'bg-surface-variant' };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { level: 1, text: 'Yếu', color: 'bg-red-500' };
    if (score <= 3) return { level: 2, text: 'Trung bình', color: 'bg-amber-500' };
    if (score <= 4) return { level: 3, text: 'Mạnh', color: 'bg-blue-500' };
    return { level: 4, text: 'Rất mạnh', color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength();

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanName = fullName.trim();
    const cleanStudentId = studentId.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    // 1. Validation
    if (!cleanName) {
      setErrorMsg('Vui lòng nhập Họ và tên sinh viên.');
      return;
    }

    if (!cleanStudentId) {
      setErrorMsg('Vui lòng nhập Mã số sinh viên (MSSV).');
      return;
    }

    if (cleanStudentId.length < 4) {
      setErrorMsg('Mã số sinh viên không hợp lệ (tối thiểu 4 ký tự).');
      return;
    }

    if (!cleanEmail) {
      setErrorMsg('Vui lòng nhập địa chỉ Email.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMsg('Địa chỉ Email không đúng định dạng (ví dụ: nam.nh@student.edu.vn).');
      return;
    }

    if (!cleanPhone) {
      setErrorMsg('Vui lòng nhập số điện thoại di động.');
      return;
    }

    const phoneRegex = /^[0-9]{9,11}$/;
    if (!phoneRegex.test(cleanPhone.replace(/[\s.-]/g, ''))) {
      setErrorMsg('Số điện thoại không hợp lệ (cần từ 9 đến 11 chữ số).');
      return;
    }

    if (!password) {
      setErrorMsg('Vui lòng thiết lập mật khẩu đăng nhập.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Mật khẩu phải có độ dài tối thiểu từ 6 ký tự.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Mật khẩu và xác nhận mật khẩu chưa trùng khớp.');
      return;
    }

    if (!agreeTerms) {
      setErrorMsg('Vui lòng tích chọn đồng ý với Nội quy và Quy chế Ký túc xá.');
      return;
    }

    setSubmitting(true);

    try {
      const userData = {
        fullName: cleanName,
        studentId: cleanStudentId,
        email: cleanEmail,
        phone: cleanPhone,
        university,
        dormArea,
        roomType,
        password,
        createdAt: new Date().toISOString()
      };

      // Call API to record audit log in backend (if server is up)
      await api.registerUser(userData);

      // Register student in zustand store and browser localStorage
      registerStudent(userData);

      setSubmitting(false);
      setSubmittedSuccess(true);
      showToast('Đăng ký tài khoản thành công! Đang chuyển hướng vào cổng sinh viên...');

      setTimeout(() => {
        navigate('/student/overview');
      }, 900);
    } catch {
      setSubmitting(false);
      setErrorMsg('Có lỗi xảy ra khi tạo tài khoản. Vui lòng thử lại!');
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans text-on-surface relative flex flex-col justify-between selection:bg-primary-fixed selection:text-primary">
      {/* Background ambient orbs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-[18%] -left-[10%] w-[55vw] h-[55vw] rounded-full bg-surface-container opacity-70 blur-3xl" />
        <div className="absolute top-[35%] -right-[15%] w-[50vw] h-[50vw] rounded-full bg-surface-variant opacity-50 blur-3xl" />
        <div className="absolute -bottom-[20%] left-[20%] w-[45vw] h-[45vw] rounded-full bg-surface-container-high opacity-60 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(#1d4ed8_0.6px,transparent_0.6px)] [background-size:24px_24px] opacity-[0.035]" />
      </div>

      {/* Header */}
      <header className="relative z-20 w-full bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-outline-variant/30">
        <div className="h-16 max-w-7xl mx-auto px-4 md:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/login" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-on-primary shadow-sm group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[22px]">apartment</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-bold text-primary tracking-tight">SmartDorm</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-primary-fixed text-primary text-[10px] font-bold">
                    VNU
                  </span>
                </div>
                <span className="text-[11px] text-on-surface-variant hidden sm:inline">
                  Đại học Quốc gia
                </span>
              </div>
            </Link>

            <div className="hidden md:block w-px h-6 bg-surface-container-highest" />

            <div className="hidden md:flex items-center gap-1 text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px] text-secondary">account_balance</span>
              <span className="text-xs font-semibold">Cổng Quản lý Ký túc xá Số</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a
              className="hidden sm:flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors text-xs"
              href="tel:02437547890"
            >
              <span className="material-symbols-outlined text-[18px] text-primary">support_agent</span>
              <div className="flex flex-col text-left">
                <span className="text-[10px] text-outline">Hotline hỗ trợ</span>
                <span className="font-mono text-xs text-on-surface font-semibold">024 3754 7890</span>
              </div>
            </a>

            {/* Language Switcher */}
            <div className="flex items-center bg-surface-container-low rounded-lg p-0.5 border border-outline-variant/30">
              <button
                onClick={() => setLang('VIE')}
                className={`px-2.5 py-1 rounded-md text-xs transition-all flex items-center gap-1 ${
                  lang === 'VIE'
                    ? 'bg-surface-container-lowest text-primary font-bold shadow-xs'
                    : 'text-on-surface-variant font-medium'
                }`}
                type="button"
              >
                <span>VIE</span>
              </button>
              <button
                onClick={() => setLang('ENG')}
                className={`px-2.5 py-1 rounded-md text-xs transition-all flex items-center gap-1 ${
                  lang === 'ENG'
                    ? 'bg-surface-container-lowest text-primary font-bold shadow-xs'
                    : 'text-on-surface-variant font-medium'
                }`}
                type="button"
              >
                <span>ENG</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 w-full flex-1 flex items-center justify-center py-6 sm:py-10 px-4 md:px-6 lg:px-8">
        <div className="flex flex-col w-full max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* LEFT COLUMN: Overview & Benefits */}
            <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl bg-surface-container-low p-6 lg:p-8 relative overflow-hidden shadow-xs border border-outline-variant/30">
              <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-primary-fixed opacity-40 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-secondary-fixed opacity-30 blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col space-y-6">
                <div className="flex items-start gap-2.5 bg-surface-container-lowest/90 backdrop-blur-xs p-3 rounded-xl shadow-xs border border-outline-variant/30">
                  <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">
                    how_to_reg
                  </span>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase text-primary font-bold tracking-wider">
                      Cổng Đăng Ký Trực Tuyến • Năm học 2024 - 2025
                    </span>
                    <p className="text-xs text-on-surface leading-tight mt-0.5">
                      Đăng ký tài khoản nhanh chóng chỉ trong 1 bước để nhận mã phòng và kích hoạt lưu trú.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed text-primary text-xs font-semibold">
                    <span className="material-symbols-outlined text-[15px]">school</span>
                    <span>Tân Sinh Viên & Sinh Viên ĐHQG</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight leading-tight">
                    Hệ Thống Đăng Ký Tài Khoản KTX Thông Minh
                  </h1>
                  <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                    Nền tảng số hóa quản lý nội trú tập trung dành cho sinh viên Đại học Quốc gia. Tiếp cận nhanh chóng các tiện ích nội trú, quản lý phòng ở và dịch vụ công nghệ số.
                  </p>
                </div>

                <div className="relative w-full h-44 rounded-xl overflow-hidden shadow-xs border border-outline-variant/30 group">
                  <div className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105 bg-slate-800 flex items-center justify-center">
                    <div className="w-full h-full bg-gradient-to-tr from-primary/80 via-primary/40 to-secondary-container/60 flex items-center justify-center p-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="material-symbols-outlined text-white text-[44px] mb-1">
                          domain
                        </span>
                        <span className="text-white font-bold text-sm tracking-wide">
                          Ký túc xá Đại học Quốc gia TP.HCM
                        </span>
                        <span className="text-white/80 text-xs">Khu Đô thị ĐHQG - Thành phố Thủ Đức</span>
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-on-surface/90 via-on-surface/30 to-transparent flex items-end p-4">
                    <div className="flex items-center justify-between w-full text-white text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="font-semibold">Khu nội trú KTX • Sẵn sàng đón tân sinh viên</span>
                      </div>
                      <span className="font-mono text-primary-fixed font-semibold">K24 Mở cổng</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2.5 pt-1">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-container-lowest/80 backdrop-blur-xs shadow-xs border border-outline-variant/20">
                    <div className="w-9 h-9 rounded-lg bg-primary-fixed flex items-center justify-center text-primary shrink-0">
                      <span className="material-symbols-outlined text-[20px]">badge</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-on-surface truncate">
                        Đăng ký nhanh chóng với MSSV
                      </span>
                      <span className="text-[11px] text-on-surface-variant truncate">
                        Tự động khởi tạo hồ sơ và đồng bộ dữ liệu đào tạo
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-container-lowest/80 backdrop-blur-xs shadow-xs border border-outline-variant/20">
                    <div className="w-9 h-9 rounded-lg bg-secondary-fixed flex items-center justify-center text-secondary shrink-0">
                      <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-on-surface truncate">
                        Giám sát điện nước IoT & VietQR
                      </span>
                      <span className="text-[11px] text-on-surface-variant truncate">
                        Theo dõi chỉ số trực tiếp và thanh toán mọi lúc mọi nơi
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-container-lowest/80 backdrop-blur-xs shadow-xs border border-outline-variant/20">
                    <div className="w-9 h-9 rounded-lg bg-tertiary-fixed flex items-center justify-center text-tertiary shrink-0">
                      <span className="material-symbols-outlined text-[20px]">lock_reset</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-on-surface truncate">
                        Bảo mật tài khoản đa lớp
                      </span>
                      <span className="text-[11px] text-on-surface-variant truncate">
                        Mã hóa chuẩn SSL/TLS và tích hợp tài khoản sinh viên
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative z-10 pt-4 mt-4 flex flex-wrap items-center justify-between gap-3 text-on-surface-variant text-xs border-t border-outline-variant/20">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-primary">security</span>
                  <span className="font-semibold">ISO/IEC 27001:2022</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-secondary">database</span>
                  <span>Đồng bộ CSDL ĐHQG</span>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Standard Registration Form */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              <div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 lg:p-10 shadow-xs border border-outline-variant/30 relative">
                {/* Form Header */}
                <div className="flex flex-col gap-2 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-xs">
                        <span className="material-symbols-outlined text-[20px]">person_add</span>
                      </div>
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-on-surface tracking-tight">
                          Đăng Ký Tài Khoản Sinh Viên
                        </h2>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 bg-surface-container-low px-2.5 py-1 rounded-full border border-outline-variant/30">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <span className="text-[11px] font-semibold text-on-surface-variant">Cổng đang mở</span>
                    </div>
                  </div>
                  <p className="text-xs text-on-surface-variant">
                    Nhập thông tin cá nhân và thiết lập mật khẩu để tạo tài khoản KTX SmartDorm
                  </p>
                </div>

                {/* Inline Error Message */}
                {errorMsg && (
                  <div className="mb-5 p-3 rounded-xl bg-error/10 border border-error/30 flex items-center gap-2.5 text-error text-xs font-semibold animate-in fade-in duration-200">
                    <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Inline Success Message */}
                {submittedSuccess && (
                  <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-emerald-700 text-xs font-bold animate-in fade-in duration-200">
                    <span className="material-symbols-outlined text-[20px] text-emerald-600 shrink-0">check_circle</span>
                    <span>Đăng ký thành công! Đang chuyển hướng vào cổng sinh viên...</span>
                  </div>
                )}

                {/* Registration Form */}
                <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
                  {/* Họ và tên */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-on-surface" htmlFor="reg-fullname">
                      Họ và tên sinh viên <span className="text-error">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3 text-[18px] text-outline pointer-events-none">
                        person
                      </span>
                      <input
                        id="reg-fullname"
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Ví dụ: Nguyễn Hoàng Nam"
                        className="w-full h-11 pl-10 pr-3 rounded-lg bg-surface-container-low text-on-surface text-xs placeholder:text-outline outline-none focus:ring-2 focus:ring-primary border border-outline-variant/30 font-medium"
                      />
                    </div>
                  </div>

                  {/* Row: MSSV & Email */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-on-surface" htmlFor="reg-studentid">
                        Mã số sinh viên (MSSV) <span className="text-error">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-3 text-[18px] text-outline pointer-events-none">
                          badge
                        </span>
                        <input
                          id="reg-studentid"
                          type="text"
                          required
                          value={studentId}
                          onChange={(e) => setStudentId(e.target.value)}
                          placeholder="Ví dụ: 24120892"
                          className="w-full h-11 pl-10 pr-3 rounded-lg bg-surface-container-low text-on-surface text-xs placeholder:text-outline outline-none focus:ring-2 focus:ring-primary border border-outline-variant/30 font-mono font-semibold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-on-surface" htmlFor="reg-email">
                        Email sinh viên / liên hệ <span className="text-error">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-3 text-[18px] text-outline pointer-events-none">
                          mail
                        </span>
                        <input
                          id="reg-email"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="nam.nh24@student.edu.vn"
                          className="w-full h-11 pl-10 pr-3 rounded-lg bg-surface-container-low text-on-surface text-xs placeholder:text-outline outline-none focus:ring-2 focus:ring-primary border border-outline-variant/30 font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row: Phone & University */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-on-surface" htmlFor="reg-phone">
                        Số điện thoại di động <span className="text-error">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-3 text-[18px] text-outline pointer-events-none">
                          phone_iphone
                        </span>
                        <input
                          id="reg-phone"
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="0912 345 678"
                          className="w-full h-11 pl-10 pr-3 rounded-lg bg-surface-container-low text-on-surface text-xs placeholder:text-outline outline-none focus:ring-2 focus:ring-primary border border-outline-variant/30 font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-on-surface" htmlFor="reg-university">
                        Trường Đại học / Khoa trực thuộc <span className="text-error">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <select
                          id="reg-university"
                          value={university}
                          onChange={(e) => setUniversity(e.target.value)}
                          className="w-full h-11 px-3.5 pr-8 rounded-lg bg-surface-container-low text-on-surface text-xs outline-none focus:ring-2 focus:ring-primary border border-outline-variant/30 appearance-none font-medium"
                        >
                          <option value="Trường Đại học Bách Khoa (HCMUT)">Trường Đại học Bách Khoa (HCMUT)</option>
                          <option value="Trường Đại học Khoa học Tự nhiên (HCMUS)">Trường Đại học Khoa học Tự nhiên (HCMUS)</option>
                          <option value="Trường Đại học Khoa học Xã hội & Nhân văn (USSH)">Trường Đại học Khoa học Xã hội & Nhân văn (USSH)</option>
                          <option value="Trường Đại học Quốc Tế (IU)">Trường Đại học Quốc Tế (IU)</option>
                          <option value="Trường Đại học Công nghệ Thông tin (UIT)">Trường Đại học Công nghệ Thông tin (UIT)</option>
                          <option value="Trường Đại học Kinh tế - Luật (UEL)">Trường Đại học Kinh tế - Luật (UEL)</option>
                          <option value="Khoa Y - ĐHQG TP.HCM">Khoa Y - ĐHQG TP.HCM</option>
                          <option value="Khác - ĐHQG TP.HCM">Trường khác / Khối ĐHQG</option>
                        </select>
                        <span className="material-symbols-outlined pointer-events-none absolute right-2.5 text-on-surface-variant text-[18px]">
                          keyboard_arrow_down
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dorm Area Preference Selection */}
                  <div className="space-y-1.5 pt-1">
                    <label className="block text-xs font-semibold text-on-surface">
                      Khu Ký túc xá đăng ký <span className="text-error">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setDormArea('A')}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          dormArea === 'A'
                            ? 'bg-primary-fixed/40 border-primary shadow-xs'
                            : 'bg-surface-container-low border-outline-variant/30 hover:bg-surface-container'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${dormArea === 'A' ? 'text-primary' : 'text-on-surface'}`}>
                            Khu A
                          </span>
                          {dormArea === 'A' && (
                            <span className="material-symbols-outlined text-primary text-[16px]">check_circle</span>
                          )}
                        </div>
                        <span className="text-[10px] text-on-surface-variant block mt-0.5 truncate">
                          Linh Trung, Thủ Đức
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDormArea('B')}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          dormArea === 'B'
                            ? 'bg-primary-fixed/40 border-primary shadow-xs'
                            : 'bg-surface-container-low border-outline-variant/30 hover:bg-surface-container'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <span className={`text-xs font-bold ${dormArea === 'B' ? 'text-primary' : 'text-on-surface'}`}>
                              Khu B
                            </span>
                            <span className="px-1 py-0.2 rounded bg-primary text-white text-[9px] font-bold">
                              Phổ biến
                            </span>
                          </div>
                          {dormArea === 'B' && (
                            <span className="material-symbols-outlined text-primary text-[16px]">check_circle</span>
                          )}
                        </div>
                        <span className="text-[10px] text-on-surface-variant block mt-0.5 truncate">
                          Tân Lập, Dĩ An
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDormArea('C')}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          dormArea === 'C'
                            ? 'bg-primary-fixed/40 border-primary shadow-xs'
                            : 'bg-surface-container-low border-outline-variant/30 hover:bg-surface-container'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${dormArea === 'C' ? 'text-primary' : 'text-on-surface'}`}>
                            Khu C
                          </span>
                          {dormArea === 'C' && (
                            <span className="material-symbols-outlined text-primary text-[16px]">check_circle</span>
                          )}
                        </div>
                        <span className="text-[10px] text-on-surface-variant block mt-0.5 truncate">
                          Sau đại học
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Row: Password & Confirm Password */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-on-surface" htmlFor="reg-password">
                        Mật khẩu đăng nhập <span className="text-error">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-3 text-[18px] text-outline pointer-events-none">
                          lock
                        </span>
                        <input
                          id="reg-password"
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Tối thiểu 6 ký tự"
                          className="w-full h-11 pl-10 pr-10 rounded-lg bg-surface-container-low text-on-surface text-xs outline-none focus:ring-2 focus:ring-primary border border-outline-variant/30"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 text-outline hover:text-on-surface"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {showPassword ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>

                      {/* Password strength meter */}
                      {password && (
                        <div className="flex items-center gap-1.5 pt-1">
                          <div className="flex-1 h-1 bg-surface-container rounded-full overflow-hidden flex gap-0.5">
                            <div className={`h-full ${strength.level >= 1 ? strength.color : 'bg-transparent'} flex-1`} />
                            <div className={`h-full ${strength.level >= 2 ? strength.color : 'bg-transparent'} flex-1`} />
                            <div className={`h-full ${strength.level >= 3 ? strength.color : 'bg-transparent'} flex-1`} />
                            <div className={`h-full ${strength.level >= 4 ? strength.color : 'bg-transparent'} flex-1`} />
                          </div>
                          <span className="text-[10px] text-on-surface-variant font-medium">
                            {strength.text}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-on-surface" htmlFor="reg-confirm-password">
                        Xác nhận lại mật khẩu <span className="text-error">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-3 text-[18px] text-outline pointer-events-none">
                          verified_user
                        </span>
                        <input
                          id="reg-confirm-password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Nhập lại mật khẩu"
                          className="w-full h-11 pl-10 pr-10 rounded-lg bg-surface-container-low text-on-surface text-xs outline-none focus:ring-2 focus:ring-primary border border-outline-variant/30"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 text-outline hover:text-on-surface"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {showConfirmPassword ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>

                      {/* Matching password notice */}
                      {confirmPassword && (
                        <div className="pt-1">
                          {password === confirmPassword ? (
                            <span className="text-[10px] text-emerald-600 flex items-center gap-1 font-semibold">
                              <span className="material-symbols-outlined text-[13px]">check_circle</span>
                              <span>Mật khẩu trùng khớp</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-error flex items-center gap-1 font-semibold">
                              <span className="material-symbols-outlined text-[13px]">cancel</span>
                              <span>Mật khẩu chưa khớp</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Terms & Conditions Checkbox */}
                  <div className="pt-2">
                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded text-primary accent-primary cursor-pointer shrink-0"
                      />
                      <span className="text-[11px] text-on-surface-variant leading-relaxed">
                        Tôi cam kết thông tin khai báo là hoàn toàn chính xác và đồng ý tuân thủ{' '}
                        <a href="#rules" className="text-primary font-semibold hover:underline">
                          Nội quy Ký túc xá ĐHQG
                        </a>{' '}
                        cùng chính sách bảo mật hệ thống SmartDorm.
                      </span>
                    </label>
                  </div>

                  {/* Submit Button & Switch to Login */}
                  <div className="pt-3 flex flex-col gap-2.5">
                    <button
                      type="submit"
                      disabled={submitting || submittedSuccess}
                      className="w-full h-11 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-60"
                    >
                      {submitting ? (
                        <>
                          <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
                          <span>Đang khởi tạo tài khoản...</span>
                        </>
                      ) : submittedSuccess ? (
                        <>
                          <span className="material-symbols-outlined text-[20px]">check</span>
                          <span>Đã đăng ký thành công!</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
                          <span>Đăng ký tài khoản ngay</span>
                        </>
                      )}
                    </button>

                    <div className="text-center pt-1">
                      <Link
                        to="/login"
                        className="text-xs text-on-surface-variant hover:text-primary transition-colors font-medium"
                      >
                        Đã có tài khoản KTX? <strong className="text-primary underline">Đăng nhập ngay</strong>
                      </Link>
                    </div>
                  </div>
                </form>

                {/* Footer Security Note */}
                <div className="mt-6 pt-4 border-t border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-2 text-on-surface-variant text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600">lock</span>
                    <span>Bảo mật TLS 1.3 & CSDL ĐHQG</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>Hỗ trợ tuyển sinh:</span>
                    <a className="font-mono font-semibold text-primary hover:underline" href="tel:02437547890">
                      024 3754 7890
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 w-full bg-surface-container-low/90 backdrop-blur-md py-4 border-t border-outline-variant/30">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-on-surface-variant">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <span>© 2024 Trung tâm Quản trị KTX - Đại học Quốc gia.</span>
            <span className="hidden md:inline">•</span>
            <span className="flex items-center gap-1 text-secondary font-medium">
              <span className="material-symbols-outlined text-[15px]">verified_user</span>
              <span>Bảo mật chuẩn ISO/IEC 27001:2022</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <a className="hover:text-primary transition-colors" href="#rules">
              Quy chế Ký túc xá
            </a>
            <span>•</span>
            <a className="hover:text-primary transition-colors" href="#privacy">
              Chính sách bảo mật
            </a>
            <span>•</span>
            <a className="hover:text-primary transition-colors" href="#vnu-id">
              Hướng dẫn sinh viên
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
