import React, { useState } from 'react';
import { StudentInfo, StudentBill, StudentTicket } from '../../core/types';

export const StudentProfileView: React.FC<{
  info: StudentInfo;
  onSave: (profile: Pick<StudentInfo, 'fullName' | 'phone'> & { email: string }) => Promise<void>;
}> = ({ info, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(info.fullName);
  const [email, setEmail] = useState(info.email || '');
  const [phone, setPhone] = useState(info.phone);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    setFullName(info.fullName);
    setEmail(info.email || '');
    setPhone(info.phone);
  }, [info.fullName, info.email, info.phone]);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave({ fullName, email, phone });
      setEditing(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Không thể lưu hồ sơ.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-container-high pb-4">
        <div>
          <h2 className="text-xl font-bold text-on-surface">Thông Tin Cá Nhân Sinh Viên</h2>
          <p className="text-xs text-on-surface-variant">Cập nhật họ tên, email và số điện thoại liên hệ.</p>
        </div>
        {!editing && (
          <button onClick={() => setEditing(true)} className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white">
            Chỉnh sửa hồ sơ
          </button>
        )}
      </div>

      <form onSubmit={saveProfile} className="space-y-6 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-xs">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <label className="block text-xs">
              <span className="mb-1 block text-outline">Họ và tên</span>
              {editing ? (
                <input required minLength={2} maxLength={100} value={fullName} onChange={(event) => setFullName(event.target.value)} className="w-full rounded-lg border border-outline-variant/40 bg-surface-container-low px-3 py-2 text-sm" />
              ) : <span className="text-sm font-bold text-on-surface">{info.fullName}</span>}
            </label>
            <div className="text-xs">
              <span className="block text-outline">Mã số sinh viên (không thể chỉnh sửa)</span>
              <span className="font-mono font-semibold text-primary">{info.studentId}</span>
            </div>
            <div className="text-xs">
              <span className="block text-outline">Khoa / Trường thành viên</span>
              <span className="font-medium text-on-surface">{info.faculty}</span>
            </div>
            <div className="text-xs">
              <span className="block text-outline">Lớp niên chế</span>
              <span className="font-medium text-on-surface">{info.className} ({info.cohort})</span>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-xs">
              <span className="mb-1 block text-outline">Email</span>
              {editing ? (
                <input required type="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-lg border border-outline-variant/40 bg-surface-container-low px-3 py-2 text-sm" />
              ) : <span className="font-medium text-on-surface">{info.email || 'Chưa cập nhật'}</span>}
            </label>
            <label className="block text-xs">
              <span className="mb-1 block text-outline">Số điện thoại liên lạc</span>
              {editing ? (
                <input required type="tel" maxLength={20} minLength={10} value={phone} onChange={(event) => setPhone(event.target.value)} className="w-full rounded-lg border border-outline-variant/40 bg-surface-container-low px-3 py-2 text-sm" />
              ) : <span className="font-mono font-semibold text-on-surface">{info.phone}</span>}
            </label>
            <div className="text-xs">
              <span className="block text-outline">Phòng ở hiện tại</span>
              <span className="font-semibold text-secondary">{info.room}</span>
            </div>
            <div className="text-xs">
              <span className="block text-outline">Vị trí giường</span>
              <span className="font-bold text-on-surface">{info.bedSlot} ({info.isLeader ? 'Trưởng phòng' : 'Thành viên'})</span>
            </div>
          </div>
        </div>

        {error && <p role="alert" className="text-sm text-error">{error}</p>}
        {editing && (
          <div className="flex justify-end gap-2 border-t border-surface-container-high pt-4">
            <button type="button" onClick={() => { setEditing(false); setError(''); setFullName(info.fullName); setEmail(info.email || ''); setPhone(info.phone); }} className="rounded-lg bg-surface-container px-4 py-2 text-xs font-semibold">
              Hủy
            </button>
            <button disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

type StudentRoomRequest = {
  id: string;
  type: 'transfer' | 'renewal';
  detail: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
};

export const StudentRoomTransferView: React.FC<{
  requests: StudentRoomRequest[];
  onRequestCreated: (type: 'transfer' | 'renewal', detail: string) => Promise<void>;
}> = ({ requests, onRequestCreated }) => {
  const [type, setType] = useState<'transfer' | 'renewal'>('transfer');
  const [detail, setDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submitRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await onRequestCreated(type, detail);
      setDetail('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể gửi yêu cầu.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-surface-container-high pb-4">
        <h2 className="text-xl font-bold text-on-surface">Đăng Ký & Chuyển Phòng KTX</h2>
        <p className="text-xs text-on-surface-variant">Yêu cầu sẽ được lưu và chuyển đến Ban Quản lý.</p>
      </div>

      <form onSubmit={submitRequest} className="space-y-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6">
        <label className="block text-xs font-semibold">
          Loại yêu cầu
          <select value={type} onChange={(event) => setType(event.target.value as 'transfer' | 'renewal')} className="mt-1 block w-full rounded-lg border border-outline-variant/40 bg-surface-container-low px-3 py-2">
            <option value="transfer">Chuyển phòng</option>
            <option value="renewal">Gia hạn hợp đồng</option>
          </select>
        </label>
        <label className="block text-xs font-semibold">
          Nội dung
          <textarea value={detail} onChange={(event) => setDetail(event.target.value)} minLength={5} maxLength={1000} required rows={3} className="mt-1 block w-full rounded-lg border border-outline-variant/40 bg-surface-container-low p-3" placeholder={type === 'transfer' ? 'Ghi rõ khu/phòng mong muốn và lý do chuyển.' : 'Ghi rõ thời gian và lý do gia hạn.'} />
        </label>
        {error && <p role="alert" className="text-sm text-error">{error}</p>}
        <button disabled={submitting} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
        </button>
      </form>

      <section className="space-y-3">
        <h3 className="text-lg font-bold">Yêu cầu đã gửi</h3>
        {requests.length === 0 && <p className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 text-sm text-on-surface-variant">Bạn chưa gửi yêu cầu nào.</p>}
        {requests.map((request) => (
          <article key={request.id} className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4">
            <div className="flex flex-wrap justify-between gap-2">
              <strong>#{request.id} · {request.type === 'transfer' ? 'Chuyển phòng' : 'Gia hạn'}</strong>
              <span className="text-xs">{request.status === 'pending' ? 'Chờ duyệt' : request.status === 'approved' ? 'Đã duyệt' : 'Từ chối'}</span>
            </div>
            <p className="mt-2 text-sm text-on-surface-variant">{request.detail}</p>
            <time className="mt-2 block text-xs text-outline">{new Date(request.createdAt).toLocaleString('vi-VN')}</time>
          </article>
        ))}
      </section>
    </div>
  );
};

export const StudentContractView: React.FC<{ info: StudentInfo }> = ({ info }) => (
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
        <span className="px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-bold text-xs self-start sm:self-auto">
          Đang có hiệu lực (Còn {info.contract.daysLeft} ngày)
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2">
        <div>
          <span className="text-outline block">Ngày bắt đầu</span>
          <span className="font-semibold text-on-surface">01/01/2024</span>
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
        Sinh viên cam kết tuân thủ quy chế nội trú của Trung tâm Quản lý KTX Đại học Quốc gia, không sang nhượng chỗ ở, giữ gìn tài sản chung và thanh toán đầy đủ chi phí định kỳ trước ngày 25 hàng tháng.
      </div>
    </div>
  </div>
);

export const StudentBillsView: React.FC<{
  bills: StudentBill[];
  onOpenPayBill: (bill: StudentBill) => void;
}> = ({ bills, onOpenPayBill }) => {
  const pendingBills = bills.filter((bill) => bill.status === 'pending');
  const currentBill = pendingBills[0];

  return (
  <div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-surface-container-high gap-3">
      <div>
        <h2 className="text-xl font-bold text-on-surface">Hóa Đơn & Thanh Toán Phí KTX</h2>
        <p className="text-xs text-on-surface-variant">Lịch sử thu phí phòng, điện nước và dịch vụ nội trú</p>
      </div>
      <button
        onClick={() => currentBill && onOpenPayBill(currentBill)}
        disabled={!currentBill}
        className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-container shadow-sm transition-all"
      >
        {currentBill ? `Thanh toán ${currentBill.month} (${currentBill.amount.toLocaleString('vi-VN')} đ)` : 'Không có hóa đơn chờ thanh toán'}
      </button>
    </div>

    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-xs overflow-hidden">
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
                      onClick={() => onOpenPayBill(bill)}
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
    </div>
  </div>
  );
};

export const StudentFaultsView: React.FC<{
  tickets: StudentTicket[];
  onOpenReportFault: () => void;
}> = ({ tickets, onOpenReportFault }) => (
  <div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-surface-container-high gap-3">
      <div>
        <h2 className="text-xl font-bold text-on-surface">Báo Hỏng & Phản Ánh Sự Cố Kỹ Thuật</h2>
        <p className="text-xs text-on-surface-variant">Theo dõi tiến độ khắc phục điện, nước, điều hòa phòng 402</p>
      </div>
      <button
        onClick={onOpenReportFault}
        className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-container shadow-sm transition-all"
      >
        + Tạo yêu cầu báo hỏng mới
      </button>
    </div>

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
  </div>
);

export const StudentNotificationsView: React.FC = () => (
  <div className="space-y-6">
    <div className="border-b border-surface-container-high pb-4">
      <h2 className="text-xl font-bold text-on-surface">Thông Báo Từ Ban Quản Lý KTX</h2>
      <p className="text-xs text-on-surface-variant">Các văn bản, thông báo bảo dưỡng và quy định nội trú mới nhất</p>
    </div>

    <div className="space-y-3 text-xs">
      <div className="p-4 rounded-xl bg-error-container/30 border border-error/30">
        <span className="font-bold text-error uppercase text-[10px]">Khẩn cấp • 23/10/2024</span>
        <h3 className="text-sm font-bold text-on-surface mt-1">Lịch bảo dưỡng & súc rửa téc nước Tòa B2</h3>
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

export const StudentHistoryView: React.FC<{
  tickets: StudentTicket[];
  requests: StudentRoomRequest[];
}> = ({ tickets, requests }) => (
  <div className="space-y-6">
    <div className="border-b border-surface-container-high pb-4">
      <h2 className="text-xl font-bold text-on-surface">Lịch Sử Yêu Cầu & Đơn Điện Tử</h2>
      <p className="text-xs text-on-surface-variant">Toàn bộ hồ sơ báo hỏng, đơn chuyển phòng và đăng ký tạm vắng</p>
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
          {requests.map((request) => (
            <tr key={request.id} className="hover:bg-surface-container-low/40">
              <td className="py-3 px-4 font-mono font-bold text-primary">#{request.id}</td>
              <td className="py-3 px-4">{request.type === 'transfer' ? 'Đơn chuyển phòng' : 'Đơn gia hạn'}</td>
              <td className="py-3 px-4">{request.detail}</td>
              <td className="py-3 px-4">{request.status === 'pending' ? 'Chờ duyệt' : request.status === 'approved' ? 'Đã duyệt' : 'Từ chối'}</td>
              <td className="py-3 px-4 text-right text-outline">{new Date(request.createdAt).toLocaleDateString('vi-VN')}</td>
            </tr>
          ))}
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
