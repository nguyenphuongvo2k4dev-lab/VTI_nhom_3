import React from 'react';
import { StudentInfo, StudentBill, StudentTicket } from '../../core/types';
import { useStore } from '../../store/useStore';

export const StudentProfileView: React.FC<{ info: StudentInfo }> = ({ info }) => {
  const isPending = info.status === 'pending' || !info.roomNumber;

  return (
    <div className="space-y-6">
      <div className="border-b border-surface-container-high pb-4">
        <h2 className="text-xl font-bold text-on-surface">Thông Tin Cá Nhân Sinh Viên</h2>
        <p className="text-xs text-on-surface-variant">Hồ sơ trích xuất từ Cổng dữ liệu tập trung ĐHQG TP.HCM</p>
      </div>

      <div className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/30 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3 text-xs">
          <div>
            <span className="text-outline block">Họ và tên</span>
            <span className="text-sm font-bold text-on-surface">{info.fullName}</span>
          </div>
          <div>
            <span className="text-outline block">Mã số sinh viên (MSSV)</span>
            <span className="font-mono font-semibold text-primary">{info.studentId}</span>
          </div>
          <div>
            <span className="text-outline block">Khoa / Trường thành viên</span>
            <span className="font-medium text-on-surface">{info.faculty}</span>
          </div>
          <div>
            <span className="text-outline block">Lớp niên chế</span>
            <span className="font-medium text-on-surface">{info.className} ({info.cohort})</span>
          </div>
          <div>
            <span className="text-outline block">Trạng thái hồ sơ KTX</span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
              isPending ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300' : 'bg-secondary-fixed text-on-secondary-fixed'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isPending ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              {isPending ? 'Chờ xét duyệt & xếp phòng' : 'Đang lưu trú'}
            </span>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <span className="text-outline block">Số điện thoại liên lạc</span>
            <span className="font-mono font-semibold text-on-surface">{info.phone}</span>
          </div>
          <div>
            <span className="text-outline block">Phòng ở hiện tại</span>
            <span className="font-semibold text-secondary">
              {isPending ? 'Chưa phân bổ phòng (Chờ BQL xét duyệt)' : info.room}
            </span>
          </div>
          <div>
            <span className="text-outline block">Vị trí giường</span>
            <span className="font-bold text-on-surface">
              {isPending ? 'Chờ phân bổ' : `${info.bedSlot} (${info.isLeader ? 'Trưởng phòng' : 'Thành viên'})`}
            </span>
          </div>
          <div>
            <span className="text-outline block">Mã định danh RFID KTX</span>
            <span className="font-mono text-outline">
              {isPending ? 'Chưa cấp phát (Chờ nhận phòng)' : `RFID_VNU_${info.building || 'B2'}_${info.roomNumber || '302'}_${info.bedSlot || 'G1'}`}
            </span>
          </div>
          <div>
            <span className="text-outline block">Nguyện vọng khu ký túc xá</span>
            <span className="font-medium text-on-surface">{info.zone}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const StudentRoomTransferView: React.FC = () => {
  const { studentInfo, approveStudentRoom } = useStore();
  const isPending = studentInfo.status === 'pending' || !studentInfo.roomNumber;

  if (isPending) {
    return (
      <div className="space-y-6">
        <div className="border-b border-surface-container-high pb-4">
          <h2 className="text-xl font-bold text-on-surface">Đăng Ký & Chuyển Phòng KTX</h2>
          <p className="text-xs text-on-surface-variant">Đơn đăng ký nguyện vọng đổi phòng KTX</p>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/30 shadow-xs text-center flex flex-col items-center justify-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-[32px]">swap_horiz</span>
          </div>
          <div className="max-w-md space-y-1.5">
            <h3 className="text-base font-bold text-on-surface">Bạn hiện chưa được phân bổ phòng chính thức</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Hồ sơ của bạn đang chờ Ban Quản lý xếp phòng đợt 1 theo <strong>{studentInfo.zone}</strong>. Tính năng đổi phòng sẽ tự động mở sau khi bạn đã được phân bổ phòng ở.
            </p>
          </div>
          <button
            onClick={approveStudentRoom}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary hover:bg-primary-container text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">domain_verification</span>
            <span>⚡ Mô phỏng BQL duyệt & xếp phòng ngay</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-surface-container-high pb-4">
        <h2 className="text-xl font-bold text-on-surface">Đăng Ký & Chuyển Phòng KTX</h2>
        <p className="text-xs text-on-surface-variant">Đơn đăng ký nguyện vọng đổi phòng cho học kỳ kế tiếp</p>
      </div>

      <div className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/30 shadow-xs space-y-4">
        <div className="p-4 rounded-xl bg-secondary-fixed/40 border border-secondary/30 flex items-start gap-3">
          <span className="material-symbols-outlined text-secondary text-[24px]">info</span>
          <div>
            <h4 className="text-xs font-bold text-on-secondary-fixed">Hồ sơ #DK-24098 đang được xét duyệt</h4>
            <p className="text-xs text-on-secondary-fixed/90 mt-0.5">
              Nguyện vọng: <strong>Chuyển sang B402 (Phòng 2 người/Đơn CLC)</strong>. Dự kiến hoàn tất ngày 28/10/2024 bởi Cán bộ Nguyễn Thu Trang.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high">
            <span className="text-outline block mb-1 font-semibold uppercase">Phòng hiện tại</span>
            <div className="text-base font-bold text-on-surface">P.{studentInfo.roomNumber} - Nhà {studentInfo.building}</div>
            <span className="text-on-surface-variant">Phòng 4 SV • 650,000 đ/tháng</span>
          </div>

          <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high">
            <span className="text-outline block mb-1 font-semibold uppercase">Phòng nguyện vọng</span>
            <div className="text-base font-bold text-primary">P.{studentInfo.roomNumber} - Nhà B4 (CLC)</div>
            <span className="text-on-surface-variant">Phòng 2 SV • 1,200,000 đ/tháng</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const StudentContractView: React.FC<{ info: StudentInfo }> = ({ info }) => {
  const isPending = info.status === 'pending' || !info.roomNumber;

  return (
    <div className="space-y-6">
      <div className="border-b border-surface-container-high pb-4">
        <h2 className="text-xl font-bold text-on-surface">Hợp Đồng Lưu Trú Ký Túc Xá</h2>
        <p className="text-xs text-on-surface-variant">Hợp đồng điện tử xác thực số ĐHQG TP.HCM</p>
      </div>

      <div className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/30 shadow-xs space-y-4 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-surface-container-high gap-2">
          <div>
            <span className="font-mono text-xs font-bold text-primary">#{info.contract.id}</span>
            <h3 className="text-sm font-bold text-on-surface">Hợp đồng nội trú KTX năm học 2024 - 2025</h3>
          </div>
          <span className={`px-3 py-1 rounded-full font-bold text-xs self-start sm:self-auto ${
            isPending ? 'bg-amber-500/20 text-amber-800 dark:text-amber-200' : 'bg-secondary-fixed text-on-secondary-fixed'
          }`}>
            {isPending ? 'Chờ ký duyệt (Đang thẩm định hồ sơ)' : `Đang có hiệu lực (Còn ${info.contract.daysLeft} ngày)`}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2">
          <div>
            <span className="text-outline block">Ngày bắt đầu</span>
            <span className="font-semibold text-on-surface">{isPending ? 'Theo đợt nhận phòng' : '01/01/2024'}</span>
          </div>
          <div>
            <span className="text-outline block">Ngày kết thúc</span>
            <span className="font-semibold text-on-surface">{info.contract.expiryDate}</span>
          </div>
          <div>
            <span className="text-outline block">Mở gia hạn</span>
            <span className="font-semibold text-primary">{info.contract.renewalStartDate}</span>
          </div>
          <div>
            <span className="text-outline block">Giá phòng cam kết</span>
            <span className="font-semibold text-on-surface">650,000 đ/tháng</span>
          </div>
        </div>

        <div className="p-3.5 bg-surface-container-low rounded-lg text-on-surface-variant leading-relaxed">
          {isPending
            ? 'Hồ sơ đăng ký của bạn đang được Phòng Công tác Sinh viên & Trung tâm Quản lý KTX thẩm định. Hợp đồng chính thức sẽ được kích hoạt ngay khi ban quản lý hoàn tất xếp phòng.'
            : 'Sinh viên cam kết tuân thủ quy chế nội trú của Trung tâm Quản lý KTX Đại học Quốc gia, không sang nhượng chỗ ở, giữ gìn tài sản chung và thanh toán đầy đủ chi phí định kỳ trước ngày 25 hàng tháng.'}
        </div>
      </div>
    </div>
  );
};

export const StudentBillsView: React.FC<{
  bills: StudentBill[];
  onOpenPayBill: () => void;
}> = ({ bills, onOpenPayBill }) => {
  const pendingBill = bills.find(b => b.status === 'pending');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-surface-container-high gap-3">
        <div>
          <h2 className="text-xl font-bold text-on-surface">Hóa Đơn & Thanh Toán Phí KTX</h2>
          <p className="text-xs text-on-surface-variant">Lịch sử thu phí phòng, điện nước và dịch vụ nội trú</p>
        </div>
        {pendingBill && (
          <button
            onClick={onOpenPayBill}
            className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-container shadow-sm transition-all"
          >
            Thanh toán kỳ này ({pendingBill.amount.toLocaleString('vi-VN')} đ)
          </button>
        )}
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-xs overflow-hidden">
        {bills.length === 0 ? (
          <div className="py-12 text-center text-xs text-on-surface-variant p-6">
            <span className="material-symbols-outlined text-[36px] text-outline mb-2 block">receipt_long</span>
            <p className="font-semibold text-sm text-on-surface">Chưa có hóa đơn nào phát sinh</p>
            <p className="text-xs text-on-surface-variant mt-1">
              Bạn chưa có khoản thu tiền phòng hoặc tiền điện nước nào cần thanh toán.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4 font-semibold">Kỳ hóa đơn</th>
                  <th className="py-3 px-4 font-semibold">Khoản thu</th>
                  <th className="py-3 px-4 font-semibold">Số tiền</th>
                  <th className="py-3 px-4 font-semibold">Hạn thanh toán</th>
                  <th className="py-3 px-4 font-semibold">Trạng thái</th>
                  <th className="py-3 px-4 text-right font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-high/40">
                {bills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-surface-container-low/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-on-surface whitespace-nowrap">{bill.month}</td>
                    <td className="py-3.5 px-4 text-on-surface-variant">{bill.period}</td>
                    <td className={`py-3.5 px-4 font-bold font-mono ${bill.status === 'pending' ? 'text-error' : 'text-on-surface'}`}>
                      {bill.amount.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="py-3.5 px-4 text-on-surface-variant">{bill.dueDate}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        bill.status === 'pending' ? 'bg-error-container text-on-error-container' : 'bg-secondary-fixed text-on-secondary-fixed'
                      }`}>
                        {bill.statusText}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {bill.status === 'pending' ? (
                        <button
                          onClick={onOpenPayBill}
                          className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold shadow-xs hover:bg-primary-container"
                        >
                          VNPay / MoMo
                        </button>
                      ) : (
                        <button
                          onClick={() => alert(`Xem biên lai thu tiền #${bill.id}`)}
                          className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface text-xs hover:bg-surface-container-high font-medium"
                        >
                          Xem biên lai
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
  );
};

export const StudentFaultsView: React.FC<{
  tickets: StudentTicket[];
  onOpenReportFault: () => void;
}> = ({ tickets, onOpenReportFault }) => {
  const { studentInfo } = useStore();
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-surface-container-high gap-3">
        <div>
          <h2 className="text-xl font-bold text-on-surface">Báo Hỏng & Phản Ánh Sự Cố Kỹ Thuật</h2>
          <p className="text-xs text-on-surface-variant">
            {studentInfo.roomNumber
              ? `Theo dõi tiến độ khắc phục điện, nước, điều hòa phòng ${studentInfo.roomNumber}`
              : 'Gửi và theo dõi các phản ánh sự cố cơ sở vật chất KTX'}
          </p>
        </div>
        <button
          onClick={onOpenReportFault}
          className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-container shadow-sm transition-all"
        >
          + Tạo yêu cầu báo hỏng mới
        </button>
      </div>

      {tickets.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl p-10 border border-outline-variant/30 text-center">
          <span className="material-symbols-outlined text-[36px] text-outline mb-2 block">task_alt</span>
          <p className="font-semibold text-sm text-on-surface">Chưa có phản ánh sự cố nào</p>
          <p className="text-xs text-on-surface-variant mt-1">
            Nếu phòng hoặc thiết bị có trục trặc kỹ thuật, bạn có thể bấm nút &quot;Tạo yêu cầu báo hỏng mới&quot; ở trên.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <div key={t.id} className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-primary font-bold">#{t.id}</span>
                  <span className="font-bold text-on-surface">{t.title}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    t.status === 'completed' ? 'bg-secondary-fixed text-on-secondary-fixed' : 'bg-primary-fixed text-primary'
                  }`}>
                    {t.statusText}
                  </span>
                </div>
                <div className="text-on-surface-variant">
                  Khu vực: <strong>{t.category}</strong> • Tiếp nhận bởi: <strong>{t.ktvName}</strong>
                </div>
                {t.ktvNote && (
                  <div className="text-primary text-[11px] mt-1">Ghi chú KTV: &quot;{t.ktvNote}&quot;</div>
                )}
              </div>
              <button
                onClick={() => alert(`Chi tiết sự cố #${t.id}: ${t.title}`)}
                className="px-3 py-1.5 rounded-lg bg-surface-container-low text-on-surface text-xs font-semibold hover:bg-surface-container self-start sm:self-auto"
              >
                Chi tiết
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const StudentNotificationsView: React.FC = () => (
  <div className="space-y-6">
    <div className="border-b border-surface-container-high pb-4">
      <h2 className="text-xl font-bold text-on-surface">Thông Báo Từ Ban Quản Lý KTX</h2>
      <p className="text-xs text-on-surface-variant">Các văn bản, thông báo bảo dưỡng và quy định nội trú mới nhất</p>
    </div>

    <div className="space-y-3 text-xs">
      <div className="p-4 rounded-xl bg-error-container/30 border border-error/30">
        <span className="font-bold text-error uppercase text-[10px]">Khẩn cấp • 23/10/2024</span>
        <h3 className="text-sm font-bold text-on-surface mt-1">Lịch bảo dưỡng & súc rửa téc nước</h3>
        <p className="text-on-surface-variant mt-1 leading-relaxed">
          Tạm ngừng cấp nước sinh hoạt từ 08:00 - 12:00 Thứ 7 (26/10) để bảo dưỡng hệ thống bơm tăng áp tòa nhà. Sinh viên vui lòng tích trữ nước sạch.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs">
        <span className="font-bold text-primary text-[10px]">Đăng ký vé xe • 20/10/2024</span>
        <h3 className="text-sm font-bold text-on-surface mt-1">Đăng ký vé tháng xe đạp điện/xe máy HK1</h3>
        <p className="text-on-surface-variant mt-1 leading-relaxed">
          Sinh viên mang giấy tờ xe và thẻ sinh viên đến bàn làm việc Tầng 1 - Nhà A trước ngày 30/10 để cấp chíp RFID.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs">
        <span className="font-bold text-outline text-[10px]">Quy chế • 18/10/2024</span>
        <h3 className="text-sm font-bold text-on-surface mt-1">Nhắc nhở giữ trật tự chung sau 23:00</h3>
        <p className="text-on-surface-variant mt-1 leading-relaxed">
          Tắt bớt thiết bị chiếu sáng, không gây tiếng ồn lớn sau 23:00 nhằm bảo đảm không gian học tập và nghỉ ngơi cho các phòng liền kề.
        </p>
      </div>
    </div>
  </div>
);

export const StudentHistoryView: React.FC<{ tickets: StudentTicket[] }> = ({ tickets }) => {
  const { studentInfo } = useStore();
  const isPending = studentInfo.status === 'pending' || !studentInfo.roomNumber;

  return (
    <div className="space-y-6">
      <div className="border-b border-surface-container-high pb-4">
        <h2 className="text-xl font-bold text-on-surface">Lịch Sử Yêu Cầu & Đơn Điện Tử</h2>
        <p className="text-xs text-on-surface-variant">Toàn bộ hồ sơ báo hỏng, đơn chuyển phòng và đăng ký lưu trú</p>
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-xs overflow-hidden text-xs">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-container-low text-on-surface-variant text-[11px] uppercase tracking-wider">
              <th className="py-3 px-4 font-semibold">Mã yêu cầu</th>
              <th className="py-3 px-4 font-semibold">Loại dịch vụ</th>
              <th className="py-3 px-4 font-semibold">Nội dung</th>
              <th className="py-3 px-4 font-semibold">Trạng thái</th>
              <th className="py-3 px-4 text-right font-semibold">Ngày gửi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-high/40">
            {isPending ? (
              <tr className="hover:bg-surface-container-low/40">
                <td className="py-3 px-4 font-mono font-bold text-primary">#{studentInfo.contract?.id || 'DK-2024-SV'}</td>
                <td className="py-3 px-4">Đăng ký lưu trú KTX</td>
                <td className="py-3 px-4">Nguyện vọng xếp phòng: {studentInfo.zone}</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-200 text-[10px] font-bold">
                    Đang thẩm định
                  </span>
                </td>
                <td className="py-3 px-4 text-right text-outline">{studentInfo.registrationDate || 'Hôm nay'}</td>
              </tr>
            ) : (
              <tr className="hover:bg-surface-container-low/40">
                <td className="py-3 px-4 font-mono font-bold text-primary">#DK-24098</td>
                <td className="py-3 px-4">Đơn chuyển phòng</td>
                <td className="py-3 px-4">Chuyển sang B402 (Phòng 2 người/Đơn CLC)</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold">
                    Chờ duyệt
                  </span>
                </td>
                <td className="py-3 px-4 text-right text-outline">22/10/2024</td>
              </tr>
            )}
            {tickets.map(t => (
              <tr key={t.id} className="hover:bg-surface-container-low/40">
                <td className="py-3 px-4 font-mono font-bold text-primary">#{t.id}</td>
                <td className="py-3 px-4">Báo hỏng kỹ thuật</td>
                <td className="py-3 px-4">{t.title}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    t.status === 'completed' ? 'bg-secondary-fixed text-on-secondary-fixed' : 'bg-primary-fixed text-primary'
                  }`}>
                    {t.statusText}
                  </span>
                </td>
                <td className="py-3 px-4 text-right text-outline">{t.timeSent}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
