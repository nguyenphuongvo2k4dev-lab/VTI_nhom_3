import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../core/api';
import { useStore } from '../../store/useStore';

const OperationsHeader: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => {
  const navigate = useNavigate();
  const userName = useStore((state) => state.userName);
  const logout = useStore((state) => state.logout);

  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">{title}</h1>
        <p className="mt-1 text-sm text-on-surface-variant">{subtitle}</p>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <span>{userName}</span>
        <button onClick={() => { logout(); navigate('/login'); }} className="rounded-lg border border-outline-variant/40 px-3 py-2 font-semibold">Đăng xuất</button>
      </div>
    </header>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const tone = /approved|completed|còn chỗ|đã xử lý/i.test(status)
    ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/10'
    : /rejected|bảo trì/i.test(status)
      ? 'bg-rose-50 text-rose-700 ring-rose-600/10'
      : /pending|in_progress|chờ|đang/i.test(status)
        ? 'bg-amber-50 text-amber-700 ring-amber-600/10'
        : 'bg-slate-100 text-slate-600 ring-slate-500/10';
  const label = ({
    pending: 'Chờ duyệt',
    approved: 'Đã duyệt',
    rejected: 'Từ chối',
    completed: 'Hoàn thành',
    in_progress: 'Đang xử lý',
    available: 'Còn chỗ',
    occupied: 'Đang sử dụng',
    maintenance: 'Bảo trì'
  } as Record<string, string>)[status] || status;

  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${tone}`}>{label}</span>;
};

const EmptyState: React.FC<{ icon: string; title: string; detail: string }> = ({ icon, title, detail }) => (
  <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
    <span className="material-symbols-outlined text-4xl text-slate-300">{icon}</span>
    <h3 className="mt-3 font-semibold text-slate-700">{title}</h3>
    <p className="mt-1 text-sm text-slate-500">{detail}</p>
  </div>
);

const MetricCard: React.FC<{ label: string; value: number; detail: string; icon: string; color: 'indigo' | 'blue' | 'amber' | 'rose' }> = ({ label, value, detail, icon, color }) => {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600'
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">{value.toLocaleString('vi-VN')}</p></div>
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${colors[color]} material-symbols-outlined`}>{icon}</span>
      </div>
      <p className="mt-3 text-xs text-slate-400">{detail}</p>
    </div>
  );
};

const QuickAction: React.FC<{ icon: string; label: string; count: number; onClick: () => void }> = ({ icon, label, count, onClick }) => (
  <button onClick={onClick} className="flex w-full items-center gap-3 rounded-xl border border-slate-100 p-3 text-left transition hover:border-indigo-100 hover:bg-indigo-50/60">
    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 material-symbols-outlined">{icon}</span>
    <span className="flex-1 text-sm font-semibold text-slate-700">{label}</span>
    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">{count}</span>
    <span className="material-symbols-outlined text-lg text-slate-400">chevron_right</span>
  </button>
);

const SectionHeading: React.FC<{ title: string; action: string; onClick: () => void }> = ({ title, action, onClick }) => (
  <div className="flex items-center justify-between gap-3">
    <h2 className="text-lg font-bold">{title}</h2>
    <button onClick={onClick} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">{action}</button>
  </div>
);

