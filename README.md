# BlueFood Frontend

Frontend React + TypeScript cho hệ thống truy xuất chuỗi cung ứng BlueFood.

## 1. Tổng quan

Project sử dụng:
- Vite + React + TypeScript
- Điều hướng theo route (khong con tab trong cung 1 URL)
- Sidebar ben trai cho cac man hinh dashboard

Chuc nang hien tai:
- Dashboard tong quan (so lieu + chart)
- Workflow tao lo hang theo buoc
- Quan ly lo hang
- Quan ly chung chi
- Trang truy xuat cong khai theo QR token

## 2. Tuong thich backend

Frontend nay duoc dong bo voi backend BlueFood hien tai (cac controller):
- Batches
- Certificates
- Trace
- Partners
- Dashboard
- Management

Backend mac dinh:
- API: http://localhost:5085
- Swagger (dev): http://localhost:5085/swagger

Luu y CORS backend:
- Dang cho phep `http://localhost:5173` va `http://127.0.0.1:5173`
- Neu chay frontend o domain/port khac, can cap nhat CORS ben backend

## 3. Cau hinh frontend

Tao file `.env` tu `.env.example`:

```env
VITE_API_BASE_URL=http://localhost:5085
```

Ghi chu:
- Neu de trong `VITE_API_BASE_URL`, frontend se dung duong dan tuong doi va proxy cua Vite (`/api -> http://localhost:5085`).
- Neu backend o may khac, dat gia tri day du (vi du `http://192.168.x.x:5085`).

## 4. Cau hinh backend de QR public hoat dong dung

Trong backend, co the dat bien moi truong:

```env
BLUEFOOD_PUBLIC_BASE_URL=http://<LAN-IP>:5085/t/
```

Bien nay duoc backend dung de tao public trace URL trong QR, giup mo dung tren thiet bi khac trong cung mang.

## 5. Chay du an

```bash
npm install
npm run dev
```

Frontend dev mac dinh: `http://localhost:5173`

Build production:

```bash
npm run build
npm run preview
```

## 6. Route chinh

- `/dashboard/overview`: dashboard tong quan
- `/dashboard/workflow`: tao lo + trace + gan chung chi theo buoc
- `/dashboard/batches`: quan ly lo hang
- `/dashboard/certificates`: quan ly chung chi
- `/trace/:qrToken`: trang truy xuat cong khai

## 7. API backend frontend dang goi

- `POST /api/batches`
- `POST /api/batches/{batchCode}/events`
- `GET /api/batches/{batchCode}/trace`
- `POST /api/batches/{batchCode}/certificates`
- `GET /api/batches/{batchCode}/certificates`
- `GET /api/trace/{qrToken}`
- `POST /api/certificates`
- `GET /api/partners`
- `GET /api/dashboard/overview`
- `GET /api/management/batches`
- `GET /api/management/certificates`
- `GET /api/management/certificates/{certificateId}/batches`

## 8. Mui gio

He thong hien thi thoi gian theo Vietnam time (UTC+07:00) o frontend.

## 9. Ung dung quet QR (Flutter)

Thu muc: `bluefood_scan_app`

Muc dich:
- Quet QR bang camera dien thoai
- Tach QR token BlueFood
- Goi API: `GET /api/trace/{qrToken}`

Chay nhanh:

```bash
cd bluefood_scan_app
flutter pub get
flutter run --dart-define=API_BASE_URL=http://192.168.130.68:5085
```

Luu y: thay IP bang dia chi LAN hien tai cua may chay backend.
