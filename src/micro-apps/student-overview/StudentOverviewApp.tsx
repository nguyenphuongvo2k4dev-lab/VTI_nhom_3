import React from 'react';
import { StudentInfo, StudentBill, StudentTicket } from '../../core/types';
import { eventBus, EVENTS } from '../../core/bus';
import { useStore } from '../../store/useStore';

interface StudentOverviewAppProps {
  info: StudentInfo;
  bills: StudentBill[];
  tickets: StudentTicket[];
  onOpenReportFault: () => void;
  onOpenPayBill: () => void;
  onOpenRules: () => void;
  onOpenMeter: () => void;
  onOpenLeave: () => void;
}

export const StudentOverviewApp: React.FC<StudentOverviewAppProps> = ({
  info,
  bills,
  tickets,
  onOpenReportFault,
  onOpenPayBill,
  onOpenRules,
  onOpenMeter,
  onOpenLeave
}) => {
  const { approveStudentRoom } = useStore();
  const isPending = info.status === 'pending' || !info.roomNumber;
  const pendingBill = bills.find(b => b.status === 'pending') || bills[0];

  return (
    <div className="flex flex-col w-full space-y-6">
      {/* Top Greeting & Action Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-2">
        <div className="flex flex-col gap-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high w-fit">
            <span className={`w-2 h-2 rounded-full ${isPending ? 'bg-amber-500 animate-ping' : 'bg-primary animate-pulse'}`} />
            <span className={`text-[11px] font-semibold tracking-wide uppercase ${isPending ? 'text-amber-700 dark:text-amber-300' : 'text-primary'}`}>
              {isPending
                ? `Hồ sơ đăng ký KTX • Trạng thái: Chờ xét duyệt & Xếp phòng (${info.zone})`
                : `Cổng nội trú KTX Đại học Quốc gia • Phòng ${info.roomNumber} - Tòa ${info.building} (${info.zone})`}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
            Xin chào, {info.fullName} <span className="inline-block hover:rotate-12 transition-transform cursor-default">👋</span>
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>Học kỳ 1 Năm học 2024 - 2025</span>
            <span className="text-outline-variant">•</span>
            <span>{info.faculty}</span>
            <span className="text-outline-variant">•</span>
            <span>Lớp {info.className}</span>
            <span className="text-outline-variant">•</span>
            <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-surface-container font-semibold text-primary">
              MSSV: {info.studentId}
            </span>
          </p>
        </div>

        {/* Quick Action CTA Group */}
        <div className="flex items-center gap-3 self-start xl:self-auto shrink-0 flex-wrap">
          {isPending ? (
            <button
              onClick={approveStudentRoom}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-sm hover:shadow-md transition-all active:scale-95"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">domain_verification</span>
              <span>⚡ Mô phỏng: Ban Quản lý duyệt & xếp phòng</span>
            </button>
          ) : (
            <>
              <button
                onClick={onOpenReportFault}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high text-xs sm:text-sm font-semibold transition-all shadow-xs border border-outline-variant/30 active:scale-95"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px] text-primary">build</span>
                <span>Gửi báo hỏng thiết bị</span>
              </button>
              <button
                onClick={onOpenPayBill}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-on-primary hover:bg-primary-container text-xs sm:text-sm font-semibold shadow-sm hover:shadow-md transition-all active:scale-95"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">payments</span>
                <span>Thanh toán hóa đơn</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Pending Notice Banner */}
      {isPending && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[24px]">hourglass_top</span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-amber-900 dark:text-amber-300">
                  Hồ sơ tân sinh viên đang chờ Ban Quản lý KTX xét duyệt & phân bổ phòng
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-200 text-[10px] font-bold uppercase tracking-wide">
                  Đang thẩm định
                </span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Tài khoản của bạn đã được ghi nhận trên hệ thống SmartDorm với nguyện vọng: <strong>{info.zone}</strong> (Loại phòng: {info.preferredRoomType === '4-ac' ? 'Phòng 4 SV máy lạnh' : 'Tiêu chuẩn KTX'}). Hiện tại chưa có phòng ở, chưa có danh sách bạn cùng phòng và chưa phát sinh chi phí điện nước.
              </p>
            </div>
          </div>
          <button
            onClick={approveStudentRoom}
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-sm shrink-0 whitespace-nowrap active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">verified</span>
            <span>⚡ Phê duyệt & xếp phòng ngay</span>
          </button>
        </div>
      )}

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI Card 1: Room */}
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-xs border border-outline-variant/30 hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
                {isPending ? 'Trạng thái xếp phòng' : 'Phòng đang ở'}
              </span>
              <span className="text-xl sm:text-2xl text-on-surface font-bold">
                {isPending ? 'Chưa xếp phòng' : `P.${info.roomNumber} - Nhà ${info.building}`}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[22px]">meeting_room</span>
            </div>
          </div>
          <div className="mt-4 pt-3 flex flex-col gap-2 border-t border-surface-container-high/60">
            <div className="flex items-center justify-between text-on-surface-variant text-xs">
              <span>{isPending ? info.zone : `Sĩ số phòng: ${info.roommates.length}/4 bạn`}</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                isPending ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300' : 'bg-secondary-fixed text-on-secondary-fixed'
              }`}>
                {isPending ? 'Chờ BQL xếp' : 'Đang lưu trú'}
              </span>
            </div>
            <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
              <div className="bg-primary h-full rounded-full transition-all" style={{ width: isPending ? '15%' : '75%' }} />
            </div>
            <span className="text-[11px] text-on-surface-variant truncate">
              {isPending
                ? `Loại phòng: ${info.preferredRoomType === '4-ac' ? 'Phòng 4 SV máy lạnh' : 'Tiêu chuẩn KTX'}`
                : 'Phòng 4 giường tiêu chuẩn • Đầy đủ điều hòa'}
            </span>
          </div>
        </div>

        {/* KPI Card 2: Contract Deadline */}
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-xs border border-outline-variant/30 hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
                Hạn hợp đồng lưu trú
              </span>
              <span className="text-xl sm:text-2xl text-primary font-bold">
                {isPending ? 'Chờ ký duyệt' : `Còn ${info.contract.daysLeft} ngày`}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[22px]">event_upcoming</span>
            </div>
          </div>
          <div className="mt-4 pt-3 flex flex-col gap-1 border-t border-surface-container-high/60">
            <div className="flex items-center justify-between text-xs">
              <span className="text-on-surface-variant truncate">
                {isPending ? 'Hồ sơ: Đang thẩm định' : `Hết hạn: ${info.contract.expiryDate}`}
              </span>
              <span className="font-mono text-xs text-outline font-semibold shrink-0">{info.contract.id}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-surface-container-high text-on-surface-variant text-[11px] mt-1">
              <span className="material-symbols-outlined text-[14px] text-primary">info</span>
              <span className="truncate">
                {isPending ? 'Hợp đồng kích hoạt khi có phòng' : `Gia hạn từ: ${info.contract.renewalStartDate}`}
              </span>
            </div>
          </div>
        </div>

        {/* KPI Card 3: Pending Bill */}
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-xs border border-outline-variant/30 hover:shadow-md transition-shadow flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
                Hóa đơn KTX
              </span>
              <span className={`text-xl sm:text-2xl font-bold font-mono ${pendingBill ? 'text-error' : 'text-on-surface'}`}>
                {pendingBill ? `${pendingBill.amount.toLocaleString('vi-VN')} đ` : '0 đ'}
              </span>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              pendingBill ? 'bg-error-container text-error' : 'bg-surface-container text-on-surface-variant'
            }`}>
              <span className="material-symbols-outlined text-[22px]">
                {pendingBill ? 'pending_actions' : 'check_circle'}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 flex flex-col gap-2 border-t border-surface-container-high/60">
            <div className="flex items-center justify-between">
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                !pendingBill
                  ? 'bg-secondary-fixed text-on-secondary-fixed'
                  : pendingBill.status === 'paid'
                  ? 'bg-secondary-fixed text-on-secondary-fixed'
                  : 'bg-error-container text-on-error-container'
              }`}>
                {pendingBill ? pendingBill.statusText : 'Không có công nợ'}
              </span>
              {pendingBill && (
                <span className="text-[11px] text-error font-semibold">Hạn: {pendingBill.dueDate}</span>
              )}
            </div>
            <p className="text-xs text-on-surface-variant truncate">
              {pendingBill
                ? `Điện: ${pendingBill.electricKwh || 0} kWh • Nước: ${pendingBill.waterM3 || 0} m³`
                : 'Chưa phát sinh chi phí phòng / điện nước'}
            </p>
          </div>
        </div>

        {/* KPI Card 4: Ticket Status */}
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-xs border border-outline-variant/30 hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
                Yêu cầu & Phản ánh
              </span>
              <span className="text-xl sm:text-2xl text-on-surface font-bold">
                {tickets.length > 0 ? `${tickets.filter(t => t.status !== 'completed').length} đang xử lý` : '0 yêu cầu'}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-tertiary-fixed flex items-center justify-center text-tertiary">
              <span className="material-symbols-outlined text-[22px]">handyman</span>
            </div>
          </div>
          <div className="mt-4 pt-3 flex flex-col gap-1 border-t border-surface-container-high/60">
            {tickets.length > 0 ? (
              <>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-primary font-semibold">{tickets[0]?.id}</span>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container text-primary text-[11px] font-semibold">
                    {tickets[0]?.statusText}
                  </span>
                </div>
                <p className="text-xs text-on-surface truncate">{tickets[0]?.title}</p>
                <span className="text-[11px] text-on-surface-variant truncate">
                  KTV: {tickets[0]?.ktvName} phụ trách
                </span>
              </>
            ) : (
              <div className="text-xs text-on-surface-variant py-1">
                Không có sự cố kỹ thuật nào được ghi nhận
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid (8 cols left, 4 cols right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Room, Roommates, Tickets, Bills */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Widget 1: Room Details & Roommates */}
          <div className="bg-surface-container-lowest rounded-xl p-5 sm:p-6 shadow-xs border border-outline-variant/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-3 border-b border-surface-container-high">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary-fixed text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">group</span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-on-surface">Thông tin phòng ở & Bạn cùng phòng</h2>
                  <p className="text-xs text-on-surface-variant">
                    {isPending ? 'Chưa phân bổ phòng ở chính thức' : `Phòng ${info.roomNumber} • Tầng 4 • Tòa nhà ${info.building} (${info.zone})`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  onClick={onOpenRules}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high text-xs font-medium transition-colors border border-outline-variant/20"
                >
                  <span className="material-symbols-outlined text-[16px]">menu_book</span>
                  <span>Quy ước phòng</span>
                </button>
                <button
                  onClick={onOpenMeter}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container text-primary hover:bg-surface-container-high text-xs font-semibold transition-colors border border-outline-variant/20"
                >
                  <span className="material-symbols-outlined text-[16px]">speed</span>
                  <span>Chỉ số công tơ</span>
                </button>
              </div>
            </div>

            {isPending ? (
              <div className="py-10 px-4 rounded-xl bg-surface-container-low border border-dashed border-outline-variant/50 text-center flex flex-col items-center justify-center gap-3 my-4">
                <div className="w-12 h-12 rounded-2xl bg-surface-container-high text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[28px]">meeting_room</span>
                </div>
                <div className="flex flex-col gap-1 max-w-md">
                  <h3 className="text-sm font-bold text-on-surface">Chưa có thông tin phòng & bạn cùng phòng</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Hồ sơ đăng ký lưu trú của bạn đang được Ban Quản lý KTX thụ lý theo nguyện vọng <strong>{info.zone}</strong>. Sau khi xếp phòng hoàn tất, danh sách bạn cùng phòng và hệ thống công tơ IoT sẽ hiển thị tại đây.
                  </p>
                </div>
                <button
                  onClick={approveStudentRoom}
                  className="mt-1 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary hover:bg-primary-container text-xs font-bold transition-all shadow-sm active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px]">domain_verification</span>
                  <span>⚡ Mô phỏng Ban Quản lý xếp phòng</span>
                </button>
              </div>
            ) : (
              <>
                {/* Room Specs & IoT Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-surface-container-low my-5 border border-surface-container-high/60">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-primary text-[20px]">ac_unit</span>
                    <div className="flex flex-col">
                      <span className="text-[11px] text-on-surface-variant">Điều hòa</span>
                      <span className="text-xs font-semibold text-on-surface">{info.roomSpecs.airConditioner}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-secondary text-[20px]">water_heater</span>
                    <div className="flex flex-col">
                      <span className="text-[11px] text-on-surface-variant">Bình nóng lạnh</span>
                      <span className="text-xs font-semibold text-on-surface">{info.roomSpecs.waterHeater}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-primary text-[20px]">bolt</span>
                    <div className="flex flex-col">
                      <span className="text-[11px] text-on-surface-variant">Công tơ điện</span>
                      <span className="text-xs font-semibold text-on-surface">{info.roomSpecs.electricMeter}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-secondary text-[20px]">water_drop</span>
                    <div className="flex flex-col">
                      <span className="text-[11px] text-on-surface-variant">Đồng hồ nước</span>
                      <span className="text-xs font-semibold text-on-surface">{info.roomSpecs.waterMeter}</span>
                    </div>
                  </div>
                </div>

                {/* Bed Occupancy Grid */}
                <div className="flex flex-col gap-3">
                  <span className="text-xs font-semibold text-on-surface uppercase tracking-wider">
                    Danh sách vị trí giường ({info.roommates.length}/4 Đang ở)
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {info.roommates.map((mate) => (
                      <div
                        key={mate.id}
                        className={`p-3.5 rounded-xl flex items-start justify-between border transition-all ${
                          mate.isMe
                            ? 'bg-surface-container-high/60 border-primary/30 ring-1 ring-primary/20'
                            : 'bg-surface-container-low border-surface-container-high/60'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${
                              mate.isMe ? 'bg-primary text-white' : 'bg-surface-container text-on-surface font-semibold'
                            }`}>
                              {mate.name.split(' ').map(w => w[0]).join('').slice(-2)}
                            </div>
                            <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center font-bold text-[9px] ${
                              mate.isMe ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-high text-on-surface-variant'
                            }`}>
                              {mate.bed}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-on-surface">{mate.name}</span>
                              {mate.isMe && (
                                <span className="px-1.5 py-0.5 rounded-full bg-primary text-on-primary text-[10px] font-semibold">
                                  Bạn • Tân sinh viên
                                </span>
                              )}
                              {mate.bed === 'G4' && (
                                <span className="px-1.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[10px]">
                                  Tân sinh viên
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-on-surface-variant">{mate.faculty}</span>
                            <span className="font-mono text-[11px] text-on-surface-variant flex items-center gap-1 mt-0.5">
                              <span className="material-symbols-outlined text-[14px]">call</span>
                              {mate.phone}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 ${
                            mate.inRoom ? 'bg-primary' : 'bg-outline-variant'
                          }`}
                          title={mate.inRoom ? 'Đang trong phòng' : 'Chưa check-in hôm nay'}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Widget 2: Maintenance & Fault Reporting Timeline */}
          <div className="bg-surface-container-lowest rounded-xl p-5 sm:p-6 shadow-xs border border-outline-variant/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-3 border-b border-surface-container-high">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-surface-container text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">engineering</span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-on-surface">Tiến độ xử lý phản ánh & Báo hỏng gần đây</h2>
                  <p className="text-xs text-on-surface-variant">
                    {isPending ? 'Theo dõi các sự cố kỹ thuật sau khi nhận phòng' : `Theo dõi thời gian thực các sự cố kỹ thuật phòng ${info.roomNumber}`}
                  </p>
                </div>
              </div>
              <button
                onClick={onOpenReportFault}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container text-xs font-semibold transition-colors shadow-sm self-start sm:self-auto"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>Tạo yêu cầu báo hỏng mới</span>
              </button>
            </div>

            {/* Ticket Cards */}
            {tickets.length === 0 ? (
              <div className="py-8 text-center text-xs text-on-surface-variant bg-surface-container-low rounded-xl border border-surface-container-high/60 mt-4">
                <span className="material-symbols-outlined text-[32px] text-outline mb-1 block">check_circle</span>
                Chưa có yêu cầu báo hỏng hoặc phản ánh sự cố kỹ thuật nào được ghi nhận.
              </div>
            ) : (
              <div className="flex flex-col gap-3 mt-4">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-4 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 border border-surface-container-high/60"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        ticket.status === 'completed'
                          ? 'bg-secondary-fixed text-on-secondary-fixed'
                          : 'bg-primary-fixed text-primary'
                      }`}>
                        <span className="material-symbols-outlined text-[20px]">
                          {ticket.category.includes('nước') ? 'plumbing' : 'lightbulb'}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-primary">#{ticket.id}</span>
                          <span className="text-xs font-bold text-on-surface">{ticket.title}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            ticket.status === 'completed'
                              ? 'bg-secondary-fixed text-on-secondary-fixed'
                              : 'bg-primary-fixed text-on-primary-fixed'
                          }`}>
                            {ticket.statusText}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant">
                          Gửi: <span className="text-on-surface font-medium">{ticket.timeSent}</span> • Tiếp nhận bởi KTV: <strong className="text-on-surface">{ticket.ktvName}</strong>
                        </p>
                        {ticket.ktvNote && (
                          <div className="inline-flex items-center gap-1.5 text-primary text-[11px] mt-0.5">
                            <span className="material-symbols-outlined text-[14px]">schedule</span>
                            <span>Ghi chú KTV: &quot;{ticket.ktvNote}&quot;</span>
                          </div>
                        )}
                        {ticket.rating && (
                          <div className="flex items-center gap-1 text-on-surface-variant text-[11px] mt-0.5">
                            <span>Đánh giá của bạn:</span>
                            <div className="flex text-amber-500">
                              {[1, 2, 3, 4, 5].map((i) => (
                                <span key={i} className="material-symbols-outlined text-[15px] fill-current">star</span>
                              ))}
                            </div>
                            <span className="font-semibold text-on-surface">(Rất hài lòng)</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                      <button
                        onClick={() => alert(`Chi tiết sự cố #${ticket.id}: ${ticket.title} - Tiếp nhận: ${ticket.ktvName}`)}
                        className="px-3 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container text-xs font-semibold transition-colors shadow-xs border border-outline-variant/30"
                      >
                        {ticket.status === 'completed' ? 'Xem nghiệm thu' : 'Chi tiết'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Widget 3: Billing & Payment Periods */}
          <div className="bg-surface-container-lowest rounded-xl p-5 sm:p-6 shadow-xs border border-outline-variant/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-3 border-b border-surface-container-high">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-surface-container text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-on-surface">Lịch sử hóa đơn & Kỳ thu phí KTX</h2>
                  <p className="text-xs text-on-surface-variant">Chi tiết tiền phòng và dịch vụ điện nước theo tháng</p>
                </div>
              </div>
              <button
                onClick={() => eventBus.emit(EVENTS.SHOW_TOAST, 'Đang mở danh sách hóa đơn toàn khóa học')}
                className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1 self-start sm:self-auto"
              >
                <span>Xem tất cả hóa đơn</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>

            {/* Billing Table */}
            {bills.length === 0 ? (
              <div className="py-8 text-center text-xs text-on-surface-variant bg-surface-container-low rounded-xl border border-surface-container-high/60 mt-4">
                <span className="material-symbols-outlined text-[32px] text-outline mb-1 block">receipt</span>
                Hiện tại bạn chưa phát sinh hóa đơn tiền phòng hoặc điện nước nào.
              </div>
            ) : (
              <div className="overflow-x-auto mt-3">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-surface-container-low text-on-surface-variant text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-4 rounded-l-lg font-semibold">Kỳ hóa đơn</th>
                      <th className="py-3 px-4 font-semibold">Khoản thu</th>
                      <th className="py-3 px-4 font-semibold">Số tiền</th>
                      <th className="py-3 px-4 font-semibold">Hạn thanh toán</th>
                      <th className="py-3 px-4 font-semibold">Trạng thái</th>
                      <th className="py-3 px-4 text-right rounded-r-lg font-semibold">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-high/40">
                    {bills.map((bill) => (
                      <tr key={bill.id} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-on-surface whitespace-nowrap">{bill.month}</td>
                        <td className="py-3.5 px-4 text-on-surface-variant">{bill.period}</td>
                        <td className={`py-3.5 px-4 font-bold font-mono ${bill.status === 'pending' ? 'text-error' : 'text-on-surface'}`}>
                          {bill.amount.toLocaleString('vi-VN')} đ
                        </td>
                        <td className="py-3.5 px-4 text-on-surface-variant">{bill.dueDate}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            bill.status === 'pending'
                              ? 'bg-error-container text-on-error-container'
                              : 'bg-secondary-fixed text-on-secondary-fixed'
                          }`}>
                            {bill.statusText}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          {bill.status === 'pending' ? (
                            <button
                              onClick={onOpenPayBill}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-on-primary hover:bg-primary-container text-xs font-semibold transition-colors shadow-xs"
                            >
                              <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
                              <span>VNPay / MoMo</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => alert(`Biên lai điện tử #${bill.id}: Đã quyết toán qua cổng tài vụ ĐHQG.`)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high text-xs font-medium transition-colors"
                            >
                              <span className="material-symbols-outlined text-[16px]">description</span>
                              <span>Xem biên lai</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Announcements & Common Shortcuts */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Widget 4: Management Board Announcements */}
          <div className="bg-surface-container-lowest rounded-xl p-5 sm:p-6 shadow-xs border border-outline-variant/30">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container-high">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary">campaign</span>
                <h2 className="text-base font-bold text-on-surface">Thông báo Ban Quản lý</h2>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container text-[11px] font-semibold">
                Mới nhất
              </span>
            </div>

            <div className="flex flex-col gap-3 mt-3">
              {/* Urgent Notice */}
              <div className="p-3.5 rounded-xl bg-error-container/40 flex flex-col gap-1.5 border border-error/20">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-error text-on-error text-[10px] font-bold uppercase">
                    Khẩn cấp
                  </span>
                  <span className="text-[11px] text-on-surface-variant font-mono">23/10/2024</span>
                </div>
                <h3 className="text-xs font-bold text-on-surface">Lịch bảo dưỡng & súc rửa téc nước</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Tạm ngừng cấp nước sinh hoạt từ <strong>08:00 - 12:00 Thứ 7 (26/10)</strong> để bảo dưỡng hệ thống bơm tăng áp tòa nhà. Sinh viên vui lòng tích trữ nước sạch.
                </p>
              </div>

              {/* Normal Notice 1 */}
              <div className="p-3.5 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors flex flex-col gap-1.5 border border-surface-container-high/60">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-surface-container-high text-primary text-[10px] font-semibold">
                    Đăng ký giữ xe
                  </span>
                  <span className="text-[11px] text-on-surface-variant font-mono">20/10/2024</span>
                </div>
                <h3 className="text-xs font-bold text-on-surface">Đăng ký vé tháng xe đạp điện/xe máy HK1</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Sinh viên mang giấy tờ xe và thẻ sinh viên đến bàn làm việc Tầng 1 - Nhà A trước ngày 30/10 để cấp chíp RFID.
                </p>
              </div>

              {/* Normal Notice 2 */}
              <div className="p-3.5 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors flex flex-col gap-1.5 border border-surface-container-high/60">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant text-[10px] font-semibold">
                    Quy chế nội trú
                  </span>
                  <span className="text-[11px] text-on-surface-variant font-mono">18/10/2024</span>
                </div>
                <h3 className="text-xs font-bold text-on-surface">Nhắc nhở giữ trật tự chung sau 23:00</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Tắt bớt thiết bị chiếu sáng, không gây tiếng ồn lớn sau 23:00 nhằm bảo đảm không gian học tập và nghỉ ngơi cho các phòng liền kề.
                </p>
              </div>
            </div>

            <button
              onClick={() => alert('Đang xem toàn bộ thông báo Ban Quản lý KTX ĐHQG')}
              className="w-full mt-4 py-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Xem tất cả thông báo KTX</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>

          {/* Widget 5: Quick Student Shortcuts */}
          <div className="bg-surface-container-lowest rounded-xl p-5 sm:p-6 shadow-xs border border-outline-variant/30">
            <div className="flex items-center gap-2 pb-3 border-b border-surface-container-high">
              <span className="material-symbols-outlined text-[20px] text-primary">touch_app</span>
              <h2 className="text-base font-bold text-on-surface">Thao tác sinh viên hay dùng</h2>
            </div>

            <div className="grid grid-cols-1 gap-2.5 mt-3">
              <button
                onClick={onOpenLeave}
                className="w-full p-3 rounded-xl bg-surface-container-low hover:bg-surface-container-high/60 transition-all flex items-center justify-between text-left group border border-surface-container-high/60"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary-fixed text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[20px]">night_shelter</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-on-surface">Đăng ký tạm vắng qua đêm</span>
                    <span className="text-[11px] text-on-surface-variant">Báo cáo lịch vắng mặt sau 22h30</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-outline text-[18px] group-hover:translate-x-0.5 transition-transform">
                  chevron_right
                </span>
              </button>

              <button
                onClick={() => eventBus.emit(EVENTS.SHOW_TOAST, 'Phòng tự học Tầng 2 Nhà Sinh hoạt còn 14 chỗ trống!')}
                className="w-full p-3 rounded-xl bg-surface-container-low hover:bg-surface-container-high/60 transition-all flex items-center justify-between text-left group border border-surface-container-high/60"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[20px]">auto_stories</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-on-surface">Đăng ký mượn phòng tự học</span>
                    <span className="text-[11px] text-on-surface-variant">Phòng học nhóm Tầng 2 Nhà Sinh hoạt</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-outline text-[18px] group-hover:translate-x-0.5 transition-transform">
                  chevron_right
                </span>
              </button>

              <button
                onClick={onOpenRules}
                className="w-full p-3 rounded-xl bg-surface-container-low hover:bg-surface-container-high/60 transition-all flex items-center justify-between text-left group border border-surface-container-high/60"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[20px]">gavel</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-on-surface">Nội quy & Khung xử phạt</span>
                    <span className="text-[11px] text-on-surface-variant">Tra cứu biểu phí phạt & quy chế KTX</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-outline text-[18px] group-hover:translate-x-0.5 transition-transform">
                  chevron_right
                </span>
              </button>

              <button
                onClick={() => alert('Cảm ơn đóng góp ý kiến của bạn gửi trực tiếp Ban Giám đốc KTX ĐHQG!')}
                className="w-full p-3 rounded-xl bg-surface-container-low hover:bg-surface-container-high/60 transition-all flex items-center justify-between text-left group border border-surface-container-high/60"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-surface-container text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[20px]">contact_support</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-on-surface">Góp ý chất lượng phục vụ</span>
                    <span className="text-[11px] text-on-surface-variant">Ý kiến gửi trực tiếp Giám đốc KTX</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-outline text-[18px] group-hover:translate-x-0.5 transition-transform">
                  chevron_right
                </span>
              </button>
            </div>
          </div>

          {/* Campus Life Mini Banner */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary to-primary-container p-6 text-on-primary shadow-sm">
            <div className="relative z-10 flex flex-col gap-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-on-primary/20 backdrop-blur text-on-primary text-[11px] font-semibold w-fit">
                <span className="material-symbols-outlined text-[14px]">sports_soccer</span>
                <span>CLB Thể Thao KTX</span>
              </div>
              <h3 className="text-base font-bold text-on-primary">Giải bóng đá sinh viên KTX 2024</h3>
              <p className="text-xs text-on-primary/80 leading-relaxed">
                Khởi tranh tuần sau tại Sân cỏ nhân tạo Khu A. {info.roomNumber ? `Phòng ${info.roomNumber}` : 'Sinh viên toàn KTX'} đã đăng ký tham gia!
              </p>
              <button
                onClick={() => alert(`Lịch thi đấu bảng B: ${info.roomNumber ? `Phòng ${info.roomNumber}` : 'Đội bóng KTX'} gặp Phòng 308 lúc 16:30 Thứ Ba.`)}
                className="mt-2 px-4 py-2 rounded-lg bg-surface-container-lowest text-primary text-xs font-bold hover:bg-surface-container transition-colors w-fit"
              >
                Xem lịch thi đấu
              </button>
            </div>
            {/* Ambient Circle */}
            <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
};
