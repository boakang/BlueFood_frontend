# IS208.Q21 - Nhóm Horizon

Thành viên: Bá Khang, Duy Tài, Mậu Anh, Phương Anh, Quốc Đạt (Nhóm trưởng).
[Website giới thiệu nhóm (vào bằng mail trường)](https://sites.google.com/gm.uit.edu.vn/horizon/trang-ch%E1%BB%A7?authuser=2&pli=1)

# 1. BlueFood Frontend

Giao diện React + TypeScript cho hệ thống truy xuất chuỗi cung ứng BlueFood.

## 2. Yêu cầu

- Node.js bản LTS
- Backend đang chạy (mặc định: http://localhost:5085)
- Nếu quét QR bằng điện thoại, backend cần truy cập được trong mạng nội bộ

## Chạy dự án

2.1. Mở terminal tại thư mục này.
2.2. Cài thư viện:

   npm install

2.3. Chạy frontend:

   npm run dev

2.4. Mở URL Vite hiển thị (thường là http://localhost:5173).

## Biến môi trường

Tạo file .env (từ .env.example nếu có) và cấu hình khi cần:

- VITE_API_BASE_URL=http://localhost:5085

Nếu backend chạy ở máy khác hoặc IP LAN khác, đổi giá trị trên để frontend và trang truy xuất QR đồng bộ.

## 3. Chức năng chính

- Tạo lô hàng
- Tra cứu theo mã lô
- Tra cứu theo QR token
- Tạo và đính kèm chứng chỉ

## 4. Ứng dụng quét QR (Flutter)

Thư mục: bluefood_scan_app

Mục đích:
- Quét QR bằng camera điện thoại
- Tách QR token BlueFood
- Gọi API: GET /api/trace/{qrToken}

Chạy nhanh:
1. Cài Flutter SDK.
2. Vào thư mục bluefood_scan_app.
3. Chạy lệnh:

   flutter pub get
   flutter run --dart-define=API_BASE_URL=http://192.168.130.68:5085

Lưu ý: thay IP trên bằng địa chỉ LAN hiện tại của máy chạy backend.

## 5. Các Trang khác
[Backend](https://github.com/boakang/BlueFood_backend)

## 6. Giao diện
- Hình Trang Chủ
![Hình Trang chủ](https://github.com/boakang/BlueFood_frontend/blob/main/Screenshot%202026-04-07%20155455.png)
- Hình Thông tin lô hàng sau khi quét mã QR trên điện thoại

![Hình Thông tin lô hàng sau khi quét mã QR trên điện thoại](https://github.com/boakang/BlueFood_frontend/blob/main/Screenshot%202026-04-07%20152316.png)