export const ManagerOperations: React.FC = () => {
  const {
    managedRooms,
    managedStudents,
    roomRequests,
    managedTickets,
    technicians,
    loadAllData,
    showToast
  } = useStore();
  const navigate = useNavigate();
  const managerName = useStore((state) => state.userName);
  const logout = useStore((state) => state.logout);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'overview' | 'requests' | 'tickets' | 'rooms' | 'students'>('overview');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const pendingRequests = roomRequests.filter((request) => request.status === 'pending');
  const openTickets = managedTickets.filter((ticket) => ticket.status !== 'completed');
  const occupiedSlots = managedRooms.reduce((total, room) => total + room.occupied, 0);
  const totalSlots = managedRooms.reduce((total, room) => total + room.capacity, 0);
  const occupancyRate = totalSlots ? Math.round((occupiedSlots / totalSlots) * 100) : 0;
  const filteredRequests = roomRequests.filter((request) =>
    `${request.studentName} ${request.studentId} ${request.detail}`.toLowerCase().includes(search.toLowerCase())
  );
  const filteredTickets = managedTickets.filter((ticket) =>
    `${ticket.title} ${ticket.id} ${ticket.studentId || ''} ${ticket.category}`.toLowerCase().includes(search.toLowerCase())
  );
  const filteredRooms = managedRooms.filter((room) =>
    `${room.building}-${room.roomNumber} ${room.zone} ${room.status}`.toLowerCase().includes(search.toLowerCase())
  );
  const filteredStudents = managedStudents.filter((student) =>
    `${student.studentId || ''} ${student.fullName || ''} ${student.faculty || ''} ${student.room || ''}`
      .toLowerCase().includes(search.toLowerCase())
  );
  const sections = [
    { id: 'overview', label: 'Tổng quan', icon: 'space_dashboard', count: null },
    { id: 'requests', label: 'Yêu cầu phòng', icon: 'swap_horiz', count: pendingRequests.length },
    { id: 'tickets', label: 'Phiếu sửa chữa', icon: 'handyman', count: openTickets.length },
    { id: 'rooms', label: 'Quản lý phòng', icon: 'meeting_room', count: managedRooms.length },
    { id: 'students', label: 'Sinh viên', icon: 'groups', count: managedStudents.length }
  ] as const;
  const sectionTitle = sections.find((section) => section.id === activeSection)?.label || 'Tổng quan';

  const reviewRequest = async (id: string, status: 'approved' | 'rejected') => {
    setBusyId(id);
    try {
      await api.reviewRoomRequest(id, status, reviewNotes[id]);
      await loadAllData();
      showToast(status === 'approved' ? 'Đã duyệt yêu cầu.' : 'Đã từ chối yêu cầu.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không thể cập nhật yêu cầu.');
    } finally {
      setBusyId(null);
    }
  };

  const assignTicket = async (id: string) => {
    const technicianId = assignments[id];
    if (!technicianId) {
      showToast('Vui lòng chọn kỹ thuật viên.');
      return;
    }
    setBusyId(id);
    try {
      await api.assignManagerTicket(id, technicianId);
      await loadAllData();
      showToast('Đã phân công phiếu cho kỹ thuật viên.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không thể phân công phiếu.');
    } finally {
      setBusyId(null);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await loadAllData();
    } finally {
      setRefreshing(false);
    }
  };

  const renderRequests = (requests: typeof roomRequests) => (
    <div className="space-y-3">
      {requests.length === 0 && <EmptyState icon="inbox" title="Không có yêu cầu" detail="Các yêu cầu mới của sinh viên sẽ xuất hiện tại đây." />}
      {requests.map((request) => (
        <article key={request.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-3">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${request.type === 'transfer' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                <span className="material-symbols-outlined">{request.type === 'transfer' ? 'swap_horiz' : 'event_repeat'}</span>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-slate-900">{request.studentName}</h3>
                  <span className="font-mono text-xs text-slate-500">{request.studentId}</span>
                </div>
                <p className="mt-1 text-sm font-medium text-slate-700">{request.type === 'transfer' ? 'Yêu cầu chuyển phòng' : 'Yêu cầu gia hạn hợp đồng'}</p>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">{request.detail}</p>
                <p className="mt-2 text-xs text-slate-400">{new Date(request.createdAt).toLocaleString('vi-VN')}</p>
              </div>
            </div>
            <StatusBadge status={request.status} />
          </div>
          {request.status === 'pending' && (
            <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row">
              <input
                value={reviewNotes[request.id] || ''}
                onChange={(event) => setReviewNotes((current) => ({ ...current, [request.id]: event.target.value }))}
                placeholder="Ghi chú xét duyệt (không bắt buộc)"
                className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:bg-white"
              />
              <button disabled={busyId === request.id} onClick={() => void reviewRequest(request.id, 'approved')} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50">Duyệt yêu cầu</button>
              <button disabled={busyId === request.id} onClick={() => void reviewRequest(request.id, 'rejected')} className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50">Từ chối</button>
            </div>
          )}
          {request.reviewNote && <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">Ghi chú xử lý: {request.reviewNote}</p>}
        </article>
      ))}
    </div>
  );

  const renderTickets = (tickets: typeof managedTickets) => (
    <div className="space-y-3">
      {tickets.length === 0 && <EmptyState icon="task_alt" title="Không có phiếu sửa chữa" detail="Phiếu báo hỏng từ sinh viên sẽ được hiển thị tại đây." />}
      {tickets.map((ticket) => (
        <article key={ticket.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-3">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${ticket.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                <span className="material-symbols-outlined">build</span>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-slate-900">{ticket.title}</h3>
                  <StatusBadge status={ticket.status} />
                </div>
                <p className="mt-1 text-sm text-slate-500">#{ticket.id} · MSSV {ticket.studentId || '—'} · {ticket.category}</p>
                <p className="mt-1 text-xs text-slate-400">{ticket.ktvName || 'Chưa phân công'}{ticket.ktvNote ? ` · ${ticket.ktvNote}` : ''}</p>
              </div>
            </div>
            {ticket.status !== 'completed' && (
              <div className="flex flex-col gap-2 sm:flex-row">
                <select
                  aria-label={`Chọn kỹ thuật viên cho ${ticket.id}`}
                  value={assignments[ticket.id] || ticket.assignedTo || ''}
                  onChange={(event) => setAssignments((current) => ({ ...current, [ticket.id]: event.target.value }))}
                  className="min-w-52 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
                >
                  <option value="">Chọn kỹ thuật viên</option>
                  {technicians.map((technician) => <option key={technician.id} value={technician.id}>{technician.fullName}</option>)}
                </select>
                <button disabled={busyId === ticket.id || technicians.length === 0} onClick={() => void assignTicket(ticket.id)} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50">Phân công</button>
              </div>
            )}
          </div>
        </article>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f4f6fb] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
              <span className="material-symbols-outlined">apartment</span>
            </div>
            <div>
              <p className="font-bold tracking-tight">SmartDorm</p>
              <p className="text-[11px] text-slate-500">Cổng quản lý ký túc xá</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="hidden text-sm text-slate-500 sm:inline">Xin chào, <strong className="text-slate-800">{managerName}</strong></span>
            <button onClick={() => void refreshData()} disabled={refreshing} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">
              <span className={`material-symbols-outlined text-lg ${refreshing ? 'animate-spin' : ''}`}>refresh</span>
              <span className="hidden sm:inline">Làm mới</span>
            </button>
            <button onClick={() => { logout(); navigate('/login'); }} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700">
              <span className="material-symbols-outlined text-lg">logout</span>
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1600px] gap-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24 space-y-6">
            <div>
              <p className="px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Điều hành</p>
              <nav className="mt-3 space-y-1">
                {sections.map((section) => {
                  const active = activeSection === section.id;
                  return (
                    <button key={section.id} onClick={() => { setActiveSection(section.id); setSearch(''); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${active ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-slate-600 hover:bg-white hover:text-slate-900'}`}>
                      <span className="material-symbols-outlined text-xl">{section.icon}</span>
                      <span className="flex-1">{section.label}</span>
                      {section.count !== null && <span className={`rounded-full px-2 py-0.5 text-xs ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>{section.count}</span>}
                    </button>
                  );
                })}
              </nav>
            </div>
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
              <div className="flex items-center gap-2 text-indigo-700">
                <span className="material-symbols-outlined">support_agent</span>
                <span className="text-sm font-bold">Hỗ trợ vận hành</span>
              </div>
              <p className="mt-2 text-xs leading-5 text-indigo-700/80">Theo dõi yêu cầu và phối hợp xử lý trực tiếp trên hệ thống.</p>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 space-y-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-sm font-semibold text-indigo-600">TRUNG TÂM QUẢN LÝ KÝ TÚC XÁ</p>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{activeSection === 'overview' ? 'Bảng điều khiển' : sectionTitle}</h1>
              <p className="mt-1 text-sm text-slate-500">{activeSection === 'overview' ? 'Tình hình vận hành và các công việc cần xử lý.' : `Tra cứu và quản lý ${sectionTitle.toLowerCase()} từ dữ liệu hệ thống.`}</p>
            </div>
            {activeSection !== 'overview' && (
              <label className="relative block w-full xl:max-w-sm">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400">search</span>
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Tìm trong ${sectionTitle.toLowerCase()}...`} className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100" />
              </label>
            )}
          </div>

          <nav className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {sections.map((section) => (
              <button key={section.id} onClick={() => { setActiveSection(section.id); setSearch(''); }} className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold ${activeSection === section.id ? 'bg-indigo-600 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>
                <span className="material-symbols-outlined text-lg">{section.icon}</span>
                {section.label}
                {section.count !== null && <span className="rounded-full bg-black/10 px-1.5 text-xs">{section.count}</span>}
              </button>
            ))}
          </nav>

          {activeSection === 'overview' && (
            <>
              <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
                <MetricCard label="Tổng số phòng" value={managedRooms.length} detail={`${totalSlots} chỗ lưu trú`} icon="meeting_room" color="indigo" />
                <MetricCard label="Sinh viên nội trú" value={managedStudents.length} detail="Hồ sơ trong hệ thống" icon="groups" color="blue" />
                <MetricCard label="Chờ xét duyệt" value={pendingRequests.length} detail="Yêu cầu phòng cần xử lý" icon="pending_actions" color="amber" />
                <MetricCard label="Phiếu đang mở" value={openTickets.length} detail="Phiếu sửa chữa chưa hoàn tất" icon="handyman" color="rose" />
              </section>

              <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold">Tình hình chỗ ở</h2>
                      <p className="mt-1 text-sm text-slate-500">Tổng hợp theo danh sách phòng hiện có</p>
                    </div>
                    <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-bold text-indigo-700">{occupancyRate}% lấp đầy</span>
                  </div>
                  <div className="mt-6 flex items-end justify-between">
                    <div><p className="text-3xl font-extrabold">{occupiedSlots}<span className="ml-1 text-base font-medium text-slate-400">/ {totalSlots}</span></p><p className="mt-1 text-sm text-slate-500">chỗ đang sử dụng</p></div>
                    <p className="text-right text-sm text-slate-500">{managedRooms.filter((room) => room.occupied < room.capacity).length} phòng còn chỗ</p>
                  </div>
                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all" style={{ width: `${occupancyRate}%` }} /></div>
                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {Array.from(new Set(managedRooms.map((room) => room.zone))).map((zone) => {
                      const roomsInZone = managedRooms.filter((room) => room.zone === zone);
                      const filled = roomsInZone.reduce((total, room) => total + room.occupied, 0);
                      const capacity = roomsInZone.reduce((total, room) => total + room.capacity, 0);
                      return <div key={zone} className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-semibold text-slate-500">{zone}</p><p className="mt-1 font-bold">{filled}<span className="font-normal text-slate-400"> / {capacity}</span></p></div>;
                    })}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex items-center justify-between">
                    <div><h2 className="text-lg font-bold">Lối tắt công việc</h2><p className="mt-1 text-sm text-slate-500">Mở nhanh các danh sách cần xử lý</p></div>
                    <span className="material-symbols-outlined text-indigo-500">bolt</span>
                  </div>
                  <div className="mt-4 space-y-2">
                    <QuickAction icon="swap_horiz" label="Xét duyệt yêu cầu phòng" count={pendingRequests.length} onClick={() => setActiveSection('requests')} />
                    <QuickAction icon="handyman" label="Phân công sửa chữa" count={openTickets.length} onClick={() => setActiveSection('tickets')} />
                    <QuickAction icon="groups" label="Tra cứu sinh viên" count={managedStudents.length} onClick={() => setActiveSection('students')} />
                  </div>
                </div>
              </section>

              <section className="grid gap-6 xl:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <SectionHeading title="Yêu cầu mới nhất" action="Xem tất cả" onClick={() => setActiveSection('requests')} />
                  <div className="mt-4">{renderRequests(pendingRequests.slice(0, 3))}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <SectionHeading title="Phiếu cần phân công" action="Xem tất cả" onClick={() => setActiveSection('tickets')} />
                  <div className="mt-4">{renderTickets(openTickets.slice(0, 3))}</div>
                </div>
              </section>
            </>
          )}

          {activeSection === 'requests' && (
            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm text-slate-500">Đang hiển thị <strong className="text-slate-900">{filteredRequests.length}</strong> / {roomRequests.length} yêu cầu</p>
                <div className="flex gap-2 text-xs"><StatusBadge status={`${pendingRequests.length} chờ xử lý`} /><StatusBadge status={`${roomRequests.length - pendingRequests.length} đã xử lý`} /></div>
              </div>
              {renderRequests(filteredRequests)}
            </section>
          )}

          {activeSection === 'tickets' && (
            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm text-slate-500">Đang hiển thị <strong className="text-slate-900">{filteredTickets.length}</strong> / {managedTickets.length} phiếu</p>
                <div className="flex gap-2 text-xs"><StatusBadge status={`${openTickets.length} đang mở`} /><StatusBadge status={`${managedTickets.length - openTickets.length} hoàn tất`} /></div>
              </div>
              {renderTickets(filteredTickets)}
            </section>
          )}

          {activeSection === 'rooms' && (
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 p-5">
                <div><h2 className="font-bold">Danh sách phòng</h2><p className="mt-1 text-sm text-slate-500">{filteredRooms.length} phòng phù hợp</p></div>
                <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600">{managedRooms.length} phòng</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-semibold">Phòng</th><th className="px-5 py-3 font-semibold">Khu</th><th className="px-5 py-3 font-semibold">Loại phòng</th><th className="px-5 py-3 font-semibold">Sức chứa</th><th className="px-5 py-3 font-semibold">Trạng thái</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRooms.map((room) => <tr key={room.id} className="transition hover:bg-slate-50"><td className="px-5 py-4 font-bold">{room.building}-{room.roomNumber}</td><td className="px-5 py-4 text-slate-600">{room.zone}</td><td className="px-5 py-4 text-slate-600">{room.roomType}</td><td className="px-5 py-4"><span className="font-semibold">{room.occupied}</span><span className="text-slate-400"> / {room.capacity}</span><div className="mt-1 h-1.5 w-24 rounded-full bg-slate-100"><div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${room.capacity ? Math.min(100, room.occupied / room.capacity * 100) : 0}%` }} /></div></td><td className="px-5 py-4"><StatusBadge status={room.status === 'available' ? 'Còn chỗ' : room.status === 'maintenance' ? 'Bảo trì' : 'Đang sử dụng'} /></td></tr>)}
                  </tbody>
                </table>
                {filteredRooms.length === 0 && <EmptyState icon="meeting_room" title="Không tìm thấy phòng" detail="Thử thay đổi từ khóa tìm kiếm." />}
              </div>
            </section>
          )}

          {activeSection === 'students' && (
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 p-5">
                <div><h2 className="font-bold">Danh sách sinh viên</h2><p className="mt-1 text-sm text-slate-500">{filteredStudents.length} hồ sơ phù hợp</p></div>
                <span className="rounded-lg bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700">{managedStudents.length} sinh viên</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-semibold">Sinh viên</th><th className="px-5 py-3 font-semibold">Khoa / Trường</th><th className="px-5 py-3 font-semibold">Phòng</th><th className="px-5 py-3 font-semibold">Khu</th><th className="px-5 py-3 font-semibold">Liên hệ</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map((student, index) => <tr key={String(student.studentId || index)} className="transition hover:bg-slate-50"><td className="px-5 py-4"><p className="font-semibold">{String(student.fullName || 'Chưa có tên')}</p><p className="mt-0.5 font-mono text-xs text-slate-400">{String(student.studentId || '—')}</p></td><td className="px-5 py-4 text-slate-600">{String(student.faculty || '—')}</td><td className="px-5 py-4 text-slate-600">{String(student.room || 'Chưa phân phòng')}</td><td className="px-5 py-4 text-slate-600">{String(student.zone || '—')}</td><td className="px-5 py-4 text-slate-600">{String(student.phone || student.email || '—')}</td></tr>)}
                  </tbody>
                </table>
                {filteredStudents.length === 0 && <EmptyState icon="person_search" title="Không tìm thấy sinh viên" detail="Thử tìm theo MSSV, họ tên hoặc phòng." />}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export const TechnicianOperations: React.FC = () => {
  const { technicianTickets, loadAllData, showToast } = useStore();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const updateTicket = async (id: string, status: 'in_progress' | 'completed') => {
    setBusyId(id);
    try {
      await api.updateTechnicianTicket(id, status, notes[id]);
      await loadAllData();
      showToast('Đã cập nhật phiếu sửa chữa.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không thể cập nhật phiếu sửa chữa.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <OperationsHeader title="Công việc kỹ thuật" subtitle="Các phiếu được phân công cho tài khoản của bạn." />
      {technicianTickets.length === 0 && <p className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-5 text-sm text-on-surface-variant">Chưa có phiếu được phân công.</p>}
      {technicianTickets.map((ticket) => (
        <article key={ticket.id} className="space-y-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="font-bold">{ticket.title}</h2>
              <p className="text-sm text-on-surface-variant">#{ticket.id} · Sinh viên {ticket.studentId || '—'} · {ticket.category}</p>
            </div>
            <span className="rounded-full bg-surface-container px-3 py-1 text-xs">{ticket.statusText}</span>
          </div>
          <p className="text-sm">{ticket.ktvNote || 'Chưa có ghi chú.'}</p>
          <div className="flex flex-wrap gap-2">
            <input
              value={notes[ticket.id] ?? ticket.ktvNote ?? ''}
              onChange={(event) => setNotes((current) => ({ ...current, [ticket.id]: event.target.value }))}
              placeholder="Ghi chú xử lý"
              className="min-w-60 flex-1 rounded-lg border border-outline-variant/40 bg-surface-container-low px-3 py-2 text-sm"
            />
            <button disabled={busyId === ticket.id} onClick={() => void updateTicket(ticket.id, 'in_progress')} className="rounded-lg bg-surface-container px-4 py-2 text-sm font-semibold disabled:opacity-50">Đang xử lý</button>
            <button disabled={busyId === ticket.id} onClick={() => void updateTicket(ticket.id, 'completed')} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Hoàn thành</button>
          </div>
        </article>
      ))}
    </div>
  );
};
