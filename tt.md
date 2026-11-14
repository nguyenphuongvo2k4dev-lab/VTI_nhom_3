# Tổng quan dự án

## Dự án là gì?

Đây là **KTX SmartDorm** — ứng dụng web quản lý ký túc xá, hướng đến số hóa việc đăng ký lưu trú và các hoạt động thường ngày giữa sinh viên, ban quản lý và bộ phận kỹ thuật.

## Các vai trò

- **Sinh viên:** đăng ký và đăng nhập, xem/cập nhật hồ sơ cá nhân, xem thông tin phòng và hợp đồng, theo dõi hóa đơn, gửi yêu cầu chuyển phòng/gia hạn và báo sự cố.
- **Quản lý:** theo dõi sinh viên và phòng, xử lý yêu cầu phòng, xem và phân công phiếu sửa chữa cho kỹ thuật viên.
- **Kỹ thuật viên:** xem phiếu được giao, cập nhật tiến độ và ghi chú xử lý.
- **Quản trị viên:** quản lý tài khoản và theo dõi các chức năng quản trị hệ thống.

## Công nghệ chính

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, React Router và Zustand.
- **Backend:** Node.js với Express và TypeScript (`tsx`).
- **Cơ sở dữ liệu:** MongoDB; dữ liệu tài khoản, hồ sơ sinh viên, phòng, hóa đơn, yêu cầu và phiếu kỹ thuật được lưu theo các collection riêng.

## Dữ liệu mẫu và chạy dự án

Script `scripts/seed.ts` tạo dữ liệu mẫu cho các vai trò và 100 sinh viên để phục vụ phát triển, demo và kiểm thử. Cấu hình MongoDB có thể đặt qua biến môi trường `MONGODB_URI`; mặc định là `mongodb://127.0.0.1:27017/ktx`.

Các lệnh thường dùng:

```bash
npm run dev
npm run seed
npm run lint
npm run build
```

Đây là dự án quản lý ký túc xá đang được phát triển; dữ liệu seed và tài khoản mẫu chỉ dùng trong môi trường phát triển/demo, không dùng làm thông tin đăng nhập production.