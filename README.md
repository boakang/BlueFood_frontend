
# BlueFood Frontend

Frontend React + TypeScript cho hệ thống truy xuất nguồn gốc BlueFood.

## Chức năng chính
- Dashboard tổng quan
- Tạo lô hàng, sinh QR
- Cập nhật truy xuất (trace)
- Gắn chứng chỉ
- Quản lý lô hàng
- Quản lý chứng chỉ
- Trang truy xuất công khai theo QR

## Giao diện mẫu

### Đăng nhập
![Login](img/Login.png)

### Đăng ký
![Register](img/Register_1.png)

### Dashboard
![Dashboard](img/Dashboard.png)

### Tạo lô hàng
![Tạo lô hàng](img/Taolohang.png)

### Truy xuất lô hàng
![Truy xuất](img/Truyxuat.png)

### Gắn chứng chỉ
![Gắn chứng chỉ](img/Ganchungchi.png)

### Xem danh sách chứng chỉ đã gắn
![Gắn chứng chỉ - Xem DS](img/Ganchungchi_xemds.png)

### Xác nhận lô hàng
![Xác nhận lô hàng](img/Xacnhanlohang.png)

### Quản lý lô hàng
![Quản lý lô hàng](img/Quanlylohang.png)

### Quản lý chứng chỉ
![Quản lý chứng chỉ](img/Quanlychungchi.png)

### Xem chi tiết lô hàng
![Xem chi tiết lô hàng](img/Xemchitietlohang.png)

### Thông tin lô từ quét mã QR, lưu ý máy chạy demo với điện thoại quét phải cùng chung wifi
![QR thông tin lô hàng](img/QR_thongtinlohang.png)

## Cài đặt & chạy
```bash
npm install
npm run dev
```

- Mặc định chạy tại: http://localhost:5173
- Đổi API backend: sửa file `.env`

## Build production
```bash
npm run build
npm run preview
```

## Thông tin thêm
- Hiển thị thời gian theo giờ Việt Nam (UTC+07:00)
- Đồng bộ với backend BlueFood (API: http://localhost:5085)
- Nếu chạy frontend ở domain/port khác, cần cấu hình lại CORS backend.
